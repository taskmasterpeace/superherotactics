/**
 * Contact System (NL-003, NL-006)
 *
 * Contacts are NPCs who provide information, services, or assistance.
 * They have relationships that develop over time.
 *
 * INTEL STALENESS (NL-006):
 * Information has a shelf life. Intel from contacts expires.
 * A contact who told you about a gang hideout 2 weeks ago
 * might have outdated info - the gang may have moved.
 */

import {
  NPCEntity,
  generateNPC,
  getNPCManager,
  updateNPCRelationship,
} from './npcSystem';
import { Country, getCountries } from './countries';
import { City, getCitiesInCountry } from './cities';
import { getTimeEngine } from './timeEngine';

// =============================================================================
// CONTACT TYPES
// =============================================================================

export type ContactType =
  | 'informant'        // Street-level intel
  | 'insider'          // Organization insider
  | 'fixer'            // Arranges deals/services
  | 'specialist'       // Technical expert
  | 'smuggler'         // Moves goods illegally
  | 'official'         // Government/police contact
  | 'journalist'       // Media contact
  | 'scientist';       // Research/tech contact

export type IntelCategory =
  | 'gang_activity'
  | 'police_operations'
  | 'military_movements'
  | 'political_intel'
  | 'corporate_secrets'
  | 'superhuman_sightings'
  | 'smuggling_routes'
  | 'safe_houses'
  | 'equipment_dealers'
  | 'target_locations'
  | 'financial_intel';

// =============================================================================
// INTEL PIECE
// =============================================================================

export interface IntelPiece {
  id: string;
  category: IntelCategory;
  title: string;
  description: string;
  details: string;

  // Source tracking
  sourceContactId: string;
  sourceQuality: number;     // 0-100, affects accuracy

  // Staleness
  acquiredAt: number;        // Game timestamp
  validUntil: number;        // When intel expires
  isStale: boolean;          // Manually marked or expired

  // Accuracy (revealed after using intel)
  accuracy: number;          // 0-100, how accurate the intel was
  wasUsed: boolean;
  usedAt?: number;
  usedOutcome?: 'accurate' | 'partially_accurate' | 'outdated' | 'false';

  // Value
  purchasePrice: number;
}

// =============================================================================
// CONTACT ENTITY
// =============================================================================

export interface Contact {
  npc: NPCEntity;
  type: ContactType;

  // Capabilities
  intelCategories: IntelCategory[];
  intelQuality: number;       // 0-100
  intelFrequency: number;     // Days between new intel
  lastIntelProvided?: number; // Game timestamp

  // Economics
  baseCost: number;           // Base cost per intel piece
  loyaltyDiscount: number;    // % discount from high trust

  // Relationship
  meetingsCount: number;
  dealsCompleted: number;
  totalPaid: number;
  lastContact?: number;

  // Risk
  burnRisk: number;           // 0-100, chance contact gets exposed
  isCompromised: boolean;
  isBurned: boolean;          // Permanently unusable

  // Intel history
  intelProvided: IntelPiece[];
  pendingIntel: IntelPiece[]; // Available to purchase
}

// =============================================================================
// STALENESS CALCULATION
// =============================================================================

/**
 * How long intel stays fresh (in game hours)
 * Depends on category - some info changes faster
 */
const INTEL_VALIDITY_HOURS: Record<IntelCategory, number> = {
  gang_activity: 72,           // 3 days - gangs move fast
  police_operations: 48,       // 2 days - operations change quickly
  military_movements: 168,     // 1 week - military plans more stable
  political_intel: 336,        // 2 weeks - politics moves slower
  corporate_secrets: 240,      // 10 days - moderate stability
  superhuman_sightings: 24,    // 1 day - supers are unpredictable
  smuggling_routes: 168,       // 1 week - routes rotate weekly
  safe_houses: 336,            // 2 weeks - locations don't change fast
  equipment_dealers: 504,      // 3 weeks - dealers are stable
  target_locations: 120,       // 5 days - targets may move
  financial_intel: 168,        // 1 week - money moves weekly
};

/**
 * Check if intel is stale
 */
export function isIntelStale(intel: IntelPiece, currentTimestamp: number): boolean {
  if (intel.isStale) return true;
  return currentTimestamp > intel.validUntil;
}

/**
 * Calculate remaining validity time
 */
export function getIntelValidityRemaining(intel: IntelPiece, currentTimestamp: number): number {
  return Math.max(0, intel.validUntil - currentTimestamp);
}

/**
 * Get staleness level descriptor
 */
