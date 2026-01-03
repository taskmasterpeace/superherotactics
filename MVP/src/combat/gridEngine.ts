/**
 * Grid Engine - Headless Grid Combat System
 *
 * Pure TypeScript grid combat engine with:
 * - A* pathfinding
 * - Bresenham LOS
 * - Cover calculation
 * - No Phaser dependencies
 *
 * Target: 500+ battles/sec for batch testing
 */

import { TERRAIN_TYPES, TerrainType } from './terrainTypes';
import { MapTemplate, parseMapLayout, charToTerrain } from '../data/mapTemplates';

// =============================================================================
// TYPES
// =============================================================================

export interface GridTile {
  x: number;
  y: number;
  terrain: TerrainType;
  occupant?: string;  // Unit ID
  durability?: number;  // Wall HP for breakable walls (undefined = indestructible)
}

export interface GridMap {
  width: number;
  height: number;
  tiles: GridTile[][];
  entryPoints: { x: number; y: number; team: 'blue' | 'red' }[];
}

export type CoverType = 'none' | 'half' | 'full';

// =============================================================================
// MAP PARSING
// =============================================================================

/**
 * Parse a MapTemplate into a GridMap
 */
export function parseMapTemplate(template: MapTemplate): GridMap {
  const terrainGrid = parseMapLayout(template.layout);
  const height = terrainGrid.length;
  const width = terrainGrid[0]?.length || 15;

  const tiles: GridTile[][] = [];

  for (let y = 0; y < height; y++) {
    tiles[y] = [];
    for (let x = 0; x < width; x++) {
      const terrain = terrainGrid[y]?.[x] || 'FLOOR';
      const tile: GridTile = {
        x,
        y,
        terrain,
      };

      // Set durability for breakable walls
      if (terrain === 'BREAKABLE_WALL') {
        tile.durability = 50;  // Default durability for breakable walls
      }

      tiles[y][x] = tile;
    }
  }

  return {
    width,
    height,
    tiles,
    entryPoints: [...template.entryPoints],
  };
}

/**
 * Create a simple open map for testing
 */
export function createOpenMap(
  width: number = 15,
  height: number = 15,
  blueCount: number = 3,
  redCount: number = 3
): GridMap {
  const tiles: GridTile[][] = [];

  for (let y = 0; y < height; y++) {
    tiles[y] = [];
    for (let x = 0; x < width; x++) {
      // Border walls
      const isWall = x === 0 || x === width - 1 || y === 0 || y === height - 1;
      tiles[y][x] = {
        x,
        y,
        terrain: isWall ? 'WALL' : 'FLOOR',
      };
    }
  }

  // Generate entry points
  const entryPoints: { x: number; y: number; team: 'blue' | 'red' }[] = [];

  // Blue on left side
  const blueStartY = Math.floor((height - blueCount) / 2);
  for (let i = 0; i < blueCount; i++) {
    entryPoints.push({ x: 1, y: blueStartY + i, team: 'blue' });
  }

  // Red on right side
  const redStartY = Math.floor((height - redCount) / 2);
  for (let i = 0; i < redCount; i++) {
    entryPoints.push({ x: width - 2, y: redStartY + i, team: 'red' });
  }

  return { width, height, tiles, entryPoints };
}

// =============================================================================
// TILE QUERIES
// =============================================================================

/**
 * Get a tile at position (bounds-checked)
 */
export function getTile(map: GridMap, x: number, y: number): GridTile | null {
  if (x < 0 || x >= map.width || y < 0 || y >= map.height) {
    return null;
  }
  return map.tiles[y]?.[x] || null;
}

/**
 * Check if a tile is walkable
 */
export function isWalkable(map: GridMap, x: number, y: number): boolean {
  const tile = getTile(map, x, y);
  if (!tile) return false;
  if (tile.occupant) return false;  // Occupied by unit
  return TERRAIN_TYPES[tile.terrain]?.walkable ?? false;
}

/**
 * Get movement cost for a tile
 */
export function getMoveCost(map: GridMap, x: number, y: number): number {
  const tile = getTile(map, x, y);
  if (!tile) return Infinity;
  if (tile.occupant) return Infinity;
  return TERRAIN_TYPES[tile.terrain]?.moveCost ?? 1;
}

