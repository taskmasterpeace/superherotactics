/**
 * Investigation System
 *
 * Implements branching investigation gameplay:
 * - Discover leads from news/patrol/informants
 * - Assign investigators with relevant skills
 * - Choose investigation approaches (stealth/direct/social)
 * - Progress based on skill checks vs difficulty
 * - Branching outcomes based on choices
 * - Success -> mission unlock or intel
 * - Failure -> alert enemies, lose lead
 */

import { GameCharacter } from '../types'

// =============================================================================
// INVESTIGATION TYPES
// =============================================================================

export type InvestigationStatus =
  | 'discovered'      // Lead found, not started
  | 'active'          // Investigation in progress
  | 'completed'       // Successfully completed
  | 'failed'          // Investigation failed
  | 'expired'         // Time limit exceeded

export type InvestigationType =
  | 'crime'           // Street crime, gangs
  | 'conspiracy'      // Cover-ups, corruption
  | 'terrorism'       // Terrorist plots
  | 'underworld'      // Organized crime
  | 'corporate'       // Corporate malfeasance
  | 'espionage'       // Spy activities

export type ApproachType =
  | 'stealth'         // Covert surveillance, avoid detection
  | 'direct'          // Overt questioning, legal authority
  | 'social'          // Networking, informants, charm
  | 'technical'       // Hacking, forensics, analysis
  | 'intimidation'    // Threats, force

export type InvestigationPhase =
  | 'gathering'       // Initial information gathering
  | 'following_leads' // Pursuing specific leads
  | 'confrontation'   // Direct engagement with suspects
  | 'resolution'      // Final phase before conclusion

// =============================================================================
// INVESTIGATION INTERFACES
// =============================================================================

export interface Investigation {
  id: string
  title: string
  description: string
  type: InvestigationType
  status: InvestigationStatus

  // Location
  city: string
  country: string
  sector: string

  // Difficulty
  difficulty: number  // 1-10
  dangerLevel: number // 1-10

  // Progress
  currentPhase: InvestigationPhase
  progress: number  // 0-100
  cluesGathered: Clue[]
  decisionsLog: Decision[]

  // Assignment
  assignedCharacters: string[]  // Character IDs

  // Time constraints
  discoveredAt: number  // Game timestamp
  expiresAt?: number    // Optional deadline
  hoursRemaining?: number

  // Stakes
  potentialReward: {
    cash: number
    fame: number
    intel: string[]
    missionUnlocked?: string  // Mission template ID
  }

  // Consequences
  suspicionLevel: number  // 0-100, how much enemies are alerted
  publicExposure: number  // 0-100, how public investigation is

  // Current state
  availableApproaches: ApproachType[]
  lastActionResult?: ActionResult
}

export interface Clue {
  id: string
  description: string
  foundBy: string  // Character ID
  foundAt: number  // Game timestamp
  quality: 'weak' | 'moderate' | 'strong'
  relatesTo: string[]  // Tags like 'location', 'suspect', 'motive'
}

export interface Decision {
  id: string
  timestamp: number
  phase: InvestigationPhase
  chosenApproach: ApproachType
  characterId: string
  skillRoll: {
    skill: string
    characterValue: number
    difficulty: number
    roll: number
    success: boolean
  }
  outcome: string
  consequenceType: 'progress' | 'setback' | 'neutral' | 'critical'
}

export interface ActionResult {
  success: boolean
  message: string
  progressGained: number
  cluesFound: Clue[]
  suspicionChange: number
  exposureChange: number
  consequenceType: 'progress' | 'setback' | 'neutral' | 'critical'
  nextPhase?: InvestigationPhase
}

// =============================================================================
// INVESTIGATION TEMPLATES
// =============================================================================

export interface InvestigationTemplate {
  title: string
  description: string
  type: InvestigationType
  difficulty: number
  dangerLevel: number
  phases: {
    gathering: string
    following_leads: string
    confrontation: string
    resolution: string
  }
  potentialClues: string[]
  successReward: {
    cash: number
    fame: number
    intel: string[]
    missionUnlocked?: string
  }
  failureConsequence: string
  // Education requirements - character must have one of these fields to start
  requiredEducation?: string[]
  // Approach bonuses based on education
  educationBonuses?: Record<string, { approach: ApproachType; bonus: number }>
}

