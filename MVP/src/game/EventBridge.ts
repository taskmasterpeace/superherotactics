/**
 * EventBridge - Communication layer between React and Phaser
 *
 * Usage:
 * - React → Phaser: EventBridge.emit('event-name', data)
 * - Phaser → React: EventBridge.on('event-name', callback)
 */

type EventCallback = (data: any) => void;

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
}

// Event type definitions for TypeScript
export interface CombatEvents {
  // React → Phaser
  'load-combat': { blueTeam: CombatCharacter[]; redTeam: CombatCharacter[]; mapId?: string };
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

export default EventBridge;
