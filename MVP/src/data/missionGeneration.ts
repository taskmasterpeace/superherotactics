/**
 * Mission Generation System
 * Generates contextual missions based on city and country characteristics
 *
 * DESIGN PHILOSOPHY:
 * - High crime cities -> more crime missions (gangs, theft)
 * - Military cities -> military/extraction missions
 * - Political cities -> investigation/diplomacy missions
 * - Country stats affect mission difficulty, rewards, and enemy quality
 * - Combined stats create emergent mission types (corruption + weak law = smuggling)
 */

import {
  MISSION_TEMPLATES,
  MissionTemplate,
  GeneratedMission,
  generateMission,
  MissionType,
  MissionSource,
} from './missionSystem';
import { City, getCitiesBySector } from './allCities';
import { Country } from './countries';
import { calculateCountryEffects, calculateCityEffects, CITY_TYPE_SERVICES } from './locationEffects';

// =============================================================================
// MISSION WEIGHTS - How likely is each mission type per location?
// =============================================================================

interface MissionWeight {
  templateId: string;
  baseWeight: number;  // 0-100
}

/**
 * Calculate mission weights based on city type
 */
function getMissionWeightsByCityType(cityType: string): MissionWeight[] {
  const weights: MissionWeight[] = [];

  switch (cityType) {
    case 'Military':
      weights.push(
        { templateId: 'extract_vip', baseWeight: 30 },
        { templateId: 'extract_data', baseWeight: 25 },
        { templateId: 'escort_convoy', baseWeight: 40 },
        { templateId: 'protect_location', baseWeight: 35 },
        { templateId: 'capture_outpost', baseWeight: 30 },
        { templateId: 'capture_building', baseWeight: 25 },
        { templateId: 'skirmish_militia', baseWeight: 35 }
      );
      break;

    case 'Political':
      weights.push(
        { templateId: 'extract_vip', baseWeight: 40 },
        { templateId: 'protect_dignitary', baseWeight: 50 },
        { templateId: 'assassinate_target', baseWeight: 20 },
        { templateId: 'escort_witness', baseWeight: 35 },
        { templateId: 'investigate_conspiracy', baseWeight: 40 },
        { templateId: 'investigate_crime', baseWeight: 30 }
      );
      break;

    case 'Industrial':
      weights.push(
        { templateId: 'skirmish_gang', baseWeight: 40 },
        { templateId: 'protect_location', baseWeight: 35 },
        { templateId: 'rescue_hostage', baseWeight: 30 },
        { templateId: 'capture_building', baseWeight: 25 },
        { templateId: 'patrol_city', baseWeight: 30 }
      );
      break;

    case 'Educational':
      weights.push(
        { templateId: 'extract_data', baseWeight: 40 },
        { templateId: 'protect_dignitary', baseWeight: 30 },
        { templateId: 'investigate_conspiracy', baseWeight: 35 },
        { templateId: 'investigate_crime', baseWeight: 40 },
        { templateId: 'rescue_hostage', baseWeight: 25 }
      );
      break;

    case 'Temple':
      weights.push(
        { templateId: 'protect_location', baseWeight: 35 },
        { templateId: 'investigate_crime', baseWeight: 30 },
        { templateId: 'rescue_hostage', baseWeight: 25 },
        { templateId: 'patrol_city', baseWeight: 20 }
      );
      break;

    case 'Mining':
      weights.push(
        { templateId: 'protect_location', baseWeight: 40 },
        { templateId: 'rescue_hostage', baseWeight: 35 },
        { templateId: 'skirmish_gang', baseWeight: 30 },
        { templateId: 'patrol_city', baseWeight: 25 }
      );
      break;

    case 'Company':
      weights.push(
        { templateId: 'extract_data', baseWeight: 50 },
        { templateId: 'protect_dignitary', baseWeight: 35 },
        { templateId: 'investigate_conspiracy', baseWeight: 40 },
        { templateId: 'escort_witness', baseWeight: 30 }
      );
      break;

    case 'Resort':
      weights.push(
        { templateId: 'protect_dignitary', baseWeight: 45 },
        { templateId: 'escort_witness', baseWeight: 30 },
        { templateId: 'rescue_hostage', baseWeight: 35 },
        { templateId: 'patrol_city', baseWeight: 25 }
      );
      break;

    case 'Seaport':
      weights.push(
        { templateId: 'escort_convoy', baseWeight: 40 },
        { templateId: 'extract_vip', baseWeight: 30 },
        { templateId: 'skirmish_gang', baseWeight: 35 },
        { templateId: 'rescue_hostage', baseWeight: 30 },
        { templateId: 'capture_building', baseWeight: 25 }
      );
      break;
  }

  return weights;
}

