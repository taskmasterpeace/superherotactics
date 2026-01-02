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
  faceToward,
  // New 2-action system
  resetTurnState,
  canPerformAction,
  spendAction,
  isTurnComplete,
  getMovementRange,
  getDashRange,
} from './core';

import {
  processStatusEffects,
  canUnitAct,
} from './statusEffects';

import {
  processShieldRegen,
} from './types';

import {
  checkMorale,
  getPanicModifiers,
  PanicLevel,
} from './advancedMechanics';

/**
 * Process morale check for a unit when something bad happens.
 * Updates the unit's panicLevel in place.
 */
function processMoraleCheck(
  unit: SimUnit,
  trigger: 'ally_killed' | 'critical_hit' | 'health_low' | 'outnumbered' | 'suppressed'
): void {
  const currentLevel = unit.panicLevel || 'steady';
  const result = checkMorale(unit, trigger, currentLevel);

  if (!result.passed) {
    unit.panicLevel = result.newLevel;
  }
}

/**
 * Check all allies for morale when someone dies.
 * Witnessing an ally's death can break morale.
 */
function checkAllyDeathMorale(allies: SimUnit[], deadUnit: SimUnit): void {
  for (const ally of allies) {
    if (!ally.alive || ally.id === deadUnit.id) continue;
    processMoraleCheck(ally, 'ally_killed');
  }
}

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
 * Initialize unit facing at battle start.
 * Each unit faces the nearest enemy to prevent flanking bias
 * from default facing direction (all units face right by default).
 */
function initializeUnitFacing(blue: SimUnit[], red: SimUnit[]): void {
  // Only initialize if any units have positions
  const hasPositions = [...blue, ...red].some(u => u.position);
  if (!hasPositions) return;

  // Make each blue unit face the nearest red unit
  for (const unit of blue) {
    if (!unit.position) continue;
    const nearestEnemy = findNearestEnemy(unit, red);
    if (nearestEnemy?.position) {
      faceToward(unit, nearestEnemy.position.x, nearestEnemy.position.y);
    }
  }

  // Make each red unit face the nearest blue unit
  for (const unit of red) {
    if (!unit.position) continue;
    const nearestEnemy = findNearestEnemy(unit, blue);
    if (nearestEnemy?.position) {
      faceToward(unit, nearestEnemy.position.x, nearestEnemy.position.y);
    }
  }
}

/**
 * Find the nearest enemy with a position.
 */
