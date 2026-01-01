/**
 * Death Consequences System
 *
 * JA2-style death handling with real emotional weight:
 * - Funeral decisions (pay, attend, skip)
 * - Family notifications and reactions
 * - Team morale impact
 * - News generation
 * - Memorial/legacy effects
 *
 * When someone dies, it MATTERS.
 */

import { NPCEntity, getNPCManager, NPCRole } from './npcSystem';
import { getMercenaryPoolManager, MercenaryContract } from './mercenaryPool';
import { getTimeEngine } from './timeEngine';
import { getCountryByCode } from './countries';
import { getLifeEventManager } from './npcLifeEvents';

// ============================================================================
// TYPES
// ============================================================================

export type DeathCause =
  | 'combat_killed'       // Killed in combat by enemy
  | 'combat_friendly'     // Friendly fire
  | 'combat_explosion'    // Explosion/grenade
  | 'combat_bleeding'     // Bled out
  | 'execution'           // Executed after surrender
  | 'accident'            // Non-combat accident
  | 'illness'             // Disease/sickness
  | 'old_age'             // Natural causes
  | 'assassination'       // Targeted killing
  | 'suicide'             // Self-inflicted
  | 'unknown';            // Unknown circumstances

export type FuneralType =
  | 'full_honors'         // Military/hero funeral - $5000, max morale recovery
  | 'standard'            // Normal funeral - $2000, good morale recovery
  | 'simple'              // Basic burial - $500, minimal morale recovery
  | 'cremation'           // Cremation - $300, some morale recovery
  | 'skip'                // No funeral - free, morale penalty
  | 'mass_grave'          // War casualty - free, severe morale penalty
  | 'send_home';          // Return body to family - $1000 + transport

export interface DeathRecord {
  id: string;
  npcId: string;
  npcName: string;
  timestamp: number;
  cause: DeathCause;
  location: { city: string; country: string; sector?: string };
  killedBy?: string;       // Who killed them (if combat)
  weapon?: string;         // Weapon used
  wasPlayerMerc: boolean;
  wasAlly: boolean;
  wasEnemy: boolean;

  // Death details
  lastWords?: string;
  witnessedBy: string[];   // NPCs who saw it

  // Post-death handling
  funeralType?: FuneralType;
  funeralCost?: number;
  funeralAttended?: boolean;
  bodyReturned?: boolean;

  // Family
  hasFamily: boolean;
  familyNotified: boolean;
  familyReaction?: 'grateful' | 'angry' | 'neutral' | 'devastated';

  // Impact
  teamMoraleImpact: number;
  newsGenerated: boolean;
  memorialCreated: boolean;
}

export interface FuneralOption {
  type: FuneralType;
  name: string;
  description: string;
  cost: number;
  moraleRecovery: number;     // -100 to +100
  familyReaction: 'grateful' | 'angry' | 'neutral';
  timeRequired: number;        // Hours
  requiresAttendance: boolean;
}

export interface DeathNotification {
  id: string;
  deathRecordId: string;
  npcName: string;
  message: string;
  options: FuneralOption[];
  expiresAt: number;           // Must decide by this time
  isUrgent: boolean;
  imageUrl?: string;
}

export interface MoraleEffect {
  characterId: string;
  delta: number;
  reason: string;
  duration: number;            // Hours until it fades
}

// ============================================================================
// FUNERAL OPTIONS
// ============================================================================

