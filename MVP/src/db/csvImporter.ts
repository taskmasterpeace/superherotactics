/**
 * CSV Importer for SuperHero Tactics
 * Imports all CSV data files into the SQLite database
 */

import Papa from 'papaparse';
import { getDatabase, insertMany, clearDatabase, saveDatabase } from './database';

// CSV file locations relative to repository root
// Note: In production, these would be in public/data/
const CSV_FILES = {
  // Combat System
  weapons: '../../Game_Mechanics_Spec/Weapons_Complete.csv',
  weaponsCompendium: '../../Combat Compendium REAL - Weapons.csv',

  // Equipment
  gadgets: '../../Game_Mechanics_Spec/Tech_Gadgets_Complete.csv',
  armor: '../../Armor_Equipment.csv',
  ammunition: '../../Ammunition_System.csv',
  improvised: '../../Improvised_Weapons.csv',

  // World Data
  cities: '../../SuperHero Tactics/SuperHero Tactics World Bible - Cities.csv',
  countries: '../../SuperHero Tactics World Bible - Country.csv',

  // Combat Tables
  statusEffects: '../../Combat Compendium REAL - EFFECT_STATUS.csv',
  skills: '../../Complete_Skills_Talents.csv',

  // Powers
  powers: '../../LSW_Powers_Complete_Database.csv',

  // Characters
  characterTemplates: '../../Character_Archetypes.csv',

  // Factions
  factions: '../../Faction_Relationships_Complete.csv',
};

interface ImportResult {
  table: string;
  rowsImported: number;
  errors: string[];
}

/**
 * Parse a CSV file and return rows
 */
async function parseCSV(filePath: string): Promise<Record<string, string>[]> {
  return new Promise((resolve, reject) => {
    // For browser, we need to fetch the file
    fetch(filePath)
      .then(response => {
        if (!response.ok) {
          throw new Error(`Failed to fetch ${filePath}: ${response.status}`);
        }
        return response.text();
      })
      .then(csvText => {
        const result = Papa.parse<Record<string, string>>(csvText, {
          header: true,
          skipEmptyLines: true,
          transformHeader: (header) => header.trim().toLowerCase().replace(/\s+/g, '_'),
        });

        if (result.errors.length > 0) {
          console.warn(`CSV parse warnings for ${filePath}:`, result.errors);
        }

        resolve(result.data);
      })
      .catch(reject);
  });
}

/**
 * Import weapons from Weapons_Complete.csv
 */
async function importWeapons(): Promise<ImportResult> {
  const result: ImportResult = { table: 'weapons', rowsImported: 0, errors: [] };

  try {
    // Try to parse from public/data directory
    const rows = await parseCSV('/data/Weapons_Complete.csv');

    const columns = [
      'weapon_id', 'name', 'category', 'base_damage', 'damage_type',
      'sub_type', 'attack_speed', 'range_squares', 'accuracy_cs',
      'reload_sec', 'skill_required', 'str_required', 'special_effects',
      'penetration_mult', 'default_ammo', 'magazine_size', 'cost_level',
      'availability', 'investigation_bonus', 'notes'
    ];

    const data = rows
      .filter(row => row.weapon_id && row.weapon_id.startsWith('MEL_') || row.weapon_id?.startsWith('RNG_'))
      .map(row => [
        row.weapon_id || '',
        row.weapon_name || row.name || '',
        row.category || '',
        parseInt(row.base_damage) || 0,
        row.damage_type || '',
        row.sub_type || '',
        parseFloat(row.attack_speed_sec) || 0,
        parseInt(row.range_squares) || 0,
        row.accuracy_cs || '',
        parseFloat(row.reload_sec) || 0,
        row.skill_required || '',
        parseInt(row.str_required) || 0,
        row.special_effects || '',
        parseFloat(row.penetration_mult?.replace('x', '')) || 1.0,
        row.default_ammo || '',
        parseInt(row.magazine_size) || 0,
        row.cost_level || '',
        row.availability || '',
        row.investigation_bonus || '',
        row.notes || ''
      ]);

    if (data.length > 0) {
      insertMany('weapons', columns, data);
      result.rowsImported = data.length;
    }
  } catch (e) {
    result.errors.push(String(e));
  }

  return result;
}

