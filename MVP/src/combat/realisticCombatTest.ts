/**
 * Realistic Combat Test Suite
 *
 * Run with: npx tsx src/combat/realisticCombatTest.ts
 *
 * Tests grounded human combat scenarios with full post-combat reports:
 * - Police vs Terrorists
 * - SWAT vs Bank Robbers
 * - Soldiers vs Militia
 * - Gang vs Gang
 *
 * Shows: injuries, status effects, damage breakdown, survivors
 */

import {
  SimUnit,
  SimWeapon,
  BattleResult,
  AttackResult,
  StatusEffectId,
  calculateHP,
} from './types';

import { runBattle } from './battleRunner';
import { describeEffects } from './statusEffects';
import { createCustomUnit, resetUnitIds } from './humanPresets';

// ============ REALISTIC WEAPONS ============

// Police/Security weapons
const POLICE_PISTOL: SimWeapon = {
  name: '9mm Pistol',
  damage: 18,
  accuracy: 75,
  damageType: 'GUNFIRE_BULLET',
  range: 15,
  apCost: 1,
};

const POLICE_SHOTGUN: SimWeapon = {
  name: 'Police Shotgun',
  damage: 35,
  accuracy: 70,
  damageType: 'GUNFIRE_BUCKSHOT',
  range: 8,
  apCost: 2,
};

const TASER: SimWeapon = {
  name: 'Taser',
  damage: 5,
  accuracy: 80,
  damageType: 'ELECTROMAGNETIC_BOLT', // Causes stun
  range: 3,
  apCost: 1,
};

// Military weapons
const ASSAULT_RIFLE: SimWeapon = {
  name: 'M4 Carbine',
  damage: 25,
  accuracy: 78,
  damageType: 'GUNFIRE_BULLET',
  range: 25,
  apCost: 2,
};

const AP_RIFLE: SimWeapon = {
  name: 'AP Rifle',
  damage: 28,
  accuracy: 75,
  damageType: 'GUNFIRE_AP', // Causes bleeding, pierces armor
  range: 25,
  apCost: 2,
};

const COMBAT_KNIFE: SimWeapon = {
  name: 'Combat Knife',
  damage: 15,
  accuracy: 85,
  damageType: 'EDGED_SLASHING', // Causes bleeding
  range: 1,
  apCost: 1,
};

// Criminal weapons
const CHEAP_PISTOL: SimWeapon = {
  name: 'Saturday Night Special',
  damage: 14,
  accuracy: 60,
  damageType: 'GUNFIRE_BULLET',
  range: 10,
  apCost: 1,
};

const MAC10: SimWeapon = {
  name: 'MAC-10',
  damage: 16,
  accuracy: 55,
  damageType: 'GUNFIRE_BULLET',
  range: 12,
  apCost: 1,
};

const MACHETE: SimWeapon = {
  name: 'Machete',
  damage: 20,
  accuracy: 75,
  damageType: 'EDGED_SLASHING', // Causes bleeding
  range: 1,
  apCost: 2,
};

const MOLOTOV: SimWeapon = {
  name: 'Molotov Cocktail',
  damage: 25,
  accuracy: 65,
  damageType: 'ENERGY_THERMAL', // Causes burning
  range: 6,
  apCost: 2,
};

const AK47: SimWeapon = {
  name: 'AK-47',
  damage: 28,
  accuracy: 70,
  damageType: 'GUNFIRE_BULLET',
  range: 22,
  apCost: 2,
};

// ============ UNIT PRESETS ============

// Police - trained but light armor
const POLICE_STATS = { MEL: 18, AGL: 18, STR: 16, STA: 18 };
const SWAT_STATS = { MEL: 22, AGL: 22, STR: 20, STA: 22 };

// Military - well trained
const SOLDIER_STATS = { MEL: 22, AGL: 20, STR: 20, STA: 22 };
const SPEC_OPS_STATS = { MEL: 28, AGL: 28, STR: 25, STA: 25 };

