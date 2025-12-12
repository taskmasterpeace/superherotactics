/**
 * Populate Sectors Script
 * Uses city and country data to auto-populate the 40x24 sector grid
 *
 * Culture Code → Geographic Region Mapping:
 * 1: North Africa → rows G-J, cols 17-25
 * 2: Central Africa → rows K-N, cols 17-25
 * 3: Southern Africa → rows O-R, cols 19-26
 * 4: Central Asia → rows F-J, cols 26-32
 * 5: South Asia → rows I-M, cols 28-33
 * 6: East + SE Asia → rows H-N, cols 32-40
 * 7: Caribbean → rows I-K, cols 7-11
 * 8: Central America → rows J-L, cols 4-8
 * 9: West Europe → rows E-H, cols 15-20
 * 10: East Europe → rows D-H, cols 20-28
 * 11: Oceania → rows P-W, cols 34-40
 * 12: South America → rows M-U, cols 6-14
 * 13: North America → rows D-K, cols 1-12
 * 14: Middle East → rows G-K, cols 22-30
 */

const fs = require('fs');
const path = require('path');

// Culture code to map region mapping
const CULTURE_REGIONS = {
  1:  { name: 'North Africa',     rowStart: 'G', rowEnd: 'J', colStart: 17, colEnd: 25 },
  2:  { name: 'Central Africa',   rowStart: 'K', rowEnd: 'N', colStart: 17, colEnd: 25 },
  3:  { name: 'Southern Africa',  rowStart: 'O', rowEnd: 'R', colStart: 19, colEnd: 26 },
  4:  { name: 'Central Asia',     rowStart: 'F', rowEnd: 'J', colStart: 26, colEnd: 32 },
  5:  { name: 'South Asia',       rowStart: 'I', rowEnd: 'M', colStart: 28, colEnd: 33 },
  6:  { name: 'East + SE Asia',   rowStart: 'H', rowEnd: 'N', colStart: 32, colEnd: 40 },
  7:  { name: 'Caribbean',        rowStart: 'I', rowEnd: 'K', colStart: 7, colEnd: 11 },
  8:  { name: 'Central America',  rowStart: 'J', rowEnd: 'L', colStart: 4, colEnd: 8 },
  9:  { name: 'West Europe',      rowStart: 'E', rowEnd: 'H', colStart: 15, colEnd: 20 },
  10: { name: 'East Europe',      rowStart: 'D', rowEnd: 'H', colStart: 20, colEnd: 28 },
  11: { name: 'Oceania',          rowStart: 'P', rowEnd: 'W', colStart: 34, colEnd: 40 },
  12: { name: 'South America',    rowStart: 'M', rowEnd: 'U', colStart: 6, colEnd: 14 },
  13: { name: 'North America',    rowStart: 'D', rowEnd: 'K', colStart: 1, colEnd: 12 },
  14: { name: 'Middle East',      rowStart: 'G', rowEnd: 'K', colStart: 22, colEnd: 30 },
};

// Convert row letter to index (A=0, B=1, etc)
function rowToIndex(row) {
  return row.charCodeAt(0) - 65;
}

// Convert index to row letter
function indexToRow(index) {
  return String.fromCharCode(65 + index);
}

// Generate empty 40x24 grid
function generateEmptyGrid() {
  const rows = 'ABCDEFGHIJKLMNOPQRSTUVWX'.split('');
  const sectors = [];
  for (const row of rows) {
    for (let col = 1; col <= 40; col++) {
      sectors.push({
        id: `${row}${col}`,
        row,
        col,
        terrain: 'land',
        countries: [],
        isOcean: false,
        isCoastal: false,
        notes: '',
      });
    }
  }
  return sectors;
}

// Define ocean sectors (approximate)
const OCEAN_REGIONS = [
  // Atlantic Ocean
  { rowStart: 'A', rowEnd: 'X', colStart: 1, colEnd: 4 },   // Far west Atlantic
  { rowStart: 'D', rowEnd: 'L', colStart: 12, colEnd: 15 }, // Central Atlantic
  // Pacific Ocean
  { rowStart: 'A', rowEnd: 'X', colStart: 38, colEnd: 40 }, // Far east Pacific wraps
  { rowStart: 'F', rowEnd: 'O', colStart: 1, colEnd: 3 },   // East Pacific
  // Indian Ocean
  { rowStart: 'K', rowEnd: 'R', colStart: 27, colEnd: 31 }, // Indian Ocean
  // Arctic
  { rowStart: 'A', rowEnd: 'C', colStart: 1, colEnd: 40 },  // Arctic Ocean
];

