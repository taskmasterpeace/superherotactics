/**
 * Tactical Map Templates - City-type based combat maps
 *
 * Design Philosophy (Linda Currie):
 * - Every map has 2+ entry points for tactical choice
 * - Multiple valid approaches: assault, stealth, flanking
 * - Environment tells a story about the location
 * - Cover placement creates meaningful tactical decisions
 *
 * Map Grid: 15x15 tiles (standard combat arena)
 *
 * Terrain Legend:
 * . = FLOOR (walkable)
 * # = WALL (blocks movement and LOS)
 * + = DOOR_CLOSED (can open)
 * - = DOOR_OPEN (walkable)
 * L = LOW_WALL (half cover, costs extra AP)
 * ~ = WATER (blocks movement)
 * G = GRASS (walkable, slight concealment)
 * C = CONCRETE (walkable)
 */

export type TerrainType = 'FLOOR' | 'WALL' | 'LOW_WALL' | 'DOOR_CLOSED' | 'DOOR_OPEN' | 'WATER' | 'GRASS' | 'CONCRETE';

export interface MapTemplate {
  id: string;
  name: string;
  cityTypes: string[];      // Which city types use this template
  description: string;      // Environmental storytelling
  entryPoints: { x: number; y: number; team: 'blue' | 'red' }[];  // Multiple spawn zones
  layout: string;           // 15 lines of 15 characters
  objectives?: { x: number; y: number; type: string }[];  // Optional objective markers
}

// Convert character to terrain type
export function charToTerrain(char: string): TerrainType {
  switch (char) {
    case '#': return 'WALL';
    case '+': return 'DOOR_CLOSED';
    case '-': return 'DOOR_OPEN';
    case 'L': return 'LOW_WALL';
    case '~': return 'WATER';
    case 'G': return 'GRASS';
    case 'C': return 'CONCRETE';
    case '.':
    default: return 'FLOOR';
  }
}

// Parse layout string into 2D terrain array
export function parseMapLayout(layout: string): TerrainType[][] {
  const lines = layout.trim().split('\n').map(line => line.trim());
  return lines.map(line =>
    line.split('').map(char => charToTerrain(char))
  );
}

// =============================================================================
// MILITARY TEMPLATES - Fortified positions, checkpoints, barracks
// =============================================================================

const MILITARY_CHECKPOINT: MapTemplate = {
  id: 'military_checkpoint',
  name: 'Border Checkpoint',
  cityTypes: ['Military'],
  description: 'A fortified border crossing with guard towers and barricades. Multiple entry points for flanking.',
  entryPoints: [
    { x: 1, y: 7, team: 'blue' },
    { x: 1, y: 3, team: 'blue' },
    { x: 1, y: 11, team: 'blue' },
    { x: 13, y: 7, team: 'red' },
    { x: 13, y: 4, team: 'red' },
    { x: 13, y: 10, team: 'red' },
  ],
  layout: `
###############
#...#.....#...#
#...#LLLLL#...#
#...-.....-..-#
#...#LLLLL#...#
#L............#
#.....###.....#
#.....#.#.....#
#.....###.....#
#L............#
#...#LLLLL#...#
#...-.....-...#
#...#LLLLL#...#
#...#.....#...#
###############
`,
};

const MILITARY_BARRACKS: MapTemplate = {
  id: 'military_barracks',
  name: 'Training Barracks',
  cityTypes: ['Military'],
  description: 'Soldier quarters with bunks, lockers, and training yard. Open areas mixed with tight corridors.',
  entryPoints: [
    { x: 1, y: 1, team: 'blue' },
    { x: 1, y: 13, team: 'blue' },
    { x: 13, y: 1, team: 'red' },
    { x: 13, y: 13, team: 'red' },
  ],
  layout: `
###############
#...GGGGG....##
#.L.GGGGG.L..##
#...GGGGG....##
#####-####-####
#....L....L...#
#....L....L...-
-.............#
#....L....L...-
#....L....L...#
####-#####-####
#...........L.#
#.L.........L.#
#...........L.#
###############
`,
};