export function getIntelFreshnessLevel(intel: IntelPiece, currentTimestamp: number): {
  level: 'fresh' | 'recent' | 'aging' | 'stale' | 'expired';
  color: string;
  reliability: number;
} {
  if (intel.isStale || currentTimestamp > intel.validUntil) {
    return { level: 'expired', color: '#ef4444', reliability: 0.2 };
  }

  const totalValidity = intel.validUntil - intel.acquiredAt;
  const elapsed = currentTimestamp - intel.acquiredAt;
  const percentElapsed = elapsed / totalValidity;

  if (percentElapsed < 0.25) {
    return { level: 'fresh', color: '#22c55e', reliability: 1.0 };
  }
  if (percentElapsed < 0.5) {
    return { level: 'recent', color: '#84cc16', reliability: 0.85 };
  }
  if (percentElapsed < 0.75) {
    return { level: 'aging', color: '#eab308', reliability: 0.6 };
  }
  return { level: 'stale', color: '#f97316', reliability: 0.35 };
}

// =============================================================================
// INTEL GENERATION
// =============================================================================

/**
 * Intel templates by category
 */
const INTEL_TEMPLATES: Record<IntelCategory, Array<{
  title: string;
  descTemplate: string;
  detailTemplate: string;
}>> = {
  gang_activity: [
    {
      title: 'Gang Hideout Location',
      descTemplate: 'Location of {faction} safehouse in {city}',
      detailTemplate: 'The {faction} have been using a warehouse at {location} as their base. About {count} members rotate through.',
    },
    {
      title: 'Gang Shipment',
      descTemplate: '{faction} expecting delivery in {city}',
      detailTemplate: 'A shipment of {cargo} is coming in at {time}. They\'ll have {count} guards.',
    },
  ],
  police_operations: [
    {
      title: 'Raid Planned',
      descTemplate: 'Police planning raid on {target}',
      detailTemplate: 'SWAT is planning to hit {location} in {timeframe}. {count} officers involved.',
    },
    {
      title: 'Patrol Schedule',
      descTemplate: 'Police patrol routes in {area}',
      detailTemplate: 'Patrols pass through {location} every {interval}. Shift change at {time}.',
    },
  ],
  military_movements: [
    {
      title: 'Troop Movement',
      descTemplate: 'Military units relocating near {city}',
      detailTemplate: '{unit} is moving to {location}. About {count} personnel with {equipment}.',
    },
  ],
  political_intel: [
    {
      title: 'Political Scandal',
      descTemplate: 'Compromising info on {official}',
      detailTemplate: '{official} has been {scandal}. Documents located at {location}.',
    },
  ],
  corporate_secrets: [
    {
      title: 'Corporate Research',
      descTemplate: '{company} developing new {tech}',
      detailTemplate: 'Research lab at {location}. Security is {level}. Project codenamed {codename}.',
    },
  ],
  superhuman_sightings: [
    {
      title: 'LSW Sighting',
      descTemplate: '{superhuman} spotted near {city}',
      detailTemplate: 'Witnesses report {superhuman} at {location}. Powers include {powers}.',
    },
  ],
  smuggling_routes: [
    {
      title: 'Smuggling Route',
      descTemplate: 'Border crossing for {cargo}',
      detailTemplate: 'Route goes through {waypoints}. Active between {time}. Contact is {name}.',
    },
  ],
  safe_houses: [
    {
      title: 'Safe House',
      descTemplate: 'Secure location in {city}',
      detailTemplate: 'Building at {location}. {features}. Rent is ${cost}/week.',
    },
  ],
  equipment_dealers: [
    {
      title: 'Arms Dealer',
      descTemplate: '{dealer} selling {weapons} in {city}',
      detailTemplate: 'Meet at {location}. Prices are {pricing}. Inventory includes {inventory}.',
    },
  ],
  target_locations: [
    {
      title: 'Target Location',
      descTemplate: '{target} found at {city}',
      detailTemplate: '{target} is staying at {location}. Routine: {schedule}. Security: {security}.',
    },
  ],
  financial_intel: [
    {
      title: 'Money Trail',
      descTemplate: 'Funds moving through {bank}',
      detailTemplate: '${amount} transferred from {source} to {dest}. Account: {account}.',
    },
  ],
};

/**
 * Generate a piece of intel
 */
