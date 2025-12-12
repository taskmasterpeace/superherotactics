/**
 * SuperHero Tactics - Complete Database Migration
 * Migrates ALL data from CSV files into PostgreSQL
 *
 * Run: node scripts/migrate-complete.js
 */

const fs = require('fs');
const path = require('path');
const { parse } = require('papaparse');
const { Client } = require('pg');

// PostgreSQL connection to local Supabase
const client = new Client({
  host: 'localhost',
  port: 54322,
  database: 'superhero_tactics',
  user: 'postgres',
  password: 'postgres',
});

// Root path to CSV files
const ROOT = path.join(__dirname, '..', '..');

// ============== HELPER FUNCTIONS ==============

function loadCSV(filePath) {
  const fullPath = path.join(ROOT, filePath);
  if (!fs.existsSync(fullPath)) {
    console.log(`  ⚠️  File not found: ${filePath}`);
    return [];
  }
  const content = fs.readFileSync(fullPath, 'utf-8');
  const result = parse(content, { header: true, skipEmptyLines: true });
  return result.data;
}

function cleanValue(val) {
  if (val === undefined || val === null || val === '' || val === '-') return null;
  return val;
}

function cleanNumber(val, defaultVal = null) {
  if (val === undefined || val === null || val === '' || val === '-') return defaultVal;
  const num = parseFloat(val);
  return isNaN(num) ? defaultVal : num;
}

function cleanInt(val, defaultVal = null) {
  if (val === undefined || val === null || val === '' || val === '-') return defaultVal;
  const num = parseInt(val, 10);
  return isNaN(num) ? defaultVal : num;
}

function generateId(name, prefix = '') {
  if (!name) return prefix + '_unknown_' + Math.random().toString(36).substr(2, 6);
  return (prefix ? prefix + '_' : '') + name.toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
    .substring(0, 50);
}

// ============== MATERIALS DATA ==============

const MATERIALS = [
  { id: 'steel', name: 'Steel', density: 7.8, durability: 80, conductivity: 0.7, magnetism: 0.9, flammability: 0, rarity: 'Common' },
  { id: 'iron', name: 'Iron', density: 7.9, durability: 70, conductivity: 0.6, magnetism: 1.0, flammability: 0, rarity: 'Common' },
  { id: 'aluminum', name: 'Aluminum', density: 2.7, durability: 50, conductivity: 0.9, magnetism: 0, flammability: 0, rarity: 'Common' },
  { id: 'titanium', name: 'Titanium', density: 4.5, durability: 95, conductivity: 0.3, magnetism: 0, flammability: 0, rarity: 'Uncommon' },
  { id: 'carbon_fiber', name: 'Carbon Fiber', density: 1.8, durability: 85, conductivity: 0.8, magnetism: 0, flammability: 0.1, rarity: 'Uncommon' },
  { id: 'kevlar', name: 'Kevlar', density: 1.4, durability: 75, conductivity: 0, magnetism: 0, flammability: 0.2, rarity: 'Uncommon' },
  { id: 'plastic', name: 'Plastic', density: 1.2, durability: 40, conductivity: 0, magnetism: 0, flammability: 0.6, rarity: 'Common' },
  { id: 'ceramic', name: 'Ceramic', density: 3.5, durability: 60, conductivity: 0, magnetism: 0, flammability: 0, rarity: 'Common' },
  { id: 'wood', name: 'Wood', density: 0.7, durability: 30, conductivity: 0, magnetism: 0, flammability: 0.9, rarity: 'Common' },
  { id: 'leather', name: 'Leather', density: 0.9, durability: 45, conductivity: 0, magnetism: 0, flammability: 0.5, rarity: 'Common' },
  { id: 'glass', name: 'Glass', density: 2.5, durability: 20, conductivity: 0, magnetism: 0, flammability: 0, rarity: 'Common' },
  { id: 'copper', name: 'Copper', density: 8.9, durability: 55, conductivity: 1.0, magnetism: 0, flammability: 0, rarity: 'Common' },
  { id: 'gold', name: 'Gold', density: 19.3, durability: 40, conductivity: 0.95, magnetism: 0, flammability: 0, rarity: 'Rare' },
  { id: 'silver', name: 'Silver', density: 10.5, durability: 50, conductivity: 1.0, magnetism: 0, flammability: 0, rarity: 'Uncommon' },
  { id: 'tungsten', name: 'Tungsten', density: 19.3, durability: 99, conductivity: 0.3, magnetism: 0, flammability: 0, rarity: 'Rare' },
  { id: 'adamantium', name: 'Indestructium', density: 12.0, durability: 100, conductivity: 0.2, magnetism: 0.3, flammability: 0, rarity: 'Exotic' },
  { id: 'absorbium', name: 'Absorbium', density: 8.0, durability: 100, conductivity: 0.1, magnetism: 0, flammability: 0, rarity: 'Exotic' },
  { id: 'mythril', name: 'Mythril', density: 3.0, durability: 95, conductivity: 0.5, magnetism: 0.1, flammability: 0, rarity: 'Exotic' },
  { id: 'energy', name: 'Pure Energy', density: 0, durability: 100, conductivity: 1.0, magnetism: 0, flammability: 0, rarity: 'Exotic' },
  { id: 'organic', name: 'Organic Matter', density: 1.0, durability: 30, conductivity: 0.1, magnetism: 0, flammability: 0.7, rarity: 'Common' },
];

// ============== FACTIONS DATA ==============

const FACTIONS = [
  { id: 'us_gov', name: 'United States Government', headquarters_city: 'Washington DC', headquarters_country: 'USA', ideology: 'Democratic Superpower', color: '#1a365d' },
  { id: 'india_gov', name: 'Republic of India', headquarters_city: 'New Delhi', headquarters_country: 'India', ideology: 'Democratic Rising Power', color: '#ff6b00' },
  { id: 'china_gov', name: "People's Republic of China", headquarters_city: 'Beijing', headquarters_country: 'China', ideology: 'Communist Superpower', color: '#c41e3a' },
  { id: 'nigeria_gov', name: 'Federal Republic of Nigeria', headquarters_city: 'Abuja', headquarters_country: 'Nigeria', ideology: 'African Powerhouse', color: '#008751' },
  { id: 'un', name: 'United Nations', headquarters_city: 'New York', headquarters_country: 'USA', ideology: 'International Cooperation', color: '#009edb' },
  { id: 'hydra', name: 'HYDRA', headquarters_city: 'Unknown', headquarters_country: 'Unknown', ideology: 'World Domination', color: '#2d5016' },
  { id: 'aim', name: 'A.I.M.', headquarters_city: 'Mobile', headquarters_country: 'International', ideology: 'Scientific Supremacy', color: '#ffd700' },
  { id: 'shield', name: 'S.H.I.E.L.D.', headquarters_city: 'New York', headquarters_country: 'USA', ideology: 'Global Protection', color: '#1c1c1c' },
  { id: 'xmen', name: 'X-Gene Alliance', headquarters_city: 'Westchester', headquarters_country: 'USA', ideology: 'Mutant Rights', color: '#ffd700' },
  { id: 'avengers', name: 'Avengers Initiative', headquarters_city: 'New York', headquarters_country: 'USA', ideology: 'Earth Protection', color: '#c41e3a' },
  { id: 'justice_league', name: 'Justice Coalition', headquarters_city: 'Metropolis', headquarters_country: 'USA', ideology: 'Truth and Justice', color: '#0047ab' },
  { id: 'syndicate', name: 'The Syndicate', headquarters_city: 'Gotham', headquarters_country: 'USA', ideology: 'Organized Crime', color: '#4a0080' },
];

// ============== FAMOUS CHARACTERS (Play on Words Names) ==============

