/**
 * NPC Life Events System (NL-004)
 *
 * NPCs have lives that continue even when player isn't watching.
 * They can move cities, get arrested, get injured, or die.
 * These events create a living world and affect player's resources.
 */

import { NPCEntity, getNPCManager } from './npcSystem';
import { Contact, getContactManager } from './contactSystem';
import { getMercenaryPoolManager } from './mercenaryPool';
import { getTimeEngine } from './timeEngine';
import { Country, getCountries } from './countries';
import { City, getCitiesInCountry } from './cities';
import { WorldEvent, getWorldSimulation } from './worldSimulation';

// =============================================================================
// LIFE EVENT TYPES
// =============================================================================

export type LifeEventType =
  | 'relocated'           // Moved to different city
  | 'left_country'        // Left the country entirely
  | 'arrested'            // Taken into custody
  | 'released'            // Released from custody
  | 'injured'             // Got hurt (non-combat)
  | 'recovered'           // Recovered from injury
  | 'promoted'            // Improved status
  | 'demoted'             // Lost status
  | 'betrayed'            // Turned on allies
  | 'compromised'         // Cover blown
  | 'retired'             // Left their profession
  | 'died'                // Natural death, accident, or killed
  | 'returned'            // Spared enemy returned
  | 'upgraded'            // Enemy got stronger
  | 'recruited'           // Joined an organization
  | 'fired'               // Kicked from organization
  | 'married'             // Life event
  | 'divorced';           // Life event

export interface LifeEvent {
  id: string;
  npcId: string;
  npcName: string;
  type: LifeEventType;
  timestamp: number;
  description: string;
  details?: string;

  // Effects on NPC
  newLocation?: { city: string; country: string };
  statusChange?: string;
  isReversible: boolean;

  // For news generation
  isNewsworthy: boolean;
  newsCategory?: string;
}

// =============================================================================
// EVENT PROBABILITIES
// =============================================================================

/**
 * Daily probability of life events (per NPC)
 * These are LOW - most NPCs have quiet lives
 */
const EVENT_PROBABILITIES: Record<LifeEventType, {
  baseChance: number;  // Per day probability (0-1)
  conditions?: (npc: NPCEntity) => boolean;
}> = {
  relocated: {
    baseChance: 0.002,  // ~0.7% per year
  },
  left_country: {
    baseChance: 0.0005, // ~0.2% per year
    conditions: (npc) => npc.role !== 'authority', // Officials stay put
  },
  arrested: {
    baseChance: 0.001,
    conditions: (npc) => npc.role === 'criminal' || npc.role === 'mercenary',
  },
  released: {
    baseChance: 0.1,    // Quick release once arrested
    conditions: (npc) => (npc as any).isArrested === true,
  },
  injured: {
    baseChance: 0.001,
    conditions: (npc) => !npc.isHospitalized,
  },
  recovered: {
    baseChance: 0.05,   // Recovery happens
    conditions: (npc) => npc.isHospitalized,
  },
  promoted: {
    baseChance: 0.0005,
    conditions: (npc) => npc.role === 'authority' || npc.role === 'mercenary',
  },
  demoted: {
    baseChance: 0.0003,
    conditions: (npc) => npc.role === 'authority',
  },
  betrayed: {
    baseChance: 0.0001,
    conditions: (npc) => npc.role === 'contact' || npc.role === 'criminal',
  },
  compromised: {
    baseChance: 0.0005,
    conditions: (npc) => npc.role === 'contact',
  },
  retired: {
    baseChance: 0.0002,
    conditions: (npc) => npc.age >= 50,
  },
  died: {
    baseChance: 0.00005,
    conditions: (npc) => npc.age >= 40 || npc.role === 'criminal',
  },
  returned: {
    baseChance: 0.01,
    conditions: (npc) => npc.timesSpared > 0 && !npc.isHospitalized,
  },
  upgraded: {
    baseChance: 0.005,
    conditions: (npc) => npc.timesSpared >= 2,
  },
  recruited: {
    baseChance: 0.0002,
    conditions: (npc) => npc.role === 'civilian',
  },
  fired: {
    baseChance: 0.0001,
    conditions: (npc) => npc.isEmployed,
  },
  married: {
    baseChance: 0.0001,
    conditions: (npc) => npc.age >= 22 && npc.age <= 50,
  },
  divorced: {
    baseChance: 0.00005,
    conditions: (npc) => npc.age >= 25,
  },
};

// =============================================================================
// EVENT GENERATION
// =============================================================================

/**
 * Process life events for all NPCs
 * Called daily by the time system
 */
