/**
 * CombatScene - Full tactical combat scene for SHT
 *
 * Features:
 * - Beam, cone, projectile visual effects
 * - AI automatic movement for both teams
 * - AI vs AI mode
 * - Sound ring visualization
 * - Line of sight system
 * - Full unit management with health bars
 */

import Phaser from 'phaser';
import { EventBridge, Position, UnitData, ActionPayload, CombatCharacter } from '../EventBridge';
import {
  TILE_SIZE, TILE_WIDTH, TILE_HEIGHT,
  COLORS, TERRAIN_TYPES, TerrainType,
  gridToScreen, screenToGrid, getIsoDepth, MAP_WIDTH, MAP_HEIGHT
} from '../config';
import { GRENADES, calculateThrow, calculateExplosion, type Grenade } from '../../data/explosionSystem';
import { SoundManager } from '../systems/SoundManager';
import {
  WeaponRangeBrackets,
  DEFAULT_RANGE_BRACKETS,
} from '../../data/equipmentTypes';

// Combat statistics tracking interface
interface UnitStats {
  dealt: number;
  taken: number;
  kills: number;
  shots: number;
  hits: number;
  team: 'blue' | 'red';
}

interface KillEntry {
  turn: number;
  killer: string;
  victim: string;
  weapon: string;
  damage: number;
  overkill: number;
}

interface CombatStats {
  totalDamageDealt: { blue: number; red: number };
  totalKills: { blue: number; red: number };
  shotsFired: { blue: number; red: number };
  hits: { blue: number; red: number };
  misses: { blue: number; red: number };
  grazes: { blue: number; red: number };
  criticalHits: { blue: number; red: number };
  damageByUnit: Record<string, UnitStats>;
  killLog: KillEntry[];
  firstBlood: KillEntry | null;
  lastKill: KillEntry | null;
  longestKillstreak: { unit: string | null; streak: number };
  currentStreaks: Record<string, number>;
  mostDamageTaken: { unit: string | null; damage: number };
  turnCount: number;
}

interface CombatAwards {
  mvp: string | null;           // Most damage dealt
  reaper: string | null;        // Most kills
  firstBlood: string | null;    // First kill
  finalBlow: string | null;     // Last kill
  tank: string | null;          // Most damage taken (survived)
  killstreak: string | null;    // Longest killstreak
}

// Weapon definitions with visual effects and range brackets
const WEAPONS = {
  pistol: {
    name: 'Pistol', emoji: '🔫', damage: 20, range: 25, accuracy: 70, ap: 2,
    visual: { type: 'projectile', color: 0xffff00 },
    sound: { decibels: 140, baseRange: 20 },
    rangeBrackets: DEFAULT_RANGE_BRACKETS.pistol,
  },
  rifle: {
    name: 'Assault Rifle', emoji: '🎯', damage: 30, range: 65, accuracy: 70, ap: 3,
    visual: { type: 'projectile', color: 0xffff00 },
    sound: { decibels: 160, baseRange: 25 },
    rangeBrackets: DEFAULT_RANGE_BRACKETS.assault_rifle,
  },
  sniper: {
    name: 'Sniper Rifle', emoji: '🎯', damage: 45, range: 100, accuracy: 75, ap: 4,
    visual: { type: 'projectile', color: 0xffff00 },
    sound: { decibels: 170, baseRange: 30 },
    rangeBrackets: DEFAULT_RANGE_BRACKETS.sniper_rifle,
  },
  shotgun: {
    name: 'Shotgun', emoji: '💥', damage: 40, range: 12, accuracy: 85, ap: 3,
    visual: { type: 'cone', color: 0xff8800, spread: 30 },
    sound: { decibels: 165, baseRange: 25 },
    knockback: 2,
    rangeBrackets: DEFAULT_RANGE_BRACKETS.shotgun,
  },
  smg: {
    name: 'SMG', emoji: '🔫', damage: 20, range: 22, accuracy: 65, ap: 2,
    visual: { type: 'projectile', color: 0xffff00 },
    sound: { decibels: 145, baseRange: 20 },
    rangeBrackets: DEFAULT_RANGE_BRACKETS.smg,
  },
  rpg: {
    name: 'RPG', emoji: '🚀', damage: 80, range: 100, accuracy: 60, ap: 5,
    visual: { type: 'projectile', color: 0xff4400 },
    sound: { decibels: 180, baseRange: 40 },
    knockback: 5,
    blastRadius: 2,
    rangeBrackets: DEFAULT_RANGE_BRACKETS.rocket,
  },
  beam: {
    name: 'Energy Beam', emoji: '⚡', damage: 30, range: 80, accuracy: 75, ap: 2,
    visual: { type: 'beam', color: 0x00ffff },
    sound: { decibels: 70, baseRange: 15 },
    knockback: 2,
    rangeBrackets: DEFAULT_RANGE_BRACKETS.energy,
  },
  beam_wide: {
    name: 'Wide Beam', emoji: '🌊', damage: 25, range: 40, accuracy: 85, ap: 2,
    visual: { type: 'cone', color: 0x00ffff, spread: 45 },
    sound: { decibels: 75, baseRange: 18 },
    knockback: 1,
    rangeBrackets: DEFAULT_RANGE_BRACKETS.energy,
  },
  fist: {
    name: 'Fist', emoji: '👊', damage: 15, range: 1, accuracy: 90, ap: 1,
    visual: { type: 'melee', color: 0xffffff },
    sound: { decibels: 40, baseRange: 5 },
    knockback: 1,
    rangeBrackets: DEFAULT_RANGE_BRACKETS.melee,
  },
  psychic: {
    name: 'Psychic Blast', emoji: '🧠', damage: 35, range: 60, accuracy: 70, ap: 3,
    visual: { type: 'beam', color: 0x8844ff },
    sound: { decibels: 30, baseRange: 5 },
    knockback: 1,
    rangeBrackets: DEFAULT_RANGE_BRACKETS.energy,
  },
  plasma_rifle: {
    name: 'Plasma Rifle', emoji: '🔥', damage: 45, range: 80, accuracy: 70, ap: 3,
    visual: { type: 'projectile', color: 0xff00ff },
    sound: { decibels: 150, baseRange: 22 },
    knockback: 3,
    rangeBrackets: DEFAULT_RANGE_BRACKETS.energy,
  },
  super_punch: {
    name: 'Super Punch', emoji: '💪', damage: 50, range: 1, accuracy: 85, ap: 2,
    visual: { type: 'melee', color: 0xffaa00 },
    sound: { decibels: 80, baseRange: 10 },
    knockback: 4,
    rangeBrackets: DEFAULT_RANGE_BRACKETS.melee,
  },
  machine_gun: {
    name: 'Machine Gun', emoji: '🔫', damage: 25, range: 50, accuracy: 55, ap: 3,
    visual: { type: 'projectile', color: 0xffff00 },
    sound: { decibels: 165, baseRange: 30 },
    rangeBrackets: DEFAULT_RANGE_BRACKETS.machine_gun,
  },
};

type WeaponType = keyof typeof WEAPONS;

// Damage type categories for combat verbs
type DamageType = 'GUNFIRE' | 'BUCKSHOT' | 'BEAM' | 'SMASHING' | 'PSYCHIC';

// Map weapons to damage types
const WEAPON_DAMAGE_TYPES: Record<WeaponType, DamageType> = {
  pistol: 'GUNFIRE',
  rifle: 'GUNFIRE',
  shotgun: 'BUCKSHOT',
  beam: 'BEAM',
  beam_wide: 'BEAM',
  fist: 'SMASHING',
  psychic: 'PSYCHIC',
  plasma_rifle: 'BEAM',
  super_punch: 'SMASHING',
};

// Weapon-specific combat verbs for detailed combat text
const DAMAGE_VERBS: Record<DamageType, { hit: string; crit: string; graze: string; miss: string }> = {
  GUNFIRE: { hit: 'HITS', crit: 'SHREDS', graze: 'grazes', miss: 'misses' },
  BUCKSHOT: { hit: 'BLASTS', crit: 'DEVASTATES', graze: 'peppers', miss: 'sprays wide' },
  BEAM: { hit: 'BURNS', crit: 'INCINERATES', graze: 'scorches', miss: 'fires wide' },
  SMASHING: { hit: 'SMASHES', crit: 'CRUSHES', graze: 'glances', miss: 'swings wide' },
  PSYCHIC: { hit: 'BLASTS', crit: 'SHATTERS', graze: 'rattles', miss: 'fails to connect' },
};

// Hit result categories: MISS < 40, GRAZE 40-70, HIT 70-95, CRIT 95+
type HitResult = 'miss' | 'graze' | 'hit' | 'crit';

function getHitResult(roll: number, accuracy: number): HitResult {
  // Roll is 0-100, accuracy modifies thresholds
  const modifiedRoll = roll + (accuracy - 70) * 0.5; // accuracy 70 is baseline
  if (modifiedRoll < 40) return 'miss';
  if (modifiedRoll < 70) return 'graze';
  if (modifiedRoll < 95) return 'hit';
  return 'crit';
}

// Personality types for AI
const PERSONALITIES = {
  aggressive: { name: 'Aggressive', aiStyle: 'rush', targetPref: 3 },
  cautious: { name: 'Cautious', aiStyle: 'defensive', targetPref: 4 },
  tactical: { name: 'Tactical', aiStyle: 'balanced', targetPref: 3 },
  berserker: { name: 'Berserker', aiStyle: 'rush', targetPref: 1 },
  sniper: { name: 'Sniper', aiStyle: 'ranged', targetPref: 2 },
};

type PersonalityType = keyof typeof PERSONALITIES;

// ============ STATUS EFFECTS ============
const STATUS_EFFECTS = {
  bleeding: { id: 'bleeding', name: 'Bleeding', emoji: '🩸', damagePerTurn: 3, duration: 3, stackable: true, color: 0xff0000 },
  burning: { id: 'burning', name: 'Burning', emoji: '🔥', damagePerTurn: 5, duration: 2, stackable: false, color: 0xff6600 },
  frozen: { id: 'frozen', name: 'Frozen', emoji: '🧊', apPenalty: 2, duration: 1, stackable: false, color: 0x88ddff },
  stunned: { id: 'stunned', name: 'Stunned', emoji: '💫', skipTurn: true, duration: 1, stackable: false, color: 0xffff00 },
  poisoned: { id: 'poisoned', name: 'Poisoned', emoji: '☠️', damagePerTurn: 2, duration: 4, stackable: true, color: 0x00ff00 },
  emp: { id: 'emp', name: 'EMP', emoji: '⚡', apPenalty: 3, duration: 2, stackable: false, color: 0x8844ff },
  suppressed: { id: 'suppressed', name: 'Suppressed', emoji: '📍', accuracyPenalty: 20, duration: 1, stackable: false, color: 0x888888 },
  inspired: { id: 'inspired', name: 'Inspired', emoji: '✨', accuracyBonus: 10, duration: 2, stackable: false, color: 0xffdd00 },
  shielded: { id: 'shielded', name: 'Shielded', emoji: '🛡️', drBonus: 5, duration: 2, stackable: false, color: 0x4488ff },
  incapacitated: { id: 'incapacitated', name: 'Incapacitated', emoji: '😵', skipTurn: true, duration: -1, stackable: false, color: 0x666666 },
  grappled: { id: 'grappled', name: 'Grappled', emoji: '🤼', skipTurn: false, duration: -1, stackable: false, color: 0xdd8800 },
};

type StatusEffectType = keyof typeof STATUS_EFFECTS;

// ============ STANCES ============
const STANCES = {
  normal: { id: 'normal', name: 'Normal', emoji: '🧍', accuracyMod: 0, evasionMod: 0, apCostMod: 0, description: 'Balanced stance' },
  aggressive: { id: 'aggressive', name: 'Aggressive', emoji: '😠', accuracyMod: 15, evasionMod: -15, apCostMod: 0, description: '+15% accuracy, -15% evasion' },
  defensive: { id: 'defensive', name: 'Defensive', emoji: '🛡️', accuracyMod: -15, evasionMod: 25, apCostMod: 0, description: '-15% accuracy, +25% evasion' },
  overwatch: { id: 'overwatch', name: 'Overwatch', emoji: '👁️', accuracyMod: 10, evasionMod: -10, apCostMod: 0, description: 'Reaction shot on enemy movement' },
  sneaking: { id: 'sneaking', name: 'Sneaking', emoji: '🤫', accuracyMod: -10, evasionMod: 20, apCostMod: 1, description: 'Reduced detection, +1 AP cost' },
};

type StanceType = keyof typeof STANCES;

// ============ GRAPPLE POSITIONS (Simplified) ============
const GRAPPLE_POSITIONS = {
  standing: { id: 'standing', name: 'Standing', emoji: '🧍', description: 'Not grappling', transitions: ['clinch'] },
  clinch: { id: 'clinch', name: 'Clinch', emoji: '🤼', description: 'Close quarters grapple', transitions: ['standing', 'ground'], damageBonus: 5 },
  ground: { id: 'ground', name: 'Ground', emoji: '🏋️', description: 'Ground control position', transitions: ['clinch', 'standing'], damageBonus: 10, escapepenalty: -20 },
};

type GrapplePosition = keyof typeof GRAPPLE_POSITIONS;

// ============ INJURY TABLE (d100) ============
const INJURY_TABLE = [
  // 1-5: Fatal
  { range: [1, 5], severity: 'FATAL', effects: ['instant_death'], description: 'Catastrophic damage - instantly fatal', emoji: '💀' },
  // 6-15: Permanent Disability
  { range: [6, 10], severity: 'PERMANENT', effects: ['crippled_leg'], description: 'Leg destroyed - permanent movement penalty', emoji: '🦿' },
  { range: [11, 15], severity: 'PERMANENT', effects: ['crippled_arm'], description: 'Arm destroyed - permanent accuracy penalty', emoji: '🦾' },
  // 16-40: Severe
  { range: [16, 25], severity: 'SEVERE', effects: ['broken_bone'], description: 'Broken bone - major penalties until healed', emoji: '🦴' },
  { range: [26, 35], severity: 'SEVERE', effects: ['concussion'], description: 'Severe concussion - accuracy impaired', emoji: '🤕' },
  { range: [36, 40], severity: 'SEVERE', effects: ['bleeding'], description: 'Deep laceration - continuous bleeding', emoji: '🩸' },
  // 41-70: Moderate
  { range: [41, 50], severity: 'MODERATE', effects: ['bleeding'], description: 'Bleeding wound', emoji: '🩸' },
  { range: [51, 60], severity: 'MODERATE', effects: ['winded'], description: 'Wind knocked out - AP reduced', emoji: '💨' },
  { range: [61, 70], severity: 'MODERATE', effects: ['dazed'], description: 'Dazed and confused - accuracy penalty', emoji: '💫' },
  // 71-90: Light
  { range: [71, 80], severity: 'LIGHT', effects: ['bruised'], description: 'Badly bruised - minor penalty', emoji: '🟣' },
  { range: [81, 90], severity: 'LIGHT', effects: [], description: 'Grazed - minimal effect', emoji: '😤' },
  // 91-100: Lucky
  { range: [91, 100], severity: 'LUCKY', effects: [], description: 'Lucky escape - no lasting injury', emoji: '🍀' },
];

// ============ COVER TYPES ============
const COVER_BONUSES = {
  none: { evasionBonus: 0, drBonus: 0, description: 'No cover' },
  half: { evasionBonus: 25, drBonus: 2, description: 'Half cover (+25% evasion)' },
  full: { evasionBonus: 50, drBonus: 5, description: 'Full cover (+50% evasion)' },
};

type CoverType = keyof typeof COVER_BONUSES;

// ============ POWER CATEGORIES ============
type PowerRole = 'offense' | 'defense' | 'mobility' | 'support' | 'control' | 'utility';
type PowerType = 'psionic' | 'elemental' | 'physical' | 'spatial' | 'temporal' | 'tech' | 'bio' | 'nature' | 'cosmic' | 'symbiotic';
type PowerManifest = 'beam' | 'blast' | 'touch' | 'aura' | 'zone' | 'self' | 'target' | 'summon' | 'portal';

// ============ SPECIAL POWERS ============
const SPECIAL_POWERS = {
  // === MOBILITY POWERS ===
  teleport: {
    id: 'teleport',
    name: 'Teleport',
    emoji: '✨',
    role: 'mobility' as PowerRole,
    type: 'spatial' as PowerType,
    manifest: 'self' as PowerManifest,
    apCost: 2,
    range: 8,
    cooldown: 2,
    description: 'Instantly move to target location within range',
  },
  portal: {
    id: 'portal',
    name: 'Dimensional Door',
    emoji: '🚪',
    role: 'mobility' as PowerRole,
    type: 'spatial' as PowerType,
    manifest: 'portal' as PowerManifest,
    apCost: 3,
    range: 10,
    cooldown: 4,
    duration: 3, // Lasts 3 turns
    description: 'Create entry/exit portals - allies can walk through',
  },
  phase: {
    id: 'phase',
    name: 'Phase Shift',
    emoji: '👻',
    role: 'mobility' as PowerRole,
    type: 'spatial' as PowerType,
    manifest: 'self' as PowerManifest,
    apCost: 2,
    cooldown: 3,
    duration: 1,
    description: 'Become intangible - move through walls this turn',
  },
  superSpeed: {
    id: 'superSpeed',
    name: 'Super Speed',
    emoji: '💨',
    role: 'mobility' as PowerRole,
    type: 'physical' as PowerType,
    manifest: 'self' as PowerManifest,
    apCost: 1,
    cooldown: 2,
    bonusMove: 6, // Extra tiles this turn
    description: 'Burst of speed - move 6 extra tiles this turn',
  },

  // === OFFENSE POWERS ===
  psychicBlast: {
    id: 'psychicBlast',
    name: 'Psychic Blast',
    emoji: '🧠',
    role: 'offense' as PowerRole,
    type: 'psionic' as PowerType,
    manifest: 'beam' as PowerManifest,
    apCost: 3,
    damage: 35,
    range: 7,
    cooldown: 2,
    canStun: true,
    description: 'Mental attack that can stun',
  },
  fireball: {
    id: 'fireball',
    name: 'Fireball',
    emoji: '🔥',
    role: 'offense' as PowerRole,
    type: 'elemental' as PowerType,
    manifest: 'blast' as PowerManifest,
    apCost: 3,
    damage: 25,
    range: 6,
    radius: 2, // 2 tile blast radius
    cooldown: 2,
    statusEffect: 'burning' as StatusEffectType,
    description: 'Explosive fire blast - burns targets in area',
  },
  iceBolt: {
    id: 'iceBolt',
    name: 'Ice Bolt',
    emoji: '❄️',
    role: 'offense' as PowerRole,
    type: 'elemental' as PowerType,
    manifest: 'beam' as PowerManifest,
    apCost: 2,
    damage: 20,
    range: 6,
    cooldown: 2,
    statusEffect: 'frozen' as StatusEffectType,
    description: 'Freezing bolt - slows target',
  },
  lightningChain: {
    id: 'lightningChain',
    name: 'Chain Lightning',
    emoji: '⚡',
    role: 'offense' as PowerRole,
    type: 'elemental' as PowerType,
    manifest: 'target' as PowerManifest,
    apCost: 3,
    damage: 20,
    range: 5,
    bounces: 2, // Hits up to 2 additional targets
    cooldown: 3,
    description: 'Lightning that chains to nearby enemies',
  },
  gravityCrush: {
    id: 'gravityCrush',
    name: 'Gravity Crush',
    emoji: '🌀',
    role: 'offense' as PowerRole,
    type: 'cosmic' as PowerType,
    manifest: 'zone' as PowerManifest,
    apCost: 4,
    damage: 30,
    range: 5,
    radius: 2,
    cooldown: 4,
    pullToCenter: true, // Pulls enemies toward center
    description: 'Creates gravity well - pulls and crushes enemies',
  },

  // === DEFENSE POWERS ===
  forceField: {
    id: 'forceField',
    name: 'Force Field',
    emoji: '🛡️',
    role: 'defense' as PowerRole,
    type: 'cosmic' as PowerType,
    manifest: 'zone' as PowerManifest,
    apCost: 2,
    range: 4,
    cooldown: 3,
    duration: 2,
    blocksMovement: true,
    blocksProjectiles: true,
    description: 'Creates barrier wall that blocks movement and attacks',
  },
  energyShield: {
    id: 'energyShield',
    name: 'Energy Shield',
    emoji: '🔵',
    role: 'defense' as PowerRole,
    type: 'tech' as PowerType,
    manifest: 'target' as PowerManifest,
    apCost: 2,
    range: 4,
    cooldown: 3,
    duration: 3,
    drBonus: 10,
    description: 'Grants +10 DR to self or ally',
  },
  reflect: {
    id: 'reflect',
    name: 'Reflect',
    emoji: '🪞',
    role: 'defense' as PowerRole,
    type: 'cosmic' as PowerType,
    manifest: 'self' as PowerManifest,
    apCost: 1,
    cooldown: 4,
    duration: 1,
    reflectDamage: 0.5, // Reflects 50% damage back
    description: 'Next attack against you reflects 50% back',
  },

  // === CONTROL POWERS ===
  webSnare: {
    id: 'webSnare',
    name: 'Web Snare',
    emoji: '🕸️',
    role: 'control' as PowerRole,
    type: 'bio' as PowerType,
    manifest: 'target' as PowerManifest,
    apCost: 2,
    range: 5,
    cooldown: 2,
    duration: 2,
    immobilize: true,
    description: 'Immobilizes target for 2 turns',
  },
  mindControl: {
    id: 'mindControl',
    name: 'Mind Control',
    emoji: '🎭',
    role: 'control' as PowerRole,
    type: 'psionic' as PowerType,
    manifest: 'target' as PowerManifest,
    apCost: 4,
    range: 4,
    cooldown: 5,
    duration: 1,
    switchTeam: true, // Target acts for your team this turn
    description: 'Control enemy for 1 turn',
  },
  gravityWell: {
    id: 'gravityWell',
    name: 'Gravity Well',
    emoji: '⬛',
    role: 'control' as PowerRole,
    type: 'cosmic' as PowerType,
    manifest: 'zone' as PowerManifest,
    apCost: 3,
    range: 6,
    radius: 2,
    cooldown: 3,
    duration: 2,
    slowsMovement: 2, // Costs +2 AP to move through
    description: 'Zone that slows all movement',
  },

  // === SUPPORT POWERS ===
  heal: {
    id: 'heal',
    name: 'Heal',
    emoji: '💚',
    role: 'support' as PowerRole,
    type: 'bio' as PowerType,
    manifest: 'target' as PowerManifest,
    apCost: 2,
    healAmount: 25,
    range: 3,
    cooldown: 3,
    description: 'Heal self or ally for 25 HP',
  },
  inspire: {
    id: 'inspire',
    name: 'Inspire',
    emoji: '📢',
    role: 'support' as PowerRole,
    type: 'psionic' as PowerType,
    manifest: 'aura' as PowerManifest,
    apCost: 2,
    radius: 3,
    cooldown: 4,
    duration: 2,
    accuracyBonus: 15,
    description: 'Allies in radius gain +15% accuracy',
  },
  empower: {
    id: 'empower',
    name: 'Empower',
    emoji: '💪',
    role: 'support' as PowerRole,
    type: 'cosmic' as PowerType,
    manifest: 'target' as PowerManifest,
    apCost: 2,
    range: 4,
    cooldown: 3,
    duration: 2,
    damageBonus: 10,
    description: 'Ally deals +10 damage for 2 turns',
  },

  // === UTILITY POWERS ===
  invisibility: {
    id: 'invisibility',
    name: 'Invisibility',
    emoji: '👁️‍🗨️',
    role: 'utility' as PowerRole,
    type: 'spatial' as PowerType,
    manifest: 'self' as PowerManifest,
    apCost: 2,
    cooldown: 4,
    duration: 2,
    invisible: true, // Enemies can't target directly
    description: 'Become invisible for 2 turns - broken by attacking',
  },
  decoy: {
    id: 'decoy',
    name: 'Holographic Decoy',
    emoji: '🎪',
    role: 'utility' as PowerRole,
    type: 'tech' as PowerType,
    manifest: 'summon' as PowerManifest,
    apCost: 2,
    range: 4,
    cooldown: 3,
    duration: 2,
    description: 'Create decoy that draws enemy fire',
  },
  scan: {
    id: 'scan',
    name: 'Tactical Scan',
    emoji: '🔍',
    role: 'utility' as PowerRole,
    type: 'tech' as PowerType,
    manifest: 'aura' as PowerManifest,
    apCost: 1,
    radius: 8,
    cooldown: 2,
    revealsStealth: true,
    showsHealth: true,
    description: 'Reveal hidden enemies and show enemy HP',
  },
};