const FAMOUS_CHARACTERS = [
  // Marvel-inspired
  {
    id: 'char_iron_dan',
    name: 'Dan Stark',
    alias: 'Steelheart',
    real_name: 'Daniel Stark',
    age: 45,
    gender: 'Male',
    nationality: 'USA',
    faction_id: 'avengers',
    origin_type: 'Tech',
    threat_level: 'THREAT_4',
    mel: 55, agl: 50, str: 85, sta: 70, int: 150, ins: 80, con: 90,
    personality_type: 8,
    personality_traits: 'Genius, Arrogant, Charming, Self-sacrificing',
    motivation_rating: 7,
    harm_potential: 4,
    education_level: 'EDU_12',
    career_category: 'Tech',
    career_rank: 5,
    weakness_1: 'Heart condition requires arc reactor',
    weakness_2: 'Ego and alcoholism',
    appearance: 'Tall, goatee, well-dressed billionaire',
    backstory: 'Weapons manufacturer turned hero after being captured by terrorists',
    resource_level: 'Elite',
    fame: 95,
    infamy: 15,
    has_secret_identity: false,
    current_country: 'USA',
    current_city: 'New York',
  },
  {
    id: 'char_captain_usa',
    name: 'Steve Rodgers',
    alias: 'Sentinel',
    real_name: 'Steven Rodgers',
    age: 105,
    gender: 'Male',
    nationality: 'USA',
    faction_id: 'avengers',
    origin_type: 'Altered',
    threat_level: 'THREAT_3',
    mel: 120, agl: 90, str: 100, sta: 100, int: 70, ins: 85, con: 95,
    personality_type: 1,
    personality_traits: 'Noble, Brave, Stubborn, Old-fashioned',
    motivation_rating: 2,
    harm_potential: 2,
    education_level: 'EDU_06',
    career_category: 'Combat',
    career_rank: 5,
    weakness_1: 'Out of time - struggles with modern world',
    weakness_2: 'Too trusting of authority',
    appearance: 'Tall, muscular, blonde, clean-cut soldier',
    backstory: 'WWII super soldier frozen in ice for 70 years',
    resource_level: 'Medium',
    fame: 90,
    infamy: 5,
    has_secret_identity: false,
    current_country: 'USA',
    current_city: 'New York',
  },
  {
    id: 'char_spider_guy',
    name: 'Pete Parker',
    alias: 'The Spider',
    real_name: 'Peter Parker',
    age: 22,
    gender: 'Male',
    nationality: 'USA',
    faction_id: 'avengers',
    origin_type: 'Altered',
    threat_level: 'THREAT_3',
    mel: 100, agl: 130, str: 90, sta: 80, int: 120, ins: 110, con: 75,
    personality_type: 3,
    personality_traits: 'Witty, Responsible, Self-doubting, Caring',
    motivation_rating: 2,
    harm_potential: 1,
    education_level: 'EDU_09',
    career_category: 'Academic',
    career_rank: 2,
    weakness_1: 'Guilt complex over uncle\'s death',
    weakness_2: 'Spreads himself too thin',
    appearance: 'Young, athletic, nerdy when out of costume',
    backstory: 'High school student bitten by radioactive spider',
    resource_level: 'Low',
    fame: 70,
    infamy: 30,
    has_secret_identity: true,
    civilian_job: 'Photographer',
    current_country: 'USA',
    current_city: 'New York',
  },
  {
    id: 'char_thunder_god',
    name: 'Thor Odinson',
    alias: 'Thunderstrike',
    real_name: 'Thor Odinson',
    age: 1500,
    gender: 'Male',
    nationality: 'Asgard',
    faction_id: 'avengers',
    origin_type: 'Divine',
    threat_level: 'THREAT_5',
    mel: 110, agl: 80, str: 150, sta: 150, int: 60, ins: 70, con: 85,
    personality_type: 5,
    personality_traits: 'Noble, Boisterous, Brave, Sometimes naive',
    motivation_rating: 3,
    harm_potential: 3,
    education_level: 'EDU_10',
    career_category: 'Combat',
    career_rank: 5,
    weakness_1: 'Arrogance and pride',
    weakness_2: 'Family drama with Loki',
    appearance: 'Tall, extremely muscular, long blonde hair, red cape',
    backstory: 'Norse god of thunder, prince of Asgard',
    resource_level: 'Elite',
    fame: 85,
    infamy: 10,
    has_secret_identity: false,
    current_country: 'USA',
    current_city: 'New York',
  },
  {
    id: 'char_dark_widow',
    name: 'Natasha Romanoff',
    alias: 'Dark Widow',
    real_name: 'Natalia Romanova',
    age: 35,
    gender: 'Female',
    nationality: 'Russia',
    faction_id: 'shield',
    origin_type: 'Skilled',
    threat_level: 'THREAT_2',
    mel: 120, agl: 110, str: 50, sta: 70, int: 95, ins: 100, con: 90,
    personality_type: 9,
    personality_traits: 'Deadly, Secretive, Loyal, Haunted by past',
    motivation_rating: 4,
    harm_potential: 6,
    education_level: 'EDU_08',
    career_category: 'Combat',
    career_rank: 5,
    weakness_1: 'Red Room programming can be triggered',
    weakness_2: 'Guilt over past assassinations',
    appearance: 'Athletic, red hair, striking beauty',
    backstory: 'Former KGB assassin turned hero',
    resource_level: 'High',
    fame: 60,
    infamy: 40,
    has_secret_identity: false,
    current_country: 'USA',
    current_city: 'New York',
  },
  {
    id: 'char_bulk',
    name: 'Bruce Banner',
    alias: 'Goliath',
    real_name: 'Robert Bruce Banner',
    age: 42,
    gender: 'Male',
    nationality: 'USA',
    faction_id: 'avengers',
    origin_type: 'Altered',
    threat_level: 'THREAT_5',
    mel: 40, agl: 30, str: 200, sta: 200, int: 140, ins: 60, con: 40,
    personality_type: 12,
    personality_traits: 'Brilliant, Tortured, Rage issues, Pacifist when calm',
    motivation_rating: 5,
    harm_potential: 9,
    education_level: 'EDU_12',
    career_category: 'Academic',
    career_rank: 5,
    weakness_1: 'Cannot control transformation when angry',
    weakness_2: 'Mental instability',
    appearance: 'Normal: mild-mannered scientist. Transformed: 8ft green monster',
    backstory: 'Gamma radiation accident created the Bulk persona',
    resource_level: 'Medium',
    fame: 75,
    infamy: 60,
    has_secret_identity: false,
    current_country: 'USA',
    current_city: 'New York',
  },
  {
    id: 'char_prof_x',
    name: 'Charles Xavier',
    alias: 'The Mentalist',
    real_name: 'Charles Francis Xavier',
    age: 65,
    gender: 'Male',
    nationality: 'USA',
    faction_id: 'xmen',
    origin_type: 'Mutant',
    threat_level: 'THREAT_5',
    mel: 20, agl: 20, str: 20, sta: 40, int: 150, ins: 140, con: 150,
    personality_type: 1,
    personality_traits: 'Wise, Compassionate, Manipulative when necessary, Idealistic',
    motivation_rating: 2,
    harm_potential: 3,
    education_level: 'EDU_12',
    career_category: 'Academic',
    career_rank: 5,
    weakness_1: 'Paralyzed from waist down',
    weakness_2: 'Telepathy can be blocked by special materials',
    appearance: 'Bald, distinguished, wheelchair-bound',
    backstory: 'World\'s most powerful telepath, founder of mutant school',
    resource_level: 'Elite',
    fame: 80,
    infamy: 20,
    has_secret_identity: false,
    current_country: 'USA',
    current_city: 'Westchester',
  },
  {
    id: 'char_magnos',
    name: 'Erik Lehnsherr',
    alias: 'Ferros',
    real_name: 'Max Eisenhardt',
    age: 85,
    gender: 'Male',
    nationality: 'Germany',
    faction_id: 'xmen',
    origin_type: 'Mutant',
    threat_level: 'THREAT_5',
    mel: 70, agl: 50, str: 60, sta: 80, int: 120, ins: 90, con: 110,
    personality_type: 16,
    personality_traits: 'Ruthless, Charismatic, Traumatized, Extremist',
    motivation_rating: 8,
    harm_potential: 9,
    education_level: 'EDU_10',
    career_category: 'Combat',
    career_rank: 5,
    weakness_1: 'Non-metallic attacks bypass his shield',
    weakness_2: 'Holocaust trauma affects judgment',
    appearance: 'Tall, silver hair, imposing presence, helmet',
    backstory: 'Holocaust survivor, master of magnetism, fights for mutant supremacy',
    resource_level: 'High',
    fame: 70,
    infamy: 85,
    has_secret_identity: false,
    current_country: 'Germany',
    current_city: 'Berlin',
  },
  {
    id: 'char_wolverine',
    name: 'Logan Howlett',
    alias: 'Feral',
    real_name: 'James Howlett',
    age: 150,
    gender: 'Male',
    nationality: 'Canada',
    faction_id: 'xmen',
    origin_type: 'Mutant',
    threat_level: 'THREAT_4',
    mel: 130, agl: 100, str: 80, sta: 150, int: 60, ins: 110, con: 70,
    personality_type: 14,
    personality_traits: 'Gruff, Loner, Berserker rage, Protective of innocents',
    motivation_rating: 5,
    harm_potential: 8,
    education_level: 'EDU_06',
    career_category: 'Combat',
    career_rank: 5,
    weakness_1: 'Berserker rage makes him lose control',
    weakness_2: 'Magnetism can manipulate his skeleton',
    appearance: 'Short, extremely muscular, wild hair, adamantium claws',
    backstory: 'Mutant with healing factor and adamantium skeleton',
    resource_level: 'Medium',
    fame: 65,
    infamy: 55,
    has_secret_identity: false,
    current_country: 'USA',
    current_city: 'Westchester',
  },
  // DC-inspired
  {
    id: 'char_superdude',
    name: 'Clark Kent',
    alias: 'Paragon',
    real_name: 'Kal-El',
    age: 35,
    gender: 'Male',
    nationality: 'USA',
    faction_id: 'justice_league',
    origin_type: 'Alien',
    threat_level: 'THREAT_5',
    mel: 90, agl: 100, str: 200, sta: 200, int: 80, ins: 90, con: 100,
    personality_type: 1,
    personality_traits: 'Hopeful, Idealistic, Humble despite power, Boy scout',
    motivation_rating: 1,
    harm_potential: 1,
    education_level: 'EDU_09',
    career_category: 'Civilian',
    career_rank: 3,
    weakness_1: 'Kryptonite radiation',
    weakness_2: 'Magic bypasses his defenses',
    appearance: 'Tall, muscular, black hair, blue eyes, iconic S symbol',
    backstory: 'Last son of Krypton, raised on Earth farm',
    resource_level: 'Medium',
    fame: 100,
    infamy: 0,
    has_secret_identity: true,
    civilian_job: 'Reporter',
    current_country: 'USA',
    current_city: 'Metropolis',
  },
  {
    id: 'char_bat_dude',
    name: 'Bruce Wayne',
    alias: 'The Shadow',
    real_name: 'Bruce Thomas Wayne',
    age: 42,
    gender: 'Male',
    nationality: 'USA',
    faction_id: 'justice_league',
    origin_type: 'Skilled',
    threat_level: 'THREAT_3',
    mel: 140, agl: 120, str: 70, sta: 80, int: 140, ins: 130, con: 100,
    personality_type: 9,
    personality_traits: 'Obsessive, Prepared, Lonely, Driven by trauma',
    motivation_rating: 3,
    harm_potential: 4,
    education_level: 'EDU_11',
    career_category: 'Combat',
    career_rank: 5,
    weakness_1: 'Refuses to kill - can be exploited',
    weakness_2: 'Obsession damages relationships',
    appearance: 'Tall, athletic, dark hair, scarred body',
    backstory: 'Orphaned billionaire who wages war on crime',
    resource_level: 'Elite',
    fame: 95,
    infamy: 35,
    has_secret_identity: true,
    civilian_job: 'CEO',
    current_country: 'USA',
    current_city: 'Gotham',
  },
  {
    id: 'char_wonder_lady',
    name: 'Diana Prince',
    alias: 'Valkyrie',
    real_name: 'Diana of Themyscira',
    age: 800,
    gender: 'Female',
    nationality: 'Greece',
    faction_id: 'justice_league',
    origin_type: 'Divine',
    threat_level: 'THREAT_5',
    mel: 130, agl: 110, str: 150, sta: 150, int: 90, ins: 100, con: 110,
    personality_type: 1,
    personality_traits: 'Warrior, Compassionate, Fierce, Ambassador',
    motivation_rating: 2,
    harm_potential: 3,
    education_level: 'EDU_10',
    career_category: 'Combat',
    career_rank: 5,
    weakness_1: 'Bound by her bracelets - removing them causes berserker rage',
    weakness_2: 'Naive about modern deception',
    appearance: 'Tall, athletic Amazon, dark hair, warrior armor',
    backstory: 'Amazon princess, daughter of Zeus, ambassador to mankind',
    resource_level: 'High',
    fame: 85,
    infamy: 5,
    has_secret_identity: true,
    civilian_job: 'Museum Curator',
    current_country: 'USA',
    current_city: 'Washington DC',
  },
  {
    id: 'char_flash_runner',
    name: 'Barry Allen',
    alias: 'Blur',
    real_name: 'Bartholomew Henry Allen',
    age: 28,
    gender: 'Male',
    nationality: 'USA',
    faction_id: 'justice_league',
    origin_type: 'Altered',
    threat_level: 'THREAT_4',
    mel: 80, agl: 200, str: 50, sta: 90, int: 110, ins: 85, con: 75,
    personality_type: 3,
    personality_traits: 'Nerdy, Optimistic, Always late ironically, Heroic',
    motivation_rating: 2,
    harm_potential: 2,
    education_level: 'EDU_10',
    career_category: 'Medical',
    career_rank: 3,
    weakness_1: 'Cold temperatures slow him down',
    weakness_2: 'Time travel causes paradoxes',
    appearance: 'Athletic, blonde, friendly face, red suit',
    backstory: 'Forensic scientist struck by lightning and chemicals',
    resource_level: 'Medium',
    fame: 75,
    infamy: 5,
    has_secret_identity: true,
    civilian_job: 'Forensic Scientist',
    current_country: 'USA',
    current_city: 'Central City',
  },
  // Villains
  {
    id: 'char_joking_man',
    name: 'Jack Napier',
    alias: 'The Joking Man',
    real_name: 'Unknown',
    age: 40,
    gender: 'Male',
    nationality: 'USA',
    faction_id: 'syndicate',
    origin_type: 'Altered',
    threat_level: 'THREAT_4',
    mel: 80, agl: 70, str: 40, sta: 50, int: 140, ins: 60, con: 30,
    personality_type: 20,
    personality_traits: 'Chaotic, Genius, Sadistic, Obsessed with Bat-Dude',
    motivation_rating: 10,
    harm_potential: 10,
    education_level: 'EDU_08',
    career_category: 'Criminal',
    career_rank: 5,
    weakness_1: 'Obsession with Bat-Dude overrides logic',
    weakness_2: 'Relies on henchmen who often fail',
    appearance: 'Pale white skin, green hair, permanent smile, purple suit',
    backstory: 'Origin unknown, clown prince of crime',
    resource_level: 'High',
    fame: 30,
    infamy: 100,
    has_secret_identity: false,
    current_country: 'USA',
    current_city: 'Gotham',
  },
  {
    id: 'char_lex_luther',
    name: 'Lex Luther',
    alias: 'The Mastermind',
    real_name: 'Alexander Joseph Luther',
    age: 50,
    gender: 'Male',
    nationality: 'USA',
    faction_id: 'syndicate',
    origin_type: 'Skilled',
    threat_level: 'THREAT_3',
    mel: 50, agl: 40, str: 40, sta: 50, int: 160, ins: 90, con: 100,
    personality_type: 8,
    personality_traits: 'Genius, Megalomaniac, Charming, Xenophobic',
    motivation_rating: 9,
    harm_potential: 8,
    education_level: 'EDU_12',
    career_category: 'Tech',
    career_rank: 5,
    weakness_1: 'Ego blinds him to his own flaws',
    weakness_2: 'Obsession with Super-Dude wastes resources',
    appearance: 'Bald, well-dressed, imposing businessman',
    backstory: 'Genius billionaire who sees aliens as threats to humanity',
    resource_level: 'Elite',
    fame: 90,
    infamy: 40,
    has_secret_identity: false,
    current_country: 'USA',
    current_city: 'Metropolis',
  },
  {
    id: 'char_doctor_death',
    name: 'Victor Von Doom',
    alias: 'Doctor Death',
    real_name: 'Victor Von Doom',
    age: 45,
    gender: 'Male',
    nationality: 'Latveria',
    faction_id: 'hydra',
    origin_type: 'Tech',
    threat_level: 'THREAT_5',
    mel: 90, agl: 60, str: 80, sta: 90, int: 160, ins: 100, con: 120,
    personality_type: 16,
    personality_traits: 'Arrogant, Genius, Honorable in his own way, Ruler',
    motivation_rating: 8,
    harm_potential: 9,
    education_level: 'EDU_12',
    career_category: 'Tech',
    career_rank: 5,
    weakness_1: 'Pride prevents asking for help',
    weakness_2: 'Scarred face is psychological weakness',
    appearance: 'Iron mask, green cloak, full armor, imposing figure',
    backstory: 'Ruler of Latveria, master of science and sorcery',
    resource_level: 'Elite',
    fame: 75,
    infamy: 90,
    has_secret_identity: false,
    current_country: 'Latveria',
    current_city: 'Doomstadt',
  },
  // More heroes
  {
    id: 'char_green_bowman',
    name: 'Oliver Queen',
    alias: 'The Archer',
    real_name: 'Oliver Jonas Queen',
    age: 38,
    gender: 'Male',
    nationality: 'USA',
    faction_id: 'justice_league',
    origin_type: 'Skilled',
    threat_level: 'THREAT_2',
    mel: 100, agl: 120, str: 60, sta: 70, int: 80, ins: 95, con: 85,
    personality_type: 7,
    personality_traits: 'Outspoken, Progressive, Hot-headed, Loyal',
    motivation_rating: 3,
    harm_potential: 5,
    education_level: 'EDU_09',
    career_category: 'Combat',
    career_rank: 4,
    weakness_1: 'No superpowers - relies on equipment',
    weakness_2: 'Impulsive decisions',
    appearance: 'Athletic, blonde goatee, green hood and costume',
    backstory: 'Billionaire stranded on island, became master archer',
    resource_level: 'Elite',
    fame: 65,
    infamy: 20,
    has_secret_identity: true,
    civilian_job: 'CEO',
    current_country: 'USA',
    current_city: 'Star City',
  },
  {
    id: 'char_hawk_girl',
    name: 'Shiera Hall',
    alias: 'Hawkwing',
    real_name: 'Shayera Hol',
    age: 30,
    gender: 'Female',
    nationality: 'Egypt',
    faction_id: 'justice_league',
    origin_type: 'Alien',
    threat_level: 'THREAT_3',
    mel: 110, agl: 100, str: 80, sta: 85, int: 70, ins: 90, con: 80,
    personality_type: 14,
    personality_traits: 'Warrior, Fierce, Loyal, Reincarnated soul',
    motivation_rating: 4,
    harm_potential: 5,
    education_level: 'EDU_08',
    career_category: 'Combat',
    career_rank: 4,
    weakness_1: 'Past lives create confusion',
    weakness_2: 'Nth metal dependency',
    appearance: 'Athletic, wings, hawk mask, mace',
    backstory: 'Thanagarian warrior with Nth metal wings',
    resource_level: 'Medium',
    fame: 55,
    infamy: 15,
    has_secret_identity: true,
    civilian_job: 'Archaeologist',
    current_country: 'USA',
    current_city: 'St. Roch',
  },
];

