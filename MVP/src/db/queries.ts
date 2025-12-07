/**
 * Query Functions for SuperHero Tactics Database
 * Typed queries for all game data
 */

import { query } from './database';
import {
  Weapon,
  Gadget,
  City,
  Country,
  Power,
  StatusEffect,
  Skill,
  Armor,
  Ammunition,
  Faction,
  CharacterTemplate,
  MartialArtsStyle,
  MartialArtsTechnique,
  CombatWeapon,
  toCombatWeapon,
  WeaponCategory,
  GadgetCategory,
  PowerRole,
  PowerType,
} from './types';

// ============================================================================
// WEAPONS
// ============================================================================

export function getAllWeapons(): Weapon[] {
  return query<Weapon>('SELECT * FROM weapons ORDER BY category, name');
}

export function getWeaponById(id: string): Weapon | undefined {
  const results = query<Weapon>('SELECT * FROM weapons WHERE weapon_id = ?', [id]);
  return results[0];
}

export function getWeaponsByCategory(category: WeaponCategory): Weapon[] {
  return query<Weapon>('SELECT * FROM weapons WHERE category = ? ORDER BY name', [category]);
}

export function getMeleeWeapons(): Weapon[] {
  return query<Weapon>(
    "SELECT * FROM weapons WHERE category LIKE 'Melee%' ORDER BY base_damage DESC"
  );
}

export function getRangedWeapons(): Weapon[] {
  return query<Weapon>(
    "SELECT * FROM weapons WHERE category LIKE 'Ranged%' OR category = 'Energy_Weapons' ORDER BY range_squares DESC"
  );
}

export function getWeaponsForCombat(): CombatWeapon[] {
  return getAllWeapons().map(toCombatWeapon);
}

export function getCombatWeaponById(id: string): CombatWeapon | undefined {
  const weapon = getWeaponById(id);
  return weapon ? toCombatWeapon(weapon) : undefined;
}

// ============================================================================
// GADGETS
// ============================================================================

export function getAllGadgets(): Gadget[] {
  return query<Gadget>('SELECT * FROM gadgets ORDER BY category, name');
}

export function getGadgetById(id: string): Gadget | undefined {
  const results = query<Gadget>('SELECT * FROM gadgets WHERE item_id = ?', [id]);
  return results[0];
}

export function getGadgetsByCategory(category: GadgetCategory): Gadget[] {
  return query<Gadget>('SELECT * FROM gadgets WHERE category = ? ORDER BY name', [category]);
}

export function getVehicles(): Gadget[] {
  return query<Gadget>(
    "SELECT * FROM gadgets WHERE category IN ('Ground', 'Aircraft', 'Watercraft') ORDER BY speed_mph DESC"
  );
}

export function getDrones(): Gadget[] {
  return query<Gadget>("SELECT * FROM gadgets WHERE category = 'Drones' ORDER BY name");
}

// ============================================================================
// CITIES
// ============================================================================

export function getAllCities(): City[] {
  return query<City>('SELECT * FROM cities ORDER BY country, name');
}

export function getCityById(id: string): City | undefined {
  const results = query<City>('SELECT * FROM cities WHERE city_id = ?', [id]);
  return results[0];
}

export function getCitiesByCountry(country: string): City[] {
  return query<City>('SELECT * FROM cities WHERE country = ? ORDER BY population DESC', [country]);
}

export function getCitiesByCrimeIndex(minCrime: number, maxCrime: number): City[] {
  return query<City>(
    'SELECT * FROM cities WHERE crime_index >= ? AND crime_index <= ? ORDER BY crime_index DESC',
    [minCrime, maxCrime]
  );
}

export function getHighValueTargetCities(): City[] {
  return query<City>('SELECT * FROM cities WHERE hvt_count > 0 ORDER BY hvt_count DESC');
}

// ============================================================================
// COUNTRIES
// ============================================================================

export function getAllCountries(): Country[] {
  return query<Country>('SELECT * FROM countries ORDER BY name');
}