/**
 * Import gadgets from Tech_Gadgets_Complete.csv
 */
async function importGadgets(): Promise<ImportResult> {
  const result: ImportResult = { table: 'gadgets', rowsImported: 0, errors: [] };

  try {
    const rows = await parseCSV('/data/Tech_Gadgets_Complete.csv');

    const columns = [
      'item_id', 'name', 'category', 'subcategory',
      'speed_mph', 'speed_squares_turn', 'passengers', 'cargo_lbs',
      'armor_hp', 'armor_dr', 'fuel_type', 'range_miles',
      'cost_level', 'availability', 'special_properties', 'notes'
    ];

    const data = rows
      .filter(row => row.vehicle_id || row.item_id)
      .map(row => [
        row.vehicle_id || row.item_id || '',
        row.vehicle_name || row.name || '',
        row.category || '',
        row.subcategory || '',
        parseInt(row.speed_mph) || 0,
        parseInt(row.speed_squares_turn) || 0,
        parseInt(row.passengers) || 0,
        parseInt(row.cargo_lbs) || 0,
        parseInt(row.armor_hp) || 0,
        parseInt(row.armor_dr) || 0,
        row.fuel_type || '',
        parseInt(row.range_miles) || 0,
        row.cost_level || '',
        row.availability || '',
        row.special_properties || '',
        row.notes || ''
      ]);

    if (data.length > 0) {
      insertMany('gadgets', columns, data);
      result.rowsImported = data.length;
    }
  } catch (e) {
    result.errors.push(String(e));
  }

  return result;
}

/**
 * Import cities from World Bible
 */
async function importCities(): Promise<ImportResult> {
  const result: ImportResult = { table: 'cities', rowsImported: 0, errors: [] };

  try {
    const rows = await parseCSV('/data/Cities.csv');

    const columns = [
      'city_id', 'name', 'country', 'population', 'city_type',
      'crime_index', 'safety_index', 'hvt_count', 'coordinates', 'notes'
    ];

    const data = rows
      .filter(row => row.city || row.name)
      .map((row, index) => [
        row.city_id || `CITY_${index.toString().padStart(4, '0')}`,
        row.city || row.name || '',
        row.country || '',
        parseInt(row.population?.replace(/,/g, '')) || 0,
        row.city_type || row.type || '',
        parseInt(row.crime_index) || 0,
        parseInt(row.safety_index) || 0,
        parseInt(row.hvt_count) || 0,
        row.coordinates || '',
        row.notes || ''
      ]);

    if (data.length > 0) {
      insertMany('cities', columns, data);
      result.rowsImported = data.length;
    }
  } catch (e) {
    result.errors.push(String(e));
  }

  return result;
}

/**
 * Import countries from World Bible
 */
async function importCountries(): Promise<ImportResult> {
  const result: ImportResult = { table: 'countries', rowsImported: 0, errors: [] };

  try {
    const rows = await parseCSV('/data/Countries.csv');

    const columns = [
      'country_id', 'name', 'region', 'government_type',
      'population', 'education_level', 'economy_rank', 'faction', 'notes'
    ];

    const data = rows
      .filter(row => row.country || row.name)
      .map((row, index) => [
        row.country_id || `COUNTRY_${index.toString().padStart(3, '0')}`,
        row.country || row.name || '',
        row.region || row.continent || '',
        row.government_type || row.government || '',
        parseInt(row.population?.replace(/,/g, '')) || 0,
        row.education_level || '',
        parseInt(row.economy_rank) || 0,
        row.faction || '',
        row.notes || ''
      ]);

    if (data.length > 0) {
      insertMany('countries', columns, data);
      result.rowsImported = data.length;
    }
  } catch (e) {
    result.errors.push(String(e));
  }

  return result;
}

