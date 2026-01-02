/**
 * Armor Database Integration Functions
 * Converts armor from armor.ts to CombatScene format
 *
 * Similar to weaponIntegration.ts, this provides a clean interface
 * for CombatScene to use the armor database.
 */

import type { Armor } from '../../data/equipmentTypes';
import {
  getArmorById,
  getArmorByName,
  getArmorDRValues,
  selectArmorForEnemy as selectArmorFromDB,
  ArmorDRValues,
} from '../../data/armor';

/**
 * Combat-ready armor data structure
 * Used by CombatScene for damage calculations
 */
export interface CombatArmorData {
  dr: number;           // Primary damage reduction (drPhysical)
  drEnergy: number;     // Energy damage reduction
  drMental: number;     // Mental damage reduction
  stoppingPower: number; // Ballistic stopping power
  armorName: string | null;
}

/**
 * Character interface for armor lookup
 * Matches the structure used in CombatScene spawning
 */
interface CharacterWithArmor {
  equippedArmor?: string | string[];
  dr?: number;
  stoppingPower?: number;
}

/**
 * Look up armor in the database and return combat-ready format
 *
 * @param armorNameOrId - Armor name or ID (e.g., "Kevlar Vest", "ARM_LGT_002")
 * @returns CombatArmorData with DR values
 */
export function lookupArmorInDatabase(armorNameOrId: string): CombatArmorData {
  const values = getArmorDRValues(armorNameOrId);
  return {
    dr: values.drPhysical,
    drEnergy: values.drEnergy,
    drMental: values.drMental,
    stoppingPower: values.stoppingPower,
    armorName: values.armorName,
  };
}

/**
 * Convert Armor object to combat format
 *
 * @param armor - Armor object from database
 * @returns CombatArmorData
 */
export function convertArmorToCombatFormat(armor: Armor): CombatArmorData {
  return {
    dr: armor.drPhysical,
    drEnergy: armor.drEnergy,
    drMental: armor.drMental,
    stoppingPower: armor.stoppingPower || 0,
    armorName: armor.name,
  };
}

/**
 * Get armor data for a unit (character) being spawned into combat.
 * Handles both single armor and multiple armor pieces.
 *
 * @param char - Character with optional equippedArmor field
 * @returns CombatArmorData with combined DR values
 */
export function getArmorForUnit(char: CharacterWithArmor): CombatArmorData {
  // If character has explicit DR values already, use those
  if (char.dr !== undefined && char.dr > 0) {
    return {
      dr: char.dr,
      drEnergy: 0,
      drMental: 0,
      stoppingPower: char.stoppingPower || 0,
      armorName: null,
    };
  }

  // No equipped armor
  if (!char.equippedArmor) {
    return {
      dr: 0,
      drEnergy: 0,
      drMental: 0,
      stoppingPower: 0,
      armorName: null,
    };
  }

  // Single armor piece (string)
  if (typeof char.equippedArmor === 'string') {
    return lookupArmorInDatabase(char.equippedArmor);
  }

  // Multiple armor pieces (array) - combine DR values
  const result: CombatArmorData = {
    dr: 0,
    drEnergy: 0,
    drMental: 0,
    stoppingPower: 0,
    armorName: null,
  };

  const armorNames: string[] = [];

  for (const armorItem of char.equippedArmor) {
    const armorData = lookupArmorInDatabase(armorItem);
    if (armorData.armorName) {
      result.dr += armorData.dr;
      result.drEnergy += armorData.drEnergy;
      result.drMental += armorData.drMental;
      // Stopping power uses highest value (does not stack)
      result.stoppingPower = Math.max(result.stoppingPower, armorData.stoppingPower);
      armorNames.push(armorData.armorName);
    }
  }

  result.armorName = armorNames.length > 0 ? armorNames.join(' + ') : null;
  return result;
}

/**
 * Select appropriate armor for enemy generation based on equipment tier.
 * Wrapper around armor.ts selectArmorForEnemy that returns CombatArmorData.
 *
 * @param tier - Equipment tier (1-6) from country military budget
 * @param role - Enemy role affects armor selection
 * @returns CombatArmorData for the selected armor
 */
