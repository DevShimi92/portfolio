// ─────────────────────────────────────────────────────────
//  TYPE — une trace animée complète
//
//  Retourné par initAnimatedTrace(), stocké dans index.ts
//  et passé à updateAnimatedTrace() à chaque frame.
//
//  totalLength  — longueur totale de la trace (world-space)
//                 utilisé pour normaliser la progression 0→1
//  glowMaterials — les 3 ShaderMaterials glow exposés pour
//                  permettre de changer uGlowColor en dehors
//                  (ex: color picker, thème jour/nuit)
// ─────────────────────────────────────────────────────────
export interface AnimatedTrace {
  animationState: TraceAnimationState;
  totalLength: number;
  traceSegments:  TraceSegment[];
  glowMaterials: {
    frontSurface: THREE.ShaderMaterial;   // surface externe du tube
    innerSurface: THREE.ShaderMaterial;   // intérieur du tube (BackSide)
    filamentCore: THREE.ShaderMaterial;   // cœur lumineux central
  };
}
