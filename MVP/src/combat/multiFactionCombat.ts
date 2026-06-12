/**
 * Multi-Faction Combat System
 *
 * Extends the binary blue/red system to support:
 * - Multiple factions (player, enemy, police, swat, civilian, neutral)
 * - Dynamic faction relationships (hostile, neutral, friendly)
 * - Mid-combat reinforcements
 * - Faction-based targeting AI
 *
 * JA2 Design Philosophy:
 * - Ian: "Combat should be simulation, not abstraction"
 * - Linda: "Multiple entry points for reinforcements = more tactical depth"
 * - Shaun: "Character personality determines reaction to faction changes"
 */

// ============================================================================
// FACTION TYPES
// ============================================================================

export type CombatFactionId =
  | 'player'      // Player's squad
  | 'enemy'       // Mission target enemies
  | 'police'      // Local law enforcement
  | 'swat'        // Tactical response team
  | 'military'    // National military
  | 'civilian'    // Non-combatants
  | 'neutral'     // Third parties (other mercs, etc.)
  | 'allied';     // Temporary allies (rescued hostages who fight)

export interface CombatFaction {
  id: CombatFactionId;
  name: string;
  color: string;        // For UI display
  aiProfile: 'aggressive' | 'defensive' | 'flee' | 'protect' | 'patrol';

  // Relationship modifiers
  hostileTo: CombatFactionId[];      // Will attack on sight
  friendlyTo: CombatFactionId[];     // Will not attack, may assist

  // Behavior flags
  willSurrender: boolean;            // Can be intimidated into surrender
  willFlee: boolean;                 // Will flee when outnumbered
  protectsObjective: boolean;        // Prioritizes objective over combat

  // Reinforcement settings
  canCallReinforcements: boolean;
  reinforcementDelay: number;        // Turns until reinforcements arrive
  reinforcementSize: number;         // How many units
}

// ============================================================================
// DEFAULT FACTIONS
// ============================================================================

export const DEFAULT_FACTIONS: Record<CombatFactionId, CombatFaction> = {
  player: {
    id: 'player',
    name: 'Squad',
    color: '#4CAF50',  // Green
    aiProfile: 'aggressive',
    hostileTo: ['enemy'],
    friendlyTo: ['allied', 'civilian'],
    willSurrender: false,
    willFlee: false,
    protectsObjective: true,
    canCallReinforcements: false,
    reinforcementDelay: 0,
    reinforcementSize: 0,
  },

  enemy: {
    id: 'enemy',
    name: 'Hostiles',
    color: '#F44336',  // Red
    aiProfile: 'aggressive',
    hostileTo: ['player', 'police', 'swat', 'military'],
    friendlyTo: [],
    willSurrender: true,
    willFlee: true,
    protectsObjective: true,
    canCallReinforcements: true,
    reinforcementDelay: 3,
    reinforcementSize: 2,
  },

  police: {
    id: 'police',
    name: 'Police',
    color: '#2196F3',  // Blue
    aiProfile: 'defensive',
    hostileTo: ['enemy'],  // Initially only hostile to criminals
    friendlyTo: ['civilian'],
    willSurrender: false,
    willFlee: true,
    protectsObjective: false,
    canCallReinforcements: true,
    reinforcementDelay: 5,
    reinforcementSize: 4,
  },

  swat: {
    id: 'swat',
    name: 'SWAT',
    color: '#1565C0',  // Dark blue
    aiProfile: 'aggressive',
    hostileTo: ['enemy'],
    friendlyTo: ['police', 'civilian'],
    willSurrender: false,
    willFlee: false,
    protectsObjective: true,
    canCallReinforcements: false,
    reinforcementDelay: 0,
    reinforcementSize: 0,
  },

  military: {
    id: 'military',
    name: 'Military',
    color: '#4A148C',  // Purple
    aiProfile: 'aggressive',
    hostileTo: ['enemy'],
    friendlyTo: ['police', 'swat'],
    willSurrender: false,
    willFlee: false,
    protectsObjective: true,
    canCallReinforcements: true,
    reinforcementDelay: 10,
    reinforcementSize: 8,
  },

  civilian: {
    id: 'civilian',
    name: 'Civilians',
    color: '#9E9E9E',  // Gray
    aiProfile: 'flee',
    hostileTo: [],
    friendlyTo: ['player', 'police', 'swat', 'military'],
    willSurrender: true,
    willFlee: true,
    protectsObjective: false,
    canCallReinforcements: false,
    reinforcementDelay: 0,
    reinforcementSize: 0,
  },

  neutral: {
    id: 'neutral',
    name: 'Neutral',
    color: '#FFC107',  // Amber
    aiProfile: 'patrol',
    hostileTo: [],
    friendlyTo: [],
    willSurrender: true,
    willFlee: true,
    protectsObjective: false,
    canCallReinforcements: false,
    reinforcementDelay: 0,
    reinforcementSize: 0,
  },

  allied: {
    id: 'allied',
    name: 'Allies',
    color: '#8BC34A',  // Light green
    aiProfile: 'defensive',
    hostileTo: ['enemy'],
    friendlyTo: ['player'],
    willSurrender: false,
    willFlee: true,
    protectsObjective: false,
    canCallReinforcements: false,
    reinforcementDelay: 0,
    reinforcementSize: 0,
  },
};

