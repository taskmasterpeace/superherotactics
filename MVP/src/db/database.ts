/**
 * SQLite Database Layer for SuperHero Tactics
 * Uses sql.js (SQLite compiled to WebAssembly) for in-browser database
 * Data can be exported/imported for persistence
 * Future: Replace with Supabase connection
 */

import initSqlJs, { Database, SqlJsStatic } from 'sql.js';

let SQL: SqlJsStatic | null = null;
let db: Database | null = null;

// Database initialization status
let initPromise: Promise<Database> | null = null;

/**
 * Initialize the SQLite database
 * Call this once at app startup
 */
export async function initDatabase(): Promise<Database> {
  // Return existing promise if already initializing
  if (initPromise) return initPromise;

  initPromise = (async () => {
    // Initialize sql.js with WASM
    SQL = await initSqlJs({
      // Load sql-wasm.wasm from CDN
      locateFile: (file: string) => `https://sql.js.org/dist/${file}`
    });

    // Try to load saved database from localStorage
    const savedDb = localStorage.getItem('sht_database');
    if (savedDb) {
      try {
        const binaryArray = Uint8Array.from(atob(savedDb), c => c.charCodeAt(0));
        db = new SQL.Database(binaryArray);
        console.log('[DB] Loaded existing database from localStorage');
      } catch (e) {
        console.warn('[DB] Failed to load saved database, creating new one');
        db = new SQL.Database();
      }
    } else {
      db = new SQL.Database();
      console.log('[DB] Created new database');
    }

    // Create tables if they don't exist
    createTables();

    return db;
  })();

  return initPromise;
}

/**
 * Get the database instance (must call initDatabase first)
 */
export function getDatabase(): Database {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return db;
}

/**
 * Save database to localStorage for persistence
 */
export function saveDatabase(): void {
  if (!db) return;

  const data = db.export();
  const base64 = btoa(String.fromCharCode(...data));
  localStorage.setItem('sht_database', base64);
  console.log('[DB] Saved database to localStorage');
}

/**
 * Export database as downloadable file
 */