/**
 * Calculate mission weights based on crime index
 */
function getMissionWeightsByCrime(crimeIndex: number): MissionWeight[] {
  const weights: MissionWeight[] = [];

  if (crimeIndex >= 80) {
    // Very High Crime - gang warfare, organized crime
    weights.push(
      { templateId: 'skirmish_gang', baseWeight: 60 },
      { templateId: 'rescue_hostage', baseWeight: 50 },
      { templateId: 'assassinate_warlord', baseWeight: 40 },
      { templateId: 'capture_building', baseWeight: 45 },
      { templateId: 'investigate_crime', baseWeight: 35 }
    );
  } else if (crimeIndex >= 60) {
    // High Crime - frequent crime missions
    weights.push(
      { templateId: 'skirmish_gang', baseWeight: 50 },
      { templateId: 'rescue_hostage', baseWeight: 40 },
      { templateId: 'escort_witness', baseWeight: 35 },
      { templateId: 'investigate_crime', baseWeight: 40 },
      { templateId: 'patrol_city', baseWeight: 35 }
    );
  } else if (crimeIndex >= 40) {
    // Moderate Crime - mixed missions
    weights.push(
      { templateId: 'skirmish_gang', baseWeight: 30 },
      { templateId: 'rescue_hostage', baseWeight: 25 },
      { templateId: 'investigate_crime', baseWeight: 35 },
      { templateId: 'patrol_city', baseWeight: 40 }
    );
  } else {
    // Low Crime - mostly patrol and investigation
    weights.push(
      { templateId: 'investigate_crime', baseWeight: 40 },
      { templateId: 'patrol_city', baseWeight: 50 },
      { templateId: 'protect_dignitary', baseWeight: 30 }
    );
  }

  return weights;
}

/**
 * Calculate mission weights based on country stats
 */
function getMissionWeightsByCountry(country: Country): MissionWeight[] {
  const weights: MissionWeight[] = [];
  const effects = calculateCountryEffects(country);

  // High terrorism = terrorist missions
  if (effects.threats.terroristMissionsAvailable) {
    weights.push(
      { templateId: 'skirmish_militia', baseWeight: 45 },
      { templateId: 'capture_outpost', baseWeight: 40 },
      { templateId: 'assassinate_warlord', baseWeight: 35 },
      { templateId: 'rescue_hostage', baseWeight: 50 }
    );
  }

  // High corruption + weak law = underworld missions
  if (country.governmentCorruption > 60 && country.lawEnforcement < 40) {
    weights.push(
      { templateId: 'extract_data', baseWeight: 40 },
      { templateId: 'assassinate_target', baseWeight: 30 },
      { templateId: 'investigate_conspiracy', baseWeight: 35 }
    );
  }

  // Strong military = military contracts
  if (country.militaryServices > 60) {
    weights.push(
      { templateId: 'escort_convoy', baseWeight: 40 },
      { templateId: 'protect_location', baseWeight: 35 },
      { templateId: 'capture_outpost', baseWeight: 30 }
    );
  }

  // High intelligence services = covert ops
  if (country.intelligenceServices > 60) {
    weights.push(
      { templateId: 'extract_vip', baseWeight: 40 },
      { templateId: 'extract_data', baseWeight: 45 },
      { templateId: 'assassinate_target', baseWeight: 35 }
    );
  }

  // Vigilante legal status affects mission sources
  if (effects.threats.vigilanteStatus === 'legal') {
    weights.push(
      { templateId: 'escort_witness', baseWeight: 40 },
      { templateId: 'protect_dignitary', baseWeight: 35 },
      { templateId: 'patrol_city', baseWeight: 45 }
    );
  }

  return weights;
}