// ============================================================================
// REINFORCEMENT SYSTEM
// ============================================================================

export interface ReinforcementWave {
  id: string;
  factionId: CombatFactionId;
  turnToArrive: number;        // Which turn they show up
  unitCount: number;
  entryDirection: 'north' | 'south' | 'east' | 'west' | 'random';
  announced: boolean;          // Did player get warning?
  units?: any[];               // Actual units (populated on arrival)
}

export interface ReinforcementEvent {
  type: 'warning' | 'arrival';
  wave: ReinforcementWave;
  turnsUntilArrival?: number;
  message: string;
}

/**
 * Schedule reinforcements for a faction
 */
export function scheduleReinforcements(
  factionId: CombatFactionId,
  currentTurn: number,
  reason: string
): ReinforcementWave {
  const faction = DEFAULT_FACTIONS[factionId];

  return {
    id: `reinf-${factionId}-${currentTurn}`,
    factionId,
    turnToArrive: currentTurn + faction.reinforcementDelay,
    unitCount: faction.reinforcementSize,
    entryDirection: 'random',
    announced: false,
  };
}

/**
 * Check if reinforcements should arrive this turn
 */
export function checkReinforcementArrivals(
  waves: ReinforcementWave[],
  currentTurn: number
): ReinforcementEvent[] {
  const events: ReinforcementEvent[] = [];

  for (const wave of waves) {
    // Warning 2 turns before arrival
    if (!wave.announced && wave.turnToArrive - currentTurn === 2) {
      events.push({
        type: 'warning',
        wave,
        turnsUntilArrival: 2,
        message: getReinforcementWarning(wave.factionId),
      });
      wave.announced = true;
    }

    // Arrival
    if (wave.turnToArrive === currentTurn) {
      events.push({
        type: 'arrival',
        wave,
        message: getReinforcementArrivalMessage(wave.factionId),
      });
    }
  }

  return events;
}

function getReinforcementWarning(factionId: CombatFactionId): string {
  switch (factionId) {
    case 'police': return '⚠️ Police sirens in the distance. ETA: 2 turns.';
    case 'swat': return '🚨 SWAT team inbound! ETA: 2 turns.';
    case 'military': return '⚠️ Military convoy approaching. ETA: 2 turns.';
    case 'enemy': return '⚠️ Enemy reinforcements spotted. ETA: 2 turns.';
    default: return `⚠️ ${DEFAULT_FACTIONS[factionId].name} approaching. ETA: 2 turns.`;
  }
}

