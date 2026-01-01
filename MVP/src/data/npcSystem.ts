/**
 * NPC System (NL-001)
 *
 * Persistent NPC entities that exist in the world with their own lives.
 * NPCs have full character sheets (stats, MBTI, callings, etc.)
 * and their state persists across game sessions.
 *
 * Key concept: NPCs are PEOPLE, not spawned enemies.
 * - They have homes (countries/cities)
 * - They age, level up, get injured, die
 * - They remember interactions with the player
 * - They can become contacts, enemies, or employees
 */

import {
  PrimaryStats,
  OriginType,
  ThreatLevel,
  CharacterType,
  ORIGIN_TYPES,
  THREAT_LEVELS,
  calculateDerivedStats,
} from './characterSheet';
import { CallingId, CALLINGS } from './callingSystem';
import { MBTIType, MBTI_TYPES } from './mbtiSystem';
import { Country } from './countries';
import { City } from './cities';
import { getTimeEngine } from './timeEngine';
import { generateName } from './nameDatabase';
import { getCharacterRegistryManager, CharacterFaction } from './worldSystems/characterRegistry';

// =============================================================================
// NPC TYPES
// =============================================================================

export type NPCRole =
  | 'mercenary'       // Can be hired for combat
  | 'contact'         // Provides information or services
  | 'enemy'           // Has fought player before
  | 'civilian'        // Regular person
  | 'authority'       // Police, military, government
  | 'criminal'        // Underworld member
  | 'superhuman';     // LSW individual

export type RelationshipStatus =
  | 'unknown'         // Never met
  | 'acquaintance'    // Brief interaction
  | 'contact'         // Regular business relationship
  | 'friend'          // Positive relationship
  | 'ally'            // Will help in combat
  | 'enemy'           // Active hostility
  | 'rival'           // Competitive but not hostile
  | 'nemesis';        // Deep personal hatred

// =============================================================================
// NPC ENTITY
// =============================================================================

export interface NPCEntity {
  id: string;
  name: string;
  nickname?: string;

  // Location (country-locked)
  homeCountry: string;    // ISO code - where they were born/live
  homeCity: string;       // City name
  currentCountry: string; // Where they are now
  currentCity: string;

  // Character sheet data
  stats: PrimaryStats;
  origin: OriginType;
  threatLevel: ThreatLevel;
  characterType: CharacterType;
  mbti: MBTIType;
  calling: CallingId;

  // Role and status
  role: NPCRole;
  isAlive: boolean;
  isActive: boolean;      // Still relevant to game
  age: number;
  gender: 'male' | 'female' | 'other';

  // Health state
  currentHealth: number;
  maxHealth: number;
  injuries: string[];
  isHospitalized: boolean;

  // Combat experience
  combatExperience: number;  // Total fights
  killCount: number;
  timesWounded: number;
  timesDefeated: number;

  // Relationship with player
  relationship: RelationshipStatus;
  opinion: number;           // -100 to +100
  trustLevel: number;        // 0 to 100
  fearLevel: number;         // 0 to 100
  respectLevel: number;      // 0 to 100

  // History
  interactions: NPCInteraction[];
  lastSeen?: number;         // Game timestamp
  firstMet?: number;         // Game timestamp

  // Employment (for mercenaries)
  isEmployed: boolean;
  employer?: string;         // Player or faction
  salary?: number;
  contractEnd?: number;      // Game timestamp

  // Intel (for contacts)
  intelSpecialty?: string;   // What they know about
  intelQuality: number;      // 0-100, how good their intel is
  intelCost?: number;        // Price per piece of intel

  // Leveling (for enemies that return)
  timesSpared: number;       // How many times player let them live
  levelUps: number;          // Stat improvements from surviving

  // Meta
  createdAt: number;         // Game timestamp
  lastUpdated: number;
}

export interface NPCInteraction {
  timestamp: number;
  type: 'combat' | 'conversation' | 'trade' | 'mission' | 'event';
  outcome: 'positive' | 'neutral' | 'negative';
  description: string;
  opinionChange: number;
}