// =============================================================================
// POLITICAL TEMPLATES - Government buildings, offices, secure areas
// =============================================================================

const POLITICAL_EMBASSY: MapTemplate = {
  id: 'political_embassy',
  name: 'Embassy Interior',
  cityTypes: ['Political'],
  description: 'Diplomatic facility with reception, offices, and secure vault. Marble floors, high ceilings.',
  entryPoints: [
    { x: 7, y: 13, team: 'blue' },
    { x: 3, y: 13, team: 'blue' },
    { x: 11, y: 13, team: 'blue' },
    { x: 7, y: 1, team: 'red' },
  ],
  layout: `
###############
#.....#.#.....#
#.L...-.-...L.#
#.....#.#.....#
###-#######-###
#...#.....#...#
#...-.....-.L.#
#...#.....#...#
#.L.#.....#.L.#
###-#######-###
#.............#
#....LLLLL....#
#.............#
#...-..-..-...#
###############
`,
};

const POLITICAL_COURTROOM: MapTemplate = {
  id: 'political_courtroom',
  name: 'Grand Courtroom',
  cityTypes: ['Political'],
  description: 'Justice hall with benches, judge podium, and public gallery. High drama tactical space.',
  entryPoints: [
    { x: 7, y: 1, team: 'blue' },
    { x: 1, y: 7, team: 'blue' },
    { x: 7, y: 13, team: 'red' },
    { x: 13, y: 7, team: 'red' },
  ],
  layout: `
###-###-###-###
#.............#
#..LLLLLLLL...#
#.............#
#..LL....LL...#
#..LL....LL...#
-..LL....LL...-
#.............#
-..LL....LL...-
#..LL....LL...#
#..LL....LL...#
#.............#
#..LLLLLLLL...#
#.............#
###-###-###-###
`,
};

// =============================================================================
// INDUSTRIAL TEMPLATES - Warehouses, factories, machinery
// =============================================================================

const INDUSTRIAL_WAREHOUSE: MapTemplate = {
  id: 'industrial_warehouse',
  name: 'Shipping Warehouse',
  cityTypes: ['Industrial'],
  description: 'Massive storage facility with crate stacks, loading docks, and catwalks. Vertical play options.',
  entryPoints: [
    { x: 1, y: 7, team: 'blue' },
    { x: 7, y: 13, team: 'blue' },
    { x: 13, y: 7, team: 'red' },
    { x: 7, y: 1, team: 'red' },
  ],
  layout: `
###-###-###-###
#.LL..L..LL...#
#.LL.....LL...#
#.....L.......#
-..LLLLLLLL...-
#.............#
#LL...L...LL..#
#LL...L...LL..-
#LL...L...LL..#
#.............#
-..LLLLLLLL...-
#.....L.......#
#.LL.....LL...#
#.LL..L..LL...#
###-###-###-###
`,
};

const INDUSTRIAL_FACTORY: MapTemplate = {
  id: 'industrial_factory',
  name: 'Assembly Line',
  cityTypes: ['Industrial'],
  description: 'Manufacturing floor with conveyor belts, heavy machinery, and maintenance corridors.',
  entryPoints: [
    { x: 1, y: 3, team: 'blue' },
    { x: 1, y: 11, team: 'blue' },
    { x: 13, y: 3, team: 'red' },
    { x: 13, y: 11, team: 'red' },
  ],
  layout: `
###############
#...#.....#...#
#...-.....-...#
-.L.#LLLLL#.L.-
#...#.....#...#
#...#.....#...#
#LLLL.....LLLL#
#.............#
#LLLL.....LLLL#
#...#.....#...#
#...#.....#...#
-.L.#LLLLL#.L.-
#...-.....-...#
#...#.....#...#
###############
`,
};

// =============================================================================
// TEMPLE TEMPLATES - Sacred spaces, shrines, meditation halls
// =============================================================================