export const FUNERAL_OPTIONS: FuneralOption[] = [
  {
    type: 'full_honors',
    name: 'Full Military Honors',
    description: 'A hero\'s farewell with flag-draped casket, honor guard, and 21-gun salute. Your team will remember this.',
    cost: 5000,
    moraleRecovery: 50,
    familyReaction: 'grateful',
    timeRequired: 48,
    requiresAttendance: true,
  },
  {
    type: 'standard',
    name: 'Standard Funeral',
    description: 'A proper funeral service with burial. Dignified and respectful.',
    cost: 2000,
    moraleRecovery: 30,
    familyReaction: 'grateful',
    timeRequired: 24,
    requiresAttendance: true,
  },
  {
    type: 'send_home',
    name: 'Return to Family',
    description: 'Ship the body home to their family. They\'ll handle arrangements.',
    cost: 1000,
    moraleRecovery: 20,
    familyReaction: 'grateful',
    timeRequired: 12,
    requiresAttendance: false,
  },
  {
    type: 'simple',
    name: 'Simple Burial',
    description: 'A basic graveside service. Quick and affordable.',
    cost: 500,
    moraleRecovery: 10,
    familyReaction: 'neutral',
    timeRequired: 6,
    requiresAttendance: false,
  },
  {
    type: 'cremation',
    name: 'Cremation',
    description: 'Cremation with ashes given to family or scattered.',
    cost: 300,
    moraleRecovery: 5,
    familyReaction: 'neutral',
    timeRequired: 4,
    requiresAttendance: false,
  },
  {
    type: 'skip',
    name: 'No Funeral',
    description: 'Skip the formalities. The mission continues.',
    cost: 0,
    moraleRecovery: -30,
    familyReaction: 'angry',
    timeRequired: 0,
    requiresAttendance: false,
  },
  {
    type: 'mass_grave',
    name: 'Mass Grave',
    description: 'War casualty burial. No ceremony, no dignity.',
    cost: 0,
    moraleRecovery: -50,
    familyReaction: 'devastated',
    timeRequired: 0,
    requiresAttendance: false,
  },
];

// ============================================================================
// LAST WORDS TEMPLATES
// ============================================================================

const LAST_WORDS: string[] = [
  "Tell my family... I love them...",
  "Did we... did we win?",
  "I knew the risks...",
  "Don't let this be for nothing...",
  "It's getting cold...",
  "Promise me you'll finish this...",
  "I always knew... it would end like this...",
  "Take care of the team...",
  "No regrets...",
  "Watch your back out there...",
  "The mission... complete the mission...",
  "I... I can't feel anything...",
  "Thank you... for everything...",
  "Remember me...",
  "It was an honor...",
];

/**
 * Generate last words based on character personality
 */
function generateLastWords(npc: NPCEntity): string | undefined {
  // 60% chance of last words
  if (Math.random() > 0.6) return undefined;

  // TODO: Could be MBTI-based for more personality
  return LAST_WORDS[Math.floor(Math.random() * LAST_WORDS.length)];
}

// ============================================================================
// MORALE CALCULATION
// ============================================================================

/**
 * Calculate morale impact on surviving team members
 */
export function calculateMoraleImpact(
  deceased: NPCEntity,
  survivors: NPCEntity[],
  funeralType: FuneralType
): MoraleEffect[] {
  const effects: MoraleEffect[] = [];
  const funeralOption = FUNERAL_OPTIONS.find(f => f.type === funeralType)!;

  for (const survivor of survivors) {
    // Base impact from death
    let impact = -20;

    // Relationship affects impact
    if (survivor.relationship === 'ally') {
      impact -= 15; // Allies hurt more
    }

    // Same calling = solidarity
    if (survivor.calling === deceased.calling) {
      impact -= 10;
    }

    // Funeral choice affects recovery
    impact += funeralOption.moraleRecovery;

    // MBTI affects grief response
    // Feelers (F) affected more than Thinkers (T)
    if (survivor.mbti?.includes('F')) {
      impact -= 10;
    }

    effects.push({
      characterId: survivor.id,
      delta: impact,
      reason: `${deceased.name}'s death`,
      duration: 168, // 1 week to process
    });
  }

  return effects;
}

// ============================================================================
// DEATH PROCESSING
// ============================================================================

/**
 * Process a character death with full consequences
 */
