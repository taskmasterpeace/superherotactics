/**
 * Map Generator - Procedural and Template-Based Maps
 *
 * Supports:
 * - Loading existing 18 map templates
 * - Generating procedural maps of various sizes
 * - Quick maps for batch testing
 */

import { MAP_TEMPLATES, MapTemplate } from '../data/mapTemplates';
import { GridMap, GridTile, parseMapTemplate, createOpenMap } from './gridEngine';

// =============================================================================
// TYPES
// =============================================================================

export type MapSize = 'small' | 'medium' | 'large';  // 10x10, 15x15, 20x20
export type MapTerrain = 'open' | 'urban' | 'indoor';

export interface MapConfig {
  size: MapSize;
  terrain: MapTerrain;
  coverDensity: number;  // 0-1, how many obstacles to place
}

const SIZE_DIMENSIONS: Record<MapSize, { width: number; height: number }> = {
  small: { width: 10, height: 10 },
  medium: { width: 15, height: 15 },
  large: { width: 20, height: 20 },
};

// =============================================================================
// TEMPLATE LOADING
// =============================================================================

/**
 * Get a map template by ID
 */
export function getTemplateById(templateId: string): MapTemplate | null {
  return MAP_TEMPLATES.find(t => t.id === templateId) || null;
}

/**
 * Load a template as a GridMap
 */
export function loadMapTemplate(templateId: string): GridMap | null {
  const template = getTemplateById(templateId);
  if (!template) return null;
  return parseMapTemplate(template);
}

/**
 * Get a random template for a city type
 */
export function getRandomTemplateForCity(cityType: string): GridMap {
  const matching = MAP_TEMPLATES.filter(t => t.cityTypes.includes(cityType));
  const template = matching.length > 0
    ? matching[Math.floor(Math.random() * matching.length)]
    : MAP_TEMPLATES[0];  // Fallback to first template

  return parseMapTemplate(template);
}

/**
 * Get all available template IDs
 */
export function getTemplateIds(): string[] {
  return MAP_TEMPLATES.map(t => t.id);
}

// =============================================================================
// PROCEDURAL GENERATION
// =============================================================================

/**
 * Generate a procedural map with given config
 */
export function generateMap(config: MapConfig): GridMap {
  const { width, height } = SIZE_DIMENSIONS[config.size];
  const tiles: GridTile[][] = [];

  // Initialize with floor, walls on border
  for (let y = 0; y < height; y++) {
    tiles[y] = [];
    for (let x = 0; x < width; x++) {
      const isWall = x === 0 || x === width - 1 || y === 0 || y === height - 1;
      tiles[y][x] = {
        x,
        y,
        terrain: isWall ? 'WALL' : 'FLOOR',
      };
    }
  }

  // Add cover based on terrain type
  const coverCount = Math.floor((width * height) * config.coverDensity * 0.1);

  if (config.terrain === 'urban') {
    // Urban: walls and low walls in grid pattern
    addUrbanCover(tiles, width, height, coverCount);
  } else if (config.terrain === 'indoor') {
    // Indoor: rooms with doors
    addIndoorCover(tiles, width, height, coverCount);
  } else {
    // Open: scattered low walls
    addOpenCover(tiles, width, height, coverCount);
  }

  // Generate entry points (3 per team minimum)
  const entryPoints: { x: number; y: number; team: 'blue' | 'red' }[] = [];

  // Blue on left side
  const blueSpacing = Math.floor((height - 4) / 3);
  for (let i = 0; i < 3; i++) {
    const y = 2 + i * blueSpacing;
    if (y < height - 1) {
      entryPoints.push({ x: 1, y, team: 'blue' });
      tiles[y][1].terrain = 'FLOOR';  // Ensure walkable
    }
  }

  // Red on right side
  const redSpacing = Math.floor((height - 4) / 3);
  for (let i = 0; i < 3; i++) {
    const y = 2 + i * redSpacing;
    if (y < height - 1) {
      entryPoints.push({ x: width - 2, y, team: 'red' });
      tiles[y][width - 2].terrain = 'FLOOR';  // Ensure walkable
    }
  }

  return { width, height, tiles, entryPoints };
}