// Criminals - varies
const THUG_STATS = { MEL: 14, AGL: 14, STR: 16, STA: 14 };
const GANG_STATS = { MEL: 16, AGL: 16, STR: 18, STA: 16 };
const TERRORIST_STATS = { MEL: 20, AGL: 18, STR: 18, STA: 20 };
const MILITIA_STATS = { MEL: 16, AGL: 15, STR: 17, STA: 16 };

// ============ UNIT CREATION ============

function createPoliceOfficer(team: 'blue' | 'red', name: string): SimUnit {
  const unit = createCustomUnit(team, name, POLICE_STATS, POLICE_PISTOL);
  unit.dr = 2; // Light vest
  return unit;
}

function createSWAT(team: 'blue' | 'red', name: string, weapon: SimWeapon): SimUnit {
  const unit = createCustomUnit(team, name, SWAT_STATS, weapon);
  unit.dr = 5; // Tactical vest
  unit.maxHp = calculateHP(SWAT_STATS) + 10; // Better conditioning
  unit.hp = unit.maxHp;
  return unit;
}

function createSoldier(team: 'blue' | 'red', name: string, weapon: SimWeapon): SimUnit {
  const unit = createCustomUnit(team, name, SOLDIER_STATS, weapon);
  unit.dr = 6; // Body armor
  return unit;
}

function createThug(team: 'blue' | 'red', name: string, weapon: SimWeapon): SimUnit {
  return createCustomUnit(team, name, THUG_STATS, weapon);
}

function createGangMember(team: 'blue' | 'red', name: string, weapon: SimWeapon): SimUnit {
  const unit = createCustomUnit(team, name, GANG_STATS, weapon);
  unit.dr = 1; // Maybe a leather jacket
  return unit;
}

function createTerrorist(team: 'blue' | 'red', name: string, weapon: SimWeapon): SimUnit {
  const unit = createCustomUnit(team, name, TERRORIST_STATS, weapon);
  unit.dr = 3; // Some protection
  return unit;
}

function createMilitia(team: 'blue' | 'red', name: string, weapon: SimWeapon): SimUnit {
  const unit = createCustomUnit(team, name, MILITIA_STATS, weapon);
  unit.dr = 2;
  return unit;
}

// ============ POST-COMBAT REPORT ============

interface DetailedReport {
  scenario: string;
  winner: string;
  rounds: number;

  blueTeamName: string;
  blueStarting: number;
  blueSurvivors: { name: string; hp: number; maxHp: number; effects: string[] }[];
  blueKIA: string[];
  blueTotalDamageDealt: number;

  redTeamName: string;
  redStarting: number;
  redSurvivors: { name: string; hp: number; maxHp: number; effects: string[] }[];
  redKIA: string[];
  redTotalDamageDealt: number;

  effectsApplied: { effect: StatusEffectId; count: number }[];
  combatLog: string[];
}

