/**
 * Character Generation System
 *
 * Generates characters with realistic city familiarity based on:
 * - Bell curve distribution (most people know 1-3 cities, few know 5-7)
 * - Culture codes as proxy for neighboring regions
 * - Most people haven't left their country
 * - Birth city always has 100% familiarity
 */

import { cities, City, CULTURE_CODES } from './cities';
import { ALL_COUNTRIES as countries } from './countries';
import { generateName } from './nameDatabase';
import {
  GameCharacter,
  CityFamiliarity,
  CharacterStatus,
  OriginType,
  CareerType,
  CharacterGenerationConfig,
  DEFAULT_CHARACTER_GEN_CONFIG,
} from '../types';

// Personality & Calling systems
import {
  generateMBTI,
  generatePersonalityWithVariation,
  generateCallingForMBTI,
  PersonalityTraits,
} from './personalitySystem';
import { CallingId, generateCallingForBackground } from './callingSystem';

// Country-specific generation profiles
import {
  getCountryProfile,
  determineRole,
  type CharacterRole,
  type EducationField,
  EDUCATION_FIELDS,
  type CountryProfile,
} from './countryProfiles';

// =============================================================================
// CULTURE CODE NEIGHBORS
// =============================================================================

/**
 * Define which culture codes are "neighboring" for travel purposes
 * Characters from one culture are more likely to have visited neighboring cultures
 */
const CULTURE_NEIGHBORS: Record<number, number[]> = {
  1:  [2, 14],           // North Africa -> Central Africa, Middle East
  2:  [1, 3],            // Central Africa -> North Africa, Southern Africa
  3:  [2],               // Southern Africa -> Central Africa
  4:  [5, 14, 10],       // Central Asia -> South Asia, Middle East, East Europe
  5:  [4, 6],            // South Asia -> Central Asia, East+SE Asia
  6:  [5, 11],           // East+SE Asia -> South Asia, Oceania
  7:  [8, 13, 12],       // Caribbean -> Central America, North America, South America
  8:  [7, 13, 12],       // Central America -> Caribbean, North America, South America
  9:  [10, 1],           // West Europe -> East Europe, North Africa
  10: [9, 4, 14],        // East Europe -> West Europe, Central Asia, Middle East
  11: [6],               // Oceania -> East+SE Asia
  12: [8, 7],            // South America -> Central America, Caribbean
  13: [8, 7],            // North America -> Central America, Caribbean
  14: [1, 4, 10, 9],     // Middle East -> North Africa, Central Asia, East Europe, West Europe
};

// =============================================================================
// RANDOM UTILITIES
// =============================================================================

/**
 * Get a random integer between min and max (inclusive)
 */
function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Pick random item from array
 */
function randomPick<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

/**
 * Pick multiple random unique items from array
 */
function randomPickMultiple<T>(array: T[], count: number): T[] {
  const shuffled = [...array].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, array.length));
}

/**
 * Weighted random selection
 */
function weightedRandom(weights: { value: number; weight: number }[]): number {
  const totalWeight = weights.reduce((sum, w) => sum + w.weight, 0);
  let random = Math.random() * totalWeight;

  for (const { value, weight } of weights) {
    random -= weight;
    if (random <= 0) return value;
  }

  return weights[weights.length - 1].value;
}

// =============================================================================
// CITY SELECTION
// =============================================================================

/**
 * Get cities by culture code
 */
function getCitiesByCulture(cultureCode: number): City[] {
  return cities.filter(c => c.cultureCode === cultureCode);
}

/**
 * Get cities by country name
 */
function getCitiesByCountryName(countryName: string): City[] {
  return cities.filter(c => c.country.toLowerCase() === countryName.toLowerCase());
}

/**
 * Pick a random city weighted by population (larger cities more likely)
 */
function pickRandomCityWeighted(cityList: City[]): City {
  // Weight by population rating (1-5)
  const weights = cityList.map(c => ({
    city: c,
    weight: c.populationRating * c.populationRating, // Square for stronger bias
  }));

  const totalWeight = weights.reduce((sum, w) => sum + w.weight, 0);
  let random = Math.random() * totalWeight;

  for (const { city, weight } of weights) {
    random -= weight;
    if (random <= 0) return city;
  }

  return cityList[cityList.length - 1];
}

// =============================================================================
// CHARACTER GENERATION
// =============================================================================

/**
 * Determine how many cities a character is familiar with (bell curve)
 */
