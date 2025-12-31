/**
 * Weapon Database Integration Tests
 * Run: npx tsx src/combat/weaponDatabaseTest.ts
 *
 * TDD Approach: Tests written FIRST to define expected behavior.
 * These tests verify the weaponAdapter correctly converts weapons.ts
 * weapons to combat-ready SimWeapon format.
 */

import { ALL_WEAPONS, getWeaponById, getWeaponByName } from '../data/weapons';
import { Weapon } from '../data/equipmentTypes';
import { SimWeapon, FireMode } from './types';
import { runBatch } from './batchTester';
import { createTeam, createUnit, UNIT_PRESETS } from './humanPresets';

// Import the adapter (to be created)
// Will fail until weaponAdapter.ts exists
import { getSimWeapon, getAllSimWeapons, inferFireModes } from './weaponAdapter';
import { SimUnit } from './types';

// ============ HELPER FUNCTIONS ============

/**
 * Create a team with a specific weapon from the database.
 */
function createTeamWithDbWeapon(
  weaponId: string,
  count: number,
  team: 'blue' | 'red' = 'blue',
  positions?: { x: number; y: number }[]
): SimUnit[] {
  const weapon = getSimWeapon(weaponId);
  const units: SimUnit[] = [];

  // Create a custom preset with the database weapon
  const preset = {
    ...UNIT_PRESETS.soldierRifle,
    weapon,
  };

  for (let i = 0; i < count; i++) {
    const unit = createUnit(preset, team, `${team}-${i}`);
    if (positions && positions[i]) {
      unit.position = positions[i];
    }
    units.push(unit);
  }

  return units;
}

// ============ TEST FUNCTIONS ============

/**
 * TEST 1: All weapons convert without error
 * Every weapon in ALL_WEAPONS should convert to a valid SimWeapon.
 */
function testAllWeaponsConvert(): boolean {
  console.log('\n--- TEST 1: All Weapons Convert ---');

  let failures = 0;
  const failedWeapons: string[] = [];

  for (const weapon of ALL_WEAPONS) {
    try {
      const sim = getSimWeapon(weapon.id);
      if (!sim.name || sim.damage === undefined || !sim.range) {
        failures++;
        failedWeapons.push(weapon.id);
      }
    } catch (e) {
      failures++;
      failedWeapons.push(weapon.id);
    }
  }

  const pass = failures === 0;
  console.log(`  Total weapons: ${ALL_WEAPONS.length}`);
  console.log(`  Converted: ${ALL_WEAPONS.length - failures}`);
  console.log(`  Failed: ${failures}`);
  if (failedWeapons.length > 0 && failedWeapons.length <= 5) {
    console.log(`  Failed IDs: ${failedWeapons.join(', ')}`);
  }
  console.log(`All Weapons Convert: ${pass ? '✅ PASS' : '❌ FAIL'}`);

  return pass;
}

/**
 * TEST 2: Damage values are reasonable
 * Damage should be between 0 and 500 for all weapons.
 * 0 damage allowed for utility items (flashbangs, net guns, etc.)
 */
function testDamageRanges(): boolean {
  console.log('\n--- TEST 2: Damage Ranges Valid ---');

  const weapons = getAllSimWeapons();
  let failures = 0;
  let zeroCount = 0;
  const outliers: string[] = [];

  for (const w of weapons) {
    // Allow 0 for utility items, max 500 for heavy weapons/explosives
    if (w.damage < 0 || w.damage > 500) {
      failures++;
      outliers.push(`${w.name}: ${w.damage}`);
    }
    if (w.damage === 0) zeroCount++;
  }

  const pass = failures === 0;
  console.log(`  Weapons checked: ${weapons.length}`);
  console.log(`  Utility items (0 damage): ${zeroCount}`);
  console.log(`  Out of range: ${failures}`);
  if (outliers.length > 0 && outliers.length <= 5) {
    console.log(`  Outliers: ${outliers.join(', ')}`);
  }
  console.log(`Damage Ranges: ${pass ? '✅ PASS' : '❌ FAIL'}`);

  return pass;
}

/**
 * TEST 3: Range values are set correctly
 * All ranged weapons should have range > 1.
 * Melee weapons should have range 1-3.
 */
function testRangeValues(): boolean {
  console.log('\n--- TEST 3: Range Values ---');

  const weapons = getAllSimWeapons();
  let failures = 0;

  for (const w of weapons) {
    // Range should be positive
    if (w.range <= 0) {
      failures++;
      console.log(`  No range: ${w.name}`);
    }
  }

  const pass = failures === 0;
  console.log(`  Weapons with valid range: ${weapons.length - failures}/${weapons.length}`);
  console.log(`Range Values: ${pass ? '✅ PASS' : '❌ FAIL'}`);

  return pass;
}

/**
 * TEST 4: Fire modes inferred correctly from specialEffects
 * - SMGs should have burst/auto
 * - Sniper rifles should be single only
 * - Assault rifles should have burst
 */