const TEMPLE_SHRINE: MapTemplate = {
  id: 'temple_shrine',
  name: 'Ancient Shrine',
  cityTypes: ['Temple'],
  description: 'Sacred temple with central altar, prayer alcoves, and ceremonial corridors. Echoing stone.',
  entryPoints: [
    { x: 7, y: 13, team: 'blue' },
    { x: 1, y: 7, team: 'blue' },
    { x: 7, y: 1, team: 'red' },
    { x: 13, y: 7, team: 'red' },
  ],
  layout: `
######-#-######
#.....#.#.....#
#.L...#.#...L.#
#.....#.#.....#
###-##...##-###
#...#.....#...#
-.............#
#......L......-
-.............#
#...#.....#...#
###-##...##-###
#.....#.#.....#
#.L...#.#...L.#
#.....#.#.....#
######-#-######
`,
};

const TEMPLE_MONASTERY: MapTemplate = {
  id: 'temple_monastery',
  name: 'Mountain Monastery',
  cityTypes: ['Temple'],
  description: 'Secluded religious retreat with meditation gardens, library, and dormitories.',
  entryPoints: [
    { x: 1, y: 1, team: 'blue' },
    { x: 7, y: 13, team: 'blue' },
    { x: 13, y: 1, team: 'red' },
    { x: 7, y: 1, team: 'red' },
  ],
  layout: `
###-#####-#####
#...GGGGG....##
#.L.GGGGG.L..##
#...GGGGG....##
####-####-#####
#.....#.....L.#
#.....#.......-
-.....#.......#
#.....#.......-
#.....#.....L.#
###-#####-#####
#GGGGG...GGGGG#
#GGGGG.L.GGGGG#
#GGGGG...GGGGG#
###############
`,
};

// =============================================================================
// SEAPORT TEMPLATES - Docks, cargo areas, cranes
// =============================================================================

const SEAPORT_DOCKS: MapTemplate = {
  id: 'seaport_docks',
  name: 'Container Docks',
  cityTypes: ['Seaport'],
  description: 'Busy shipping port with stacked containers, cranes, and water hazards. Maze-like cover.',
  entryPoints: [
    { x: 1, y: 7, team: 'blue' },
    { x: 7, y: 13, team: 'blue' },
    { x: 13, y: 7, team: 'red' },
  ],
  layout: `
###############
~~~###...###~~~
~~~#.......#~~~
~~~#..LLL..#~~~
~~~-..LLL..-~~~
~~~#..LLL..#~~~
~~~#.......#~~~
-.....LLL.....-
~~~#.......#~~~
~~~#..LLL..#~~~
~~~-..LLL..-~~~
~~~#..LLL..#~~~
~~~#.......#~~~
~~~###...###~~~
###############
`,
};

const SEAPORT_SMUGGLER: MapTemplate = {
  id: 'seaport_smuggler',
  name: 'Smuggler Cove',
  cityTypes: ['Seaport'],
  description: 'Hidden coastal warehouse for contraband. Tight quarters, multiple escape routes.',
  entryPoints: [
    { x: 1, y: 1, team: 'blue' },
    { x: 1, y: 13, team: 'blue' },
    { x: 13, y: 7, team: 'red' },
  ],
  layout: `
######-########
#....L...L....#
#.L.......L...#
#....L...L....#
###-#######...#
#.....L.......#
#.....L.......-
-.............#
#.....L.......-
#.....L.......#
###-#######...#
#....L...L~~~~#
#.L.......~~~~#
#....L...L~~~~#
###############
`,
};

// =============================================================================
// COMPANY TEMPLATES - Corporate offices, labs, executive suites
// =============================================================================

const COMPANY_OFFICE: MapTemplate = {
  id: 'company_office',
  name: 'Corporate Tower',
  cityTypes: ['Company'],
  description: 'Modern office floor with cubicles, conference rooms, and corner offices. Glass and steel.',
  entryPoints: [
    { x: 7, y: 13, team: 'blue' },
    { x: 1, y: 7, team: 'blue' },
    { x: 7, y: 1, team: 'red' },
    { x: 13, y: 7, team: 'red' },
  ],
  layout: `
###-#######-###
#.....#.#.....#
#.LL..-.-..LL.#
#.LL.#.#..LL..#
#####-###-#####
#LLLL.....LLLL#
-.............#
#.....L.L.....-
-.............#
#LLLL.....LLLL#
#####-###-#####
#.LL.#.#..LL..#
#.LL..-.-..LL.#
#.....#.#.....#
###-#######-###
`,
};