export function getCountryById(id: string): Country | undefined {
  const results = query<Country>('SELECT * FROM countries WHERE country_id = ?', [id]);
  return results[0];
}

export function getCountryByName(name: string): Country | undefined {
  const results = query<Country>('SELECT * FROM countries WHERE name = ?', [name]);
  return results[0];
}

export function getCountriesByRegion(region: string): Country[] {
  return query<Country>('SELECT * FROM countries WHERE region = ? ORDER BY name', [region]);
}

export function getCountriesByFaction(faction: string): Country[] {
  return query<Country>('SELECT * FROM countries WHERE faction = ? ORDER BY name', [faction]);
}

// ============================================================================
// POWERS
// ============================================================================

export function getAllPowers(): Power[] {
  return query<Power>('SELECT * FROM powers ORDER BY name');
}

export function getPowerById(id: string): Power | undefined {
  const results = query<Power>('SELECT * FROM powers WHERE power_id = ?', [id]);
  return results[0];
}

export function getPowersByRole(role: PowerRole): Power[] {
  return query<Power>('SELECT * FROM powers WHERE role = ? ORDER BY name', [role]);
}

export function getPowersByType(type: PowerType): Power[] {
  return query<Power>('SELECT * FROM powers WHERE type = ? ORDER BY name', [type]);
}

export function getPowersByThreatLevel(level: string): Power[] {
  return query<Power>('SELECT * FROM powers WHERE threat_level = ? ORDER BY name', [level]);
}

export function getOffensivePowers(): Power[] {
  return query<Power>("SELECT * FROM powers WHERE role = 'offense' ORDER BY damage DESC");
}

// ============================================================================
// STATUS EFFECTS
// ============================================================================

export function getAllStatusEffects(): StatusEffect[] {
  return query<StatusEffect>('SELECT * FROM status_effects ORDER BY name');
}

export function getStatusEffectById(id: string): StatusEffect | undefined {
  const results = query<StatusEffect>('SELECT * FROM status_effects WHERE effect_id = ?', [id]);
  return results[0];
}

export function getStatusEffectByName(name: string): StatusEffect | undefined {
  const results = query<StatusEffect>('SELECT * FROM status_effects WHERE name = ?', [name]);
  return results[0];
}

export function getDamageOverTimeEffects(): StatusEffect[] {
  return query<StatusEffect>('SELECT * FROM status_effects WHERE damage_per_turn > 0 ORDER BY damage_per_turn DESC');
}

// ============================================================================
// SKILLS
// ============================================================================

export function getAllSkills(): Skill[] {
  return query<Skill>('SELECT * FROM skills ORDER BY category, name');
}

export function getSkillById(id: string): Skill | undefined {
  const results = query<Skill>('SELECT * FROM skills WHERE skill_id = ?', [id]);
  return results[0];
}

export function getSkillsByCategory(category: string): Skill[] {
  return query<Skill>('SELECT * FROM skills WHERE category = ? ORDER BY name', [category]);
}

export function getCombatSkills(): Skill[] {
  return query<Skill>("SELECT * FROM skills WHERE category = 'Combat' OR combat_bonus IS NOT NULL ORDER BY name");
}

// ============================================================================
// ARMOR
// ============================================================================

export function getAllArmor(): Armor[] {
  return query<Armor>('SELECT * FROM armor ORDER BY damage_reduction DESC');
}

export function getArmorById(id: string): Armor | undefined {
  const results = query<Armor>('SELECT * FROM armor WHERE armor_id = ?', [id]);
  return results[0];
}

export function getArmorByCategory(category: string): Armor[] {
  return query<Armor>('SELECT * FROM armor WHERE category = ? ORDER BY damage_reduction DESC', [category]);
}

// ============================================================================
// AMMUNITION
// ============================================================================

export function getAllAmmunition(): Ammunition[] {
  return query<Ammunition>('SELECT * FROM ammunition ORDER BY name');
}

