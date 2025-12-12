/**
 * Sector Helper Functions
 * Utility functions for working with sector data
 */

import { SECTORS, getSector, getSectorsByCountry, type Sector, type SectorTerrain } from './sectors';
import { getCountryByCode } from './countries';

/**
 * Get all sectors that border a specific country
 */
export function getBorderingSectors(countryCode: string): Sector[] {
  const countrySectors = getSectorsByCountry(countryCode);
  const borderingSet = new Set<string>();

  countrySectors.forEach(sector => {
    const adjacent = getAdjacentSectorsForSector(sector);
    adjacent.forEach(adjSector => {
      // Add sectors that don't belong to this country but are adjacent
      if (!adjSector.countries.includes(countryCode)) {
        borderingSet.add(adjSector.id);
      }
    });
  });

  return Array.from(borderingSet).map(id => getSector(id)!).filter(Boolean);
}

/**
 * Get adjacent sectors for a given sector
 */
export function getAdjacentSectorsForSector(sector: Sector): Sector[] {
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
      const adjacentSector = SECTORS.find(s => s.row === newRow && s.col === newCol);
      if (adjacentSector) {
        adjacent.push(adjacentSector);
      }
    }
  }

  return adjacent;
}

/**
 * Find countries that share a border
 */
export function getBorderingCountries(countryCode: string): string[] {
  const borderingSet = new Set<string>();
  const countrySectors = getSectorsByCountry(countryCode);

  countrySectors.forEach(sector => {
    const adjacent = getAdjacentSectorsForSector(sector);
    adjacent.forEach(adjSector => {
      adjSector.countries.forEach(code => {
        if (code !== countryCode) {
          borderingSet.add(code);
        }
      });
    });
  });

  return Array.from(borderingSet);
}

/**
 * Calculate distance between two sectors (Manhattan distance)
 */
export function getSectorDistance(sector1: Sector, sector2: Sector): number {
  const row1 = sector1.row.charCodeAt(0) - 65;
  const row2 = sector2.row.charCodeAt(0) - 65;
  return Math.abs(row1 - row2) + Math.abs(sector1.col - sector2.col);
}

/**
 * Get all sectors within a radius of a given sector
 */
export function getSectorsInRadius(center: Sector, radius: number): Sector[] {
  return SECTORS.filter(sector => getSectorDistance(center, sector) <= radius);
}

/**
 * Find the closest sector to a given sector that matches criteria
 */
export function findClosestSector(
  from: Sector,
  filter: (sector: Sector) => boolean
): Sector | null {
  const candidates = SECTORS.filter(filter);
  if (candidates.length === 0) return null;

  let closest = candidates[0];
  let minDistance = getSectorDistance(from, closest);

  for (const candidate of candidates) {
    const distance = getSectorDistance(from, candidate);
    if (distance < minDistance) {
      minDistance = distance;
      closest = candidate;
    }
  }

  return closest;
}

/**
 * Get sectors along a coast (land sectors adjacent to ocean)
 */
export function getCoastalSectors(): Sector[] {
  return SECTORS.filter(sector => {
    if (sector.isOcean) return false;
    const adjacent = getAdjacentSectorsForSector(sector);
    return adjacent.some(adj => adj.isOcean);
  });
}

/**
 * Get all ocean sectors
 */
export function getOceanSectors(): Sector[] {
  return SECTORS.filter(s => s.isOcean);
}

/**
 * Get territory size for a country (number of sectors)
 */
export function getCountryTerritorySize(countryCode: string): number {
  return getSectorsByCountry(countryCode).length;
}

/**
 * Get terrain distribution for a country
 */
export function getCountryTerrainDistribution(countryCode: string): Record<SectorTerrain, number> {
  const sectors = getSectorsByCountry(countryCode);
  const distribution: Record<string, number> = {};

  sectors.forEach(sector => {
    distribution[sector.terrain] = (distribution[sector.terrain] || 0) + 1;
  });

  return distribution as Record<SectorTerrain, number>;
}

/**
 * Check if two countries share a border
 */
export function countriesShareBorder(country1: string, country2: string): boolean {
  const borderingCountries = getBorderingCountries(country1);
  return borderingCountries.includes(country2);
}

/**
 * Get central sector for a country (average position)
 */
export function getCountryCenterSector(countryCode: string): Sector | null {
  const sectors = getSectorsByCountry(countryCode);
  if (sectors.length === 0) return null;

  const avgRow = Math.round(
    sectors.reduce((sum, s) => sum + (s.row.charCodeAt(0) - 65), 0) / sectors.length
  );
  const avgCol = Math.round(
    sectors.reduce((sum, s) => sum + s.col, 0) / sectors.length
  );

  const centerRow = String.fromCharCode(65 + avgRow);
  return findClosestSector(
    SECTORS.find(s => s.row === centerRow && s.col === avgCol)!,
    s => s.countries.includes(countryCode)
  );
}

/**
 * Find path between two sectors (simple breadth-first search)
 * Returns array of sectors forming the path, or null if no path exists
 */
export function findPath(
  from: Sector,
  to: Sector,
  canTraverse: (sector: Sector) => boolean = () => true
): Sector[] | null {
  if (from.id === to.id) return [from];

  const queue: { sector: Sector; path: Sector[] }[] = [{ sector: from, path: [from] }];
  const visited = new Set<string>([from.id]);

  while (queue.length > 0) {
    const { sector, path } = queue.shift()!;

    if (sector.id === to.id) return path;

    const adjacent = getAdjacentSectorsForSector(sector);
    for (const adjSector of adjacent) {
      if (!visited.has(adjSector.id) && canTraverse(adjSector)) {
        visited.add(adjSector.id);
        queue.push({ sector: adjSector, path: [...path, adjSector] });
      }
    }
  }

  return null; // No path found
}

/**
 * Get travel distance between two countries (using center sectors)
 */
export function getCountryDistance(country1: string, country2: string): number | null {
  const center1 = getCountryCenterSector(country1);
  const center2 = getCountryCenterSector(country2);

  if (!center1 || !center2) return null;

  return getSectorDistance(center1, center2);
}

/**
 * Get all countries in a region (defined by sector range)
 */
export function getCountriesInRegion(
  rowStart: string,
  rowEnd: string,
  colStart: number,
  colEnd: number
): string[] {
  const rowStartIndex = rowStart.charCodeAt(0) - 65;
  const rowEndIndex = rowEnd.charCodeAt(0) - 65;

  const countries = new Set<string>();

  SECTORS.forEach(sector => {
    const rowIndex = sector.row.charCodeAt(0) - 65;
    if (
      rowIndex >= rowStartIndex &&
      rowIndex <= rowEndIndex &&
      sector.col >= colStart &&
      sector.col <= colEnd
    ) {
      sector.countries.forEach(code => countries.add(code));
    }
  });

  return Array.from(countries);
}

/**
 * Export sector data for a specific country
 */
export function exportCountrySectors(countryCode: string): string {
  const sectors = getSectorsByCountry(countryCode);
  const country = getCountryByCode(countryCode);

  return JSON.stringify({
    country: country?.name || countryCode,
    code: countryCode,
    sectorCount: sectors.length,
    sectors: sectors.map(s => ({
      id: s.id,
      terrain: s.terrain,
      isCoastal: s.isCoastal,
      notes: s.notes
    }))
  }, null, 2);
}