const COMPANY_LAB: MapTemplate = {
  id: 'company_lab',
  name: 'Research Lab',
  cityTypes: ['Company'],
  description: 'High-tech research facility with clean rooms, equipment bays, and secure storage.',
  entryPoints: [
    { x: 1, y: 7, team: 'blue' },
    { x: 7, y: 13, team: 'blue' },
    { x: 13, y: 7, team: 'red' },
  ],
  layout: `
###############
#...#####...###
#.L.-...-L....#
#...#####.....#
###-#####-#####
#.....L.......#
#.....L.......-
-.............#
#.....L.......-
#.....L.......#
###-#####-#####
#...#####.....#
#.L.-...-L....#
#...#####...###
###############
`,
};

// =============================================================================
// EDUCATIONAL TEMPLATES - Schools, universities, libraries
// =============================================================================

const EDUCATIONAL_CAMPUS: MapTemplate = {
  id: 'educational_campus',
  name: 'University Quad',
  cityTypes: ['Educational'],
  description: 'Open campus courtyard with academic buildings, library, and gardens. Academic ambush.',
  entryPoints: [
    { x: 1, y: 1, team: 'blue' },
    { x: 13, y: 1, team: 'blue' },
    { x: 1, y: 13, team: 'red' },
    { x: 13, y: 13, team: 'red' },
  ],
  layout: `
###-#######-###
#...GGGGGGG...#
#.L.GGGGGGG.L.#
#...GGGGGGG...#
##-#GGGGGGG#-##
#...GGGGGGG...#
#...GGGGGGG...-
-...GGGGGGG...#
#...GGGGGGG...-
#...GGGGGGG...#
##-#GGGGGGG#-##
#...GGGGGGG...#
#.L.GGGGGGG.L.#
#...GGGGGGG...#
###-#######-###
`,
};

const EDUCATIONAL_LIBRARY: MapTemplate = {
  id: 'educational_library',
  name: 'Grand Library',
  cityTypes: ['Educational'],
  description: 'Multi-level library with book stacks, reading rooms, and restricted archives.',
  entryPoints: [
    { x: 7, y: 13, team: 'blue' },
    { x: 1, y: 7, team: 'blue' },
    { x: 7, y: 1, team: 'red' },
    { x: 13, y: 7, team: 'red' },
  ],
  layout: `
###-###-###-###
#.LLLLLLLLLL..#
#.............#
#.LLLLLLLLLL..#
#.............#
#.LLLLLLLLLL..#
-.............#
#......L......-
-.............#
#.LLLLLLLLLL..#
#.............#
#.LLLLLLLLLL..#
#.............#
#.LLLLLLLLLL..#
###-###-###-###
`,
};

// =============================================================================
// MINING TEMPLATES - Tunnels, shafts, processing areas
// =============================================================================

const MINING_TUNNEL: MapTemplate = {
  id: 'mining_tunnel',
  name: 'Mine Shaft',
  cityTypes: ['Mining'],
  description: 'Underground mining complex with narrow tunnels, open caverns, and processing equipment.',
  entryPoints: [
    { x: 1, y: 7, team: 'blue' },
    { x: 13, y: 3, team: 'red' },
    { x: 13, y: 11, team: 'red' },
  ],
  layout: `
###############
##...........##
#....#####....#
-....#...#....-
#....#...#....#
#....#...-....#
#........#....#
#...#....#....-
#...#....#....#
#...-....#....#
#....#...#....#
-....#...#....-
#....#####....#
##...........##
###############
`,
};

const MINING_QUARRY: MapTemplate = {
  id: 'mining_quarry',
  name: 'Open Pit Quarry',
  cityTypes: ['Mining'],
  description: 'Terraced quarry with ramps, heavy equipment, and unstable edges. Long sightlines.',
  entryPoints: [
    { x: 1, y: 1, team: 'blue' },
    { x: 1, y: 13, team: 'blue' },
    { x: 13, y: 7, team: 'red' },
  ],
  layout: `
###############
#.....L.......#
#.L...L.....L.#
#.....L.......#
####..L..######
#.....L.......#
#.....L.......-
-.....L.......#
#.....L.......-
#.....L.......#
####..L..######
#.....L.......#
#.L...L.....L.#
#.....L.......#
###############
`,
};

