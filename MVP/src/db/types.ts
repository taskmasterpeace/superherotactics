/**
 * TypeScript Types for SuperHero Tactics Database
 * These match the SQLite schema and future Supabase schema
 */

// ============================================================================
// WEAPONS
// ============================================================================

export interface Weapon {
  weapon_id: string;
  name: string;
  category: WeaponCategory;
  base_damage: number;
  damage_type: DamageType;
  sub_type: string;
  attack_speed: number;
  range_squares: number;
  accuracy_cs: string;
  reload_sec: number;
  skill_required: string | null;
  str_required: number | null;
  special_effects: string | null;
  penetration_mult: number;
  default_ammo: string | null;
  magazine_size: number;
  cost_level: CostLevel;
  availability: Availability;
  investigation_bonus: string | null;
  notes: string | null;
}

export type WeaponCategory =
  | 'Melee_Regular'
  | 'Melee_Skill'
  | 'Ranged_Regular'
  | 'Ranged_Skill'
  | 'Special_Ranged'
  | 'Energy_Weapons'
  | 'Grenades'
  | 'Improvised';

export type DamageType =
  | 'PHYSICAL'
  | 'BLEED_PHYSICAL'
  | 'ENERGY'
  | 'FIRE'
  | 'ICE'
  | 'ELECTRIC'
  | 'EXPLOSIVE';

export type DamageSubType =
  | 'EDGED_MELEE'
  | 'SMASHING_MELEE'
  | 'PIERCING_MELEE'
  | 'GUNFIRE'
  | 'BUCKSHOT'
  | 'SLUG'
  | 'EXPLOSIVE';

// ============================================================================
// GADGETS / EQUIPMENT
// ============================================================================

export interface Gadget {
  item_id: string;
  name: string;
  category: GadgetCategory;
  subcategory: string | null;
  speed_mph: number;
  speed_squares_turn: number;
  passengers: number;
  cargo_lbs: number;
  armor_hp: number;
  armor_dr: number;
  fuel_type: string | null;
  range_miles: number;
  cost_level: CostLevel;
  availability: Availability;
  special_properties: string | null;
  notes: string | null;
}

export type GadgetCategory =
  | 'Ground'
  | 'Aircraft'
  | 'Watercraft'
  | 'Drones'
  | 'Hacking_Tools'
  | 'Sensors'
  | 'Communications'
  | 'Weapon_Mods'
  | 'Field_Gear'
  | 'Medical_Tech'
  | 'Surveillance'
  | 'Utility';

// ============================================================================
// WORLD DATA
// ============================================================================

export interface City {
  city_id: string;
  name: string;
  country: string;
  population: number;
  city_type: CityType;
  crime_index: number;
  safety_index: number;
  hvt_count: number;
  coordinates: string | null;
  notes: string | null;
}

export type CityType =
  | 'Political'
  | 'Military'
  | 'Temple'
  | 'Economic'
  | 'Cultural'
  | 'Industrial'
  | 'Port'
  | 'Tourism';

export interface Country {
  country_id: string;
  name: string;
  region: string;
  government_type: string;
  population: number;
  education_level: EducationLevel;
  economy_rank: number;
  faction: string | null;
  notes: string | null;
}

export type EducationLevel =
  | 'None'
  | 'Primary'
  | 'Secondary'
  | 'Trade'
  | 'University'
  | 'Advanced'
  | 'Elite';

// ============================================================================
// POWERS
// ============================================================================

export interface Power {
  power_id: string;
  name: string;
  description: string;
  threat_level: ThreatLevel;
  origin_type: OriginType;
  damage: number;
  range_squares: number;
  ap_cost: number;
  cooldown: number;
  special_effects: string | null;
  role: PowerRole;
  type: PowerType;
  manifest: PowerManifest;
  notes: string | null;
}

export type ThreatLevel =
  | 'ALPHA'
  | 'THREAT_1'
  | 'THREAT_2'
  | 'THREAT_3'
  | 'THREAT_4'
  | 'THREAT_5';

