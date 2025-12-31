/**
 * Character Life Cycle System
 *
 * Handles:
 * - City familiarity (per character, 0-100)
 * - Autonomous activities based on personality
 * - Activity desires driven by personality traits
 * - Auto vs request thresholds for activities
 */

import { PersonalityTraits } from './personalitySystem';

// =============================================================================
// CITY TYPES
// =============================================================================

export type CityType =
  | 'Industrial'
  | 'Political'
  | 'Military'
  | 'Educational'
  | 'Temple'
  | 'Mining'
  | 'Company'
  | 'Resort'
  | 'Seaport';

// =============================================================================
// CITY FAMILIARITY SYSTEM
// =============================================================================

export interface CityFamiliarity {
  cityId: string;          // Unique city identifier
  cityName: string;        // Human-readable name
  level: number;           // 0-100 familiarity
  lastVisit: number;       // Game day of last visit
  totalDaysSpent: number;  // Total days in this city
  missionsCompleted: number;
  contactsMade: number;
  isHometown: boolean;     // Bonus morale when here
}

export type FamiliarityTier = 'stranger' | 'visitor' | 'familiar' | 'local' | 'native';

export const FAMILIARITY_TIERS: Record<FamiliarityTier, {
  minLevel: number;
  maxLevel: number;
  priceDiscount: number;  // % off purchases
  label: string;
  description: string;
}> = {
  stranger: {
    minLevel: 0,
    maxLevel: 20,
    priceDiscount: 0,
    label: 'Stranger',
    description: 'No bonuses, full prices, no contacts',
  },
  visitor: {
    minLevel: 21,
    maxLevel: 40,
    priceDiscount: 5,
    label: 'Visitor',
    description: 'Basic navigation, cheap lodging available',
  },
  familiar: {
    minLevel: 41,
    maxLevel: 60,
    priceDiscount: 10,
    label: 'Familiar',
    description: 'Know shortcuts, some contacts',
  },
  local: {
    minLevel: 61,
    maxLevel: 80,
    priceDiscount: 15,
    label: 'Local',
    description: 'Underground access, trusted contacts',
  },
  native: {
    minLevel: 81,
    maxLevel: 100,
    priceDiscount: 20,
    label: 'Native',
    description: 'Safe houses, insider networks, home base bonus',
  },
};

/**
 * Get familiarity tier from level
 */
export function getFamiliarityTier(level: number): FamiliarityTier {
  if (level <= 20) return 'stranger';
  if (level <= 40) return 'visitor';
  if (level <= 60) return 'familiar';
  if (level <= 80) return 'local';
  return 'native';
}

/**
 * Get tier info from level
 */
export function getFamiliarityTierInfo(level: number) {
  return FAMILIARITY_TIERS[getFamiliarityTier(level)];
}

/**
 * Get price discount for familiarity level
 */
export function getFamiliarityDiscount(level: number): number {
  return getFamiliarityTierInfo(level).priceDiscount;
}

// Familiarity change amounts
export const FAMILIARITY_GAINS = {
  daySpent: 1,              // +1 per day in city
  missionSuccess: 3,        // +3 per successful mission
  missionFailure: 1,        // +1 even on failure (learned something)
  contactEstablished: 5,    // +5 for making a contact
  safeHousePurchased: 10,   // +10 for buying property
  studySession: 2,          // +2 per study session
  socialActivity: 1,        // +1 for social activities
  adventureActivity: 2,     // +2 for exploration/adventure
};

// Familiarity decay (for cities not visited in a while)
export const FAMILIARITY_DECAY = {
  daysBeforeDecay: 30,      // Start decaying after 30 days away
  decayPerWeek: 2,          // -2 per week away after threshold
  minimumLevel: 10,         // Never decay below 10 (you remember the basics)
};

/**
 * Familiarity unlock requirements
 */
export const FAMILIARITY_UNLOCKS: Record<string, number> = {
  cheapLodging: 20,         // Can find budget accommodation
  backAlleys: 40,           // Know escape routes
  localsOnly: 60,           // Access to hidden services
  safeHouse: 80,            // Can establish a safe house
  homeBase: 100,            // +5 morale bonus when here
};

