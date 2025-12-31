/**
 * City Actions System
 * Maps city types to available player actions
 *
 * City types: Industrial, Political, Military, Educational, Temple, Mining, Company, Resort, Seaport
 *
 * Each city can have up to 4 types, unlocking different actions for players.
 */

import { City } from './cities';
import { Country } from './countries';

// ============================================================================
// ACTION CATEGORIES
// ============================================================================

export type ActionCategory =
  | 'governance'     // Political actions
  | 'training'       // Skill improvement
  | 'recruitment'    // Hiring personnel
  | 'equipment'      // Buying/manufacturing gear
  | 'logistics'      // Travel, smuggling
  | 'stealth'        // Hiding, cover identities
  | 'healing'        // Recovery, medical
  | 'intel'          // Information gathering
  | 'criminal';      // Illegal activities

// ============================================================================
// CITY ACTION DEFINITION
// ============================================================================

export interface CityAction {
  id: string;
  name: string;
  description: string;
  emoji: string;
  category: ActionCategory;
  cityTypes: string[];          // Which city types enable this action
  duration: number;             // Hours to complete
  baseCost: number;             // Base cost in dollars
  fameRequired?: number;        // Minimum fame to attempt
  skillCheck?: {                // Optional skill requirement
    skill: string;
    difficulty: number;
  };
  countryModifiers?: {          // Country stats that affect cost/success
    stat: string;
    effect: 'cost_reduction' | 'cost_increase' | 'success_bonus' | 'success_penalty' | 'unlock' | 'lock';
    threshold?: number;         // Stat value threshold
    modifier?: number;          // Percentage modifier
  }[];
  outcomes?: {                  // Possible results
    success: string;
    failure?: string;
    criticalSuccess?: string;
  };
  unlocks?: string[];           // What this action enables (e.g., 'recruit_soldier' -> soldiers available)
  risks?: {                     // Potential negative outcomes
    chance: number;             // 0-100 percentage
    consequence: string;
  }[];
}

// ============================================================================
// POLITICAL CITY ACTIONS
// ============================================================================

const POLITICAL_ACTIONS: CityAction[] = [
  {
    id: 'lobby_government',
    name: 'Lobby Government',
    description: 'Influence local politicians to adjust policies in your favor. Effectiveness depends on corruption levels.',
    emoji: '🏛️',
    category: 'governance',
    cityTypes: ['Political'],
    duration: 8,
    baseCost: 10000,
    fameRequired: 100,
    countryModifiers: [
      { stat: 'governmentCorruption', effect: 'cost_reduction', threshold: 50, modifier: 30 },
      { stat: 'mediaFreedom', effect: 'success_penalty', threshold: 70, modifier: 20 },
    ],
    outcomes: {
      success: 'Policy shift in your favor. Local heat reduced by 10.',
      failure: 'Officials reject your proposal. $5000 wasted on bribes.',
      criticalSuccess: 'Major policy change! LSW regulations relaxed in this city.',
    },
    risks: [
      { chance: 15, consequence: 'Media exposes lobbying attempt. Fame -20.' },
    ],
  },
  {
    id: 'pr_campaign',
    name: 'PR Campaign',
    description: 'Launch a public relations campaign to boost your reputation in this region.',
    emoji: '📺',
    category: 'governance',
    cityTypes: ['Political'],
    duration: 24,
    baseCost: 25000,
    countryModifiers: [
      { stat: 'mediaFreedom', effect: 'success_bonus', threshold: 60, modifier: 25 },
      { stat: 'cyberCapabilities', effect: 'cost_reduction', threshold: 70, modifier: 15 },
    ],
    outcomes: {
      success: 'Positive coverage spreads. Fame +30 in this country.',
      failure: 'Campaign falls flat. Minimal impact.',
      criticalSuccess: 'Viral success! Fame +75, global coverage.',
    },
  },
  {
    id: 'access_records',
    name: 'Access Official Records',
    description: 'Investigate government databases for intel on targets, criminals, or missing persons.',
    emoji: '📁',
    category: 'intel',
    cityTypes: ['Political'],
    duration: 4,
    baseCost: 2000,
    skillCheck: { skill: 'investigation', difficulty: 50 },
    countryModifiers: [
      { stat: 'digitalDevelopment', effect: 'success_bonus', threshold: 60, modifier: 20 },
      { stat: 'governmentCorruption', effect: 'cost_reduction', threshold: 40, modifier: 50 },
    ],
    outcomes: {
      success: 'Acquired valuable intel. Investigation progress +25%.',
      failure: 'Access denied or records incomplete.',
    },
    risks: [
      { chance: 10, consequence: 'Your inquiry flagged. Local heat +15.' },
    ],
  },
];