export const INVESTIGATION_TEMPLATES: InvestigationTemplate[] = [
  // Crime investigations
  {
    title: 'Drug Distribution Ring',
    description: 'Local dealers running operations in the industrial district. Track the supply chain.',
    type: 'crime',
    difficulty: 4,
    dangerLevel: 5,
    phases: {
      gathering: 'Identify street-level dealers and their territories',
      following_leads: 'Surveil drop points and track supplier movements',
      confrontation: 'Raid the warehouse or infiltrate the distribution network',
      resolution: 'Decide whether to arrest leaders or flip them as informants'
    },
    potentialClues: [
      'Supplier delivery schedule',
      'Warehouse location',
      'Money laundering front business',
      'Corrupt police contact',
      'Gang protection arrangement'
    ],
    successReward: {
      cash: 15000,
      fame: 50,
      intel: ['drug_network_contacts', 'corrupt_officials'],
      missionUnlocked: 'skirmish_gang'
    },
    failureConsequence: 'Drug ring relocates operations and increases security',
    // Psychology or Interrogation helps with informants
    educationBonuses: {
      'psychology': { approach: 'social', bonus: 20 },
      'interrogation': { approach: 'intimidation', bonus: 25 }
    }
  },

  {
    title: 'Serial Robbery Crew',
    description: 'Professional crew hitting banks and armored cars with military precision.',
    type: 'crime',
    difficulty: 5,
    dangerLevel: 6,
    phases: {
      gathering: 'Analyze robbery patterns and crew modus operandi',
      following_leads: 'Identify crew members through fences and getaway vehicles',
      confrontation: 'Set up ambush at their next predicted target',
      resolution: 'Capture crew during robbery or raid their safehouse'
    },
    potentialClues: [
      'Next target location',
      'Crew vehicle descriptions',
      'Weapons dealer contact',
      'Safehouse address',
      'Inside man at security company'
    ],
    successReward: {
      cash: 25000,
      fame: 75,
      intel: ['robbery_techniques', 'weapons_dealer'],
      missionUnlocked: 'protect_location'
    },
    failureConsequence: 'Crew completes major heist and goes underground',
    // Tactical analysis helps predict their moves
    educationBonuses: {
      'forensics': { approach: 'technical', bonus: 25 },
      'tactical_operations': { approach: 'direct', bonus: 20 },
      'criminal_justice': { approach: 'direct', bonus: 15 }
    }
  },

  {
    title: 'Human Trafficking Operation',
    description: 'Suspected trafficking through the port. Victims need rescue.',
    type: 'crime',
    difficulty: 7,
    dangerLevel: 8,
    phases: {
      gathering: 'Identify victims and trafficking routes through port',
      following_leads: 'Infiltrate shipping company or track transport vehicles',
      confrontation: 'Raid holding facility before victims are moved',
      resolution: 'Rescue victims and dismantle entire trafficking network'
    },
    potentialClues: [
      'Shipping manifests with coded entries',
      'Holding facility location',
      'Corrupt port official',
      'Transport schedule',
      'Buyer network connections'
    ],
    successReward: {
      cash: 10000,  // Lower cash, higher fame
      fame: 150,
      intel: ['trafficking_routes', 'international_contacts'],
      missionUnlocked: 'rescue_hostage'
    },
    failureConsequence: 'Victims disappear, operation moves to new location',
    // Psychology helps with victim interviews, languages for communication
    educationBonuses: {
      'psychology': { approach: 'social', bonus: 25 },
      'foreign_languages': { approach: 'social', bonus: 20 },
      'forensics': { approach: 'technical', bonus: 20 }
    }
  },

  // Conspiracy investigations
  {
    title: 'Corporate Cover-up',
    description: 'Tech company hiding dangerous research results. Whistleblower fears for their life.',
    type: 'conspiracy',
    difficulty: 6,
    dangerLevel: 5,
    phases: {
      gathering: 'Meet whistleblower and review leaked documents',
      following_leads: 'Investigate corporate security and research division',
      confrontation: 'Break into facility to gather hard evidence',
      resolution: 'Expose corporation or leverage evidence for cooperation'
    },
    potentialClues: [
      'Research data showing dangers',
      'Executive emails discussing cover-up',
      'Security team monitoring whistleblower',
      'Secret facility location',
      'Government regulator being bribed'
    ],
    successReward: {
      cash: 20000,
      fame: 100,
      intel: ['corporate_secrets', 'corrupt_regulators'],
      missionUnlocked: 'infiltrate'
    },
    failureConsequence: 'Whistleblower disappears, evidence destroyed',
    // Hacking and business knowledge essential
    educationBonuses: {
      'hacking': { approach: 'technical', bonus: 30 },
      'business_administration': { approach: 'social', bonus: 20 },
      'engineering': { approach: 'technical', bonus: 15 }
    }
  },

  {
    title: 'Political Corruption Ring',
    description: 'City officials taking bribes. Trail leads to powerful interests.',
    type: 'conspiracy',
    difficulty: 8,
    dangerLevel: 6,
    phases: {
      gathering: 'Follow money trail through shell companies',
      following_leads: 'Surveil officials and identify bribe sources',
      confrontation: 'Gather evidence of cash exchange or illegal meetings',
      resolution: 'Expose corruption publicly or use leverage privately'
    },
    potentialClues: [
      'Shell company ownership documents',
      'Bribe payment schedule',
      'Secret meeting location',
      'Compromising photos/recordings',
      'Offshore account details'
    ],
    successReward: {
      cash: 30000,
      fame: 125,
      intel: ['political_connections', 'money_laundering_networks'],
      missionUnlocked: 'investigate_conspiracy'
    },
    failureConsequence: 'Officials clean house, investigation shut down by authorities',
    // Financial and legal expertise crucial
    educationBonuses: {
      'economics': { approach: 'technical', bonus: 25 },
      'law': { approach: 'direct', bonus: 25 },
      'psychology': { approach: 'social', bonus: 20 }
    }
  },

  {
    title: 'Missing Persons Pattern',
    description: 'Too many disappearances in one area to be coincidence. Something sinister.',
    type: 'conspiracy',
    difficulty: 7,
    dangerLevel: 9,
    phases: {
      gathering: 'Map disappearances and identify commonalities',
      following_leads: 'Investigate last known locations and witnesses',
      confrontation: 'Discover hidden facility or underground operation',
      resolution: 'Rescue survivors and stop whoever is behind it'
    },
    potentialClues: [
      'Victim profile pattern',
      'Abandoned vehicle locations',
      'Underground facility entrance',
      'Suspect vehicle descriptions',
      'Ritual or experimental purpose'
    ],
    successReward: {
      cash: 15000,
      fame: 200,  // High fame for saving lives
      intel: ['secret_facility', 'occult_activities'],
      missionUnlocked: 'rescue_agent'
    },
    failureConsequence: 'More people disappear, trail goes completely cold',
    // Forensic and psychological profiling
    educationBonuses: {
      'forensics': { approach: 'technical', bonus: 30 },
      'psychology': { approach: 'social', bonus: 25 },
      'criminal_psychology': { approach: 'technical', bonus: 30 }
    }
  },

  // Terrorism investigations
  {
    title: 'Bomb Threat Intelligence',
    description: 'Chatter about upcoming attack. Race against time to find the device.',
    type: 'terrorism',
    difficulty: 8,
    dangerLevel: 10,
    phases: {
      gathering: 'Analyze intelligence chatter and identify cell members',
      following_leads: 'Track bomb materials purchases and cell communications',
      confrontation: 'Raid cell safehouse or intercept bomb delivery',
      resolution: 'Locate and defuse bomb or capture bomb-maker'
    },
    potentialClues: [
      'Target building identified',
      'Bomb components supplier',
      'Cell member identities',
      'Safehouse location',
      'Attack timeline'
    ],
    successReward: {
      cash: 50000,
      fame: 250,
      intel: ['terrorist_network', 'bomb_making_techniques'],
      missionUnlocked: 'assassinate_target'
    },
    failureConsequence: 'Bomb detonates, massive casualties and public panic',
    // REQUIRES intelligence/military training for this high-stakes investigation
    requiredEducation: ['intelligence_analysis', 'counter_terrorism', 'military_science'],
    educationBonuses: {
      'explosives': { approach: 'technical', bonus: 35 },
      'engineering': { approach: 'technical', bonus: 25 },
      'intelligence_analysis': { approach: 'direct', bonus: 30 }
    }
  },

  {
    title: 'Extremist Recruitment Cell',
    description: 'Radicals recruiting in the community. Stop them before they radicalize more.',
    type: 'terrorism',
    difficulty: 5,
    dangerLevel: 6,
    phases: {
      gathering: 'Identify recruiters and their meeting locations',
      following_leads: 'Infiltrate meetings or turn a recruit into informant',
      confrontation: 'Gather evidence of illegal activities and funding',
      resolution: 'Arrest cell leaders or disrupt recruitment permanently'
    },
    potentialClues: [
      'Recruiter identities and methods',
      'Funding sources',
      'Training camp location',
      'Communication channels',
      'Planned activities'
    ],
    successReward: {
      cash: 12000,
      fame: 80,
      intel: ['extremist_ideology', 'funding_network'],
      missionUnlocked: 'infiltrate'
    },
    failureConsequence: 'Cell goes underground, recruits disappear to training camps',
    // Psychology and sociology help understand radicalization
    educationBonuses: {
      'psychology': { approach: 'social', bonus: 25 },
      'sociology': { approach: 'social', bonus: 25 },
      'foreign_languages': { approach: 'stealth', bonus: 20 }
    }
  },

  // Underworld investigations
  {
    title: 'Gang War Brewing',
    description: 'Tensions rising between rival gangs. Blood will flow unless someone intervenes.',
    type: 'underworld',
    difficulty: 4,
    dangerLevel: 7,
    phases: {
      gathering: 'Map gang territories and identify key players',
      following_leads: 'Determine source of conflict and planned attacks',
      confrontation: 'Prevent initial attack or broker peace',
      resolution: 'Stop war through force or negotiation'
    },
    potentialClues: [
      'Gang leadership structure',
      'Weapon cache locations',
      'First strike plan',
      'Neutral parties who could mediate',
      'Root cause of conflict'
    ],
    successReward: {
      cash: 8000,
      fame: 60,
      intel: ['gang_territories', 'underworld_contacts'],
      missionUnlocked: 'skirmish_militia'
    },
    failureConsequence: 'Gang war erupts, civilian casualties mount',
    // Street smarts and intimidation work best here
    educationBonuses: {
      'psychology': { approach: 'social', bonus: 20 },
      'criminal_justice': { approach: 'direct', bonus: 15 },
      'interrogation': { approach: 'intimidation', bonus: 30 }
    }
  },

  {
    title: 'New Crime Boss Rising',
    description: 'Someone new is consolidating power in the underworld. Find out who and why.',
    type: 'underworld',
    difficulty: 6,
    dangerLevel: 7,
    phases: {
      gathering: 'Identify new operations and territories being claimed',
      following_leads: 'Track back to the boss through their lieutenants',
      confrontation: 'Infiltrate their operation or confront them directly',
      resolution: 'Take down the boss or turn them into an asset'
    },
    potentialClues: [
      'Boss identity and background',
      'Power base and resources',
      'Weaknesses and rivals',
      'Headquarters location',
      'Plans for expansion'
    ],
    successReward: {
      cash: 25000,
      fame: 90,
      intel: ['crime_boss_network', 'underworld_hierarchy'],
      missionUnlocked: 'assassinate_warlord'
    },
    failureConsequence: 'Boss consolidates power, becomes untouchable',
    // Intelligence work and intimidation essential
    educationBonuses: {
      'intelligence_analysis': { approach: 'technical', bonus: 25 },
      'psychology': { approach: 'social', bonus: 20 },
      'interrogation': { approach: 'intimidation', bonus: 30 }
    }
  },

  // Corporate espionage
  {
    title: 'Industrial Espionage',
    description: 'Company secrets being stolen. Corporate warfare turning deadly.',
    type: 'espionage',
    difficulty: 7,
    dangerLevel: 5,
    phases: {
      gathering: 'Identify what information is being stolen and how',
      following_leads: 'Track the spy or hacker responsible',
      confrontation: 'Catch spy in the act or trace digital intrusion',
      resolution: 'Capture spy and recover stolen data'
    },
    potentialClues: [
      'Spy identity or hacker signature',
      'Data exfiltration methods',
      'Client paying for espionage',
      'Inside collaborator',
      'Dead drop locations'
    ],
    successReward: {
      cash: 35000,
      fame: 40,  // Low fame, corporate prefers discretion
      intel: ['corporate_espionage_techniques', 'competing_corporations'],
      missionUnlocked: 'extract_data'
    },
    failureConsequence: 'All valuable data stolen, company suffers major losses',
    // Technical expertise required
    educationBonuses: {
      'hacking': { approach: 'technical', bonus: 35 },
      'engineering': { approach: 'technical', bonus: 25 },
      'business_administration': { approach: 'social', bonus: 15 }
    }
  },

  {
    title: 'Foreign Intelligence Operation',
    description: 'Hostile foreign agents operating in the city. National security at risk.',
    type: 'espionage',
    difficulty: 9,
    dangerLevel: 8,
    phases: {
      gathering: 'Identify foreign operatives and their objectives',
      following_leads: 'Surveil agents and map their network',
      confrontation: 'Intercept intelligence handoff or raid safehouse',
      resolution: 'Capture agents or feed disinformation'
    },
    potentialClues: [
      'Agent identities and covers',
      'Intelligence objectives',
      'Communication protocols',
      'Safehouse locations',
      'Handler identity'
    ],
    successReward: {
      cash: 60000,
      fame: 150,
      intel: ['foreign_intelligence_networks', 'spy_tradecraft'],
      missionUnlocked: 'extract_vip'
    },
    failureConsequence: 'Critical intelligence compromised, national security breach',
    // REQUIRES advanced intelligence training - highest tier investigation
    requiredEducation: ['intelligence_analysis', 'tradecraft', 'counter_intelligence'],
    educationBonuses: {
      'tradecraft': { approach: 'stealth', bonus: 35 },
      'intelligence_analysis': { approach: 'technical', bonus: 30 },
      'foreign_languages': { approach: 'social', bonus: 25 },
      'counter_intelligence': { approach: 'direct', bonus: 30 }
    }
  }
]

