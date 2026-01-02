/**
 * Test for new unit presets
 */
import { createUnit, UNIT_PRESETS, resetUnitIds } from './humanPresets';
import { runBatch } from './batchTester';

console.log('=== NEW UNIT COMBAT TESTS ===\n');

// Test thugs vs soldiers
resetUnitIds();
const soldiers = [createUnit(UNIT_PRESETS.soldierRifle, 'blue'), createUnit(UNIT_PRESETS.soldierRifle, 'blue')];
const thugs = [createUnit(UNIT_PRESETS.thug, 'red'), createUnit(UNIT_PRESETS.thug, 'red'), createUnit(UNIT_PRESETS.thug, 'red')];
let r = runBatch(soldiers, thugs, 500);
console.log(`2 Soldiers vs 3 Thugs: Soldiers ${r.blueWinRate.toFixed(1)}% | Thugs ${r.redWinRate.toFixed(1)}%`);

// Heavy gunner test
resetUnitIds();
const hg = [createUnit(UNIT_PRESETS.heavyGunner, 'blue')];
const sol2 = [createUnit(UNIT_PRESETS.soldierRifle, 'red'), createUnit(UNIT_PRESETS.soldierRifle, 'red')];
r = runBatch(hg, sol2, 500);
console.log(`1 Heavy Gunner vs 2 Soldiers: Heavy ${r.blueWinRate.toFixed(1)}% | Soldiers ${r.redWinRate.toFixed(1)}%`);

// War bot test
resetUnitIds();
const wb = [createUnit(UNIT_PRESETS.warBot, 'blue')];
const ops = [createUnit(UNIT_PRESETS.operativeSniper, 'red'), createUnit(UNIT_PRESETS.operativeSMG, 'red')];
r = runBatch(wb, ops, 500);
console.log(`1 War Bot vs 2 Elite Ops: Bot ${r.blueWinRate.toFixed(1)}% | Ops ${r.redWinRate.toFixed(1)}%`);

// Boss test - standard squad
resetUnitIds();
const boss = [createUnit(UNIT_PRESETS.bossJuggernaut, 'blue')];
const squad = [
  createUnit(UNIT_PRESETS.soldierRifle, 'red'),
  createUnit(UNIT_PRESETS.soldierRifle, 'red'),
  createUnit(UNIT_PRESETS.soldierShotgun, 'red'),
  createUnit(UNIT_PRESETS.operativeSniper, 'red')
];
r = runBatch(boss, squad, 500);
console.log(`1 Juggernaut vs 4 Standard Squad: Boss ${r.blueWinRate.toFixed(1)}% | Squad ${r.redWinRate.toFixed(1)}%`);

// Boss test - heavy weapons squad
resetUnitIds();
const boss2 = [createUnit(UNIT_PRESETS.bossJuggernaut, 'blue')];
const heavySquad = [
  createUnit(UNIT_PRESETS.rocketTrooper, 'red'),
  createUnit(UNIT_PRESETS.operativeSniper, 'red'),
  createUnit(UNIT_PRESETS.heavyGunner, 'red')
];
r = runBatch(boss2, heavySquad, 500);
console.log(`1 Juggernaut vs 3 Heavy Squad: Boss ${r.blueWinRate.toFixed(1)}% | Squad ${r.redWinRate.toFixed(1)}%`);

// Speedster vs Samurai
resetUnitIds();
const sp = [createUnit(UNIT_PRESETS.superSpeedster, 'blue')];
const sam = [createUnit(UNIT_PRESETS.samurai, 'red')];
r = runBatch(sp, sam, 500);
console.log(`Speedster vs Samurai: Speedster ${r.blueWinRate.toFixed(1)}% | Samurai ${r.redWinRate.toFixed(1)}%`);

// Robot army test
resetUnitIds();
const robots = [
  createUnit(UNIT_PRESETS.securityBot, 'blue'),
  createUnit(UNIT_PRESETS.combatDrone, 'blue'),
  createUnit(UNIT_PRESETS.warBot, 'blue')
];
const defenders = [
  createUnit(UNIT_PRESETS.soldierRifle, 'red'),
  createUnit(UNIT_PRESETS.soldierRifle, 'red'),
  createUnit(UNIT_PRESETS.soldierShotgun, 'red'),
  createUnit(UNIT_PRESETS.operativeSniper, 'red')
];
r = runBatch(robots, defenders, 500);
console.log(`3 Robots vs 4 Soldiers: Robots ${r.blueWinRate.toFixed(1)}% | Soldiers ${r.redWinRate.toFixed(1)}%`);

// Gang fight
resetUnitIds();
const gang = [
  createUnit(UNIT_PRESETS.gangLeader, 'blue'),
  createUnit(UNIT_PRESETS.gangEnforcer, 'blue'),
  createUnit(UNIT_PRESETS.gangEnforcer, 'blue'),
  createUnit(UNIT_PRESETS.thugPistol, 'blue')
];
const police = [
  createUnit(UNIT_PRESETS.soldierPistol, 'red'),
  createUnit(UNIT_PRESETS.soldierPistol, 'red'),
  createUnit(UNIT_PRESETS.soldierPistol, 'red')
];
r = runBatch(gang, police, 500);
console.log(`4 Gang vs 3 Police: Gang ${r.blueWinRate.toFixed(1)}% | Police ${r.redWinRate.toFixed(1)}%`);

console.log('\n=== All tests complete! ===');