// ============================================================================
// EDUCATIONAL CITY ACTIONS
// ============================================================================

const EDUCATIONAL_ACTIONS: CityAction[] = [
  {
    id: 'intensive_training',
    name: 'Intensive Training',
    description: 'Enroll characters in accelerated training programs at local universities or academies.',
    emoji: '🎓',
    category: 'training',
    cityTypes: ['Educational'],
    duration: 48,
    baseCost: 5000,
    countryModifiers: [
      { stat: 'higherEducation', effect: 'success_bonus', threshold: 60, modifier: 30 },
      { stat: 'science', effect: 'success_bonus', threshold: 50, modifier: 15 },
    ],
    outcomes: {
      success: 'Training complete. Selected skill +1 rank.',
      criticalSuccess: 'Exceptional progress! Skill +2 ranks, unlock specialty.',
    },
  },
  {
    id: 'recruit_scientist',
    name: 'Recruit Scientist',
    description: 'Recruit a scientist or researcher to join your organization.',
    emoji: '🔬',
    category: 'recruitment',
    cityTypes: ['Educational'],
    duration: 12,
    baseCost: 15000,
    fameRequired: 50,
    countryModifiers: [
      { stat: 'science', effect: 'success_bonus', threshold: 70, modifier: 25 },
      { stat: 'gdpPerCapita', effect: 'cost_increase', threshold: 50, modifier: 40 },
    ],
    outcomes: {
      success: 'Scientist joins. Research speed +10%.',
      failure: 'No suitable candidates available.',
    },
    unlocks: ['research_projects'],
  },
  {
    id: 'library_research',
    name: 'Library Research',
    description: 'Access university libraries and archives for historical or scientific research.',
    emoji: '📚',
    category: 'intel',
    cityTypes: ['Educational'],
    duration: 6,
    baseCost: 500,
    skillCheck: { skill: 'research', difficulty: 30 },
    outcomes: {
      success: 'Found useful information. Tech tree progress +5%.',
    },
  },
];

// ============================================================================
// MILITARY CITY ACTIONS
// ============================================================================

const MILITARY_ACTIONS: CityAction[] = [
  {
    id: 'recruit_soldier',
    name: 'Recruit Soldier',
    description: 'Recruit a trained soldier or veteran to join your squad.',
    emoji: '🎖️',
    category: 'recruitment',
    cityTypes: ['Military'],
    duration: 8,
    baseCost: 8000,
    fameRequired: 75,
    countryModifiers: [
      { stat: 'militaryServices', effect: 'success_bonus', threshold: 60, modifier: 20 },
      { stat: 'militaryBudget', effect: 'cost_increase', threshold: 70, modifier: 30 },
    ],
    outcomes: {
      success: 'Veteran soldier joins. Combat stats: 60+.',
      failure: 'No suitable candidates willing to join.',
    },
    unlocks: ['mercenary_contracts'],
  },
  {
    id: 'military_surplus',
    name: 'Buy Military Surplus',
    description: 'Purchase discounted military equipment from surplus stores or corrupt quartermasters.',
    emoji: '🪖',
    category: 'equipment',
    cityTypes: ['Military'],
    duration: 4,
    baseCost: 0, // Cost is per-item
    countryModifiers: [
      { stat: 'governmentCorruption', effect: 'unlock', threshold: 30 },
      { stat: 'militaryBudget', effect: 'cost_reduction', threshold: 60, modifier: 25 },
    ],
    outcomes: {
      success: 'Access to military-grade weapons at 40% discount.',
    },
    unlocks: ['military_weapons', 'body_armor', 'night_vision'],
  },
  {
    id: 'fortify_safehouse',
    name: 'Fortify Safehouse',
    description: 'Hire military engineers to upgrade your safehouse defenses.',
    emoji: '🏰',
    category: 'logistics',
    cityTypes: ['Military'],
    duration: 24,
    baseCost: 20000,
    countryModifiers: [
      { stat: 'militaryServices', effect: 'success_bonus', threshold: 50, modifier: 15 },
    ],
    outcomes: {
      success: 'Safehouse defense rating +30. Raid resistance improved.',
    },
  },
];

