import * as THREE from 'three';
import { TraceSegment }       from '@/app/types/traceSegment';
import { TraceAnimationConfig } from '@/app/types/traceAnimationConfig';

// ═══════════════════════════════════════════════════════════════
//  ELECTRIC ARCS
//
//  Système d'arcs électriques procéduraux par subdivision
//  récursive. Associé à une trace animée — les arcs
//  apparaissent uniquement sur la zone déjà parcourue
//  et suivent la progression via frontDistance.
//
//  Architecture :
//    ArcPoolSlot    — un slot réutilisable dans le pool
//    ElectricArcPool — pool de slots par trace
//    initElectricArcPool()   — crée le pool, à appeler une fois
//    updateElectricArcs()    — à appeler chaque frame
// ═══════════════════════════════════════════════════════════════


// ─────────────────────────────────────────────────────────
//  CONSTANTE — taille du pool par trace
//
//  40 slots par trace est suffisant pour une densité max de
//  30 arcs/s avec une durée de vie moyenne de ~1s.
//  Augmenter si des arcs disparaissent prématurément à
//  très haute densité.
// ─────────────────────────────────────────────────────────
const ARC_POOL_SIZE = 40;


// ─────────────────────────────────────────────────────────
//  TYPE — un slot de pool d'arcs
//
//  line        — la THREE.Line rendue (géométrie + matériau)
//  geometry    — référence directe pour mise à jour rapide
//  material    — référence directe pour mise à jour opacité
//  remainingLifespan  — temps de vie restant (s)
//  totalLifespan      — durée de vie totale (s), pour le fade
//  peakOpacity        — opacité max de cet arc (varie entre arcs)
//                       donne l'aspect irrégulier/nerveux
// ─────────────────────────────────────────────────────────
interface ArcPoolSlot {
  line:             THREE.Line;
  geometry:         THREE.BufferGeometry;
  material:         THREE.LineBasicMaterial;
  remainingLifespan: number;
  totalLifespan:     number;
  peakOpacity:       number;
  isActive:          boolean;
}

// ─────────────────────────────────────────────────────────
//  TYPE — pool d'arcs pour une trace
//
//  arcGroup    — Group Three.js contenant toutes les Lines
//                Ajouté à la scène dans initElectricArcPool()
//  slots       — les ARC_POOL_SIZE slots réutilisables
//  glowColor   — couleur courante des arcs (modifiable en live)
// ─────────────────────────────────────────────────────────
export interface ElectricArcPool {
  arcGroup:  THREE.Group;
  slots:     ArcPoolSlot[];
  glowColor: THREE.Color;
}


// ═══════════════════════════════════════════════════════════════
//  INIT — crée le pool, à appeler une fois dans index.ts
// ═══════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────────────────
//  initElectricArcPool
//
//  Paramètres :
//    initialColor  — couleur glow initiale des arcs
//    parentObject  — scène ou groupe auquel rattacher arcGroup
//
//  Retourne un ElectricArcPool prêt à être passé à
//  updateElectricArcs() à chaque frame.
// ─────────────────────────────────────────────────────────
export function initElectricArcPool(
  initialColor: THREE.Color,
  parentObject: THREE.Object3D
): ElectricArcPool {

  const arcGroup = new THREE.Group();
  parentObject.add(arcGroup);

  const slots: ArcPoolSlot[] = [];

  for (let slotIndex = 0; slotIndex < ARC_POOL_SIZE; slotIndex++) {
    // Géométrie vide initiale — sera remplie à chaque activation
    const geometry = new THREE.BufferGeometry();
    geometry.setFromPoints([new THREE.Vector3(), new THREE.Vector3()]);

    // Matériau avec blending additif — les arcs qui se superposent
    // s'accumulent lumineusement, ce qui renforce l'effet électrique
    const material = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent:  true,
      opacity:      0,
      depthWrite:   false,
      blending:     THREE.AdditiveBlending,
    });

    const line = new THREE.Line(geometry, material);
    line.visible = false;
    arcGroup.add(line);

    slots.push({
      line,
      geometry,
      material,
      remainingLifespan: 0,
      totalLifespan:     0,
      peakOpacity:       0,
      isActive:          false,
    });
  }

  return {
    arcGroup,
    slots,
    glowColor: initialColor.clone(),
  };
}