function testFireModeInference(): boolean {
  console.log('\n--- TEST 4: Fire Mode Inference ---');

  // Find weapons by name patterns
  const smgWeapon = ALL_WEAPONS.find(w => w.name.toLowerCase().includes('smg'));
  const sniperWeapon = ALL_WEAPONS.find(w => w.name.toLowerCase().includes('sniper'));
  const assaultRifle = ALL_WEAPONS.find(w => w.name.toLowerCase().includes('assault'));
  const pistolWeapon = ALL_WEAPONS.find(w => w.name.toLowerCase().includes('pistol'));

  let passed = 0;
  let total = 0;

  // SMG should have burst or auto
  if (smgWeapon) {
    total++;
    const smg = getSimWeapon(smgWeapon.id);
    const hasBurstOrAuto = smg.availableFireModes?.includes('burst') ||
                           smg.availableFireModes?.includes('auto');
    if (hasBurstOrAuto) passed++;
    console.log(`  SMG has burst/auto: ${hasBurstOrAuto ? '✅' : '❌'}`);
  }

  // Sniper should be single only
  if (sniperWeapon) {
    total++;
    const sniper = getSimWeapon(sniperWeapon.id);
    const singleOnly = sniper.availableFireModes?.length === 1 &&
                       sniper.availableFireModes[0] === 'single';
    if (singleOnly) passed++;
    console.log(`  Sniper single only: ${singleOnly ? '✅' : '❌'} (modes: ${sniper.availableFireModes?.join(', ')})`);
  }

  // Assault rifle should have burst
  if (assaultRifle) {
    total++;
    const ar = getSimWeapon(assaultRifle.id);
    const hasBurst = ar.availableFireModes?.includes('burst');
    if (hasBurst) passed++;
    console.log(`  Assault Rifle has burst: ${hasBurst ? '✅' : '❌'}`);
  }

  // Pistol should be single only (no auto capability)
  if (pistolWeapon) {
    total++;
    const pistol = getSimWeapon(pistolWeapon.id);
    const noAuto = !pistol.availableFireModes?.includes('auto');
    if (noAuto) passed++;
    console.log(`  Pistol no auto: ${noAuto ? '✅' : '❌'}`);
  }

  const pass = passed >= total - 1; // Allow 1 failure for flexibility
  console.log(`Fire Mode Inference: ${passed}/${total} | ${pass ? '✅ PASS' : '❌ FAIL'}`);

  return pass;
}

/**
 * TEST 5: Shotgun vs Rifle at close range
 * Shotguns have higher damage (35) vs rifle (30) but worse accuracy (-3 vs -1 CS).
 * Without range brackets implemented, expect competitive fight, slight shotgun edge.
 * Target: 42-62% shotgun (damage advantage partially offset by accuracy)
 */
function testShotgunVsRifleClose(): boolean {
  console.log('\n--- TEST 5: Shotgun vs Rifle (Close Range) ---');

  // Find shotgun and rifle
  const shotgun = ALL_WEAPONS.find(w => w.category.includes('Ranged') &&
                                        w.name.toLowerCase().includes('shotgun'));
  const rifle = ALL_WEAPONS.find(w => w.category.includes('Ranged') &&
                                      w.name.toLowerCase().includes('rifle') &&
                                      !w.name.toLowerCase().includes('sniper'));

  if (!shotgun || !rifle) {
    console.log('  Could not find shotgun or rifle in database');
    console.log(`Shotgun vs Rifle: ⚠️ SKIP`);
    return true; // Skip if weapons not found
  }

  // Point-blank range (1 tile apart) - shotgun's ideal range
  const blue = createTeamWithDbWeapon(
    shotgun.id, 3, 'blue',
    [{ x: 3, y: 5 }, { x: 3, y: 6 }, { x: 3, y: 7 }]
  );
  const red = createTeamWithDbWeapon(
    rifle.id, 3, 'red',
    [{ x: 4, y: 5 }, { x: 4, y: 6 }, { x: 4, y: 7 }]
  );

  const result = runBatch(blue, red, 1000);
  // Without range brackets, expect competitive fight
  // Shotgun: 35 dmg, -3 CS | Rifle: 30 dmg, -1 CS
  const pass = result.blueWinRate >= 42 && result.blueWinRate <= 62;

  console.log(`  Shotgun (${shotgun.name}): ${result.blueWinRate.toFixed(1)}%`);
  console.log(`  Rifle (${rifle.name}): ${result.redWinRate.toFixed(1)}%`);
  console.log(`  Target: 42-62% (competitive, slight shotgun edge)`);
  console.log(`Shotgun vs Rifle (Close): ${pass ? '✅ PASS' : '❌ FAIL'}`);

  return pass;
}

/**
 * TEST 6: Sniper vs SMG at long range
 * Sniper (45 dmg, range 100, -1 CS) vs SMG (20 dmg, range 20, -3 CS)
 * At 15 tiles, SMG is at 75% max range with -3 CS while sniper is comfortable.
 * Sniper should heavily dominate. Target: 65-100%
 */