export function getAmmunitionById(id: string): Ammunition | undefined {
  const results = query<Ammunition>('SELECT * FROM ammunition WHERE ammo_id = ?', [id]);
  return results[0];
}

export function getAmmunitionByCaliber(caliber: string): Ammunition[] {
  return query<Ammunition>('SELECT * FROM ammunition WHERE caliber = ? ORDER BY name', [caliber]);
}

// ============================================================================
// FACTIONS
// ============================================================================

export function getAllFactions(): Faction[] {
  return query<Faction>('SELECT * FROM factions ORDER BY name');
}

export function getFactionById(id: string): Faction | undefined {
  const results = query<Faction>('SELECT * FROM factions WHERE faction_id = ?', [id]);
  return results[0];
}

// ============================================================================
// CHARACTER TEMPLATES
// ============================================================================

export function getAllCharacterTemplates(): CharacterTemplate[] {
  return query<CharacterTemplate>('SELECT * FROM character_templates ORDER BY name');
}

export function getCharacterTemplateById(id: string): CharacterTemplate | undefined {
  const results = query<CharacterTemplate>('SELECT * FROM character_templates WHERE template_id = ?', [id]);
  return results[0];
}

export function getCharacterTemplatesByArchetype(archetype: string): CharacterTemplate[] {
  return query<CharacterTemplate>('SELECT * FROM character_templates WHERE archetype = ? ORDER BY name', [archetype]);
}

// ============================================================================
// MARTIAL ARTS
// ============================================================================

export function getAllMartialArtsStyles(): MartialArtsStyle[] {
  return query<MartialArtsStyle>('SELECT * FROM martial_arts_styles ORDER BY name');
}

export function getMartialArtsStyleById(id: string): MartialArtsStyle | undefined {
  const results = query<MartialArtsStyle>('SELECT * FROM martial_arts_styles WHERE style_id = ?', [id]);
  return results[0];
}

export function getTechniquesForStyle(styleId: string): MartialArtsTechnique[] {
  return query<MartialArtsTechnique>(
    'SELECT * FROM martial_arts_techniques WHERE style_id = ? ORDER BY belt_required, name',
    [styleId]
  );
}

export function getTechniquesByBeltRank(maxBelt: number): MartialArtsTechnique[] {
  return query<MartialArtsTechnique>(
    'SELECT * FROM martial_arts_techniques WHERE belt_required <= ? ORDER BY style_id, belt_required',
    [maxBelt]
  );
}

// ============================================================================
// SEARCH
// ============================================================================

export function searchWeapons(searchTerm: string): Weapon[] {
  const pattern = `%${searchTerm}%`;
  return query<Weapon>(
    'SELECT * FROM weapons WHERE name LIKE ? OR notes LIKE ? ORDER BY name',
    [pattern, pattern]
  );
}

export function searchPowers(searchTerm: string): Power[] {
  const pattern = `%${searchTerm}%`;
  return query<Power>(
    'SELECT * FROM powers WHERE name LIKE ? OR description LIKE ? ORDER BY name',
    [pattern, pattern]
  );
}

export function searchCities(searchTerm: string): City[] {
  const pattern = `%${searchTerm}%`;
  return query<City>(
    'SELECT * FROM cities WHERE name LIKE ? OR country LIKE ? ORDER BY name',
    [pattern, pattern]
  );
}

// ============================================================================
// STATS
// ============================================================================

export function getDatabaseStats(): Record<string, number> {
  const tables = [
    'weapons', 'gadgets', 'cities', 'countries', 'powers',
    'status_effects', 'skills', 'armor', 'ammunition', 'factions',
    'character_templates', 'martial_arts_styles', 'martial_arts_techniques'
  ];

  const stats: Record<string, number> = {};

  for (const table of tables) {
    try {
      const result = query<{ count: number }>(`SELECT COUNT(*) as count FROM ${table}`);
      stats[table] = result[0]?.count || 0;
    } catch {
      stats[table] = 0;
    }
  }

  return stats;
}
