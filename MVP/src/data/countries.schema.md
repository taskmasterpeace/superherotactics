# Countries Database Schema

## Overview

The countries database contains 168 countries with full attributes from the SuperHero Tactics World Bible. Each country has 39 fields covering government, military, economy, technology, and game-specific attributes.

**Files**:
- `countries.ts` - Main export file with helper functions
- `countries_part1.ts` - Countries 1-56 + interface definition
- `countries_part2.ts` - Countries 57-100
- `countries_part3.ts` - Countries 101-168

---

## Country Interface

```typescript
export interface Country {
  // Identity
  id: number;                    // Unique identifier (1-168)
  code: string;                  // ISO 2-letter code (e.g., "US", "GB")
  name: string;                  // Full country name
  nationality: string;           // Demonym (e.g., "American", "British")
  motto: string;                 // National motto or "None"

  // Leadership
  president: string;             // Current leader name
  leaderTitle: string;           // "President", "Prime Minister", "Monarch", etc.
  leaderGender: string;          // "Male", "Female", or ""
  presidentialTerm: number;      // Years per term (0 for monarchies)

  // Government
  governmentType: string;        // "Democracy", "Federal Republic", etc.
  governmentPerception: string;  // "Full Democracy", "Flawed Democracy", "Hybrid Regime", "Authoritarian Regime"
  governmentCorruption: number;  // 0-100 scale, HIGHER = MORE corrupt (inverted from source)

  // Population
  population: number;            // Total population
  populationRating: number;      // 0-100 scale for game mechanics

  // Military & Security
  militaryServices: number;      // Military strength (0-100)
  militaryBudget: number;        // Military spending (0-100)
  intelligenceServices: number;  // Intelligence capability (0-100)
  intelligenceBudget: number;    // Intel spending (0-100)
  lawEnforcement: number;        // Police effectiveness (0-100)
  lawEnforcementBudget: number;  // Police spending (0-100)
  capitalPunishment: string;     // "Active", "Inactive", "Banned"

  // Economy
  gdpNational: number;           // National GDP (0-100 scale)
  gdpPerCapita: number;          // Per capita GDP (0-100 scale)

  // Society
  healthcare: number;            // Healthcare quality (0-100)
  higherEducation: number;       // Education level (0-100)
  socialDevelopment: number;     // Social services (0-100)
  lifestyle: number;             // Quality of life (0-100)
  mediaFreedom: number;          // Press freedom (0-100)

  // Technology
  cyberCapabilities: number;     // Cyber warfare capability (0-100)
  digitalDevelopment: number;    // Digital infrastructure (0-100)
  science: number;               // Scientific research (0-100)

  // Threats & Regulations
  terrorismActivity: string;     // Activity level (0-100 as string)

  // LSW (Living Super Weapon) System
  lswActivity: number;           // Super-powered activity level (0-100)
  lswRegulations: string;        // "Banned", "Regulated", "Legal"
  cloning: string;               // "Banned", "Regulated", "Legal"
  vigilantism: string;           // "Banned", "Regulated", "Legal"

  // Culture & Region
  cultureCode: number;           // Regional code 1-14 (matches cities)
  cultureGroup: 'A' | 'B' | 'C' | 'D' | 'E' | 'F';  // Name generation group
}
```

---

## Culture Code System

Each country has two culture-related fields for regional grouping and name generation.

### Culture Codes (1-14)

| Code | Region | Example Countries |
|------|--------|-------------------|
| 1 | North Africa | Algeria, Egypt, Libya, Morocco, Tunisia |
| 2 | Central Africa | Nigeria, Ghana, Kenya, DR Congo, Cameroon |
| 3 | Southern Africa | South Africa, Zimbabwe, Zambia, Mozambique |
| 4 | Central Asia | Kazakhstan, Uzbekistan, Kyrgyzstan, Tajikistan |
| 5 | South Asia | India, Pakistan, Bangladesh, Nepal, Sri Lanka |
| 6 | East & Southeast Asia | China, Japan, South Korea, Indonesia, Vietnam |
| 7 | Caribbean | Jamaica, Cuba, Haiti, Dominican Republic |
| 8 | Central America | Mexico, Guatemala, Honduras, Panama, Costa Rica |
| 9 | Western Europe | UK, France, Germany, Spain, Italy, Netherlands |
| 10 | Eastern Europe | Russia, Poland, Ukraine, Romania, Greece |
| 11 | Oceania | Australia, New Zealand |
| 12 | South America | Brazil, Argentina, Chile, Colombia, Peru |
| 13 | North America | United States, Canada |
| 14 | Middle East | Saudi Arabia, Iran, Iraq, Israel, Turkey, UAE |

### Culture Groups (A-F)