// ============== CHARACTER POWERS MAPPING ==============

const CHARACTER_POWERS = [
  // Iron Dan (Steelheart) - Full Tech powers
  { character_id: 'char_iron_dan', power_id: 'pwr_flight', power_level: 'High', power_rank: 80, slot_number: 1 },
  { character_id: 'char_iron_dan', power_id: 'pwr_energy_blast', power_level: 'High', power_rank: 85, slot_number: 2 },
  { character_id: 'char_iron_dan', power_id: 'pwr_super_strength', power_level: 'Low', power_rank: 60, slot_number: 3 },
  { character_id: 'char_iron_dan', power_id: 'pwr_repulsor_blast', power_level: 'High', power_rank: 90, slot_number: 4 },
  { character_id: 'char_iron_dan', power_id: 'pwr_power_armor', power_level: 'High', power_rank: 100, slot_number: 5 },
  { character_id: 'char_iron_dan', power_id: 'pwr_missiles', power_level: 'High', power_rank: 85, slot_number: 6 },

  // Captain USA (Sentinel) - Enhanced human
  { character_id: 'char_captain_usa', power_id: 'pwr_super_strength', power_level: 'Low', power_rank: 70, slot_number: 1 },
  { character_id: 'char_captain_usa', power_id: 'pwr_super_agility', power_level: 'Low', power_rank: 75, slot_number: 2 },
  { character_id: 'char_captain_usa', power_id: 'pwr_regeneration', power_level: 'Low', power_rank: 50, slot_number: 3 },

  // Spider-Guy (The Spider)
  { character_id: 'char_spider_guy', power_id: 'pwr_super_agility', power_level: 'High', power_rank: 90, slot_number: 1 },
  { character_id: 'char_spider_guy', power_id: 'pwr_super_strength', power_level: 'Low', power_rank: 65, slot_number: 2 },
  { character_id: 'char_spider_guy', power_id: 'pwr_wall_crawling', power_level: 'High', power_rank: 100, slot_number: 3 },
  { character_id: 'char_spider_guy', power_id: 'pwr_danger_sense', power_level: 'High', power_rank: 85, slot_number: 4 },

  // Thunder God (Thunderstrike)
  { character_id: 'char_thunder_god', power_id: 'pwr_super_strength', power_level: 'High', power_rank: 100, slot_number: 1 },
  { character_id: 'char_thunder_god', power_id: 'pwr_flight', power_level: 'High', power_rank: 90, slot_number: 2 },
  { character_id: 'char_thunder_god', power_id: 'pwr_lightning_control', power_level: 'High', power_rank: 100, slot_number: 3 },
  { character_id: 'char_thunder_god', power_id: 'pwr_invulnerability', power_level: 'High', power_rank: 90, slot_number: 4 },

  // Bulk (Goliath)
  { character_id: 'char_bulk', power_id: 'pwr_super_strength', power_level: 'High', power_rank: 150, slot_number: 1 },
  { character_id: 'char_bulk', power_id: 'pwr_invulnerability', power_level: 'High', power_rank: 120, slot_number: 2 },
  { character_id: 'char_bulk', power_id: 'pwr_regeneration', power_level: 'High', power_rank: 100, slot_number: 3 },

  // Professor X (The Mentalist)
  { character_id: 'char_prof_x', power_id: 'pwr_telepathy', power_level: 'High', power_rank: 150, slot_number: 1 },
  { character_id: 'char_prof_x', power_id: 'pwr_mind_control', power_level: 'High', power_rank: 120, slot_number: 2 },

  // Magnos (Ferros)
  { character_id: 'char_magnos', power_id: 'pwr_magnetism', power_level: 'High', power_rank: 130, slot_number: 1 },
  { character_id: 'char_magnos', power_id: 'pwr_flight', power_level: 'Low', power_rank: 60, slot_number: 2 },
  { character_id: 'char_magnos', power_id: 'pwr_force_field', power_level: 'High', power_rank: 100, slot_number: 3 },

  // Badger (Feral)
  { character_id: 'char_wolverine', power_id: 'pwr_regeneration', power_level: 'High', power_rank: 150, slot_number: 1 },
  { character_id: 'char_wolverine', power_id: 'pwr_enhanced_senses', power_level: 'High', power_rank: 90, slot_number: 2 },
  { character_id: 'char_wolverine', power_id: 'pwr_claws', power_level: 'High', power_rank: 100, slot_number: 3 },

  // Super-Dude (Paragon)
  { character_id: 'char_superdude', power_id: 'pwr_super_strength', power_level: 'High', power_rank: 150, slot_number: 1 },
  { character_id: 'char_superdude', power_id: 'pwr_flight', power_level: 'High', power_rank: 120, slot_number: 2 },
  { character_id: 'char_superdude', power_id: 'pwr_invulnerability', power_level: 'High', power_rank: 130, slot_number: 3 },
  { character_id: 'char_superdude', power_id: 'pwr_heat_vision', power_level: 'High', power_rank: 100, slot_number: 4 },
  { character_id: 'char_superdude', power_id: 'pwr_super_speed', power_level: 'High', power_rank: 100, slot_number: 5 },

  // Bat-Dude (The Shadow) - No powers, just skills

  // Wonder Lady (Valkyrie)
  { character_id: 'char_wonder_lady', power_id: 'pwr_super_strength', power_level: 'High', power_rank: 110, slot_number: 1 },
  { character_id: 'char_wonder_lady', power_id: 'pwr_flight', power_level: 'High', power_rank: 90, slot_number: 2 },
  { character_id: 'char_wonder_lady', power_id: 'pwr_invulnerability', power_level: 'High', power_rank: 100, slot_number: 3 },

  // Flash Runner (Blur)
  { character_id: 'char_flash_runner', power_id: 'pwr_super_speed', power_level: 'High', power_rank: 150, slot_number: 1 },
  { character_id: 'char_flash_runner', power_id: 'pwr_time_manipulation', power_level: 'Low', power_rank: 50, slot_number: 2 },

  // Doctor Death (Victor Von Doom) - Tech/Magic hybrid
  { character_id: 'char_doctor_death', power_id: 'pwr_force_field', power_level: 'High', power_rank: 110, slot_number: 1 },
  { character_id: 'char_doctor_death', power_id: 'pwr_energy_blast', power_level: 'High', power_rank: 100, slot_number: 2 },
  { character_id: 'char_doctor_death', power_id: 'pwr_flight', power_level: 'High', power_rank: 80, slot_number: 3 },

  // Hawk Girl (Hawkwing) - Nth Metal
  { character_id: 'char_hawk_girl', power_id: 'pwr_flight', power_level: 'High', power_rank: 90, slot_number: 1 },
  { character_id: 'char_hawk_girl', power_id: 'pwr_super_strength', power_level: 'Low', power_rank: 70, slot_number: 2 },
];

