/**
 * Battle Runner - Full Battle Simulation
 *
 * Orchestrates complete battles between teams.
 * NO Phaser dependencies - pure TypeScript.
 */

import {
  SimUnit,
  AttackResult,
  BattleResult,
  BattleConfig,
  DEFAULT_BATTLE_CONFIG,
} from './types';

import {
  resolveAttack,
  applyAttackResult,
  getTurnOrder,
  selectTarget,
  calculateDistance,
  canCounterAttack,
  resolveCounterAttack,
} from './core';

import {
  processStatusEffects,
  canUnitAct,
} from './statusEffects';

/**
 * Clone a unit for simulation (avoid mutating originals).
 */
function cloneUnit(unit: SimUnit): SimUnit {
  return {
    ...unit,
    stats: { ...unit.stats },
    statusEffects: [...unit.statusEffects],
    weapon: { ...unit.weapon },
    position: unit.position ? { ...unit.position } : undefined,
  };
}

/**
 * Clone a team of units.
 */
function cloneTeam(units: SimUnit[]): SimUnit[] {
  return units.map(cloneUnit);
}

/**
 * Check if a team is eliminated.
 */
function isTeamEliminated(units: SimUnit[]): boolean {
  return units.every(u => !u.alive);
}

/**
 * Run a single battle between two teams.
 *
 * @param blueTeam - Blue team units (will be cloned)
 * @param redTeam - Red team units (will be cloned)
 * @param config - Battle configuration
 * @returns Complete battle result
 */
export function runBattle(
  blueTeam: SimUnit[],
  redTeam: SimUnit[],
  config: Partial<BattleConfig> = {}
): BattleResult {
  const startTime = performance.now();
  const fullConfig = { ...DEFAULT_BATTLE_CONFIG, ...config };

  // Clone units to avoid mutating originals
  const blue = cloneTeam(blueTeam);
  const red = cloneTeam(redTeam);
  const allUnits = [...blue, ...red];

  const log: AttackResult[] = [];
  let rounds = 0;
  let totalTurns = 0;

  // Main battle loop
  while (rounds < fullConfig.maxRounds) {
    rounds++;

    // Get turn order for this round
    const turnOrder = getTurnOrder(allUnits);

    // Process each unit's turn
    for (const unit of turnOrder) {
      if (!unit.alive) continue;
      if (totalTurns >= fullConfig.maxTurnsPerRound * rounds) break;

      totalTurns++;

      // PROCESS STATUS EFFECTS at start of turn
      // This handles: DoT damage, stun saves, duration countdown
      const statusResult = processStatusEffects(unit);

      // Check if unit died from DoT (bleeding, poison, burning)
      if (!unit.alive) {
        continue;
      }

      // Check if unit's turn is skipped (stun)
      if (statusResult.turnSkipped || !canUnitAct(unit)) {
        unit.acted = true;
        continue;
      }

      unit.acted = true;

      // Find enemies
      const enemies = unit.team === 'blue' ? red : blue;

      // Select target
      const target = selectTarget(unit, enemies);
      if (!target) continue;

      // Calculate distance if positions exist
      const distance = calculateDistance(unit, target);

      // Resolve attack
      const result = resolveAttack(unit, target, distance);
      log.push(result);

      // Apply result (includes applying new status effects)
      applyAttackResult(target, result);

      // COUNTER-ATTACK CHECK
      // If a trained unarmed fighter dodges a melee attack, they may counter
      if (canCounterAttack(target, unit, result)) {
        const counterResult = resolveCounterAttack(target, unit);
        if (counterResult) {
          log.push(counterResult);
          applyAttackResult(unit, counterResult);

          // Check if counter killed the attacker
          if (!unit.alive) {
            // Don't check for victory yet, let the loop continue
          }
        }
      }

      // Check for victory
      if (isTeamEliminated(enemies)) {
        break;
      }
    }

    // Reset acted flags
    allUnits.forEach(u => u.acted = false);

    // Check for victory
    if (isTeamEliminated(blue) || isTeamEliminated(red)) {
      break;
    }
  }

  // Determine winner
  const blueAlive = blue.filter(u => u.alive);
  const redAlive = red.filter(u => u.alive);

  let winner: 'blue' | 'red' | 'draw';
  if (blueAlive.length > 0 && redAlive.length === 0) {
    winner = 'blue';
  } else if (redAlive.length > 0 && blueAlive.length === 0) {
    winner = 'red';
  } else if (fullConfig.allowDraw) {
    winner = 'draw';
  } else {
    // Tiebreaker: team with more HP wins
    const blueHp = blueAlive.reduce((sum, u) => sum + u.hp, 0);
    const redHp = redAlive.reduce((sum, u) => sum + u.hp, 0);
    winner = blueHp >= redHp ? 'blue' : 'red';
  }

  // Calculate damage dealt
  const blueDamage = log
    .filter(r => blue.some(u => u.id === r.attacker))
    .reduce((sum, r) => sum + r.finalDamage, 0);
  const redDamage = log
    .filter(r => red.some(u => u.id === r.attacker))
    .reduce((sum, r) => sum + r.finalDamage, 0);

  // Get death lists
  const blueDeaths = blue.filter(u => !u.alive).map(u => u.name);
  const redDeaths = red.filter(u => !u.alive).map(u => u.name);

  const endTime = performance.now();

  return {
    winner,
    rounds,
    totalTurns,
    blueUnitsStart: blueTeam.length,
    blueSurvivors: blueAlive.length,
    blueDeaths,
    redUnitsStart: redTeam.length,
    redSurvivors: redAlive.length,
    redDeaths,
    blueDamageDealt: blueDamage,
    redDamageDealt: redDamage,
    log,
    durationMs: endTime - startTime,
  };
}

/**
 * Run a quick battle without detailed logging.
 * Faster for batch testing.
 */
export function runQuickBattle(
  blueTeam: SimUnit[],
  redTeam: SimUnit[],
  maxRounds: number = 50
): { winner: 'blue' | 'red' | 'draw'; rounds: number } {
  const blue = cloneTeam(blueTeam);
  const red = cloneTeam(redTeam);
  const allUnits = [...blue, ...red];

  let rounds = 0;

  while (rounds < maxRounds) {
    rounds++;
    const turnOrder = getTurnOrder(allUnits);

    for (const unit of turnOrder) {
      if (!unit.alive) continue;

      // Process status effects at start of turn
      const statusResult = processStatusEffects(unit);

      // Check if unit died from DoT
      if (!unit.alive) continue;

      // Check if turn is skipped (stun)
      if (statusResult.turnSkipped || !canUnitAct(unit)) continue;

      const enemies = unit.team === 'blue' ? red : blue;
      const target = selectTarget(unit, enemies);
      if (!target) continue;

      const distance = calculateDistance(unit, target);
      const result = resolveAttack(unit, target, distance);
      applyAttackResult(target, result);

      if (isTeamEliminated(enemies)) {
        return { winner: unit.team, rounds };
      }
    }
  }

  // Draw
  return { winner: 'draw', rounds };
}
