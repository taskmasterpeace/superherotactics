---
name: sht-world-data
description: Query and manage the 1050 cities and 200+ countries database. Find locations by criteria, analyze crime indices, and plan operations in SuperHero Tactics.
---

# SHT World Data Manager

You manage the extensive world database containing 1,050 cities and 200+ countries with rich attributes for strategic planning.

## Key Data Files

- `MVP/src/data/cities.ts` - 1,050 cities (17,955 lines)
- `MVP/src/data/countries_part1.ts` - Countries A-L
- `MVP/src/data/countries_part2.ts` - Countries M-R
- `MVP/src/data/countries_part3.ts` - Countries S-Z
- `MVP/src/types.ts` - Country interface
- `MVP/src/data/worldData.ts` - Aggregated world state

## City Interface

```typescript
interface City {
  sector: string;           // Map grid reference (e.g., "LJ5")
  countryCode: number;      // Country ID
  cultureCode: number;      // Culture region 1-14
  name: string;             // City name
  country: string;          // Country name
  population: number;       // Actual population
  populationRating: number; // 1-7 scale
  populationType: string;   // "Mega City", "Large City", "City", "Town", "Small Town"
  cityType1: string;        // Primary type
  cityType2: string;        // Secondary type
  cityType3: string;        // Tertiary type
  cityType4: string;        // Quaternary type
  hvt: string;              // High Value Target description
  crimeIndex: number;       // 0-100 (higher = more crime)
  safetyIndex: number;      // 0-100 (higher = safer)
}
```

## Culture Codes

| Code | Region               |
|------|----------------------|
| 1    | North Africa         |
| 2    | Central Africa       |
| 3    | Southern Africa      |
| 4    | Central Asia         |
| 5    | South Asia           |
| 6    | East + SE Asia       |
| 7    | Caribbean            |
| 8    | Central America      |
| 9    | West Europe          |
| 10   | East Europe          |
| 11   | Oceania              |
| 12   | South America        |
| 13   | North America        |
| 14   | Middle East          |

## City Types

- **Military** - Army bases, weapons facilities, defense contractors
- **Political** - Capitals, government centers, embassies
- **Temple** - Religious centers, historical sites, mystic locations
- **Industrial** - Manufacturing, factories, logistics hubs
- **Company** - Corporate headquarters, tech parks, financial districts
- **Educational** - Universities, research centers, academies
- **Mining** - Resource extraction, refineries, ore processing
- **Resort** - Tourism, entertainment, luxury destinations
- **Seaport** - Naval bases, shipping lanes, coastal trade

## Country Interface

```typescript
interface Country {
  id: number;
  code: string;               // ISO code (e.g., "US")
  name: string;
  president: string;
  population: number;
  populationRating: number;   // 1-100 scale
  motto: string;
  nationality: string;
  governmentType: string;     // "Democracy", "Republic", "Authoritarian"
  governmentPerception: string; // "Full Democracy", "Flawed Democracy", etc.
  governmentCorruption: number; // 0-100

  // Military
  militaryServices: number;   // 0-100
  militaryBudget: number;     // 0-100
  intelligenceServices: number;
  intelligenceBudget: number;

  // Law
  capitalPunishment: "Active" | "Inactive";
  lawEnforcement: number;     // 0-100
  lawEnforcementBudget: number;

  // Economy
  gdpNational: number;        // 0-100
  gdpPerCapita: number;       // 0-100
  healthcare: number;
  higherEducation: number;
  socialDevelopment: number;
  lifestyle: number;

  // Tech & Security
  cyberCapabilities: number;
  digitalDevelopment: number;
  science: number;
  terrorismActivity: string;

  // LSW (Living Super Weapon) Policies
  cloning: "Banned" | "Regulated" | "Unrestricted";
  lswActivity: number;        // 0-100 (higher = more superhuman activity)
  lswRegulations: "Banned" | "Regulated" | "Unrestricted";
  vigilantism: "Banned" | "Regulated" | "Unrestricted";

  // Culture
  cultureCode: number;        // 1-14
  cultureGroup: 'C' | 'D' | 'E' | 'F';
  leaderGender: "Male" | "Female";
}
```

## Culture Groups

- **C**: Caribbean, Central America, South America (codes 7, 8, 12)
- **D**: North America, Middle East (codes 13, 14)
- **E**: West Europe, East Europe, Oceania (codes 9, 10, 11)
- **F**: North Africa, Southern Africa (codes 1, 3)

## Four Factions

| Faction | Main Country | Focus |
|---------|--------------|-------|
| USA     | United States | Tech, military dominance |
| India   | India | Population, diversity |
| China   | China | Economy, authoritarianism |
| Nigeria | Nigeria | African emergence |

## Query Examples

### Find Cities
- "Find all Military cities in Nigeria with crimeIndex > 60"
- "List cities by cultureCode 9 (West Europe) with population > 1 million"
- "Show Temple cities suitable for mystic-origin character recruitment"
- "Find Seaport cities along trade routes"

### Find Countries
- "List countries where vigilantism is 'Unrestricted'"
- "Find countries with lswActivity > 50 and lswRegulations = 'Banned'"
- "Compare healthcare vs gdpPerCapita for faction countries"
- "Which countries have highest intelligenceBudget?"

### Strategic Analysis
- "Compare crimeIndex distribution across culture regions"
- "Find safest Industrial cities for base locations"
- "Rank countries by militaryBudget * militaryServices"
- "Map LSW hotspots (high lswActivity + Unrestricted regulations)"

## Output Format

### City Query Result
```
CITIES MATCHING: Military + crimeIndex > 60
-------------------------------------------
| City       | Country    | Population | Crime | Types            |
|------------|------------|------------|-------|------------------|
| Kabul      | Afghanistan| 4,221,532  | 76.06 | Military, Political |
| Lagos      | Nigeria    | 14,368,332 | 72.50 | Industrial, Seaport |
| ...
```

### Country Comparison
```
FACTION COUNTRIES - LSW POLICIES
--------------------------------
| Country | LSW Activity | Regulations | Vigilantism |
|---------|--------------|-------------|-------------|
| USA     | 65           | Regulated   | Regulated   |
| India   | 48           | Regulated   | Unrestricted|
| China   | 52           | Banned      | Banned      |
| Nigeria | 40           | Unrestricted| Unrestricted|
```

## Investigation Location Selection

When selecting locations for investigations:
1. Match **cityType** to investigation theme
2. Consider **crimeIndex** for difficulty scaling
3. Check **country policies** for legal consequences
4. Factor **lswActivity** for superhuman involvement
5. Use **cultureCode** for regional flavor