// ============== MIGRATION FUNCTIONS ==============

async function migrateMaterials() {
  console.log('\n📦 Migrating Materials...');
  let count = 0;

  for (const mat of MATERIALS) {
    try {
      await client.query(`
        INSERT INTO materials (id, name, density, durability, conductivity, magnetism, flammability, rarity)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          density = EXCLUDED.density,
          durability = EXCLUDED.durability,
          conductivity = EXCLUDED.conductivity,
          magnetism = EXCLUDED.magnetism,
          flammability = EXCLUDED.flammability,
          rarity = EXCLUDED.rarity
      `, [mat.id, mat.name, mat.density, mat.durability, mat.conductivity, mat.magnetism, mat.flammability, mat.rarity]);
      count++;
    } catch (err) {
      console.error(`  ❌ Error inserting material ${mat.name}:`, err.message);
    }
  }

  console.log(`  ✅ Loaded ${count} materials`);
  return count;
}

async function migrateFactions() {
  console.log('\n🏛️ Migrating Factions...');
  let count = 0;

  for (const faction of FACTIONS) {
    try {
      await client.query(`
        INSERT INTO factions (id, name, headquarters_city, headquarters_country, ideology, color)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          headquarters_city = EXCLUDED.headquarters_city,
          headquarters_country = EXCLUDED.headquarters_country,
          ideology = EXCLUDED.ideology,
          color = EXCLUDED.color
      `, [faction.id, faction.name, faction.headquarters_city, faction.headquarters_country, faction.ideology, faction.color]);
      count++;
    } catch (err) {
      console.error(`  ❌ Error inserting faction ${faction.name}:`, err.message);
    }
  }

  console.log(`  ✅ Loaded ${count} factions`);
  return count;
}

