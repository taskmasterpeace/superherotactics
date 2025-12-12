# V0 Integration Specification

> **For V0 Developers Building the Strategic Layer**
>
> This document tells you exactly what to build so it integrates with the existing tactical codebase.

---

## What Already Exists (Don't Rebuild)

| System | File | What It Has |
|--------|------|-------------|
| **1050 Cities** | `MVP/src/data/cities.ts` | sector, population, crimeIndex, cityTypes, HVT |
| **168 Countries** | `MVP/src/data/countries.ts` | All stats, LSW policies, faction data |
| **Characters** | `MVP/src/stores/enhancedGameStore.ts` | Full character interface with injuries |
| **Combat** | `MVP/src/game/scenes/CombatScene.ts` | Working tactical combat |
| **Sound** | `MVP/src/game/systems/SoundManager.ts` | 381 sounds ready |
| **Event Bridge** | `MVP/src/game/EventBridge.ts` | React ↔ Phaser communication |

---

## Sector Grid System

### Current Sector Format
Cities already have sectors in format: `[Letter][Letter][Number]` (e.g., "LJ5", "CR4", "DK2")

**222 unique sectors** across the world map.

### You Said: Each Sector = 300 Miles
If world map is approximately 42 wide (sectors), that's ~12,600 miles ≈ Earth's circumference coverage.

### Sector Grid Requirements
```typescript
interface Sector {
  code: string;           // "LJ5" - matches cities.ts
  gridX: number;          // Column position (derived from letters)
  gridY: number;          // Row position (derived from number)
  terrain: TerrainType;   // Ocean, Land, Mountain, etc.
  control: SectorControl;
  cities: string[];       // City names in this sector
  countries: string[];    // Countries touching this sector
}

type SectorControl =
  | 'uncontrolled'
  | 'contested'
  | 'player'
  | 'enemy_us'
  | 'enemy_china'
  | 'enemy_india'
  | 'enemy_nigeria';
```

### Sector Code Conversion
```typescript
// Convert "LJ5" → { gridX: 282, gridY: 5 }
function sectorToGrid(code: string): { gridX: number, gridY: number } {
  const letters = code.slice(0, 2).toUpperCase();
  const number = parseInt(code.slice(2));

  // A=0, B=1, ... Z=25, AA=26, AB=27, etc.
  const col1 = letters.charCodeAt(0) - 65;  // 'L' = 11
  const col2 = letters.charCodeAt(1) - 65;  // 'J' = 9
  const gridX = col1 * 26 + col2;           // 11*26 + 9 = 295

  return { gridX, gridY: number };
}
```

---

## Country as First-Class Entity

### Required Country Interface (extends existing)
```typescript
interface GameCountry extends Country {
  // From existing countries.ts
  id: number;
  code: string;
  name: string;
  // ... all existing fields

  // NEW: Strategic Layer additions
  playerRelation: number;         // -100 to +100
  currentBudget: number;          // If player's home country
  weeklyIncome: number;
  weeklyExpenses: number;

  // LSW (Living Super Weapon) Metrics
  lswCount: number;               // Active supers in country
  lswTeams: string[];             // Known super teams
  lswThreats: string[];           // Known villains

  // Territory
  controlledSectors: string[];    // Sector codes
  contestedSectors: string[];

  // Reputation with player
  wantedLevel: 0 | 1 | 2 | 3 | 4 | 5;
  bounty: number;
}
```

### Derive LSW Profile Per Country
```typescript
function deriveLSWProfile(country: Country): LSWProfile {
  return {
    // Base from country data
    activity: country.lswActivity,           // 0-100
    regulations: country.lswRegulations,     // Banned/Regulated/Unrestricted
    vigilantism: country.vigilantism,

    // Derived metrics
    maxLSWs: Math.floor(country.populationRating * country.lswActivity / 10),
    threatLevel: calculateThreatLevel(country),
    recruitmentPool: calculateRecruitmentPool(country),

    // Emergence rates (new supers appearing)
    emergenceRate: country.lswActivity * country.science / 1000,
  };
}
```

---

## Game Flow Integration

### Starting the Game
```typescript
// 1. Player selects faction (US, India, China, Nigeria)
interface FactionSelection {
  faction: 'us' | 'india' | 'china' | 'nigeria';
}

// 2. Player selects country within faction influence
interface CountrySelection {
  countryCode: string;        // From countries.ts
  startingBudget: number;     // Derived from country GDP
}

// 3. Player selects home city
interface CitySelection {
  cityName: string;           // From cities.ts
  sector: string;             // Auto-populated from city
}

// 4. Initialize game state
interface GameInit {
  homeCountry: GameCountry;
  homeCity: City;
  homeSector: string;
  startingBudget: number;
  startingDay: number;        // 2472 countdown
}
```