/**
 * Check if character can access an unlock
 */
export function hasUnlock(familiarityLevel: number, unlock: keyof typeof FAMILIARITY_UNLOCKS): boolean {
  return familiarityLevel >= FAMILIARITY_UNLOCKS[unlock];
}

/**
 * Calculate familiarity decay for time away
 */
export function calculateFamiliarityDecay(familiarity: CityFamiliarity, currentDay: number): number {
  const daysAway = currentDay - familiarity.lastVisit;

  if (daysAway <= FAMILIARITY_DECAY.daysBeforeDecay) {
    return 0; // No decay yet
  }

  const weeksOverThreshold = Math.floor((daysAway - FAMILIARITY_DECAY.daysBeforeDecay) / 7);
  const decay = weeksOverThreshold * FAMILIARITY_DECAY.decayPerWeek;

  // Don't decay below minimum
  const newLevel = Math.max(FAMILIARITY_DECAY.minimumLevel, familiarity.level - decay);
  return familiarity.level - newLevel;
}

/**
 * Create initial familiarity for a new city
 */
export function createCityFamiliarity(cityId: string, cityName: string, currentDay: number): CityFamiliarity {
  return {
    cityId,
    cityName,
    level: 0,
    lastVisit: currentDay,
    totalDaysSpent: 0,
    missionsCompleted: 0,
    contactsMade: 0,
    isHometown: false,
  };
}

/**
 * Update familiarity when visiting a city
 */
export function updateFamiliarityForVisit(
  familiarity: CityFamiliarity,
  currentDay: number,
  reason: keyof typeof FAMILIARITY_GAINS
): CityFamiliarity {
  const gain = FAMILIARITY_GAINS[reason];

  return {
    ...familiarity,
    level: Math.min(100, familiarity.level + gain),
    lastVisit: currentDay,
    totalDaysSpent: reason === 'daySpent' ? familiarity.totalDaysSpent + 1 : familiarity.totalDaysSpent,
    missionsCompleted: reason === 'missionSuccess' ? familiarity.missionsCompleted + 1 : familiarity.missionsCompleted,
  };
}

// =============================================================================
// ACTIVITY SYSTEM
// =============================================================================

export type ActivityCategory = 'work' | 'social' | 'recovery' | 'adventure' | 'growth';

export interface ActivityDesires {
  work: number;      // 0-10
  social: number;    // 0-10
  recovery: number;  // 0-10
  adventure: number; // 0-10
  growth: number;    // 0-10
}

export interface Activity {
  id: string;
  name: string;
  category: ActivityCategory;
  description: string;

  // Requirements
  cityTypes: CityType[];     // Which city types offer this
  minFamiliarity?: number;   // Minimum familiarity needed

  // Costs
  cost: number;              // Dollar cost
  hours: number;             // Time required

  // Effects
  moraleChange: number;      // Morale modifier
  familiarityGain: number;   // Familiarity bonus

  // Risk (for adventure activities)
  riskLevel?: 'none' | 'low' | 'medium' | 'high';
  failureChance?: number;    // 0-100

  // Special flags
  requiresApproval: boolean; // Does player need to approve?
}

// Auto vs Request thresholds
export const AUTO_ACTIVITY_THRESHOLD: Record<ActivityCategory, number> = {
  work: Infinity,      // Always auto (day job, guard duty)
  social: 100,         // Auto up to $100
  recovery: 500,       // Auto up to $500 (minor medical)
  adventure: 0,        // NEVER auto (always risky)
  growth: 200,         // Auto up to $200 (basic training)
};

/**
 * Should this activity auto-execute or request approval?
 */
export function shouldAutoExecute(activity: Activity): boolean {
  const threshold = AUTO_ACTIVITY_THRESHOLD[activity.category];
  return activity.cost <= threshold && activity.riskLevel !== 'high';
}

