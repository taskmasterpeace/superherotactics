/**
 * Grenade System Test
 *
 * Tests grenade explosions and area-of-effect damage.
 * Run: npx tsx src/combat/grenadeTest.ts
 */

import {
  SimUnit,
  StatusEffectInstance,
  FLANKING_BONUSES,
} from './types';
import { UNIT_PRESETS, createUnit } from './humanPresets';
import { applyStatusEffects } from './statusEffects';
import {
  GRENADES,
  Grenade,
  calculateThrow,
  calculateExplosion,
  ExplosionResult,
  ExplosionVictim,
} from '../data/explosionSystem';

console.log('='.repeat(60));
console.log('       GRENADE SYSTEM TEST');
console.log('='.repeat(60));

// ============ GRENADE DATA ============
console.log('\n=== GRENADE DEFINITIONS ===\n');

for (const [id, grenade] of Object.entries(GRENADES)) {
  console.log(`${grenade.emoji} ${grenade.name}:`);
  console.log(`   Damage: ${grenade.damageAtCenter} | Radius: ${grenade.blastRadius} | Range: ${grenade.maxRange}`);
  console.log(`   Falloff: ${grenade.damageFalloff} | Effects: ${grenade.statusEffects?.join(', ') || 'none'}`);
}

// ============ THROW ACCURACY TESTS ============
console.log('\n=== THROW ACCURACY ===\n');

// Test skilled thrower (perfect accuracy)
const skilledThrow = calculateThrow(
  { x: 0, y: 0 },
  { x: 10, y: 0 },
  20, // STR
  true, // Has throwing skill
  GRENADES.FRAG
);
console.log(`Skilled throw: ${skilledThrow.hit ? 'HIT' : 'MISS'} (scatter: ${skilledThrow.scatterDistance.toFixed(1)})`);

// Test unskilled throws (scatter expected)
console.log('\nUnskilled throws (10 samples):');
let hits = 0;
let totalScatter = 0;
for (let i = 0; i < 10; i++) {
  const result = calculateThrow(
    { x: 0, y: 0 },
    { x: 10, y: 0 },
    15, // Average STR
    false, // No throwing skill
    GRENADES.FRAG
  );
  if (result.hit) hits++;
  totalScatter += result.scatterDistance;
}
console.log(`  Hit rate: ${hits}/10 | Avg scatter: ${(totalScatter / 10).toFixed(1)} tiles`);

// ============ EXPLOSION DAMAGE TESTS ============
console.log('\n=== EXPLOSION DAMAGE ===\n');

// Create clustered enemies
function createClusteredEnemies(centerX: number, centerY: number, count: number, spread: number) {
  const enemies: Array<{ id: string; position: { x: number; y: number }; str: number }> = [];

  // Place enemies in a cluster around center
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2;
    const distance = Math.random() * spread;
    const x = Math.round(centerX + Math.cos(angle) * distance);
    const y = Math.round(centerY + Math.sin(angle) * distance);
    enemies.push({
      id: `enemy_${i}`,
      position: { x, y },
      str: 15, // Average STR
    });
  }

  return enemies;
}

// Test frag grenade vs cluster
console.log('FRAG GRENADE vs 5 clustered enemies:');
const cluster5 = createClusteredEnemies(10, 10, 5, 2);
const fragResult = calculateExplosion({ x: 10, y: 10 }, GRENADES.FRAG, cluster5);
console.log(`  Victims: ${fragResult.victims.length}/${cluster5.length}`);
console.log(`  Total damage: ${fragResult.victims.reduce((sum, v) => sum + v.damage, 0)}`);
for (const victim of fragResult.victims) {
  console.log(`    ${victim.unitId}: ${victim.damage} dmg at dist ${victim.distanceFromCenter.toFixed(1)}, knockback ${victim.knockbackSpaces}`);
}

// Test flashbang (larger radius, less damage)
console.log('\nFLASHBANG vs 5 clustered enemies:');
const flashResult = calculateExplosion({ x: 10, y: 10 }, GRENADES.FLASHBANG, cluster5);
console.log(`  Victims: ${flashResult.victims.length}/${cluster5.length}`);
console.log(`  Effects applied: ${GRENADES.FLASHBANG.statusEffects?.join(', ')}`);
for (const victim of flashResult.victims) {
  console.log(`    ${victim.unitId}: ${victim.damage} dmg, effects: [${victim.statusEffects.join(', ')}]`);
}

// ============ DAMAGE FALLOFF TESTS ============
console.log('\n=== DAMAGE FALLOFF ===\n');