async function migrateCountries() {
  console.log('\n🌍 Migrating Countries...');
  const data = loadCSV('SuperHero Tactics/SuperHero Tactics World Bible - Country.csv');
  let count = 0;

  for (const row of data) {
    const id = generateId(row.CountryName || row.Country, 'country');
    try {
      await client.query(`
        INSERT INTO countries (id, name, country_code, culture_code, region, continent, government_type, population, education_level)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          country_code = EXCLUDED.country_code,
          culture_code = EXCLUDED.culture_code,
          region = EXCLUDED.region,
          continent = EXCLUDED.continent,
          government_type = EXCLUDED.government_type,
          population = EXCLUDED.population,
          education_level = EXCLUDED.education_level
      `, [
        id,
        cleanValue(row.CountryName || row.Country),
        cleanInt(row.CountryCode),
        cleanInt(row.CultureCode),
        cleanValue(row.Region),
        cleanValue(row.Continent),
        cleanValue(row.GovernmentType || row['Government Type']),
        cleanInt(row.Population),
        cleanValue(row.EducationLevel || row['Education Level'])
      ]);
      count++;
    } catch (err) {
      console.error(`  ❌ Error inserting country ${row.CountryName}:`, err.message);
    }
  }

  console.log(`  ✅ Loaded ${count} countries`);
  return count;
}