// =============================================================================
// ACTIVITY DEFINITIONS
// =============================================================================

export const ACTIVITIES: Activity[] = [
  // WORK activities (always auto)
  {
    id: 'work_day_job',
    name: 'Day Job',
    category: 'work',
    description: 'Work your regular job',
    cityTypes: ['Industrial', 'Political', 'Military', 'Educational', 'Company', 'Seaport'],
    cost: 0,
    hours: 8,
    moraleChange: 0,
    familiarityGain: 1,
    requiresApproval: false,
  },
  {
    id: 'work_guard_duty',
    name: 'Guard Duty',
    category: 'work',
    description: 'Protect the base or a location',
    cityTypes: ['Military', 'Industrial', 'Company'],
    cost: 0,
    hours: 8,
    moraleChange: -1, // Boring
    familiarityGain: 0,
    requiresApproval: false,
  },
  {
    id: 'work_maintenance',
    name: 'Equipment Maintenance',
    category: 'work',
    description: 'Maintain and repair gear',
    cityTypes: ['Military', 'Industrial', 'Company'],
    cost: 50,
    hours: 4,
    moraleChange: 1,
    familiarityGain: 0,
    requiresApproval: false,
  },

  // SOCIAL activities
  {
    id: 'social_bar',
    name: 'Visit Local Bar',
    category: 'social',
    description: 'Hang out at a local watering hole',
    cityTypes: ['Industrial', 'Political', 'Military', 'Seaport', 'Mining', 'Resort'],
    cost: 30,
    hours: 3,
    moraleChange: 2,
    familiarityGain: 1,
    requiresApproval: false,
  },
  {
    id: 'social_cafe',
    name: 'Cafe & People Watching',
    category: 'social',
    description: 'Relax at a local cafe',
    cityTypes: ['Political', 'Educational', 'Resort', 'Company'],
    cost: 15,
    hours: 2,
    moraleChange: 1,
    familiarityGain: 1,
    requiresApproval: false,
  },
  {
    id: 'social_party',
    name: 'Attend Party',
    category: 'social',
    description: 'Go to a social event',
    cityTypes: ['Resort', 'Political', 'Company'],
    cost: 150,
    hours: 5,
    moraleChange: 4,
    familiarityGain: 2,
    requiresApproval: true, // Over $100
  },
  {
    id: 'social_networking',
    name: 'Professional Networking',
    category: 'social',
    description: 'Attend a networking event',
    cityTypes: ['Political', 'Company', 'Educational'],
    cost: 75,
    hours: 4,
    moraleChange: 1,
    familiarityGain: 2,
    requiresApproval: false,
  },

  // RECOVERY activities
  {
    id: 'recovery_rest',
    name: 'Rest & Recuperate',
    category: 'recovery',
    description: 'Take it easy for the day',
    cityTypes: ['Industrial', 'Political', 'Military', 'Educational', 'Temple', 'Mining', 'Company', 'Resort', 'Seaport'],
    cost: 0,
    hours: 8,
    moraleChange: 2,
    familiarityGain: 0,
    requiresApproval: false,
  },
  {
    id: 'recovery_spa',
    name: 'Spa Day',
    category: 'recovery',
    description: 'Pamper yourself at a spa',
    cityTypes: ['Resort', 'Company'],
    cost: 200,
    hours: 4,
    moraleChange: 5,
    familiarityGain: 1,
    requiresApproval: false,
  },
  {
    id: 'recovery_therapy',
    name: 'Therapy Session',
    category: 'recovery',
    description: 'Mental health care',
    cityTypes: ['Political', 'Educational', 'Company'],
    cost: 150,
    hours: 2,
    moraleChange: 3,
    familiarityGain: 0,
    requiresApproval: false,
  },
  {
    id: 'recovery_meditation',
    name: 'Meditation Retreat',
    category: 'recovery',
    description: 'Clear your mind at a temple',
    cityTypes: ['Temple'],
    cost: 50,
    hours: 6,
    moraleChange: 4,
    familiarityGain: 1,
    requiresApproval: false,
  },
  {
    id: 'recovery_surgery',
    name: 'Medical Procedure',
    category: 'recovery',
    description: 'Undergo surgery or major treatment',
    cityTypes: ['Political', 'Educational', 'Military'],
    cost: 2000,
    hours: 24,
    moraleChange: -2, // Painful but necessary
    familiarityGain: 0,
    requiresApproval: true, // Expensive
  },

  // ADVENTURE activities (always require approval)
  {
    id: 'adventure_explore',
    name: 'Explore the City',
    category: 'adventure',
    description: 'Wander and discover new places',
    cityTypes: ['Industrial', 'Political', 'Military', 'Educational', 'Temple', 'Mining', 'Company', 'Resort', 'Seaport'],
    cost: 20,
    hours: 4,
    moraleChange: 2,
    familiarityGain: 3,
    riskLevel: 'low',
    failureChance: 10,
    requiresApproval: true,
  },
  {
    id: 'adventure_nightlife',
    name: 'Hit the Nightlife',
    category: 'adventure',
    description: 'Experience the city after dark',
    cityTypes: ['Political', 'Resort', 'Seaport'],
    cost: 100,
    hours: 6,
    moraleChange: 4,
    familiarityGain: 2,
    riskLevel: 'medium',
    failureChance: 20,
    requiresApproval: true,
  },
  {
    id: 'adventure_gambling',
    name: 'Gambling',
    category: 'adventure',
    description: 'Try your luck at games of chance',
    cityTypes: ['Resort', 'Seaport', 'Mining'],
    cost: 200,
    hours: 4,
    moraleChange: 3, // Win or lose, it's exciting
    familiarityGain: 1,
    riskLevel: 'high',
    failureChance: 50, // 50% chance to lose money
    requiresApproval: true,
  },
  {
    id: 'adventure_underground',
    name: 'Explore Underground',
    category: 'adventure',
    description: 'Check out the seedy underbelly',
    cityTypes: ['Industrial', 'Seaport', 'Mining'],
    minFamiliarity: 40,
    cost: 50,
    hours: 4,
    moraleChange: 2,
    familiarityGain: 4,
    riskLevel: 'high',
    failureChance: 30,
    requiresApproval: true,
  },

  // GROWTH activities
  {
    id: 'growth_read',
    name: 'Reading & Self-Study',
    category: 'growth',
    description: 'Learn from books and materials',
    cityTypes: ['Educational', 'Political', 'Temple', 'Company'],
    cost: 20,
    hours: 4,
    moraleChange: 1,
    familiarityGain: 0,
    requiresApproval: false,
  },
  {
    id: 'growth_library',
    name: 'Library Research',
    category: 'growth',
    description: 'Study at the local library',
    cityTypes: ['Educational', 'Political'],
    cost: 0,
    hours: 4,
    moraleChange: 1,
    familiarityGain: 1,
    requiresApproval: false,
  },
  {
    id: 'growth_practice',
    name: 'Combat Practice',
    category: 'growth',
    description: 'Train combat skills',
    cityTypes: ['Military', 'Temple'],
    cost: 50,
    hours: 4,
    moraleChange: 2,
    familiarityGain: 1,
    requiresApproval: false,
  },
  {
    id: 'growth_class',
    name: 'Attend Class',
    category: 'growth',
    description: 'Take an educational course',
    cityTypes: ['Educational', 'Company'],
    cost: 300,
    hours: 6,
    moraleChange: 1,
    familiarityGain: 2,
    requiresApproval: true, // Expensive
  },
  {
    id: 'growth_martial_arts',
    name: 'Martial Arts Training',
    category: 'growth',
    description: 'Train with martial arts masters',
    cityTypes: ['Temple'],
    cost: 100,
    hours: 6,
    moraleChange: 3,
    familiarityGain: 2,
    requiresApproval: false,
  },
  {
    id: 'growth_meditation_deep',
    name: 'Deep Meditation',
    category: 'growth',
    description: 'Extended spiritual practice',
    cityTypes: ['Temple'],
    cost: 20,
    hours: 8,
    moraleChange: 2,
    familiarityGain: 1,
    requiresApproval: false,
  },
];

