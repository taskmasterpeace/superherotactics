/**
 * Equipment Data Index
 *
 * Central export for all equipment data including:
 * - Weapons (Melee, Ranged, Energy, Grenades)
 * - Armor (Light, Medium, Heavy, Power, Shields, Natural)
 * - Gadgets (Sensors, Comms, Hacking, Field Gear, Medical)
 * - Vehicles (Ground, Aircraft, Watercraft)
 * - Drones (Aerial, Ground, Aquatic)
 */

// Type definitions
export * from './equipmentTypes';

// Weapons
export {
  MELEE_WEAPONS,
  RANGED_WEAPONS,
  THROWN_WEAPONS,
  SPECIAL_WEAPONS,
  ENERGY_WEAPONS,
  GRENADES,
  ALL_WEAPONS,
  getWeaponById,
  getWeaponByName,
  getWeaponsByCategory,
  calculateDPS,
  getRecommendedWeapons,
} from './weapons';

// Armor
export {
  LIGHT_ARMOR,
  MEDIUM_ARMOR,
  HEAVY_ARMOR,
  POWER_ARMOR,
  SHIELDS,
  NATURAL_ARMOR,
  ARMOR_COMPONENTS,
  ARMOR_MATERIALS,
  ALL_ARMOR,
  getArmorById,
  getArmorByName,
  getArmorByCategory,
  getComponentById,
  getMaterialById,
  calculateEffectiveProtection,
  calculateArmorEfficiency,
  getRecommendedArmor,
  applyMaterial,
  addComponent,
} from './armor';
export type { ArmorMaterial } from './armor';

// Shield Items (Combat-ready shield/armor equipment)
export {
  SHIELD_ITEMS,
  getShieldItemById,
  getShieldItemByName,
  getShieldItems,
  getArmorItems,
  calculateTotalProtection,
} from './shieldItems';
export type { ShieldItem } from './shieldItems';

// Gadgets
export {
  GROUND_VEHICLES,
  AIRCRAFT,
  WATERCRAFT,
  DRONES,
  HACKING_TOOLS,
  SENSORS,
  COMMUNICATIONS,
  FIELD_GEAR,
  MEDICAL_TECH,
  UTILITY_EQUIPMENT,
  SURVEILLANCE,
  WEAPON_MODS,
  ALL_VEHICLES,
  ALL_GADGETS,
  getGadgetById,
  getGadgetByName,
  getGadgetsByCategory,
  getVehicleById,
  getVehicleByName,
  getVehiclesByCategory,
  getDroneById,
  getDroneByName,
  getWeaponModById,
  getCombatGadgets,
  getPassiveGadgets,
  getDeployableGadgets,
  getConsumableGadgets,
  getAffordableGadgets,
  getRecommendedGadgets,
} from './gadgets';
export type { WeaponMod } from './gadgets';

// ==================== UNIFIED EQUIPMENT ACCESS ====================

import { ALL_WEAPONS, calculateDPS } from './weapons';
import { ALL_ARMOR, calculateEffectiveProtection } from './armor';
import { ALL_VEHICLES, ALL_GADGETS, DRONES, WEAPON_MODS } from './gadgets';
import {
  EquipmentType,
  Weapon,
  Armor,
  Gadget,
  Vehicle,
  Drone,
  BalanceMetrics,
  calculateWeaponBalance,
} from './equipmentTypes';

export interface EquipmentEntry {
  id: string;
  name: string;
  type: EquipmentType;
  category: string;
  costValue: number;
  costLevel: string;
  availability: string;
  emoji: string;
  description?: string;
  // Type-specific data
  data: Weapon | Armor | Gadget | Vehicle | Drone;
}

/**
 * Get all equipment as unified entries for the encyclopedia
 */
export function getAllEquipmentEntries(): EquipmentEntry[] {
  const entries: EquipmentEntry[] = [];

  // Add weapons
  ALL_WEAPONS.forEach((w) => {
    entries.push({
      id: w.id,
      name: w.name,
      type: 'weapon',
      category: w.category,
      costValue: w.costValue,
      costLevel: w.costLevel,
      availability: w.availability,
      emoji: w.emoji,
      description: w.description,
      data: w,
    });
  });

  // Add armor
  ALL_ARMOR.forEach((a) => {
    entries.push({
      id: a.id,
      name: a.name,
      type: 'armor',
      category: a.category,
      costValue: a.costValue,
      costLevel: a.costLevel,
      availability: a.availability,
      emoji: a.emoji,
      description: a.description,
      data: a,
    });
  });

  // Add gadgets
  ALL_GADGETS.forEach((g) => {
    entries.push({
      id: g.id,
      name: g.name,
      type: 'gadget',
      category: g.category,
      costValue: g.costValue,
      costLevel: g.costLevel,
      availability: g.availability,
      emoji: g.emoji,
      description: g.description,
      data: g,
    });
  });

  // Add vehicles
  ALL_VEHICLES.forEach((v) => {
    entries.push({
      id: v.id,
      name: v.name,
      type: 'vehicle',
      category: v.category,
      costValue: v.costValue,
      costLevel: v.costLevel,
      availability: v.availability,
      emoji: v.emoji,
      description: v.description,
      data: v,
    });
  });

  // Add drones
  DRONES.forEach((d) => {
    entries.push({
      id: d.id,
      name: d.name,
      type: 'drone',
      category: d.category,
      costValue: d.costValue,
      costLevel: d.costLevel,
      availability: d.availability,
      emoji: d.emoji,
      description: d.description,
      data: d,
    });
  });

  return entries;
}

