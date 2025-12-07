/**
 * Database Module for SuperHero Tactics
 *
 * Usage:
 *   import { initDatabase, getAllWeapons, getWeaponById } from './db';
 *
 *   // Initialize at app startup
 *   await initDatabase();
 *
 *   // Query data
 *   const weapons = getAllWeapons();
 *   const pistol = getWeaponById('RNG_002');
 */

// Database core
export {
  initDatabase,
  getDatabase,
  saveDatabase,
  exportDatabase,
  clearDatabase,
  query,
  execute,
  insertMany,
} from './database';

// CSV Import
export { importAllData, importCSVText } from './csvImporter';

// Types
export * from './types';

// Query functions
export * from './queries';
