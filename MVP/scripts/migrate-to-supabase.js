#!/usr/bin/env node
/**
 * SuperHero Tactics - CSV to Supabase Migration Script
 *
 * Usage:
 *   1. Set SUPABASE_URL and SUPABASE_SERVICE_KEY environment variables
 *   2. Run: node scripts/migrate-to-supabase.js
 *
 * Or pass as arguments:
 *   node scripts/migrate-to-supabase.js --url=YOUR_URL --key=YOUR_KEY
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Get Supabase credentials from env or args
let SUPABASE_URL = process.env.SUPABASE_URL;
let SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;

// Parse command line args
for (const arg of process.argv.slice(2)) {
  if (arg.startsWith('--url=')) {
    SUPABASE_URL = arg.split('=')[1];
  }
  if (arg.startsWith('--key=')) {
    SUPABASE_KEY = arg.split('=')[1];
  }
}

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Error: Missing Supabase credentials');
  console.error('Set SUPABASE_URL and SUPABASE_SERVICE_KEY environment variables');
  console.error('Or pass --url=YOUR_URL --key=YOUR_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Paths
const ROOT = path.resolve(__dirname, '../../..'); // C:\git\sht

/**
 * Simple CSV parser (no external dependencies for the script)
 */
function parseCSV(text) {
  const lines = text.split('\n');
  if (lines.length < 2) return [];

  // Find header row (skip section headers and descriptions)
  let headerIdx = 0;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.includes('_ID,') || line.includes('Weapon_ID') || line.includes('Skill_Name')) {
      headerIdx = i;
      break;
    }
  }

  const headers = parseCSVLine(lines[headerIdx]).map(h =>
    h.trim().toLowerCase().replace(/\s+/g, '_')
  );

  const rows = [];
  for (let i = headerIdx + 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line || line.startsWith('===') || line.startsWith('---')) continue;

    const values = parseCSVLine(line);
    if (values.length < 2) continue;

    const row = {};
    for (let j = 0; j < headers.length; j++) {
      row[headers[j]] = values[j] || '';
    }
    rows.push(row);
  }

  return rows;
}

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

/**
 * Clean and convert value types
 */
function cleanInt(val) {
  if (!val || val === '-' || val === 'None') return 0;
  const num = parseInt(val.toString().replace(/,/g, ''));
  return isNaN(num) ? 0 : num;
}

function cleanFloat(val) {
  if (!val || val === '-' || val === 'None') return 1.0;
  const str = val.toString().replace(/x$/i, '');
  const num = parseFloat(str);
  return isNaN(num) ? 1.0 : num;
}

function cleanAccuracy(cs) {
  if (!cs) return 70;
  const match = cs.match(/([+-]?\d+)CS/);
  if (match) {
    return 70 + parseInt(match[1]) * 10;
  }
  return 70;
}

function cleanStr(val) {
  if (!val || val === 'None' || val === '-') return null;
  return val.toString().trim();
}