export function processLifeEvents(): LifeEvent[] {
  const npcManager = getNPCManager();
  const timeEngine = getTimeEngine();
  const timestamp = timeEngine.getTime().totalHours;

  const events: LifeEvent[] = [];
  const allNPCs = npcManager.getAllNPCs();

  for (const npc of allNPCs) {
    if (!npc.isAlive || !npc.isActive) continue;

    // Check each event type
    for (const [eventType, config] of Object.entries(EVENT_PROBABILITIES)) {
      // Check conditions
      if (config.conditions && !config.conditions(npc)) continue;

      // Roll for event
      if (Math.random() < config.baseChance) {
        const event = generateLifeEvent(npc, eventType as LifeEventType, timestamp);
        if (event) {
          events.push(event);

          // Apply event effects
          applyLifeEventEffect(npc, event);

          // Only one event per NPC per day
          break;
        }
      }
    }
  }

  return events;
}

/**
 * Generate a specific life event
 */
function generateLifeEvent(
  npc: NPCEntity,
  type: LifeEventType,
  timestamp: number
): LifeEvent | null {
  const event: LifeEvent = {
    id: `event_${npc.id}_${timestamp}_${type}`,
    npcId: npc.id,
    npcName: npc.name,
    type,
    timestamp,
    description: '',
    isReversible: false,
    isNewsworthy: false,
  };

  switch (type) {
    case 'relocated': {
      const cities = getCitiesInCountry(npc.homeCountry);
      const newCity = cities[Math.floor(Math.random() * cities.length)];
      if (!newCity || newCity.name === npc.currentCity) return null;

      event.description = `${npc.name} relocated to ${newCity.name}`;
      event.newLocation = { city: newCity.name, country: npc.homeCountry };
      event.isReversible = true;
      break;
    }

    case 'left_country': {
      const countries = getCountries();
      const newCountry = countries[Math.floor(Math.random() * countries.length)];
      if (newCountry.code === npc.currentCountry) return null;

      const newCities = getCitiesInCountry(newCountry.code);
      const newCity = newCities[Math.floor(Math.random() * newCities.length)];
      if (!newCity) return null;

      event.description = `${npc.name} left the country for ${newCountry.name}`;
      event.newLocation = { city: newCity.name, country: newCountry.code };
      event.isNewsworthy = npc.relationship !== 'unknown';
      break;
    }

    case 'arrested':
      event.description = `${npc.name} was arrested by authorities`;
      event.statusChange = 'arrested';
      event.isReversible = true;
      event.isNewsworthy = npc.threatLevel !== 'alpha';
      break;

    case 'released':
      event.description = `${npc.name} was released from custody`;
      event.statusChange = 'free';
      event.isReversible = false;
      break;

    case 'injured':
      event.description = `${npc.name} was injured in an incident`;
      event.statusChange = 'hospitalized';
      event.isReversible = true;
      break;

    case 'recovered':
      event.description = `${npc.name} recovered from their injuries`;
      event.statusChange = 'healthy';
      event.isReversible = false;
      break;

    case 'promoted':
      event.description = `${npc.name} received a promotion`;
      event.details = 'Improved standing and capabilities';
      event.isReversible = false;
      break;

    case 'demoted':
      event.description = `${npc.name} was demoted`;
      event.details = 'Reduced standing';
      event.isReversible = false;
      break;

    case 'betrayed':
      event.description = `${npc.name} betrayed their associates`;
      event.isNewsworthy = true;
      break;

    case 'compromised':
      event.description = `${npc.name}'s cover was blown`;
      event.statusChange = 'compromised';
      event.isNewsworthy = npc.role === 'contact';
      break;

    case 'retired':
      event.description = `${npc.name} retired from active work`;
      event.statusChange = 'retired';
      event.isReversible = false;
      break;

    case 'died': {
      const causes = ['accident', 'illness', 'unknown circumstances'];
      const cause = causes[Math.floor(Math.random() * causes.length)];
      event.description = `${npc.name} died from ${cause}`;
      event.statusChange = 'dead';
      event.isReversible = false;
      event.isNewsworthy = npc.relationship !== 'unknown';
      break;
    }

    case 'returned':
      event.description = `${npc.name} has returned, seeking revenge`;
      event.isNewsworthy = true;
      break;

    case 'upgraded':
      event.description = `${npc.name} has grown stronger`;
      event.details = 'Stats improved from experience';
      break;

    case 'recruited':
      event.description = `${npc.name} was recruited by an organization`;
      event.statusChange = 'employed';
      break;

    case 'fired':
      event.description = `${npc.name} was let go from their position`;
      event.statusChange = 'unemployed';
      break;

    case 'married':
      event.description = `${npc.name} got married`;
      event.isReversible = false;
      break;

    case 'divorced':
      event.description = `${npc.name} got divorced`;
      event.isReversible = false;
      break;
  }

  return event;
}