/**
 * Get activities available in a city type
 */
export function getAvailableActivities(cityTypes: CityType[]): Activity[] {
  return ACTIVITIES.filter(a =>
    a.cityTypes.some(ct => cityTypes.includes(ct))
  );
}

/**
 * Get activities by category for a city
 */
export function getActivitiesByCategory(
  cityTypes: CityType[],
  category: ActivityCategory
): Activity[] {
  return getAvailableActivities(cityTypes).filter(a => a.category === category);
}

// =============================================================================
// ACTIVITY DESIRES (Personality-Driven)
// =============================================================================

/**
 * Calculate what activities a character WANTS to do based on personality
 */
export function calculateActivityDesires(
  personality: PersonalityTraits,
  currentHealth: number = 100,  // 0-100
  currentMorale: number = 50    // 0-100
): ActivityDesires {
  // Work: Discipline + Initiative, inversely affected by impatience
  const work = Math.min(10,
    (personality.discipline * 0.5) +
    (personality.initiative * 0.3) +
    ((10 - personality.impatience) * 0.2)
  );

  // Social: Sociability, inversely affected by volatility
  const social = Math.min(10,
    (personality.sociability * 0.7) +
    ((10 - personality.volatility) * 0.3)
  );

  // Recovery: Harm avoidance + inverse risk tolerance + health deficit
  const healthDeficit = (100 - currentHealth) / 20; // 0-5 bonus based on health
  const recovery = Math.min(10,
    (personality.harmAvoidance * 0.3) +
    ((10 - personality.riskTolerance) * 0.2) +
    healthDeficit +
    (currentMorale < 30 ? 2 : 0) // Boost if morale is low
  );

  // Adventure: Risk tolerance + impatience, inversely affected by discipline
  const adventure = Math.min(10,
    (personality.riskTolerance * 0.5) +
    (personality.impatience * 0.3) +
    ((10 - personality.discipline) * 0.2)
  );

  // Growth: Inverse impatience + initiative + discipline
  const growth = Math.min(10,
    ((10 - personality.impatience) * 0.4) +
    (personality.initiative * 0.3) +
    (personality.discipline * 0.3)
  );

  return {
    work: Math.round(work * 10) / 10,
    social: Math.round(social * 10) / 10,
    recovery: Math.round(recovery * 10) / 10,
    adventure: Math.round(adventure * 10) / 10,
    growth: Math.round(growth * 10) / 10,
  };
}

