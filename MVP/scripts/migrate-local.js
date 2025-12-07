#!/usr/bin/env node
/**
 * SuperHero Tactics - Local PostgreSQL Migration Script
 *
 * Imports all CSV data into the local Supabase PostgreSQL database
 * Run: node scripts/migrate-local.js
 */

const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

// Local Supabase PostgreSQL connection
const client = new Client({
  host: 'localhost',
  port: 54322,
  user: 'postgres',
  password: 'postgres',
  database: 'superhero_tactics'
});

// Paths
const ROOT = path.resolve(__dirname, '../..'); // C:\git\sht

/**
 * Simple CSV parser
 */
function parseCSV(text) {
  const lines = text.split('\n');
  if (lines.length < 2) return [];

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

  await client.query('DELETE FROM weapons');

  let count = 0;
  for (const row of rows) {
    const id = row.weapon_id;
    if (!id || (!id.startsWith('MEL_') && !id.startsWith('RNG_') && !id.startsWith('THR_') && !id.startsWith('ENG_') && !id.startsWith('GRN_'))) {
      continue;
    }

    await client.query(
      `INSERT INTO weapons (id, name, category, base_damage, damage_type, sub_type, attack_speed, range_squares, accuracy_cs, reload_time, skill_required, str_required, special_effects, penetration_mult, default_ammo, magazine_size, cost_level, availability, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)`,
      [
        id.toLowerCase(),
        row.weapon_name || '',
        row.category || '',
        cleanInt(row.base_damage),
        row.damage_type || 'PHYSICAL',
        cleanStr(row.sub_type),
        cleanFloat(row.attack_speed_sec),
        cleanInt(row.range_squares),
        cleanAccuracy(row.accuracy_cs),
        cleanFloat(row.reload_sec),
        cleanStr(row.skill_required),
        cleanInt(row.str_required),
        cleanStr(row.special_effects),
        cleanFloat(row.penetration_mult),
        cleanStr(row.default_ammo),
        cleanInt(row.magazine_size),
        row.cost_level || 'Medium',
        row.availability || 'Common',
        cleanStr(row.notes)
      ]
    );
    count++;
  }

  console.log(`  ✅ ${count} weapons`);
  return count;
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

  await client.query('DELETE FROM skills');

  let count = 0;
  for (const row of rows) {
    const name = row.skill_name || row.skill || row.name;
    if (!name) continue;

    const id = `skl_${name.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
    await client.query(
      `INSERT INTO skills (id, name, skill_type, column_shift_bonus, prerequisites, description, combat_application, range_combat_bonus, melee_combat_bonus, investigation_bonus, special_effects)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [
        id,
        name,
        row.skill_type || row.category || '',
        cleanStr(row.column_shift_bonus),
        cleanStr(row.prerequisites),
        row.description || '',
        cleanStr(row.combat_application),
        cleanStr(row.range_combat_bonus),
        cleanStr(row.melee_combat_bonus),
        cleanStr(row.investigation_bonus),
        cleanStr(row.special_effects)
      ]
    );
    count++;
  }

  console.log(`  ✅ ${count} skills`);
  return count;
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

  await client.query('DELETE FROM powers');

  let count = 0;
  for (const row of rows) {
    const name = row.power_name || row.name;
    if (!name) continue;

    const id = row.power_id || `pwr_${name.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
    await client.query(
      `INSERT INTO powers (id, name, description, threat_level, origin_type, damage, range_squares, ap_cost, cooldown, role, power_type, manifest)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
      [
        id,
        name,
        row.description || '',
        row.threat_level || 'THREAT_1',
        row.origin_type || row.origin || '',
        cleanInt(row.damage),
        cleanInt(row.range_squares || row.range),
        cleanInt(row.ap_cost) || 1,
        cleanInt(row.cooldown),
        row.role || 'offense',
        row.type || row.power_type || '',
        row.manifest || row.manifestation || ''
      ]
    );
    count++;
  }

  console.log(`  ✅ ${count} powers`);
  return count;
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
      console.log(`  📂 Found: ${path.basename(p)}`);
      break;
    }
  }

  if (!text) {
    console.warn('  ⚠️  Cities CSV not found');
    return 0;
  }

  const rows = parseCSV(text);
  await client.query('DELETE FROM cities');

  let count = 0;
  for (const row of rows) {
    const name = row.city || row.name;
    if (!name) continue;

    const id = `city_${name.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
    await client.query(
      `INSERT INTO cities (id, name, country, population, city_type, crime_index, safety_index, hvt_count, latitude, longitude)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        id,
        name,
        row.country || '',
        cleanInt(row.population),
        row.city_type || row.type || '',
        cleanInt(row.crime_index),
        cleanInt(row.safety_index),
        cleanInt(row.hvt_count),
        cleanFloat(row.latitude),
        cleanFloat(row.longitude)
      ]
    );
    count++;
  }

  console.log(`  ✅ ${count} cities`);
  return count;
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
      console.log(`  📂 Found: ${path.basename(p)}`);
      break;
    }
  }

  if (!text) {
    console.warn('  ⚠️  Countries CSV not found');
    return 0;
  }

  const rows = parseCSV(text);
  await client.query('DELETE FROM countries');

  let count = 0;
  for (const row of rows) {
    const name = row.country || row.name;
    if (!name) continue;

    const id = `country_${name.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
    await client.query(
      `INSERT INTO countries (id, name, region, government_type, population, education_level, faction)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        id,
        name,
        row.region || row.continent || '',
        row.government_type || row.government || '',
        cleanInt(row.population),
        row.education_level || '',
        cleanStr(row.faction)
      ]
    );
    count++;
  }

  console.log(`  ✅ ${count} countries`);
  return count;
}