### Starting Budget Formula
```typescript
function calculateStartingBudget(country: Country): number {
  const baseBudget = 50000;
  const gdpMultiplier = country.gdpPerCapita / 50;  // Normalized
  const militaryBonus = country.militaryBudget * 100;

  return Math.floor(baseBudget * gdpMultiplier + militaryBonus);
}
```

---

## Mission Generator

### Mission Types
```typescript
type MissionType =
  | 'combat_clear'      // Clear enemies from sector
  | 'combat_defend'     // Defend location
  | 'investigation'     // Gather intel
  | 'rescue'            // Extract target
  | 'assassination'     // Eliminate HVT
  | 'sabotage'          // Destroy target
  | 'theft'             // Steal item/data
  | 'escort'            // Protect VIP during travel
  | 'recon'             // Scout sector
  | 'training'          // Train militia
```

### Mission Generator Interface
```typescript
interface MissionGenerator {
  generateFromCity(city: City): Mission[];
  generateFromEvent(event: WorldEvent): Mission;
  generateRandom(difficulty: number): Mission;
}

interface Mission {
  id: string;
  type: MissionType;
  title: string;
  description: string;

  // Location
  sector: string;
  city?: string;
  country: string;

  // Requirements
  minSquadSize: number;
  recommendedThreatLevel: number;
  specialRequirements?: string[];  // "Need hacker", "Need flyer"

  // Stakes
  reward: MissionReward;
  failure: MissionConsequence;
  timeLimit?: number;             // Game hours

  // Combat setup (passed to tactical layer)
  enemyForces: EnemyGroup[];
  objectives: Objective[];
  mapType: string;
}
```

### Generate Missions from City Data
```typescript
function generateCityMissions(city: City): Mission[] {
  const missions: Mission[] = [];

  // Crime-based missions
  if (city.crimeIndex > 50) {
    missions.push({
      type: 'combat_clear',
      title: `Clean Up ${city.name}`,
      description: `High crime (${city.crimeIndex}) in ${city.name}. Clear criminal elements.`,
      // ...
    });
  }

  // City type missions
  if (city.cityType1 === 'Military') {
    missions.push({
      type: 'sabotage',
      title: `Military Target in ${city.name}`,
      // ...
    });
  }

  // HVT missions
  if (city.hvt) {
    missions.push({
      type: 'assassination',
      title: `Target: ${city.hvt}`,
      // ...
    });
  }

  return missions;
}
```

---

## Economy System

### Player Resources
```typescript
interface PlayerEconomy {
  cash: number;
  weeklyIncome: number;
  weeklyExpenses: number;

  // Income sources
  countrySalary: number;          // From home country
  missionRewards: number;
  sectorIncome: number;           // From controlled sectors

  // Expenses
  characterSalaries: number;
  equipmentMaintenance: number;
  baseCosts: number;
  hospitalCosts: number;
  trainingCosts: number;
}
```

### Country Payment Formula
```typescript
function calculateCountryPayment(country: Country, reputation: number): number {
  // Base payment from country wealth
  const basePayment = country.gdpPerCapita * 10;

  // Reputation modifier (-50% to +100%)
  const repModifier = 1 + (reputation / 100);

  // Weekly payment
  return Math.floor(basePayment * repModifier);
}
```

---

## Reputation System

### Country Reputation
```typescript
interface CountryReputation {
  countryCode: string;
  standing: number;           // -100 to +100
  wantedLevel: 0 | 1 | 2 | 3 | 4 | 5;
  bounty: number;

  // Factors
  missionsCompleted: number;
  missionsFailed: number;
  civilianCasualties: number;
  lawsBroken: number;
  criminalsTaken: number;
}
```

### Reputation Effects
```typescript
const REPUTATION_EFFECTS = {
  allied: {      // 75 to 100
    travelSpeed: 1.5,
    equipmentCost: 0.8,
    missionAccess: 'all',
    militarySupport: true,
  },
  friendly: {    // 25 to 74
    travelSpeed: 1.2,
    equipmentCost: 0.9,
    missionAccess: 'most',
    militarySupport: false,
  },
  neutral: {     // -24 to 24
    travelSpeed: 1.0,
    equipmentCost: 1.0,
    missionAccess: 'public',
    militarySupport: false,
  },
  hostile: {     // -74 to -25
    travelSpeed: 0.8,
    equipmentCost: 1.3,
    missionAccess: 'covert',
    militarySupport: false,
  },
  enemy: {       // -100 to -75
    travelSpeed: 0.5,
    equipmentCost: 2.0,
    missionAccess: 'none',
    militarySupport: false,
    activePursuit: true,
  },
};
```

