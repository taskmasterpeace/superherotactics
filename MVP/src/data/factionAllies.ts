/**
 * Faction Allies System (FM-007)
 *
 * When player reputation is high with a faction,
 * they offer help: intel, equipment, safe houses, backup.
 */

import {
  FactionType,
  FactionStanding,
  getEquipmentTier,
  hasSafeHouseAccess,
  FACTION_NAMES,
  FACTION_ICONS,
  EquipmentTier,
} from './factionSystem';

// =============================================================================
// ALLY BENEFIT TYPES
// =============================================================================

export type AllyBenefitType =
  | 'intel'           // Information about missions, enemies
  | 'equipment'       // Weapons, armor, gadgets
  | 'safe_house'      // Hiding spot in a city
  | 'backup'          // Combat reinforcements
  | 'medical'         // Healing, surgery
  | 'transport'       // Vehicle, travel assistance
  | 'legal'           // Clear bounties, records
  | 'training';       // Skill improvement

export interface AllyBenefit {
  id: string;
  type: AllyBenefitType;
  factionType: FactionType;
  name: string;
  description: string;
  requiredStanding: number;
  cooldownHours: number;
  cost?: number;         // Some benefits cost money
  oneTime?: boolean;     // Can only be used once
}

export interface AvailableBenefit extends AllyBenefit {
  available: boolean;
  reasonUnavailable?: string;
  nextAvailable?: number; // Timestamp when available again
}

// =============================================================================
// FACTION BENEFITS CATALOG
// =============================================================================

