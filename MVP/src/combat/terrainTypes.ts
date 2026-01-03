/**
 * Terrain Types - Headless terrain definitions
 *
 * NO Phaser dependencies - used by both simulator and CombatScene.
 * CombatScene should import from here, not from game/config.
 */

// Terrain types for combat grid
export const TERRAIN_TYPES = {
  FLOOR: { walkable: true, cover: 'none', moveCost: 1 },
  GRASS: { walkable: true, cover: 'none', moveCost: 1 },
  CONCRETE: { walkable: true, cover: 'none', moveCost: 1 },
  WATER: { walkable: false, cover: 'none', moveCost: 3 },
  WALL: { walkable: false, cover: 'full', moveCost: Infinity },
  LOW_WALL: { walkable: true, cover: 'half', moveCost: 2 },
  DOOR_CLOSED: { walkable: false, cover: 'full', moveCost: 1 },
  DOOR_OPEN: { walkable: true, cover: 'none', moveCost: 1 },
  // Breaching terrain
  RUBBLE: { walkable: true, cover: 'half', moveCost: 1.5 },  // Destroyed wall debris
  BREAKABLE_WALL: { walkable: false, cover: 'full', moveCost: Infinity },  // Can be breached
} as const;

export type TerrainType = keyof typeof TERRAIN_TYPES;
