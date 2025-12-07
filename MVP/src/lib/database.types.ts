/**
 * Supabase Database Types
 * Auto-generated type definitions for the SuperHero Tactics database
 */

export interface Database {
  public: {
    Tables: {
      weapons: {
        Row: Weapon;
        Insert: Omit<Weapon, 'id'> & { id?: string };
        Update: Partial<Weapon>;
      };
      gadgets: {
        Row: Gadget;
        Insert: Omit<Gadget, 'id'> & { id?: string };
        Update: Partial<Gadget>;
      };
      cities: {
        Row: City;
        Insert: Omit<City, 'id'> & { id?: string };
        Update: Partial<City>;
      };
      countries: {
        Row: Country;
        Insert: Omit<Country, 'id'> & { id?: string };
        Update: Partial<Country>;
      };
      powers: {
        Row: Power;
        Insert: Omit<Power, 'id'> & { id?: string };
        Update: Partial<Power>;
      };
      skills: {
        Row: Skill;
        Insert: Omit<Skill, 'id'> & { id?: string };
        Update: Partial<Skill>;
      };
      status_effects: {
        Row: StatusEffect;
        Insert: Omit<StatusEffect, 'id'> & { id?: string };
        Update: Partial<StatusEffect>;
      };
      armor: {
        Row: Armor;
        Insert: Omit<Armor, 'id'> & { id?: string };
        Update: Partial<Armor>;
      };
      ammunition: {
        Row: Ammunition;
        Insert: Omit<Ammunition, 'id'> & { id?: string };
        Update: Partial<Ammunition>;
      };
      martial_arts_styles: {
        Row: MartialArtsStyle;
        Insert: Omit<MartialArtsStyle, 'id'> & { id?: string };
        Update: Partial<MartialArtsStyle>;
      };
      martial_arts_techniques: {
        Row: MartialArtsTechnique;
        Insert: Omit<MartialArtsTechnique, 'id'> & { id?: string };
        Update: Partial<MartialArtsTechnique>;
      };
    };
  };
}

// ============== WEAPONS ==============
export interface Weapon {
  id: string;
  name: string;
  category: string;
  base_damage: number;
  damage_type: string;
  sub_type: string | null;
  attack_speed: number;
  range_squares: number;
  accuracy_cs: number;
  reload_time: number;
  skill_required: string | null;
  str_required: number;
  special_effects: string | null;
  penetration_mult: number;
  default_ammo: string | null;
  magazine_size: number;
  cost_level: string;
  availability: string;
  notes: string | null;
  created_at?: string;
}

// ============== GADGETS/VEHICLES ==============
export interface Gadget {
  id: string;
  name: string;
  category: string;
  speed_mph: number;
  speed_squares: number;
  passengers: number;
  cargo_lbs: number;
  armor_hp: number;
  armor_dr: number;
  fuel_type: string | null;
  range_miles: number;
  cost_level: string;
  availability: string;
  special_properties: string | null;
  notes: string | null;
  created_at?: string;
}

// ============== CITIES ==============
export interface City {
  id: string;
  name: string;
  country: string;
  population: number;
  city_type: string;
  crime_index: number;
  safety_index: number;
  hvt_count: number;
  latitude: number;
  longitude: number;
  created_at?: string;
}

// ============== COUNTRIES ==============
export interface Country {
  id: string;
  name: string;
  region: string;
  government_type: string;
  population: number;
  education_level: string;
  faction: string | null;
  created_at?: string;
}

// ============== POWERS ==============
export interface Power {
  id: string;
  name: string;
  description: string;
  threat_level: string;
  origin_type: string;
  damage: number;
  range_squares: number;
  ap_cost: number;
  cooldown: number;
  role: string;
  power_type: string;
  manifest: string;
  created_at?: string;
}

// ============== SKILLS ==============
export interface Skill {
  id: string;
  name: string;
  skill_type: string;
  column_shift_bonus: string | null;
  prerequisites: string | null;
  description: string;
  combat_application: string | null;
  range_combat_bonus: string | null;
  melee_combat_bonus: string | null;
  investigation_bonus: string | null;
  special_effects: string | null;
  created_at?: string;
}

// ============== STATUS EFFECTS ==============
export interface StatusEffect {
  id: string;
  name: string;
  description: string;
  duration_turns: number;
  damage_per_turn: number;
  stat_modifier: string | null;
  can_stack: boolean;
  cure_method: string | null;
  created_at?: string;
}

// ============== ARMOR ==============
export interface Armor {
  id: string;
  name: string;
  category: string;
  damage_reduction: number;
  hp: number;
  weight: string;
  coverage: string;
  special_properties: string | null;
  cost_level: string;
  availability: string;
  created_at?: string;
}

// ============== AMMUNITION ==============
export interface Ammunition {
  id: string;
  name: string;
  caliber: string;
  damage_modifier: number;
  penetration_modifier: number;
  special_effects: string | null;
  cost_level: string;
  availability: string;
  created_at?: string;
}

// ============== MARTIAL ARTS ==============
export interface MartialArtsStyle {
  id: string;
  name: string;
  description: string;
  role: string;
  primary_stat: string;
  created_at?: string;
}

export interface MartialArtsTechnique {
  id: string;
  style_id: string;
  name: string;
  belt_required: number;
  ap_cost: number;
  effect: string;
  damage: number | null;
  special: string | null;
  created_at?: string;
}
