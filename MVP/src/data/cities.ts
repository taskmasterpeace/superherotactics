/**
 * City Database - Re-exports from allCities.ts
 * Maintains backwards compatibility with existing imports
 */

import { ALL_CITIES, City as NewCity, getCityByName as getCity, getCitiesByCountry as citiesByCountry } from './allCities';

// Re-export the interface with backwards compatible structure
export interface City {
  sector: string;
  countryCode: number;      // Numeric country ID from CSV
  countryIso: string;       // 2-letter ISO code (new field)
  cultureCode: number;
  name: string;
  country: string;
  population: number;
  populationRating: number;
  populationType: string;
  cityType1: string;
  cityType2: string;
  cityType3: string;
  cityType4: string;
  hvt: string;
  crimeIndex: number;
  safetyIndex: number;
}

// Culture Code mappings
export const CULTURE_CODES: Record<number, string> = {
  1: 'North Africa',
  2: 'Central Africa',
  3: 'Southern Africa',
  4: 'Central Asia',
  5: 'South Asia',
  6: 'East + South East Asia',
  7: 'The Caribbean',
  8: 'Central America',
  9: 'West Europe',
  10: 'East Europe',
  11: 'Oceania',
  12: 'South America',
  13: 'North America',
  14: 'Middle Eastern'
};

// Population types
export const POPULATION_TYPES = [
  'Mega City',
  'Large City',
  'City',
  'Town',
  'Small Town'
];

// City types found in the dataset
export const CITY_TYPES = [
  'Industrial',
  'Political',
  'Military',
  'Educational',
  'Temple',
  'Mining',
  'Company',
  'Resort',
  'Seaport'
];

// Convert new City format to old format for backwards compatibility
function convertCity(newCity: NewCity): City {
  return {
    sector: newCity.sector,
    countryCode: newCity.countryId,
    countryIso: newCity.countryCode,
    cultureCode: newCity.cultureCode,
    name: newCity.name,
    country: newCity.countryName,
    population: newCity.population,
    populationRating: newCity.populationRating,
    populationType: newCity.populationType,
    cityType1: newCity.cityTypes[0] || '',
    cityType2: newCity.cityTypes[1] || '',
    cityType3: newCity.cityTypes[2] || '',
    cityType4: newCity.cityTypes[3] || '',
    hvt: newCity.hvt,
    crimeIndex: newCity.crimeIndex,
    safetyIndex: newCity.safetyIndex
  };
}

// Convert all cities to old format
export const cities: City[] = ALL_CITIES.map(convertCity);

// Helper functions
export function getCityByName(name: string): City | undefined {
  const found = getCity(name);
  return found ? convertCity(found) : undefined;
}

export function getCitiesByCountry(country: string): City[] {
  return cities.filter(c => c.country.toLowerCase() === country.toLowerCase() || c.countryIso === country.toUpperCase());
}

export function getCitiesByType(type: string): City[] {
  return cities.filter(c =>
    c.cityType1 === type ||
    c.cityType2 === type ||
    c.cityType3 === type ||
    c.cityType4 === type
  );
}

export function getCitiesByCrimeRange(min: number, max: number): City[] {
  return cities.filter(c => c.crimeIndex >= min && c.crimeIndex <= max);
}

export function searchCities(query: string): City[] {
  const lowerQuery = query.toLowerCase();
  return cities.filter(c =>
    c.name.toLowerCase().includes(lowerQuery) ||
    c.country.toLowerCase().includes(lowerQuery)
  );
}

export function getMegaCities(): City[] {
  return cities.filter(c => c.populationType === 'Mega City');
}

export function getLargeCities(): City[] {
  return cities.filter(c => c.populationType === 'Large City');
}

// Get cities by ISO country code (new helper)
export function getCitiesByCountryCode(isoCode: string): City[] {
  return cities.filter(c => c.countryIso === isoCode.toUpperCase());
}