/**
 * Import powers from LSW_Powers_Complete_Database.csv
 */
async function importPowers(): Promise<ImportResult> {
  const result: ImportResult = { table: 'powers', rowsImported: 0, errors: [] };

  try {
    const rows = await parseCSV('/data/Powers.csv');

    const columns = [
      'power_id', 'name', 'description', 'threat_level', 'origin_type',
      'damage', 'range_squares', 'ap_cost', 'cooldown', 'special_effects',
      'role', 'type', 'manifest', 'notes'
    ];

    const data = rows
      .filter(row => row.power_id || row.name)
      .map((row, index) => [
        row.power_id || `PWR_${index.toString().padStart(4, '0')}`,
        row.name || row.power_name || '',
        row.description || '',
        row.threat_level || '',
        row.origin_type || row.origin || '',
        parseInt(row.damage) || 0,
        parseInt(row.range_squares || row.range) || 0,
        parseInt(row.ap_cost) || 1,
        parseInt(row.cooldown) || 0,
        row.special_effects || row.effects || '',
        row.role || '',
        row.type || row.power_type || '',
        row.manifest || row.manifestation || '',
        row.notes || ''
      ]);

    if (data.length > 0) {
      insertMany('powers', columns, data);
      result.rowsImported = data.length;
    }
  } catch (e) {
    result.errors.push(String(e));
  }

  return result;
}

/**
 * Import status effects
 */
async function importStatusEffects(): Promise<ImportResult> {
  const result: ImportResult = { table: 'status_effects', rowsImported: 0, errors: [] };

  try {
    const rows = await parseCSV('/data/StatusEffects.csv');

    const columns = [
      'effect_id', 'name', 'description', 'duration_turns',
      'damage_per_turn', 'stat_modifier', 'can_stack', 'cure_method', 'notes'
    ];

    const data = rows
      .filter(row => row.effect_id || row.name || row.status)
      .map((row, index) => [
        row.effect_id || `EFF_${index.toString().padStart(3, '0')}`,
        row.name || row.status || '',
        row.description || row.effect || '',
        parseInt(row.duration_turns || row.duration) || 0,
        parseInt(row.damage_per_turn || row.dot) || 0,
        row.stat_modifier || row.modifier || '',
        row.can_stack === 'true' || row.can_stack === '1' ? 1 : 0,
        row.cure_method || row.cure || '',
        row.notes || ''
      ]);

    if (data.length > 0) {
      insertMany('status_effects', columns, data);
      result.rowsImported = data.length;
    }
  } catch (e) {
    result.errors.push(String(e));
  }

  return result;
}

/**
 * Import skills
 */
async function importSkills(): Promise<ImportResult> {
  const result: ImportResult = { table: 'skills', rowsImported: 0, errors: [] };

  try {
    const rows = await parseCSV('/data/Skills.csv');

    const columns = [
      'skill_id', 'name', 'category', 'description',
      'stat_bonus', 'investigation_bonus', 'combat_bonus', 'notes'
    ];

    const data = rows
      .filter(row => row.skill_id || row.name || row.skill)
      .map((row, index) => [
        row.skill_id || `SKL_${index.toString().padStart(3, '0')}`,
        row.name || row.skill || '',
        row.category || '',
        row.description || '',
        row.stat_bonus || '',
        row.investigation_bonus || '',
        row.combat_bonus || '',
        row.notes || ''
      ]);

    if (data.length > 0) {
      insertMany('skills', columns, data);
      result.rowsImported = data.length;
    }
  } catch (e) {
    result.errors.push(String(e));
  }

  return result;
}

/**
 * Import armor
 */
