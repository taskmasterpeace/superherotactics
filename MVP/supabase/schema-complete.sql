-- SuperHero Tactics - COMPLETE Database Schema
-- Run this in PostgreSQL to create all tables with FULL data

-- Drop existing tables to recreate with complete schema
DROP TABLE IF EXISTS character_powers CASCADE;
DROP TABLE IF EXISTS character_skills CASCADE;
DROP TABLE IF EXISTS character_contacts CASCADE;
DROP TABLE IF EXISTS character_faction_standing CASCADE;
DROP TABLE IF EXISTS characters CASCADE;
DROP TABLE IF EXISTS martial_arts_techniques CASCADE;
DROP TABLE IF EXISTS martial_arts_styles CASCADE;
DROP TABLE IF EXISTS status_effects CASCADE;
DROP TABLE IF EXISTS ammunition CASCADE;
DROP TABLE IF EXISTS armor CASCADE;
DROP TABLE IF EXISTS powers CASCADE;
DROP TABLE IF EXISTS skills CASCADE;
DROP TABLE IF EXISTS weapons CASCADE;
DROP TABLE IF EXISTS gadgets CASCADE;
DROP TABLE IF EXISTS cities CASCADE;
DROP TABLE IF EXISTS countries CASCADE;
DROP TABLE IF EXISTS factions CASCADE;
DROP TABLE IF EXISTS materials CASCADE;

