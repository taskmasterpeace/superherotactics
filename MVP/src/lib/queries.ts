/**
 * Supabase Database Queries
 * Typed query functions for all game data
 */

import { supabase, isSupabaseConfigured } from './supabase';
import type {
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

// ============== WEAPONS ==============

export async function getAllWeapons(): Promise<Weapon[]> {
  if (!isSupabaseConfigured()) return [];

  const { data, error } = await supabase
    .from('weapons')
    .select('*')
    .order('name');

  if (error) {
    console.error('Error fetching weapons:', error);
    return [];
  }

  return data || [];
}

export async function getWeaponById(id: string): Promise<Weapon | null> {
  if (!isSupabaseConfigured()) return null;

  const { data, error } = await supabase
    .from('weapons')
    .select('*')
    .eq('id', id)
    .single();

  if (error) return null;
  return data;
}

export async function getWeaponsByCategory(category: string): Promise<Weapon[]> {
  if (!isSupabaseConfigured()) return [];

  const { data, error } = await supabase
    .from('weapons')
    .select('*')
    .eq('category', category)
    .order('name');

  if (error) return [];
  return data || [];
}

export async function getMeleeWeapons(): Promise<Weapon[]> {
  return getWeaponsByCategory('Melee');
}

export async function getRangedWeapons(): Promise<Weapon[]> {
  return getWeaponsByCategory('Ranged');
}

// ============== GADGETS ==============

export async function getAllGadgets(): Promise<Gadget[]> {
  if (!isSupabaseConfigured()) return [];

  const { data, error } = await supabase
    .from('gadgets')
    .select('*')
    .order('name');

  if (error) return [];
  return data || [];
}

export async function getGadgetsByCategory(category: string): Promise<Gadget[]> {
  if (!isSupabaseConfigured()) return [];

  const { data, error } = await supabase
    .from('gadgets')
    .select('*')
    .eq('category', category)
    .order('name');

  if (error) return [];
  return data || [];
}

export async function getVehicles(): Promise<Gadget[]> {
  return getGadgetsByCategory('Vehicle');
}

// ============== CITIES ==============

export async function getAllCities(): Promise<City[]> {
  if (!isSupabaseConfigured()) return [];

  const { data, error } = await supabase
    .from('cities')
    .select('*')
    .order('name');

  if (error) return [];
  return data || [];
}

export async function getCitiesByCountry(country: string): Promise<City[]> {
  if (!isSupabaseConfigured()) return [];

  const { data, error } = await supabase
    .from('cities')
    .select('*')
    .eq('country', country)
    .order('population', { ascending: false });

  if (error) return [];
  return data || [];
}

export async function getCityByName(name: string): Promise<City | null> {
  if (!isSupabaseConfigured()) return null;

  const { data, error } = await supabase
    .from('cities')
    .select('*')
    .ilike('name', name)
    .single();

  if (error) return null;
  return data;
}

// ============== COUNTRIES ==============

export async function getAllCountries(): Promise<Country[]> {
  if (!isSupabaseConfigured()) return [];

  const { data, error } = await supabase
    .from('countries')
    .select('*')
    .order('name');

  if (error) return [];
  return data || [];
}

export async function getCountryByName(name: string): Promise<Country | null> {
  if (!isSupabaseConfigured()) return null;

  const { data, error } = await supabase
    .from('countries')
    .select('*')
    .ilike('name', name)
    .single();

  if (error) return null;
  return data;
}

export async function getCountriesByRegion(region: string): Promise<Country[]> {
  if (!isSupabaseConfigured()) return [];

  const { data, error } = await supabase
    .from('countries')
    .select('*')
    .eq('region', region)
    .order('name');

  if (error) return [];
  return data || [];
}

// ============== POWERS ==============

export async function getAllPowers(): Promise<Power[]> {
  if (!isSupabaseConfigured()) return [];

  const { data, error } = await supabase
    .from('powers')
    .select('*')
    .order('name');

  if (error) return [];
  return data || [];
}

export async function getPowersByThreatLevel(level: string): Promise<Power[]> {
  if (!isSupabaseConfigured()) return [];

  const { data, error } = await supabase
    .from('powers')
    .select('*')
    .eq('threat_level', level)
    .order('name');

  if (error) return [];
  return data || [];
}

export async function getPowersByRole(role: string): Promise<Power[]> {
  if (!isSupabaseConfigured()) return [];

  const { data, error } = await supabase
    .from('powers')
    .select('*')
    .eq('role', role)
    .order('name');

  if (error) return [];
  return data || [];
}

// ============== SKILLS ==============

export async function getAllSkills(): Promise<Skill[]> {
  if (!isSupabaseConfigured()) return [];

  const { data, error } = await supabase
    .from('skills')
    .select('*')
    .order('name');

  if (error) return [];
  return data || [];
}

export async function getSkillsByType(skillType: string): Promise<Skill[]> {
  if (!isSupabaseConfigured()) return [];

  const { data, error } = await supabase
    .from('skills')
    .select('*')
    .eq('skill_type', skillType)
    .order('name');

  if (error) return [];
  return data || [];
}

export async function getCombatSkills(): Promise<Skill[]> {
  return getSkillsByType('Combat');
}

export async function getMartialArtsSkills(): Promise<Skill[]> {
  return getSkillsByType('Martial Arts');
}

export async function getTalentSkills(): Promise<Skill[]> {
  return getSkillsByType('Talent');
}

// ============== STATUS EFFECTS ==============

export async function getAllStatusEffects(): Promise<StatusEffect[]> {
  if (!isSupabaseConfigured()) return [];

  const { data, error } = await supabase
    .from('status_effects')
    .select('*')
    .order('name');

  if (error) return [];
  return data || [];
}

export async function getStatusEffectByName(name: string): Promise<StatusEffect | null> {
  if (!isSupabaseConfigured()) return null;

  const { data, error } = await supabase
    .from('status_effects')
    .select('*')
    .ilike('name', `%${name}%`)
    .single();

  if (error) return null;
  return data;
}

// ============== ARMOR ==============

export async function getAllArmor(): Promise<Armor[]> {
  if (!isSupabaseConfigured()) return [];

  const { data, error } = await supabase
    .from('armor')
    .select('*')
    .order('name');

  if (error) return [];
  return data || [];
}

export async function getArmorByCategory(category: string): Promise<Armor[]> {
  if (!isSupabaseConfigured()) return [];

  const { data, error } = await supabase
    .from('armor')
    .select('*')
    .eq('category', category)
    .order('name');

  if (error) return [];
  return data || [];
}

// ============== AMMUNITION ==============

export async function getAllAmmunition(): Promise<Ammunition[]> {
  if (!isSupabaseConfigured()) return [];

  const { data, error } = await supabase
    .from('ammunition')
    .select('*')
    .order('name');

  if (error) return [];
  return data || [];
}

export async function getAmmoByCaliber(caliber: string): Promise<Ammunition[]> {
  if (!isSupabaseConfigured()) return [];

  const { data, error } = await supabase
    .from('ammunition')
    .select('*')
    .eq('caliber', caliber)
    .order('name');

  if (error) return [];
  return data || [];
}

// ============== MARTIAL ARTS ==============

export async function getAllMartialArtsStyles(): Promise<MartialArtsStyle[]> {
  if (!isSupabaseConfigured()) return [];

  const { data, error } = await supabase
    .from('martial_arts_styles')
    .select('*')
    .order('name');

  if (error) return [];
  return data || [];
}

export async function getTechniquesByStyle(styleId: string): Promise<MartialArtsTechnique[]> {
  if (!isSupabaseConfigured()) return [];

  const { data, error } = await supabase
    .from('martial_arts_techniques')
    .select('*')
    .eq('style_id', styleId)
    .order('belt_required');

  if (error) return [];
  return data || [];
}

export async function getTechniquesByBeltLevel(beltLevel: number): Promise<MartialArtsTechnique[]> {
  if (!isSupabaseConfigured()) return [];

  const { data, error } = await supabase
    .from('martial_arts_techniques')
    .select('*')
    .lte('belt_required', beltLevel)
    .order('style_id');

  if (error) return [];
  return data || [];
}

// ============== COMBAT HELPERS ==============

/**
 * Get all combat-relevant data in one call
 */
export async function getCombatData() {
  const [weapons, armor, ammunition, statusEffects, skills] = await Promise.all([
    getAllWeapons(),
    getAllArmor(),
    getAllAmmunition(),
    getAllStatusEffects(),
    getCombatSkills(),
  ]);

  return { weapons, armor, ammunition, statusEffects, skills };
}

/**
 * Get world map data in one call
 */
export async function getWorldData() {
  const [cities, countries] = await Promise.all([getAllCities(), getAllCountries()]);

  return { cities, countries };
}
