/**
 * Gadget-Enabled Battle Runner
 *
 * Extends the base battle system with gadget support.
 * Handles drone spawning, healing, explosives, etc.
 *
 * Run: npx tsx src/combat/gadgetBattleRunner.ts
 */

import {
  SimUnit,
  AttackResult,
  BattleResult,
  BattleConfig,
  DEFAULT_BATTLE_CONFIG,
  Position,
} from './types';

import {
  CombatGadget,
  GadgetResult,
  ActiveDrone,
} from './gadgetTypes';

import {
  resolveGadgetUse,
  consumeGadgetUse,
  tickGadgetCooldowns,
  tickDroneDurations,
} from './gadgetResolver';

import {
  getCombatGadget,
} from './gadgetCombat';

import {
  resolveAttack,
  applyAttackResult,
  getTurnOrder,
  selectTarget,
  calculateDistance,
} from './core';

import {
  processStatusEffects,
  canUnitAct,
} from './statusEffects';

// ============ GADGET BATTLE STATE ============

export interface GadgetBattleState {
  allUnits: SimUnit[];
  activeDrones: ActiveDrone[];
  gadgetInventory: Map<string, CombatGadget[]>; // unitId -> gadgets
  round: number;
  log: (AttackResult | GadgetResult)[];
}

// ============ GADGET UNIT CREATION ============

/**
 * Create a unit with gadgets.
 */
export function createUnitWithGadgets(
  baseUnit: SimUnit,
  gadgetIds: string[]
): { unit: SimUnit; gadgets: CombatGadget[] } {
  const gadgets: CombatGadget[] = [];

  for (const id of gadgetIds) {
    const gadget = getCombatGadget(id);
    if (gadget) {
      // Clone gadget to track individual uses
      gadgets.push({
        ...gadget,
        currentUses: gadget.uses === -1 ? -1 : gadget.uses,
        currentCooldown: 0,
      });
    }
  }

  return {
    unit: { ...baseUnit },
    gadgets,
  };
}

// ============ USE GADGET ACTION ============

/**
 * Use a gadget during combat.
 */
export function useGadget(
  state: GadgetBattleState,
  user: SimUnit,
  gadgetId: string,
  targetPosition?: Position,
  targetUnitId?: string
): GadgetResult {
  // Find gadget in user's inventory
  const userGadgets = state.gadgetInventory.get(user.id);
  if (!userGadgets) {
    return {
      success: false,
      message: `${user.name} has no gadgets`,
      affectedUnits: [],
    };
  }

  const gadget = userGadgets.find(g => g.id === gadgetId);
  if (!gadget) {
    return {
      success: false,
      message: `${user.name} doesn't have ${gadgetId}`,
      affectedUnits: [],
    };
  }

  // Resolve gadget use
  const result = resolveGadgetUse(
    gadget,
    user,
    state.allUnits,
    state.activeDrones,
    targetPosition,
    targetUnitId
  );

  if (result.success) {
    // Consume use
    consumeGadgetUse(gadget);

    // Handle spawned units (drones)
    if (result.spawnedUnits) {
      state.allUnits.push(...result.spawnedUnits);
    }

    // Log result
    state.log.push(result);
  }

  return result;
}

// ============ PROCESS END OF ROUND ============

/**
 * Process end-of-round gadget effects.
 */
export function processGadgetRoundEnd(state: GadgetBattleState): void {
  // Tick gadget cooldowns for all units
  for (const [_unitId, gadgets] of state.gadgetInventory) {
    tickGadgetCooldowns(gadgets);
  }

  // Tick drone durations
  const expiredDrones = tickDroneDurations(state.allUnits);
  if (expiredDrones.length > 0) {
    // Remove expired drones
    state.allUnits = state.allUnits.filter(u =>
      !u.isDrone || u.hp > 0
    );
  }

  // Medical drones heal nearby allies
  for (const unit of state.allUnits) {
    if (unit.isDrone && unit.droneConfig?.healPerTurn) {
      healNearbyAllies(state, unit);
    }
  }
}

/**
 * Medical drone heals nearby allies.
 */
function healNearbyAllies(state: GadgetBattleState, drone: SimUnit): void {
  const healAmount = drone.droneConfig?.healPerTurn || 0;
  if (healAmount <= 0) return;

  const allies = state.allUnits.filter(u =>
    u.team === drone.team &&
    !u.isDrone &&
    u.hp > 0 &&
    u.hp < u.maxHp &&
    getDistance(drone.position, u.position) <= 3
  );

  for (const ally of allies) {
    const healing = Math.min(healAmount, ally.maxHp - ally.hp);
    ally.hp += healing;
  }
}

