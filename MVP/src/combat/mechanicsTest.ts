/**
 * Combat Mechanics Verification Test
 *
 * Tests that DR, shields, and weapons are actually working.
 */

import { runBattle } from './battleRunner';
import { SimUnit } from './types';

// Create unit with armor (high DR)
function createArmoredUnit(name: string): SimUnit {
  return {
    id: `armored_${name}_${Date.now()}`,
    name,
    team: 'blue',
    hp: 100,
    maxHp: 100,
    shieldHp: 0,
    ap: 4,
    maxAp: 4,
    alive: true,
    dr: 10,  // HIGH DR - should reduce damage significantly
    stoppingPower: 15,  // Blocks low damage completely
    stats: { MEL: 15, RNG: 15, AGL: 15, CON: 15, INS: 15, WIL: 15, INT: 15 },
    weapon: { name: 'Pistol', damage: 20, range: 10, damageType: 'piercing' },
    statusEffects: [],
    position: { x: 1, y: 1 },
    facing: 90,
  };
}

// Create unit without armor
function createUnarmored(name: string): SimUnit {
  return {
    id: `unarmored_${name}_${Date.now()}`,
    name,
    team: 'red',
    hp: 100,
    maxHp: 100,
    shieldHp: 0,
    ap: 4,
    maxAp: 4,
    alive: true,
    dr: 0,  // NO DR
    stoppingPower: 0,
    stats: { MEL: 15, RNG: 15, AGL: 15, CON: 15, INS: 15, WIL: 15, INT: 15 },
    weapon: { name: 'Pistol', damage: 20, range: 10, damageType: 'piercing' },
    statusEffects: [],
    position: { x: 2, y: 1 },
    facing: 270,
  };
}

// Create unit with shields
function createShieldedUnit(name: string): SimUnit {
  return {
    id: `shielded_${name}_${Date.now()}`,
    name,
    team: 'blue',
    hp: 100,
    maxHp: 100,
    shieldHp: 50,  // 50 shield HP
    ap: 4,
    maxAp: 4,
    alive: true,
    dr: 0,
    stoppingPower: 0,
    stats: { MEL: 15, RNG: 15, AGL: 15, CON: 15, INS: 15, WIL: 15, INT: 15 },
    weapon: { name: 'Pistol', damage: 20, range: 10, damageType: 'piercing' },
    statusEffects: [],
    position: { x: 1, y: 1 },
    facing: 90,
  };
}

async function runTests() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║         COMBAT MECHANICS VERIFICATION TEST                 ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  // Test 1: DR Reduces Damage
  console.log('━━━ TEST 1: DR DAMAGE REDUCTION ━━━');
  console.log('Armored (DR 10) vs Unarmored (DR 0) - same weapons');
  console.log('Expected: Armored unit should take LESS damage per hit\n');

  const armored1 = createArmoredUnit('Tank');
  const unarmored1 = createUnarmored('Glass Cannon');

  const result1 = runBattle([armored1], [unarmored1], { maxRounds: 5 });

  // Analyze damage taken
  let armoredDamageTaken = 0;
  let unarmoredDamageTaken = 0;

  for (const attack of result1.log) {
    if (attack.target === armored1.id) {
      armoredDamageTaken += attack.finalDamage || 0;
    } else if (attack.target === unarmored1.id) {
      unarmoredDamageTaken += attack.finalDamage || 0;
    }
  }

  console.log(`Armored damage taken: ${armoredDamageTaken}`);
  console.log(`Unarmored damage taken: ${unarmoredDamageTaken}`);

  if (armoredDamageTaken < unarmoredDamageTaken) {
    console.log('✅ DR IS WORKING - Armored took less damage\n');
  } else if (armoredDamageTaken === 0 && unarmoredDamageTaken === 0) {
    console.log('⚠️  NO DAMAGE DEALT - Check attack log\n');
  } else {
    console.log('❌ DR NOT WORKING - Armored should take less damage\n');
  }

  // Show attack details
  console.log('Attack Log (first 5):');
  result1.log.slice(0, 5).forEach((a, i) => {
    console.log(`  ${i+1}. ${a.attacker} → ${a.target}: ${a.hitResult} | raw=${a.rawDamage} final=${a.finalDamage}`);
  });

  // Test 2: Shields Absorb First
  console.log('\n━━━ TEST 2: SHIELD ABSORPTION ━━━');
  console.log('Shielded (50 shield HP) vs Unarmored');
  console.log('Expected: Shields should absorb damage before HP\n');

  const shielded = createShieldedUnit('Force Field');
  const attacker = createUnarmored('Attacker');
  attacker.team = 'red';
  attacker.position = { x: 2, y: 1 };

  const result2 = runBattle([shielded], [attacker], { maxRounds: 5 });

  // Check if shield was damaged
  let shieldDamage = 0;
  for (const attack of result2.log) {
    if (attack.target === shielded.id && attack.shieldAbsorbed) {
      shieldDamage += attack.shieldAbsorbed;
    }
  }

  console.log(`Shield damage absorbed: ${shieldDamage}`);
  console.log(`Final shield HP: ${shielded.shieldHp} (started at 50)`);
  console.log(`Final HP: ${shielded.hp} (started at 100)`);

  if (shieldDamage > 0) {
    console.log('✅ SHIELDS ARE WORKING - Absorbed damage\n');
  } else if (shielded.shieldHp < 50) {
    console.log('✅ SHIELDS ARE WORKING - Shield HP reduced\n');
  } else {
    console.log('⚠️  SHIELD STATUS UNCLEAR - Check if shieldAbsorbed tracked\n');
  }

  // Test 3: Stopping Power
  console.log('━━━ TEST 3: STOPPING POWER ━━━');
  console.log('Unit with SP 15 vs weak weapon (damage 10)');
  console.log('Expected: Weapon damage <= SP should be blocked\n');

  const tankUnit = createArmoredUnit('Heavy Tank');
  tankUnit.stoppingPower = 25;  // Very high stopping power

  const weakAttacker = createUnarmored('Weak Attacker');
  weakAttacker.weapon = { name: 'Weak Pistol', damage: 10, range: 10, damageType: 'piercing' };
  weakAttacker.team = 'red';
  weakAttacker.position = { x: 2, y: 1 };

  const result3 = runBattle([tankUnit], [weakAttacker], { maxRounds: 3 });

  let blockedHits = 0;
  let penetratingHits = 0;
  for (const attack of result3.log) {
    if (attack.target === tankUnit.id) {
      if (attack.finalDamage === 0 && attack.hitResult === 'hit') {
        blockedHits++;
      } else if (attack.finalDamage && attack.finalDamage > 0) {
        penetratingHits++;
      }
    }
  }

  console.log(`Blocked by armor: ${blockedHits}`);
  console.log(`Penetrating hits: ${penetratingHits}`);

  if (blockedHits > 0) {
    console.log('✅ STOPPING POWER WORKING - Some hits fully blocked\n');
  } else {
    console.log('⚠️  STOPPING POWER STATUS UNCLEAR\n');
  }

  // Summary
  console.log('════════════════════════════════════════════════════════════');
  console.log('SUMMARY');
  console.log('════════════════════════════════════════════════════════════');
  console.log(`DR Damage Reduction: ${armoredDamageTaken < unarmoredDamageTaken ? '✅ WORKING' : '❓ CHECK'}`);
  console.log(`Shield Absorption: ${shieldDamage > 0 || shielded.shieldHp < 50 ? '✅ WORKING' : '❓ CHECK'}`);
  console.log(`Stopping Power: ${blockedHits > 0 ? '✅ WORKING' : '❓ CHECK'}`);
}

runTests();