function rollFamiliarCityCount(config: CharacterGenerationConfig): number {
  const { familiarCitiesDistribution } = config;

  const roll = Math.random() * 100;

  if (roll < familiarCitiesDistribution.weight1to2) {
    return randomInt(1, 2);
  } else if (roll < familiarCitiesDistribution.weight1to2 + familiarCitiesDistribution.weight3to4) {
    return randomInt(3, 4);
  } else {
    return randomInt(5, 7);
  }
}

/**
 * Generate city familiarities for a character
 */
function generateCityFamiliarities(
  birthCity: City,
  config: CharacterGenerationConfig = DEFAULT_CHARACTER_GEN_CONFIG,
  gameStartTime: number = 0
): CityFamiliarity[] {
  const familiarities: CityFamiliarity[] = [];

  // Birth city always 100% familiarity
  familiarities.push({
    cityId: `${birthCity.name}_${birthCity.country}`,
    cityName: birthCity.name,
    familiarity: 100,
    lastVisited: gameStartTime,
  });

  // Determine how many additional cities they know
  const totalCities = rollFamiliarCityCount(config);
  const additionalCities = totalCities - 1; // Minus birth city

  if (additionalCities <= 0) {
    return familiarities;
  }

  // Get cities in same country
  const sameCountryCities = getCitiesByCountryName(birthCity.country)
    .filter(c => c.name !== birthCity.name);

  // Get cities in neighboring cultures
  const neighboringCultures = CULTURE_NEIGHBORS[birthCity.cultureCode] || [];
  const neighborCities = neighboringCultures.flatMap(code => getCitiesByCulture(code));

  // Will this character have left their country?
  const leftCountry = Math.random() * 100 < config.chanceLeftCountry;

  // Add additional cities
  let citiesAdded = 0;

  // First, add cities from same country (more likely)
  if (sameCountryCities.length > 0) {
    const sameCountryCount = leftCountry
      ? Math.min(Math.floor(additionalCities * 0.6), sameCountryCities.length)
      : Math.min(additionalCities, sameCountryCities.length);

    const selectedSameCountry = randomPickMultiple(sameCountryCities, sameCountryCount);

    for (const city of selectedSameCountry) {
      // Familiarity varies - closer to birth city = higher familiarity
      const baseFamiliarity = randomInt(30, 80);
      familiarities.push({
        cityId: `${city.name}_${city.country}`,
        cityName: city.name,
        familiarity: baseFamiliarity,
        lastVisited: gameStartTime - randomInt(30, 365) * 24 * 60, // Random past visit
      });
      citiesAdded++;
    }
  }

  // Then add foreign cities if they've traveled
  if (leftCountry && citiesAdded < additionalCities && neighborCities.length > 0) {
    const foreignCount = additionalCities - citiesAdded;

    // 70% chance it's from same culture region, 30% anywhere
    const sameCultureRoll = Math.random() * 100 < config.sameCultureBonus;

    let foreignPool: City[];
    if (sameCultureRoll) {
      foreignPool = neighborCities;
    } else {
      // Any city in the world (excluding birth country)
      foreignPool = cities.filter(c => c.country !== birthCity.country);
    }

    const selectedForeign = randomPickMultiple(foreignPool, foreignCount);

    for (const city of selectedForeign) {
      // Foreign cities typically have lower familiarity
      const baseFamiliarity = randomInt(15, 50);
      familiarities.push({
        cityId: `${city.name}_${city.country}`,
        cityName: city.name,
        familiarity: baseFamiliarity,
        lastVisited: gameStartTime - randomInt(60, 730) * 24 * 60, // Random past visit (longer ago)
      });
    }
  }

  return familiarities;
}

/**
 * Generate random primary stats
 */
function generateStats(threatLevel: number = 2): { MEL: number; AGL: number; STR: number; STA: number; INT: number; INS: number; CON: number } {
  // Base stats depend on threat level
  const baseMin = 20 + (threatLevel * 5);
  const baseMax = 40 + (threatLevel * 10);

  return {
    MEL: randomInt(baseMin, baseMax),
    AGL: randomInt(baseMin, baseMax),
    STR: randomInt(baseMin, baseMax),
    STA: randomInt(baseMin, baseMax),
    INT: randomInt(baseMin, baseMax),
    INS: randomInt(baseMin, baseMax),
    CON: randomInt(baseMin, baseMax),
  };
}

