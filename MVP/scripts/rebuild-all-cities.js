/**
 * Rebuild All Cities TypeScript from CSV
 * Parses the World Bible Cities CSV and generates allCities.ts
 * Links cities to countries using CountryCode -> ISO code mapping
 */

const fs = require('fs');
const path = require('path');

// Read the CSV file
const csvPath = path.join(__dirname, '../../SuperHero Tactics/SuperHero Tactics World Bible - Cities.csv');
const outputPath = path.join(__dirname, '../src/data/allCities.ts');

// Read allCountries.ts to get the country code mappings
const countriesPath = path.join(__dirname, '../src/data/allCountries.ts');
const countriesContent = fs.readFileSync(countriesPath, 'utf-8');

// Extract country ID to ISO code mapping from allCountries.ts
const countryIdToIso = {};
const countryMatches = countriesContent.matchAll(/id:\s*(\d+),\s*\n\s*code:\s*"([A-Z]{2})"/g);
for (const match of countryMatches) {
  countryIdToIso[parseInt(match[1])] = match[2];
}

// Also build mapping from country name to ISO code
const countryNameToIso = {};
const nameMatches = countriesContent.matchAll(/code:\s*"([A-Z]{2})",\s*\n\s*name:\s*"([^"]+)"/g);
for (const match of nameMatches) {
  countryNameToIso[match[2]] = match[1];
}

console.log(`Loaded ${Object.keys(countryIdToIso).length} country ID->ISO mappings`);
console.log(`Loaded ${Object.keys(countryNameToIso).length} country name->ISO mappings`);

// Read CSV
const csvContent = fs.readFileSync(csvPath, 'utf-8');
const lines = csvContent.split('\n');

// Find the actual header row (row 20 has the headers with "Sector,CountryCode,CultureCode,...")
const headerLine = lines[19]; // 0-indexed, so line 20 is index 19
const headers = headerLine.split(',');
console.log('Headers:', headers.slice(0, 15).join(', '));

// Parse cities starting from row 21 (index 20)
const cities = [];
let skippedCount = 0;

for (let i = 20; i < lines.length; i++) {
  const line = lines[i].trim();
  if (!line) continue;

  // Parse CSV properly handling commas in fields
  const values = parseCSVLine(line);

  // Skip if no city name
  const cityName = values[3]?.trim();
  if (!cityName) continue;

  const sector = values[0]?.trim() || '';
  const countryCodeNum = parseInt(values[1]) || 0;
  const cultureCode = parseInt(values[2]) || 0;
  const countryName = values[4]?.trim() || '';
  const population = parseFloat(values[5]) || 0;
  const populationRating = parseInt(values[6]) || 0;
  const populationType = values[7]?.trim() || '';
  const cityType1 = values[8]?.trim() || '';
  const cityType2 = values[9]?.trim() || '';
  const cityType3 = values[10]?.trim() || '';
  const cityType4 = values[11]?.trim() || '';
  const hvt = values[12]?.trim() || '';
  const crimeIndex = parseFloat(values[13]) || 0;
  const safetyIndex = parseFloat(values[14]) || 0;

  // Get ISO code - try by ID first, then by name
  let isoCode = countryIdToIso[countryCodeNum] || countryNameToIso[countryName] || '';

  // Log if we couldn't find an ISO code
  if (!isoCode && countryName) {
    console.log(`Warning: No ISO code for country "${countryName}" (ID: ${countryCodeNum})`);
    skippedCount++;
  }

  // Build city types array
  const cityTypes = [];
  if (cityType1) cityTypes.push(cityType1);
  if (cityType2) cityTypes.push(cityType2);
  if (cityType3) cityTypes.push(cityType3);
  if (cityType4) cityTypes.push(cityType4);

  cities.push({
    id: cities.length + 1,
    sector,
    countryId: countryCodeNum,
    countryCode: isoCode,
    countryName,
    cultureCode,
    name: cityName,
    population: Math.round(population),
    populationRating,
    populationType,
    cityTypes,
    hvt,
    crimeIndex: Math.round(crimeIndex * 100) / 100,
    safetyIndex: Math.round(safetyIndex * 100) / 100
  });
}

console.log(`Parsed ${cities.length} cities (${skippedCount} warnings)`);