// Define coastal buffer zones
function isOceanSector(row, col) {
  const rowIdx = rowToIndex(row);
  for (const region of OCEAN_REGIONS) {
    const startIdx = rowToIndex(region.rowStart);
    const endIdx = rowToIndex(region.rowEnd);
    if (rowIdx >= startIdx && rowIdx <= endIdx &&
        col >= region.colStart && col <= region.colEnd) {
      return true;
    }
  }
  return false;
}

// Country ISO codes mapped to positions (major countries)
const COUNTRY_POSITIONS = {
  // North America
  'US': [
    { rows: ['E', 'F', 'G', 'H', 'I'], cols: [3, 4, 5, 6, 7, 8, 9, 10, 11] }
  ],
  'CA': [
    { rows: ['D', 'E', 'F'], cols: [3, 4, 5, 6, 7, 8, 9, 10, 11, 12] }
  ],
  'MX': [
    { rows: ['I', 'J', 'K'], cols: [4, 5, 6, 7] }
  ],

  // Central America
  'GT': [{ rows: ['J', 'K'], cols: [5, 6] }],
  'HN': [{ rows: ['J', 'K'], cols: [6, 7] }],
  'NI': [{ rows: ['K'], cols: [6, 7] }],
  'CR': [{ rows: ['K', 'L'], cols: [6, 7] }],
  'PA': [{ rows: ['L'], cols: [7, 8] }],

  // Caribbean
  'CU': [{ rows: ['I'], cols: [7, 8] }],
  'JM': [{ rows: ['J'], cols: [7] }],
  'HT': [{ rows: ['I', 'J'], cols: [8] }],
  'DO': [{ rows: ['I', 'J'], cols: [9] }],
  'PR': [{ rows: ['I'], cols: [9] }],
  'TT': [{ rows: ['K'], cols: [10] }],

  // South America
  'CO': [{ rows: ['L', 'M'], cols: [7, 8, 9] }],
  'VE': [{ rows: ['K', 'L'], cols: [9, 10, 11] }],
  'EC': [{ rows: ['L', 'M'], cols: [6, 7] }],
  'PE': [{ rows: ['M', 'N', 'O'], cols: [6, 7, 8] }],
  'BR': [{ rows: ['M', 'N', 'O', 'P', 'Q'], cols: [9, 10, 11, 12, 13] }],
  'BO': [{ rows: ['O', 'P'], cols: [8, 9] }],
  'PY': [{ rows: ['P', 'Q'], cols: [9, 10] }],
  'UY': [{ rows: ['Q', 'R'], cols: [10, 11] }],
  'AR': [{ rows: ['Q', 'R', 'S', 'T'], cols: [8, 9, 10] }],
  'CL': [{ rows: ['O', 'P', 'Q', 'R', 'S', 'T'], cols: [7, 8] }],

  // West Europe
  'GB': [{ rows: ['E', 'F'], cols: [15, 16] }],
  'IE': [{ rows: ['E', 'F'], cols: [14] }],
  'FR': [{ rows: ['F', 'G'], cols: [15, 16, 17] }],
  'ES': [{ rows: ['G', 'H'], cols: [15, 16] }],
  'PT': [{ rows: ['G', 'H'], cols: [14, 15] }],
  'DE': [{ rows: ['E', 'F', 'G'], cols: [17, 18] }],
  'IT': [{ rows: ['G', 'H'], cols: [17, 18, 19] }],
  'CH': [{ rows: ['F', 'G'], cols: [17] }],
  'AT': [{ rows: ['F', 'G'], cols: [18] }],
  'NL': [{ rows: ['E', 'F'], cols: [17] }],
  'BE': [{ rows: ['F'], cols: [16, 17] }],

  // East Europe
  'PL': [{ rows: ['E', 'F'], cols: [19, 20] }],
  'UA': [{ rows: ['E', 'F', 'G'], cols: [21, 22, 23] }],
  'RU': [{ rows: ['C', 'D', 'E', 'F', 'G'], cols: [22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37] }],
  'BY': [{ rows: ['E', 'F'], cols: [21] }],
  'RO': [{ rows: ['G'], cols: [20, 21] }],
  'HU': [{ rows: ['F', 'G'], cols: [19, 20] }],
  'CZ': [{ rows: ['F'], cols: [18, 19] }],
  'SK': [{ rows: ['F'], cols: [19, 20] }],
  'GR': [{ rows: ['H'], cols: [20, 21] }],
  'BG': [{ rows: ['G', 'H'], cols: [21] }],
  'RS': [{ rows: ['G'], cols: [20] }],
  'HR': [{ rows: ['G'], cols: [19] }],

  // Nordic
  'SE': [{ rows: ['D', 'E'], cols: [18, 19] }],
  'NO': [{ rows: ['D', 'E'], cols: [17, 18] }],
  'FI': [{ rows: ['D', 'E'], cols: [20, 21] }],
  'DK': [{ rows: ['E'], cols: [17, 18] }],

  // North Africa
  'MA': [{ rows: ['H'], cols: [15, 16] }],
  'DZ': [{ rows: ['H', 'I'], cols: [17, 18, 19] }],
  'TN': [{ rows: ['H'], cols: [18] }],
  'LY': [{ rows: ['H', 'I'], cols: [19, 20, 21] }],
  'EG': [{ rows: ['H', 'I', 'J'], cols: [21, 22, 23] }],

  // West Africa
  'NG': [{ rows: ['J', 'K'], cols: [18, 19] }],
  'GH': [{ rows: ['J', 'K'], cols: [17] }],
  'CI': [{ rows: ['J', 'K'], cols: [16, 17] }],
  'SN': [{ rows: ['I', 'J'], cols: [15] }],
  'ML': [{ rows: ['I', 'J'], cols: [16, 17, 18] }],
  'NE': [{ rows: ['I', 'J'], cols: [18, 19, 20] }],
  'BF': [{ rows: ['J'], cols: [17, 18] }],

  // Central Africa
  'CD': [{ rows: ['K', 'L', 'M'], cols: [20, 21, 22, 23] }],
  'CM': [{ rows: ['K', 'L'], cols: [19, 20] }],
  'CF': [{ rows: ['K'], cols: [21, 22] }],
  'TD': [{ rows: ['J', 'K'], cols: [20, 21, 22] }],
  'SD': [{ rows: ['I', 'J', 'K'], cols: [22, 23, 24] }],
  'SS': [{ rows: ['K', 'L'], cols: [23, 24] }],

  // East Africa
  'ET': [{ rows: ['J', 'K', 'L'], cols: [24, 25, 26] }],
  'KE': [{ rows: ['L', 'M'], cols: [24, 25] }],
  'TZ': [{ rows: ['M', 'N'], cols: [24, 25] }],
  'UG': [{ rows: ['L'], cols: [23, 24] }],
  'RW': [{ rows: ['L'], cols: [23] }],

  // Southern Africa
  'ZA': [{ rows: ['P', 'Q', 'R'], cols: [21, 22, 23, 24] }],
  'ZW': [{ rows: ['O', 'P'], cols: [23, 24] }],
  'MZ': [{ rows: ['N', 'O', 'P'], cols: [24, 25] }],
  'ZM': [{ rows: ['N', 'O'], cols: [22, 23, 24] }],
  'AO': [{ rows: ['M', 'N', 'O'], cols: [20, 21, 22] }],
  'NA': [{ rows: ['O', 'P', 'Q'], cols: [20, 21] }],
  'BW': [{ rows: ['O', 'P'], cols: [22, 23] }],
  'MG': [{ rows: ['O', 'P', 'Q'], cols: [26, 27] }],

  // Middle East
  'SA': [{ rows: ['I', 'J', 'K'], cols: [24, 25, 26, 27] }],
  'IR': [{ rows: ['H', 'I', 'J'], cols: [26, 27, 28, 29] }],
  'IQ': [{ rows: ['H', 'I'], cols: [25, 26] }],
  'SY': [{ rows: ['H'], cols: [24, 25] }],
  'JO': [{ rows: ['I'], cols: [24] }],
  'IL': [{ rows: ['I'], cols: [23, 24] }],
  'LB': [{ rows: ['H'], cols: [24] }],
  'AE': [{ rows: ['J'], cols: [27, 28] }],
  'OM': [{ rows: ['J', 'K'], cols: [28, 29] }],
  'YE': [{ rows: ['K'], cols: [26, 27] }],
  'KW': [{ rows: ['I'], cols: [26] }],
  'QA': [{ rows: ['J'], cols: [27] }],
  'TR': [{ rows: ['G', 'H'], cols: [22, 23, 24, 25] }],

  // Central Asia
  'KZ': [{ rows: ['E', 'F', 'G', 'H'], cols: [27, 28, 29, 30, 31, 32] }],
  'UZ': [{ rows: ['G', 'H'], cols: [29, 30, 31] }],
  'TM': [{ rows: ['H'], cols: [28, 29] }],
  'AF': [{ rows: ['H', 'I'], cols: [30, 31] }],
  'PK': [{ rows: ['I', 'J'], cols: [30, 31, 32] }],

  // South Asia
  'IN': [{ rows: ['I', 'J', 'K', 'L', 'M'], cols: [31, 32, 33, 34] }],
  'BD': [{ rows: ['K', 'L'], cols: [34, 35] }],
  'MM': [{ rows: ['K', 'L', 'M'], cols: [35, 36] }],
  'NP': [{ rows: ['J', 'K'], cols: [33, 34] }],
  'LK': [{ rows: ['M', 'N'], cols: [33] }],

  // East Asia
  'CN': [{ rows: ['F', 'G', 'H', 'I', 'J', 'K'], cols: [33, 34, 35, 36, 37, 38] }],
  'MN': [{ rows: ['E', 'F', 'G'], cols: [34, 35, 36, 37] }],
  'KP': [{ rows: ['G', 'H'], cols: [38, 39] }],
  'KR': [{ rows: ['H', 'I'], cols: [38, 39] }],
  'JP': [{ rows: ['G', 'H', 'I', 'J'], cols: [39, 40] }],
  'TW': [{ rows: ['J', 'K'], cols: [38] }],

  // Southeast Asia
  'TH': [{ rows: ['L', 'M'], cols: [36, 37] }],
  'VN': [{ rows: ['K', 'L', 'M'], cols: [37, 38] }],
  'MY': [{ rows: ['M', 'N'], cols: [36, 37, 38] }],
  'ID': [{ rows: ['N', 'O', 'P'], cols: [36, 37, 38, 39, 40] }],
  'PH': [{ rows: ['K', 'L', 'M'], cols: [39, 40] }],
  'SG': [{ rows: ['N'], cols: [37] }],
  'KH': [{ rows: ['L', 'M'], cols: [37] }],
  'LA': [{ rows: ['K', 'L'], cols: [36, 37] }],

  // Oceania
  'AU': [{ rows: ['P', 'Q', 'R', 'S', 'T'], cols: [35, 36, 37, 38, 39, 40] }],
  'NZ': [{ rows: ['T', 'U', 'V'], cols: [39, 40] }],
  'PG': [{ rows: ['N', 'O'], cols: [39, 40] }],
};

