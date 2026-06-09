import { TraceAnimationConfig } from '@/app/types/traceAnimationConfig';
import { TraceDefinition } from '@/app/types/traceDefinition';
import { TraceScript } from '@/app/types/traceScript';
// ═══════════════════════════════════════════════════════════════
//  TRACE REGISTRY
//
//  Fichier central de définition du contenu animé.
//  Responsabilité unique : décrire CE QUI PEUT s'animer
//  et COMMENT — pas comment le déclencher (sequencer à venir),
//  pas comment le rendre (animatedTrace.ts / renderer.ts).
//
//  Structure :
//    TraceDefinition  — définition d'une trace individuelle
//    TraceScript      — groupe de traces avec config commune
//    ALL_TRACES       — toutes les traces du board
//    TRACE_SCRIPTS    — tous les scripts disponibles
//    DEFAULT_SCRIPT   — script actif au chargement
// ═══════════════════════════════════════════════════════════════


// ─────────────────────────────────────────────────────────
//  CONFIG PAR DÉFAUT
//
//  Valeurs de référence utilisées si un script ne fournit
//  pas de override. Modifier ici ajuste le comportement
//  global de toutes les traces non-overridées.
// ─────────────────────────────────────────────────────────
export const DEFAULT_ANIMATION_CONFIG: TraceAnimationConfig = {
  travelSpeed:     40,
  litHoldDuration: 0.8,
  fadeDuration:    0.8,
  glowIntensity:   2.5,
  frontHaloLength: 6.0,
  arcDensity:   12,
  arcAmplitude: 0.18,
  arcReach:     0.5,
  arcNervosity: 12,
  arcIntensity: 0.7,
};


// ─────────────────────────────────────────────────────────
//  ALL_TRACES — toutes les traces du board
//
//  Contient toutes les traces qui PEUVENT s'animer.
//  Les traces de fond non-animées (gérées par buildBoard.ts)
//  ne sont pas listées ici — elles n'ont pas besoin d'un ID.
//
//  Ordre : correspond à l'ordre visuel de gauche à droite
//  sur le board (utile pour les scripts en cascade).
// ─────────────────────────────────────────────────────────
export const ALL_TRACES: TraceDefinition[] = [
  {
    traceId:         'trace-01',
    waypointsInGrid: [[1,-20],[1,-9],[-3,-5],[-3,-3],[-2.5,-2.5],[-2.5,-0.5]],
    glowColor:       0x00eeff,
    startupDelay:    0,
  },
  {
    traceId:         'trace-02',
    waypointsInGrid: [[-0.5,-20],[-0.5,-10.5],[-4.5,-6.5],[-4.5,-1.5],[-2.5,0.5],[-2.5,10]],
    glowColor:       0x55ffdd,
    startupDelay:    0.10,
  },
  // ── Traces supplémentaires à ajouter au fur et à mesure ──
  // {
  //   traceId:         'trace-03',
  //   waypointsInGrid: [[-3, -10], [-3, 0], [0, 4], [0, 15]],
  //   glowColor:       0x88eeff,
  //   startupDelay:    1.2,
  // },
];


// ─────────────────────────────────────────────────────────
//  TRACE_SCRIPTS — tous les scripts disponibles
//
//  Chaque script référence des traceId définis dans ALL_TRACES.
//  Un script peut overrider n'importe quel champ de
//  TraceAnimationConfig — les champs non fournis utilisent
//  DEFAULT_ANIMATION_CONFIG.
// ─────────────────────────────────────────────────────────
export const TRACE_SCRIPTS: Record<string, TraceScript> = {

  'default': {
    scriptId:       'default',
    activeTraceIds: [],
    // Pas d'override — utilise DEFAULT_ANIMATION_CONFIG
  },

  // ── Scripts à venir ──────────────────────────────────
  // 'boot-sequence': {
  //   scriptId:       'boot-sequence',
  //   activeTraceIds: ['trace-01', 'trace-02', 'trace-03'],
  //   animationConfig: {
  //     travelSpeed:  200,   // plus lent, effet dramatique
  //     glowIntensity: 4.0,
  //   },
  // },
  // 'alert-mode': {
  //   scriptId:       'alert-mode',
  //   activeTraceIds: ['trace-01', 'trace-02'],
  //   animationConfig: {
  //     travelSpeed:     800,
  //     litHoldDuration: 0.2,
  //     fadeDuration:    0.3,
  //     glowIntensity:   5.0,
  //   },
  // },
};

// Script actif par défaut au chargement de la page
export const DEFAULT_SCRIPT = 'default';


// ─────────────────────────────────────────────────────────
//  HELPER — résout la config finale d'un script
//
//  Fusionne DEFAULT_ANIMATION_CONFIG avec les overrides
//  du script. Appelé dans index.ts au moment de l'init
//  et par le sequencer (à venir) lors du changement de script.
// ─────────────────────────────────────────────────────────
export function resolveAnimationConfig(script: TraceScript): TraceAnimationConfig {
  return {
    ...DEFAULT_ANIMATION_CONFIG,
    ...script.animationConfig,
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