export type OriginType =
  | 'Skilled'
  | 'Altered'
  | 'Tech'
  | 'Mystic'
  | 'Alien'
  | 'Cosmic'
  | 'Mutant'
  | 'Robot'
  | 'Other';

export type PowerRole =
  | 'offense'
  | 'defense'
  | 'mobility'
  | 'support'
  | 'control'
  | 'utility';

export type PowerType =
  | 'psionic'
  | 'elemental'
  | 'physical'
  | 'spatial'
  | 'temporal'
  | 'tech'
  | 'bio'
  | 'nature'
  | 'cosmic'
  | 'symbiotic';

export type PowerManifest =
  | 'beam'
  | 'blast'
  | 'touch'
  | 'aura'
  | 'zone'
  | 'self'
  | 'target'
  | 'summon'
  | 'portal';

// ============================================================================
// STATUS EFFECTS
// ============================================================================

export interface StatusEffect {
  effect_id: string;
  name: string;
  description: string;
  duration_turns: number;
  damage_per_turn: number;
  stat_modifier: string | null;
  can_stack: boolean;
  cure_method: string | null;
  notes: string | null;
}

// ============================================================================
// SKILLS
// ============================================================================

export interface Skill {
  skill_id: string;
  name: string;
  category: SkillCategory;
  description: string;
  stat_bonus: string | null;
  investigation_bonus: string | null;
  combat_bonus: string | null;
  notes: string | null;
}

export type SkillCategory =
  | 'Combat'
  | 'Technical'
  | 'Social'
  | 'Physical'
  | 'Mental'
  | 'Investigation'
  | 'Stealth'
  | 'Medical';

// ============================================================================
// ARMOR
// ============================================================================

export interface Armor {
  armor_id: string;
  name: string;
  category: ArmorCategory;
  damage_reduction: number;
  hp: number;
  weight: string;
  coverage: string;
  special_properties: string | null;
  cost_level: CostLevel;
  availability: Availability;
  notes: string | null;
}

export type ArmorCategory =
  | 'Light'
  | 'Medium'
  | 'Heavy'
  | 'Powered'
  | 'Exotic';

// ============================================================================
// AMMUNITION
// ============================================================================

export interface Ammunition {
  ammo_id: string;
  name: string;
  caliber: string;
  damage_modifier: number;
  penetration_modifier: number;
  special_effects: string | null;
  cost_level: CostLevel;
  availability: Availability;
  notes: string | null;
}

// ============================================================================
// FACTIONS
// ============================================================================

export interface Faction {
  faction_id: string;
  name: string;
  type: FactionType;
  allegiance: string;
  territory: string;
  resources: string;
  relations: string;
  notes: string | null;
}

export type FactionType =
  | 'Government'
  | 'Military'
  | 'Criminal'
  | 'Corporate'
  | 'Religious'
  | 'Superhero'
  | 'Villain';

// ============================================================================
// CHARACTER TEMPLATES
// ============================================================================

export interface CharacterTemplate {
  template_id: string;
  name: string;
  archetype: string;
  stats_mel: number;
  stats_agl: number;
  stats_str: number;
  stats_sta: number;
  stats_int: number;
  stats_ins: number;
  stats_con: number;
  hp_base: number;
  ap_base: number;
  default_powers: string;
  default_equipment: string;
  notes: string | null;
}

// ============================================================================
// MARTIAL ARTS (NEW SYSTEM)
// ============================================================================

export interface MartialArtsStyle {
  style_id: string;
  name: string;
  primary_stat: PrimaryStat;
  role: MartialArtsRole;
  description: string;
  techniques: string; // JSON array of technique IDs
  notes: string | null;
}

export type MartialArtsRole =
  | 'Control & Positioning'
  | 'Finisher & Incapacitation'
  | 'Redirection & Defense'
  | 'Reactive & Efficient'
  | 'Damage & Pressure';

export interface MartialArtsTechnique {
  technique_id: string;
  style_id: string;
  name: string;
  belt_required: BeltRank;
  ap_cost: number;
  damage: number;
  effect: string;
  description: string;
}

