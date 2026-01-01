/**
 * Enemy Generation System
 *
 * Generates enemy units based on location context.
 * The simulation drives the experience.
 *
 * PHILOSOPHY:
 * - Country militaryServices → enemy skill levels
 * - Country militaryBudget → enemy equipment tier
 * - Country corruption → equipment variance
 * - City type → enemy faction
 *
 * Fighting in Nigeria should feel DIFFERENT from fighting in Switzerland.
 */

import { Country } from '../data/countries';
import { City } from '../data/cities';
import { ALL_WEAPONS, getWeaponsByBudget, getWeaponsByCostLevel } from '../data/weapons';
import { getArmorDRValues } from '../data/armor';
import { CombatCharacter } from '../game/EventBridge';
import {
  FactionId,
  FactionProfile,
  FACTION_PROFILES,
  determineFaction,
  tierToCostLevel,
} from './enemyFactions';

// ============================================================================
// TYPES
// ============================================================================

export interface LocationContext {
  country: Country;
  city: City;
  missionType: 'investigation' | 'assault' | 'defense' | 'rescue' | 'sabotage' | 'extraction';
}

export interface GeneratedEnemy {
  id: string;
  name: string;
  faction: FactionId;
  role: 'leader' | 'heavy' | 'standard' | 'specialist';
  skillLevel: number;           // 30-95 based on country stats
  stats: {
    AGI: number;
    STR: number;
    INT: number;
    WIL: number;
    PER: number;
    CON: number;
    MEL: number;
    RNG: number;
    SPD: number;
  };
  equipment: string[];          // Weapon IDs
  armor: string | null;         // Armor ID or null
  health: number;
  shield?: number;
  maxShield?: number;
}

export interface EnemySquad {
  enemies: GeneratedEnemy[];
  faction: FactionId;
  factionProfile: FactionProfile;
  locationContext: LocationContext;
}

// ============================================================================
// SKILL CALCULATION
// ============================================================================

/**
 * Calculate base skill from country military stats.
 * militaryServices 0-100 → baseSkill 30-95
 */
function calculateBaseSkill(country: Country): number {
  return Math.round(30 + (country.militaryServices * 0.65));
}

/**
 * Calculate equipment tier from military budget.
 * militaryBudget 0-100 → tier 1-6
 */
function calculateEquipmentTier(country: Country): number {
  return Math.min(6, Math.max(1, Math.ceil(country.militaryBudget / 17)));
}

/**
 * Apply corruption variance to equipment.
 * High corruption = inconsistent gear (some units get worse equipment)
 */
function applyCorruptionVariance(baseTier: number, corruption: number): number {
  const variance = corruption / 100; // 0-1
  const roll = Math.random();

  if (roll < variance * 0.5) {
    // Corruption siphoned the budget - worse gear
    return Math.max(1, baseTier - 2);
  } else if (roll < variance) {
    // Slightly worse
    return Math.max(1, baseTier - 1);
  }
  // No variance
  return baseTier;
}

/**
 * Calculate stat spread based on skill level and role.
 */
