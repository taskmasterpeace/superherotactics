/**
 * Contacts System
 *
 * Phone contacts that provide gameplay services.
 * Unlocked through faction reputation.
 *
 * JA2 Philosophy: Each contact = a service you can BUY.
 */

import { FactionType } from './factionSystem';

// =============================================================================
// CONTACT TYPES
// =============================================================================

export type ContactService =
  | 'black_market'      // Access to illegal weapons/gear
  | 'street_doc'        // Fast healing, no questions asked
  | 'informant'         // Buy intel on missions/enemies
  | 'wheelman'          // Fast travel, extraction
  | 'fixer'             // Job offers, mission broker
  | 'smuggler'          // Move contraband, bypass customs
  | 'hacker'            // Cyber intel, disable security
  | 'lawyer'            // Reduce heat, clear bounties
  | 'armorer'           // Weapon mods, special ammo
  | 'trainer';          // Skill training discounts

export interface Contact {
  id: string;
  name: string;
  alias: string;                    // Display name (codename)
  icon: string;                     // Emoji icon
  service: ContactService;
  description: string;              // What they do

  // Unlock requirements
  factionType: FactionType;
  requiredStanding: number;         // Minimum standing to unlock (-100 to 100)

  // Service details
  serviceName: string;              // "Black Market Access"
  serviceDescription: string;       // What calling them does
  baseCost: number;                 // Cost per use (0 = free, just unlocks access)
  cooldownHours: number;            // Hours before can use again (0 = unlimited)

  // Gameplay effects
  effects: ContactEffect[];
}

export interface ContactEffect {
  type: 'shop_access' | 'heal_bonus' | 'intel' | 'travel' | 'reputation' | 'discount' | 'unlock';
  value: number | string;
  description: string;
}

// =============================================================================
// CONTACT DEFINITIONS
// =============================================================================