export function selectArmorForEnemy(
  tier: number,
  role: 'leader' | 'heavy' | 'standard' | 'specialist' = 'standard'
): CombatArmorData {
  const armorId = selectArmorFromDB(tier, role);

  if (!armorId) {
    return {
      dr: 0,
      drEnergy: 0,
      drMental: 0,
      stoppingPower: 0,
      armorName: null,
    };
  }

  return lookupArmorInDatabase(armorId);
}

/**
 * Armor alias map for fuzzy matching - maps common names to database names
 */
const ARMOR_ALIASES: Record<string, string> = {
  // Light armor
  'leather': 'Leather Jacket',
  'kevlar': 'Kevlar Vest',
  'vest': 'Kevlar Vest',
  'stab_vest': 'Stab Vest',
  'undercover': 'Undercover Vest',
  'motorcycle': 'Motorcycle Armor',
  'sports': 'Sports Padding',

  // Medium armor
  'tactical': 'Tactical Vest',
  'tactical_vest': 'Tactical Vest',
  'riot': 'Riot Gear',
  'riot_gear': 'Riot Gear',
  'combat': 'Combat Armor',
  'combat_armor': 'Combat Armor',
  'swat': 'SWAT Armor',
  'hazmat': 'Hazmat Suit',
  'fire_suit': 'Fire Suit',
  'dive': 'Dive Suit Armored',
  'security': 'Security Armor',

  // Heavy armor
  'military': 'Military Plate',
  'military_plate': 'Military Plate',
  'eod': 'EOD Suit',
  'bomb_suit': 'EOD Suit',
  'heavy_riot': 'Riot Heavy',

  // Power armor
  'power_armor': 'Power Armor Mk1',
  'power_mk1': 'Power Armor Mk1',
  'power_mk2': 'Power Armor Mk2',
  'power_mk3': 'Power Armor Mk3',
  'exo': 'Exoskeleton',
  'exoskeleton': 'Exoskeleton',
};

/**
 * Enhanced armor lookup that checks database with fuzzy matching
 *
 * @param armorKey - Armor name, ID, or alias
 * @returns CombatArmorData or null if not found
 */
export function lookupArmorByKey(armorKey: string): CombatArmorData | null {
  // Try direct lookup first
  let armor = getArmorById(armorKey) || getArmorByName(armorKey);

  // Try alias lookup
  if (!armor) {
    const normalizedKey = armorKey.toLowerCase().replace(/[\s-]/g, '_');
    const aliasName = ARMOR_ALIASES[normalizedKey];
    if (aliasName) {
      armor = getArmorByName(aliasName);
    }
  }

  // Fuzzy matching fallback
  if (!armor) {
    const lowerKey = armorKey.toLowerCase();
    if (lowerKey.includes('kevlar')) armor = getArmorByName('Kevlar Vest');
    else if (lowerKey.includes('tactical') && lowerKey.includes('vest')) armor = getArmorByName('Tactical Vest');
    else if (lowerKey.includes('riot') && lowerKey.includes('heavy')) armor = getArmorByName('Riot Heavy');
    else if (lowerKey.includes('riot')) armor = getArmorByName('Riot Gear');
    else if (lowerKey.includes('swat')) armor = getArmorByName('SWAT Armor');
    else if (lowerKey.includes('combat')) armor = getArmorByName('Combat Armor');
    else if (lowerKey.includes('military')) armor = getArmorByName('Military Plate');
    else if (lowerKey.includes('power') && lowerKey.includes('armor')) armor = getArmorByName('Power Armor Mk1');
    else if (lowerKey.includes('eod') || lowerKey.includes('bomb')) armor = getArmorByName('EOD Suit');
    else if (lowerKey.includes('leather')) armor = getArmorByName('Leather Jacket');
    else if (lowerKey.includes('hazmat')) armor = getArmorByName('Hazmat Suit');
    else if (lowerKey.includes('fire')) armor = getArmorByName('Fire Suit');
  }

  if (armor) {
    return convertArmorToCombatFormat(armor);
  }

  return null;
}

/**
 * Check if an armor key will resolve to valid armor
 */
export function isValidArmorKey(armorKey: string): boolean {
  return lookupArmorByKey(armorKey) !== null;
}
