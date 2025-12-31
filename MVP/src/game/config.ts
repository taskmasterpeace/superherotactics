/**
 * Phaser 3 Configuration for SHT Combat Lab
 */

import Phaser from 'phaser';
import { CombatScene } from './scenes/CombatScene';
import { PreloadScene } from './scenes/PreloadScene';

// Isometric tile dimensions (2:1 ratio for standard isometric view)
export const TILE_WIDTH = 128;   // Width of diamond tile
export const TILE_HEIGHT = 64;   // Height of diamond tile
export const TILE_SIZE = 64;     // Legacy - used for unit sizing
export const MAP_WIDTH = 15;     // Reduced for better isometric view
export const MAP_HEIGHT = 15;

// Isometric coordinate conversion functions
export function gridToScreen(gridX: number, gridY: number, offsetX: number = 0, offsetY: number = 0) {
  const screenX = (gridX - gridY) * (TILE_WIDTH / 2) + offsetX;
  const screenY = (gridX + gridY) * (TILE_HEIGHT / 2) + offsetY;
  return { x: screenX, y: screenY };
}

export function screenToGrid(screenX: number, screenY: number, offsetX: number = 0, offsetY: number = 0) {
  const relX = screenX - offsetX;
  const relY = screenY - offsetY;
  const gridX = Math.floor((relX / (TILE_WIDTH / 2) + relY / (TILE_HEIGHT / 2)) / 2);
  const gridY = Math.floor((relY / (TILE_HEIGHT / 2) - relX / (TILE_WIDTH / 2)) / 2);
  return { x: gridX, y: gridY };
}

// Calculate depth for sorting (tiles further back render first)
export function getIsoDepth(gridX: number, gridY: number): number {
  return gridX + gridY;
}

export const createGameConfig = (
  parent: string | HTMLElement,
  width: number = 800,
  height: number = 600
): Phaser.Types.Core.GameConfig => {
  return {
    type: Phaser.AUTO,
    parent,
    width,
    height,
    backgroundColor: '#1a1a2e',
    scene: [PreloadScene, CombatScene],
    physics: {
      default: 'arcade',
      arcade: {
        debug: false,
      },
    },
    scale: {
      mode: Phaser.Scale.RESIZE,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    render: {
      pixelArt: false,
      antialias: true,
    },
  };
};

// Color palette matching Combat_UI_Spec.md
export const COLORS = {
  // Backgrounds
  BG_DARK: 0x1a1a2e,
  BG_PANEL: 0x16213e,
  BG_BUTTON: 0x2a4a6a,
  BG_HOVER: 0x3a5a7a,

  // Team Colors
  TEAM_BLUE: 0x4a90d9,
  TEAM_RED: 0xd94a4a,
  TEAM_GREEN: 0x4ad94a,

  // Status Colors
  HEALTH_FULL: 0x4ad94a,
  HEALTH_HALF: 0xd9d94a,
  HEALTH_LOW: 0xd94a4a,
  SHIELD_FULL: 0x00ffff,  // Cyan shield bar
  SHIELD_LOW: 0x0088aa,   // Darker when low

  // UI Colors
  BORDER: 0x4a4a6a,
  TEXT_PRIMARY: 0xffffff,
  TEXT_SECONDARY: 0xaaaaaa,
  TEXT_DISABLED: 0x666666,

  // Action Colors
  ACTION_ATTACK: 0xd94a4a,
  ACTION_MOVE: 0x4a90d9,
  ACTION_THROW: 0xd9944a,
  ACTION_GADGET: 0x9444d9,

  // Terrain
  TERRAIN_GRASS: 0x2d5a27,
  TERRAIN_CONCRETE: 0x555555,
  TERRAIN_WATER: 0x2a4a6a,
  TERRAIN_WALL: 0x333333,

  // Grid
  GRID_LINE: 0x4a4a6a,
  GRID_HIGHLIGHT: 0xffffff,
  MOVEMENT_RANGE: 0x4a90d9,
  ATTACK_RANGE: 0xd94a4a,
  THROW_ARC: 0xd9944a,
  BLAST_RADIUS: 0xd9944a,
};

// Terrain types
export const TERRAIN_TYPES = {
  FLOOR: { walkable: true, cover: 'none', moveCost: 1 },
  GRASS: { walkable: true, cover: 'none', moveCost: 1 },
  CONCRETE: { walkable: true, cover: 'none', moveCost: 1 },
  WATER: { walkable: false, cover: 'none', moveCost: 3 },
  WALL: { walkable: false, cover: 'full', moveCost: Infinity },
  LOW_WALL: { walkable: true, cover: 'half', moveCost: 2 },
  DOOR_CLOSED: { walkable: false, cover: 'full', moveCost: 1 },
  DOOR_OPEN: { walkable: true, cover: 'none', moveCost: 1 },
} as const;

export type TerrainType = keyof typeof TERRAIN_TYPES;

export default createGameConfig;