// ============== WEAPONS ==============
async function migrateWeapons() {
  console.log('📦 Migrating weapons...');

  const csvPath = path.join(ROOT, 'Game_Mechanics_Spec/Weapons_Complete.csv');
  if (!fs.existsSync(csvPath)) {
    console.warn('  ⚠️  Weapons_Complete.csv not found');
    return 0;
  }

  const text = fs.readFileSync(csvPath, 'utf-8');
  const rows = parseCSV(text);

  const weapons = [];
  for (const row of rows) {
    const id = row.weapon_id;
    if (!id || (!id.startsWith('MEL_') && !id.startsWith('RNG_') && !id.startsWith('THR_') && !id.startsWith('ENG_') && !id.startsWith('GRN_'))) {
      continue;
    }

    weapons.push({
      id: id.toLowerCase(),
      name: row.weapon_name || '',
      category: row.category || '',
      base_damage: cleanInt(row.base_damage),
      damage_type: row.damage_type || 'PHYSICAL',
      sub_type: cleanStr(row.sub_type),
      attack_speed: cleanFloat(row.attack_speed_sec),
      range_squares: cleanInt(row.range_squares),
      accuracy_cs: cleanAccuracy(row.accuracy_cs),
      reload_time: cleanFloat(row.reload_sec),
      skill_required: cleanStr(row.skill_required),
      str_required: cleanInt(row.str_required),
      special_effects: cleanStr(row.special_effects),
      penetration_mult: cleanFloat(row.penetration_mult),
      default_ammo: cleanStr(row.default_ammo),
      magazine_size: cleanInt(row.magazine_size),
      cost_level: row.cost_level || 'Medium',
      availability: row.availability || 'Common',
      notes: cleanStr(row.notes),
    });
  }

  if (weapons.length === 0) {
    console.log('  ⚠️  No weapons found');
    return 0;
  }

  // Clear existing and insert
  await supabase.from('weapons').delete().neq('id', '');
  const { error } = await supabase.from('weapons').insert(weapons);

  if (error) {
    console.error('  ❌ Error:', error.message);
    return 0;
  }

  console.log(`  ✅ ${weapons.length} weapons`);
  return weapons.length;
}

// ============== GADGETS/VEHICLES ==============
async function migrateGadgets() {
  console.log('📦 Migrating gadgets & vehicles...');

  const csvPath = path.join(ROOT, 'Game_Mechanics_Spec/Tech_Gadgets_Complete.csv');
  if (!fs.existsSync(csvPath)) {
    console.warn('  ⚠️  Tech_Gadgets_Complete.csv not found');
    return 0;
  }

  const text = fs.readFileSync(csvPath, 'utf-8');
  const rows = parseCSV(text);

  const gadgets = [];
  for (const row of rows) {
    const id = row.vehicle_id || row.item_id;
    if (!id || id.includes('===')) continue;

    gadgets.push({
      id: id.toLowerCase(),
      name: row.vehicle_name || row.name || '',
      category: row.category || '',
      speed_mph: cleanInt(row.speed_mph),
      speed_squares: cleanInt(row.speed_squares_turn),
      passengers: cleanInt(row.passengers),
      cargo_lbs: cleanInt(row.cargo_lbs),
      armor_hp: cleanInt(row.armor_hp),
      armor_dr: cleanInt(row.armor_dr),
      fuel_type: cleanStr(row.fuel_type),
      range_miles: cleanInt(row.range_miles),
      cost_level: row.cost_level || 'Medium',
      availability: row.availability || 'Common',
      special_properties: cleanStr(row.special_properties),
      notes: cleanStr(row.notes),
    });
  }

  if (gadgets.length === 0) {
    console.log('  ⚠️  No gadgets found');
    return 0;
  }

  await supabase.from('gadgets').delete().neq('id', '');
  const { error } = await supabase.from('gadgets').insert(gadgets);

  if (error) {
    console.error('  ❌ Error:', error.message);
    return 0;
  }

  console.log(`  ✅ ${gadgets.length} gadgets`);
  return gadgets.length;
}