/**
 * Generate a random origin type with weighted distribution
 */
function generateOrigin(): OriginType {
  // Most characters are normal humans (origin 1-4)
  const weights = [
    { value: 1, weight: 40 },  // Skilled Human - most common
    { value: 2, weight: 15 },  // Altered Human
    { value: 3, weight: 15 },  // Tech Enhancement
    { value: 4, weight: 15 },  // Mutated Human
    { value: 5, weight: 5 },   // Spiritual Enhancement - rare
    { value: 6, weight: 5 },   // Robotic - rare
    { value: 7, weight: 3 },   // Symbiotic - very rare
    { value: 8, weight: 2 },   // Alien - very rare
  ];

  return weightedRandom(weights) as OriginType;
}

/**
 * Generate a random career type with weighted distribution
 * Career affects prep time for assignments
 */
function generateCareer(): CareerType {
  const weights = [
    { value: 'soldier', weight: 20 },
    { value: 'special_forces', weight: 5 },
    { value: 'police', weight: 15 },
    { value: 'scientist', weight: 10 },
    { value: 'engineer', weight: 10 },
    { value: 'medic', weight: 8 },
    { value: 'intelligence', weight: 7 },
    { value: 'civilian', weight: 15 },
    { value: 'mercenary', weight: 5 },
    { value: 'vigilante', weight: 5 },
  ];

  const totalWeight = weights.reduce((sum, w) => sum + w.weight, 0);
  let random = Math.random() * totalWeight;

  for (const { value, weight } of weights) {
    random -= weight;
    if (random <= 0) return value as CareerType;
  }

  return 'civilian';
}

// =============================================================================
// COUNTRY PROFILE INTEGRATION
// =============================================================================

/**
 * Generate origin based on country profile weights
 */
function generateOriginFromProfile(profile: CountryProfile): OriginType {
  const weights = profile.originWeights;
  const weightList = [
    { value: 1, weight: weights.skilled_human },      // Skilled Human
    { value: 2, weight: weights.altered_human },      // Altered Human
    { value: 3, weight: weights.tech_enhanced },      // Tech Enhancement
    { value: 4, weight: weights.mutated },            // Mutated Human
    { value: 5, weight: weights.spiritual },          // Spiritual Enhancement
    { value: 6, weight: weights.synthetic },          // Robotic/Synthetic
    { value: 7, weight: weights.symbiotic },          // Symbiotic
    { value: 8, weight: weights.alien },              // Alien
    { value: 9, weight: weights.trained_soldier },    // Trained Soldier (maps to origin 9)
  ];

  // Normalize weights (they should sum to 100, but handle any discrepancy)
  const totalWeight = weightList.reduce((sum, w) => sum + w.weight, 0);
  let random = Math.random() * totalWeight;

  for (const { value, weight } of weightList) {
    random -= weight;
    if (random <= 0) return value as OriginType;
  }

  return 1 as OriginType; // Default to skilled human
}

/**
 * Apply country stat tendencies to base stats
 */
function applyStatTendencies(
  baseStats: { MEL: number; AGL: number; STR: number; STA: number; INT: number; INS: number; CON: number },
  tendencies: CountryProfile['statTendencies']
): { MEL: number; AGL: number; STR: number; STA: number; INT: number; INS: number; CON: number } {
  return {
    MEL: Math.max(10, Math.min(100, baseStats.MEL + (tendencies.MEL || 0))),
    AGL: Math.max(10, Math.min(100, baseStats.AGL + (tendencies.AGL || 0))),
    STR: Math.max(10, Math.min(100, baseStats.STR + (tendencies.STR || 0))),
    STA: Math.max(10, Math.min(100, baseStats.STA + (tendencies.STA || 0))),
    INT: Math.max(10, Math.min(100, baseStats.INT + (tendencies.INT || 0))),
    INS: Math.max(10, Math.min(100, baseStats.INS + (tendencies.INS || 0))),
    CON: Math.max(10, Math.min(100, baseStats.CON + (tendencies.CON || 0))),
  };
}

/**
 * Generate education fields based on country profile weights
 * Returns 1-3 education fields
 */
