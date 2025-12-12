/**
 * Sector System - Usage Examples
 * Demonstrates common patterns for working with sector data
 */

import { SECTORS, getSector, getSectorsByCountry, updateSector } from './sectors';
import {
  getBorderingCountries,
  getCountryDistance,
  getCountryCenterSector,
  findPath,
  getCountryTerrainDistribution,
  getSectorsInRadius,
  getCoastalSectors,
} from './sectorHelpers';

// =============================================================================
// EXAMPLE 1: Basic Sector Queries
// =============================================================================

export function example1_BasicQueries() {
  console.log('=== Example 1: Basic Sector Queries ===');

  // Get a specific sector
  const sector = getSector('K15');
  console.log('Sector K15:', sector);

  // Get all sectors for a country
  const usSectors = getSectorsByCountry('US');
  console.log(`United States occupies ${usSectors.length} sectors`);

  // Get all coastal sectors
  const coastal = getCoastalSectors();
  console.log(`Total coastal sectors: ${coastal.length}`);
}

// =============================================================================
// EXAMPLE 2: Country Analysis
// =============================================================================

export function example2_CountryAnalysis(countryCode: string) {
  console.log(`=== Example 2: Analyzing ${countryCode} ===`);

  // Territory size
  const sectors = getSectorsByCountry(countryCode);
  console.log(`Territory: ${sectors.length} sectors`);

  // Center point
  const center = getCountryCenterSector(countryCode);
  console.log(`Center: ${center?.id}`);

  // Terrain distribution
  const terrain = getCountryTerrainDistribution(countryCode);
  console.log('Terrain:', terrain);

  // Neighboring countries
  const neighbors = getBorderingCountries(countryCode);
  console.log('Borders:', neighbors.join(', '));
}

// =============================================================================
// EXAMPLE 3: Distance Calculations
// =============================================================================

export function example3_DistanceCalculations() {
  console.log('=== Example 3: Distance Calculations ===');

  // Distance between countries
  const usToUk = getCountryDistance('US', 'UK');
  console.log(`US to UK: ${usToUk} sectors`);

  const usToMx = getCountryDistance('US', 'MX');
  console.log(`US to Mexico: ${usToMx} sectors`);

  // Find all countries within range of US
  const usCenter = getCountryCenterSector('US');
  if (usCenter) {
    const nearby = getSectorsInRadius(usCenter, 5);
    const nearbyCountries = new Set(nearby.flatMap(s => s.countries));
    console.log('Countries within 5 sectors of US:', Array.from(nearbyCountries));
  }
}

// =============================================================================
// EXAMPLE 4: Pathfinding
// =============================================================================

export function example4_Pathfinding() {
  console.log('=== Example 4: Pathfinding ===');

  const start = getSector('A1');
  const end = getSector('X40');

  if (start && end) {
    // Find land path (avoid ocean)
    const landPath = findPath(start, end, sector => !sector.isOcean);
    console.log(`Land path from A1 to X40: ${landPath?.length || 'None'} sectors`);

    // Find any path (including ocean)
    const anyPath = findPath(start, end);
    console.log(`Any path from A1 to X40: ${anyPath?.length || 'None'} sectors`);
  }
}

// =============================================================================
// EXAMPLE 5: Updating Sectors
// =============================================================================

export function example5_UpdatingSectors() {
  console.log('=== Example 5: Updating Sectors ===');

  // Mark a sector as ocean
  updateSector('B5', {
    terrain: 'ocean',
    countries: [],
    isOcean: true,
    isCoastal: false,
    notes: 'Atlantic Ocean'
  });

  // Assign a sector to a country
  updateSector('K15', {
    terrain: 'plains',
    countries: ['US'],
    isOcean: false,
    isCoastal: false,
    notes: 'Central US plains region'
  });

  // Create a border region
  updateSector('L20', {
    terrain: 'mountain',
    countries: ['US', 'MX'],
    isOcean: false,
    isCoastal: false,
    notes: 'US-Mexico border, mountainous'
  });

  console.log('Sectors updated successfully');
}

// =============================================================================
// EXAMPLE 6: Regional Analysis
// =============================================================================

export function example6_RegionalAnalysis() {
  console.log('=== Example 6: Regional Analysis ===');

  // Analyze North America region (example coordinates)
  const northAmericaSectors = SECTORS.filter(s => {
    const rowIndex = s.row.charCodeAt(0) - 65; // A=0
    return rowIndex >= 0 && rowIndex <= 10 && s.col >= 1 && s.col <= 15;
  });

  const naCountries = new Set(northAmericaSectors.flatMap(s => s.countries));
  console.log(`North America region: ${northAmericaSectors.length} sectors`);
  console.log('Countries:', Array.from(naCountries).join(', '));

  // Count terrain types in region
  const terrainCounts: Record<string, number> = {};
  northAmericaSectors.forEach(s => {
    terrainCounts[s.terrain] = (terrainCounts[s.terrain] || 0) + 1;
  });
  console.log('Terrain distribution:', terrainCounts);
}

// =============================================================================
// EXAMPLE 7: Strategic Operations
// =============================================================================

