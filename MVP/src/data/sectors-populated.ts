/**
 * Sector Data System for SuperHero Tactics World Map
 * 42x24 grid (A-X rows, 1-42 columns)
 * AUTO-POPULATED with country data
 * Generated: 2025-12-11T02:18:55.100Z
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
export const SECTORS: Sector[] = [
  {
    "id": "A1",
    "row": "A",
    "col": 1,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "A2",
    "row": "A",
    "col": 2,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "A3",
    "row": "A",
    "col": 3,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "A4",
    "row": "A",
    "col": 4,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "A5",
    "row": "A",
    "col": 5,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "A6",
    "row": "A",
    "col": 6,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "A7",
    "row": "A",
    "col": 7,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "A8",
    "row": "A",
    "col": 8,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "A9",
    "row": "A",
    "col": 9,
    "terrain": "coastal",
    "countries": [],
    "isOcean": false,
    "isCoastal": true,
    "notes": ""
  },
  {
    "id": "A10",
    "row": "A",
    "col": 10,
    "terrain": "arctic",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "A11",
    "row": "A",
    "col": 11,
    "terrain": "arctic",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "A12",
    "row": "A",
    "col": 12,
    "terrain": "arctic",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "A13",
    "row": "A",
    "col": 13,
    "terrain": "arctic",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "A14",
    "row": "A",
    "col": 14,
    "terrain": "arctic",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "A15",
    "row": "A",
    "col": 15,
    "terrain": "arctic",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "A16",
    "row": "A",
    "col": 16,
    "terrain": "arctic",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "A17",
    "row": "A",
    "col": 17,
    "terrain": "arctic",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "A18",
    "row": "A",
    "col": 18,
    "terrain": "arctic",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "A19",
    "row": "A",
    "col": 19,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "A20",
    "row": "A",
    "col": 20,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "A21",
    "row": "A",
    "col": 21,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "A22",
    "row": "A",
    "col": 22,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "A23",
    "row": "A",
    "col": 23,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "A24",
    "row": "A",
    "col": 24,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "A25",
    "row": "A",
    "col": 25,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "A26",
    "row": "A",
    "col": 26,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "A27",
    "row": "A",
    "col": 27,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "A28",
    "row": "A",
    "col": 28,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "A29",
    "row": "A",
    "col": 29,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "A30",
    "row": "A",
    "col": 30,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "A31",
    "row": "A",
    "col": 31,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "A32",
    "row": "A",
    "col": 32,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "A33",
    "row": "A",
    "col": 33,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "A34",
    "row": "A",
    "col": 34,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "A35",
    "row": "A",
    "col": 35,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "A36",
    "row": "A",
    "col": 36,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "A37",
    "row": "A",
    "col": 37,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "A38",
    "row": "A",
    "col": 38,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "A39",
    "row": "A",
    "col": 39,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "A40",
    "row": "A",
    "col": 40,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "A41",
    "row": "A",
    "col": 41,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false
  },
  {
    "id": "A42",
    "row": "A",
    "col": 42,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false
  },
  {
    "id": "B1",
    "row": "B",
    "col": 1,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "B2",
    "row": "B",
    "col": 2,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "B3",
    "row": "B",
    "col": 3,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "B4",
    "row": "B",
    "col": 4,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "B5",
    "row": "B",
    "col": 5,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "B6",
    "row": "B",
    "col": 6,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "B7",
    "row": "B",
    "col": 7,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "B8",
    "row": "B",
    "col": 8,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "B9",
    "row": "B",
    "col": 9,
    "terrain": "arctic",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "B10",
    "row": "B",
    "col": 10,
    "terrain": "arctic",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "B11",
    "row": "B",
    "col": 11,
    "terrain": "arctic",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "B12",
    "row": "B",
    "col": 12,
    "terrain": "arctic",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "B13",
    "row": "B",
    "col": 13,
    "terrain": "arctic",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "B14",
    "row": "B",
    "col": 14,
    "terrain": "arctic",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "B15",
    "row": "B",
    "col": 15,
    "terrain": "arctic",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "B16",
    "row": "B",
    "col": 16,
    "terrain": "arctic",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "B17",
    "row": "B",
    "col": 17,
    "terrain": "arctic",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "B18",
    "row": "B",
    "col": 18,
    "terrain": "coastal",
    "countries": [],
    "isOcean": false,
    "isCoastal": true,
    "notes": ""
  },
  {
    "id": "B19",
    "row": "B",
    "col": 19,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "B20",
    "row": "B",
    "col": 20,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "B21",
    "row": "B",
    "col": 21,
    "terrain": "coastal",
    "countries": [],
    "isOcean": false,
    "isCoastal": true,
    "notes": ""
  },
  {
    "id": "B22",
    "row": "B",
    "col": 22,
    "terrain": "coastal",
    "countries": [],
    "isOcean": false,
    "isCoastal": true,
    "notes": ""
  },
  {
    "id": "B23",
    "row": "B",
    "col": 23,
    "terrain": "coastal",
    "countries": [],
    "isOcean": false,
    "isCoastal": true,
    "notes": ""
  },
  {
    "id": "B24",
    "row": "B",
    "col": 24,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "B25",
    "row": "B",
    "col": 25,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "B26",
    "row": "B",
    "col": 26,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "B27",
    "row": "B",
    "col": 27,
    "terrain": "coastal",
    "countries": [],
    "isOcean": false,
    "isCoastal": true,
    "notes": ""
  },
  {
    "id": "B28",
    "row": "B",
    "col": 28,
    "terrain": "coastal",
    "countries": [],
    "isOcean": false,
    "isCoastal": true,
    "notes": ""
  },
  {
    "id": "B29",
    "row": "B",
    "col": 29,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "B30",
    "row": "B",
    "col": 30,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "B31",
    "row": "B",
    "col": 31,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "B32",
    "row": "B",
    "col": 32,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "B33",
    "row": "B",
    "col": 33,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "B34",
    "row": "B",
    "col": 34,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "B35",
    "row": "B",
    "col": 35,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "B36",
    "row": "B",
    "col": 36,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "B37",
    "row": "B",
    "col": 37,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "B38",
    "row": "B",
    "col": 38,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "B39",
    "row": "B",
    "col": 39,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "B40",
    "row": "B",
    "col": 40,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "B41",
    "row": "B",
    "col": 41,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false
  },
  {
    "id": "B42",
    "row": "B",
    "col": 42,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false
  },
  {
    "id": "C1",
    "row": "C",
    "col": 1,
    "terrain": "land",
    "countries": [
      "US"
    ],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "C2",
    "row": "C",
    "col": 2,
    "terrain": "land",
    "countries": [
      "US"
    ],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "C3",
    "row": "C",
    "col": 3,
    "terrain": "land",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "C4",
    "row": "C",
    "col": 4,
    "terrain": "land",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "C5",
    "row": "C",
    "col": 5,
    "terrain": "land",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "C6",
    "row": "C",
    "col": 6,
    "terrain": "land",
    "countries": [
      "CA"
    ],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "C7",
    "row": "C",
    "col": 7,
    "terrain": "land",
    "countries": [
      "CA"
    ],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "C8",
    "row": "C",
    "col": 8,
    "terrain": "land",
    "countries": [
      "CA"
    ],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "C9",
    "row": "C",
    "col": 9,
    "terrain": "land",
    "countries": [
      "CA"
    ],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "C10",
    "row": "C",
    "col": 10,
    "terrain": "land",
    "countries": [
      "CA"
    ],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "C11",
    "row": "C",
    "col": 11,
    "terrain": "land",
    "countries": [
      "CA"
    ],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "C12",
    "row": "C",
    "col": 12,
    "terrain": "land",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "C13",
    "row": "C",
    "col": 13,
    "terrain": "land",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "C14",
    "row": "C",
    "col": 14,
    "terrain": "arctic",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "C15",
    "row": "C",
    "col": 15,
    "terrain": "arctic",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "C16",
    "row": "C",
    "col": 16,
    "terrain": "arctic",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "C17",
    "row": "C",
    "col": 17,
    "terrain": "coastal",
    "countries": [],
    "isOcean": false,
    "isCoastal": true,
    "notes": ""
  },
  {
    "id": "C18",
    "row": "C",
    "col": 18,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "C19",
    "row": "C",
    "col": 19,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "C20",
    "row": "C",
    "col": 20,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "C21",
    "row": "C",
    "col": 21,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "C22",
    "row": "C",
    "col": 22,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "C23",
    "row": "C",
    "col": 23,
    "terrain": "coastal",
    "countries": [],
    "isOcean": false,
    "isCoastal": true,
    "notes": ""
  },
  {
    "id": "C24",
    "row": "C",
    "col": 24,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "C25",
    "row": "C",
    "col": 25,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "C26",
    "row": "C",
    "col": 26,
    "terrain": "coastal",
    "countries": [],
    "isOcean": false,
    "isCoastal": true,
    "notes": ""
  },
  {
    "id": "C27",
    "row": "C",
    "col": 27,
    "terrain": "coastal",
    "countries": [],
    "isOcean": false,
    "isCoastal": true,
    "notes": ""
  },
  {
    "id": "C28",
    "row": "C",
    "col": 28,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "C29",
    "row": "C",
    "col": 29,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "C30",
    "row": "C",
    "col": 30,
    "terrain": "land",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "C31",
    "row": "C",
    "col": 31,
    "terrain": "land",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "C32",
    "row": "C",
    "col": 32,
    "terrain": "land",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "C33",
    "row": "C",
    "col": 33,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "C34",
    "row": "C",
    "col": 34,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "C35",
    "row": "C",
    "col": 35,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "C36",
    "row": "C",
    "col": 36,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "C37",
    "row": "C",
    "col": 37,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "C38",
    "row": "C",
    "col": 38,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "C39",
    "row": "C",
    "col": 39,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "C40",
    "row": "C",
    "col": 40,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "C41",
    "row": "C",
    "col": 41,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false
  },
  {
    "id": "C42",
    "row": "C",
    "col": 42,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false
  },
  {
    "id": "D1",
    "row": "D",
    "col": 1,
    "terrain": "land",
    "countries": [
      "US"
    ],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "D2",
    "row": "D",
    "col": 2,
    "terrain": "land",
    "countries": [
      "US"
    ],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "D3",
    "row": "D",
    "col": 3,
    "terrain": "land",
    "countries": [
      "US"
    ],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "D4",
    "row": "D",
    "col": 4,
    "terrain": "land",
    "countries": [
      "CA"
    ],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "D5",
    "row": "D",
    "col": 5,
    "terrain": "land",
    "countries": [
      "CA"
    ],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "D6",
    "row": "D",
    "col": 6,
    "terrain": "land",
    "countries": [
      "CA"
    ],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "D7",
    "row": "D",
    "col": 7,
    "terrain": "land",
    "countries": [
      "CA"
    ],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "D8",
    "row": "D",
    "col": 8,
    "terrain": "land",
    "countries": [
      "CA"
    ],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "D9",
    "row": "D",
    "col": 9,
    "terrain": "land",
    "countries": [
      "CA"
    ],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "D10",
    "row": "D",
    "col": 10,
    "terrain": "land",
    "countries": [
      "CA"
    ],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "D11",
    "row": "D",
    "col": 11,
    "terrain": "land",
    "countries": [
      "CA"
    ],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "D12",
    "row": "D",
    "col": 12,
    "terrain": "land",
    "countries": [
      "CA"
    ],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "D13",
    "row": "D",
    "col": 13,
    "terrain": "land",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "D14",
    "row": "D",
    "col": 14,
    "terrain": "arctic",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "D15",
    "row": "D",
    "col": 15,
    "terrain": "arctic",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "D16",
    "row": "D",
    "col": 16,
    "terrain": "land",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "D17",
    "row": "D",
    "col": 17,
    "terrain": "land",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "D18",
    "row": "D",
    "col": 18,
    "terrain": "land",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "D19",
    "row": "D",
    "col": 19,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "D20",
    "row": "D",
    "col": 20,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "D21",
    "row": "D",
    "col": 21,
    "terrain": "coastal",
    "countries": [],
    "isOcean": false,
    "isCoastal": true,
    "notes": ""
  },
  {
    "id": "D22",
    "row": "D",
    "col": 22,
    "terrain": "coastal",
    "countries": [],
    "isOcean": false,
    "isCoastal": true,
    "notes": ""
  },
  {
    "id": "D23",
    "row": "D",
    "col": 23,
    "terrain": "coastal",
    "countries": [],
    "isOcean": false,
    "isCoastal": true,
    "notes": ""
  },
  {
    "id": "D24",
    "row": "D",
    "col": 24,
    "terrain": "coastal",
    "countries": [],
    "isOcean": false,
    "isCoastal": true,
    "notes": ""
  },
  {
    "id": "D25",
    "row": "D",
    "col": 25,
    "terrain": "coastal",
    "countries": [],
    "isOcean": false,
    "isCoastal": true,
    "notes": ""
  },
  {
    "id": "D26",
    "row": "D",
    "col": 26,
    "terrain": "coastal",
    "countries": [],
    "isOcean": false,
    "isCoastal": true,
    "notes": ""
  },
  {
    "id": "D27",
    "row": "D",
    "col": 27,
    "terrain": "coastal",
    "countries": [],
    "isOcean": false,
    "isCoastal": true,
    "notes": ""
  },
  {
    "id": "D28",
    "row": "D",
    "col": 28,
    "terrain": "land",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "D29",
    "row": "D",
    "col": 29,
    "terrain": "land",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "D30",
    "row": "D",
    "col": 30,
    "terrain": "land",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "D31",
    "row": "D",
    "col": 31,
    "terrain": "land",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "D32",
    "row": "D",
    "col": 32,
    "terrain": "land",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "D33",
    "row": "D",
    "col": 33,
    "terrain": "land",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "D34",
    "row": "D",
    "col": 34,
    "terrain": "land",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "D35",
    "row": "D",
    "col": 35,
    "terrain": "land",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "D36",
    "row": "D",
    "col": 36,
    "terrain": "land",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "D37",
    "row": "D",
    "col": 37,
    "terrain": "land",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "D38",
    "row": "D",
    "col": 38,
    "terrain": "land",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "D39",
    "row": "D",
    "col": 39,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "D40",
    "row": "D",
    "col": 40,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "D41",
    "row": "D",
    "col": 41,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false
  },
  {
    "id": "D42",
    "row": "D",
    "col": 42,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false
  },
  {
    "id": "E1",
    "row": "E",
    "col": 1,
    "terrain": "land",
    "countries": [
      "US"
    ],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "E2",
    "row": "E",
    "col": 2,
    "terrain": "land",
    "countries": [
      "US"
    ],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "E3",
    "row": "E",
    "col": 3,
    "terrain": "land",
    "countries": [
      "US"
    ],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "E4",
    "row": "E",
    "col": 4,
    "terrain": "land",
    "countries": [
      "CA"
    ],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "E5",
    "row": "E",
    "col": 5,
    "terrain": "land",
    "countries": [
      "CA"
    ],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "E6",
    "row": "E",
    "col": 6,
    "terrain": "land",
    "countries": [
      "CA"
    ],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "E7",
    "row": "E",
    "col": 7,
    "terrain": "land",
    "countries": [
      "CA"
    ],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "E8",
    "row": "E",
    "col": 8,
    "terrain": "land",
    "countries": [
      "CA"
    ],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "E9",
    "row": "E",
    "col": 9,
    "terrain": "land",
    "countries": [
      "CA"
    ],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "E10",
    "row": "E",
    "col": 10,
    "terrain": "land",
    "countries": [
      "CA"
    ],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "E11",
    "row": "E",
    "col": 11,
    "terrain": "land",
    "countries": [
      "CA"
    ],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "E12",
    "row": "E",
    "col": 12,
    "terrain": "land",
    "countries": [
      "CA"
    ],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "E13",
    "row": "E",
    "col": 13,
    "terrain": "land",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "E14",
    "row": "E",
    "col": 14,
    "terrain": "arctic",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "E15",
    "row": "E",
    "col": 15,
    "terrain": "land",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "E16",
    "row": "E",
    "col": 16,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "E17",
    "row": "E",
    "col": 17,
    "terrain": "land",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "E18",
    "row": "E",
    "col": 18,
    "terrain": "land",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "E19",
    "row": "E",
    "col": 19,
    "terrain": "land",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "E20",
    "row": "E",
    "col": 20,
    "terrain": "coastal",
    "countries": [],
    "isOcean": false,
    "isCoastal": true,
    "notes": ""
  },
  {
    "id": "E21",
    "row": "E",
    "col": 21,
    "terrain": "coastal",
    "countries": [],
    "isOcean": false,
    "isCoastal": true,
    "notes": ""
  },
  {
    "id": "E22",
    "row": "E",
    "col": 22,
    "terrain": "land",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "E23",
    "row": "E",
    "col": 23,
    "terrain": "land",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "E24",
    "row": "E",
    "col": 24,
    "terrain": "land",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "E25",
    "row": "E",
    "col": 25,
    "terrain": "land",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "E26",
    "row": "E",
    "col": 26,
    "terrain": "land",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "E27",
    "row": "E",
    "col": 27,
    "terrain": "land",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "E28",
    "row": "E",
    "col": 28,
    "terrain": "land",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "E29",
    "row": "E",
    "col": 29,
    "terrain": "land",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "E30",
    "row": "E",
    "col": 30,
    "terrain": "land",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "E31",
    "row": "E",
    "col": 31,
    "terrain": "land",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "E32",
    "row": "E",
    "col": 32,
    "terrain": "land",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "E33",
    "row": "E",
    "col": 33,
    "terrain": "land",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "E34",
    "row": "E",
    "col": 34,
    "terrain": "land",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "E35",
    "row": "E",
    "col": 35,
    "terrain": "land",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "E36",
    "row": "E",
    "col": 36,
    "terrain": "land",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "E37",
    "row": "E",
    "col": 37,
    "terrain": "land",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "E38",
    "row": "E",
    "col": 38,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "E39",
    "row": "E",
    "col": 39,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "E40",
    "row": "E",
    "col": 40,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "E41",
    "row": "E",
    "col": 41,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false
  },
  {
    "id": "E42",
    "row": "E",
    "col": 42,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false
  },
  {
    "id": "F1",
    "row": "F",
    "col": 1,
    "terrain": "land",
    "countries": [
      "US"
    ],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "F2",
    "row": "F",
    "col": 2,
    "terrain": "land",
    "countries": [
      "US"
    ],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "F3",
    "row": "F",
    "col": 3,
    "terrain": "land",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "F4",
    "row": "F",
    "col": 4,
    "terrain": "land",
    "countries": [
      "CA"
    ],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "F5",
    "row": "F",
    "col": 5,
    "terrain": "land",
    "countries": [
      "CA"
    ],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "F6",
    "row": "F",
    "col": 6,
    "terrain": "land",
    "countries": [
      "CA"
    ],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "F7",
    "row": "F",
    "col": 7,
    "terrain": "land",
    "countries": [
      "CA"
    ],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "F8",
    "row": "F",
    "col": 8,
    "terrain": "land",
    "countries": [
      "CA"
    ],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "F9",
    "row": "F",
    "col": 9,
    "terrain": "land",
    "countries": [
      "CA"
    ],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "F10",
    "row": "F",
    "col": 10,
    "terrain": "land",
    "countries": [
      "CA"
    ],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "F11",
    "row": "F",
    "col": 11,
    "terrain": "land",
    "countries": [
      "CA"
    ],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "F12",
    "row": "F",
    "col": 12,
    "terrain": "land",
    "countries": [
      "CA"
    ],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "F13",
    "row": "F",
    "col": 13,
    "terrain": "land",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "F14",
    "row": "F",
    "col": 14,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "F15",
    "row": "F",
    "col": 15,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "F16",
    "row": "F",
    "col": 16,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "F17",
    "row": "F",
    "col": 17,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "F18",
    "row": "F",
    "col": 18,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "F19",
    "row": "F",
    "col": 19,
    "terrain": "coastal",
    "countries": [],
    "isOcean": false,
    "isCoastal": true,
    "notes": ""
  },
  {
    "id": "F20",
    "row": "F",
    "col": 20,
    "terrain": "coastal",
    "countries": [],
    "isOcean": false,
    "isCoastal": true,
    "notes": ""
  },
  {
    "id": "F21",
    "row": "F",
    "col": 21,
    "terrain": "land",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "F22",
    "row": "F",
    "col": 22,
    "terrain": "land",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "F23",
    "row": "F",
    "col": 23,
    "terrain": "land",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "F24",
    "row": "F",
    "col": 24,
    "terrain": "land",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "F25",
    "row": "F",
    "col": 25,
    "terrain": "land",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "F26",
    "row": "F",
    "col": 26,
    "terrain": "land",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "F27",
    "row": "F",
    "col": 27,
    "terrain": "land",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "F28",
    "row": "F",
    "col": 28,
    "terrain": "land",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "F29",
    "row": "F",
    "col": 29,
    "terrain": "land",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "F30",
    "row": "F",
    "col": 30,
    "terrain": "land",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "F31",
    "row": "F",
    "col": 31,
    "terrain": "land",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "F32",
    "row": "F",
    "col": 32,
    "terrain": "land",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "F33",
    "row": "F",
    "col": 33,
    "terrain": "land",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "F34",
    "row": "F",
    "col": 34,
    "terrain": "land",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "F35",
    "row": "F",
    "col": 35,
    "terrain": "land",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "F36",
    "row": "F",
    "col": 36,
    "terrain": "land",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "F37",
    "row": "F",
    "col": 37,
    "terrain": "land",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "F38",
    "row": "F",
    "col": 38,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "F39",
    "row": "F",
    "col": 39,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "F40",
    "row": "F",
    "col": 40,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "F41",
    "row": "F",
    "col": 41,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false
  },
  {
    "id": "F42",
    "row": "F",
    "col": 42,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false
  },
  {
    "id": "G1",
    "row": "G",
    "col": 1,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "G2",
    "row": "G",
    "col": 2,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "G3",
    "row": "G",
    "col": 3,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "G4",
    "row": "G",
    "col": 4,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "G5",
    "row": "G",
    "col": 5,
    "terrain": "land",
    "countries": [
      "US"
    ],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "G6",
    "row": "G",
    "col": 6,
    "terrain": "land",
    "countries": [
      "US"
    ],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "G7",
    "row": "G",
    "col": 7,
    "terrain": "land",
    "countries": [
      "US"
    ],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "G8",
    "row": "G",
    "col": 8,
    "terrain": "land",
    "countries": [
      "US"
    ],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "G9",
    "row": "G",
    "col": 9,
    "terrain": "land",
    "countries": [
      "US"
    ],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "G10",
    "row": "G",
    "col": 10,
    "terrain": "land",
    "countries": [
      "US"
    ],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "G11",
    "row": "G",
    "col": 11,
    "terrain": "land",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "G12",
    "row": "G",
    "col": 12,
    "terrain": "land",
    "countries": [
      "US"
    ],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "G13",
    "row": "G",
    "col": 13,
    "terrain": "land",
    "countries": [
      "US"
    ],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "G14",
    "row": "G",
    "col": 14,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "G15",
    "row": "G",
    "col": 15,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "G16",
    "row": "G",
    "col": 16,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "G17",
    "row": "G",
    "col": 17,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "G18",
    "row": "G",
    "col": 18,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "G19",
    "row": "G",
    "col": 19,
    "terrain": "coastal",
    "countries": [
      "MA"
    ],
    "isOcean": false,
    "isCoastal": true,
    "notes": "Morocco Atlantic coast"
  },
  {
    "id": "G20",
    "row": "G",
    "col": 20,
    "terrain": "coastal",
    "countries": [
      "MA",
      "DZ"
    ],
    "isOcean": false,
    "isCoastal": true,
    "notes": "Morocco/Algeria Mediterranean coast"
  },
  {
    "id": "G21",
    "row": "G",
    "col": 21,
    "terrain": "coastal",
    "countries": [
      "DZ"
    ],
    "isOcean": false,
    "isCoastal": true,
    "notes": "Algeria coast"
  },
  {
    "id": "G22",
    "row": "G",
    "col": 22,
    "terrain": "coastal",
    "countries": [
      "TN",
      "DZ"
    ],
    "isOcean": false,
    "isCoastal": true,
    "notes": "Tunisia/Algeria coast"
  },
  {
    "id": "G23",
    "row": "G",
    "col": 23,
    "terrain": "coastal",
    "countries": [
      "LY"
    ],
    "isOcean": false,
    "isCoastal": true,
    "notes": "Libya coast"
  },
  {
    "id": "G24",
    "row": "G",
    "col": 24,
    "terrain": "coastal",
    "countries": [
      "LY",
      "EG"
    ],
    "isOcean": false,
    "isCoastal": true,
    "notes": "Libya/Egypt coast"
  },
  {
    "id": "G25",
    "row": "G",
    "col": 25,
    "terrain": "coastal",
    "countries": [
      "EG"
    ],
    "isOcean": false,
    "isCoastal": true,
    "notes": "Egypt Mediterranean coast"
  },
  {
    "id": "G26",
    "row": "G",
    "col": 26,
    "terrain": "land",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "G27",
    "row": "G",
    "col": 27,
    "terrain": "land",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "G28",
    "row": "G",
    "col": 28,
    "terrain": "land",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "G29",
    "row": "G",
    "col": 29,
    "terrain": "land",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "G30",
    "row": "G",
    "col": 30,
    "terrain": "land",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "G31",
    "row": "G",
    "col": 31,
    "terrain": "land",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "G32",
    "row": "G",
    "col": 32,
    "terrain": "land",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "G33",
    "row": "G",
    "col": 33,
    "terrain": "land",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "G34",
    "row": "G",
    "col": 34,
    "terrain": "land",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "G35",
    "row": "G",
    "col": 35,
    "terrain": "land",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "G36",
    "row": "G",
    "col": 36,
    "terrain": "land",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "G37",
    "row": "G",
    "col": 37,
    "terrain": "land",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "G38",
    "row": "G",
    "col": 38,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "G39",
    "row": "G",
    "col": 39,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "G40",
    "row": "G",
    "col": 40,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "G41",
    "row": "G",
    "col": 41,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false
  },
  {
    "id": "G42",
    "row": "G",
    "col": 42,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false
  },
  {
    "id": "H1",
    "row": "H",
    "col": 1,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "H2",
    "row": "H",
    "col": 2,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "H3",
    "row": "H",
    "col": 3,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "H4",
    "row": "H",
    "col": 4,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "H5",
    "row": "H",
    "col": 5,
    "terrain": "land",
    "countries": [
      "US"
    ],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "H6",
    "row": "H",
    "col": 6,
    "terrain": "land",
    "countries": [
      "US"
    ],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "H7",
    "row": "H",
    "col": 7,
    "terrain": "land",
    "countries": [
      "US"
    ],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "H8",
    "row": "H",
    "col": 8,
    "terrain": "land",
    "countries": [
      "US"
    ],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "H9",
    "row": "H",
    "col": 9,
    "terrain": "land",
    "countries": [
      "US"
    ],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "H10",
    "row": "H",
    "col": 10,
    "terrain": "land",
    "countries": [
      "US"
    ],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "H11",
    "row": "H",
    "col": 11,
    "terrain": "land",
    "countries": [
      "US"
    ],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "H12",
    "row": "H",
    "col": 12,
    "terrain": "land",
    "countries": [
      "US"
    ],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "H13",
    "row": "H",
    "col": 13,
    "terrain": "land",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "H14",
    "row": "H",
    "col": 14,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "H15",
    "row": "H",
    "col": 15,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "H16",
    "row": "H",
    "col": 16,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "H17",
    "row": "H",
    "col": 17,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "H18",
    "row": "H",
    "col": 18,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "H19",
    "row": "H",
    "col": 19,
    "terrain": "desert",
    "countries": [
      "MA",
      "MR"
    ],
    "isOcean": false,
    "isCoastal": true,
    "notes": "Western Sahara (Morocco/Mauritania)"
  },
  {
    "id": "H20",
    "row": "H",
    "col": 20,
    "terrain": "desert",
    "countries": [
      "DZ",
      "ML"
    ],
    "isOcean": false,
    "isCoastal": false,
    "notes": "Algeria/Mali Sahara"
  },
  {
    "id": "H21",
    "row": "H",
    "col": 21,
    "terrain": "desert",
    "countries": [
      "DZ",
      "NE"
    ],
    "isOcean": false,
    "isCoastal": false,
    "notes": "Algeria/Niger Sahara"
  },
  {
    "id": "H22",
    "row": "H",
    "col": 22,
    "terrain": "desert",
    "countries": [
      "LY",
      "TD"
    ],
    "isOcean": false,
    "isCoastal": false,
    "notes": "Libya/Chad Sahara"
  },
  {
    "id": "H23",
    "row": "H",
    "col": 23,
    "terrain": "desert",
    "countries": [
      "LY",
      "SD"
    ],
    "isOcean": false,
    "isCoastal": false,
    "notes": "Libya/Sudan border"
  },
  {
    "id": "H24",
    "row": "H",
    "col": 24,
    "terrain": "desert",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": "Egypt/Sudan border"
  },
  {
    "id": "H25",
    "row": "H",
    "col": 25,
    "terrain": "coastal",
    "countries": [
      "EG"
    ],
    "isOcean": false,
    "isCoastal": true,
    "notes": "Egypt Red Sea coast"
  },
  {
    "id": "H26",
    "row": "H",
    "col": 26,
    "terrain": "land",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "H27",
    "row": "H",
    "col": 27,
    "terrain": "land",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "H28",
    "row": "H",
    "col": 28,
    "terrain": "land",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "H29",
    "row": "H",
    "col": 29,
    "terrain": "land",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "H30",
    "row": "H",
    "col": 30,
    "terrain": "land",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "H31",
    "row": "H",
    "col": 31,
    "terrain": "land",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "H32",
    "row": "H",
    "col": 32,
    "terrain": "land",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "H33",
    "row": "H",
    "col": 33,
    "terrain": "land",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "H34",
    "row": "H",
    "col": 34,
    "terrain": "land",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "H35",
    "row": "H",
    "col": 35,
    "terrain": "land",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "H36",
    "row": "H",
    "col": 36,
    "terrain": "land",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "H37",
    "row": "H",
    "col": 37,
    "terrain": "land",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "H38",
    "row": "H",
    "col": 38,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "H39",
    "row": "H",
    "col": 39,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "H40",
    "row": "H",
    "col": 40,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "H41",
    "row": "H",
    "col": 41,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false
  },
  {
    "id": "H42",
    "row": "H",
    "col": 42,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false
  },
  {
    "id": "I1",
    "row": "I",
    "col": 1,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "I2",
    "row": "I",
    "col": 2,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "I3",
    "row": "I",
    "col": 3,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "I4",
    "row": "I",
    "col": 4,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "I5",
    "row": "I",
    "col": 5,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "I6",
    "row": "I",
    "col": 6,
    "terrain": "land",
    "countries": [
      "US"
    ],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "I7",
    "row": "I",
    "col": 7,
    "terrain": "land",
    "countries": [
      "US"
    ],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "I8",
    "row": "I",
    "col": 8,
    "terrain": "land",
    "countries": [
      "US"
    ],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "I9",
    "row": "I",
    "col": 9,
    "terrain": "land",
    "countries": [
      "US"
    ],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "I10",
    "row": "I",
    "col": 10,
    "terrain": "land",
    "countries": [
      "US"
    ],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "I11",
    "row": "I",
    "col": 11,
    "terrain": "land",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "I12",
    "row": "I",
    "col": 12,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "I13",
    "row": "I",
    "col": 13,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "I14",
    "row": "I",
    "col": 14,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "I15",
    "row": "I",
    "col": 15,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "I16",
    "row": "I",
    "col": 16,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "I17",
    "row": "I",
    "col": 17,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "I18",
    "row": "I",
    "col": 18,
    "terrain": "desert",
    "countries": [
      "MR"
    ],
    "isOcean": false,
    "isCoastal": true,
    "notes": "Mauritania coast"
  },
  {
    "id": "I19",
    "row": "I",
    "col": 19,
    "terrain": "desert",
    "countries": [
      "MR",
      "ML"
    ],
    "isOcean": false,
    "isCoastal": false,
    "notes": "Mauritania/Mali Sahara"
  },
  {
    "id": "I20",
    "row": "I",
    "col": 20,
    "terrain": "desert",
    "countries": [
      "ML"
    ],
    "isOcean": false,
    "isCoastal": false,
    "notes": "Mali"
  },
  {
    "id": "I21",
    "row": "I",
    "col": 21,
    "terrain": "desert",
    "countries": [
      "NE"
    ],
    "isOcean": false,
    "isCoastal": false,
    "notes": "Niger"
  },
  {
    "id": "I22",
    "row": "I",
    "col": 22,
    "terrain": "desert",
    "countries": [
      "TD"
    ],
    "isOcean": false,
    "isCoastal": false,
    "notes": "Chad"
  },
  {
    "id": "I23",
    "row": "I",
    "col": 23,
    "terrain": "desert",
    "countries": [
      "SD"
    ],
    "isOcean": false,
    "isCoastal": false,
    "notes": "Sudan"
  },
  {
    "id": "I24",
    "row": "I",
    "col": 24,
    "terrain": "desert",
    "countries": [
      "SD"
    ],
    "isOcean": false,
    "isCoastal": false,
    "notes": "Sudan"
  },
  {
    "id": "I25",
    "row": "I",
    "col": 25,
    "terrain": "coastal",
    "countries": [
      "ER"
    ],
    "isOcean": false,
    "isCoastal": true,
    "notes": "Eritrea Red Sea coast"
  },
  {
    "id": "I26",
    "row": "I",
    "col": 26,
    "terrain": "land",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "I27",
    "row": "I",
    "col": 27,
    "terrain": "land",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "I28",
    "row": "I",
    "col": 28,
    "terrain": "land",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "I29",
    "row": "I",
    "col": 29,
    "terrain": "land",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "I30",
    "row": "I",
    "col": 30,
    "terrain": "land",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "I31",
    "row": "I",
    "col": 31,
    "terrain": "land",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "I32",
    "row": "I",
    "col": 32,
    "terrain": "land",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "I33",
    "row": "I",
    "col": 33,
    "terrain": "land",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "I34",
    "row": "I",
    "col": 34,
    "terrain": "land",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "I35",
    "row": "I",
    "col": 35,
    "terrain": "land",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "I36",
    "row": "I",
    "col": 36,
    "terrain": "land",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "I37",
    "row": "I",
    "col": 37,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "I38",
    "row": "I",
    "col": 38,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "I39",
    "row": "I",
    "col": 39,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "I40",
    "row": "I",
    "col": 40,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "I41",
    "row": "I",
    "col": 41,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false
  },
  {
    "id": "I42",
    "row": "I",
    "col": 42,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false
  },
  {
    "id": "J1",
    "row": "J",
    "col": 1,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "J2",
    "row": "J",
    "col": 2,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "J3",
    "row": "J",
    "col": 3,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "J4",
    "row": "J",
    "col": 4,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "J5",
    "row": "J",
    "col": 5,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "J6",
    "row": "J",
    "col": 6,
    "terrain": "land",
    "countries": [
      "MX"
    ],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "J7",
    "row": "J",
    "col": 7,
    "terrain": "land",
    "countries": [
      "MX"
    ],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "J8",
    "row": "J",
    "col": 8,
    "terrain": "land",
    "countries": [
      "MX"
    ],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "J9",
    "row": "J",
    "col": 9,
    "terrain": "land",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "J10",
    "row": "J",
    "col": 10,
    "terrain": "land",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "J11",
    "row": "J",
    "col": 11,
    "terrain": "land",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "J12",
    "row": "J",
    "col": 12,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "J13",
    "row": "J",
    "col": 13,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "J14",
    "row": "J",
    "col": 14,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "J15",
    "row": "J",
    "col": 15,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "J16",
    "row": "J",
    "col": 16,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "J17",
    "row": "J",
    "col": 17,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "J18",
    "row": "J",
    "col": 18,
    "terrain": "coastal",
    "countries": [
      "SN",
      "GW"
    ],
    "isOcean": false,
    "isCoastal": true,
    "notes": "Senegal/Gambia/Guinea-Bissau coast"
  },
  {
    "id": "J19",
    "row": "J",
    "col": 19,
    "terrain": "plains",
    "countries": [
      "GN",
      "ML",
      "SN"
    ],
    "isOcean": false,
    "isCoastal": false,
    "notes": "Guinea/Mali/Senegal"
  },
  {
    "id": "J20",
    "row": "J",
    "col": 20,
    "terrain": "plains",
    "countries": [
      "ML",
      "BF"
    ],
    "isOcean": false,
    "isCoastal": false,
    "notes": "Mali/Burkina Faso"
  },
  {
    "id": "J21",
    "row": "J",
    "col": 21,
    "terrain": "plains",
    "countries": [
      "BF",
      "NE"
    ],
    "isOcean": false,
    "isCoastal": false,
    "notes": "Burkina Faso/Niger"
  },
  {
    "id": "J22",
    "row": "J",
    "col": 22,
    "terrain": "plains",
    "countries": [
      "NE",
      "NG",
      "TD"
    ],
    "isOcean": false,
    "isCoastal": false,
    "notes": "Niger/Nigeria/Chad"
  },
  {
    "id": "J23",
    "row": "J",
    "col": 23,
    "terrain": "plains",
    "countries": [
      "TD",
      "SD"
    ],
    "isOcean": false,
    "isCoastal": false,
    "notes": "Chad/Sudan"
  },
  {
    "id": "J24",
    "row": "J",
    "col": 24,
    "terrain": "plains",
    "countries": [
      "SD",
      "ET"
    ],
    "isOcean": false,
    "isCoastal": false,
    "notes": "Sudan/Ethiopia"
  },
  {
    "id": "J25",
    "row": "J",
    "col": 25,
    "terrain": "coastal",
    "countries": [
      "ET",
      "DJ",
      "SO"
    ],
    "isOcean": false,
    "isCoastal": true,
    "notes": "Ethiopia/Djibouti/Somalia Horn of Africa"
  },
  {
    "id": "J26",
    "row": "J",
    "col": 26,
    "terrain": "land",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "J27",
    "row": "J",
    "col": 27,
    "terrain": "land",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "J28",
    "row": "J",
    "col": 28,
    "terrain": "land",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "J29",
    "row": "J",
    "col": 29,
    "terrain": "land",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "J30",
    "row": "J",
    "col": 30,
    "terrain": "land",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "J31",
    "row": "J",
    "col": 31,
    "terrain": "land",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "J32",
    "row": "J",
    "col": 32,
    "terrain": "land",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "J33",
    "row": "J",
    "col": 33,
    "terrain": "land",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "J34",
    "row": "J",
    "col": 34,
    "terrain": "land",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "J35",
    "row": "J",
    "col": 35,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "J36",
    "row": "J",
    "col": 36,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "J37",
    "row": "J",
    "col": 37,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "J38",
    "row": "J",
    "col": 38,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "J39",
    "row": "J",
    "col": 39,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "J40",
    "row": "J",
    "col": 40,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "J41",
    "row": "J",
    "col": 41,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false
  },
  {
    "id": "J42",
    "row": "J",
    "col": 42,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false
  },
  {
    "id": "K1",
    "row": "K",
    "col": 1,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "K2",
    "row": "K",
    "col": 2,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "K3",
    "row": "K",
    "col": 3,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "K4",
    "row": "K",
    "col": 4,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "K5",
    "row": "K",
    "col": 5,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "K6",
    "row": "K",
    "col": 6,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "K7",
    "row": "K",
    "col": 7,
    "terrain": "land",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "K8",
    "row": "K",
    "col": 8,
    "terrain": "land",
    "countries": [
      "MX"
    ],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "K9",
    "row": "K",
    "col": 9,
    "terrain": "land",
    "countries": [
      "MX"
    ],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "K10",
    "row": "K",
    "col": 10,
    "terrain": "land",
    "countries": [
      "MX"
    ],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "K11",
    "row": "K",
    "col": 11,
    "terrain": "land",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "K12",
    "row": "K",
    "col": 12,
    "terrain": "land",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "K13",
    "row": "K",
    "col": 13,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "K14",
    "row": "K",
    "col": 14,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "K15",
    "row": "K",
    "col": 15,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "K16",
    "row": "K",
    "col": 16,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "K17",
    "row": "K",
    "col": 17,
    "terrain": "land",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "K18",
    "row": "K",
    "col": 18,
    "terrain": "coastal",
    "countries": [
      "GN",
      "SL",
      "LR"
    ],
    "isOcean": false,
    "isCoastal": true,
    "notes": "Guinea/Sierra Leone/Liberia coast"
  },
  {
    "id": "K19",
    "row": "K",
    "col": 19,
    "terrain": "coastal",
    "countries": [
      "CI",
      "LR"
    ],
    "isOcean": false,
    "isCoastal": true,
    "notes": "Ivory Coast/Liberia coast"
  },
  {
    "id": "K20",
    "row": "K",
    "col": 20,
    "terrain": "coastal",
    "countries": [
      "GH",
      "TG",
      "BJ",
      "CI"
    ],
    "isOcean": false,
    "isCoastal": true,
    "notes": "Ghana/Togo/Benin/Ivory Coast Gulf of Guinea"
  },
  {
    "id": "K21",
    "row": "K",
    "col": 21,
    "terrain": "coastal",
    "countries": [
      "NG"
    ],
    "isOcean": false,
    "isCoastal": true,
    "notes": "Nigeria coast"
  },
  {
    "id": "K22",
    "row": "K",
    "col": 22,
    "terrain": "jungle",
    "countries": [
      "NG",
      "CM",
      "CF"
    ],
    "isOcean": false,
    "isCoastal": false,
    "notes": "Nigeria/Cameroon/Central African Republic"
  },
  {
    "id": "K23",
    "row": "K",
    "col": 23,
    "terrain": "plains",
    "countries": [
      "CF",
      "SS"
    ],
    "isOcean": false,
    "isCoastal": false,
    "notes": "Central African Republic/South Sudan"
  },
  {
    "id": "K24",
    "row": "K",
    "col": 24,
    "terrain": "plains",
    "countries": [
      "ET",
      "SS",
      "UG",
      "KE"
    ],
    "isOcean": false,
    "isCoastal": false,
    "notes": "Ethiopia/South Sudan/Uganda/Kenya"
  },
  {
    "id": "K25",
    "row": "K",
    "col": 25,
    "terrain": "coastal",
    "countries": [
      "SO",
      "KE"
    ],
    "isOcean": false,
    "isCoastal": true,
    "notes": "Somalia/Kenya coast"
  },
  {
    "id": "K26",
    "row": "K",
    "col": 26,
    "terrain": "coastal",
    "countries": [],
    "isOcean": false,
    "isCoastal": true,
    "notes": ""
  },
  {
    "id": "K27",
    "row": "K",
    "col": 27,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "K28",
    "row": "K",
    "col": 28,
    "terrain": "coastal",
    "countries": [],
    "isOcean": false,
    "isCoastal": true,
    "notes": ""
  },
  {
    "id": "K29",
    "row": "K",
    "col": 29,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "K30",
    "row": "K",
    "col": 30,
    "terrain": "coastal",
    "countries": [],
    "isOcean": false,
    "isCoastal": true,
    "notes": ""
  },
  {
    "id": "K31",
    "row": "K",
    "col": 31,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "K32",
    "row": "K",
    "col": 32,
    "terrain": "land",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "K33",
    "row": "K",
    "col": 33,
    "terrain": "land",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "K34",
    "row": "K",
    "col": 34,
    "terrain": "land",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "K35",
    "row": "K",
    "col": 35,
    "terrain": "land",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "K36",
    "row": "K",
    "col": 36,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "K37",
    "row": "K",
    "col": 37,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "K38",
    "row": "K",
    "col": 38,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "K39",
    "row": "K",
    "col": 39,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "K40",
    "row": "K",
    "col": 40,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "K41",
    "row": "K",
    "col": 41,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false
  },
  {
    "id": "K42",
    "row": "K",
    "col": 42,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false
  },
  {
    "id": "L1",
    "row": "L",
    "col": 1,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "L2",
    "row": "L",
    "col": 2,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "L3",
    "row": "L",
    "col": 3,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "L4",
    "row": "L",
    "col": 4,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "L5",
    "row": "L",
    "col": 5,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "L6",
    "row": "L",
    "col": 6,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "L7",
    "row": "L",
    "col": 7,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "L8",
    "row": "L",
    "col": 8,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "L9",
    "row": "L",
    "col": 9,
    "terrain": "land",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "L10",
    "row": "L",
    "col": 10,
    "terrain": "land",
    "countries": [
      "MX"
    ],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "L11",
    "row": "L",
    "col": 11,
    "terrain": "land",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "L12",
    "row": "L",
    "col": 12,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "L13",
    "row": "L",
    "col": 13,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "L14",
    "row": "L",
    "col": 14,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "L15",
    "row": "L",
    "col": 15,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "L16",
    "row": "L",
    "col": 16,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "L17",
    "row": "L",
    "col": 17,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "L18",
    "row": "L",
    "col": 18,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": "Gulf of Guinea"
  },
  {
    "id": "L19",
    "row": "L",
    "col": 19,
    "terrain": "coastal",
    "countries": [
      "GQ",
      "GA"
    ],
    "isOcean": false,
    "isCoastal": true,
    "notes": "Equatorial Guinea/Gabon coast"
  },
  {
    "id": "L20",
    "row": "L",
    "col": 20,
    "terrain": "coastal",
    "countries": [
      "GA",
      "CM"
    ],
    "isOcean": false,
    "isCoastal": true,
    "notes": "Gabon/Cameroon coast"
  },
  {
    "id": "L21",
    "row": "L",
    "col": 21,
    "terrain": "coastal",
    "countries": [
      "CG"
    ],
    "isOcean": false,
    "isCoastal": true,
    "notes": "Congo Republic coast"
  },
  {
    "id": "L22",
    "row": "L",
    "col": 22,
    "terrain": "jungle",
    "countries": [
      "CD",
      "CG"
    ],
    "isOcean": false,
    "isCoastal": false,
    "notes": "DR Congo/Congo Republic"
  },
  {
    "id": "L23",
    "row": "L",
    "col": 23,
    "terrain": "jungle",
    "countries": [
      "CD",
      "UG",
      "RW",
      "BI"
    ],
    "isOcean": false,
    "isCoastal": false,
    "notes": "DR Congo/Uganda/Rwanda/Burundi Great Lakes"
  },
  {
    "id": "L24",
    "row": "L",
    "col": 24,
    "terrain": "plains",
    "countries": [
      "TZ",
      "KE"
    ],
    "isOcean": false,
    "isCoastal": false,
    "notes": "Tanzania/Kenya"
  },
  {
    "id": "L25",
    "row": "L",
    "col": 25,
    "terrain": "coastal",
    "countries": [
      "TZ",
      "SO"
    ],
    "isOcean": false,
    "isCoastal": true,
    "notes": "Tanzania/Somalia coast"
  },
  {
    "id": "L26",
    "row": "L",
    "col": 26,
    "terrain": "coastal",
    "countries": [],
    "isOcean": false,
    "isCoastal": true,
    "notes": ""
  },
  {
    "id": "L27",
    "row": "L",
    "col": 27,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "L28",
    "row": "L",
    "col": 28,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "L29",
    "row": "L",
    "col": 29,
    "terrain": "coastal",
    "countries": [],
    "isOcean": false,
    "isCoastal": true,
    "notes": ""
  },
  {
    "id": "L30",
    "row": "L",
    "col": 30,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "L31",
    "row": "L",
    "col": 31,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "L32",
    "row": "L",
    "col": 32,
    "terrain": "land",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "L33",
    "row": "L",
    "col": 33,
    "terrain": "land",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "L34",
    "row": "L",
    "col": 34,
    "terrain": "land",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "L35",
    "row": "L",
    "col": 35,
    "terrain": "land",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "L36",
    "row": "L",
    "col": 36,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "L37",
    "row": "L",
    "col": 37,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "L38",
    "row": "L",
    "col": 38,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "L39",
    "row": "L",
    "col": 39,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "L40",
    "row": "L",
    "col": 40,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "L41",
    "row": "L",
    "col": 41,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false
  },
  {
    "id": "L42",
    "row": "L",
    "col": 42,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false
  },
  {
    "id": "M1",
    "row": "M",
    "col": 1,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "M2",
    "row": "M",
    "col": 2,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "M3",
    "row": "M",
    "col": 3,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "M4",
    "row": "M",
    "col": 4,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "M5",
    "row": "M",
    "col": 5,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "M6",
    "row": "M",
    "col": 6,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "M7",
    "row": "M",
    "col": 7,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "M8",
    "row": "M",
    "col": 8,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "M9",
    "row": "M",
    "col": 9,
    "terrain": "land",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "M10",
    "row": "M",
    "col": 10,
    "terrain": "coastal",
    "countries": [],
    "isOcean": false,
    "isCoastal": true,
    "notes": ""
  },
  {
    "id": "M11",
    "row": "M",
    "col": 11,
    "terrain": "land",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "M12",
    "row": "M",
    "col": 12,
    "terrain": "land",
    "countries": [
      "BR"
    ],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "M13",
    "row": "M",
    "col": 13,
    "terrain": "land",
    "countries": [
      "BR"
    ],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "M14",
    "row": "M",
    "col": 14,
    "terrain": "land",
    "countries": [
      "BR"
    ],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "M15",
    "row": "M",
    "col": 15,
    "terrain": "land",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "M16",
    "row": "M",
    "col": 16,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "M17",
    "row": "M",
    "col": 17,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "M18",
    "row": "M",
    "col": 18,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": "South Atlantic"
  },
  {
    "id": "M19",
    "row": "M",
    "col": 19,
    "terrain": "coastal",
    "countries": [
      "GA",
      "ST"
    ],
    "isOcean": false,
    "isCoastal": true,
    "notes": "Gabon/Sao Tome coast"
  },
  {
    "id": "M20",
    "row": "M",
    "col": 20,
    "terrain": "coastal",
    "countries": [
      "CG",
      "AO"
    ],
    "isOcean": false,
    "isCoastal": true,
    "notes": "Congo Republic/Angola coast"
  },
  {
    "id": "M21",
    "row": "M",
    "col": 21,
    "terrain": "jungle",
    "countries": [
      "AO",
      "CD"
    ],
    "isOcean": false,
    "isCoastal": false,
    "notes": "Angola/DR Congo"
  },
  {
    "id": "M22",
    "row": "M",
    "col": 22,
    "terrain": "jungle",
    "countries": [
      "CD"
    ],
    "isOcean": false,
    "isCoastal": false,
    "notes": "DR Congo"
  },
  {
    "id": "M23",
    "row": "M",
    "col": 23,
    "terrain": "plains",
    "countries": [
      "CD",
      "ZM"
    ],
    "isOcean": false,
    "isCoastal": false,
    "notes": "DR Congo/Zambia"
  },
  {
    "id": "M24",
    "row": "M",
    "col": 24,
    "terrain": "plains",
    "countries": [
      "TZ",
      "ZM",
      "MW"
    ],
    "isOcean": false,
    "isCoastal": false,
    "notes": "Tanzania/Zambia/Malawi"
  },
  {
    "id": "M25",
    "row": "M",
    "col": 25,
    "terrain": "coastal",
    "countries": [
      "TZ",
      "MZ"
    ],
    "isOcean": false,
    "isCoastal": true,
    "notes": "Tanzania/Mozambique/Comoros coast"
  },
  {
    "id": "M26",
    "row": "M",
    "col": 26,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "M27",
    "row": "M",
    "col": 27,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "M28",
    "row": "M",
    "col": 28,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "M29",
    "row": "M",
    "col": 29,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "M30",
    "row": "M",
    "col": 30,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "M31",
    "row": "M",
    "col": 31,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "M32",
    "row": "M",
    "col": 32,
    "terrain": "land",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "M33",
    "row": "M",
    "col": 33,
    "terrain": "land",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "M34",
    "row": "M",
    "col": 34,
    "terrain": "land",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "M35",
    "row": "M",
    "col": 35,
    "terrain": "land",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "M36",
    "row": "M",
    "col": 36,
    "terrain": "land",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "M37",
    "row": "M",
    "col": 37,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "M38",
    "row": "M",
    "col": 38,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "M39",
    "row": "M",
    "col": 39,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "M40",
    "row": "M",
    "col": 40,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "M41",
    "row": "M",
    "col": 41,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false
  },
  {
    "id": "M42",
    "row": "M",
    "col": 42,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false
  },
  {
    "id": "N1",
    "row": "N",
    "col": 1,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "N2",
    "row": "N",
    "col": 2,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "N3",
    "row": "N",
    "col": 3,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "N4",
    "row": "N",
    "col": 4,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "N5",
    "row": "N",
    "col": 5,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "N6",
    "row": "N",
    "col": 6,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "N7",
    "row": "N",
    "col": 7,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "N8",
    "row": "N",
    "col": 8,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "N9",
    "row": "N",
    "col": 9,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "N10",
    "row": "N",
    "col": 10,
    "terrain": "coastal",
    "countries": [],
    "isOcean": false,
    "isCoastal": true,
    "notes": ""
  },
  {
    "id": "N11",
    "row": "N",
    "col": 11,
    "terrain": "land",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "N12",
    "row": "N",
    "col": 12,
    "terrain": "land",
    "countries": [
      "BR"
    ],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "N13",
    "row": "N",
    "col": 13,
    "terrain": "land",
    "countries": [
      "BR"
    ],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "N14",
    "row": "N",
    "col": 14,
    "terrain": "land",
    "countries": [
      "BR"
    ],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "N15",
    "row": "N",
    "col": 15,
    "terrain": "land",
    "countries": [
      "BR"
    ],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "N16",
    "row": "N",
    "col": 16,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "N17",
    "row": "N",
    "col": 17,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "N18",
    "row": "N",
    "col": 18,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "N19",
    "row": "N",
    "col": 19,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "N20",
    "row": "N",
    "col": 20,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "N21",
    "row": "N",
    "col": 21,
    "terrain": "coastal",
    "countries": [
      "AO"
    ],
    "isOcean": false,
    "isCoastal": true,
    "notes": "Angola coast"
  },
  {
    "id": "N22",
    "row": "N",
    "col": 22,
    "terrain": "plains",
    "countries": [
      "AO",
      "ZM",
      "NA"
    ],
    "isOcean": false,
    "isCoastal": false,
    "notes": "Angola/Zambia/Namibia"
  },
  {
    "id": "N23",
    "row": "N",
    "col": 23,
    "terrain": "plains",
    "countries": [
      "ZW",
      "ZM",
      "BW"
    ],
    "isOcean": false,
    "isCoastal": false,
    "notes": "Zimbabwe/Zambia/Botswana"
  },
  {
    "id": "N24",
    "row": "N",
    "col": 24,
    "terrain": "coastal",
    "countries": [
      "MZ",
      "ZW"
    ],
    "isOcean": false,
    "isCoastal": true,
    "notes": "Mozambique/Zimbabwe"
  },
  {
    "id": "N25",
    "row": "N",
    "col": 25,
    "terrain": "coastal",
    "countries": [
      "MZ",
      "MG"
    ],
    "isOcean": false,
    "isCoastal": true,
    "notes": "Mozambique/Madagascar coast"
  },
  {
    "id": "N26",
    "row": "N",
    "col": 26,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "N27",
    "row": "N",
    "col": 27,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "N28",
    "row": "N",
    "col": 28,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "N29",
    "row": "N",
    "col": 29,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "N30",
    "row": "N",
    "col": 30,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "N31",
    "row": "N",
    "col": 31,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "N32",
    "row": "N",
    "col": 32,
    "terrain": "land",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "N33",
    "row": "N",
    "col": 33,
    "terrain": "land",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "N34",
    "row": "N",
    "col": 34,
    "terrain": "land",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "N35",
    "row": "N",
    "col": 35,
    "terrain": "land",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "N36",
    "row": "N",
    "col": 36,
    "terrain": "land",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "N37",
    "row": "N",
    "col": 37,
    "terrain": "land",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "N38",
    "row": "N",
    "col": 38,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "N39",
    "row": "N",
    "col": 39,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "N40",
    "row": "N",
    "col": 40,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "N41",
    "row": "N",
    "col": 41,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false
  },
  {
    "id": "N42",
    "row": "N",
    "col": 42,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false
  },
  {
    "id": "O1",
    "row": "O",
    "col": 1,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "O2",
    "row": "O",
    "col": 2,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "O3",
    "row": "O",
    "col": 3,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "O4",
    "row": "O",
    "col": 4,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "O5",
    "row": "O",
    "col": 5,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "O6",
    "row": "O",
    "col": 6,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "O7",
    "row": "O",
    "col": 7,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "O8",
    "row": "O",
    "col": 8,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "O9",
    "row": "O",
    "col": 9,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "O10",
    "row": "O",
    "col": 10,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "O11",
    "row": "O",
    "col": 11,
    "terrain": "coastal",
    "countries": [],
    "isOcean": false,
    "isCoastal": true,
    "notes": ""
  },
  {
    "id": "O12",
    "row": "O",
    "col": 12,
    "terrain": "land",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "O13",
    "row": "O",
    "col": 13,
    "terrain": "land",
    "countries": [
      "BR"
    ],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "O14",
    "row": "O",
    "col": 14,
    "terrain": "land",
    "countries": [
      "BR"
    ],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "O15",
    "row": "O",
    "col": 15,
    "terrain": "land",
    "countries": [
      "BR"
    ],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "O16",
    "row": "O",
    "col": 16,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "O17",
    "row": "O",
    "col": 17,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "O18",
    "row": "O",
    "col": 18,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "O19",
    "row": "O",
    "col": 19,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "O20",
    "row": "O",
    "col": 20,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "O21",
    "row": "O",
    "col": 21,
    "terrain": "coastal",
    "countries": [
      "NA"
    ],
    "isOcean": false,
    "isCoastal": true,
    "notes": "Namibia coast"
  },
  {
    "id": "O22",
    "row": "O",
    "col": 22,
    "terrain": "desert",
    "countries": [
      "NA",
      "BW"
    ],
    "isOcean": false,
    "isCoastal": false,
    "notes": "Namibia/Botswana Kalahari"
  },
  {
    "id": "O23",
    "row": "O",
    "col": 23,
    "terrain": "plains",
    "countries": [
      "ZA",
      "BW",
      "ZW"
    ],
    "isOcean": false,
    "isCoastal": false,
    "notes": "South Africa/Botswana/Zimbabwe"
  },
  {
    "id": "O24",
    "row": "O",
    "col": 24,
    "terrain": "coastal",
    "countries": [
      "ZA",
      "MZ",
      "SZ"
    ],
    "isOcean": false,
    "isCoastal": true,
    "notes": "South Africa/Mozambique/Eswatini"
  },
  {
    "id": "O25",
    "row": "O",
    "col": 25,
    "terrain": "coastal",
    "countries": [
      "MG"
    ],
    "isOcean": false,
    "isCoastal": true,
    "notes": "Madagascar"
  },
  {
    "id": "O26",
    "row": "O",
    "col": 26,
    "terrain": "land",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "O27",
    "row": "O",
    "col": 27,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "O28",
    "row": "O",
    "col": 28,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "O29",
    "row": "O",
    "col": 29,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "O30",
    "row": "O",
    "col": 30,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "O31",
    "row": "O",
    "col": 31,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "O32",
    "row": "O",
    "col": 32,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "O33",
    "row": "O",
    "col": 33,
    "terrain": "land",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "O34",
    "row": "O",
    "col": 34,
    "terrain": "land",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "O35",
    "row": "O",
    "col": 35,
    "terrain": "land",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "O36",
    "row": "O",
    "col": 36,
    "terrain": "land",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "O37",
    "row": "O",
    "col": 37,
    "terrain": "land",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "O38",
    "row": "O",
    "col": 38,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "O39",
    "row": "O",
    "col": 39,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "O40",
    "row": "O",
    "col": 40,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "O41",
    "row": "O",
    "col": 41,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false
  },
  {
    "id": "O42",
    "row": "O",
    "col": 42,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false
  },
  {
    "id": "P1",
    "row": "P",
    "col": 1,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "P2",
    "row": "P",
    "col": 2,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "P3",
    "row": "P",
    "col": 3,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "P4",
    "row": "P",
    "col": 4,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "P5",
    "row": "P",
    "col": 5,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "P6",
    "row": "P",
    "col": 6,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "P7",
    "row": "P",
    "col": 7,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "P8",
    "row": "P",
    "col": 8,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "P9",
    "row": "P",
    "col": 9,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "P10",
    "row": "P",
    "col": 10,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "P11",
    "row": "P",
    "col": 11,
    "terrain": "coastal",
    "countries": [],
    "isOcean": false,
    "isCoastal": true,
    "notes": ""
  },
  {
    "id": "P12",
    "row": "P",
    "col": 12,
    "terrain": "land",
    "countries": [
      "AR"
    ],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "P13",
    "row": "P",
    "col": 13,
    "terrain": "land",
    "countries": [
      "BR"
    ],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "P14",
    "row": "P",
    "col": 14,
    "terrain": "land",
    "countries": [
      "BR"
    ],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "P15",
    "row": "P",
    "col": 15,
    "terrain": "land",
    "countries": [
      "BR"
    ],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "P16",
    "row": "P",
    "col": 16,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "P17",
    "row": "P",
    "col": 17,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "P18",
    "row": "P",
    "col": 18,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "P19",
    "row": "P",
    "col": 19,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "P20",
    "row": "P",
    "col": 20,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "P21",
    "row": "P",
    "col": 21,
    "terrain": "coastal",
    "countries": [
      "ZA"
    ],
    "isOcean": false,
    "isCoastal": true,
    "notes": "South Africa Atlantic coast"
  },
  {
    "id": "P22",
    "row": "P",
    "col": 22,
    "terrain": "plains",
    "countries": [
      "ZA"
    ],
    "isOcean": false,
    "isCoastal": false,
    "notes": "South Africa Karoo"
  },
  {
    "id": "P23",
    "row": "P",
    "col": 23,
    "terrain": "plains",
    "countries": [
      "ZA"
    ],
    "isOcean": false,
    "isCoastal": false,
    "notes": "South Africa/Lesotho"
  },
  {
    "id": "P24",
    "row": "P",
    "col": 24,
    "terrain": "coastal",
    "countries": [
      "ZA"
    ],
    "isOcean": false,
    "isCoastal": true,
    "notes": "South Africa Indian Ocean coast"
  },
  {
    "id": "P25",
    "row": "P",
    "col": 25,
    "terrain": "coastal",
    "countries": [
      "MG"
    ],
    "isOcean": false,
    "isCoastal": true,
    "notes": "Madagascar south"
  },
  {
    "id": "P26",
    "row": "P",
    "col": 26,
    "terrain": "land",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "P27",
    "row": "P",
    "col": 27,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "P28",
    "row": "P",
    "col": 28,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "P29",
    "row": "P",
    "col": 29,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "P30",
    "row": "P",
    "col": 30,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "P31",
    "row": "P",
    "col": 31,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "P32",
    "row": "P",
    "col": 32,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "P33",
    "row": "P",
    "col": 33,
    "terrain": "land",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "P34",
    "row": "P",
    "col": 34,
    "terrain": "land",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "P35",
    "row": "P",
    "col": 35,
    "terrain": "land",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "P36",
    "row": "P",
    "col": 36,
    "terrain": "land",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "P37",
    "row": "P",
    "col": 37,
    "terrain": "land",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "P38",
    "row": "P",
    "col": 38,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "P39",
    "row": "P",
    "col": 39,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "P40",
    "row": "P",
    "col": 40,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "P41",
    "row": "P",
    "col": 41,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false
  },
  {
    "id": "P42",
    "row": "P",
    "col": 42,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false
  },
  {
    "id": "Q1",
    "row": "Q",
    "col": 1,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "Q2",
    "row": "Q",
    "col": 2,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "Q3",
    "row": "Q",
    "col": 3,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "Q4",
    "row": "Q",
    "col": 4,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "Q5",
    "row": "Q",
    "col": 5,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "Q6",
    "row": "Q",
    "col": 6,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "Q7",
    "row": "Q",
    "col": 7,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "Q8",
    "row": "Q",
    "col": 8,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "Q9",
    "row": "Q",
    "col": 9,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "Q10",
    "row": "Q",
    "col": 10,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "Q11",
    "row": "Q",
    "col": 11,
    "terrain": "coastal",
    "countries": [],
    "isOcean": false,
    "isCoastal": true,
    "notes": ""
  },
  {
    "id": "Q12",
    "row": "Q",
    "col": 12,
    "terrain": "land",
    "countries": [
      "AR"
    ],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "Q13",
    "row": "Q",
    "col": 13,
    "terrain": "land",
    "countries": [
      "BR",
      "AR"
    ],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "Q14",
    "row": "Q",
    "col": 14,
    "terrain": "land",
    "countries": [
      "BR"
    ],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "Q15",
    "row": "Q",
    "col": 15,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "Q16",
    "row": "Q",
    "col": 16,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "Q17",
    "row": "Q",
    "col": 17,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "Q18",
    "row": "Q",
    "col": 18,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "Q19",
    "row": "Q",
    "col": 19,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "Q20",
    "row": "Q",
    "col": 20,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "Q21",
    "row": "Q",
    "col": 21,
    "terrain": "land",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "Q22",
    "row": "Q",
    "col": 22,
    "terrain": "coastal",
    "countries": [],
    "isOcean": false,
    "isCoastal": true,
    "notes": ""
  },
  {
    "id": "Q23",
    "row": "Q",
    "col": 23,
    "terrain": "coastal",
    "countries": [],
    "isOcean": false,
    "isCoastal": true,
    "notes": ""
  },
  {
    "id": "Q24",
    "row": "Q",
    "col": 24,
    "terrain": "land",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "Q25",
    "row": "Q",
    "col": 25,
    "terrain": "land",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "Q26",
    "row": "Q",
    "col": 26,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "Q27",
    "row": "Q",
    "col": 27,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "Q28",
    "row": "Q",
    "col": 28,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "Q29",
    "row": "Q",
    "col": 29,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "Q30",
    "row": "Q",
    "col": 30,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "Q31",
    "row": "Q",
    "col": 31,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "Q32",
    "row": "Q",
    "col": 32,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "Q33",
    "row": "Q",
    "col": 33,
    "terrain": "land",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "Q34",
    "row": "Q",
    "col": 34,
    "terrain": "land",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "Q35",
    "row": "Q",
    "col": 35,
    "terrain": "land",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "Q36",
    "row": "Q",
    "col": 36,
    "terrain": "land",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "Q37",
    "row": "Q",
    "col": 37,
    "terrain": "land",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "Q38",
    "row": "Q",
    "col": 38,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "Q39",
    "row": "Q",
    "col": 39,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "Q40",
    "row": "Q",
    "col": 40,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "Q41",
    "row": "Q",
    "col": 41,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false
  },
  {
    "id": "Q42",
    "row": "Q",
    "col": 42,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false
  },
  {
    "id": "R1",
    "row": "R",
    "col": 1,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "R2",
    "row": "R",
    "col": 2,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "R3",
    "row": "R",
    "col": 3,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "R4",
    "row": "R",
    "col": 4,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "R5",
    "row": "R",
    "col": 5,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "R6",
    "row": "R",
    "col": 6,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "R7",
    "row": "R",
    "col": 7,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "R8",
    "row": "R",
    "col": 8,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "R9",
    "row": "R",
    "col": 9,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "R10",
    "row": "R",
    "col": 10,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "R11",
    "row": "R",
    "col": 11,
    "terrain": "coastal",
    "countries": [],
    "isOcean": false,
    "isCoastal": true,
    "notes": ""
  },
  {
    "id": "R12",
    "row": "R",
    "col": 12,
    "terrain": "land",
    "countries": [
      "AR"
    ],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "R13",
    "row": "R",
    "col": 13,
    "terrain": "land",
    "countries": [
      "AR"
    ],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "R14",
    "row": "R",
    "col": 14,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "R15",
    "row": "R",
    "col": 15,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "R16",
    "row": "R",
    "col": 16,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "R17",
    "row": "R",
    "col": 17,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "R18",
    "row": "R",
    "col": 18,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "R19",
    "row": "R",
    "col": 19,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "R20",
    "row": "R",
    "col": 20,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "R21",
    "row": "R",
    "col": 21,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "R22",
    "row": "R",
    "col": 22,
    "terrain": "coastal",
    "countries": [],
    "isOcean": false,
    "isCoastal": true,
    "notes": ""
  },
  {
    "id": "R23",
    "row": "R",
    "col": 23,
    "terrain": "land",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "R24",
    "row": "R",
    "col": 24,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "R25",
    "row": "R",
    "col": 25,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "R26",
    "row": "R",
    "col": 26,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "R27",
    "row": "R",
    "col": 27,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "R28",
    "row": "R",
    "col": 28,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "R29",
    "row": "R",
    "col": 29,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "R30",
    "row": "R",
    "col": 30,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "R31",
    "row": "R",
    "col": 31,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "R32",
    "row": "R",
    "col": 32,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "R33",
    "row": "R",
    "col": 33,
    "terrain": "land",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "R34",
    "row": "R",
    "col": 34,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "R35",
    "row": "R",
    "col": 35,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "R36",
    "row": "R",
    "col": 36,
    "terrain": "land",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "R37",
    "row": "R",
    "col": 37,
    "terrain": "land",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "R38",
    "row": "R",
    "col": 38,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "R39",
    "row": "R",
    "col": 39,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "R40",
    "row": "R",
    "col": 40,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "R41",
    "row": "R",
    "col": 41,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false
  },
  {
    "id": "R42",
    "row": "R",
    "col": 42,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false
  },
  {
    "id": "S1",
    "row": "S",
    "col": 1,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "S2",
    "row": "S",
    "col": 2,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "S3",
    "row": "S",
    "col": 3,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "S4",
    "row": "S",
    "col": 4,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "S5",
    "row": "S",
    "col": 5,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "S6",
    "row": "S",
    "col": 6,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "S7",
    "row": "S",
    "col": 7,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "S8",
    "row": "S",
    "col": 8,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "S9",
    "row": "S",
    "col": 9,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "S10",
    "row": "S",
    "col": 10,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "S11",
    "row": "S",
    "col": 11,
    "terrain": "coastal",
    "countries": [
      "AR"
    ],
    "isOcean": false,
    "isCoastal": true,
    "notes": ""
  },
  {
    "id": "S12",
    "row": "S",
    "col": 12,
    "terrain": "land",
    "countries": [
      "AR"
    ],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "S13",
    "row": "S",
    "col": 13,
    "terrain": "land",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "S14",
    "row": "S",
    "col": 14,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "S15",
    "row": "S",
    "col": 15,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "S16",
    "row": "S",
    "col": 16,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "S17",
    "row": "S",
    "col": 17,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "S18",
    "row": "S",
    "col": 18,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "S19",
    "row": "S",
    "col": 19,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "S20",
    "row": "S",
    "col": 20,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "S21",
    "row": "S",
    "col": 21,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "S22",
    "row": "S",
    "col": 22,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "S23",
    "row": "S",
    "col": 23,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "S24",
    "row": "S",
    "col": 24,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "S25",
    "row": "S",
    "col": 25,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "S26",
    "row": "S",
    "col": 26,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "S27",
    "row": "S",
    "col": 27,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "S28",
    "row": "S",
    "col": 28,
    "terrain": "land",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "S29",
    "row": "S",
    "col": 29,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "S30",
    "row": "S",
    "col": 30,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "S31",
    "row": "S",
    "col": 31,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "S32",
    "row": "S",
    "col": 32,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "S33",
    "row": "S",
    "col": 33,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "S34",
    "row": "S",
    "col": 34,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "S35",
    "row": "S",
    "col": 35,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "S36",
    "row": "S",
    "col": 36,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "S37",
    "row": "S",
    "col": 37,
    "terrain": "land",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "S38",
    "row": "S",
    "col": 38,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "S39",
    "row": "S",
    "col": 39,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "S40",
    "row": "S",
    "col": 40,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "S41",
    "row": "S",
    "col": 41,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false
  },
  {
    "id": "S42",
    "row": "S",
    "col": 42,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false
  },
  {
    "id": "T1",
    "row": "T",
    "col": 1,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "T2",
    "row": "T",
    "col": 2,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "T3",
    "row": "T",
    "col": 3,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "T4",
    "row": "T",
    "col": 4,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "T5",
    "row": "T",
    "col": 5,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "T6",
    "row": "T",
    "col": 6,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "T7",
    "row": "T",
    "col": 7,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "T8",
    "row": "T",
    "col": 8,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "T9",
    "row": "T",
    "col": 9,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "T10",
    "row": "T",
    "col": 10,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "T11",
    "row": "T",
    "col": 11,
    "terrain": "coastal",
    "countries": [
      "AR"
    ],
    "isOcean": false,
    "isCoastal": true,
    "notes": ""
  },
  {
    "id": "T12",
    "row": "T",
    "col": 12,
    "terrain": "land",
    "countries": [
      "AR"
    ],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "T13",
    "row": "T",
    "col": 13,
    "terrain": "land",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "T14",
    "row": "T",
    "col": 14,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "T15",
    "row": "T",
    "col": 15,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "T16",
    "row": "T",
    "col": 16,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "T17",
    "row": "T",
    "col": 17,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "T18",
    "row": "T",
    "col": 18,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "T19",
    "row": "T",
    "col": 19,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "T20",
    "row": "T",
    "col": 20,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "T21",
    "row": "T",
    "col": 21,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "T22",
    "row": "T",
    "col": 22,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "T23",
    "row": "T",
    "col": 23,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "T24",
    "row": "T",
    "col": 24,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "T25",
    "row": "T",
    "col": 25,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "T26",
    "row": "T",
    "col": 26,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "T27",
    "row": "T",
    "col": 27,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "T28",
    "row": "T",
    "col": 28,
    "terrain": "land",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "T29",
    "row": "T",
    "col": 29,
    "terrain": "land",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "T30",
    "row": "T",
    "col": 30,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "T31",
    "row": "T",
    "col": 31,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "T32",
    "row": "T",
    "col": 32,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "T33",
    "row": "T",
    "col": 33,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "T34",
    "row": "T",
    "col": 34,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "T35",
    "row": "T",
    "col": 35,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "T36",
    "row": "T",
    "col": 36,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "T37",
    "row": "T",
    "col": 37,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "T38",
    "row": "T",
    "col": 38,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "T39",
    "row": "T",
    "col": 39,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "T40",
    "row": "T",
    "col": 40,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "T41",
    "row": "T",
    "col": 41,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false
  },
  {
    "id": "T42",
    "row": "T",
    "col": 42,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false
  },
  {
    "id": "U1",
    "row": "U",
    "col": 1,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "U2",
    "row": "U",
    "col": 2,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "U3",
    "row": "U",
    "col": 3,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "U4",
    "row": "U",
    "col": 4,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "U5",
    "row": "U",
    "col": 5,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "U6",
    "row": "U",
    "col": 6,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "U7",
    "row": "U",
    "col": 7,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "U8",
    "row": "U",
    "col": 8,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "U9",
    "row": "U",
    "col": 9,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "U10",
    "row": "U",
    "col": 10,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "U11",
    "row": "U",
    "col": 11,
    "terrain": "land",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "U12",
    "row": "U",
    "col": 12,
    "terrain": "land",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "U13",
    "row": "U",
    "col": 13,
    "terrain": "land",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "U14",
    "row": "U",
    "col": 14,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "U15",
    "row": "U",
    "col": 15,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "U16",
    "row": "U",
    "col": 16,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "U17",
    "row": "U",
    "col": 17,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "U18",
    "row": "U",
    "col": 18,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "U19",
    "row": "U",
    "col": 19,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "U20",
    "row": "U",
    "col": 20,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "U21",
    "row": "U",
    "col": 21,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "U22",
    "row": "U",
    "col": 22,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "U23",
    "row": "U",
    "col": 23,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "U24",
    "row": "U",
    "col": 24,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "U25",
    "row": "U",
    "col": 25,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "U26",
    "row": "U",
    "col": 26,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "U27",
    "row": "U",
    "col": 27,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "U28",
    "row": "U",
    "col": 28,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "U29",
    "row": "U",
    "col": 29,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "U30",
    "row": "U",
    "col": 30,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "U31",
    "row": "U",
    "col": 31,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "U32",
    "row": "U",
    "col": 32,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "U33",
    "row": "U",
    "col": 33,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "U34",
    "row": "U",
    "col": 34,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "U35",
    "row": "U",
    "col": 35,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "U36",
    "row": "U",
    "col": 36,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "U37",
    "row": "U",
    "col": 37,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "U38",
    "row": "U",
    "col": 38,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "U39",
    "row": "U",
    "col": 39,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "U40",
    "row": "U",
    "col": 40,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "U41",
    "row": "U",
    "col": 41,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false
  },
  {
    "id": "U42",
    "row": "U",
    "col": 42,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false
  },
  {
    "id": "V1",
    "row": "V",
    "col": 1,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "V2",
    "row": "V",
    "col": 2,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "V3",
    "row": "V",
    "col": 3,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "V4",
    "row": "V",
    "col": 4,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "V5",
    "row": "V",
    "col": 5,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "V6",
    "row": "V",
    "col": 6,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "V7",
    "row": "V",
    "col": 7,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "V8",
    "row": "V",
    "col": 8,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "V9",
    "row": "V",
    "col": 9,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "V10",
    "row": "V",
    "col": 10,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "V11",
    "row": "V",
    "col": 11,
    "terrain": "land",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "V12",
    "row": "V",
    "col": 12,
    "terrain": "arctic",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "V13",
    "row": "V",
    "col": 13,
    "terrain": "land",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "V14",
    "row": "V",
    "col": 14,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "V15",
    "row": "V",
    "col": 15,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "V16",
    "row": "V",
    "col": 16,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "V17",
    "row": "V",
    "col": 17,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "V18",
    "row": "V",
    "col": 18,
    "terrain": "coastal",
    "countries": [],
    "isOcean": false,
    "isCoastal": true,
    "notes": ""
  },
  {
    "id": "V19",
    "row": "V",
    "col": 19,
    "terrain": "coastal",
    "countries": [],
    "isOcean": false,
    "isCoastal": true,
    "notes": ""
  },
  {
    "id": "V20",
    "row": "V",
    "col": 20,
    "terrain": "coastal",
    "countries": [],
    "isOcean": false,
    "isCoastal": true,
    "notes": ""
  },
  {
    "id": "V21",
    "row": "V",
    "col": 21,
    "terrain": "arctic",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "V22",
    "row": "V",
    "col": 22,
    "terrain": "arctic",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "V23",
    "row": "V",
    "col": 23,
    "terrain": "arctic",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "V24",
    "row": "V",
    "col": 24,
    "terrain": "arctic",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "V25",
    "row": "V",
    "col": 25,
    "terrain": "arctic",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "V26",
    "row": "V",
    "col": 26,
    "terrain": "arctic",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "V27",
    "row": "V",
    "col": 27,
    "terrain": "arctic",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "V28",
    "row": "V",
    "col": 28,
    "terrain": "arctic",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "V29",
    "row": "V",
    "col": 29,
    "terrain": "arctic",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "V30",
    "row": "V",
    "col": 30,
    "terrain": "arctic",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "V31",
    "row": "V",
    "col": 31,
    "terrain": "arctic",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "V32",
    "row": "V",
    "col": 32,
    "terrain": "arctic",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "V33",
    "row": "V",
    "col": 33,
    "terrain": "arctic",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "V34",
    "row": "V",
    "col": 34,
    "terrain": "arctic",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "V35",
    "row": "V",
    "col": 35,
    "terrain": "arctic",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "V36",
    "row": "V",
    "col": 36,
    "terrain": "arctic",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "V37",
    "row": "V",
    "col": 37,
    "terrain": "arctic",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "V38",
    "row": "V",
    "col": 38,
    "terrain": "arctic",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "V39",
    "row": "V",
    "col": 39,
    "terrain": "coastal",
    "countries": [],
    "isOcean": false,
    "isCoastal": true,
    "notes": ""
  },
  {
    "id": "V40",
    "row": "V",
    "col": 40,
    "terrain": "arctic",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "V41",
    "row": "V",
    "col": 41,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false
  },
  {
    "id": "V42",
    "row": "V",
    "col": 42,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false
  },
  {
    "id": "W1",
    "row": "W",
    "col": 1,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "W2",
    "row": "W",
    "col": 2,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "W3",
    "row": "W",
    "col": 3,
    "terrain": "arctic",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "W4",
    "row": "W",
    "col": 4,
    "terrain": "arctic",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "W5",
    "row": "W",
    "col": 5,
    "terrain": "arctic",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "W6",
    "row": "W",
    "col": 6,
    "terrain": "arctic",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "W7",
    "row": "W",
    "col": 7,
    "terrain": "arctic",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "W8",
    "row": "W",
    "col": 8,
    "terrain": "arctic",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "W9",
    "row": "W",
    "col": 9,
    "terrain": "arctic",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "W10",
    "row": "W",
    "col": 10,
    "terrain": "arctic",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "W11",
    "row": "W",
    "col": 11,
    "terrain": "arctic",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "W12",
    "row": "W",
    "col": 12,
    "terrain": "arctic",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "W13",
    "row": "W",
    "col": 13,
    "terrain": "land",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "W14",
    "row": "W",
    "col": 14,
    "terrain": "land",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "W15",
    "row": "W",
    "col": 15,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "W16",
    "row": "W",
    "col": 16,
    "terrain": "arctic",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "W17",
    "row": "W",
    "col": 17,
    "terrain": "arctic",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "W18",
    "row": "W",
    "col": 18,
    "terrain": "arctic",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "W19",
    "row": "W",
    "col": 19,
    "terrain": "arctic",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "W20",
    "row": "W",
    "col": 20,
    "terrain": "arctic",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "W21",
    "row": "W",
    "col": 21,
    "terrain": "arctic",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "W22",
    "row": "W",
    "col": 22,
    "terrain": "arctic",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "W23",
    "row": "W",
    "col": 23,
    "terrain": "arctic",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "W24",
    "row": "W",
    "col": 24,
    "terrain": "arctic",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "W25",
    "row": "W",
    "col": 25,
    "terrain": "arctic",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "W26",
    "row": "W",
    "col": 26,
    "terrain": "arctic",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "W27",
    "row": "W",
    "col": 27,
    "terrain": "arctic",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "W28",
    "row": "W",
    "col": 28,
    "terrain": "arctic",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "W29",
    "row": "W",
    "col": 29,
    "terrain": "arctic",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "W30",
    "row": "W",
    "col": 30,
    "terrain": "arctic",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "W31",
    "row": "W",
    "col": 31,
    "terrain": "arctic",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "W32",
    "row": "W",
    "col": 32,
    "terrain": "arctic",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "W33",
    "row": "W",
    "col": 33,
    "terrain": "arctic",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "W34",
    "row": "W",
    "col": 34,
    "terrain": "arctic",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "W35",
    "row": "W",
    "col": 35,
    "terrain": "arctic",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "W36",
    "row": "W",
    "col": 36,
    "terrain": "arctic",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "W37",
    "row": "W",
    "col": 37,
    "terrain": "arctic",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "W38",
    "row": "W",
    "col": 38,
    "terrain": "arctic",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "W39",
    "row": "W",
    "col": 39,
    "terrain": "arctic",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "W40",
    "row": "W",
    "col": 40,
    "terrain": "arctic",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "W41",
    "row": "W",
    "col": 41,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false
  },
  {
    "id": "W42",
    "row": "W",
    "col": 42,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false
  },
  {
    "id": "X1",
    "row": "X",
    "col": 1,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "X2",
    "row": "X",
    "col": 2,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "X3",
    "row": "X",
    "col": 3,
    "terrain": "arctic",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "X4",
    "row": "X",
    "col": 4,
    "terrain": "arctic",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "X5",
    "row": "X",
    "col": 5,
    "terrain": "arctic",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "X6",
    "row": "X",
    "col": 6,
    "terrain": "arctic",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "X7",
    "row": "X",
    "col": 7,
    "terrain": "arctic",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "X8",
    "row": "X",
    "col": 8,
    "terrain": "arctic",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "X9",
    "row": "X",
    "col": 9,
    "terrain": "arctic",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "X10",
    "row": "X",
    "col": 10,
    "terrain": "arctic",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "X11",
    "row": "X",
    "col": 11,
    "terrain": "arctic",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "X12",
    "row": "X",
    "col": 12,
    "terrain": "arctic",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "X13",
    "row": "X",
    "col": 13,
    "terrain": "arctic",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "X14",
    "row": "X",
    "col": 14,
    "terrain": "arctic",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "X15",
    "row": "X",
    "col": 15,
    "terrain": "arctic",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "X16",
    "row": "X",
    "col": 16,
    "terrain": "arctic",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "X17",
    "row": "X",
    "col": 17,
    "terrain": "arctic",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "X18",
    "row": "X",
    "col": 18,
    "terrain": "arctic",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "X19",
    "row": "X",
    "col": 19,
    "terrain": "arctic",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "X20",
    "row": "X",
    "col": 20,
    "terrain": "arctic",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "X21",
    "row": "X",
    "col": 21,
    "terrain": "arctic",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "X22",
    "row": "X",
    "col": 22,
    "terrain": "arctic",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "X23",
    "row": "X",
    "col": 23,
    "terrain": "arctic",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "X24",
    "row": "X",
    "col": 24,
    "terrain": "arctic",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "X25",
    "row": "X",
    "col": 25,
    "terrain": "arctic",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "X26",
    "row": "X",
    "col": 26,
    "terrain": "arctic",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "X27",
    "row": "X",
    "col": 27,
    "terrain": "arctic",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "X28",
    "row": "X",
    "col": 28,
    "terrain": "arctic",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "X29",
    "row": "X",
    "col": 29,
    "terrain": "arctic",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "X30",
    "row": "X",
    "col": 30,
    "terrain": "arctic",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "X31",
    "row": "X",
    "col": 31,
    "terrain": "arctic",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "X32",
    "row": "X",
    "col": 32,
    "terrain": "arctic",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "X33",
    "row": "X",
    "col": 33,
    "terrain": "arctic",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "X34",
    "row": "X",
    "col": 34,
    "terrain": "arctic",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "X35",
    "row": "X",
    "col": 35,
    "terrain": "arctic",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "X36",
    "row": "X",
    "col": 36,
    "terrain": "arctic",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "X37",
    "row": "X",
    "col": 37,
    "terrain": "arctic",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "X38",
    "row": "X",
    "col": 38,
    "terrain": "arctic",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "X39",
    "row": "X",
    "col": 39,
    "terrain": "arctic",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "X40",
    "row": "X",
    "col": 40,
    "terrain": "arctic",
    "countries": [],
    "isOcean": false,
    "isCoastal": false,
    "notes": ""
  },
  {
    "id": "X41",
    "row": "X",
    "col": 41,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false
  },
  {
    "id": "X42",
    "row": "X",
    "col": 42,
    "terrain": "ocean",
    "countries": [],
    "isOcean": true,
    "isCoastal": false
  }
];

// Utility functions
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
  if (!sector) return [];

  const rowIndex = 'ABCDEFGHIJKLMNOPQRSTUVWX'.indexOf(sector.row);
  const adjacent: Sector[] = [];

  // Check all 8 directions
  const directions = [
    [-1, -1], [-1, 0], [-1, 1],
    [0, -1],           [0, 1],
    [1, -1],  [1, 0],  [1, 1]
  ];

  for (const [dr, dc] of directions) {
    const newRowIndex = rowIndex + dr;
    const newCol = sector.col + dc;

    if (newRowIndex >= 0 && newRowIndex < 24 && newCol >= 1 && newCol <= 42) {
      const newRow = 'ABCDEFGHIJKLMNOPQRSTUVWX'[newRowIndex];
      const adj = getSectorByRowCol(newRow, newCol);
      if (adj) adjacent.push(adj);
    }
  }

  return adjacent;
}

export function getSectorStats() {
  const stats = {
    total: SECTORS.length,
    ocean: 0,
    land: 0,
    withCountries: 0,
    byTerrain: {} as Record<string, number>,
    byCountry: {} as Record<string, number>,
  };

  for (const sector of SECTORS) {
    if (sector.isOcean || sector.terrain === 'ocean') stats.ocean++;
    else stats.land++;

    if (sector.countries.length > 0) stats.withCountries++;

    stats.byTerrain[sector.terrain] = (stats.byTerrain[sector.terrain] || 0) + 1;

    for (const country of sector.countries) {
      stats.byCountry[country] = (stats.byCountry[country] || 0) + 1;
    }
  }

  return stats;
}

export function exportSectorsJSON(): string {
  return JSON.stringify(SECTORS, null, 2);
}