// ============== CITIES ==============
async function migrateCities() {
  console.log('📦 Migrating cities...');

  const possiblePaths = [
    path.join(ROOT, 'SuperHero Tactics/SuperHero_Tactics_World_Bible_Cities_with_HVTs_Updated.csv'),
    path.join(ROOT, 'SuperHero Tactics/SuperHero Tactics World Bible - Cities.csv'),
    path.join(ROOT, 'SuperHero Tactics World Bible - Cities.csv'),
  ];

  let text = null;
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      text = fs.readFileSync(p, 'utf-8');
      break;
    }
  }

  if (!text) {
    console.warn('  ⚠️  Cities CSV not found');
    return 0;
  }

  const rows = parseCSV(text);

  const cities = [];
  for (const row of rows) {
    const name = row.city || row.name;
    if (!name) continue;

    const id = `city_${name.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
    cities.push({
      id,
      name,
      country: row.country || '',
      population: cleanInt(row.population),
      city_type: row.city_type || row.type || '',
      crime_index: cleanInt(row.crime_index),
      safety_index: cleanInt(row.safety_index),
      hvt_count: cleanInt(row.hvt_count),
      latitude: cleanFloat(row.latitude),
      longitude: cleanFloat(row.longitude),
    });
  }

  if (cities.length === 0) {
    console.log('  ⚠️  No cities found');
    return 0;
  }

  await supabase.from('cities').delete().neq('id', '');
  const { error } = await supabase.from('cities').insert(cities);

  if (error) {
    console.error('  ❌ Error:', error.message);
    return 0;
  }

  console.log(`  ✅ ${cities.length} cities`);
  return cities.length;
}

// ============== COUNTRIES ==============
async function migrateCountries() {
  console.log('📦 Migrating countries...');

  const possiblePaths = [
    path.join(ROOT, 'SuperHero Tactics World Bible - Country.csv'),
    path.join(ROOT, 'SuperHero Tactics/SuperHero Tactics World Bible - Country.csv'),
  ];

  let text = null;
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      text = fs.readFileSync(p, 'utf-8');
      break;
    }
  }

  if (!text) {
    console.warn('  ⚠️  Countries CSV not found');
    return 0;
  }

  const rows = parseCSV(text);

  const countries = [];
  for (const row of rows) {
    const name = row.country || row.name;
    if (!name) continue;

    const id = `country_${name.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
    countries.push({
      id,
      name,
      region: row.region || row.continent || '',
      government_type: row.government_type || row.government || '',
      population: cleanInt(row.population),
      education_level: row.education_level || '',
      faction: cleanStr(row.faction),
    });
  }

  if (countries.length === 0) {
    console.log('  ⚠️  No countries found');
    return 0;
  }

  await supabase.from('countries').delete().neq('id', '');
  const { error } = await supabase.from('countries').insert(countries);

  if (error) {
    console.error('  ❌ Error:', error.message);
    return 0;
  }

  console.log(`  ✅ ${countries.length} countries`);
  return countries.length;
}