export function example7_StrategicOperations() {
  console.log('=== Example 7: Strategic Operations ===');

  // Find all sectors bordering hostile territory
  const hostileCountries = ['HOSTILE1', 'HOSTILE2'];
  const friendlyCountry = 'US';

  const friendlySectors = getSectorsByCountry(friendlyCountry);
  const borderSectors = friendlySectors.filter(sector => {
    const neighbors = getBorderingCountries(friendlyCountry);
    return neighbors.some(n => hostileCountries.includes(n));
  });

  console.log(`Border sectors requiring defense: ${borderSectors.length}`);

  // Find coastal sectors for naval operations
  const coastalSectors = getCoastalSectors();
  const usCoastalSectors = coastalSectors.filter(s => s.countries.includes('US'));
  console.log(`US coastal sectors: ${usCoastalSectors.length}`);

  // Identify strategic chokepoints (sectors with many neighbors)
  const chokepoints = SECTORS.filter(sector => {
    if (sector.isOcean) return false;
    const neighbors = getBorderingCountries(sector.countries[0]);
    return neighbors.length >= 4;
  });
  console.log(`Strategic chokepoints: ${chokepoints.length}`);
}

// =============================================================================
// EXAMPLE 8: Data Export/Reporting
// =============================================================================

export function example8_DataExport(countryCode: string) {
  console.log(`=== Example 8: Exporting ${countryCode} Data ===`);

  const sectors = getSectorsByCountry(countryCode);
  const terrain = getCountryTerrainDistribution(countryCode);
  const neighbors = getBorderingCountries(countryCode);
  const center = getCountryCenterSector(countryCode);

  const report = {
    country: countryCode,
    statistics: {
      totalSectors: sectors.length,
      centerSector: center?.id,
      borderingCountries: neighbors.length,
    },
    terrain: terrain,
    neighbors: neighbors,
    sectors: sectors.map(s => ({
      id: s.id,
      terrain: s.terrain,
      isCoastal: s.isCoastal,
      notes: s.notes
    }))
  };

  console.log(JSON.stringify(report, null, 2));
  return report;
}

// =============================================================================
// EXAMPLE 9: World Statistics
// =============================================================================

export function example9_WorldStatistics() {
  console.log('=== Example 9: World Statistics ===');

  // Count total mapped sectors
  const mappedSectors = SECTORS.filter(s => s.countries.length > 0);
  console.log(`Mapped sectors: ${mappedSectors.length} / ${SECTORS.length}`);

  // Count sectors by terrain
  const terrainCounts: Record<string, number> = {};
  SECTORS.forEach(s => {
    terrainCounts[s.terrain] = (terrainCounts[s.terrain] || 0) + 1;
  });
  console.log('Global terrain distribution:', terrainCounts);

  // Find largest countries by territory
  const countrySizes: Record<string, number> = {};
  SECTORS.forEach(s => {
    s.countries.forEach(code => {
      countrySizes[code] = (countrySizes[code] || 0) + 1;
    });
  });

  const largest = Object.entries(countrySizes)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10);

  console.log('Largest countries by sector count:');
  largest.forEach(([code, count]) => {
    console.log(`  ${code}: ${count} sectors`);
  });

  // Count border regions (sectors with multiple countries)
  const borderRegions = SECTORS.filter(s => s.countries.length > 1);
  console.log(`Border regions: ${borderRegions.length}`);
}

// =============================================================================
// EXAMPLE 10: Validation Functions
// =============================================================================

export function example10_Validation() {
  console.log('=== Example 10: Data Validation ===');

  const issues: string[] = [];

  // Check for unmapped land sectors
  const unmappedLand = SECTORS.filter(s =>
    !s.isOcean && s.countries.length === 0
  );
  if (unmappedLand.length > 0) {
    issues.push(`${unmappedLand.length} unmapped land sectors`);
  }

  // Check for ocean sectors with countries
  const invalidOcean = SECTORS.filter(s =>
    s.isOcean && s.countries.length > 0
  );
  if (invalidOcean.length > 0) {
    issues.push(`${invalidOcean.length} ocean sectors with countries`);
  }

  // Check for isolated sectors (countries with non-contiguous territory)
  // This is a simplified check
  const countryCodes = new Set(SECTORS.flatMap(s => s.countries));
  countryCodes.forEach(code => {
    const sectors = getSectorsByCountry(code);
    if (sectors.length > 1) {
      // Check if all sectors are connected (simplified)
      const visited = new Set<string>();
      const queue = [sectors[0]];
      visited.add(sectors[0].id);

      while (queue.length > 0) {
        const current = queue.shift()!;
        const rowIndex = current.row.charCodeAt(0) - 65;

        // Check adjacent sectors
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            if (dr === 0 && dc === 0) continue;
            const newRow = String.fromCharCode(65 + rowIndex + dr);
            const newCol = current.col + dc;
            const adj = getSector(`${newRow}${newCol}`);
            if (adj && adj.countries.includes(code) && !visited.has(adj.id)) {
              visited.add(adj.id);
              queue.push(adj);
            }
          }
        }
      }

      if (visited.size !== sectors.length) {
        issues.push(`${code} has non-contiguous territory`);
      }
    }
  });

  if (issues.length === 0) {
    console.log('✓ No validation issues found');
  } else {
    console.log('⚠ Validation issues:');
    issues.forEach(issue => console.log(`  - ${issue}`));
  }

  return issues;
}

// =============================================================================
// Run All Examples
// =============================================================================

export function runAllExamples() {
  example1_BasicQueries();
  example2_CountryAnalysis('US');
  example3_DistanceCalculations();
  example4_Pathfinding();
  example5_UpdatingSectors();
  example6_RegionalAnalysis();
  example7_StrategicOperations();
  example8_DataExport('US');
  example9_WorldStatistics();
  example10_Validation();
}

// Uncomment to run in console:
// runAllExamples();