---

## Integration Points

### Sending Squad to Combat
```typescript
// Strategic layer creates this
interface CombatDeployment {
  missionId: string;
  squad: Character[];         // From enhancedGameStore
  equipment: Equipment[];     // Loadouts from LoadoutEditor
  location: {
    sector: string;
    city?: string;
    country: string;
  };
  mission: Mission;
}

// Send to tactical layer via EventBridge
EventBridge.emit('deploy-to-combat', deployment);
```

### Receiving Combat Results
```typescript
// Tactical layer returns this
interface CombatResult {
  missionId: string;
  victory: boolean;

  // Character outcomes
  casualties: {
    characterId: string;
    status: 'dead' | 'injured' | 'captured' | 'ok';
    injuries?: Injury[];
  }[];

  // Resource changes
  ammoUsed: { itemId: string; count: number }[];
  equipmentDamaged: { itemId: string; damage: number }[];
  lootGained: Item[];

  // Stats
  enemiesKilled: number;
  civilianCasualties: number;
  timeElapsed: number;        // Game minutes

  // Reputation impact
  reputationChange: {
    country: string;
    change: number;
    reason: string;
  }[];
}

// Listen from tactical layer
EventBridge.on('combat-complete', (result: CombatResult) => {
  // Update game state
  applyMissionResult(result);
});
```

---

## World Events

### Event System
```typescript
interface WorldEvent {
  id: string;
  type: 'crisis' | 'opportunity' | 'emergence' | 'political' | 'economic';
  title: string;
  description: string;

  // Timing
  startDay: number;
  duration: number;           // Game days
  urgent: boolean;

  // Location
  sector?: string;
  city?: string;
  country: string;

  // Effects if ignored
  consequences: EventConsequence[];

  // Rewards if addressed
  rewards: EventReward[];

  // Generated mission
  mission?: Mission;
}
```

### Event Generation
```typescript
function generateDailyEvents(gameState: GameState): WorldEvent[] {
  const events: WorldEvent[] = [];

  // Crime-based events from high-crime cities
  const highCrimeCities = cities.filter(c => c.crimeIndex > 70);
  for (const city of highCrimeCities) {
    if (Math.random() < city.crimeIndex / 1000) {
      events.push({
        type: 'crisis',
        title: `Crime Wave in ${city.name}`,
        country: city.country,
        city: city.name,
        sector: city.sector,
        // ...
      });
    }
  }

  // LSW emergences based on country lswActivity
  for (const country of countries) {
    if (Math.random() < country.lswActivity / 500) {
      events.push({
        type: 'emergence',
        title: `New Super Sighted in ${country.name}`,
        // ...
      });
    }
  }

  return events;
}
```

---

## Data Import

### Use These Files
```typescript
// Cities - already typed
import { cities, City, CULTURE_CODES, CITY_TYPES } from './data/cities';

// Countries - already typed
import { ALL_COUNTRIES, Country } from './data/countries';

// Flags (CDN)
const flagUrl = (code: string) => `https://flagcdn.com/w320/${code.toLowerCase()}.png`;

// Game state
import { useGameStore } from './stores/enhancedGameStore';
```

### State Integration
```typescript
// Use enhancedGameStore for all game state
const {
  characters,      // Player's team
  addCharacter,
  removeCharacter,
  updateCharacterHealth,
  addInjury,
  // ...
} = useGameStore();
```

---

## Combat Balance Notes

### Target TTK (Time To Kill)
- **Pistol vs unarmored human**: 1.5 shots
- **Rifle vs unarmored human**: 1 shot
- **Shotgun vs unarmored human**: 1 shot (close range)

### Current Issue
Combat uses internal `WEAPONS` object with 9 weapons, not the 70+ in `weapons.ts`. When wiring up strategic layer, ensure it uses the data files, not hardcoded values.

---

## Summary for V0 Developers

1. **Don't rebuild** - cities, countries, characters exist
2. **Use existing stores** - `enhancedGameStore` is the active one
3. **Sector codes exist** - 222 sectors already in city data
4. **EventBridge for communication** - React ↔ Phaser
5. **Country starting budget** - derive from GDP
6. **Mission generator** - use city types + crime index
7. **Reputation cascade** - actions affect multiple countries
8. **Pass combat setup** - squad + equipment + mission → tactical layer
9. **Receive combat results** - casualties + loot + reputation changes

Build the UI, connect to existing data, emit/listen via EventBridge.
