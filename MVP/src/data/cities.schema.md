# Cities Database Schema

## Overview

The cities database contains 1,050 cities from around the world with attributes relevant to superhero operations, investigations, and tactical gameplay.

**File**: `cities.ts`

---

## City Interface

```typescript
export interface City {
  sector: string;           // Map grid reference (e.g., "LJ5", "AB3")
  countryCode: number;      // Reference to country ID
  cultureCode: number;      // Regional culture code (1-14)
  name: string;             // City name
  country: string;          // Country name
  population: number;       // City population
  populationRating: number; // 0-100 scale for game mechanics
  populationType: string;   // Size classification
  cityType1: string;        // Primary city function
  cityType2: string;        // Secondary function (optional)
  cityType3: string;        // Tertiary function (optional)
  cityType4: string;        // Quaternary function (optional)
  hvt: string;              // High Value Target presence
  crimeIndex: number;       // Crime level (0-100, higher = more crime)
  safetyIndex: number;      // Safety level (0-100, higher = safer)
}
```

---

## Culture Codes

Cities share the same culture code system as countries:

| Code | Region | Example Cities |
|------|--------|----------------|
| 1 | North Africa | Cairo, Algiers, Casablanca |
| 2 | Central Africa | Lagos, Nairobi, Kinshasa |
| 3 | Southern Africa | Johannesburg, Cape Town, Harare |
| 4 | Central Asia | Almaty, Tashkent, Bishkek |
| 5 | South Asia | Mumbai, Delhi, Dhaka, Karachi |
| 6 | East & Southeast Asia | Tokyo, Beijing, Seoul, Jakarta |
| 7 | Caribbean | Havana, Kingston, Port-au-Prince |
| 8 | Central America | Mexico City, Guatemala City, Panama City |
| 9 | Western Europe | London, Paris, Berlin, Rome |
| 10 | Eastern Europe | Moscow, Warsaw, Kyiv, Athens |
| 11 | Oceania | Sydney, Melbourne, Auckland |
| 12 | South America | São Paulo, Buenos Aires, Lima |
| 13 | North America | New York, Los Angeles, Toronto |
| 14 | Middle East | Dubai, Riyadh, Tehran, Jerusalem |

---

## Population Types

| Type | Typical Population | Game Impact |
|------|-------------------|-------------|
| Mega City | 10M+ | High activity, high risk, high reward |
| Large City | 1M - 10M | Standard metropolitan operations |
| City | 100K - 1M | Regional operations |
| Town | 10K - 100K | Lower profile operations |
| Small Town | <10K | Remote operations, limited resources |

---

## City Types

Cities can have up to 4 type designations affecting available missions and resources:

| Type | Description | Game Effects |
|------|-------------|--------------|
| **Military** | Major military presence | Defense contracts, military intel, combat missions |
| **Political** | Government/diplomatic hub | Political missions, diplomatic contacts |
| **Temple** | Religious/cultural center | Mystical events, cultural artifacts |
| **Industrial** | Manufacturing center | Corporate espionage, sabotage targets |
| **Company** | Corporate headquarters | Business intel, white collar crime |
| **Educational** | University/research hub | Tech research, recruitment pool |
| **Mining** | Resource extraction | Smuggling, resource conflicts |
| **Resort** | Tourism destination | Celebrity targets, cover operations |
| **Seaport** | Major port facility | Smuggling, trafficking, naval ops |

### City Type Effects

Each city type provides specific bonuses and mission types:

```typescript
// Example city type effects (pending implementation)
const CITY_TYPE_EFFECTS = {
  Military: {
    missionTypes: ['Combat', 'Reconnaissance', 'Extraction'],
    recruitmentBonus: ['Military', 'Mercenary'],
    securityLevel: +20
  },
  Educational: {
    missionTypes: ['Research', 'Recruitment', 'Investigation'],
    recruitmentBonus: ['Technical', 'Scientific'],
    researchSpeed: +15
  },
  // ... etc
};
```

---

## Crime & Safety Index

The Crime Index and Safety Index are inversely related:
- `safetyIndex = 100 - crimeIndex`

| Crime Range | Description | Game Effects |
|-------------|-------------|--------------|
| 0-20 | Very Safe | Easy operations, high visibility |
| 21-40 | Safe | Normal operations |
| 41-60 | Moderate | Mixed environment |
| 61-80 | Dangerous | High risk, criminal activity |
| 81-100 | Very Dangerous | Constant threats, gang territory |

---

## Sector Grid

Cities are mapped to a grid system for the world map:
- First two characters: Column (AA-ZZ)
- Number: Row (1-99)
- Example: "LJ5" = Column LJ, Row 5

---

## Usage Examples

```typescript
import { cities, CULTURE_CODES, CITY_TYPES } from './cities';

// Find cities in a country
const japanCities = cities.filter(c => c.country === 'Japan');

// Find dangerous cities
const dangerousCities = cities.filter(c => c.crimeIndex > 70);

// Find military cities
const militaryCities = cities.filter(c =>
  c.cityType1 === 'Military' ||
  c.cityType2 === 'Military'
);

// Find mega cities
const megaCities = cities.filter(c => c.populationType === 'Mega City');

// Find cities by culture
const asianCities = cities.filter(c => c.cultureCode === 6);
```

---

## Constants

```typescript
// Culture code names
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

// Population type list
export const POPULATION_TYPES = [
  'Mega City',
  'Large City',
  'City',
  'Town',
  'Small Town'
];

// Available city types
export const CITY_TYPES = [
  'Military',
  'Political',
  'Temple',
  'Industrial',
  'Company',
  'Educational',
  'Mining',
  'Resort',
  'Seaport'
];
```

---

## Statistics

| Metric | Value |
|--------|-------|
| Total Cities | 1,050 |
| Countries Represented | ~140 |
| Mega Cities | ~50 |
| Military Cities | ~200 |
| Political Capitals | ~168 |

---

## Data Source

Original data from: `SuperHero Tactics World Bible - Cities.csv`
- 1,050+ cities
- Safety Index calculated as `100 - CrimeIndex`
- Culture codes match country regional assignments