async function importArmor(): Promise<ImportResult> {
  const result: ImportResult = { table: 'armor', rowsImported: 0, errors: [] };

  try {
    const rows = await parseCSV('/data/Armor.csv');

    const columns = [
      'armor_id', 'name', 'category', 'damage_reduction', 'hp',
      'weight', 'coverage', 'special_properties', 'cost_level', 'availability', 'notes'
    ];

    const data = rows
      .filter(row => row.armor_id || row.name)
      .map((row, index) => [
        row.armor_id || `ARM_${index.toString().padStart(3, '0')}`,
        row.name || row.armor_name || '',
        row.category || row.type || '',
        parseInt(row.damage_reduction || row.dr) || 0,
        parseInt(row.hp || row.durability) || 0,
        row.weight || '',
        row.coverage || '',
        row.special_properties || row.special || '',
        row.cost_level || '',
        row.availability || '',
        row.notes || ''
      ]);

    if (data.length > 0) {
      insertMany('armor', columns, data);
      result.rowsImported = data.length;
    }
  } catch (e) {
    result.errors.push(String(e));
  }

  return result;
}

/**
 * Import ammunition
 */
async function importAmmunition(): Promise<ImportResult> {
  const result: ImportResult = { table: 'ammunition', rowsImported: 0, errors: [] };

  try {
    const rows = await parseCSV('/data/Ammunition.csv');

    const columns = [
      'ammo_id', 'name', 'caliber', 'damage_modifier',
      'penetration_modifier', 'special_effects', 'cost_level', 'availability', 'notes'
    ];

    const data = rows
      .filter(row => row.ammo_id || row.name || row.ammo_type)
      .map((row, index) => [
        row.ammo_id || `AMMO_${index.toString().padStart(3, '0')}`,
        row.name || row.ammo_type || '',
        row.caliber || '',
        parseFloat(row.damage_modifier?.replace('x', '')) || 1.0,
        parseFloat(row.penetration_modifier?.replace('x', '')) || 1.0,
        row.special_effects || row.effects || '',
        row.cost_level || '',
        row.availability || '',
        row.notes || ''
      ]);

    if (data.length > 0) {
      insertMany('ammunition', columns, data);
      result.rowsImported = data.length;
    }
  } catch (e) {
    result.errors.push(String(e));
  }

  return result;
}

/**
 * Import all data from CSV files
 */
export async function importAllData(clearFirst = true): Promise<ImportResult[]> {
  console.log('[CSV Importer] Starting data import...');

  // Ensure database is ready
  getDatabase();

  if (clearFirst) {
    clearDatabase();
  }

  const results: ImportResult[] = [];

  // Import in order
  results.push(await importWeapons());
  results.push(await importGadgets());
  results.push(await importCities());
  results.push(await importCountries());
  results.push(await importPowers());
  results.push(await importStatusEffects());
  results.push(await importSkills());
  results.push(await importArmor());
  results.push(await importAmmunition());

  // Save to localStorage
  saveDatabase();

  // Log summary
  const totalRows = results.reduce((sum, r) => sum + r.rowsImported, 0);
  const totalErrors = results.reduce((sum, r) => sum + r.errors.length, 0);

  console.log(`[CSV Importer] Import complete: ${totalRows} rows, ${totalErrors} errors`);
  results.forEach(r => {
    if (r.rowsImported > 0) {
      console.log(`  - ${r.table}: ${r.rowsImported} rows`);
    }
    if (r.errors.length > 0) {
      console.warn(`  - ${r.table} errors:`, r.errors);
    }
  });

  return results;
}

/**
 * Import data from raw CSV text (for manual import)
 */
export function importCSVText(table: string, csvText: string): ImportResult {
  const result: ImportResult = { table, rowsImported: 0, errors: [] };

  try {
    const parsed = Papa.parse<Record<string, string>>(csvText, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim().toLowerCase().replace(/\s+/g, '_'),
    });

    if (parsed.data.length > 0) {
      const columns = Object.keys(parsed.data[0]);
      const rows = parsed.data.map(row => columns.map(col => row[col] || ''));

      insertMany(table, columns, rows);
      result.rowsImported = rows.length;
    }
  } catch (e) {
    result.errors.push(String(e));
  }

  return result;
}