function generateEducationFields(profile: CountryProfile): EducationField[] {
  const weights = profile.educationWeights;
  const weightEntries = Object.entries(weights) as [EducationField, number][];

  // Determine number of education fields (1-3)
  const numFields = weightedRandom([
    { value: 1, weight: 40 },  // Most have 1 specialty
    { value: 2, weight: 40 },  // Some have 2
    { value: 3, weight: 20 },  // Few have 3
  ]);

  const selectedFields: EducationField[] = [];
  const availableFields = [...weightEntries];

  for (let i = 0; i < numFields && availableFields.length > 0; i++) {
    const totalWeight = availableFields.reduce((sum, [, w]) => sum + w, 0);
    let random = Math.random() * totalWeight;

    for (let j = 0; j < availableFields.length; j++) {
      const [field, weight] = availableFields[j];
      random -= weight;
      if (random <= 0) {
        selectedFields.push(field);
        availableFields.splice(j, 1); // Remove selected field
        break;
      }
    }
  }

  // If no fields selected, pick a random common one
  if (selectedFields.length === 0) {
    const commonFields: EducationField[] = ['combat_sciences', 'investigation', 'medicine'];
    selectedFields.push(randomPick(commonFields));
  }

  return selectedFields;
}

/**
 * Map education fields to career type
 * This helps align education with appropriate career
 */
function careerFromEducation(education: EducationField[]): CareerType {
  const careerMap: Record<EducationField, CareerType[]> = {
    military_tactics: ['soldier', 'special_forces'],
    weapons_systems: ['soldier', 'special_forces', 'mercenary'],
    martial_arts: ['special_forces', 'vigilante', 'mercenary'],
    combat_sciences: ['soldier', 'special_forces'],
    demolitions: ['special_forces', 'mercenary'],
    hacking: ['intelligence', 'engineer'],
    electronics: ['engineer', 'scientist'],
    robotics: ['engineer', 'scientist'],
    cybernetics: ['engineer', 'scientist'],
    weapons_smithing: ['engineer', 'mercenary'],
    engineering: ['engineer', 'scientist'],
    medicine: ['medic', 'scientist'],
    biology: ['scientist', 'medic'],
    genetics: ['scientist'],
    chemistry: ['scientist'],
    forensics: ['police', 'intelligence'],
    surgery: ['medic'],
    psychology: ['intelligence', 'scientist'],
    interrogation: ['police', 'intelligence'],
    diplomacy: ['intelligence', 'civilian'],
    investigation: ['police', 'intelligence'],
    undercover: ['intelligence', 'police'],
    languages: ['intelligence', 'civilian'],
    tradecraft: ['intelligence'],
    super_science: ['scientist', 'engineer'],
    mystical_studies: ['vigilante', 'civilian'],
    underground_ops: ['mercenary', 'vigilante'],
  };

  // Find the most common career across all education fields
  const careerCounts: Record<string, number> = {};
  for (const field of education) {
    const careers = careerMap[field] || ['civilian'];
    for (const career of careers) {
      careerCounts[career] = (careerCounts[career] || 0) + 1;
    }
  }

  // Find highest count
  let bestCareer: CareerType = 'civilian';
  let bestCount = 0;
  for (const [career, count] of Object.entries(careerCounts)) {
    if (count > bestCount) {
      bestCount = count;
      bestCareer = career as CareerType;
    }
  }

  return bestCareer;
}

/**
 * Determine if character has a secret identity
 * Based on origin and career
 */
function generateSecretIdentity(origin: OriginType, career: CareerType): boolean {
  // Military/police typically don't have secret identities
  if (['soldier', 'special_forces', 'police'].includes(career)) {
    return Math.random() < 0.1; // 10% chance
  }

  // Vigilantes almost always have secret identities
  if (career === 'vigilante') {
    return Math.random() < 0.9; // 90% chance
  }

  // Enhanced humans often have secret identities
  if ([2, 4, 5, 7].includes(origin)) {
    return Math.random() < 0.7; // 70% chance
  }

  // Tech/robotic less likely
  if ([3, 6].includes(origin)) {
    return Math.random() < 0.4; // 40% chance
  }

  // Default 50/50
  return Math.random() < 0.5;
}

// =============================================================================
// MAIN GENERATION FUNCTION
// =============================================================================

export interface CharacterGenerationOptions {
  // Required
  name?: string;
  realName?: string;

  // Optional - will be randomly generated if not provided
  birthCity?: City;
  birthCountry?: string;
  origin?: OriginType;
  threatLevel?: number;  // 1-9

  // Config
  config?: CharacterGenerationConfig;
  gameStartTime?: number;
}