/**
 * Get the highest desire category
 */
export function getHighestDesire(desires: ActivityDesires): ActivityCategory {
  const entries = Object.entries(desires) as [ActivityCategory, number][];
  entries.sort((a, b) => b[1] - a[1]);
  return entries[0][0];
}

/**
 * Get ranked desires (highest to lowest)
 */
export function getRankedDesires(desires: ActivityDesires): Array<{ category: ActivityCategory; level: number }> {
  const entries = Object.entries(desires) as [ActivityCategory, number][];
  entries.sort((a, b) => b[1] - a[1]);
  return entries.map(([category, level]) => ({ category, level }));
}

// =============================================================================
// CITY TYPE → ACTIVITY AVAILABILITY
// =============================================================================

// How well each city type supports each activity category (0-3 stars)
export const CITY_ACTIVITY_SUPPORT: Record<CityType, Record<ActivityCategory, number>> = {
  Military:    { work: 3, social: 1, recovery: 2, adventure: 2, growth: 2 },
  Resort:      { work: 1, social: 3, recovery: 3, adventure: 3, growth: 1 },
  Educational: { work: 2, social: 2, recovery: 1, adventure: 1, growth: 3 },
  Temple:      { work: 1, social: 1, recovery: 3, adventure: 1, growth: 3 },
  Industrial:  { work: 3, social: 1, recovery: 1, adventure: 2, growth: 2 },
  Political:   { work: 3, social: 3, recovery: 1, adventure: 1, growth: 2 },
  Seaport:     { work: 2, social: 2, recovery: 1, adventure: 3, growth: 1 },
  Mining:      { work: 3, social: 1, recovery: 1, adventure: 2, growth: 1 },
  Company:     { work: 3, social: 2, recovery: 1, adventure: 1, growth: 2 },
};

