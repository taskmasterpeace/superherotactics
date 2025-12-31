/**
 * Test file demonstrating weapon database integration
 *
 * This shows how weapons from weapons.ts are converted to CombatScene format
 */

import { convertWeaponToCombatFormat, lookupWeaponInDatabase } from './weaponIntegration';
import { getWeaponByName } from '../../data/weapons';

// Example 1: Convert a pistol from the database
const standardPistol = getWeaponByName('Standard Pistol');
if (standardPistol) {
  const combatPistol = convertWeaponToCombatFormat(standardPistol);
  console.log('Standard Pistol in combat format:', {
    name: combatPistol.name,
    damage: combatPistol.damage, // 20
    range: combatPistol.range, // 25
    accuracy: combatPistol.accuracy, // 70 + (-2 * 10) = 50
    ap: combatPistol.ap, // Math.round(1 + 1.5) = 2
    visual: combatPistol.visual.type, // 'projectile'
    emoji: combatPistol.emoji // '🔫'
  });
}

// Example 2: Convert a laser rifle
const laserRifle = getWeaponByName('Laser Rifle');
if (laserRifle) {
  const combatLaser = convertWeaponToCombatFormat(laserRifle);
  console.log('Laser Rifle in combat format:', {
    name: combatLaser.name,
    damage: combatLaser.damage, // 40
    range: combatLaser.range, // 50
    accuracy: combatLaser.accuracy, // 70 + (-1 * 10) = 60
    ap: combatLaser.ap, // Math.round(1 + 2.0) = 3
    visual: {
      type: combatLaser.visual.type, // 'beam' (because LASER damage type)
      color: '0x' + combatLaser.visual.color.toString(16) // 0x00ffff (cyan)
    },
    emoji: combatLaser.emoji // '⚡'
  });
}

// Example 3: Fuzzy lookup
const shotgun = lookupWeaponInDatabase('shotgun'); // Finds "Pump Shotgun"
if (shotgun) {
  console.log('Fuzzy lookup "shotgun" found:', {
    name: shotgun.name,
    damage: shotgun.damage, // 35
    visual: shotgun.visual.type, // 'cone' (because BUCKSHOT)
    knockback: shotgun.knockback // 2
  });
}

// Example 4: Lookup by weapon ID
const plasmaRifle = lookupWeaponInDatabase('NRG_002'); // Plasma Rifle by ID
if (plasmaRifle) {
  console.log('Lookup by ID "NRG_002":', {
    name: plasmaRifle.name, // 'Plasma Rifle'
    damage: plasmaRifle.damage, // 45
    visual: {
      type: plasmaRifle.visual.type, // 'beam'
      color: '0x' + plasmaRifle.visual.color.toString(16) // 0xff00ff (magenta)
    }
  });
}

// Example 5: All melee weapons get 'melee' visual type
const katana = getWeaponByName('Katana');
if (katana) {
  const combatKatana = convertWeaponToCombatFormat(katana);
  console.log('Katana in combat format:', {
    name: combatKatana.name,
    damage: combatKatana.damage, // 15
    range: combatKatana.range, // 2
    visual: combatKatana.visual.type, // 'melee'
    emoji: combatKatana.emoji // '⚔️'
  });
}

export {}; // Make this a module
