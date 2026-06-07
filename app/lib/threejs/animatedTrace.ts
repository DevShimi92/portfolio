import * as THREE from 'three';
import { TraceSegment } from '@/app/types/traceSegment';
import { AnimatedTrace } from '@/app/types/animatedTrace';
import { TraceAnimationConfig } from '@/app/types/traceAnimationConfig';
import { createGlowFrontMat, createGlowBackMat, createGlowFilamentMat } from './materialsGlow';

// ─────────────────────────────────────────────────────────
//  CONSTANTES GÉOMÉTRIE — identiques à buildBoard.ts
//
//  On les redéclare localement plutôt que de les importer
//  depuis buildBoard.ts car ses fonctions sont internes
//  (non exportées). Si le projet grossit, extraire dans
//  un fichier geometryConstants.ts partagé.
// ─────────────────────────────────────────────────────────
const BOARD_HEIGHT    = 0.1;
const SURFACE_Y       = BOARD_HEIGHT / 2;   // niveau Y du dessus du board
const GRID_UNIT       = 1.9;                // espacement world-space entre cases de grille
const TRACE_WIDTH     = 0.22;              // largeur d'une trace (RT dans buildBoard)

const toWorldX = (gridCoord: number) => gridCoord * GRID_UNIT;
const toWorldZ = (gridCoord: number) => gridCoord * GRID_UNIT;

// Hauteur Y du centre du filament — légèrement au-dessus du board
const FILAMENT_Y = SURFACE_Y + TRACE_WIDTH * 0.5;


// ═══════════════════════════════════════════════════════════════
//  HELPERS GÉOMÉTRIE — construction des meshes de tube
//
//  Copie locale des helpers de buildBoard.ts (non exportés).
//  Voir le commentaire sur CONSTANTES GÉOMÉTRIE ci-dessus.
// ═══════════════════════════════════════════════════════════════

function applyTransformToGeometry(geometry: THREE.BufferGeometry, posX: number, posY: number, posZ: number, rotationY: number): THREE.BufferGeometry {
  const transformMatrix = new THREE.Matrix4();
  transformMatrix.compose(
    new THREE.Vector3(posX, posY, posZ),
    new THREE.Quaternion().setFromEuler(new THREE.Euler(0, rotationY, 0)),
    new THREE.Vector3(1, 1, 1)
  );
  const cloned = geometry.clone();
  cloned.applyMatrix4(transformMatrix);
  return cloned;
}

function mergeGeometries(geometries: THREE.BufferGeometry[]): THREE.BufferGeometry {
  const nonIndexed = geometries.map(geo => {
    const ni = geo.toNonIndexed();
    // Sanitize — remplace les NaN par 0 pour éviter les artefacts GPU
    const positions = ni.attributes.position.array as Float32Array;
    for (let i = 0; i < positions.length; i++) {
      if (isNaN(positions[i])) positions[i] = 0;
    }
    return ni;
  });

  let totalVertexCount = 0;
  nonIndexed.forEach(geo => totalVertexCount += geo.attributes.position.count);

  const mergedPositions = new Float32Array(totalVertexCount * 3);
  const mergedNormals   = new Float32Array(totalVertexCount * 3);
  let   vertexOffset    = 0;

  nonIndexed.forEach(geo => {
    mergedPositions.set(geo.attributes.position.array, vertexOffset * 3);
    if (geo.attributes.normal) {
      mergedNormals.set(geo.attributes.normal.array, vertexOffset * 3);
    }
    vertexOffset += geo.attributes.position.count;
  });

  const merged = new THREE.BufferGeometry();
  merged.setAttribute('position', new THREE.BufferAttribute(mergedPositions, 3));
  merged.setAttribute('normal',   new THREE.BufferAttribute(mergedNormals,   3));
  merged.computeVertexNormals();
  return merged;
}