/**
 * Get activity support level for a city (using its types)
 */
export function getCityActivitySupport(cityTypes: CityType[]): Record<ActivityCategory, number> {
  const support: Record<ActivityCategory, number> = {
    work: 0, social: 0, recovery: 0, adventure: 0, growth: 0
  };

  // Take the MAX support from all city types
  for (const cityType of cityTypes) {
    const typeSupport = CITY_ACTIVITY_SUPPORT[cityType];
    for (const category of Object.keys(support) as ActivityCategory[]) {
      support[category] = Math.max(support[category], typeSupport[category]);
    }
  }

  return support;
}

/**
 * Can the city satisfy a desire category?
 */
export function canCitySatisfyDesire(cityTypes: CityType[], category: ActivityCategory): boolean {
  const support = getCityActivitySupport(cityTypes);
  return support[category] >= 2; // Need at least 2 stars
}

// =============================================================================
// PERSONALITY → CITY TYPE PREFERENCES
// =============================================================================

interface CityPreference {
  attracted: CityType[];
  repelled: CityType[];
}

/**
 * Calculate city type preferences based on personality
 */
export function getCityPreferences(personality: PersonalityTraits): CityPreference {
  const attracted: CityType[] = [];
  const repelled: CityType[] = [];

  // High Sociability (8+) → Loves social cities
  if (personality.sociability >= 8) {
    attracted.push('Resort', 'Political');
    repelled.push('Mining', 'Military');
  } else if (personality.sociability <= 3) {
    attracted.push('Mining', 'Industrial');
    repelled.push('Resort', 'Political');
  }

  // High Risk Tolerance (8+) → Loves action
  if (personality.riskTolerance >= 8) {
    attracted.push('Military', 'Seaport');
    if (!repelled.includes('Educational')) repelled.push('Educational');
    if (!repelled.includes('Temple')) repelled.push('Temple');
  } else if (personality.riskTolerance <= 3) {
    attracted.push('Educational', 'Temple');
    if (!repelled.includes('Military')) repelled.push('Military');
    if (!repelled.includes('Seaport')) repelled.push('Seaport');
  }

  // High Discipline (8+) → Loves structure
  if (personality.discipline >= 8) {
    if (!attracted.includes('Military')) attracted.push('Military');
    if (!attracted.includes('Political')) attracted.push('Political');
    if (!repelled.includes('Resort')) repelled.push('Resort');
  } else if (personality.discipline <= 3) {
    if (!attracted.includes('Resort')) attracted.push('Resort');
    if (!attracted.includes('Seaport')) attracted.push('Seaport');
    if (!repelled.includes('Military')) repelled.push('Military');
  }

  // High Initiative (8+) → Loves opportunity
  if (personality.initiative >= 8) {
    if (!attracted.includes('Company')) attracted.push('Company');
    if (!attracted.includes('Industrial')) attracted.push('Industrial');
  }

  // High Harm Avoidance (8+) → Loves peaceful cities
  if (personality.harmAvoidance >= 8) {
    if (!attracted.includes('Temple')) attracted.push('Temple');
    if (!attracted.includes('Educational')) attracted.push('Educational');
    if (!repelled.includes('Military')) repelled.push('Military');
  }

  return {
    attracted: [...new Set(attracted)], // Remove duplicates
    repelled: [...new Set(repelled)],
  };
}

/**
 * Calculate morale modifier for being in a city type
 */