/**
 * Search equipment by name
 */
export function searchEquipment(query: string): EquipmentEntry[] {
  const lowerQuery = query.toLowerCase();
  return getAllEquipmentEntries().filter(
    (e) =>
      e.name.toLowerCase().includes(lowerQuery) ||
      e.category.toLowerCase().includes(lowerQuery) ||
      (e.description && e.description.toLowerCase().includes(lowerQuery))
  );
}

/**
 * Filter equipment by type
 */
export function filterEquipmentByType(type: EquipmentType): EquipmentEntry[] {
  return getAllEquipmentEntries().filter((e) => e.type === type);
}

/**
 * Filter equipment by availability
 */
export function filterEquipmentByAvailability(
  availability: string
): EquipmentEntry[] {
  return getAllEquipmentEntries().filter((e) => e.availability === availability);
}

/**
 * Filter equipment by budget
 */
export function filterEquipmentByBudget(maxBudget: number): EquipmentEntry[] {
  return getAllEquipmentEntries().filter((e) => e.costValue <= maxBudget);
}

/**
 * Get equipment statistics for balance analysis
 */
export function getEquipmentStats(): {
  totalItems: number;
  byType: Record<string, number>;
  byAvailability: Record<string, number>;
  byCostLevel: Record<string, number>;
  averageCost: number;
  weaponDPSRange: { min: number; max: number; avg: number };
  armorDRRange: { min: number; max: number; avg: number };
} {
  const entries = getAllEquipmentEntries();

  const byType: Record<string, number> = {};
  const byAvailability: Record<string, number> = {};
  const byCostLevel: Record<string, number> = {};
  let totalCost = 0;

  entries.forEach((e) => {
    byType[e.type] = (byType[e.type] || 0) + 1;
    byAvailability[e.availability] = (byAvailability[e.availability] || 0) + 1;
    byCostLevel[e.costLevel] = (byCostLevel[e.costLevel] || 0) + 1;
    totalCost += e.costValue;
  });

  // Calculate weapon DPS range
  const weaponDPS = ALL_WEAPONS.map((w) => calculateDPS(w));
  const minDPS = Math.min(...weaponDPS);
  const maxDPS = Math.max(...weaponDPS);
  const avgDPS = weaponDPS.reduce((a, b) => a + b, 0) / weaponDPS.length;

  // Calculate armor DR range
  const armorDR = ALL_ARMOR.map((a) => calculateEffectiveProtection(a));
  const minDR = Math.min(...armorDR);
  const maxDR = Math.max(...armorDR);
  const avgDR = armorDR.reduce((a, b) => a + b, 0) / armorDR.length;

  return {
    totalItems: entries.length,
    byType,
    byAvailability,
    byCostLevel,
    averageCost: totalCost / entries.length,
    weaponDPSRange: { min: minDPS, max: maxDPS, avg: avgDPS },
    armorDRRange: { min: minDR, max: maxDR, avg: avgDR },
  };
}

/**
 * Get balance analysis for weapons
 */
export function getWeaponBalanceAnalysis(): {
  weapon: Weapon;
  metrics: BalanceMetrics;
}[] {
  return ALL_WEAPONS.map((w) => ({
    weapon: w,
    metrics: calculateWeaponBalance(w),
  }));
}

// ==================== COUNTS ====================

export const EQUIPMENT_COUNTS = {
  weapons: ALL_WEAPONS.length,
  armor: ALL_ARMOR.length,
  gadgets: ALL_GADGETS.length,
  vehicles: ALL_VEHICLES.length,
  drones: DRONES.length,
  weaponMods: WEAPON_MODS.length,
  total:
    ALL_WEAPONS.length +
    ALL_ARMOR.length +
    ALL_GADGETS.length +
    ALL_VEHICLES.length +
    DRONES.length +
    WEAPON_MODS.length,
};