/**
 * Combine and deduplicate mission weights
 */
function combineMissionWeights(...weightArrays: MissionWeight[][]): Map<string, number> {
  const combined = new Map<string, number>();

  for (const array of weightArrays) {
    for (const weight of array) {
      const current = combined.get(weight.templateId) ?? 0;
      combined.set(weight.templateId, current + weight.baseWeight);
    }
  }

  return combined;
}

/**
 * Select random missions based on weights
 */
function selectRandomMissions(
  weights: Map<string, number>,
  count: number
): string[] {
  if (weights.size === 0) return [];

  // Calculate total weight
  const totalWeight = Array.from(weights.values()).reduce((a, b) => a + b, 0);
  if (totalWeight === 0) return [];

  const selected: string[] = [];
  const available = new Map(weights);

  for (let i = 0; i < count && available.size > 0; i++) {
    // Recalculate total for remaining missions
    const currentTotal = Array.from(available.values()).reduce((a, b) => a + b, 0);
    let random = Math.random() * currentTotal;

    // Select based on weight
    for (const [templateId, weight] of available.entries()) {
      random -= weight;
      if (random <= 0) {
        selected.push(templateId);
        available.delete(templateId);  // Don't select same mission twice
        break;
      }
    }
  }

  return selected;
}

// =============================================================================
// MISSION DIFFICULTY CALCULATION
// =============================================================================

/**
 * Calculate difficulty modifier based on location
 */
function calculateDifficultyModifier(
  city: City,
  country: Country
): number {
  const countryEffects = calculateCountryEffects(country);

  let modifier = 0;

  // Crime increases difficulty
  if (city.crimeIndex >= 80) modifier += 2;
  else if (city.crimeIndex >= 60) modifier += 1;
  else if (city.crimeIndex <= 20) modifier -= 1;

  // Safety decreases difficulty
  if (city.safetyIndex >= 80) modifier -= 1;
  else if (city.safetyIndex <= 20) modifier += 1;

  // Military equipment affects difficulty
  if (countryEffects.military.equipmentTier === 4) modifier += 2;
  else if (countryEffects.military.equipmentTier === 3) modifier += 1;
  else if (countryEffects.military.equipmentTier === 1) modifier -= 1;

  // Enemy quality affects difficulty
  if (countryEffects.enemies.policeQuality === 'elite') modifier += 1;
  if (countryEffects.enemies.militaryQuality === 'elite') modifier += 1;
  if (countryEffects.enemies.gangQuality === 'syndicate') modifier += 2;

  // Population affects difficulty (more witnesses, more patrols)
  if (city.populationType === 'Mega City') modifier += 1;
  else if (city.populationType === 'Small Town') modifier -= 1;

  return modifier;
}

// =============================================================================
// REWARD CALCULATION
// =============================================================================

/**
 * Calculate reward multiplier based on country GDP
 */
function calculateRewardMultiplier(country: Country): number {
  const countryEffects = calculateCountryEffects(country);

  // Base multiplier from job pay
  let multiplier = countryEffects.economy.jobPayMultiplier;

  // Bonus for dangerous locations
  if (country.governmentCorruption > 70) multiplier *= 1.2;
  if (country.lawEnforcement < 30) multiplier *= 1.15;
  if (countryEffects.threats.terroristMissionsAvailable) multiplier *= 1.25;

  return multiplier;
}

// =============================================================================
// MISSION CUSTOMIZATION
// =============================================================================

interface MissionContext {
  city: City;
  country: Country;
  sector: string;
}

/**
 * Customize mission briefing based on location
 */