type SpecialPower = keyof typeof SPECIAL_POWERS;

interface StatusEffectInstance {
  type: StatusEffectType;
  duration: number;
  stacks?: number;
}

interface InjuryInstance {
  type: string;
  severity: string;
  description: string;
  permanent: boolean;
}

interface Unit {
  id: string;
  name: string;
  codename: string;
  team: 'blue' | 'red' | 'green';
  hp: number;
  maxHp: number;
  ap: number;
  maxAp: number;
  position: Position;
  facing: number;
  statusEffects: StatusEffectInstance[];
  injuries: InjuryInstance[];
  weapon: WeaponType;
  personality: PersonalityType;
  str: number;
  agl: number;
  evasion: number; // Base evasion
  dr: number; // Damage reduction (armor)
  acted: boolean;
  visible: boolean;
  stance: StanceType;
  grappleState: {
    position: GrapplePosition;
    targetId: string | null;
  };
  powers: SpecialPower[];
  powerCooldowns: Record<string, number>;
  overwatching: boolean; // Set during overwatch mode
  spriteId?: string;
  // Phaser objects
  sprite?: Phaser.GameObjects.Sprite;
  healthBar?: Phaser.GameObjects.Graphics;
  healthBarBg?: Phaser.GameObjects.Rectangle;
  nameText?: Phaser.GameObjects.Text;
  selectionTile?: Phaser.GameObjects.Graphics;
  effectsContainer?: Phaser.GameObjects.Container;
  statusIconsText?: Phaser.GameObjects.Text; // Emoji status icons
  stanceText?: Phaser.GameObjects.Text; // Stance indicator
}

interface MapTile {
  x: number;
  y: number;
  terrain: TerrainType;
  sprite?: Phaser.GameObjects.Rectangle;
  occupant?: string;
}

type ActionMode = 'idle' | 'move' | 'attack' | 'throw' | 'overwatch' | 'deploy' | 'teleport' | 'grapple';

export class CombatScene extends Phaser.Scene {
  private mapWidth: number = 15;
  private mapHeight: number = 15;
  private tiles: MapTile[][] = [];
  private units: Map<string, Unit> = new Map();
  private selectedUnitId: string | null = null;
  private currentTeam: 'blue' | 'red' = 'blue';
  private playerTeam: 'blue' | 'red' = 'blue';
  private roundNumber: number = 1;
  private actionMode: ActionMode = 'idle';
  private aiVsAi: boolean = false;
  private aiSpeed: number = 600;
  private animating: boolean = false;
  private verboseLog: boolean = true; // Toggle detailed combat log

  // Visual layers
  private tileLayer!: Phaser.GameObjects.Container;
  private gridLayer!: Phaser.GameObjects.Container;
  private rangeLayer!: Phaser.GameObjects.Container;
  private unitLayer!: Phaser.GameObjects.Container;
  private effectsLayer!: Phaser.GameObjects.Container;
  private uiLayer!: Phaser.GameObjects.Container;

  // LOS graphics
  private losGraphics?: Phaser.GameObjects.Graphics;

  // Path preview layer for movement
  private pathPreviewLayer!: Phaser.GameObjects.Container;
  private hoverPreviewText?: Phaser.GameObjects.Text;

  // Camera controls
  private isDragging: boolean = false;
  private dragStartX: number = 0;
  private dragStartY: number = 0;

  // Offset for centered map
  private offsetX: number = 0;
  private offsetY: number = 0;

  // Characters received from game store
  private pendingBlueTeam: CombatCharacter[] = [];
  private pendingRedTeam: CombatCharacter[] = [];
  private useCustomTeams: boolean = false;
  private pendingGrenade: { id: string; name: string } | null = null;

  // Sound system
  private soundManager: SoundManager | null = null;
  private soundConfig: Record<string, string> = {};

  // Combat statistics tracking
  private combatStats: CombatStats = this.createEmptyCombatStats();

  private createEmptyCombatStats(): CombatStats {
    return {
      totalDamageDealt: { blue: 0, red: 0 },
      totalKills: { blue: 0, red: 0 },
      shotsFired: { blue: 0, red: 0 },
      hits: { blue: 0, red: 0 },
      misses: { blue: 0, red: 0 },
      grazes: { blue: 0, red: 0 },
      criticalHits: { blue: 0, red: 0 },
      damageByUnit: {},
      killLog: [],
      firstBlood: null,
      lastKill: null,
      longestKillstreak: { unit: null, streak: 0 },
      currentStreaks: {},
      mostDamageTaken: { unit: null, damage: 0 },
      turnCount: 0,
    };
  }

  constructor() {
    super({ key: 'CombatScene' });
  }

  // Map equipment/powers to weapon types
  private mapEquipmentToWeapon(equipment: string[], powers: string[]): WeaponType {
    // Check powers first for special abilities
    const powerStr = powers.join(' ').toLowerCase();
    if (powerStr.includes('psychic') || powerStr.includes('telepat') || powerStr.includes('mental')) {
      return 'psychic';
    }
    if (powerStr.includes('beam') || powerStr.includes('optic') || powerStr.includes('laser') || powerStr.includes('energy')) {
      return 'beam';
    }
    if (powerStr.includes('fire') || powerStr.includes('heat') || powerStr.includes('plasma')) {
      return 'beam_wide';
    }

    // Check equipment
    const equipStr = equipment.join(' ').toLowerCase();
    if (equipStr.includes('rifle') || equipStr.includes('assault')) {
      return 'rifle';
    }
    if (equipStr.includes('shotgun')) {
      return 'shotgun';
    }
    if (equipStr.includes('pistol') || equipStr.includes('gun') || equipStr.includes('firearm')) {
      return 'pistol';
    }
    if (equipStr.includes('shield') || equipStr.includes('fist') || equipStr.includes('martial')) {
      return 'fist';
    }

    // Default based on stats - high strength = melee, high agility = pistol
    return 'fist';
  }

  // Get personality from powers/equipment
  private determinePersonality(stats: CombatCharacter['stats'], powers: string[]): PersonalityType {
    const powerStr = powers.join(' ').toLowerCase();

    if (powerStr.includes('sniper') || powerStr.includes('marksman')) return 'sniper';
    if (powerStr.includes('berserker') || powerStr.includes('rage')) return 'berserker';

    // Based on stats
    if (stats.AGL > 70 && stats.INT > 60) return 'tactical';
    if (stats.STR > 65 && stats.AGL > 60) return 'aggressive';
    if (stats.CON > 65 && stats.INS > 60) return 'cautious';

    return 'tactical';
  }

  create(): void {
    this.calculateOffset();
    this.setupLayers();
    this.setupCamera();
    this.setupInput();
    this.setupEventBridge();
    this.generateTestMap();
    this.spawnTestUnits();

    // Initialize sound system
    this.initSoundSystem();

    // Notify combat started
    EventBridge.emit('combat-started', {
      mapId: 'test_map',
      teams: ['blue', 'red'],
    });

    EventBridge.emit('turn-changed', {
      team: this.currentTeam,
      round: this.roundNumber,
    });

    // Emit all units data for React UI
    this.emitAllUnitsData();

    // Initialize fog of war - hide enemies not in LOS
    this.updateFogOfWar();
  }

  private calculateOffset(): void {
    const canvasWidth = this.scale.width;
    const canvasHeight = this.scale.height;
    // For isometric, the map spans from top-left corner (0,0) to bottom-right
    // The width spans from top-right to top-left, height from top to bottom
    // Total screen width: (mapWidth + mapHeight) * TILE_WIDTH / 2
    // Total screen height: (mapWidth + mapHeight) * TILE_HEIGHT / 2
    const isoWidth = (this.mapWidth + this.mapHeight) * (TILE_WIDTH / 2);
    const isoHeight = (this.mapWidth + this.mapHeight) * (TILE_HEIGHT / 2);
    // Center the isometric map and add offset for the top corner
    this.offsetX = canvasWidth / 2;
    this.offsetY = (canvasHeight - isoHeight) / 2 + TILE_HEIGHT / 2;
  }

  private setupLayers(): void {
    this.tileLayer = this.add.container(0, 0);
    this.gridLayer = this.add.container(0, 0);
    this.rangeLayer = this.add.container(0, 0);
    this.pathPreviewLayer = this.add.container(0, 0);
    this.unitLayer = this.add.container(0, 0);
    this.effectsLayer = this.add.container(0, 0);
    this.uiLayer = this.add.container(0, 0);
    this.uiLayer.setScrollFactor(0);
  }

  update(): void {
    // Sort unitLayer children by depth every frame so selection tiles stay behind sprites
    this.unitLayer.sort('depth');
  }

  private async initSoundSystem(): Promise<void> {
    try {
      // Load sound config mapping
      const configResponse = await fetch('soundConfig.json');
      this.soundConfig = await configResponse.json();
      console.log('[CombatScene] Loaded sound config:', Object.keys(this.soundConfig).length, 'mappings');

      // Load sound catalog directly (not using SoundManager)
      const catalogResponse = await fetch('assets/sounds/catalog.json');
      const catalog = await catalogResponse.json();
      (this as any).soundCatalog = catalog;
      console.log('[CombatScene] Sound catalog loaded with', Object.keys(catalog).length - 1, 'sounds');
    } catch (error) {
      console.error('[CombatScene] Failed to initialize sound system:', error);
    }
  }

  /**
   * Play a sound by config key (e.g. 'weapon.pistol', 'impact.crit')
   * Uses HTML5 Audio for direct playback - no preloading needed!
   */
  private playSound(configKey: string, position?: { x: number; y: number }): void {
    const catalogKey = this.soundConfig[configKey];
    if (!catalogKey) {
      console.warn(`[CombatScene] No sound mapping for: ${configKey}`);
      return;
    }

    const catalog = (this as any).soundCatalog || {};
    const entry = catalog[catalogKey];
    if (!entry || !entry.files || entry.files.length === 0) {
      console.warn(`[CombatScene] Sound not in catalog: ${catalogKey}`);
      return;
    }

    // Pick random variant
    const variantIndex = Math.floor(Math.random() * entry.files.length);
    const soundPath = `assets/${entry.files[variantIndex]}`;

    // Use HTML5 Audio for direct playback (no preloading needed)
    try {
      const audio = new Audio(soundPath);
      audio.volume = 0.5;
      audio.play().catch(e => {
        // Autoplay might be blocked, that's ok
        console.warn(`[CombatScene] Audio blocked: ${e.message}`);
      });
      console.log(`[CombatScene] 🔊 Playing: ${configKey} -> ${catalogKey}`);
    } catch (error) {
      console.error(`[CombatScene] Failed to play: ${soundPath}`, error);
    }
  }

  /**
   * Get sound config key for a grenade type
   */
  private getGrenadeSoundKey(grenadeName: string): string {
    const name = grenadeName.toLowerCase();
    if (name.includes('emp')) return 'grenade.emp';
    if (name.includes('flash')) return 'grenade.flash';
    if (name.includes('cryo')) return 'grenade.cryo';
    if (name.includes('incendiary')) return 'grenade.incendiary';
    if (name.includes('smoke')) return 'grenade.frag'; // Smoke uses soft pop
    if (name.includes('plasma')) return 'grenade.frag';
    return 'grenade.frag'; // Default
  }

  /**
   * Play sound only if the selected unit can hear it (within range)
   * This simulates the player "hearing" through their selected unit
   */
  private playSoundIfInRange(configKey: string, position: { x: number; y: number }, hearingRange: number): void {
    // Get selected unit position as the "listener"
    const selectedUnit = this.selectedUnitId ? this.units.get(this.selectedUnitId) : null;

    if (!selectedUnit) {
      // No unit selected - use camera center as listener (fallback)
      this.playSound(configKey, position);
      return;
    }

    // Calculate distance from selected unit to sound source
    const dx = Math.abs(selectedUnit.position.x - position.x);
    const dy = Math.abs(selectedUnit.position.y - position.y);
    const distance = dx + dy; // Manhattan distance

    // Only play if within hearing range
    if (distance <= hearingRange) {
      // Volume decreases with distance
      const volumeFactor = 1 - (distance / hearingRange) * 0.5;
      this.playSoundWithVolume(configKey, position, volumeFactor);
      console.log(`[CombatScene] 🔊 Unit ${selectedUnit.name} hears sound at distance ${distance}/${hearingRange}`);
    } else {
      console.log(`[CombatScene] 🔇 Unit ${selectedUnit.name} too far to hear (${distance} > ${hearingRange})`);
    }
  }

  /**
   * Play sound with custom volume
   */
  private playSoundWithVolume(configKey: string, position: { x: number; y: number }, volumeFactor: number): void {
    const catalogKey = this.soundConfig[configKey];
    if (!catalogKey) return;

    const catalog = (this as any).soundCatalog || {};
    const entry = catalog[catalogKey];
    if (!entry || !entry.files || entry.files.length === 0) return;

    const variantIndex = Math.floor(Math.random() * entry.files.length);
    const soundPath = `assets/${entry.files[variantIndex]}`;

    try {
      const audio = new Audio(soundPath);
      audio.volume = Math.max(0.1, Math.min(1, 0.5 * volumeFactor));
      audio.play().catch(() => { });
      console.log(`[CombatScene] 🔊 Playing at ${Math.round(volumeFactor * 100)}% volume: ${configKey}`);
    } catch (error) {
      // Ignore
    }
  }

  private setupCamera(): void {
    // Isometric world bounds
    const isoWidth = (this.mapWidth + this.mapHeight) * (TILE_WIDTH / 2);
    const isoHeight = (this.mapWidth + this.mapHeight) * (TILE_HEIGHT / 2);

    this.cameras.main.setBounds(
      this.offsetX - isoWidth / 2 - 200,
      this.offsetY - 200,
      isoWidth + 400,
      isoHeight + 400
    );
    // Center on the middle of the isometric grid (tile at mapWidth/2, mapHeight/2)
    const centerTile = gridToScreen(
      Math.floor(this.mapWidth / 2),
      Math.floor(this.mapHeight / 2),
      this.offsetX,
      this.offsetY
    );
    this.cameras.main.centerOn(centerTile.x, centerTile.y);
  }