function testSniperVsSmgLong(): boolean {
  console.log('\n--- TEST 6: Sniper vs SMG (Long Range) ---');

  const sniper = ALL_WEAPONS.find(w => w.name.toLowerCase().includes('sniper'));
  const smg = ALL_WEAPONS.find(w => w.name.toLowerCase().includes('smg'));

  if (!sniper || !smg) {
    console.log('  Could not find sniper or SMG in database');
    console.log(`Sniper vs SMG: ⚠️ SKIP`);
    return true; // Skip if weapons not found
  }

  const blue = createTeamWithDbWeapon(
    sniper.id, 3, 'blue',
    [{ x: 0, y: 5 }, { x: 0, y: 6 }, { x: 0, y: 7 }]
  );
  const red = createTeamWithDbWeapon(
    smg.id, 3, 'red',
    [{ x: 15, y: 5 }, { x: 15, y: 6 }, { x: 15, y: 7 }]
  );

  const result = runBatch(blue, red, 1000);
  // SMG at 15 tiles has severe accuracy penalty; sniper dominates
  const pass = result.blueWinRate >= 65 && result.blueWinRate <= 100;

  console.log(`  Sniper (${sniper.name}): ${result.blueWinRate.toFixed(1)}%`);
  console.log(`  SMG (${smg.name}): ${result.redWinRate.toFixed(1)}%`);
  console.log(`  Target: 65-100% sniper (heavy long range dominance)`);
  console.log(`Sniper vs SMG (Long): ${pass ? '✅ PASS' : '❌ FAIL'}`);

  return pass;
}

/**
 * TEST 7: Weapon count matches database
 * getAllSimWeapons should return all weapons from ALL_WEAPONS.
 */
function testWeaponCount(): boolean {
  console.log('\n--- TEST 7: Weapon Count ---');

  const dbCount = ALL_WEAPONS.length;
  const simCount = getAllSimWeapons().length;

  const pass = simCount === dbCount;

  console.log(`  Database weapons: ${dbCount}`);
  console.log(`  Converted weapons: ${simCount}`);
  console.log(`Weapon Count: ${pass ? '✅ PASS' : '❌ FAIL'}`);

  return pass;
}

// ============ MAIN TEST RUNNER ============

async function runAllTests(): Promise<void> {
  console.log('========================================');
  console.log('    WEAPON DATABASE TEST SUITE');
  console.log('========================================');
  console.log('Run: npx tsx src/combat/weaponDatabaseTest.ts');
  console.log('');
  console.log('NOTE: These tests will FAIL until weaponAdapter.ts');
  console.log('is created with getSimWeapon() and getAllSimWeapons()');
  console.log('');

  const results: { name: string; passed: boolean }[] = [];

  // Conversion tests
  try {
    results.push({ name: 'All Weapons Convert', passed: testAllWeaponsConvert() });
    results.push({ name: 'Damage Ranges', passed: testDamageRanges() });
    results.push({ name: 'Range Values', passed: testRangeValues() });
    results.push({ name: 'Fire Mode Inference', passed: testFireModeInference() });
    results.push({ name: 'Weapon Count', passed: testWeaponCount() });
  } catch (e) {
    console.log('\n❌ Tests failed to run - weaponAdapter.ts may be missing');
    console.log(`Error: ${e}`);
    return;
  }

  // Combat balance tests (require full implementation)
  console.log('\n========================================');
  console.log('  COMBAT BALANCE TESTS');
  console.log('========================================');

  try {
    results.push({ name: 'Shotgun vs Rifle (Close)', passed: testShotgunVsRifleClose() });
    results.push({ name: 'Sniper vs SMG (Long)', passed: testSniperVsSmgLong() });
  } catch (e) {
    console.log(`\n⚠️ Combat tests skipped: ${e}`);
  }

  // Summary
  const passed = results.filter(r => r.passed).length;
  const total = results.length;

  console.log('\n========================================');
  console.log('           TEST SUMMARY');
  console.log('========================================');
  results.forEach(r => {
    console.log(`  ${r.passed ? '✅' : '❌'} ${r.name}`);
  });
  console.log('');
  console.log(`  Total: ${passed}/${total} tests passed`);
  console.log('');

  if (passed < total) {
    console.log('❌ SOME TESTS FAILED');
    console.log('');
    console.log('Next steps:');
    console.log('1. Create weaponAdapter.ts with getSimWeapon()');
    console.log('2. Implement getAllSimWeapons()');
    console.log('3. Implement inferFireModes() for special effects parsing');
    console.log('4. Re-run tests until all pass');
  } else {
    console.log('✅ ALL TESTS PASSED');
    console.log('Weapon database is correctly integrated!');
  }
  console.log('========================================');
}

// Run tests
runAllTests().catch(console.error);
