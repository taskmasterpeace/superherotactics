/**
 * SuperHero Tactics - Data Layer
 *
 * Central export for all database-related functionality.
 * Uses Supabase as the backend database.
 */

// Supabase client
export { supabase, isSupabaseConfigured, testConnection } from './supabase';

// Type definitions
export type {
  Weapon,
  Gadget,
  City,
  Country,
  Power,
  Skill,
  StatusEffect,
  Armor,
  Ammunition,
  MartialArtsStyle,
  MartialArtsTechnique,
} from './database.types';

// Query functions
export {
  // Weapons
  getAllWeapons,
  getWeaponById,
  getWeaponsByCategory,
  getMeleeWeapons,
  getRangedWeapons,

  // Gadgets
  getAllGadgets,
  getGadgetsByCategory,
  getVehicles,

  // Cities
  getAllCities,
  getCitiesByCountry,
  getCityByName,

  // Countries
  getAllCountries,
  getCountryByName,
  getCountriesByRegion,

  // Powers
  getAllPowers,
  getPowersByThreatLevel,
  getPowersByRole,

  // Skills
  getAllSkills,
  getSkillsByType,
  getCombatSkills,
  getMartialArtsSkills,
  getTalentSkills,

  // Status Effects
  getAllStatusEffects,
  getStatusEffectByName,

  // Armor
  getAllArmor,
  getArmorByCategory,

  // Ammunition
  getAllAmmunition,
  getAmmoByCaliber,

  // Martial Arts
  getAllMartialArtsStyles,
  getTechniquesByStyle,
  getTechniquesByBeltLevel,

  // Combo helpers
  getCombatData,
  getWorldData,
} from './queries';