// Tube ouvert aux extrémités — 4 faces latérales uniquement
function buildOpenTubeGeometry(halfWidth: number, halfHeight: number, length: number) {
  if (length < 0.001 || halfWidth < 0.0001 || halfHeight < 0.0001) return null;
  const halfLength = length / 2;
  const positions = new Float32Array([
    -halfWidth, -halfHeight, -halfLength,
     halfWidth, -halfHeight, -halfLength,
     halfWidth,  halfHeight, -halfLength,
    -halfWidth,  halfHeight, -halfLength,
    -halfWidth, -halfHeight,  halfLength,
     halfWidth, -halfHeight,  halfLength,
     halfWidth,  halfHeight,  halfLength,
    -halfWidth,  halfHeight,  halfLength,
  ]);
  const indices = new Uint16Array([
    0, 1, 5,  0, 5, 4,  // face bas
    1, 2, 6,  1, 6, 5,  // face droite
    2, 3, 7,  2, 7, 6,  // face haut
    3, 0, 4,  3, 4, 7,  // face gauche
  ]);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setIndex(new THREE.BufferAttribute(indices, 1));
  geo.computeVertexNormals();
  return geo;
}

// Jonction — uniquement les faces haut et bas (bouche l'intersection entre tubes)
function buildJunctionCapGeometry(halfSize: number, height: number) {
  if (halfSize < 0.0001 || height < 0.0001) return null;
  const halfH = height / 2;
  const positions = new Float32Array([
    // Face bas
    -halfSize, -halfH, -halfSize,
     halfSize, -halfH, -halfSize,
     halfSize, -halfH,  halfSize,
    -halfSize, -halfH,  halfSize,
    // Face haut
    -halfSize,  halfH,  halfSize,
     halfSize,  halfH,  halfSize,
     halfSize,  halfH, -halfSize,
    -halfSize,  halfH, -halfSize,
  ]);
  const normals = new Float32Array([
    0, -1, 0,  0, -1, 0,  0, -1, 0,  0, -1, 0,  // bas
    0,  1, 0,  0,  1, 0,  0,  1, 0,  0,  1, 0,  // haut
  ]);
  const indices = new Uint16Array([
    0, 1, 2,  0, 2, 3,  // bas
    4, 5, 6,  4, 6, 7,  // haut
  ]);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('normal',   new THREE.BufferAttribute(normals,   3));
  geo.setIndex(new THREE.BufferAttribute(indices, 1));
  return geo;
}


