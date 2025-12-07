-- SuperHero Tactics Database Schema for Supabase
-- Run this in the Supabase SQL Editor to create all tables

-- ============== WEAPONS ==============
CREATE TABLE IF NOT EXISTS weapons (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  base_damage INTEGER DEFAULT 0,
  damage_type TEXT DEFAULT 'PHYSICAL',
  sub_type TEXT,
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
  cost_level TEXT DEFAULT 'Medium',
  availability TEXT DEFAULT 'Common',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============== GADGETS/VEHICLES ==============
CREATE TABLE IF NOT EXISTS gadgets (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  speed_mph INTEGER DEFAULT 0,
  speed_squares INTEGER DEFAULT 0,
  passengers INTEGER DEFAULT 0,
  cargo_lbs INTEGER DEFAULT 0,
  armor_hp INTEGER DEFAULT 0,
  armor_dr INTEGER DEFAULT 0,
  fuel_type TEXT,
  range_miles INTEGER DEFAULT 0,
  cost_level TEXT DEFAULT 'Medium',
  availability TEXT DEFAULT 'Common',
  special_properties TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============== CITIES ==============
CREATE TABLE IF NOT EXISTS cities (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  country TEXT NOT NULL,
  population INTEGER DEFAULT 0,
  city_type TEXT,
  crime_index INTEGER DEFAULT 0,
  safety_index INTEGER DEFAULT 0,
  hvt_count INTEGER DEFAULT 0,
  latitude REAL DEFAULT 0,
  longitude REAL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============== COUNTRIES ==============
CREATE TABLE IF NOT EXISTS countries (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  region TEXT,
  government_type TEXT,
  population INTEGER DEFAULT 0,
  education_level TEXT,
  faction TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============== POWERS ==============
CREATE TABLE IF NOT EXISTS powers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  threat_level TEXT DEFAULT 'THREAT_1',
  origin_type TEXT,
  damage INTEGER DEFAULT 0,
  range_squares INTEGER DEFAULT 1,
  ap_cost INTEGER DEFAULT 1,
  cooldown INTEGER DEFAULT 0,
  role TEXT DEFAULT 'offense',
  power_type TEXT,
  manifest TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============== SKILLS ==============
CREATE TABLE IF NOT EXISTS skills (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  skill_type TEXT,
  column_shift_bonus TEXT,
  prerequisites TEXT,
  description TEXT,
  combat_application TEXT,
  range_combat_bonus TEXT,
  melee_combat_bonus TEXT,
  investigation_bonus TEXT,
  special_effects TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============== STATUS EFFECTS ==============
CREATE TABLE IF NOT EXISTS status_effects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  duration_turns INTEGER DEFAULT 0,
  damage_per_turn INTEGER DEFAULT 0,
  stat_modifier TEXT,
  can_stack BOOLEAN DEFAULT FALSE,
  cure_method TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============== ARMOR ==============
CREATE TABLE IF NOT EXISTS armor (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT,
  damage_reduction INTEGER DEFAULT 0,
  hp INTEGER DEFAULT 100,
  weight TEXT,
  coverage TEXT,
  special_properties TEXT,
  cost_level TEXT DEFAULT 'Medium',
  availability TEXT DEFAULT 'Common',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============== AMMUNITION ==============
CREATE TABLE IF NOT EXISTS ammunition (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  caliber TEXT,
  damage_modifier REAL DEFAULT 1.0,
  penetration_modifier REAL DEFAULT 1.0,
  special_effects TEXT,
  cost_level TEXT DEFAULT 'Medium',
  availability TEXT DEFAULT 'Common',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============== MARTIAL ARTS STYLES ==============
CREATE TABLE IF NOT EXISTS martial_arts_styles (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  role TEXT,
  primary_stat TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============== MARTIAL ARTS TECHNIQUES ==============
CREATE TABLE IF NOT EXISTS martial_arts_techniques (
  id TEXT PRIMARY KEY,
  style_id TEXT REFERENCES martial_arts_styles(id),
  name TEXT NOT NULL,
  belt_required INTEGER DEFAULT 1,
  ap_cost INTEGER DEFAULT 1,
  effect TEXT,
  damage INTEGER,
  special TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============== INDEXES ==============
CREATE INDEX IF NOT EXISTS idx_weapons_category ON weapons(category);
CREATE INDEX IF NOT EXISTS idx_gadgets_category ON gadgets(category);
CREATE INDEX IF NOT EXISTS idx_cities_country ON cities(country);
CREATE INDEX IF NOT EXISTS idx_powers_threat ON powers(threat_level);
CREATE INDEX IF NOT EXISTS idx_skills_type ON skills(skill_type);
CREATE INDEX IF NOT EXISTS idx_techniques_style ON martial_arts_techniques(style_id);

-- ============== ROW LEVEL SECURITY ==============
-- Enable RLS but allow all operations for now (public game data)
ALTER TABLE weapons ENABLE ROW LEVEL SECURITY;
ALTER TABLE gadgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE cities ENABLE ROW LEVEL SECURITY;
ALTER TABLE countries ENABLE ROW LEVEL SECURITY;
ALTER TABLE powers ENABLE ROW LEVEL SECURITY;
ALTER TABLE skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE status_effects ENABLE ROW LEVEL SECURITY;
ALTER TABLE armor ENABLE ROW LEVEL SECURITY;
ALTER TABLE ammunition ENABLE ROW LEVEL SECURITY;
ALTER TABLE martial_arts_styles ENABLE ROW LEVEL SECURITY;
ALTER TABLE martial_arts_techniques ENABLE ROW LEVEL SECURITY;

-- Allow public read access to all game data
CREATE POLICY "Public read access" ON weapons FOR SELECT USING (true);
CREATE POLICY "Public read access" ON gadgets FOR SELECT USING (true);
CREATE POLICY "Public read access" ON cities FOR SELECT USING (true);
CREATE POLICY "Public read access" ON countries FOR SELECT USING (true);
CREATE POLICY "Public read access" ON powers FOR SELECT USING (true);
CREATE POLICY "Public read access" ON skills FOR SELECT USING (true);
CREATE POLICY "Public read access" ON status_effects FOR SELECT USING (true);
CREATE POLICY "Public read access" ON armor FOR SELECT USING (true);
CREATE POLICY "Public read access" ON ammunition FOR SELECT USING (true);
CREATE POLICY "Public read access" ON martial_arts_styles FOR SELECT USING (true);
CREATE POLICY "Public read access" ON martial_arts_techniques FOR SELECT USING (true);

-- Allow authenticated users to insert/update (for admin)
CREATE POLICY "Auth write access" ON weapons FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Auth write access" ON gadgets FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Auth write access" ON cities FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Auth write access" ON countries FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Auth write access" ON powers FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Auth write access" ON skills FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Auth write access" ON status_effects FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Auth write access" ON armor FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Auth write access" ON ammunition FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Auth write access" ON martial_arts_styles FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Auth write access" ON martial_arts_techniques FOR ALL USING (auth.role() = 'authenticated');

-- Grant anon users INSERT for initial data migration
CREATE POLICY "Anon insert for migration" ON weapons FOR INSERT WITH CHECK (true);
CREATE POLICY "Anon insert for migration" ON gadgets FOR INSERT WITH CHECK (true);
CREATE POLICY "Anon insert for migration" ON cities FOR INSERT WITH CHECK (true);
CREATE POLICY "Anon insert for migration" ON countries FOR INSERT WITH CHECK (true);
CREATE POLICY "Anon insert for migration" ON powers FOR INSERT WITH CHECK (true);
CREATE POLICY "Anon insert for migration" ON skills FOR INSERT WITH CHECK (true);
CREATE POLICY "Anon insert for migration" ON status_effects FOR INSERT WITH CHECK (true);
CREATE POLICY "Anon insert for migration" ON armor FOR INSERT WITH CHECK (true);
CREATE POLICY "Anon insert for migration" ON ammunition FOR INSERT WITH CHECK (true);
CREATE POLICY "Anon insert for migration" ON martial_arts_styles FOR INSERT WITH CHECK (true);
CREATE POLICY "Anon insert for migration" ON martial_arts_techniques FOR INSERT WITH CHECK (true);
