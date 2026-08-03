// ═══════════════════════════════════════════════════════════════
//  BOARD CONSTANTS
//
//  Constantes géométriques partagées entre buildBoard.ts
//  et animatedTrace.ts. Source unique de vérité — modifier
//  ici suffit pour impacter toute la scène.
// ═══════════════════════════════════════════════════════════════

export const BOARD_HEIGHT = 0.10;
export const BOARD_SURFACE = BOARD_HEIGHT / 2;   // niveau Y de la surface du board

export const GRID_UNIT    = 1.9;                 // taille d'une case en unités monde
export const TRACE_WIDTH  = 0.22;                // largeur d'une trace PCB

// Hauteur Y du centre du filament — légèrement au-dessus du board
export const FILAMENT_Y   = BOARD_SURFACE + TRACE_WIDTH * 0.5;

export const toWorldX = (gridCoord: number) => gridCoord * GRID_UNIT;
export const toWorldZ = (gridCoord: number) => gridCoord * GRID_UNIT;
