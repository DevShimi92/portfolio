import * as THREE from 'three';
import { AnimatedTrace } from '@/app/types/animatedTrace';
import { TraceSegment }  from '@/app/types/traceSegment';
import { ALL_TRACES, BOARD_TRACES } from '../traces/registry';
import {
  createStaticMaterials,
  createGlowFrontMat,
  createGlowBackMat,
  createGlowFilamentMat,
} from './materials';
import {
  BOARD_HEIGHT,
  BOARD_SURFACE,
  FILAMENT_Y,
  toWorldX,
  toWorldZ,
} from './constants';

// ═══════════════════════════════════════════════════════════════
//  buildBoard
//
//  Construit l'intégralité du board PCB en une seule passe :
//    — traces décoratives  : mergées en 3 draw calls, matériaux
//                            statiques partagés (uBrightness = 0)
//    — traces animables    : géométrie individuelle, matériaux
//                            glow dédiés, retournées dans la map
//
//  Retourne : Map<traceId, AnimatedTrace>
//    Chaque entrée est prête à être passée à updateAnimatedTrace().
//    Les traces inactives ont uBrightness = 0 — visuellement
//    identiques aux traces décoratives, zéro coût supplémentaire.
// ═══════════════════════════════════════════════════════════════
export function buildBoard(scene: THREE.Scene): Map<string, AnimatedTrace> {

  const root = new THREE.Group();
  scene.add(root);

  // ─────────────────────────────────────────────────────────
  //  BOARD — plan de fond
  // ─────────────────────────────────────────────────────────
  root.add(new THREE.Mesh(
    new THREE.BoxGeometry(100, BOARD_HEIGHT, 100),
    new THREE.MeshStandardMaterial({ color: 0x04080c, roughness: 0.12, metalness: 0.7 })
  ));

  // ─────────────────────────────────────────────────────────
  //  INDEX DES TRACES ANIMABLES
  //
  //  Set des traceId définis dans ALL_TRACES.
  //  Consulté dans traceTubes() pour savoir si une trace
  //  doit être construite individuellement ou mergée.
  // ─────────────────────────────────────────────────────────
  const animatableIds = new Set(ALL_TRACES.map(t => t.traceId));

  // ─────────────────────────────────────────────────────────
  //  ACCUMULATEURS — traces décoratives (merge global)
  // ─────────────────────────────────────────────────────────
  const staticBackGeos:    THREE.BufferGeometry[] = [];
  const staticFilamentGeos:THREE.BufferGeometry[] = [];
  const staticFrontGeos:   THREE.BufferGeometry[] = [];

  // ─────────────────────────────────────────────────────────
  //  MAP DE SORTIE — traces animables
  // ─────────────────────────────────────────────────────────
  const animatedTraceMap = new Map<string, AnimatedTrace>();


  // ═══════════════════════════════════════════════════════════════
  //  HELPERS GÉOMÉTRIE
  // ═══════════════════════════════════════════════════════════════

  function bakeTransform(
    geometry: THREE.BufferGeometry,
    posX: number, posY: number, posZ: number,
    rotationY: number
  ): THREE.BufferGeometry {
    const matrix = new THREE.Matrix4();
    matrix.compose(
      new THREE.Vector3(posX, posY, posZ),
      new THREE.Quaternion().setFromEuler(new THREE.Euler(0, rotationY, 0)),
      new THREE.Vector3(1, 1, 1)
    );
    const cloned = geometry.clone();
    cloned.applyMatrix4(matrix);
    return cloned;
  }

  function mergeGeos(geos: THREE.BufferGeometry[]): THREE.BufferGeometry {
    const nonIndexed = geos.map(geo => {
      const ni = geo.toNonIndexed();
      const pos = ni.attributes.position.array;
      for (let i = 0; i < pos.length; i++) {
        if (isNaN(pos[i])) (pos as Float32Array)[i] = 0;
      }
      return ni;
    });

    let totalVerts = 0;
    nonIndexed.forEach(g => totalVerts += g.attributes.position.count);

    const positions = new Float32Array(totalVerts * 3);
    const normals   = new Float32Array(totalVerts * 3);
    let offset = 0;

    nonIndexed.forEach(g => {
      positions.set(g.attributes.position.array, offset * 3);
      if (g.attributes.normal) normals.set(g.attributes.normal.array, offset * 3);
      offset += g.attributes.position.count;
    });

    const merged = new THREE.BufferGeometry();
    merged.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    merged.setAttribute('normal',   new THREE.BufferAttribute(normals,   3));
    merged.computeVertexNormals();
    return merged;
  }

  function makeOpenTubeGeo(halfWidth: number, halfHeight: number, length: number) {
    if (length < 0.001 || halfWidth < 0.0001 || halfHeight < 0.0001) return null;
    const hl = length / 2;
    const positions = new Float32Array([
      -halfWidth, -halfHeight, -hl,
       halfWidth, -halfHeight, -hl,
       halfWidth,  halfHeight, -hl,
      -halfWidth,  halfHeight, -hl,
      -halfWidth, -halfHeight,  hl,
       halfWidth, -halfHeight,  hl,
       halfWidth,  halfHeight,  hl,
      -halfWidth,  halfHeight,  hl,
    ]);
    const indices = new Uint16Array([
      0,1,5, 0,5,4,
      1,2,6, 1,6,5,
      2,3,7, 2,7,6,
      3,0,4, 3,4,7,
    ]);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setIndex(new THREE.BufferAttribute(indices, 1));
    geo.computeVertexNormals();
    return geo;
  }

  function makeJunctionGeo(halfSize: number, height: number) {
    if (halfSize < 0.0001 || height < 0.0001) return null;
    const hh = height / 2;
    const positions = new Float32Array([
      -halfSize, -hh, -halfSize,
       halfSize, -hh, -halfSize,
       halfSize, -hh,  halfSize,
      -halfSize, -hh,  halfSize,
      -halfSize,  hh,  halfSize,
       halfSize,  hh,  halfSize,
       halfSize,  hh, -halfSize,
      -halfSize,  hh, -halfSize,
    ]);
    const normals = new Float32Array([
      0,-1,0, 0,-1,0, 0,-1,0, 0,-1,0,
      0, 1,0, 0, 1,0, 0, 1,0, 0, 1,0,
    ]);
    const indices = new Uint16Array([
      0,1,2, 0,2,3,
      4,5,6, 4,6,7,
    ]);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('normal',   new THREE.BufferAttribute(normals,   3));
    geo.setIndex(new THREE.BufferAttribute(indices, 1));
    return geo;
  }


  // ═══════════════════════════════════════════════════════════════
  //  CONSTRUCTION D'UNE TRACE
  //
  //  Pousse les géométries dans les bons accumulateurs selon
  //  que la trace est décorative (merge global) ou animable
  //  (géométrie individuelle + matériaux glow dédiés).
  // ═══════════════════════════════════════════════════════════════

  function buildTraceGeometry(
    points:    number[][],
    tubeWidth: number,
    backGeos:  THREE.BufferGeometry[],
    filmGeos:  THREE.BufferGeometry[],
    frontGeos: THREE.BufferGeometry[],
  ) {
    const push = (
      target: THREE.BufferGeometry[],
      geo:    THREE.BufferGeometry | null,
      x: number, y: number, z: number, ry: number
    ) => { if (geo) target.push(bakeTransform(geo, x, y, z, ry)); };

    for (let i = 0; i < points.length - 1; i++) {
      const [c0, r0] = points[i];
      const [c1, r1] = points[i + 1];

      const x0 = toWorldX(c0), z0 = toWorldZ(r0);
      const x1 = toWorldX(c1), z1 = toWorldZ(r1);
      const dx = x1 - x0, dz = z1 - z0;
      const len = Math.sqrt(dx * dx + dz * dz);
      if (len < 0.01) continue;

      const ry  = Math.atan2(dx, dz);
      const cx  = (x0 + x1) / 2;
      const cz  = (z0 + z1) / 2;
      const h   = tubeWidth;
      const cy  = BOARD_SURFACE + h / 2;

      // Tube
      push(backGeos,  makeOpenTubeGeo(tubeWidth * 0.94 / 2, h * 0.94 / 2, len), cx, cy, cz, ry);
      push(filmGeos,  makeOpenTubeGeo(tubeWidth * 0.26 / 2, h * 0.26 / 2, len), cx, cy, cz, ry);
      push(frontGeos, makeOpenTubeGeo(tubeWidth / 2,        h / 2,         len), cx, cy, cz, ry);

      // Jonction au waypoint de départ
      const diag  = (tubeWidth / 2) * Math.SQRT2 * 0.52;
      const jcy   = BOARD_SURFACE + h / 2;
      push(backGeos,  makeJunctionGeo(diag * 0.94, h * 0.94), x0, jcy, z0, 0);
      push(filmGeos,  makeJunctionGeo(diag * 0.26, h * 0.26), x0, jcy, z0, 0);
      push(frontGeos, makeJunctionGeo(diag,        h        ), x0, jcy, z0, 0);
    }

    // Jonction terminale
    const [cl, rl] = points[points.length - 1];
    const xl = toWorldX(cl), zl = toWorldZ(rl);
    const diag = (tubeWidth / 2) * Math.SQRT2 * 0.52;
    const jcy  = BOARD_SURFACE + tubeWidth / 2;
    push(backGeos,  makeJunctionGeo(diag * 0.94, tubeWidth * 0.94), xl, jcy, zl, 0);
    push(filmGeos,  makeJunctionGeo(diag * 0.26, tubeWidth * 0.26), xl, jcy, zl, 0);
    push(frontGeos, makeJunctionGeo(diag,        tubeWidth        ), xl, jcy, zl, 0);
  }

  // ─────────────────────────────────────────────────────────
  //  traceTubes — point d'entrée pour chaque trace PCB
  //
  //  Si traceId est fourni ET référencé dans ALL_TRACES :
  //    → construction individuelle + entrée dans animatedTraceMap
  //  Sinon :
  //    → accumulation dans les buffers statiques (merge global)
  // ─────────────────────────────────────────────────────────
  function traceTubes(points: number[][], tubeWidth: number, traceId?: string) {

    if (traceId && animatableIds.has(traceId)) {
      // ── Trace animable ────────────────────────────────────

      // Accumulateurs locaux à cette trace
      const backGeos:  THREE.BufferGeometry[] = [];
      const filmGeos:  THREE.BufferGeometry[] = [];
      const frontGeos: THREE.BufferGeometry[] = [];

      buildTraceGeometry(points, tubeWidth, backGeos, filmGeos, frontGeos);

      // Calcul des segments world-space pour les uniforms shader
      const traceSegments: TraceSegment[] = [];
      let cumulative = 0;
      for (let i = 0; i < points.length - 1; i++) {
        const start = new THREE.Vector3(toWorldX(points[i][0]),   FILAMENT_Y, toWorldZ(points[i][1]));
        const end   = new THREE.Vector3(toWorldX(points[i+1][0]), FILAMENT_Y, toWorldZ(points[i+1][1]));
        const len   = start.distanceTo(end);
        traceSegments.push({ segmentStart: start, segmentEnd: end, segmentLength: len, cumulativeStart: cumulative });
        cumulative += len;
      }

      // Matériaux glow dédiés — segments encodés une fois pour toutes
      const traceDef      = ALL_TRACES.find(t => t.traceId === traceId)!;
      const glowColor     = new THREE.Color(traceDef.glowColor);
      const frontSurface  = createGlowFrontMat(glowColor, traceSegments);
      const innerSurface  = createGlowBackMat( glowColor, traceSegments);
      const filamentCore  = createGlowFilamentMat(glowColor, traceSegments);

      // Ajout à la scène
      const meshInner    = new THREE.Mesh(mergeGeos(backGeos),  innerSurface);
      const meshFilament = new THREE.Mesh(mergeGeos(filmGeos),  filamentCore);
      const meshFront    = new THREE.Mesh(mergeGeos(frontGeos), frontSurface);
      root.add(meshInner, meshFilament, meshFront);

      // Entrée dans la map — prête pour updateAnimatedTrace()
      animatedTraceMap.set(traceId, {
        totalLength:    cumulative,
        traceSegments,
        glowMaterials:  { frontSurface, innerSurface, filamentCore },
        glowMeshes:     { frontSurface: meshFront, innerSurface: meshInner, filamentCore: meshFilament },
        animationState: {
          distanceTravelled: 0,
          animationPhase:    'fill',
          phaseElapsedTime:  0,
          startupDelay:      0,
          startDistance:     0,
          hasStarted:        false,
          cycleComplete:     false,
        },
      });

    } else {
      // ── Trace décorative — merge global ───────────────────
      buildTraceGeometry(points, tubeWidth, staticBackGeos, staticFilamentGeos, staticFrontGeos);
    }
  }


  // ═══════════════════════════════════════════════════════════════
  //  TRACÉ DES TRACES PCB
  //
  //  Itère la source unique BOARD_TRACES (traceRegistry.ts).
  //  Une trace animable est construite avec son traceId (géométrie
  //  + glow dédiés) ; une trace décorative est passée sans id et
  //  fusionnée dans le décor statique (split perf inchangé).
  // ═══════════════════════════════════════════════════════════════
  for (const trace of BOARD_TRACES) {
    traceTubes(trace.waypoints, trace.width, trace.animatable ? trace.id : undefined);
  }


  // ═══════════════════════════════════════════════════════════════
  //  MERGE FINAL — traces décoratives
  //  Un seul draw call par matériau pour l'ensemble du décor
  // ═══════════════════════════════════════════════════════════════
  const staticMats = createStaticMaterials();

  if (staticBackGeos.length)     root.add(new THREE.Mesh(mergeGeos(staticBackGeos),     staticMats.glassBack));
  if (staticFilamentGeos.length) root.add(new THREE.Mesh(mergeGeos(staticFilamentGeos), staticMats.filament));
  if (staticFrontGeos.length)    root.add(new THREE.Mesh(mergeGeos(staticFrontGeos),    staticMats.glassFront));

  return animatedTraceMap;
}