/**
 * Generate a complete character with all fields populated
 */
export function generateCharacter(options: CharacterGenerationOptions = {}): GameCharacter {
  const {
    config = DEFAULT_CHARACTER_GEN_CONFIG,
    gameStartTime = 0,
  } = options;

  // Pick birth city if not provided
  let birthCity: City;
  if (options.birthCity) {
    birthCity = options.birthCity;
  } else if (options.birthCountry) {
    const countryCities = getCitiesByCountryName(options.birthCountry);
    birthCity = countryCities.length > 0
      ? pickRandomCityWeighted(countryCities)
      : pickRandomCityWeighted(cities);
  } else {
    // Random city, weighted by population
    birthCity = pickRandomCityWeighted(cities);
  }

  // Generate threat level (1-9, most are low)
  const threatLevel = options.threatLevel ?? weightedRandom([
    { value: 1, weight: 30 },
    { value: 2, weight: 25 },
    { value: 3, weight: 20 },
    { value: 4, weight: 12 },
    { value: 5, weight: 7 },
    { value: 6, weight: 3 },
    { value: 7, weight: 2 },
    { value: 8, weight: 0.8 },
    { value: 9, weight: 0.2 },
  ]);

  // Generate stats
  const stats = generateStats(threatLevel);

  // Calculate health from stats (MEL + AGL + STA + STR = ~60 HP for average human)
  const maxHealth = stats.MEL + stats.AGL + stats.STA + stats.STR;

  // Get country info
  const country = countries.find(c =>
    c.name.toLowerCase() === birthCity.country.toLowerCase() ||
    c.code === birthCity.countryIso
  );

  // Generate city familiarities
  const cityFamiliarities = generateCityFamiliarities(birthCity, config, gameStartTime);

  // Generate unique ID
  const id = `char_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Generate gender first (needed for culture-appropriate name generation)
  const gender = randomPick(['male', 'female']) as 'male' | 'female';

  // Generate culture-appropriate names using birth city's culture code
  const cultureName = generateName(birthCity.cultureCode, gender);
  const realName = options.realName ?? (cultureName?.fullName ?? `Agent ${randomInt(100, 999)}`);
  const codeName = options.name ?? (cultureName?.fullName ?? `${birthCity.country.slice(0, 3).toUpperCase()}-${randomInt(10, 99)}`);

  // Generate origin and career first (needed for secret identity)
  const origin = options.origin ?? generateOrigin();
  const career = generateCareer();
  const secretIdentity = generateSecretIdentity(origin, career);

  return {
    id,
    name: codeName,
    realName,

    // Origin & Career
    origin,
    threatLevel: `THREAT_${threatLevel}`,
    career,

    // Identity
    secretIdentity,

    // Birth location
    birthCity: `${birthCity.name}_${birthCity.country}`,
    birthCountry: birthCity.countryIso || birthCity.country,
    nationality: country?.nationality ?? birthCity.country,

    // Current location (starts at birth city)
    currentCity: `${birthCity.name}_${birthCity.country}`,
    currentSector: birthCity.sector,
    currentCountry: birthCity.countryIso || birthCity.country,

    // City knowledge
    cityFamiliarities,

    // Status
    status: 'ready' as CharacterStatus,

    // Stats
    stats,

    // Secondary stats
    fame: randomInt(0, threatLevel * 100),
    wealth: randomInt(100, 1000 + threatLevel * 500),

    // Health
    health: {
      current: maxHealth,
      maximum: maxHealth,
    },

    // Defense (will be modified by equipment)
    shield: 0,
    maxShield: 0,
    shieldRegen: 0,
    dr: 0,

    // Equipment (empty to start)
    equippedArmor: undefined,
    equippedShield: undefined,
    equipment: [],

    // Abilities
    powers: [],
    skills: [],
    talents: [],

    // Medical
    injuries: [],
    medicalHistory: [],
    recoveryTime: 0,

    // Personality - generated from MBTI with aligned calling
    personality: (() => {
      // Generate MBTI first (weighted distribution)
      const mbti = generateMBTI();

      // Generate calling that fits MBTI (70% primary, 30% secondary)
      // Can also consider career for additional context
      let calling: CallingId;
      if (Math.random() < 0.8) {
        // 80% use MBTI-aligned calling
        calling = generateCallingForMBTI(mbti);
      } else {
        // 20% use career-based calling for variety
        calling = generateCallingForBackground(career);
      }

      // Generate personality traits with variation
      const traits = generatePersonalityWithVariation(mbti);

      return {
        mbti,
        calling,
        volatility: traits.volatility,
        harmAvoidance: traits.harmAvoidance,
      };
    })(),

    // Reputation
    reputation: {
      public: randomInt(-20, 20),
      media: randomInt(-20, 20),
      wanted: 0,
      criminal: 0,
    },

    // Employment
    employment: {
      contractType: 'freelance',
      morale: randomInt(50, 80),
      fatigue: randomInt(0, 30),
    },

    // Appearance
    gender,
    age: randomInt(18, 55),
    handedness: weightedRandom([
      { value: 0, weight: 90 },  // Right
      { value: 1, weight: 9 },   // Left
      { value: 2, weight: 1 },   // Ambidextrous
    ]) === 0 ? 'right' : (Math.random() < 0.9 ? 'left' : 'ambidextrous'),
  };
}

/**
 * Generate multiple characters
 */
export function generateSquad(count: number, options: Partial<CharacterGenerationOptions> = {}): GameCharacter[] {
  return Array.from({ length: count }, () => generateCharacter(options));
}

/**
 * Generate a character from a specific country
 */
export function generateCharacterFromCountry(countryName: string, options: Partial<CharacterGenerationOptions> = {}): GameCharacter {
  return generateCharacter({
    ...options,
    birthCountry: countryName,
  });
}

/**
 * Generate a character from a specific city
 */
export function generateCharacterFromCity(cityName: string, options: Partial<CharacterGenerationOptions> = {}): GameCharacter | null {
  const city = cities.find(c => c.name.toLowerCase() === cityName.toLowerCase());
  if (!city) return null;

  return generateCharacter({
    ...options,
    birthCity: city,
  });
}

// =============================================================================
// COUNTRY-PROFILE-AWARE GENERATION
// =============================================================================

export interface ProfileCharacterOptions extends CharacterGenerationOptions {
  /** Use country profile for origin/stats/education */
  useCountryProfile?: boolean;
}

/**
 * Extended character type with education and role
 */
export interface ProfiledCharacter extends GameCharacter {
  /** Character's primary role classification */
  role: CharacterRole;
  /** Education/training fields */
  education: EducationField[];
  /** Why this character is useful (tooltip text) */
  roleDescription: string;
  /** Country profile used for generation */
  countryProfile?: string;
  /** Cultural traits from country */
  culturalTraits?: string[];
}

/**
 * Get role description for UI tooltip
 */
function getRoleDescription(role: CharacterRole, education: EducationField[]): string {
  const descriptions: Record<CharacterRole, string> = {
    soldier: 'Combat specialist, frontline fighter',
    specialist: 'Tech expert, security bypass, hacking',
    scientist: 'Research, analysis, compound creation',
    investigator: 'Intel gathering, case solving, forensics',
    operative: 'Infiltration, undercover ops, interrogation',
    support: 'Medical care, repairs, logistics',
  };

  const eduLabels = education.map(e =>
    EDUCATION_FIELDS[e]?.label || e.replace(/_/g, ' ')
  ).join(', ');

  return `${descriptions[role]}. Skills: ${eduLabels}`;
}

/**
 * Generate a character using country profile for distinct attributes
 * This is the main function for the recruiting system
 */
export function generateCharacterWithProfile(
  countryName: string,
  options: Partial<ProfileCharacterOptions> = {}
): ProfiledCharacter {
  const {
    config = DEFAULT_CHARACTER_GEN_CONFIG,
    gameStartTime = 0,
    useCountryProfile = true,
  } = options;

  // Get country and profile
  const country = countries.find(c =>
    c.name.toLowerCase() === countryName.toLowerCase() ||
    c.code.toLowerCase() === countryName.toLowerCase()
  );

  const profile = useCountryProfile ? getCountryProfile(countryName) : null;

  // Pick birth city from the country
  const countryCities = getCitiesByCountryName(countryName);
  const birthCity = countryCities.length > 0
    ? pickRandomCityWeighted(countryCities)
    : pickRandomCityWeighted(cities);

  // Generate threat level (1-9, most are low)
  const threatLevel = options.threatLevel ?? weightedRandom([
    { value: 1, weight: 30 },
    { value: 2, weight: 25 },
    { value: 3, weight: 20 },
    { value: 4, weight: 12 },
    { value: 5, weight: 7 },
    { value: 6, weight: 3 },
    { value: 7, weight: 2 },
    { value: 8, weight: 0.8 },
    { value: 9, weight: 0.2 },
  ]);

  // Generate base stats then apply country tendencies
  let stats = generateStats(threatLevel);
  if (profile) {
    stats = applyStatTendencies(stats, profile.statTendencies);
  }

  // Calculate health from stats
  const maxHealth = stats.MEL + stats.AGL + stats.STA + stats.STR;

  // Generate city familiarities
  const cityFamiliarities = generateCityFamiliarities(birthCity, config, gameStartTime);

  // Generate unique ID
  const id = `char_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Generate gender (needed for name)
  const gender = randomPick(['male', 'female']) as 'male' | 'female';

  // Generate culture-appropriate name
  const cultureName = generateName(birthCity.cultureCode, gender);
  const realName = options.realName ?? (cultureName?.fullName ?? `Agent ${randomInt(100, 999)}`);
  const codeName = options.name ?? (cultureName?.fullName ?? `${birthCity.country.slice(0, 3).toUpperCase()}-${randomInt(10, 99)}`);

  // Generate origin using country profile weights
  const origin = options.origin ?? (profile
    ? generateOriginFromProfile(profile)
    : generateOrigin());

  // Generate education fields based on country profile
  const education = profile
    ? generateEducationFields(profile)
    : ['combat_sciences' as EducationField];

  // Determine career based on education (instead of random)
  const career = careerFromEducation(education);

  // Determine role based on education
  const role = determineRole(education);
  const roleDescription = getRoleDescription(role, education);

  // Secret identity check
  const secretIdentity = generateSecretIdentity(origin, career);

  // Build the profiled character
  const character: ProfiledCharacter = {
    id,
    name: codeName,
    realName,

    // Origin & Career
    origin,
    threatLevel: `THREAT_${threatLevel}`,
    career,

    // Identity
    secretIdentity,

    // Birth location
    birthCity: `${birthCity.name}_${birthCity.country}`,
    birthCountry: birthCity.countryIso || birthCity.country,
    nationality: country?.nationality ?? birthCity.country,

    // Current location
    currentCity: `${birthCity.name}_${birthCity.country}`,
    currentSector: birthCity.sector,
    currentCountry: birthCity.countryIso || birthCity.country,

    // City knowledge
    cityFamiliarities,

    // Status
    status: 'ready' as CharacterStatus,

    // Stats
    stats,

    // Secondary stats
    fame: randomInt(0, threatLevel * 100),
    wealth: randomInt(100, 1000 + threatLevel * 500),

    // Health
    health: {
      current: maxHealth,
      maximum: maxHealth,
    },

    // Defense
    shield: 0,
    maxShield: 0,
    shieldRegen: 0,
    dr: 0,

    // Equipment
    equippedArmor: undefined,
    equippedShield: undefined,
    equipment: [],

    // Abilities
    powers: [],
    skills: [],
    talents: [],

    // Medical
    injuries: [],
    medicalHistory: [],
    recoveryTime: 0,

    // Personality
    personality: (() => {
      const mbti = generateMBTI();
      let calling: CallingId;
      if (Math.random() < 0.8) {
        calling = generateCallingForMBTI(mbti);
      } else {
        calling = generateCallingForBackground(career);
      }
      const traits = generatePersonalityWithVariation(mbti);
      return {
        mbti,
        calling,
        volatility: traits.volatility,
        harmAvoidance: traits.harmAvoidance,
      };
    })(),

    // Reputation
    reputation: {
      public: randomInt(-20, 20),
      media: randomInt(-20, 20),
      wanted: 0,
      criminal: 0,
    },

    // Employment
    employment: {
      contractType: 'freelance',
      morale: randomInt(50, 80),
      fatigue: randomInt(0, 30),
    },

    // Appearance
    gender,
    age: randomInt(18, 55),
    handedness: weightedRandom([
      { value: 0, weight: 90 },
      { value: 1, weight: 9 },
      { value: 2, weight: 1 },
    ]) === 0 ? 'right' : (Math.random() < 0.9 ? 'left' : 'ambidextrous'),

    // NEW: Profile-specific fields
    role,
    education,
    roleDescription,
    countryProfile: profile?.countryCode,
    culturalTraits: profile?.culturalTraits,
  };

  return character;
}