export function processCharacterDeath(
  npcId: string,
  cause: DeathCause,
  location: { city: string; country: string; sector?: string },
  killedBy?: string,
  weapon?: string,
  witnesses: string[] = []
): DeathRecord {
  const npcManager = getNPCManager();
  const mercManager = getMercenaryPoolManager();
  const timeEngine = getTimeEngine();
  const timestamp = timeEngine.getTime().totalHours;

  const npc = npcManager.getNPC(npcId);
  if (!npc) {
    throw new Error(`NPC ${npcId} not found`);
  }

  // Mark NPC as dead
  npc.isAlive = false;
  npc.isActive = false;
  npcManager.updateNPC(npc);

  // Check if player merc
  const playerMercs = mercManager.getPlayerMercs();
  const wasPlayerMerc = playerMercs.some(m => m.id === npcId);
  const wasAlly = npc.relationship === 'ally' || npc.relationship === 'friendly';
  const wasEnemy = npc.relationship === 'hostile' || npc.relationship === 'enemy';

  // Create death record
  const record: DeathRecord = {
    id: `death_${npcId}_${timestamp}`,
    npcId,
    npcName: npc.name,
    timestamp,
    cause,
    location,
    killedBy,
    weapon,
    wasPlayerMerc,
    wasAlly,
    wasEnemy,
    lastWords: generateLastWords(npc),
    witnessedBy: witnesses,
    hasFamily: Math.random() > 0.3, // 70% have family
    familyNotified: false,
    teamMoraleImpact: wasPlayerMerc ? -30 : (wasAlly ? -15 : 0),
    newsGenerated: false,
    memorialCreated: false,
  };

  // If player merc, process contract termination
  if (wasPlayerMerc) {
    mercManager.processMercCombat(npcId, {
      npcWon: false,
      npcKilled: true,
      playerSparedNPC: false,
      damageTaken: npc.maxHealth,
    });
  }

  // Trigger life event for news generation
  const lifeEventManager = getLifeEventManager();
  lifeEventManager.triggerEvent(npc, 'died');

  return record;
}

/**
 * Process funeral choice and apply effects
 */
export function processFuneralChoice(
  record: DeathRecord,
  funeralType: FuneralType,
  attended: boolean = false
): { cost: number; moraleEffects: MoraleEffect[] } {
  const option = FUNERAL_OPTIONS.find(f => f.type === funeralType)!;
  const mercManager = getMercenaryPoolManager();
  const npcManager = getNPCManager();

  // Update record
  record.funeralType = funeralType;
  record.funeralCost = option.cost;
  record.funeralAttended = attended;
  record.familyReaction = option.familyReaction;
  record.bodyReturned = funeralType === 'send_home';

  // Get surviving team members for morale
  const playerMercs = mercManager.getPlayerMercs();
  const deceased = npcManager.getNPC(record.npcId);

  let moraleEffects: MoraleEffect[] = [];
  if (deceased) {
    moraleEffects = calculateMoraleImpact(deceased, playerMercs, funeralType);
  }

  // Attendance bonus
  if (attended && option.requiresAttendance) {
    moraleEffects = moraleEffects.map(e => ({
      ...e,
      delta: e.delta + 10,
      reason: `${e.reason} (attended funeral)`,
    }));
  }

  return { cost: option.cost, moraleEffects };
}

// ============================================================================
// DEATH NOTIFICATION GENERATION
// ============================================================================

/**
 * Generate notification for player when someone dies
 */
