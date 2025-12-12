/**
 * Patrol Encounter System
 *
 * Generates combat encounters during patrol activities.
 * Thugs with baseball bats vs unarmed soldiers, etc.
 */

import { GameCharacter } from '../types';

// =============================================================================
// ENCOUNTER TYPES
// =============================================================================

export type EncounterType =
  | 'street_crime'      // Mugging, assault
  | 'gang_activity'     // Gang members
  | 'robbery'           // Store robbery
  | 'drug_deal'         // Drug transaction
  | 'vigilante'         // Other vigilantes (could be hostile)
  | 'super_villain'     // Powered enemy
  | 'police_standoff'   // Can assist police
  | 'domestic'          // Domestic dispute
  | 'bar_fight';        // Drunk brawlers

export interface EncounterEnemy {
  id: string;
  name: string;
  type: 'thug' | 'gang_member' | 'armed_criminal' | 'drunk' | 'vigilante' | 'super';
  weapon: string;
  weaponDamage: number;
  hp: number;
  maxHp: number;
  defense: number;  // Dodge/armor
  threat: number;   // 1-5 scale
  description: string;
}

export interface PatrolEncounterResult {
  id: string;
  type: EncounterType;
  title: string;
  description: string;
  location: string;  // "alley", "street corner", "bar", etc.

  // Combatants
  enemies: EncounterEnemy[];
  playerCharacters: string[];  // Character IDs involved

  // Stakes
  civilians_at_risk: number;
  potential_loot: number;
  fame_reward: number;
  fame_penalty: number;  // If failed/fled

  // Difficulty
  recommendedThreat: number;
  dangerLevel: number;  // 1-10
}

// =============================================================================
// WEAPON DATABASE (for encounters)
// =============================================================================

export const ENCOUNTER_WEAPONS: Record<string, { damage: number; description: string }> = {
  // Improvised
  'fists': { damage: 5, description: 'Bare fists' },
  'baseball_bat': { damage: 15, description: 'Wooden baseball bat' },
  'bottle': { damage: 8, description: 'Broken bottle' },
  'chain': { damage: 12, description: 'Heavy chain' },
  'pipe': { damage: 14, description: 'Metal pipe' },
  'brass_knuckles': { damage: 10, description: 'Brass knuckles' },
  'crowbar': { damage: 16, description: 'Crowbar' },

  // Knives
  'pocket_knife': { damage: 12, description: 'Folding pocket knife' },
  'switchblade': { damage: 14, description: 'Switchblade' },
  'hunting_knife': { damage: 18, description: 'Large hunting knife' },
  'machete': { damage: 22, description: 'Machete' },

  // Guns
  'cheap_pistol': { damage: 25, description: 'Cheap Saturday night special' },
  'pistol': { damage: 30, description: '9mm pistol' },
  'revolver': { damage: 35, description: '.38 revolver' },
  'shotgun': { damage: 50, description: 'Sawed-off shotgun' },
  'smg': { damage: 28, description: 'Submachine gun' },
};

// =============================================================================
// ENEMY TEMPLATES
// =============================================================================

const ENEMY_TEMPLATES: Record<string, Omit<EncounterEnemy, 'id' | 'name'>> = {
  drunk_brawler: {
    type: 'drunk',
    weapon: 'fists',
    weaponDamage: 5,
    hp: 30,
    maxHp: 30,
    defense: 5,
    threat: 1,
    description: 'Intoxicated patron looking for a fight',
  },
  thug_unarmed: {
    type: 'thug',
    weapon: 'fists',
    weaponDamage: 8,
    hp: 40,
    maxHp: 40,
    defense: 10,
    threat: 1,
    description: 'Street tough with no weapon',
  },
  thug_bat: {
    type: 'thug',
    weapon: 'baseball_bat',
    weaponDamage: 15,
    hp: 45,
    maxHp: 45,
    defense: 10,
    threat: 2,
    description: 'Thug armed with a baseball bat',
  },
  thug_knife: {
    type: 'thug',
    weapon: 'switchblade',
    weaponDamage: 14,
    hp: 40,
    maxHp: 40,
    defense: 12,
    threat: 2,
    description: 'Knife-wielding street criminal',
  },
  gang_member: {
    type: 'gang_member',
    weapon: 'cheap_pistol',
    weaponDamage: 25,
    hp: 50,
    maxHp: 50,
    defense: 15,
    threat: 3,
    description: 'Gang affiliate with a firearm',
  },
  gang_enforcer: {
    type: 'gang_member',
    weapon: 'shotgun',
    weaponDamage: 50,
    hp: 65,
    maxHp: 65,
    defense: 18,
    threat: 4,
    description: 'Gang enforcer with heavy firepower',
  },
  armed_robber: {
    type: 'armed_criminal',
    weapon: 'pistol',
    weaponDamage: 30,
    hp: 45,
    maxHp: 45,
    defense: 12,
    threat: 3,
    description: 'Armed robbery suspect',
  },
};