/**
 * Generate a recruiting pool for a country
 * Returns 8-12 candidates with diverse roles
 */
export function generateRecruitingPool(
  countryName: string,
  poolSize: number = 10
): ProfiledCharacter[] {
  const pool: ProfiledCharacter[] = [];

  // Track roles to ensure diversity
  const roleCounts: Record<CharacterRole, number> = {
    soldier: 0,
    specialist: 0,
    scientist: 0,
    investigator: 0,
    operative: 0,
    support: 0,
  };

  // Minimum 1 of each role type for pools of 8+
  const minPerRole = poolSize >= 8 ? 1 : 0;

  // Generate candidates
  for (let i = 0; i < poolSize; i++) {
    const candidate = generateCharacterWithProfile(countryName);

    // Check if we need to enforce role diversity
    const underrepresentedRoles = (Object.keys(roleCounts) as CharacterRole[])
      .filter(role => roleCounts[role] < minPerRole);

    if (underrepresentedRoles.length > 0 && i >= poolSize - underrepresentedRoles.length) {
      // Force a specific role for diversity
      // Re-generate until we get an underrepresented role
      let attempts = 0;
      while (!underrepresentedRoles.includes(candidate.role) && attempts < 5) {
        const newCandidate = generateCharacterWithProfile(countryName);
        if (underrepresentedRoles.includes(newCandidate.role)) {
          pool.push(newCandidate);
          roleCounts[newCandidate.role]++;
          break;
        }
        attempts++;
      }
      if (attempts >= 5) {
        pool.push(candidate);
        roleCounts[candidate.role]++;
      }
    } else {
      pool.push(candidate);
      roleCounts[candidate.role]++;
    }
  }

  return pool;
}

