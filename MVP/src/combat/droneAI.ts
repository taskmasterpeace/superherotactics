/**
 * Drone AI System
 *
 * Controls behavior for spawned drone units.
 * Each drone type has distinct AI patterns:
 * - Recon: Patrol, reveal fog
 * - Combat: Aggressive, attack enemies
 * - Medical: Follow owner, heal allies
 * - Cargo: Follow owner
 * - Swarm: Aggressive, suicide on contact
 *
 * Run: npx tsx src/combat/droneAI.ts
 */

import {
  SimUnit,
  Position,
  AttackResult,
} from './types';

import {
  DroneConfig,
  DroneType,
} from './gadgetTypes';

import {
  resolveAttack,
  applyAttackResult,
  calculateDistance,
  selectTarget,
} from './core';

// ============ DRONE AI INTERFACE ============

export interface DroneAction {
  type: 'move' | 'attack' | 'heal' | 'patrol' | 'follow' | 'explode';
  targetPosition?: Position;
  targetUnitId?: string;
  result?: AttackResult | { healAmount: number };
}

// ============ MAIN AI FUNCTION ============

/**
 * Determine and execute drone's action for this turn.
 */
export function processDroneTurn(
  drone: SimUnit,
  allUnits: SimUnit[]
): DroneAction {
  if (!drone.isDrone || !drone.droneConfig) {
    return { type: 'patrol' };
  }

  const config = drone.droneConfig as DroneConfig;
  const owner = allUnits.find(u => u.id === drone.droneOwnerId);

  switch (config.ai) {
    case 'aggressive':
      return processAggressiveAI(drone, allUnits, config);
    case 'defensive':
      return processDefensiveAI(drone, allUnits, config, owner);
    case 'follow':
      return processFollowAI(drone, allUnits, config, owner);
    case 'patrol':
      return processPatrolAI(drone, allUnits, config);
    default:
      return { type: 'patrol' };
  }
}

// ============ AGGRESSIVE AI (Combat Drones) ============

function processAggressiveAI(
  drone: SimUnit,
  allUnits: SimUnit[],
  config: DroneConfig
): DroneAction {
  const enemies = allUnits.filter(u =>
    u.team !== drone.team && u.hp > 0 && !u.isDrone
  );

  if (enemies.length === 0) {
    return { type: 'patrol' };
  }

  // Find closest enemy in range
  const target = selectTarget(drone, enemies);
  if (!target) {
    return { type: 'patrol' };
  }

  const distance = getPositionDistance(drone.position, target.position);

  // Swarm drones explode on contact
  if (config.type === 'swarm' && distance <= 2) {
    return processSwarmExplosion(drone, allUnits, target);
  }

  // Attack if in range and has weapon
  if (config.weapon && distance <= config.weapon.range) {
    const result = resolveAttack(drone, target, distance);
    applyAttackResult(target, result);
    return {
      type: 'attack',
      targetUnitId: target.id,
      result,
    };
  }

  // Move toward enemy
  const moveTarget = moveToward(drone.position!, target.position!, config.moveSpeed);
  drone.position = moveTarget;
  return {
    type: 'move',
    targetPosition: moveTarget,
  };
}

// ============ DEFENSIVE AI ============

function processDefensiveAI(
  drone: SimUnit,
  allUnits: SimUnit[],
  config: DroneConfig,
  owner?: SimUnit
): DroneAction {
  // Stay near owner and attack enemies that get close
  const ownerPos = owner?.position || drone.position;

  // Find threats near owner
  const threats = allUnits.filter(u =>
    u.team !== drone.team &&
    u.hp > 0 &&
    getPositionDistance(u.position, ownerPos) <= 5
  );

  if (threats.length > 0 && config.weapon) {
    // Attack nearest threat
    const nearest = threats.reduce((a, b) =>
      getPositionDistance(a.position, drone.position) <
      getPositionDistance(b.position, drone.position) ? a : b
    );

    const distance = getPositionDistance(drone.position, nearest.position);

    if (distance <= config.weapon.range) {
      const result = resolveAttack(drone, nearest, distance);
      applyAttackResult(nearest, result);
      return {
        type: 'attack',
        targetUnitId: nearest.id,
        result,
      };
    }
  }

  // Move toward owner if too far
  if (owner && getPositionDistance(drone.position, owner.position) > 3) {
    const moveTarget = moveToward(drone.position!, owner.position!, config.moveSpeed);
    drone.position = moveTarget;
    return {
      type: 'move',
      targetPosition: moveTarget,
    };
  }

  return { type: 'patrol' };
}

// ============ FOLLOW AI (Medical/Cargo Drones) ============