-- ============== MATERIALS ==============
CREATE TABLE materials (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  density REAL DEFAULT 1.0,       -- Affects weight
  durability INTEGER DEFAULT 50,   -- How easily damaged (1-100)
  conductivity REAL DEFAULT 0.5,   -- Electrical conductivity (0-1)
  magnetism REAL DEFAULT 0.0,      -- Can be manipulated by magnetism (0-1)
  flammability REAL DEFAULT 0.0,   -- Catches fire easily (0-1)
  rarity TEXT DEFAULT 'Common',    -- Common, Uncommon, Rare, Exotic
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============== FACTIONS ==============
CREATE TABLE factions (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  headquarters_city TEXT,
  headquarters_country TEXT,
  ideology TEXT,
  color TEXT,                      -- UI color
  emblem_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============== COUNTRIES ==============
CREATE TABLE countries (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  country_code INTEGER,
  culture_code INTEGER,
  region TEXT,
  continent TEXT,
  government_type TEXT,
  population BIGINT DEFAULT 0,
  education_level TEXT,
  primary_faction TEXT REFERENCES factions(id),
  languages TEXT[],                -- Array of languages spoken
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============== CITIES ==============
CREATE TABLE cities (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  country_id TEXT REFERENCES countries(id),
  country_name TEXT NOT NULL,
  sector TEXT,                     -- Grid sector (e.g., LJ5)
  country_code INTEGER,
  culture_code INTEGER,
  population BIGINT DEFAULT 0,
  population_rating INTEGER,       -- 1-7 scale
  population_type TEXT,            -- Small Town, Town, City, Large City, Mega City
  city_types TEXT[],               -- Array: Military, Political, Educational, Company, Temple, Mining, Resort, Seaport, Industrial
  hvt_descriptions TEXT[],         -- High Value Targets descriptions
  crime_index REAL DEFAULT 50,
  safety_index REAL DEFAULT 50,
  latitude REAL,
  longitude REAL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============== WEAPONS (with materials) ==============
CREATE TABLE weapons (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,          -- Melee_Regular, Melee_Skill, Ranged_Regular, Ranged_Skill, etc.
  base_damage INTEGER DEFAULT 0,
  damage_type TEXT DEFAULT 'PHYSICAL',
  sub_type TEXT,                   -- EDGED_MELEE, SMASHING_MELEE, GUNFIRE, etc.
  attack_speed REAL DEFAULT 1.0,
  range_squares INTEGER DEFAULT 1,
  accuracy_cs INTEGER DEFAULT 70,
  reload_time REAL DEFAULT 0,
  skill_required TEXT,
  str_required INTEGER DEFAULT 0,
  special_effects TEXT,
  penetration_mult REAL DEFAULT 1.0,
  default_ammo TEXT,
  magazine_size INTEGER DEFAULT 0,

  -- NEW: Material properties
  primary_material TEXT REFERENCES materials(id),
  weight_lbs REAL DEFAULT 1.0,
  durability INTEGER DEFAULT 100,
  can_be_magnetized BOOLEAN DEFAULT FALSE,
  is_electronic BOOLEAN DEFAULT FALSE,

  cost_level TEXT DEFAULT 'Medium',
  availability TEXT DEFAULT 'Common',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============== GADGETS/VEHICLES (with materials) ==============
CREATE TABLE gadgets (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  subcategory TEXT,

  -- Vehicle stats
  speed_mph INTEGER DEFAULT 0,
  speed_squares INTEGER DEFAULT 0,
  passengers INTEGER DEFAULT 0,
  cargo_lbs INTEGER DEFAULT 0,
  armor_hp INTEGER DEFAULT 0,
  armor_dr INTEGER DEFAULT 0,
  fuel_type TEXT,
  range_miles INTEGER DEFAULT 0,

  -- NEW: Material properties
  primary_material TEXT REFERENCES materials(id),
  weight_lbs REAL DEFAULT 0,
  is_electronic BOOLEAN DEFAULT TRUE,
  can_be_hacked BOOLEAN DEFAULT FALSE,
  power_source TEXT,               -- Battery, Fuel, Solar, Nuclear, Magic

  cost_level TEXT DEFAULT 'Medium',
  availability TEXT DEFAULT 'Common',
  special_properties TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============== POWERS ==============
CREATE TABLE powers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,

  -- Classification
  threat_level TEXT DEFAULT 'THREAT_1',  -- Alpha, THREAT_1-5, Cosmic
  origin_types TEXT[],                    -- Which origins can have this power
  role TEXT DEFAULT 'offense',            -- offense, defense, mobility, support, control, utility
  power_type TEXT,                        -- Physical, Energy, Mental, Magic, Tech, Cosmic
  manifest TEXT,                          -- How the power manifests visually

  -- Combat stats
  damage INTEGER DEFAULT 0,
  range_squares INTEGER DEFAULT 1,
  ap_cost INTEGER DEFAULT 2,
  cooldown INTEGER DEFAULT 0,

  -- Effects
  status_effect TEXT,                     -- Status effect it applies
  area_of_effect INTEGER DEFAULT 0,       -- 0 = single target

  -- Counters
  countered_by TEXT[],                    -- What can counter this power

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============== SKILLS ==============
CREATE TABLE skills (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  skill_type TEXT,                 -- Combat, Martial Arts, Talent, Physical
  column_shift_bonus TEXT,         -- e.g., "+2CS"
  prerequisites TEXT,
  description TEXT,
  combat_application TEXT,
  range_combat_bonus TEXT,
  melee_combat_bonus TEXT,
  investigation_bonus TEXT,
  special_effects TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============== ARMOR ==============
CREATE TABLE armor (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT,
  damage_reduction INTEGER DEFAULT 0,
  hp INTEGER DEFAULT 100,
  weight TEXT,
  coverage TEXT,                   -- Full, Torso, Head, Limbs

  -- NEW: Material properties
  primary_material TEXT REFERENCES materials(id),
  is_powered BOOLEAN DEFAULT FALSE,
  power_source TEXT,

  special_properties TEXT,
  cost_level TEXT DEFAULT 'Medium',
  availability TEXT DEFAULT 'Common',
  repair_difficulty TEXT DEFAULT 'Medium',
  repair_time_hours INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============== AMMUNITION ==============
CREATE TABLE ammunition (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  caliber TEXT,
  damage_modifier REAL DEFAULT 1.0,
  penetration_modifier REAL DEFAULT 1.0,
  special_effects TEXT,
  material TEXT REFERENCES materials(id),
  cost_level TEXT DEFAULT 'Medium',
  availability TEXT DEFAULT 'Common',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============== STATUS EFFECTS ==============
CREATE TABLE status_effects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  duration_turns INTEGER DEFAULT 0,
  damage_per_turn INTEGER DEFAULT 0,
  stat_modifier TEXT,              -- e.g., "MEL-10" or "AGL-20"
  movement_modifier REAL DEFAULT 1.0,
  can_stack BOOLEAN DEFAULT FALSE,
  cure_method TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============== MARTIAL ARTS STYLES ==============
CREATE TABLE martial_arts_styles (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  role TEXT,                       -- control, finisher, defense, reactive, damage
  primary_stat TEXT,               -- STR, AGL, MEL, etc.
  secondary_stat TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============== MARTIAL ARTS TECHNIQUES ==============
CREATE TABLE martial_arts_techniques (
  id TEXT PRIMARY KEY,
  style_id TEXT REFERENCES martial_arts_styles(id),
  name TEXT NOT NULL,
  belt_required INTEGER DEFAULT 1,  -- 1-10 (White to Black 2)
  ap_cost INTEGER DEFAULT 1,
  effect TEXT,
  damage INTEGER,
  special TEXT,
  requires_grapple BOOLEAN DEFAULT FALSE,
  requires_standing BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============== CHARACTERS ==============
CREATE TABLE characters (
  id TEXT PRIMARY KEY,

  -- Identity
  name TEXT NOT NULL,
  alias TEXT,                      -- Hero/villain codename
  real_name TEXT,
  age INTEGER DEFAULT 25,
  gender TEXT,
  nationality TEXT,
  faction_id TEXT REFERENCES factions(id),
  origin_type TEXT,                -- Skilled, Altered, Mutant, Tech, Mystic, Alien, Cosmic, Divine, Construct
  threat_level TEXT DEFAULT 'THREAT_1',

  -- PRIMARY STATS (1-150+)
  mel INTEGER DEFAULT 50,          -- Melee
  agl INTEGER DEFAULT 50,          -- Agility
  str INTEGER DEFAULT 50,          -- Strength
  sta INTEGER DEFAULT 50,          -- Stamina
  int INTEGER DEFAULT 50,          -- Intelligence
  ins INTEGER DEFAULT 50,          -- Insight
  con INTEGER DEFAULT 50,          -- Concentration

  -- DERIVED STATS (calculated but cached)
  health INTEGER,                  -- (STA * 2) + STR
  initiative INTEGER,              -- (AGL + INS) / 2
  karma INTEGER,                   -- (INT + INS + CON) / 3
  movement INTEGER,                -- 6 + (AGL / 10)
  carry_capacity INTEGER,          -- STR * 10

  -- THREAT ASSESSMENT
  pcf REAL DEFAULT 0,              -- Power Capability Factor
  stam REAL DEFAULT 5,             -- Stability Assessment

  -- PERSONALITY (affects AI behavior)
  personality_type INTEGER DEFAULT 1,  -- 1-20 types
  personality_traits TEXT,
  motivation_rating INTEGER DEFAULT 5,  -- 1-10 (altruistic to destructive)
  harm_potential INTEGER DEFAULT 5,     -- 1-10

  -- EDUCATION & CAREER
  education_level TEXT,            -- EDU_00 to EDU_12
  career_category TEXT,            -- Medical, Tech, Combat, etc.
  career_rank INTEGER DEFAULT 1,   -- 1-5
  current_job TEXT,

  -- WEAKNESSES (2 slots)
  weakness_1 TEXT,
  weakness_2 TEXT,

  -- BACKGROUND
  appearance TEXT,
  backstory TEXT,
  motivations TEXT,

  -- RESOURCES
  resource_level TEXT DEFAULT 'Medium',  -- Poverty, Low, Medium, High, Wealthy, Elite
  fame INTEGER DEFAULT 0,          -- 0-100
  infamy INTEGER DEFAULT 0,        -- 0-100

  -- CURRENT LOCATION
  current_country TEXT,
  current_city TEXT,
  home_base_city TEXT,

  -- EQUIPMENT (foreign keys)
  weapon_1 TEXT REFERENCES weapons(id),
  weapon_2 TEXT REFERENCES weapons(id),
  armor_id TEXT REFERENCES armor(id),

  -- SECRET IDENTITY
  has_secret_identity BOOLEAN DEFAULT FALSE,
  civilian_job TEXT,

  -- TEAM
  team_id TEXT,
  team_role TEXT,

  -- META
  is_npc BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============== CHARACTER POWERS (many-to-many) ==============
CREATE TABLE character_powers (
  id SERIAL PRIMARY KEY,
  character_id TEXT REFERENCES characters(id) ON DELETE CASCADE,
  power_id TEXT REFERENCES powers(id),
  power_level TEXT DEFAULT 'Low',  -- Low or High
  power_rank INTEGER DEFAULT 50,   -- Stat value for the power
  slot_number INTEGER DEFAULT 1,   -- 1-6
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(character_id, slot_number)
);

-- ============== CHARACTER SKILLS (many-to-many) ==============
CREATE TABLE character_skills (
  id SERIAL PRIMARY KEY,
  character_id TEXT REFERENCES characters(id) ON DELETE CASCADE,
  skill_id TEXT REFERENCES skills(id),
  rank INTEGER DEFAULT 1,          -- Skill proficiency 1-100
  slot_number INTEGER DEFAULT 1,   -- 1-5
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(character_id, slot_number)
);

-- ============== CHARACTER MARTIAL ARTS ==============
CREATE TABLE character_martial_arts (
  id SERIAL PRIMARY KEY,
  character_id TEXT REFERENCES characters(id) ON DELETE CASCADE,
  style_id TEXT REFERENCES martial_arts_styles(id),
  belt_level INTEGER DEFAULT 1,    -- 1-10 (White to Black 2)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(character_id, style_id)
);

-- ============== CHARACTER CONTACTS ==============
CREATE TABLE character_contacts (
  id SERIAL PRIMARY KEY,
  character_id TEXT REFERENCES characters(id) ON DELETE CASCADE,
  contact_name TEXT NOT NULL,
  relationship_type TEXT,          -- Handler, Friend, Enemy, Family, Professional
  usefulness TEXT,
  faction_id TEXT REFERENCES factions(id),
  trust_level INTEGER DEFAULT 3,   -- 1-5
  slot_number INTEGER DEFAULT 1,   -- 1-3
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(character_id, slot_number)
);

-- ============== CHARACTER FACTION STANDING ==============
CREATE TABLE character_faction_standing (
  id SERIAL PRIMARY KEY,
  character_id TEXT REFERENCES characters(id) ON DELETE CASCADE,
  faction_id TEXT REFERENCES factions(id),
  standing INTEGER DEFAULT 0,      -- -100 to +100
  is_wanted BOOLEAN DEFAULT FALSE,
  wanted_level INTEGER DEFAULT 0,  -- 0-5
  crimes TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(character_id, faction_id)
);

-- ============== INDEXES ==============
CREATE INDEX idx_weapons_category ON weapons(category);
CREATE INDEX idx_weapons_material ON weapons(primary_material);
CREATE INDEX idx_gadgets_category ON gadgets(category);
CREATE INDEX idx_cities_country ON cities(country_name);
CREATE INDEX idx_cities_type ON cities USING GIN(city_types);
CREATE INDEX idx_powers_threat ON powers(threat_level);
CREATE INDEX idx_powers_role ON powers(role);
CREATE INDEX idx_skills_type ON skills(skill_type);
CREATE INDEX idx_characters_faction ON characters(faction_id);
CREATE INDEX idx_characters_location ON characters(current_city);
CREATE INDEX idx_character_powers_char ON character_powers(character_id);
CREATE INDEX idx_character_skills_char ON character_skills(character_id);

-- ============== HELPER FUNCTIONS ==============

-- Calculate derived stats
CREATE OR REPLACE FUNCTION calculate_character_stats()
RETURNS TRIGGER AS $$
BEGIN
  NEW.health := (NEW.sta * 2) + NEW.str;
  NEW.initiative := (NEW.agl + NEW.ins) / 2;
  NEW.karma := (NEW.int + NEW.ins + NEW.con) / 3;
  NEW.movement := 6 + (NEW.agl / 10);
  NEW.carry_capacity := NEW.str * 10;
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER character_stats_trigger
BEFORE INSERT OR UPDATE ON characters
FOR EACH ROW EXECUTE FUNCTION calculate_character_stats();
