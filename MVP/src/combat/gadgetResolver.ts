/**
 * Gadget Resolution System
 *
 * Pure functions for resolving gadget effects in combat.
 * Follows the same pattern as core.ts - no Phaser dependencies.
 */

import { SimUnit, Position } from './types';
import {
  GadgetBehavior,
  GadgetEffect,
  CombatGadget,
  GadgetResult,
  DroneConfig,
  DroneType,
  ActiveDrone,
  DRONE_CONFIGS,
} from './gadgetTypes';
import { applyStatusEffects } from './statusEffects';

// ============ MAIN GADGET RESOLVER ============

/**
 * Resolve gadget use - main entry point.
 * Routes to specific handlers based on gadget behavior.
 */
export function resolveGadgetUse(
  gadget: CombatGadget,
  user: SimUnit,
  allUnits: SimUnit[],
  activeDrones: ActiveDrone[],
  targetPosition?: Position,
  targetUnitId?: string
): GadgetResult {
  // Check if gadget can be used
  if (gadget.currentCooldown && gadget.currentCooldown > 0) {
    return {
      success: false,
      message: `${gadget.name} is on cooldown (${gadget.currentCooldown} turns)`,
      affectedUnits: [],
    };
  }

  if (gadget.uses !== -1 && (gadget.currentUses ?? gadget.uses) <= 0) {
    return {
      success: false,
      message: `${gadget.name} has no uses remaining`,
      affectedUnits: [],
    };
  }

  // Route to appropriate handler
  switch (gadget.behavior) {
    case 'spawn_unit':
      return resolveSpawnUnit(gadget, user, targetPosition ?? user.position);

    case 'heal':
      return resolveHeal(gadget, user, allUnits, targetUnitId);

    case 'explosive':
      return resolveExplosive(gadget, user, allUnits, targetPosition ?? user.position);

    case 'reveal':
      return resolveReveal(gadget, user, targetPosition ?? user.position);

    case 'buff':
      return resolveBuff(gadget, user, allUnits);

    case 'disable':
      return resolveDisable(gadget, user, allUnits, activeDrones, targetUnitId);

    case 'extract':
      return resolveExtract(gadget, user, allUnits);

    case 'cure_status':
      return resolveCureStatus(gadget, user, allUnits, targetUnitId);

    case 'revive':
      return resolveRevive(gadget, user, allUnits, targetUnitId);

    case 'passive':
      return {
        success: true,
        message: `${gadget.name} provides passive bonuses`,
        affectedUnits: [user.id],
      };

    default:
      return {
        success: false,
        message: `Unknown gadget behavior: ${gadget.behavior}`,
        affectedUnits: [],
      };
  }
}

// ============ SPAWN UNIT (Drones) ============

let droneIdCounter = 0;

/**
 * Spawn a drone at the target position.
 */
function resolveSpawnUnit(
  gadget: CombatGadget,
  user: SimUnit,
  position: Position
): GadgetResult {
  const droneConfig = gadget.effect.spawnDrone;
  if (!droneConfig) {
    return {
      success: false,
      message: `${gadget.name} has no drone configuration`,
      affectedUnits: [],
    };
  }

  // Create drone unit
  const droneUnit = createDroneUnit(droneConfig, user, position);

  return {
    success: true,
    message: `${user.name} deployed ${gadget.name}`,
    affectedUnits: [user.id],
    spawnedUnits: [droneUnit],
  };
}

/**
 * Create a SimUnit from a drone configuration.
 */