/**
 * Apply life event effects to NPC
 */
function applyLifeEventEffect(npc: NPCEntity, event: LifeEvent): void {
  const npcManager = getNPCManager();

  switch (event.type) {
    case 'relocated':
    case 'left_country':
      if (event.newLocation) {
        npc.currentCity = event.newLocation.city;
        npc.currentCountry = event.newLocation.country;
      }
      break;

    case 'arrested':
      (npc as any).isArrested = true;
      npc.isActive = false; // Temporarily unavailable
      break;

    case 'released':
      (npc as any).isArrested = false;
      npc.isActive = true;
      break;

    case 'injured':
      npc.isHospitalized = true;
      npc.currentHealth = Math.floor(npc.maxHealth * 0.3);
      break;

    case 'recovered':
      npc.isHospitalized = false;
      npc.currentHealth = npc.maxHealth;
      npc.injuries = [];
      break;

    case 'promoted':
      // Boost stats slightly
      npc.stats.INT += 2;
      npc.stats.CON += 2;
      break;

    case 'demoted':
      npc.stats.INT = Math.max(5, npc.stats.INT - 2);
      npc.stats.CON = Math.max(5, npc.stats.CON - 2);
      break;

    case 'compromised':
      // Contact becomes unreliable
      const contactManager = getContactManager();
      const contact = contactManager.getContact(npc.id);
      if (contact) {
        contact.isCompromised = true;
        contact.burnRisk = Math.min(100, contact.burnRisk + 30);
      }
      break;

    case 'retired':
      npc.isActive = false;
      npc.isEmployed = false;
      break;

    case 'died':
      npc.isAlive = false;
      npc.isActive = false;
      break;

    case 'returned':
    case 'upgraded':
      // Spared enemy gets stronger
      const statKeys = ['MEL', 'AGL', 'STR', 'STA', 'INT', 'INS', 'CON'] as const;
      for (const stat of statKeys) {
        npc.stats[stat] += Math.floor(Math.random() * 3) + 1;
      }
      npc.levelUps++;
      break;

    case 'recruited':
      npc.isEmployed = true;
      npc.role = Math.random() < 0.5 ? 'authority' : 'criminal';
      break;

    case 'fired':
      npc.isEmployed = false;
      npc.employer = undefined;
      break;
  }

  // Update NPC
  npc.lastUpdated = event.timestamp;
  npcManager.updateNPC(npc);
}

// =============================================================================
// LIFE EVENT MANAGER
// =============================================================================

let lifeEventManagerInstance: LifeEventManager | null = null;

export class LifeEventManager {
  private eventHistory: LifeEvent[] = [];
  private started: boolean = false;

  start(): void {
    if (this.started) return;
    this.started = true;

    const timeEngine = getTimeEngine();

    // Process life events daily
    timeEngine.on('day_change', () => {
      const events = processLifeEvents();
      this.eventHistory.push(...events);

      // Keep last 100 events
      if (this.eventHistory.length > 100) {
        this.eventHistory = this.eventHistory.slice(-100);
      }
    });
  }

  /**
   * Get recent life events
   */
  getRecentEvents(count: number = 20): LifeEvent[] {
    return this.eventHistory.slice(-count).reverse();
  }

  /**
   * Get events for specific NPC
   */
  getEventsForNPC(npcId: string): LifeEvent[] {
    return this.eventHistory.filter(e => e.npcId === npcId);
  }

  /**
   * Get newsworthy events
   */
  getNewsworthyEvents(): LifeEvent[] {
    return this.eventHistory.filter(e => e.isNewsworthy);
  }

  /**
   * Manually trigger an event
   */
  triggerEvent(npc: NPCEntity, type: LifeEventType): LifeEvent | null {
    const timeEngine = getTimeEngine();
    const timestamp = timeEngine.getTime().totalHours;

    const event = generateLifeEvent(npc, type, timestamp);
    if (event) {
      applyLifeEventEffect(npc, event);
      this.eventHistory.push(event);
    }
    return event;
  }
}

export function getLifeEventManager(): LifeEventManager {
  if (!lifeEventManagerInstance) {
    lifeEventManagerInstance = new LifeEventManager();
  }
  return lifeEventManagerInstance;
}

// =============================================================================
// EXPORTS
// =============================================================================

export default {
  processLifeEvents,
  getLifeEventManager,
};
