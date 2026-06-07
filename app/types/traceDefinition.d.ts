// ─────────────────────────────────────────────────────────
//  TYPE — définition d'une trace individuelle
//
//  traceId       — identifiant unique, utilisé par les scripts
//                  pour référencer la trace
//  waypointsInGrid — points de passage en coordonnées de grille
//                  (même repère que buildBoard.ts)
//  glowColor     — couleur glow de la trace
//  startupDelay  — délai avant le premier départ (secondes)
//                  permet d'échelonner les traces d'un même script
// ─────────────────────────────────────────────────────────
export interface TraceDefinition {
  traceId:         string;
  waypointsInGrid: [number, number][];
  glowColor:       number;             // hex color ex: 0x00eeff
  startupDelay:    number;
}