function processFollowAI(
  drone: SimUnit,
  allUnits: SimUnit[],
  config: DroneConfig,
  owner?: SimUnit
): DroneAction {
  // Medical drone: heal nearby wounded allies
  if (config.type === 'medical' && config.healPerTurn) {
    const woundedAllies = allUnits.filter(u =>
      u.team === drone.team &&
      u.hp > 0 &&
      u.hp < u.maxHp &&
      !u.isDrone &&
      getPositionDistance(u.position, drone.position) <= 3
    );

    if (woundedAllies.length > 0) {
      // Heal most wounded ally
      const mostWounded = woundedAllies.reduce((a, b) =>
        (a.hp / a.maxHp) < (b.hp / b.maxHp) ? a : b
      );

      const healAmount = Math.min(config.healPerTurn, mostWounded.maxHp - mostWounded.hp);
      mostWounded.hp += healAmount;

      return {
        type: 'heal',
        targetUnitId: mostWounded.id,
        result: { healAmount },
      };
    }

    // Move to wounded ally if any on map
    const anyWounded = allUnits.find(u =>
      u.team === drone.team &&
      u.hp > 0 &&
      u.hp < u.maxHp &&
      !u.isDrone
    );

    if (anyWounded) {
      const moveTarget = moveToward(drone.position!, anyWounded.position!, config.moveSpeed);
      drone.position = moveTarget;
      return {
        type: 'move',
        targetPosition: moveTarget,
      };
    }
  }

  // Follow owner
  if (owner && owner.hp > 0) {
    const distToOwner = getPositionDistance(drone.position, owner.position);

    if (distToOwner > 2) {
      const moveTarget = moveToward(drone.position!, owner.position!, config.moveSpeed);
      drone.position = moveTarget;
      return {
        type: 'move',
        targetPosition: moveTarget,
      };
    }
  }

  return { type: 'follow' };
}

// ============ PATROL AI (Recon Drones) ============

function processPatrolAI(
  drone: SimUnit,
  allUnits: SimUnit[],
  config: DroneConfig
): DroneAction {
  // Recon drones move toward unexplored areas / enemy positions
  const enemies = allUnits.filter(u =>
    u.team !== drone.team && u.hp > 0
  );

  if (enemies.length > 0) {
    // Move toward nearest enemy to reveal them
    const nearest = enemies.reduce((a, b) =>
      getPositionDistance(a.position, drone.position) <
      getPositionDistance(b.position, drone.position) ? a : b
    );

    // But stay at sight range, don't get too close
    const distance = getPositionDistance(drone.position, nearest.position);

    if (distance > config.sightRange) {
      // Move closer
      const moveTarget = moveToward(drone.position!, nearest.position!, config.moveSpeed);
      drone.position = moveTarget;
      return {
        type: 'move',
        targetPosition: moveTarget,
      };
    } else if (distance < config.sightRange * 0.5) {
      // Too close, back off
      const moveTarget = moveAway(drone.position!, nearest.position!, config.moveSpeed);
      drone.position = moveTarget;
      return {
        type: 'move',
        targetPosition: moveTarget,
      };
    }
  }

  // Random patrol movement
  const randomMove = getRandomPatrolPosition(drone.position!, config.moveSpeed);
  drone.position = randomMove;
  return {
    type: 'patrol',
    targetPosition: randomMove,
  };
}

// ============ SWARM EXPLOSION ============

function processSwarmExplosion(
  drone: SimUnit,
  allUnits: SimUnit[],
  target: SimUnit
): DroneAction {
  // Swarm drones explode dealing damage to nearby enemies
  const blastRadius = 2;
  const damage = 15;

  const nearbyEnemies = allUnits.filter(u =>
    u.team !== drone.team &&
    u.hp > 0 &&
    getPositionDistance(u.position, drone.position) <= blastRadius
  );

  for (const enemy of nearbyEnemies) {
    const dist = getPositionDistance(drone.position, enemy.position);
    const falloff = 1 - (dist / (blastRadius + 1));
    const actualDamage = Math.max(1, Math.round(damage * falloff) - enemy.dr);
    enemy.hp = Math.max(0, enemy.hp - actualDamage);
  }

  // Drone dies
  drone.hp = 0;

  return {
    type: 'explode',
    targetUnitId: target.id,
  };
}

// ============ UTILITY FUNCTIONS ============

