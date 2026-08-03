import { TraceAnimationConfig } from '@/app/types/traceAnimationConfig';
import { TraceDefinition } from '@/app/types/traceDefinition';
import { TraceScript } from '@/app/types/traceScript';
import { BoardTrace } from '@/app/types/boardTrace';
import { GRID_UNIT, TRACE_WIDTH } from '../board/constants';
// ═══════════════════════════════════════════════════════════════
//  TRACE REGISTRY
//
//  Fichier central de définition du contenu animé.
//  Responsabilité unique : décrire CE QUI PEUT s'animer
//  et COMMENT — pas comment le déclencher (sequencer à venir),
//  pas comment le rendre (animatedTrace.ts / renderer.ts).
//
//  Structure :
//    BOARD_TRACES     — source unique de tous les tracés
//    ALL_TRACES       — dérivé : traces animables (référencées par scripts)
//    DEFAULT_ANIMATION_CONFIG — valeurs de réglage par défaut
//    resolve* / resolveDistanceAtWaypoint — helpers de résolution
//
//  Le CONTENU des scénarios (TRACE_SCRIPTS, DEFAULT_SCRIPT_ROTATION)
//  vit dans traceScripts.ts — séparé de cette logique.
// ═══════════════════════════════════════════════════════════════

export const DEFAULT_ANIMATION_CONFIG: TraceAnimationConfig = {
  travelSpeed:     40,
  litHoldDuration: 0.8,
  fadeDuration:    0.8,
  glowIntensity:   2.5,
  frontHaloLength: 6.0,
  arcDensity:   0,
  arcAmplitude: 0,
  arcReach:     0,
  arcNervosity: 0,
  arcIntensity: 0,
};


// ─────────────────────────────────────────────────────────
//  BOARD_TRACES — SOURCE UNIQUE de vérité des tracés PCB
//
//  Décrit TOUS les tracés du board, en un seul endroit.
//  Consommée par :
//    — buildBoard.ts        → construit la géométrie
//    — ALL_TRACES (dérivé)  → ce que les scripts référencent
//    — resolveDistanceAtWaypoint
//
//  animatable : true  → géométrie + glow dédiés (peut s'animer)
//               false → fusionnée dans le décor statique (perf)
//  Pour rendre une trace animable : passer son flag à true.
//  glowColor est conservé même sur les traces décoratives, pour
//  qu'activer une trace ne demande qu'à basculer animatable.
//
//  Ordre : de gauche à droite sur le board (utile pour les
//  scripts en cascade).
// ─────────────────────────────────────────────────────────
export const BOARD_TRACES: BoardTrace[] = [
  { id: 'trace-A0',  width: TRACE_WIDTH, animatable: true, glowColor: 0x00eeff,
    waypoints: [[-5.65,2.35],[-5.65,3.35],[-5.5,3.5],[-5.5,10]] },
  { id: 'trace-A1',  width: TRACE_WIDTH, animatable: true, glowColor: 0x00eeff,
    waypoints: [[-5.75,1.25],[-5.75,2.25],[-5,3],[-5,10]] },
  { id: 'trace-A2',  width: TRACE_WIDTH, animatable: true, glowColor: 0x00eeff,
    waypoints: [[-6,-4],[-6,1],[-4.5,2.5],[-4.5,10]] },
  { id: 'trace-A3',  width: TRACE_WIDTH, animatable: true, glowColor: 0x00eeff,
    waypoints: [[-5,-11.5],[-7,-9.5],[-7,-5],[-6.5,-4.5]] },
  { id: 'trace-A4',  width: TRACE_WIDTH, animatable: true, glowColor: 0x00eeff,
    waypoints: [[-5,-20],[-5,-10.5],[-6.5,-9],[-6.5,-4.5],[-6,-4],[-6,-0],[-4,2],[-4,10]] },
  { id: 'trace-A5',  width: TRACE_WIDTH, animatable: true, glowColor: 0x00eeff,
    waypoints: [[-3,-20],[-3,-11],[-5,-9],[-5,-8]] },
  { id: 'trace-A6',  width: TRACE_WIDTH, animatable: true, glowColor: 0x00eeff,
    waypoints: [[-2.5,-20],[-2.5,-10.5],[-5.5,-7.5],[-5.5,-0.5],[-3.5,1.5],[-3.5,10]] },
  { id: 'trace-A7',  width: TRACE_WIDTH, animatable: true, glowColor: 0x00eeff,
    waypoints: [[-1,-20],[-1,-11],[-5,-7],[-5,-1],[-3,1],[-3,10]] },
  { id: 'trace-A8',  width: TRACE_WIDTH, animatable: true, glowColor: 0x00eeff,
    waypoints: [[-0.5,-20],[-0.5,-10.5],[-4.5,-6.5],[-4.5,-1.5],[-2.5,0.5],[-2.5,10]] },
  { id: 'trace-A9',  width: TRACE_WIDTH, animatable: true,  glowColor: 0x00eeff,
    waypoints: [[0,-20],[0,-10],[-4,-6],[-4,-2],[-2,0],[-2,10]] },
  { id: 'trace-A10', width: TRACE_WIDTH, animatable: true, glowColor: 0x00eeff,
    waypoints: [[1,-20],[1,-9],[-3,-5],[-3,-3],[-2.5,-2.5],[-2.5,-0.5]] },
  { id: 'trace-A11', width: TRACE_WIDTH, animatable: true, glowColor: 0x00eeff,
    waypoints: [[1.5,-20],[1.5,-8.5],[-2.5,-4.5],[-2.5,-3.5],[-2,-3],[-2.5,-2.5]] },
];