// ═══════════════════════════════════════════════════════════════
//  INIT — construit la géométrie, crée les matériaux,
//          ajoute les meshes à la scène
// ═══════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────────────────
//  initAnimatedTrace
//
//  Paramètres :
//    waypointsInGrid  — liste de [colonne, ligne] en coordonnées
//                       de grille (comme dans buildBoard.ts)
//    initialGlowColor — couleur glow initiale (modifiable après
//                       via animatedTrace.glowMaterials.*.uniforms.uGlowColor)
//    startupDelay     — délai en secondes avant le premier départ
//                       (0 = démarre immédiatement)
//    parentObject     — scène ou groupe Three.js auquel on rattache
//                       les 3 meshes (scene ou root dans index.ts)
//
//  Retourne un AnimatedTrace prêt à être passé à updateAnimatedTrace().
// ─────────────────────────────────────────────────────────
export function initAnimatedTrace(waypointsInGrid: [number, number][], initialGlowColor: THREE.Color, startupDelay: number, parentObject: THREE.Object3D): AnimatedTrace {

  // ── Calcul des segments world-space ──────────────────────────
  // Fait simultanément deux choses :
  //   1. Prépare les données pour les uniforms du shader
  //      (projection polyligne dans le fragment shader)
  //   2. Calcule totalLength pour normaliser la progression 0→1
  const traceSegments: TraceSegment[] = [];
  let   cumulativeDistance = 0;

  for (let waypointIndex = 0; waypointIndex < waypointsInGrid.length - 1; waypointIndex++) {
    const currentWaypoint = waypointsInGrid[waypointIndex];
    const nextWaypoint    = waypointsInGrid[waypointIndex + 1];

    const segmentStart = new THREE.Vector3(
      toWorldX(currentWaypoint[0]),
      FILAMENT_Y,
      toWorldZ(currentWaypoint[1])
    );
    const segmentEnd = new THREE.Vector3(
      toWorldX(nextWaypoint[0]),
      FILAMENT_Y,
      toWorldZ(nextWaypoint[1])
    );
    const segmentLength = segmentStart.distanceTo(segmentEnd);

    traceSegments.push({
      segmentStart,
      segmentEnd,
      segmentLength,
      cumulativeStart: cumulativeDistance,
    });

    cumulativeDistance += segmentLength;
  }

  const totalLength = cumulativeDistance;

  // ── Construction des géométries ──────────────────────────────
  // 3 groupes de géos correspondant aux 3 couches du tube :
  //   backSurfaceGeos  — intérieur du verre (BackSide, légèrement plus petit)
  //   filamentCoreGeos — cœur lumineux central (très fin)
  //   frontSurfaceGeos — surface externe (FrontSide, taille nominale)
  const backSurfaceGeos:  THREE.BufferGeometry[] = [];
  const filamentCoreGeos: THREE.BufferGeometry[] = [];
  const frontSurfaceGeos: THREE.BufferGeometry[] = [];

  function addTubeSegment(
    startX: number, startZ: number,
    endX:   number, endZ:   number,
    width:  number
  ) {
    const deltaX   = endX - startX;
    const deltaZ   = endZ - startZ;
    const length   = Math.sqrt(deltaX * deltaX + deltaZ * deltaZ);
    if (length < 0.01) return;

    const rotationY = Math.atan2(deltaX, deltaZ);
    const centerX   = (startX + endX) / 2;
    const centerZ   = (startZ + endZ) / 2;
    const height    = width;
    const centerY   = SURFACE_Y + height / 2;

    const addToGroup = (
      group:     THREE.BufferGeometry[],
      halfWidth: number,
      halfHeight: number
    ) => {
      const geo = buildOpenTubeGeometry(halfWidth, halfHeight, length);
      if (geo) group.push(applyTransformToGeometry(geo, centerX, centerY, centerZ, rotationY));
    };

    addToGroup(backSurfaceGeos,  width * 0.94 / 2, height * 0.94 / 2);
    addToGroup(filamentCoreGeos, width * 0.26 / 2, height * 0.26 / 2);
    addToGroup(frontSurfaceGeos, width / 2,         height / 2);
  }

  function addJunctionAt(junctionX: number, junctionZ: number, width: number) {
    const height   = width;
    const centerY  = SURFACE_Y + height / 2;
    // sqrt(2) * 0.52 pour couvrir la diagonale à 45° sans déborder
    const halfSize = (width / 2) * Math.SQRT2 * 0.52;

    const addToGroup = (
      group:     THREE.BufferGeometry[],
      halfSizeScaled: number,
      halfHeightScaled: number
    ) => {
      const geo = buildJunctionCapGeometry(halfSizeScaled, halfHeightScaled);
      if (geo) group.push(applyTransformToGeometry(geo, junctionX, centerY, junctionZ, 0));
    };

    addToGroup(backSurfaceGeos,  halfSize * 0.94, height * 0.94);
    addToGroup(filamentCoreGeos, halfSize * 0.26, height * 0.26);
    addToGroup(frontSurfaceGeos, halfSize,        height);
  }

  // Construction segment par segment
  for (let i = 0; i < waypointsInGrid.length - 1; i++) {
    const current = waypointsInGrid[i];
    const next    = waypointsInGrid[i + 1];

    addTubeSegment(
      toWorldX(current[0]), toWorldZ(current[1]),
      toWorldX(next[0]),    toWorldZ(next[1]),
      TRACE_WIDTH
    );
    // Jonction au waypoint de départ du segment
    addJunctionAt(toWorldX(current[0]), toWorldZ(current[1]), TRACE_WIDTH);
  }
  // Jonction terminale au dernier waypoint
  const lastWaypoint = waypointsInGrid[waypointsInGrid.length - 1];
  addJunctionAt(toWorldX(lastWaypoint[0]), toWorldZ(lastWaypoint[1]), TRACE_WIDTH);

  // ── Création des matériaux glow ──────────────────────────────
  const frontSurfaceMat = createGlowFrontMat(initialGlowColor, traceSegments);
  const innerSurfaceMat = createGlowBackMat(initialGlowColor, traceSegments);
  const filamentCoreMat = createGlowFilamentMat(initialGlowColor, traceSegments);

  // ── Ajout des 3 meshes à la scène ───────────────────────────
  // Ordre de rendu : BackSide en premier, puis filament, puis FrontSide
  parentObject.add(new THREE.Mesh(mergeGeometries(backSurfaceGeos),  innerSurfaceMat));
  parentObject.add(new THREE.Mesh(mergeGeometries(filamentCoreGeos), filamentCoreMat));
  parentObject.add(new THREE.Mesh(mergeGeometries(frontSurfaceGeos), frontSurfaceMat));

  return {
    totalLength,
    glowMaterials: {
      frontSurface: frontSurfaceMat,
      innerSurface: innerSurfaceMat,
      filamentCore: filamentCoreMat,
    },
    animationState: {
      distanceTravelled: 0,
      animationPhase:    'fill',
      phaseElapsedTime:  0,
      startupDelay,
      hasStarted:        false,
    },
  };
}