/**
 * Get terrain cover type
 */
export function getTerrainCover(terrain: TerrainType): CoverType {
  const cover = TERRAIN_TYPES[terrain]?.cover;
  if (cover === 'full') return 'full';
  if (cover === 'half') return 'half';
  return 'none';
}

// =============================================================================
// DISTANCE & GEOMETRY
// =============================================================================

/**
 * Euclidean distance between two points
 */
export function gridDistance(
  x1: number, y1: number,
  x2: number, y2: number
): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Manhattan distance (for pathfinding heuristic)
 */
export function manhattanDistance(
  x1: number, y1: number,
  x2: number, y2: number
): number {
  return Math.abs(x2 - x1) + Math.abs(y2 - y1);
}

// =============================================================================
// LINE OF SIGHT (Bresenham)
// =============================================================================

/**
 * Check if there's line of sight between two points
 * Uses Bresenham's line algorithm
 */
export function hasLineOfSight(
  map: GridMap,
  x1: number, y1: number,
  x2: number, y2: number
): boolean {
  if (x1 === x2 && y1 === y2) return true;

  const dx = Math.abs(x2 - x1);
  const dy = Math.abs(y2 - y1);
  const sx = x1 < x2 ? 1 : -1;
  const sy = y1 < y2 ? 1 : -1;
  let err = dx - dy;

  let x = x1;
  let y = y1;

  while (true) {
    // Reached destination
    if (x === x2 && y === y2) return true;

    const tile = getTile(map, x, y);

    // Check for LOS blockers (but not at start/end)
    if (tile) {
      const terrain = tile.terrain;
      if (terrain === 'WALL' || terrain === 'DOOR_CLOSED') {
        // Block unless at start or end position
        if (!(x === x1 && y === y1) && !(x === x2 && y === y2)) {
          return false;
        }
      }
    }

    // Out of bounds = no LOS
    if (x < 0 || x >= map.width || y < 0 || y >= map.height) {
      return false;
    }

    // Bresenham step
    const e2 = 2 * err;
    if (e2 > -dy) {
      err -= dy;
      x += sx;
    }
    if (e2 < dx) {
      err += dx;
      y += sy;
    }
  }
}

// =============================================================================
// COVER CALCULATION
// =============================================================================

/**
 * Get cover at a position relative to an attacker
 * Checks if there's a wall/low wall between attacker and defender
 */
export function getCoverAtPosition(
  map: GridMap,
  defenderX: number, defenderY: number,
  attackerX: number, attackerY: number
): CoverType {
  // Check defender's tile terrain first
  const defenderTile = getTile(map, defenderX, defenderY);
  if (defenderTile) {
    const tileCover = getTerrainCover(defenderTile.terrain);
    if (tileCover !== 'none') {
      return tileCover;
    }
  }

  // Check adjacent tiles for cover (walls between attacker and defender)
  const dx = Math.sign(attackerX - defenderX);
  const dy = Math.sign(attackerY - defenderY);

  // Check tiles in direction of attacker
  const tilesToCheck = [];
  if (dx !== 0) tilesToCheck.push({ x: defenderX + dx, y: defenderY });
  if (dy !== 0) tilesToCheck.push({ x: defenderX, y: defenderY + dy });
  if (dx !== 0 && dy !== 0) tilesToCheck.push({ x: defenderX + dx, y: defenderY + dy });

  let bestCover: CoverType = 'none';

  for (const pos of tilesToCheck) {
    const tile = getTile(map, pos.x, pos.y);
    if (!tile) continue;

    const cover = getTerrainCover(tile.terrain);
    if (cover === 'full') return 'full';
    if (cover === 'half' && bestCover === 'none') {
      bestCover = 'half';
    }
  }

  return bestCover;
}

// =============================================================================
// A* PATHFINDING
// =============================================================================

interface PathNode {
  x: number;
  y: number;
  g: number;  // Cost from start
  h: number;  // Heuristic to goal
  f: number;  // Total cost (g + h)
  parent: PathNode | null;
}

/**
 * Find path from start to goal using A*
 * Returns array of positions or null if no path
 */
