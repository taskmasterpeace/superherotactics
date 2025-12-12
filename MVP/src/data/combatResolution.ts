/**
 * Simple Combat Resolution System
 *
 * Auto-resolves combat without tactical gameplay.
 * Returns: win/loss, injuries, casualties, loot.
 *
 * Used when:
 * - Player chooses auto-resolve
 * - AI vs AI combat
 * - Quick missions
 */

import { GameCharacter } from '../types';
import { MissionTemplate, GeneratedMission } from './missionSystem';
import { PersonalityTraits, getPersonalityTraits } from './personalitySystem';

// =============================================================================
// COMBAT RESULT TYPES
// =============================================================================

export type CombatOutcome = 'victory' | 'defeat' | 'retreat' | 'stalemate';

export interface CombatInjury {
  characterId: string;
  characterName: string;
  injuryType: 'minor' | 'moderate' | 'severe' | 'critical';
  bodyPart: string;
  recoveryDays: number;
  description: string;
}

export interface CombatCasualty {
  characterId: string;
  characterName: string;
  causeOfDeath: string;
  canBeCloned: boolean;
}

export interface CombatResult {
  outcome: CombatOutcome;
  injuries: CombatInjury[];
  casualties: CombatCasualty[];
  enemiesKilled: number;
  enemiesCaptured: number;
  loot: CombatLoot[];
  fameGained: number;
  moneyGained: number;
  durationMinutes: number;
  narrativeSummary: string;
}

export interface CombatLoot {
  itemName: string;
  quantity: number;
  value: number;
}

// =============================================================================
// BODY PARTS FOR INJURIES
// =============================================================================

const BODY_PARTS = [
  'head', 'torso', 'left arm', 'right arm', 'left leg', 'right leg',
  'left hand', 'right hand', 'left shoulder', 'right shoulder',
];

const INJURY_DESCRIPTIONS: Record<string, string[]> = {
  minor: [
    'Superficial cuts and bruises',
    'Minor sprain',
    'Light burns',
    'Flesh wound',
    'Concussion (mild)',
  ],
  moderate: [
    'Deep laceration requiring stitches',
    'Fractured bone',
    'Second-degree burns',
    'Bullet graze',
    'Dislocated joint',
  ],
  severe: [
    'Compound fracture',
    'Internal bleeding',
    'Third-degree burns',
    'Gunshot wound',
    'Crushed limb',
  ],
  critical: [
    'Massive trauma',
    'Severed limb',
    'Multiple organ damage',
    'Catastrophic blood loss',
    'Spinal injury',
  ],
};

// =============================================================================
// COMBAT POWER CALCULATION
// =============================================================================

interface CombatUnit {
  id: string;
  name: string;
  power: number;  // Combined effectiveness
  defense: number;
  morale: number;
  isPlayer: boolean;
}

/**
 * Calculate combat power for a character
 */
function calculateCombatPower(char: GameCharacter): number {
  const stats = char.stats;

  // Weighted stat contribution
  const combatStats =
    (stats.MEL * 1.2) +  // Melee skill
    (stats.AGL * 1.0) +  // Agility
    (stats.STR * 0.8) +  // Strength
    (stats.INS * 0.6) +  // Instinct/perception
    (stats.CON * 0.4);   // Constitution

  // Threat level multiplier
  const threatMultiplier = parseInt(char.threatLevel.replace('THREAT_', '')) || 1;

  // Equipment bonus (simplified)
  const equipmentBonus = char.equipment?.length ? char.equipment.length * 5 : 0;

  // Health penalty if injured
  const healthRatio = char.health.current / char.health.maximum;
  const healthMultiplier = 0.5 + (healthRatio * 0.5);

  return Math.round((combatStats / 4) * threatMultiplier * healthMultiplier) + equipmentBonus;
}

/**
 * Calculate defense rating
 */
function calculateDefense(char: GameCharacter): number {
  const stats = char.stats;

  const defenseStats =
    (stats.AGL * 1.0) +
    (stats.CON * 0.8) +
    (char.dr || 0) * 2 +
    (char.shield || 0);

  return Math.round(defenseStats / 3);
}

/**
 * Calculate morale
 */
function calculateMorale(char: GameCharacter): number {
  const baseStats = char.stats;
  const personality = getPersonalityTraits(char.personality?.mbti);

  // Base morale from stats
  let morale = (baseStats.CON + baseStats.STA) / 2;

  // Personality modifiers
  morale += (personality.discipline - 5) * 3;  // Discipline helps
  morale -= (personality.volatility - 5) * 2;  // Volatility hurts

  // Health modifier
  const healthRatio = char.health.current / char.health.maximum;
  morale *= healthRatio;

  return Math.max(10, Math.min(100, Math.round(morale)));
}

// =============================================================================
// ENEMY GENERATION
// =============================================================================

interface EnemyUnit {
  id: string;
  name: string;
  power: number;
  defense: number;
  threatLevel: number;
}

/**
 * Generate enemy units for a mission
 */
