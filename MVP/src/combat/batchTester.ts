/**
 * Batch Tester - Run thousands of battles for balance testing
 *
 * Performance target: 1000 battles in < 1 second
 */

import {
  SimUnit,
  BatchResult,
  BattleConfig,
} from './types';

import { runQuickBattle, runBattle } from './battleRunner';

/**
 * Run a batch of battles and collect statistics.
 *
 * @param blueTeam - Blue team units
 * @param redTeam - Red team units
 * @param iterations - Number of battles to run
 * @param config - Battle configuration
 * @returns Aggregated statistics
 */
export function runBatch(
  blueTeam: SimUnit[],
  redTeam: SimUnit[],
  iterations: number,
  config: Partial<BattleConfig> = {}
): BatchResult {
  const startTime = performance.now();

  let blueWins = 0;
  let redWins = 0;
  let draws = 0;
  let totalRounds = 0;
  let totalBlueDeaths = 0;
  let totalRedDeaths = 0;
  let totalBlueDamage = 0;
  let totalRedDamage = 0;

  const weaponStats: BatchResult['weaponStats'] = {};

  // Run battles
  for (let i = 0; i < iterations; i++) {
    // Use quick battle for large batches, full battle for small
    if (iterations > 100) {
      const result = runQuickBattle(blueTeam, redTeam, config.maxRounds);
      if (result.winner === 'blue') blueWins++;
      else if (result.winner === 'red') redWins++;
      else draws++;
      totalRounds += result.rounds;
    } else {
      const result = runBattle(blueTeam, redTeam, config);
      if (result.winner === 'blue') blueWins++;
      else if (result.winner === 'red') redWins++;
      else draws++;
      totalRounds += result.rounds;
      totalBlueDeaths += result.blueDeaths.length;
      totalRedDeaths += result.redDeaths.length;
      totalBlueDamage += result.blueDamageDealt;
      totalRedDamage += result.redDamageDealt;

      // Track weapon stats
      for (const attack of result.log) {
        const weapon = attack.weapon;
        if (!weaponStats[weapon]) {
          weaponStats[weapon] = {
            shots: 0,
            hits: 0,
            crits: 0,
            totalDamage: 0,
            kills: 0,
            hitRate: 0,
            avgDamage: 0,
          };
        }
        weaponStats[weapon].shots++;
        if (attack.hitResult !== 'miss') {
          weaponStats[weapon].hits++;
          weaponStats[weapon].totalDamage += attack.finalDamage;
        }
        if (attack.hitResult === 'crit') {
          weaponStats[weapon].crits++;
        }
        if (attack.killed) {
          weaponStats[weapon].kills++;
        }
      }
    }
  }

  // Calculate weapon derived stats
  for (const weapon of Object.keys(weaponStats)) {
    const stats = weaponStats[weapon];
    stats.hitRate = stats.shots > 0 ? (stats.hits / stats.shots) * 100 : 0;
    stats.avgDamage = stats.hits > 0 ? stats.totalDamage / stats.hits : 0;
  }

  const endTime = performance.now();
  const duration = endTime - startTime;

  return {
    totalFights: iterations,
    blueWins,
    redWins,
    draws,
    blueWinRate: (blueWins / iterations) * 100,
    redWinRate: (redWins / iterations) * 100,
    drawRate: (draws / iterations) * 100,
    avgRounds: totalRounds / iterations,
    avgBlueDeaths: iterations > 100 ? 0 : totalBlueDeaths / iterations,
    avgRedDeaths: iterations > 100 ? 0 : totalRedDeaths / iterations,
    avgBlueDamage: iterations > 100 ? 0 : totalBlueDamage / iterations,
    avgRedDamage: iterations > 100 ? 0 : totalRedDamage / iterations,
    weaponStats,
    totalDurationMs: duration,
    fightsPerSecond: (iterations / duration) * 1000,
  };
}

/**
 * Compare two loadouts by running battles against a baseline.
 */