export function generateDeathNotification(record: DeathRecord): DeathNotification {
  const timeEngine = getTimeEngine();
  const currentTime = timeEngine.getTime().totalHours;

  const causeText: Record<DeathCause, string> = {
    combat_killed: 'was killed in combat',
    combat_friendly: 'was killed by friendly fire',
    combat_explosion: 'died in an explosion',
    combat_bleeding: 'bled out from wounds',
    execution: 'was executed',
    accident: 'died in an accident',
    illness: 'died from illness',
    old_age: 'died of natural causes',
    assassination: 'was assassinated',
    suicide: 'took their own life',
    unknown: 'died under mysterious circumstances',
  };

  const message = record.wasPlayerMerc
    ? `${record.npcName} ${causeText[record.cause]} in ${record.location.city}. ` +
      `They served faithfully on your team. How do you wish to handle their remains?`
    : `${record.npcName} ${causeText[record.cause]}. ` +
      (record.wasAlly ? 'They were a trusted ally.' : 'They were known to you.');

  // Filter options based on circumstances
  let availableOptions = [...FUNERAL_OPTIONS];

  // Mass grave only in war zones or desperate situations
  if (record.cause !== 'combat_killed') {
    availableOptions = availableOptions.filter(o => o.type !== 'mass_grave');
  }

  // Full honors requires allied/friendly relationship
  if (!record.wasPlayerMerc && !record.wasAlly) {
    availableOptions = availableOptions.filter(o => o.type !== 'full_honors');
  }

  return {
    id: `notify_${record.id}`,
    deathRecordId: record.id,
    npcName: record.npcName,
    message,
    options: availableOptions,
    expiresAt: currentTime + 48, // 48 hours to decide
    isUrgent: record.wasPlayerMerc,
  };
}

// ============================================================================
// FAMILY SYSTEM
// ============================================================================

export interface FamilyMember {
  relationship: 'spouse' | 'parent' | 'child' | 'sibling';
  name: string;
  age: number;
  city: string;
  country: string;
}

/**
 * Generate family for a deceased NPC
 */
export function generateFamily(npc: NPCEntity): FamilyMember[] {
  const family: FamilyMember[] = [];

  // 40% have spouse
  if (npc.age >= 25 && Math.random() < 0.4) {
    family.push({
      relationship: 'spouse',
      name: `${npc.name}'s spouse`,
      age: npc.age + Math.floor((Math.random() - 0.5) * 10),
      city: npc.homeCity,
      country: npc.homeCountry,
    });
  }

  // 60% have parents (if under 60)
  if (npc.age < 60 && Math.random() < 0.6) {
    family.push({
      relationship: 'parent',
      name: `${npc.name}'s parent`,
      age: npc.age + 25 + Math.floor(Math.random() * 10),
      city: npc.homeCity,
      country: npc.homeCountry,
    });
  }

  // 30% have children (if over 25)
  if (npc.age >= 25 && Math.random() < 0.3) {
    const childAge = Math.min(npc.age - 18, Math.floor(Math.random() * 20));
    family.push({
      relationship: 'child',
      name: `${npc.name}'s child`,
      age: Math.max(1, childAge),
      city: npc.homeCity,
      country: npc.homeCountry,
    });
  }

  // 50% have siblings
  if (Math.random() < 0.5) {
    family.push({
      relationship: 'sibling',
      name: `${npc.name}'s sibling`,
      age: npc.age + Math.floor((Math.random() - 0.5) * 10),
      city: npc.homeCity,
      country: npc.homeCountry,
    });
  }

  return family;
}

/**
 * Notify family of death
 */
export function notifyFamily(
  record: DeathRecord,
  funeralType: FuneralType
): { reaction: string; reputation: number } {
  const option = FUNERAL_OPTIONS.find(f => f.type === funeralType)!;
  record.familyNotified = true;
  record.familyReaction = option.familyReaction;

  const reactions: Record<typeof option.familyReaction, string> = {
    grateful: `${record.npcName}'s family is grateful for the dignified send-off.`,
    neutral: `${record.npcName}'s family accepts the arrangements.`,
    angry: `${record.npcName}'s family is upset at how their loved one was treated.`,
    devastated: `${record.npcName}'s family is devastated and blames you for the callous handling.`,
  };

  const reputationChange: Record<typeof option.familyReaction, number> = {
    grateful: 5,
    neutral: 0,
    angry: -10,
    devastated: -25,
  };

  return {
    reaction: reactions[option.familyReaction],
    reputation: reputationChange[option.familyReaction],
  };
}

// ============================================================================
// DEATH CONSEQUENCES MANAGER
// ============================================================================