/**
 * Add urban-style cover (walls, buildings)
 */
function addUrbanCover(
  tiles: GridTile[][],
  width: number,
  height: number,
  coverCount: number
): void {
  // Add some wall clusters
  const clusterCount = Math.floor(coverCount / 5);

  for (let i = 0; i < clusterCount; i++) {
    const cx = 3 + Math.floor(Math.random() * (width - 6));
    const cy = 3 + Math.floor(Math.random() * (height - 6));
    const clusterSize = 2 + Math.floor(Math.random() * 2);

    // Create small wall cluster
    for (let dy = 0; dy < clusterSize; dy++) {
      for (let dx = 0; dx < clusterSize; dx++) {
        const x = cx + dx;
        const y = cy + dy;
        if (x > 0 && x < width - 1 && y > 0 && y < height - 1) {
          // Perimeter is wall, interior might be floor
          if (dx === 0 || dx === clusterSize - 1 || dy === 0 || dy === clusterSize - 1) {
            tiles[y][x].terrain = 'WALL';
          }
        }
      }
    }

    // Add door on one side
    const doorSide = Math.floor(Math.random() * 4);
    if (doorSide === 0 && cy > 1) tiles[cy][cx + Math.floor(clusterSize / 2)].terrain = 'DOOR_OPEN';
    if (doorSide === 1 && cy + clusterSize < height - 1) tiles[cy + clusterSize - 1][cx + Math.floor(clusterSize / 2)].terrain = 'DOOR_OPEN';
    if (doorSide === 2 && cx > 1) tiles[cy + Math.floor(clusterSize / 2)][cx].terrain = 'DOOR_OPEN';
    if (doorSide === 3 && cx + clusterSize < width - 1) tiles[cy + Math.floor(clusterSize / 2)][cx + clusterSize - 1].terrain = 'DOOR_OPEN';
  }

  // Add scattered low walls
  for (let i = 0; i < coverCount; i++) {
    const x = 2 + Math.floor(Math.random() * (width - 4));
    const y = 2 + Math.floor(Math.random() * (height - 4));
    if (tiles[y][x].terrain === 'FLOOR') {
      tiles[y][x].terrain = 'LOW_WALL';
    }
  }
}

/**
 * Add indoor-style cover (rooms, corridors)
 */
function addIndoorCover(
  tiles: GridTile[][],
  width: number,
  height: number,
  coverCount: number
): void {
  // Create a center corridor
  const corridorY = Math.floor(height / 2);
  for (let x = 1; x < width - 1; x++) {
    tiles[corridorY][x].terrain = 'FLOOR';
    if (corridorY > 1) tiles[corridorY - 1][x].terrain = 'FLOOR';
    if (corridorY < height - 2) tiles[corridorY + 1][x].terrain = 'FLOOR';
  }

  // Add rooms on top and bottom
  const roomWidth = 4;
  const roomsPerSide = Math.floor((width - 4) / (roomWidth + 1));

  for (let r = 0; r < roomsPerSide; r++) {
    const rx = 2 + r * (roomWidth + 1);

    // Top room
    if (corridorY > roomWidth + 1) {
      for (let dy = 1; dy < roomWidth; dy++) {
        tiles[dy][rx].terrain = 'WALL';
        tiles[dy][rx + roomWidth - 1].terrain = 'WALL';
      }
      for (let dx = 0; dx < roomWidth; dx++) {
        tiles[roomWidth][rx + dx].terrain = 'WALL';
      }
      tiles[roomWidth][rx + Math.floor(roomWidth / 2)].terrain = 'DOOR_OPEN';
    }

    // Bottom room
    if (height - corridorY > roomWidth + 1) {
      const baseY = height - roomWidth - 1;
      for (let dy = 0; dy < roomWidth - 1; dy++) {
        tiles[baseY + dy][rx].terrain = 'WALL';
        tiles[baseY + dy][rx + roomWidth - 1].terrain = 'WALL';
      }
      for (let dx = 0; dx < roomWidth; dx++) {
        tiles[baseY - 1][rx + dx].terrain = 'WALL';
      }
      tiles[baseY - 1][rx + Math.floor(roomWidth / 2)].terrain = 'DOOR_OPEN';
    }
  }

  // Add low walls for cover
  for (let i = 0; i < coverCount / 2; i++) {
    const x = 2 + Math.floor(Math.random() * (width - 4));
    const y = corridorY - 1 + Math.floor(Math.random() * 3);
    if (tiles[y]?.[x]?.terrain === 'FLOOR') {
      tiles[y][x].terrain = 'LOW_WALL';
    }
  }
}