  private setupInput(): void {
    // Middle mouse / right mouse drag to pan
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (pointer.middleButtonDown() || pointer.rightButtonDown()) {
        this.isDragging = true;
        this.dragStartX = pointer.x;
        this.dragStartY = pointer.y;
      }
    });

    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (this.isDragging) {
        const dx = pointer.x - this.dragStartX;
        const dy = pointer.y - this.dragStartY;
        this.cameras.main.scrollX -= dx;
        this.cameras.main.scrollY -= dy;
        this.dragStartX = pointer.x;
        this.dragStartY = pointer.y;
      }
    });

    this.input.on('pointerup', () => {
      this.isDragging = false;
    });

    // Mouse wheel zoom
    this.input.on('wheel', (
      _pointer: Phaser.Input.Pointer,
      _gameObjects: any[],
      _deltaX: number,
      deltaY: number
    ) => {
      const zoom = this.cameras.main.zoom;
      const newZoom = Phaser.Math.Clamp(zoom - deltaY * 0.001, 0.5, 2);
      this.cameras.main.setZoom(newZoom);
    });

    // Keyboard shortcuts
    this.input.keyboard?.on('keydown-A', () => this.setActionMode('attack'));
    this.input.keyboard?.on('keydown-M', () => this.setActionMode('move'));
    this.input.keyboard?.on('keydown-T', () => this.setActionMode('throw'));
    this.input.keyboard?.on('keydown-O', () => this.setActionMode('overwatch'));
    this.input.keyboard?.on('keydown-ESC', () => this.cancelAction());
    this.input.keyboard?.on('keydown-E', () => this.endTurn());

    // Teleport (X key)
    this.input.keyboard?.on('keydown-X', () => {
      const unit = this.selectedUnitId ? this.units.get(this.selectedUnitId) : null;
      if (unit?.powers.includes('teleport')) {
        this.setActionMode('teleport');
        this.emitToUI('combat-log', { message: '✨ Select teleport destination...', type: 'system' });
      } else {
        this.emitToUI('combat-log', { message: '❌ Selected unit cannot teleport!', type: 'system' });
      }
    });

    // Stances (1-4 number keys)
    this.input.keyboard?.on('keydown-ONE', () => this.changeStance('normal'));
    this.input.keyboard?.on('keydown-TWO', () => this.changeStance('aggressive'));
    this.input.keyboard?.on('keydown-THREE', () => this.changeStance('defensive'));
    this.input.keyboard?.on('keydown-FOUR', () => this.changeStance('overwatch'));

    // Grapple (G key)
    this.input.keyboard?.on('keydown-G', () => {
      this.setActionMode('grapple');
      this.emitToUI('combat-log', { message: '🤼 Select target to grapple...', type: 'system' });
    });

    // Toggle verbose log (V key)
    this.input.keyboard?.on('keydown-V', () => {
      this.verboseLog = !this.verboseLog;
      this.emitToUI('combat-log', {
        message: `📝 Combat log: ${this.verboseLog ? 'VERBOSE' : 'CONCISE'}`,
        type: 'system'
      });
    });
  }

  private changeStance(stance: StanceType): void {
    const unit = this.selectedUnitId ? this.units.get(this.selectedUnitId) : null;
    if (!unit) return;

    if (unit.team !== this.currentTeam) {
      this.emitToUI('combat-log', { message: '❌ Cannot change stance for other team!', type: 'system' });
      return;
    }

    this.setUnitStance(unit, stance);
  }

  private setupEventBridge(): void {
    // Listen for combat load with characters from game store
    EventBridge.on('load-combat', (data: { blueTeam: CombatCharacter[]; redTeam: CombatCharacter[]; mapId?: string }) => {
      console.log('[COMBAT] Received load-combat with teams:', data.blueTeam.length, 'blue,', data.redTeam.length, 'red');
      this.pendingBlueTeam = data.blueTeam;
      this.pendingRedTeam = data.redTeam;
      this.useCustomTeams = true;

      // Clear existing units and respawn with new teams
      this.clearAllUnits();
      this.spawnFromGameStore();
      this.emitAllUnitsData();
    });

    // Listen for React commands
    EventBridge.on('select-unit', (data: { unitId: string }) => {
      this.selectUnit(data.unitId);
    });

    EventBridge.on('start-move-mode', () => {
      this.setActionMode('move');
    });

    EventBridge.on('start-attack-mode', () => {
      this.setActionMode('attack');
    });

    EventBridge.on('start-throw-mode', () => {
      this.setActionMode('throw');
    });

    EventBridge.on('activate-power', (data: { unitId: string; powerId: string }) => {
      const unit = this.units.get(data.unitId);
      if (!unit) return;

      // Set action mode based on power type
      if (data.powerId === 'teleport') {
        this.setActionMode('teleport');
        EventBridge.emit('log-entry', {
          id: `power_${Date.now()}`,
          timestamp: Date.now(),
          type: 'system',
          actor: 'System',
          message: `✨ Select teleport destination...`,
        });
      }
      // Add other power types here as they are implemented
    });

    EventBridge.on('execute-action', (action: ActionPayload) => {
      this.executeAction(action);
    });

    EventBridge.on('cancel-action', () => {
      this.cancelAction();
    });

    EventBridge.on('end-turn', () => {
      this.endTurn();
    });

    EventBridge.on('toggle-ai-vs-ai', () => {
      this.toggleAiVsAi();
    });

    EventBridge.on('run-ai-turn', () => {
      this.runAiTurn();
    });

    // Handle grenade throw from QuickInventory
    EventBridge.on('start-grenade-throw', (data: { grenadeId: string; grenadeName: string }) => {
      console.log('[GRENADE] Received start-grenade-throw:', data);

      const unit = this.selectedUnitId ? this.units.get(this.selectedUnitId) : null;
      if (!unit) return;

      if (unit.team !== this.currentTeam) {
        EventBridge.emit('log-entry', {
          id: `grenade_${Date.now()}`,
          timestamp: Date.now(),
          type: 'system',
          actor: 'System',
          message: `❌ Cannot throw - not your turn!`,
        });
        return;
      }

      if (unit.ap < 2) {
        EventBridge.emit('log-entry', {
          id: `grenade_${Date.now()}`,
          timestamp: Date.now(),
          type: 'system',
          actor: 'System',
          message: `❌ Not enough AP! (Need 2)`,
        });
        return;
      }

      this.pendingGrenade = { id: data.grenadeId, name: data.grenadeName };
      this.setActionMode('throw');
      this.showGrenadeRange(unit);

      EventBridge.emit('log-entry', {
        id: `grenade_${Date.now()}`,
        timestamp: Date.now(),
        type: 'system',
        actor: unit.name,
        message: `💣 ${unit.name} prepares ${data.grenadeName}! Click target...`,
      });
    });
  }

  private generateTestMap(): void {
    // Initialize empty map
    for (let y = 0; y < this.mapHeight; y++) {
      this.tiles[y] = [];
      for (let x = 0; x < this.mapWidth; x++) {
        this.tiles[y][x] = {
          x,
          y,
          terrain: 'FLOOR',
        };
      }
    }

    // Add some walls (simple room structure)
    // Room 1
    for (let x = 5; x <= 9; x++) {
      this.setTerrain(x, 4, 'WALL');
      this.setTerrain(x, 8, 'WALL');
    }
    for (let y = 4; y <= 8; y++) {
      this.setTerrain(5, y, 'WALL');
      this.setTerrain(9, y, 'WALL');
    }
    this.setTerrain(7, 4, 'DOOR_OPEN');
    this.setTerrain(7, 8, 'DOOR_OPEN');

    // Add cover positions
    this.setTerrain(2, 7, 'LOW_WALL');
    this.setTerrain(3, 7, 'LOW_WALL');
    this.setTerrain(11, 6, 'LOW_WALL');
    this.setTerrain(12, 6, 'LOW_WALL');
    this.setTerrain(7, 11, 'LOW_WALL');
    this.setTerrain(7, 12, 'LOW_WALL');

    // Render tiles
    this.renderMap();
  }

  private setTerrain(x: number, y: number, terrain: TerrainType): void {
    if (this.tiles[y] && this.tiles[y][x]) {
      this.tiles[y][x].terrain = terrain;
    }
  }

  private renderMap(): void {
    this.tileLayer.removeAll(true);
    this.gridLayer.removeAll(true);

    // Render in depth order (back to front) for proper isometric layering
    for (let depth = 0; depth < this.mapWidth + this.mapHeight - 1; depth++) {
      for (let x = 0; x <= depth; x++) {
        const y = depth - x;
        if (x >= this.mapWidth || y >= this.mapHeight || y < 0) continue;

        const tile = this.tiles[y][x];
        const screenPos = gridToScreen(x, y, this.offsetX, this.offsetY);

        // Draw diamond tile
        const color = this.getTerrainColor(tile.terrain);
        const diamond = this.add.polygon(
          screenPos.x,
          screenPos.y,
          [
            0, -TILE_HEIGHT / 2,           // Top
            TILE_WIDTH / 2, 0,              // Right
            0, TILE_HEIGHT / 2,             // Bottom
            -TILE_WIDTH / 2, 0              // Left
          ],
          color
        );
        diamond.setDepth(getIsoDepth(x, y));
        this.tileLayer.add(diamond);

        // Diamond grid outline
        const outline = this.add.polygon(
          screenPos.x,
          screenPos.y,
          [
            0, -TILE_HEIGHT / 2,
            TILE_WIDTH / 2, 0,
            0, TILE_HEIGHT / 2,
            -TILE_WIDTH / 2, 0
          ]
        );
        outline.setStrokeStyle(1, COLORS.GRID_LINE, 0.4);
        outline.setFillStyle(0x000000, 0);
        outline.setDepth(getIsoDepth(x, y) + 0.1);
        this.gridLayer.add(outline);

        // Tile coordinates display (debug - can be removed later)
        // const coordText = this.add.text(screenPos.x, screenPos.y, `${x},${y}`, {
        //   fontSize: '10px', color: '#888888', align: 'center'
        // });
        // coordText.setOrigin(0.5);
        // coordText.setDepth(getIsoDepth(x, y) + 0.2);
        // this.gridLayer.add(coordText);
      }
    }

    // Set up click detection using a full-screen interactive zone
    // We use screenToGrid to determine which tile was clicked
    this.setupIsometricInput();
  }

  private setupIsometricInput(): void {
    // Create an invisible full-screen hit area for isometric click detection
    const hitZone = this.add.zone(
      this.scale.width / 2,
      this.scale.height / 2,
      this.scale.width * 2,
      this.scale.height * 2
    );
    hitZone.setInteractive();
    hitZone.setDepth(-1000); // Behind everything

    hitZone.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (pointer.leftButtonDown()) {
        // Convert screen position to world position (accounting for camera)
        const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
        const gridPos = screenToGrid(worldPoint.x, worldPoint.y, this.offsetX, this.offsetY);

        // Check if valid tile
        if (gridPos.x >= 0 && gridPos.x < this.mapWidth &&
          gridPos.y >= 0 && gridPos.y < this.mapHeight) {
          this.onTileClick(gridPos.x, gridPos.y);
        }
      }
    });

    hitZone.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
      const gridPos = screenToGrid(worldPoint.x, worldPoint.y, this.offsetX, this.offsetY);

      if (gridPos.x >= 0 && gridPos.x < this.mapWidth &&
        gridPos.y >= 0 && gridPos.y < this.mapHeight) {
        this.onTileHover(gridPos.x, gridPos.y);
      }
    });

    this.gridLayer.add(hitZone);
  }

  private getTerrainColor(terrain: TerrainType): number {
    switch (terrain) {
      case 'FLOOR':
      case 'CONCRETE':
        return COLORS.TERRAIN_CONCRETE;
      case 'GRASS':
        return COLORS.TERRAIN_GRASS;
      case 'WALL':
        return COLORS.TERRAIN_WALL;
      case 'WATER':
        return COLORS.TERRAIN_WATER;
      case 'LOW_WALL':
        return 0x666666;
      case 'DOOR_CLOSED':
        return 0x8b4513;
      case 'DOOR_OPEN':
        return 0x4a3728;
      default:
        return COLORS.TERRAIN_CONCRETE;
    }
  }

  private spawnTestUnits(): void {
    // Blue team - using soldier sprites
    this.spawnUnit({
      id: 'alpha',
      name: 'Alpha',
      codename: 'Team Lead',
      team: 'blue',
      hp: 100,
      maxHp: 100,
      ap: 6,
      maxAp: 6,
      position: { x: 2, y: 5 },
      facing: 90,
      statusEffects: [],
      weapon: 'rifle',
      personality: 'tactical',
      str: 60,
      agl: 70,
      acted: false,
      visible: true,
      spriteId: 'soldier_15', // Tactical operator
    });

    this.spawnUnit({
      id: 'sniper',
      name: 'Ghost',
      codename: 'Sniper',
      team: 'blue',
      hp: 70,
      maxHp: 70,
      ap: 5,
      maxAp: 5,
      position: { x: 2, y: 9 },
      facing: 90,
      statusEffects: [],
      weapon: 'rifle',
      personality: 'sniper',
      str: 45,
      agl: 80,
      acted: false,
      visible: true,
      spriteId: 'soldier_06', // Sniper in ghillie suit
    });

    this.spawnUnit({
      id: 'tech',
      name: 'Spark',
      codename: 'Tech Ops',
      team: 'blue',
      hp: 75,
      maxHp: 75,
      ap: 5,
      maxAp: 5,
      position: { x: 1, y: 7 },
      facing: 90,
      statusEffects: [],
      weapon: 'beam',
      personality: 'tactical',
      str: 50,
      agl: 60,
      acted: false,
      visible: true,
      spriteId: 'soldier_28', // Tech soldier with drone
    });

    // Red team - enemy soldiers
    this.spawnUnit({
      id: 'hostile1',
      name: 'Hostile',
      codename: 'Rifleman',
      team: 'red',
      hp: 50,
      maxHp: 50,
      ap: 4,
      maxAp: 4,
      position: { x: 12, y: 5 },
      facing: 270,
      statusEffects: [],
      weapon: 'rifle',
      personality: 'aggressive',
      str: 45,
      agl: 40,
      acted: false,
      visible: true,
      spriteId: 'soldier_01', // Standard rifleman
    });

    this.spawnUnit({
      id: 'hostile2',
      name: 'Heavy',
      codename: 'Gunner',
      team: 'red',
      hp: 80,
      maxHp: 80,
      ap: 4,
      maxAp: 4,
      position: { x: 13, y: 7 },
      facing: 270,
      statusEffects: [],
      weapon: 'shotgun',
      personality: 'berserker',
      str: 65,
      agl: 35,
      acted: false,
      visible: true,
      spriteId: 'soldier_04', // Heavy with LMG
    });

    this.spawnUnit({
      id: 'hostile3',
      name: 'Rocket',
      codename: 'Boom',
      team: 'red',
      hp: 55,
      maxHp: 55,
      ap: 4,
      maxAp: 4,
      position: { x: 12, y: 9 },
      facing: 270,
      statusEffects: [],
      weapon: 'shotgun',
      personality: 'sniper',
      str: 50,
      agl: 45,
      acted: false,
      visible: true,
      spriteId: 'soldier_07', // Rocket launcher soldier
    });

    // Add a teleporter to blue team for testing powers
    this.spawnUnit({
      id: 'teleporter',
      name: 'Blink',
      codename: 'Phase',
      team: 'blue',
      hp: 60,
      maxHp: 60,
      ap: 6,
      maxAp: 6,
      position: { x: 3, y: 6 },
      facing: 90,
      weapon: 'pistol',
      personality: 'tactical',
      str: 40,
      agl: 85,
      evasion: 50,
      powers: ['teleport', 'phase'],
      spriteId: 'soldier_11', // SMG soldier (agile looking)
    });

    // Add a portal user - can create dimensional doors
    this.spawnUnit({
      id: 'gatekeeper',
      name: 'Rift',
      codename: 'Gateway',
      team: 'blue',
      hp: 55,
      maxHp: 55,
      ap: 6,
      maxAp: 6,
      position: { x: 1, y: 5 },
      facing: 90,
      weapon: 'pistol',
      personality: 'tactical',
      str: 35,
      agl: 60,
      evasion: 40,
      powers: ['portal', 'invisibility'],
      spriteId: 'soldier_19', // Shield soldier
    });

    // Add a healer/support
    this.spawnUnit({
      id: 'medic',
      name: 'Doc',
      codename: 'Medic',
      team: 'blue',
      hp: 65,
      maxHp: 65,
      ap: 6,
      maxAp: 6,
      position: { x: 1, y: 9 },
      facing: 90,
      weapon: 'pistol',
      personality: 'cautious',
      str: 40,
      agl: 55,
      evasion: 35,
      powers: ['heal', 'energyShield', 'inspire'],
      spriteId: 'soldier_05', // Rifleman (medic look)
    });

    // Add a fire user to red team
    this.spawnUnit({
      id: 'pyro',
      name: 'Blaze',
      codename: 'Pyro',
      team: 'red',
      hp: 70,
      maxHp: 70,
      ap: 5,
      maxAp: 5,
      position: { x: 11, y: 6 },
      facing: 270,
      weapon: 'beam_wide',
      personality: 'aggressive',
      str: 55,
      agl: 50,
      evasion: 30,
      powers: ['fireball', 'iceBolt'],
      spriteId: 'soldier_08', // Another rifleman
    });

    // Add a control specialist to red team
    this.spawnUnit({
      id: 'controller',
      name: 'Snare',
      codename: 'Controller',
      team: 'red',
      hp: 60,
      maxHp: 60,
      ap: 5,
      maxAp: 5,
      position: { x: 11, y: 8 },
      facing: 270,
      weapon: 'psychic',
      personality: 'tactical',
      str: 40,
      agl: 65,
      evasion: 45,
      powers: ['webSnare', 'gravityWell', 'psychicBlast'],
      spriteId: 'soldier_09', // Another soldier
    });

    // Select first blue unit
    this.selectUnit('alpha');
  }

  private clearAllUnits(): void {
    // Destroy all unit visuals and clear map
    this.units.forEach(unit => {
      unit.sprite?.destroy();
      unit.healthBar?.destroy();
      unit.healthBarBg?.destroy();
      unit.nameText?.destroy();
      unit.selectionTile?.destroy();
      unit.effectsContainer?.destroy();
      unit.statusIconsText?.destroy();
      unit.stanceText?.destroy();

      // Clear tile occupant
      if (this.tiles[unit.position.y]?.[unit.position.x]) {
        this.tiles[unit.position.y][unit.position.x].occupant = undefined;
      }
    });

    this.units.clear();
    this.selectedUnitId = null;
    this.combatEnded = false;
    this.roundNumber = 1;
    this.currentTeam = 'blue';
  }

  private spawnFromGameStore(): void {
    console.log('[COMBAT] Spawning from game store:', this.pendingBlueTeam.length, 'blue,', this.pendingRedTeam.length, 'red');

    // Spawn blue team (player's characters)
    const bluePositions = [
      { x: 2, y: 5 },
      { x: 2, y: 7 },
      { x: 2, y: 9 },
      { x: 1, y: 6 },
      { x: 1, y: 8 },
    ];

    this.pendingBlueTeam.forEach((char, index) => {
      const pos = bluePositions[index % bluePositions.length];
      const weapon = this.mapEquipmentToWeapon(char.equipment, char.powers);
      const personality = this.determinePersonality(char.stats, char.powers);

      // Calculate HP from STA stat (base 50 + STA)
      const maxHp = 50 + char.stats.STA;
      // Calculate AP from AGL stat (base 4 + AGL/20)
      const maxAp = Math.min(8, 4 + Math.floor(char.stats.AGL / 20));

      // Assign a random soldier sprite (1-32)
      const spriteNum = ((index * 7 + 1) % 32) + 1; // Deterministic but varied
      const spriteId = `soldier_${spriteNum.toString().padStart(2, '0')}`;

      this.spawnUnit({
        id: char.id,
        name: char.name,
        codename: char.realName || char.name,
        team: 'blue',
        hp: Math.min(char.health.current, maxHp),
        maxHp,
        ap: maxAp,
        maxAp,
        position: pos,
        facing: 90,
        statusEffects: [],
        weapon,
        personality,
        str: char.stats.STR,
        agl: char.stats.AGL,
        acted: false,
        visible: true,
        spriteId,
      });
    });

    // Spawn red team (enemies)
    const redPositions = [
      { x: 12, y: 5 },
      { x: 12, y: 7 },
      { x: 12, y: 9 },
      { x: 13, y: 6 },
      { x: 13, y: 8 },
    ];

    this.pendingRedTeam.forEach((char, index) => {
      const pos = redPositions[index % redPositions.length];
      const weapon = this.mapEquipmentToWeapon(char.equipment, char.powers);
      const personality = this.determinePersonality(char.stats, char.powers);

      const maxHp = 50 + char.stats.STA;
      const maxAp = Math.min(8, 4 + Math.floor(char.stats.AGL / 20));

      // Assign a different soldier sprite for enemies (offset by 16)
      const spriteNum = ((index * 5 + 17) % 32) + 1; // Different pattern than blue team
      const spriteId = `soldier_${spriteNum.toString().padStart(2, '0')}`;

      this.spawnUnit({
        id: char.id,
        name: char.name,
        codename: char.realName || char.name,
        team: 'red',
        hp: Math.min(char.health.current, maxHp),
        maxHp,
        ap: maxAp,
        maxAp,
        position: pos,
        facing: 270,
        statusEffects: [],
        weapon,
        personality,
        str: char.stats.STR,
        agl: char.stats.AGL,
        acted: false,
        visible: true,
        spriteId,
      });
    });

    // Select first blue unit if any
    const firstBlue = Array.from(this.units.values()).find(u => u.team === 'blue');
    if (firstBlue) {
      this.selectUnit(firstBlue.id);
    }

    // Log the spawn
    EventBridge.emit('log-entry', {
      id: `spawn_${Date.now()}`,
      timestamp: Date.now(),
      type: 'system',
      actor: 'System',
      message: `⚔️ Combat begins! ${this.pendingBlueTeam.length} vs ${this.pendingRedTeam.length}`,
    });

    // Initialize fog of war for the new combat
    this.updateFogOfWar();
  }

  private spawnUnit(unitData: Partial<Unit> & { id: string; name: string; team: 'blue' | 'red' | 'green'; position: Position }): void {
    // Provide defaults for all required fields
    const unit: Unit = {
      id: unitData.id,
      name: unitData.name,
      codename: unitData.codename || unitData.name,
      team: unitData.team,
      hp: unitData.hp ?? 100,
      maxHp: unitData.maxHp ?? 100,
      ap: unitData.ap ?? 6,
      maxAp: unitData.maxAp ?? 6,
      position: unitData.position,
      facing: unitData.facing ?? 90,
      statusEffects: unitData.statusEffects ?? [],
      injuries: unitData.injuries ?? [],
      weapon: unitData.weapon ?? 'rifle',
      personality: unitData.personality ?? 'tactical',
      str: unitData.str ?? 50,
      agl: unitData.agl ?? 50,
      evasion: unitData.evasion ?? 30,
      dr: unitData.dr ?? 0,
      acted: unitData.acted ?? false,
      visible: unitData.visible ?? true,
      stance: unitData.stance ?? 'normal',
      grappleState: unitData.grappleState ?? { position: 'standing', targetId: null },
      powers: unitData.powers ?? [],
      powerCooldowns: unitData.powerCooldowns ?? {},
      overwatching: unitData.overwatching ?? false,
      spriteId: unitData.spriteId,
    };
    // Convert grid position to isometric screen position
    const screenPos = gridToScreen(unit.position.x, unit.position.y, this.offsetX, this.offsetY);
    const depth = getIsoDepth(unit.position.x, unit.position.y) + 100; // Units above tiles

    // Team color tint (subtle tint for team identification)
    const teamTint = unit.team === 'blue' ? 0xaaccff :
      unit.team === 'red' ? 0xffaaaa : 0xaaffaa;

    // Use actual soldier sprite if spriteId is set, otherwise fallback to circle
    const spriteTextureKey = unit.spriteId || null;
    const targetHeight = TILE_HEIGHT * 1.5; // Soldiers should be about 1.5 tiles tall

    if (spriteTextureKey && this.textures.exists(spriteTextureKey)) {
      // Use the soldier sprite
      unit.sprite = this.add.sprite(screenPos.x, screenPos.y, spriteTextureKey);
      // Scale sprite to fit nicely on the grid
      const texture = this.textures.get(spriteTextureKey);
      const frame = texture.get();
      const scale = targetHeight / frame.height;
      unit.sprite.setScale(scale);
      // Set origin to bottom-center so soldiers stand on the tile
      unit.sprite.setOrigin(0.5, 1);
      // Apply subtle team tint
      unit.sprite.setTint(teamTint);
      // Flip sprite based on facing direction
      // Sprites face right by default, flip if facing left (90-270 degrees)
      unit.sprite.setFlipX(unit.facing > 90 && unit.facing < 270);
    } else {
      // Fallback to placeholder circle sprite
      const teamColor = unit.team === 'blue' ? COLORS.TEAM_BLUE :
        unit.team === 'red' ? COLORS.TEAM_RED : COLORS.TEAM_GREEN;
      const unitRadius = TILE_WIDTH / 5;
      const graphics = this.make.graphics({ x: 0, y: 0 });
      graphics.fillStyle(teamColor, 1);
      graphics.fillCircle(unitRadius, unitRadius, unitRadius);
      graphics.lineStyle(3, 0xffffff, 1);
      graphics.strokeCircle(unitRadius, unitRadius, unitRadius);
      const textureKey = `unit_placeholder_${unit.id}`;
      graphics.generateTexture(textureKey, unitRadius * 2, unitRadius * 2);
      graphics.destroy();
      unit.sprite = this.add.sprite(screenPos.x, screenPos.y, textureKey);
      unit.sprite.setOrigin(0.5, 0.5);
    }

    unit.sprite.setData('unitId', unit.id);
    unit.sprite.setInteractive();
    unit.sprite.on('pointerdown', () => this.onUnitClick(unit.id));
    unit.sprite.setDepth(depth);
    this.unitLayer.add(unit.sprite);

    // Calculate sprite height for positioning other elements
    const spriteHeight = unit.sprite.displayHeight;
    const spriteTop = screenPos.y - spriteHeight;

    // Tile-based selection indicator (glowing diamond border)
    // Draw an isometric diamond shape matching the tile the unit stands on
    const tileGraphics = this.add.graphics();
    tileGraphics.lineStyle(3, 0x00ff00, 1); // Bright green border
    tileGraphics.fillStyle(0x00ff00, 0.15); // Subtle green fill
    // Draw diamond shape centered at tile position
    tileGraphics.beginPath();
    tileGraphics.moveTo(screenPos.x, screenPos.y - TILE_HEIGHT / 2); // Top
    tileGraphics.lineTo(screenPos.x + TILE_WIDTH / 2, screenPos.y);   // Right
    tileGraphics.lineTo(screenPos.x, screenPos.y + TILE_HEIGHT / 2); // Bottom
    tileGraphics.lineTo(screenPos.x - TILE_WIDTH / 2, screenPos.y);   // Left
    tileGraphics.closePath();
    tileGraphics.fillPath();
    tileGraphics.strokePath();
    tileGraphics.setVisible(false);
    tileGraphics.setDepth(depth - 10); // Below the unit but above tiles
    this.unitLayer.add(tileGraphics);
    unit.selectionTile = tileGraphics;

    // Health bar background - position above the sprite
    const barWidth = TILE_WIDTH / 2;
    unit.healthBarBg = this.add.rectangle(
      screenPos.x,
      spriteTop - 8,
      barWidth,
      6,
      0x333333
    );
    unit.healthBarBg.setDepth(depth + 0.1);
    this.unitLayer.add(unit.healthBarBg);

    // Health bar fill
    unit.healthBar = this.add.graphics();
    unit.healthBar.setDepth(depth + 0.2);
    this.updateHealthBar(unit);
    this.unitLayer.add(unit.healthBar);

    // Name text - position below the sprite feet
    unit.nameText = this.add.text(
      screenPos.x,
      screenPos.y + 4,
      unit.name,
      { fontSize: '11px', color: '#ffffff', align: 'center' }
    );
    unit.nameText.setOrigin(0.5, 0);
    unit.nameText.setDepth(depth + 0.3);
    this.unitLayer.add(unit.nameText);

    // Status effects container - above health bar
    unit.effectsContainer = this.add.container(screenPos.x, spriteTop - 20);
    unit.effectsContainer.setDepth(depth + 0.4);
    this.unitLayer.add(unit.effectsContainer);

    // Status icons text (emojis) - above health bar
    unit.statusIconsText = this.add.text(
      screenPos.x,
      spriteTop - 24,
      '',
      { fontSize: '14px', align: 'center' }
    );
    unit.statusIconsText.setOrigin(0.5, 1);
    unit.statusIconsText.setDepth(depth + 0.5);
    this.unitLayer.add(unit.statusIconsText);

    // Stance indicator - to the right of the unit
    unit.stanceText = this.add.text(
      screenPos.x + TILE_WIDTH / 3,
      screenPos.y - spriteHeight / 2,
      STANCES[unit.stance].emoji,
      { fontSize: '16px' }
    );
    unit.stanceText.setOrigin(0, 0.5);
    unit.stanceText.setDepth(depth + 0.5);
    this.unitLayer.add(unit.stanceText);

    // Update status display
    this.updateStatusIcons(unit);

    // Mark tile as occupied
    this.tiles[unit.position.y][unit.position.x].occupant = unit.id;

    this.units.set(unit.id, unit);
  }

  private updateHealthBar(unit: Unit): void {
    if (!unit.healthBar || !unit.sprite) return;

    unit.healthBar.clear();
    const barWidth = TILE_WIDTH / 2;
    const pixelX = unit.sprite.x - barWidth / 2;
    // Position above sprite head
    const spriteHeight = unit.sprite.displayHeight;
    const pixelY = unit.sprite.y - spriteHeight - 10;

    const healthPercent = unit.hp / unit.maxHp;
    let healthColor = COLORS.HEALTH_FULL;
    if (healthPercent < 0.25) healthColor = COLORS.HEALTH_LOW;
    else if (healthPercent < 0.5) healthColor = COLORS.HEALTH_HALF;

    unit.healthBar.fillStyle(healthColor, 1);
    unit.healthBar.fillRect(pixelX, pixelY, barWidth * healthPercent, 6);
  }

  private updateStatusIcons(unit: Unit): void {
    if (!unit.statusIconsText) return;

    // Build emoji string from active status effects
    const emojis = unit.statusEffects.map(effect => {
      const effectDef = STATUS_EFFECTS[effect.type];
      return effectDef?.emoji || '❓';
    }).join('');

    unit.statusIconsText.setText(emojis);

    // Update stance indicator
    if (unit.stanceText) {
      unit.stanceText.setText(STANCES[unit.stance].emoji);
    }
  }

  private applyStatusEffect(unit: Unit, effectType: StatusEffectType): void {
    const effectDef = STATUS_EFFECTS[effectType];
    if (!effectDef) return;

    // Check if already has this effect
    const existingIdx = unit.statusEffects.findIndex(e => e.type === effectType);

    if (existingIdx >= 0) {
      if (effectDef.stackable) {
        // Stack the effect
        unit.statusEffects[existingIdx].stacks = (unit.statusEffects[existingIdx].stacks || 1) + 1;
        unit.statusEffects[existingIdx].duration = effectDef.duration;
      } else {
        // Refresh duration
        unit.statusEffects[existingIdx].duration = effectDef.duration;
      }
    } else {
      // Add new effect
      unit.statusEffects.push({
        type: effectType,
        duration: effectDef.duration,
        stacks: 1,
      });
    }

    this.updateStatusIcons(unit);
    this.emitToUI('status-applied', { unitId: unit.id, effect: effectType, emoji: effectDef.emoji });
  }

  private processStatusEffects(unit: Unit): { damage: number; skipTurn: boolean; messages: string[] } {
    let totalDamage = 0;
    let skipTurn = false;
    const messages: string[] = [];

    // Process each status effect
    for (let i = unit.statusEffects.length - 1; i >= 0; i--) {
      const effect = unit.statusEffects[i];
      const effectDef = STATUS_EFFECTS[effect.type];
      if (!effectDef) continue;

      // Apply damage-over-time
      if ('damagePerTurn' in effectDef && effectDef.damagePerTurn) {
        const stacks = effect.stacks || 1;
        const damage = effectDef.damagePerTurn * stacks;
        totalDamage += damage;
        messages.push(`${effectDef.emoji} ${unit.name} takes ${damage} ${effectDef.name} damage!`);
      }

      // Check for skip turn
      if ('skipTurn' in effectDef && effectDef.skipTurn) {
        skipTurn = true;
        messages.push(`${effectDef.emoji} ${unit.name} is ${effectDef.name} and cannot act!`);
      }

      // Reduce duration (if not permanent)
      if (effect.duration > 0) {
        effect.duration--;
        if (effect.duration <= 0) {
          messages.push(`${effectDef.emoji} ${unit.name}'s ${effectDef.name} wears off.`);
          unit.statusEffects.splice(i, 1);
        }
      }
    }

    this.updateStatusIcons(unit);
    return { damage: totalDamage, skipTurn, messages };
  }

  /**
   * Process status effects for all units on a team at the start of their turn
   */
  private processTeamStatusEffects(team: 'blue' | 'red'): void {
    const teamUnits = Array.from(this.units.values()).filter(u => u.team === team && u.hp > 0);

    for (const unit of teamUnits) {
      const result = this.processStatusEffects(unit);

      // Log messages
      for (const msg of result.messages) {
        this.emitToUI('combat-log', { message: msg, type: 'status' });
      }

      // Apply DOT damage
      if (result.damage > 0) {
        unit.hp -= result.damage;
        this.updateHealthBar(unit);

        // Show floating damage
        const screenPos = gridToScreen(unit.position.x, unit.position.y, this.offsetX, this.offsetY);
        this.showFloatingDamage(screenPos.x, screenPos.y, result.damage, 0xff0000);

        // Check for death from DOT
        if (unit.hp <= 0) {
          this.killUnit(unit, 'Status Effect');
        }
      }

      // Mark unit as having their turn skipped if stunned/incapacitated
      if (result.skipTurn) {
        unit.acted = true;
      }
    }
  }

  /**
   * Reduce power cooldowns for all units on a team at the start of their turn
   */
  private reducePowerCooldowns(team: 'blue' | 'red'): void {
    const teamUnits = Array.from(this.units.values()).filter(u => u.team === team && u.hp > 0);

    for (const unit of teamUnits) {
      for (const powerId of Object.keys(unit.powerCooldowns)) {
        if (unit.powerCooldowns[powerId] > 0) {
          unit.powerCooldowns[powerId]--;
        }
      }
    }
  }

  /**
   * Check if a unit is incapacitated (stunned/incapacitated status)
   */
  private isUnitIncapacitated(unit: Unit): boolean {
    return unit.statusEffects.some(e => {
      const effectDef = STATUS_EFFECTS[e.type];
      return effectDef && 'skipTurn' in effectDef && effectDef.skipTurn;
    });
  }

  /**
   * Show floating damage text at a position
   */
  private showFloatingDamage(x: number, y: number, damage: number, color: number): void {
    const colorHex = '#' + color.toString(16).padStart(6, '0');
    const damageText = this.add.text(x, y - 50, `-${damage}`, {
      fontSize: '18px',
      color: colorHex,
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 3,
    });
    damageText.setOrigin(0.5, 1);
    damageText.setDepth(200);

    this.tweens.add({
      targets: damageText,
      y: y - 90,
      alpha: 0,
      duration: 1200,
      ease: 'Power2',
      onComplete: () => damageText.destroy(),
    });
  }

  /**
   * Kill a unit (wrapper for unitDied for status effect deaths)
   */
  private killUnit(unit: Unit, cause: string): void {
    // Use 'status_effect' as the killer ID for DOT deaths
    this.unitDied(unit.id, 'status_effect', 0, cause);
  }

  /**
   * Calculate if an attack would likely kill the target
   * Returns: { willKill: boolean, expectedDamage: number, confidence: string }
   */
  private calculateKillThreshold(attacker: Unit, target: Unit, weapon: typeof WEAPONS[WeaponType]): {
    willKill: boolean;
    expectedDamage: number;
    confidence: 'likely' | 'possible' | 'unlikely';
    unconsciousThreshold: number;
  } {
    // Calculate expected damage (using average hit result)
    const baseDamage = weapon.damage + Math.floor(attacker.str / 10);
    const avgDamageMultiplier = 0.85; // Weighted average: 25% graze (0.5) + 60% hit (1.0) + 15% crit (1.5)
    const expectedDamage = Math.floor(baseDamage * avgDamageMultiplier);

    // Unconscious threshold is 0 HP - unit is incapacitated but not dead
    // Kill threshold is determined by whether damage would cause instant death (massive overkill)
    const unconsciousThreshold = target.hp;
    const willKill = expectedDamage >= target.hp;

    // Confidence based on damage vs HP ratio
    let confidence: 'likely' | 'possible' | 'unlikely';
    const ratio = expectedDamage / target.hp;
    if (ratio >= 1.2) confidence = 'likely';
    else if (ratio >= 0.8) confidence = 'possible';
    else confidence = 'unlikely';

    return { willKill, expectedDamage, confidence, unconsciousThreshold };
  }

  private rollInjury(unit: Unit, damage: number, isCritical: boolean): InjuryInstance | null {
    // Only roll injury on critical hits or massive overkill damage
    if (!isCritical && damage < unit.maxHp * 0.5) return null;

    const roll = Math.floor(Math.random() * 100) + 1;
    const injury = INJURY_TABLE.find(i => roll >= i.range[0] && roll <= i.range[1]);

    if (!injury) return null;

    const injuryInstance: InjuryInstance = {
      type: injury.effects[0] || 'none',
      severity: injury.severity,
      description: injury.description,
      permanent: injury.severity === 'PERMANENT',
    };

    // Apply injury effects
    if (injury.effects.includes('instant_death')) {
      unit.hp = 0;
      this.emitToUI('combat-log', { message: `💀 ${unit.name} suffers FATAL INJURY!`, type: 'injury' });
    } else if (injury.effects.includes('bleeding')) {
      this.applyStatusEffect(unit, 'bleeding');
    }

    unit.injuries.push(injuryInstance);
    this.emitToUI('combat-log', { message: `${injury.emoji} ${unit.name}: ${injury.description}`, type: 'injury' });

    return injuryInstance;
  }

  private getCoverBonus(unit: Unit): CoverType {
    // Check adjacent tiles for cover-providing terrain
    const { x, y } = unit.position;
    const adjacentTiles = [
      { x: x - 1, y }, { x: x + 1, y },
      { x, y: y - 1 }, { x, y: y + 1 },
    ];

    let bestCover: CoverType = 'none';

    for (const pos of adjacentTiles) {
      if (pos.x < 0 || pos.x >= this.mapWidth || pos.y < 0 || pos.y >= this.mapHeight) continue;
      const tile = this.tiles[pos.y][pos.x];
      if (tile.terrain === 'WALL') {
        return 'full'; // Wall provides full cover
      } else if (tile.terrain === 'LOW_WALL' && bestCover !== 'full') {
        bestCover = 'half'; // Low wall provides half cover
      }
    }

    return bestCover;
  }

  private setUnitStance(unit: Unit, stance: StanceType): void {
    unit.stance = stance;
    unit.overwatching = stance === 'overwatch';
    this.updateStatusIcons(unit);

    const stanceDef = STANCES[stance];
    this.emitToUI('combat-log', {
      message: `${stanceDef.emoji} ${unit.name} enters ${stanceDef.name} stance!`,
      type: 'system'
    });
  }

  private incapacitateUnit(unit: Unit): void {
    // Non-lethal takedown - unit is down but not dead
    this.applyStatusEffect(unit, 'incapacitated');
    unit.ap = 0;
    unit.acted = true;

    this.emitToUI('combat-log', {
      message: `😵 ${unit.name} is INCAPACITATED!`,
      type: 'kill'
    });
  }

  private onUnitClick(clickedUnitId: string): void {
    if (this.animating) return;
    if (this.aiVsAi) return;

    const clickedUnit = this.units.get(clickedUnitId);
    const selectedUnit = this.selectedUnitId ? this.units.get(this.selectedUnitId) : null;

    // If in attack mode and clicking an enemy, attack them
    if (this.actionMode === 'attack' && selectedUnit && clickedUnit) {
      if (selectedUnit.team !== clickedUnit.team) {
        console.log(`[ATTACK] ${selectedUnit.name} attacking ${clickedUnit.name}`);
        this.tryAttackUnit(this.selectedUnitId!, clickedUnitId);
        return;
      }
    }

    // Otherwise, select the clicked unit
    this.selectUnit(clickedUnitId);
  }

  private selectUnit(unitId: string): void {
    if (this.animating) return;

    // Deselect previous
    if (this.selectedUnitId) {
      const prevUnit = this.units.get(this.selectedUnitId);
      if (prevUnit?.selectionTile) {
        prevUnit.selectionTile.setVisible(false);
      }
      // Note: selection is now shown via selectionTile only (sprites don't have stroke)
    }

    // Select new
    const unit = this.units.get(unitId);
    if (unit) {
      this.selectedUnitId = unitId;
      if (unit.selectionTile) {
        unit.selectionTile.setVisible(true);
      }
      // Note: selection is now shown via selectionTile, not sprite stroke

      // Emit to React
      EventBridge.emit('unit-selected', this.getUnitData(unit));
    }

    this.setActionMode('idle');
  }

  private getUnitData(unit: Unit): UnitData {
    return {
      id: unit.id,
      name: unit.name,
      team: unit.team,
      hp: unit.hp,
      maxHp: unit.maxHp,
      ap: unit.ap,
      maxAp: unit.maxAp,
      position: unit.position,
      facing: String(unit.facing),
      statusEffects: unit.statusEffects,
      isInCover: this.getTileCover(unit.position.x, unit.position.y),
      powers: unit.powers.map(powerId => {
        const power = SPECIAL_POWERS[powerId];
        return {
          id: power.id,
          name: power.name,
          emoji: power.emoji,
          apCost: power.apCost,
          cooldown: power.cooldown,
          currentCooldown: unit.powerCooldowns[powerId] || 0,
          description: power.description,
          role: power.role,
          type: power.type,
          manifest: power.manifest,
        };
      }),
    };
  }

  private getTileCover(x: number, y: number): 'none' | 'half' | 'full' {
    const tile = this.tiles[y]?.[x];
    if (!tile) return 'none';
    return TERRAIN_TYPES[tile.terrain].cover as 'none' | 'half' | 'full';
  }

  private setActionMode(mode: ActionMode): void {
    this.actionMode = mode;
    this.clearRangeOverlay();
    this.clearLOSIndicator();

    if (!this.selectedUnitId) return;
    const unit = this.units.get(this.selectedUnitId);
    if (!unit) return;

    switch (mode) {
      case 'move':
        this.showMovementRange(unit);
        break;
      case 'attack':
        this.showAttackRange(unit);
        break;
      case 'teleport':
        this.showTeleportRange(unit);
        break;
    }

    EventBridge.emit('action-mode-changed', { mode });
  }

  private showMovementRange(unit: Unit): void {
    const maxMove = unit.ap;

    for (let y = 0; y < this.mapHeight; y++) {
      for (let x = 0; x < this.mapWidth; x++) {
        const tile = this.tiles[y][x];
        const moveCost = this.calculateMoveCost(unit.position.x, unit.position.y, x, y);

        if (
          moveCost > 0 &&
          moveCost <= maxMove &&
          TERRAIN_TYPES[tile.terrain].walkable &&
          !tile.occupant
        ) {
          const screenPos = gridToScreen(x, y, this.offsetX, this.offsetY);
          // Draw a smaller isometric diamond for the movement marker
          const shrink = 8;
          const marker = this.add.polygon(
            screenPos.x,
            screenPos.y,
            [
              0, -TILE_HEIGHT / 2 + shrink,
              TILE_WIDTH / 2 - shrink, 0,
              0, TILE_HEIGHT / 2 - shrink,
              -TILE_WIDTH / 2 + shrink, 0
            ],
            COLORS.MOVEMENT_RANGE,
            moveCost === 1 ? 0.3 : 0.2
          );
          marker.setDepth(getIsoDepth(x, y) + 50);
          this.rangeLayer.add(marker);
        }
      }
    }
  }

  private calculateMoveCost(fromX: number, fromY: number, toX: number, toY: number): number {
    // Simple implementation: base distance + destination tile cost modifier
    const baseDistance = Math.abs(toX - fromX) + Math.abs(toY - fromY);
    const destTile = this.tiles[toY]?.[toX];
    if (!destTile) return Infinity;

    const terrainCost = TERRAIN_TYPES[destTile.terrain].moveCost;
    // If terrain cost > 1, add the extra cost (e.g., LOW_WALL costs 2 = 1 extra)
    return baseDistance + (terrainCost > 1 ? terrainCost - 1 : 0);
  }

  private showAttackRange(unit: Unit): void {
    const weapon = WEAPONS[unit.weapon];
    const maxRange = weapon.range;

    // Show range indicator at unit position
    const unitScreenPos = gridToScreen(unit.position.x, unit.position.y, this.offsetX, this.offsetY);

    // Range circle outline (approximate in isometric)
    const rangeCircle = this.add.circle(unitScreenPos.x, unitScreenPos.y, maxRange * TILE_HEIGHT, 0x000000, 0);
    rangeCircle.setStrokeStyle(2, COLORS.ATTACK_RANGE, 0.5);
    rangeCircle.setDepth(getIsoDepth(unit.position.x, unit.position.y) + 49);
    this.rangeLayer.add(rangeCircle);

    for (let y = 0; y < this.mapHeight; y++) {
      for (let x = 0; x < this.mapWidth; x++) {
        const tile = this.tiles[y][x];
        if (!tile.occupant) continue;

        const targetUnit = this.units.get(tile.occupant);
        if (!targetUnit || targetUnit.team === unit.team) continue;

        const distance = Math.sqrt(
          Math.pow(x - unit.position.x, 2) + Math.pow(y - unit.position.y, 2)
        );
        const hasLOS = this.hasLineOfSight(unit.position.x, unit.position.y, x, y);
        const inRange = distance <= maxRange;

        const screenPos = gridToScreen(x, y, this.offsetX, this.offsetY);
        const shrink = 8;

        if (inRange && hasLOS) {
          // Valid target - red overlay diamond
          const marker = this.add.polygon(
            screenPos.x, screenPos.y,
            [
              0, -TILE_HEIGHT / 2 + shrink,
              TILE_WIDTH / 2 - shrink, 0,
              0, TILE_HEIGHT / 2 - shrink,
              -TILE_WIDTH / 2 + shrink, 0
            ],
            COLORS.ATTACK_RANGE, 0.4
          );
          marker.setDepth(getIsoDepth(x, y) + 50);
          this.rangeLayer.add(marker);
        } else {
          // Out of range or no LOS - gray overlay
          const marker = this.add.polygon(
            screenPos.x, screenPos.y,
            [
              0, -TILE_HEIGHT / 2 + shrink,
              TILE_WIDTH / 2 - shrink, 0,
              0, TILE_HEIGHT / 2 - shrink,
              -TILE_WIDTH / 2 + shrink, 0
            ],
            0x444444, 0.5
          );
          marker.setDepth(getIsoDepth(x, y) + 50);
          this.rangeLayer.add(marker);

          // Add range indicator text
          const reason = !inRange ? `${distance.toFixed(0)}` : 'NO LOS';
          const text = this.add.text(screenPos.x, screenPos.y, reason, {
            fontSize: '10px',
            color: '#ff6666',
            fontStyle: 'bold',
          });
          text.setOrigin(0.5);
          text.setDepth(getIsoDepth(x, y) + 51);
          this.rangeLayer.add(text);
        }
      }
    }
  }

  private showTeleportRange(unit: Unit): void {
    const power = SPECIAL_POWERS.teleport;
    const maxRange = power.range;

    // Show range indicator at unit position
    const unitScreenPos = gridToScreen(unit.position.x, unit.position.y, this.offsetX, this.offsetY);

    // Range circle outline (approximate in isometric)
    const rangeCircle = this.add.circle(unitScreenPos.x, unitScreenPos.y, maxRange * TILE_HEIGHT, 0x000000, 0);
    rangeCircle.setStrokeStyle(2, 0x9966ff, 0.6);
    rangeCircle.setDepth(getIsoDepth(unit.position.x, unit.position.y) + 49);
    this.rangeLayer.add(rangeCircle);

    // Show valid teleport destinations
    for (let y = 0; y < this.mapHeight; y++) {
      for (let x = 0; x < this.mapWidth; x++) {
        const tile = this.tiles[y][x];

        const distance = Math.sqrt(
          Math.pow(x - unit.position.x, 2) + Math.pow(y - unit.position.y, 2)
        );
        const inRange = distance <= maxRange;
        const isWalkable = this.isTileWalkable(x, y);
        const isEmpty = !tile.occupant;
        const isValid = inRange && isWalkable && isEmpty;

        if (!inRange && distance > maxRange + 2) continue; // Skip far tiles

        const screenPos = gridToScreen(x, y, this.offsetX, this.offsetY);
        const shrink = 8;

        if (isValid) {
          // Valid teleport destination - purple overlay diamond
          const marker = this.add.polygon(
            screenPos.x, screenPos.y,
            [
              0, -TILE_HEIGHT / 2 + shrink,
              TILE_WIDTH / 2 - shrink, 0,
              0, TILE_HEIGHT / 2 - shrink,
              -TILE_WIDTH / 2 + shrink, 0
            ],
            0x9966ff, 0.4
          );
          marker.setDepth(getIsoDepth(x, y) + 50);
          this.rangeLayer.add(marker);
        }
      }
    }
  }

  private showGrenadeRange(unit: Unit): void {
    const maxRange = 7;
    for (let y = 0; y < this.mapHeight; y++) {
      for (let x = 0; x < this.mapWidth; x++) {
        const distance = Math.abs(x - unit.position.x) + Math.abs(y - unit.position.y);
        if (distance === 0 || distance > maxRange) continue;

        const screenPos = gridToScreen(x, y, this.offsetX, this.offsetY);
        const shrink = 8;
        const marker = this.add.polygon(
          screenPos.x, screenPos.y,
          [0, -TILE_HEIGHT / 2 + shrink, TILE_WIDTH / 2 - shrink, 0, 0, TILE_HEIGHT / 2 - shrink, -TILE_WIDTH / 2 + shrink, 0],
          0xff6600, 0.3
        );
        marker.setDepth(getIsoDepth(x, y) + 50);
        this.rangeLayer.add(marker);
      }
    }
  }

  private throwGrenade(unit: Unit, x: number, y: number): void {
    if (!this.pendingGrenade) return;

    const grenadeId = this.pendingGrenade.id.toUpperCase();
    const grenadeType = GRENADES[grenadeId as keyof typeof GRENADES] || GRENADES.FRAG;
    const throwResult = calculateThrow(unit.position, { x, y }, unit.str, false, grenadeType);

    unit.ap -= 2;
    this.emitAllUnitsData();

    EventBridge.emit('log-entry', {
      id: `grenade_${Date.now()}`,
      timestamp: Date.now(),
      type: 'attack',
      actor: unit.name,
      actorTeam: unit.team,
      message: `💣 ${unit.name} throws ${this.pendingGrenade.name}!`,
    });

    // Emit event to consume the grenade from equipment
    EventBridge.emit('consume-grenade', {
      unitId: unit.id,
      grenadeName: this.pendingGrenade.name
    });

    // No throw sound - only explosion makes sound

    this.animating = true;
    const startPos = gridToScreen(unit.position.x, unit.position.y, this.offsetX, this.offsetY);
    const endPos = gridToScreen(throwResult.actualLandingPosition.x, throwResult.actualLandingPosition.y, this.offsetX, this.offsetY);

    // Use actual grenade sprite image - try to load the specific type, fallback to frag
    const spriteKey = `grenade_${grenadeId.toLowerCase()}`;
    const textureExists = this.textures.exists(spriteKey);

    let grenadeSprite: Phaser.GameObjects.Image | Phaser.GameObjects.Arc;
    if (textureExists) {
      grenadeSprite = this.add.image(startPos.x, startPos.y - 20, spriteKey);
      grenadeSprite.setScale(0.4); // Scale down the grenade image
    } else {
      // Fallback to orange circle
      grenadeSprite = this.add.circle(startPos.x, startPos.y - 20, 10, 0xff6600);
    }
    grenadeSprite.setDepth(1000);

    this.tweens.add({
      targets: grenadeSprite,
      x: endPos.x,
      y: endPos.y,
      duration: 600,
      ease: 'Quad.easeOut',
      onUpdate: (tween) => {
        const progress = tween.progress;
        grenadeSprite.y = startPos.y + (endPos.y - startPos.y) * progress - 80 * Math.sin(progress * Math.PI) - 20;
        // Add rotation during flight
        if ('angle' in grenadeSprite) {
          grenadeSprite.angle = progress * 720; // 2 full rotations
        }
      },
      onComplete: () => {
        grenadeSprite.destroy();
        this.explodeGrenade(throwResult.actualLandingPosition.x, throwResult.actualLandingPosition.y, grenadeType, unit);
      }
    });

    this.pendingGrenade = null;
    this.setActionMode('idle');
  }

  private explodeGrenade(x: number, y: number, grenadeType: Grenade, thrower: Unit): void {
    const screenPos = gridToScreen(x, y, this.offsetX, this.offsetY);

    // Calculate sound data from grenade's soundLevel
    const soundData = {
      decibels: grenadeType.soundLevel,
      baseRange: Math.ceil(grenadeType.soundLevel / 10) // ~16 tiles for 165dB grenade
    };

    // Emit sound ring visual - always show this
    this.emitSoundRing(x, y, soundData);

    // Play sound only if selected unit is within hearing range
    const soundKey = this.getGrenadeSoundKey(grenadeType.name);
    this.playSoundIfInRange(soundKey, { x, y }, soundData.baseRange);

    // Handle smoke grenades specially - create smoke cloud instead of explosion
    if (grenadeType.visualEffect === 'smoke' && grenadeType.damageAtCenter === 0) {
      this.createSmokeCloud(x, y, grenadeType.blastRadius);
      EventBridge.emit('log-entry', {
        id: `smoke_${Date.now()}`,
        timestamp: Date.now(),
        type: 'status',
        actor: thrower.name,
        message: `💨 ${thrower.name} creates a smoke screen!`,
      });
      this.emitAllUnitsData();
      this.time.delayedCall(500, () => { this.animating = false; });
      return;
    }

    // Regular explosion visual
    let explosionColor = 0xff4400; // Default orange
    if (grenadeType.visualEffect === 'flash') explosionColor = 0xffffaa;
    if (grenadeType.visualEffect === 'fire') explosionColor = 0xff6600;

    const explosionCircle = this.add.circle(screenPos.x, screenPos.y, 10, explosionColor, 0.8);
    explosionCircle.setDepth(1000);

    this.tweens.add({
      targets: explosionCircle,
      scaleX: grenadeType.blastRadius * 2,
      scaleY: grenadeType.blastRadius * 2,
      alpha: 0,
      duration: 400,
      onComplete: () => explosionCircle.destroy()
    });

    // Deal damage to units in radius
    this.units.forEach(unit => {
      const distance = Math.abs(unit.position.x - x) + Math.abs(unit.position.y - y);
      if (distance <= grenadeType.blastRadius) {
        const damage = Math.floor(grenadeType.damageAtCenter * (1 - distance / (grenadeType.blastRadius + 1)));
        if (damage > 0) {
          unit.hp -= damage;
          this.updateHealthBar(unit);
          if (unit.hp <= 0) {
            this.killUnit(unit, `${grenadeType.name} explosion`);
          }
          EventBridge.emit('log-entry', {
            id: `explosion_${Date.now()}_${unit.id}`,
            timestamp: Date.now(),
            type: 'damage',
            actor: thrower.name,
            target: unit.name,
            message: `💥 ${unit.name} takes ${damage} damage!`,
          });
        }

        // Apply status effects if any
        if (grenadeType.statusEffects && grenadeType.statusEffects.length > 0) {
          grenadeType.statusEffects.forEach(effect => {
            EventBridge.emit('log-entry', {
              id: `effect_${Date.now()}_${unit.id}`,
              timestamp: Date.now(),
              type: 'status',
              target: unit.name,
              message: `⚡ ${unit.name} is ${effect}!`,
            });
          });
        }
      }
    });

    this.emitAllUnitsData();
    this.time.delayedCall(500, () => { this.animating = false; });
  }

  /**
   * Creates a smoke cloud visual effect on the map
   * Smoke provides cover for units inside
   */
  private createSmokeCloud(x: number, y: number, radius: number): void {
    // Create smoke particles at center and surrounding tiles
    for (let dx = -radius; dx <= radius; dx++) {
      for (let dy = -radius; dy <= radius; dy++) {
        const distance = Math.abs(dx) + Math.abs(dy);
        if (distance <= radius) {
          const tileX = x + dx;
          const tileY = y + dy;

          // Make sure tile is within map bounds
          if (tileX >= 0 && tileX < this.mapWidth && tileY >= 0 && tileY < this.mapHeight) {
            const screenPos = gridToScreen(tileX, tileY, this.offsetX, this.offsetY);

            // Create smoke effect (semi-transparent gray cloud)
            const smokeAlpha = 0.6 - (distance * 0.1); // Fades at edges
            const smoke = this.add.circle(screenPos.x, screenPos.y, 20, 0x888888, smokeAlpha);
            smoke.setDepth(500); // Above tiles, below units

            // Add some random offset for organic look
            smoke.x += (Math.random() - 0.5) * 10;
            smoke.y += (Math.random() - 0.5) * 10;

            // Slow drift animation
            this.tweens.add({
              targets: smoke,
              x: smoke.x + (Math.random() - 0.5) * 30,
              y: smoke.y - 10,
              alpha: 0,
              scale: 1.5,
              duration: 5000 + Math.random() * 2000,
              onComplete: () => smoke.destroy()
            });

            // TODO: Mark tile as having smoke cover for LOS/cover calculations
            // this.tiles[tileY][tileX].hasSmoke = true;
          }
        }
      }
    }
  }

  private clearRangeOverlay(): void {
    this.rangeLayer.removeAll(true);
  }

  private clearLOSIndicator(): void {
    if (this.losGraphics) {
      this.losGraphics.clear();
    }
  }

  private onTileClick(x: number, y: number): void {
    if (this.animating) return;
    if (this.aiVsAi) return; // Don't allow clicks in AI vs AI mode

    const tile = this.tiles[y][x];

    EventBridge.emit('tile-clicked', {
      x,
      y,
      terrain: tile.terrain,
      occupant: tile.occupant || null,
    });

    // Handle based on action mode
    if (this.actionMode === 'move' && this.selectedUnitId) {
      this.tryMoveUnit(this.selectedUnitId, x, y);
    } else if (this.actionMode === 'attack' && this.selectedUnitId && tile.occupant) {
      this.tryAttackUnit(this.selectedUnitId, tile.occupant);
    } else if (this.actionMode === 'teleport' && this.selectedUnitId) {
      const unit = this.units.get(this.selectedUnitId);
      if (unit) {
        this.teleportUnit(unit, x, y);
      }
    } else if (this.actionMode === 'throw' && this.selectedUnitId && this.pendingGrenade) {
      const unit = this.units.get(this.selectedUnitId);
      if (unit) {
        const distance = Math.abs(x - unit.position.x) + Math.abs(y - unit.position.y);
        if (distance <= 7) {
          this.throwGrenade(unit, x, y);
        } else {
          EventBridge.emit('log-entry', {
            id: `grenade_${Date.now()}`,
            timestamp: Date.now(),
            type: 'system',
            actor: 'System',
            message: `❌ Out of range!`,
          });
        }
      }
    } else if (this.actionMode === 'grapple' && this.selectedUnitId && tile.occupant) {
      this.tryGrapple(this.selectedUnitId, tile.occupant);
    } else if (tile.occupant) {
      this.selectUnit(tile.occupant);
    }
  }

  private tryGrapple(attackerId: string, targetId: string): void {
    const attacker = this.units.get(attackerId);
    const target = this.units.get(targetId);
    if (!attacker || !target) return;

    // Check if adjacent
    const dx = Math.abs(attacker.position.x - target.position.x);
    const dy = Math.abs(attacker.position.y - target.position.y);
    if (dx + dy > 1) {
      this.emitToUI('combat-log', { message: '❌ Must be adjacent to grapple!', type: 'system' });
      return;
    }

    // Check if same team
    if (attacker.team === target.team) {
      this.emitToUI('combat-log', { message: '❌ Cannot grapple allies!', type: 'system' });
      return;
    }

    // Check AP (grapple costs 2 AP)
    if (attacker.ap < 2) {
      this.emitToUI('combat-log', { message: '❌ Not enough AP! (need 2)', type: 'system' });
      return;
    }

    // Grapple attempt - STR vs STR contest
    const attackerRoll = Math.floor(Math.random() * 100) + attacker.str;
    const targetRoll = Math.floor(Math.random() * 100) + target.str;

    attacker.ap -= 2;

    if (attackerRoll >= targetRoll) {
      // Success - enter clinch
      attacker.grappleState = { position: 'clinch', targetId: target.id };
      target.grappleState = { position: 'clinch', targetId: attacker.id };
      this.applyStatusEffect(attacker, 'grappled');
      this.applyStatusEffect(target, 'grappled');

      this.emitToUI('combat-log', {
        message: `🤼 ${attacker.name} GRAPPLES ${target.name}! (${attackerRoll} vs ${targetRoll})`,
        type: 'attack'
      });

      // Deal some grapple damage
      const damage = Math.floor(attacker.str / 10) + 5;
      target.hp -= damage;
      this.updateHealthBar(target);
      this.emitToUI('combat-log', {
        message: `💪 ${attacker.name} deals ${damage} grapple damage!`,
        type: 'damage'
      });

      if (target.hp <= 0) {
        this.incapacitateUnit(target);
      }
    } else {
      this.emitToUI('combat-log', {
        message: `🤼 ${attacker.name} fails to grapple ${target.name}! (${attackerRoll} vs ${targetRoll})`,
        type: 'miss'
      });
    }

    this.setActionMode('idle');
    this.emitAllUnitsData();
  }

  private onTileHover(x: number, y: number): void {
    // Clear previous path preview
    this.pathPreviewLayer.removeAll(true);
    if (this.hoverPreviewText) {
      this.hoverPreviewText.destroy();
      this.hoverPreviewText = undefined;
    }

    if (!this.selectedUnitId) return;

    const unit = this.units.get(this.selectedUnitId);
    const tile = this.tiles[y]?.[x];
    if (!unit || !tile) return;

    // Movement path preview
    if (this.actionMode === 'move') {
      const moveCost = this.calculateMoveCost(unit.position.x, unit.position.y, x, y);
      const canMove = moveCost > 0 && moveCost <= unit.ap &&
        TERRAIN_TYPES[tile.terrain].walkable && !tile.occupant;

      if (canMove) {
        // Draw footstep path from unit to destination
        this.drawMovementPath(unit.position.x, unit.position.y, x, y);

        // Show AP cost at destination
        const screenPos = gridToScreen(x, y, this.offsetX, this.offsetY);
        this.hoverPreviewText = this.add.text(
          screenPos.x,
          screenPos.y - TILE_HEIGHT / 2 - 10,
          `${moveCost} AP`,
          {
            fontSize: '14px',
            color: '#4a90d9',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 3,
          }
        );
        this.hoverPreviewText.setOrigin(0.5);
        this.hoverPreviewText.setDepth(getIsoDepth(x, y) + 200);
      }
    }

    // Attack hit chance preview
    if (this.actionMode === 'attack' && tile.occupant) {
      const target = this.units.get(tile.occupant);
      if (target && target.team !== unit.team) {
        const hasLOS = this.hasLineOfSight(unit.position.x, unit.position.y, x, y);
        this.showLOSIndicator(unit.position.x, unit.position.y, x, y, hasLOS);

        if (hasLOS) {
          // Calculate and show hit chance
          const hitChance = this.calculateHitChance(unit, target);
          const weapon = WEAPONS[unit.weapon];
          const rangeBracket = this.getRangeBracketName(unit, target);
          const screenPos = gridToScreen(x, y, this.offsetX, this.offsetY);

          this.hoverPreviewText = this.add.text(
            screenPos.x,
            screenPos.y - TILE_HEIGHT / 2 - 25,
            `${rangeBracket} | ${hitChance}% | ${weapon.damage} DMG`,
            {
              fontSize: '14px',
              color: hitChance >= 70 ? '#4ad94a' : hitChance >= 40 ? '#d9d94a' : '#d94a4a',
              fontStyle: 'bold',
              stroke: '#000000',
              strokeThickness: 3,
            }
          );
          this.hoverPreviewText.setOrigin(0.5);
          this.hoverPreviewText.setDepth(getIsoDepth(x, y) + 200);
        }
      }
    }
  }

  private drawMovementPath(fromX: number, fromY: number, toX: number, toY: number): void {
    // Simple direct path with footstep markers
    const steps: { x: number; y: number }[] = [];
    let currentX = fromX;
    let currentY = fromY;

    // Generate path (simple diagonal then straight)
    while (currentX !== toX || currentY !== toY) {
      if (currentX < toX) currentX++;
      else if (currentX > toX) currentX--;

      if (currentY < toY) currentY++;
      else if (currentY > toY) currentY--;

      steps.push({ x: currentX, y: currentY });
    }

    // Draw footstep markers along the path
    steps.forEach((step, index) => {
      const screenPos = gridToScreen(step.x, step.y, this.offsetX, this.offsetY);

      // Draw a small circle for each step
      const footstep = this.add.circle(
        screenPos.x,
        screenPos.y,
        6,
        COLORS.MOVEMENT_RANGE,
        0.7
      );
      footstep.setDepth(getIsoDepth(step.x, step.y) + 60);
      this.pathPreviewLayer.add(footstep);

      // Add step number
      if (steps.length <= 6 || index === steps.length - 1) {
        const stepText = this.add.text(
          screenPos.x,
          screenPos.y,
          `${index + 1}`,
          { fontSize: '10px', color: '#ffffff' }
        );
        stepText.setOrigin(0.5);
        stepText.setDepth(getIsoDepth(step.x, step.y) + 61);
        this.pathPreviewLayer.add(stepText);
      }
    });
  }

  private calculateHitChance(attacker: Unit, target: Unit): number {
    const weapon = WEAPONS[attacker.weapon];
    const distance = Math.sqrt(
      Math.pow(target.position.x - attacker.position.x, 2) +
      Math.pow(target.position.y - attacker.position.y, 2)
    );

    // Base accuracy from weapon
    let hitChance = weapon.accuracy || 70;

    // WEAPON-SPECIFIC RANGE BRACKETS
    // Use the weapon's range brackets for hit modifiers instead of generic distance penalty
    const brackets = weapon.rangeBrackets;
    if (brackets) {
      // Check if out of max range
      if (distance > brackets.max) {
        return 0; // Cannot hit - out of range
      }

      // Apply range bracket modifier
      if (distance <= brackets.pointBlank) {
        hitChance += brackets.pointBlankMod;
      } else if (distance <= brackets.short) {
        hitChance += brackets.shortMod;
      } else if (distance <= brackets.optimal) {
        hitChance += brackets.optimalMod;
      } else if (distance <= brackets.long) {
        hitChance += brackets.longMod;
      } else {
        hitChance += brackets.extremeMod;
      }
    } else {
      // Fallback: old generic distance penalty
      if (distance > 3) {
        hitChance -= Math.floor((distance - 3) * 5);
      }
    }

    // Cover modifier
    const targetTile = this.tiles[target.position.y]?.[target.position.x];
    if (targetTile) {
      const cover = TERRAIN_TYPES[targetTile.terrain].cover;
      if (cover === 'half') hitChance -= 20;
      else if (cover === 'full') hitChance -= 40;
    }

    // AGL bonus for attacker (every 10 AGL above 50 = +2%)
    hitChance += Math.floor((attacker.agl - 50) / 5);

    return Math.max(5, Math.min(95, hitChance));
  }

  /**
   * Get the range bracket name for display in UI
   */
  private getRangeBracketName(attacker: Unit, target: Unit): string {
    const weapon = WEAPONS[attacker.weapon];
    const distance = Math.sqrt(
      Math.pow(target.position.x - attacker.position.x, 2) +
      Math.pow(target.position.y - attacker.position.y, 2)
    );

    const brackets = weapon.rangeBrackets;
    if (!brackets) return '';

    if (distance > brackets.max) return 'OUT OF RANGE';
    if (distance <= brackets.pointBlank) return 'POINT BLANK';
    if (distance <= brackets.short) return 'SHORT';
    if (distance <= brackets.optimal) return 'OPTIMAL';
    if (distance <= brackets.long) return 'LONG';
    return 'EXTREME';
  }

  // ==================== FOG OF WAR ====================

  private updateFogOfWar(): void {
    // Get all friendly units (blue team for player, red for AI-only mode)
    const playerTeam = this.aiVsAi ? 'none' : 'blue'; // In AI vs AI, show everyone
    const friendlyUnits = Array.from(this.units.values()).filter(u => u.team === playerTeam && u.hp > 0);

    // For each enemy unit, check if ANY friendly unit can see them
    this.units.forEach(unit => {
      if (unit.team === playerTeam || unit.hp <= 0) return; // Skip friendlies and dead units

      let isVisible = false;

      // In AI vs AI mode, always show everyone
      if (this.aiVsAi) {
        isVisible = true;
      } else {
        // Check if any friendly unit has LOS to this enemy
        for (const friendly of friendlyUnits) {
          if (this.hasLineOfSight(friendly.position.x, friendly.position.y, unit.position.x, unit.position.y)) {
            isVisible = true;
            break;
          }
        }
      }

      // Update unit visibility
      unit.visible = isVisible;
      this.setUnitVisibility(unit, isVisible);
    });

    // Emit updated unit data so UI reflects visibility
    this.emitAllUnitsData();
  }

  private setUnitVisibility(unit: Unit, visible: boolean): void {
    const alpha = visible ? 1 : 0;

    if (unit.sprite) unit.sprite.setAlpha(alpha);
    if (unit.healthBar) unit.healthBar.setAlpha(alpha);
    if (unit.healthBarBg) unit.healthBarBg.setAlpha(alpha);
    if (unit.nameText) unit.nameText.setAlpha(alpha);
    if (unit.effectsContainer) unit.effectsContainer.setAlpha(alpha);

    // If not visible, clear any selection
    if (!visible && unit.selectionTile) {
      unit.selectionTile.setVisible(false);
    }
  }

  // ==================== LINE OF SIGHT ====================

  private hasLineOfSight(x1: number, y1: number, x2: number, y2: number): boolean {
    if (x1 === x2 && y1 === y2) return true;

    const dx = Math.abs(x2 - x1);
    const dy = Math.abs(y2 - y1);
    const sx = x1 < x2 ? 1 : -1;
    const sy = y1 < y2 ? 1 : -1;
    let err = dx - dy;

    let x = x1;
    let y = y1;

    while (true) {
      if (x === x2 && y === y2) return true;

      const cell = this.tiles[y]?.[x];
      // WALL and DOOR_CLOSED block LOS (but not start/end positions)
      if (cell && (cell.terrain === 'WALL' || cell.terrain === 'DOOR_CLOSED')) {
        if (!(x === x1 && y === y1) && !(x === x2 && y === y2)) {
          return false;
        }
      }

      const e2 = 2 * err;
      if (e2 > -dy) {
        err -= dy;
        x += sx;
      }
      if (e2 < dx) {
        err += dx;
        y += sy;
      }

      if (x < 0 || x >= this.mapWidth || y < 0 || y >= this.mapHeight) return false;
    }
  }

  private showLOSIndicator(fromX: number, fromY: number, toX: number, toY: number, hasLOS: boolean): void {
    if (!this.losGraphics) {
      this.losGraphics = this.add.graphics();
      this.effectsLayer.add(this.losGraphics);
    }
    this.losGraphics.clear();

    // Use isometric coordinates for LOS indicator
    const startPos = gridToScreen(fromX, fromY, this.offsetX, this.offsetY);
    const endPos = gridToScreen(toX, toY, this.offsetX, this.offsetY);
    const startX = startPos.x;
    const startY = startPos.y;
    const endX = endPos.x;
    const endY = endPos.y;

    if (hasLOS) {
      this.losGraphics.lineStyle(2, 0x00ff00, 0.6);
    } else {
      this.losGraphics.lineStyle(3, 0xff0000, 0.8);
    }

    this.losGraphics.beginPath();
    this.losGraphics.moveTo(startX, startY);
    this.losGraphics.lineTo(endX, endY);
    this.losGraphics.strokePath();

    if (!hasLOS) {
      const midX = (startX + endX) / 2;
      const midY = (startY + endY) / 2;
      this.losGraphics.lineStyle(4, 0xff0000, 1);
      this.losGraphics.beginPath();
      this.losGraphics.moveTo(midX - 8, midY - 8);
      this.losGraphics.lineTo(midX + 8, midY + 8);
      this.losGraphics.moveTo(midX + 8, midY - 8);
      this.losGraphics.lineTo(midX - 8, midY + 8);
      this.losGraphics.strokePath();
    }
  }

  // ==================== MOVEMENT ====================

  private tryMoveUnit(unitId: string, targetX: number, targetY: number): void {
    const unit = this.units.get(unitId);
    if (!unit) return;

    // Only allow moving player's units on their turn (unless AI vs AI)
    if (!this.aiVsAi && unit.team !== this.currentTeam) return;
    if (!this.aiVsAi && unit.team !== this.playerTeam) return;

    const moveCost = this.calculateMoveCost(unit.position.x, unit.position.y, targetX, targetY);
    const tile = this.tiles[targetY][targetX];

    if (
      moveCost <= unit.ap &&
      TERRAIN_TYPES[tile.terrain].walkable &&
      !tile.occupant
    ) {
      this.moveUnitAnimated(unit, targetX, targetY, moveCost);
    }
  }

  /**
   * Update/redraw the selection tile at a new position
   */
  private updateSelectionTile(unit: Unit, screenX: number, screenY: number, depth: number): void {
    if (!unit.selectionTile) return;

    const wasVisible = unit.selectionTile.visible;
    unit.selectionTile.clear();
    unit.selectionTile.lineStyle(3, 0x00ff00, 1);
    unit.selectionTile.fillStyle(0x00ff00, 0.15);
    unit.selectionTile.beginPath();
    unit.selectionTile.moveTo(screenX, screenY - TILE_HEIGHT / 2);
    unit.selectionTile.lineTo(screenX + TILE_WIDTH / 2, screenY);
    unit.selectionTile.lineTo(screenX, screenY + TILE_HEIGHT / 2);
    unit.selectionTile.lineTo(screenX - TILE_WIDTH / 2, screenY);
    unit.selectionTile.closePath();
    unit.selectionTile.fillPath();
    unit.selectionTile.strokePath();
    // Selection tile should be ON THE GROUND, behind the character
    // Base tile depth is getIsoDepth (x+y), unit is at depth+100
    // So selection should be at base tile depth + small offset (below unit, slightly above tiles)
    const baseDepth = depth - 100; // Get back to tile level
    unit.selectionTile.setDepth(baseDepth + 0.5); // Just above tiles, way below unit
    unit.selectionTile.setVisible(wasVisible);
  }

  /**
   * Update unit facing direction based on movement or attack direction
   * Also flips the sprite to match the facing direction
   */
  private updateUnitFacing(unit: Unit, fromX: number, fromY: number, toX: number, toY: number): void {
    const dx = toX - fromX;
    const dy = toY - fromY;

    // Calculate angle in degrees (0 = east, 90 = south, 180 = west, 270 = north)
    // atan2 returns -PI to PI, where 0 is east
    const angle = Math.atan2(dy, dx);
    let degrees = angle * (180 / Math.PI);
    if (degrees < 0) degrees += 360;

    // Snap to 8 directions (0, 45, 90, 135, 180, 225, 270, 315)
    const snapped = Math.round(degrees / 45) * 45;
    unit.facing = snapped % 360;

    // Update sprite flip based on facing
    // Sprites face right by default (0 degrees = east)
    // Flip if facing left-ish (90 < facing < 270 means facing any westward direction)
    if (unit.sprite) {
      unit.sprite.setFlipX(unit.facing > 90 && unit.facing < 270);
    }
  }

  private moveUnitAnimated(unit: Unit, targetX: number, targetY: number, distance: number, callback?: () => void): void {
    this.animating = true;

    // Clear old position
    this.tiles[unit.position.y][unit.position.x].occupant = undefined;

    const oldPos = { ...unit.position };

    // Update facing based on movement direction
    this.updateUnitFacing(unit, oldPos.x, oldPos.y, targetX, targetY);

    unit.position = { x: targetX, y: targetY };
    unit.ap -= distance;

    // Calculate isometric screen positions
    const screenPos = gridToScreen(targetX, targetY, this.offsetX, this.offsetY);
    const spriteHeight = unit.sprite?.displayHeight || TILE_HEIGHT;
    const newDepth = getIsoDepth(targetX, targetY) + 100;

    // Hide selection tile during movement (will redraw at new position)
    const wasSelected = unit.selectionTile?.visible || false;
    if (unit.selectionTile) unit.selectionTile.setVisible(false);

    // Animate unit sprite and health bar
    this.tweens.add({
      targets: [unit.sprite, unit.healthBarBg],
      x: screenPos.x,
      y: (target: any) => {
        if (target === unit.healthBarBg) return screenPos.y - spriteHeight - 8;
        return screenPos.y;
      },
      duration: 200 + distance * 50,
      ease: 'Power2',
      onUpdate: () => {
        if (unit.nameText && unit.sprite) {
          unit.nameText.setPosition(unit.sprite.x, unit.sprite.y + 4);
        }
        if (unit.effectsContainer && unit.sprite) {
          const sh = unit.sprite.displayHeight;
          unit.effectsContainer.setPosition(unit.sprite.x, unit.sprite.y - sh - 20);
        }
        this.updateHealthBar(unit);
      },
      onComplete: () => {
        this.animating = false;
        this.updateHealthBar(unit);
        // Update depths after movement
        if (unit.sprite) unit.sprite.setDepth(newDepth);
        if (unit.healthBarBg) unit.healthBarBg.setDepth(newDepth + 0.1);
        if (unit.healthBar) unit.healthBar.setDepth(newDepth + 0.2);
        if (unit.nameText) unit.nameText.setDepth(newDepth + 0.3);
        if (unit.effectsContainer) unit.effectsContainer.setDepth(newDepth + 0.4);
        // Redraw selection tile at new position
        this.updateSelectionTile(unit, screenPos.x, screenPos.y, newDepth);
        if (wasSelected && unit.selectionTile) unit.selectionTile.setVisible(true);
        if (callback) callback();
      },
    });

    // Mark new position
    this.tiles[targetY][targetX].occupant = unit.id;

    // Emit events
    EventBridge.emit('unit-moved', {
      unitId: unit.id,
      from: oldPos,
      to: unit.position,
      apRemaining: unit.ap,
    });

    EventBridge.emit('unit-selected', this.getUnitData(unit));

    EventBridge.emit('log-entry', {
      id: `move_${Date.now()}`,
      timestamp: Date.now(),
      type: 'move',
      actor: unit.name,
      actorTeam: unit.team,
      message: `${unit.name} moves to (${targetX}, ${targetY})`,
      details: [`Distance: ${distance}`, `AP remaining: ${unit.ap}`],
    });

    this.setActionMode('idle');
    this.emitAllUnitsData();

    // Update fog of war after movement (might reveal/hide enemies)
    this.updateFogOfWar();
  }

  // ==================== KNOCKBACK ====================

  private knockbackUnit(target: Unit, attackerX: number, attackerY: number, knockbackDistance: number, weapon: string): void {
    if (knockbackDistance <= 0) return;

    // Calculate knockback direction (away from attacker)
    const dx = target.position.x - attackerX;
    const dy = target.position.y - attackerY;

    // Normalize direction
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist === 0) return; // Can't knockback if on same tile

    const dirX = Math.round(dx / dist);
    const dirY = Math.round(dy / dist);

    let currentX = target.position.x;
    let currentY = target.position.y;
    let remainingKnockback = knockbackDistance;
    let actualKnockback = 0;
    let hitWall = false;
    let hitUnit: Unit | null = null;

    // Trace knockback path
    for (let i = 0; i < knockbackDistance; i++) {
      const nextX = currentX + dirX;
      const nextY = currentY + dirY;

      // Check bounds
      if (nextX < 0 || nextX >= this.mapWidth || nextY < 0 || nextY >= this.mapHeight) {
        hitWall = true;
        remainingKnockback = knockbackDistance - i;
        break;
      }

      const tile = this.tiles[nextY]?.[nextX];
      if (!tile) {
        hitWall = true;
        remainingKnockback = knockbackDistance - i;
        break;
      }

      // Check if tile is walkable (wall check)
      if (!TERRAIN_TYPES[tile.terrain].walkable) {
        hitWall = true;
        remainingKnockback = knockbackDistance - i;
        break;
      }

      // Check for unit collision
      if (tile.occupant) {
        hitUnit = this.units.get(tile.occupant) || null;
        remainingKnockback = knockbackDistance - i;
        break;
      }

      currentX = nextX;
      currentY = nextY;
      actualKnockback++;
    }

    // If no movement, just return
    if (actualKnockback === 0 && !hitWall && !hitUnit) return;

    // Clear old position
    this.tiles[target.position.y][target.position.x].occupant = undefined;

    const oldPos = { ...target.position };
    target.position = { x: currentX, y: currentY };

    // Animate the knockback
    const screenPos = gridToScreen(currentX, currentY, this.offsetX, this.offsetY);
    const spriteHeight = target.sprite?.displayHeight || TILE_HEIGHT;
    const newDepth = getIsoDepth(currentX, currentY) + 100;

    this.tweens.add({
      targets: [target.sprite, target.healthBarBg],
      x: screenPos.x,
      y: (tweenTarget: any) => {
        if (tweenTarget === target.healthBarBg) return screenPos.y - spriteHeight - 8;
        return screenPos.y;
      },
      duration: 150 * actualKnockback,
      ease: 'Power2',
      onUpdate: () => {
        if (target.nameText && target.sprite) {
          target.nameText.setPosition(target.sprite.x, target.sprite.y + 4);
        }
        if (target.effectsContainer && target.sprite) {
          const sh = target.sprite.displayHeight;
          target.effectsContainer.setPosition(target.sprite.x, target.sprite.y - sh - 20);
        }
        this.updateHealthBar(target);
      },
      onComplete: () => {
        this.updateHealthBar(target);
        if (target.sprite) target.sprite.setDepth(newDepth);
        if (target.healthBarBg) target.healthBarBg.setDepth(newDepth + 0.1);
        if (target.healthBar) target.healthBar.setDepth(newDepth + 0.2);
        if (target.nameText) target.nameText.setDepth(newDepth + 0.3);
        if (target.effectsContainer) target.effectsContainer.setDepth(newDepth + 0.4);
        this.updateSelectionTile(target, screenPos.x, screenPos.y, newDepth);
      },
    });

    // Mark new position
    this.tiles[currentY][currentX].occupant = target.id;

    // Handle wall collision damage
    if (hitWall) {
      const wallDamage = Math.floor(remainingKnockback * 12); // 12 damage per tile of remaining knockback
      target.hp = Math.max(0, target.hp - wallDamage);
      this.updateHealthBar(target);

      // Floating damage text for wall impact
      const targetScreenPos = gridToScreen(currentX, currentY, this.offsetX, this.offsetY);
      const wallText = this.add.text(targetScreenPos.x, targetScreenPos.y - TILE_HEIGHT / 2, `WALL! -${wallDamage}`, {
        fontSize: '18px',
        color: '#ff4400',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 3,
      });
      wallText.setOrigin(0.5, 1);
      wallText.setDepth(200);

      this.tweens.add({
        targets: wallText,
        y: targetScreenPos.y - TILE_HEIGHT / 2 - 40,
        alpha: 0,
        duration: 1200,
        ease: 'Power2',
        onComplete: () => wallText.destroy(),
      });

      EventBridge.emit('log-entry', {
        id: `knockback_wall_${Date.now()}`,
        timestamp: Date.now(),
        type: 'system',
        actor: target.name,
        actorTeam: target.team,
        message: `${target.name} slams into a WALL! ${wallDamage} damage from impact!`,
      });

      // Track damage for combat stats
      const targetTeam = target.team as 'blue' | 'red';
      if (!this.combatStats.damageByUnit[target.name]) {
        this.combatStats.damageByUnit[target.name] = { dealt: 0, taken: 0, kills: 0, shots: 0, hits: 0, team: targetTeam };
      }
      this.combatStats.damageByUnit[target.name].taken += wallDamage;

      if (target.hp <= 0) {
        EventBridge.emit('log-entry', {
          id: `knockback_death_${Date.now()}`,
          timestamp: Date.now(),
          type: 'death',
          actor: target.name,
          actorTeam: target.team,
          message: `${target.name} was killed by wall impact!`,
        });
        this.unitDied(target.id, '', wallDamage, weapon);
      }
    }

    // Handle unit collision damage
    if (hitUnit) {
      const collisionDamage = Math.floor(remainingKnockback * 8); // 8 damage per tile to both units
      target.hp = Math.max(0, target.hp - collisionDamage);
      hitUnit.hp = Math.max(0, hitUnit.hp - collisionDamage);
      this.updateHealthBar(target);
      this.updateHealthBar(hitUnit);

      // Floating damage text for both units
      const targetScreenPos = gridToScreen(currentX, currentY, this.offsetX, this.offsetY);
      const collisionText = this.add.text(targetScreenPos.x, targetScreenPos.y - TILE_HEIGHT / 2, `COLLISION! -${collisionDamage}`, {
        fontSize: '16px',
        color: '#ffaa00',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 3,
      });
      collisionText.setOrigin(0.5, 1);
      collisionText.setDepth(200);

      this.tweens.add({
        targets: collisionText,
        y: targetScreenPos.y - TILE_HEIGHT / 2 - 40,
        alpha: 0,
        duration: 1200,
        ease: 'Power2',
        onComplete: () => collisionText.destroy(),
      });

      const hitUnitScreenPos = gridToScreen(hitUnit.position.x, hitUnit.position.y, this.offsetX, this.offsetY);
      const hitUnitText = this.add.text(hitUnitScreenPos.x, hitUnitScreenPos.y - TILE_HEIGHT / 2, `-${collisionDamage}`, {
        fontSize: '16px',
        color: '#ffaa00',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 3,
      });
      hitUnitText.setOrigin(0.5, 1);
      hitUnitText.setDepth(200);

      this.tweens.add({
        targets: hitUnitText,
        y: hitUnitScreenPos.y - TILE_HEIGHT / 2 - 40,
        alpha: 0,
        duration: 1200,
        ease: 'Power2',
        onComplete: () => hitUnitText.destroy(),
      });

      EventBridge.emit('log-entry', {
        id: `knockback_collision_${Date.now()}`,
        timestamp: Date.now(),
        type: 'system',
        actor: target.name,
        actorTeam: target.team,
        target: hitUnit.name,
        targetTeam: hitUnit.team,
        message: `${target.name} collides with ${hitUnit.name}! Both take ${collisionDamage} damage!`,
      });

      // Track damage for combat stats
      const targetTeam = target.team as 'blue' | 'red';
      const hitUnitTeam = hitUnit.team as 'blue' | 'red';
      if (!this.combatStats.damageByUnit[target.name]) {
        this.combatStats.damageByUnit[target.name] = { dealt: 0, taken: 0, kills: 0, shots: 0, hits: 0, team: targetTeam };
      }
      if (!this.combatStats.damageByUnit[hitUnit.name]) {
        this.combatStats.damageByUnit[hitUnit.name] = { dealt: 0, taken: 0, kills: 0, shots: 0, hits: 0, team: hitUnitTeam };
      }
      this.combatStats.damageByUnit[target.name].taken += collisionDamage;
      this.combatStats.damageByUnit[hitUnit.name].taken += collisionDamage;

      // Check for deaths
      if (target.hp <= 0) {
        this.unitDied(target.id, '', collisionDamage, weapon);
      }
      if (hitUnit.hp <= 0) {
        this.unitDied(hitUnit.id, '', collisionDamage, weapon);
      }
    }

    // Log normal knockback if no collision
    if (!hitWall && !hitUnit && actualKnockback > 0) {
      EventBridge.emit('log-entry', {
        id: `knockback_${Date.now()}`,
        timestamp: Date.now(),
        type: 'move',
        actor: target.name,
        actorTeam: target.team,
        message: `${target.name} is knocked back ${actualKnockback} tiles!`,
      });
    }

    this.emitAllUnitsData();
  }

  // ==================== TELEPORT ====================

  private teleportUnit(unit: Unit, targetX: number, targetY: number, callback?: () => void): void {
    // Check if unit has teleport power
    if (!unit.powers.includes('teleport')) {
      this.emitToUI('combat-log', { message: `❌ ${unit.name} cannot teleport!`, type: 'system' });
      if (callback) callback();
      return;
    }

    const power = SPECIAL_POWERS.teleport;

    // Check cooldown
    if ((unit.powerCooldowns['teleport'] || 0) > 0) {
      this.emitToUI('combat-log', {
        message: `⏳ Teleport on cooldown! (${unit.powerCooldowns['teleport']} turns)`,
        type: 'system'
      });
      if (callback) callback();
      return;
    }

    // Check range
    const distance = Math.abs(targetX - unit.position.x) + Math.abs(targetY - unit.position.y);
    if (distance > power.range) {
      this.emitToUI('combat-log', { message: `❌ Target too far! (max range: ${power.range})`, type: 'system' });
      if (callback) callback();
      return;
    }

    // Check AP
    if (unit.ap < power.apCost) {
      this.emitToUI('combat-log', { message: `❌ Not enough AP! (need ${power.apCost})`, type: 'system' });
      if (callback) callback();
      return;
    }

    // Check target tile is walkable and empty
    const targetTile = this.tiles[targetY]?.[targetX];
    if (!targetTile || !this.isTileWalkable(targetX, targetY) || targetTile.occupant) {
      this.emitToUI('combat-log', { message: '❌ Cannot teleport there!', type: 'system' });
      if (callback) callback();
      return;
    }

    this.animating = true;

    // Clear old position
    this.tiles[unit.position.y][unit.position.x].occupant = undefined;
    const oldPos = { ...unit.position };

    // Deduct AP and set cooldown
    unit.ap -= power.apCost;
    unit.powerCooldowns['teleport'] = power.cooldown;

    // Visual effect - fade out
    const screenPos = gridToScreen(targetX, targetY, this.offsetX, this.offsetY);
    const newDepth = getIsoDepth(targetX, targetY) + 100;

    // Teleport flash at origin
    const flashOrigin = this.add.circle(unit.sprite!.x, unit.sprite!.y - 30, 40, 0x88ddff, 0.8);
    flashOrigin.setDepth(200);
    this.tweens.add({
      targets: flashOrigin,
      scale: 2,
      alpha: 0,
      duration: 300,
      onComplete: () => flashOrigin.destroy()
    });

    // Fade out sprite
    this.tweens.add({
      targets: [unit.sprite, unit.healthBar, unit.healthBarBg, unit.nameText, unit.statusIconsText, unit.stanceText],
      alpha: 0,
      duration: 150,
      onComplete: () => {
        // Update position
        unit.position = { x: targetX, y: targetY };

        // Reposition everything
        if (unit.sprite) {
          unit.sprite.setPosition(screenPos.x, screenPos.y);
          unit.sprite.setDepth(newDepth);
        }

        const spriteHeight = unit.sprite?.displayHeight || TILE_HEIGHT;

        if (unit.healthBarBg) {
          unit.healthBarBg.setPosition(screenPos.x, screenPos.y - spriteHeight - 8);
          unit.healthBarBg.setDepth(newDepth + 0.1);
        }
        if (unit.nameText) {
          unit.nameText.setPosition(screenPos.x, screenPos.y + 4);
          unit.nameText.setDepth(newDepth + 0.3);
        }
        if (unit.statusIconsText) {
          unit.statusIconsText.setPosition(screenPos.x, screenPos.y - spriteHeight - 24);
          unit.statusIconsText.setDepth(newDepth + 0.5);
        }
        if (unit.stanceText) {
          unit.stanceText.setPosition(screenPos.x + TILE_WIDTH / 3, screenPos.y - spriteHeight / 2);
          unit.stanceText.setDepth(newDepth + 0.5);
        }

        // Teleport flash at destination
        const flashDest = this.add.circle(screenPos.x, screenPos.y - 30, 10, 0x88ddff, 0.8);
        flashDest.setDepth(200);
        this.tweens.add({
          targets: flashDest,
          scale: 4,
          alpha: 0,
          duration: 300,
          onComplete: () => flashDest.destroy()
        });

        // Fade in sprite
        this.tweens.add({
          targets: [unit.sprite, unit.healthBar, unit.healthBarBg, unit.nameText, unit.statusIconsText, unit.stanceText],
          alpha: 1,
          duration: 150,
          onComplete: () => {
            this.animating = false;
            this.updateHealthBar(unit);
            this.updateSelectionTile(unit, screenPos.x, screenPos.y, newDepth);
            if (callback) callback();
          }
        });
      }
    });

    // Mark new position
    this.tiles[targetY][targetX].occupant = unit.id;

    // Log it
    this.emitToUI('combat-log', {
      message: `✨ ${unit.name} TELEPORTS to (${targetX}, ${targetY})!`,
      type: 'system'
    });

    EventBridge.emit('unit-moved', {
      unitId: unit.id,
      from: oldPos,
      to: unit.position,
      apRemaining: unit.ap,
    });

    this.setActionMode('idle');
    this.emitAllUnitsData();
    this.updateFogOfWar();
  }

  // ==================== ATTACK ====================

  private tryAttackUnit(attackerId: string, targetId: string, callback?: () => void): void {
    const attacker = this.units.get(attackerId);
    const target = this.units.get(targetId);
    if (!attacker || !target) {
      if (callback) callback();
      return;
    }

    // Face the target before attacking
    this.updateUnitFacing(
      attacker,
      attacker.position.x, attacker.position.y,
      target.position.x, target.position.y
    );

    // Cannot attack own team
    if (attacker.team === target.team) {
      EventBridge.emit('log-entry', {
        id: `friendly_${Date.now()}`,
        timestamp: Date.now(),
        type: 'system',
        actor: attacker.name,
        actorTeam: attacker.team,
        message: `${attacker.name}: Can't attack friendly unit ${target.name}!`,
      });
      if (callback) callback();
      return;
    }

    const weapon = WEAPONS[attacker.weapon];
    const apCost = weapon.ap;
    if (attacker.ap < apCost) {
      if (callback) callback();
      return;
    }

    // Check LOS
    if (!this.hasLineOfSight(attacker.position.x, attacker.position.y, target.position.x, target.position.y)) {
      EventBridge.emit('log-entry', {
        id: `los_${Date.now()}`,
        timestamp: Date.now(),
        type: 'system',
        actor: attacker.name,
        actorTeam: attacker.team,
        target: target.name,
        targetTeam: target.team,
        message: `${attacker.name} cannot see ${target.name} - Line of Sight blocked!`,
      });
      if (callback) callback();
      return;
    }

    // Check range
    const dist = Math.sqrt(
      Math.pow(target.position.x - attacker.position.x, 2) +
      Math.pow(target.position.y - attacker.position.y, 2)
    );
    if (dist > weapon.range) {
      EventBridge.emit('log-entry', {
        id: `range_${Date.now()}`,
        timestamp: Date.now(),
        type: 'system',
        actor: attacker.name,
        actorTeam: attacker.team,
        message: `${attacker.name}: Target out of range! (${dist.toFixed(1)} > ${weapon.range})`,
      });
      if (callback) callback();
      return;
    }

    attacker.ap -= apCost;
    this.animating = true;

    // Play weapon sound based on weapon type
    const weaponType = attacker.weapon.toLowerCase();
    if (weaponType.includes('pistol')) {
      this.playSound('weapon.pistol', attacker.position);
    } else if (weaponType.includes('rifle') || weaponType.includes('smg')) {
      this.playSound('weapon.rifle', attacker.position);
    } else if (weaponType.includes('shotgun')) {
      this.playSound('weapon.shotgun', attacker.position);
    } else if (weaponType.includes('beam') || weaponType.includes('laser') || weaponType.includes('plasma')) {
      this.playSound('weapon.beam', attacker.position);
    } else if (weaponType.includes('sword') || weaponType.includes('axe') || weaponType.includes('fist')) {
      this.playSound('weapon.melee', attacker.position);
    } else {
      this.playSound('weapon.pistol', attacker.position); // Default
    }

    // Fire visual effect
    this.fireVisualEffect(attacker, target, weapon, () => {
      // Calculate hit using new verb system
      // Roll 0-100, modified by accuracy and agility
      const roll = Math.random() * 100;
      const effectiveAccuracy = weapon.accuracy + (attacker.agl - 50) * 0.3;
      const hitResult = getHitResult(roll, effectiveAccuracy);

      // Get damage type and verbs for this weapon
      const damageType = WEAPON_DAMAGE_TYPES[attacker.weapon];
      const verbs = DAMAGE_VERBS[damageType];

      // Calculate damage based on hit result
      let damage = 0;
      let baseDamage = weapon.damage + Math.floor(attacker.str / 10);

      if (hitResult === 'crit') {
        damage = Math.floor(baseDamage * 1.5); // 150% damage
        this.playSound('impact.crit', target.position);
      } else if (hitResult === 'hit') {
        damage = baseDamage; // 100% damage
        this.playSound('impact.flesh', target.position);
      } else if (hitResult === 'graze') {
        damage = Math.floor(baseDamage * 0.5); // 50% damage
        this.playSound('impact.flesh', target.position);
      } else {
        // miss = 0 damage
        this.playSound('impact.miss', target.position);
      }

      const didHit = hitResult !== 'miss';
      const isCrit = hitResult === 'crit';
      const isGraze = hitResult === 'graze';

      // === TRACK COMBAT STATS ===
      const attackerTeam = attacker.team as 'blue' | 'red';
      const targetTeam = target.team as 'blue' | 'red';

      // Initialize unit stats if needed
      if (!this.combatStats.damageByUnit[attacker.name]) {
        this.combatStats.damageByUnit[attacker.name] = { dealt: 0, taken: 0, kills: 0, shots: 0, hits: 0, team: attackerTeam };
      }
      if (!this.combatStats.damageByUnit[target.name]) {
        this.combatStats.damageByUnit[target.name] = { dealt: 0, taken: 0, kills: 0, shots: 0, hits: 0, team: targetTeam };
      }

      // Track shots
      this.combatStats.shotsFired[attackerTeam]++;
      this.combatStats.damageByUnit[attacker.name].shots++;

      if (didHit) {
        // Track hits and damage
        this.combatStats.hits[attackerTeam]++;
        this.combatStats.damageByUnit[attacker.name].hits++;
        this.combatStats.damageByUnit[attacker.name].dealt += damage;
        this.combatStats.damageByUnit[target.name].taken += damage;
        this.combatStats.totalDamageDealt[attackerTeam] += damage;

        // Track hit types
        if (isCrit) {
          this.combatStats.criticalHits[attackerTeam]++;
        } else if (isGraze) {
          this.combatStats.grazes[attackerTeam]++;
        }

        // Track most damage taken (for Tank award)
        if (this.combatStats.damageByUnit[target.name].taken > this.combatStats.mostDamageTaken.damage) {
          this.combatStats.mostDamageTaken = { unit: target.name, damage: this.combatStats.damageByUnit[target.name].taken };
        }
      } else {
        this.combatStats.misses[attackerTeam]++;
      }
      // === END COMBAT STATS ===

      // Floating damage/result text position (isometric)
      const targetScreenPos = gridToScreen(target.position.x, target.position.y, this.offsetX, this.offsetY);
      const tx = targetScreenPos.x;
      const ty = targetScreenPos.y - TILE_HEIGHT / 2;

      if (didHit) {
        target.hp = Math.max(0, target.hp - damage);
        this.updateHealthBar(target);

        // Floating damage text with verb-appropriate styling
        let textContent = '';
        let fontSize = '16px';
        let textColor = '#ffff00';

        if (isCrit) {
          textContent = `${verbs.crit}! -${damage}`;
          fontSize = '22px';
          textColor = '#ff0000';
        } else if (isGraze) {
          textContent = `${verbs.graze} -${damage}`;
          fontSize = '14px';
          textColor = '#ffaa00';
        } else {
          textContent = `${verbs.hit} -${damage}`;
          fontSize = '16px';
          textColor = '#ffff00';
        }

        const damageText = this.add.text(tx, ty, textContent, {
          fontSize,
          color: textColor,
          fontStyle: 'bold',
          stroke: '#000000',
          strokeThickness: 3,
        });
        damageText.setOrigin(0.5, 1);
        damageText.setDepth(200);

        this.tweens.add({
          targets: damageText,
          y: ty - 40,
          alpha: 0,
          duration: 1200,
          ease: 'Power2',
          onComplete: () => damageText.destroy(),
        });

        // Flash effect on target (stronger for crits)
        if (target.sprite) {
          this.tweens.add({
            targets: target.sprite,
            alpha: isCrit ? 0.1 : 0.3,
            duration: isCrit ? 60 : 80,
            yoyo: true,
            repeat: isCrit ? 3 : 2,
          });
        }
      } else {
        // Miss text with weapon-specific verb
        const missText = this.add.text(tx, ty, verbs.miss.toUpperCase(), {
          fontSize: '14px',
          color: '#888888',
          fontStyle: 'bold',
          stroke: '#000000',
          strokeThickness: 2,
        });
        missText.setOrigin(0.5, 1);
        missText.setDepth(200);

        this.tweens.add({
          targets: missText,
          y: ty - 30,
          alpha: 0,
          duration: 800,
          ease: 'Power2',
          onComplete: () => missText.destroy(),
        });
      }

      // Emit sound ring
      this.emitSoundRing(attacker.position.x, attacker.position.y, weapon.sound);

      EventBridge.emit('attack-resolved', {
        attackerId: attacker.id,
        targetId: target.id,
        hit: didHit,
        damage,
        criticalHit: isCrit,
        statusApplied: [],
      });

      if (didHit) {
        EventBridge.emit('unit-damaged', {
          unitId: target.id,
          damage,
          newHp: target.hp,
        });
      }

      // Build detailed combat log message with weapon-specific verbs
      // Damage severity based on percentage of target's max HP
      const getDamageSeverity = (dmg: number, maxHp: number): string => {
        const pct = dmg / maxHp;
        if (pct >= 0.5) return 'DEVASTATING';
        if (pct >= 0.35) return 'MASSIVE';
        if (pct >= 0.25) return 'HEAVY';
        if (pct >= 0.15) return 'SOLID';
        if (pct >= 0.08) return 'LIGHT';
        return 'MINOR';
      };

      // Overkill check
      const isOverkill = target.hp <= 0 && damage > target.maxHp * 0.5;
      const overkillText = isOverkill ? ' 💀 OVERKILL!' : '';

      let resultText = '';
      if (isCrit) {
        const severity = getDamageSeverity(damage, target.maxHp);
        resultText = `${weapon.emoji} ${attacker.name} ${verbs.crit} ${target.name}! ${severity} ${damage} damage!${overkillText}`;
      } else if (isGraze) {
        resultText = `${weapon.emoji} ${attacker.name} ${verbs.graze} ${target.name} - ${damage} damage`;
      } else if (didHit) {
        const severity = getDamageSeverity(damage, target.maxHp);
        resultText = `${weapon.emoji} ${attacker.name} ${verbs.hit} ${target.name} for ${severity} ${damage} damage!${overkillText}`;
      } else {
        resultText = `${weapon.emoji} ${attacker.name} ${verbs.miss} ${target.name}!`;
      }

      EventBridge.emit('log-entry', {
        id: `attack_${Date.now()}`,
        timestamp: Date.now(),
        type: 'attack',
        actor: attacker.name,
        actorTeam: attacker.team,
        target: target.name,
        targetTeam: target.team,
        message: resultText,
        details: didHit ? [`${target.name}: ${target.hp}/${target.maxHp} HP`] : [],
      });

      // Apply knockback if weapon has it and target was hit
      if (didHit && weapon.knockback && weapon.knockback > 0 && target.hp > 0) {
        this.knockbackUnit(target, attacker.position.x, attacker.position.y, weapon.knockback, weapon.name);
      }

      // Check for death
      if (target.hp <= 0) {
        this.unitDied(target.id, attacker.id, damage, weapon.name);
      }

      EventBridge.emit('unit-selected', this.getUnitData(attacker));
      this.setActionMode('idle');
      this.emitAllUnitsData();

      this.animating = false;
      if (callback) callback();
    });
  }

  // ==================== VISUAL EFFECTS ====================

  private createMuzzleFlash(x: number, y: number, angle: number, color: number): void {
    // Bright core flash
    const flash = this.add.circle(x, y, 12, 0xffffff);
    flash.setAlpha(1);
    flash.setDepth(150);
    this.effectsLayer.add(flash);

    // Outer glow
    const glow = this.add.circle(x, y, 20, color);
    glow.setAlpha(0.6);
    glow.setDepth(149);
    this.effectsLayer.add(glow);

    // Sparks shooting outward
    for (let i = 0; i < 5; i++) {
      const sparkAngle = angle + (Math.random() - 0.5) * 0.8;
      const sparkDist = 15 + Math.random() * 25;
      const spark = this.add.circle(x, y, 3, 0xffff00);
      spark.setDepth(151);
      this.effectsLayer.add(spark);

      this.tweens.add({
        targets: spark,
        x: x + Math.cos(sparkAngle) * sparkDist,
        y: y + Math.sin(sparkAngle) * sparkDist,
        alpha: 0,
        scale: 0.2,
        duration: 150 + Math.random() * 100,
        onComplete: () => spark.destroy()
      });
    }

    // Flash fades quick
    this.tweens.add({
      targets: [flash, glow],
      alpha: 0,
      scale: 1.5,
      duration: 80,
      onComplete: () => {
        flash.destroy();
        glow.destroy();
      }
    });
  }

  private createImpactEffect(x: number, y: number, color: number, isEnergy: boolean): void {
    // Main impact flash
    const impact = this.add.circle(x, y, 18, color);
    impact.setAlpha(0.9);
    impact.setDepth(150);
    this.effectsLayer.add(impact);

    // Impact ring
    const ring = this.add.circle(x, y, 5, color, 0);
    ring.setStrokeStyle(3, color, 1);
    ring.setDepth(149);
    this.effectsLayer.add(ring);

    // Debris/sparks
    const particleCount = isEnergy ? 8 : 6;
    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * Math.PI * 2;
      const dist = 20 + Math.random() * 30;
      const particleColor = isEnergy ? color : 0xffaa00;
      const particle = this.add.circle(x, y, isEnergy ? 4 : 3, particleColor);
      particle.setDepth(151);
      this.effectsLayer.add(particle);

      this.tweens.add({
        targets: particle,
        x: x + Math.cos(angle) * dist,
        y: y + Math.sin(angle) * dist,
        alpha: 0,
        scale: 0.3,
        duration: 200 + Math.random() * 150,
        ease: 'Power2',
        onComplete: () => particle.destroy()
      });
    }

    this.tweens.add({
      targets: impact,
      alpha: 0,
      scale: 2,
      duration: 120,
      onComplete: () => impact.destroy()
    });

    this.tweens.add({
      targets: ring,
      radius: 35,
      alpha: 0,
      duration: 200,
      onComplete: () => ring.destroy()
    });
  }

  private fireVisualEffect(attacker: Unit, defender: Unit, weapon: typeof WEAPONS[WeaponType], callback: () => void): void {
    const v = weapon.visual;
    // Use isometric coordinates for visual effects
    const attackerScreenPos = gridToScreen(attacker.position.x, attacker.position.y, this.offsetX, this.offsetY);
    const defenderScreenPos = gridToScreen(defender.position.x, defender.position.y, this.offsetX, this.offsetY);

    // Calculate gun/chest height offset (sprites have origin at bottom-center)
    // Gun position is roughly 55-60% up from the feet
    const attackerHeight = attacker.sprite?.displayHeight || 64;
    const defenderHeight = defender.sprite?.displayHeight || 64;
    const gunHeightRatio = 0.55; // Gun at 55% up from feet
    const bodyHeightRatio = 0.50; // Target center mass at 50% up

    const sx = attackerScreenPos.x;
    const sy = attackerScreenPos.y - (attackerHeight * gunHeightRatio); // Offset up to gun level
    const ex = defenderScreenPos.x;
    const ey = defenderScreenPos.y - (defenderHeight * bodyHeightRatio); // Offset up to body center
    const angle = Math.atan2(ey - sy, ex - sx);

    if (v.type === 'beam') {
      // BEAM: Glowing energy beam with core and outer glow
      const length = Math.sqrt((ex - sx) ** 2 + (ey - sy) ** 2);

      // Outer glow beam
      const beamGlow = this.add.rectangle(sx, sy, 0, 16, v.color);
      beamGlow.setOrigin(0, 0.5);
      beamGlow.setRotation(angle);
      beamGlow.setAlpha(0.4);
      beamGlow.setDepth(99);
      this.effectsLayer.add(beamGlow);

      // Core beam (brighter, thinner)
      const beamCore = this.add.rectangle(sx, sy, 0, 6, 0xffffff);
      beamCore.setOrigin(0, 0.5);
      beamCore.setRotation(angle);
      beamCore.setDepth(100);
      this.effectsLayer.add(beamCore);

      // Source glow
      const sourceGlow = this.add.circle(sx, sy, 15, v.color);
      sourceGlow.setAlpha(0.8);
      sourceGlow.setDepth(101);
      this.effectsLayer.add(sourceGlow);

      this.tweens.add({
        targets: [beamGlow, beamCore],
        width: length,
        duration: 80,
        onComplete: () => {
          // Impact at target
          this.createImpactEffect(ex, ey, v.color, true);

          this.tweens.add({
            targets: [beamGlow, beamCore, sourceGlow],
            alpha: 0,
            duration: 150,
            onComplete: () => {
              beamGlow.destroy();
              beamCore.destroy();
              sourceGlow.destroy();
              callback();
            }
          });
        }
      });

      this.tweens.add({
        targets: sourceGlow,
        scale: 1.5,
        alpha: 0,
        duration: 200
      });

    } else if (v.type === 'cone') {
      // CONE: Shotgun blast with pellet spread
      const length = Math.min(Math.sqrt((ex - sx) ** 2 + (ey - sy) ** 2), 150);
      const spreadRad = (((v as any).spread || 30) / 2) * Math.PI / 180;

      // Muzzle flash
      this.createMuzzleFlash(sx, sy, angle, v.color);

      // Main cone
      const g = this.add.graphics();
      g.setDepth(100);
      g.fillStyle(v.color, 0.6);
      g.beginPath();
      g.moveTo(sx, sy);
      g.lineTo(sx + Math.cos(angle - spreadRad) * length, sy + Math.sin(angle - spreadRad) * length);
      g.lineTo(sx + Math.cos(angle + spreadRad) * length, sy + Math.sin(angle + spreadRad) * length);
      g.closePath();
      g.fillPath();
      this.effectsLayer.add(g);

      // Individual pellets
      for (let i = 0; i < 8; i++) {
        const pelletAngle = angle + (Math.random() - 0.5) * spreadRad * 2;
        const pelletDist = length * (0.7 + Math.random() * 0.3);
        const pellet = this.add.circle(sx, sy, 3, 0xffff00);
        pellet.setDepth(101);
        this.effectsLayer.add(pellet);

        this.tweens.add({
          targets: pellet,
          x: sx + Math.cos(pelletAngle) * pelletDist,
          y: sy + Math.sin(pelletAngle) * pelletDist,
          alpha: 0,
          duration: 150,
          onComplete: () => pellet.destroy()
        });
      }

      this.tweens.add({
        targets: g,
        alpha: 0,
        duration: 250,
        onComplete: () => {
          g.destroy();
          this.createImpactEffect(ex, ey, v.color, false);
          callback();
        }
      });

    } else if (v.type === 'melee') {
      // MELEE: Slash arc with trail
      const slashLength = 50;

      // Multiple slash lines for trail effect
      for (let i = 0; i < 3; i++) {
        const slash = this.add.rectangle((sx + ex) / 2, (sy + ey) / 2, slashLength, 8 - i * 2, v.color);
        slash.setRotation(angle + Math.PI / 4);
        slash.setDepth(100 + i);
        slash.setAlpha(0);
        slash.setScale(0.3, 1);
        this.effectsLayer.add(slash);

        this.tweens.add({
          targets: slash,
          alpha: 1 - i * 0.3,
          scaleX: 1.8,
          rotation: angle - Math.PI / 4,
          duration: 120,
          delay: i * 20,
          yoyo: true,
          onComplete: () => slash.destroy()
        });
      }

      // Impact sparks
      this.time.delayedCall(100, () => {
        for (let i = 0; i < 4; i++) {
          const sparkAngle = Math.random() * Math.PI * 2;
          const spark = this.add.circle(ex, ey, 4, 0xffff00);
          spark.setDepth(102);
          this.effectsLayer.add(spark);

          this.tweens.add({
            targets: spark,
            x: ex + Math.cos(sparkAngle) * 25,
            y: ey + Math.sin(sparkAngle) * 25,
            alpha: 0,
            duration: 150,
            onComplete: () => spark.destroy()
          });
        }
        callback();
      });

    } else {
      // PROJECTILE: Bullet with tracer and muzzle flash
      this.createMuzzleFlash(sx, sy, angle, v.color);

      // Tracer trail
      const tracer = this.add.rectangle(sx, sy, 20, 3, v.color);
      tracer.setOrigin(1, 0.5);
      tracer.setRotation(angle);
      tracer.setDepth(99);
      tracer.setAlpha(0.6);
      this.effectsLayer.add(tracer);

      // Main projectile
      const proj = this.add.circle(sx, sy, 5, v.color);
      proj.setDepth(100);
      this.effectsLayer.add(proj);

      this.tweens.add({
        targets: [proj, tracer],
        x: ex,
        y: ey,
        duration: 120,
        onComplete: () => {
          tracer.destroy();
          proj.destroy();
          this.createImpactEffect(ex, ey, v.color, false);
          callback();
        }
      });
    }
  }

  // ==================== SOUND RING ====================

  private emitSoundRing(x: number, y: number, soundData: { decibels: number; baseRange: number }): void {
    // Use isometric screen position
    const screenPos = gridToScreen(x, y, this.offsetX, this.offsetY);
    const px = screenPos.x;
    const py = screenPos.y;
    const tileRange = Math.min(Math.ceil(soundData.baseRange / 5), 15);

    // Color based on decibels - more vibrant colors
    let ringColor = 0x888888;
    let strokeWidth = 2;
    if (soundData.decibels >= 140) {
      ringColor = 0xff4444; // Gunfire - bright red
      strokeWidth = 4;
    } else if (soundData.decibels >= 100) {
      ringColor = 0xff8800; // Loud - orange
      strokeWidth = 3;
    } else if (soundData.decibels >= 60) {
      ringColor = 0xffff00; // Medium - yellow
      strokeWidth = 2;
    }

    // Primary expanding ring - HIGH DEPTH so it's visible
    const ring = this.add.circle(px, py, 10, ringColor, 0);
    ring.setStrokeStyle(strokeWidth, ringColor, 0.9);
    ring.setDepth(1000); // On top of everything
    this.effectsLayer.add(ring);

    this.tweens.add({
      targets: ring,
      radius: tileRange * TILE_SIZE,
      alpha: 0,
      duration: 800,
      ease: 'Power2',
      onComplete: () => ring.destroy()
    });

    // For loud sounds, add multiple rings
    if (soundData.decibels >= 100) {
      const ring2 = this.add.circle(px, py, 10, ringColor, 0);
      ring2.setStrokeStyle(strokeWidth + 1, ringColor, 0.6);
      ring2.setDepth(1000);
      this.effectsLayer.add(ring2);

      this.tweens.add({
        targets: ring2,
        radius: tileRange * TILE_SIZE * 0.7,
        alpha: 0,
        duration: 500,
        ease: 'Power2',
        onComplete: () => ring2.destroy()
      });
    }

    // For very loud sounds (gunfire), add third ring and central flash
    if (soundData.decibels >= 140) {
      const ring3 = this.add.circle(px, py, 10, ringColor, 0);
      ring3.setStrokeStyle(2, ringColor, 0.4);
      ring3.setDepth(1000);
      this.effectsLayer.add(ring3);

      this.tweens.add({
        targets: ring3,
        radius: tileRange * TILE_SIZE * 0.4,
        alpha: 0,
        duration: 300,
        ease: 'Power2',
        onComplete: () => ring3.destroy()
      });

      // Central pulse
      const pulse = this.add.circle(px, py, 8, ringColor, 0.3);
      pulse.setDepth(999);
      this.effectsLayer.add(pulse);

      this.tweens.add({
        targets: pulse,
        scale: 3,
        alpha: 0,
        duration: 200,
        onComplete: () => pulse.destroy()
      });
    }

    // Check which units can hear this sound and report direction
    const listeners: string[] = [];
    this.units.forEach(unit => {
      if (unit.hp <= 0) return;

      const dist = Math.sqrt(
        Math.pow(unit.position.x - x, 2) + Math.pow(unit.position.y - y, 2)
      );

      if (dist <= tileRange && dist > 0) {
        // Calculate direction from listener to sound
        const dx = x - unit.position.x;
        const dy = y - unit.position.y;

        let direction = '';
        if (Math.abs(dx) > Math.abs(dy)) {
          direction = dx > 0 ? '➡️ EAST' : '⬅️ WEST';
        } else {
          direction = dy > 0 ? '⬇️ SOUTH' : '⬆️ NORTH';
        }

        const loudness = soundData.decibels >= 140 ? 'GUNFIRE' :
          soundData.decibels >= 100 ? 'LOUD NOISE' :
            soundData.decibels >= 60 ? 'noise' : 'faint sound';

        listeners.push(`${unit.name} 👂${direction}`);
      }
    });

    // Log who heard and from which direction
    if (listeners.length > 0) {
      const hearingEmoji = soundData.decibels >= 140 ? '💥' :
        soundData.decibels >= 100 ? '🔊' : '👂';
      const loudness = soundData.decibels >= 140 ? 'GUNFIRE' :
        soundData.decibels >= 100 ? 'LOUD NOISE' : 'noise';

      EventBridge.emit('log-entry', {
        id: `sound_${Date.now()}`,
        timestamp: Date.now(),
        type: 'effect',
        message: `${hearingEmoji} HEARD ${loudness}: ${listeners.join(' | ')}`,
      });
    }
  }

  // ==================== DEATH ====================

  private unitDied(unitId: string, killedBy: string, damage: number = 0, weapon: string = 'unknown'): void {
    const unit = this.units.get(unitId);
    const killer = this.units.get(killedBy);
    if (!unit) return;

    // Track kill in combat stats
    const killerTeam = killer?.team || 'red';
    const killEntry: KillEntry = {
      turn: this.roundNumber,
      killer: killer?.name || 'Unknown',
      victim: unit.name,
      weapon: weapon,
      damage: damage,
      overkill: Math.max(0, damage - unit.hp),
    };

    this.combatStats.killLog.push(killEntry);
    this.combatStats.lastKill = killEntry;

    if (!this.combatStats.firstBlood) {
      this.combatStats.firstBlood = killEntry;
    }

    // Update team kill count
    if (killerTeam === 'blue' || killerTeam === 'red') {
      this.combatStats.totalKills[killerTeam]++;
    }

    // Update killer's stats
    if (killer && this.combatStats.damageByUnit[killer.name]) {
      this.combatStats.damageByUnit[killer.name].kills++;

      // Track killstreak
      if (!this.combatStats.currentStreaks[killer.name]) {
        this.combatStats.currentStreaks[killer.name] = 0;
      }
      this.combatStats.currentStreaks[killer.name]++;

      if (this.combatStats.currentStreaks[killer.name] > this.combatStats.longestKillstreak.streak) {
        this.combatStats.longestKillstreak = {
          unit: killer.name,
          streak: this.combatStats.currentStreaks[killer.name]
        };
      }
    }

    // Clear tile
    this.tiles[unit.position.y][unit.position.x].occupant = undefined;

    // Death animation - Note: healthBar is Graphics, needs separate handling
    const tweenTargets = [unit.sprite, unit.healthBarBg, unit.nameText, unit.selectionTile, unit.effectsContainer].filter(Boolean);

    this.tweens.add({
      targets: tweenTargets,
      alpha: 0,
      scale: 0.5,
      duration: 500,
      onComplete: () => {
        unit.sprite?.destroy();
        unit.healthBar?.destroy();
        unit.healthBarBg?.destroy();
        unit.nameText?.destroy();
        unit.selectionTile?.destroy();
        unit.effectsContainer?.destroy();
      }
    });

    // Fade out the Graphics health bar separately
    if (unit.healthBar) {
      this.tweens.add({
        targets: { alpha: 1 },
        alpha: 0,
        duration: 500,
        onUpdate: (tween) => {
          const val = tween.getValue();
          unit.healthBar?.setAlpha(val);
        }
      });
    }

    EventBridge.emit('unit-died', { unitId, killedBy });

    EventBridge.emit('log-entry', {
      id: `death_${Date.now()}`,
      timestamp: Date.now(),
      type: 'death',
      actor: unit.name,
      actorTeam: unit.team,
      target: killer?.name,
      targetTeam: killer?.team,
      message: `💀 ${unit.name} has been KILLED by ${killer?.name || 'unknown'}!`,
    });

    this.units.delete(unitId);
    this.emitAllUnitsData();

    // Check win condition
    this.checkWinCondition();
  }

  private checkWinCondition(): void {
    const blueAlive = Array.from(this.units.values()).filter(u => u.team === 'blue').length;
    const redAlive = Array.from(this.units.values()).filter(u => u.team === 'red').length;

    if (blueAlive === 0) {
      this.endCombat('red');
    } else if (redAlive === 0) {
      this.endCombat('blue');
    }
  }

  private calculateAwards(): CombatAwards {
    const awards: CombatAwards = {
      mvp: null,
      reaper: null,
      firstBlood: null,
      finalBlow: null,
      tank: null,
      killstreak: null,
    };

    // MVP - most damage dealt
    let maxDamage = 0;
    for (const [name, stats] of Object.entries(this.combatStats.damageByUnit)) {
      if (stats.dealt > maxDamage) {
        maxDamage = stats.dealt;
        awards.mvp = name;
      }
    }

    // Reaper - most kills
    let maxKills = 0;
    for (const [name, stats] of Object.entries(this.combatStats.damageByUnit)) {
      if (stats.kills > maxKills) {
        maxKills = stats.kills;
        awards.reaper = name;
      }
    }

    // First Blood
    if (this.combatStats.firstBlood) {
      awards.firstBlood = this.combatStats.firstBlood.killer;
    }

    // Final Blow
    if (this.combatStats.lastKill) {
      awards.finalBlow = this.combatStats.lastKill.killer;
    }

    // Tank - most damage taken (among survivors or just most)
    if (this.combatStats.mostDamageTaken.unit) {
      awards.tank = this.combatStats.mostDamageTaken.unit;
    }

    // Killstreak
    if (this.combatStats.longestKillstreak.streak >= 2) {
      awards.killstreak = this.combatStats.longestKillstreak.unit;
    }

    return awards;
  }

  private endCombat(winner: string): void {
    this.aiVsAi = false;
    this.combatStats.turnCount = this.roundNumber;

    const survivors = Array.from(this.units.values()).map(u => ({
      team: u.team,
      unitId: u.id,
      hp: u.hp,
      name: u.name,
    }));

    const awards = this.calculateAwards();

    // Emit combat stats for post-battle summary
    EventBridge.emit('combat-stats', {
      stats: this.combatStats,
      awards: awards,
      winner: winner,
      rounds: this.roundNumber,
      survivors: survivors,
    });

    EventBridge.emit('combat-ended', {
      winner,
      rounds: this.roundNumber,
      casualties: [],
      survivingUnits: survivors,
    });

    EventBridge.emit('log-entry', {
      id: `end_${Date.now()}`,
      timestamp: Date.now(),
      type: 'system',
      actor: 'System',
      message: `🏆 Combat ended! ${winner.toUpperCase()} TEAM WINS!`,
    });
  }

  private executeAction(action: ActionPayload): void {
    switch (action.type) {
      case 'move':
        if (action.targetPosition) {
          this.tryMoveUnit(action.unitId, action.targetPosition.x, action.targetPosition.y);
        }
        break;
      case 'attack':
        if (action.targetId) {
          this.tryAttackUnit(action.unitId, action.targetId);
        }
        break;
    }
  }

  private cancelAction(): void {
    this.setActionMode('idle');
    EventBridge.emit('action-cancelled');
  }

  // ==================== TURN MANAGEMENT ====================

  private combatEnded: boolean = false;

  private checkVictory(): boolean {
    const blueAlive = Array.from(this.units.values()).filter(u => u.team === 'blue' && u.hp > 0);
    const redAlive = Array.from(this.units.values()).filter(u => u.team === 'red' && u.hp > 0);

    if (blueAlive.length === 0) {
      this.declareCombatEnd('red');
      return true;
    }
    if (redAlive.length === 0) {
      this.declareCombatEnd('blue');
      return true;
    }
    return false;
  }

  private declareCombatEnd(winner: 'blue' | 'red'): void {
    if (this.combatEnded) return;
    this.combatEnded = true;

    const winnerName = winner === 'blue' ? 'BLUE TEAM' : 'RED TEAM';
    const emoji = winner === 'blue' ? '🔵' : '🔴';

    EventBridge.emit('log-entry', {
      id: `victory_${Date.now()}`,
      timestamp: Date.now(),
      type: 'system',
      actor: 'System',
      message: `🏆 VICTORY! ${emoji} ${winnerName} WINS! 🏆`,
    });

    EventBridge.emit('combat-ended', {
      winner,
      round: this.roundNumber,
    });

    // Show victory text on screen
    const centerX = this.cameras.main.width / 2;
    const centerY = this.cameras.main.height / 2;

    const victoryText = this.add.text(centerX, centerY, `${emoji} ${winnerName} WINS!`, {
      fontSize: '48px',
      color: winner === 'blue' ? '#4a90d9' : '#d94a4a',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 6,
    });
    victoryText.setOrigin(0.5);
    victoryText.setDepth(2000);

    this.tweens.add({
      targets: victoryText,
      scale: 1.2,
      duration: 500,
      yoyo: true,
      repeat: 2,
    });

    console.log(`[COMBAT] Combat ended! Winner: ${winner}`);
  }

  private endTurn(): void {
    if (this.animating) return;
    if (this.combatEnded) return;

    // Check for victory before proceeding
    if (this.checkVictory()) {
      return;
    }

    // Mark all current team units as acted
    this.units.forEach(unit => {
      if (unit.team === this.currentTeam) {
        unit.acted = true;
      }
    });

    // Switch teams
    this.currentTeam = this.currentTeam === 'blue' ? 'red' : 'blue';

    // If back to blue, new round
    if (this.currentTeam === 'blue') {
      this.roundNumber++;
    }

    // Check again after switching (in case the new team has no units)
    if (this.checkVictory()) {
      return;
    }

    // Restore AP and reset acted flag for current team
    this.units.forEach(unit => {
      if (unit.team === this.currentTeam) {
        unit.ap = unit.maxAp;
        unit.acted = false;
      }
    });

    // Process status effects for all units whose turn is starting
    this.processTeamStatusEffects(this.currentTeam);

    // Reduce power cooldowns for current team
    this.reducePowerCooldowns(this.currentTeam);

    // Select first unit of current team that can act
    const firstUnit = Array.from(this.units.values()).find(u =>
      u.team === this.currentTeam && u.hp > 0 && !this.isUnitIncapacitated(u)
    );
    if (firstUnit) {
      this.selectUnit(firstUnit.id);
    }

    EventBridge.emit('turn-changed', {
      team: this.currentTeam,
      round: this.roundNumber,
    });

    EventBridge.emit('log-entry', {
      id: `turn_${Date.now()}`,
      timestamp: Date.now(),
      type: 'system',
      actor: 'System',
      message: `⏭️ Turn: ${this.currentTeam.toUpperCase()} Team - Round ${this.roundNumber}`,
    });

    this.emitAllUnitsData();
    this.setActionMode('idle');

    // If AI vs AI mode or enemy turn, run AI
    console.log(`[AI] endTurn complete. aiVsAi=${this.aiVsAi}, currentTeam=${this.currentTeam}, playerTeam=${this.playerTeam}`);
    if (this.aiVsAi || this.currentTeam !== this.playerTeam) {
      console.log('[AI] Triggering AI for new team...');
      this.time.delayedCall(500, () => this.runAiTurn());
    }
  }

  // ==================== AI SYSTEM ====================

  private toggleAiVsAi(): void {
    this.aiVsAi = !this.aiVsAi;

    EventBridge.emit('ai-vs-ai-toggled', { enabled: this.aiVsAi });

    EventBridge.emit('log-entry', {
      id: `ai_${Date.now()}`,
      timestamp: Date.now(),
      type: 'system',
      actor: 'System',
      message: this.aiVsAi ? '🤖 AI vs AI MODE ACTIVATED!' : '🎮 AI vs AI MODE DEACTIVATED',
    });

    console.log('[AI] Toggle AI vs AI:', this.aiVsAi, 'Current team:', this.currentTeam);

    // Update fog of war (AI vs AI shows all units)
    this.updateFogOfWar();

    if (this.aiVsAi) {
      // Force start AI immediately
      this.time.delayedCall(300, () => {
        console.log('[AI] Starting AI turn...');
        this.runAiTurn();
      });
    }
  }

  private runAiTurn(): void {
    console.log(`[AI] runAiTurn called. aiVsAi=${this.aiVsAi}, currentTeam=${this.currentTeam}, playerTeam=${this.playerTeam}`);

    // Stop if combat has ended
    if (this.combatEnded) {
      console.log('[AI] Combat ended, stopping AI');
      return;
    }

    if (!this.aiVsAi && this.currentTeam === this.playerTeam) {
      console.log('[AI] Skipping - not AI vs AI and player team');
      return;
    }

    const allies = Array.from(this.units.values()).filter(
      u => u.team === this.currentTeam && !u.acted && u.hp > 0
    );

    console.log(`[AI] Found ${allies.length} allies to control:`, allies.map(a => a.name));

    if (allies.length === 0) {
      console.log('[AI] No allies left, ending turn');
      this.endTurn();
      return;
    }

    const teamEmoji = this.currentTeam === 'blue' ? '🔵' : '🔴';
    EventBridge.emit('log-entry', {
      id: `ai_turn_${Date.now()}`,
      timestamp: Date.now(),
      type: 'system',
      actor: 'AI',
      actorTeam: this.currentTeam as 'blue' | 'red',
      message: `${teamEmoji} AI controlling ${allies.length} unit(s)`,
    });

    this.runSingleAI(allies, 0);
  }

  private runSingleAI(allies: Unit[], index: number): void {
    console.log(`[AI] runSingleAI index=${index}/${allies.length}`);

    // Stop if combat has ended
    if (this.combatEnded) {
      console.log('[AI] Combat ended, stopping AI');
      return;
    }

    if (index >= allies.length) {
      console.log('[AI] All units processed, ending turn');
      this.endTurn();
      return;
    }

    const unit = allies[index];
    if (!unit || unit.hp <= 0) {
      console.log('[AI] Unit dead or invalid, skipping');
      this.time.delayedCall(100, () => this.runSingleAI(allies, index + 1));
      return;
    }

    console.log(`[AI] Processing ${unit.name} at (${unit.position.x},${unit.position.y}), AP=${unit.ap}, HP=${unit.hp}`);
    this.selectUnit(unit.id);

    // Find enemies
    const enemyTeam = unit.team === 'blue' ? 'red' : 'blue';
    const enemies = Array.from(this.units.values()).filter(u => u.team === enemyTeam && u.hp > 0);

    console.log(`[AI] Found ${enemies.length} enemies:`, enemies.map(e => `${e.name}(${e.hp}hp)`));

    if (enemies.length === 0) {
      console.log('[AI] No enemies left');
      this.time.delayedCall(100, () => this.runSingleAI(allies, index + 1));
      return;
    }

    // Find best target based on personality
    const target = this.selectAITarget(unit, enemies);
    if (!target) {
      console.log('[AI] No valid target found');
      unit.acted = true;
      this.time.delayedCall(this.aiSpeed, () => this.runSingleAI(allies, index + 1));
      return;
    }

    const weapon = WEAPONS[unit.weapon];
    const dist = Math.sqrt(
      Math.pow(target.position.x - unit.position.x, 2) +
      Math.pow(target.position.y - unit.position.y, 2)
    );

    const hasLOS = this.hasLineOfSight(unit.position.x, unit.position.y, target.position.x, target.position.y);
    console.log(`[AI] Target: ${target.name} at dist=${dist.toFixed(1)}, LOS=${hasLOS}, weaponRange=${weapon.range}, weaponAP=${weapon.ap}`);

    // AI Decision: Attack or Move
    if (dist <= weapon.range && hasLOS && unit.ap >= weapon.ap) {
      // Attack!
      console.log(`[AI] ${unit.name} ATTACKING ${target.name}`);
      EventBridge.emit('log-entry', {
        id: `ai_action_${Date.now()}`,
        timestamp: Date.now(),
        type: 'system',
        actor: 'AI',
        actorTeam: unit.team,
        message: `🎯 ${unit.name} attacking ${target.name}`,
      });

      this.tryAttackUnit(unit.id, target.id, () => {
        // Try to attack again if AP remains
        if (unit.ap >= weapon.ap && unit.hp > 0) {
          this.time.delayedCall(this.aiSpeed, () => {
            // Check if target still alive
            const stillAlive = this.units.get(target.id);
            if (stillAlive && stillAlive.hp > 0) {
              this.tryAttackUnit(unit.id, target.id, () => {
                unit.acted = true;
                this.time.delayedCall(this.aiSpeed, () => this.runSingleAI(allies, index + 1));
              });
            } else {
              unit.acted = true;
              this.time.delayedCall(this.aiSpeed, () => this.runSingleAI(allies, index + 1));
            }
          });
        } else {
          unit.acted = true;
          this.time.delayedCall(this.aiSpeed, () => this.runSingleAI(allies, index + 1));
        }
      });
    } else {
      // Move towards target
      console.log(`[AI] ${unit.name} needs to MOVE (not in range/no LOS)`);
      const moveTarget = this.findMoveTowardsTarget(unit, target);
      if (moveTarget) {
        const moveDist = Math.abs(moveTarget.x - unit.position.x) + Math.abs(moveTarget.y - unit.position.y);
        console.log(`[AI] ${unit.name} moving to (${moveTarget.x},${moveTarget.y}), distance=${moveDist}`);

        EventBridge.emit('log-entry', {
          id: `ai_move_${Date.now()}`,
          timestamp: Date.now(),
          type: 'system',
          actor: 'AI',
          actorTeam: unit.team,
          message: `🏃 ${unit.name} moving towards ${target.name}`,
        });

        this.moveUnitAnimated(unit, moveTarget.x, moveTarget.y, moveDist, () => {
          // After moving, try to attack if in range
          const newDist = Math.sqrt(
            Math.pow(target.position.x - unit.position.x, 2) +
            Math.pow(target.position.y - unit.position.y, 2)
          );
          const newLOS = this.hasLineOfSight(unit.position.x, unit.position.y, target.position.x, target.position.y);

          if (newDist <= weapon.range && newLOS && unit.ap >= weapon.ap) {
            this.time.delayedCall(300, () => {
              this.tryAttackUnit(unit.id, target.id, () => {
                unit.acted = true;
                this.time.delayedCall(this.aiSpeed, () => this.runSingleAI(allies, index + 1));
              });
            });
          } else {
            unit.acted = true;
            this.time.delayedCall(this.aiSpeed, () => this.runSingleAI(allies, index + 1));
          }
        });
      } else {
        console.log(`[AI] ${unit.name} NO VALID MOVE FOUND - ending turn`);
        unit.acted = true;
        this.time.delayedCall(this.aiSpeed, () => this.runSingleAI(allies, index + 1));
      }
    }
  }

  private selectAITarget(unit: Unit, enemies: Unit[]): Unit | null {
    if (enemies.length === 0) return null;

    const personality = PERSONALITIES[unit.personality];

    // Score enemies based on personality
    const scored = enemies.map(enemy => {
      let score = 100;
      const dist = Math.sqrt(
        Math.pow(enemy.position.x - unit.position.x, 2) +
        Math.pow(enemy.position.y - unit.position.y, 2)
      );

      // Distance penalty
      score -= dist * 5;

      // Health-based scoring
      const healthPercent = enemy.hp / enemy.maxHp;

      switch (personality.aiStyle) {
        case 'rush':
          // Prefer closest enemy
          score += (10 - dist) * 10;
          break;
        case 'defensive':
          // Prefer wounded enemies
          score += (1 - healthPercent) * 50;
          break;
        case 'ranged':
          // Prefer wounded from distance
          score += (1 - healthPercent) * 30;
          if (dist > 3) score += 20;
          break;
        case 'balanced':
          // Balanced approach
          score += (1 - healthPercent) * 20;
          break;
      }

      return { enemy, score };
    });

    // Sort by score and pick best
    scored.sort((a, b) => b.score - a.score);
    return scored[0]?.enemy || null;
  }

  private findMoveTowardsTarget(unit: Unit, target: Unit): Position | null {
    const weapon = WEAPONS[unit.weapon];
    const idealRange = Math.max(1, weapon.range - 1);

    // Calculate current distance to target
    const currentDist = Math.sqrt(
      Math.pow(target.position.x - unit.position.x, 2) +
      Math.pow(target.position.y - unit.position.y, 2)
    );

    // Determine max move distance:
    // If we can get in range to attack, reserve AP for attack
    // If we're too far, use all AP for movement
    const canReachAttackRange = currentDist <= unit.ap + weapon.range;
    const maxMoveDist = canReachAttackRange ? Math.max(1, unit.ap - weapon.ap) : unit.ap;

    console.log(`[AI] ${unit.name} finding move: currentDist=${currentDist.toFixed(1)}, maxMove=${maxMoveDist}, AP=${unit.ap}, weaponAP=${weapon.ap}, weaponRange=${weapon.range}`);

    let bestPos: Position | null = null;
    let bestScore = -Infinity;

    // Search for best move position
    for (let y = 0; y < this.mapHeight; y++) {
      for (let x = 0; x < this.mapWidth; x++) {
        const tile = this.tiles[y][x];
        const moveCost = this.calculateMoveCost(unit.position.x, unit.position.y, x, y);

        // Must be within AP and walkable
        if (moveCost === 0 || moveCost > maxMoveDist) continue;
        if (!TERRAIN_TYPES[tile.terrain].walkable) continue;
        if (tile.occupant) continue;

        // Calculate score
        const distToTarget = Math.sqrt(
          Math.pow(x - target.position.x, 2) +
          Math.pow(y - target.position.y, 2)
        );

        // Prefer positions at ideal weapon range (or closer if out of range)
        const rangeDiff = Math.abs(distToTarget - idealRange);
        let score = 100 - rangeDiff * 10;

        // Big bonus for getting into attack range
        if (distToTarget <= weapon.range) {
          score += 100;
        }

        // Bonus for LOS to target
        if (this.hasLineOfSight(x, y, target.position.x, target.position.y)) {
          score += 50;
        }

        // Bonus for cover
        if (tile.terrain === 'LOW_WALL') {
          score += 20;
        }

        // Prefer cheaper moves if scores are equal (efficiency)
        score -= moveCost * 0.5;

        if (score > bestScore) {
          bestScore = score;
          bestPos = { x, y };
        }
      }
    }

    console.log(`[AI] ${unit.name} best move: ${bestPos ? `(${bestPos.x},${bestPos.y}) score=${bestScore.toFixed(1)}` : 'NONE FOUND'}`);
    return bestPos;
  }

  // ==================== DATA EMISSION ====================

  private emitAllUnitsData(): void {
    const unitsData = Array.from(this.units.values()).map(unit => ({
      id: unit.id,
      name: unit.name,
      codename: unit.codename,
      team: unit.team,
      hp: unit.hp,
      maxHp: unit.maxHp,
      ap: unit.ap,
      maxAp: unit.maxAp,
      position: unit.position,
      weapon: unit.weapon,
      weaponEmoji: WEAPONS[unit.weapon].emoji,
      personality: unit.personality,
      acted: unit.acted,
      statusEffects: unit.statusEffects,
      visible: unit.visible, // For fog of war
    }));

    EventBridge.emit('all-units-updated', unitsData);
  }
}

export default CombatScene;