// ============================================================================
// INDUSTRIAL CITY ACTIONS
// ============================================================================

const INDUSTRIAL_ACTIONS: CityAction[] = [
  {
    id: 'manufacture_equipment',
    name: 'Manufacture Equipment',
    description: 'Commission local factories to produce custom equipment or gadgets.',
    emoji: '🏭',
    category: 'equipment',
    cityTypes: ['Industrial'],
    duration: 48,
    baseCost: 10000,
    countryModifiers: [
      { stat: 'science', effect: 'success_bonus', threshold: 50, modifier: 20 },
      { stat: 'gdpPerCapita', effect: 'cost_increase', threshold: 60, modifier: 25 },
    ],
    outcomes: {
      success: 'Custom equipment manufactured. Quality depends on tech level.',
      criticalSuccess: 'Master craftsman produces exceptional item. +1 quality tier.',
    },
    unlocks: ['custom_gadgets', 'modified_weapons'],
  },
  {
    id: 'vehicle_repair',
    name: 'Repair Vehicle',
    description: 'Use industrial facilities to repair damaged vehicles.',
    emoji: '🔧',
    category: 'logistics',
    cityTypes: ['Industrial'],
    duration: 12,
    baseCost: 5000,
    outcomes: {
      success: 'Vehicle fully repaired and operational.',
    },
  },
  {
    id: 'underground_network',
    name: 'Underground Network',
    description: 'Establish contacts with factory workers and union members for information and smuggling.',
    emoji: '🔗',
    category: 'criminal',
    cityTypes: ['Industrial'],
    duration: 16,
    baseCost: 8000,
    countryModifiers: [
      { stat: 'governmentCorruption', effect: 'success_bonus', threshold: 40, modifier: 25 },
      { stat: 'lawEnforcement', effect: 'success_penalty', threshold: 70, modifier: 20 },
    ],
    outcomes: {
      success: 'Network established. Smuggling routes available.',
    },
    risks: [
      { chance: 20, consequence: 'Informant tips off police. Heat +25.' },
    ],
    unlocks: ['smuggling_route'],
  },
];

// ============================================================================
// SEAPORT CITY ACTIONS
// ============================================================================

const SEAPORT_ACTIONS: CityAction[] = [
  {
    id: 'smuggling_route',
    name: 'Establish Smuggling Route',
    description: 'Set up a reliable smuggling route through the port for equipment and personnel.',
    emoji: '🚢',
    category: 'criminal',
    cityTypes: ['Seaport'],
    duration: 24,
    baseCost: 30000,
    countryModifiers: [
      { stat: 'governmentCorruption', effect: 'success_bonus', threshold: 50, modifier: 30 },
      { stat: 'lawEnforcement', effect: 'success_penalty', threshold: 60, modifier: 25 },
      { stat: 'intelligenceServices', effect: 'success_penalty', threshold: 70, modifier: 20 },
    ],
    outcomes: {
      success: 'Smuggling route established. Bypass customs on future shipments.',
      criticalSuccess: 'Captain is now a loyal contact. Priority shipping available.',
    },
    risks: [
      { chance: 25, consequence: 'Coast guard intercepts. Lose cargo + heat +40.' },
    ],
    unlocks: ['international_shipping', 'equipment_import'],
  },
  {
    id: 'international_contact',
    name: 'International Contact',
    description: 'Meet with foreign contacts arriving by ship.',
    emoji: '🌍',
    category: 'intel',
    cityTypes: ['Seaport'],
    duration: 4,
    baseCost: 2000,
    outcomes: {
      success: 'Contact provides intel on overseas operations.',
    },
  },
  {
    id: 'plan_escape_route',
    name: 'Plan Escape Route',
    description: 'Arrange emergency evacuation via sea if things go wrong.',
    emoji: '⚓',
    category: 'logistics',
    cityTypes: ['Seaport'],
    duration: 8,
    baseCost: 15000,
    countryModifiers: [
      { stat: 'governmentCorruption', effect: 'cost_reduction', threshold: 50, modifier: 40 },
    ],
    outcomes: {
      success: 'Escape route secured. Can flee country within 2 hours if needed.',
    },
  },
];