// ═══════════════════════════════════════════════════════════════
//  UPDATE — appelé à chaque frame depuis index.ts
// ═══════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────────────────
//  updateElectricArcs
//
//  Paramètres :
//    pool           — le pool à mettre à jour
//    traceSegments  — segments world-space de la trace
//                     (depuis animatedTrace.traceSegments)
//    frontDistance  — distance parcourue courante (world-space)
//                     (depuis animatedTrace.animationState.distanceTravelled)
//    brightness     — multiplicateur global 0→1
//                     (suit le fade out de la trace)
//    deltaTime      — temps écoulé depuis la frame précédente (s)
//    config         — config d'animation courante
// ─────────────────────────────────────────────────────────
export function updateElectricArcs(
  pool:          ElectricArcPool,
  traceSegments: TraceSegment[],
  frontDistance: number,
  brightness:    number,
  deltaTime:     number,
  config:        TraceAnimationConfig
): void {

  // Aucun arc si la trace n'est pas encore allumée
  if (frontDistance <= 0 || brightness <= 0) {
    pool.slots.forEach(slot => {
      if (slot.isActive) deactivateSlot(slot);
    });
    return;
  }

  // ── Mise à jour des slots actifs ─────────────────────────────
  pool.slots.forEach(slot => {
    if (!slot.isActive) return;

    slot.remainingLifespan -= deltaTime;

    if (slot.remainingLifespan <= 0) {
      deactivateSlot(slot);
      return;
    }

    // Fade naturel sur la durée de vie restante
    const lifeFraction    = slot.remainingLifespan / slot.totalLifespan;
    slot.material.opacity = slot.peakOpacity * lifeFraction * brightness * config.arcIntensity;
  });

  // ── Génération de nouveaux arcs ──────────────────────────────
  // Nombre d'arcs à générer cette frame, proportionnel au deltaTime
  // arcDensity = arcs par seconde → on convertit en arcs par frame
  const arcsToSpawnThisFrame = Math.ceil(config.arcDensity * deltaTime);
  const arcLifespan          = 1 / config.arcNervosity;

  let spawned = 0;

  for (let slotIndex = 0; slotIndex < pool.slots.length && spawned < arcsToSpawnThisFrame; slotIndex++) {
    const slot = pool.slots[slotIndex];
    if (slot.isActive) continue; // slot occupé

    spawnArc(slot, pool.glowColor, traceSegments, frontDistance, arcLifespan, config);
    spawned++;
  }
}


// ═══════════════════════════════════════════════════════════════
//  HELPERS INTERNES
// ═══════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────────────────
//  spawnArc — active un slot et génère un arc
// ─────────────────────────────────────────────────────────
function spawnArc(
  slot:          ArcPoolSlot,
  glowColor:     THREE.Color,
  segments:      TraceSegment[],
  frontDistance: number,
  baseLifespan:  number,
  config:        TraceAnimationConfig
): void {

  // ── Point de départ aléatoire dans la zone parcourue ─────────
  const spawnDistance = Math.random() * frontDistance;
  const spawnPosition = interpolatePositionOnTrace(segments, spawnDistance);

  // ── Direction perpendiculaire à la trace au point de départ ──
  const traceDirection       = getTraceDirectionAtDistance(segments, spawnDistance);
  const perpendicularDirection = new THREE.Vector3(-traceDirection.z, 0, traceDirection.x);

  // ── Point d'arrivée ──────────────────────────────────────────
  // Longueur de l'arc : entre 30% et 100% de arcReach
  const arcLength = config.arcReach * (0.3 + Math.random() * 0.7);

  // Direction de l'arc : angle aléatoire autour de la perpendiculaire
  const randomAngle = (Math.random() - 0.5) * Math.PI;
  const arcDirection = new THREE.Vector3(
    perpendicularDirection.x * Math.cos(randomAngle) - perpendicularDirection.z * Math.sin(randomAngle),
    0,
    perpendicularDirection.x * Math.sin(randomAngle) + perpendicularDirection.z * Math.cos(randomAngle)
  ).normalize();

  const endPosition = spawnPosition.clone().addScaledVector(arcDirection, arcLength);

  // Mode jaillissement uniquement — les arcs montent au-dessus du PCB
  endPosition.y += arcLength * (0.3 + Math.random() * 0.7);

  // ── Subdivision récursive ────────────────────────────────────
  // 15% de gros arcs (depth=5) pour la variété, 85% de petits (depth=3)
  const isLargeArc    = Math.random() < 0.15;
  const subdivDepth   = isLargeArc ? 5 : 3;
  const arcAmplitude  = isLargeArc ? config.arcAmplitude * 2 : config.arcAmplitude;

  const arcPoints: THREE.Vector3[] = [spawnPosition.clone()];
  subdivideArcRecursive(spawnPosition, endPosition, arcAmplitude, subdivDepth, arcPoints);

  // ── Construction des buffers position + couleur ──────────────
  const positionBuffer = new Float32Array(arcPoints.length * 3);
  const colorBuffer    = new Float32Array(arcPoints.length * 3);

  for (let pointIndex = 0; pointIndex < arcPoints.length; pointIndex++) {
    positionBuffer[pointIndex * 3]     = arcPoints[pointIndex].x;
    positionBuffer[pointIndex * 3 + 1] = arcPoints[pointIndex].y;
    positionBuffer[pointIndex * 3 + 2] = arcPoints[pointIndex].z;

    // Couleur : blanc chaud à l'origine, couleur de trace vers l'extrémité
    const distanceRatio = pointIndex / (arcPoints.length - 1);
    const whiteness     = Math.pow(1 - distanceRatio, 2) * 0.8;
    colorBuffer[pointIndex * 3]     = Math.min(1, glowColor.r + whiteness);
    colorBuffer[pointIndex * 3 + 1] = Math.min(1, glowColor.g + whiteness);
    colorBuffer[pointIndex * 3 + 2] = Math.min(1, glowColor.b + whiteness);
  }

  slot.geometry.setAttribute('position', new THREE.BufferAttribute(positionBuffer, 3));
  slot.geometry.setAttribute('color',    new THREE.BufferAttribute(colorBuffer,    3));
  slot.geometry.attributes.position.needsUpdate = true;
  slot.geometry.attributes.color.needsUpdate    = true;
  slot.geometry.computeBoundingSphere();

  // ── Activation du slot ───────────────────────────────────────
  slot.peakOpacity       = 0.5 + Math.random() * 0.5;
  slot.totalLifespan     = baseLifespan * (0.5 + Math.random() * 0.5);
  slot.remainingLifespan = slot.totalLifespan;
  slot.material.opacity  = slot.peakOpacity;
  slot.isActive          = true;
  slot.line.visible      = true;
}