// ─────────────────────────────────────────────────────────
//  ALL_TRACES — DÉRIVÉ de BOARD_TRACES (traces animables only)
//
//  Ce que les scripts référencent. Zéro duplication : modifier
//  un waypoint dans BOARD_TRACES suffit. Une trace n'apparaît
//  ici que si animatable === true.
// ─────────────────────────────────────────────────────────
export const ALL_TRACES: TraceDefinition[] = BOARD_TRACES
  .filter(t => t.animatable)
  .map(t => ({
    traceId:         t.id,
    waypointsInGrid: t.waypoints,
    glowColor:       t.glowColor ?? 0x00eeff,
  }));


// ─────────────────────────────────────────────────────────
//  HELPER — résout la config d'UNE trace dans un script
//
//  Priorité (du plus faible au plus fort) :
//    DEFAULT_ANIMATION_CONFIG
//      ← script.animationConfig   (override global au script)
//      ← script.traceOverrides[id] (override par trace : vitesse, arcs)
//
//  Permet de régler vitesse / paramètres d'arcs trace par trace
//  au sein d'un même script. La couleur n'est pas concernée
//  (elle reste figée au build, par trace).
// ─────────────────────────────────────────────────────────
export function resolveTraceConfig(script: TraceScript, traceId: string): TraceAnimationConfig {
  return {
    ...DEFAULT_ANIMATION_CONFIG,
    ...script.animationConfig,
    ...script.traceOverrides?.[traceId],
  };
}


// ─────────────────────────────────────────────────────────
//  HELPER — résout les TraceDefinition actives d'un script
//
//  Filtre ALL_TRACES pour ne retourner que les traces
//  référencées par le script. Les traceId inconnus sont
//  ignorés silencieusement (pas d'erreur bloquante).
// ─────────────────────────────────────────────────────────
export function resolveActiveTraces(script: TraceScript): TraceDefinition[] {
  return script.activeTraceIds
    .map(id => ALL_TRACES.find(trace => trace.traceId === id))
    .filter((trace): trace is TraceDefinition => trace !== undefined);
}

// ─────────────────────────────────────────────────────────
//  HELPER — résout le startupDelay d'une trace pour un script
//
//  Si le script ne définit pas de délai pour cette trace,
//  retourne 0 — la trace démarre immédiatement.
// ─────────────────────────────────────────────────────────
export function resolveStartupDelay(script: TraceScript, traceId: string): number {
  return script.startupDelays?.[traceId]?.delay ?? 0;
}


// ─────────────────────────────────────────────────────────
//  HELPER — distance world-space à un index de waypoint
//
//  waypointIndex accepte un FRACTIONNAIRE pour cibler un point
//  ENTRE deux waypoints :
//    3   → exactement le waypoint 3
//    3.9 → 90 % du chemin sur le segment waypoint 3 → 4
//  L'index est clampé à [0, dernier waypoint].
//  Pratique comme startDistance dans startupDelays.
// ─────────────────────────────────────────────────────────
export function resolveDistanceAtWaypoint(traceId: string, waypointIndex: number): number {
  const trace = BOARD_TRACES.find(t => t.id === traceId);
  if (!trace) return 0;

  // Longueur world-space du segment i → i+1
  const segmentLength = (i: number): number => {
    const [colStart, rowStart] = trace.waypoints[i];
    const [colEnd,   rowEnd  ] = trace.waypoints[i + 1];
    const worldDeltaX = (colEnd - colStart) * GRID_UNIT;
    const worldDeltaZ = (rowEnd - rowStart) * GRID_UNIT;
    return Math.sqrt(worldDeltaX * worldDeltaX + worldDeltaZ * worldDeltaZ);
  };

  const lastIndex = trace.waypoints.length - 1;
  const clamped   = Math.max(0, Math.min(waypointIndex, lastIndex));
  const whole     = Math.floor(clamped);
  const fraction  = clamped - whole;

  let cumulativeDistance = 0;
  for (let i = 0; i < whole; i++) {
    cumulativeDistance += segmentLength(i);
  }
  // Portion partielle sur le segment courant (sauf sur le dernier waypoint)
  if (fraction > 0 && whole < lastIndex) {
    cumulativeDistance += fraction * segmentLength(whole);
  }

  return cumulativeDistance;
}
