/**
 * Complete Country Database
 * 168 countries with full attributes from SuperHero Tactics World Bible
 * Government corruption values INVERTED: higher = MORE corrupt
 */

import { COUNTRIES_PART1 } from './countries_part1';
import { COUNTRIES_PART2 } from './countries_part2';
import { COUNTRIES_PART3 } from './countries_part3';

// Re-export the interface
export { Country } from './countries_part1';
import type { Country } from './countries_part1';

// Combine all country parts
export const ALL_COUNTRIES: Country[] = [
  ...COUNTRIES_PART1,
  ...COUNTRIES_PART2,
  ...COUNTRIES_PART3,
];

// Government perception ratings
export const GOVERNMENT_PERCEPTION = {
  'Full Democracy': { stability: 90, freedomIndex: 85 },
  'Flawed Democracy': { stability: 70, freedomIndex: 65 },
  'Hybrid Regime': { stability: 50, freedomIndex: 45 },
  'Authoritarian Regime': { stability: 40, freedomIndex: 25 },
} as const;

// Terrorism activity levels
export const TERRORISM_LEVELS = {
  'Inactive': 0,
  'Rare': 25,
  'Active': 75,
} as const;

// LSW/Cloning regulations
export const REGULATION_LEVELS = {
  'Banned': 0,
  'Regulated': 50,
  'Legal': 100,
} as const;

// Culture/Region codes (matches cities)
export const CULTURE_CODES = {
  1: 'North Africa',
  2: 'Central Africa',
  3: 'Southern Africa',
  4: 'Central Asia',
  5: 'South Asia',
  6: 'East & Southeast Asia',
  7: 'Caribbean',
  8: 'Central America',
  9: 'Western Europe',
  10: 'Eastern Europe',
  11: 'Oceania',
  12: 'South America',
  13: 'North America',
  14: 'Middle East',
} as const;

// Culture Group mapping for name generation
// A = Sub-Saharan/Central Africa (cultureCode 2)
// B = Asia (cultureCode 4, 5, 6)
// C = Americas (cultureCode 7, 8, 12)
// D = North America + Middle East (cultureCode 13, 14)
// E = Europe + Oceania (cultureCode 9, 10, 11)
// F = North/Southern Africa (cultureCode 1, 3)
export const CULTURE_GROUPS = {
  A: { name: 'Sub-Saharan Africa', codes: [2] },
  B: { name: 'Asia', codes: [4, 5, 6] },
  C: { name: 'Latin America & Caribbean', codes: [7, 8, 12] },
  D: { name: 'North America & Middle East', codes: [13, 14] },
  E: { name: 'Europe & Oceania', codes: [9, 10, 11] },
  F: { name: 'North & Southern Africa', codes: [1, 3] },
} as const;

export type CultureGroup = 'A' | 'B' | 'C' | 'D' | 'E' | 'F';

// Get culture group from culture code
export function getCultureGroupFromCode(cultureCode: number): CultureGroup {
  if (cultureCode === 2) return 'A';
  if ([4, 5, 6].includes(cultureCode)) return 'B';
  if ([7, 8, 12].includes(cultureCode)) return 'C';
  if ([13, 14].includes(cultureCode)) return 'D';
  if ([9, 10, 11].includes(cultureCode)) return 'E';
  if ([1, 3].includes(cultureCode)) return 'F';
  return 'E'; // Default fallback
}

// Helper functions
export function getCountryById(id: number): Country | undefined {
  return ALL_COUNTRIES.find(c => c.id === id);
}

export function getCountryByCode(code: string): Country | undefined {
  return ALL_COUNTRIES.find(c => c.code.toUpperCase() === code.toUpperCase());
}

export function getCountryByName(name: string): Country | undefined {
  return ALL_COUNTRIES.find(c => c.name.toLowerCase() === name.toLowerCase());
}

export function getCountriesByRegulation(regulation: string): Country[] {
  return ALL_COUNTRIES.filter(c => c.lswRegulations === regulation);
}

export function getCountriesByGovernment(govType: string): Country[] {
  return ALL_COUNTRIES.filter(c => c.governmentPerception === govType);
}

export function getCountriesByCorruptionRange(min: number, max: number): Country[] {
  return ALL_COUNTRIES.filter(c => c.governmentCorruption >= min && c.governmentCorruption <= max);
}

export function getMostCorruptCountries(limit: number = 10): Country[] {
  return [...ALL_COUNTRIES]
    .sort((a, b) => b.governmentCorruption - a.governmentCorruption)
    .slice(0, limit);
}

export function getLeastCorruptCountries(limit: number = 10): Country[] {
  return [...ALL_COUNTRIES]
    .sort((a, b) => a.governmentCorruption - b.governmentCorruption)
    .slice(0, limit);
}

export function getHighLSWActivityCountries(threshold: number = 70): Country[] {
  return ALL_COUNTRIES.filter(c => c.lswActivity >= threshold);
}

export function getCountriesByCultureGroup(group: CultureGroup): Country[] {
  return ALL_COUNTRIES.filter(c => c.cultureGroup === group);
}

export function getCountriesByCultureCode(code: number): Country[] {
  return ALL_COUNTRIES.filter(c => c.cultureCode === code);
}

export function searchCountries(query: string): Country[] {
  const lowerQuery = query.toLowerCase();
  return ALL_COUNTRIES.filter(c =>
    c.name.toLowerCase().includes(lowerQuery) ||
    c.nationality.toLowerCase().includes(lowerQuery) ||
    c.code.toLowerCase().includes(lowerQuery)
  );
}

// Get faction alignment based on LSW regulations and government type
export function getFactionAlignment(country: Country): 'US' | 'China' | 'India' | 'Nigeria' | 'Neutral' {
  if (country.name === 'United States' || country.name === 'Canada' || country.name === 'United Kingdom') return 'US';
  if (country.name === 'China' || country.name === 'North Korea') return 'China';
  if (country.name === 'India' || country.name === 'Bangladesh' || country.name === 'Pakistan') return 'India';
  if (country.name === 'Nigeria' || (country.lswRegulations === 'Legal' && country.governmentPerception === 'Hybrid Regime')) return 'Nigeria';
  return 'Neutral';
}

// Statistics
export const COUNTRY_STATS = {
  total: ALL_COUNTRIES.length,
  byGovernment: {
    fullDemocracy: ALL_COUNTRIES.filter(c => c.governmentPerception === 'Full Democracy').length,
    flawedDemocracy: ALL_COUNTRIES.filter(c => c.governmentPerception === 'Flawed Democracy').length,
    hybridRegime: ALL_COUNTRIES.filter(c => c.governmentPerception === 'Hybrid Regime').length,
    authoritarian: ALL_COUNTRIES.filter(c => c.governmentPerception === 'Authoritarian Regime').length,
  },
  byLSWRegulation: {
    banned: ALL_COUNTRIES.filter(c => c.lswRegulations === 'Banned').length,
    regulated: ALL_COUNTRIES.filter(c => c.lswRegulations === 'Regulated').length,
    legal: ALL_COUNTRIES.filter(c => c.lswRegulations === 'Legal').length,
  },
  byCloning: {
    banned: ALL_COUNTRIES.filter(c => c.cloning === 'Banned').length,
    regulated: ALL_COUNTRIES.filter(c => c.cloning === 'Regulated').length,
    legal: ALL_COUNTRIES.filter(c => c.cloning === 'Legal').length,
  },
};