function getReinforcementArrivalMessage(factionId: CombatFactionId): string {
  switch (factionId) {
    case 'police': return '🚔 Police have arrived on scene!';
    case 'swat': return '🚨 SWAT TEAM BREACHING!';
    case 'military': return '🪖 Military forces engaging!';
    case 'enemy': return '❗ Enemy reinforcements have arrived!';
    default: return `${DEFAULT_FACTIONS[factionId].name} have entered combat!`;
  }
}

// ============================================================================
// FACTION RELATIONSHIP SYSTEM
// ============================================================================

/**
 * Determine if one faction is hostile to another
 */
export function isHostile(
  attackerFaction: CombatFactionId,
  defenderFaction: CombatFactionId,
  playerStandings?: Record<CombatFactionId, number>
): boolean {
  if (attackerFaction === defenderFaction) return false;

  const attacker = DEFAULT_FACTIONS[attackerFaction];

  // Check base hostility
  if (attacker.hostileTo.includes(defenderFaction)) return true;

  // Check player standing modifiers
  if (playerStandings) {
    // If player has negative standing with police, police become hostile to player
    if (attackerFaction === 'police' && defenderFaction === 'player') {
      return playerStandings.police < -25;
    }

    // If player shoots at police, they become hostile
    // (This would be tracked as a combat event)
  }

  return false;
}

/**
 * Determine if one faction is friendly to another
 */
export function isFriendly(
  factionA: CombatFactionId,
  factionB: CombatFactionId
): boolean {
  if (factionA === factionB) return true;

  const factionAData = DEFAULT_FACTIONS[factionA];
  return factionAData.friendlyTo.includes(factionB);
}

/**
 * Get all valid targets for a unit
 */
export function getValidTargets(
  attackerFaction: CombatFactionId,
  allUnits: Array<{ id: string; faction: CombatFactionId; alive: boolean }>,
  playerStandings?: Record<CombatFactionId, number>
): string[] {
  return allUnits
    .filter(u => u.alive && isHostile(attackerFaction, u.faction, playerStandings))
    .map(u => u.id);
}

// ============================================================================
// PLAYER CHOICE SYSTEM
// ============================================================================

export interface PlayerChoiceEvent {
  id: string;
  type: 'flee_or_fight' | 'surrender' | 'negotiate' | 'switch_sides';
  message: string;
  options: PlayerChoiceOption[];
  timeLimit?: number;  // Turns to decide (optional)
}

export interface PlayerChoiceOption {
  id: string;
  label: string;
  description: string;
  consequences: {
    factionStandingChange?: Record<CombatFactionId, number>;
    missionOutcome?: 'abort' | 'continue' | 'fail';
    reinforcements?: CombatFactionId;
  };
}

/**
 * Generate a flee-or-fight choice when police arrive
 */
export function generatePoliceArrivalChoice(
  playerStanding: number
): PlayerChoiceEvent {
  return {
    id: 'police-arrival',
    type: 'flee_or_fight',
    message: 'Police have arrived on scene. How do you respond?',
    options: [
      {
        id: 'flee',
        label: 'Disengage',
        description: 'Abort mission and escape before engagement.',
        consequences: {
          missionOutcome: 'abort',
          factionStandingChange: { police: 0 },  // No change
        },
      },
      {
        id: 'surrender',
        label: 'Surrender',
        description: 'Lay down weapons. Risk arrest but preserve standing.',
        consequences: {
          missionOutcome: 'fail',
          factionStandingChange: { police: 5 },  // Slight improvement
        },
      },
      {
        id: 'fight',
        label: 'Engage',
        description: 'Fight through the police. Major standing penalty.',
        consequences: {
          missionOutcome: 'continue',
          factionStandingChange: { police: -30 },
          reinforcements: 'swat',  // SWAT called if you fight police
        },
      },
      {
        id: 'negotiate',
        label: 'Negotiate',
        description: playerStanding >= 50
          ? 'Use your reputation to explain the situation.'
          : 'Try to talk your way out (low chance).',
        consequences: {
          missionOutcome: 'continue',
          factionStandingChange: { police: playerStanding >= 50 ? 0 : -10 },
        },
      },
    ],
    timeLimit: 2,  // Must decide within 2 turns
  };
}

