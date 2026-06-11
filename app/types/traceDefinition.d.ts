// ─────────────────────────────────────────────────────────
//  TYPE — définition d'une trace individuelle
//
//  traceId         — identifiant unique, utilisé par les scripts
//                    pour référencer la trace
//  waypointsInGrid — points de passage en coordonnées de grille
//                    (même repère que buildBoard.ts)
//  glowColor       — couleur glow de la trace
//
//  Note : startupDelay a été déplacé dans TraceScript.startupDelays
//         car il dépend du script, pas de la trace elle-même.
// ─────────────────────────────────────────────────────────
export interface TraceDefinition {
  traceId:         string;
  waypointsInGrid: [number, number][];
  glowColor:       number;   // hex color ex: 0x00eeff
}