// ============================================================================
// MINING CITY ACTIONS
// ============================================================================

const MINING_ACTIONS: CityAction[] = [
  {
    id: 'acquire_explosives',
    name: 'Acquire Explosives',
    description: 'Purchase industrial explosives from mining operations.',
    emoji: '💥',
    category: 'equipment',
    cityTypes: ['Mining'],
    duration: 6,
    baseCost: 5000,
    countryModifiers: [
      { stat: 'governmentCorruption', effect: 'success_bonus', threshold: 40, modifier: 30 },
      { stat: 'lawEnforcement', effect: 'success_penalty', threshold: 70, modifier: 35 },
    ],
    outcomes: {
      success: 'Explosives acquired. C4 and detonators available.',
    },
    risks: [
      { chance: 15, consequence: 'Transaction flagged. Federal investigation begins.' },
    ],
    unlocks: ['explosives', 'demolition'],
  },
  {
    id: 'underground_hideout',
    name: 'Underground Hideout',
    description: 'Convert abandoned mine shafts into a hidden base.',
    emoji: '⛏️',
    category: 'stealth',
    cityTypes: ['Mining'],
    duration: 72,
    baseCost: 40000,
    outcomes: {
      success: 'Underground hideout established. Impossible to find via aerial surveillance.',
      criticalSuccess: 'Extensive tunnel network. Multiple secret exits.',
    },
    unlocks: ['hidden_base', 'tunnel_network'],
  },
];

// ============================================================================
// RESORT CITY ACTIONS
// ============================================================================

const RESORT_ACTIONS: CityAction[] = [
  {
    id: 'low_profile_recovery',
    name: 'Low-Profile Recovery',
    description: 'Recover from injuries or reduce heat while blending in with tourists.',
    emoji: '🏖️',
    category: 'healing',
    cityTypes: ['Resort'],
    duration: 48,
    baseCost: 3000,
    outcomes: {
      success: 'Heat reduced by 30. Morale +20. Light healing.',
    },
  },
  {
    id: 'tourist_cover',
    name: 'Tourist Cover Identity',
    description: 'Create a convincing tourist identity for undercover operations.',
    emoji: '🕶️',
    category: 'stealth',
    cityTypes: ['Resort'],
    duration: 8,
    baseCost: 5000,
    skillCheck: { skill: 'deception', difficulty: 40 },
    outcomes: {
      success: 'Cover identity established. +30% to stealth checks in public.',
    },
  },
  {
    id: 'money_laundering',
    name: 'Money Laundering',
    description: 'Clean dirty money through resort businesses and casinos.',
    emoji: '💸',
    category: 'criminal',
    cityTypes: ['Resort'],
    duration: 24,
    baseCost: 0, // Takes percentage
    countryModifiers: [
      { stat: 'governmentCorruption', effect: 'success_bonus', threshold: 60, modifier: 40 },
      { stat: 'intelligenceServices', effect: 'success_penalty', threshold: 70, modifier: 30 },
    ],
    outcomes: {
      success: 'Money cleaned. 15% fee, funds now legitimate.',
      failure: 'Transaction flagged. Funds frozen.',
    },
    risks: [
      { chance: 20, consequence: 'International money laundering investigation.' },
    ],
  },
];