export function createDroneUnit(
  config: DroneConfig,
  owner: SimUnit,
  position: Position
): SimUnit {
  droneIdCounter++;
  const droneId = `drone_${owner.id}_${droneIdCounter}`;

  return {
    id: droneId,
    name: getDroneName(config.type),
    team: owner.team,
    hp: config.hp,
    maxHp: config.hp,
    ap: 4,
    maxAp: 4,
    dr: 0,
    stoppingPower: 0,
    weapon: config.weapon ?? {
      id: 'drone_unarmed',
      name: 'Unarmed',
      damage: { min: 0, max: 0 },
      range: 1,
      accuracy: 0,
      apCost: 2,
      ammo: -1,
      maxAmmo: -1,
      penetration: 0,
      fireModes: ['single'],
      currentFireMode: 'single',
    },
    position,
    facing: 0,
    isFlying: true,
    stats: {
      MEL: 10,
      RNG: config.weapon ? 20 : 10,
      AGL: 15,
      CON: 10,
      INS: 15,
      WIL: 10,
      INT: 5,
    },
    statusEffects: [],
    isDrone: true,
    droneOwnerId: owner.id,
    droneTurnsRemaining: config.duration,
    droneConfig: config,
  };
}

function getDroneName(type: DroneType): string {
  switch (type) {
    case 'recon': return 'Recon Drone';
    case 'combat': return 'Combat Drone';
    case 'medical': return 'Medical Drone';
    case 'cargo': return 'Cargo Drone';
    case 'swarm': return 'Swarm Drone';
    default: return 'Drone';
  }
}

// ============ HEAL ============

/**
 * Heal a target unit.
 */
function resolveHeal(
  gadget: CombatGadget,
  user: SimUnit,
  allUnits: SimUnit[],
  targetUnitId?: string
): GadgetResult {
  const healAmount = gadget.effect.value ?? 25;
  const radius = gadget.effect.radius ?? 0;

  // Find targets
  let targets: SimUnit[] = [];

  if (gadget.effect.targetType === 'self') {
    targets = [user];
  } else if (gadget.effect.targetType === 'all_allies') {
    targets = allUnits.filter(u => u.team === user.team && u.hp > 0);
  } else if (targetUnitId) {
    const target = allUnits.find(u => u.id === targetUnitId);
    if (target) targets = [target];
  } else if (radius > 0) {
    // Heal all allies in radius
    targets = allUnits.filter(u =>
      u.team === user.team &&
      u.hp > 0 &&
      getDistance(user.position, u.position) <= radius
    );
  } else {
    // Self-heal as fallback
    targets = [user];
  }

  if (targets.length === 0) {
    return {
      success: false,
      message: 'No valid heal targets',
      affectedUnits: [],
    };
  }

  // Apply healing
  let totalHealed = 0;
  for (const target of targets) {
    const healing = Math.min(healAmount, target.maxHp - target.hp);
    target.hp += healing;
    totalHealed += healing;
  }

  return {
    success: true,
    message: `${user.name} used ${gadget.name}, healed ${totalHealed} HP`,
    affectedUnits: targets.map(t => t.id),
    healingDone: totalHealed,
  };
}

// ============ EXPLOSIVE ============

/**
 * Resolve explosive gadget (C4, breaching charge, etc.)
 */
function resolveExplosive(
  gadget: CombatGadget,
  user: SimUnit,
  allUnits: SimUnit[],
  position: Position
): GadgetResult {
  const damage = gadget.effect.value ?? 30;
  const radius = gadget.effect.radius ?? 2;

  // Find all units in blast radius
  const victims = allUnits.filter(u =>
    u.hp > 0 &&
    getDistance(position, u.position) <= radius
  );

  let totalDamage = 0;
  const affectedIds: string[] = [];

  for (const victim of victims) {
    const dist = getDistance(position, victim.position);
    // Linear damage falloff
    const falloff = 1 - (dist / (radius + 1));
    const actualDamage = Math.round(damage * falloff);

    // Apply armor reduction
    const finalDamage = Math.max(1, actualDamage - victim.dr);
    victim.hp = Math.max(0, victim.hp - finalDamage);
    totalDamage += finalDamage;
    affectedIds.push(victim.id);
  }

  return {
    success: true,
    message: `${gadget.name} exploded! ${totalDamage} total damage`,
    affectedUnits: affectedIds,
    damageDealt: totalDamage,
  };
}

// ============ REVEAL ============

/**
 * Reveal tiles in fog of war.
 */