function customizeMissionBriefing(
  template: MissionTemplate,
  context: MissionContext
): string {
  const { city, country } = context;
  const countryEffects = calculateCountryEffects(country);
  const cityEffects = calculateCityEffects(city, countryEffects);

  let briefing = template.description;

  // Add location context
  briefing = `${briefing} Location: ${city.name}, ${country.name}.`;

  // Add threat context
  if (cityEffects.crime.gangPresence === 'controlled') {
    briefing += ' WARNING: Area controlled by organized crime.';
  } else if (cityEffects.crime.gangPresence === 'heavy') {
    briefing += ' Heavy gang presence expected.';
  }

  // Add police context
  if (cityEffects.crime.policePresence === 'martial_law') {
    briefing += ' ALERT: Martial law in effect.';
  } else if (cityEffects.crime.policePresence === 'heavy') {
    briefing += ' High police presence.';
  }

  // Add enemy quality warning
  if (countryEffects.enemies.militaryQuality === 'elite') {
    briefing += ' Expect elite military opposition.';
  }
  if (countryEffects.enemies.gangQuality === 'syndicate') {
    briefing += ' Syndicate-level criminal organization.';
  }

  // Add surveillance warning
  if (countryEffects.intelligence.surveillanceLevel > 70) {
    briefing += ' High surveillance - expect monitoring.';
  }

  return briefing;
}

/**
 * Generate target name based on mission and location
 */
function generateTargetName(
  template: MissionTemplate,
  context: MissionContext
): string | undefined {
  const { city } = context;

  // Only certain mission types have named targets
  if (template.type === 'assassinate') {
    return `${city.name} Crime Boss`;
  } else if (template.type === 'extract' && template.id === 'extract_vip') {
    return `${city.name} Official`;
  } else if (template.type === 'rescue') {
    return `Hostage`;
  }

  return undefined;
}

// =============================================================================
// MAIN GENERATION FUNCTIONS
// =============================================================================

/**
 * Generate missions for a specific sector
 * Returns 1-3 contextual missions based on cities in the sector
 */
export function generateMissionsForSector(
  sectorCode: string,
  country: Country
): GeneratedMission[] {
  // Get cities in this sector
  const cities = getCitiesBySector(sectorCode);

  if (cities.length === 0) {
    return [];  // No cities = no missions
  }

  // Pick primary city (highest population)
  const primaryCity = cities.reduce((prev, current) =>
    current.population > prev.population ? current : prev
  );

  // Calculate how many missions (1-3 based on city count and crime)
  const missionCount = Math.min(3,
    Math.max(1, Math.floor(cities.length / 2) + (primaryCity.crimeIndex > 60 ? 1 : 0))
  );

  // Combine all weight sources
  const cityTypeWeights = primaryCity.cityTypes
    .map(type => getMissionWeightsByCityType(type))
    .flat();

  const crimeWeights = getMissionWeightsByCrime(primaryCity.crimeIndex);
  const countryWeights = getMissionWeightsByCountry(country);

  const combinedWeights = combineMissionWeights(
    cityTypeWeights,
    crimeWeights,
    countryWeights
  );

  // Select random missions
  const selectedTemplateIds = selectRandomMissions(combinedWeights, missionCount);

  // Generate full missions
  const difficultyMod = calculateDifficultyModifier(primaryCity, country);
  const rewardMultiplier = calculateRewardMultiplier(country);

  const missions: GeneratedMission[] = [];

  for (const templateId of selectedTemplateIds) {
    const template = MISSION_TEMPLATES.find(t => t.id === templateId);
    if (!template) continue;

    const context: MissionContext = {
      city: primaryCity,
      country,
      sector: sectorCode,
    };

    // Generate base mission
    const baseMission = generateMission(
      template,
      sectorCode,
      primaryCity.name,
      difficultyMod
    );

    // Apply reward multiplier
    baseMission.reward = Math.round(baseMission.reward * rewardMultiplier);
    baseMission.fameReward = Math.round(baseMission.fameReward * rewardMultiplier);

    // Customize
    baseMission.briefing = customizeMissionBriefing(template, context);
    baseMission.targetName = generateTargetName(template, context);

    missions.push(baseMission);
  }

  return missions;
}