// ============== MARTIAL ARTS ==============
async function migrateMartialArts() {
  console.log('📦 Migrating martial arts...');

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

  await client.query('DELETE FROM martial_arts_techniques');
  await client.query('DELETE FROM martial_arts_styles');

  for (const style of styles) {
    await client.query(
      `INSERT INTO martial_arts_styles (id, name, description, role, primary_stat)
       VALUES ($1, $2, $3, $4, $5)`,
      [style.id, style.name, style.description, style.role, style.primary_stat]
    );
  }

  for (const tech of techniques) {
    await client.query(
      `INSERT INTO martial_arts_techniques (id, style_id, name, belt_required, ap_cost, effect, damage, special)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [tech.id, tech.style_id, tech.name, tech.belt_required, tech.ap_cost, tech.effect, tech.damage, tech.special]
    );
  }

  console.log(`  ✅ ${styles.length} styles, ${techniques.length} techniques`);
  return styles.length + techniques.length;
}

// ============== STATUS EFFECTS ==============
async function migrateStatusEffects() {
  console.log('📦 Migrating status effects...');

  const effects = [
    { id: 'eff_bleeding', name: 'Bleeding', description: 'Consistent damage with movement/action penalty', duration_turns: 3, damage_per_turn: 5 },
    { id: 'eff_poisoned', name: 'Poisoned', description: 'Constantly reducing health', duration_turns: 5, damage_per_turn: 3 },
    { id: 'eff_stunned', name: 'Stunned', description: 'Unable to take turn, standing but unable to think', duration_turns: 1, damage_per_turn: 0 },
    { id: 'eff_blind', name: 'Blind', description: 'Unit is unable to target enemy', duration_turns: 2, damage_per_turn: 0 },
    { id: 'eff_burning', name: 'Burning', description: 'Increasing damage over time', duration_turns: 3, damage_per_turn: 8 },
    { id: 'eff_frozen', name: 'Frozen', description: 'Unit is immobile unless strength exceeds freeze rank', duration_turns: 2, damage_per_turn: 0 },
    { id: 'eff_prone', name: 'Prone', description: 'Not standing, takes 1-3 seconds to stand', duration_turns: 1, damage_per_turn: 0 },
    { id: 'eff_frightened', name: 'Frightened', description: 'Character flees uncontrollably', duration_turns: 2, damage_per_turn: 0 },
    { id: 'eff_berserk', name: 'Berserk', description: 'Uncontrolled attacks at enemies or allies', duration_turns: 3, damage_per_turn: 0 },
    { id: 'eff_unconscious', name: 'Unconscious', description: 'Knocked out', duration_turns: 5, damage_per_turn: 0 },
    { id: 'eff_restrained', name: 'Restrained', description: 'Cannot move or attack, can attempt escape', duration_turns: 0, damage_per_turn: 0 },
    { id: 'eff_silenced', name: 'Silenced', description: 'Cannot use powers', duration_turns: 2, damage_per_turn: 0 },
    { id: 'eff_slowed', name: 'Slowed', description: 'Movement reduced by half', duration_turns: 2, damage_per_turn: 0 },
    { id: 'eff_immobilized', name: 'Immobilized', description: 'Cannot move but can still act', duration_turns: 2, damage_per_turn: 0 },
  ];

  await client.query('DELETE FROM status_effects');

  for (const eff of effects) {
    await client.query(
      `INSERT INTO status_effects (id, name, description, duration_turns, damage_per_turn, can_stack)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [eff.id, eff.name, eff.description, eff.duration_turns, eff.damage_per_turn, false]
    );
  }

  console.log(`  ✅ ${effects.length} status effects`);
  return effects.length;
}

// ============== MAIN ==============
async function main() {
  console.log('🚀 SuperHero Tactics - Local PostgreSQL Migration\n');
  console.log(`📂 Source: ${ROOT}`);
  console.log(`🗄️ Database: localhost:54322/superhero_tactics\n`);

  try {
    await client.connect();
    console.log('✅ Connected to PostgreSQL\n');

    let total = 0;
    total += await migrateWeapons();
    total += await migrateSkills();
    total += await migratePowers();
    total += await migrateCities();
    total += await migrateCountries();
    total += await migrateStatusEffects();
    total += await migrateMartialArts();

    console.log(`\n✨ Done! Migrated ${total} total records`);

    // Quick verification
    console.log('\n📊 Verification:');
    const tables = ['weapons', 'skills', 'powers', 'cities', 'countries', 'status_effects', 'martial_arts_styles', 'martial_arts_techniques'];
    for (const table of tables) {
      const res = await client.query(`SELECT COUNT(*) FROM ${table}`);
      console.log(`   ${table}: ${res.rows[0].count} rows`);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

main();