export function findPath(
  map: GridMap,
  fromX: number, fromY: number,
  toX: number, toY: number,
  maxCost: number = 100
): { x: number; y: number }[] | null {
  // Can't path to unwalkable tile (unless it's the target for attack)
  // We allow pathing TO an occupied tile (for attack range calculation)

  const openList: PathNode[] = [];
  const closedSet = new Set<string>();

  const startNode: PathNode = {
    x: fromX,
    y: fromY,
    g: 0,
    h: manhattanDistance(fromX, fromY, toX, toY),
    f: 0,
    parent: null,
  };
  startNode.f = startNode.g + startNode.h;
  openList.push(startNode);

  const key = (x: number, y: number) => `${x},${y}`;

  while (openList.length > 0) {
    // Get node with lowest f score
    openList.sort((a, b) => a.f - b.f);
    const current = openList.shift()!;

    // Reached goal
    if (current.x === toX && current.y === toY) {
      // Reconstruct path
      const path: { x: number; y: number }[] = [];
      let node: PathNode | null = current;
      while (node) {
        path.unshift({ x: node.x, y: node.y });
        node = node.parent;
      }
      return path;
    }

    closedSet.add(key(current.x, current.y));

    // Check neighbors (4-directional)
    const neighbors = [
      { x: current.x - 1, y: current.y },
      { x: current.x + 1, y: current.y },
      { x: current.x, y: current.y - 1 },
      { x: current.x, y: current.y + 1 },
      // Diagonal movement
      { x: current.x - 1, y: current.y - 1 },
      { x: current.x + 1, y: current.y - 1 },
      { x: current.x - 1, y: current.y + 1 },
      { x: current.x + 1, y: current.y + 1 },
    ];

    for (const neighbor of neighbors) {
      const { x, y } = neighbor;

      // Skip if already evaluated
      if (closedSet.has(key(x, y))) continue;

      // Skip if not walkable (unless it's the goal)
      const isGoal = x === toX && y === toY;
      if (!isGoal && !isWalkable(map, x, y)) continue;

      // Calculate costs
      const isDiagonal = neighbor.x !== current.x && neighbor.y !== current.y;
      const moveCost = getMoveCost(map, x, y);
      const stepCost = isDiagonal ? moveCost * 1.414 : moveCost;
      const g = current.g + stepCost;

      // Skip if too expensive
      if (g > maxCost) continue;

      // Check if this path is better than any existing
      const existing = openList.find(n => n.x === x && n.y === y);
      if (existing && existing.g <= g) continue;

      const h = manhattanDistance(x, y, toX, toY);
      const newNode: PathNode = {
        x,
        y,
        g,
        h,
        f: g + h,
        parent: current,
      };

      if (existing) {
        // Update existing node
        existing.g = g;
        existing.f = g + h;
        existing.parent = current;
      } else {
        openList.push(newNode);
      }
    }
  }

  // No path found
  return null;
}

/**
 * Get all tiles reachable within a movement budget
 */
export function getReachableTiles(
  map: GridMap,
  fromX: number, fromY: number,
  maxCost: number
): { x: number; y: number; cost: number }[] {
  const reachable: { x: number; y: number; cost: number }[] = [];
  const visited = new Map<string, number>();
  const queue: { x: number; y: number; cost: number }[] = [{ x: fromX, y: fromY, cost: 0 }];

  const key = (x: number, y: number) => `${x},${y}`;

  while (queue.length > 0) {
    const current = queue.shift()!;
    const k = key(current.x, current.y);

    if (visited.has(k) && visited.get(k)! <= current.cost) continue;
    visited.set(k, current.cost);

    if (current.x !== fromX || current.y !== fromY) {
      reachable.push(current);
    }

    // Check neighbors
    const neighbors = [
      { x: current.x - 1, y: current.y },
      { x: current.x + 1, y: current.y },
      { x: current.x, y: current.y - 1 },
      { x: current.x, y: current.y + 1 },
    ];

    for (const neighbor of neighbors) {
      if (!isWalkable(map, neighbor.x, neighbor.y)) continue;

      const moveCost = getMoveCost(map, neighbor.x, neighbor.y);
      const newCost = current.cost + moveCost;

      if (newCost <= maxCost) {
        queue.push({ x: neighbor.x, y: neighbor.y, cost: newCost });
      }
    }
  }

  return reachable;
}