// =============================================================================
// APPROACH MECHANICS
// =============================================================================

export interface ApproachConfig {
  name: string
  description: string
  primarySkills: string[]  // Skills that help this approach
  successBonuses: {
    progressGain: number  // Extra progress on success
    clueQuality: 'weak' | 'moderate' | 'strong'
  }
  failurePenalties: {
    suspicionIncrease: number
    exposureIncrease: number
  }
  riskLevel: 'low' | 'medium' | 'high' | 'extreme'
}

export const APPROACH_CONFIGS: Record<ApproachType, ApproachConfig> = {
  stealth: {
    name: 'Stealth Approach',
    description: 'Covert surveillance, avoid detection, gather intel quietly',
    primarySkills: ['AGL', 'INT', 'Stealth', 'Surveillance'],
    successBonuses: {
      progressGain: 15,
      clueQuality: 'strong'
    },
    failurePenalties: {
      suspicionIncrease: 30,  // If caught, big problem
      exposureIncrease: 10
    },
    riskLevel: 'high'
  },

  direct: {
    name: 'Direct Approach',
    description: 'Overt questioning, legal authority, public investigation',
    primarySkills: ['CON', 'INT', 'Investigation', 'Authority'],
    successBonuses: {
      progressGain: 20,
      clueQuality: 'moderate'
    },
    failurePenalties: {
      suspicionIncrease: 15,
      exposureIncrease: 40  // Very public
    },
    riskLevel: 'medium'
  },

  social: {
    name: 'Social Approach',
    description: 'Networking, informants, charm and persuasion',
    primarySkills: ['CON', 'INT', 'Charm', 'Contacts'],
    successBonuses: {
      progressGain: 12,
      clueQuality: 'moderate'
    },
    failurePenalties: {
      suspicionIncrease: 10,  // Low suspicion
      exposureIncrease: 20
    },
    riskLevel: 'low'
  },

  technical: {
    name: 'Technical Approach',
    description: 'Hacking, forensics, data analysis, digital investigation',
    primarySkills: ['INT', 'INS', 'Hacking', 'Forensics'],
    successBonuses: {
      progressGain: 18,
      clueQuality: 'strong'
    },
    failurePenalties: {
      suspicionIncrease: 25,  // Digital traces can alert
      exposureIncrease: 5     // Can be done remotely
    },
    riskLevel: 'medium'
  },

  intimidation: {
    name: 'Intimidation Approach',
    description: 'Threats, force, aggressive interrogation',
    primarySkills: ['STR', 'MEL', 'Intimidate', 'Combat'],
    successBonuses: {
      progressGain: 25,  // Fast results
      clueQuality: 'weak'  // Scared people lie
    },
    failurePenalties: {
      suspicionIncrease: 40,  // Very alerting
      exposureIncrease: 50    // Very public
    },
    riskLevel: 'extreme'
  }
}

