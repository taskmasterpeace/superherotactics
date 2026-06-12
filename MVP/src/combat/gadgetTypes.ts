/**
 * Gadget Combat Types
 *
 * Defines types and interfaces for wiring 89 gadgets to combat.
 * These gadgets span: Vehicles, Drones, Hacking Tools, Sensors,
 * Communications, Field Gear, Medical Tech, Utility, Surveillance.
 */

import { SimUnit, SimWeapon, Position } from './types';

// ============ GADGET BEHAVIOR TYPES ============
// Each gadget maps to one of these behavior categories

export type GadgetBehavior =
  | 'spawn_unit'   // Drones - create AI-controlled ally
  | 'heal'         // Medical - restore HP
  | 'explosive'    // C4, breach - delayed explosion
  | 'reveal'       // Sensors, NVG - clear fog of war
  | 'buff'         // Stims, comms - temporary stat boost
  | 'disable'      // EMP, jammer - remove enemy tech/shields
  | 'extract'      // Vehicles - end combat, extract squad
  | 'passive'      // Weapon mods - stat bonuses (already work)
  | 'cure_status'  // Antidote, coagulant - remove debuffs
  | 'revive';      // Defibrillator - revive downed ally

// ============ GADGET EFFECT ============
export interface GadgetEffect {
  type: GadgetBehavior;
  radius?: number;           // Area of effect
  duration?: number;         // Buff/effect duration in turns
  value?: number;            // Heal amount, damage, buff value
  spawnDrone?: DroneConfig;  // For drone spawning
  statusEffect?: string;     // Status to apply/cure
  targetType?: 'self' | 'ally' | 'enemy' | 'position' | 'all_allies';
  statBoost?: Partial<Record<'MEL' | 'RNG' | 'AGL' | 'CON' | 'INS' | 'WIL' | 'INT', number>>;
}

// ============ COMBAT GADGET ============
export interface CombatGadget {
  id: string;
  name: string;
  category: string;          // Original category (Drones, Medical, etc.)
  behavior: GadgetBehavior;
  apCost: number;
  cooldownTurns: number;
  uses: number;              // -1 = unlimited
  currentUses?: number;      // Track remaining uses
  currentCooldown?: number;  // Track cooldown state
  effect: GadgetEffect;
  description?: string;
}

// ============ GADGET RESULT ============
export interface GadgetResult {
  success: boolean;
  message: string;
  affectedUnits: string[];   // Unit IDs affected
  spawnedUnits?: SimUnit[];  // Newly spawned drones
  revealedTiles?: Position[]; // Tiles revealed by sensors
  damageDealt?: number;      // For explosives
  healingDone?: number;      // For medical
  statusApplied?: string[];  // Status effects applied
  statusCured?: string[];    // Status effects removed
  extracting?: boolean;      // For vehicle extraction
}

// ============ DRONE SYSTEM ============
export type DroneType = 'recon' | 'combat' | 'medical' | 'cargo' | 'swarm';

export interface DroneConfig {
  type: DroneType;
  hp: number;
  moveSpeed: number;         // Tiles per turn
  sightRange: number;        // Vision radius
  weapon?: SimWeapon;        // For combat drones
  healPerTurn?: number;      // For medical drones
  carryCapacity?: number;    // For cargo drones
  duration: number;          // Turns before battery dies
  ai: 'aggressive' | 'defensive' | 'follow' | 'patrol';
}

// ============ DRONE CONFIGURATIONS ============
// Default drone configs matching the 10 drone types in gadgets.ts

export const DRONE_CONFIGS: Record<string, DroneConfig> = {
  // Recon drones - high mobility, reveal fog
  recon_small: {
    type: 'recon',
    hp: 15,
    moveSpeed: 6,
    sightRange: 8,
    duration: 10,
    ai: 'patrol',
  },
  recon_military: {
    type: 'recon',
    hp: 25,
    moveSpeed: 5,
    sightRange: 12,
    duration: 15,
    ai: 'patrol',
  },

  // Combat drones - attack enemies
  combat_light: {
    type: 'combat',
    hp: 30,
    moveSpeed: 4,
    sightRange: 6,
    duration: 8,
    ai: 'aggressive',
    weapon: {
      id: 'drone_gun',
      name: 'Drone SMG',
      damage: { min: 8, max: 12 },
      range: 8,
      accuracy: 60,
      apCost: 3,
      ammo: 50,
      maxAmmo: 50,
      penetration: 0,
      fireModes: ['auto'],
      currentFireMode: 'auto',
    },
  },
  combat_heavy: {
    type: 'combat',
    hp: 50,
    moveSpeed: 3,
    sightRange: 6,
    duration: 6,
    ai: 'aggressive',
    weapon: {
      id: 'drone_minigun',
      name: 'Drone Minigun',
      damage: { min: 12, max: 18 },
      range: 10,
      accuracy: 55,
      apCost: 4,
      ammo: 100,
      maxAmmo: 100,
      penetration: 5,
      fireModes: ['auto'],
      currentFireMode: 'auto',
    },
  },

  // Support drones
  medical: {
    type: 'medical',
    hp: 20,
    moveSpeed: 4,
    sightRange: 5,
    duration: 12,
    ai: 'follow',
    healPerTurn: 10,
  },
  cargo: {
    type: 'cargo',
    hp: 40,
    moveSpeed: 3,
    sightRange: 4,
    duration: 20,
    ai: 'follow',
    carryCapacity: 50,
  },

  // Specialty drones
  swarm: {
    type: 'swarm',
    hp: 10,
    moveSpeed: 5,
    sightRange: 4,
    duration: 5,
    ai: 'aggressive',
    weapon: {
      id: 'swarm_sting',
      name: 'Swarm Attack',
      damage: { min: 3, max: 6 },
      range: 2,
      accuracy: 80,
      apCost: 2,
      ammo: -1,
      maxAmmo: -1,
      penetration: 0,
      fireModes: ['single'],
      currentFireMode: 'single',
    },
  },
  stealth: {
    type: 'recon',
    hp: 12,
    moveSpeed: 4,
    sightRange: 10,
    duration: 8,
    ai: 'patrol',
    // Note: Invisible to enemies unless they have thermal
  },
  assault: {
    type: 'combat',
    hp: 60,
    moveSpeed: 2,
    sightRange: 5,
    duration: 5,
    ai: 'aggressive',
    weapon: {
      id: 'drone_rockets',
      name: 'Drone Rockets',
      damage: { min: 25, max: 40 },
      range: 12,
      accuracy: 70,
      apCost: 5,
      ammo: 4,
      maxAmmo: 4,
      penetration: 15,
      fireModes: ['single'],
      currentFireMode: 'single',
    },
  },
  emp: {
    type: 'swarm',
    hp: 8,
    moveSpeed: 5,
    sightRange: 3,
    duration: 3,
    ai: 'aggressive',
    // Explodes on contact, disables electronics
  },
};

// ============ GADGET USE REQUEST ============
export interface GadgetUseRequest {
  gadgetId: string;
  userId: string;
  targetPosition?: Position;
  targetUnitId?: string;
}

// ============ ACTIVE DRONE STATE ============
export interface ActiveDrone {
  id: string;
  ownerId: string;           // Unit that deployed this drone
  config: DroneConfig;
  position: Position;
  currentHp: number;
  turnsRemaining: number;
  team: 'blue' | 'red';
  isActive: boolean;
}