export function exportDatabase(): void {
  if (!db) return;

  const data = db.export();
  const blob = new Blob([data], { type: 'application/x-sqlite3' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'sht_database.sqlite';
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Create all database tables
 */
function createTables(): void {
  if (!db) return;

  // Weapons table
  db.run(`
    CREATE TABLE IF NOT EXISTS weapons (
      weapon_id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT,
      base_damage INTEGER,
      damage_type TEXT,
      sub_type TEXT,
      attack_speed REAL,
      range_squares INTEGER,
      accuracy_cs TEXT,
      reload_sec REAL,
      skill_required TEXT,
      str_required INTEGER,
      special_effects TEXT,
      penetration_mult REAL,
      default_ammo TEXT,
      magazine_size INTEGER,
      cost_level TEXT,
      availability TEXT,
      investigation_bonus TEXT,
      notes TEXT
    )
  `);

  // Gadgets/Tech table
  db.run(`
    CREATE TABLE IF NOT EXISTS gadgets (
      item_id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT,
      subcategory TEXT,
      speed_mph INTEGER,
      speed_squares_turn INTEGER,
      passengers INTEGER,
      cargo_lbs INTEGER,
      armor_hp INTEGER,
      armor_dr INTEGER,
      fuel_type TEXT,
      range_miles INTEGER,
      cost_level TEXT,
      availability TEXT,
      special_properties TEXT,
      notes TEXT
    )
  `);

  // Cities table
  db.run(`
    CREATE TABLE IF NOT EXISTS cities (
      city_id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      country TEXT,
      population INTEGER,
      city_type TEXT,
      crime_index INTEGER,
      safety_index INTEGER,
      hvt_count INTEGER,
      coordinates TEXT,
      notes TEXT
    )
  `);

  // Countries table
  db.run(`
    CREATE TABLE IF NOT EXISTS countries (
      country_id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      region TEXT,
      government_type TEXT,
      population INTEGER,
      education_level TEXT,
      economy_rank INTEGER,
      faction TEXT,
      notes TEXT
    )
  `);

  // Powers table
  db.run(`
    CREATE TABLE IF NOT EXISTS powers (
      power_id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      threat_level TEXT,
      origin_type TEXT,
      damage INTEGER,
      range_squares INTEGER,
      ap_cost INTEGER,
      cooldown INTEGER,
      special_effects TEXT,
      role TEXT,
      type TEXT,
      manifest TEXT,
      notes TEXT
    )
  `);

  // Skills table
  db.run(`
    CREATE TABLE IF NOT EXISTS skills (
      skill_id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT,
      description TEXT,
      stat_bonus TEXT,
      investigation_bonus TEXT,
      combat_bonus TEXT,
      notes TEXT
    )
  `);

  // Status Effects table
  db.run(`
    CREATE TABLE IF NOT EXISTS status_effects (
      effect_id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      duration_turns INTEGER,
      damage_per_turn INTEGER,
      stat_modifier TEXT,
      can_stack INTEGER,
      cure_method TEXT,
      notes TEXT
    )
  `);

  // Armor table
  db.run(`
    CREATE TABLE IF NOT EXISTS armor (
      armor_id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT,
      damage_reduction INTEGER,
      hp INTEGER,
      weight TEXT,
      coverage TEXT,
      special_properties TEXT,
      cost_level TEXT,
      availability TEXT,
      notes TEXT
    )
  `);

  // Characters template table
  db.run(`
    CREATE TABLE IF NOT EXISTS character_templates (
      template_id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      archetype TEXT,
      stats_mel INTEGER,
      stats_agl INTEGER,
      stats_str INTEGER,
      stats_sta INTEGER,
      stats_int INTEGER,
      stats_ins INTEGER,
      stats_con INTEGER,
      hp_base INTEGER,
      ap_base INTEGER,
      default_powers TEXT,
      default_equipment TEXT,
      notes TEXT
    )
  `);

  // Ammunition table
  db.run(`
    CREATE TABLE IF NOT EXISTS ammunition (
      ammo_id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      caliber TEXT,
      damage_modifier REAL,
      penetration_modifier REAL,
      special_effects TEXT,
      cost_level TEXT,
      availability TEXT,
      notes TEXT
    )
  `);

  // Factions table
  db.run(`
    CREATE TABLE IF NOT EXISTS factions (
      faction_id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT,
      allegiance TEXT,
      territory TEXT,
      resources TEXT,
      relations TEXT,
      notes TEXT
    )
  `);

  // Martial Arts table (NEW for your martial arts system)
  db.run(`
    CREATE TABLE IF NOT EXISTS martial_arts_styles (
      style_id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      primary_stat TEXT,
      role TEXT,
      description TEXT,
      techniques TEXT,
      notes TEXT
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS martial_arts_techniques (
      technique_id TEXT PRIMARY KEY,
      style_id TEXT,
      name TEXT NOT NULL,
      belt_required INTEGER,
      ap_cost INTEGER,
      damage INTEGER,
      effect TEXT,
      description TEXT,
      FOREIGN KEY (style_id) REFERENCES martial_arts_styles(style_id)
    )
  `);

  console.log('[DB] Tables created/verified');
}

/**
 * Execute a SELECT query and return results
 */
export function query<T = Record<string, unknown>>(sql: string, params: unknown[] = []): T[] {
  if (!db) throw new Error('Database not initialized');

  const stmt = db.prepare(sql);
  stmt.bind(params);

  const results: T[] = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject() as T);
  }
  stmt.free();

  return results;
}

/**
 * Execute an INSERT/UPDATE/DELETE statement
 */
export function execute(sql: string, params: unknown[] = []): void {
  if (!db) throw new Error('Database not initialized');
  db.run(sql, params);
}

/**
 * Insert multiple rows efficiently
 */
export function insertMany(table: string, columns: string[], rows: unknown[][]): void {
  if (!db || rows.length === 0) return;

  const placeholders = columns.map(() => '?').join(', ');
  const sql = `INSERT OR REPLACE INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`;

  for (const row of rows) {
    db.run(sql, row);
  }
}

/**
 * Clear all data from database (for reimporting)
 */
export function clearDatabase(): void {
  if (!db) return;

  const tables = [
    'weapons', 'gadgets', 'cities', 'countries', 'powers',
    'skills', 'status_effects', 'armor', 'character_templates',
    'ammunition', 'factions', 'martial_arts_styles', 'martial_arts_techniques'
  ];

  for (const table of tables) {
    db.run(`DELETE FROM ${table}`);
  }

  console.log('[DB] All tables cleared');
}

// Auto-save on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    saveDatabase();
  });
}