// =============================================================================
// ENCOUNTER TEMPLATES
// =============================================================================

interface EncounterTemplate {
  type: EncounterType;
  titles: string[];
  descriptions: string[];
  locations: string[];
  enemyOptions: string[][];  // Each array is a possible enemy group
  civilianRisk: [number, number];  // min, max
  lootRange: [number, number];
  fameReward: number;
  famePenalty: number;
  baseDanger: number;
  minPatrolTime: number;  // Minimum patrol hours before this can trigger
}

const ENCOUNTER_TEMPLATES: EncounterTemplate[] = [
  {
    type: 'bar_fight',
    titles: ['Bar Fight', 'Drunk Brawl', 'Tavern Trouble'],
    descriptions: [
      'A fight has broken out at a local bar.',
      'Drunk patrons are throwing punches.',
      'Things are getting violent at a nearby establishment.',
    ],
    locations: ['dive bar', 'sports bar', 'nightclub entrance', 'pub'],
    enemyOptions: [
      ['drunk_brawler', 'drunk_brawler'],
      ['drunk_brawler', 'drunk_brawler', 'drunk_brawler'],
      ['thug_unarmed', 'drunk_brawler'],
    ],
    civilianRisk: [0, 2],
    lootRange: [0, 50],
    fameReward: 5,
    famePenalty: 2,
    baseDanger: 2,
    minPatrolTime: 0,
  },
  {
    type: 'street_crime',
    titles: ['Mugging in Progress', 'Street Assault', 'Robbery Attempt'],
    descriptions: [
      'Someone is being mugged in an alley.',
      'A civilian is being threatened by armed attackers.',
      'You spot a crime in progress.',
    ],
    locations: ['dark alley', 'side street', 'parking lot', 'bus stop'],
    enemyOptions: [
      ['thug_bat'],
      ['thug_bat', 'thug_unarmed'],
      ['thug_knife', 'thug_unarmed'],
      ['thug_bat', 'thug_bat'],
    ],
    civilianRisk: [1, 1],
    lootRange: [20, 100],
    fameReward: 15,
    famePenalty: 10,
    baseDanger: 3,
    minPatrolTime: 1,
  },
  {
    type: 'gang_activity',
    titles: ['Gang Confrontation', 'Turf War', 'Gang Shakedown'],
    descriptions: [
      'Gang members are causing trouble.',
      'A group of gang members are harassing locals.',
      'You\'ve stumbled into gang territory.',
    ],
    locations: ['street corner', 'abandoned lot', 'under the overpass', 'project courtyard'],
    enemyOptions: [
      ['gang_member', 'thug_bat'],
      ['gang_member', 'gang_member'],
      ['gang_member', 'thug_knife', 'thug_knife'],
      ['gang_enforcer', 'gang_member'],
    ],
    civilianRisk: [0, 3],
    lootRange: [100, 500],
    fameReward: 25,
    famePenalty: 5,
    baseDanger: 5,
    minPatrolTime: 2,
  },
  {
    type: 'robbery',
    titles: ['Store Robbery', 'Armed Holdup', 'Convenience Store Heist'],
    descriptions: [
      'Armed robbers are holding up a store.',
      'A robbery is in progress at a local business.',
      'Criminals are threatening a shopkeeper.',
    ],
    locations: ['convenience store', 'liquor store', 'gas station', 'pawn shop'],
    enemyOptions: [
      ['armed_robber'],
      ['armed_robber', 'thug_bat'],
      ['armed_robber', 'armed_robber'],
    ],
    civilianRisk: [1, 3],
    lootRange: [200, 800],
    fameReward: 30,
    famePenalty: 20,
    baseDanger: 6,
    minPatrolTime: 2,
  },
  {
    type: 'drug_deal',
    titles: ['Drug Deal Interrupted', 'Dealer Confrontation', 'Street Corner Deal'],
    descriptions: [
      'You\'ve spotted a drug transaction.',
      'Dealers are selling on the corner.',
      'A drug deal is going down.',
    ],
    locations: ['street corner', 'parking garage', 'abandoned building', 'park bench'],
    enemyOptions: [
      ['gang_member', 'thug_knife'],
      ['gang_member', 'gang_member', 'thug_unarmed'],
      ['gang_enforcer', 'gang_member'],
    ],
    civilianRisk: [0, 1],
    lootRange: [300, 1000],
    fameReward: 20,
    famePenalty: 5,
    baseDanger: 5,
    minPatrolTime: 3,
  },
];