function generateEnemies(mission: GeneratedMission): EnemyUnit[] {
  const template = mission.template;
  const { min, max } = template.expectedEnemies;
  const count = min + Math.floor(Math.random() * (max - min + 1));

  const enemies: EnemyUnit[] = [];
  const avgThreat = template.recommendedThreatLevel;

  for (let i = 0; i < count; i++) {
    // Vary threat level slightly
    const threat = Math.max(1, avgThreat + Math.floor(Math.random() * 3) - 1);

    enemies.push({
      id: `enemy_${i}`,
      name: `Hostile ${i + 1}`,
      power: 20 + (threat * 10) + Math.floor(Math.random() * 20),
      defense: 10 + (threat * 5) + Math.floor(Math.random() * 10),
      threatLevel: threat,
    });
  }

  return enemies;
}

// =============================================================================
// COMBAT RESOLUTION
// =============================================================================

/**
 * Resolve combat automatically
 */
export function resolveCombat(
  squad: GameCharacter[],
  mission: GeneratedMission
): CombatResult {
  const enemies = generateEnemies(mission);

  // Calculate total power for each side
  const squadPower = squad.reduce((sum, c) => sum + calculateCombatPower(c), 0);
  const squadDefense = squad.reduce((sum, c) => sum + calculateDefense(c), 0);
  const squadMorale = squad.reduce((sum, c) => sum + calculateMorale(c), 0) / squad.length;

  const enemyPower = enemies.reduce((sum, e) => sum + e.power, 0);
  const enemyDefense = enemies.reduce((sum, e) => sum + e.defense, 0);

  // Danger modifier from mission
  const dangerMod = mission.dangerLevel / 10;

  // Calculate advantage
  const powerRatio = squadPower / Math.max(1, enemyPower);
  const defenseRatio = squadDefense / Math.max(1, enemyDefense);
  const overallAdvantage = (powerRatio * 0.6) + (defenseRatio * 0.4);

  // Determine outcome
  const roll = Math.random();
  let outcome: CombatOutcome;

  if (overallAdvantage >= 1.5) {
    // Strong advantage
    outcome = roll < 0.85 ? 'victory' : (roll < 0.95 ? 'stalemate' : 'defeat');
  } else if (overallAdvantage >= 1.0) {
    // Slight advantage
    outcome = roll < 0.65 ? 'victory' : (roll < 0.85 ? 'stalemate' : 'defeat');
  } else if (overallAdvantage >= 0.7) {
    // Slight disadvantage
    outcome = roll < 0.40 ? 'victory' : (roll < 0.70 ? 'stalemate' : 'defeat');
  } else {
    // Strong disadvantage
    outcome = roll < 0.20 ? 'victory' : (roll < 0.50 ? 'retreat' : 'defeat');
  }

  // Calculate injuries and casualties
  const injuries: CombatInjury[] = [];
  const casualties: CombatCasualty[] = [];

  squad.forEach(char => {
    const injuryChance = dangerMod * (outcome === 'defeat' ? 0.6 : outcome === 'stalemate' ? 0.4 : 0.2);
    const deathChance = dangerMod * (outcome === 'defeat' ? 0.15 : 0.03);

    // Check for death first
    if (Math.random() < deathChance) {
      casualties.push({
        characterId: char.id,
        characterName: char.name,
        causeOfDeath: generateDeathCause(),
        canBeCloned: char.origin <= 4,  // Origins 1-4 can be cloned
      });
      return;
    }

    // Check for injury
    if (Math.random() < injuryChance) {
      const severity = rollInjurySeverity(dangerMod, outcome);
      injuries.push(generateInjury(char, severity));
    }
  });

  // Calculate enemies killed
  const killRatio = outcome === 'victory' ? 0.8 : outcome === 'stalemate' ? 0.4 : 0.2;
  const enemiesKilled = Math.floor(enemies.length * killRatio * (0.8 + Math.random() * 0.4));

  // Calculate loot
  const loot = outcome === 'victory' ? generateLoot(mission) : [];

  // Calculate fame and money
  const fameGained = outcome === 'victory' ? mission.fameReward :
    outcome === 'stalemate' ? Math.floor(mission.fameReward * 0.3) : 0;
  const moneyGained = outcome === 'victory' ? mission.reward :
    outcome === 'stalemate' ? Math.floor(mission.reward * 0.2) : 0;

  // Generate narrative
  const narrativeSummary = generateNarrative(squad, enemies.length, outcome, injuries, casualties);

  return {
    outcome,
    injuries,
    casualties,
    enemiesKilled,
    enemiesCaptured: outcome === 'victory' ? Math.floor((enemies.length - enemiesKilled) * 0.5) : 0,
    loot,
    fameGained,
    moneyGained,
    durationMinutes: mission.template.estimatedDurationMinutes + Math.floor(Math.random() * 30) - 15,
    narrativeSummary,
  };
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function rollInjurySeverity(dangerMod: number, outcome: CombatOutcome): 'minor' | 'moderate' | 'severe' | 'critical' {
  const roll = Math.random() + (dangerMod * 0.3) + (outcome === 'defeat' ? 0.2 : 0);

  if (roll < 0.4) return 'minor';
  if (roll < 0.7) return 'moderate';
  if (roll < 0.9) return 'severe';
  return 'critical';
}

function generateInjury(char: GameCharacter, severity: 'minor' | 'moderate' | 'severe' | 'critical'): CombatInjury {
  const bodyPart = BODY_PARTS[Math.floor(Math.random() * BODY_PARTS.length)];
  const descriptions = INJURY_DESCRIPTIONS[severity];
  const description = descriptions[Math.floor(Math.random() * descriptions.length)];

  const recoveryDays = {
    minor: 1 + Math.floor(Math.random() * 3),
    moderate: 5 + Math.floor(Math.random() * 10),
    severe: 14 + Math.floor(Math.random() * 21),
    critical: 30 + Math.floor(Math.random() * 60),
  }[severity];

  return {
    characterId: char.id,
    characterName: char.name,
    injuryType: severity,
    bodyPart,
    recoveryDays,
    description: `${description} to ${bodyPart}`,
  };
}

function generateDeathCause(): string {
  const causes = [
    'Fatal gunshot wound',
    'Explosion',
    'Massive trauma',
    'Overwhelming enemy fire',
    'Building collapse',
    'Vehicle destruction',
  ];
  return causes[Math.floor(Math.random() * causes.length)];
}

function generateLoot(mission: GeneratedMission): CombatLoot[] {
  const loot: CombatLoot[] = [];

  // Cash
  const cashLoot = Math.floor(mission.reward * 0.1 * (0.5 + Math.random()));
  if (cashLoot > 0) {
    loot.push({ itemName: 'Cash', quantity: cashLoot, value: cashLoot });
  }

  // Random items based on mission type
  const items = [
    { name: 'Ammunition', baseValue: 50 },
    { name: 'Medical Supplies', baseValue: 100 },
    { name: 'Intel Documents', baseValue: 500 },
    { name: 'Weapon Parts', baseValue: 200 },
    { name: 'Body Armor (Salvaged)', baseValue: 300 },
  ];

  const itemCount = 1 + Math.floor(Math.random() * 3);
  for (let i = 0; i < itemCount; i++) {
    const item = items[Math.floor(Math.random() * items.length)];
    const qty = 1 + Math.floor(Math.random() * 3);
    loot.push({
      itemName: item.name,
      quantity: qty,
      value: item.baseValue * qty,
    });
  }

  return loot;
}

function generateNarrative(
  squad: GameCharacter[],
  enemyCount: number,
  outcome: CombatOutcome,
  injuries: CombatInjury[],
  casualties: CombatCasualty[]
): string {
  const squadNames = squad.slice(0, 3).map(c => c.name).join(', ');
  const andMore = squad.length > 3 ? ` and ${squad.length - 3} others` : '';

  const outcomeText = {
    victory: 'achieved their objective',
    defeat: 'were forced to withdraw',
    retreat: 'executed a tactical retreat',
    stalemate: 'fought to a standstill',
  }[outcome];

  let narrative = `${squadNames}${andMore} engaged ${enemyCount} hostiles and ${outcomeText}.`;

  if (casualties.length > 0) {
    narrative += ` Tragically, ${casualties.map(c => c.characterName).join(' and ')} did not survive.`;
  } else if (injuries.length > 0) {
    const severeInjuries = injuries.filter(i => i.injuryType === 'severe' || i.injuryType === 'critical');
    if (severeInjuries.length > 0) {
      narrative += ` ${severeInjuries[0].characterName} sustained serious injuries.`;
    } else {
      narrative += ` Minor injuries were sustained.`;
    }
  } else if (outcome === 'victory') {
    narrative += ` No casualties reported.`;
  }

  return narrative;
}

// =============================================================================
// QUICK RESOLVE (For testing UI)
// =============================================================================

/**
 * Quick test resolve - returns a sample result
 */
export function quickTestResolve(squadSize: number = 4, difficulty: number = 3): CombatResult {
  const outcomes: CombatOutcome[] = ['victory', 'defeat', 'stalemate', 'retreat'];
  const outcome = outcomes[Math.floor(Math.random() * outcomes.length)];

  return {
    outcome,
    injuries: Math.random() > 0.5 ? [{
      characterId: 'test-1',
      characterName: 'Test Character',
      injuryType: 'moderate',
      bodyPart: 'left arm',
      recoveryDays: 7,
      description: 'Bullet graze to left arm',
    }] : [],
    casualties: [],
    enemiesKilled: Math.floor(Math.random() * 10),
    enemiesCaptured: Math.floor(Math.random() * 3),
    loot: [{ itemName: 'Cash', quantity: 1000, value: 1000 }],
    fameGained: 50,
    moneyGained: 5000,
    durationMinutes: 45,
    narrativeSummary: `Squad engaged hostiles and ${outcome === 'victory' ? 'achieved victory' : 'withdrew'}.`,
  };
}

export default {
  resolveCombat,
  quickTestResolve,
};
