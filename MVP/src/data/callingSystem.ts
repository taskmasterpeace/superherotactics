/**
 * Calling System - Character Motivations & Drives
 *
 * Inspired by Marvel's Callings but adapted for grounded gameplay.
 * Works for mercenaries, superheroes, soldiers, criminals, and regular people.
 *
 * A Calling is WHY a character fights, their core drive.
 * This complements the Personality System (HOW they behave).
 *
 * Gameplay Effects:
 * - Morale bonuses/penalties based on mission alignment
 * - Combat bonuses when fighting for their cause
 * - Story choices and dialogue options
 * - Team chemistry (compatible vs conflicting callings)
 * - Recruitment: some callings won't work for certain employers
 */

// =============================================================================
// CALLING DEFINITIONS
// =============================================================================

export type CallingId =
  // PROTECTIVE (defending others)
  | 'protector'           // Shield all innocents
  | 'guardian'            // Protect specific people/places
  | 'shepherd'            // Guide and nurture the vulnerable

  // JUSTICE (righting wrongs)
  | 'avenger'             // Punish wrongdoers
  | 'reformer'            // Fix broken systems
  | 'liberator'           // Free the oppressed

  // REDEMPTION (personal growth)
  | 'repentant'           // Atone for past sins
  | 'survivor'            // Overcome personal trauma
  | 'seeker'              // Find meaning/purpose

  // DUTY (obligation-driven)
  | 'soldier'             // Serve a cause/nation
  | 'professional'        // Do the job right
  | 'legacy'              // Honor family/tradition

  // SELF-INTEREST (personal gain)
  | 'mercenary'           // Money above all
  | 'glory_hound'         // Fame and recognition
  | 'thrill_seeker'       // Adrenaline and danger
  | 'collector'           // Acquire power/artifacts

  // IDEOLOGY (belief-driven)
  | 'idealist'            // Fight for a principle
  | 'zealot'              // Extreme devotion to cause
  | 'visionary'           // Build a better future

  // POWER (control-driven)
  | 'conqueror'           // Dominate others
  | 'architect'           // Shape the world
  | 'untouchable'         // Never be vulnerable again

  // IDENTITY (self-definition)
  | 'outcast'             // Prove worth despite rejection
  | 'reluctant'           // Didn't ask for this burden
  | 'born_to_it'          // Embrace destiny/heritage

  // RELATIONSHIPS (connection-driven)
  | 'loyalist'            // Devoted to a person/group
  | 'rival'               // Prove superiority over someone
  | 'romantic'            // Love drives all actions

  // DARK (destructive drives)
  | 'nihilist'            // Nothing matters
  | 'predator'            // Hunt for its own sake
  | 'chaos_agent';        // Tear down order

export interface Calling {
  id: CallingId;
  name: string;
  description: string;

  // What drives them
  coreDesire: string;
  greatestFear: string;

  // Gameplay effects
  effects: CallingEffects;

  // Compatibility
  compatible: CallingId[];      // Work well together
  conflicting: CallingId[];     // Cause friction

  // Recruitment restrictions
  willWorkFor: EmployerType[];
  wontWorkFor: EmployerType[];

  // Common backgrounds
  typicalBackgrounds: string[];
}

export type EmployerType =
  | 'hero_team'
  | 'villain_org'
  | 'government'
  | 'military'
  | 'corporation'
  | 'criminal'
  | 'mercenary_company'
  | 'vigilante'
  | 'anyone';  // Will work for anyone

export interface CallingEffects {
  // Morale modifiers (applied when conditions met)
  moraleBonus: MoraleTrigger[];
  moralePenalty: MoraleTrigger[];

  // Combat modifiers
  combatBonus?: CombatBonus;

  // Special abilities/restrictions
  special?: string[];
}

export interface MoraleTrigger {
  condition: string;      // Description of trigger
  modifier: number;       // +/- morale points
}

export interface CombatBonus {
  condition: string;      // When bonus applies
  accuracyMod?: number;
  damageMod?: number;
  evasionMod?: number;
  moraleImmune?: boolean; // Can't be broken
}

// =============================================================================
// CALLING DATABASE
// =============================================================================