export function generateIntel(
  contact: Contact,
  category?: IntelCategory
): IntelPiece {
  const timeEngine = getTimeEngine();
  const timestamp = timeEngine.getTime().totalHours;

  // Pick category
  const cat = category ||
    contact.intelCategories[Math.floor(Math.random() * contact.intelCategories.length)];

  // Pick template
  const templates = INTEL_TEMPLATES[cat] || INTEL_TEMPLATES.gang_activity;
  const template = templates[Math.floor(Math.random() * templates.length)];

  // Calculate validity
  const baseValidity = INTEL_VALIDITY_HOURS[cat];
  const qualityBonus = contact.intelQuality * 0.5; // Higher quality = lasts longer
  const validityHours = Math.floor(baseValidity + qualityBonus);

  // Calculate price
  const basePrice = contact.baseCost;
  const categoryMultiplier = getCategoryPriceMultiplier(cat);
  const price = Math.floor(basePrice * categoryMultiplier * (1 - contact.loyaltyDiscount / 100));

  return {
    id: `intel_${contact.npc.id}_${timestamp}_${Math.random().toString(36).substr(2, 9)}`,
    category: cat,
    title: template.title,
    description: template.descTemplate, // Would normally fill in variables
    details: template.detailTemplate,   // Would normally fill in variables

    sourceContactId: contact.npc.id,
    sourceQuality: contact.intelQuality,

    acquiredAt: timestamp,
    validUntil: timestamp + validityHours,
    isStale: false,

    accuracy: Math.min(100, contact.intelQuality + Math.floor(Math.random() * 20) - 10),
    wasUsed: false,

    purchasePrice: price,
  };
}

function getCategoryPriceMultiplier(category: IntelCategory): number {
  const multipliers: Record<IntelCategory, number> = {
    gang_activity: 0.8,
    police_operations: 1.5,
    military_movements: 2.0,
    political_intel: 2.5,
    corporate_secrets: 2.0,
    superhuman_sightings: 1.2,
    smuggling_routes: 1.0,
    safe_houses: 0.7,
    equipment_dealers: 0.6,
    target_locations: 1.5,
    financial_intel: 1.8,
  };
  return multipliers[category] ?? 1.0;
}

// =============================================================================
// CONTACT MANAGER
// =============================================================================

let contactManagerInstance: ContactManager | null = null;

export class ContactManager {
  private contacts: Map<string, Contact> = new Map();
  private playerIntel: Map<string, IntelPiece> = new Map();
  private started: boolean = false;

  start(): void {
    if (this.started) return;
    this.started = true;

    const timeEngine = getTimeEngine();

    // Generate new intel for contacts periodically
    timeEngine.on('day_change', () => {
      this.refreshContactIntel();
    });

    // Mark old intel as stale
    timeEngine.on('hour_change', () => {
      this.updateIntelStaleness();
    });
  }

  /**
   * Create a new contact
   */
  createContact(
    country: Country,
    city: City,
    type: ContactType
  ): Contact {
    const npc = generateNPC(country, city, 'contact', {
      minAge: 25,
      maxAge: 60,
    });

    getNPCManager().addNPC(npc);

    const contact: Contact = {
      npc,
      type,
      intelCategories: getIntelCategoriesForType(type),
      intelQuality: Math.floor(Math.random() * 40) + 40, // 40-80
      intelFrequency: Math.floor(Math.random() * 5) + 3, // 3-7 days

      baseCost: Math.floor(Math.random() * 300) + 100,
      loyaltyDiscount: 0,

      meetingsCount: 0,
      dealsCompleted: 0,
      totalPaid: 0,

      burnRisk: Math.floor(Math.random() * 20),
      isCompromised: false,
      isBurned: false,

      intelProvided: [],
      pendingIntel: [],
    };

    // Generate initial intel
    for (let i = 0; i < 2; i++) {
      contact.pendingIntel.push(generateIntel(contact));
    }

    this.contacts.set(npc.id, contact);
    return contact;
  }

  /**
   * Get contact by NPC ID
   */
  getContact(npcId: string): Contact | undefined {
    return this.contacts.get(npcId);
  }

  /**
   * Get all contacts
   */
  getAllContacts(): Contact[] {
    return Array.from(this.contacts.values()).filter(c => !c.isBurned);
  }

  /**
   * Get contacts in a city
   */
  getContactsInCity(cityName: string): Contact[] {
    return this.getAllContacts().filter(c => c.npc.currentCity === cityName);
  }

  /**
   * Purchase intel from contact
   */
  purchaseIntel(contactId: string, intelId: string): IntelPiece | null {
    const contact = this.contacts.get(contactId);
    if (!contact || contact.isBurned) return null;

    const intelIndex = contact.pendingIntel.findIndex(i => i.id === intelId);
    if (intelIndex === -1) return null;

    const intel = contact.pendingIntel.splice(intelIndex, 1)[0];

    // Update contact relationship
    contact.dealsCompleted++;
    contact.totalPaid += intel.purchasePrice;
    contact.intelProvided.push(intel);

    const timeEngine = getTimeEngine();
    contact.lastContact = timeEngine.getTime().totalHours;

    // Increase loyalty discount over time
    if (contact.dealsCompleted >= 10) {
      contact.loyaltyDiscount = Math.min(30, contact.loyaltyDiscount + 2);
    }

    // Update NPC relationship
    const npcManager = getNPCManager();
    const updatedNpc = updateNPCRelationship(contact.npc, {
      type: 'trade',
      outcome: 'positive',
      description: 'Purchased intel',
      opinionChange: 3,
    });
    npcManager.updateNPC(updatedNpc);
    contact.npc = updatedNpc;

    // Store player intel
    this.playerIntel.set(intel.id, intel);

    return intel;
  }