// Main function
function populateSectors() {
  const sectors = generateEmptyGrid();
  const sectorMap = new Map();

  // Index sectors for fast lookup
  for (const sector of sectors) {
    sectorMap.set(sector.id, sector);
  }

  // Mark ocean sectors
  for (const sector of sectors) {
    if (isOceanSector(sector.row, sector.col)) {
      sector.terrain = 'ocean';
      sector.isOcean = true;
    }
  }

  // Populate countries into sectors
  for (const [countryCode, positions] of Object.entries(COUNTRY_POSITIONS)) {
    for (const pos of positions) {
      for (const row of pos.rows) {
        for (const col of pos.cols) {
          const sectorId = `${row}${col}`;
          const sector = sectorMap.get(sectorId);
          if (sector && !sector.isOcean) {
            if (!sector.countries.includes(countryCode)) {
              sector.countries.push(countryCode);
            }
            // Mark as land if it has countries
            if (sector.terrain === 'ocean') {
              sector.terrain = 'coastal';
              sector.isCoastal = true;
              sector.isOcean = false;
            }
          }
        }
      }
    }
  }

  // Generate TypeScript output
  const tsOutput = generateTypeScriptOutput(sectors);

  // Write to file
  fs.writeFileSync(
    path.join(__dirname, '../src/data/sectors-populated.ts'),
    tsOutput,
    'utf8'
  );

  console.log('Sectors populated successfully!');
  console.log(`Total sectors: ${sectors.length}`);
  console.log(`Ocean sectors: ${sectors.filter(s => s.isOcean).length}`);
  console.log(`Land sectors with countries: ${sectors.filter(s => s.countries.length > 0).length}`);
  console.log(`Empty land sectors: ${sectors.filter(s => !s.isOcean && s.countries.length === 0).length}`);

  // Stats by country
  const countryCounts = {};
  for (const sector of sectors) {
    for (const country of sector.countries) {
      countryCounts[country] = (countryCounts[country] || 0) + 1;
    }
  }
  console.log('\nCountries mapped:', Object.keys(countryCounts).length);
  console.log('Top 10 by sector count:');
  Object.entries(countryCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .forEach(([code, count]) => console.log(`  ${code}: ${count} sectors`));
}

function generateTypeScriptOutput(sectors) {
  return `/**
 * Sector Data System for SuperHero Tactics World Map
 * 40x24 grid (A-X rows, 1-40 columns)
 * AUTO-POPULATED with country data
 * Generated: ${new Date().toISOString()}
 */

export interface Sector {
  id: string;           // "A1", "K15", etc.
  row: string;          // "A", "K", etc.
  col: number;          // 1-40
  terrain: SectorTerrain;
  countries: string[];  // Country codes in display order (e.g., ["US", "CA"])
  isOcean: boolean;
  isCoastal: boolean;
  notes?: string;
}

export type SectorTerrain =
  | 'ocean'
  | 'coastal'
  | 'land'
  | 'arctic'
  | 'desert'
  | 'mountain'
  | 'jungle'
  | 'forest'
  | 'plains';

// Terrain color mappings for visual display
export const TERRAIN_COLORS = {
  ocean: '#1e40af',      // Blue
  coastal: '#0891b2',    // Cyan
  land: '#16a34a',       // Green
  arctic: '#e0f2fe',     // Light blue
  desert: '#fbbf24',     // Yellow
  mountain: '#78716c',   // Gray
  jungle: '#065f46',     // Dark green
  forest: '#15803d',     // Forest green
  plains: '#84cc16',     // Light green
} as const;

// Pre-populated sector grid
export const SECTORS: Sector[] = ${JSON.stringify(sectors, null, 2)};

export function getSector(id: string): Sector | undefined {
  return SECTORS.find(s => s.id === id);
}

export function getSectorsByCountry(countryCode: string): Sector[] {
  return SECTORS.filter(s => s.countries.includes(countryCode));
}

export function getSectorsByTerrain(terrain: SectorTerrain): Sector[] {
  return SECTORS.filter(s => s.terrain === terrain);
}

export function getSectorByRowCol(row: string, col: number): Sector | undefined {
  return SECTORS.find(s => s.row === row && s.col === col);
}

export function getAdjacentSectors(sector: Sector): Sector[] {
  const rowIndex = sector.row.charCodeAt(0) - 65; // A=0, B=1, etc.
  const adjacent: Sector[] = [];

  // Check all 8 directions
  const directions = [
    [-1, -1], [-1, 0], [-1, 1],
    [0, -1],           [0, 1],
    [1, -1],  [1, 0],  [1, 1]
  ];

  for (const [dRow, dCol] of directions) {
    const newRowIndex = rowIndex + dRow;
    const newCol = sector.col + dCol;

    if (newRowIndex >= 0 && newRowIndex < 24 && newCol >= 1 && newCol <= 40) {
      const newRow = String.fromCharCode(65 + newRowIndex);
      const adjacentSector = getSectorByRowCol(newRow, newCol);
      if (adjacentSector) {
        adjacent.push(adjacentSector);
      }
    }
  }

  return adjacent;
}

// Statistics
export function getSectorStats() {
  const stats = {
    total: SECTORS.length,
    byTerrain: {} as Record<SectorTerrain, number>,
    oceanCount: 0,
    coastalCount: 0,
    mappedSectors: 0,
    unmappedSectors: 0,
  };

  SECTORS.forEach(s => {
    stats.byTerrain[s.terrain] = (stats.byTerrain[s.terrain] || 0) + 1;
    if (s.isOcean) stats.oceanCount++;
    if (s.isCoastal) stats.coastalCount++;
    if (s.countries.length > 0) stats.mappedSectors++;
    else stats.unmappedSectors++;
  });

  return stats;
}

// Export for editing
export function exportSectorsJSON(): string {
  return JSON.stringify(SECTORS, null, 2);
}
`;
}

// Run
populateSectors();