// ============================================================================
// TEMPLE CITY ACTIONS
// ============================================================================

const TEMPLE_ACTIONS: CityAction[] = [
  {
    id: 'spiritual_healing',
    name: 'Spiritual Healing',
    description: 'Seek healing from monks, priests, or spiritual healers. Essential for Spiritual origin characters.',
    emoji: '🙏',
    category: 'healing',
    cityTypes: ['Temple'],
    duration: 24,
    baseCost: 1000, // Donation
    outcomes: {
      success: 'Spiritual restoration. HP +50% for Spiritual origins, +20% for others.',
      criticalSuccess: 'Divine blessing. Full HP restoration + temporary stat boost.',
    },
  },
  {
    id: 'monk_training',
    name: 'Monk Training',
    description: 'Learn martial arts and meditation techniques from temple masters.',
    emoji: '🥋',
    category: 'training',
    cityTypes: ['Temple'],
    duration: 168, // 1 week
    baseCost: 0, // Free but takes time
    outcomes: {
      success: 'Martial arts training. Unarmed combat +1, Discipline +1.',
      criticalSuccess: 'Master accepts you as student. Belt advancement + secret technique.',
    },
  },
  {
    id: 'request_sanctuary',
    name: 'Request Sanctuary',
    description: 'Seek protection from authorities in sacred grounds.',
    emoji: '⛩️',
    category: 'stealth',
    cityTypes: ['Temple'],
    duration: 0, // Immediate
    baseCost: 5000, // Significant donation
    fameRequired: 0, // Even infamous can seek sanctuary
    countryModifiers: [
      { stat: 'governmentCorruption', effect: 'success_penalty', threshold: 80, modifier: 50 },
    ],
    outcomes: {
      success: 'Sanctuary granted. Cannot be arrested while on temple grounds.',
    },
    risks: [
      { chance: 5, consequence: 'Government violates sanctuary. International incident.' },
    ],
  },
];

// ============================================================================
// COMPANY CITY ACTIONS (Corporate/Business)
// ============================================================================

const COMPANY_ACTIONS: CityAction[] = [
  {
    id: 'corporate_espionage',
    name: 'Corporate Espionage',
    description: 'Infiltrate corporate headquarters to gather intel or steal technology.',
    emoji: '🏢',
    category: 'intel',
    cityTypes: ['Company'],
    duration: 12,
    baseCost: 20000,
    skillCheck: { skill: 'stealth', difficulty: 60 },
    countryModifiers: [
      { stat: 'cyberCapabilities', effect: 'success_bonus', threshold: 60, modifier: 20 },
    ],
    outcomes: {
      success: 'Corporate secrets obtained. Tech progress +10%.',
      criticalSuccess: 'Prototype stolen. Immediate tech unlock.',
    },
    risks: [
      { chance: 30, consequence: 'Security catches you. Corporate hit squad dispatched.' },
    ],
  },
  {
    id: 'business_front',
    name: 'Business Front',
    description: 'Establish a legitimate business as cover for operations.',
    emoji: '💼',
    category: 'stealth',
    cityTypes: ['Company'],
    duration: 168, // 1 week
    baseCost: 100000,
    outcomes: {
      success: 'Business established. Generates $5000/month, provides cover.',
    },
    unlocks: ['legitimate_income', 'business_contacts'],
  },
  {
    id: 'hire_specialist',
    name: 'Hire Specialist',
    description: 'Recruit corporate specialists: hackers, lawyers, accountants.',
    emoji: '👔',
    category: 'recruitment',
    cityTypes: ['Company'],
    duration: 12,
    baseCost: 25000,
    countryModifiers: [
      { stat: 'gdpPerCapita', effect: 'cost_increase', threshold: 60, modifier: 50 },
    ],
    outcomes: {
      success: 'Specialist hired. Relevant skill tree unlocked.',
    },
  },
];

