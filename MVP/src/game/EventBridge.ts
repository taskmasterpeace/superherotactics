/**
 * EventBridge - Communication layer between React and Phaser
 *
 * Usage:
 * - React → Phaser: EventBridge.emit('event-name', data)
 * - Phaser → React: EventBridge.on('event-name', callback)
 */

import { Country } from '../data/countries';
import { City } from '../data/cities';

type EventCallback = (data: any) => void;

// ============================================================================
// LOCATION CONTEXT - Used for enemy generation
// ============================================================================

/**
 * Location context for combat generation.
 * Passed from strategic layer to tactical layer.
 */
export interface LocationContext {
  country: Country;
  city: City;
  missionType: 'investigation' | 'assault' | 'defense' | 'rescue' | 'sabotage' | 'extraction';
}

class EventBridgeClass {
  private listeners: Map<string, Set<EventCallback>> = new Map();

  /**
   * Subscribe to an event
   */
  on(event: string, callback: EventCallback): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);

    // Return unsubscribe function
    return () => {
      this.listeners.get(event)?.delete(callback);
    };
  }

  /**
   * Unsubscribe from an event
   */
  off(event: string, callback: EventCallback): void {
    this.listeners.get(event)?.delete(callback);
  }

  /**
   * Emit an event with optional data
   */
  emit(event: string, data?: any): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`EventBridge error in ${event}:`, error);
        }
      });
    }
  }

  /**
   * Remove all listeners for an event
   */
  removeAllListeners(event?: string): void {
    if (event) {
      this.listeners.delete(event);
    } else {
      this.listeners.clear();
    }
  }
}

// Singleton instance
export const EventBridge = new EventBridgeClass();

// Character data from game store
export interface CombatCharacter {
  id: string;
  name: string;
  realName?: string;
  team: 'blue' | 'red';
  stats: {
    MEL: number;
    AGL: number;
    STR: number;
    STA: number;
    INT: number;
    INS: number;
    CON: number;
  };
  health: { current: number; maximum: number };
  powers: string[];
  equipment: string[];
  threatLevel?: string;
  origin?: string;
  // Shield system - absorbs damage before HP
  shield?: number;
  maxShield?: number;
  shieldRegen?: number;
  // Armor (DR) - reduces incoming damage
  dr?: number;
  // Armor stopping power - blocks damage completely if damage <= SP
  stoppingPower?: number;
  // Equipped armor info
  equippedArmor?: string;
  equippedShield?: string;
  // Character calling (motivation) - affects combat bonuses
  calling?: string;
  // EG2-003/EG2-004: Faction AI behavior flags
  tacticsLevel?: 'untrained' | 'street' | 'trained' | 'professional' | 'elite';
  behavior?: {
    usesGrenades: boolean;
    usesFlanking: boolean;
    usesOverwatch: boolean;
    retreatsWhenOutnumbered: boolean;
    executesWounded: boolean;
    takesHostages: boolean;
  };
}

// Event type definitions for TypeScript
export interface CombatEvents {
  // React → Phaser
  'load-combat': {
    blueTeam: CombatCharacter[];
    // redTeam is now optional - enemies can be generated from locationContext
    redTeam?: CombatCharacter[];
    mapId?: string;
    cityType?: string;
    // NEW: Location context for enemy generation
    locationContext?: LocationContext;
  };
  'select-unit': { unitId: string };
  'start-move-mode': { unitId: string };
  'start-attack-mode': { unitId: string; weaponId: string };
  'start-throw-mode': { unitId: string; itemId: string };
  'activate-power': { unitId: string; powerId: string };
  'execute-action': ActionPayload;
  'cancel-action': void;
  'end-turn': void;
  'toggle-gadget': { gadgetId: string; state: boolean };
  'set-gadget-intensity': { gadgetId: string; value: number };
  'set-gadget-mode': { gadgetId: string; mode: string };
  'deploy-gadget': { gadgetId: string; x: number; y: number };
  'control-drone': { droneId: string };
  'recall-drone': { droneId: string };

  // Phaser → React
  'unit-selected': UnitData;
  'unit-moved': { unitId: string; from: Position; to: Position; apRemaining: number };
  'attack-resolved': AttackResult;
  'unit-damaged': { unitId: string; damage: number; newHp: number };
  'unit-died': { unitId: string; killedBy: string };
  'turn-changed': { team: string; round: number };
  'tile-clicked': { x: number; y: number; terrain: string; occupant: string | null };
  'action-cancelled': void;
  'combat-started': { mapId: string; teams: string[] };
  'combat-ended': CombatResult;
  'combat-stats': CombatStatsEvent;
  'log-entry': LogEntry;
}