// =============================================================================
// UNIT PLACEMENT
// =============================================================================

/**
 * Place a unit on the map
 */
export function placeUnit(map: GridMap, unitId: string, x: number, y: number): boolean {
  const tile = getTile(map, x, y);
  if (!tile) return false;
  if (tile.occupant) return false;
  if (!TERRAIN_TYPES[tile.terrain]?.walkable) return false;

  tile.occupant = unitId;
  return true;
}

/**
 * Remove a unit from the map
 */
export function removeUnit(map: GridMap, unitId: string): boolean {
  for (let y = 0; y < map.height; y++) {
    for (let x = 0; x < map.width; x++) {
      const tile = map.tiles[y]?.[x];
      if (tile?.occupant === unitId) {
        tile.occupant = undefined;
        return true;
      }
    }
  }
  return false;
}

/**
 * Move a unit from one tile to another
 */
export function moveUnit(
  map: GridMap,
  unitId: string,
  toX: number, toY: number
): boolean {
  const toTile = getTile(map, toX, toY);
  if (!toTile) return false;
  if (toTile.occupant && toTile.occupant !== unitId) return false;
  if (!TERRAIN_TYPES[toTile.terrain]?.walkable) return false;

  // Remove from old position
  removeUnit(map, unitId);

  // Place at new position
  toTile.occupant = unitId;
  return true;
}

/**
 * Find unit position on map
 */
export function findUnitPosition(map: GridMap, unitId: string): { x: number; y: number } | null {
  for (let y = 0; y < map.height; y++) {
    for (let x = 0; x < map.width; x++) {
      if (map.tiles[y]?.[x]?.occupant === unitId) {
        return { x, y };
      }
    }
  }
  return null;
}

// =============================================================================
// WALL DESTRUCTION (Breaching)
// =============================================================================

/**
 * Check if a tile is breakable (has durability)
 */
export function isBreakable(map: GridMap, x: number, y: number): boolean {
  const tile = getTile(map, x, y);
  if (!tile) return false;
  return tile.durability !== undefined && tile.durability > 0;
}

/**
 * Damage a wall tile. Returns true if wall was destroyed.
 */
export function damageWall(map: GridMap, x: number, y: number, damage: number): boolean {
  const tile = getTile(map, x, y);
  if (!tile || tile.durability === undefined) return false;

  tile.durability = Math.max(0, tile.durability - damage);

  if (tile.durability <= 0) {
    // Wall destroyed - convert to rubble
    tile.terrain = 'RUBBLE';
    tile.durability = undefined;
    return true;
  }

  return false;
}

/**
 * Destroy a wall immediately (convert to rubble)
 */
export function destroyWall(map: GridMap, x: number, y: number): boolean {
  const tile = getTile(map, x, y);
  if (!tile) return false;

  // Only destroy walls or breakable walls
  if (tile.terrain !== 'WALL' && tile.terrain !== 'BREAKABLE_WALL') return false;

  tile.terrain = 'RUBBLE';
  tile.durability = undefined;
  return true;
}

/**
 * Get adjacent tiles (4-directional + diagonals)
 */
export function getAdjacentTiles(map: GridMap, x: number, y: number): GridTile[] {
  const adjacent: GridTile[] = [];
  const offsets = [
    { dx: -1, dy: 0 }, { dx: 1, dy: 0 },
    { dx: 0, dy: -1 }, { dx: 0, dy: 1 },
    { dx: -1, dy: -1 }, { dx: 1, dy: -1 },
    { dx: -1, dy: 1 }, { dx: 1, dy: 1 },
  ];

  for (const { dx, dy } of offsets) {
    const tile = getTile(map, x + dx, y + dy);
    if (tile) adjacent.push(tile);
  }

  return adjacent;
}

// =============================================================================
// EXPORTS
// =============================================================================

export default {
  parseMapTemplate,
  createOpenMap,
  getTile,
  isWalkable,
  getMoveCost,
  gridDistance,
  manhattanDistance,
  hasLineOfSight,
  getCoverAtPosition,
  findPath,
  getReachableTiles,
  placeUnit,
  removeUnit,
  moveUnit,
  findUnitPosition,
  // Breaching
  isBreakable,
  damageWall,
  destroyWall,
  getAdjacentTiles,
};