// =============================================================================
// SKILL CHECK SYSTEM
// =============================================================================

export function performSkillCheck(
  character: GameCharacter,
  approach: ApproachType,
  difficulty: number
): { success: boolean; roll: number; characterValue: number; skill: string } {
  const config = APPROACH_CONFIGS[approach]

  // Find best matching skill from character
  let highestSkillValue = 0
  let selectedSkill = config.primarySkills[0]

  config.primarySkills.forEach(skillName => {
    // Check if it's a base stat
    if (skillName in character.stats) {
      const statValue = character.stats[skillName as keyof typeof character.stats]
      if (statValue > highestSkillValue) {
        highestSkillValue = statValue
        selectedSkill = skillName
      }
    }
    // Could also check character.skills array if we implement skill system
  })

  // Roll d100
  const roll = Math.floor(Math.random() * 100) + 1

  // Success if: roll + characterValue >= difficulty
  const total = roll + highestSkillValue
  const success = total >= difficulty

  return {
    success,
    roll,
    characterValue: highestSkillValue,
    skill: selectedSkill
  }
}

// =============================================================================
// INVESTIGATION PROGRESSION
// =============================================================================

export function advanceInvestigation(
  investigation: Investigation,
  character: GameCharacter,
  approach: ApproachType
): ActionResult {
  // Calculate difficulty based on phase
  const phaseDifficulty = {
    gathering: investigation.difficulty * 8,
    following_leads: investigation.difficulty * 10,
    confrontation: investigation.difficulty * 12,
    resolution: investigation.difficulty * 15
  }

  const difficulty = phaseDifficulty[investigation.currentPhase]

  // Perform skill check
  const skillCheck = performSkillCheck(character, approach, difficulty)
  const approachConfig = APPROACH_CONFIGS[approach]

  let result: ActionResult

  if (skillCheck.success) {
    // Success - gain progress
    const progressGained = approachConfig.successBonuses.progressGain + Math.floor(Math.random() * 10)
    const newProgress = Math.min(100, investigation.progress + progressGained)

    // Generate clue
    const clue: Clue = {
      id: `clue-${Date.now()}`,
      description: `Found through ${approach} approach`,
      foundBy: character.id,
      foundAt: Date.now(),
      quality: approachConfig.successBonuses.clueQuality,
      relatesTo: [investigation.currentPhase]
    }

    // Check if phase complete
    let nextPhase: InvestigationPhase | undefined
    if (newProgress >= 100) {
      nextPhase = getNextPhase(investigation.currentPhase)
    }

    result = {
      success: true,
      message: `${character.name} successfully used ${approach} approach. ${nextPhase ? 'Phase complete!' : 'Making progress...'}`,
      progressGained,
      cluesFound: [clue],
      suspicionChange: 0,
      exposureChange: approachConfig.failurePenalties.exposureIncrease / 2,  // Small exposure even on success
      consequenceType: nextPhase ? 'critical' : 'progress',
      nextPhase
    }
  } else {
    // Failure - increase suspicion
    result = {
      success: false,
      message: `${character.name}'s ${approach} approach failed. The investigation has been compromised!`,
      progressGained: 0,
      cluesFound: [],
      suspicionChange: approachConfig.failurePenalties.suspicionIncrease,
      exposureChange: approachConfig.failurePenalties.exposureIncrease,
      consequenceType: 'setback'
    }
  }

  return result
}

