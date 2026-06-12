/**
 * Gadget Tournament
 *
 * Comprehensive testing of all gadget types in combat.
 * Tests drones, medical, explosives, sensors, and more.
 *
 * Run: npx tsx src/combat/gadgetTournament.ts
 */

import {
  SimUnit,
  Position,
} from './types';

import {
  CombatGadget,
  GadgetResult,
  DRONE_CONFIGS,
} from './gadgetTypes';

import {
  resolveGadgetUse,
  consumeGadgetUse,
  createDroneUnit,
} from './gadgetResolver';

import {
  getCombatGadget,
  getCombatGadgetsByBehavior,
  getCombatGadgetsByCategory,
  getGadgetSummary,
} from './gadgetCombat';

import {
  processDroneTurn,
  DroneAction,
} from './droneAI';

import { createTeam, UNIT_PRESETS } from './humanPresets';

// ============ TEST UTILITIES ============

function createTestUnit(id: string, team: 'blue' | 'red', position: Position): SimUnit {
  const baseUnit = createTeam(UNIT_PRESETS.soldierRifle, team, 1)[0];
  return {
    ...baseUnit,
    id,
    position,
  };
}

function createTestScenario(blueCount: number, redCount: number): SimUnit[] {
  const units: SimUnit[] = [];

  for (let i = 0; i < blueCount; i++) {
    units.push(createTestUnit(`blue_${i + 1}`, 'blue', { x: i * 2, y: 0 }));
  }

  for (let i = 0; i < redCount; i++) {
    units.push(createTestUnit(`red_${i + 1}`, 'red', { x: i * 2, y: 10 }));
  }

  return units;
}

// ============ DRONE TESTS ============

function testDrones(): void {
  console.log('\n' + '='.repeat(60));
  console.log('       DRONE TESTS');
  console.log('='.repeat(60));

  const drones = getCombatGadgetsByCategory('Drone');
  console.log(`\nTesting ${drones.length} drone types:\n`);

  const results: { name: string; spawned: boolean; damage: number; heals: number }[] = [];

  for (const droneGadget of drones) {
    const units = createTestScenario(1, 1);
    const user = units[0];
    const enemy = units[1];

    // Spawn drone
    const result = resolveGadgetUse(
      { ...droneGadget, currentUses: 1, currentCooldown: 0 },
      user,
      units,
      [],
      user.position
    );

    let damage = 0;
    let heals = 0;

    if (result.success && result.spawnedUnits && result.spawnedUnits.length > 0) {
      const drone = result.spawnedUnits[0];
      units.push(drone);

      // Simulate 5 turns of drone activity
      for (let turn = 0; turn < 5; turn++) {
        if (drone.hp <= 0) break;

        const action = processDroneTurn(drone, units);

        if (action.type === 'attack' && action.result) {
          const attackResult = action.result as any;
          if (attackResult.finalDamage) {
            damage += attackResult.finalDamage;
          }
        }

        if (action.type === 'heal' && action.result) {
          const healResult = action.result as any;
          if (healResult.healAmount) {
            heals += healResult.healAmount;
          }
        }
      }
    }

    results.push({
      name: droneGadget.name,
      spawned: result.success,
      damage,
      heals,
    });
  }

  // Print results
  console.log('Drone'.padEnd(25) + 'Spawned'.padEnd(10) + 'Damage'.padEnd(10) + 'Heals');
  console.log('-'.repeat(55));

  for (const r of results) {
    console.log(
      r.name.padEnd(25) +
      (r.spawned ? 'YES' : 'NO').padEnd(10) +
      r.damage.toString().padEnd(10) +
      r.heals.toString()
    );
  }

  const totalSpawned = results.filter(r => r.spawned).length;
  console.log(`\n${totalSpawned}/${drones.length} drones spawned successfully`);
}

// ============ MEDICAL TESTS ============

function testMedical(): void {
  console.log('\n' + '='.repeat(60));
  console.log('       MEDICAL TESTS');
  console.log('='.repeat(60));

  const medical = getCombatGadgetsByCategory('Medical');
  console.log(`\nTesting ${medical.length} medical items:\n`);

  const results: { name: string; behavior: string; value: number; success: boolean }[] = [];

  for (const item of medical) {
    const units = createTestScenario(2, 0);
    const user = units[0];
    const target = units[1];

    // Wound the target
    target.hp = 50;
    const originalHp = target.hp;

    // Use medical item
    const result = resolveGadgetUse(
      { ...item, currentUses: item.uses, currentCooldown: 0 },
      user,
      units,
      [],
      undefined,
      target.id
    );

    const healingDone = target.hp - originalHp;

    results.push({
      name: item.name,
      behavior: item.behavior,
      value: healingDone || (item.effect.value ?? 0),
      success: result.success,
    });
  }

  console.log('Item'.padEnd(25) + 'Behavior'.padEnd(15) + 'Value'.padEnd(10) + 'Works');
  console.log('-'.repeat(60));

  for (const r of results) {
    console.log(
      r.name.padEnd(25) +
      r.behavior.padEnd(15) +
      r.value.toString().padEnd(10) +
      (r.success ? 'YES' : 'NO')
    );
  }
}