  /**
   * Get player's acquired intel
   */
  getPlayerIntel(includeStale: boolean = false): IntelPiece[] {
    const timeEngine = getTimeEngine();
    const timestamp = timeEngine.getTime().totalHours;

    return Array.from(this.playerIntel.values()).filter(intel =>
      includeStale || !isIntelStale(intel, timestamp)
    );
  }

  /**
   * Mark intel as used
   */
  useIntel(intelId: string, wasAccurate: boolean): void {
    const intel = this.playerIntel.get(intelId);
    if (!intel) return;

    const timeEngine = getTimeEngine();
    intel.wasUsed = true;
    intel.usedAt = timeEngine.getTime().totalHours;

    // Determine outcome based on staleness at time of use
    const freshnessAtUse = getIntelFreshnessLevel(intel, intel.usedAt);

    if (wasAccurate) {
      if (freshnessAtUse.reliability >= 0.8) {
        intel.usedOutcome = 'accurate';
      } else {
        intel.usedOutcome = 'partially_accurate';
      }
    } else {
      if (freshnessAtUse.reliability < 0.5) {
        intel.usedOutcome = 'outdated';
      } else {
        intel.usedOutcome = 'false';

        // False intel damages contact trust
        const contact = this.contacts.get(intel.sourceContactId);
        if (contact) {
          contact.npc.trustLevel = Math.max(0, contact.npc.trustLevel - 15);
          contact.burnRisk = Math.min(100, contact.burnRisk + 10);
        }
      }
    }
  }

  /**
   * Refresh intel for all contacts
   */
  private refreshContactIntel(): void {
    const timeEngine = getTimeEngine();
    const timestamp = timeEngine.getTime().totalHours;

    for (const contact of this.contacts.values()) {
      if (contact.isBurned) continue;

      // Check if it's time for new intel
      const daysSinceIntel = contact.lastIntelProvided ?
        (timestamp - contact.lastIntelProvided) / 24 : contact.intelFrequency + 1;

      if (daysSinceIntel >= contact.intelFrequency) {
        // Generate new intel if they have room
        if (contact.pendingIntel.length < 3) {
          contact.pendingIntel.push(generateIntel(contact));
          contact.lastIntelProvided = timestamp;
        }
      }

      // Small chance contact gets burned
      if (Math.random() * 100 < contact.burnRisk * 0.1) {
        contact.isCompromised = true;
        contact.burnRisk = Math.min(100, contact.burnRisk + 20);
      }
    }
  }

  /**
   * Update staleness of all player intel
   */
  private updateIntelStaleness(): void {
    const timeEngine = getTimeEngine();
    const timestamp = timeEngine.getTime().totalHours;

    for (const intel of this.playerIntel.values()) {
      if (!intel.isStale && timestamp > intel.validUntil) {
        intel.isStale = true;
      }
    }
  }

  /**
   * Burn a contact (permanently unusable)
   */
  burnContact(contactId: string, reason: string): void {
    const contact = this.contacts.get(contactId);
    if (!contact) return;

    contact.isBurned = true;
    contact.pendingIntel = [];

    // Update NPC
    const npcManager = getNPCManager();
    const updatedNpc = updateNPCRelationship(contact.npc, {
      type: 'event',
      outcome: 'negative',
      description: `Contact burned: ${reason}`,
      opinionChange: -50,
    });
    npcManager.updateNPC(updatedNpc);
  }
}

/**
 * Get intel categories for contact type
 */
function getIntelCategoriesForType(type: ContactType): IntelCategory[] {
  const categories: Record<ContactType, IntelCategory[]> = {
    informant: ['gang_activity', 'smuggling_routes', 'safe_houses'],
    insider: ['corporate_secrets', 'political_intel', 'financial_intel'],
    fixer: ['equipment_dealers', 'smuggling_routes', 'safe_houses'],
    specialist: ['superhuman_sightings', 'corporate_secrets', 'target_locations'],
    smuggler: ['smuggling_routes', 'equipment_dealers', 'gang_activity'],
    official: ['police_operations', 'military_movements', 'political_intel'],
    journalist: ['political_intel', 'corporate_secrets', 'superhuman_sightings'],
    scientist: ['superhuman_sightings', 'corporate_secrets', 'military_movements'],
  };
  return categories[type] || ['gang_activity'];
}

export function getContactManager(): ContactManager {
  if (!contactManagerInstance) {
    contactManagerInstance = new ContactManager();
  }
  return contactManagerInstance;
}

// =============================================================================
// EXPORTS
// =============================================================================

export default {
  isIntelStale,
  getIntelValidityRemaining,
  getIntelFreshnessLevel,
  generateIntel,
  getContactManager,
};