function getPositionDistance(a?: Position, b?: Position): number {
  if (!a || !b) return 0;
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

function moveToward(from: Position, to: Position, speed: number): Position {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const dist = Math.sqrt(dx * dx + dy * dy);

  if (dist <= speed) {
    return { ...to };
  }

  const ratio = speed / dist;
  return {
    x: Math.round(from.x + dx * ratio),
    y: Math.round(from.y + dy * ratio),
  };
}

function moveAway(from: Position, threat: Position, speed: number): Position {
  const dx = from.x - threat.x;
  const dy = from.y - threat.y;
  const dist = Math.sqrt(dx * dx + dy * dy);

  if (dist === 0) {
    // Random direction
    return {
      x: from.x + Math.round(Math.random() * speed * 2 - speed),
      y: from.y + Math.round(Math.random() * speed * 2 - speed),
    };
  }

  const ratio = speed / dist;
  return {
    x: Math.round(from.x + dx * ratio),
    y: Math.round(from.y + dy * ratio),
  };
}

function getRandomPatrolPosition(from: Position, speed: number): Position {
  const angle = Math.random() * Math.PI * 2;
  const distance = Math.random() * speed;
  return {
    x: Math.round(from.x + Math.cos(angle) * distance),
    y: Math.round(from.y + Math.sin(angle) * distance),
  };
}

// ============ TEST ============

if (typeof require !== 'undefined' && typeof module !== 'undefined' && require.main === module) {
  console.log('='.repeat(60));
  console.log('       DRONE AI TEST');
  console.log('='.repeat(60));

  // Create test units
  const owner: SimUnit = {
    id: 'owner_1',
    name: 'Owner',
    team: 'blue',
    hp: 100,
    maxHp: 100,
    shieldHp: 0,
    maxShieldHp: 0,
    dr: 5,
    stoppingPower: 0,
    origin: 'Human' as any,
    stats: { MEL: 15, RNG: 20, AGL: 15, CON: 15, INS: 15, WIL: 15, INT: 15 },
    stance: 'standing' as any,
    cover: 'none' as any,
    statusEffects: [],
    accuracyPenalty: 0,
    weapon: {
      id: 'rifle',
      name: 'Rifle',
      damage: { min: 20, max: 30 },
      range: 15,
      accuracy: 70,
      apCost: 3,
      ammo: 30,
      maxAmmo: 30,
      penetration: 5,
      fireModes: ['single'],
      currentFireMode: 'single',
    },
    disarmed: false,
    alive: true,
    acted: false,
    position: { x: 5, y: 5 },
  };

  const enemy: SimUnit = {
    ...owner,
    id: 'enemy_1',
    name: 'Enemy',
    team: 'red',
    position: { x: 12, y: 5 },
  };

  const combatDrone: SimUnit = {
    ...owner,
    id: 'drone_combat',
    name: 'Combat Drone',
    team: 'blue',
    hp: 30,
    maxHp: 30,
    position: { x: 6, y: 5 },
    isDrone: true,
    droneOwnerId: 'owner_1',
    droneTurnsRemaining: 8,
    droneConfig: {
      type: 'combat' as DroneType,
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
  };

  const medicalDrone: SimUnit = {
    ...owner,
    id: 'drone_medical',
    name: 'Medical Drone',
    team: 'blue',
    hp: 20,
    maxHp: 20,
    position: { x: 4, y: 5 },
    isDrone: true,
    droneOwnerId: 'owner_1',
    droneTurnsRemaining: 12,
    droneConfig: {
      type: 'medical' as DroneType,
      hp: 20,
      moveSpeed: 4,
      sightRange: 5,
      duration: 12,
      ai: 'follow',
      healPerTurn: 10,
    },
  };

  // Wound owner
  owner.hp = 70;

  const allUnits = [owner, enemy, combatDrone, medicalDrone];

  console.log('\n=== COMBAT DRONE (Aggressive) ===');
  const combatAction = processDroneTurn(combatDrone, allUnits);
  console.log(`Action: ${combatAction.type}`);
  if (combatAction.targetUnitId) console.log(`Target: ${combatAction.targetUnitId}`);
  if (combatAction.targetPosition) console.log(`Move to: (${combatAction.targetPosition.x}, ${combatAction.targetPosition.y})`);

  console.log('\n=== MEDICAL DRONE (Follow) ===');
  const medicalAction = processDroneTurn(medicalDrone, allUnits);
  console.log(`Action: ${medicalAction.type}`);
  if (medicalAction.targetUnitId) console.log(`Target: ${medicalAction.targetUnitId}`);
  if ((medicalAction.result as any)?.healAmount) {
    console.log(`Healed: ${(medicalAction.result as any).healAmount} HP`);
    console.log(`Owner HP: ${owner.hp}`);
  }

  console.log('\n' + '='.repeat(60));
}
