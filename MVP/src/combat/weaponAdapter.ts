/**
 * Weapon Adapter - Converts weapons.ts Weapons to combat SimWeapons
 *
 * This adapter bridges the rich weapon database (70+ weapons) with
 * the combat engine's SimWeapon interface.
 *
 * Key conversions:
 * - baseDamage -> damage
 * - accuracyCS -> accuracy (converted from column shift to percentage)
 * - specialEffects -> availableFireModes (parsed for burst/auto keywords)
 * - attackSpeed -> apCost (inverted relationship)
 */

import { ALL_WEAPONS, getWeaponById, getWeaponByName } from '../data/weapons';
import { Weapon, WeaponRangeBrackets } from '../data/equipmentTypes';
import { SimWeapon, FireMode } from './types';

// Default weapon when lookup fails
const DEFAULT_RIFLE: SimWeapon = {
  name: 'Standard Rifle',
  damage: 25,
  accuracy: 70,
  damageType: 'GUNFIRE',
  range: 30,
  apCost: 5,
  availableFireModes: ['single'],
};

/**
 * Infer available fire modes from weapon special effects.
 *
 * Keywords to look for:
 * - "Full-auto" or "automatic" -> includes 'auto'
 * - "Burst" -> includes 'burst'
 * - Machine guns and SMGs typically have burst/auto
 * - Snipers, shotguns, pistols are typically single only
 */
export function inferFireModes(weapon: Weapon): FireMode[] {
  const effects = weapon.specialEffects || [];
  const effectsLower = effects.map(e => e.toLowerCase()).join(' ');
  const nameLower = weapon.name.toLowerCase();
  const categoryLower = weapon.category.toLowerCase();

  const modes: FireMode[] = ['single']; // All weapons can fire single

  // Check special effects for burst/auto keywords
  if (effectsLower.includes('full-auto') ||
      effectsLower.includes('full auto') ||
      effectsLower.includes('automatic') ||
      effectsLower.includes('auto-fire')) {
    modes.push('burst', 'auto');
  } else if (effectsLower.includes('burst')) {
    modes.push('burst');
  }

  // Category/name-based inference if no special effects found
  if (modes.length === 1) {
    // SMGs typically have burst/auto
    if (nameLower.includes('smg') || nameLower.includes('submachine')) {
      modes.push('burst', 'auto');
    }
    // Machine guns have burst/auto
    else if (nameLower.includes('machine gun') || nameLower.includes('minigun') ||
             nameLower.includes('lmg') || nameLower.includes('hmg')) {
      modes.push('burst', 'auto');
    }
    // Assault rifles typically have burst
    else if (nameLower.includes('assault') && nameLower.includes('rifle')) {
      modes.push('burst');
    }
  }

  return modes;
}

/**
 * Convert accuracyCS (column shift, -3 to +3) to accuracy percentage.
 *
 * Base accuracy is 70%.
 * Each CS is worth ~5% accuracy.
 * -3 CS = 55%, 0 CS = 70%, +3 CS = 85%
 */
function convertAccuracyCS(cs: number): number {
  const baseAccuracy = 70;
  const csValue = 5; // Each CS = 5%
  return Math.max(30, Math.min(95, baseAccuracy + (cs * csValue)));
}

/**
 * Convert attack speed (seconds between attacks) to AP cost.
 *
 * Faster weapons (lower attackSpeed) = lower AP cost
 * Slower weapons (higher attackSpeed) = higher AP cost
 *
 * Conversion: AP = ceil(attackSpeed * 2.5)
 * 1.0 speed = 3 AP (fast knife)
 * 1.5 speed = 4 AP (pistol)
 * 2.0 speed = 5 AP (rifle)
 * 3.0 speed = 8 AP (heavy weapon)
 */
function convertAttackSpeed(speed: number): number {
  return Math.max(2, Math.min(10, Math.ceil(speed * 2.5)));
}