function calculateStats(
  baseSkill: number,
  role: 'leader' | 'heavy' | 'standard' | 'specialist',
  factionProfile: FactionProfile
): GeneratedEnemy['stats'] {
  // Role modifiers
  const roleModifiers = {
    leader: { AGI: 10, INT: 15, WIL: 10, PER: 10, MEL: 5, RNG: 10 },
    heavy: { STR: 15, CON: 10, RNG: 5, SPD: -10 },
    standard: {},
    specialist: { AGI: 5, INT: 10, PER: 15, RNG: 15 },
  };

  // Tactics level modifiers
  const tacticsModifiers: Record<string, number> = {
    untrained: -15,
    street: -5,
    trained: 0,
    professional: 10,
    elite: 20,
  };

  const tacticsMod = tacticsModifiers[factionProfile.tacticsLevel] || 0;
  const roleMod = roleModifiers[role] || {};

  // Calculate each stat with variance
  const variance = () => Math.floor(Math.random() * 10) - 5; // -5 to +5

  return {
    AGI: clamp(baseSkill + tacticsMod + (roleMod.AGI || 0) + variance(), 20, 95),
    STR: clamp(baseSkill + tacticsMod + (roleMod.STR || 0) + variance(), 20, 95),
    INT: clamp(baseSkill + tacticsMod + (roleMod.INT || 0) + variance(), 20, 95),
    WIL: clamp(baseSkill + tacticsMod + (roleMod.WIL || 0) + variance(), 20, 95),
    PER: clamp(baseSkill + tacticsMod + (roleMod.PER || 0) + variance(), 20, 95),
    CON: clamp(baseSkill + tacticsMod + (roleMod.CON || 0) + variance(), 20, 95),
    MEL: clamp(baseSkill + tacticsMod + (roleMod.MEL || 0) + variance(), 20, 95),
    RNG: clamp(baseSkill + tacticsMod + (roleMod.RNG || 0) + variance(), 20, 95),
    SPD: clamp(baseSkill + tacticsMod + (roleMod.SPD || 0) + variance(), 20, 95),
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

// ============================================================================
// WEAPON SELECTION
// ============================================================================

/**
 * Select a weapon from the pool based on tier.
 */
function selectWeapon(
  weaponPool: string[],
  tier: number,
  corruption: number
): string {
  // Apply corruption variance
  const effectiveTier = applyCorruptionVariance(tier, corruption);
  const costLevel = tierToCostLevel(effectiveTier);

  // Try to find a weapon from the pool at the right tier
  const availableWeapons = getWeaponsByCostLevel(costLevel);

  for (const poolWeapon of weaponPool) {
    const match = availableWeapons.find(
      (w) => w.name.replace(/\s+/g, '_') === poolWeapon || w.id === poolWeapon
    );
    if (match) {
      return match.id;
    }
  }

  // Fallback: find any weapon from the pool
  for (const poolWeapon of weaponPool) {
    const match = ALL_WEAPONS.find(
      (w) => w.name.replace(/\s+/g, '_') === poolWeapon || w.id === poolWeapon
    );
    if (match) {
      return match.id;
    }
  }

  // Ultimate fallback
  return 'pistol';
}

// ============================================================================
// NAME GENERATION
// ============================================================================

/**
 * Generate a name for an enemy unit.
 */
function generateName(
  profile: FactionProfile,
  role: 'leader' | 'heavy' | 'standard' | 'specialist',
  index: number
): string {
  const namePool = role === 'leader' ? profile.names.leader : profile.names.standard;
  const baseName = namePool[Math.floor(Math.random() * namePool.length)];

  // Add number for non-leaders
  if (role !== 'leader') {
    return `${baseName} ${index + 1}`;
  }

  return baseName;
}

// ============================================================================
// HEALTH CALCULATION
// ============================================================================

/**
 * Calculate health based on stats and role.
 */
function calculateHealth(
  stats: GeneratedEnemy['stats'],
  role: 'leader' | 'heavy' | 'standard' | 'specialist'
): number {
  const baseHealth = 60;
  const conBonus = (stats.CON - 50) * 0.5; // +/- 25 based on CON

  const roleMultiplier = {
    leader: 1.2,
    heavy: 1.4,
    standard: 1.0,
    specialist: 0.9,
  };

  return Math.round((baseHealth + conBonus) * roleMultiplier[role]);
}

// ============================================================================
// SQUAD GENERATION
// ============================================================================

/**
 * Determine squad composition based on squad size.
 */
function getSquadRoles(count: number): Array<'leader' | 'heavy' | 'standard' | 'specialist'> {
  if (count <= 2) {
    return count === 1 ? ['standard'] : ['leader', 'standard'];
  }

  if (count === 3) {
    return ['leader', 'standard', 'standard'];
  }

  if (count === 4) {
    return ['leader', 'heavy', 'standard', 'standard'];
  }

  if (count === 5) {
    return ['leader', 'heavy', 'standard', 'standard', 'specialist'];
  }

  // 6+ enemies
  const roles: Array<'leader' | 'heavy' | 'standard' | 'specialist'> = ['leader', 'heavy', 'specialist'];
  for (let i = 3; i < count; i++) {
    roles.push('standard');
  }
  return roles;
}

/**
 * Generate a single enemy unit.
 */
function generateEnemy(
  index: number,
  role: 'leader' | 'heavy' | 'standard' | 'specialist',
  faction: FactionId,
  profile: FactionProfile,
  baseSkill: number,
  equipmentTier: number,
  corruption: number
): GeneratedEnemy {
  // Calculate stats
  const stats = calculateStats(baseSkill, role, profile);

  // Select weapon based on role
  let weaponPool: string[];
  switch (role) {
    case 'leader':
      weaponPool = profile.weaponPools.leader;
      break;
    case 'heavy':
      weaponPool = profile.weaponPools.heavy;
      break;
    case 'specialist':
      weaponPool = profile.weaponPools.specialist || profile.weaponPools.standard;
      break;
    default:
      weaponPool = profile.weaponPools.standard;
  }

  const primaryWeapon = selectWeapon(weaponPool, equipmentTier, corruption);

  // Calculate health
  const health = calculateHealth(stats, role);

  return {
    id: `enemy_${faction}_${index}`,
    name: generateName(profile, role, index),
    faction,
    role,
    skillLevel: baseSkill,
    stats,
    equipment: [primaryWeapon],
    armor: null, // TODO: Wire armor system
    health,
  };
}

/**
 * Main function: Generate an enemy squad from location context.
 */
export function generateEnemySquad(
  context: LocationContext,
  count: number = 4
): EnemySquad {
  const { country, city } = context;

  // Parse terrorism activity (it's a string in the data)
  const terrorismActivity = parseInt(String(country.terrorismActivity), 10) || 0;

  // Determine faction
  const faction = determineFaction(
    city.cityType1,
    country.governmentCorruption,
    country.lawEnforcement,
    terrorismActivity
  );

  const profile = FACTION_PROFILES[faction];

  // Calculate base values from country stats
  const baseSkill = calculateBaseSkill(country);
  const equipmentTier = calculateEquipmentTier(country);

  // Get squad composition
  const roles = getSquadRoles(count);

  // Generate enemies
  const enemies = roles.map((role, index) =>
    generateEnemy(
      index,
      role,
      faction,
      profile,
      baseSkill,
      equipmentTier,
      country.governmentCorruption
    )
  );

  return {
    enemies,
    faction,
    factionProfile: profile,
    locationContext: context,
  };
}

// ============================================================================
// CONVERSION TO COMBAT FORMAT
// ============================================================================

/**
 * Convert generated enemies to CombatCharacter format for EventBridge.
 * Includes armor DR values from the armor database.
 */
export function convertToCombatCharacters(squad: EnemySquad): CombatCharacter[] {
  return squad.enemies.map((enemy) => {
    // Get DR values from equipped armor
    const armorDR = getArmorDRValues(enemy.armor || undefined);

    return {
      id: enemy.id,
      name: enemy.name,
      team: 'red' as const,
      stats: {
        MEL: enemy.stats.MEL,
        AGL: enemy.stats.AGI,
        STR: enemy.stats.STR,
        STA: enemy.stats.CON,
        INT: enemy.stats.INT,
        INS: enemy.stats.PER,
        CON: enemy.stats.WIL,
      },
      health: { current: enemy.health, maximum: enemy.health },
      powers: [],
      equipment: enemy.equipment,
      threatLevel: enemy.role === 'leader' ? 'high' : 'normal',
      // Armor DR from database (PD-002)
      dr: armorDR.drPhysical,
      stoppingPower: armorDR.stoppingPower,
      equippedArmor: armorDR.armorName || undefined,
      // Include shield if enemy has it
      shield: enemy.shield || 0,
      maxShield: enemy.maxShield || 0,
    };
  });
}

// ============================================================================
// DEBUG / TESTING
// ============================================================================

/**
 * Generate a debug report showing how location affects enemy generation.
 */
export function debugGenerateReport(context: LocationContext): string {
  const squad = generateEnemySquad(context, 4);
  const { country, city } = context;

  const lines: string[] = [
    `\n=== ENEMY GENERATION REPORT ===`,
    `Location: ${city.name}, ${country.name}`,
    `City Type: ${city.cityType1}`,
    ``,
    `Country Stats:`,
    `  Military Services: ${country.militaryServices}`,
    `  Military Budget: ${country.militaryBudget}`,
    `  Corruption: ${country.governmentCorruption}`,
    `  Law Enforcement: ${country.lawEnforcement}`,
    `  Terrorism: ${country.terrorismActivity}`,
    ``,
    `Generated Squad:`,
    `  Faction: ${squad.faction} (${squad.factionProfile.name})`,
    `  Tactics Level: ${squad.factionProfile.tacticsLevel}`,
    ``,
    `Enemies:`,
  ];

  for (const enemy of squad.enemies) {
    lines.push(`  [${enemy.role.toUpperCase()}] ${enemy.name}`);
    lines.push(`    Skill: ${enemy.skillLevel}`);
    lines.push(`    Stats: AGI=${enemy.stats.AGI} RNG=${enemy.stats.RNG} STR=${enemy.stats.STR}`);
    lines.push(`    Weapon: ${enemy.equipment[0]}`);
    lines.push(`    Health: ${enemy.health}`);
  }

  return lines.join('\n');
}