// Supporting types
export interface Position {
  x: number;
  y: number;
}

export interface ActionPayload {
  type: 'move' | 'attack' | 'throw' | 'use-item' | 'overwatch' | 'deploy';
  unitId: string;
  targetId?: string;
  targetPosition?: Position;
  itemId?: string;
  weaponId?: string;
}

export interface PowerData {
  id: string;
  name: string;
  emoji: string;
  apCost: number;
  cooldown: number;
  currentCooldown: number;
  description: string;
  // Power categories
  role?: 'offense' | 'defense' | 'mobility' | 'support' | 'control' | 'utility';
  type?: 'psionic' | 'elemental' | 'physical' | 'spatial' | 'temporal' | 'tech' | 'bio' | 'nature' | 'cosmic' | 'symbiotic';
  manifest?: 'beam' | 'blast' | 'touch' | 'aura' | 'zone' | 'self' | 'target' | 'summon' | 'portal';
}

export interface UnitData {
  id: string;
  name: string;
  team: string;
  hp: number;
  maxHp: number;
  ap: number;
  maxAp: number;
  position: Position;
  facing: string;
  statusEffects: string[];
  isInCover: 'none' | 'half' | 'full';
  powers?: PowerData[];
}

export interface AttackResult {
  attackerId: string;
  targetId: string;
  hit: boolean;
  damage: number;
  criticalHit: boolean;
  statusApplied: string[];
}

export interface CombatResult {
  winner: string;
  rounds: number;
  casualties: { team: string; unitId: string }[];
  survivingUnits: { team: string; unitId: string; hp: number }[];
}

// Enhanced combat result for strategic layer integration
export interface EnhancedCombatResult {
  victory: boolean; // Did player team (blue) win?
  winner: 'blue' | 'red';
  rounds: number;
  timeElapsed: number; // Minutes of game time elapsed

  // Character outcomes
  casualties: Array<{
    characterId: string;
    characterName: string;
    status: 'dead' | 'unconscious';
    killedBy?: string;
  }>;

  injuries: Array<{
    characterId: string;
    characterName: string;
    bodyPart: string;
    severity: 'LIGHT' | 'MODERATE' | 'SEVERE' | 'PERMANENT' | 'FATAL';
    description: string;
    healingTime?: number; // Days to recover
    permanent: boolean;
  }>;

  survivors: Array<{
    characterId: string;
    characterName: string;
    currentHp: number;
    maxHp: number;
    damageDealt: number;
    damageTaken: number;
    kills: number;
  }>;

  // Rewards
  experienceGained: Array<{
    characterId: string;
    characterName: string;
    xp: number;
    reason: string; // 'survival', 'kill', 'damage', 'victory'
  }>;

  lootGained: Array<{
    itemId: string;
    itemName: string;
    itemType: 'weapon' | 'armor' | 'gadget' | 'consumable';
    quantity: number;
  }>;

  // Fame and reputation
  fameChange: number;
  publicOpinionChange?: Record<string, number>; // Country code -> opinion shift

  // Mission context
  missionLocation?: {
    sector: string;
    city: string;
    country: string;
  };

  // Combat statistics summary
  totalDamageDealt: number;
  totalDamageTaken: number;
  accuracyRate: number; // Hits / shots

  collateralDamage?: number; // Property damage estimate
  civilianCasualties?: number;
}

export interface LogEntry {
  id: string;
  timestamp: number;
  type: 'attack' | 'move' | 'damage' | 'status' | 'death' | 'item' | 'system';
  actor: string;
  actorTeam?: 'blue' | 'red' | 'green';
  target?: string;
  targetTeam?: 'blue' | 'red' | 'green';
  message: string;
  details?: string[];
}

// Combat statistics interfaces
export interface UnitCombatStats {
  dealt: number;
  taken: number;
  kills: number;
  shots: number;
  hits: number;
  team: 'blue' | 'red';
}

export interface KillEntry {
  turn: number;
  killer: string;
  victim: string;
  weapon: string;
  damage: number;
  overkill: number;
}

export interface InjuryRecord {
  characterId: string;
  characterName: string;
  team: 'blue' | 'red';
  type: string;
  severity: string;
  description: string;
  permanent: boolean;
  turnInflicted: number;
}