function testDamageFalloff(grenade: Grenade) {
  console.log(`${grenade.name} (${grenade.damageFalloff} falloff, radius ${grenade.blastRadius}):`);

  // Create enemies at different distances
  const distances = [0, 1, 2, 3, 4, 5];
  const enemies = distances.map((d, i) => ({
    id: `enemy_${i}`,
    position: { x: 10 + d, y: 10 },
    str: 15,
  }));

  const result = calculateExplosion({ x: 10, y: 10 }, grenade, enemies);

  for (const dist of distances) {
    const victim = result.victims.find(v => v.distanceFromCenter.toFixed(0) === dist.toString());
    if (victim) {
      const pct = Math.round((victim.damage / grenade.damageAtCenter) * 100);
      console.log(`  Distance ${dist}: ${victim.damage} dmg (${pct}%)`);
    } else {
      console.log(`  Distance ${dist}: out of range`);
    }
  }
}

testDamageFalloff(GRENADES.FRAG);
testDamageFalloff(GRENADES.CONCUSSION);

// ============ STATUS EFFECT APPLICATION ============
console.log('\n=== STATUS EFFECT APPLICATION ===\n');

// Convert explosion victims to status effects on SimUnits
function applyGrenadeEffects(
  grenadeId: string,
  explosionResult: ExplosionResult,
  units: SimUnit[]
): void {
  const grenade = GRENADES[grenadeId];
  if (!grenade.statusEffects || grenade.statusEffects.length === 0) return;

  for (const victim of explosionResult.victims) {
    const unit = units.find(u => u.id === victim.unitId);
    if (!unit) continue;

    // Apply each status effect from the grenade
    for (const effectId of grenade.statusEffects) {
      const effect = createGrenadeStatusEffect(effectId, grenade, victim.distanceFromCenter);
      if (effect) {
        applyStatusEffects(unit, [effect]);
      }
    }
  }
}

// Create status effect instances based on grenade type
function createGrenadeStatusEffect(
  effectId: string,
  grenade: Grenade,
  distance: number
): StatusEffectInstance | null {
  // Scale duration/damage based on distance (closer = worse)
  const intensity = 1 - (distance / grenade.blastRadius);

  switch (effectId) {
    case 'bleeding':
      return {
        id: 'bleeding',
        duration: Math.max(1, Math.round(3 * intensity)),
        damagePerTick: Math.max(2, Math.round(4 * intensity)),
        scaling: 'constant',
        source: grenade.id,
      };
    case 'burning':
      return {
        id: 'burning',
        duration: Math.max(1, Math.round(3 * intensity)),
        damagePerTick: Math.max(3, Math.round(6 * intensity)),
        scaling: 'increasing',
        damageChange: 2,
        spreadChance: 0.1,
        source: grenade.id,
      };
    case 'stunned':
      return {
        id: 'stunned',
        duration: Math.max(1, Math.round(2 * intensity)),
        skipTurn: true,
        source: grenade.id,
      };
    // Note: 'blinded' not in our status effects yet
    default:
      return null;
  }
}

// Test status effect application
console.log('Testing FRAG grenade status effects:');
const testUnits = cluster5.map((e, i) => ({
  ...createUnit(UNIT_PRESETS.soldierRifle, 'red'),
  id: e.id,
  position: e.position,
}));

// Apply grenade effects
applyGrenadeEffects('FRAG', fragResult, testUnits);

for (const unit of testUnits) {
  const effects = unit.statusEffects.map(e => `${e.id}(${e.duration}t, ${e.damagePerTick || 0}dmg)`);
  console.log(`  ${unit.id}: ${effects.length > 0 ? effects.join(', ') : 'no effects'}`);
}

console.log('\nTesting INCENDIARY grenade status effects:');
const testUnits2 = cluster5.map((e, i) => ({
  ...createUnit(UNIT_PRESETS.soldierRifle, 'red'),
  id: e.id,
  position: e.position,
}));
const incendiaryResult = calculateExplosion({ x: 10, y: 10 }, GRENADES.INCENDIARY, cluster5);
applyGrenadeEffects('INCENDIARY', incendiaryResult, testUnits2);

for (const unit of testUnits2) {
  const effects = unit.statusEffects.map(e => `${e.id}(${e.duration}t, ${e.damagePerTick || 0}dmg)`);
  console.log(`  ${unit.id}: ${effects.length > 0 ? effects.join(', ') : 'no effects (out of range)'}`);
}

// ============ TACTICAL SCENARIOS ============
console.log('\n=== TACTICAL SCENARIOS ===\n');

// Scenario 1: Grenade into room (clustered enemies)
console.log('Scenario 1: Frag grenade into room with 4 clustered enemies');
const roomEnemies = [
  { id: 'room_1', position: { x: 10, y: 10 }, str: 15 },
  { id: 'room_2', position: { x: 11, y: 10 }, str: 15 },
  { id: 'room_3', position: { x: 10, y: 11 }, str: 15 },
  { id: 'room_4', position: { x: 11, y: 11 }, str: 15 },
];
const roomResult = calculateExplosion({ x: 10, y: 10 }, GRENADES.FRAG, roomEnemies);
const totalRoomDamage = roomResult.victims.reduce((sum, v) => sum + v.damage, 0);
console.log(`  Targets hit: ${roomResult.victims.length}/4`);
console.log(`  Total damage: ${totalRoomDamage} (avg ${(totalRoomDamage / roomResult.victims.length).toFixed(0)} per target)`);