/**
 * Generate missions for all sectors in a country
 */
export function generateMissionsForCountry(country: Country): Map<string, GeneratedMission[]> {
  const missionsBySector = new Map<string, GeneratedMission[]>();

  // Get all unique sectors (A1-T10)
  const sectors = new Set<string>();
  for (let row = 0; row < 20; row++) {
    for (let col = 0; col < 10; col++) {
      const sectorCode = `${String.fromCharCode(65 + row)}${col + 1}`;
      sectors.add(sectorCode);
    }
  }

  // Generate for each sector
  for (const sector of sectors) {
    const missions = generateMissionsForSector(sector, country);
    if (missions.length > 0) {
      missionsBySector.set(sector, missions);
    }
  }

  return missionsBySector;
}

/**
 * Refresh missions for a sector (called when time passes or missions expire)
 */
export function refreshSectorMissions(
  sectorCode: string,
  country: Country,
  excludeTypes?: MissionType[]
): GeneratedMission[] {
  let missions = generateMissionsForSector(sectorCode, country);

  // Filter out excluded types
  if (excludeTypes && excludeTypes.length > 0) {
    missions = missions.filter(m => !excludeTypes.includes(m.template.type));
  }

  return missions;
}

/**
 * Get mission recommendations for player's current squad
 */
export interface MissionRecommendation {
  mission: GeneratedMission;
  suitabilityScore: number;  // 0-100
  warnings: string[];
  advantages: string[];
}

export function getRecommendedMissions(
  availableMissions: GeneratedMission[],
  squadThreatLevel: number,
  squadSize: number
): MissionRecommendation[] {
  const recommendations: MissionRecommendation[] = [];

  for (const mission of availableMissions) {
    const warnings: string[] = [];
    const advantages: string[] = [];
    let suitabilityScore = 50;  // Start at neutral

    // Check squad size
    if (squadSize < mission.template.minSquadSize) {
      warnings.push(`Need at least ${mission.template.minSquadSize} squad members`);
      suitabilityScore -= 30;
    } else if (squadSize > mission.template.maxSquadSize) {
      warnings.push(`Max ${mission.template.maxSquadSize} squad members allowed`);
      suitabilityScore -= 20;
    } else {
      suitabilityScore += 10;
    }

    // Check threat level
    const threatDiff = squadThreatLevel - mission.template.recommendedThreatLevel;
    if (threatDiff >= 2) {
      advantages.push('Your squad is overpowered for this mission');
      suitabilityScore += 20;
    } else if (threatDiff >= 0) {
      advantages.push('Well-matched for your squad');
      suitabilityScore += 10;
    } else if (threatDiff >= -1) {
      warnings.push('Challenging for your current squad');
      suitabilityScore -= 10;
    } else {
      warnings.push('DANGEROUS: Squad may be underpowered');
      suitabilityScore -= 30;
    }

    // Check danger level
    if (mission.dangerLevel >= 8) {
      warnings.push('EXTREME danger - high injury risk');
      suitabilityScore -= 15;
    } else if (mission.dangerLevel <= 3) {
      advantages.push('Low danger mission');
      suitabilityScore += 10;
    }

    // Check time limit
    if (mission.timeLimit) {
      warnings.push(`Time limit: ${mission.timeLimit} minutes`);
      suitabilityScore -= 5;
    }

    // Check stealth option
    if (mission.template.stealthOption) {
      advantages.push('Stealth approach available');
      suitabilityScore += 5;
    }

    recommendations.push({
      mission,
      suitabilityScore: Math.max(0, Math.min(100, suitabilityScore)),
      warnings,
      advantages,
    });
  }

  // Sort by suitability (best first)
  recommendations.sort((a, b) => b.suitabilityScore - a.suitabilityScore);

  return recommendations;
}