export function getCityTypeMoraleModifier(
  personality: PersonalityTraits,
  cityTypes: CityType[]
): number {
  const prefs = getCityPreferences(personality);

  // Check for attraction match
  const hasAttracted = prefs.attracted.some(ct => cityTypes.includes(ct));
  const hasRepelled = prefs.repelled.some(ct => cityTypes.includes(ct));

  if (hasAttracted && !hasRepelled) return 3;   // Love it here
  if (hasAttracted && hasRepelled) return 0;    // Mixed feelings
  if (!hasAttracted && hasRepelled) return -3;  // Hate it here
  return 0; // Neutral
}

// =============================================================================
// ACTIVITY REQUEST SYSTEM
// =============================================================================

export interface ActivityRequest {
  id: string;
  characterId: string;
  characterName: string;
  activity: Activity;
  cityId: string;
  cityName: string;
  requestedDay: number;
  reason: string;            // "High adventure desire", "Low morale recovery"
  status: 'pending' | 'approved' | 'denied';
}

/**
 * Create an activity request
 */
export function createActivityRequest(
  characterId: string,
  characterName: string,
  activity: Activity,
  cityId: string,
  cityName: string,
  currentDay: number,
  desires: ActivityDesires
): ActivityRequest {
  const desireLevel = desires[activity.category];
  const reason = desireLevel >= 7
    ? `Strong ${activity.category} desire (${desireLevel.toFixed(1)})`
    : `${activity.category.charAt(0).toUpperCase() + activity.category.slice(1)} need`;

  return {
    id: `req_${characterId}_${activity.id}_${currentDay}`,
    characterId,
    characterName,
    activity,
    cityId,
    cityName,
    requestedDay: currentDay,
    reason,
    status: 'pending',
  };
}

// =============================================================================
// ACTIVITY RESULT
// =============================================================================

export interface ActivityResult {
  activity: Activity;
  characterId: string;
  success: boolean;
  autoExecuted: boolean;

  // Effects applied
  moraleChange: number;
  familiarityGain: number;
  moneySpent: number;
  hoursUsed: number;

  // For risky activities
  riskOutcome?: 'safe' | 'minor_trouble' | 'major_trouble';

  // Log message
  description: string;
}

/**
 * Execute an activity and calculate results
 */
export function executeActivity(
  activity: Activity,
  characterId: string,
  characterName: string,
  autoExecuted: boolean
): ActivityResult {
  let success = true;
  let riskOutcome: 'safe' | 'minor_trouble' | 'major_trouble' = 'safe';
  let moraleChange = activity.moraleChange;

  // Check for failure on risky activities
  if (activity.failureChance && activity.failureChance > 0) {
    const roll = Math.random() * 100;
    if (roll < activity.failureChance) {
      success = false;
      moraleChange = Math.floor(moraleChange / 2); // Half morale on failure

      if (activity.riskLevel === 'high') {
        riskOutcome = roll < activity.failureChance / 2 ? 'major_trouble' : 'minor_trouble';
      } else {
        riskOutcome = 'minor_trouble';
      }
    }
  }

  const description = success
    ? `${characterName} enjoyed ${activity.name.toLowerCase()}`
    : `${characterName} had trouble during ${activity.name.toLowerCase()}`;

  return {
    activity,
    characterId,
    success,
    autoExecuted,
    moraleChange,
    familiarityGain: success ? activity.familiarityGain : 1, // Always get at least 1 for trying
    moneySpent: activity.cost,
    hoursUsed: activity.hours,
    riskOutcome,
    description,
  };
}

// =============================================================================
// DAILY PROCESSING
// =============================================================================

export interface DailyActivityReport {
  characterId: string;
  characterName: string;

  // What happened
  autoActivities: ActivityResult[];
  pendingRequests: ActivityRequest[];

  // Summary
  totalMoraleChange: number;
  totalFamiliarityGain: number;
  totalMoneySpent: number;

  // City match
  cityMoraleModifier: number;
  message: string;
}

/**
 * Process a character's idle day in a city
 */