export const CONTACTS: Contact[] = [
  // ============ UNDERWORLD CONTACTS ============
  {
    id: 'arms_dealer',
    name: 'Viktor Kozlov',
    alias: 'The Dealer',
    icon: '🔫',
    service: 'black_market',
    description: 'Former Soviet arms dealer. Can get anything... for a price.',
    factionType: 'underworld',
    requiredStanding: 0,            // Just need to not be hostile
    serviceName: 'Black Market Access',
    serviceDescription: 'Access illegal weapons and restricted gear.',
    baseCost: 0,                    // Access is free, items cost money
    cooldownHours: 0,
    effects: [
      { type: 'shop_access', value: 'black_market', description: 'Unlocks black market shop' }
    ]
  },
  {
    id: 'street_doc',
    name: 'Dr. Yuki Tanaka',
    alias: 'No Questions',
    icon: '💉',
    service: 'street_doc',
    description: 'Unlicensed surgeon. Fast, clean, discreet.',
    factionType: 'underworld',
    requiredStanding: 10,
    serviceName: 'Emergency Treatment',
    serviceDescription: 'Heal injured team members faster. No hospital records.',
    baseCost: 500,                  // Per healing session
    cooldownHours: 0,
    effects: [
      { type: 'heal_bonus', value: 50, description: '+50% healing speed' },
      { type: 'reputation', value: 'no_hospital_record', description: 'No paper trail' }
    ]
  },
  {
    id: 'smuggler',
    name: 'Miguel "Coyote" Reyes',
    alias: 'Coyote',
    icon: '📦',
    service: 'smuggler',
    description: 'Moves anything across any border. Never asks, never tells.',
    factionType: 'underworld',
    requiredStanding: 25,
    serviceName: 'Smuggling Services',
    serviceDescription: 'Move gear across borders without customs checks.',
    baseCost: 1000,
    cooldownHours: 24,
    effects: [
      { type: 'unlock', value: 'cross_border_gear', description: 'Move equipment between countries' }
    ]
  },
  {
    id: 'crime_fixer',
    name: 'Unknown',
    alias: 'The Voice',
    icon: '📞',
    service: 'fixer',
    description: 'Never met in person. Offers high-risk, high-reward jobs.',
    factionType: 'underworld',
    requiredStanding: 50,
    serviceName: 'Underground Jobs',
    serviceDescription: 'Access criminal mission offers.',
    baseCost: 0,
    cooldownHours: 0,
    effects: [
      { type: 'unlock', value: 'underworld_missions', description: 'Criminal job offers' }
    ]
  },

  // ============ CORPORATIONS CONTACTS ============
  {
    id: 'corp_armorer',
    name: 'Sarah Chen',
    alias: 'Upgrade',
    icon: '🔧',
    service: 'armorer',
    description: 'Ex-military R&D. Now freelance. Specializes in weapon modifications.',
    factionType: 'corporations',
    requiredStanding: 10,
    serviceName: 'Weapon Modifications',
    serviceDescription: 'Add modifications to weapons. Better accuracy, damage, handling.',
    baseCost: 0,                    // Mods cost money
    cooldownHours: 0,
    effects: [
      { type: 'shop_access', value: 'weapon_mods', description: 'Unlocks weapon mod shop' }
    ]
  },
  {
    id: 'corp_hacker',
    name: 'ZeroDay',
    alias: 'ZeroDay',
    icon: '💻',
    service: 'hacker',
    description: 'White hat turned gray. Can crack any system.',
    factionType: 'corporations',
    requiredStanding: 25,
    serviceName: 'Cyber Intel',
    serviceDescription: 'Hack security systems. Get enemy locations, disable cameras.',
    baseCost: 2000,
    cooldownHours: 48,
    effects: [
      { type: 'intel', value: 'full_map', description: 'Reveals all enemies on mission start' }
    ]
  },
  {
    id: 'corp_fixer',
    name: 'James Morrison',
    alias: 'The Consultant',
    icon: '💼',
    service: 'fixer',
    description: 'Corporate headhunter. Connects talent with opportunities.',
    factionType: 'corporations',
    requiredStanding: 50,
    serviceName: 'Corporate Contracts',
    serviceDescription: 'Access high-paying corporate jobs.',
    baseCost: 0,
    cooldownHours: 0,
    effects: [
      { type: 'unlock', value: 'corporate_missions', description: 'Corporate job offers' }
    ]
  },

  // ============ MILITARY CONTACTS ============
  {
    id: 'military_trainer',
    name: 'Sgt. Marcus Stone',
    alias: 'Drill',
    icon: '🎖️',
    service: 'trainer',
    description: 'Retired special forces. Runs a private training camp.',
    factionType: 'military',
    requiredStanding: 25,
    serviceName: 'Combat Training',
    serviceDescription: 'Access to advanced military training programs.',
    baseCost: 0,
    cooldownHours: 0,
    effects: [
      { type: 'discount', value: 30, description: '30% off military training' },
      { type: 'unlock', value: 'advanced_training', description: 'Advanced combat courses' }
    ]
  },
  {
    id: 'military_armorer',
    name: 'Classified',
    alias: 'Quartermaster',
    icon: '🎯',
    service: 'armorer',
    description: 'Active duty. Has access to military-grade equipment.',
    factionType: 'military',
    requiredStanding: 50,
    serviceName: 'Military Hardware',
    serviceDescription: 'Access military-grade weapons and armor.',
    baseCost: 0,
    cooldownHours: 0,
    effects: [
      { type: 'shop_access', value: 'military_gear', description: 'Unlocks military shop' }
    ]
  },
  {
    id: 'military_intel',
    name: 'Ghost',
    alias: 'Ghost',
    icon: '👻',
    service: 'informant',
    description: 'Intelligence operative. Knows things before they happen.',
    factionType: 'military',
    requiredStanding: 75,
    serviceName: 'Strategic Intel',
    serviceDescription: 'Get detailed intel on enemy forces, patrol routes, reinforcements.',
    baseCost: 5000,
    cooldownHours: 24,
    effects: [
      { type: 'intel', value: 'enemy_stats', description: 'Reveals enemy loadouts and stats' },
      { type: 'intel', value: 'patrol_routes', description: 'Shows enemy patrol patterns' }
    ]
  },

  // ============ POLICE CONTACTS ============
  {
    id: 'police_informant',
    name: 'Detective Chen',
    alias: 'Insider',
    icon: '🕵️',
    service: 'informant',
    description: 'Dirty cop. Will leak info for cash.',
    factionType: 'police',
    requiredStanding: 0,            // Even neutral works
    serviceName: 'Police Scanner',
    serviceDescription: 'Know when police are responding. Avoid heat.',
    baseCost: 500,
    cooldownHours: 12,
    effects: [
      { type: 'intel', value: 'police_response', description: 'Warning before police arrive' }
    ]
  },
  {
    id: 'police_lawyer',
    name: 'Alexis Grant',
    alias: 'The Fixer',
    icon: '⚖️',
    service: 'lawyer',
    description: 'Criminal defense attorney. Gets people out of trouble.',
    factionType: 'police',
    requiredStanding: 25,
    serviceName: 'Legal Defense',
    serviceDescription: 'Reduce heat level. Clear minor bounties.',
    baseCost: 2000,
    cooldownHours: 72,
    effects: [
      { type: 'reputation', value: 'reduce_heat', description: 'Reduces police heat by 25%' }
    ]
  },

  // ============ GOVERNMENT CONTACTS ============
  {
    id: 'gov_handler',
    name: 'Agent Smith',
    alias: 'Handler',
    icon: '🏛️',
    service: 'fixer',
    description: 'Government liaison. Offers sanctioned operations.',
    factionType: 'government',
    requiredStanding: 50,
    serviceName: 'Government Contracts',
    serviceDescription: 'Access to official government missions.',
    baseCost: 0,
    cooldownHours: 0,
    effects: [
      { type: 'unlock', value: 'government_missions', description: 'Official mission offers' }
    ]
  },
  {
    id: 'gov_cleaner',
    name: 'Classified',
    alias: 'Cleaner',
    icon: '🧹',
    service: 'lawyer',
    description: 'Makes problems disappear. No questions.',
    factionType: 'government',
    requiredStanding: 75,
    serviceName: 'Problem Resolution',
    serviceDescription: 'Clear bounties, fix reputation issues.',
    baseCost: 10000,
    cooldownHours: 168,             // 1 week
    effects: [
      { type: 'reputation', value: 'clear_bounty', description: 'Clears one active bounty' },
      { type: 'reputation', value: 'restore_standing', description: 'Restores faction standing by 10' }
    ]
  },

  // ============ MEDIA CONTACTS ============
  {
    id: 'media_journalist',
    name: 'Rachel Torres',
    alias: 'Scoop',
    icon: '📰',
    service: 'informant',
    description: 'Investigative journalist. Trades info for stories.',
    factionType: 'media',
    requiredStanding: 10,
    serviceName: 'News Intel',
    serviceDescription: 'Get intel on upcoming events and targets.',
    baseCost: 1000,
    cooldownHours: 24,
    effects: [
      { type: 'intel', value: 'upcoming_events', description: 'Preview of coming missions' }
    ]
  },
  {
    id: 'media_spin',
    name: 'Unknown',
    alias: 'Spin Doctor',
    icon: '📺',
    service: 'lawyer',
    description: 'PR specialist. Controls the narrative.',
    factionType: 'media',
    requiredStanding: 50,
    serviceName: 'Reputation Management',
    serviceDescription: 'Improve public opinion. Damage control.',
    baseCost: 5000,
    cooldownHours: 72,
    effects: [
      { type: 'reputation', value: 'public_opinion', description: '+15 public opinion' }
    ]
  },
];

