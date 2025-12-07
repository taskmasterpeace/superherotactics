#!/usr/bin/env node
/**
 * CSV to JSON Generator for SuperHero Tactics
 *
 * Reads all CSV files from the repository and outputs typed JSON files
 * Run: npm run generate-data
 *
 * Output goes to src/data/generated/ and gets imported directly into the game
 */

const fs = require('fs');
const path = require('path');
const Papa = require('papaparse');

// Paths
const ROOT = path.resolve(__dirname, '../../..'); // C:\git\sht
const MVP = path.resolve(__dirname, '..'); // C:\git\sht\MVP
const OUTPUT_DIR = path.join(MVP, 'src/data/generated');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

/**
 * Parse a CSV file and return rows
 */
function parseCSV(filePath) {
  if (!fs.existsSync(filePath)) {
    console.warn(`  ⚠️  File not found: ${filePath}`);
    return [];
  }

  const csvText = fs.readFileSync(filePath, 'utf-8');
  const result = Papa.parse(csvText, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => header.trim().toLowerCase().replace(/\s+/g, '_'),
  });

  if (result.errors.length > 0) {
    console.warn(`  ⚠️  Parse warnings for ${path.basename(filePath)}:`, result.errors.length);
  }

  return result.data;
}

/**
 * Convert weapons CSV to typed JSON
 */
function generateWeapons() {
  console.log('📦 Generating weapons...');

  const csvPath = path.join(ROOT, 'Game_Mechanics_Spec/Weapons_Complete.csv');
  const rows = parseCSV(csvPath);

  const weapons = {};
  let count = 0;

  for (const row of rows) {
    // Skip header/description rows
    if (!row.weapon_id || (!row.weapon_id.startsWith('MEL_') && !row.weapon_id.startsWith('RNG_'))) {
      continue;
    }

    const id = row.weapon_id.toLowerCase();
    weapons[id] = {
      id: row.weapon_id,
      name: row.weapon_name || row.name || '',
      category: row.category || '',
      damage: parseInt(row.base_damage) || 0,
      damageType: row.damage_type || 'PHYSICAL',
      subType: row.sub_type || '',
      attackSpeed: parseFloat(row.attack_speed_sec) || 1.0,
      range: parseInt(row.range_squares) || 1,
      accuracy: parseAccuracyCS(row.accuracy_cs),
      reloadTime: parseFloat(row.reload_sec) || 0,
      skillRequired: row.skill_required || null,
      strRequired: parseInt(row.str_required) || 0,
      specialEffects: row.special_effects || null,
      penetration: parseFloat((row.penetration_mult || '1.0').replace('x', '')) || 1.0,
      defaultAmmo: row.default_ammo || null,
      magazineSize: parseInt(row.magazine_size) || 0,
      costLevel: row.cost_level || 'Medium',
      availability: row.availability || 'Common',
      notes: row.notes || null,
    };
    count++;
  }

  writeJSON('weapons.json', weapons);
  console.log(`  ✅ ${count} weapons`);
  return count;
}

/**
 * Convert gadgets/vehicles CSV to typed JSON
 */
function generateGadgets() {
  console.log('📦 Generating gadgets & vehicles...');

  const csvPath = path.join(ROOT, 'Game_Mechanics_Spec/Tech_Gadgets_Complete.csv');
  const rows = parseCSV(csvPath);

  const gadgets = {};
  let count = 0;

  for (const row of rows) {
    // Skip header/description rows
    if (!row.vehicle_id && !row.item_id) continue;

    const id = (row.vehicle_id || row.item_id || '').toLowerCase();
    if (!id || id.includes('===')) continue;

    gadgets[id] = {
      id: row.vehicle_id || row.item_id,
      name: row.vehicle_name || row.name || '',
      category: row.category || '',
      speedMph: parseInt(row.speed_mph) || 0,
      speedSquares: parseInt(row.speed_squares_turn) || 0,
      passengers: parseInt(row.passengers) || 0,
      cargoLbs: parseInt(row.cargo_lbs) || 0,
      armorHp: parseInt(row.armor_hp) || 0,
      armorDr: parseInt(row.armor_dr) || 0,
      fuelType: row.fuel_type || null,
      rangeMiles: parseInt(row.range_miles) || 0,
      costLevel: row.cost_level || 'Medium',
      availability: row.availability || 'Common',
      specialProperties: row.special_properties || null,
      notes: row.notes || null,
    };
    count++;
  }

  writeJSON('gadgets.json', gadgets);
  console.log(`  ✅ ${count} gadgets/vehicles`);
  return count;
}