function generateDetailedReport(
  scenario: string,
  blueTeamName: string,
  redTeamName: string,
  blueTeam: SimUnit[],
  redTeam: SimUnit[],
  result: BattleResult
): DetailedReport {
  // Count effects applied during combat
  const effectCounts: Record<string, number> = {};
  const significantEvents: string[] = [];

  for (const attack of result.log) {
    for (const effect of attack.effectsApplied) {
      effectCounts[effect] = (effectCounts[effect] || 0) + 1;
    }

    // Log significant events
    if (attack.killed) {
      significantEvents.push(`${attack.attacker} killed ${attack.target} with ${attack.weapon} (${attack.finalDamage} dmg)`);
    }
    if (attack.hitResult === 'crit') {
      significantEvents.push(`${attack.attacker} CRIT ${attack.target} for ${attack.finalDamage} dmg!`);
    }
    if (attack.effectsApplied.length > 0) {
      significantEvents.push(`${attack.target} afflicted with: ${attack.effectsApplied.join(', ')}`);
    }
  }

  // Find surviving units with their current state
  // Note: We need to track units through the battle - the battleRunner clones them
  // So we'll reconstruct from the result
  const blueSurvivors: DetailedReport['blueSurvivors'] = [];
  const redSurvivors: DetailedReport['redSurvivors'] = [];

  // The battle result only gives us names of deaths, so survivors are those not in deaths
  for (const unit of blueTeam) {
    if (!result.blueDeaths.includes(unit.name)) {
      // Estimate remaining HP based on damage taken
      // This is approximate since we don't have exact post-battle state
      blueSurvivors.push({
        name: unit.name,
        hp: Math.max(1, unit.hp - Math.floor(result.redDamageDealt / result.blueSurvivors)),
        maxHp: unit.maxHp,
        effects: [], // Would need battle state to know exact effects
      });
    }
  }

  for (const unit of redTeam) {
    if (!result.redDeaths.includes(unit.name)) {
      redSurvivors.push({
        name: unit.name,
        hp: Math.max(1, unit.hp - Math.floor(result.blueDamageDealt / Math.max(1, result.redSurvivors))),
        maxHp: unit.maxHp,
        effects: [],
      });
    }
  }

  return {
    scenario,
    winner: result.winner === 'blue' ? blueTeamName : result.winner === 'red' ? redTeamName : 'DRAW',
    rounds: result.rounds,

    blueTeamName,
    blueStarting: result.blueUnitsStart,
    blueSurvivors,
    blueKIA: result.blueDeaths,
    blueTotalDamageDealt: result.blueDamageDealt,

    redTeamName,
    redStarting: result.redUnitsStart,
    redSurvivors,
    redKIA: result.redDeaths,
    redTotalDamageDealt: result.redDamageDealt,

    effectsApplied: Object.entries(effectCounts).map(([effect, count]) => ({
      effect: effect as StatusEffectId,
      count,
    })),
    combatLog: significantEvents.slice(-10), // Last 10 significant events
  };
}

function printDetailedReport(report: DetailedReport): void {
  console.log('\n' + '='.repeat(60));
  console.log(`SCENARIO: ${report.scenario}`);
  console.log('='.repeat(60));

  console.log(`\nWINNER: ${report.winner} (${report.rounds} rounds)`);

  console.log(`\n--- ${report.blueTeamName} ---`);
  console.log(`Starting: ${report.blueStarting} | Survived: ${report.blueSurvivors.length} | KIA: ${report.blueKIA.length}`);
  console.log(`Damage Dealt: ${report.blueTotalDamageDealt}`);
  if (report.blueSurvivors.length > 0) {
    console.log('Survivors:');
    for (const s of report.blueSurvivors) {
      const hpPercent = Math.round((s.hp / s.maxHp) * 100);
      const condition = hpPercent > 75 ? 'Good' : hpPercent > 50 ? 'Wounded' : hpPercent > 25 ? 'Critical' : 'Near Death';
      console.log(`  ${s.name}: ${s.hp}/${s.maxHp} HP (${condition})`);
    }
  }
  if (report.blueKIA.length > 0) {
    console.log(`KIA: ${report.blueKIA.join(', ')}`);
  }

  console.log(`\n--- ${report.redTeamName} ---`);
  console.log(`Starting: ${report.redStarting} | Survived: ${report.redSurvivors.length} | KIA: ${report.redKIA.length}`);
  console.log(`Damage Dealt: ${report.redTotalDamageDealt}`);
  if (report.redSurvivors.length > 0) {
    console.log('Survivors:');
    for (const s of report.redSurvivors) {
      const hpPercent = Math.round((s.hp / s.maxHp) * 100);
      const condition = hpPercent > 75 ? 'Good' : hpPercent > 50 ? 'Wounded' : hpPercent > 25 ? 'Critical' : 'Near Death';
      console.log(`  ${s.name}: ${s.hp}/${s.maxHp} HP (${condition})`);
    }
  }
  if (report.redKIA.length > 0) {
    console.log(`KIA: ${report.redKIA.join(', ')}`);
  }

  if (report.effectsApplied.length > 0) {
    console.log('\n--- STATUS EFFECTS DURING BATTLE ---');
    for (const e of report.effectsApplied) {
      console.log(`  ${e.effect}: ${e.count}x applied`);
    }
  }

  if (report.combatLog.length > 0) {
    console.log('\n--- COMBAT HIGHLIGHTS ---');
    for (const event of report.combatLog) {
      console.log(`  ${event}`);
    }
  }
}