export type BeltRank = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

export const BELT_NAMES: Record<BeltRank, string> = {
  1: 'White',
  2: 'Yellow',
  3: 'Orange',
  4: 'Green',
  5: 'Blue',
  6: 'Purple',
  7: 'Brown',
  8: 'Red',
  9: 'Black 1',
  10: 'Black 2',
};

// ============================================================================
// SHARED TYPES
// ============================================================================

export type CostLevel =
  | 'Free'
  | 'Low'
  | 'Medium'
  | 'High'
  | 'Very_High'
  | 'Ultra_High';

export type Availability =
  | 'Common'
  | 'Specialized'
  | 'Restricted'
  | 'Licensed'
  | 'Law_Enforcement'
  | 'Military'
  | 'Military_Only'
  | 'VIP'
  | 'Commercial'
  | 'High_Tech';

export type PrimaryStat =
  | 'MEL'
  | 'AGL'
  | 'STR'
  | 'STA'
  | 'INT'
  | 'INS'
  | 'CON';

// ============================================================================
// COMBAT TYPES
// ============================================================================

export interface CombatWeapon {
  id: string;
  name: string;
  emoji: string;
  damage: number;
  range: number;
  accuracy: number;
  ap: number;
  damageType: DamageType;
  damageSubType: DamageSubType;
  penetration: number;
  ammoType?: string;
  magazineSize?: number;
  currentAmmo?: number;
  skillRequired?: string;
  strRequired?: number;
  specialEffects?: string[];
  visual?: {
    type: 'projectile' | 'beam' | 'melee';
    color?: number;
  };
  sound?: {
    decibels: number;
    baseRange: number;
  };
  knockback?: number;
}

// Conversion function from DB weapon to combat weapon
export function toCombatWeapon(weapon: Weapon): CombatWeapon {
  const isMelee = weapon.category.startsWith('Melee');
  const isEnergy = weapon.category === 'Energy_Weapons';

  return {
    id: weapon.weapon_id,
    name: weapon.name,
    emoji: getWeaponEmoji(weapon.category),
    damage: weapon.base_damage,
    range: weapon.range_squares,
    accuracy: parseAccuracy(weapon.accuracy_cs),
    ap: Math.ceil(weapon.attack_speed),
    damageType: weapon.damage_type,
    damageSubType: weapon.sub_type as DamageSubType,
    penetration: weapon.penetration_mult,
    ammoType: weapon.default_ammo || undefined,
    magazineSize: weapon.magazine_size || undefined,
    skillRequired: weapon.skill_required || undefined,
    strRequired: weapon.str_required || undefined,
    specialEffects: weapon.special_effects?.split(';') || undefined,
    visual: {
      type: isMelee ? 'melee' : isEnergy ? 'beam' : 'projectile',
      color: isEnergy ? 0x00ffff : isMelee ? 0xffffff : 0xffff00,
    },
    sound: {
      decibels: isMelee ? 40 : isEnergy ? 60 : 90,
      baseRange: isMelee ? 5 : isEnergy ? 15 : 30,
    },
    knockback: isEnergy ? 1 : undefined,
  };
}

function getWeaponEmoji(category: WeaponCategory): string {
  switch (category) {
    case 'Melee_Regular':
    case 'Melee_Skill':
      return '🗡️';
    case 'Ranged_Regular':
      return '🔫';
    case 'Ranged_Skill':
      return '🎯';
    case 'Special_Ranged':
      return '💥';
    case 'Energy_Weapons':
      return '⚡';
    case 'Grenades':
      return '💣';
    case 'Improvised':
      return '🪨';
    default:
      return '🔫';
  }
}

function parseAccuracy(cs: string): number {
  // Convert CS notation like "+1CS" or "-2CS" to accuracy percentage
  const match = cs.match(/([+-]?\d+)CS/);
  if (match) {
    const bonus = parseInt(match[1]);
    return 70 + bonus * 10; // Base 70% + 10% per CS
  }
  return 70; // Default
}
