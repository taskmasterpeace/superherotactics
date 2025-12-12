/**
 * Globe Travel System
 *
 * The world map is flat but represents a globe.
 * - Horizontal wrapping: Right edge connects to left edge
 * - Vertical consideration: Top/bottom are poles (no wrapping but shorter distances)
 *
 * Map grid: 20 columns (A-T) x 10 rows (1-10)
 * - Column A connects to Column T (horizontal wrap)
 * - Rows 1 and 10 are polar regions (colder, harder to traverse)
 */

// =============================================================================
// CONSTANTS
// =============================================================================

export const MAP_COLUMNS = 20;  // A-T
export const MAP_ROWS = 10;     // 1-10

// Hours per sector of travel (base, modified by vehicle/powers)
export const BASE_HOURS_PER_SECTOR = 6;

// Polar regions have travel penalties
export const POLAR_ROWS = [1, 10];
export const POLAR_TRAVEL_MULTIPLIER = 1.5;

// =============================================================================
// COORDINATE HELPERS
// =============================================================================

/**
 * Convert sector code to coordinates
 * "K5" -> { col: 10, row: 5 }
 */
export function sectorToCoords(sector: string): { col: number; row: number } {
  const col = sector.charCodeAt(0) - 65;  // A=0, B=1, ..., T=19
  const row = parseInt(sector.slice(1), 10);
  return { col, row };
}

/**
 * Convert coordinates to sector code
 * { col: 10, row: 5 } -> "K5"
 */
export function coordsToSector(col: number, row: number): string {
  // Wrap column
  const wrappedCol = ((col % MAP_COLUMNS) + MAP_COLUMNS) % MAP_COLUMNS;
  // Clamp row (no vertical wrapping)
  const clampedRow = Math.max(1, Math.min(MAP_ROWS, row));
  return String.fromCharCode(65 + wrappedCol) + clampedRow;
}

// =============================================================================
// DISTANCE CALCULATION WITH GLOBE WRAPPING
// =============================================================================

/**
 * Calculate the shortest distance between two sectors considering globe wrapping
 */
export function calculateGlobeDistance(from: string, to: string): {
  distance: number;
  direction: 'direct' | 'wrap_east' | 'wrap_west';
  path: string[];
  estimatedHours: number;
} {
  const fromCoords = sectorToCoords(from);
  const toCoords = sectorToCoords(to);

  // Calculate horizontal distances (direct and wrapped)
  const directColDist = Math.abs(toCoords.col - fromCoords.col);
  const wrapColDist = MAP_COLUMNS - directColDist;

  // Determine which way is shorter
  let horizontalDist: number;
  let direction: 'direct' | 'wrap_east' | 'wrap_west';
  let horizontalStep: number;

  if (directColDist <= wrapColDist) {
    // Direct path is shorter
    horizontalDist = directColDist;
    direction = 'direct';
    horizontalStep = toCoords.col > fromCoords.col ? 1 : (toCoords.col < fromCoords.col ? -1 : 0);
  } else {
    // Wrapping is shorter
    horizontalDist = wrapColDist;
    // If destination is to the east (higher col), wrap west (go negative)
    // If destination is to the west (lower col), wrap east (go positive)
    if (toCoords.col > fromCoords.col) {
      direction = 'wrap_west';
      horizontalStep = -1;  // Go west (left), will wrap to east side
    } else {
      direction = 'wrap_east';
      horizontalStep = 1;   // Go east (right), will wrap to west side
    }
  }

  // Vertical distance (no wrapping)
  const verticalDist = Math.abs(toCoords.row - fromCoords.row);
  const verticalStep = toCoords.row > fromCoords.row ? 1 : (toCoords.row < fromCoords.row ? -1 : 0);

  // Total distance (Manhattan for grid-based)
  const totalDistance = horizontalDist + verticalDist;

  // Generate path
  const path = generatePath(fromCoords, toCoords, horizontalStep, verticalStep, horizontalDist, verticalDist);

  // Calculate travel time (with polar penalty)
  let estimatedHours = 0;
  for (const sector of path) {
    const coords = sectorToCoords(sector);
    const baseTime = BASE_HOURS_PER_SECTOR;
    const polarMod = POLAR_ROWS.includes(coords.row) ? POLAR_TRAVEL_MULTIPLIER : 1;
    estimatedHours += baseTime * polarMod;
  }

  return {
    distance: totalDistance,
    direction,
    path,
    estimatedHours,
  };
}

/**
 * Generate the actual path of sectors to traverse
 */
function generatePath(
  from: { col: number; row: number },
  to: { col: number; row: number },
  hStep: number,
  vStep: number,
  hDist: number,
  vDist: number
): string[] {
  const path: string[] = [];
  let currentCol = from.col;
  let currentRow = from.row;

  // Alternate between horizontal and vertical moves for more natural path
  let hRemaining = hDist;
  let vRemaining = vDist;

  while (hRemaining > 0 || vRemaining > 0) {
    // Prefer horizontal if more remaining, else vertical
    if (hRemaining > vRemaining && hRemaining > 0) {
      currentCol = (currentCol + hStep + MAP_COLUMNS) % MAP_COLUMNS;
      hRemaining--;
    } else if (vRemaining > 0) {
      currentRow += vStep;
      vRemaining--;
    } else if (hRemaining > 0) {
      currentCol = (currentCol + hStep + MAP_COLUMNS) % MAP_COLUMNS;
      hRemaining--;
    }

    path.push(coordsToSector(currentCol, currentRow));
  }

  return path;
}