// ═══════════════════════════════════════════════════════════════
//  UPDATE — appelé à chaque frame depuis renderer.ts
// ═══════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────────────────
//  updateAnimatedTrace
//
//  Met à jour la machine d'états de la trace et pousse
//  les nouvelles valeurs dans les uniforms des 3 matériaux.
//
//  Paramètres :
//    trace            — la trace à mettre à jour
//    deltaTime        — temps écoulé depuis la frame précédente (s)
//    animationConfig  — réglages centralisés (vitesse, durées…)
//
//  Retourne la progression normalisée 0→1 de la trace.
//  Utile pour synchroniser un indicateur UI côté React
//  (via un ref ou un callback passé en paramètre).
// ─────────────────────────────────────────────────────────
export function updateAnimatedTrace(trace: AnimatedTrace, deltaTime: number, animationConfig: TraceAnimationConfig): number {

  const { animationState, totalLength, glowMaterials } = trace;
  const allMaterials = [
    glowMaterials.frontSurface,
    glowMaterials.innerSurface,
    glowMaterials.filamentCore,
  ];

  // Sync des réglages visuels à chaque frame — peu coûteux
  // (permet de les modifier en live depuis l'extérieur si besoin)
  allMaterials.forEach(material => {
    material.uniforms.uGlowIntensity.value   = animationConfig.glowIntensity;
    material.uniforms.uFrontHaloLength.value = animationConfig.frontHaloLength;
  });

  // ── Délai de démarrage initial ───────────────────────────────
  if (!animationState.hasStarted) {
    animationState.startupDelay -= deltaTime;
    if (animationState.startupDelay > 0) {
      pushUniformsToMaterials(allMaterials, 0, 0);
      return 0;
    }
    animationState.hasStarted = true;
  }

  // ── Machine d'états fill → hold → fade ──────────────────────
  if (animationState.animationPhase === 'fill') {
    // Le front avance à travelSpeed unités/seconde
    animationState.distanceTravelled = Math.min(
      totalLength,
      animationState.distanceTravelled + animationConfig.travelSpeed * deltaTime
    );

    pushUniformsToMaterials(allMaterials, animationState.distanceTravelled, 1);

    if (animationState.distanceTravelled >= totalLength) {
      animationState.animationPhase   = 'hold';
      animationState.phaseElapsedTime = 0;
    }

    return animationState.distanceTravelled / totalLength;
  }

  if (animationState.animationPhase === 'hold') {
    animationState.phaseElapsedTime += deltaTime;
    pushUniformsToMaterials(allMaterials, totalLength, 1);

    if (animationState.phaseElapsedTime >= animationConfig.litHoldDuration) {
      animationState.animationPhase   = 'fade';
      animationState.phaseElapsedTime = 0;
    }

    return 1;
  }

  if (animationState.animationPhase === 'fade') {
    animationState.phaseElapsedTime += deltaTime;

    const brightnessRemaining = Math.max(
      0,
      1 - animationState.phaseElapsedTime / animationConfig.fadeDuration
    );

    pushUniformsToMaterials(allMaterials, totalLength, brightnessRemaining);

    if (animationState.phaseElapsedTime >= animationConfig.fadeDuration) {
      // Reset complet — recommence le cycle
      animationState.distanceTravelled = 0;
      animationState.animationPhase    = 'fill';
      animationState.phaseElapsedTime  = 0;
    }

    return 1;
  }

  return 0;
}


// ─────────────────────────────────────────────────────────
//  HELPER INTERNE — pousse frontDistance + brightness
//  dans les uniforms des 3 matériaux simultanément
//
//  frontDistance — jusqu'où la trace est allumée (world-space)
//  brightness    — multiplicateur global 0→1 (pour le fade out)
// ─────────────────────────────────────────────────────────
function pushUniformsToMaterials(materials: THREE.ShaderMaterial[], frontDistance: number, brightness: number): void {
  materials.forEach(material => {
    material.uniforms.uFrontDistance.value = frontDistance;
    material.uniforms.uBrightness.value    = brightness;
  });
}