let deathManagerInstance: DeathConsequencesManager | null = null;

export class DeathConsequencesManager {
  private deathRecords: DeathRecord[] = [];
  private pendingNotifications: DeathNotification[] = [];
  private activeMoraleEffects: MoraleEffect[] = [];
  private started: boolean = false;

  start(): void {
    if (this.started) return;
    this.started = true;

    const timeEngine = getTimeEngine();

    // Process morale decay hourly
    timeEngine.on('hour_change', () => {
      this.processMoraleDecay();
    });

    // Expire old notifications daily
    timeEngine.on('day_change', () => {
      this.expireNotifications();
    });
  }

  /**
   * Record a death and generate notification
   */
  recordDeath(
    npcId: string,
    cause: DeathCause,
    location: { city: string; country: string; sector?: string },
    killedBy?: string,
    weapon?: string,
    witnesses: string[] = []
  ): { record: DeathRecord; notification: DeathNotification } {
    const record = processCharacterDeath(npcId, cause, location, killedBy, weapon, witnesses);
    this.deathRecords.push(record);

    const notification = generateDeathNotification(record);
    this.pendingNotifications.push(notification);

    return { record, notification };
  }

  /**
   * Handle player's funeral decision
   */
  handleFuneralDecision(
    deathRecordId: string,
    funeralType: FuneralType,
    attended: boolean = false
  ): { cost: number; moraleEffects: MoraleEffect[]; familyReaction: string } {
    const record = this.deathRecords.find(r => r.id === deathRecordId);
    if (!record) {
      throw new Error(`Death record ${deathRecordId} not found`);
    }

    const { cost, moraleEffects } = processFuneralChoice(record, funeralType, attended);
    const { reaction } = notifyFamily(record, funeralType);

    // Store morale effects
    this.activeMoraleEffects.push(...moraleEffects);

    // Remove pending notification
    this.pendingNotifications = this.pendingNotifications.filter(
      n => n.deathRecordId !== deathRecordId
    );

    return { cost, moraleEffects, familyReaction: reaction };
  }

  /**
   * Get pending death notifications
   */
  getPendingNotifications(): DeathNotification[] {
    return [...this.pendingNotifications];
  }

  /**
   * Get all death records
   */
  getDeathRecords(): DeathRecord[] {
    return [...this.deathRecords];
  }

  /**
   * Get deaths for player mercs
   */
  getPlayerMercDeaths(): DeathRecord[] {
    return this.deathRecords.filter(r => r.wasPlayerMerc);
  }

  /**
   * Get active morale effects
   */
  getActiveMoraleEffects(): MoraleEffect[] {
    return [...this.activeMoraleEffects];
  }

  /**
   * Process morale decay over time
   */
  private processMoraleDecay(): void {
    this.activeMoraleEffects = this.activeMoraleEffects
      .map(e => ({ ...e, duration: e.duration - 1 }))
      .filter(e => e.duration > 0);
  }

  /**
   * Expire old notifications
   */
  private expireNotifications(): void {
    const timeEngine = getTimeEngine();
    const currentTime = timeEngine.getTime().totalHours;

    this.pendingNotifications = this.pendingNotifications.filter(n => {
      if (n.expiresAt <= currentTime) {
        // Auto-select cheapest option if expired
        const record = this.deathRecords.find(r => r.id === n.deathRecordId);
        if (record && !record.funeralType) {
          this.handleFuneralDecision(n.deathRecordId, 'skip', false);
        }
        return false;
      }
      return true;
    });
  }
}

export function getDeathConsequencesManager(): DeathConsequencesManager {
  if (!deathManagerInstance) {
    deathManagerInstance = new DeathConsequencesManager();
  }
  return deathManagerInstance;
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  processCharacterDeath,
  processFuneralChoice,
  generateDeathNotification,
  generateFamily,
  notifyFamily,
  getDeathConsequencesManager,
  FUNERAL_OPTIONS,
};