export const FACTION_BENEFITS: Record<FactionType, AllyBenefit[]> = {
  police: [
    {
      id: 'police_intel_basic',
      type: 'intel',
      factionType: 'police',
      name: 'Crime Reports',
      description: 'Access to local crime statistics and gang activity reports.',
      requiredStanding: 25,
      cooldownHours: 24,
    },
    {
      id: 'police_intel_advanced',
      type: 'intel',
      factionType: 'police',
      name: 'Active Investigations',
      description: 'Inside information on ongoing police operations.',
      requiredStanding: 50,
      cooldownHours: 48,
    },
    {
      id: 'police_backup',
      type: 'backup',
      factionType: 'police',
      name: 'Police Backup',
      description: '2-4 officers will assist in combat if called.',
      requiredStanding: 60,
      cooldownHours: 168, // 1 week
    },
    {
      id: 'police_legal',
      type: 'legal',
      factionType: 'police',
      name: 'Minor Charges Dropped',
      description: 'Clear minor criminal charges in this jurisdiction.',
      requiredStanding: 75,
      cooldownHours: 720, // 30 days
      cost: 5000,
    },
  ],

  military: [
    {
      id: 'military_equipment_basic',
      type: 'equipment',
      factionType: 'military',
      name: 'Surplus Weapons',
      description: 'Access to military surplus at discount prices.',
      requiredStanding: 25,
      cooldownHours: 0, // Always available
    },
    {
      id: 'military_equipment_advanced',
      type: 'equipment',
      factionType: 'military',
      name: 'Military Arsenal',
      description: 'Access to current military weapons and armor.',
      requiredStanding: 50,
      cooldownHours: 0,
    },
    {
      id: 'military_transport',
      type: 'transport',
      factionType: 'military',
      name: 'Military Transport',
      description: 'Fast military transport to any location in country.',
      requiredStanding: 60,
      cooldownHours: 72,
    },
    {
      id: 'military_backup',
      type: 'backup',
      factionType: 'military',
      name: 'Strike Team',
      description: '4-8 soldiers will assist in major combat.',
      requiredStanding: 75,
      cooldownHours: 336, // 2 weeks
    },
  ],

  government: [
    {
      id: 'gov_intel_basic',
      type: 'intel',
      factionType: 'government',
      name: 'Public Records',
      description: 'Access to government databases and records.',
      requiredStanding: 25,
      cooldownHours: 12,
    },
    {
      id: 'gov_safe_house',
      type: 'safe_house',
      factionType: 'government',
      name: 'Government Safe House',
      description: 'Secure location protected by diplomatic immunity.',
      requiredStanding: 50,
      cooldownHours: 168,
    },
    {
      id: 'gov_legal',
      type: 'legal',
      factionType: 'government',
      name: 'Official Pardon',
      description: 'Clear all criminal charges in this country.',
      requiredStanding: 75,
      cooldownHours: 2160, // 90 days
      oneTime: true,
    },
    {
      id: 'gov_intel_classified',
      type: 'intel',
      factionType: 'government',
      name: 'Classified Briefing',
      description: 'Top secret intelligence on superhuman threats.',
      requiredStanding: 90,
      cooldownHours: 168,
    },
  ],

  media: [
    {
      id: 'media_intel_basic',
      type: 'intel',
      factionType: 'media',
      name: 'News Tip',
      description: 'Early warning about developing stories.',
      requiredStanding: 25,
      cooldownHours: 24,
    },
    {
      id: 'media_legal',
      type: 'legal',
      factionType: 'media',
      name: 'Positive Coverage',
      description: 'Media spins your actions in a positive light.',
      requiredStanding: 50,
      cooldownHours: 72,
    },
    {
      id: 'media_intel_advanced',
      type: 'intel',
      factionType: 'media',
      name: 'Deep Background',
      description: 'Investigative journalist shares their research.',
      requiredStanding: 60,
      cooldownHours: 48,
    },
    {
      id: 'media_fame_boost',
      type: 'legal',
      factionType: 'media',
      name: 'Media Blitz',
      description: 'Massive positive coverage boosts your fame.',
      requiredStanding: 75,
      cooldownHours: 720,
    },
  ],

  corporations: [
    {
      id: 'corp_equipment_basic',
      type: 'equipment',
      factionType: 'corporations',
      name: 'Corporate Supplies',
      description: 'Access to high-end civilian equipment.',
      requiredStanding: 25,
      cooldownHours: 0,
    },
    {
      id: 'corp_medical',
      type: 'medical',
      factionType: 'corporations',
      name: 'Corporate Medical',
      description: 'Private medical care, no questions asked.',
      requiredStanding: 40,
      cooldownHours: 24,
    },
    {
      id: 'corp_transport',
      type: 'transport',
      factionType: 'corporations',
      name: 'Private Charter',
      description: 'Corporate jet to any destination.',
      requiredStanding: 60,
      cooldownHours: 168,
      cost: 10000,
    },
    {
      id: 'corp_backup',
      type: 'backup',
      factionType: 'corporations',
      name: 'PMC Support',
      description: 'Professional mercenary squad assists in combat.',
      requiredStanding: 75,
      cooldownHours: 336,
      cost: 25000,
    },
  ],

  underworld: [
    {
      id: 'uw_intel_basic',
      type: 'intel',
      factionType: 'underworld',
      name: 'Street Intel',
      description: 'Word on the street about criminal activities.',
      requiredStanding: 20,
      cooldownHours: 12,
    },
    {
      id: 'uw_safe_house',
      type: 'safe_house',
      factionType: 'underworld',
      name: 'Criminal Hideout',
      description: 'No-questions-asked safehouse in the underworld.',
      requiredStanding: 35,
      cooldownHours: 48,
    },
    {
      id: 'uw_equipment',
      type: 'equipment',
      factionType: 'underworld',
      name: 'Black Market Access',
      description: 'Illegal weapons, no background check.',
      requiredStanding: 40,
      cooldownHours: 0,
    },
    {
      id: 'uw_backup',
      type: 'backup',
      factionType: 'underworld',
      name: 'Gang Backup',
      description: 'Local gang members join your fight.',
      requiredStanding: 50,
      cooldownHours: 72,
    },
    {
      id: 'uw_training',
      type: 'training',
      factionType: 'underworld',
      name: 'Street Fighting',
      description: 'Train with experienced criminals.',
      requiredStanding: 60,
      cooldownHours: 168,
    },
  ],
};

// =============================================================================
// BENEFIT AVAILABILITY
// =============================================================================

export interface BenefitCooldownState {
  benefitId: string;
  lastUsed: number;
  usedCount: number;
}