// ============================================================================
// VEHICLE SYSTEM (DARKWIND-INSPIRED)
// ============================================================================

/**
 * Vehicle in tactical combat
 *
 * Movement is simultaneous, turn-based:
 * 1. Queue orders (steering, speed)
 * 2. All vehicles move together
 * 3. Combat phase (mounted weapons fire)
 *
 * Inspired by Darkwind: War on Wheels
 */
export interface CombatVehicle {
  id: string;
  name: string;
  faction: CombatFactionId;

  // Position & Movement
  position: { x: number; y: number };
  facing: number;           // Degrees (0 = north)
  velocity: number;         // Current speed in tiles/turn
  maxVelocity: number;      // Max speed
  acceleration: number;     // How fast it speeds up
  turnRate: number;         // Degrees per tile at current speed

  // Queued orders (set during planning phase)
  steeringOrder: number;    // -90 to +90 degrees
  throttleOrder: number;    // -1 (brake) to 1 (full throttle)

  // Combat
  hp: number;
  maxHp: number;
  armor: number;
  mountedWeapons: Array<{
    weaponId: string;
    firingArc: number;      // Degrees (0 = forward only, 180 = turret)
    ammo: number;
  }>;

  // Passengers
  passengerCapacity: number;
  passengers: string[];     // Unit IDs

  // Physics
  mass: number;             // Affects ramming, collisions
  gripFactor: number;       // Higher = less sliding
}

/**
 * Calculate vehicle movement for one turn
 * Returns predicted path for visualization
 */
export function calculateVehicleMovement(
  vehicle: CombatVehicle
): { x: number; y: number; facing: number }[] {
  const path: { x: number; y: number; facing: number }[] = [];

  // Start position
  let x = vehicle.position.x;
  let y = vehicle.position.y;
  let facing = vehicle.facing;
  let velocity = vehicle.velocity;

  // Apply throttle
  velocity += vehicle.throttleOrder * vehicle.acceleration;
  velocity = Math.max(0, Math.min(velocity, vehicle.maxVelocity));

  // Calculate turn radius based on speed
  // Higher speed = wider turn (more realistic)
  const effectiveTurnRate = vehicle.turnRate / Math.max(1, velocity * 0.5);
  const turnAmount = vehicle.steeringOrder * effectiveTurnRate;

  // Simulate movement in small steps
  const steps = Math.max(1, Math.floor(velocity));
  for (let i = 0; i < steps; i++) {
    // Apply steering
    facing += turnAmount / steps;
    facing = (facing + 360) % 360;

    // Move forward
    const rad = (facing - 90) * Math.PI / 180;
    x += Math.cos(rad) * (velocity / steps);
    y += Math.sin(rad) * (velocity / steps);

    path.push({ x: Math.round(x), y: Math.round(y), facing });
  }

  return path;
}

/**
 * Check for vehicle collision with terrain or units
 */
export function checkVehicleCollision(
  vehicle: CombatVehicle,
  newPosition: { x: number; y: number },
  terrain: any,  // GridMap
  otherVehicles: CombatVehicle[],
  units: any[]   // SimUnit[]
): { collision: boolean; target?: any; damage?: number } {
  // TODO: Implement collision detection
  // - Terrain collision (walls)
  // - Vehicle-to-vehicle ramming
  // - Vehicle-to-unit (running over)
  return { collision: false };
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  CombatFaction,
  ReinforcementWave,
  PlayerChoiceEvent,
  CombatVehicle,
};
