// ─────────────────────────────────────────────────────────
//  TYPE — script d'animation
//
//  Un script définit un comportement d'animation complet :
//  quelles traces s'allument, avec quelle config, dans quel ordre.
//
//  scriptId         — identifiant unique du script
//  activeTraceIds   — liste des traceId à animer
//  animationConfig  — overrides de la config par défaut
//                     (vitesse, durées, intensité…)
//                     Si non fourni, DEFAULT_ANIMATION_CONFIG est utilisé
//
//  Exemples de scripts futurs :
//    'boot-sequence'  — toutes les traces s'allument en cascade
//    'alert-mode'     — traces rouges, vitesse élevée
//    'idle'           — 2 traces lentes, couleur douce
// ─────────────────────────────────────────────────────────
export interface TraceScript {
  scriptId:        string;
  activeTraceIds:  string[];
  animationConfig?: Partial<TraceAnimationConfig>;
}
