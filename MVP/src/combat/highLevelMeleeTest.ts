/**
 * High-Level Melee Combat Test
 * Tests what happens when two elite martial artists fight
 */

import {
  createCustomUnit,
  runBatch,
  WEAPONS,
} from './index';

console.log('============================================================');
console.log('        HIGH-LEVEL MELEE COMBAT TEST');
console.log('============================================================');
console.log();

// Test 1: Elite vs Elite (MEL 50 each)
console.log('--- Elite Fighter (MEL 50) vs Elite Fighter (MEL 50) ---');
const eliteVsElite = runBatch(
  [createCustomUnit('blue', 'Elite Fighter A', { MEL: 50, AGL: 40, STR: 30, STA: 30 }, WEAPONS.uppercut)],
  [createCustomUnit('red', 'Elite Fighter B', { MEL: 50, AGL: 40, STR: 30, STA: 30 }, WEAPONS.uppercut)],
  1000
);
console.log(`Result: Blue ${eliteVsElite.blueWinRate.toFixed(1)}% | Red ${eliteVsElite.redWinRate.toFixed(1)}%`);
console.log();

// Test 2: Master vs Master (MEL 60)
console.log('--- Master Fighter (MEL 60) vs Master Fighter (MEL 60) ---');
const masterVsMaster = runBatch(
  [createCustomUnit('blue', 'Master A', { MEL: 60, AGL: 50, STR: 35, STA: 35 }, WEAPONS.roundhouseKick)],
  [createCustomUnit('red', 'Master B', { MEL: 60, AGL: 50, STR: 35, STA: 35 }, WEAPONS.roundhouseKick)],
  1000
);
console.log(`Result: Blue ${masterVsMaster.blueWinRate.toFixed(1)}% | Red ${masterVsMaster.redWinRate.toFixed(1)}%`);
console.log();

// Test 3: Elite vs Regular Boxer (MEL 50 vs MEL 25)
console.log('--- Elite (MEL 50) vs Regular Boxer (MEL 25) ---');
const eliteVsRegular = runBatch(
  [createCustomUnit('blue', 'Elite', { MEL: 50, AGL: 40, STR: 30, STA: 30 }, WEAPONS.uppercut)],
  [createCustomUnit('red', 'Regular Boxer', { MEL: 25, AGL: 20, STR: 20, STA: 20 }, WEAPONS.cross)],
  1000
);
console.log(`Result: Elite ${eliteVsRegular.blueWinRate.toFixed(1)}% | Regular ${eliteVsRegular.redWinRate.toFixed(1)}%`);
console.log();

// Test 4: Master vs 2 Regular Boxers
console.log('--- Master (MEL 60) vs 2 Regular Boxers ---');
const masterVsTwo = runBatch(
  [createCustomUnit('blue', 'Master', { MEL: 60, AGL: 50, STR: 35, STA: 35 }, WEAPONS.roundhouseKick)],
  [
    createCustomUnit('red', 'Regular 1', { MEL: 25, AGL: 20, STR: 20, STA: 20 }, WEAPONS.cross),
    createCustomUnit('red', 'Regular 2', { MEL: 25, AGL: 20, STR: 20, STA: 20 }, WEAPONS.cross),
  ],
  1000
);
console.log(`Result: Master ${masterVsTwo.blueWinRate.toFixed(1)}% | 2 Regulars ${masterVsTwo.redWinRate.toFixed(1)}%`);
console.log();

// Test 5: Evenly matched with different attacks (jab spam vs power)
console.log('--- Jab Spammer (MEL 50) vs Power Hitter (MEL 50) ---');
const jabVsPower = runBatch(
  [createCustomUnit('blue', 'Jab Spammer', { MEL: 50, AGL: 40, STR: 30, STA: 30 }, WEAPONS.jab)],
  [createCustomUnit('red', 'Power Hitter', { MEL: 50, AGL: 40, STR: 30, STA: 30 }, WEAPONS.uppercut)],
  1000
);
console.log(`Result: Jab ${jabVsPower.blueWinRate.toFixed(1)}% | Power ${jabVsPower.redWinRate.toFixed(1)}%`);
console.log();

// Test 6: Boxer vs Kickboxer at high level
console.log('--- Elite Boxer (MEL 50) vs Elite Kickboxer (MEL 50) ---');
const boxerVsKick = runBatch(
  [createCustomUnit('blue', 'Elite Boxer', { MEL: 50, AGL: 40, STR: 30, STA: 30 }, WEAPONS.hook)],
  [createCustomUnit('red', 'Elite Kickboxer', { MEL: 50, AGL: 40, STR: 30, STA: 30 }, WEAPONS.roundhouseKick)],
  1000
);
console.log(`Result: Boxer ${boxerVsKick.blueWinRate.toFixed(1)}% | Kickboxer ${boxerVsKick.redWinRate.toFixed(1)}%`);
console.log();

// Test 7: Super high level - MEL 80 vs MEL 80
console.log('--- Grandmaster (MEL 80) vs Grandmaster (MEL 80) ---');
const gmVsGm = runBatch(
  [createCustomUnit('blue', 'Grandmaster A', { MEL: 80, AGL: 60, STR: 40, STA: 40 }, WEAPONS.roundhouseKick)],
  [createCustomUnit('red', 'Grandmaster B', { MEL: 80, AGL: 60, STR: 40, STA: 40 }, WEAPONS.roundhouseKick)],
  1000
);
console.log(`Result: Blue ${gmVsGm.blueWinRate.toFixed(1)}% | Red ${gmVsGm.redWinRate.toFixed(1)}%`);
console.log();

console.log('============================================================');
console.log('        ANALYSIS');
console.log('============================================================');
console.log();
console.log('Target outcomes:');
console.log('- Mirror match: ~50% (balanced)');
console.log('- Elite vs Regular: ~75-85% (skill matters)');
console.log('- Master vs 2 Regulars: ~40-60% (numbers help but skill wins)');
console.log('- Jab vs Power: ~50% (different strategies, same effectiveness)');