async function migrateCities() {
  console.log('\n🏙️ Migrating Cities...');
  const data = loadCSV('SuperHero Tactics/SuperHero_Tactics_World_Bible_Cities_with_HVTs_Updated.csv');
  let count = 0;

  for (const row of data) {
    const cityName = row.CityName || row.City;
    if (!cityName) continue;

    const id = generateId(cityName + '_' + (row.Country || ''), 'city');

    // Parse city types into array
    const cityTypes = [];
    if (row.CityType1) cityTypes.push(row.CityType1);
    if (row.CityType2) cityTypes.push(row.CityType2);
    if (row.CityType3) cityTypes.push(row.CityType3);
    if (row.CityType4) cityTypes.push(row.CityType4);

    // Parse HVT descriptions
    let hvtDescriptions = [];
    if (row.HVT) {
      try {
        // It might be a Python-style list string
        const hvtStr = row.HVT.replace(/'/g, '"');
        hvtDescriptions = JSON.parse(hvtStr);
      } catch {
        hvtDescriptions = [row.HVT];
      }
    }

    try {
      await client.query(`
        INSERT INTO cities (id, name, country_name, sector, country_code, culture_code, population, population_rating, population_type, city_types, hvt_descriptions, crime_index, safety_index)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          country_name = EXCLUDED.country_name,
          sector = EXCLUDED.sector,
          country_code = EXCLUDED.country_code,
          culture_code = EXCLUDED.culture_code,
          population = EXCLUDED.population,
          population_rating = EXCLUDED.population_rating,
          population_type = EXCLUDED.population_type,
          city_types = EXCLUDED.city_types,
          hvt_descriptions = EXCLUDED.hvt_descriptions,
          crime_index = EXCLUDED.crime_index,
          safety_index = EXCLUDED.safety_index
      `, [
        id,
        cityName,
        cleanValue(row.Country),
        cleanValue(row.Sector),
        cleanInt(row.CountryCode),
        cleanInt(row.CultureCode),
        cleanInt(row.Population),
        cleanInt(row.PopulationRating),
        cleanValue(row.PopulationType),
        cityTypes.length > 0 ? cityTypes : null,
        hvtDescriptions.length > 0 ? hvtDescriptions : null,
        cleanNumber(row.CrimeIndex),
        cleanNumber(row.SafetyIndex)
      ]);
      count++;
    } catch (err) {
      console.error(`  ❌ Error inserting city ${cityName}:`, err.message);
    }
  }

  console.log(`  ✅ Loaded ${count} cities`);
  return count;
}

async function migrateWeapons() {
  console.log('\n⚔️ Migrating Weapons...');

  // The Weapons_Complete.csv has section headers - we need to filter for actual weapon rows
  const fullPath = path.join(ROOT, 'Game_Mechanics_Spec/Weapons_Complete.csv');
  if (!fs.existsSync(fullPath)) {
    console.log('  ⚠️  File not found: Game_Mechanics_Spec/Weapons_Complete.csv');
    return 0;
  }

  const content = fs.readFileSync(fullPath, 'utf-8');
  const lines = content.split('\n');
  let count = 0;

  // Find all weapon rows (they start with MEL_, RNG_, ENG_, GRN_, IMP_, SPL_)
  const weaponPrefixes = ['MEL_', 'RNG_', 'ENG_', 'GRN_', 'IMP_', 'SPL_', 'THR_'];

  for (const line of lines) {
    // Check if line starts with a weapon ID
    const isWeapon = weaponPrefixes.some(prefix => line.startsWith(prefix));
    if (!isWeapon) continue;

    const parts = line.split(',');
    if (parts.length < 6) continue;

    const id = parts[0].trim();
    const name = parts[1]?.trim();

    if (!name) continue;

    const category = parts[2]?.trim();
    const baseDamage = cleanInt(parts[3], 0);
    const damageType = parts[4]?.trim();
    const subType = parts[5]?.trim();
    const attackSpeed = cleanNumber(parts[6], 1.0);
    const rangeSquares = cleanInt(parts[7], 1);
    const accuracyCS = parts[8]?.trim();
    const reloadTime = cleanNumber(parts[9], 0);
    const skillRequired = parts[10]?.trim();
    const strRequired = cleanInt(parts[11], 0);
    const specialEffects = parts[12]?.trim();
    const penetrationMult = parts[13]?.trim()?.replace('x', '');
    const defaultAmmo = parts[14]?.trim();
    const magazineSize = cleanInt(parts[15], 0);
    const costLevel = parts[16]?.trim();
    const availability = parts[17]?.trim();

    // Determine material based on weapon type
    let material = 'steel';
    const nameLower = name.toLowerCase();
    if (nameLower.includes('energy') || nameLower.includes('laser') || nameLower.includes('plasma')) material = 'energy';
    else if (nameLower.includes('wooden') || nameLower.includes('club') || nameLower.includes('staff')) material = 'wood';
    else if (nameLower.includes('composite') || nameLower.includes('polymer')) material = 'carbon_fiber';

    try {
      await client.query(`
        INSERT INTO weapons (id, name, category, base_damage, damage_type, sub_type, attack_speed, range_squares, accuracy_cs, reload_time, skill_required, str_required, special_effects, penetration_mult, default_ammo, magazine_size, primary_material, cost_level, availability)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          category = EXCLUDED.category,
          base_damage = EXCLUDED.base_damage,
          damage_type = EXCLUDED.damage_type,
          sub_type = EXCLUDED.sub_type,
          primary_material = EXCLUDED.primary_material
      `, [
        id,
        cleanValue(name),
        cleanValue(category),
        baseDamage,
        cleanValue(damageType),
        cleanValue(subType),
        attackSpeed,
        rangeSquares,
        cleanInt(accuracyCS?.replace('+', '').replace('CS', '').replace('-', ''), 0),
        reloadTime,
        cleanValue(skillRequired === 'None' ? null : skillRequired),
        strRequired,
        cleanValue(specialEffects),
        cleanNumber(penetrationMult, 1.0),
        cleanValue(defaultAmmo),
        magazineSize,
        material,
        cleanValue(costLevel),
        cleanValue(availability)
      ]);
      count++;
    } catch (err) {
      console.error(`  ❌ Error inserting weapon ${name}:`, err.message);
    }
  }

  console.log(`  ✅ Loaded ${count} weapons`);
  return count;
}

async function migrateSkills() {
  console.log('\n🎯 Migrating Skills...');
  // Skills are in MVP/public/data/Skills.csv
  const data = loadCSV('MVP/public/data/Skills.csv');
  let count = 0;

  for (const row of data) {
    const id = row.Skill_ID || generateId(row.Skill_Name || row.Name, 'skill');
    try {
      await client.query(`
        INSERT INTO skills (id, name, skill_type, column_shift_bonus, prerequisites, description, combat_application, range_combat_bonus, melee_combat_bonus, investigation_bonus, special_effects)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          skill_type = EXCLUDED.skill_type,
          description = EXCLUDED.description
      `, [
        id,
        cleanValue(row.Skill_Name || row.Name),
        cleanValue(row.Skill_Type || row.Type),
        cleanValue(row.Column_Shift_Bonus),
        cleanValue(row.Prerequisites),
        cleanValue(row.Description),
        cleanValue(row.Combat_Application),
        cleanValue(row.Range_Combat_Bonus),
        cleanValue(row.Melee_Combat_Bonus),
        cleanValue(row.Investigation_Bonus),
        cleanValue(row.Special_Effects)
      ]);
      count++;
    } catch (err) {
      console.error(`  ❌ Error inserting skill ${row.Skill_Name || row.Name}:`, err.message);
    }
  }

  console.log(`  ✅ Loaded ${count} skills`);
  return count;
}

async function migratePowers() {
  console.log('\n⚡ Migrating Powers...');
  // Powers are in MVP/public/data/Powers.csv
  const data = loadCSV('MVP/public/data/Powers.csv');
  let count = 0;

  for (const row of data) {
    const id = row.Power_ID || generateId(row.Power_Name || row.Name, 'pwr');
    try {
      await client.query(`
        INSERT INTO powers (id, name, description, threat_level, role, power_type, manifest, damage, range_squares, ap_cost, cooldown, status_effect, area_of_effect)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          description = EXCLUDED.description,
          threat_level = EXCLUDED.threat_level,
          role = EXCLUDED.role,
          power_type = EXCLUDED.power_type
      `, [
        id,
        cleanValue(row.Power_Name || row.Name),
        cleanValue(row.Description || row.Low_Level_Description),
        cleanValue(row.Threat_Level || 'THREAT_1'),
        cleanValue(row.Power_Subcategory || row.Role || 'offense'),
        cleanValue(row.Power_Category || row.Power_Type),
        cleanValue(row.Combat_Application),
        cleanInt(row.Damage, 0),
        cleanInt(row.Range_Squares || row.Range, 5),
        cleanInt(row.AP_Cost, 2),
        cleanInt(row.Cooldown, 0),
        cleanValue(row.Status_Effect),
        cleanInt(row.AOE || row.Area_of_Effect, 0)
      ]);
      count++;
    } catch (err) {
      console.error(`  ❌ Error inserting power ${row.Power_Name || row.Name}:`, err.message);
    }
  }

  console.log(`  ✅ Loaded ${count} powers`);
  return count;
}

async function migrateStatusEffects() {
  console.log('\n💀 Migrating Status Effects...');
  // Status effects are in Status_Effects_Complete.csv
  const data = loadCSV('Status_Effects_Complete.csv');
  let count = 0;

  for (const row of data) {
    const effectName = row.Effect_Name || row.Name;
    const severity = row.Severity_Level || 'I';
    const id = generateId(effectName + '_' + severity, 'status');

    // Parse duration
    const durationValue = cleanInt(row.Duration_Value, 0);
    const durationType = row.Duration_Type || 'Turns';

    // Parse health loss from Gameplay_Effect (e.g., "Lose 5 health per turn")
    let damagePerTurn = 0;
    const effectMatch = (row.Gameplay_Effect || '').match(/Lose (\d+) health/i);
    if (effectMatch) damagePerTurn = parseInt(effectMatch[1], 10);

    try {
      await client.query(`
        INSERT INTO status_effects (id, name, description, duration_turns, damage_per_turn, stat_modifier, movement_modifier, can_stack, cure_method)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          description = EXCLUDED.description,
          duration_turns = EXCLUDED.duration_turns
      `, [
        id,
        cleanValue(`${effectName} ${severity}`),
        cleanValue(row.Description),
        durationType === 'Turns' ? durationValue : durationValue * 24, // Convert days/weeks to turns
        damagePerTurn,
        cleanValue(row.Action_Penalty),
        1.0 - (cleanInt(row.Movement_Penalty?.replace('-', '').replace(' movement', ''), 0) * 0.1),
        false,
        cleanValue(row.Recovery_Method)
      ]);
      count++;
    } catch (err) {
      console.error(`  ❌ Error inserting status effect ${effectName}:`, err.message);
    }
  }

  console.log(`  ✅ Loaded ${count} status effects`);
  return count;
}

async function migrateMartialArts() {
  console.log('\n🥋 Migrating Martial Arts...');

  // Hardcoded styles based on the game design
  const MARTIAL_ARTS_STYLES = [
    { id: 'style_grappling', name: 'Grappling', description: 'Judo, Wrestling - Control & Positioning', role: 'control', primary_stat: 'STR', secondary_stat: 'MEL' },
    { id: 'style_submission', name: 'Submission', description: 'BJJ, Catch Wrestling - Finisher & Incapacitation', role: 'finisher', primary_stat: 'MEL', secondary_stat: 'STR' },
    { id: 'style_internal', name: 'Internal', description: 'Tai Chi, Aikido - Redirection & Defense', role: 'defense', primary_stat: 'INS', secondary_stat: 'AGL' },
    { id: 'style_counter', name: 'Counter', description: 'JKD, Krav Maga - Reactive & Efficient', role: 'reactive', primary_stat: 'AGL', secondary_stat: 'INS' },
    { id: 'style_striking', name: 'Striking', description: 'Muay Thai, Boxing, Karate - Damage & Pressure', role: 'damage', primary_stat: 'STR', secondary_stat: 'AGL' },
  ];

  // Hardcoded techniques from the plan
  const MARTIAL_ARTS_TECHNIQUES = [
    // GRAPPLING (Judo, Wrestling)
    { id: 'tech_clinch', style_id: 'style_grappling', name: 'Clinch', belt: 1, ap: 1, effect: 'Enter grapple range', damage: 0, requires_grapple: false },
    { id: 'tech_takedown', style_id: 'style_grappling', name: 'Takedown', belt: 2, ap: 2, effect: 'Knock prone, you stay standing', damage: 0, requires_grapple: true },
    { id: 'tech_hip_throw', style_id: 'style_grappling', name: 'Hip Throw', belt: 3, ap: 2, effect: 'Throw 1 tile, prone', damage: 5, requires_grapple: true },
    { id: 'tech_suplex', style_id: 'style_grappling', name: 'Suplex', belt: 4, ap: 3, effect: '15 damage + prone', damage: 15, requires_grapple: true },
    { id: 'tech_slam', style_id: 'style_grappling', name: 'Slam', belt: 5, ap: 3, effect: 'STR×0.5 damage', damage: 20, requires_grapple: true },
    { id: 'tech_pin', style_id: 'style_grappling', name: 'Pin', belt: 6, ap: 2, effect: 'Restrain target (they lose AP)', damage: 0, requires_grapple: true },
    { id: 'tech_lift_carry', style_id: 'style_grappling', name: 'Lift & Carry', belt: 7, ap: 1, effect: 'Pick up restrained target', damage: 0, requires_grapple: true },
    { id: 'tech_pile_driver', style_id: 'style_grappling', name: 'Pile Driver', belt: 8, ap: 4, effect: '30 damage, requires lift', damage: 30, requires_grapple: true },

    // SUBMISSION (BJJ, Catch Wrestling)
    { id: 'tech_guard_pull', style_id: 'style_submission', name: 'Guard Pull', belt: 1, ap: 1, effect: 'Both go prone, you control', damage: 0, requires_grapple: true },
    { id: 'tech_armbar', style_id: 'style_submission', name: 'Armbar', belt: 2, ap: 2, effect: '10 damage, -2 target MEL', damage: 10, requires_grapple: true },
    { id: 'tech_triangle', style_id: 'style_submission', name: 'Triangle', belt: 3, ap: 2, effect: 'Choke, target loses 1 AP/turn', damage: 5, requires_grapple: true },
    { id: 'tech_kimura', style_id: 'style_submission', name: 'Kimura', belt: 4, ap: 2, effect: '15 damage + disarm', damage: 15, requires_grapple: true },
    { id: 'tech_rear_naked', style_id: 'style_submission', name: 'Rear Naked', belt: 5, ap: 3, effect: 'Choke, unconscious in 3 turns', damage: 0, requires_grapple: true },
    { id: 'tech_heel_hook', style_id: 'style_submission', name: 'Heel Hook', belt: 6, ap: 2, effect: '20 damage + immobilize', damage: 20, requires_grapple: true },
    { id: 'tech_neck_crank', style_id: 'style_submission', name: 'Neck Crank', belt: 7, ap: 3, effect: '25 damage', damage: 25, requires_grapple: true },
    { id: 'tech_blood_choke', style_id: 'style_submission', name: 'Blood Choke', belt: 8, ap: 3, effect: 'Unconscious in 2 turns', damage: 0, requires_grapple: true },

    // INTERNAL (Tai Chi, Aikido)
    { id: 'tech_deflect', style_id: 'style_internal', name: 'Deflect', belt: 1, ap: 0, effect: 'Reaction: reduce melee damage 25%', damage: 0, requires_grapple: false },
    { id: 'tech_redirect', style_id: 'style_internal', name: 'Redirect', belt: 2, ap: 1, effect: 'Send attack to adjacent enemy', damage: 0, requires_grapple: false },
    { id: 'tech_push', style_id: 'style_internal', name: 'Push', belt: 3, ap: 1, effect: 'Knockback 1 tile, no damage', damage: 0, requires_grapple: false },
    { id: 'tech_joint_lock', style_id: 'style_internal', name: 'Joint Lock', belt: 4, ap: 2, effect: 'Immobilize 1 turn', damage: 0, requires_grapple: true },
    { id: 'tech_energy_steal', style_id: 'style_internal', name: 'Energy Steal', belt: 5, ap: 2, effect: 'Drain 1 AP from target', damage: 0, requires_grapple: false },
    { id: 'tech_circle_walk', style_id: 'style_internal', name: 'Circle Walk', belt: 6, ap: 1, effect: 'Move without triggering overwatch', damage: 0, requires_grapple: false },
    { id: 'tech_iron_body', style_id: 'style_internal', name: 'Iron Body', belt: 7, ap: 0, effect: 'Passive: +5 DR vs melee', damage: 0, requires_grapple: false },
    { id: 'tech_dim_mak', style_id: 'style_internal', name: 'Dim Mak', belt: 8, ap: 4, effect: 'Delayed damage (triggers next turn)', damage: 40, requires_grapple: false },

    // COUNTER (JKD, Krav Maga)
    { id: 'tech_intercept', style_id: 'style_counter', name: 'Intercept', belt: 1, ap: 0, effect: 'Reaction: attack during enemy attack', damage: 10, requires_grapple: false },
    { id: 'tech_parry_riposte', style_id: 'style_counter', name: 'Parry-Riposte', belt: 2, ap: 1, effect: 'Block + immediate counter', damage: 12, requires_grapple: false },
    { id: 'tech_eye_jab', style_id: 'style_counter', name: 'Eye Jab', belt: 3, ap: 1, effect: '5 damage + blind 1 turn', damage: 5, requires_grapple: false },
    { id: 'tech_low_kick', style_id: 'style_counter', name: 'Low Kick', belt: 4, ap: 1, effect: '10 damage + slow', damage: 10, requires_grapple: false },
    { id: 'tech_disarm', style_id: 'style_counter', name: 'Disarm', belt: 5, ap: 2, effect: 'Take weapon from enemy', damage: 0, requires_grapple: false },
    { id: 'tech_throat_strike', style_id: 'style_counter', name: 'Throat Strike', belt: 6, ap: 2, effect: '15 damage + silence (no powers)', damage: 15, requires_grapple: false },
    { id: 'tech_break_guard', style_id: 'style_counter', name: 'Break Guard', belt: 7, ap: 2, effect: "Remove enemy's defensive stance", damage: 0, requires_grapple: false },
    { id: 'tech_simultaneous', style_id: 'style_counter', name: 'Simultaneous', belt: 8, ap: 3, effect: 'Attack ignores enemy attack', damage: 20, requires_grapple: false },

    // STRIKING (Muay Thai, Boxing, Karate)
    { id: 'tech_jab', style_id: 'style_striking', name: 'Jab', belt: 1, ap: 1, effect: '5 damage, fast', damage: 5, requires_grapple: false },
    { id: 'tech_cross', style_id: 'style_striking', name: 'Cross', belt: 2, ap: 1, effect: '10 damage', damage: 10, requires_grapple: false },
    { id: 'tech_hook', style_id: 'style_striking', name: 'Hook', belt: 3, ap: 1, effect: '12 damage, bypass block', damage: 12, requires_grapple: false },
    { id: 'tech_uppercut', style_id: 'style_striking', name: 'Uppercut', belt: 4, ap: 2, effect: '15 damage + stagger', damage: 15, requires_grapple: false },
    { id: 'tech_elbow', style_id: 'style_striking', name: 'Elbow', belt: 5, ap: 1, effect: '12 damage + bleed', damage: 12, requires_grapple: false },
    { id: 'tech_knee', style_id: 'style_striking', name: 'Knee', belt: 6, ap: 2, effect: '18 damage (requires clinch)', damage: 18, requires_grapple: true },
    { id: 'tech_spinning_back', style_id: 'style_striking', name: 'Spinning Back', belt: 7, ap: 2, effect: '20 damage', damage: 20, requires_grapple: false },
    { id: 'tech_superman_punch', style_id: 'style_striking', name: 'Superman Punch', belt: 8, ap: 3, effect: '25 damage + knockback 2', damage: 25, requires_grapple: false },
  ];

  // Insert styles
  let styleCount = 0;
  for (const style of MARTIAL_ARTS_STYLES) {
    try {
      await client.query(`
        INSERT INTO martial_arts_styles (id, name, description, role, primary_stat, secondary_stat)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          description = EXCLUDED.description,
          role = EXCLUDED.role
      `, [style.id, style.name, style.description, style.role, style.primary_stat, style.secondary_stat]);
      styleCount++;
    } catch (err) {
      console.error(`  ❌ Error inserting style ${style.name}:`, err.message);
    }
  }
  console.log(`  ✅ Loaded ${styleCount} martial arts styles`);

  // Insert techniques
  let techCount = 0;
  for (const tech of MARTIAL_ARTS_TECHNIQUES) {
    try {
      await client.query(`
        INSERT INTO martial_arts_techniques (id, style_id, name, belt_required, ap_cost, effect, damage, requires_grapple, requires_standing)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          effect = EXCLUDED.effect,
          damage = EXCLUDED.damage
      `, [tech.id, tech.style_id, tech.name, tech.belt, tech.ap, tech.effect, tech.damage, tech.requires_grapple, true]);
      techCount++;
    } catch (err) {
      console.error(`  ❌ Error inserting technique ${tech.name}:`, err.message);
    }
  }
  console.log(`  ✅ Loaded ${techCount} martial arts techniques`);

  return { styles: styleCount, techniques: techCount };
}

async function migrateCharacters() {
  console.log('\n🦸 Migrating Famous Characters...');
  let count = 0;

  for (const char of FAMOUS_CHARACTERS) {
    try {
      await client.query(`
        INSERT INTO characters (
          id, name, alias, real_name, age, gender, nationality, faction_id,
          origin_type, threat_level, mel, agl, str, sta, int, ins, con,
          personality_type, personality_traits, motivation_rating, harm_potential,
          education_level, career_category, career_rank, weakness_1, weakness_2,
          appearance, backstory, resource_level, fame, infamy,
          has_secret_identity, civilian_job, current_country, current_city
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17,
          $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33, $34, $35
        )
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          alias = EXCLUDED.alias,
          mel = EXCLUDED.mel,
          agl = EXCLUDED.agl,
          str = EXCLUDED.str,
          sta = EXCLUDED.sta,
          int = EXCLUDED.int,
          ins = EXCLUDED.ins,
          con = EXCLUDED.con
      `, [
        char.id, char.name, char.alias, char.real_name, char.age, char.gender,
        char.nationality, char.faction_id, char.origin_type, char.threat_level,
        char.mel, char.agl, char.str, char.sta, char.int, char.ins, char.con,
        char.personality_type, char.personality_traits, char.motivation_rating, char.harm_potential,
        char.education_level, char.career_category, char.career_rank, char.weakness_1, char.weakness_2,
        char.appearance, char.backstory, char.resource_level, char.fame, char.infamy,
        char.has_secret_identity, char.civilian_job, char.current_country, char.current_city
      ]);
      count++;
    } catch (err) {
      console.error(`  ❌ Error inserting character ${char.name}:`, err.message);
    }
  }

  console.log(`  ✅ Loaded ${count} famous characters`);
  return count;
}

async function migrateCharacterPowers() {
  console.log('\n⚡ Linking Character Powers...');
  let count = 0;

  // First, ensure we have some basic powers
  const basicPowers = [
    { id: 'pwr_flight', name: 'Flight', damage: 0, role: 'mobility', power_type: 'Physical' },
    { id: 'pwr_super_strength', name: 'Super Strength', damage: 30, role: 'offense', power_type: 'Physical' },
    { id: 'pwr_super_speed', name: 'Super Speed', damage: 15, role: 'mobility', power_type: 'Physical' },
    { id: 'pwr_super_agility', name: 'Super Agility', damage: 0, role: 'defense', power_type: 'Physical' },
    { id: 'pwr_invulnerability', name: 'Invulnerability', damage: 0, role: 'defense', power_type: 'Physical' },
    { id: 'pwr_regeneration', name: 'Regeneration', damage: 0, role: 'defense', power_type: 'Physical' },
    { id: 'pwr_energy_blast', name: 'Energy Blast', damage: 40, role: 'offense', power_type: 'Energy' },
    { id: 'pwr_heat_vision', name: 'Heat Vision', damage: 45, role: 'offense', power_type: 'Energy' },
    { id: 'pwr_lightning_control', name: 'Lightning Control', damage: 50, role: 'offense', power_type: 'Energy' },
    { id: 'pwr_telepathy', name: 'Telepathy', damage: 0, role: 'control', power_type: 'Mental' },
    { id: 'pwr_mind_control', name: 'Mind Control', damage: 0, role: 'control', power_type: 'Mental' },
    { id: 'pwr_magnetism', name: 'Magnetism', damage: 35, role: 'control', power_type: 'Energy' },
    { id: 'pwr_force_field', name: 'Force Field', damage: 0, role: 'defense', power_type: 'Energy' },
    { id: 'pwr_wall_crawling', name: 'Wall Crawling', damage: 0, role: 'mobility', power_type: 'Physical' },
    { id: 'pwr_danger_sense', name: 'Danger Sense', damage: 0, role: 'defense', power_type: 'Mental' },
    { id: 'pwr_enhanced_senses', name: 'Enhanced Senses', damage: 0, role: 'utility', power_type: 'Physical' },
    { id: 'pwr_claws', name: 'Claws', damage: 25, role: 'offense', power_type: 'Physical' },
    { id: 'pwr_water_breathing', name: 'Water Breathing', damage: 0, role: 'utility', power_type: 'Physical' },
    { id: 'pwr_time_manipulation', name: 'Time Manipulation', damage: 0, role: 'control', power_type: 'Cosmic' },
  ];

  // Insert basic powers
  for (const power of basicPowers) {
    try {
      await client.query(`
        INSERT INTO powers (id, name, damage, role, power_type, range_squares, ap_cost)
        VALUES ($1, $2, $3, $4, $5, 5, 2)
        ON CONFLICT (id) DO NOTHING
      `, [power.id, power.name, power.damage, power.role, power.power_type]);
    } catch (err) {
      // Ignore if already exists
    }
  }

  // Link character powers
  for (const cp of CHARACTER_POWERS) {
    try {
      await client.query(`
        INSERT INTO character_powers (character_id, power_id, power_level, power_rank, slot_number)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (character_id, slot_number) DO UPDATE SET
          power_id = EXCLUDED.power_id,
          power_level = EXCLUDED.power_level,
          power_rank = EXCLUDED.power_rank
      `, [cp.character_id, cp.power_id, cp.power_level, cp.power_rank, cp.slot_number]);
      count++;
    } catch (err) {
      console.error(`  ❌ Error linking power ${cp.power_id} to ${cp.character_id}:`, err.message);
    }
  }

  console.log(`  ✅ Linked ${count} character powers`);
  return count;
}

// ============== MAIN MIGRATION ==============

async function main() {
  console.log('╔════════════════════════════════════════════════╗');
  console.log('║  SuperHero Tactics - Complete Database Migration ║');
  console.log('╚════════════════════════════════════════════════╝');

  try {
    await client.connect();
    console.log('✅ Connected to PostgreSQL');

    const results = {
      materials: await migrateMaterials(),
      factions: await migrateFactions(),
      countries: await migrateCountries(),
      cities: await migrateCities(),
      weapons: await migrateWeapons(),
      skills: await migrateSkills(),
      powers: await migratePowers(),
      statusEffects: await migrateStatusEffects(),
      martialArts: await migrateMartialArts(),
      characters: await migrateCharacters(),
      characterPowers: await migrateCharacterPowers(),
    };

    console.log('\n╔════════════════════════════════════════════════╗');
    console.log('║              MIGRATION SUMMARY                  ║');
    console.log('╠════════════════════════════════════════════════╣');
    console.log(`║  Materials:      ${String(results.materials).padStart(5)} records              ║`);
    console.log(`║  Factions:       ${String(results.factions).padStart(5)} records              ║`);
    console.log(`║  Countries:      ${String(results.countries).padStart(5)} records              ║`);
    console.log(`║  Cities:         ${String(results.cities).padStart(5)} records              ║`);
    console.log(`║  Weapons:        ${String(results.weapons).padStart(5)} records              ║`);
    console.log(`║  Skills:         ${String(results.skills).padStart(5)} records              ║`);
    console.log(`║  Powers:         ${String(results.powers).padStart(5)} records              ║`);
    console.log(`║  Status Effects: ${String(results.statusEffects).padStart(5)} records              ║`);
    console.log(`║  MA Styles:      ${String(results.martialArts.styles).padStart(5)} records              ║`);
    console.log(`║  MA Techniques:  ${String(results.martialArts.techniques).padStart(5)} records              ║`);
    console.log(`║  Characters:     ${String(results.characters).padStart(5)} records              ║`);
    console.log(`║  Char Powers:    ${String(results.characterPowers).padStart(5)} records              ║`);
    console.log('╚════════════════════════════════════════════════╝');

    const total = results.materials + results.factions + results.countries +
                  results.cities + results.weapons + results.skills +
                  results.powers + results.statusEffects +
                  results.martialArts.styles + results.martialArts.techniques +
                  results.characters + results.characterPowers;
    console.log(`\n🎉 Total: ${total} records loaded!`);

  } catch (err) {
    console.error('❌ Migration failed:', err);
  } finally {
    await client.end();
    console.log('\n👋 Disconnected from PostgreSQL');
  }
}

main();