/**
 * Check if a benefit is available
 */
export function getBenefitAvailability(
  benefit: AllyBenefit,
  standing: number,
  cooldownState?: BenefitCooldownState,
  currentTimestamp: number = 0
): AvailableBenefit {
  const result: AvailableBenefit = {
    ...benefit,
    available: true,
  };

  // Check standing requirement
  if (standing < benefit.requiredStanding) {
    result.available = false;
    result.reasonUnavailable = `Requires ${benefit.requiredStanding}+ standing (you have ${standing})`;
    return result;
  }

  // Check one-time use
  if (benefit.oneTime && cooldownState && cooldownState.usedCount > 0) {
    result.available = false;
    result.reasonUnavailable = 'Already used (one-time benefit)';
    return result;
  }

  // Check cooldown
  if (cooldownState && benefit.cooldownHours > 0) {
    const cooldownEnd = cooldownState.lastUsed + benefit.cooldownHours;
    if (currentTimestamp < cooldownEnd) {
      result.available = false;
      result.nextAvailable = cooldownEnd;
      const hoursLeft = Math.ceil(cooldownEnd - currentTimestamp);
      result.reasonUnavailable = `On cooldown (${hoursLeft}h remaining)`;
      return result;
    }
  }

  return result;
}

/**
 * Get all available benefits for a faction
 */
export function getAvailableBenefits(
  factionType: FactionType,
  standing: number,
  cooldowns: Map<string, BenefitCooldownState>,
  currentTimestamp: number
): AvailableBenefit[] {
  const benefits = FACTION_BENEFITS[factionType];
  return benefits.map(benefit => {
    const cooldownState = cooldowns.get(benefit.id);
    return getBenefitAvailability(benefit, standing, cooldownState, currentTimestamp);
  });
}

// =============================================================================
// BACKUP SQUAD GENERATION
// =============================================================================

export interface BackupSquadMember {
  id: string;
  name: string;
  factionType: FactionType;
  threatLevel: number;
  weaponClass: string;
  hp: number;
}

const BACKUP_CONFIGS: Record<FactionType, {
  minSize: number;
  maxSize: number;
  threatRange: [number, number];
  weaponClasses: string[];
  hpRange: [number, number];
}> = {
  police: {
    minSize: 2, maxSize: 4,
    threatRange: [2, 4],
    weaponClasses: ['pistol', 'smg', 'shotgun'],
    hpRange: [40, 60],
  },
  military: {
    minSize: 4, maxSize: 8,
    threatRange: [4, 6],
    weaponClasses: ['assault_rifle', 'lmg', 'sniper_rifle'],
    hpRange: [60, 80],
  },
  government: {
    minSize: 2, maxSize: 4,
    threatRange: [4, 6],
    weaponClasses: ['pistol', 'smg'],
    hpRange: [50, 70],
  },
  corporations: {
    minSize: 4, maxSize: 6,
    threatRange: [5, 7],
    weaponClasses: ['assault_rifle', 'smg', 'sniper_rifle'],
    hpRange: [70, 90],
  },
  underworld: {
    minSize: 3, maxSize: 6,
    threatRange: [2, 5],
    weaponClasses: ['pistol', 'shotgun', 'melee'],
    hpRange: [35, 55],
  },
  media: {
    minSize: 0, maxSize: 0,
    threatRange: [0, 0],
    weaponClasses: [],
    hpRange: [0, 0],
  },
};

/**
 * Generate backup squad for combat
 */
export function generateBackupSquad(
  factionType: FactionType,
  standing: number
): BackupSquadMember[] {
  const config = BACKUP_CONFIGS[factionType];
  if (!config || config.maxSize === 0) return [];

  // Higher standing = more backup
  const standingBonus = Math.floor((standing - 50) / 25);
  const size = Math.max(
    config.minSize,
    Math.min(config.maxSize, config.minSize + Math.floor(Math.random() * 3) + standingBonus)
  );

  const squad: BackupSquadMember[] = [];

  for (let i = 0; i < size; i++) {
    const [minThreat, maxThreat] = config.threatRange;
    const threatLevel = minThreat + Math.floor(Math.random() * (maxThreat - minThreat + 1));

    const [minHp, maxHp] = config.hpRange;
    const hp = minHp + Math.floor(Math.random() * (maxHp - minHp + 1));

    const weaponClass = config.weaponClasses[
      Math.floor(Math.random() * config.weaponClasses.length)
    ];

    squad.push({
      id: `backup_${factionType}_${i}_${Date.now()}`,
      name: generateBackupName(factionType, i),
      factionType,
      threatLevel,
      weaponClass,
      hp,
    });
  }

  return squad;
}

