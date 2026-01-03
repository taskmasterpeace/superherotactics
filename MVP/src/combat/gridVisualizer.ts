/**
 * Grid Visualizer - ASCII Grid Visualization
 *
 * Print combat grids as ASCII art for debugging and testing.
 * Shows terrain, unit positions, and cover.
 */

import { GridMap, GridTile } from './gridEngine';
import { SimUnit } from './types';

// Terrain to character mapping
const TERRAIN_CHARS: Record<string, string> = {
  FLOOR: '.',
  GRASS: ',',
  CONCRETE: ':',
  WATER: '~',
  WALL: '#',
  LOW_WALL: 'L',
  DOOR_CLOSED: '+',
  DOOR_OPEN: '-',
};

/**
 * Convert terrain type to display character
 */
function terrainToChar(terrain: string): string {
  return TERRAIN_CHARS[terrain] || '.';
}

/**
 * Print a GridMap as ASCII with optional unit positions.
 * Blue units show as 1-9, A-Z
 * Red units show as a-z
 */
export function printGrid(
  map: GridMap,
  blueUnits: SimUnit[] = [],
  redUnits: SimUnit[] = []
): string {
  const lines: string[] = [];

  // Create position lookup
  const unitPositions = new Map<string, { unit: SimUnit; team: 'blue' | 'red'; index: number }>();

  blueUnits.forEach((unit, i) => {
    if (unit.position) {
      const key = `${unit.position.x},${unit.position.y}`;
      unitPositions.set(key, { unit, team: 'blue', index: i });
    }
  });

  redUnits.forEach((unit, i) => {
    if (unit.position) {
      const key = `${unit.position.x},${unit.position.y}`;
      unitPositions.set(key, { unit, team: 'red', index: i });
    }
  });

  // Print grid
  for (let y = 0; y < map.height; y++) {
    let line = '';
    for (let x = 0; x < map.width; x++) {
      const tile = map.tiles[y]?.[x];
      const key = `${x},${y}`;
      const unitData = unitPositions.get(key);

      if (unitData) {
        // Show unit
        if (unitData.team === 'blue') {
          // Blue: 1-9, then A-Z
          line += unitData.index < 9
            ? String(unitData.index + 1)
            : String.fromCharCode(65 + unitData.index - 9);
        } else {
          // Red: a-z
          line += String.fromCharCode(97 + unitData.index);
        }
      } else if (tile) {
        line += terrainToChar(tile.terrain);
      } else {
        line += '?';
      }
    }
    lines.push(line);
  }

  return lines.join('\n');
}

/**
 * Print grid with header info and legend
 */
export function printGridWithInfo(
  map: GridMap,
  blueUnits: SimUnit[] = [],
  redUnits: SimUnit[] = [],
  title?: string
): string {
  const parts: string[] = [];

  if (title) {
    parts.push(`=== ${title} ===`);
  }

  parts.push(`Map: ${map.width}x${map.height}`);
  parts.push('');
  parts.push(printGrid(map, blueUnits, redUnits));
  parts.push('');
  parts.push('Legend: #=Wall L=Cover .=Floor +=Door ~=Water');
  parts.push(`        1-9,A-Z=Blue  a-z=Red`);

  // List units
  if (blueUnits.length > 0) {
    parts.push('');
    parts.push('Blue Team:');
    blueUnits.forEach((unit, i) => {
      const marker = i < 9 ? String(i + 1) : String.fromCharCode(65 + i - 9);
      const pos = unit.position ? `(${unit.position.x},${unit.position.y})` : '(no pos)';
      const hp = `${unit.hp}/${unit.maxHp}HP`;
      parts.push(`  ${marker}: ${unit.name || unit.id} ${pos} ${hp}`);
    });
  }

  if (redUnits.length > 0) {
    parts.push('');
    parts.push('Red Team:');
    redUnits.forEach((unit, i) => {
      const marker = String.fromCharCode(97 + i);
      const pos = unit.position ? `(${unit.position.x},${unit.position.y})` : '(no pos)';
      const hp = `${unit.hp}/${unit.maxHp}HP`;
      parts.push(`  ${marker}: ${unit.name || unit.id} ${pos} ${hp}`);
    });
  }

  return parts.join('\n');
}

/**
 * Print just the map template without units
 */
export function printEmptyGrid(map: GridMap, title?: string): string {
  const parts: string[] = [];

  if (title) {
    parts.push(`=== ${title} ===`);
  }

  for (let y = 0; y < map.height; y++) {
    let line = '';
    for (let x = 0; x < map.width; x++) {
      const tile = map.tiles[y]?.[x];
      line += tile ? terrainToChar(tile.terrain) : '?';
    }
    parts.push(line);
  }

  return parts.join('\n');
}

/**
 * Get a compact summary of the grid for logging
 */
export function getGridSummary(map: GridMap): string {
  let walls = 0;
  let cover = 0;
  let floor = 0;
  let doors = 0;

  for (let y = 0; y < map.height; y++) {
    for (let x = 0; x < map.width; x++) {
      const tile = map.tiles[y]?.[x];
      if (!tile) continue;

      switch (tile.terrain) {
        case 'WALL': walls++; break;
        case 'LOW_WALL': cover++; break;
        case 'DOOR_OPEN':
        case 'DOOR_CLOSED': doors++; break;
        default: floor++;
      }
    }
  }

  return `${map.width}x${map.height} - Floor:${floor} Walls:${walls} Cover:${cover} Doors:${doors}`;
}

export {
  printGrid as default,
};
