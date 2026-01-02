/**
 * Grid Battle Test - Verify sniper vs martial artist behavior
 *
 * Run with: npx ts-node src/combat/gridBattleTest.ts
 * Or import and call testGridCombat() from console
 */

import { SimUnit } from './types';
import { runGridBattle, runQuickGridBattle, runQuickBattle } from './battleRunner';

/**
 * Create a sniper unit (long range, high accuracy)
 */
function createSniper(team: 'blue' | 'red', id: string): SimUnit {
  return {
    id,
    name: `Sniper ${id}`,
    team,
    hp: 80,
    maxHp: 80,
    alive: true,
    stats: {
      mel: 30,
      agl: 60,
      int: 70,
      ins: 65,
      con: 50,
    },
    weapon: {
      name: 'Sniper Rifle',
      damage: 45,
      range: 15,  // Long range
      accuracy: 85,
      isRanged: true,
      damageType: 'ballistic',
    },
    statusEffects: [],
    facing: 0,
    visionCone: { facing: 0, angle: 120, range: 20 },
    acted: false,
    dr: 0,
    drEnergy: 0,
    drMental: 0,
    stoppingPower: 0,
    shield: 0,
    maxShield: 0,
    shieldRegenRate: 0,
    shieldRegenDelay: 0,
    ins: 65,
    mel: 30,
  };
}

/**
 * Create a martial artist (melee range, high damage up close)
 */
function createMartialArtist(team: 'blue' | 'red', id: string): SimUnit {
  return {
    id,
    name: `Martial Artist ${id}`,
    team,
    hp: 100,
    maxHp: 100,
    alive: true,
    stats: {
      mel: 85,
      agl: 75,
      int: 50,
      ins: 60,
      con: 65,
    },
    weapon: {
      name: 'Fists',
      damage: 35,
      range: 1,  // Melee only!
      accuracy: 90,
      isRanged: false,
      damageType: 'bludgeon',
    },
    statusEffects: [],
    facing: 0,
    visionCone: { facing: 0, angle: 120, range: 15 },
    acted: false,
    dr: 2,  // Slightly tougher
    drEnergy: 0,
    drMental: 0,
    stoppingPower: 0,
    shield: 0,
    maxShield: 0,
    shieldRegenRate: 0,
    shieldRegenDelay: 0,
    ins: 60,
    mel: 85,
  };
}

/**
 * Run comparison test: grid battle vs old battle
 */