/**
 * Add open-style cover (scattered obstacles)
 */
function addOpenCover(
  tiles: GridTile[][],
  width: number,
  height: number,
  coverCount: number
): void {
  // Just scatter low walls
  for (let i = 0; i < coverCount; i++) {
    const x = 2 + Math.floor(Math.random() * (width - 4));
    const y = 2 + Math.floor(Math.random() * (height - 4));
    if (tiles[y][x].terrain === 'FLOOR') {
      tiles[y][x].terrain = 'LOW_WALL';
    }
  }

  // Add a few wall clusters for cover
  const clusterCount = Math.floor(coverCount / 8);
  for (let i = 0; i < clusterCount; i++) {
    const cx = 4 + Math.floor(Math.random() * (width - 8));
    const cy = 4 + Math.floor(Math.random() * (height - 8));

    // Small L-shaped wall
    tiles[cy][cx].terrain = 'WALL';
    tiles[cy][cx + 1].terrain = 'WALL';
    tiles[cy + 1][cx].terrain = 'WALL';
  }
}

// =============================================================================
// QUICK MAPS FOR BATCH TESTING
// =============================================================================

/**
 * Generate a quick map for batch testing
 * Optimized for speed, minimal procedural generation
 */
export function generateQuickMap(
  blueCount: number = 3,
  redCount: number = 3,
  terrain: MapTerrain = 'open'
): GridMap {
  // Use a size appropriate for the number of units
  const maxUnits = Math.max(blueCount, redCount);
  const size = maxUnits <= 3 ? 10 : maxUnits <= 5 ? 15 : 20;

  const tiles: GridTile[][] = [];

  for (let y = 0; y < size; y++) {
    tiles[y] = [];
    for (let x = 0; x < size; x++) {
      const isWall = x === 0 || x === size - 1 || y === 0 || y === size - 1;
      tiles[y][x] = {
        x,
        y,
        terrain: isWall ? 'WALL' : 'FLOOR',
      };
    }
  }

  // Add minimal cover for non-open terrain
  if (terrain === 'urban') {
    // Center obstacles
    const mid = Math.floor(size / 2);
    tiles[mid][mid].terrain = 'LOW_WALL';
    tiles[mid - 1][mid].terrain = 'LOW_WALL';
    tiles[mid + 1][mid].terrain = 'LOW_WALL';
    tiles[mid][mid - 1].terrain = 'LOW_WALL';
    tiles[mid][mid + 1].terrain = 'LOW_WALL';
  } else if (terrain === 'indoor') {
    // Center wall with gap
    const mid = Math.floor(size / 2);
    for (let y = 2; y < size - 2; y++) {
      if (y !== mid) {
        tiles[y][mid].terrain = 'WALL';
      }
    }
  }

  // Entry points
  const entryPoints: { x: number; y: number; team: 'blue' | 'red' }[] = [];

  // Blue on left
  const blueSpacing = Math.max(1, Math.floor((size - 4) / blueCount));
  for (let i = 0; i < blueCount; i++) {
    const y = 2 + i * blueSpacing;
    if (y < size - 1) {
      entryPoints.push({ x: 1, y, team: 'blue' });
    }
  }

  // Red on right
  const redSpacing = Math.max(1, Math.floor((size - 4) / redCount));
  for (let i = 0; i < redCount; i++) {
    const y = 2 + i * redSpacing;
    if (y < size - 1) {
      entryPoints.push({ x: size - 2, y, team: 'red' });
    }
  }

  return { width: size, height: size, tiles, entryPoints };
}

// =============================================================================
// EXPORTS
// =============================================================================

export default {
  getTemplateById,
  loadMapTemplate,
  getRandomTemplateForCity,
  getTemplateIds,
  generateMap,
  generateQuickMap,
};