export interface CombatStats {
  totalDamageDealt: { blue: number; red: number };
  totalKills: { blue: number; red: number };
  shotsFired: { blue: number; red: number };
  hits: { blue: number; red: number };
  misses: { blue: number; red: number };
  grazes: { blue: number; red: number };
  criticalHits: { blue: number; red: number };
  damageByUnit: Record<string, UnitCombatStats>;
  killLog: KillEntry[];
  firstBlood: KillEntry | null;
  lastKill: KillEntry | null;
  longestKillstreak: { unit: string | null; streak: number };
  currentStreaks: Record<string, number>;
  mostDamageTaken: { unit: string | null; damage: number };
  turnCount: number;
  injuries: InjuryRecord[];
}

export interface CombatAwards {
  mvp: string | null;           // Most damage dealt
  reaper: string | null;        // Most kills
  firstBlood: string | null;    // First kill
  finalBlow: string | null;     // Last kill
  tank: string | null;          // Most damage taken (survived)
  killstreak: string | null;    // Longest killstreak
}

export interface CombatStatsEvent {
  stats: CombatStats;
  awards: CombatAwards;
  winner: string;
  rounds: number;
  survivors: { team: string; unitId: string; hp: number; name: string }[];
}

// ============== MARTIAL ARTS SYSTEM ==============

/**
 * Grapple states for the grappling state machine
 */
export enum GrappleState {
  NONE = 'none',           // Not in any grapple
  STANDING = 'standing',   // Both characters standing, in clinch
  GROUND = 'ground',       // Both on ground, not restrained
  PINNED = 'pinned',       // Target is pinned, attacker in control
  RESTRAINED = 'restrained', // Target fully restrained
  CARRIED = 'carried',     // Target being carried
  SUBMISSION = 'submission' // In a submission hold
}

/**
 * Five martial arts styles with unique tactical roles
 */
export type MartialArtsStyleId = 'grappling' | 'submission' | 'internal' | 'counter' | 'striking';

/**
 * Belt ranks with progression bonuses
 */
export interface BeltRank {
  belt: 'white' | 'yellow' | 'orange' | 'green' | 'blue' | 'purple' | 'brown' | 'red' | 'black1' | 'black2';
  rank: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;
  bonus: number;  // MEL bonus for this style's techniques
}

/**
 * Individual martial arts technique
 */
export interface MartialArtsTechnique {
  id: string;
  name: string;
  styleId: MartialArtsStyleId;
  beltRequired: number;       // 1-10
  apCost: number;
  damage?: number;            // Optional - some techniques don't deal damage
  effect: string;             // Description of effect
  statusApplied?: string[];   // Status effects applied
  requiresGrapple?: boolean;  // Must be in grapple state
  requiresStanding?: boolean; // Must be standing (default true)
  requiresProne?: boolean;    // Must be on ground
  requiresRestrained?: boolean; // Target must be restrained
  setsGrappleState?: GrappleState; // Changes grapple state to this
  isReaction?: boolean;       // Can be used as reaction (0 AP when triggered)
  isPassive?: boolean;        // Always active, no activation
}

/**
 * Martial arts style definition
 */
export interface MartialArtsStyle {
  id: MartialArtsStyleId;
  name: string;
  description: string;
  role: 'control' | 'finisher' | 'defense' | 'reactive' | 'damage';
  primaryStat: 'STR' | 'MEL' | 'AGL' | 'INS';
  secondaryStat?: 'STR' | 'MEL' | 'AGL' | 'INS';
  techniques: MartialArtsTechnique[];
}

/**
 * Character's martial arts training
 */
export interface CharacterMartialArts {
  styleId: MartialArtsStyleId;
  beltLevel: number;  // 1-10
}

/**
 * Grapple interaction between two units
 */
export interface GrappleInteraction {
  attackerId: string;
  defenderId: string;
  state: GrappleState;
  turnStarted: number;
  attackerPosition: 'top' | 'bottom' | 'back' | 'side';
  submissionProgress?: number; // Turns until unconscious for chokes
}

// Add martial arts events to combat
export interface MartialArtsEvents {
  // React → Phaser
  'use-technique': { unitId: string; techniqueId: string; targetId?: string };
  'attempt-escape': { unitId: string };
  'attempt-reversal': { unitId: string };

  // Phaser → React
  'grapple-started': GrappleInteraction;
  'grapple-changed': GrappleInteraction;
  'grapple-ended': { winnerId: string; loserId: string; reason: 'escape' | 'knockout' | 'submission' | 'slam' };
  'technique-used': { unitId: string; techniqueId: string; targetId: string; success: boolean; damage?: number };
}

export default EventBridge;