// Scenario 2: Flashbang breach
console.log('\nScenario 2: Flashbang breach (stun before entry)');
const flashRoomResult = calculateExplosion({ x: 10, y: 10 }, GRENADES.FLASHBANG, roomEnemies);
const stunnedCount = flashRoomResult.victims.filter(v => v.statusEffects.includes('stunned')).length;
console.log(`  Targets hit: ${flashRoomResult.victims.length}/4`);
console.log(`  Stunned: ${stunnedCount}/4`);

// Scenario 3: Incendiary area denial
console.log('\nScenario 3: Incendiary area denial');
const spreadEnemies = [
  { id: 'spread_1', position: { x: 10, y: 10 }, str: 15 },
  { id: 'spread_2', position: { x: 12, y: 10 }, str: 15 },  // 2 tiles away
  { id: 'spread_3', position: { x: 14, y: 10 }, str: 15 },  // 4 tiles away (out of range)
];
const incResult = calculateExplosion({ x: 10, y: 10 }, GRENADES.INCENDIARY, spreadEnemies);
console.log(`  Targets in range: ${incResult.victims.length}/3`);
for (const v of incResult.victims) {
  console.log(`    ${v.unitId}: ${v.damage} dmg + burning at dist ${v.distanceFromCenter.toFixed(0)}`);
}

// ============ BATCH SIMULATION ============
console.log('\n=== BATCH SIMULATION: GRENADE EFFECTIVENESS ===\n');

function simulateGrenadeBattle(
  grenadeType: string,
  enemyCount: number,
  clusterSpread: number,
  iterations: number
): { avgDamage: number; avgHits: number; avgKills: number } {
  let totalDamage = 0;
  let totalHits = 0;
  let totalKills = 0;

  const grenade = GRENADES[grenadeType];

  for (let i = 0; i < iterations; i++) {
    // Create clustered enemies
    const enemies = createClusteredEnemies(10, 10, enemyCount, clusterSpread);

    // Simulate throw (perfect throw for testing)
    const result = calculateExplosion({ x: 10, y: 10 }, grenade, enemies);

    totalHits += result.victims.length;
    totalDamage += result.victims.reduce((sum, v) => sum + v.damage, 0);

    // Count kills (assuming 80 HP per enemy)
    const kills = result.victims.filter(v => v.damage >= 80).length;
    totalKills += kills;
  }

  return {
    avgDamage: totalDamage / iterations,
    avgHits: totalHits / iterations,
    avgKills: totalKills / iterations,
  };
}

// Test each grenade type
const grenadeTypes = ['FRAG', 'CONCUSSION', 'FLASHBANG', 'INCENDIARY'];
const testConfigs = [
  { enemies: 3, spread: 1, desc: '3 enemies tight cluster' },
  { enemies: 5, spread: 2, desc: '5 enemies medium cluster' },
  { enemies: 5, spread: 4, desc: '5 enemies spread out' },
];

for (const config of testConfigs) {
  console.log(`\n${config.desc}:`);
  for (const gType of grenadeTypes) {
    const result = simulateGrenadeBattle(gType, config.enemies, config.spread, 100);
    console.log(`  ${GRENADES[gType].emoji} ${GRENADES[gType].name.padEnd(12)}: ${result.avgHits.toFixed(1)} hits, ${result.avgDamage.toFixed(0)} total dmg, ${result.avgKills.toFixed(2)} kills`);
  }
}

// ============ SUMMARY ============
console.log('\n' + '='.repeat(60));
console.log('       SUMMARY');
console.log('='.repeat(60));

console.log(`
Grenade Types:
  💣 FRAG:       50 dmg, 3 radius, linear falloff, bleeding
  💥 CONCUSSION: 35 dmg, 4 radius, quadratic falloff, stunned
  💡 FLASHBANG:   5 dmg, 5 radius, quadratic falloff, stunned+blinded
  🔥 INCENDIARY: 30 dmg, 2 radius, linear falloff, burning
  💨 SMOKE:       0 dmg, 4 radius, no effects

Tactical Uses:
  - FRAG: Maximum damage to clustered enemies
  - CONCUSSION: Knockback + stun for crowd control
  - FLASHBANG: Entry breach, disable multiple targets
  - INCENDIARY: Area denial, damage over time
  - SMOKE: Cover creation, vision blocking

Key Mechanics:
  - Damage falls off with distance (linear or quadratic)
  - Knockback pushes targets away from center
  - Status effects scale with proximity
  - Skilled throwers have perfect accuracy
`);

console.log('='.repeat(60));
console.log('       ALL TESTS COMPLETE');
console.log('='.repeat(60));