export function testGridCombat(): void {
  console.log('='.repeat(60));
  console.log('GRID COMBAT TEST: Sniper vs Martial Artist');
  console.log('='.repeat(60));
  console.log('');

  const ITERATIONS = 100;

  // Test 1: Old battle (no positions)
  console.log('TEST 1: Old Battle System (no grid, no positions)');
  console.log('-'.repeat(40));

  let oldSniperWins = 0;
  let oldMartialWins = 0;
  let oldDraws = 0;

  for (let i = 0; i < ITERATIONS; i++) {
    const sniper = createSniper('blue', `sniper-${i}`);
    const martialArtist = createMartialArtist('red', `martial-${i}`);

    const result = runQuickBattle([sniper], [martialArtist]);

    if (result.winner === 'blue') oldSniperWins++;
    else if (result.winner === 'red') oldMartialWins++;
    else oldDraws++;
  }

  console.log(`Sniper wins: ${oldSniperWins} (${(oldSniperWins / ITERATIONS * 100).toFixed(1)}%)`);
  console.log(`Martial Artist wins: ${oldMartialWins} (${(oldMartialWins / ITERATIONS * 100).toFixed(1)}%)`);
  console.log(`Draws: ${oldDraws} (${(oldDraws / ITERATIONS * 100).toFixed(1)}%)`);
  console.log('');

  // Test 2: Grid battle - Open terrain
  console.log('TEST 2: Grid Battle - OPEN Terrain');
  console.log('-'.repeat(40));

  let gridOpenSniperWins = 0;
  let gridOpenMartialWins = 0;
  let gridOpenDraws = 0;

  for (let i = 0; i < ITERATIONS; i++) {
    const sniper = createSniper('blue', `sniper-${i}`);
    const martialArtist = createMartialArtist('red', `martial-${i}`);

    const result = runQuickGridBattle([sniper], [martialArtist], 'open');

    if (result.winner === 'blue') gridOpenSniperWins++;
    else if (result.winner === 'red') gridOpenMartialWins++;
    else gridOpenDraws++;
  }

  console.log(`Sniper wins: ${gridOpenSniperWins} (${(gridOpenSniperWins / ITERATIONS * 100).toFixed(1)}%)`);
  console.log(`Martial Artist wins: ${gridOpenMartialWins} (${(gridOpenMartialWins / ITERATIONS * 100).toFixed(1)}%)`);
  console.log(`Draws: ${gridOpenDraws} (${(gridOpenDraws / ITERATIONS * 100).toFixed(1)}%)`);
  console.log('');

  // Test 3: Grid battle - Indoor terrain (close quarters)
  console.log('TEST 3: Grid Battle - INDOOR Terrain (close quarters)');
  console.log('-'.repeat(40));

  let gridIndoorSniperWins = 0;
  let gridIndoorMartialWins = 0;
  let gridIndoorDraws = 0;

  for (let i = 0; i < ITERATIONS; i++) {
    const sniper = createSniper('blue', `sniper-${i}`);
    const martialArtist = createMartialArtist('red', `martial-${i}`);

    const result = runQuickGridBattle([sniper], [martialArtist], 'indoor');

    if (result.winner === 'blue') gridIndoorSniperWins++;
    else if (result.winner === 'red') gridIndoorMartialWins++;
    else gridIndoorDraws++;
  }

  console.log(`Sniper wins: ${gridIndoorSniperWins} (${(gridIndoorSniperWins / ITERATIONS * 100).toFixed(1)}%)`);
  console.log(`Martial Artist wins: ${gridIndoorMartialWins} (${(gridIndoorMartialWins / ITERATIONS * 100).toFixed(1)}%)`);
  console.log(`Draws: ${gridIndoorDraws} (${(gridIndoorDraws / ITERATIONS * 100).toFixed(1)}%)`);
  console.log('');

  // Test 4: Performance
  console.log('TEST 4: Performance (100 grid battles)');
  console.log('-'.repeat(40));

  const startTime = performance.now();

  for (let i = 0; i < 100; i++) {
    const sniper = createSniper('blue', `sniper-${i}`);
    const martialArtist = createMartialArtist('red', `martial-${i}`);
    runQuickGridBattle([sniper], [martialArtist], 'open');
  }

  const endTime = performance.now();
  const totalMs = endTime - startTime;
  const battlesPerSec = Math.floor(100 / (totalMs / 1000));

  console.log(`Total time: ${totalMs.toFixed(2)}ms`);
  console.log(`Battles per second: ${battlesPerSec}`);
  console.log('');

  // Summary
  console.log('='.repeat(60));
  console.log('SUMMARY');
  console.log('='.repeat(60));
  console.log('');
  console.log('Expected behavior:');
  console.log('- Old system: ~50/50 (no positioning)');
  console.log('- Open terrain: Sniper should dominate (~70-80%)');
  console.log('- Indoor terrain: More balanced or Martial Artist advantage');
  console.log('');
  console.log('Actual results:');
  console.log(`- Old system: Sniper ${(oldSniperWins / ITERATIONS * 100).toFixed(0)}% vs Martial ${(oldMartialWins / ITERATIONS * 100).toFixed(0)}%`);
  console.log(`- Open grid: Sniper ${(gridOpenSniperWins / ITERATIONS * 100).toFixed(0)}% vs Martial ${(gridOpenMartialWins / ITERATIONS * 100).toFixed(0)}%`);
  console.log(`- Indoor grid: Sniper ${(gridIndoorSniperWins / ITERATIONS * 100).toFixed(0)}% vs Martial ${(gridIndoorMartialWins / ITERATIONS * 100).toFixed(0)}%`);
}

// Export for browser/console use
export default testGridCombat;

// If running directly
if (typeof window === 'undefined' && typeof process !== 'undefined') {
  testGridCombat();
}