function getNextPhase(currentPhase: InvestigationPhase): InvestigationPhase | undefined {
  const phaseOrder: InvestigationPhase[] = ['gathering', 'following_leads', 'confrontation', 'resolution']
  const currentIndex = phaseOrder.indexOf(currentPhase)
  return phaseOrder[currentIndex + 1]
}

// =============================================================================
// INVESTIGATION GENERATION
// =============================================================================

export function generateInvestigation(
  template: InvestigationTemplate,
  city: string,
  country: string,
  sector: string
): Investigation {
  return {
    id: `inv-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
    title: template.title,
    description: template.description,
    type: template.type,
    status: 'discovered',
    city,
    country,
    sector,
    difficulty: template.difficulty,
    dangerLevel: template.dangerLevel,
    currentPhase: 'gathering',
    progress: 0,
    cluesGathered: [],
    decisionsLog: [],
    assignedCharacters: [],
    discoveredAt: Date.now(),
    expiresAt: Date.now() + (48 * 60 * 60 * 1000),  // 48 hours
    hoursRemaining: 48,
    potentialReward: template.successReward,
    suspicionLevel: 0,
    publicExposure: 0,
    availableApproaches: ['stealth', 'direct', 'social', 'technical', 'intimidation']
  }
}

export default {
  INVESTIGATION_TEMPLATES,
  APPROACH_CONFIGS,
  generateInvestigation,
  advanceInvestigation,
  performSkillCheck
}