// =============================================================================
// CONTACT STATE
// =============================================================================

export interface ContactState {
  contactId: string;
  unlocked: boolean;
  lastUsed: number | null;          // Game timestamp
  timesUsed: number;
}

export function createInitialContactStates(): ContactState[] {
  return CONTACTS.map(contact => ({
    contactId: contact.id,
    unlocked: false,
    lastUsed: null,
    timesUsed: 0
  }));
}

// =============================================================================
// CONTACT UTILITIES
// =============================================================================

/**
 * Check if a contact is unlocked based on faction standing
 */
export function isContactUnlocked(
  contact: Contact,
  factionStanding: number
): boolean {
  return factionStanding >= contact.requiredStanding;
}

/**
 * Check if a contact service is available (not on cooldown)
 */
export function isContactAvailable(
  contact: Contact,
  lastUsed: number | null,
  currentGameHour: number
): boolean {
  if (contact.cooldownHours === 0) return true;
  if (lastUsed === null) return true;

  const hoursSinceUse = currentGameHour - lastUsed;
  return hoursSinceUse >= contact.cooldownHours;
}

/**
 * Get remaining cooldown hours
 */
export function getContactCooldownRemaining(
  contact: Contact,
  lastUsed: number | null,
  currentGameHour: number
): number {
  if (contact.cooldownHours === 0) return 0;
  if (lastUsed === null) return 0;

  const hoursSinceUse = currentGameHour - lastUsed;
  const remaining = contact.cooldownHours - hoursSinceUse;
  return Math.max(0, remaining);
}

/**
 * Get all contacts for a faction type
 */
export function getContactsByFaction(factionType: FactionType): Contact[] {
  return CONTACTS.filter(c => c.factionType === factionType);
}

/**
 * Get all unlocked contacts based on current faction standings
 */
export function getUnlockedContacts(
  factionStandings: Map<FactionType, number>
): Contact[] {
  return CONTACTS.filter(contact => {
    const standing = factionStandings.get(contact.factionType) ?? 0;
    return standing >= contact.requiredStanding;
  });
}

/**
 * Get contacts sorted by unlock status
 */
export function getContactsWithStatus(
  factionStandings: Map<FactionType, number>
): Array<Contact & { isUnlocked: boolean; currentStanding: number; standingNeeded: number }> {
  return CONTACTS.map(contact => {
    const currentStanding = factionStandings.get(contact.factionType) ?? 0;
    const isUnlocked = currentStanding >= contact.requiredStanding;
    const standingNeeded = Math.max(0, contact.requiredStanding - currentStanding);

    return {
      ...contact,
      isUnlocked,
      currentStanding,
      standingNeeded
    };
  }).sort((a, b) => {
    // Unlocked first, then by faction, then by required standing
    if (a.isUnlocked !== b.isUnlocked) return a.isUnlocked ? -1 : 1;
    if (a.factionType !== b.factionType) return a.factionType.localeCompare(b.factionType);
    return a.requiredStanding - b.requiredStanding;
  });
}
