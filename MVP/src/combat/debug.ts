/**
 * Debug script for weapon range calculation
 */
import { createShotgunCloseRangeTest, createPistolCloseRangeTest, WEAPONS } from './index';
import { runBattle } from './battleRunner';

const { blue, red, distance } = createShotgunCloseRangeTest();

console.log('=== Debug: Weapon Range Test ===\n');
console.log('Blue positions:', blue.map(u => `${u.name} at (${u.position?.x}, ${u.position?.y})`));
console.log('Red positions:', red.map(u => `${u.name} at (${u.position?.x}, ${u.position?.y})`));
console.log('Expected distance:', distance, 'tiles\n');

console.log('Weapon Stats at 2 tiles:');
const shotgun = WEAPONS.pumpShotgun;
const rifle = WEAPONS.assaultRifle;
console.log(`  Shotgun: base ${shotgun.accuracy}, pointBlank(<=2) +${shotgun.rangeBrackets?.pointBlankMod} = ${shotgun.accuracy + (shotgun.rangeBrackets?.pointBlankMod || 0)}`);
console.log(`  Rifle:   base ${rifle.accuracy}, pointBlank(<=2) ${rifle.rangeBrackets?.pointBlankMod} = ${rifle.accuracy + (rifle.rangeBrackets?.pointBlankMod || 0)}`);
console.log(`  Damage:  Shotgun ${shotgun.damage} vs Rifle ${rifle.damage}\n`);

console.log('=== Running Single Battle ===\n');
const result = runBattle(blue, red);

console.log('First 8 attacks:');
result.log.slice(0, 8).forEach((attack, i) => {
  console.log(`${i + 1}. ${attack.attacker} -> ${attack.target}`);
  console.log(`   ${attack.weapon} | dist:${attack.distance?.toFixed(1)} | ${attack.rangeBracket}`);
  console.log(`   acc:${attack.accuracy}% roll:${attack.roll.toFixed(1)} -> ${attack.hitResult} | dmg:${attack.rawDamage}->${attack.finalDamage}`);
});

console.log(`\nWinner: ${result.winner}`);
console.log(`Blue survivors: ${result.blueSurvivors}, Red survivors: ${result.redSurvivors}`);