/**
 * Convert weapon range brackets to SimWeapon format.
 * Add accuracy modifiers for each bracket.
 */
function convertRangeBrackets(brackets?: WeaponRangeBrackets): SimWeapon['rangeBrackets'] | undefined {
  if (!brackets) return undefined;

  return {
    pointBlank: brackets.pointBlank,
    pointBlankMod: 15,  // +15% at point blank
    short: brackets.short,
    shortMod: 5,        // +5% at short range
    optimal: brackets.optimal,
    optimalMod: 0,      // 0% at optimal range
    long: brackets.long,
    longMod: -10,       // -10% at long range
    max: brackets.max,
    extremeMod: -25,    // -25% at extreme range
  };
}

/**
 * Convert a Weapon from weapons.ts to a combat-ready SimWeapon.
 *
 * @param weaponId - The weapon ID from the database
 * @returns SimWeapon ready for combat, or default rifle if not found
 */
export function getSimWeapon(weaponId: string): SimWeapon {
  const weapon = getWeaponById(weaponId);

  if (!weapon) {
    console.warn(`Weapon not found: ${weaponId}, using default`);
    return { ...DEFAULT_RIFLE };
  }

  return convertWeapon(weapon);
}

/**
 * Get a SimWeapon by name instead of ID.
 */
export function getSimWeaponByName(name: string): SimWeapon {
  const weapon = getWeaponByName(name);

  if (!weapon) {
    console.warn(`Weapon not found: ${name}, using default`);
    return { ...DEFAULT_RIFLE };
  }

  return convertWeapon(weapon);
}

/**
 * Get all weapons from the database as SimWeapons.
 */
export function getAllSimWeapons(): SimWeapon[] {
  return ALL_WEAPONS.map(convertWeapon);
}

/**
 * Convert a single Weapon to SimWeapon.
 */
function convertWeapon(weapon: Weapon): SimWeapon {
  // Determine knockback force from damage type
  let knockbackForce = 0;
  if (weapon.damageSubType === 'BUCKSHOT') knockbackForce = 2;
  if (weapon.damageSubType === 'SLUG') knockbackForce = 3;
  if (weapon.damageSubType === 'EXPLOSION') knockbackForce = 5;
  if (weapon.name.toLowerCase().includes('rocket')) knockbackForce = 5;

  const simWeapon: SimWeapon = {
    name: weapon.name,
    damage: weapon.baseDamage,
    accuracy: convertAccuracyCS(weapon.accuracyCS),
    damageType: weapon.damageSubType, // Use subtype for more specific damage
    range: weapon.range,
    apCost: convertAttackSpeed(weapon.attackSpeed),
    knockbackForce: knockbackForce > 0 ? knockbackForce : undefined,
    rangeBrackets: convertRangeBrackets(weapon.rangeBrackets),
    availableFireModes: inferFireModes(weapon),
    currentFireMode: 'single',
  };

  // Add special properties for martial arts weapons
  if (weapon.disarmBonus) {
    simWeapon.special = {
      ...simWeapon.special,
      disarmBonus: weapon.disarmBonus,
    };
  }

  // Light attack for fast melee weapons
  if (weapon.category.includes('Melee') && weapon.attackSpeed <= 1.0) {
    simWeapon.isLightAttack = true;
  }

  return simWeapon;
}

/**
 * Get weapons by category for loadout selection.
 */
export function getSimWeaponsByCategory(category: string): SimWeapon[] {
  return ALL_WEAPONS
    .filter(w => w.category.includes(category))
    .map(convertWeapon);
}

/**
 * Get a random weapon from a category.
 */
export function getRandomWeaponFromCategory(category: string): SimWeapon {
  const weapons = getSimWeaponsByCategory(category);
  if (weapons.length === 0) return { ...DEFAULT_RIFLE };
  return weapons[Math.floor(Math.random() * weapons.length)];
}