// =============================================================================
// NPC GENERATION
// =============================================================================

/**
 * Generate a random NPC for a specific country/city
 */
export function generateNPC(
  country: Country,
  city: City,
  role: NPCRole,
  options: {
    threatLevel?: ThreatLevel;
    minAge?: number;
    maxAge?: number;
    forceMale?: boolean;
    forceFemale?: boolean;
  } = {}
): NPCEntity {
  const timeEngine = getTimeEngine();
  const timestamp = timeEngine.getTime().totalHours;

  // Generate basic identity
  const gender = options.forceMale ? 'male' :
    options.forceFemale ? 'female' :
    Math.random() < 0.5 ? 'male' : 'female';

  const name = generateName(country.code, gender);
  const age = Math.floor(Math.random() * ((options.maxAge ?? 55) - (options.minAge ?? 20))) + (options.minAge ?? 20);

  // Generate origin based on role and country
  const origin = generateOriginForRole(role, country);
  const originInfo = ORIGIN_TYPES[origin];

  // Determine threat level
  const threatLevel = options.threatLevel ?? generateThreatLevelForRole(role);
  const threatInfo = THREAT_LEVELS[threatLevel];

  // Generate stats with bonuses
  const baseStats = generateBaseStats(role, age);
  const stats = applyStatBonuses(baseStats, originInfo, threatInfo);

  // Generate personality
  const mbti = generateMBTIForRole(role);
  const calling = generateCallingForRole(role);

  // Calculate derived stats
  const derived = calculateDerivedStats(stats);

  const npc: NPCEntity = {
    id: `npc_${country.code}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name,
    homeCountry: country.code,
    homeCity: city.name,
    currentCountry: country.code,
    currentCity: city.name,

    stats,
    origin,
    threatLevel,
    characterType: originInfo.characterType,
    mbti,
    calling,

    role,
    isAlive: true,
    isActive: true,
    age,
    gender,

    currentHealth: derived.health,
    maxHealth: derived.health,
    injuries: [],
    isHospitalized: false,

    combatExperience: 0,
    killCount: 0,
    timesWounded: 0,
    timesDefeated: 0,

    relationship: 'unknown',
    opinion: 0,
    trustLevel: 0,
    fearLevel: 0,
    respectLevel: 0,

    interactions: [],

    isEmployed: false,

    intelQuality: Math.floor(Math.random() * 50) + 25,

    timesSpared: 0,
    levelUps: 0,

    createdAt: timestamp,
    lastUpdated: timestamp,
  };

  // Set role-specific defaults
  if (role === 'mercenary') {
    npc.salary = calculateMercenarySalary(stats, threatLevel, country);
  }

  if (role === 'contact') {
    npc.intelSpecialty = generateIntelSpecialty();
    npc.intelCost = Math.floor(Math.random() * 500) + 100;
  }

  return npc;
}

/**
 * Generate stats appropriate for role
 */
function generateBaseStats(role: NPCRole, age: number): PrimaryStats {
  // Base stats vary by role
  const baseRanges: Record<NPCRole, { min: number; max: number }> = {
    mercenary: { min: 15, max: 35 },
    contact: { min: 10, max: 25 },
    enemy: { min: 12, max: 30 },
    civilian: { min: 8, max: 18 },
    authority: { min: 15, max: 30 },
    criminal: { min: 12, max: 28 },
    superhuman: { min: 25, max: 50 },
  };

  const range = baseRanges[role] || { min: 10, max: 25 };

  // Age affects stats
  const agePenalty = age > 50 ? Math.floor((age - 50) / 5) : 0;
  const ageBonus = age > 30 && age <= 50 ? 3 : 0;

  function randomStat(): number {
    return Math.floor(Math.random() * (range.max - range.min)) + range.min - agePenalty + ageBonus;
  }

  return {
    MEL: randomStat(),
    AGL: randomStat(),
    STR: randomStat(),
    STA: randomStat(),
    INT: randomStat(),
    INS: randomStat(),
    CON: randomStat(),
  };
}

/**
 * Apply origin and threat level bonuses
 */
function applyStatBonuses(
  base: PrimaryStats,
  origin: typeof ORIGIN_TYPES[OriginType],
  threat: typeof THREAT_LEVELS[ThreatLevel]
): PrimaryStats {
  const result = { ...base };

  // Apply origin bonuses
  if (origin.statBonuses) {
    for (const [stat, bonus] of Object.entries(origin.statBonuses)) {
      if (stat in result) {
        (result as any)[stat] += bonus;
      }
    }
  }

  // Apply threat level bonus to all stats
  for (const stat of Object.keys(result)) {
    (result as any)[stat] += threat.statBonus;
  }

  return result;
}

/**
 * Generate origin appropriate for role
 */
function generateOriginForRole(role: NPCRole, country: Country): OriginType {
  if (role === 'superhuman') {
    const superhumanOrigins: OriginType[] = [
      'altered_human', 'tech_enhancement', 'mutated_human', 'spiritual',
      'symbiotic', 'scientific_weapon'
    ];
    return superhumanOrigins[Math.floor(Math.random() * superhumanOrigins.length)];
  }

  // Most NPCs are skilled humans
  if (Math.random() < 0.85) {
    return 'skilled_human';
  }

  // Small chance of enhanced origin based on country tech level
  if (country.scienceTechnology && country.scienceTechnology > 60) {
    if (Math.random() < 0.5) return 'tech_enhancement';
    return 'altered_human';
  }

  return 'skilled_human';
}

/**
 * Generate threat level for role
 */
function generateThreatLevelForRole(role: NPCRole): ThreatLevel {
  const distributions: Record<NPCRole, Record<ThreatLevel, number>> = {
    mercenary: { alpha: 0.6, level_1: 0.3, level_2: 0.08, level_3: 0.02, level_4: 0, level_5: 0, cosmic: 0 },
    contact: { alpha: 0.9, level_1: 0.08, level_2: 0.02, level_3: 0, level_4: 0, level_5: 0, cosmic: 0 },
    enemy: { alpha: 0.5, level_1: 0.35, level_2: 0.1, level_3: 0.04, level_4: 0.01, level_5: 0, cosmic: 0 },
    civilian: { alpha: 0.98, level_1: 0.02, level_2: 0, level_3: 0, level_4: 0, level_5: 0, cosmic: 0 },
    authority: { alpha: 0.7, level_1: 0.25, level_2: 0.04, level_3: 0.01, level_4: 0, level_5: 0, cosmic: 0 },
    criminal: { alpha: 0.6, level_1: 0.3, level_2: 0.08, level_3: 0.02, level_4: 0, level_5: 0, cosmic: 0 },
    superhuman: { alpha: 0, level_1: 0.3, level_2: 0.35, level_3: 0.25, level_4: 0.08, level_5: 0.02, cosmic: 0 },
  };

  const dist = distributions[role] || distributions.civilian;
  const roll = Math.random();
  let cumulative = 0;

  for (const [level, prob] of Object.entries(dist)) {
    cumulative += prob;
    if (roll <= cumulative) {
      return level as ThreatLevel;
    }
  }

  return 'alpha';
}

/**
 * Generate MBTI for role
 */
function generateMBTIForRole(role: NPCRole): MBTIType {
  const mbtiTypes: MBTIType[] = [
    'INTJ', 'INTP', 'ENTJ', 'ENTP',
    'INFJ', 'INFP', 'ENFJ', 'ENFP',
    'ISTJ', 'ISFJ', 'ESTJ', 'ESFJ',
    'ISTP', 'ISFP', 'ESTP', 'ESFP'
  ];

  // Bias certain types for certain roles
  const biases: Record<NPCRole, MBTIType[]> = {
    mercenary: ['ISTP', 'ESTP', 'ISTJ', 'ENTJ'],
    contact: ['ENFJ', 'ENTP', 'ESFJ', 'INFJ'],
    enemy: ['ENTJ', 'ESTP', 'INTJ', 'ISTP'],
    civilian: ['ISFJ', 'ESFJ', 'ISTJ', 'ESFP'],
    authority: ['ISTJ', 'ESTJ', 'ENTJ', 'INTJ'],
    criminal: ['ESTP', 'ISTP', 'ENTP', 'ENTJ'],
    superhuman: ['INTJ', 'ENFJ', 'INFJ', 'ENTJ'],
  };

  const biased = biases[role] || mbtiTypes;
  if (Math.random() < 0.6) {
    return biased[Math.floor(Math.random() * biased.length)];
  }
  return mbtiTypes[Math.floor(Math.random() * mbtiTypes.length)];
}

/**
 * Generate calling for role
 */
function generateCallingForRole(role: NPCRole): CallingId {
  const callingsByRole: Record<NPCRole, CallingId[]> = {
    mercenary: ['mercenary', 'professional', 'soldier', 'survivor', 'thrill_seeker'],
    contact: ['mercenary', 'reformer', 'seeker', 'professional'],
    enemy: ['conqueror', 'predator', 'mercenary', 'avenger', 'zealot'],
    civilian: ['guardian', 'professional', 'legacy', 'seeker'],
    authority: ['soldier', 'guardian', 'reformer', 'protector'],
    criminal: ['mercenary', 'conqueror', 'predator', 'thrill_seeker', 'nihilist'],
    superhuman: ['protector', 'avenger', 'liberator', 'idealist', 'born_to_it'],
  };

  const callings = callingsByRole[role] || ['professional'];
  return callings[Math.floor(Math.random() * callings.length)];
}

/**
 * Calculate mercenary salary based on stats
 */
function calculateMercenarySalary(
  stats: PrimaryStats,
  threatLevel: ThreatLevel,
  country: Country
): number {
  // Base salary calculation
  const statAvg = (stats.MEL + stats.AGL + stats.STR + stats.STA + stats.INT + stats.INS + stats.CON) / 7;

  const threatMultipliers: Record<ThreatLevel, number> = {
    alpha: 1,
    level_1: 1.5,
    level_2: 2.5,
    level_3: 5,
    level_4: 10,
    level_5: 25,
    cosmic: 100,
  };

  // Base = $100-500/day depending on stats
  const baseSalary = Math.floor(100 + (statAvg - 10) * 15);

  // Multiply by threat level
  const threatMult = threatMultipliers[threatLevel];

  // Adjust for country economy
  const economyMod = country.gdpPerCapita ? country.gdpPerCapita / 50 : 1;

  return Math.floor(baseSalary * threatMult * economyMod);
}

/**
 * Generate intel specialty
 */
function generateIntelSpecialty(): string {
  const specialties = [
    'gang_activity',
    'police_operations',
    'military_movements',
    'political_scandals',
    'corporate_secrets',
    'superhuman_sightings',
    'smuggling_routes',
    'safe_houses',
    'equipment_dealers',
    'target_locations',
  ];
  return specialties[Math.floor(Math.random() * specialties.length)];
}

// =============================================================================
// NPC STATE UPDATES
// =============================================================================

/**
 * Update NPC relationship based on interaction
 */
export function updateNPCRelationship(
  npc: NPCEntity,
  interaction: Omit<NPCInteraction, 'timestamp'>
): NPCEntity {
  const timeEngine = getTimeEngine();
  const timestamp = timeEngine.getTime().totalHours;

  const updated = { ...npc };

  // Record interaction
  updated.interactions.push({
    ...interaction,
    timestamp,
  });
  updated.lastUpdated = timestamp;

  // Update opinion
  updated.opinion = Math.max(-100, Math.min(100, updated.opinion + interaction.opinionChange));

  // Update relationship status based on opinion and trust
  if (updated.opinion >= 75 && updated.trustLevel >= 50) {
    updated.relationship = 'ally';
  } else if (updated.opinion >= 50) {
    updated.relationship = 'friend';
  } else if (updated.opinion >= 25) {
    updated.relationship = 'contact';
  } else if (updated.opinion >= -25) {
    updated.relationship = updated.interactions.length > 0 ? 'acquaintance' : 'unknown';
  } else if (updated.opinion >= -50) {
    updated.relationship = 'rival';
  } else if (updated.opinion >= -75) {
    updated.relationship = 'enemy';
  } else {
    updated.relationship = 'nemesis';
  }

  return updated;
}

/**
 * Process combat with NPC (they remember!)
 */
export function processNPCCombat(
  npc: NPCEntity,
  outcome: {
    npcWon: boolean;
    npcKilled: boolean;
    playerSparedNPC: boolean;
    damageTaken: number;
  }
): NPCEntity {
  const timeEngine = getTimeEngine();
  const timestamp = timeEngine.getTime().totalHours;

  const updated = { ...npc };
  updated.combatExperience++;
  updated.lastUpdated = timestamp;
  updated.lastSeen = timestamp;

  if (outcome.npcKilled) {
    updated.isAlive = false;
    updated.isActive = false;
    return updated;
  }

  // Track injuries
  if (outcome.damageTaken > 0) {
    updated.timesWounded++;
    updated.currentHealth = Math.max(0, updated.currentHealth - outcome.damageTaken);

    if (updated.currentHealth <= updated.maxHealth * 0.25) {
      updated.isHospitalized = true;
    }
  }

  // Player spared them - they remember!
  if (outcome.playerSparedNPC) {
    updated.timesSpared++;

    // Sparing creates complex feelings
    updated.respectLevel = Math.min(100, updated.respectLevel + 15);
    updated.fearLevel = Math.max(0, updated.fearLevel - 5);

    // May become less hostile
    updated.opinion = Math.min(100, updated.opinion + 10);

    // But they also level up for next time
    if (updated.timesSpared >= 2) {
      updated.levelUps++;
      // Increase one random stat
      const statKeys = ['MEL', 'AGL', 'STR', 'STA', 'INT', 'INS', 'CON'] as const;
      const randomStat = statKeys[Math.floor(Math.random() * statKeys.length)];
      updated.stats[randomStat] += 3 + updated.levelUps;
    }
  }

  if (!outcome.npcWon) {
    updated.timesDefeated++;
    updated.fearLevel = Math.min(100, updated.fearLevel + 20);
  } else {
    updated.respectLevel = Math.max(0, updated.respectLevel - 10);
  }

  // Record the combat
  updated.interactions.push({
    timestamp,
    type: 'combat',
    outcome: outcome.npcWon ? 'positive' : 'negative',
    description: outcome.playerSparedNPC ?
      'Defeated but spared by player' :
      outcome.npcWon ? 'Defeated the player' : 'Defeated by player',
    opinionChange: outcome.playerSparedNPC ? 10 : -15,
  });

  return updated;
}

/**
 * Apply time-based recovery
 */
export function processNPCRecovery(
  npc: NPCEntity,
  hoursElapsed: number
): NPCEntity {
  if (!npc.isAlive || !npc.isHospitalized) return npc;

  const updated = { ...npc };

  // Heal over time (roughly 10% per day)
  const healPerHour = updated.maxHealth * 0.004;
  updated.currentHealth = Math.min(
    updated.maxHealth,
    updated.currentHealth + healPerHour * hoursElapsed
  );

  // Leave hospital when above 50%
  if (updated.currentHealth >= updated.maxHealth * 0.5) {
    updated.isHospitalized = false;
  }

  return updated;
}

// =============================================================================
// NPC MANAGER SINGLETON
// =============================================================================

let npcManagerInstance: NPCManager | null = null;

export class NPCManager {
  private npcs: Map<string, NPCEntity> = new Map();
  private started: boolean = false;

  start(): void {
    if (this.started) return;
    this.started = true;

    // Subscribe to time for recovery
    const timeEngine = getTimeEngine();
    timeEngine.on('hour_change', () => {
      this.processHourlyUpdates();
    });
  }

  private processHourlyUpdates(): void {
    for (const [id, npc] of this.npcs) {
      if (npc.isHospitalized) {
        this.npcs.set(id, processNPCRecovery(npc, 1));
      }
    }
  }

  addNPC(npc: NPCEntity): void {
    this.npcs.set(npc.id, npc);

    // Also register in the global character registry
    const charRegistry = getCharacterRegistryManager();
    charRegistry.register({
      name: npc.name,
      codename: npc.nickname,
      faction: this.mapRoleToFaction(npc.role),
      status: npc.isAlive ? (npc.isHospitalized ? 'injured' : 'alive') : 'dead',
      lastKnownLocation: npc.currentCity,
      homeBase: npc.homeCountry,
      isImportant: npc.threatLevel === 'legendary' || npc.threatLevel === 'elite',
    });
  }

  /**
   * Map NPC role to character registry faction
   */
  private mapRoleToFaction(role: NPCRole): CharacterFaction {
    switch (role) {
      case 'mercenary': return 'ally';
      case 'contact': return 'neutral';
      case 'enemy': return 'hostile';
      case 'civilian': return 'neutral';
      case 'authority': return 'government';
      case 'criminal': return 'criminal';
      case 'superhuman': return 'neutral';
      default: return 'neutral';
    }
  }

  getNPC(id: string): NPCEntity | undefined {
    return this.npcs.get(id);
  }

  updateNPC(npc: NPCEntity): void {
    this.npcs.set(npc.id, npc);
  }

  removeNPC(id: string): void {
    this.npcs.delete(id);
  }

  /**
   * Get all NPCs in a country
   */
  getNPCsInCountry(countryCode: string): NPCEntity[] {
    return Array.from(this.npcs.values())
      .filter(npc => npc.currentCountry === countryCode && npc.isActive);
  }

  /**
   * Get all NPCs in a city
   */
  getNPCsInCity(cityName: string): NPCEntity[] {
    return Array.from(this.npcs.values())
      .filter(npc => npc.currentCity === cityName && npc.isActive);
  }

  /**
   * Get NPCs by role
   */
  getNPCsByRole(role: NPCRole, countryCode?: string): NPCEntity[] {
    return Array.from(this.npcs.values())
      .filter(npc =>
        npc.role === role &&
        npc.isActive &&
        npc.isAlive &&
        (!countryCode || npc.currentCountry === countryCode)
      );
  }

  /**
   * Get NPCs by relationship
   */
  getNPCsByRelationship(status: RelationshipStatus): NPCEntity[] {
    return Array.from(this.npcs.values())
      .filter(npc => npc.relationship === status && npc.isActive && npc.isAlive);
  }

  /**
   * Find returning enemies (spared NPCs that level up)
   */
  getReturningEnemies(): NPCEntity[] {
    return Array.from(this.npcs.values())
      .filter(npc =>
        npc.timesSpared > 0 &&
        npc.isAlive &&
        npc.isActive &&
        !npc.isHospitalized &&
        npc.relationship !== 'ally' &&
        npc.relationship !== 'friend'
      );
  }

  /**
   * Get all NPCs as array
   */
  getAllNPCs(): NPCEntity[] {
    return Array.from(this.npcs.values());
  }
}

export function getNPCManager(): NPCManager {
  if (!npcManagerInstance) {
    npcManagerInstance = new NPCManager();
  }
  return npcManagerInstance;
}

// =============================================================================
// EXPORTS
// =============================================================================

export default {
  generateNPC,
  updateNPCRelationship,
  processNPCCombat,
  processNPCRecovery,
  getNPCManager,
};
