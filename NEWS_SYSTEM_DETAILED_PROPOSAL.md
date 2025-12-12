# NEWS SYSTEM DETAILED PROPOSAL
## SuperHero Tactics - Dynamic News & Public Perception

> **Integration with Existing Systems**: This proposal builds on the election system, 168 countries, 1050 cities, character fame tracking, and combat outcomes already implemented in the game.

---

## TABLE OF CONTENTS

1. [System Overview](#1-system-overview)
2. [Feature 1: Dynamic Headline Generation](#2-feature-1-dynamic-headline-generation)
3. [Feature 2: World Events](#3-feature-2-world-events)
4. [Feature 3: Fame Integration](#4-feature-3-fame-integration)
5. [Feature 4: Public Perception Meter](#5-feature-4-public-perception-meter)
6. [Feature 5: News as Intel Source](#6-feature-5-news-as-intel-source)
7. [Feature 6: Newspaper UI](#7-feature-6-newspaper-ui)
8. [Data Structures](#8-data-structures)
9. [Implementation Roadmap](#9-implementation-roadmap)

---

## 1. SYSTEM OVERVIEW

### Two News Delivery Modes

**PASSIVE**: Player seeks information
- News Browser (168 local papers + 4 major outlets)
- Social Media Feed (citizen reactions, villain taunts)
- Police Scanner (real-time crime alerts)
- Investigation Board (connect articles to reveal missions)

**ACTIVE**: Information comes to player
- Breaking News Alerts (major world events)
- Handler Phone Calls (urgent missions)
- Pop-up Events (moral dilemmas, political choices)
- Character Text Messages (idle characters)

### Integration Points

```typescript
// Existing systems this connects to:
- enhancedGameStore.ts → characters[].fame (already exists)
- electionSystem.ts → generates political news
- countries.ts → 168 countries with policies
- cities.ts → 1050 cities for local news
- missionSystem.ts → mission results → news generation
- CombatScene.ts → combat outcomes → headlines
```

---

## 2. FEATURE 1: Dynamic Headline Generation

### Overview
Every mission generates 1-3 news articles based on outcome, collateral damage, fame level, and legality.

### Headline Templates

```typescript
// Template structure
interface HeadlineTemplate {
  category: 'success_clean' | 'success_messy' | 'success_casualties' | 'failure' | 'illegal';
  templates: string[];  // Array of template strings with {placeholders}
  requiredVariables: string[];
  fameThreshold: number;  // Minimum fame for this template category
}

// Example templates
export const HEADLINE_TEMPLATES = {
  // SUCCESS - Low Collateral (<$5,000 damage, 0 casualties)
  success_clean: {
    templates: [
      "Vigilante Stops {crime} in {city}",
      "{descriptor} Thwarts {crime}, No Casualties",
      "Masked Hero Intervenes in {city} {crime}",
      "{city} {crime}: {descriptor} Saves the Day",
      "Local Hero Prevents {crime} Tragedy",
      "{descriptor} Stops {threat}, Praised by {city} Police"
    ],
    requiredVariables: ['crime', 'city', 'descriptor', 'threat'],
    fameThreshold: 0
  },

  // SUCCESS - High Collateral ($5,000-$100,000 damage)
  success_messy: {
    templates: [
      "Hero Stops {crime} But Causes ${amount} in Damages",
      "{descriptor}'s Reckless Tactics Cost {city} Dearly",
      "{crime} Thwarted, But at What Cost?",
      "Vigilante Destroys {target} While Stopping {crime}",
      "{city} in Ruins After {descriptor}'s Intervention",
      "Hero Saves Day, Taxpayers Foot ${amount} Bill"
    ],
    requiredVariables: ['crime', 'city', 'descriptor', 'amount', 'target'],
    fameThreshold: 0
  },

  // SUCCESS - Casualties (1+ civilian deaths)
  success_casualties: {
    templates: [
      "{crime} Stopped, {casualties} Civilians Killed",
      "Tragic Victory: {descriptor} Saves Hostages, Bystanders Die",
      "{city} Mourns {casualties} Dead After Vigilante Action",
      "Hero's Methods Questioned After {casualties} Deaths",
      "{descriptor} Under Fire for Civilian Casualties",
      "Was It Worth It? {casualties} Dead in {city} Operation"
    ],
    requiredVariables: ['crime', 'city', 'descriptor', 'casualties'],
    fameThreshold: 50
  },

  // FAILURE (mission failed)
  failure: {
    templates: [
      "Vigilante Fails to Stop {crime} in {city}",
      "{threat} Escapes Despite Hero's Efforts",
      "Amateur Vigilante Outmatched in {city}",
      "{crime} Successful, {descriptor} Nowhere to Be Found",
      "{city} Police Criticize Vigilante's Failed Intervention",
      "{threat} Makes Mockery of Local Hero"
    ],
    requiredVariables: ['crime', 'city', 'descriptor', 'threat'],
    fameThreshold: 0
  },

  // ILLEGAL OPERATION (vigilantism banned in country)
  illegal: {
    templates: [
      "Foreign Operative Violates {country} Sovereignty",
      "{country} Government Condemns Unauthorized Vigilante",
      "Diplomatic Crisis: {descriptor} Operates Illegally in {city}",
      "{country} Issues Arrest Warrant for Masked Vigilante",
      "International Incident Sparked by Rogue Hero",
      "Unauthorized {descriptor} Defies {country} Law"
    ],
    requiredVariables: ['country', 'city', 'descriptor'],
    fameThreshold: 100
  },

  // HIGH FAME CELEBRITY (fame 300+)
  celebrity: {
    templates: [
      "Legendary {heroName} Strikes Again in {city}",
      "Icon {heroName} Saves {city} From {threat}",
      "{heroName}: The Hero {city} Needed",
      "Global Celebrity {heroName} Visits {city}, Stops {crime}",
      "{heroName} Cements Status as World's Greatest Hero",
      "Breaking: {heroName} in {city} to Combat {threat}"
    ],
    requiredVariables: ['heroName', 'city', 'crime', 'threat'],
    fameThreshold: 300
  }
};
```

### Descriptor Selection (Based on Fame)

```typescript
export function selectDescriptor(fame: number, heroName?: string): string {
  if (fame >= 300 && heroName) {
    return heroName; // Celebrity status - use hero name
  }
  if (fame >= 150) {
    return heroName || 'The Vigilante'; // National recognition
  }
  if (fame >= 50) {
    const descriptors = [
      'The Armored Operative',
      'Known Vigilante',
      'Local Hero',
      'The Masked Defender',
      'Regional Operative'
    ];
    return descriptors[Math.floor(Math.random() * descriptors.length)];
  }
  // Low fame - anonymous
  const descriptors = [
    'Unknown Vigilante',
    'Masked Individual',
    'Unidentified Hero',
    'Mystery Operative',
    'Anonymous Defender'
  ];
  return descriptors[Math.floor(Math.random() * descriptors.length)];
}
```

### Crime/Threat Descriptions

```typescript
// Maps mission types to news-friendly descriptions
export const CRIME_DESCRIPTIONS: Record<string, string> = {
  'extract': 'Extraction Operation',
  'escort': 'Convoy Assault',
  'protect': 'Defense Operation',
  'assassinate': 'Assassination',
  'rescue': 'Hostage Rescue',
  'capture_hold': 'Siege',
  'investigate': 'Investigation',
  'patrol': 'Patrol Incident',
  'bank_robbery': 'Bank Robbery',
  'terrorist_attack': 'Terrorist Attack',
  'kidnapping': 'Kidnapping',
  'arms_deal': 'Illegal Arms Deal'
};

export const THREAT_DESCRIPTIONS: Record<number, string[]> = {
  1: ['Armed Suspects', 'Local Gang Members', 'Criminals'],
  2: ['Organized Crime Ring', 'Professional Criminals', 'Armed Gang'],
  3: ['Mercenary Unit', 'Elite Criminals', 'Trained Operatives'],
  4: ['Private Military Contractors', 'Enhanced Criminals', 'LSW Gang'],
  5: ['LSW Terrorists', 'Powered Criminals', 'Superhuman Threat'],
  6: ['LSW Terror Cell', 'Dangerous LSW Individual', 'Powered Threat'],
  7: ['Major LSW Threat', 'Powered Villain', 'Superhuman Terrorist'],
  8: ['Extreme LSW Threat', 'Notorious Villain', 'Powered Warlord'],
  9: ['Catastrophic Threat', 'LSW Supervillain', 'World-Class Threat']
};
```

### Event Triggers

```typescript
// When news gets generated
export interface NewsGenerationTrigger {
  trigger: 'mission_complete' | 'combat_end' | 'world_event' | 'election';
  priority: number;  // 1-10, determines if it makes headlines
  context: MissionResult | CombatOutcome | WorldEvent | ElectionOutcome;
}

// Mission completion always generates news
function onMissionComplete(mission: Mission, result: MissionResult) {
  const newsArticle = generateMissionNews(mission, result);
  gameStore.addNewsArticle(newsArticle);

  // Update fame
  const fameChange = calculateFameChange(result);
  gameStore.updateCharacterFame(result.characterId, fameChange);

  // Update public opinion
  const opinionChange = calculateOpinionChange(mission.country, result);
  gameStore.updatePublicOpinion(mission.country, opinionChange);
}
```

### Gameplay Impact

| Outcome | Fame Change | Public Opinion | Mission Availability |
|---------|-------------|----------------|----------------------|
| Clean Success | +10 to +30 | +5 to +15 | +10% new missions |
| Messy Success | +5 to +15 | -5 to +5 | No change |
| Success w/ Casualties | -10 to +5 | -20 to -5 | -5% missions |
| Failure | -15 to -5 | -10 to -5 | -10% missions |
| Illegal Operation | +20 fame, -30 opinion | -40 in that country | Bounty issued |

---

## 3. FEATURE 2: World Events

### Overview
2-5 procedurally generated world events per game day, weighted by country terrorism/lsw_activity ratings.

### Event Categories

```typescript
export type WorldEventType =
  | 'election'           // Country changes leadership (already implemented!)
  | 'disaster'           // Natural disaster creates mission opportunities
  | 'villain_attack'     // LSW faction strikes
  | 'faction_war'        // Two factions fight each other
  | 'tech_breakthrough'  // New equipment unlocks
  | 'political_crisis'   // Coup, protest, legislation
  | 'war'                // Two countries enter conflict
  | 'treaty'             // International cooperation changes
  | 'scandal';           // Government/corporate corruption revealed

export interface WorldEvent {
  id: string;
  type: WorldEventType;
  timestamp: number;
  countries: string[];  // Affected countries
  cities?: string[];    // Affected cities
  sectors?: string[];   // Affected sectors

  // News generation
  headline: string;
  fullText: string;
  source: NewsSource;
  imageUrl?: string;

  // Gameplay consequences
  policyChanges: PolicyChange[];
  missionOpportunities: MissionSeed[];
  factionChanges: FactionRelationChange[];
  economicImpact: number;  // -100 to +100

  // Duration
  expiresAt?: number;  // When event stops being "current"
  followUpEvents?: string[];  // IDs of events this can trigger
}
```

### Election Integration (Already Exists!)

```typescript
// Extend existing electionSystem.ts to generate news
import { advanceElectionYear, ElectionOutcome } from './electionSystem';
import { ALL_COUNTRIES } from './countries';

// Run elections and create news
export function processElections(gameYear: number, electionStates: Map<string, CountryElectionState>) {
  const electionNews: NewsArticle[] = [];

  ALL_COUNTRIES.forEach(country => {
    const state = electionStates.get(country.code);
    if (!state) return;

    const outcome = advanceElectionYear(state, country, gameYear);
    if (outcome) {
      // Election happened! Generate news
      const article: NewsArticle = {
        id: `election-${country.code}-${gameYear}`,
        headline: outcome.newsHeadline,
        source: getLocalNewspaper(country.name, country.name),
        category: 'politics',
        bias: 'neutral',
        generatedFrom: { type: 'world_event', eventType: 'election' },
        fullText: outcome.newsBody,
        relatedCountries: [country.code],
        relatedFactions: [],
        timestamp: gameYear * 365 * 24,  // Convert to game hours
        fameImpact: 0,
        publicOpinionShift: outcome.leaderChanged ? { [country.code]: -10 } : {},
        missionOpportunity: outcome.leaderChanged ? createPoliticalMission(country, outcome) : undefined
      };

      electionNews.push(article);
    }
  });

  return electionNews;
}
```

### Disaster Events

```typescript
export interface DisasterEvent extends WorldEvent {
  type: 'disaster';
  disasterType: 'earthquake' | 'hurricane' | 'flood' | 'fire' | 'terrorist_attack';
  severity: 1 | 2 | 3 | 4 | 5;
  casualties: number;
  damageUSD: number;
}

// Disaster template
export const DISASTER_TEMPLATES = {
  earthquake: {
    headlines: [
      "{magnitude} Earthquake Strikes {city}, {casualties} Dead",
      "Massive Earthquake Devastates {city}",
      "{city} Earthquake: Rescue Operations Underway"
    ],
    missionTypes: ['rescue', 'protect', 'escort'],
    affectedSectors: (epicenter: string) => getAdjacentSectors(epicenter, 2)
  },

  terrorist_attack: {
    headlines: [
      "{faction} Attacks {city} - {casualties} Dead",
      "Terrorist Strike: {faction} Claims Responsibility",
      "{city} Under Siege by {faction}",
      "LSW Terrorist Attack Leaves {city} in Chaos"
    ],
    missionTypes: ['counter_terrorism', 'investigate', 'protect'],
    affectedSectors: (target: string) => [target]
  }
};

// Generation function
export function generateDisasterEvent(cities: City[]): DisasterEvent | null {
  // Weight by city population (bigger cities = more newsworthy disasters)
  const weightedCities = cities.filter(c => c.population > 500000);
  if (weightedCities.length === 0) return null;

  const city = weightedCities[Math.floor(Math.random() * weightedCities.length)];
  const disasterTypes = ['earthquake', 'hurricane', 'terrorist_attack'];
  const disasterType = disasterTypes[Math.floor(Math.random() * disasterTypes.length)];
  const severity = Math.ceil(Math.random() * 5) as 1 | 2 | 3 | 4 | 5;

  const casualties = severity * Math.floor(Math.random() * 100) + severity * 10;
  const damageUSD = severity * 1000000 * (Math.random() * 10 + 1);

  const template = DISASTER_TEMPLATES[disasterType];
  const headline = template.headlines[0]
    .replace('{city}', city.name)
    .replace('{casualties}', casualties.toString())
    .replace('{faction}', 'Unknown Faction'); // TODO: select actual faction

  return {
    id: `disaster-${city.id}-${Date.now()}`,
    type: 'disaster',
    disasterType,
    severity,
    casualties,
    damageUSD,
    timestamp: Date.now(),
    countries: [city.country],
    cities: [city.id],
    sectors: [city.sector],
    headline,
    fullText: generateDisasterArticle(city, disasterType, casualties, damageUSD),
    source: getLocalNewspaper(city.name, city.country),
    policyChanges: [],
    missionOpportunities: generateDisasterMissions(city, disasterType, severity),
    factionChanges: [],
    economicImpact: -severity * 10
  };
}
```

### Villain Attack Events

```typescript
// Weighted by country's lswActivity rating
export function generateVillainAttack(countries: Country[]): WorldEvent | null {
  // Weight by lswActivity (higher = more likely)
  const totalWeight = countries.reduce((sum, c) => sum + c.lswActivity, 0);
  let random = Math.random() * totalWeight;

  let selectedCountry: Country | null = null;
  for (const country of countries) {
    random -= country.lswActivity;
    if (random <= 0) {
      selectedCountry = country;
      break;
    }
  }

  if (!selectedCountry) return null;

  // Select city in that country
  const countryCities = cities.filter(c => c.country === selectedCountry!.name);
  if (countryCities.length === 0) return null;

  const city = countryCities[Math.floor(Math.random() * countryCities.length)];

  // Generate attack
  const factions = ['Technomancer Cult', 'Red Dawn', 'Shadow Syndicate', 'LSW Liberation Front'];
  const faction = factions[Math.floor(Math.random() * factions.length)];
  const casualties = Math.floor(Math.random() * 200) + 10;

  return {
    id: `villain-attack-${city.id}-${Date.now()}`,
    type: 'villain_attack',
    timestamp: Date.now(),
    countries: [selectedCountry.code],
    cities: [city.id],
    sectors: [city.sector],
    headline: `${faction} Attacks ${city.name} - ${casualties} Dead`,
    fullText: generateVillainAttackArticle(faction, city, casualties),
    source: 'Global News Network',
    policyChanges: [
      { policy: 'lswActivity', change: +5, country: selectedCountry.code }
    ],
    missionOpportunities: [
      {
        type: 'counter_terrorism',
        city: city.id,
        difficulty: 7,
        reward: 30000,
        fameReward: 100,
        timeLimit: 72
      }
    ],
    factionChanges: [
      { faction, relation: -20, reason: 'terrorist_attack' }
    ],
    economicImpact: -15
  };
}
```

### Impact on Gameplay

```typescript
// When world event happens
export function processWorldEvent(event: WorldEvent) {
  // Apply policy changes
  event.policyChanges.forEach(change => {
    const country = getCountryByCode(change.country);
    if (country) {
      country[change.policy] += change.change;
    }
  });

  // Create mission opportunities
  event.missionOpportunities.forEach(seed => {
    const mission = createMissionFromSeed(seed);
    gameStore.addAvailableMission(mission);
  });

  // Update faction relations
  event.factionChanges.forEach(change => {
    gameStore.updateFactionRelation(change.faction, change.relation);
  });

  // Economic impact affects mission rewards
  if (event.economicImpact !== 0) {
    const affectedCountries = event.countries;
    affectedCountries.forEach(countryCode => {
      gameStore.adjustMissionRewards(countryCode, event.economicImpact / 100);
    });
  }

  // Add to news feed
  gameStore.addNewsArticle({
    id: event.id,
    headline: event.headline,
    source: event.source,
    category: 'world',
    bias: 'neutral',
    generatedFrom: { type: 'world_event', eventType: event.type },
    fullText: event.fullText,
    relatedCountries: event.countries,
    relatedFactions: [],
    timestamp: event.timestamp,
    missionOpportunity: event.missionOpportunities[0]
  });
}
```

---

## 4. FEATURE 3: Fame Integration

### Overview
Characters already have `fame` property. News system reads and modifies this value based on mission outcomes and media coverage.

### Fame Tiers

```typescript
export enum FameTier {
  UNKNOWN = 0,      // 0-49: Nobody knows you
  LOCAL = 50,       // 50-149: Local hero, city newspapers cover you
  REGIONAL = 150,   // 150-299: National hero, major outlets notice
  NATIONAL = 300,   // 300-499: National icon, everything you do is news
  GLOBAL = 500      // 500+: Global celebrity, international coverage
}

export function getFameTier(fame: number): FameTier {
  if (fame >= 500) return FameTier.GLOBAL;
  if (fame >= 300) return FameTier.NATIONAL;
  if (fame >= 150) return FameTier.REGIONAL;
  if (fame >= 50) return FameTier.LOCAL;
  return FameTier.UNKNOWN;
}

export function getFameTierName(tier: FameTier): string {
  return {
    [FameTier.UNKNOWN]: 'Unknown Vigilante',
    [FameTier.LOCAL]: 'Local Hero',
    [FameTier.REGIONAL]: 'Regional Operative',
    [FameTier.NATIONAL]: 'National Icon',
    [FameTier.GLOBAL]: 'Global Legend'
  }[tier];
}
```

### Fame Calculation

```typescript
export interface FameModifiers {
  missionSuccess: number;       // +10 to +50
  missionFailure: number;       // -5 to -30
  civilianCasualties: number;   // -5 per casualty
  collateralDamage: number;     // -1 per $10k damage
  stealthBonus: number;         // +10 if completed without detection
  speedBonus: number;           // +5 if completed quickly
  difficultyMultiplier: number; // x1.5 for hard missions
  illegalOperation: number;     // +20 fame, but bounty added
  celebrityAppearance: number;  // +5 just for showing up (high fame)
}

export function calculateFameChange(result: MissionResult): number {
  let fameChange = 0;

  // Base fame from success/failure
  if (result.success) {
    fameChange += 10 + (result.missionDifficulty * 5);
  } else {
    fameChange -= 5 + (result.missionDifficulty * 2);
  }

  // Penalties for collateral damage
  if (result.civilianCasualties > 0) {
    fameChange -= result.civilianCasualties * 5;
  }
  if (result.collateralDamage > 0) {
    fameChange -= Math.floor(result.collateralDamage / 10000);
  }

  // Bonuses for clean execution
  if (result.stealthKill) {
    fameChange += 10;
  }
  if (result.completionTime < result.estimatedTime * 0.5) {
    fameChange += 5;
  }

  // Difficulty multiplier
  if (result.missionDifficulty >= 4) {
    fameChange = Math.floor(fameChange * 1.5);
  }

  // Cap fame changes
  fameChange = Math.max(-50, Math.min(100, fameChange));

  return fameChange;
}
```

### Fame Effects

```typescript
// Fame unlocks features and changes prices
export interface FameEffects {
  recruitmentPoolSize: number;      // More recruits available
  equipmentDiscount: number;        // -5% to -20% discount
  missionAvailability: number;      // More missions offered
  villainTargeting: boolean;        // High fame = villains challenge you
  mediaInterviews: boolean;         // Can give interviews at fame 150+
  bodyguardMissions: boolean;       // VIP protection at fame 200+
  celebrityEndorsements: boolean;   // Earn passive income at fame 400+
}

export function getFameEffects(fame: number): FameEffects {
  const tier = getFameTier(fame);

  return {
    recruitmentPoolSize: tier * 5,  // 0, 5, 10, 15, 20 recruits
    equipmentDiscount: Math.min(20, tier * 5),  // 0-20% discount
    missionAvailability: tier * 10,  // 0-40% more missions
    villainTargeting: tier >= FameTier.REGIONAL,
    mediaInterviews: tier >= FameTier.REGIONAL,
    bodyguardMissions: fame >= 200,
    celebrityEndorsements: fame >= 400
  };
}
```

### Fame Decay

```typescript
// Fame slowly decays if you're inactive
export function processFameDecay(character: Character, daysSinceLastMission: number) {
  if (daysSinceLastMission < 7) return;  // No decay in first week

  const decayRate = 0.02;  // 2% per week after first week
  const weeks = Math.floor((daysSinceLastMission - 7) / 7);
  const decayAmount = Math.floor(character.fame * decayRate * weeks);

  if (decayAmount > 0) {
    character.fame = Math.max(0, character.fame - decayAmount);

    // Generate news article if famous hero goes quiet
    if (character.fame >= 150 && decayAmount > 10) {
      const article: NewsArticle = {
        id: `fame-decay-${character.id}-${Date.now()}`,
        headline: `Where is ${character.name}? Hero Silent for Weeks`,
        source: 'Global News Network',
        category: 'entertainment',
        bias: 'neutral',
        generatedFrom: { type: 'random_event' },
        fullText: `The famous vigilante known as ${character.name} has not been seen in action for ${daysSinceLastMission} days. Fans speculate about retirement or injury.`,
        relatedCountries: [character.location.country],
        relatedFactions: [],
        timestamp: Date.now(),
        fameImpact: -decayAmount
      };

      gameStore.addNewsArticle(article);
    }
  }
}
```

---

## 5. FEATURE 4: Public Perception Meter

### Overview
Track public opinion per country (-100 to +100). Different from fame (how famous you are) vs opinion (how much they like you).

### Data Structure

```typescript
export interface PublicOpinion {
  countryCode: string;
  opinion: number;  // -100 to +100
  lastUpdated: number;
  recentActions: OpinionAction[];  // Last 5 actions that affected opinion
  mediaRepresentation: 'hero' | 'vigilante' | 'menace' | 'criminal';
}

export interface OpinionAction {
  timestamp: number;
  action: string;
  opinionChange: number;
  reason: string;
}

// Add to gameStore
export interface EnhancedGameStore {
  // ... existing properties
  publicOpinion: Map<string, PublicOpinion>;

  updatePublicOpinion: (countryCode: string, change: number, reason: string) => void;
  getPublicOpinion: (countryCode: string) => PublicOpinion;
}
```

### Opinion Modifiers

```typescript
export const OPINION_MODIFIERS = {
  // Mission outcomes
  CLEAN_SUCCESS: { base: 10, legalBonus: 5, illegalPenalty: -15 },
  MESSY_SUCCESS: { base: 0, legalBonus: 5, illegalPenalty: -20 },
  CASUALTIES: { perCasualty: -5, max: -30 },
  FAILURE: { base: -5, legalBonus: 0, illegalPenalty: -10 },

  // Special actions
  SAVED_CIVILIANS: { perPerson: 2, max: 20 },
  CAPTURED_VILLAIN: { base: 15 },
  VILLAIN_ESCAPED: { base: -8 },

  // Illegal operations
  OPERATING_ILLEGALLY: { base: -20, perMission: -5 },
  BOUNTY_ISSUED: { base: -30 },

  // Media relations
  GAVE_INTERVIEW: { positive: 5, negative: -5 },
  PRESS_CONFERENCE: { positive: 10, negative: -10 },
  IGNORED_PRESS: { base: -3 }
};

export function calculateOpinionChange(
  country: Country,
  result: MissionResult,
  isLegal: boolean
): number {
  let change = 0;

  // Base change from mission outcome
  if (result.success) {
    if (result.civilianCasualties === 0 && result.collateralDamage < 5000) {
      change += OPINION_MODIFIERS.CLEAN_SUCCESS.base;
      change += isLegal ? OPINION_MODIFIERS.CLEAN_SUCCESS.legalBonus : OPINION_MODIFIERS.CLEAN_SUCCESS.illegalPenalty;
    } else {
      change += OPINION_MODIFIERS.MESSY_SUCCESS.base;
      change += isLegal ? OPINION_MODIFIERS.MESSY_SUCCESS.legalBonus : OPINION_MODIFIERS.MESSY_SUCCESS.illegalPenalty;
    }
  } else {
    change += OPINION_MODIFIERS.FAILURE.base;
    change += isLegal ? 0 : OPINION_MODIFIERS.FAILURE.illegalPenalty;
  }

  // Casualties penalty
  if (result.civilianCasualties > 0) {
    const casualtyPenalty = Math.min(
      OPINION_MODIFIERS.CASUALTIES.max,
      result.civilianCasualties * OPINION_MODIFIERS.CASUALTIES.perCasualty
    );
    change += casualtyPenalty;
  }

  // Civilians saved bonus
  if (result.civiliansSaved > 0) {
    const saveBonus = Math.min(
      OPINION_MODIFIERS.SAVED_CIVILIANS.max,
      result.civiliansSaved * OPINION_MODIFIERS.SAVED_CIVILIANS.perPerson
    );
    change += saveBonus;
  }

  // Villain captured
  if (result.villainsCaptured > 0) {
    change += OPINION_MODIFIERS.CAPTURED_VILLAIN.base * result.villainsCaptured;
  }

  // Country-specific modifiers
  if (country.vigilantism === 'Banned') {
    change += OPINION_MODIFIERS.OPERATING_ILLEGALLY.base;
  }

  // Government perception affects how opinion changes
  if (country.governmentPerception === 'Positive') {
    change *= 1.2;  // Positive governments amplify good deeds
  } else if (country.governmentPerception === 'Negative') {
    change *= 0.8;  // Negative governments suppress positive opinion
  }

  return Math.round(change);
}
```

### Opinion Tiers & Effects

```typescript
export enum OpinionTier {
  HATED = -100,      // -100 to -50: Wanted criminal
  DISLIKED = -50,    // -50 to -10: Suspicious vigilante
  NEUTRAL = 0,       // -10 to +10: Unknown entity
  LIKED = 10,        // +10 to +50: Appreciated hero
  LOVED = 50         // +50 to +100: National treasure
}

export function getOpinionTier(opinion: number): OpinionTier {
  if (opinion >= 50) return OpinionTier.LOVED;
  if (opinion >= 10) return OpinionTier.LIKED;
  if (opinion >= -10) return OpinionTier.NEUTRAL;
  if (opinion >= -50) return OpinionTier.DISLIKED;
  return OpinionTier.HATED;
}

export interface OpinionEffects {
  missionRewardMultiplier: number;  // 0.5x to 2.0x
  equipmentCostMultiplier: number;  // 0.8x to 1.5x
  policeCooperation: boolean;
  militarySupport: boolean;
  bountyActive: boolean;
  travelRestricted: boolean;
  recruitmentPenalty: number;  // -50% to +50%
}

export function getOpinionEffects(opinion: number, country: Country): OpinionEffects {
  const tier = getOpinionTier(opinion);

  return {
    missionRewardMultiplier: 1 + (opinion / 100),  // 0.0x to 2.0x
    equipmentCostMultiplier: 1.5 - (opinion / 100), // 0.5x to 1.5x
    policeCooperation: opinion >= 10,
    militarySupport: opinion >= 50,
    bountyActive: opinion <= -50,
    travelRestricted: opinion <= -70,
    recruitmentPenalty: Math.floor(opinion / 2)  // -50 to +50
  };
}
```

### Opinion Decay

```typescript
// Opinion slowly returns to neutral over time
export function processOpinionDecay(publicOpinion: Map<string, PublicOpinion>, gameDay: number) {
  publicOpinion.forEach((opinion, countryCode) => {
    const daysSinceUpdate = gameDay - opinion.lastUpdated;

    if (daysSinceUpdate < 7) return;  // No decay in first week

    // Decay rate: 1 point per week toward neutral
    const decayRate = 1;
    const weeks = Math.floor(daysSinceUpdate / 7);

    if (opinion.opinion > 0) {
      opinion.opinion = Math.max(0, opinion.opinion - (decayRate * weeks));
    } else if (opinion.opinion < 0) {
      opinion.opinion = Math.min(0, opinion.opinion + (decayRate * weeks));
    }

    // Update media representation
    const tier = getOpinionTier(opinion.opinion);
    opinion.mediaRepresentation =
      tier === OpinionTier.LOVED ? 'hero' :
      tier === OpinionTier.LIKED ? 'vigilante' :
      tier === OpinionTier.DISLIKED ? 'menace' : 'criminal';
  });
}
```

### UI Representation

```typescript
// Visual meter component
export function OpinionMeter({ countryCode }: { countryCode: string }) {
  const opinion = gameStore.getPublicOpinion(countryCode);
  const tier = getOpinionTier(opinion.opinion);

  const color =
    tier === OpinionTier.LOVED ? '#22c55e' :
    tier === OpinionTier.LIKED ? '#86efac' :
    tier === OpinionTier.NEUTRAL ? '#a8a29e' :
    tier === OpinionTier.DISLIKED ? '#fb923c' : '#ef4444';

  const tierName =
    tier === OpinionTier.LOVED ? 'National Hero' :
    tier === OpinionTier.LIKED ? 'Appreciated' :
    tier === OpinionTier.NEUTRAL ? 'Neutral' :
    tier === OpinionTier.DISLIKED ? 'Distrusted' : 'Wanted';

  return (
    <div className="opinion-meter">
      <div className="meter-bar" style={{ width: '200px', height: '20px', background: '#333' }}>
        <div
          className="meter-fill"
          style={{
            width: `${(opinion.opinion + 100) / 2}%`,
            height: '100%',
            background: color,
            transition: 'width 0.3s ease'
          }}
        />
      </div>
      <div className="meter-label">
        {tierName} ({opinion.opinion > 0 ? '+' : ''}{opinion.opinion})
      </div>

      {/* Recent actions affecting opinion */}
      <div className="recent-actions">
        {opinion.recentActions.slice(0, 3).map(action => (
          <div key={action.timestamp} className="action-item">
            <span className="action-name">{action.action}</span>
            <span className={action.opinionChange > 0 ? 'positive' : 'negative'}>
              {action.opinionChange > 0 ? '+' : ''}{action.opinionChange}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## 6. FEATURE 5: News as Intel Source

### Overview
News articles can reveal mission opportunities, faction movements, and villain hideouts.

### Mission Seeds from News

```typescript
export interface MissionSeed {
  sourceArticleId: string;
  type: MissionType;
  city: string;
  sector: string;
  difficulty: number;
  reward: number;
  fameReward: number;
  timeLimit?: number;  // Hours before opportunity expires
  requires?: string[];  // Equipment/skills needed

  // Intel quality (affects mission difficulty)
  intelQuality: 'vague' | 'partial' | 'detailed';
  intelSources: number;  // How many articles confirm this
}

// Generate mission from news article
export function generateMissionFromNews(article: NewsArticle): MissionSeed | null {
  // Pattern matching on article content
  const patterns = [
    { pattern: /kidnapping|abduction/i, missionType: 'rescue' },
    { pattern: /terrorist|attack|bomb/i, missionType: 'counter_terrorism' },
    { pattern: /robbery|heist|theft/i, missionType: 'protect' },
    { pattern: /hideout|base|compound/i, missionType: 'infiltrate' },
    { pattern: /arms deal|weapons/i, missionType: 'sabotage' }
  ];

  for (const { pattern, missionType } of patterns) {
    if (pattern.test(article.fullText)) {
      return {
        sourceArticleId: article.id,
        type: missionType,
        city: article.relatedCountries[0],  // TODO: extract city from article
        sector: 'unknown',  // TODO: extract sector
        difficulty: 5,
        reward: 10000,
        fameReward: 50,
        timeLimit: 72,
        intelQuality: 'vague',
        intelSources: 1
      };
    }
  }

  return null;
}
```

### Rumor System

```typescript
// Rumors appear 1-4 days before actual mission
export interface Rumor {
  id: string;
  stage: 1 | 2 | 3 | 4;  // How close to mission unlock
  sector: string;
  city?: string;
  content: string;
  source: 'social_media' | 'police_scanner' | 'news' | 'informant';
  reliability: number;  // 0-100, some rumors are false
  missionSeedId?: string;  // If investigating reveals mission
}

export const RUMOR_PROGRESSION = {
  stage1: {
    templates: [
      "Strange lights seen over {sector}",
      "Unusual activity reported in {city}",
      "Local resident reports suspicious vehicles",
      "Police investigating disturbance in industrial district"
    ],
    daysUntilMission: 4
  },
  stage2: {
    templates: [
      "Second report of activity in {sector}",
      "Pattern emerging: something happening in {city}",
      "Anonymous tip suggests {crime} in progress",
      "Witnesses describe armed individuals"
    ],
    daysUntilMission: 3
  },
  stage3: {
    templates: [
      "Police scanner: '10-10 suspicious activity, {sector}'",
      "Intelligence sources confirm {faction} presence",
      "Evidence suggests imminent {crime}",
      "Local authorities requesting assistance"
    ],
    daysUntilMission: 2
  },
  stage4: {
    templates: [
      "URGENT: {crime} confirmed in {city}",
      "Mission unlocked: Stop {faction}",
      "Time-sensitive operation available",
      "Handler requesting immediate deployment"
    ],
    daysUntilMission: 1
  }
};

// Progress rumor each day
export function progressRumors(rumors: Rumor[], gameDay: number) {
  rumors.forEach(rumor => {
    if (rumor.stage < 4) {
      rumor.stage += 1;

      // Update content
      const template = RUMOR_PROGRESSION[`stage${rumor.stage}`].templates[0];
      rumor.content = template
        .replace('{sector}', rumor.sector)
        .replace('{city}', rumor.city || 'unknown location');

      // If stage 4, unlock mission
      if (rumor.stage === 4 && rumor.missionSeedId) {
        const mission = gameStore.getMissionSeed(rumor.missionSeedId);
        if (mission) {
          gameStore.addAvailableMission(createMissionFromSeed(mission));

          // Generate news article
          const article: NewsArticle = {
            id: `mission-unlock-${rumor.id}`,
            headline: `Breaking: ${rumor.content}`,
            source: 'Police Scanner',
            category: 'crime',
            bias: 'neutral',
            generatedFrom: { type: 'rumor' },
            fullText: `Following days of suspicious activity, authorities have confirmed an ongoing situation in ${rumor.city}. Immediate response required.`,
            relatedCountries: [],
            relatedFactions: [],
            timestamp: gameDay * 24,
            missionOpportunity: mission
          };

          gameStore.addNewsArticle(article);
        }
      }
    }
  });
}
```

### Investigation Board

```typescript
// Connect articles to reveal hidden patterns
export interface Investigation {
  id: string;
  name: string;
  articles: string[];  // Article IDs
  connections: Connection[];
  status: 'active' | 'solved' | 'abandoned';
  rewardMission?: MissionSeed;
}

export interface Connection {
  from: string;  // Article ID
  to: string;    // Article ID
  type: 'location' | 'faction' | 'person' | 'date' | 'method';
  confidence: number;  // 0-100
}

// Detect patterns when player connects 3+ articles
export function detectPattern(articles: NewsArticle[]): MissionSeed | null {
  if (articles.length < 3) return null;

  // Check for faction pattern
  const factions = articles.map(a => a.relatedFactions).flat();
  const factionCounts = factions.reduce((acc, f) => {
    acc[f] = (acc[f] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const dominantFaction = Object.entries(factionCounts)
    .sort(([,a], [,b]) => b - a)[0]?.[0];

  if (dominantFaction && factionCounts[dominantFaction] >= 3) {
    // Pattern detected: faction operating in region
    const sectors = articles.map(a => extractSector(a.fullText)).filter(Boolean);
    const likelySector = sectors[0] || 'unknown';

    return {
      sourceArticleId: articles.map(a => a.id).join(','),
      type: 'infiltrate',
      city: 'unknown',
      sector: likelySector,
      difficulty: 8,
      reward: 50000,
      fameReward: 150,
      timeLimit: 168,  // 1 week
      intelQuality: 'detailed',
      intelSources: articles.length
    };
  }

  return null;
}
```

### Faction Movement Tracking

```typescript
// Track faction activities via news
export interface FactionIntel {
  faction: string;
  lastSightings: Sighting[];
  knownBases: string[];  // Sector codes
  activityLevel: 'low' | 'medium' | 'high' | 'extreme';
  estimatedStrength: number;  // 1-100
  nextPredictedAction?: {
    type: string;
    location: string;
    confidence: number;
  };
}

export interface Sighting {
  timestamp: number;
  location: string;
  articleId: string;
  activityType: 'attack' | 'recruitment' | 'movement' | 'unknown';
}

// Update faction intel when news mentions them
export function updateFactionIntel(article: NewsArticle, factionIntel: Map<string, FactionIntel>) {
  article.relatedFactions.forEach(factionName => {
    let intel = factionIntel.get(factionName);
    if (!intel) {
      intel = {
        faction: factionName,
        lastSightings: [],
        knownBases: [],
        activityLevel: 'low',
        estimatedStrength: 50
      };
      factionIntel.set(factionName, intel);
    }

    // Add sighting
    const sighting: Sighting = {
      timestamp: article.timestamp,
      location: article.relatedCountries[0] || 'unknown',
      articleId: article.id,
      activityType: classifyActivity(article.headline)
    };
    intel.lastSightings.unshift(sighting);
    intel.lastSightings = intel.lastSightings.slice(0, 10);  // Keep last 10

    // Update activity level
    const recentSightings = intel.lastSightings.filter(
      s => article.timestamp - s.timestamp < 72  // Last 72 hours
    );
    intel.activityLevel =
      recentSightings.length >= 5 ? 'extreme' :
      recentSightings.length >= 3 ? 'high' :
      recentSightings.length >= 1 ? 'medium' : 'low';
  });
}

function classifyActivity(headline: string): Sighting['activityType'] {
  if (/attack|assault|strike/i.test(headline)) return 'attack';
  if (/recruit|hiring|seeking/i.test(headline)) return 'recruitment';
  if (/spotted|seen|sighting/i.test(headline)) return 'movement';
  return 'unknown';
}
```

---

## 7. FEATURE 6: Newspaper UI

### Overview
Browser-style interface with tabs, categories, search, and archives.

### UI Layout

```
┌─────────────────────────────────────────────────────────┐
│  📰 NEWS BROWSER                           🔍 Search      │
├─────────────────────────────────────────────────────────┤
│  [World] [Local] [Crime] [Politics] [Sports] [Archive]  │
├─────────────────────────────────────────────────────────┤
│  Filter: [All Sources ▾] [All Countries ▾] [Today ▾]    │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  📌 BREAKING NEWS                                        │
│  ┌─────────────────────────────────────────────────┐    │
│  │ 🚨 Technomancer Cult Attacks Mumbai - 200 Dead  │    │
│  │ Global News Network • 2 hours ago               │    │
│  └─────────────────────────────────────────────────┘    │
│                                                          │
│  📰 HEADLINES                                            │
│  ┌─────────────────────────────────────────────────┐    │
│  │ Vigilante Stops Bank Robbery in Lagos           │    │
│  │ Lagos Daily Tribune • 5 hours ago       Fame +15│    │
│  └─────────────────────────────────────────────────┘    │
│                                                          │
│  ┌─────────────────────────────────────────────────┐    │
│  │ New Brazilian President Vows to Crack Down      │    │
│  │ Independent Wire • 8 hours ago                  │    │
│  └─────────────────────────────────────────────────┘    │
│                                                          │
│  ┌─────────────────────────────────────────────────┐    │
│  │ Where is Delta Demolitions? Hero Silent         │    │
│  │ Eastern Times • 12 hours ago            Fame -10│    │
│  └─────────────────────────────────────────────────┘    │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### Component Structure

```typescript
// NewsBrowser.tsx
export function NewsBrowser() {
  const [activeTab, setActiveTab] = useState<NewsCategory>('world');
  const [selectedSource, setSelectedSource] = useState<string>('all');
  const [selectedCountry, setSelectedCountry] = useState<string>('all');
  const [dateRange, setDateRange] = useState<string>('today');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const articles = gameStore.newsArticles
    .filter(a => filterArticle(a, activeTab, selectedSource, selectedCountry, dateRange, searchQuery))
    .sort((a, b) => b.timestamp - a.timestamp);

  return (
    <div className="news-browser">
      <header className="news-header">
        <h2>📰 NEWS BROWSER</h2>
        <input
          type="text"
          placeholder="Search articles..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </header>

      <nav className="news-tabs">
        <button onClick={() => setActiveTab('world')}>World</button>
        <button onClick={() => setActiveTab('local')}>Local</button>
        <button onClick={() => setActiveTab('crime')}>Crime</button>
        <button onClick={() => setActiveTab('politics')}>Politics</button>
        <button onClick={() => setActiveTab('sports')}>Sports</button>
        <button onClick={() => setActiveTab('entertainment')}>Archive</button>
      </nav>

      <div className="news-filters">
        <select value={selectedSource} onChange={(e) => setSelectedSource(e.target.value)}>
          <option value="all">All Sources</option>
          <option value="Global News Network">GNN</option>
          <option value="Eastern Times">Eastern Times</option>
          <option value="Independent Wire">Independent Wire</option>
        </select>

        <select value={selectedCountry} onChange={(e) => setSelectedCountry(e.target.value)}>
          <option value="all">All Countries</option>
          {ALL_COUNTRIES.map(c => (
            <option key={c.code} value={c.code}>{c.name}</option>
          ))}
        </select>

        <select value={dateRange} onChange={(e) => setDateRange(e.target.value)}>
          <option value="today">Today</option>
          <option value="week">This Week</option>
          <option value="month">This Month</option>
          <option value="all">All Time</option>
        </select>
      </div>

      <div className="news-content">
        {articles.map(article => (
          <ArticleCard key={article.id} article={article} />
        ))}
      </div>
    </div>
  );
}
```

### Article Card

```typescript
// ArticleCard.tsx
export function ArticleCard({ article }: { article: NewsArticle }) {
  const [expanded, setExpanded] = useState(false);

  const timeAgo = formatTimeAgo(article.timestamp);
  const fameImpact = article.fameImpact;

  return (
    <div className={`article-card ${article.bias}`}>
      <div className="article-header" onClick={() => setExpanded(!expanded)}>
        <h3 className="article-headline">{article.headline}</h3>
        <div className="article-meta">
          <span className="article-source">{article.source}</span>
          <span className="article-time">{timeAgo}</span>
          {fameImpact !== 0 && (
            <span className={`fame-badge ${fameImpact > 0 ? 'positive' : 'negative'}`}>
              Fame {fameImpact > 0 ? '+' : ''}{fameImpact}
            </span>
          )}
        </div>
      </div>

      {expanded && (
        <div className="article-body">
          <p>{article.fullText}</p>

          {article.missionOpportunity && (
            <div className="mission-opportunity">
              <h4>🎯 Mission Opportunity</h4>
              <p>{article.missionOpportunity.type} in {article.missionOpportunity.city}</p>
              <button onClick={() => acceptMission(article.missionOpportunity)}>
                Accept Mission
              </button>
            </div>
          )}

          <div className="article-tags">
            {article.relatedCountries.map(c => (
              <span key={c} className="tag country-tag">{c}</span>
            ))}
            {article.relatedFactions.map(f => (
              <span key={f} className="tag faction-tag">{f}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
```

### Archive System

```typescript
// Archive articles older than 30 days
export function archiveOldArticles(articles: NewsArticle[], currentGameDay: number) {
  const archiveThreshold = currentGameDay - 30;

  const active: NewsArticle[] = [];
  const archived: NewsArticle[] = [];

  articles.forEach(article => {
    const articleDay = Math.floor(article.timestamp / 24);
    if (articleDay < archiveThreshold) {
      archived.push(article);
    } else {
      active.push(article);
    }
  });

  return { active, archived };
}

// Search archived articles
export function searchArchive(query: string, archived: NewsArticle[]): NewsArticle[] {
  const lowerQuery = query.toLowerCase();

  return archived.filter(article =>
    article.headline.toLowerCase().includes(lowerQuery) ||
    article.fullText.toLowerCase().includes(lowerQuery) ||
    article.relatedCountries.some(c => c.toLowerCase().includes(lowerQuery)) ||
    article.relatedFactions.some(f => f.toLowerCase().includes(lowerQuery))
  );
}
```

### Headline Formatting

```typescript
// Style headlines based on bias and category
export function getHeadlineStyle(article: NewsArticle): React.CSSProperties {
  const baseStyle: React.CSSProperties = {
    fontSize: '18px',
    fontWeight: 600,
    marginBottom: '8px'
  };

  // Bias coloring
  if (article.bias === 'pro-player') {
    baseStyle.color = '#22c55e';
  } else if (article.bias === 'anti-player') {
    baseStyle.color = '#ef4444';
  } else if (article.bias === 'neutral') {
    baseStyle.color = '#f5f5f4';
  }

  // Category icon
  const iconMap: Record<NewsCategory, string> = {
    world: '🌍',
    local: '🏙️',
    crime: '🚨',
    politics: '⚖️',
    sports: '⚽',
    entertainment: '🎬'
  };

  return baseStyle;
}

export function getCategoryIcon(category: NewsCategory): string {
  const iconMap: Record<NewsCategory, string> = {
    world: '🌍',
    local: '🏙️',
    crime: '🚨',
    politics: '⚖️',
    sports: '⚽',
    entertainment: '🎬'
  };
  return iconMap[category];
}
```

---

## 8. DATA STRUCTURES

### Complete Type Definitions

```typescript
// newsSystem.ts - Core types
export interface NewsArticle {
  id: string;
  headline: string;
  source: NewsSource;
  category: NewsCategory;
  bias: NewsBias;
  generatedFrom: NewsOrigin;
  fullText: string;
  imageUrl?: string;
  relatedCountries: string[];
  relatedCities?: string[];
  relatedSectors?: string[];
  relatedFactions: string[];
  timestamp: number;  // Game time in hours
  expirationTime?: number;
  fameImpact?: number;
  publicOpinionShift?: Record<string, number>;
  missionOpportunity?: MissionSeed;
}

export type NewsCategory = 'world' | 'local' | 'crime' | 'politics' | 'sports' | 'entertainment';
export type NewsBias = 'pro-player' | 'anti-player' | 'neutral' | 'pro-regulation' | 'anti-regulation';
export type NewsSource =
  | 'Global News Network'
  | 'Eastern Times'
  | 'Independent Wire'
  | 'Social Truth Network'
  | string;  // Local newspapers

export interface NewsOrigin {
  type: 'player_action' | 'world_event' | 'random_event' | 'rumor';
  missionId?: string;
  characterId?: string;
  faction?: string;
  eventType?: string;
}

// Add to enhancedGameStore.ts
export interface EnhancedGameStore {
  // ... existing properties

  // NEWS SYSTEM
  newsArticles: NewsArticle[];
  publicOpinion: Map<string, PublicOpinion>;
  factionIntel: Map<string, FactionIntel>;
  rumors: Rumor[];
  investigations: Investigation[];

  // NEWS ACTIONS
  addNewsArticle: (article: NewsArticle) => void;
  generateMissionNews: (mission: Mission, result: MissionResult) => void;
  generateWorldEvent: (type: WorldEventType) => void;
  updatePublicOpinion: (countryCode: string, change: number, reason: string) => void;
  updateFactionIntel: (article: NewsArticle) => void;
  processRumors: (gameDay: number) => void;
  archiveOldArticles: (gameDay: number) => void;
}
```

### Database Schema (if using Supabase)

```sql
-- News Articles table
CREATE TABLE news_articles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  headline TEXT NOT NULL,
  source TEXT NOT NULL,
  category TEXT NOT NULL,
  bias TEXT NOT NULL,
  generated_from JSONB NOT NULL,
  full_text TEXT NOT NULL,
  image_url TEXT,
  related_countries TEXT[],
  related_cities TEXT[],
  related_sectors TEXT[],
  related_factions TEXT[],
  timestamp BIGINT NOT NULL,
  expiration_time BIGINT,
  fame_impact INTEGER,
  public_opinion_shifts JSONB,
  mission_opportunity JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_news_timestamp ON news_articles(timestamp DESC);
CREATE INDEX idx_news_category ON news_articles(category);
CREATE INDEX idx_news_countries ON news_articles USING GIN(related_countries);
CREATE INDEX idx_news_factions ON news_articles USING GIN(related_factions);

-- Public Opinion table
CREATE TABLE public_opinion (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  country_code TEXT NOT NULL UNIQUE,
  opinion INTEGER NOT NULL DEFAULT 0 CHECK (opinion >= -100 AND opinion <= 100),
  last_updated BIGINT NOT NULL,
  recent_actions JSONB NOT NULL DEFAULT '[]',
  media_representation TEXT NOT NULL DEFAULT 'vigilante',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_opinion_country ON public_opinion(country_code);

-- Rumors table
CREATE TABLE rumors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  stage INTEGER NOT NULL CHECK (stage BETWEEN 1 AND 4),
  sector TEXT NOT NULL,
  city TEXT,
  content TEXT NOT NULL,
  source TEXT NOT NULL,
  reliability INTEGER NOT NULL CHECK (reliability BETWEEN 0 AND 100),
  mission_seed_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Faction Intel table
CREATE TABLE faction_intel (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  faction TEXT NOT NULL UNIQUE,
  last_sightings JSONB NOT NULL DEFAULT '[]',
  known_bases TEXT[],
  activity_level TEXT NOT NULL DEFAULT 'low',
  estimated_strength INTEGER NOT NULL DEFAULT 50,
  next_predicted_action JSONB,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 9. IMPLEMENTATION ROADMAP

### Phase 1: MVP (2-3 weeks)
**Goal**: Basic news generation from player actions

- [ ] Implement `NewsArticle` data structure
- [ ] Add `newsArticles` array to gameStore
- [ ] Create headline template system
- [ ] Generate news on mission completion
- [ ] Basic NewsBrowser UI component
- [ ] Fame integration (read/modify character.fame)
- [ ] Test with 5-10 missions

**Deliverables**:
- Characters see news articles after completing missions
- Headlines reflect success/failure/collateral damage
- Fame changes based on mission outcomes

---

### Phase 2: World Events (2 weeks)
**Goal**: News from elections, disasters, villain attacks

- [ ] Integrate with existing electionSystem.ts
- [ ] Create disaster event generator
- [ ] Create villain attack generator
- [ ] Breaking news alert UI
- [ ] Archive system (delete articles older than 30 days)
- [ ] Test with 168 countries

**Deliverables**:
- Elections generate political news
- Random world events appear in news feed
- Breaking alerts interrupt gameplay

---

### Phase 3: Public Perception (2 weeks)
**Goal**: Opinion tracking affects gameplay

- [ ] Implement PublicOpinion data structure
- [ ] Opinion calculation based on mission outcomes
- [ ] Opinion meter UI component
- [ ] Opinion effects (prices, recruitment, bounties)
- [ ] Opinion decay over time
- [ ] Test across multiple countries

**Deliverables**:
- Public opinion tracked per country
- Opinion affects mission rewards and equipment costs
- Negative opinion triggers bounties

---

### Phase 4: Intel & Missions (2-3 weeks)
**Goal**: News reveals mission opportunities

- [ ] Mission seed generation from news
- [ ] Rumor system (4-stage progression)
- [ ] Investigation board UI
- [ ] Pattern detection (connect 3+ articles)
- [ ] Faction intel tracking
- [ ] Test mission unlock flow

**Deliverables**:
- Rumors hint at missions 1-4 days in advance
- Investigation board reveals hidden missions
- Faction movements tracked via news

---

### Phase 5: Polish & Advanced Features (2 weeks)
**Goal**: Social media, interviews, disinformation

- [ ] Social media feed UI
- [ ] Police scanner UI
- [ ] Interview system (player gives statements)
- [ ] Enemy propaganda (fake news)
- [ ] Cover stories (player generates disinformation)
- [ ] Full testing and balancing

**Deliverables**:
- Social media reacts to player actions
- Player can give interviews to shape narrative
- Villains can spread fake news

---

### Testing Checklist

```typescript
// Unit tests
describe('News Generation', () => {
  it('generates correct headline for clean success', () => {
    const result = { success: true, collateralDamage: 0, civilianCasualties: 0 };
    const headline = generateHeadline({ ...testMission, result });
    expect(headline).toContain('Stops');
    expect(headline).not.toContain('Casualties');
  });

  it('generates correct headline for messy success', () => {
    const result = { success: true, collateralDamage: 50000, civilianCasualties: 0 };
    const headline = generateHeadline({ ...testMission, result });
    expect(headline).toContain('Damages' || 'Cost');
  });

  it('calculates fame change correctly', () => {
    const result = { success: true, collateralDamage: 0, civilianCasualties: 0, missionDifficulty: 3 };
    const fameChange = calculateFameChange(result);
    expect(fameChange).toBeGreaterThan(0);
  });
});

describe('Public Opinion', () => {
  it('increases opinion on clean success in legal country', () => {
    const country = { vigilantism: 'Legal' };
    const result = { success: true, collateralDamage: 0, civilianCasualties: 0 };
    const change = calculateOpinionChange(country, result, true);
    expect(change).toBeGreaterThan(0);
  });

  it('decreases opinion on illegal operation', () => {
    const country = { vigilantism: 'Banned' };
    const result = { success: true, collateralDamage: 0, civilianCasualties: 0 };
    const change = calculateOpinionChange(country, result, false);
    expect(change).toBeLessThan(0);
  });
});

describe('Rumor System', () => {
  it('progresses rumors over time', () => {
    const rumor = { stage: 1 };
    progressRumors([rumor], 1);
    expect(rumor.stage).toBe(2);
  });

  it('unlocks mission at stage 4', () => {
    const rumor = { stage: 3, missionSeedId: 'test-mission' };
    progressRumors([rumor], 1);
    expect(gameStore.missions).toContainMissionWithId('test-mission');
  });
});
```

---

## CONCLUSION

This News System transforms SuperHero Tactics into a living, reactive world where:

1. **Every action has consequences** - Mission outcomes generate news, affecting fame and public opinion
2. **The world feels alive** - Elections, disasters, and villain attacks happen independently
3. **Intel matters** - News reveals mission opportunities and faction movements
4. **Reputation is strategic** - Managing fame and public opinion affects prices, recruitment, and bounties
5. **Narrative emerges** - Players create their own hero story through headlines

### Core Integration Points

```typescript
// On mission complete
CombatScene.onMissionComplete(result)
  → generateMissionNews(result)
  → updateCharacterFame(fameChange)
  → updatePublicOpinion(opinionChange)
  → addNewsArticle(article)

// Daily tick
GameSimulation.advanceDay()
  → processElections(gameYear)
  → generateWorldEvents()
  → progressRumors()
  → archiveOldArticles()
  → processOpinionDecay()

// Player reads news
NewsBrowser.onArticleClick(article)
  → display full text
  → show mission opportunity button
  → update investigation board
```

### Success Metrics

- **Engagement**: 60%+ of players read news articles regularly
- **Impact**: News-discovered missions = 30%+ of total missions completed
- **Balance**: Fame progression feels rewarding (50-100 hours to reach Global tier)
- **Immersion**: Players feel like they're operating in a living geopolitical world

---

**Ready for Implementation**: All data structures are designed to integrate with existing systems. Start with Phase 1 to see immediate results.