/**
 * Filter recruiting pool by role
 */
export function filterPoolByRole(
  pool: ProfiledCharacter[],
  role: CharacterRole | 'all'
): ProfiledCharacter[] {
  if (role === 'all') return pool;
  return pool.filter(c => c.role === role);
}

// =============================================================================
// DEBUG / TESTING
// =============================================================================

/**
 * Print familiarity distribution for testing
 */
export function debugFamiliarityDistribution(sampleSize: number = 100): void {
  const counts: Record<number, number> = {};

  for (let i = 0; i < sampleSize; i++) {
    const char = generateCharacter();
    const familiarCount = char.cityFamiliarities.length;
    counts[familiarCount] = (counts[familiarCount] || 0) + 1;
  }

  console.log('City Familiarity Distribution:');
  for (const [count, freq] of Object.entries(counts).sort((a, b) => Number(a[0]) - Number(b[0]))) {
    const pct = ((freq / sampleSize) * 100).toFixed(1);
    console.log(`  ${count} cities: ${freq} (${pct}%)`);
  }
}

/**
 * Print culture code distribution for testing
 */
export function debugCultureDistribution(sampleSize: number = 100): void {
  const counts: Record<number, number> = {};

  for (let i = 0; i < sampleSize; i++) {
    const char = generateCharacter();
    const birthCityName = char.birthCity.split('_')[0];
    const city = cities.find(c => c.name === birthCityName);
    if (city) {
      counts[city.cultureCode] = (counts[city.cultureCode] || 0) + 1;
    }
  }

  console.log('Culture Code Distribution:');
  for (const [code, freq] of Object.entries(counts).sort((a, b) => Number(b[1]) - Number(a[1]))) {
    const pct = ((freq / sampleSize) * 100).toFixed(1);
    const cultureName = CULTURE_CODES[Number(code)] || 'Unknown';
    console.log(`  ${cultureName}: ${freq} (${pct}%)`);
  }
}

// =============================================================================
// EXPORTS
// =============================================================================

// Re-export types and functions from countryProfiles for convenience.
// Types MUST use `export type` so esbuild does not emit a runtime binding
// (these are erased at build time and would otherwise crash the module graph).
export type {
  CharacterRole,
  RoleDefinition,
  EducationField,
} from './countryProfiles';
export {
  EDUCATION_FIELDS,
  CHARACTER_ROLES,
  determineRole
} from './countryProfiles';

export default {
  generateCharacter,
  generateSquad,
  generateCharacterFromCountry,
  generateCharacterFromCity,
  generateCharacterWithProfile,
  generateRecruitingPool,
  filterPoolByRole,
  debugFamiliarityDistribution,
  debugCultureDistribution,
  CULTURE_NEIGHBORS,
};
