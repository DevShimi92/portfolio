// ─────────────────────────────────────────────────────────
//  TYPE — une trace animée complète
//
//  Retourné par buildBoard(), stocké dans index.ts
//  et passé à updateAnimatedTrace() à chaque frame.
//
//  totalLength   — longueur totale de la trace (world-space)
//                  utilisé pour normaliser la progression 0→1
//  glowMaterials — les 3 ShaderMaterials glow exposés pour
//                  permettre de changer uGlowColor en dehors
//                  (ex: color picker, thème jour/nuit)
//  glowMeshes    — les 3 Mesh correspondants, exposés pour
//                  permettre de modifier renderOrder dynamiquement
//                  (ex: trace active toujours au premier plan)
// ─────────────────────────────────────────────────────────
export interface AnimatedTrace {
  animationState: TraceAnimationState;
  totalLength:    number;
  traceSegments:  TraceSegment[];
  glowMaterials: {
    frontSurface: THREE.ShaderMaterial;
    innerSurface: THREE.ShaderMaterial;
    filamentCore: THREE.ShaderMaterial;
  };
  glowMeshes: {
    frontSurface: THREE.Mesh;
    innerSurface: THREE.Mesh;
    filamentCore: THREE.Mesh;
  };
}