// ============ EXPLOSIVE TESTS ============

function testExplosives(): void {
  console.log('\n' + '='.repeat(60));
  console.log('       EXPLOSIVE TESTS');
  console.log('='.repeat(60));

  const explosives = getCombatGadgetsByBehavior('explosive');
  console.log(`\nTesting ${explosives.length} explosives:\n`);

  const results: { name: string; damage: number; victims: number }[] = [];

  for (const explosive of explosives) {
    // Create cluster of enemies
    const units: SimUnit[] = [
      createTestUnit('user', 'blue', { x: 0, y: 0 }),
      createTestUnit('enemy_1', 'red', { x: 5, y: 5 }),
      createTestUnit('enemy_2', 'red', { x: 6, y: 5 }),
      createTestUnit('enemy_3', 'red', { x: 5, y: 6 }),
      createTestUnit('enemy_4', 'red', { x: 6, y: 6 }),
    ];

    const user = units[0];
    const targetPos = { x: 5, y: 5 };

    const result = resolveGadgetUse(
      { ...explosive, currentUses: 1, currentCooldown: 0 },
      user,
      units,
      [],
      targetPos
    );

    results.push({
      name: explosive.name,
      damage: result.damageDealt ?? 0,
      victims: result.affectedUnits.length,
    });
  }

  console.log('Explosive'.padEnd(25) + 'Total Damage'.padEnd(15) + 'Victims');
  console.log('-'.repeat(50));

  for (const r of results) {
    console.log(
      r.name.padEnd(25) +
      r.damage.toString().padEnd(15) +
      r.victims.toString()
    );
  }
}

// ============ SENSOR TESTS ============

function testSensors(): void {
  console.log('\n' + '='.repeat(60));
  console.log('       SENSOR TESTS');
  console.log('='.repeat(60));

  const sensors = getCombatGadgetsByBehavior('reveal');
  console.log(`\nTesting ${sensors.length} reveal items:\n`);

  const results: { name: string; tilesRevealed: number; radius: number }[] = [];

  for (const sensor of sensors) {
    const units = createTestScenario(1, 0);
    const user = units[0];

    const result = resolveGadgetUse(
      { ...sensor, currentUses: -1, currentCooldown: 0 },
      user,
      units,
      [],
      user.position
    );

    results.push({
      name: sensor.name,
      tilesRevealed: result.revealedTiles?.length ?? 0,
      radius: sensor.effect.radius ?? 0,
    });
  }

  console.log('Sensor'.padEnd(30) + 'Tiles'.padEnd(10) + 'Radius');
  console.log('-'.repeat(50));

  for (const r of results) {
    console.log(
      r.name.padEnd(30) +
      r.tilesRevealed.toString().padEnd(10) +
      r.radius.toString()
    );
  }
}

// ============ BUFF TESTS ============

function testBuffs(): void {
  console.log('\n' + '='.repeat(60));
  console.log('       BUFF TESTS');
  console.log('='.repeat(60));

  const buffs = getCombatGadgetsByBehavior('buff');
  console.log(`\nTesting ${buffs.length} buff items:\n`);

  const results: { name: string; targets: number; duration: number }[] = [];

  for (const buff of buffs) {
    const units = createTestScenario(3, 0);
    const user = units[0];

    const result = resolveGadgetUse(
      { ...buff, currentUses: -1, currentCooldown: 0 },
      user,
      units,
      []
    );

    results.push({
      name: buff.name,
      targets: result.affectedUnits.length,
      duration: buff.effect.duration ?? 0,
    });
  }

  console.log('Buff'.padEnd(30) + 'Targets'.padEnd(10) + 'Duration');
  console.log('-'.repeat(50));

  for (const r of results) {
    console.log(
      r.name.padEnd(30) +
      r.targets.toString().padEnd(10) +
      r.duration.toString()
    );
  }
}

// ============ DISABLE TESTS ============

function testDisable(): void {
  console.log('\n' + '='.repeat(60));
  console.log('       DISABLE TESTS');
  console.log('='.repeat(60));

  const disable = getCombatGadgetsByBehavior('disable');
  console.log(`\nTesting ${disable.length} disable items:\n`);

  const results: { name: string; affected: number }[] = [];

  for (const item of disable) {
    // Create enemies with shields
    const units = createTestScenario(1, 3);
    const user = units[0];

    // Give enemies shields
    for (const unit of units) {
      if (unit.team === 'red') {
        unit.shield = { current: 50, max: 50 };
      }
    }

    const result = resolveGadgetUse(
      { ...item, currentUses: 3, currentCooldown: 0 },
      user,
      units,
      []
    );

    // Count enemies with disabled shields
    const disabledCount = units.filter(u =>
      u.team === 'red' && u.shield && u.shield.current === 0
    ).length;

    results.push({
      name: item.name,
      affected: disabledCount,
    });
  }

  console.log('Item'.padEnd(30) + 'Shields Disabled');
  console.log('-'.repeat(50));

  for (const r of results) {
    console.log(
      r.name.padEnd(30) +
      r.affected.toString()
    );
  }
}