// ============ RUN DETAILED BATTLE ============

function runDetailedBattle(
  scenario: string,
  blueTeamName: string,
  redTeamName: string,
  blueTeam: SimUnit[],
  redTeam: SimUnit[]
): DetailedReport {
  const result = runBattle(blueTeam, redTeam, { maxRounds: 30 });
  return generateDetailedReport(scenario, blueTeamName, redTeamName, blueTeam, redTeam, result);
}

// ============ BATCH TESTING WITH STATS ============

function runBatchWithStats(
  scenario: string,
  blueTeamName: string,
  redTeamName: string,
  createBlue: () => SimUnit[],
  createRed: () => SimUnit[],
  iterations: number
): void {
  let blueWins = 0;
  let redWins = 0;
  let draws = 0;
  let totalRounds = 0;
  let totalEffects: Record<string, number> = {};
  let totalBlueKIA = 0;
  let totalRedKIA = 0;

  for (let i = 0; i < iterations; i++) {
    resetUnitIds();
    const blue = createBlue();
    const red = createRed();
    const result = runBattle(blue, red, { maxRounds: 30 });

    if (result.winner === 'blue') blueWins++;
    else if (result.winner === 'red') redWins++;
    else draws++;

    totalRounds += result.rounds;
    totalBlueKIA += result.blueDeaths.length;
    totalRedKIA += result.redDeaths.length;

    // Count effects
    for (const attack of result.log) {
      for (const effect of attack.effectsApplied) {
        totalEffects[effect] = (totalEffects[effect] || 0) + 1;
      }
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log(`BATCH TEST: ${scenario} (${iterations} fights)`);
  console.log('='.repeat(60));

  console.log(`\n${blueTeamName} vs ${redTeamName}`);
  console.log(`  ${blueTeamName} wins: ${((blueWins / iterations) * 100).toFixed(1)}%`);
  console.log(`  ${redTeamName} wins: ${((redWins / iterations) * 100).toFixed(1)}%`);
  console.log(`  Draws: ${((draws / iterations) * 100).toFixed(1)}%`);
  console.log(`  Avg rounds: ${(totalRounds / iterations).toFixed(1)}`);
  console.log(`  Avg ${blueTeamName} KIA: ${(totalBlueKIA / iterations).toFixed(1)}`);
  console.log(`  Avg ${redTeamName} KIA: ${(totalRedKIA / iterations).toFixed(1)}`);

  if (Object.keys(totalEffects).length > 0) {
    console.log('\nStatus Effects Applied (total across all fights):');
    for (const [effect, count] of Object.entries(totalEffects).sort((a, b) => b[1] - a[1])) {
      console.log(`  ${effect}: ${count} (${(count / iterations).toFixed(1)} per fight)`);
    }
  }
}

// ============ MAIN TEST SCENARIOS ============

console.log('\n' + '='.repeat(60));
console.log('       REALISTIC COMBAT TEST SUITE');
console.log('       Grounded Human Combat Scenarios');
console.log('='.repeat(60));

// Scenario 1: Police vs Armed Robbers
console.log('\n\n========== SCENARIO 1: POLICE VS ARMED ROBBERS ==========');

resetUnitIds();
const policeTeam1 = [
  createPoliceOfficer('blue', 'Officer Johnson'),
  createPoliceOfficer('blue', 'Officer Smith'),
  createPoliceOfficer('blue', 'Officer Davis'),
];

const robbersTeam1 = [
  createThug('red', 'Robber 1', CHEAP_PISTOL),
  createThug('red', 'Robber 2', CHEAP_PISTOL),
  createThug('red', 'Robber 3', MACHETE), // One with a blade - causes bleeding
];

const report1 = runDetailedBattle(
  'Bank Robbery Response',
  'Police',
  'Armed Robbers',
  policeTeam1,
  robbersTeam1
);
printDetailedReport(report1);

// Batch test the same scenario
runBatchWithStats(
  'Police vs Armed Robbers',
  'Police',
  'Robbers',
  () => [
    createPoliceOfficer('blue', 'Officer 1'),
    createPoliceOfficer('blue', 'Officer 2'),
    createPoliceOfficer('blue', 'Officer 3'),
  ],
  () => [
    createThug('red', 'Robber 1', CHEAP_PISTOL),
    createThug('red', 'Robber 2', CHEAP_PISTOL),
    createThug('red', 'Robber 3', MACHETE),
  ],
  100
);

// Scenario 2: SWAT vs Terrorists
console.log('\n\n========== SCENARIO 2: SWAT VS TERRORISTS ==========');

resetUnitIds();
const swatTeam = [
  createSWAT('blue', 'SWAT Alpha', ASSAULT_RIFLE),
  createSWAT('blue', 'SWAT Bravo', POLICE_SHOTGUN),
  createSWAT('blue', 'SWAT Charlie', ASSAULT_RIFLE),
  createSWAT('blue', 'SWAT Delta', TASER), // Non-lethal option - causes stun
];

const terroristTeam = [
  createTerrorist('red', 'Hostile 1', AK47),
  createTerrorist('red', 'Hostile 2', AK47),
  createTerrorist('red', 'Hostile 3', AK47),
  createTerrorist('red', 'Hostile 4', MOLOTOV), // Fire - causes burning
];

const report2 = runDetailedBattle(
  'Hostage Rescue',
  'SWAT Team',
  'Terrorists',
  swatTeam,
  terroristTeam
);
printDetailedReport(report2);

// Batch test
runBatchWithStats(
  'SWAT vs Terrorists',
  'SWAT',
  'Terrorists',
  () => [
    createSWAT('blue', 'SWAT 1', ASSAULT_RIFLE),
    createSWAT('blue', 'SWAT 2', POLICE_SHOTGUN),
    createSWAT('blue', 'SWAT 3', ASSAULT_RIFLE),
    createSWAT('blue', 'SWAT 4', TASER),
  ],
  () => [
    createTerrorist('red', 'Terrorist 1', AK47),
    createTerrorist('red', 'Terrorist 2', AK47),
    createTerrorist('red', 'Terrorist 3', AK47),
    createTerrorist('red', 'Terrorist 4', MOLOTOV),
  ],
  100
);

// Scenario 3: Soldiers vs Militia (with bleeding weapons)
console.log('\n\n========== SCENARIO 3: SOLDIERS VS MILITIA ==========');

resetUnitIds();
const soldierTeam = [
  createSoldier('blue', 'Sgt. Miller', AP_RIFLE), // AP rounds cause bleeding
  createSoldier('blue', 'Cpl. Johnson', ASSAULT_RIFLE),
  createSoldier('blue', 'Pvt. Williams', ASSAULT_RIFLE),
  createSoldier('blue', 'Pvt. Brown', COMBAT_KNIFE), // Knife causes bleeding
];

const militiaTeam = [
  createMilitia('red', 'Fighter 1', AK47),
  createMilitia('red', 'Fighter 2', AK47),
  createMilitia('red', 'Fighter 3', AK47),
  createMilitia('red', 'Fighter 4', MACHETE), // Machete causes bleeding
  createMilitia('red', 'Fighter 5', CHEAP_PISTOL),
];

const report3 = runDetailedBattle(
  'Patrol Ambush',
  'US Soldiers',
  'Local Militia',
  soldierTeam,
  militiaTeam
);
printDetailedReport(report3);

// Batch test
runBatchWithStats(
  'Soldiers vs Militia (5v4)',
  'Soldiers',
  'Militia',
  () => [
    createSoldier('blue', 'Soldier 1', AP_RIFLE),
    createSoldier('blue', 'Soldier 2', ASSAULT_RIFLE),
    createSoldier('blue', 'Soldier 3', ASSAULT_RIFLE),
    createSoldier('blue', 'Soldier 4', COMBAT_KNIFE),
  ],
  () => [
    createMilitia('red', 'Militia 1', AK47),
    createMilitia('red', 'Militia 2', AK47),
    createMilitia('red', 'Militia 3', AK47),
    createMilitia('red', 'Militia 4', MACHETE),
    createMilitia('red', 'Militia 5', CHEAP_PISTOL),
  ],
  100
);

// Scenario 4: Gang vs Gang (lots of bleeding)
console.log('\n\n========== SCENARIO 4: GANG VS GANG ==========');

resetUnitIds();
const gang1 = [
  createGangMember('blue', 'Los Santos 1', MAC10),
  createGangMember('blue', 'Los Santos 2', MAC10),
  createGangMember('blue', 'Los Santos 3', MACHETE), // Bleeding
  createGangMember('blue', 'Los Santos 4', MACHETE), // Bleeding
];

const gang2 = [
  createGangMember('red', 'Ballas 1', CHEAP_PISTOL),
  createGangMember('red', 'Ballas 2', CHEAP_PISTOL),
  createGangMember('red', 'Ballas 3', MACHETE), // Bleeding
  createGangMember('red', 'Ballas 4', MOLOTOV), // Burning
];

const report4 = runDetailedBattle(
  'Street Warfare',
  'Los Santos',
  'Ballas',
  gang1,
  gang2
);
printDetailedReport(report4);

// Batch test
runBatchWithStats(
  'Gang vs Gang',
  'Los Santos',
  'Ballas',
  () => [
    createGangMember('blue', 'LS 1', MAC10),
    createGangMember('blue', 'LS 2', MAC10),
    createGangMember('blue', 'LS 3', MACHETE),
    createGangMember('blue', 'LS 4', MACHETE),
  ],
  () => [
    createGangMember('red', 'Ballas 1', CHEAP_PISTOL),
    createGangMember('red', 'Ballas 2', CHEAP_PISTOL),
    createGangMember('red', 'Ballas 3', MACHETE),
    createGangMember('red', 'Ballas 4', MOLOTOV),
  ],
  100
);

// ============ EFFECT SUMMARY ============

console.log('\n\n' + '='.repeat(60));
console.log('       STATUS EFFECTS IN REALISTIC COMBAT');
console.log('='.repeat(60));

console.log('\nWeapons that cause status effects:');
console.log('  EDGED_SLASHING (bleeding):');
console.log('    - Combat Knife: 15 dmg + bleed (4/turn, 4 turns, stacks 5x)');
console.log('    - Machete: 20 dmg + bleed');
console.log('  GUNFIRE_AP (bleeding):');
console.log('    - AP Rifle: 28 dmg + bleed (3/turn decreasing, 2 turns)');
console.log('  ENERGY_THERMAL (burning):');
console.log('    - Molotov: 25 dmg + burn (5+2n/turn, 3 turns, 30% spread)');
console.log('  ELECTROMAGNETIC_BOLT (stun):');
console.log('    - Taser: 5 dmg + stun (skip 1 turn, save possible)');

console.log('\nBleed damage potential per hit:');
console.log('  Slashing: 4 dmg x 4 turns = 16 extra damage');
console.log('  AP rounds: 3 + 2 + 1 = 6 extra damage (decreasing)');
console.log('  Max stacked slashing (5x): 20 dmg/turn x 4 = 80 extra damage!');

console.log('\nBurn damage per hit:');
console.log('  Molotov: 5 + 7 + 9 = 21 extra damage over 3 turns');
console.log('  Plus 30% chance to spread to adjacent!');

console.log('\n' + '='.repeat(60));
console.log('       ALL REALISTIC COMBAT TESTS COMPLETE');
console.log('='.repeat(60) + '\n');
