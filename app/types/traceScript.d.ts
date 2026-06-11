// ─────────────────────────────────────────────────────────
//  TYPE — script d'animation
//
//  Un script définit un comportement d'animation complet :
//  quelles traces s'allument, avec quelle config, dans quel ordre.
//
//  scriptId       — identifiant unique du script
//  activeTraceIds — liste des traceId à animer
//  startupDelays  — délai de démarrage par trace (secondes)
//                   clé = traceId, valeur = délai
//                   Si un traceId est absent, délai = 0
//  animationConfig — overrides de la config par défaut
//                    (vitesse, durées, intensité…)
//                    Si non fourni, DEFAULT_ANIMATION_CONFIG est utilisé
//
//  Exemples de scripts :
//    'boot-sequence'  — toutes les traces s'allument en cascade
//    'alert-mode'     — traces rouges, vitesse élevée
//    'idle'           — 2 traces lentes, couleur douce
// ─────────────────────────────────────────────────────────
export interface TraceScript {
  scriptId:        string;
  activeTraceIds:  string[];
  startupDelays?: Record<string, { delay: number; startDistance?: number }>;
  animationConfig?: Partial<TraceAnimationConfig>;
}