// Generate TypeScript
const tsContent = `/**
 * Complete City Database - ALL ${cities.length} Cities
 * Auto-generated from SuperHero Tactics World Bible CSV
 * Each city linked to its country via ISO code
 */

export interface City {
  id: number;
  sector: string;            // Grid sector like "LJ5", "GA4" or empty
  countryId: number;         // Numeric country ID from CSV
  countryCode: string;       // 2-letter ISO code (links to Country.code)
  countryName: string;       // Country name for display
  cultureCode: number;       // 1-14 culture region
  name: string;              // City name
  population: number;
  populationRating: number;  // 1-7 scale
  populationType: string;    // "City", "Large City", "Mega City", "Town", "Small Town"
  cityTypes: string[];       // Up to 4 types: Industrial, Political, Military, etc.
  hvt: string;               // High Value Target
  crimeIndex: number;        // 0-100
  safetyIndex: number;       // 0-100
}

export const ALL_CITIES: City[] = ${JSON.stringify(cities, null, 2)};

// Utility functions
export function getCity(id: number): City | undefined {
  return ALL_CITIES.find(c => c.id === id);
}

export function getCityByName(name: string): City | undefined {
  return ALL_CITIES.find(c => c.name.toLowerCase() === name.toLowerCase());
}

export function getCitiesByCountry(countryCode: string): City[] {
  return ALL_CITIES.filter(c => c.countryCode === countryCode);
}

export function getCitiesBySector(sector: string): City[] {
  return ALL_CITIES.filter(c => c.sector === sector);
}

export function getCitiesByCultureCode(cultureCode: number): City[] {
  return ALL_CITIES.filter(c => c.cultureCode === cultureCode);
}

export function getCitiesByType(cityType: string): City[] {
  return ALL_CITIES.filter(c => c.cityTypes.includes(cityType));
}

export function getMegaCities(): City[] {
  return ALL_CITIES.filter(c => c.populationType === 'Mega City');
}

export function getLargeCities(): City[] {
  return ALL_CITIES.filter(c => c.populationType === 'Large City');
}

export function getHighCrimeCities(threshold: number = 70): City[] {
  return ALL_CITIES.filter(c => c.crimeIndex >= threshold);
}

export function getSafeCities(threshold: number = 60): City[] {
  return ALL_CITIES.filter(c => c.safetyIndex >= threshold);
}

export function getCityStats() {
  const stats = {
    total: ALL_CITIES.length,
    byCountry: {} as Record<string, number>,
    byType: {} as Record<string, number>,
    byPopulationType: {} as Record<string, number>,
    byCultureCode: {} as Record<number, number>,
    withSector: 0,
    megaCities: 0,
    largeCities: 0,
    avgCrime: 0,
    avgSafety: 0
  };

  let totalCrime = 0;
  let totalSafety = 0;

  for (const city of ALL_CITIES) {
    stats.byCountry[city.countryCode] = (stats.byCountry[city.countryCode] || 0) + 1;
    stats.byCultureCode[city.cultureCode] = (stats.byCultureCode[city.cultureCode] || 0) + 1;
    stats.byPopulationType[city.populationType] = (stats.byPopulationType[city.populationType] || 0) + 1;

    for (const type of city.cityTypes) {
      stats.byType[type] = (stats.byType[type] || 0) + 1;
    }

    if (city.sector) stats.withSector++;
    if (city.populationType === 'Mega City') stats.megaCities++;
    if (city.populationType === 'Large City') stats.largeCities++;

    totalCrime += city.crimeIndex;
    totalSafety += city.safetyIndex;
  }

  stats.avgCrime = Math.round(totalCrime / ALL_CITIES.length * 100) / 100;
  stats.avgSafety = Math.round(totalSafety / ALL_CITIES.length * 100) / 100;

  return stats;
}
`;

fs.writeFileSync(outputPath, tsContent);
console.log(`\nGenerated allCities.ts with ${cities.length} cities`);

// Show some stats
const countryCounts = {};
for (const city of cities) {
  countryCounts[city.countryCode || 'UNKNOWN'] = (countryCounts[city.countryCode || 'UNKNOWN'] || 0) + 1;
}
console.log('\nTop 10 countries by city count:');
const sorted = Object.entries(countryCounts).sort((a, b) => b[1] - a[1]).slice(0, 10);
for (const [code, count] of sorted) {
  console.log(`  ${code}: ${count} cities`);
}

// Helper function to parse CSV line handling quoted fields
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);

  return result;
}