export function compareLoadouts(
  baseline: SimUnit[],
  variantA: SimUnit[],
  variantB: SimUnit[],
  iterations: number = 1000
): {
  aVsBaseline: BatchResult;
  bVsBaseline: BatchResult;
  comparison: {
    aWinRate: number;
    bWinRate: number;
    advantage: 'A' | 'B' | 'EQUAL';
    winRateDiff: number;
  };
} {
  const aVsBaseline = runBatch(variantA, baseline, iterations);
  const bVsBaseline = runBatch(variantB, baseline, iterations);

  const winRateDiff = aVsBaseline.blueWinRate - bVsBaseline.blueWinRate;
  let advantage: 'A' | 'B' | 'EQUAL';
  if (Math.abs(winRateDiff) < 5) {
    advantage = 'EQUAL';
  } else if (winRateDiff > 0) {
    advantage = 'A';
  } else {
    advantage = 'B';
  }

  return {
    aVsBaseline,
    bVsBaseline,
    comparison: {
      aWinRate: aVsBaseline.blueWinRate,
      bWinRate: bVsBaseline.blueWinRate,
      advantage,
      winRateDiff,
    },
  };
}

/**
 * Run a weapon effectiveness test.
 * Tests the same unit with different weapons against same enemies.
 */
export function testWeaponEffectiveness(
  baseUnit: Omit<SimUnit, 'weapon'>,
  weapons: SimUnit['weapon'][],
  enemies: SimUnit[],
  iterations: number = 500
): Record<string, BatchResult> {
  const results: Record<string, BatchResult> = {};

  for (const weapon of weapons) {
    const testUnit: SimUnit = {
      ...baseUnit,
      weapon,
    } as SimUnit;

    results[weapon.name] = runBatch([testUnit], enemies, iterations);
  }

  return results;
}

/**
 * Run a cover effectiveness test.
 * Tests how much cover affects survival.
 */
export function testCoverEffectiveness(
  defenders: SimUnit[],
  attackers: SimUnit[],
  iterations: number = 500
): {
  noCover: BatchResult;
  halfCover: BatchResult;
  fullCover: BatchResult;
} {
  // Clone defenders with different cover states
  const noCoverDefenders = defenders.map(d => ({ ...d, cover: 'none' as const }));
  const halfCoverDefenders = defenders.map(d => ({ ...d, cover: 'half' as const }));
  const fullCoverDefenders = defenders.map(d => ({ ...d, cover: 'full' as const }));

  return {
    noCover: runBatch(noCoverDefenders, attackers, iterations),
    halfCover: runBatch(halfCoverDefenders, attackers, iterations),
    fullCover: runBatch(fullCoverDefenders, attackers, iterations),
  };
}

/**
 * Run a stance effectiveness test.
 */
export function testStanceEffectiveness(
  units: SimUnit[],
  enemies: SimUnit[],
  iterations: number = 500
): {
  normal: BatchResult;
  aggressive: BatchResult;
  defensive: BatchResult;
} {
  const normalUnits = units.map(u => ({ ...u, stance: 'normal' as const }));
  const aggressiveUnits = units.map(u => ({ ...u, stance: 'aggressive' as const }));
  const defensiveUnits = units.map(u => ({ ...u, stance: 'defensive' as const }));

  return {
    normal: runBatch(normalUnits, enemies, iterations),
    aggressive: runBatch(aggressiveUnits, enemies, iterations),
    defensive: runBatch(defensiveUnits, enemies, iterations),
  };
}

/**
 * Format batch result for console output.
 */
export function formatBatchResult(result: BatchResult): string {
  const lines = [
    `=== BATCH RESULTS (${result.totalFights} fights) ===`,
    ``,
    `Win Rates:`,
    `  Blue: ${result.blueWinRate.toFixed(1)}%`,
    `  Red:  ${result.redWinRate.toFixed(1)}%`,
    `  Draw: ${result.drawRate.toFixed(1)}%`,
    ``,
    `Averages:`,
    `  Rounds: ${result.avgRounds.toFixed(1)}`,
    `  Blue Deaths: ${result.avgBlueDeaths.toFixed(2)}`,
    `  Red Deaths:  ${result.avgRedDeaths.toFixed(2)}`,
    ``,
    `Performance:`,
    `  Duration: ${result.totalDurationMs.toFixed(1)}ms`,
    `  Speed: ${result.fightsPerSecond.toFixed(0)} fights/sec`,
  ];

  if (Object.keys(result.weaponStats).length > 0) {
    lines.push(``, `Weapon Stats:`);
    for (const [weapon, stats] of Object.entries(result.weaponStats)) {
      lines.push(`  ${weapon}:`);
      lines.push(`    Hit Rate: ${stats.hitRate.toFixed(1)}%, Avg Dmg: ${stats.avgDamage.toFixed(1)}, Kills: ${stats.kills}`);
    }
  }

  return lines.join('\n');
}