// ─────────────────────────────────────────────────────────
//  deactivateSlot — remet un slot au repos
// ─────────────────────────────────────────────────────────
function deactivateSlot(slot: ArcPoolSlot): void {
  slot.isActive        = false;
  slot.line.visible    = false;
  slot.material.opacity = 0;
}

// ─────────────────────────────────────────────────────────
//  subdivideArcRecursive — algorithme de subdivision éclair
//
//  À chaque niveau, le point médian entre start et end est
//  dévié perpendiculairement d'une valeur aléatoire.
//  L'amplitude diminue à chaque niveau (self-similarity).
//  Les points résultants sont poussés dans outputPoints.
// ─────────────────────────────────────────────────────────
function subdivideArcRecursive(
  start:        THREE.Vector3,
  end:          THREE.Vector3,
  amplitude:    number,
  depthRemaining: number,
  outputPoints: THREE.Vector3[]
): void {

  if (depthRemaining === 0) {
    outputPoints.push(end.clone());
    return;
  }

  // Point médian
  const midpoint = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);

  // Vecteur perpendiculaire dans le plan XZ
  const segmentDirection  = new THREE.Vector3().subVectors(end, start).normalize();
  const perpendicularXZ   = new THREE.Vector3(-segmentDirection.z, 0, segmentDirection.x).normalize();

  // Déviation latérale aléatoire
  const lateralDeviation = (Math.random() - 0.5) * 2 * amplitude;
  midpoint.addScaledVector(perpendicularXZ, lateralDeviation);

  // Récursion avec amplitude réduite
  subdivideArcRecursive(start,    midpoint, amplitude * 0.6, depthRemaining - 1, outputPoints);
  subdivideArcRecursive(midpoint, end,      amplitude * 0.6, depthRemaining - 1, outputPoints);
}

// ─────────────────────────────────────────────────────────
//  interpolatePositionOnTrace
//
//  Retourne le point world-space à la distance `targetDistance`
//  depuis le début de la trace.
// ─────────────────────────────────────────────────────────
function interpolatePositionOnTrace(
  segments:       TraceSegment[],
  targetDistance: number
): THREE.Vector3 {

  for (const segment of segments) {
    const segmentEnd = segment.cumulativeStart + segment.segmentLength;
    if (targetDistance >= segment.cumulativeStart && targetDistance < segmentEnd) {
      const interpolationFactor = (targetDistance - segment.cumulativeStart) / segment.segmentLength;
      return new THREE.Vector3().lerpVectors(segment.segmentStart, segment.segmentEnd, interpolationFactor);
    }
  }

  // Dernier point de la trace si on dépasse
  const lastSegment = segments[segments.length - 1];
  return lastSegment.segmentEnd.clone();
}

// ─────────────────────────────────────────────────────────
//  getTraceDirectionAtDistance
//
//  Retourne le vecteur direction normalisé de la trace
//  au point correspondant à targetDistance.
// ─────────────────────────────────────────────────────────
function getTraceDirectionAtDistance(
  segments:       TraceSegment[],
  targetDistance: number
): THREE.Vector3 {

  for (const segment of segments) {
    const segmentEnd = segment.cumulativeStart + segment.segmentLength;
    if (targetDistance >= segment.cumulativeStart && targetDistance < segmentEnd) {
      return new THREE.Vector3()
        .subVectors(segment.segmentEnd, segment.segmentStart)
        .normalize();
    }
  }

  // Dernier segment si on dépasse
  const lastSegment = segments[segments.length - 1];
  return new THREE.Vector3()
    .subVectors(lastSegment.segmentEnd, lastSegment.segmentStart)
    .normalize();
}