function generateBackupName(faction: FactionType, index: number): string {
  const prefixes: Record<FactionType, string> = {
    police: 'Officer',
    military: 'Soldier',
    government: 'Agent',
    corporations: 'Operator',
    underworld: 'Thug',
    media: '',
  };
  return `${prefixes[faction]} ${String.fromCharCode(65 + index)}`; // A, B, C, etc.
}

// =============================================================================
// ALLY MANAGER
// =============================================================================

let allyManagerInstance: AllyManager | null = null;

export class AllyManager {
  private cooldowns: Map<string, BenefitCooldownState> = new Map();
  private usedOneTimeBenefits: Set<string> = new Set();

  /**
   * Get all benefits for a faction with availability status
   */
  getBenefitsForFaction(
    factionType: FactionType,
    standing: number,
    currentTimestamp: number
  ): AvailableBenefit[] {
    return getAvailableBenefits(factionType, standing, this.cooldowns, currentTimestamp);
  }

  /**
   * Use a benefit
   */
  useBenefit(benefitId: string, timestamp: number): boolean {
    const cooldownState: BenefitCooldownState = {
      benefitId,
      lastUsed: timestamp,
      usedCount: (this.cooldowns.get(benefitId)?.usedCount ?? 0) + 1,
    };
    this.cooldowns.set(benefitId, cooldownState);
    return true;
  }

  /**
   * Get summary of ally status
   */
  getAllySummary(
    standings: FactionStanding[],
    currentTimestamp: number
  ): Array<{
    factionType: FactionType;
    standing: number;
    availableBenefitsCount: number;
    bestBenefit?: string;
  }> {
    const factions: FactionType[] = ['police', 'military', 'government', 'media', 'corporations', 'underworld'];

    return factions.map(factionType => {
      const standing = standings.find(s => s.factionType === factionType)?.standing ?? 0;
      const benefits = this.getBenefitsForFaction(factionType, standing, currentTimestamp);
      const available = benefits.filter(b => b.available);

      return {
        factionType,
        standing,
        availableBenefitsCount: available.length,
        bestBenefit: available.sort((a, b) => b.requiredStanding - a.requiredStanding)[0]?.name,
      };
    });
  }
}

export function getAllyManager(): AllyManager {
  if (!allyManagerInstance) {
    allyManagerInstance = new AllyManager();
  }
  return allyManagerInstance;
}

// =============================================================================
// DISPLAY HELPERS
// =============================================================================

export function getBenefitTypeIcon(type: AllyBenefitType): string {
  const icons: Record<AllyBenefitType, string> = {
    intel: '🔍',
    equipment: '🔧',
    safe_house: '🏠',
    backup: '👥',
    medical: '💊',
    transport: '✈️',
    legal: '⚖️',
    training: '🎯',
  };
  return icons[type] ?? '❓';
}

export function getBenefitTypeLabel(type: AllyBenefitType): string {
  const labels: Record<AllyBenefitType, string> = {
    intel: 'Intelligence',
    equipment: 'Equipment',
    safe_house: 'Safe House',
    backup: 'Combat Backup',
    medical: 'Medical',
    transport: 'Transport',
    legal: 'Legal Aid',
    training: 'Training',
  };
  return labels[type] ?? type;
}

// =============================================================================
// EXPORTS
// =============================================================================

export default {
  FACTION_BENEFITS,
  getBenefitAvailability,
  getAvailableBenefits,
  generateBackupSquad,
  getAllyManager,
  getBenefitTypeIcon,
  getBenefitTypeLabel,
};