export function processIdleDay(
  characterId: string,
  characterName: string,
  personality: PersonalityTraits,
  cityTypes: CityType[],
  cityId: string,
  cityName: string,
  currentDay: number,
  currentHealth: number = 100,
  currentMorale: number = 50,
  availableBudget: number = 1000
): DailyActivityReport {
  const desires = calculateActivityDesires(personality, currentHealth, currentMorale);
  const rankedDesires = getRankedDesires(desires);
  const citySupport = getCityActivitySupport(cityTypes);

  const autoActivities: ActivityResult[] = [];
  const pendingRequests: ActivityRequest[] = [];
  let hoursUsed = 0;
  const maxHours = 16; // Can't do more than 16 hours of activities
  let moneySpent = 0;

  // Try to satisfy desires in order
  for (const { category, level } of rankedDesires) {
    if (hoursUsed >= maxHours) break;
    if (level < 3) continue; // Skip low desires

    // Get available activities for this category
    const categoryActivities = getActivitiesByCategory(cityTypes, category);
    if (categoryActivities.length === 0) continue;

    // Pick a random affordable activity
    const affordable = categoryActivities.filter(a =>
      a.cost <= availableBudget - moneySpent &&
      a.hours <= maxHours - hoursUsed
    );

    if (affordable.length === 0) continue;

    const activity = affordable[Math.floor(Math.random() * affordable.length)];

    if (shouldAutoExecute(activity)) {
      // Auto-execute
      const result = executeActivity(activity, characterId, characterName, true);
      autoActivities.push(result);
      hoursUsed += result.hoursUsed;
      moneySpent += result.moneySpent;
    } else {
      // Request approval
      const request = createActivityRequest(
        characterId,
        characterName,
        activity,
        cityId,
        cityName,
        currentDay,
        desires
      );
      pendingRequests.push(request);
    }
  }

  // Calculate totals
  const totalMoraleChange = autoActivities.reduce((sum, a) => sum + a.moraleChange, 0);
  const totalFamiliarityGain = autoActivities.reduce((sum, a) => sum + a.familiarityGain, 0) + 1; // +1 for just being there
  const totalMoneySpent = autoActivities.reduce((sum, a) => sum + a.moneySpent, 0);

  // City preference modifier
  const cityMoraleModifier = getCityTypeMoraleModifier(personality, cityTypes);

  // Generate summary message
  let message = '';
  if (autoActivities.length > 0) {
    const activityNames = autoActivities.map(a => a.activity.name).join(', ');
    message = `${characterName}: ${activityNames}`;
    if (cityMoraleModifier !== 0) {
      message += ` (${cityMoraleModifier > 0 ? 'loves' : 'dislikes'} this city type)`;
    }
  } else if (pendingRequests.length > 0) {
    message = `${characterName} is waiting for activity approval`;
  } else {
    message = `${characterName} rested`;
  }

  return {
    characterId,
    characterName,
    autoActivities,
    pendingRequests,
    totalMoraleChange: totalMoraleChange + cityMoraleModifier,
    totalFamiliarityGain,
    totalMoneySpent,
    cityMoraleModifier,
    message,
  };
}

// =============================================================================
// EXPORTS SUMMARY
// =============================================================================

export const CharacterLifeCycle = {
  // Familiarity
  getFamiliarityTier,
  getFamiliarityDiscount,
  hasUnlock,
  calculateFamiliarityDecay,
  createCityFamiliarity,
  updateFamiliarityForVisit,

  // Activities
  calculateActivityDesires,
  getHighestDesire,
  getRankedDesires,
  getAvailableActivities,
  getActivitiesByCategory,
  getCityActivitySupport,
  canCitySatisfyDesire,
  shouldAutoExecute,
  executeActivity,

  // City Preferences
  getCityPreferences,
  getCityTypeMoraleModifier,

  // Requests
  createActivityRequest,

  // Daily Processing
  processIdleDay,

  // Constants
  FAMILIARITY_GAINS,
  FAMILIARITY_UNLOCKS,
  AUTO_ACTIVITY_THRESHOLD,
  CITY_ACTIVITY_SUPPORT,
  ACTIVITIES,
};