// ============== POWERS ==============
async function migratePowers() {
  console.log('📦 Migrating powers...');

  const csvPath = path.join(ROOT, 'LSW_Powers_Complete_Database.csv');
  if (!fs.existsSync(csvPath)) {
    console.warn('  ⚠️  LSW_Powers_Complete_Database.csv not found');
    return 0;
  }

  const text = fs.readFileSync(csvPath, 'utf-8');
  const rows = parseCSV(text);

  const powers = [];
  for (const row of rows) {
    const name = row.power_name || row.name;
    if (!name) continue;

    const id = row.power_id || `pwr_${name.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
    powers.push({
      id,
      name,
      description: row.description || '',
      threat_level: row.threat_level || 'THREAT_1',
      origin_type: row.origin_type || row.origin || '',
      damage: cleanInt(row.damage),
      range_squares: cleanInt(row.range_squares || row.range),
      ap_cost: cleanInt(row.ap_cost) || 1,
      cooldown: cleanInt(row.cooldown),
      role: row.role || 'offense',
      power_type: row.type || row.power_type || '',
      manifest: row.manifest || row.manifestation || '',
    });
  }

  if (powers.length === 0) {
    console.log('  ⚠️  No powers found');
    return 0;
  }

  await supabase.from('powers').delete().neq('id', '');
  const { error } = await supabase.from('powers').insert(powers);

  if (error) {
    console.error('  ❌ Error:', error.message);
    return 0;
  }

  console.log(`  ✅ ${powers.length} powers`);
  return powers.length;
}

// ============== SKILLS ==============
async function migrateSkills() {
  console.log('📦 Migrating skills...');

  const csvPath = path.join(ROOT, 'MVP/public/data/Skills.csv');
  if (!fs.existsSync(csvPath)) {
    console.warn('  ⚠️  Skills.csv not found');
    return 0;
  }

  const text = fs.readFileSync(csvPath, 'utf-8');
  const rows = parseCSV(text);

  const skills = [];
  for (const row of rows) {
    const name = row.skill_name || row.skill || row.name;
    if (!name) continue;

    const id = `skl_${name.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
    skills.push({
      id,
      name,
      skill_type: row.skill_type || row.category || '',
      column_shift_bonus: cleanStr(row.column_shift_bonus),
      prerequisites: cleanStr(row.prerequisites),
      description: row.description || '',
      combat_application: cleanStr(row.combat_application),
      range_combat_bonus: cleanStr(row.range_combat_bonus),
      melee_combat_bonus: cleanStr(row.melee_combat_bonus),
      investigation_bonus: cleanStr(row.investigation_bonus),
      special_effects: cleanStr(row.special_effects),
    });
  }

  if (skills.length === 0) {
    console.log('  ⚠️  No skills found');
    return 0;
  }

  await supabase.from('skills').delete().neq('id', '');
  const { error } = await supabase.from('skills').insert(skills);

  if (error) {
    console.error('  ❌ Error:', error.message);
    return 0;
  }

  console.log(`  ✅ ${skills.length} skills`);
  return skills.length;
}

// ============== STATUS EFFECTS ==============
async function migrateStatusEffects() {
  console.log('📦 Migrating status effects...');

  const csvPath = path.join(ROOT, 'MVP/public/data/StatusEffects.csv');
  if (!fs.existsSync(csvPath)) {
    console.warn('  ⚠️  StatusEffects.csv not found');
    return 0;
  }

  const text = fs.readFileSync(csvPath, 'utf-8');
  const lines = text.split('\n');

  // Parse the special format of StatusEffects.csv
  const effects = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith(',')) continue;

    const parts = trimmed.split(',');
    const name = parts[1]?.replace(/"/g, '').trim();
    if (!name || name.includes('Minor') || name.includes('Major')) continue;

    const id = `eff_${name.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
    const desc = parts[3]?.replace(/"/g, '').trim() || '';

    effects.push({
      id,
      name,
      description: desc,
      duration_turns: 0,
      damage_per_turn: 0,
      stat_modifier: null,
      can_stack: false,
      cure_method: null,
    });
  }

  if (effects.length === 0) {
    console.log('  ⚠️  No status effects found');
    return 0;
  }

  await supabase.from('status_effects').delete().neq('id', '');
  const { error } = await supabase.from('status_effects').insert(effects);

  if (error) {
    console.error('  ❌ Error:', error.message);
    return 0;
  }

  console.log(`  ✅ ${effects.length} status effects`);
  return effects.length;
}

// ============== ARMOR ==============
async function migrateArmor() {
  console.log('📦 Migrating armor...');

  const csvPath = path.join(ROOT, 'Armor_Equipment.csv');
  if (!fs.existsSync(csvPath)) {
    console.warn('  ⚠️  Armor_Equipment.csv not found');
    return 0;
  }

  const text = fs.readFileSync(csvPath, 'utf-8');
  const rows = parseCSV(text);

  const armorItems = [];
  for (const row of rows) {
    const name = row.armor_name || row.name;
    if (!name) continue;

    const id = row.armor_id || `arm_${name.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
    armorItems.push({
      id,
      name,
      category: row.category || row.type || '',
      damage_reduction: cleanInt(row.damage_reduction || row.dr),
      hp: cleanInt(row.hp || row.durability) || 100,
      weight: row.weight || '',
      coverage: row.coverage || '',
      special_properties: cleanStr(row.special_properties || row.special),
      cost_level: row.cost_level || 'Medium',
      availability: row.availability || 'Common',
    });
  }

  if (armorItems.length === 0) {
    console.log('  ⚠️  No armor found');
    return 0;
  }

  await supabase.from('armor').delete().neq('id', '');
  const { error } = await supabase.from('armor').insert(armorItems);

  if (error) {
    console.error('  ❌ Error:', error.message);
    return 0;
  }

  console.log(`  ✅ ${armorItems.length} armor items`);
  return armorItems.length;
}

// ============== AMMUNITION ==============
async function migrateAmmunition() {
  console.log('📦 Migrating ammunition...');

  const csvPath = path.join(ROOT, 'Ammunition_System.csv');
  if (!fs.existsSync(csvPath)) {
    console.warn('  ⚠️  Ammunition_System.csv not found');
    return 0;
  }

  const text = fs.readFileSync(csvPath, 'utf-8');
  const rows = parseCSV(text);

  const ammo = [];
  for (const row of rows) {
    const name = row.ammo_type || row.name;
    if (!name) continue;

    const id = row.ammo_id || `ammo_${name.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
    ammo.push({
      id,
      name,
      caliber: row.caliber || '',
      damage_modifier: cleanFloat(row.damage_modifier),
      penetration_modifier: cleanFloat(row.penetration_modifier),
      special_effects: cleanStr(row.special_effects || row.effects),
      cost_level: row.cost_level || 'Medium',
      availability: row.availability || 'Common',
    });
  }

  if (ammo.length === 0) {
    console.log('  ⚠️  No ammunition found');
    return 0;
  }

  await supabase.from('ammunition').delete().neq('id', '');
  const { error } = await supabase.from('ammunition').insert(ammo);

  if (error) {
    console.error('  ❌ Error:', error.message);
    return 0;
  }

  console.log(`  ✅ ${ammo.length} ammo types`);
  return ammo.length;
}

// ============== MARTIAL ARTS ==============
async function migrateMartialArts() {
  console.log('📦 Migrating martial arts...');

  // These are defined in the plan, insert them directly
  const styles = [
    { id: 'grappling', name: 'Grappling', description: 'Judo, Wrestling - Control & Positioning', role: 'control', primary_stat: 'STR' },
    { id: 'submission', name: 'Submission', description: 'BJJ, Catch Wrestling - Finisher & Incapacitation', role: 'finisher', primary_stat: 'MEL+STR' },
    { id: 'internal', name: 'Internal', description: 'Tai Chi, Aikido - Redirection & Defense', role: 'defense', primary_stat: 'INS+AGL' },
    { id: 'counter', name: 'Counter', description: 'JKD, Krav Maga - Reactive & Efficient', role: 'reactive', primary_stat: 'AGL+INS' },
    { id: 'striking', name: 'Striking', description: 'Muay Thai, Boxing, Karate - Damage & Pressure', role: 'damage', primary_stat: 'STR+AGL' },
  ];

  const techniques = [
    // Grappling
    { id: 'grp_clinch', style_id: 'grappling', name: 'Clinch', belt_required: 1, ap_cost: 1, effect: 'Enter grapple range', damage: null, special: null },
    { id: 'grp_takedown', style_id: 'grappling', name: 'Takedown', belt_required: 2, ap_cost: 2, effect: 'Knock prone, you stay standing', damage: null, special: null },
    { id: 'grp_hip_throw', style_id: 'grappling', name: 'Hip Throw', belt_required: 3, ap_cost: 2, effect: 'Throw 1 tile, prone', damage: null, special: null },
    { id: 'grp_suplex', style_id: 'grappling', name: 'Suplex', belt_required: 4, ap_cost: 3, effect: '15 damage + prone', damage: 15, special: 'prone' },
    { id: 'grp_slam', style_id: 'grappling', name: 'Slam', belt_required: 5, ap_cost: 3, effect: 'STR×0.5 damage', damage: null, special: 'str_scaling' },
    { id: 'grp_pin', style_id: 'grappling', name: 'Pin', belt_required: 6, ap_cost: 2, effect: 'Restrain target (they lose AP)', damage: null, special: 'restrain' },
    { id: 'grp_lift', style_id: 'grappling', name: 'Lift & Carry', belt_required: 7, ap_cost: 1, effect: 'Pick up restrained target', damage: null, special: 'lift' },
    { id: 'grp_piledriver', style_id: 'grappling', name: 'Pile Driver', belt_required: 8, ap_cost: 4, effect: '30 damage, requires lift', damage: 30, special: 'requires_lift' },

    // Submission
    { id: 'sub_guard', style_id: 'submission', name: 'Guard Pull', belt_required: 1, ap_cost: 1, effect: 'Both go prone, you control', damage: null, special: null },
    { id: 'sub_armbar', style_id: 'submission', name: 'Armbar', belt_required: 2, ap_cost: 2, effect: '10 damage, -2 target MEL', damage: 10, special: 'mel_debuff' },
    { id: 'sub_triangle', style_id: 'submission', name: 'Triangle', belt_required: 3, ap_cost: 2, effect: 'Choke, target loses 1 AP/turn', damage: null, special: 'ap_drain' },
    { id: 'sub_kimura', style_id: 'submission', name: 'Kimura', belt_required: 4, ap_cost: 2, effect: '15 damage + disarm', damage: 15, special: 'disarm' },
    { id: 'sub_rear_naked', style_id: 'submission', name: 'Rear Naked Choke', belt_required: 5, ap_cost: 3, effect: 'Choke, unconscious in 3 turns', damage: null, special: 'unconscious_3' },
    { id: 'sub_heel_hook', style_id: 'submission', name: 'Heel Hook', belt_required: 6, ap_cost: 2, effect: '20 damage + immobilize', damage: 20, special: 'immobilize' },
    { id: 'sub_neck_crank', style_id: 'submission', name: 'Neck Crank', belt_required: 7, ap_cost: 3, effect: '25 damage', damage: 25, special: null },
    { id: 'sub_blood_choke', style_id: 'submission', name: 'Blood Choke', belt_required: 8, ap_cost: 3, effect: 'Unconscious in 2 turns', damage: null, special: 'unconscious_2' },

    // Internal
    { id: 'int_deflect', style_id: 'internal', name: 'Deflect', belt_required: 1, ap_cost: 0, effect: 'Reaction: reduce melee damage 25%', damage: null, special: 'reaction' },
    { id: 'int_redirect', style_id: 'internal', name: 'Redirect', belt_required: 2, ap_cost: 1, effect: 'Send attack to adjacent enemy', damage: null, special: 'redirect' },
    { id: 'int_push', style_id: 'internal', name: 'Push', belt_required: 3, ap_cost: 1, effect: 'Knockback 1 tile, no damage', damage: null, special: 'knockback_1' },
    { id: 'int_joint_lock', style_id: 'internal', name: 'Joint Lock', belt_required: 4, ap_cost: 2, effect: 'Immobilize 1 turn', damage: null, special: 'immobilize_1' },
    { id: 'int_energy_steal', style_id: 'internal', name: 'Energy Steal', belt_required: 5, ap_cost: 2, effect: 'Drain 1 AP from target', damage: null, special: 'ap_steal' },
    { id: 'int_circle_walk', style_id: 'internal', name: 'Circle Walk', belt_required: 6, ap_cost: 1, effect: 'Move without triggering overwatch', damage: null, special: 'ignore_overwatch' },
    { id: 'int_iron_body', style_id: 'internal', name: 'Iron Body', belt_required: 7, ap_cost: 0, effect: 'Passive: +5 DR vs melee', damage: null, special: 'passive_dr' },
    { id: 'int_dim_mak', style_id: 'internal', name: 'Dim Mak', belt_required: 8, ap_cost: 4, effect: 'Delayed damage (triggers next turn)', damage: null, special: 'delayed_damage' },

    // Counter
    { id: 'cnt_intercept', style_id: 'counter', name: 'Intercept', belt_required: 1, ap_cost: 0, effect: 'Reaction: attack during enemy attack', damage: null, special: 'reaction' },
    { id: 'cnt_parry_riposte', style_id: 'counter', name: 'Parry-Riposte', belt_required: 2, ap_cost: 1, effect: 'Block + immediate counter', damage: null, special: 'counter' },
    { id: 'cnt_eye_jab', style_id: 'counter', name: 'Eye Jab', belt_required: 3, ap_cost: 1, effect: '5 damage + blind 1 turn', damage: 5, special: 'blind' },
    { id: 'cnt_low_kick', style_id: 'counter', name: 'Low Kick', belt_required: 4, ap_cost: 1, effect: '10 damage + slow', damage: 10, special: 'slow' },
    { id: 'cnt_disarm', style_id: 'counter', name: 'Disarm', belt_required: 5, ap_cost: 2, effect: 'Take weapon from enemy', damage: null, special: 'disarm' },
    { id: 'cnt_throat_strike', style_id: 'counter', name: 'Throat Strike', belt_required: 6, ap_cost: 2, effect: '15 damage + silence (no powers)', damage: 15, special: 'silence' },
    { id: 'cnt_break_guard', style_id: 'counter', name: 'Break Guard', belt_required: 7, ap_cost: 2, effect: "Remove enemy's defensive stance", damage: null, special: 'break_guard' },
    { id: 'cnt_simultaneous', style_id: 'counter', name: 'Simultaneous', belt_required: 8, ap_cost: 3, effect: 'Attack ignores enemy attack', damage: null, special: 'ignore_attack' },

    // Striking
    { id: 'str_jab', style_id: 'striking', name: 'Jab', belt_required: 1, ap_cost: 1, effect: '5 damage, fast', damage: 5, special: 'fast' },
    { id: 'str_cross', style_id: 'striking', name: 'Cross', belt_required: 2, ap_cost: 1, effect: '10 damage', damage: 10, special: null },
    { id: 'str_hook', style_id: 'striking', name: 'Hook', belt_required: 3, ap_cost: 1, effect: '12 damage, bypass block', damage: 12, special: 'bypass_block' },
    { id: 'str_uppercut', style_id: 'striking', name: 'Uppercut', belt_required: 4, ap_cost: 2, effect: '15 damage + stagger', damage: 15, special: 'stagger' },
    { id: 'str_elbow', style_id: 'striking', name: 'Elbow', belt_required: 5, ap_cost: 1, effect: '12 damage + bleed', damage: 12, special: 'bleed' },
    { id: 'str_knee', style_id: 'striking', name: 'Knee', belt_required: 6, ap_cost: 2, effect: '18 damage (requires clinch)', damage: 18, special: 'requires_clinch' },
    { id: 'str_spinning_back', style_id: 'striking', name: 'Spinning Back', belt_required: 7, ap_cost: 2, effect: '20 damage', damage: 20, special: null },
    { id: 'str_superman_punch', style_id: 'striking', name: 'Superman Punch', belt_required: 8, ap_cost: 3, effect: '25 damage + knockback 2', damage: 25, special: 'knockback_2' },
  ];

  await supabase.from('martial_arts_techniques').delete().neq('id', '');
  await supabase.from('martial_arts_styles').delete().neq('id', '');

  const { error: styleError } = await supabase.from('martial_arts_styles').insert(styles);
  if (styleError) {
    console.error('  ❌ Error inserting styles:', styleError.message);
    return 0;
  }

  const { error: techError } = await supabase.from('martial_arts_techniques').insert(techniques);
  if (techError) {
    console.error('  ❌ Error inserting techniques:', techError.message);
    return 0;
  }

  console.log(`  ✅ ${styles.length} styles, ${techniques.length} techniques`);
  return styles.length + techniques.length;
}

// ============== MAIN ==============
async function main() {
  console.log('🚀 SuperHero Tactics - Supabase Migration\n');
  console.log(`📂 Source: ${ROOT}`);
  console.log(`🌐 Target: ${SUPABASE_URL}\n`);

  let total = 0;
  total += await migrateWeapons();
  total += await migrateGadgets();
  total += await migrateCities();
  total += await migrateCountries();
  total += await migratePowers();
  total += await migrateSkills();
  total += await migrateStatusEffects();
  total += await migrateArmor();
  total += await migrateAmmunition();
  total += await migrateMartialArts();

  console.log(`\n✨ Done! Migrated ${total} total records to Supabase`);
}

main().catch(console.error);
