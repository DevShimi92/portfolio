// ─────────────────────────────────────────────────────────
//  TYPE — état d'animation d'une trace
//
//  Géré par updateAnimatedTrace() à chaque frame.
//  Cycle : fill → hold → fade → (reset vers fill)
//
//  distanceTravelled  — distance parcourue depuis le début
//                       de la trace (0 → totalLength)
//  animationPhase     — phase courante du cycle
//  phaseElapsedTime   — temps écoulé dans la phase courante (s)
//  startupDelay       — délai avant le tout premier départ (s)
//                       permet d'échelonner plusieurs traces
//  hasStarted         — true une fois le délai initial écoulé
// ─────────────────────────────────────────────────────────
export interface TraceAnimationState {
  distanceTravelled: number;
  animationPhase:    'fill' | 'hold' | 'fade';
  phaseElapsedTime:  number;
  startupDelay:      number;
  hasStarted:        boolean;
}
