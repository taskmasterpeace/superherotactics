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

import {
  GridMap,
  gridDistance,
  hasLineOfSight,
  getCoverAtPosition,
  findPath,
  placeUnit,
  moveUnit,
  findUnitPosition,
  getReachableTiles,
} from './gridEngine';

import {
  generateQuickMap,
  loadMapTemplate,
  generateMap,
  MapConfig,
  MapTerrain,
} from './mapGenerator';

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
          result.round = rounds;
          result.turn = totalTurns;
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
              counterResult.round = rounds;
              counterResult.turn = totalTurns;
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

// =============================================================================
// GRID BATTLE SYSTEM
// =============================================================================

export interface GridBattleConfig extends BattleConfig {
  useGrid: true;
  mapTemplate?: string;      // Use existing template ID
  mapConfig?: MapConfig;     // Or generate procedural map
  terrain?: MapTerrain;      // Quick terrain type for generateQuickMap
}

/**
 * Run a grid-based battle with real positions, pathfinding, LOS, and cover.
 * Units spawn at map entry points and must move to close distance.
 */
export function runGridBattle(
  blueTeam: SimUnit[],
  redTeam: SimUnit[],
  config: Partial<GridBattleConfig> = {}
): BattleResult {
  const startTime = performance.now();
  const fullConfig: GridBattleConfig = {
    ...DEFAULT_BATTLE_CONFIG,
    useGrid: true,
    ...config,
  };

  // Clone units
  const blue = cloneTeam(blueTeam);
  const red = cloneTeam(redTeam);
  const allUnits = [...blue, ...red];

  // Create or load map
  let map: GridMap;
  if (fullConfig.mapTemplate) {
    const loaded = loadMapTemplate(fullConfig.mapTemplate);
    if (!loaded) {
      // Fallback to quick map
      map = generateQuickMap(blue.length, red.length, fullConfig.terrain || 'open');
    } else {
      map = loaded;
    }
  } else if (fullConfig.mapConfig) {
    map = generateMap(fullConfig.mapConfig);
  } else {
    map = generateQuickMap(blue.length, red.length, fullConfig.terrain || 'open');
  }

  // Place units at entry points
  placeUnitsAtEntryPoints(blue, red, map);

  // Initialize facing
  initializeUnitFacing(blue, red);

  const log: AttackResult[] = [];
  let rounds = 0;
  let totalTurns = 0;

  // Main battle loop
  while (rounds < fullConfig.maxRounds) {
    rounds++;
    const turnOrder = getTurnOrder(allUnits);

    for (const unit of turnOrder) {
      if (!unit.alive) continue;
      if (totalTurns >= fullConfig.maxTurnsPerRound * rounds) break;

      totalTurns++;

      // Shield regen
      processShieldRegen(unit);

      // Status effects
      const statusResult = processStatusEffects(unit);
      if (!unit.alive) continue;

      // Panic check
      const panicMods = getPanicModifiers(unit.panicLevel || 'steady');
      if (statusResult.turnSkipped || !canUnitAct(unit) || !panicMods.canAct) {
        unit.acted = true;
        continue;
      }

      unit.acted = true;
      const enemies = unit.team === 'blue' ? red : blue;

      // 2-action system
      resetTurnState(unit);

      while (!isTurnComplete(unit) && unit.alive) {
        const target = selectGridTarget(unit, enemies, map);
        if (!target) break;

        const unitPos = unit.position!;
        const targetPos = target.position!;
        const distance = gridDistance(unitPos.x, unitPos.y, targetPos.x, targetPos.y);
        const weaponRange = unit.weapon.range || 1;

        // Check LOS
        const hasLOS = hasLineOfSight(map, unitPos.x, unitPos.y, targetPos.x, targetPos.y);

        // In range AND has LOS?
        const inRange = distance <= weaponRange && hasLOS;

        if (inRange && canPerformAction(unit, 'attack')) {
          // Get cover for accuracy modifier
          const cover = getCoverAtPosition(map, targetPos.x, targetPos.y, unitPos.x, unitPos.y);

          // Attack
          const result = resolveAttack(unit, target, distance);
          result.round = rounds;
          result.turn = totalTurns;

          // Apply cover evasion bonus
          if (cover === 'half') {
            result.accuracy = Math.max(5, result.accuracy - 12);
          } else if (cover === 'full') {
            result.accuracy = Math.max(5, result.accuracy - 16);
          }

          // Re-roll hit based on modified chance
          if (cover !== 'none') {
            const roll = Math.random() * 100;
            if (roll > result.accuracy && result.hitResult !== 'miss') {
              result.hitResult = 'miss';
              result.finalDamage = 0;
            }
          }

          log.push(result);
          applyAttackResult(target, result);
          spendAction(unit, 'attack');

          // Morale checks
          if (result.hitResult === 'crit' && target.alive) {
            processMoraleCheck(target, 'critical_hit');
          }
          if (target.alive && target.hp < target.maxHp * 0.25) {
            processMoraleCheck(target, 'health_low');
          }
          if (!target.alive) {
            // Remove from map
            moveUnit(map, target.id, -1, -1);
            const targetAllies = target.team === 'blue' ? blue : red;
            checkAllyDeathMorale(targetAllies, target);
          }

          // Counter-attack check
          if (canCounterAttack(target, unit, result)) {
            const counterResult = resolveCounterAttack(target, unit);
            if (counterResult) {
              counterResult.round = rounds;
              counterResult.turn = totalTurns;
              log.push(counterResult);
              applyAttackResult(unit, counterResult);
            }
          }
        } else if (canPerformAction(unit, 'move')) {
          // Move toward target
          const moved = aiGridMovement(unit, target, map);
          spendAction(unit, 'move');

          // Face target after moving
          if (moved && unit.position && target.position) {
            faceToward(unit, target.position.x, target.position.y);
          }
        } else {
          break;
        }

        if (isTeamEliminated(enemies)) break;
      }

      if (isTeamEliminated(blue) || isTeamEliminated(red)) break;
    }

    allUnits.forEach(u => u.acted = false);

    if (isTeamEliminated(blue) || isTeamEliminated(red)) break;
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
    const blueHp = blueAlive.reduce((sum, u) => sum + u.hp, 0);
    const redHp = redAlive.reduce((sum, u) => sum + u.hp, 0);
    winner = blueHp >= redHp ? 'blue' : 'red';
  }

  // Calculate damage
  const blueDamage = log
    .filter(r => blue.some(u => u.id === r.attacker))
    .reduce((sum, r) => sum + r.finalDamage, 0);
  const redDamage = log
    .filter(r => red.some(u => u.id === r.attacker))
    .reduce((sum, r) => sum + r.finalDamage, 0);

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
 * Place units at map entry points
 */
function placeUnitsAtEntryPoints(blue: SimUnit[], red: SimUnit[], map: GridMap): void {
  const blueEntries = map.entryPoints.filter(e => e.team === 'blue');
  const redEntries = map.entryPoints.filter(e => e.team === 'red');

  // Place blue units
  for (let i = 0; i < blue.length; i++) {
    const entry = blueEntries[i % blueEntries.length];
    blue[i].position = { x: entry.x, y: entry.y };
    placeUnit(map, blue[i].id, entry.x, entry.y);
  }

  // Place red units
  for (let i = 0; i < red.length; i++) {
    const entry = redEntries[i % redEntries.length];
    red[i].position = { x: entry.x, y: entry.y };
    placeUnit(map, red[i].id, entry.x, entry.y);
  }
}

/**
 * Select best target considering LOS
 */
function selectGridTarget(unit: SimUnit, enemies: SimUnit[], map: GridMap): SimUnit | null {
  const aliveEnemies = enemies.filter(e => e.alive && e.position);
  if (aliveEnemies.length === 0) return null;

  const unitPos = unit.position;
  if (!unitPos) return aliveEnemies[0];

  // Prefer enemies with LOS, then by distance and HP
  const scored = aliveEnemies.map(enemy => {
    const enemyPos = enemy.position!;
    const dist = gridDistance(unitPos.x, unitPos.y, enemyPos.x, enemyPos.y);
    const hasLOS = hasLineOfSight(map, unitPos.x, unitPos.y, enemyPos.x, enemyPos.y);
    const hpRatio = enemy.hp / enemy.maxHp;

    // Score: LOS matters most, then low HP, then close distance
    const losBonus = hasLOS ? 1000 : 0;
    const hpScore = (1 - hpRatio) * 100;
    const distScore = 100 - Math.min(dist * 5, 100);

    return { enemy, score: losBonus + hpScore + distScore };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored[0].enemy;
}

/**
 * AI movement on grid - move toward target
 */
function aiGridMovement(unit: SimUnit, target: SimUnit, map: GridMap): boolean {
  if (!unit.position || !target.position) return false;

  const moveRange = getMovementRange(unit);
  const reachable = getReachableTiles(map, unit.position.x, unit.position.y, moveRange);

  if (reachable.length === 0) return false;

  const weaponRange = unit.weapon.range || 1;
  const isRanged = weaponRange > 3;

  // Find best tile to move to
  let bestTile = reachable[0];
  let bestScore = -Infinity;

  for (const tile of reachable) {
    const distToTarget = gridDistance(tile.x, tile.y, target.position.x, target.position.y);
    const hasLOS = hasLineOfSight(map, tile.x, tile.y, target.position.x, target.position.y);

    let score = 0;

    // Melee: get as close as possible
    if (!isRanged) {
      score = 100 - distToTarget;
      if (hasLOS) score += 50;
    } else {
      // Ranged: get to optimal range (weaponRange * 0.7)
      const optimalDist = weaponRange * 0.7;
      const distFromOptimal = Math.abs(distToTarget - optimalDist);
      score = 100 - distFromOptimal * 5;

      // Strong preference for LOS
      if (hasLOS) score += 100;

      // Prefer not being too close
      if (distToTarget < 3) score -= 50;
    }

    if (score > bestScore) {
      bestScore = score;
      bestTile = tile;
    }
  }

  // Move unit
  const oldPos = unit.position;
  moveUnit(map, unit.id, bestTile.x, bestTile.y);
  unit.position = { x: bestTile.x, y: bestTile.y };

  return true;
}

/**
 * Quick grid battle for batch testing
 */
export function runQuickGridBattle(
  blueTeam: SimUnit[],
  redTeam: SimUnit[],
  terrain: MapTerrain = 'open',
  maxRounds: number = DEFAULT_BATTLE_CONFIG.maxRounds
): { winner: 'blue' | 'red' | 'draw'; rounds: number } {
  const result = runGridBattle(blueTeam, redTeam, {
    terrain,
    maxRounds,
    allowDraw: true,
  });

  return { winner: result.winner, rounds: result.rounds };
}
