// ─────────────────────────────────────────────────────────
//  TYPE — paramètres de configuration de l'animation
//
//  Centralisés dans index.ts sous TRACE_ANIMATION_CONFIG.
//  Tous les réglages visuels et temporels sont ici —
//  modifier ce seul objet suffit pour ajuster le comportement
//  de toutes les traces animées.
//
//  travelSpeed       — vitesse du front (unités world-space/s)
//  litHoldDuration   — durée allumée à 100% avant extinction (s)
//  fadeDuration      — durée de l'extinction progressive (s)
//  glowIntensity     — puissance du glow (uniform uGlowIntensity)
//  frontHaloLength   — longueur du pic lumineux au bord d'attaque
//                      (uniform uFrontHaloLength, en unités world-space)
// ─────────────────────────────────────────────────────────
export interface TraceAnimationConfig {
  travelSpeed:     number;
  litHoldDuration: number;
  fadeDuration:    number;
  glowIntensity:   number;
  frontHaloLength: number;
}