function getDistance(a?: Position, b?: Position): number {
  if (!a || !b) return 0;
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

// ============ RUN GADGET BATTLE ============

/**
 * Run a battle with gadget support.
 * This is a simplified battle runner for testing gadgets.
 */
export function runGadgetBattle(
  blueTeam: SimUnit[],
  redTeam: SimUnit[],
  blueGadgets: Map<string, CombatGadget[]>,
  redGadgets: Map<string, CombatGadget[]>,
  maxRounds: number = 50
): {
  winner: 'blue' | 'red' | 'draw';
  rounds: number;
  log: (AttackResult | GadgetResult)[];
} {
  const state: GadgetBattleState = {
    allUnits: [...blueTeam, ...redTeam],
    activeDrones: [],
    gadgetInventory: new Map([...blueGadgets, ...redGadgets]),
    round: 0,
    log: [],
  };

  while (state.round < maxRounds) {
    state.round++;

    // Get turn order
    const turnOrder = getTurnOrder(state.allUnits);

    for (const unit of turnOrder) {
      if (unit.hp <= 0) continue;

      // Process status effects
      processStatusEffects(unit);
      if (unit.hp <= 0) continue;

      // Check if unit can act
      if (!canUnitAct(unit)) continue;

      // Find enemies
      const enemies = state.allUnits.filter(u =>
        u.team !== unit.team && u.hp > 0
      );
      if (enemies.length === 0) break;

      // AI Decision: Use gadgets strategically
      const gadgets = state.gadgetInventory.get(unit.id) || [];
      const usableGadget = selectBestGadget(unit, gadgets, state);

      if (usableGadget) {
        // Use gadget
        const target = selectTarget(unit, enemies);
        useGadget(state, unit, usableGadget.id, target?.position, target?.id);
      } else {
        // Regular attack
        const target = selectTarget(unit, enemies);
        if (target) {
          const result = resolveAttack(unit, target, calculateDistance(unit, target));
          applyAttackResult(target, result);
          state.log.push(result);
        }
      }
    }

    // Process end of round
    processGadgetRoundEnd(state);

    // Check for winner
    const blueAlive = state.allUnits.filter(u => u.team === 'blue' && u.hp > 0 && !u.isDrone);
    const redAlive = state.allUnits.filter(u => u.team === 'red' && u.hp > 0 && !u.isDrone);

    if (blueAlive.length === 0) {
      return { winner: 'red', rounds: state.round, log: state.log };
    }
    if (redAlive.length === 0) {
      return { winner: 'blue', rounds: state.round, log: state.log };
    }
  }

  return { winner: 'draw', rounds: maxRounds, log: state.log };
}

/**
 * AI gadget selection logic.
 */
function selectBestGadget(
  unit: SimUnit,
  gadgets: CombatGadget[],
  state: GadgetBattleState
): CombatGadget | null {
  // Filter to usable gadgets
  const usable = gadgets.filter(g =>
    (g.currentCooldown ?? 0) === 0 &&
    (g.uses === -1 || (g.currentUses ?? g.uses) > 0) &&
    g.behavior !== 'passive'
  );

  if (usable.length === 0) return null;

  // Priority logic:
  // 1. Revive if ally is down
  const downedAllies = state.allUnits.filter(u =>
    u.team === unit.team && u.hp <= 0 && !u.isDrone
  );
  if (downedAllies.length > 0) {
    const revive = usable.find(g => g.behavior === 'revive');
    if (revive) return revive;
  }

  // 2. Heal if HP low
  if (unit.hp < unit.maxHp * 0.5) {
    const heal = usable.find(g => g.behavior === 'heal');
    if (heal) return heal;
  }

  // 3. Spawn drone if available and none active
  const ownedDrones = state.allUnits.filter(u =>
    u.isDrone && (u as any).droneOwnerId === unit.id && u.hp > 0
  );
  if (ownedDrones.length === 0) {
    const spawn = usable.find(g => g.behavior === 'spawn_unit');
    if (spawn) return spawn;
  }

  // 4. Explosive if enemies clustered (skip for now)

  // 5. Otherwise, don't use gadget this turn
  return null;
}

// ============ TEST ============

if (require.main === module) {
  console.log('='.repeat(60));
  console.log('       GADGET BATTLE RUNNER TEST');
  console.log('='.repeat(60));

  // Create test units
  const blueUnit: SimUnit = {
    id: 'blue_1',
    name: 'Blue Soldier',
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
      name: 'Assault Rifle',
      damage: { min: 20, max: 30 },
      range: 15,
      accuracy: 70,
      apCost: 3,
      ammo: 30,
      maxAmmo: 30,
      penetration: 5,
      fireModes: ['auto'],
      currentFireMode: 'auto',
    },
    disarmed: false,
    alive: true,
    acted: false,
    position: { x: 0, y: 5 },
  };

  const redUnit: SimUnit = {
    ...blueUnit,
    id: 'red_1',
    name: 'Red Soldier',
    team: 'red',
    position: { x: 10, y: 5 },
  };

  // Give blue a combat drone
  const blueGadgets = new Map<string, CombatGadget[]>();
  const droneGadget = getCombatGadget('DRN_003'); // Combat Drone Light
  if (droneGadget) {
    blueGadgets.set('blue_1', [{
      ...droneGadget,
      currentUses: 1,
      currentCooldown: 0,
    }]);
  }

  // Run battle
  const result = runGadgetBattle(
    [blueUnit],
    [redUnit],
    blueGadgets,
    new Map(),
    20
  );

  console.log(`\nBattle Result: ${result.winner} wins in ${result.rounds} rounds`);
  console.log(`Events logged: ${result.log.length}`);

  // Check if drone was spawned
  const spawnEvents = result.log.filter(e => 'spawnedUnits' in e && e.spawnedUnits);
  console.log(`Drones spawned: ${spawnEvents.length}`);

  console.log('\n' + '='.repeat(60));
}