// ============================================================================
// COMBINED ACTION LIST
// ============================================================================

export const CITY_ACTIONS: CityAction[] = [
  ...POLITICAL_ACTIONS,
  ...EDUCATIONAL_ACTIONS,
  ...MILITARY_ACTIONS,
  ...INDUSTRIAL_ACTIONS,
  ...SEAPORT_ACTIONS,
  ...MINING_ACTIONS,
  ...RESORT_ACTIONS,
  ...TEMPLE_ACTIONS,
  ...COMPANY_ACTIONS,
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get all actions available in a city based on its city types
 */
export function getActionsForCity(city: City): CityAction[] {
  const cityTypes = [city.cityType1, city.cityType2, city.cityType3, city.cityType4]
    .filter(type => type && type !== '');

  return CITY_ACTIONS.filter(action =>
    action.cityTypes.some(actionType => cityTypes.includes(actionType))
  );
}

/**
 * Get actions by category
 */
export function getActionsByCategory(category: ActionCategory): CityAction[] {
  return CITY_ACTIONS.filter(action => action.category === category);
}

/**
 * Get actions by city type
 */
export function getActionsByCityType(cityType: string): CityAction[] {
  return CITY_ACTIONS.filter(action => action.cityTypes.includes(cityType));
}

/**
 * Calculate final action cost with country modifiers
 */
export function getActionCost(action: CityAction, country: Country): number {
  let cost = action.baseCost;

  if (action.countryModifiers) {
    for (const mod of action.countryModifiers) {
      const statValue = (country as Record<string, unknown>)[mod.stat] as number | undefined;
      if (statValue === undefined) continue;

      if (mod.threshold && statValue >= mod.threshold) {
        if (mod.effect === 'cost_reduction' && mod.modifier) {
          cost = Math.round(cost * (1 - mod.modifier / 100));
        } else if (mod.effect === 'cost_increase' && mod.modifier) {
          cost = Math.round(cost * (1 + mod.modifier / 100));
        }
      }
    }
  }

  return cost;
}

/**
 * Check if an action is available in a country (based on unlock/lock modifiers)
 */
export function isActionAvailable(action: CityAction, country: Country): boolean {
  if (!action.countryModifiers) return true;

  for (const mod of action.countryModifiers) {
    const statValue = (country as Record<string, unknown>)[mod.stat] as number | undefined;
    if (statValue === undefined) continue;

    if (mod.effect === 'lock' && mod.threshold && statValue >= mod.threshold) {
      return false;
    }
  }

  return true;
}

/**
 * Calculate success chance with country modifiers
 */
export function getActionSuccessChance(action: CityAction, country: Country, baseChance: number = 70): number {
  let chance = baseChance;

  if (action.countryModifiers) {
    for (const mod of action.countryModifiers) {
      const statValue = (country as Record<string, unknown>)[mod.stat] as number | undefined;
      if (statValue === undefined) continue;

      if (mod.threshold && statValue >= mod.threshold) {
        if (mod.effect === 'success_bonus' && mod.modifier) {
          chance += mod.modifier;
        } else if (mod.effect === 'success_penalty' && mod.modifier) {
          chance -= mod.modifier;
        }
      }
    }
  }

  return Math.max(5, Math.min(95, chance)); // Clamp between 5-95%
}

/**
 * Get action by ID
 */
export function getActionById(actionId: string): CityAction | undefined {
  return CITY_ACTIONS.find(action => action.id === actionId);
}

/**
 * Format action duration for display
 */
export function formatDuration(hours: number): string {
  if (hours < 24) {
    return `${hours}h`;
  } else {
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    if (remainingHours === 0) {
      return `${days}d`;
    }
    return `${days}d ${remainingHours}h`;
  }
}

/**
 * Get all unique city types that have actions
 */
export function getCityTypesWithActions(): string[] {
  const types = new Set<string>();
  CITY_ACTIONS.forEach(action => {
    action.cityTypes.forEach(type => types.add(type));
  });
  return Array.from(types).sort();
}