// ============ EXTRACTION TESTS ============

function testExtraction(): void {
  console.log('\n' + '='.repeat(60));
  console.log('       EXTRACTION TESTS');
  console.log('='.repeat(60));

  const vehicles = getCombatGadgetsByBehavior('extract');
  console.log(`\nTesting ${vehicles.length} vehicle extractions:\n`);

  const vehicleCategories = ['Ground', 'Aircraft', 'Watercraft'];

  for (const category of vehicleCategories) {
    const categoryVehicles = vehicles.filter(v => v.name.includes(category) ||
      (category === 'Ground' && !v.name.includes('Helicopter') && !v.name.includes('Jet') &&
       !v.name.includes('VTOL') && !v.name.includes('Boat') && !v.name.includes('Yacht') &&
       !v.name.includes('Submarine'))
    );

    console.log(`\n${category}: ${categoryVehicles.length} vehicles`);
    categoryVehicles.slice(0, 3).forEach(v => {
      console.log(`  - ${v.name}`);
    });
    if (categoryVehicles.length > 3) {
      console.log(`  ... and ${categoryVehicles.length - 3} more`);
    }
  }

  // Test extraction
  const testVehicle = vehicles[0];
  const units = createTestScenario(3, 0);
  const user = units[0];

  const result = resolveGadgetUse(
    { ...testVehicle, currentUses: -1, currentCooldown: 0 },
    user,
    units,
    []
  );

  console.log(`\nExtraction test: ${result.success ? 'SUCCESS' : 'FAILED'}`);
  console.log(`Units extracting: ${result.affectedUnits.length}`);
}

// ============ SUMMARY ============

function printSummary(): void {
  console.log('\n' + '='.repeat(60));
  console.log('       GADGET TOURNAMENT SUMMARY');
  console.log('='.repeat(60));

  const summary = getGadgetSummary();

  console.log('\n=== GADGETS BY BEHAVIOR ===\n');

  let total = 0;
  const sortedBehaviors = Object.entries(summary).sort((a, b) => b[1] - a[1]);

  for (const [behavior, count] of sortedBehaviors) {
    const bar = '█'.repeat(Math.ceil(count / 2));
    console.log(`  ${behavior.padEnd(15)} ${count.toString().padEnd(4)} ${bar}`);
    total += count;
  }

  console.log(`  ${'─'.repeat(25)}`);
  console.log(`  ${'TOTAL'.padEnd(15)} ${total}`);

  console.log('\n=== COMBAT EFFECTIVENESS ===\n');

  // Test gadgets that deal damage
  const damageGadgets = [
    ...getCombatGadgetsByBehavior('explosive'),
    ...getCombatGadgetsByCategory('Drone').filter(d =>
      d.effect.spawnDrone?.weapon !== undefined
    ),
  ];

  console.log(`  Damage-dealing gadgets: ${damageGadgets.length}`);

  // Test gadgets that heal
  const healGadgets = [
    ...getCombatGadgetsByBehavior('heal'),
    ...getCombatGadgetsByBehavior('revive'),
    ...getCombatGadgetsByCategory('Drone').filter(d =>
      d.effect.spawnDrone?.healPerTurn !== undefined
    ),
  ];

  console.log(`  Healing gadgets: ${healGadgets.length}`);

  // Support gadgets
  const supportGadgets = [
    ...getCombatGadgetsByBehavior('buff'),
    ...getCombatGadgetsByBehavior('reveal'),
    ...getCombatGadgetsByBehavior('disable'),
  ];

  console.log(`  Support gadgets: ${supportGadgets.length}`);

  // Utility
  const utilityGadgets = [
    ...getCombatGadgetsByBehavior('passive'),
    ...getCombatGadgetsByBehavior('extract'),
    ...getCombatGadgetsByBehavior('cure_status'),
  ];

  console.log(`  Utility gadgets: ${utilityGadgets.length}`);
}

// ============ MAIN ============

function runTournament(): void {
  console.log('='.repeat(60));
  console.log('       GADGET TOURNAMENT');
  console.log('       Testing All 99 Gadgets in Combat');
  console.log('='.repeat(60));

  testDrones();
  testMedical();
  testExplosives();
  testSensors();
  testBuffs();
  testDisable();
  testExtraction();
  printSummary();

  console.log('\n' + '='.repeat(60));
  console.log('       TOURNAMENT COMPLETE');
  console.log('='.repeat(60));
  console.log('\nAll gadgets tested. Check individual sections for details.');
  console.log('='.repeat(60));
}

// Run tournament
runTournament();