// =============================================================================
// ENCOUNTER GENERATION
// =============================================================================

/**
 * Generate a random encounter based on patrol conditions
 */
export function generatePatrolEncounter(
  characters: GameCharacter[],
  cityName: string,
  crimeIndex: number,  // 0-100, higher = more dangerous encounters
  hoursPatrolled: number
): PatrolEncounterResult | null {
  // Filter templates by minimum patrol time
  const availableTemplates = ENCOUNTER_TEMPLATES.filter(t => hoursPatrolled >= t.minPatrolTime);

  if (availableTemplates.length === 0) return null;

  // Higher crime = more likely to get dangerous encounters
  const dangerBias = crimeIndex / 100;

  // Sort by danger and pick based on crime index
  const sortedTemplates = [...availableTemplates].sort((a, b) => a.baseDanger - b.baseDanger);
  const templateIndex = Math.min(
    sortedTemplates.length - 1,
    Math.floor(Math.random() * sortedTemplates.length * (0.5 + dangerBias * 0.5))
  );

  const template = sortedTemplates[templateIndex];

  // Generate enemies
  const enemyGroup = template.enemyOptions[Math.floor(Math.random() * template.enemyOptions.length)];
  const enemies: EncounterEnemy[] = enemyGroup.map((templateKey, i) => {
    const enemyTemplate = ENEMY_TEMPLATES[templateKey];
    return {
      id: `enemy_${Date.now()}_${i}`,
      name: generateEnemyName(enemyTemplate.type),
      ...enemyTemplate,
    };
  });

  // Calculate danger based on enemies and crime index
  const totalThreat = enemies.reduce((sum, e) => sum + e.threat, 0);
  const dangerLevel = Math.min(10, Math.round(template.baseDanger + (crimeIndex / 25)));

  // Calculate recommended threat level for squad
  const recommendedThreat = Math.max(1, Math.ceil(totalThreat / 2));

  return {
    id: `enc_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    type: template.type,
    title: template.titles[Math.floor(Math.random() * template.titles.length)],
    description: template.descriptions[Math.floor(Math.random() * template.descriptions.length)],
    location: template.locations[Math.floor(Math.random() * template.locations.length)],
    enemies,
    playerCharacters: characters.map(c => c.id),
    civilians_at_risk: template.civilianRisk[0] + Math.floor(Math.random() * (template.civilianRisk[1] - template.civilianRisk[0] + 1)),
    potential_loot: template.lootRange[0] + Math.floor(Math.random() * (template.lootRange[1] - template.lootRange[0])),
    fame_reward: template.fameReward,
    fame_penalty: template.famePenalty,
    recommendedThreat,
    dangerLevel,
  };
}

/**
 * Generate a random name for an enemy
 */
function generateEnemyName(type: EncounterEnemy['type']): string {
  const prefixes: Record<string, string[]> = {
    drunk: ['Drunk', 'Wasted', 'Tipsy', 'Belligerent'],
    thug: ['Street', 'Local', 'Neighborhood', 'Back-alley'],
    gang_member: ['Gang', 'Crew', 'Set'],
    armed_criminal: ['Armed', 'Dangerous', 'Masked'],
    vigilante: ['Masked', 'Unknown', 'Rogue'],
    super: ['The', 'Meta-human', 'Powered'],
  };

  const suffixes: Record<string, string[]> = {
    drunk: ['Patron', 'Brawler', 'Fighter', 'Troublemaker'],
    thug: ['Thug', 'Punk', 'Criminal', 'Tough'],
    gang_member: ['Member', 'Banger', 'Soldier', 'Associate'],
    armed_criminal: ['Robber', 'Criminal', 'Suspect', 'Perp'],
    vigilante: ['Vigilante', 'Hero', 'Figure', 'Crusader'],
    super: ['Villain', 'Menace', 'Threat', 'Criminal'],
  };

  const prefix = prefixes[type]?.[Math.floor(Math.random() * prefixes[type].length)] || 'Unknown';
  const suffix = suffixes[type]?.[Math.floor(Math.random() * suffixes[type].length)] || 'Enemy';

  return `${prefix} ${suffix}`;
}

// =============================================================================
// QUICK COMBAT RESOLUTION FOR ENCOUNTERS
// =============================================================================

export interface EncounterCombatResult {
  victory: boolean;
  fled: boolean;

  // Character outcomes
  characterResults: {
    characterId: string;
    damageTaken: number;
    injured: boolean;
    injuryDescription?: string;
  }[];

  // Enemy outcomes
  enemiesDefeated: number;
  enemiesEscaped: number;

  // Rewards/penalties
  fameChange: number;
  lootGained: number;
  civiliansHarmed: number;

  // Narrative
  battleLog: string[];
  summary: string;
}

/**
 * Resolve an encounter with quick combat
 */
export function resolvePatrolEncounter(
  characters: GameCharacter[],
  encounter: PatrolEncounterResult
): EncounterCombatResult {
  const battleLog: string[] = [];
  const characterResults: EncounterCombatResult['characterResults'] = [];

  // Calculate squad power
  let squadPower = 0;
  characters.forEach(char => {
    const combatStat = (char.stats.MEL + char.stats.AGL + char.stats.STR) / 3;
    const threatMod = parseInt(char.threatLevel?.replace('THREAT_', '') || '1');
    const equipped = char.equipment?.length || 0;
    squadPower += combatStat * threatMod * (0.8 + equipped * 0.1);
  });

  // Calculate enemy power
  let enemyPower = 0;
  encounter.enemies.forEach(enemy => {
    enemyPower += enemy.hp * 0.5 + enemy.weaponDamage * 2 + enemy.defense * 1.5;
  });

  battleLog.push(`Encounter: ${encounter.title} at ${encounter.location}`);
  battleLog.push(`Squad power: ${Math.round(squadPower)} vs Enemy power: ${Math.round(enemyPower)}`);

  // Simulate combat rounds
  const ratio = squadPower / Math.max(1, enemyPower);
  const baseWinChance = Math.min(0.95, Math.max(0.15, 0.5 + (ratio - 1) * 0.3));
  const roll = Math.random();
  const victory = roll < baseWinChance;

  // Calculate damage to characters
  let totalCharDamage = 0;
  characters.forEach(char => {
    const isTarget = Math.random() < 0.6;  // 60% chance to be targeted
    if (!isTarget) {
      characterResults.push({ characterId: char.id, damageTaken: 0, injured: false });
      return;
    }

    // Pick random enemy weapon
    const attacker = encounter.enemies[Math.floor(Math.random() * encounter.enemies.length)];
    const baseDamage = attacker.weaponDamage;

    // Reduce by defense/armor
    const dr = char.dr || 0;
    const finalDamage = Math.max(0, Math.round(baseDamage * (victory ? 0.3 : 0.7) - dr));

    const injured = finalDamage > 15;
    totalCharDamage += finalDamage;

    if (finalDamage > 0) {
      battleLog.push(`${char.name} takes ${finalDamage} damage from ${attacker.weapon}!`);
    }

    characterResults.push({
      characterId: char.id,
      damageTaken: finalDamage,
      injured,
      injuryDescription: injured ? `Wounded by ${attacker.weapon}` : undefined,
    });
  });

  // Enemy outcomes
  const enemiesDefeated = victory
    ? encounter.enemies.length
    : Math.floor(encounter.enemies.length * Math.random() * 0.5);
  const enemiesEscaped = encounter.enemies.length - enemiesDefeated;

  // Civilian outcomes
  const civiliansHarmed = victory
    ? 0
    : Math.floor(encounter.civilians_at_risk * Math.random());

  // Fame/loot
  const fameChange = victory
    ? encounter.fame_reward + (civiliansHarmed === 0 ? 5 : 0)
    : -encounter.fame_penalty;
  const lootGained = victory ? encounter.potential_loot : 0;

  // Build summary
  let summary: string;
  if (victory) {
    summary = civiliansHarmed === 0
      ? `Victory! All ${encounter.enemies.length} enemies defeated. No civilian casualties.`
      : `Victory, but ${civiliansHarmed} civilian(s) were harmed in the crossfire.`;
    battleLog.push(summary);
  } else {
    summary = `The squad was forced to retreat. ${enemiesDefeated} enemies down, ${enemiesEscaped} escaped.`;
    if (civiliansHarmed > 0) {
      summary += ` ${civiliansHarmed} civilian(s) were harmed.`;
    }
    battleLog.push(summary);
  }

  return {
    victory,
    fled: !victory,
    characterResults,
    enemiesDefeated,
    enemiesEscaped,
    fameChange,
    lootGained,
    civiliansHarmed,
    battleLog,
    summary,
  };
}

// =============================================================================
// COMPARE: UNARMED SOLDIER VS THUG WITH BAT
// =============================================================================

/**
 * Simulate a 1v1 fight (for testing balance)
 */
export function simulate1v1(
  characterStats: { MEL: number; AGL: number; STR: number; CON: number },
  characterWeapon: string | null,
  characterDR: number,
  enemy: EncounterEnemy
): { winner: 'character' | 'enemy'; rounds: number; log: string[] } {
  const log: string[] = [];

  // Character stats
  let charHP = 60 + characterStats.CON;
  const charDamage = characterWeapon
    ? (ENCOUNTER_WEAPONS[characterWeapon]?.damage || 10)
    : Math.round(5 + characterStats.STR * 0.2);  // Unarmed damage based on STR
  const charHitChance = 0.5 + (characterStats.MEL / 200) + (characterStats.AGL / 300);

  // Enemy stats
  let enemyHP = enemy.hp;
  const enemyDamage = enemy.weaponDamage;
  const enemyHitChance = 0.5;

  log.push(`FIGHT: Character (${charHP}hp, ${charDamage}dmg) vs ${enemy.name} (${enemyHP}hp, ${enemyDamage}dmg)`);

  let round = 0;
  while (charHP > 0 && enemyHP > 0 && round < 20) {
    round++;

    // Character attacks
    if (Math.random() < charHitChance) {
      const dmg = Math.max(1, charDamage - enemy.defense);
      enemyHP -= dmg;
      log.push(`R${round}: Character hits for ${dmg} (enemy: ${enemyHP}hp)`);
    } else {
      log.push(`R${round}: Character misses`);
    }

    if (enemyHP <= 0) break;

    // Enemy attacks
    if (Math.random() < enemyHitChance) {
      const dmg = Math.max(1, enemyDamage - characterDR);
      charHP -= dmg;
      log.push(`R${round}: ${enemy.name} hits for ${dmg} (char: ${charHP}hp)`);
    } else {
      log.push(`R${round}: ${enemy.name} misses`);
    }
  }

  const winner = charHP > 0 ? 'character' : 'enemy';
  log.push(`RESULT: ${winner} wins in ${round} rounds`);

  return { winner, rounds: round, log };
}

export default {
  generatePatrolEncounter,
  resolvePatrolEncounter,
  simulate1v1,
  ENCOUNTER_WEAPONS,
};