// =============================================================================
// TRAVEL OPTIONS
// =============================================================================

export interface TravelOption {
  name: string;
  path: string[];
  distance: number;
  estimatedHours: number;
  direction: string;
  description: string;
}

/**
 * Get all travel options between two sectors
 */
export function getTravelOptions(from: string, to: string): TravelOption[] {
  if (from === to) return [];

  const options: TravelOption[] = [];
  const fromCoords = sectorToCoords(from);
  const toCoords = sectorToCoords(to);

  // Option 1: Direct path (always available)
  const directColDist = toCoords.col - fromCoords.col;
  const directHStep = directColDist > 0 ? 1 : (directColDist < 0 ? -1 : 0);
  const directPath = generatePath(
    fromCoords,
    toCoords,
    directHStep,
    toCoords.row > fromCoords.row ? 1 : -1,
    Math.abs(directColDist),
    Math.abs(toCoords.row - fromCoords.row)
  );

  let directHours = 0;
  for (const s of directPath) {
    const c = sectorToCoords(s);
    directHours += BASE_HOURS_PER_SECTOR * (POLAR_ROWS.includes(c.row) ? POLAR_TRAVEL_MULTIPLIER : 1);
  }

  options.push({
    name: 'Direct Route',
    path: directPath,
    distance: directPath.length,
    estimatedHours: directHours,
    direction: directColDist > 0 ? 'east' : directColDist < 0 ? 'west' : 'north/south',
    description: `Travel directly ${directColDist > 0 ? 'east' : directColDist < 0 ? 'west' : 'vertically'}`,
  });

  // Option 2: Wrapped path (if significantly different)
  const wrapColDist = MAP_COLUMNS - Math.abs(directColDist);
  if (wrapColDist < Math.abs(directColDist) - 2) {
    // Wrapping saves at least 2 sectors
    const wrapHStep = directColDist > 0 ? -1 : 1;  // Go opposite direction
    const wrapPath = generatePath(
      fromCoords,
      toCoords,
      wrapHStep,
      toCoords.row > fromCoords.row ? 1 : -1,
      wrapColDist,
      Math.abs(toCoords.row - fromCoords.row)
    );

    let wrapHours = 0;
    for (const s of wrapPath) {
      const c = sectorToCoords(s);
      wrapHours += BASE_HOURS_PER_SECTOR * (POLAR_ROWS.includes(c.row) ? POLAR_TRAVEL_MULTIPLIER : 1);
    }

    options.push({
      name: 'Globe Wrap Route',
      path: wrapPath,
      distance: wrapPath.length,
      estimatedHours: wrapHours,
      direction: wrapHStep > 0 ? 'east (wrap)' : 'west (wrap)',
      description: `Travel ${wrapHStep > 0 ? 'east' : 'west'} around the globe`,
    });
  }

  // Sort by estimated hours
  options.sort((a, b) => a.estimatedHours - b.estimatedHours);

  return options;
}

// =============================================================================
// TELEPORTATION
// =============================================================================

export interface TeleportResult {
  success: boolean;
  energyCost: number;
  destination: string;
  message: string;
}

/**
 * Calculate teleportation cost and viability
 */
export function calculateTeleportation(
  from: string,
  to: string,
  teleporterPower: number,  // 1-10 power level
  knownLocation: boolean    // Has beacon/visited before
): TeleportResult {
  const distance = calculateGlobeDistance(from, to).distance;

  // Base energy cost per sector
  const baseCostPerSector = 10;
  const unknownPenalty = knownLocation ? 1 : 2;

  // Higher power = cheaper teleportation
  const powerMod = 1.5 - (teleporterPower / 10);

  const energyCost = Math.round(distance * baseCostPerSector * unknownPenalty * powerMod);

  // Max range based on power
  const maxRange = teleporterPower * 3;  // Level 10 = 30 sectors (global)

  if (distance > maxRange) {
    return {
      success: false,
      energyCost,
      destination: to,
      message: `Destination too far. Max range: ${maxRange} sectors, distance: ${distance}`,
    };
  }

  return {
    success: true,
    energyCost,
    destination: to,
    message: knownLocation
      ? `Teleporting to known location. Energy cost: ${energyCost}`
      : `Blind teleport to unknown location. Energy cost: ${energyCost} (2x penalty)`,
  };
}

// =============================================================================
// WAYPOINTS
// =============================================================================

export interface Waypoint {
  id: string;
  name: string;
  sector: string;
  type: 'base' | 'beacon' | 'safehouse' | 'ally';
  teleportDiscount: number;  // 0-0.5 discount on teleport cost
}

/**
 * Find nearest waypoint to a destination
 */
export function findNearestWaypoint(destination: string, waypoints: Waypoint[]): Waypoint | null {
  if (waypoints.length === 0) return null;

  let nearest: Waypoint | null = null;
  let nearestDistance = Infinity;

  for (const wp of waypoints) {
    const dist = calculateGlobeDistance(wp.sector, destination).distance;
    if (dist < nearestDistance) {
      nearestDistance = dist;
      nearest = wp;
    }
  }

  return nearest;
}

// =============================================================================
// EXPORTS
// =============================================================================

export default {
  sectorToCoords,
  coordsToSector,
  calculateGlobeDistance,
  getTravelOptions,
  calculateTeleportation,
  findNearestWaypoint,
  MAP_COLUMNS,
  MAP_ROWS,
  BASE_HOURS_PER_SECTOR,
};