/**
 * Convert cities CSV to typed JSON
 */
function generateCities() {
  console.log('📦 Generating cities...');

  // Try multiple possible paths
  const possiblePaths = [
    path.join(ROOT, 'SuperHero Tactics/SuperHero Tactics World Bible - Cities.csv'),
    path.join(ROOT, 'SuperHero Tactics World Bible - Cities.csv'),
    path.join(MVP, 'public/data/Cities.csv'),
  ];

  let rows = [];
  for (const csvPath of possiblePaths) {
    rows = parseCSV(csvPath);
    if (rows.length > 0) break;
  }

  const cities = {};
  let count = 0;

  for (const row of rows) {
    const name = row.city || row.name;
    if (!name) continue;

    const id = `city_${name.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
    cities[id] = {
      id,
      name,
      country: row.country || '',
      population: parseInt((row.population || '0').replace(/,/g, '')) || 0,
      cityType: row.city_type || row.type || '',
      crimeIndex: parseInt(row.crime_index) || 0,
      safetyIndex: parseInt(row.safety_index) || 0,
      hvtCount: parseInt(row.hvt_count) || 0,
      latitude: parseFloat(row.latitude) || 0,
      longitude: parseFloat(row.longitude) || 0,
    };
    count++;
  }

  writeJSON('cities.json', cities);
  console.log(`  ✅ ${count} cities`);
  return count;
}

/**
 * Convert countries CSV to typed JSON
 */
function generateCountries() {
  console.log('📦 Generating countries...');

  const possiblePaths = [
    path.join(ROOT, 'SuperHero Tactics World Bible - Country.csv'),
    path.join(ROOT, 'SuperHero Tactics/SuperHero Tactics World Bible - Country.csv'),
    path.join(MVP, 'public/data/Countries.csv'),
  ];

  let rows = [];
  for (const csvPath of possiblePaths) {
    rows = parseCSV(csvPath);
    if (rows.length > 0) break;
  }

  const countries = {};
  let count = 0;

  for (const row of rows) {
    const name = row.country || row.name;
    if (!name) continue;

    const id = `country_${name.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
    countries[id] = {
      id,
      name,
      region: row.region || row.continent || '',
      governmentType: row.government_type || row.government || '',
      population: parseInt((row.population || '0').replace(/,/g, '')) || 0,
      educationLevel: row.education_level || '',
      faction: row.faction || null,
    };
    count++;
  }

  writeJSON('countries.json', countries);
  console.log(`  ✅ ${count} countries`);
  return count;
}

/**
 * Convert powers CSV to typed JSON
 */
function generatePowers() {
  console.log('📦 Generating powers...');

  const possiblePaths = [
    path.join(ROOT, 'LSW_Powers_Complete_Database.csv'),
    path.join(MVP, 'public/data/Powers.csv'),
  ];

  let rows = [];
  for (const csvPath of possiblePaths) {
    rows = parseCSV(csvPath);
    if (rows.length > 0) break;
  }

  const powers = {};
  let count = 0;

  for (const row of rows) {
    const name = row.power_name || row.name;
    if (!name) continue;

    const id = row.power_id || `pwr_${name.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
    powers[id] = {
      id,
      name,
      description: row.description || '',
      threatLevel: row.threat_level || 'THREAT_1',
      originType: row.origin_type || row.origin || '',
      damage: parseInt(row.damage) || 0,
      range: parseInt(row.range_squares || row.range) || 1,
      apCost: parseInt(row.ap_cost) || 1,
      cooldown: parseInt(row.cooldown) || 0,
      role: row.role || 'offense',
      type: row.type || row.power_type || '',
      manifest: row.manifest || row.manifestation || '',
    };
    count++;
  }

  writeJSON('powers.json', powers);
  console.log(`  ✅ ${count} powers`);
  return count;
}

/**
 * Convert armor CSV to typed JSON
 */
function generateArmor() {
  console.log('📦 Generating armor...');

  const possiblePaths = [
    path.join(ROOT, 'Armor_Equipment.csv'),
    path.join(MVP, 'public/data/Armor.csv'),
  ];

  let rows = [];
  for (const csvPath of possiblePaths) {
    rows = parseCSV(csvPath);
    if (rows.length > 0) break;
  }

  const armor = {};
  let count = 0;

  for (const row of rows) {
    const name = row.armor_name || row.name;
    if (!name) continue;

    const id = row.armor_id || `arm_${name.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
    armor[id] = {
      id,
      name,
      category: row.category || row.type || '',
      damageReduction: parseInt(row.damage_reduction || row.dr) || 0,
      hp: parseInt(row.hp || row.durability) || 100,
      weight: row.weight || '',
      coverage: row.coverage || '',
      specialProperties: row.special_properties || row.special || null,
      costLevel: row.cost_level || 'Medium',
      availability: row.availability || 'Common',
    };
    count++;
  }

  writeJSON('armor.json', armor);
  console.log(`  ✅ ${count} armor items`);
  return count;
}

/**
 * Convert skills CSV to typed JSON
 */
function generateSkills() {
  console.log('📦 Generating skills...');

  const possiblePaths = [
    path.join(ROOT, 'Complete_Skills_Talents.csv'),
    path.join(ROOT, 'Combat Compendium REAL - 🐱_👤Skills, Talents, Martial Art.csv'),
    path.join(MVP, 'public/data/Skills.csv'),
  ];

  let rows = [];
  for (const csvPath of possiblePaths) {
    rows = parseCSV(csvPath);
    if (rows.length > 0) break;
  }

  const skills = {};
  let count = 0;

  for (const row of rows) {
    const name = row.skill || row.name || row.talent;
    if (!name) continue;

    const id = row.skill_id || `skl_${name.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
    skills[id] = {
      id,
      name,
      category: row.category || '',
      description: row.description || row.effect || '',
      statBonus: row.stat_bonus || null,
      investigationBonus: row.investigation_bonus || null,
      combatBonus: row.combat_bonus || null,
    };
    count++;
  }

  writeJSON('skills.json', skills);
  console.log(`  ✅ ${count} skills`);
  return count;
}

/**
 * Convert status effects CSV to typed JSON
 */
function generateStatusEffects() {
  console.log('📦 Generating status effects...');

  const possiblePaths = [
    path.join(ROOT, 'Combat Compendium REAL - 😢EFFECT_STATUS😴.csv'),
    path.join(MVP, 'public/data/StatusEffects.csv'),
  ];

  let rows = [];
  for (const csvPath of possiblePaths) {
    rows = parseCSV(csvPath);
    if (rows.length > 0) break;
  }

  const effects = {};
  let count = 0;

  for (const row of rows) {
    const name = row.status || row.name || row.effect;
    if (!name) continue;

    const id = row.effect_id || `eff_${name.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
    effects[id] = {
      id,
      name,
      description: row.description || row.effect || '',
      durationTurns: parseInt(row.duration_turns || row.duration) || 0,
      damagePerTurn: parseInt(row.damage_per_turn || row.dot) || 0,
      statModifier: row.stat_modifier || row.modifier || null,
      canStack: row.can_stack === 'true' || row.can_stack === '1',
      cureMethod: row.cure_method || row.cure || null,
    };
    count++;
  }

  writeJSON('statusEffects.json', effects);
  console.log(`  ✅ ${count} status effects`);
  return count;
}

/**
 * Convert ammunition CSV to typed JSON
 */
function generateAmmunition() {
  console.log('📦 Generating ammunition...');

  const possiblePaths = [
    path.join(ROOT, 'Ammunition_System.csv'),
    path.join(MVP, 'public/data/Ammunition.csv'),
  ];

  let rows = [];
  for (const csvPath of possiblePaths) {
    rows = parseCSV(csvPath);
    if (rows.length > 0) break;
  }

  const ammo = {};
  let count = 0;

  for (const row of rows) {
    const name = row.ammo_type || row.name;
    if (!name) continue;

    const id = row.ammo_id || `ammo_${name.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
    ammo[id] = {
      id,
      name,
      caliber: row.caliber || '',
      damageModifier: parseFloat((row.damage_modifier || '1.0').replace('x', '')) || 1.0,
      penetrationModifier: parseFloat((row.penetration_modifier || '1.0').replace('x', '')) || 1.0,
      specialEffects: row.special_effects || row.effects || null,
      costLevel: row.cost_level || 'Medium',
      availability: row.availability || 'Common',
    };
    count++;
  }

  writeJSON('ammunition.json', ammo);
  console.log(`  ✅ ${count} ammo types`);
  return count;
}

/**
 * Generate index file that exports all data
 */
function generateIndex() {
  const indexContent = `/**
 * Auto-generated game data
 * Run 'npm run generate-data' to regenerate
 */

import weapons from './weapons.json';
import gadgets from './gadgets.json';
import cities from './cities.json';
import countries from './countries.json';
import powers from './powers.json';
import armor from './armor.json';
import skills from './skills.json';
import statusEffects from './statusEffects.json';
import ammunition from './ammunition.json';

export {
  weapons,
  gadgets,
  cities,
  countries,
  powers,
  armor,
  skills,
  statusEffects,
  ammunition,
};

// Type exports
export type Weapon = typeof weapons[keyof typeof weapons];
export type Gadget = typeof gadgets[keyof typeof gadgets];
export type City = typeof cities[keyof typeof cities];
export type Country = typeof countries[keyof typeof countries];
export type Power = typeof powers[keyof typeof powers];
export type Armor = typeof armor[keyof typeof armor];
export type Skill = typeof skills[keyof typeof skills];
export type StatusEffect = typeof statusEffects[keyof typeof statusEffects];
export type Ammunition = typeof ammunition[keyof typeof ammunition];

// Helper functions
export function getWeapon(id: string) {
  return weapons[id.toLowerCase() as keyof typeof weapons];
}

export function getGadget(id: string) {
  return gadgets[id.toLowerCase() as keyof typeof gadgets];
}

export function getCity(id: string) {
  return cities[id.toLowerCase() as keyof typeof cities];
}

export function getCountry(id: string) {
  return countries[id.toLowerCase() as keyof typeof countries];
}

export function getPower(id: string) {
  return powers[id.toLowerCase() as keyof typeof powers];
}

export function getArmor(id: string) {
  return armor[id.toLowerCase() as keyof typeof armor];
}

export function getSkill(id: string) {
  return skills[id.toLowerCase() as keyof typeof skills];
}

export function getStatusEffect(id: string) {
  return statusEffects[id.toLowerCase() as keyof typeof statusEffects];
}

export function getAmmo(id: string) {
  return ammunition[id.toLowerCase() as keyof typeof ammunition];
}

// Array helpers
export const weaponsList = Object.values(weapons);
export const gadgetsList = Object.values(gadgets);
export const citiesList = Object.values(cities);
export const countriesList = Object.values(countries);
export const powersList = Object.values(powers);
export const armorList = Object.values(armor);
export const skillsList = Object.values(skills);
export const statusEffectsList = Object.values(statusEffects);
export const ammunitionList = Object.values(ammunition);
`;

  fs.writeFileSync(path.join(OUTPUT_DIR, 'index.ts'), indexContent);
  console.log('📄 Generated index.ts');
}

// Helper functions
function parseAccuracyCS(cs) {
  if (!cs) return 70;
  const match = cs.match(/([+-]?\d+)CS/);
  if (match) {
    const bonus = parseInt(match[1]);
    return 70 + bonus * 10;
  }
  return 70;
}

function writeJSON(filename, data) {
  const filepath = path.join(OUTPUT_DIR, filename);
  fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
}

// Main
console.log('🚀 SuperHero Tactics Data Generator\n');
console.log(`📂 Source: ${ROOT}`);
console.log(`📂 Output: ${OUTPUT_DIR}\n`);

let total = 0;
total += generateWeapons();
total += generateGadgets();
total += generateCities();
total += generateCountries();
total += generatePowers();
total += generateArmor();
total += generateSkills();
total += generateStatusEffects();
total += generateAmmunition();
generateIndex();

console.log(`\n✨ Done! Generated ${total} total items`);
console.log('📦 Import with: import { weapons, cities, powers } from "./data/generated"');