function findNearestEnemy(unit: SimUnit, enemies: SimUnit[]): SimUnit | null {
  if (!unit.position) return null;

  let nearest: SimUnit | null = null;
  let nearestDist = Infinity;

  for (const enemy of enemies) {
    if (!enemy.position || !enemy.alive) continue;
    const dx = unit.position.x - enemy.position.x;
    const dy = unit.position.y - enemy.position.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < nearestDist) {
      nearestDist = dist;
      nearest = enemy;
    }
  }

  return nearest;
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

  // Initialize unit facing to prevent flanking bias
  // Without this, all units default to facing right, giving
  // the left-side team a massive flanking advantage.
  initializeUnitFacing(blue, red);

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

      // PROCESS SHIELD REGENERATION at start of turn
      processShieldRegen(unit);

      // PROCESS STATUS EFFECTS at start of turn
      // This handles: DoT damage, stun saves, duration countdown
      const statusResult = processStatusEffects(unit);

      // Check if unit died from DoT (bleeding, poison, burning)
      if (!unit.alive) {
        continue;
      }

      // Check if unit's turn is skipped (stun) or if BROKEN (panic)
      const panicMods = getPanicModifiers(unit.panicLevel || 'steady');
      if (statusResult.turnSkipped || !canUnitAct(unit) || !panicMods.canAct) {
        unit.acted = true;
        continue;
      }

      unit.acted = true;

      // Find enemies
      const enemies = unit.team === 'blue' ? red : blue;

      // XCOM-STYLE 2-ACTION SYSTEM
      // Each unit gets 2 actions: Move + Attack, Dash, or Overwatch
      resetTurnState(unit);

      while (!isTurnComplete(unit) && unit.alive) {
        // Select target
        const target = selectTarget(unit, enemies);
        if (!target) break;

        // Calculate distance if positions exist
        const distance = calculateDistance(unit, target);
        const weaponRange = unit.weapon.range || 1;

        // AI Decision: If in range, attack. Otherwise, move closer.
        const inRange = distance === undefined || distance <= weaponRange;

        if (inRange && canPerformAction(unit, 'attack')) {
          // Attack (ends turn)
          const result = resolveAttack(unit, target, distance);
          log.push(result);
          applyAttackResult(target, result);
          spendAction(unit, 'attack'); // Ends turn

          // MORALE CHECKS after taking damage
          if (result.hitResult === 'crit' && target.alive) {
            // Critical hit - morale check for target
            processMoraleCheck(target, 'critical_hit');
          }

          if (target.alive && target.hp < target.maxHp * 0.25) {
            // Low HP - morale check for target
            processMoraleCheck(target, 'health_low');
          }

          if (!target.alive) {
            // Target died - morale check for their allies
            const targetAllies = target.team === 'blue' ? blue : red;
            checkAllyDeathMorale(targetAllies, target);
          }

          // COUNTER-ATTACK CHECK
          if (canCounterAttack(target, unit, result)) {
            const counterResult = resolveCounterAttack(target, unit);
            if (counterResult) {
              log.push(counterResult);
              applyAttackResult(unit, counterResult);
            }
          }
        } else if (canPerformAction(unit, 'move')) {
          // Move closer (uses 1 action, can still attack after)
          spendAction(unit, 'move');
          // Note: In headless sim, we don't actually move positions
          // Just simulate the action economy
        } else {
          // No valid actions, end turn
          break;
        }

        // Check for victory after each action
        if (isTeamEliminated(enemies)) {
          break;
        }
      }

      // Check for victory
      if (isTeamEliminated(blue) || isTeamEliminated(red)) {
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
 *
 * Uses XCOM-style 2-action system:
 * - Each unit gets 2 actions per turn
 * - Move = 1 action, Attack = 1 action (ends turn)
 * - Attack ends turn immediately (no multi-attack spam)
 */
export function runQuickBattle(
  blueTeam: SimUnit[],
  redTeam: SimUnit[],
  maxRounds: number = DEFAULT_BATTLE_CONFIG.maxRounds
): { winner: 'blue' | 'red' | 'draw'; rounds: number } {
  const blue = cloneTeam(blueTeam);
  const red = cloneTeam(redTeam);
  const allUnits = [...blue, ...red];

  // Initialize unit facing to prevent flanking bias
  initializeUnitFacing(blue, red);

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

      // Check if turn is skipped (stun) or BROKEN (panic)
      const panicMods = getPanicModifiers(unit.panicLevel || 'steady');
      if (statusResult.turnSkipped || !canUnitAct(unit) || !panicMods.canAct) continue;

      const enemies = unit.team === 'blue' ? red : blue;

      // XCOM-STYLE 2-ACTION SYSTEM
      resetTurnState(unit);

      while (!isTurnComplete(unit) && unit.alive) {
        const target = selectTarget(unit, enemies);
        if (!target) break;

        const distance = calculateDistance(unit, target);
        const weaponRange = unit.weapon.range || 1;
        const inRange = distance === undefined || distance <= weaponRange;

        if (inRange && canPerformAction(unit, 'attack')) {
          // Attack (ends turn)
          const result = resolveAttack(unit, target, distance);
          applyAttackResult(target, result);
          spendAction(unit, 'attack');

          if (isTeamEliminated(enemies)) {
            return { winner: unit.team, rounds };
          }
        } else if (canPerformAction(unit, 'move')) {
          // Move closer
          spendAction(unit, 'move');
        } else {
          break;
        }
      }

      // Check if enemy team was eliminated
      if (isTeamEliminated(blue) || isTeamEliminated(red)) {
        const winner = isTeamEliminated(red) ? 'blue' : 'red';
        return { winner, rounds };
      }
    }
  }

  // Draw
  return { winner: 'draw', rounds };
}
