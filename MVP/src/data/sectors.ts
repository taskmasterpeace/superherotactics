/**
 * Sector Data System for SuperHero Tactics World Map
 * 42x24 grid (A-X rows, 1-42 columns)
 * Re-exports from auto-populated sectors file
 */

// Re-export everything from populated sectors
export {
  SECTORS,
  TERRAIN_COLORS,
  getSector,
  getSectorsByCountry,
  getSectorsByTerrain,
  getSectorByRowCol,
  getAdjacentSectors,
  getSectorStats,
  exportSectorsJSON,
} from './sectors-populated';

export type { Sector, SectorTerrain } from './sectors-populated';

// Additional utility functions for editing (not in populated file)
import { SECTORS } from './sectors-populated';
import type { Sector } from './sectors-populated';

export function updateSector(id: string, updates: Partial<Omit<Sector, 'id' | 'row' | 'col'>>): void {
  const index = SECTORS.findIndex(s => s.id === id);
  if (index !== -1) {
    SECTORS[index] = { ...SECTORS[index], ...updates };
  }
}

export function importSectorsJSON(json: string): boolean {
  try {
    const imported = JSON.parse(json);
    if (Array.isArray(imported) && imported.length === 1008) { // 24 * 42
      SECTORS.splice(0, SECTORS.length, ...imported);
      return true;
    }
    return false;
  } catch (e) {
    return false;
  }
}