Groups combine culture codes for name generation and cultural theming:

| Group | Name | Culture Codes | Description |
|-------|------|---------------|-------------|
| **A** | Sub-Saharan Africa | 2 | Central/West African names |
| **B** | Asia | 4, 5, 6 | Central, South, and East Asian names |
| **C** | Latin America & Caribbean | 7, 8, 12 | Spanish/Portuguese influenced names |
| **D** | North America & Middle East | 13, 14 | English and Arabic names |
| **E** | Europe & Oceania | 9, 10, 11 | European names |
| **F** | North & Southern Africa | 1, 3 | North African and Southern African names |

### Usage Example

```typescript
import {
  ALL_COUNTRIES,
  getCountriesByCultureGroup,
  getCountriesByCultureCode,
  getCultureGroupFromCode,
  CULTURE_GROUPS
} from './countries';

// Get all Asian countries (group B)
const asianCountries = getCountriesByCultureGroup('B');
// Returns: China, Japan, India, Indonesia, etc.

// Get all South American countries (code 12)
const southAmerican = getCountriesByCultureCode(12);
// Returns: Brazil, Argentina, Chile, etc.

// Convert code to group
const group = getCultureGroupFromCode(6); // Returns 'B' (Asia)

// Get group info
const groupInfo = CULTURE_GROUPS['B'];
// Returns: { name: 'Asia', codes: [4, 5, 6] }
```

---

## Government Perception

| Type | Stability | Freedom Index | Examples |
|------|-----------|---------------|----------|
| Full Democracy | 90 | 85 | Norway, Denmark, New Zealand |
| Flawed Democracy | 70 | 65 | USA, France, India |
| Hybrid Regime | 50 | 45 | Turkey, Mexico, Nigeria |
| Authoritarian Regime | 40 | 25 | China, Russia, Saudi Arabia |

---

## Corruption Scale

**IMPORTANT**: Corruption values are INVERTED from the source data.
- **Higher value = MORE corrupt**
- Scale: 0 (least corrupt) to 100 (most corrupt)

| Range | Description | Examples |
|-------|-------------|----------|
| 0-20 | Very Clean | Denmark, Finland, Norway |
| 21-40 | Clean | Germany, UK, Japan |
| 41-60 | Moderate | Italy, South Africa, India |
| 61-80 | Corrupt | Russia, Mexico, Nigeria |
| 81-100 | Very Corrupt | North Korea, Somalia, Syria |

---

## LSW Regulation Levels

| Level | Numeric Value | Description |
|-------|---------------|-------------|
| Banned | 0 | Super activities illegal |
| Regulated | 50 | Licensed/controlled activities |
| Legal | 100 | Open super activities |

---

## Helper Functions

```typescript
// Find by identifier
getCountryById(id: number): Country | undefined
getCountryByCode(code: string): Country | undefined
getCountryByName(name: string): Country | undefined

// Filter by attributes
getCountriesByRegulation(regulation: string): Country[]
getCountriesByGovernment(govType: string): Country[]
getCountriesByCorruptionRange(min: number, max: number): Country[]
getCountriesByCultureGroup(group: CultureGroup): Country[]
getCountriesByCultureCode(code: number): Country[]

// Rankings
getMostCorruptCountries(limit?: number): Country[]
getLeastCorruptCountries(limit?: number): Country[]
getHighLSWActivityCountries(threshold?: number): Country[]

// Search
searchCountries(query: string): Country[]

// Faction
getFactionAlignment(country: Country): 'US' | 'China' | 'India' | 'Nigeria' | 'Neutral'

// Culture utilities
getCultureGroupFromCode(cultureCode: number): CultureGroup
```

---

## Statistics

Computed at module load:

```typescript
COUNTRY_STATS = {
  total: 168,
  byGovernment: {
    fullDemocracy: number,
    flawedDemocracy: number,
    hybridRegime: number,
    authoritarian: number
  },
  byLSWRegulation: {
    banned: number,
    regulated: number,
    legal: number
  },
  byCloning: {
    banned: number,
    regulated: number,
    legal: number
  }
}
```

---

## Game Integration

### Research Speed
Countries with higher `higherEducation` and `science` values provide research bonuses.

### Recruitment
- `lswActivity` affects available recruits
- `lswRegulations` affects recruitment legality
- `cultureGroup` determines name generation pool

### Political Authority
- `governmentPerception` affects diplomatic options
- `governmentCorruption` affects bribery/influence success rates

### Travel
- Relations between countries affect travel costs/permissions
- See `countryRelationships.schema.md` for details

---

## Data Source

Original data from: `SuperHero Tactics World Bible - Country.csv`
- 168 countries
- 35+ original fields
- Corruption values inverted during import (100 - original)
- Culture codes derived from city data matching