function resolveReveal(
  gadget: CombatGadget,
  user: SimUnit,
  position: Position
): GadgetResult {
  const radius = gadget.effect.radius ?? 5;
  const duration = gadget.effect.duration ?? 3;

  // Generate revealed tiles
  const revealedTiles: Position[] = [];
  for (let x = -radius; x <= radius; x++) {
    for (let y = -radius; y <= radius; y++) {
      if (x * x + y * y <= radius * radius) {
        revealedTiles.push({
          x: position.x + x,
          y: position.y + y,
        });
      }
    }
  }

  return {
    success: true,
    message: `${user.name} used ${gadget.name}, revealed ${revealedTiles.length} tiles`,
    affectedUnits: [user.id],
    revealedTiles,
  };
}

// ============ BUFF ============

/**
 * Apply temporary stat boost.
 */
function resolveBuff(
  gadget: CombatGadget,
  user: SimUnit,
  allUnits: SimUnit[]
): GadgetResult {
  const duration = gadget.effect.duration ?? 3;
  const targets: SimUnit[] = [];

  // Determine targets
  if (gadget.effect.targetType === 'self') {
    targets.push(user);
  } else if (gadget.effect.targetType === 'all_allies') {
    targets.push(...allUnits.filter(u => u.team === user.team && u.hp > 0));
  } else {
    targets.push(user);
  }

  // Apply buff as status effect
  const buffEffect = gadget.effect.statusEffect ?? 'buffed';
  for (const target of targets) {
    applyStatusEffects(target, [{
      id: buffEffect as any,
      duration,
      statBoost: gadget.effect.statBoost,
      source: gadget.id,
    }]);
  }

  return {
    success: true,
    message: `${user.name} used ${gadget.name}`,
    affectedUnits: targets.map(t => t.id),
    statusApplied: [buffEffect],
  };
}

// ============ DISABLE ============

/**
 * Disable enemy electronics, shields, or drones.
 */
function resolveDisable(
  gadget: CombatGadget,
  user: SimUnit,
  allUnits: SimUnit[],
  activeDrones: ActiveDrone[],
  targetUnitId?: string
): GadgetResult {
  const radius = gadget.effect.radius ?? 3;
  const position = user.position;
  const affectedIds: string[] = [];

  // Find enemy units in range
  const enemies = allUnits.filter(u =>
    u.team !== user.team &&
    u.hp > 0 &&
    getDistance(position, u.position) <= radius
  );

  // Disable shields
  for (const enemy of enemies) {
    if (enemy.shield && enemy.shield.current > 0) {
      enemy.shield.current = 0;
      affectedIds.push(enemy.id);
    }
  }

  // Disable enemy drones
  const disabledDrones = activeDrones.filter(d =>
    d.team !== user.team &&
    d.isActive &&
    getDistance(position, d.position) <= radius
  );

  for (const drone of disabledDrones) {
    drone.isActive = false;
    affectedIds.push(drone.id);
  }

  return {
    success: true,
    message: `${gadget.name} disabled ${affectedIds.length} targets`,
    affectedUnits: affectedIds,
    statusApplied: ['disabled'],
  };
}

// ============ EXTRACT ============

/**
 * Signal extraction - ends combat for the team.
 */
function resolveExtract(
  gadget: CombatGadget,
  user: SimUnit,
  allUnits: SimUnit[]
): GadgetResult {
  // Mark all allies for extraction
  const allies = allUnits.filter(u => u.team === user.team && u.hp > 0);

  return {
    success: true,
    message: `${user.name} called for extraction!`,
    affectedUnits: allies.map(a => a.id),
    extracting: true,
  };
}

// ============ CURE STATUS ============

/**
 * Remove negative status effects.
 */
