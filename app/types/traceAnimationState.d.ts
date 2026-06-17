// ─────────────────────────────────────────────────────────
//  TYPE — état d'animation d'une trace
//
//  Géré par updateAnimatedTrace() à chaque frame.
//  Cycle : fill → hold → fade → (reset vers fill)
// ─────────────────────────────────────────────────────────
export interface TraceAnimationState {
  distanceTravelled: number;
  animationPhase:    'fill' | 'hold' | 'fade';
  phaseElapsedTime:  number;
  startupDelay:      number;
  startDistance:     number;
  hasStarted:        boolean;
  cycleComplete:     boolean;
}