// =============================================================================
// RESORT TEMPLATES - Hotels, pools, entertainment
// =============================================================================

const RESORT_HOTEL: MapTemplate = {
  id: 'resort_hotel',
  name: 'Luxury Hotel',
  cityTypes: ['Resort'],
  description: 'Upscale hotel with lobby, rooms, pool area, and rooftop access. Civilian cover concerns.',
  entryPoints: [
    { x: 7, y: 13, team: 'blue' },
    { x: 1, y: 7, team: 'blue' },
    { x: 7, y: 1, team: 'red' },
  ],
  layout: `
###-###-###-###
#...#...#...#.#
#...-...-...-.-
#...#...#...#.#
###-###-###-###
#.............#
#....~~~~~....#
-.L..~~~~~..L.-
#....~~~~~....#
#.............#
###-###-###-###
#...#...#...#.#
#...-...-...-.-
#...#...#...#.#
###-###-###-###
`,
};

const RESORT_CASINO: MapTemplate = {
  id: 'resort_casino',
  name: 'Casino Floor',
  cityTypes: ['Resort'],
  description: 'Glamorous casino with gaming tables, VIP rooms, and back offices. Crowds and chaos.',
  entryPoints: [
    { x: 7, y: 13, team: 'blue' },
    { x: 1, y: 7, team: 'blue' },
    { x: 13, y: 7, team: 'blue' },
    { x: 7, y: 1, team: 'red' },
  ],
  layout: `
###-#######-###
#.LL...L...LL.#
#.............#
#..LL...LL....#
#.............#
#.LL...L...LL.#
-.............#
#......L......-
-.............#
#.LL...L...LL.#
#.............#
#..LL...LL....#
#.............#
#.LL...L...LL.#
###-#######-###
`,
};

// =============================================================================
// TEMPLATE COLLECTION
// =============================================================================

export const MAP_TEMPLATES: MapTemplate[] = [
  // Military
  MILITARY_CHECKPOINT,
  MILITARY_BARRACKS,
  // Political
  POLITICAL_EMBASSY,
  POLITICAL_COURTROOM,
  // Industrial
  INDUSTRIAL_WAREHOUSE,
  INDUSTRIAL_FACTORY,
  // Temple
  TEMPLE_SHRINE,
  TEMPLE_MONASTERY,
  // Seaport
  SEAPORT_DOCKS,
  SEAPORT_SMUGGLER,
  // Company
  COMPANY_OFFICE,
  COMPANY_LAB,
  // Educational
  EDUCATIONAL_CAMPUS,
  EDUCATIONAL_LIBRARY,
  // Mining
  MINING_TUNNEL,
  MINING_QUARRY,
  // Resort
  RESORT_HOTEL,
  RESORT_CASINO,
];

/**
 * Get a random map template for a given city type
 * Falls back to a generic map if no matching templates
 */
export function getMapForCityType(cityType: string): MapTemplate {
  const matching = MAP_TEMPLATES.filter(t => t.cityTypes.includes(cityType));
  if (matching.length === 0) {
    // Fallback to warehouse (most generic)
    return INDUSTRIAL_WAREHOUSE;
  }
  return matching[Math.floor(Math.random() * matching.length)];
}

/**
 * Get all templates for a city type
 */
export function getMapsForCityType(cityType: string): MapTemplate[] {
  return MAP_TEMPLATES.filter(t => t.cityTypes.includes(cityType));
}

/**
 * Get spawn positions for a team from a template
 */
export function getSpawnPositions(template: MapTemplate, team: 'blue' | 'red'): { x: number; y: number }[] {
  return template.entryPoints
    .filter(ep => ep.team === team)
    .map(ep => ({ x: ep.x, y: ep.y }));
}