function resolveCureStatus(
  gadget: CombatGadget,
  user: SimUnit,
  allUnits: SimUnit[],
  targetUnitId?: string
): GadgetResult {
  const effectToCure = gadget.effect.statusEffect;
  let target: SimUnit | undefined;

  if (targetUnitId) {
    target = allUnits.find(u => u.id === targetUnitId);
  } else {
    target = user;
  }

  if (!target) {
    return {
      success: false,
      message: 'No valid target',
      affectedUnits: [],
    };
  }

  const cured: string[] = [];

  if (effectToCure) {
    // Cure specific effect
    const beforeCount = target.statusEffects.length;
    target.statusEffects = target.statusEffects.filter(e => e.id !== effectToCure);
    if (target.statusEffects.length < beforeCount) {
      cured.push(effectToCure);
    }
  } else {
    // Cure all negative effects
    const negativeEffects = ['bleeding', 'burning', 'poisoned', 'stunned', 'suppressed'];
    const beforeCount = target.statusEffects.length;
    target.statusEffects = target.statusEffects.filter(e =>
      !negativeEffects.includes(e.id)
    );
    if (target.statusEffects.length < beforeCount) {
      cured.push(...negativeEffects);
    }
  }

  return {
    success: true,
    message: `${user.name} used ${gadget.name} on ${target.name}`,
    affectedUnits: [target.id],
    statusCured: cured,
  };
}

// ============ REVIVE ============

/**
 * Revive a downed ally.
 */
function resolveRevive(
  gadget: CombatGadget,
  user: SimUnit,
  allUnits: SimUnit[],
  targetUnitId?: string
): GadgetResult {
  const healAmount = gadget.effect.value ?? 20;

  // Find downed ally (0 HP but not yet removed)
  let target: SimUnit | undefined;

  if (targetUnitId) {
    target = allUnits.find(u => u.id === targetUnitId && u.hp <= 0);
  } else {
    // Find nearest downed ally
    const downedAllies = allUnits.filter(u =>
      u.team === user.team &&
      u.hp <= 0 &&
      u.id !== user.id
    );

    if (downedAllies.length > 0) {
      target = downedAllies.reduce((nearest, u) => {
        const distU = getDistance(user.position, u.position);
        const distN = getDistance(user.position, nearest.position);
        return distU < distN ? u : nearest;
      });
    }
  }

  if (!target) {
    return {
      success: false,
      message: 'No downed allies to revive',
      affectedUnits: [],
    };
  }

  // Check range (usually adjacent)
  const range = gadget.effect.radius ?? 1;
  if (getDistance(user.position, target.position) > range) {
    return {
      success: false,
      message: `${target.name} is too far away`,
      affectedUnits: [],
    };
  }

  // Revive with some HP
  target.hp = healAmount;
  target.statusEffects = []; // Clear negative effects

  return {
    success: true,
    message: `${user.name} revived ${target.name}!`,
    affectedUnits: [target.id],
    healingDone: healAmount,
  };
}

// ============ UTILITY FUNCTIONS ============

/**
 * Calculate distance between two positions.
 */
function getDistance(a: Position, b: Position): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Consume gadget use and start cooldown.
 */
export function consumeGadgetUse(gadget: CombatGadget): void {
  if (gadget.uses !== -1) {
    gadget.currentUses = (gadget.currentUses ?? gadget.uses) - 1;
  }
  if (gadget.cooldownTurns > 0) {
    gadget.currentCooldown = gadget.cooldownTurns;
  }
}

/**
 * Tick gadget cooldowns at end of turn.
 */
export function tickGadgetCooldowns(gadgets: CombatGadget[]): void {
  for (const gadget of gadgets) {
    if (gadget.currentCooldown && gadget.currentCooldown > 0) {
      gadget.currentCooldown--;
    }
  }
}

/**
 * Tick drone duration and check for expiry.
 */
export function tickDroneDurations(units: SimUnit[]): string[] {
  const expiredIds: string[] = [];

  for (const unit of units) {
    if (unit.isDrone && unit.droneTurnsRemaining !== undefined) {
      unit.droneTurnsRemaining--;
      if (unit.droneTurnsRemaining <= 0) {
        unit.hp = 0; // Drone dies
        expiredIds.push(unit.id);
      }
    }
  }

  return expiredIds;
}