export const CALLINGS: Record<CallingId, Calling> = {
  // =========================================================================
  // PROTECTIVE CALLINGS
  // =========================================================================

  protector: {
    id: 'protector',
    name: 'Protector',
    description: 'Driven to shield innocents from harm. Cannot stand by when others suffer.',
    coreDesire: 'A world where the innocent are safe',
    greatestFear: 'Failing to save someone who needed them',
    effects: {
      moraleBonus: [
        { condition: 'Saved civilian lives', modifier: 15 },
        { condition: 'Prevented collateral damage', modifier: 10 },
        { condition: 'Defended the defenseless', modifier: 20 },
      ],
      moralePenalty: [
        { condition: 'Civilian casualties occurred', modifier: -25 },
        { condition: 'Had to abandon someone in danger', modifier: -20 },
        { condition: 'Collateral damage was unavoidable', modifier: -10 },
      ],
      combatBonus: {
        condition: 'Defending civilians or allies',
        evasionMod: 10,
        moraleImmune: true,
      },
    },
    compatible: ['guardian', 'shepherd', 'idealist', 'soldier'],
    conflicting: ['nihilist', 'predator', 'conqueror', 'mercenary'],
    willWorkFor: ['hero_team', 'government', 'vigilante'],
    wontWorkFor: ['villain_org', 'criminal'],
    typicalBackgrounds: ['Police', 'Firefighter', 'Paramedic', 'Teacher', 'Parent'],
  },

  guardian: {
    id: 'guardian',
    name: 'Guardian',
    description: 'Fiercely protective of specific people or places. Their world is small but absolute.',
    coreDesire: 'Keep their charges safe at any cost',
    greatestFear: 'Losing what they protect',
    effects: {
      moraleBonus: [
        { condition: 'Protected their ward/home', modifier: 20 },
        { condition: 'Ward expressed gratitude', modifier: 10 },
      ],
      moralePenalty: [
        { condition: 'Ward was harmed', modifier: -30 },
        { condition: 'Forced away from their charge', modifier: -15 },
        { condition: 'Home/territory was damaged', modifier: -20 },
      ],
      combatBonus: {
        condition: 'Fighting near their ward or home territory',
        damageMod: 15,
        accuracyMod: 10,
        moraleImmune: true,
      },
    },
    compatible: ['protector', 'loyalist', 'legacy'],
    conflicting: ['thrill_seeker', 'chaos_agent', 'glory_hound'],
    willWorkFor: ['anyone'],
    wontWorkFor: [],
    typicalBackgrounds: ['Bodyguard', 'Single Parent', 'Cult Survivor', 'Village Elder'],
  },

  shepherd: {
    id: 'shepherd',
    name: 'Shepherd',
    description: 'Guides and nurtures the vulnerable. Believes in helping others grow stronger.',
    coreDesire: 'Help others reach their potential',
    greatestFear: 'Their guidance leading someone astray',
    effects: {
      moraleBonus: [
        { condition: 'Mentored someone successfully', modifier: 15 },
        { condition: 'Team member improved under guidance', modifier: 10 },
        { condition: 'Rescued someone from a bad path', modifier: 20 },
      ],
      moralePenalty: [
        { condition: 'Student/ward failed or died', modifier: -25 },
        { condition: 'Advice led to harm', modifier: -20 },
      ],
      special: [
        'Training others takes 20% less time',
        'Team members gain +5% XP when fighting alongside',
      ],
    },
    compatible: ['protector', 'idealist', 'legacy'],
    conflicting: ['nihilist', 'mercenary', 'predator'],
    willWorkFor: ['hero_team', 'government', 'vigilante'],
    wontWorkFor: ['villain_org', 'criminal'],
    typicalBackgrounds: ['Teacher', 'Coach', 'Priest', 'Therapist', 'Drill Sergeant'],
  },

  // =========================================================================
  // JUSTICE CALLINGS
  // =========================================================================

  avenger: {
    id: 'avenger',
    name: 'Avenger',
    description: 'Punishes those who prey on others. Justice through retribution.',
    coreDesire: 'Make wrongdoers pay for their crimes',
    greatestFear: 'The guilty going unpunished',
    effects: {
      moraleBonus: [
        { condition: 'Brought a criminal to justice', modifier: 15 },
        { condition: 'Avenged a victim', modifier: 20 },
        { condition: 'Target was a known villain', modifier: 10 },
      ],
      moralePenalty: [
        { condition: 'Criminal escaped justice', modifier: -20 },
        { condition: 'Had to let a criminal go', modifier: -15 },
        { condition: 'Innocent was wrongly punished', modifier: -25 },
      ],
      combatBonus: {
        condition: 'Fighting someone who harmed innocents',
        damageMod: 20,
        accuracyMod: 5,
      },
    },
    compatible: ['liberator', 'idealist', 'protector'],
    conflicting: ['mercenary', 'nihilist', 'chaos_agent'],
    willWorkFor: ['hero_team', 'vigilante', 'government'],
    wontWorkFor: ['criminal', 'villain_org'],
    typicalBackgrounds: ['Victim of Crime', 'Ex-Cop', 'Vigilante', 'War Survivor'],
  },

  reformer: {
    id: 'reformer',
    name: 'Reformer',
    description: 'Works to fix broken systems and institutions. Change from within.',
    coreDesire: 'Create lasting systemic change',
    greatestFear: 'Becoming part of the problem',
    effects: {
      moraleBonus: [
        { condition: 'Exposed corruption', modifier: 20 },
        { condition: 'Changed policy for the better', modifier: 25 },
        { condition: 'Worked within the system successfully', modifier: 10 },
      ],
      moralePenalty: [
        { condition: 'Had to compromise principles', modifier: -15 },
        { condition: 'Reform efforts failed', modifier: -20 },
        { condition: 'Became complicit in wrongdoing', modifier: -30 },
      ],
    },
    compatible: ['idealist', 'visionary', 'soldier'],
    conflicting: ['chaos_agent', 'conqueror', 'nihilist'],
    willWorkFor: ['government', 'hero_team', 'corporation'],
    wontWorkFor: ['criminal', 'villain_org'],
    typicalBackgrounds: ['Politician', 'Journalist', 'Lawyer', 'Union Leader', 'Activist'],
  },

  liberator: {
    id: 'liberator',
    name: 'Liberator',
    description: 'Fights to free the oppressed. Chains must be broken.',
    coreDesire: 'Freedom for all who are subjugated',
    greatestFear: 'Becoming an oppressor themselves',
    effects: {
      moraleBonus: [
        { condition: 'Freed prisoners or slaves', modifier: 25 },
        { condition: 'Overthrew a tyrant', modifier: 30 },
        { condition: 'Helped refugees escape', modifier: 15 },
      ],
      moralePenalty: [
        { condition: 'Worked for an authoritarian regime', modifier: -30 },
        { condition: 'Had to leave people in captivity', modifier: -20 },
        { condition: 'Used coercion on others', modifier: -15 },
      ],
      combatBonus: {
        condition: 'Fighting slavers, dictators, or captors',
        damageMod: 15,
        moraleImmune: true,
      },
    },
    compatible: ['avenger', 'idealist', 'protector'],
    conflicting: ['conqueror', 'soldier', 'loyalist'],
    willWorkFor: ['hero_team', 'vigilante'],
    wontWorkFor: ['government', 'villain_org', 'criminal'],
    typicalBackgrounds: ['Ex-Slave', 'Revolutionary', 'Refugee', 'Underground Railroad'],
  },

  // =========================================================================
  // REDEMPTION CALLINGS
  // =========================================================================

  repentant: {
    id: 'repentant',
    name: 'Repentant',
    description: 'Seeking to atone for past sins through good deeds. The weight of guilt drives them.',
    coreDesire: 'Earn forgiveness through action',
    greatestFear: 'Being defined forever by past mistakes',
    effects: {
      moraleBonus: [
        { condition: 'Saved a life', modifier: 15 },
        { condition: 'Received forgiveness from a victim', modifier: 30 },
        { condition: 'Prevented others from making their mistakes', modifier: 20 },
      ],
      moralePenalty: [
        { condition: 'Reminded of past crimes', modifier: -10 },
        { condition: 'Old victims confronted them', modifier: -20 },
        { condition: 'Relapsed into old behavior', modifier: -35 },
      ],
      special: [
        'Cannot refuse missions that help victims',
        '+15% effectiveness on rescue missions',
      ],
    },
    compatible: ['protector', 'shepherd', 'seeker'],
    conflicting: ['predator', 'nihilist', 'glory_hound'],
    willWorkFor: ['hero_team', 'vigilante', 'government'],
    wontWorkFor: ['criminal', 'villain_org'],
    typicalBackgrounds: ['Ex-Criminal', 'Reformed Villain', 'Recovering Addict', 'War Criminal'],
  },

  survivor: {
    id: 'survivor',
    name: 'Survivor',
    description: 'Overcame tremendous trauma. Proves that survival is victory.',
    coreDesire: 'Never be a victim again',
    greatestFear: 'Returning to helplessness',
    effects: {
      moraleBonus: [
        { condition: 'Overcame impossible odds', modifier: 20 },
        { condition: 'Helped another survivor', modifier: 15 },
        { condition: 'Faced their trauma directly', modifier: 25 },
      ],
      moralePenalty: [
        { condition: 'Triggered by trauma reminder', modifier: -15 },
        { condition: 'Felt helpless', modifier: -25 },
      ],
      combatBonus: {
        condition: 'Below 25% health',
        evasionMod: 15,
        damageMod: 10,
        moraleImmune: true,
      },
      special: [
        'Cannot be broken by torture',
        '+20% escape chance when captured',
      ],
    },
    compatible: ['untouchable', 'seeker', 'repentant'],
    conflicting: ['predator', 'conqueror'],
    willWorkFor: ['anyone'],
    wontWorkFor: [],
    typicalBackgrounds: ['Abuse Survivor', 'Disaster Survivor', 'POW', 'Orphan'],
  },

  seeker: {
    id: 'seeker',
    name: 'Seeker',
    description: 'Searching for meaning, truth, or purpose. The journey is the destination.',
    coreDesire: 'Find their true purpose',
    greatestFear: 'A meaningless existence',
    effects: {
      moraleBonus: [
        { condition: 'Discovered important truth', modifier: 20 },
        { condition: 'Found new purpose in mission', modifier: 15 },
        { condition: 'Philosophical breakthrough', modifier: 25 },
      ],
      moralePenalty: [
        { condition: 'Mission felt meaningless', modifier: -15 },
        { condition: 'Existential doubt', modifier: -10 },
      ],
      special: [
        'Investigation missions +15% effectiveness',
        'Can unlock hidden dialogue options',
      ],
    },
    compatible: ['visionary', 'idealist', 'shepherd'],
    conflicting: ['mercenary', 'nihilist'],
    willWorkFor: ['anyone'],
    wontWorkFor: [],
    typicalBackgrounds: ['Philosopher', 'Ex-Religious', 'Amnesiac', 'Clone', 'AI'],
  },

  // =========================================================================
  // DUTY CALLINGS
  // =========================================================================

  soldier: {
    id: 'soldier',
    name: 'Soldier',
    description: 'Serves a cause, nation, or commander. Duty above self.',
    coreDesire: 'Serve with honor',
    greatestFear: 'Disgrace or dishonorable discharge',
    effects: {
      moraleBonus: [
        { condition: 'Mission accomplished as ordered', modifier: 15 },
        { condition: 'Received commendation', modifier: 20 },
        { condition: 'Protected fellow soldiers', modifier: 10 },
      ],
      moralePenalty: [
        { condition: 'Disobeyed orders', modifier: -20 },
        { condition: 'Mission failed', modifier: -15 },
        { condition: 'Comrades killed under their watch', modifier: -25 },
      ],
      combatBonus: {
        condition: 'Following direct orders',
        accuracyMod: 10,
        evasionMod: 5,
      },
      special: [
        'Military chain of command respected',
        'Will not break ranks without good reason',
      ],
    },
    compatible: ['loyalist', 'protector', 'legacy'],
    conflicting: ['chaos_agent', 'liberator', 'thrill_seeker'],
    willWorkFor: ['military', 'government', 'mercenary_company'],
    wontWorkFor: ['criminal'],
    typicalBackgrounds: ['Military', 'Police', 'Security', 'Veteran', 'Cadet'],
  },

  professional: {
    id: 'professional',
    name: 'Professional',
    description: 'Does the job right, every time. Pride in craft over ideology.',
    coreDesire: 'Excellence in their field',
    greatestFear: 'Being seen as incompetent',
    effects: {
      moraleBonus: [
        { condition: 'Mission completed flawlessly', modifier: 20 },
        { condition: 'Skills were essential to success', modifier: 15 },
        { condition: 'Recognized as expert', modifier: 10 },
      ],
      moralePenalty: [
        { condition: 'Made amateur mistake', modifier: -20 },
        { condition: 'Equipment failure', modifier: -10 },
        { condition: 'Outperformed by amateur', modifier: -25 },
      ],
      special: [
        'Equipment maintenance +20% effectiveness',
        'Training time -15%',
        'No morale penalty for morally gray missions if well-executed',
      ],
    },
    compatible: ['soldier', 'mercenary', 'legacy'],
    conflicting: ['chaos_agent', 'thrill_seeker'],
    willWorkFor: ['anyone'],
    wontWorkFor: [],
    typicalBackgrounds: ['Specialist', 'Craftsman', 'Surgeon', 'Hitman', 'Engineer'],
  },

  legacy: {
    id: 'legacy',
    name: 'Legacy',
    description: 'Honors family tradition or inherited mantle. The name means everything.',
    coreDesire: 'Live up to their heritage',
    greatestFear: 'Shaming their lineage',
    effects: {
      moraleBonus: [
        { condition: 'Upheld family honor', modifier: 20 },
        { condition: 'Continued family tradition', modifier: 15 },
        { condition: 'Earned respect of elders/predecessors', modifier: 25 },
      ],
      moralePenalty: [
        { condition: 'Dishonored family name', modifier: -30 },
        { condition: 'Compared unfavorably to predecessor', modifier: -20 },
        { condition: 'Broke family tradition', modifier: -15 },
      ],
      special: [
        'Reputation effects doubled',
        'Family connections provide resources',
      ],
    },
    compatible: ['soldier', 'guardian', 'professional'],
    conflicting: ['rebel', 'nihilist', 'seeker'],
    willWorkFor: ['anyone'],
    wontWorkFor: [],
    typicalBackgrounds: ['Noble', 'Heir', 'Dynasty', 'Sidekick Promoted', 'Family Business'],
  },

  // =========================================================================
  // SELF-INTEREST CALLINGS
  // =========================================================================

  mercenary: {
    id: 'mercenary',
    name: 'Mercenary',
    description: 'Money talks. Everything else is negotiable.',
    coreDesire: 'Accumulate wealth',
    greatestFear: 'Dying broke',
    effects: {
      moraleBonus: [
        { condition: 'Received bonus pay', modifier: 25 },
        { condition: 'Found valuable loot', modifier: 15 },
        { condition: 'Negotiated better contract', modifier: 20 },
      ],
      moralePenalty: [
        { condition: 'Payment delayed or reduced', modifier: -30 },
        { condition: 'Equipment lost (value > $1000)', modifier: -15 },
        { condition: 'Mission paid less than expected', modifier: -20 },
      ],
      special: [
        'No morale penalty for morally gray missions if paid well',
        'Will demand hazard pay for dangerous missions',
        '+10% negotiation for contracts',
      ],
    },
    compatible: ['professional', 'thrill_seeker', 'survivor'],
    conflicting: ['idealist', 'protector', 'repentant'],
    willWorkFor: ['anyone'],
    wontWorkFor: [],
    typicalBackgrounds: ['Ex-Military', 'Bounty Hunter', 'Contractor', 'Thief'],
  },

  glory_hound: {
    id: 'glory_hound',
    name: 'Glory Hound',
    description: 'Lives for recognition and fame. The spotlight is oxygen.',
    coreDesire: 'Be famous and admired',
    greatestFear: 'Being forgotten or ignored',
    effects: {
      moraleBonus: [
        { condition: 'Made headlines', modifier: 25 },
        { condition: 'Received public praise', modifier: 20 },
        { condition: 'Outshone rivals', modifier: 15 },
      ],
      moralePenalty: [
        { condition: 'Another got credit for their work', modifier: -30 },
        { condition: 'Mission was covert/unrecognized', modifier: -15 },
        { condition: 'Publicly embarrassed', modifier: -35 },
      ],
      combatBonus: {
        condition: 'Media or witnesses present',
        damageMod: 10,
        accuracyMod: 10,
      },
      special: [
        'Fame gain +50%',
        'Cannot do stealth missions without morale penalty',
      ],
    },
    compatible: ['thrill_seeker', 'rival'],
    conflicting: ['guardian', 'professional', 'loyalist'],
    willWorkFor: ['hero_team', 'corporation', 'mercenary_company'],
    wontWorkFor: [],
    typicalBackgrounds: ['Celebrity', 'Athlete', 'Influencer', 'Ex-Sidekick'],
  },

  thrill_seeker: {
    id: 'thrill_seeker',
    name: 'Thrill Seeker',
    description: 'Addicted to danger and adrenaline. Boredom is the enemy.',
    coreDesire: 'Feel alive through risk',
    greatestFear: 'A mundane, safe existence',
    effects: {
      moraleBonus: [
        { condition: 'Survived dangerous situation', modifier: 20 },
        { condition: 'Took unnecessary risk that paid off', modifier: 25 },
        { condition: 'First into combat', modifier: 15 },
      ],
      moralePenalty: [
        { condition: 'Mission was too easy', modifier: -15 },
        { condition: 'Had to play it safe', modifier: -20 },
        { condition: 'Benched from action', modifier: -25 },
      ],
      combatBonus: {
        condition: 'Outnumbered or outgunned',
        accuracyMod: 15,
        evasionMod: 10,
      },
      special: [
        'Never refuses dangerous missions',
        'May take unnecessary risks (discipline check)',
      ],
    },
    compatible: ['mercenary', 'glory_hound', 'chaos_agent'],
    conflicting: ['guardian', 'professional', 'soldier'],
    willWorkFor: ['anyone'],
    wontWorkFor: [],
    typicalBackgrounds: ['Extreme Sports', 'Daredevil', 'Ex-Pilot', 'Adrenaline Junkie'],
  },

  collector: {
    id: 'collector',
    name: 'Collector',
    description: 'Driven to acquire power, artifacts, or knowledge. Possession is everything.',
    coreDesire: 'Possess what others cannot',
    greatestFear: 'Losing their collection',
    effects: {
      moraleBonus: [
        { condition: 'Acquired rare item/power', modifier: 25 },
        { condition: 'Collection grew', modifier: 15 },
        { condition: 'Denied rivals an acquisition', modifier: 20 },
      ],
      moralePenalty: [
        { condition: 'Lost an item from collection', modifier: -30 },
        { condition: 'Rival acquired target first', modifier: -25 },
        { condition: 'Forced to share resources', modifier: -15 },
      ],
      special: [
        'Finds hidden items +25% chance',
        'May prioritize loot over mission objectives',
      ],
    },
    compatible: ['seeker', 'untouchable'],
    conflicting: ['idealist', 'repentant'],
    willWorkFor: ['anyone'],
    wontWorkFor: [],
    typicalBackgrounds: ['Archaeologist', 'Thief', 'Antiquarian', 'Scientist', 'Mage'],
  },

  // =========================================================================
  // IDEOLOGY CALLINGS
  // =========================================================================

  idealist: {
    id: 'idealist',
    name: 'Idealist',
    description: 'Fights for principles. Would die for their beliefs.',
    coreDesire: 'A world aligned with their values',
    greatestFear: 'Compromising their principles',
    effects: {
      moraleBonus: [
        { condition: 'Advanced their cause', modifier: 25 },
        { condition: 'Converted someone to their viewpoint', modifier: 20 },
        { condition: 'Stood firm against opposition', modifier: 15 },
      ],
      moralePenalty: [
        { condition: 'Forced to compromise principles', modifier: -30 },
        { condition: 'Cause suffered setback', modifier: -20 },
        { condition: 'Allied with ideological enemies', modifier: -25 },
      ],
      combatBonus: {
        condition: 'Fighting for their cause',
        moraleImmune: true,
      },
      special: [
        'Cannot be bribed',
        'May refuse orders that violate principles',
      ],
    },
    compatible: ['protector', 'liberator', 'visionary'],
    conflicting: ['mercenary', 'nihilist', 'professional'],
    willWorkFor: ['hero_team', 'vigilante'],
    wontWorkFor: ['criminal', 'villain_org'],
    typicalBackgrounds: ['Activist', 'Revolutionary', 'Religious', 'Philosopher'],
  },

  zealot: {
    id: 'zealot',
    name: 'Zealot',
    description: 'Extreme devotion to a cause or belief. The ends justify the means.',
    coreDesire: 'Total victory for their cause',
    greatestFear: 'Their cause being proven wrong',
    effects: {
      moraleBonus: [
        { condition: 'Struck blow against enemies of cause', modifier: 25 },
        { condition: 'Demonstrated commitment through sacrifice', modifier: 20 },
      ],
      moralePenalty: [
        { condition: 'Cause was questioned', modifier: -20 },
        { condition: 'Worked with heretics/enemies', modifier: -30 },
      ],
      combatBonus: {
        condition: 'Fighting enemies of their cause',
        damageMod: 20,
        moraleImmune: true,
      },
      special: [
        'Will not retreat from ideological battles',
        'May commit atrocities for the cause',
        'Torture resistance +50%',
      ],
    },
    compatible: ['idealist', 'loyalist'],
    conflicting: ['seeker', 'mercenary', 'professional'],
    willWorkFor: ['hero_team', 'villain_org', 'vigilante'],
    wontWorkFor: [],
    typicalBackgrounds: ['Cultist', 'Extremist', 'True Believer', 'Fanatic'],
  },

  visionary: {
    id: 'visionary',
    name: 'Visionary',
    description: 'Sees a better future and works to build it. Progress above all.',
    coreDesire: 'Create lasting positive change',
    greatestFear: 'Their vision dying with them',
    effects: {
      moraleBonus: [
        { condition: 'Made progress toward vision', modifier: 25 },
        { condition: 'Others joined their cause', modifier: 20 },
        { condition: 'Built something lasting', modifier: 30 },
      ],
      moralePenalty: [
        { condition: 'Vision was set back', modifier: -25 },
        { condition: 'Progress was destroyed', modifier: -30 },
        { condition: 'Called naive or unrealistic', modifier: -10 },
      ],
      special: [
        'Base building +25% efficiency',
        'Recruitment +15% success',
        'Long-term planning bonuses',
      ],
    },
    compatible: ['idealist', 'reformer', 'architect'],
    conflicting: ['nihilist', 'chaos_agent', 'predator'],
    willWorkFor: ['hero_team', 'government', 'corporation'],
    wontWorkFor: ['criminal', 'villain_org'],
    typicalBackgrounds: ['Inventor', 'Leader', 'Entrepreneur', 'Prophet'],
  },

  // =========================================================================
  // POWER CALLINGS
  // =========================================================================

  conqueror: {
    id: 'conqueror',
    name: 'Conqueror',
    description: 'Driven to dominate and control. Power is the only truth.',
    coreDesire: 'Rule over others',
    greatestFear: 'Being ruled or controlled',
    effects: {
      moraleBonus: [
        { condition: 'Gained territory or followers', modifier: 25 },
        { condition: 'Enemy submitted to them', modifier: 30 },
        { condition: 'Displayed dominance', modifier: 15 },
      ],
      moralePenalty: [
        { condition: 'Had to submit to another', modifier: -35 },
        { condition: 'Lost territory or followers', modifier: -25 },
        { condition: 'Was publicly defied', modifier: -20 },
      ],
      combatBonus: {
        condition: 'Fighting to conquer',
        damageMod: 15,
        accuracyMod: 5,
      },
      special: [
        'Intimidation +30%',
        'Will not accept orders from perceived inferiors',
      ],
    },
    compatible: ['architect', 'zealot'],
    conflicting: ['protector', 'liberator', 'idealist', 'repentant'],
    willWorkFor: ['villain_org'],
    wontWorkFor: ['hero_team'],
    typicalBackgrounds: ['Warlord', 'Tyrant', 'Crime Boss', 'Dictator'],
  },

  architect: {
    id: 'architect',
    name: 'Architect',
    description: 'Shapes the world according to their design. Control through systems.',
    coreDesire: 'Order according to their vision',
    greatestFear: 'Chaos undoing their work',
    effects: {
      moraleBonus: [
        { condition: 'Plan came together', modifier: 25 },
        { condition: 'Created lasting structure', modifier: 20 },
        { condition: 'Predicted enemy moves correctly', modifier: 15 },
      ],
      moralePenalty: [
        { condition: 'Plans disrupted by chaos', modifier: -25 },
        { condition: 'Structure they built was destroyed', modifier: -30 },
        { condition: 'Improvisation was required', modifier: -10 },
      ],
      special: [
        'Planning phase +30% effectiveness',
        'Base defense +20%',
        'Prefers indirect methods',
      ],
    },
    compatible: ['visionary', 'conqueror', 'professional'],
    conflicting: ['chaos_agent', 'thrill_seeker'],
    willWorkFor: ['government', 'corporation', 'villain_org', 'hero_team'],
    wontWorkFor: [],
    typicalBackgrounds: ['Mastermind', 'CEO', 'General', 'Bureaucrat'],
  },

  untouchable: {
    id: 'untouchable',
    name: 'Untouchable',
    description: 'Never wants to be vulnerable again. Power as armor.',
    coreDesire: 'Absolute security and independence',
    greatestFear: 'Being helpless again',
    effects: {
      moraleBonus: [
        { condition: 'Demonstrated invulnerability', modifier: 20 },
        { condition: 'Resources increased', modifier: 15 },
        { condition: 'Threat was eliminated permanently', modifier: 25 },
      ],
      moralePenalty: [
        { condition: 'Was injured or captured', modifier: -30 },
        { condition: 'Depended on others', modifier: -15 },
        { condition: 'Vulnerability was exposed', modifier: -25 },
      ],
      combatBonus: {
        condition: 'Fighting to protect themselves',
        evasionMod: 15,
      },
      special: [
        'Resource hoarding tendency',
        'Trust issues (relationship penalties)',
      ],
    },
    compatible: ['survivor', 'collector', 'mercenary'],
    conflicting: ['loyalist', 'romantic', 'shepherd'],
    willWorkFor: ['anyone'],
    wontWorkFor: [],
    typicalBackgrounds: ['Abuse Victim', 'Betrayed', 'Self-Made', 'Ex-Prisoner'],
  },

  // =========================================================================
  // IDENTITY CALLINGS
  // =========================================================================

  outcast: {
    id: 'outcast',
    name: 'Outcast',
    description: 'Rejected by society. Seeks acceptance or proves them all wrong.',
    coreDesire: 'Belonging or vindication',
    greatestFear: 'Eternal rejection',
    effects: {
      moraleBonus: [
        { condition: 'Accepted by group', modifier: 25 },
        { condition: 'Proved doubters wrong', modifier: 20 },
        { condition: 'Found kindred outcasts', modifier: 15 },
      ],
      moralePenalty: [
        { condition: 'Rejected again', modifier: -30 },
        { condition: 'Reminded of outcast status', modifier: -15 },
        { condition: 'Betrayed by trusted person', modifier: -35 },
      ],
      combatBonus: {
        condition: 'Fighting those who rejected them',
        damageMod: 15,
      },
      special: [
        'Bonds strongly with accepting teammates',
        'Suspicious of authority figures',
      ],
    },
    compatible: ['survivor', 'seeker', 'repentant'],
    conflicting: ['glory_hound', 'legacy', 'soldier'],
    willWorkFor: ['anyone'],
    wontWorkFor: [],
    typicalBackgrounds: ['Mutant', 'Ex-Con', 'Minority', 'Disfigured', 'Immigrant'],
  },

  reluctant: {
    id: 'reluctant',
    name: 'Reluctant',
    description: 'Didn\'t ask for this burden. Uses power out of obligation, not desire.',
    coreDesire: 'Return to normal life',
    greatestFear: 'Being trapped in this role forever',
    effects: {
      moraleBonus: [
        { condition: 'Mission ended quickly', modifier: 15 },
        { condition: 'No combat was necessary', modifier: 20 },
        { condition: 'Helped someone else take the burden', modifier: 25 },
      ],
      moralePenalty: [
        { condition: 'Had to use full powers', modifier: -10 },
        { condition: 'Situation escalated', modifier: -15 },
        { condition: 'Reminded they can\'t quit', modifier: -20 },
      ],
      special: [
        'May hesitate in combat',
        'Strong connections outside the life',
        'Resistant to full commitment',
      ],
    },
    compatible: ['protector', 'guardian', 'professional'],
    conflicting: ['glory_hound', 'thrill_seeker', 'zealot'],
    willWorkFor: ['hero_team', 'government'],
    wontWorkFor: ['villain_org', 'criminal'],
    typicalBackgrounds: ['Accidental Hero', 'Drafted', 'Inherited Powers', 'Prophecy'],
  },

  born_to_it: {
    id: 'born_to_it',
    name: 'Born To It',
    description: 'Fully embraces their destiny or heritage. This is who they are.',
    coreDesire: 'Fulfill their potential',
    greatestFear: 'Failing their birthright',
    effects: {
      moraleBonus: [
        { condition: 'Used powers to full effect', modifier: 20 },
        { condition: 'Destiny advanced', modifier: 25 },
        { condition: 'Lived up to heritage', modifier: 15 },
      ],
      moralePenalty: [
        { condition: 'Powers failed them', modifier: -25 },
        { condition: 'Questioned their identity', modifier: -20 },
        { condition: 'Compared unfavorably to predecessors', modifier: -15 },
      ],
      combatBonus: {
        condition: 'Using signature abilities',
        damageMod: 10,
        accuracyMod: 10,
      },
      special: [
        'Identity is secure',
        'May be overconfident',
      ],
    },
    compatible: ['legacy', 'glory_hound', 'protector'],
    conflicting: ['reluctant', 'seeker', 'outcast'],
    willWorkFor: ['anyone'],
    wontWorkFor: [],
    typicalBackgrounds: ['Royalty', 'Chosen One', 'Demigod', 'Super-Baby'],
  },

  // =========================================================================
  // RELATIONSHIP CALLINGS
  // =========================================================================

  loyalist: {
    id: 'loyalist',
    name: 'Loyalist',
    description: 'Devoted to a person, group, or organization above all else.',
    coreDesire: 'Serve their chosen master/cause',
    greatestFear: 'Betraying or being betrayed by them',
    effects: {
      moraleBonus: [
        { condition: 'Object of loyalty was pleased', modifier: 25 },
        { condition: 'Protected their loyalty object', modifier: 20 },
        { condition: 'Received recognition from loyalty object', modifier: 30 },
      ],
      moralePenalty: [
        { condition: 'Disappointed their loyalty object', modifier: -30 },
        { condition: 'Loyalty object was harmed', modifier: -25 },
        { condition: 'Forced to choose between loyalties', modifier: -20 },
      ],
      combatBonus: {
        condition: 'Fighting alongside or for loyalty object',
        accuracyMod: 15,
        moraleImmune: true,
      },
      special: [
        'Unbreakable loyalty (cannot be turned against object)',
        'May follow immoral orders from loyalty object',
      ],
    },
    compatible: ['soldier', 'guardian', 'romantic'],
    conflicting: ['liberator', 'idealist', 'seeker'],
    willWorkFor: ['anyone'],
    wontWorkFor: [],
    typicalBackgrounds: ['Bodyguard', 'Sidekick', 'Retainer', 'Family Member'],
  },

  rival: {
    id: 'rival',
    name: 'Rival',
    description: 'Defined by competition with a specific person. Must prove superiority.',
    coreDesire: 'Defeat their rival',
    greatestFear: 'Being permanently surpassed',
    effects: {
      moraleBonus: [
        { condition: 'Outperformed rival', modifier: 30 },
        { condition: 'Rival acknowledged their superiority', modifier: 35 },
        { condition: 'Gained advantage over rival', modifier: 20 },
      ],
      moralePenalty: [
        { condition: 'Rival outperformed them', modifier: -30 },
        { condition: 'Rival received praise they didn\'t', modifier: -20 },
        { condition: 'Forced to work with rival as equal', modifier: -15 },
      ],
      combatBonus: {
        condition: 'Fighting rival directly',
        damageMod: 20,
        accuracyMod: 15,
      },
      special: [
        'Obsessive focus on rival',
        'May sabotage rival even when counterproductive',
      ],
    },
    compatible: ['glory_hound', 'thrill_seeker'],
    conflicting: ['protector', 'idealist', 'shepherd'],
    willWorkFor: ['anyone'],
    wontWorkFor: [],
    typicalBackgrounds: ['Sibling', 'Ex-Partner', 'Former Ally', 'Sports Competitor'],
  },

  romantic: {
    id: 'romantic',
    name: 'Romantic',
    description: 'Love drives all actions. Everything is for their beloved.',
    coreDesire: 'Be with and protect their love',
    greatestFear: 'Losing their love',
    effects: {
      moraleBonus: [
        { condition: 'With their beloved', modifier: 25 },
        { condition: 'Protected their love', modifier: 30 },
        { condition: 'Love reciprocated', modifier: 20 },
      ],
      moralePenalty: [
        { condition: 'Separated from beloved', modifier: -25 },
        { condition: 'Beloved was harmed', modifier: -35 },
        { condition: 'Beloved rejected them', modifier: -40 },
      ],
      combatBonus: {
        condition: 'Beloved is in danger',
        damageMod: 25,
        accuracyMod: 15,
        moraleImmune: true,
      },
      special: [
        'May abandon mission for beloved',
        'Vulnerable to threats against beloved',
      ],
    },
    compatible: ['guardian', 'loyalist', 'protector'],
    conflicting: ['mercenary', 'nihilist', 'untouchable'],
    willWorkFor: ['anyone'],
    wontWorkFor: [],
    typicalBackgrounds: ['Partner', 'Newlywed', 'Obsessed', 'Soulmate'],
  },

  // =========================================================================
  // DARK CALLINGS
  // =========================================================================

  nihilist: {
    id: 'nihilist',
    name: 'Nihilist',
    description: 'Nothing matters. Existence is meaningless. Why not have fun?',
    coreDesire: 'Nothing (or temporary distraction)',
    greatestFear: 'Finding meaning and having to care',
    effects: {
      moraleBonus: [
        { condition: 'Proved a "truth" was meaningless', modifier: 15 },
        { condition: 'Embraced absurdity', modifier: 10 },
      ],
      moralePenalty: [
        { condition: 'Forced to care about something', modifier: -15 },
        { condition: 'Found meaning temporarily', modifier: -10 },
      ],
      special: [
        'Immune to morale effects (low baseline)',
        'Cannot be motivated by normal means',
        'May abandon mission for no reason',
        'Unpredictable in crisis',
      ],
    },
    compatible: ['chaos_agent', 'thrill_seeker'],
    conflicting: ['idealist', 'protector', 'visionary', 'shepherd'],
    willWorkFor: ['anyone'],
    wontWorkFor: [],
    typicalBackgrounds: ['Depressed', 'Immortal', 'Seen Too Much', 'Philosopher'],
  },

  predator: {
    id: 'predator',
    name: 'Predator',
    description: 'Hunts for the thrill of it. Others are prey.',
    coreDesire: 'The hunt and the kill',
    greatestFear: 'Becoming prey',
    effects: {
      moraleBonus: [
        { condition: 'Hunted and caught quarry', modifier: 25 },
        { condition: 'Dominated weaker opponent', modifier: 20 },
        { condition: 'Instilled fear', modifier: 15 },
      ],
      moralePenalty: [
        { condition: 'Quarry escaped', modifier: -25 },
        { condition: 'Was hunted themselves', modifier: -30 },
        { condition: 'Had to show mercy', modifier: -20 },
      ],
      combatBonus: {
        condition: 'Hunting isolated prey',
        damageMod: 20,
        accuracyMod: 10,
      },
      special: [
        'Tracking +30%',
        'Cannot be trusted with prisoners',
        'May hunt teammates for sport',
      ],
    },
    compatible: ['thrill_seeker', 'conqueror'],
    conflicting: ['protector', 'shepherd', 'repentant', 'idealist'],
    willWorkFor: ['villain_org', 'mercenary_company'],
    wontWorkFor: ['hero_team'],
    typicalBackgrounds: ['Serial Killer', 'Hunter', 'Vampire', 'Feral'],
  },

  chaos_agent: {
    id: 'chaos_agent',
    name: 'Chaos Agent',
    description: 'Tears down order and structure. Watches the world burn.',
    coreDesire: 'Destruction of the status quo',
    greatestFear: 'A stable, ordered world',
    effects: {
      moraleBonus: [
        { condition: 'Caused chaos', modifier: 25 },
        { condition: 'Destroyed institution/structure', modifier: 30 },
        { condition: 'Plans went wrong for everyone', modifier: 20 },
      ],
      moralePenalty: [
        { condition: 'Forced to maintain order', modifier: -25 },
        { condition: 'Things went according to plan', modifier: -15 },
        { condition: 'Stability was restored', modifier: -20 },
      ],
      combatBonus: {
        condition: 'Outnumbered and outgunned',
        evasionMod: 15,
      },
      special: [
        'Sabotage +30%',
        'May sabotage own team',
        'Unpredictable targeting',
      ],
    },
    compatible: ['nihilist', 'thrill_seeker'],
    conflicting: ['architect', 'soldier', 'professional', 'visionary'],
    willWorkFor: ['villain_org', 'vigilante'],
    wontWorkFor: ['government', 'corporation', 'military'],
    typicalBackgrounds: ['Anarchist', 'Joker-type', 'Mad', 'Disillusioned'],
  },
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get a calling by ID
 */
export function getCalling(id: CallingId): Calling {
  return CALLINGS[id];
}

/**
 * Get all callings that work for a given employer type
 */
export function getCallingsForEmployer(employer: EmployerType): Calling[] {
  return Object.values(CALLINGS).filter(c =>
    c.willWorkFor.includes('anyone') || c.willWorkFor.includes(employer)
  ).filter(c =>
    !c.wontWorkFor.includes(employer)
  );
}

/**
 * Check if two callings are compatible (for team chemistry)
 */
export function areCallingsCompatible(a: CallingId, b: CallingId): 'compatible' | 'neutral' | 'conflicting' {
  const callingA = CALLINGS[a];
  const callingB = CALLINGS[b];

  if (callingA.compatible.includes(b) || callingB.compatible.includes(a)) {
    return 'compatible';
  }
  if (callingA.conflicting.includes(b) || callingB.conflicting.includes(a)) {
    return 'conflicting';
  }
  return 'neutral';
}

/**
 * Calculate team chemistry based on callings
 * Returns -100 to +100
 */
export function calculateTeamChemistry(callings: CallingId[]): number {
  if (callings.length < 2) return 0;

  let compatible = 0;
  let conflicting = 0;
  let comparisons = 0;

  for (let i = 0; i < callings.length; i++) {
    for (let j = i + 1; j < callings.length; j++) {
      const result = areCallingsCompatible(callings[i], callings[j]);
      if (result === 'compatible') compatible++;
      if (result === 'conflicting') conflicting++;
      comparisons++;
    }
  }

  if (comparisons === 0) return 0;
  return Math.round(((compatible - conflicting) / comparisons) * 100);
}

/**
 * Get morale modifier for a mission outcome
 */
export function getMoraleModifier(
  calling: CallingId,
  outcomes: string[]
): number {
  const callingData = CALLINGS[calling];
  let modifier = 0;

  for (const outcome of outcomes) {
    // Check bonuses
    const bonus = callingData.effects.moraleBonus.find(b =>
      outcome.toLowerCase().includes(b.condition.toLowerCase())
    );
    if (bonus) modifier += bonus.modifier;

    // Check penalties
    const penalty = callingData.effects.moralePenalty.find(p =>
      outcome.toLowerCase().includes(p.condition.toLowerCase())
    );
    if (penalty) modifier += penalty.modifier;
  }

  return modifier;
}

/**
 * Generate a random calling appropriate for a background
 */
export function generateCallingForBackground(background: string): CallingId {
  // Find callings that list this background
  const matches = Object.values(CALLINGS).filter(c =>
    c.typicalBackgrounds.some(b =>
      b.toLowerCase().includes(background.toLowerCase()) ||
      background.toLowerCase().includes(b.toLowerCase())
    )
  );

  if (matches.length > 0) {
    return matches[Math.floor(Math.random() * matches.length)].id;
  }

  // Default distribution
  const common: CallingId[] = [
    'soldier', 'professional', 'mercenary', 'protector',
    'survivor', 'thrill_seeker', 'loyalist'
  ];
  return common[Math.floor(Math.random() * common.length)];
}

/**
 * Get calling categories for UI grouping
 */
export function getCallingCategories(): Record<string, CallingId[]> {
  return {
    'Protective': ['protector', 'guardian', 'shepherd'],
    'Justice': ['avenger', 'reformer', 'liberator'],
    'Redemption': ['repentant', 'survivor', 'seeker'],
    'Duty': ['soldier', 'professional', 'legacy'],
    'Self-Interest': ['mercenary', 'glory_hound', 'thrill_seeker', 'collector'],
    'Ideology': ['idealist', 'zealot', 'visionary'],
    'Power': ['conqueror', 'architect', 'untouchable'],
    'Identity': ['outcast', 'reluctant', 'born_to_it'],
    'Relationships': ['loyalist', 'rival', 'romantic'],
    'Dark': ['nihilist', 'predator', 'chaos_agent'],
  };
}

export default {
  CALLINGS,
  getCalling,
  getCallingsForEmployer,
  areCallingsCompatible,
  calculateTeamChemistry,
  getMoraleModifier,
  generateCallingForBackground,
  getCallingCategories,
};
