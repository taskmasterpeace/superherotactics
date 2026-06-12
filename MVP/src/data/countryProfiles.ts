/**
 * Country Profiles - Distinct Character Generation by Country
 *
 * Each country has:
 * - Origin weights (what types of characters are common)
 * - Stat tendencies (cultural stat modifiers)
 * - Education focus (what skills are commonly trained)
 * - Cultural traits (flavor text for UI)
 */

import { Country, getCountryByCode, getCountryByName, ALL_COUNTRIES } from './countries';

// Origin types from characterSheet.ts
export type OriginType =
  | 'skilled_human'
  | 'trained_soldier'
  | 'altered_human'
  | 'tech_enhanced'
  | 'spiritual'
  | 'mutated'
  | 'synthetic'
  | 'symbiotic'
  | 'alien';

// Character roles for filtering in UI
export type CharacterRole =
  | 'soldier'      // Combat, Tactics, Weapons
  | 'specialist'   // Hacking, Electronics, Robotics
  | 'scientist'    // Medicine, Chemistry, Genetics
  | 'investigator' // Forensics, Psychology, Languages
  | 'operative'    // Undercover, Tradecraft, Interrogation
  | 'support';     // Medicine, Engineering, Logistics

// Education fields that characters can have
export type EducationField =
  | 'military_tactics'
  | 'weapons_systems'
  | 'martial_arts'
  | 'combat_sciences'
  | 'combat_medicine'
  | 'demolitions'
  | 'robotics'
  | 'cybernetics'
  | 'hacking'
  | 'electronics'
  | 'weapons_smithing'
  | 'engineering'
  | 'medicine'
  | 'biology'
  | 'chemistry'
  | 'genetics'
  | 'forensics'
  | 'surgery'
  | 'psychology'
  | 'interrogation'
  | 'diplomacy'
  | 'languages'
  | 'investigation'
  | 'undercover'
  | 'tradecraft'
  | 'logistics'
  | 'super_science'
  | 'mystical_studies'
  | 'underground_ops';

/**
 * Education field metadata for UI display and investigation bonuses
 */
export const EDUCATION_FIELDS: Record<EducationField, {
  label: string;
  category: 'combat' | 'tech' | 'science' | 'intel' | 'special';
  investigationBonus?: number;
}> = {
  military_tactics: { label: 'Military Tactics', category: 'combat', investigationBonus: 15 },
  weapons_systems: { label: 'Weapons Systems', category: 'combat' },
  martial_arts: { label: 'Martial Arts', category: 'combat' },
  combat_sciences: { label: 'Combat Sciences', category: 'combat' },
  combat_medicine: { label: 'Combat Medicine', category: 'combat', investigationBonus: 10 },
  demolitions: { label: 'Demolitions', category: 'combat' },
  robotics: { label: 'Robotics', category: 'tech', investigationBonus: 20 },
  cybernetics: { label: 'Cybernetics', category: 'tech', investigationBonus: 15 },
  hacking: { label: 'Hacking', category: 'tech', investigationBonus: 30 },
  electronics: { label: 'Electronics', category: 'tech', investigationBonus: 20 },
  weapons_smithing: { label: 'Weapons Smithing', category: 'tech' },
  engineering: { label: 'Engineering', category: 'tech', investigationBonus: 15 },
  medicine: { label: 'Medicine', category: 'science', investigationBonus: 15 },
  biology: { label: 'Biology', category: 'science', investigationBonus: 10 },
  chemistry: { label: 'Chemistry', category: 'science', investigationBonus: 20 },
  genetics: { label: 'Genetics', category: 'science', investigationBonus: 15 },
  forensics: { label: 'Forensics', category: 'science', investigationBonus: 25 },
  surgery: { label: 'Surgery', category: 'science', investigationBonus: 10 },
  psychology: { label: 'Psychology', category: 'intel', investigationBonus: 25 },
  interrogation: { label: 'Interrogation', category: 'intel', investigationBonus: 20 },
  diplomacy: { label: 'Diplomacy', category: 'intel', investigationBonus: 15 },
  languages: { label: 'Languages', category: 'intel', investigationBonus: 20 },
  investigation: { label: 'Investigation', category: 'intel', investigationBonus: 30 },
  undercover: { label: 'Undercover Ops', category: 'intel', investigationBonus: 25 },
  tradecraft: { label: 'Tradecraft', category: 'intel', investigationBonus: 25 },
  logistics: { label: 'Logistics', category: 'intel' },
  super_science: { label: 'Super Science', category: 'special', investigationBonus: 20 },
  mystical_studies: { label: 'Mystical Studies', category: 'special', investigationBonus: 15 },
  underground_ops: { label: 'Underground Ops', category: 'special', investigationBonus: 15 },
};

export interface CountryProfile {
  countryCode: string;
  countryName: string;

  // Origin distribution (weights 0-100, higher = more common)
  originWeights: Partial<Record<OriginType, number>>;

  // Stat tendencies (modifiers -10 to +10, applied during generation)
  statTendencies: {
    MEL?: number;
    AGL?: number;
    STR?: number;
    STA?: number;
    INT?: number;
    INS?: number;
    CON?: number;
  };

  // Education focus (weights 0-100, higher = more common)
  educationWeights: Partial<Record<EducationField, number>>;

  // UI flavor
  culturalTraits: string[];
  tagline: string;
}

/**
 * Role definition with primary skills for role classification
 */
export interface RoleDefinition {
  id: CharacterRole;
  name: string;
  description: string;
  primarySkills: EducationField[];  // Education field names that contribute to this role
  icon: string;  // Emoji
}

/**
 * Character roles with their definitions
 * Used for role classification based on education/skills
 */
export const CHARACTER_ROLES: Record<CharacterRole, RoleDefinition> = {
  soldier: {
    id: 'soldier',
    name: 'Soldier',
    description: 'Direct combat, frontline fighter',
    primarySkills: ['military_tactics', 'weapons_systems', 'combat_medicine', 'combat_sciences', 'martial_arts', 'demolitions'],
    icon: '⚔️'
  },
  specialist: {
    id: 'specialist',
    name: 'Specialist',
    description: 'Tech solutions, security bypass',
    primarySkills: ['hacking', 'electronics', 'robotics', 'cybernetics', 'engineering', 'weapons_smithing'],
    icon: '🔧'
  },
  scientist: {
    id: 'scientist',
    name: 'Scientist',
    description: 'Research, healing, analysis',
    primarySkills: ['medicine', 'chemistry', 'genetics', 'biology', 'forensics', 'surgery', 'super_science'],
    icon: '🔬'
  },
  investigator: {
    id: 'investigator',
    name: 'Investigator',
    description: 'Solve cases, gather intel',
    primarySkills: ['forensics', 'psychology', 'investigation', 'languages'],
    icon: '🔍'
  },
  operative: {
    id: 'operative',
    name: 'Operative',
    description: 'Infiltration, social engineering',
    primarySkills: ['undercover', 'tradecraft', 'interrogation', 'diplomacy', 'underground_ops'],
    icon: '🎭'
  },
  support: {
    id: 'support',
    name: 'Support',
    description: 'Healing, repairs, logistics',
    primarySkills: ['medicine', 'engineering', 'logistics', 'electronics', 'combat_medicine'],
    icon: '🛡️'
  }
};

// Legacy export for backward compatibility
export const ROLE_DESCRIPTIONS: Record<CharacterRole, { name: string; icon: string; description: string; skills: string[] }> = {
  soldier: {
    name: CHARACTER_ROLES.soldier.name,
    icon: CHARACTER_ROLES.soldier.icon,
    description: 'Combat specialist for frontline operations',
    skills: ['Combat', 'Tactics', 'Weapons', 'Martial Arts']
  },
  specialist: {
    name: CHARACTER_ROLES.specialist.name,
    icon: CHARACTER_ROLES.specialist.icon,
    description: 'Technology expert for bypassing security and controlling systems',
    skills: ['Hacking', 'Electronics', 'Robotics', 'Cybernetics']
  },
  scientist: {
    name: CHARACTER_ROLES.scientist.name,
    icon: CHARACTER_ROLES.scientist.icon,
    description: 'Research and medical expert for healing and analysis',
    skills: ['Medicine', 'Chemistry', 'Genetics', 'Biology']
  },
  investigator: {
    name: CHARACTER_ROLES.investigator.name,
    icon: CHARACTER_ROLES.investigator.icon,
    description: 'Intel expert for solving cases and gathering information',
    skills: ['Forensics', 'Psychology', 'Languages', 'Investigation']
  },
  operative: {
    name: CHARACTER_ROLES.operative.name,
    icon: CHARACTER_ROLES.operative.icon,
    description: 'Covert specialist for infiltration and social engineering',
    skills: ['Undercover', 'Tradecraft', 'Interrogation', 'Disguise']
  },
  support: {
    name: CHARACTER_ROLES.support.name,
    icon: CHARACTER_ROLES.support.icon,
    description: 'Logistics expert for repairs, healing, and resources',
    skills: ['Engineering', 'Medicine', 'Logistics', 'Electronics']
  }
};

// Manual profiles for key countries with distinct gameplay feel
const MANUAL_PROFILES: Record<string, Omit<CountryProfile, 'countryCode' | 'countryName'>> = {
  // United States - Military industrial complex
  'US': {
    originWeights: {
      trained_soldier: 35,
      altered_human: 25,
      skilled_human: 20,
      tech_enhanced: 15,
      mutated: 5
    },
    statTendencies: { STR: 5, CON: 5, INT: 3 },
    educationWeights: {
      military_tactics: 30,
      weapons_systems: 25,
      hacking: 20,
      engineering: 15,
      medicine: 10
    },
    culturalTraits: ['Direct', 'Confident', 'Well-equipped'],
    tagline: 'Military-industrial powerhouse'
  },

  // Japan - Tech and discipline
  'JP': {
    originWeights: {
      tech_enhanced: 35,
      skilled_human: 30,
      trained_soldier: 15,
      altered_human: 15,
      synthetic: 5
    },
    statTendencies: { INT: 8, INS: 5, AGL: 3 },
    educationWeights: {
      robotics: 30,
      martial_arts: 25,
      electronics: 20,
      hacking: 15,
      engineering: 10
    },
    culturalTraits: ['Disciplined', 'Precise', 'Tech-savvy'],
    tagline: 'Technology and tradition unified'
  },

  // India - Spiritual and adaptive
  'IN': {
    originWeights: {
      spiritual: 30,
      skilled_human: 30,
      altered_human: 20,
      tech_enhanced: 15,
      mutated: 5
    },
    statTendencies: { INS: 8, INT: 5, CON: 3 },
    educationWeights: {
      psychology: 25,
      medicine: 25,
      diplomacy: 20,
      engineering: 15,
      investigation: 15
    },
    culturalTraits: ['Intuitive', 'Adaptable', 'Spiritually aware'],
    tagline: 'Ancient wisdom meets modern innovation'
  },

  // China - Organized and strategic
  'CN': {
    originWeights: {
      tech_enhanced: 30,
      trained_soldier: 25,
      skilled_human: 25,
      altered_human: 15,
      synthetic: 5
    },
    statTendencies: { INT: 6, STR: 4, CON: 4 },
    educationWeights: {
      engineering: 25,
      military_tactics: 25,
      hacking: 20,
      martial_arts: 15,
      electronics: 15
    },
    culturalTraits: ['Organized', 'Strategic', 'Methodical'],
    tagline: 'Collective strength through discipline'
  },

  // Nigeria - Adaptive and connected
  'NG': {
    originWeights: {
      skilled_human: 35,
      spiritual: 25,
      altered_human: 20,
      trained_soldier: 15,
      mutated: 5
    },
    statTendencies: { CON: 6, INS: 5, AGL: 4 },
    educationWeights: {
      diplomacy: 25,
      investigation: 20,
      tradecraft: 20,
      psychology: 15,
      languages: 20
    },
    culturalTraits: ['Adaptive', 'Connected', 'Resourceful'],
    tagline: 'Continental network, global reach'
  },

  // Russia - Tough and methodical
  'RU': {
    originWeights: {
      trained_soldier: 35,
      tech_enhanced: 25,
      skilled_human: 20,
      altered_human: 15,
      synthetic: 5
    },
    statTendencies: { STR: 6, STA: 6, INT: 3 },
    educationWeights: {
      military_tactics: 30,
      engineering: 25,
      weapons_systems: 20,
      hacking: 15,
      interrogation: 10
    },
    culturalTraits: ['Tough', 'Methodical', 'Resilient'],
    tagline: 'Forged in adversity'
  },

  // Brazil - Resourceful and resilient
  'BR': {
    originWeights: {
      skilled_human: 35,
      altered_human: 25,
      trained_soldier: 20,
      spiritual: 15,
      mutated: 5
    },
    statTendencies: { AGL: 6, CON: 5, STA: 4 },
    educationWeights: {
      martial_arts: 30,
      diplomacy: 20,
      investigation: 20,
      medicine: 15,
      tradecraft: 15
    },
    culturalTraits: ['Resourceful', 'Resilient', 'Adaptable'],
    tagline: 'Street smart, world ready'
  },

  // Israel - Tactical and innovative
  'IL': {
    originWeights: {
      trained_soldier: 35,
      tech_enhanced: 25,
      altered_human: 20,
      skilled_human: 15,
      synthetic: 5
    },
    statTendencies: { AGL: 5, INT: 6, INS: 4 },
    educationWeights: {
      military_tactics: 25,
      hacking: 25,
      investigation: 20,
      interrogation: 15,
      electronics: 15
    },
    culturalTraits: ['Tactical', 'Innovative', 'Tenacious'],
    tagline: 'Small nation, elite operators'
  },

  // Germany - Precise and engineered
  'DE': {
    originWeights: {
      skilled_human: 30,
      tech_enhanced: 30,
      trained_soldier: 20,
      altered_human: 15,
      synthetic: 5
    },
    statTendencies: { INT: 6, STR: 4, CON: 4 },
    educationWeights: {
      engineering: 30,
      medicine: 20,
      robotics: 20,
      military_tactics: 15,
      forensics: 15
    },
    culturalTraits: ['Precise', 'Engineered', 'Efficient'],
    tagline: 'Engineering excellence'
  },

  // UK - Traditional and sophisticated
  'GB': {
    originWeights: {
      skilled_human: 30,
      trained_soldier: 25,
      tech_enhanced: 20,
      altered_human: 15,
      spiritual: 10
    },
    statTendencies: { INT: 5, INS: 5, CON: 4 },
    educationWeights: {
      investigation: 25,
      diplomacy: 20,
      tradecraft: 20,
      military_tactics: 15,
      psychology: 20
    },
    culturalTraits: ['Sophisticated', 'Traditional', 'Resourceful'],
    tagline: 'Centuries of intelligence expertise'
  },

  // South Korea - Tech-forward
  'KR': {
    originWeights: {
      tech_enhanced: 35,
      skilled_human: 25,
      trained_soldier: 20,
      altered_human: 15,
      synthetic: 5
    },
    statTendencies: { INT: 7, AGL: 5, INS: 3 },
    educationWeights: {
      electronics: 30,
      hacking: 25,
      robotics: 20,
      engineering: 15,
      martial_arts: 10
    },
    culturalTraits: ['Tech-forward', 'Competitive', 'Disciplined'],
    tagline: 'Cutting-edge technology leaders'
  },

  // Mexico - Street smart
  'MX': {
    originWeights: {
      skilled_human: 35,
      altered_human: 25,
      trained_soldier: 20,
      spiritual: 15,
      mutated: 5
    },
    statTendencies: { AGL: 5, CON: 5, INS: 4 },
    educationWeights: {
      tradecraft: 25,
      investigation: 25,
      martial_arts: 20,
      undercover: 15,
      diplomacy: 15
    },
    culturalTraits: ['Street-smart', 'Loyal', 'Resourceful'],
    tagline: 'Survival instincts honed'
  },

  // Egypt - Ancient knowledge
  'EG': {
    originWeights: {
      spiritual: 30,
      skilled_human: 30,
      trained_soldier: 20,
      altered_human: 15,
      mutated: 5
    },
    statTendencies: { INS: 6, INT: 5, CON: 4 },
    educationWeights: {
      investigation: 25,
      psychology: 20,
      languages: 20,
      diplomacy: 20,
      tradecraft: 15
    },
    culturalTraits: ['Wise', 'Patient', 'Connected'],
    tagline: 'Crossroads of civilizations'
  },

  // Australia - Practical and tough
  'AU': {
    originWeights: {
      skilled_human: 35,
      trained_soldier: 25,
      altered_human: 20,
      tech_enhanced: 15,
      mutated: 5
    },
    statTendencies: { STA: 6, CON: 5, AGL: 4 },
    educationWeights: {
      military_tactics: 25,
      medicine: 20,
      investigation: 20,
      engineering: 20,
      tradecraft: 15
    },
    culturalTraits: ['Practical', 'Tough', 'No-nonsense'],
    tagline: 'Hardened by the outback'
  },

  // Thailand - Spiritual martial tradition
  'TH': {
    originWeights: {
      spiritual: 35,
      skilled_human: 35,
      altered_human: 15,
      tech_enhanced: 10,
      symbiotic: 5
    },
    statTendencies: { AGL: 5, INS: 3, CON: 2 },
    educationWeights: {
      martial_arts: 40,
      medicine: 25,
      mystical_studies: 20,
      psychology: 15
    },
    culturalTraits: ['Spiritual', 'Disciplined', 'Graceful'],
    tagline: 'Ancient arts, modern warriors'
  },

  // Saudi Arabia - Wealthy and strategic
  'SA': {
    originWeights: {
      skilled_human: 40,
      tech_enhanced: 20,
      altered_human: 20,
      trained_soldier: 15,
      spiritual: 5
    },
    statTendencies: { CON: 3, STR: 3, INT: 2 },
    educationWeights: {
      diplomacy: 30,
      military_tactics: 25,
      electronics: 20,
      engineering: 15,
      hacking: 10
    },
    culturalTraits: ['Wealthy', 'Strategic', 'Well-connected'],
    tagline: 'Resource wealth, global influence'
  },

  // France - Cultured and strategic
  'FR': {
    originWeights: {
      skilled_human: 40,
      altered_human: 20,
      tech_enhanced: 15,
      spiritual: 15,
      trained_soldier: 10
    },
    statTendencies: { AGL: 3, INT: 3, INS: 2 },
    educationWeights: {
      diplomacy: 30,
      martial_arts: 20,
      languages: 20,
      psychology: 15,
      tradecraft: 15
    },
    culturalTraits: ['Cultured', 'Strategic', 'Sophisticated'],
    tagline: 'Elegance meets lethality'
  },

  // Poland - Resilient and determined
  'PL': {
    originWeights: {
      trained_soldier: 30,
      skilled_human: 40,
      altered_human: 15,
      tech_enhanced: 10,
      spiritual: 5
    },
    statTendencies: { STR: 3, STA: 3, CON: 2 },
    educationWeights: {
      military_tactics: 30,
      engineering: 25,
      combat_medicine: 20,
      hacking: 15,
      investigation: 10
    },
    culturalTraits: ['Resilient', 'Determined', 'Loyal'],
    tagline: 'Forged through centuries of resistance'
  },

  // Ukraine - Battle-hardened and resourceful
  'UA': {
    originWeights: {
      trained_soldier: 35,
      skilled_human: 35,
      tech_enhanced: 15,
      altered_human: 10,
      mutated: 5
    },
    statTendencies: { STR: 3, CON: 3, AGL: 2 },
    educationWeights: {
      military_tactics: 30,
      hacking: 25,
      demolitions: 20,
      engineering: 15,
      electronics: 10
    },
    culturalTraits: ['Determined', 'Resourceful', 'Adaptive'],
    tagline: 'Combat experience forged in fire'
  },

  // Sweden - Innovative and balanced
  'SE': {
    originWeights: {
      skilled_human: 45,
      tech_enhanced: 25,
      altered_human: 15,
      synthetic: 10,
      trained_soldier: 5
    },
    statTendencies: { INT: 3, INS: 3, STA: 2 },
    educationWeights: {
      robotics: 25,
      medicine: 25,
      electronics: 20,
      psychology: 15,
      diplomacy: 15
    },
    culturalTraits: ['Innovative', 'Balanced', 'Progressive'],
    tagline: 'Innovation through cooperation'
  },

  // Norway - Hardy and independent
  'NO': {
    originWeights: {
      skilled_human: 40,
      trained_soldier: 25,
      altered_human: 15,
      tech_enhanced: 15,
      spiritual: 5
    },
    statTendencies: { STR: 3, STA: 5, CON: 2 },
    educationWeights: {
      military_tactics: 30,
      engineering: 20,
      combat_medicine: 20,
      demolitions: 15,
      investigation: 15
    },
    culturalTraits: ['Hardy', 'Independent', 'Cold-weather capable'],
    tagline: 'Arctic elite specialists'
  },

  // Switzerland - Precise and neutral
  'CH': {
    originWeights: {
      skilled_human: 50,
      tech_enhanced: 25,
      altered_human: 15,
      synthetic: 5,
      trained_soldier: 5
    },
    statTendencies: { INT: 5, CON: 3, INS: 2 },
    educationWeights: {
      medicine: 30,
      diplomacy: 25,
      hacking: 20,
      weapons_smithing: 15,
      investigation: 10
    },
    culturalTraits: ['Precise', 'Neutral', 'Discreet'],
    tagline: 'Precision in all things'
  },

  // South Africa - Diverse and tough
  'ZA': {
    originWeights: {
      skilled_human: 40,
      altered_human: 20,
      trained_soldier: 20,
      tech_enhanced: 10,
      mutated: 10
    },
    statTendencies: { STR: 3, CON: 3, STA: 2 },
    educationWeights: {
      military_tactics: 25,
      investigation: 20,
      demolitions: 20,
      engineering: 15,
      medicine: 10,
      psychology: 10
    },
    culturalTraits: ['Diverse', 'Tough', 'Experienced'],
    tagline: 'Battle-tested diversity'
  },

  // Kenya - Endurance and community
  'KE': {
    originWeights: {
      skilled_human: 45,
      spiritual: 20,
      altered_human: 15,
      trained_soldier: 15,
      mutated: 5
    },
    statTendencies: { STA: 5, AGL: 3, INS: 2 },
    educationWeights: {
      diplomacy: 25,
      investigation: 25,
      military_tactics: 20,
      psychology: 15,
      medicine: 15
    },
    culturalTraits: ['Endurance', 'Community-focused', 'Athletic'],
    tagline: 'Stamina and diplomatic reach'
  },

  // Canada - Peaceful and educated
  'CA': {
    originWeights: {
      skilled_human: 45,
      tech_enhanced: 20,
      altered_human: 15,
      trained_soldier: 15,
      spiritual: 5
    },
    statTendencies: { INT: 3, CON: 3, INS: 2 },
    educationWeights: {
      medicine: 30,
      diplomacy: 25,
      military_tactics: 20,
      investigation: 15,
      hacking: 10
    },
    culturalTraits: ['Peaceful', 'Educated', 'Diplomatic'],
    tagline: 'Quiet professionals'
  }
};

// Regional defaults for countries without manual profiles
interface RegionalDefault {
  originWeights: Partial<Record<OriginType, number>>;
  statTendencies: CountryProfile['statTendencies'];
  educationWeights: Partial<Record<EducationField, number>>;
  culturalTraits: string[];
}

const REGIONAL_DEFAULTS: Record<number, RegionalDefault> = {
  // North Africa (1)
  1: {
    originWeights: { skilled_human: 35, spiritual: 25, trained_soldier: 20, altered_human: 15, mutated: 5 },
    statTendencies: { INS: 4, CON: 4, STA: 4 },
    educationWeights: { diplomacy: 25, languages: 20, tradecraft: 20, investigation: 20, psychology: 15 },
    culturalTraits: ['Traditional', 'Networked', 'Patient']
  },
  // Central Africa (2)
  2: {
    originWeights: { skilled_human: 40, spiritual: 20, trained_soldier: 20, altered_human: 15, mutated: 5 },
    statTendencies: { STA: 5, CON: 5, AGL: 4 },
    educationWeights: { tradecraft: 25, diplomacy: 20, medicine: 20, investigation: 20, languages: 15 },
    culturalTraits: ['Resilient', 'Community-focused', 'Adaptable']
  },
  // Southern Africa (3)
  3: {
    originWeights: { skilled_human: 35, trained_soldier: 25, altered_human: 20, spiritual: 15, mutated: 5 },
    statTendencies: { CON: 5, STA: 5, STR: 4 },
    educationWeights: { investigation: 25, tradecraft: 20, military_tactics: 20, diplomacy: 20, medicine: 15 },
    culturalTraits: ['Diverse', 'Resourceful', 'Strong']
  },
  // Central Asia (4)
  4: {
    originWeights: { trained_soldier: 30, skilled_human: 30, spiritual: 20, altered_human: 15, mutated: 5 },
    statTendencies: { STA: 6, STR: 5, CON: 4 },
    educationWeights: { military_tactics: 25, tradecraft: 20, engineering: 20, languages: 20, investigation: 15 },
    culturalTraits: ['Hardy', 'Traditional', 'Strategic']
  },
  // South Asia (5)
  5: {
    originWeights: { spiritual: 30, skilled_human: 30, altered_human: 20, tech_enhanced: 15, mutated: 5 },
    statTendencies: { INS: 6, INT: 5, CON: 4 },
    educationWeights: { psychology: 25, medicine: 20, diplomacy: 20, engineering: 20, investigation: 15 },
    culturalTraits: ['Spiritual', 'Intellectual', 'Diverse']
  },
  // East & Southeast Asia (6)
  6: {
    originWeights: { tech_enhanced: 30, skilled_human: 30, trained_soldier: 20, altered_human: 15, synthetic: 5 },
    statTendencies: { INT: 6, AGL: 5, INS: 4 },
    educationWeights: { electronics: 25, martial_arts: 20, engineering: 20, hacking: 20, robotics: 15 },
    culturalTraits: ['Disciplined', 'Tech-savvy', 'Honor-bound']
  },
  // Caribbean (7)
  7: {
    originWeights: { skilled_human: 35, spiritual: 25, altered_human: 20, trained_soldier: 15, mutated: 5 },
    statTendencies: { AGL: 5, CON: 5, INS: 4 },
    educationWeights: { tradecraft: 25, diplomacy: 20, languages: 20, investigation: 20, medicine: 15 },
    culturalTraits: ['Resilient', 'Connected', 'Resourceful']
  },
  // Central America (8)
  8: {
    originWeights: { skilled_human: 35, trained_soldier: 25, altered_human: 20, spiritual: 15, mutated: 5 },
    statTendencies: { AGL: 5, CON: 5, STA: 4 },
    educationWeights: { tradecraft: 25, investigation: 25, military_tactics: 20, undercover: 15, languages: 15 },
    culturalTraits: ['Street-smart', 'Adaptive', 'Loyal']
  },
  // Western Europe (9)
  9: {
    originWeights: { skilled_human: 30, tech_enhanced: 25, trained_soldier: 20, altered_human: 20, synthetic: 5 },
    statTendencies: { INT: 5, INS: 4, CON: 4 },
    educationWeights: { investigation: 25, diplomacy: 20, engineering: 20, medicine: 20, hacking: 15 },
    culturalTraits: ['Sophisticated', 'Methodical', 'Educated']
  },
  // Eastern Europe (10)
  10: {
    originWeights: { trained_soldier: 30, skilled_human: 30, tech_enhanced: 20, altered_human: 15, synthetic: 5 },
    statTendencies: { STR: 5, STA: 5, INT: 4 },
    educationWeights: { military_tactics: 25, engineering: 20, hacking: 20, interrogation: 20, weapons_systems: 15 },
    culturalTraits: ['Tough', 'Resourceful', 'Tenacious']
  },
  // Oceania (11)
  11: {
    originWeights: { skilled_human: 35, trained_soldier: 25, altered_human: 20, tech_enhanced: 15, mutated: 5 },
    statTendencies: { STA: 5, CON: 5, AGL: 4 },
    educationWeights: { military_tactics: 25, investigation: 20, engineering: 20, medicine: 20, tradecraft: 15 },
    culturalTraits: ['Practical', 'Tough', 'Self-reliant']
  },
  // South America (12)
  12: {
    originWeights: { skilled_human: 35, altered_human: 25, trained_soldier: 20, spiritual: 15, mutated: 5 },
    statTendencies: { AGL: 5, CON: 5, STA: 4 },
    educationWeights: { martial_arts: 25, tradecraft: 20, investigation: 20, diplomacy: 20, medicine: 15 },
    culturalTraits: ['Resourceful', 'Passionate', 'Adaptable']
  },
  // North America (13)
  13: {
    originWeights: { trained_soldier: 30, skilled_human: 25, altered_human: 25, tech_enhanced: 15, mutated: 5 },
    statTendencies: { STR: 4, CON: 4, INT: 4 },
    educationWeights: { military_tactics: 25, hacking: 20, engineering: 20, investigation: 20, medicine: 15 },
    culturalTraits: ['Direct', 'Innovative', 'Well-equipped']
  },
  // Middle East (14)
  14: {
    originWeights: { trained_soldier: 30, skilled_human: 25, spiritual: 20, altered_human: 15, tech_enhanced: 10 },
    statTendencies: { INS: 5, CON: 5, STR: 4 },
    educationWeights: { military_tactics: 25, tradecraft: 20, languages: 20, investigation: 20, interrogation: 15 },
    culturalTraits: ['Strategic', 'Resilient', 'Networked']
  }
};

/**
 * Get the profile for a specific country
 */
export function getCountryProfile(countryCodeOrName: string): CountryProfile | null {
  // Try to find by code first
  let country = getCountryByCode(countryCodeOrName);

  // If not found, try by name
  if (!country) {
    country = getCountryByName(countryCodeOrName);
  }

  if (!country) {
    return null;
  }

  const code = country.code.toUpperCase();

  // Check for manual profile
  if (MANUAL_PROFILES[code]) {
    return {
      countryCode: code,
      countryName: country.name,
      ...MANUAL_PROFILES[code]
    };
  }

  // Fall back to regional default
  const regional = REGIONAL_DEFAULTS[country.cultureCode] || REGIONAL_DEFAULTS[9]; // Default to Western Europe

  return {
    countryCode: code,
    countryName: country.name,
    originWeights: regional.originWeights,
    statTendencies: regional.statTendencies,
    educationWeights: regional.educationWeights,
    culturalTraits: regional.culturalTraits,
    tagline: `${country.nationality} operatives`
  };
}

/**
 * Generate profile dynamically based on country stats
 * This creates more nuanced profiles based on actual country data
 */
export function generateDynamicProfile(country: Country): CountryProfile {
  const baseProfile = getCountryProfile(country.code);
  if (baseProfile) {
    // Adjust based on country stats
    const adjusted = { ...baseProfile };

    // High military → more soldiers
    if (country.militaryServices > 70) {
      adjusted.originWeights = {
        ...adjusted.originWeights,
        trained_soldier: (adjusted.originWeights.trained_soldier || 20) + 10
      };
    }

    // High science → more altered/tech enhanced
    if (country.science > 70) {
      adjusted.originWeights = {
        ...adjusted.originWeights,
        altered_human: (adjusted.originWeights.altered_human || 15) + 10,
        tech_enhanced: (adjusted.originWeights.tech_enhanced || 15) + 5
      };
    }

    // High cyber → more hackers
    if (country.cyberCapabilities > 70) {
      adjusted.educationWeights = {
        ...adjusted.educationWeights,
        hacking: (adjusted.educationWeights.hacking || 15) + 15,
        electronics: (adjusted.educationWeights.electronics || 10) + 10
      };
    }

    // High healthcare → more medics
    if (country.healthcare > 70) {
      adjusted.educationWeights = {
        ...adjusted.educationWeights,
        medicine: (adjusted.educationWeights.medicine || 15) + 10,
        chemistry: (adjusted.educationWeights.chemistry || 5) + 5
      };
    }

    // High LSW activity → more powered individuals
    if (country.lswActivity > 60) {
      adjusted.originWeights = {
        ...adjusted.originWeights,
        altered_human: (adjusted.originWeights.altered_human || 15) + 5,
        mutated: (adjusted.originWeights.mutated || 5) + 5,
        spiritual: (adjusted.originWeights.spiritual || 10) + 5
      };
    }

    return adjusted;
  }

  // Fallback
  return {
    countryCode: country.code,
    countryName: country.name,
    originWeights: { skilled_human: 40, trained_soldier: 25, altered_human: 20, tech_enhanced: 10, mutated: 5 },
    statTendencies: {},
    educationWeights: { military_tactics: 20, investigation: 20, tradecraft: 20, medicine: 20, engineering: 20 },
    culturalTraits: ['Diverse'],
    tagline: `${country.nationality} operatives`
  };
}

/**
 * Determine character role based on their education/skills
 * Uses CHARACTER_ROLES.primarySkills to score each role
 * Returns 'soldier' as default if no clear match
 */
export function determineRole(educationFields: EducationField[]): CharacterRole {
  // Initialize scores for all roles
  const roleScores: Record<CharacterRole, number> = {
    soldier: 0,
    specialist: 0,
    scientist: 0,
    investigator: 0,
    operative: 0,
    support: 0
  };

  // Score each role based on matching skills from CHARACTER_ROLES
  for (const field of educationFields) {
    for (const [roleKey, roleDef] of Object.entries(CHARACTER_ROLES)) {
      const role = roleKey as CharacterRole;
      if (roleDef.primarySkills.includes(field)) {
        // Primary skills for this role get higher score
        roleScores[role] += 2;
      }
    }
  }

  // Find highest scoring role
  let bestRole: CharacterRole = 'soldier';
  let bestScore = 0;

  for (const [role, score] of Object.entries(roleScores)) {
    if (score > bestScore) {
      bestScore = score;
      bestRole = role as CharacterRole;
    }
  }

  // Default to soldier if no clear match (score is 0)
  return bestRole;
}

/**
 * Get all available country codes with manual profiles
 */
export function getProfiledCountries(): string[] {
  return Object.keys(MANUAL_PROFILES);
}

/**
 * Check if a country has a custom (non-regional) profile
 */
export function hasCustomProfile(countryCode: string): boolean {
  return countryCode.toUpperCase() in MANUAL_PROFILES;
}

/**
 * Returns the default profile used for countries without specific profiles
 * This represents a generic "average" operative
 */
export function getDefaultProfile(): CountryProfile {
  return {
    countryCode: 'XX',
    countryName: 'Unknown',
    originWeights: {
      skilled_human: 40,
      trained_soldier: 25,
      altered_human: 15,
      tech_enhanced: 10,
      spiritual: 5,
      mutated: 3,
      synthetic: 1,
      symbiotic: 1
    },
    statTendencies: {},
    educationWeights: {
      military_tactics: 20,
      martial_arts: 15,
      investigation: 15,
      medicine: 15,
      hacking: 15,
      psychology: 10,
      diplomacy: 10
    },
    culturalTraits: ['Adaptable', 'Determined', 'Resourceful'],
    tagline: 'A versatile operative with balanced capabilities'
  };
}

/**
 * Generated character data from country-based generation
 */
export interface GeneratedCharacter {
  countryCode: string;
  countryName: string;
  originType: OriginType;
  statModifiers: CountryProfile['statTendencies'];
  suggestedEducation: EducationField[];
  culturalTraits: string[];
  backgroundDescription: string;
}

/**
 * Weighted random selection from a record of weights
 */
function weightedRandomSelect<T extends string>(weights: Partial<Record<T, number>>): T {
  const entries = Object.entries(weights) as [T, number][];
  const totalWeight = entries.reduce((sum, [, weight]) => sum + (weight as number), 0);

  if (totalWeight <= 0) {
    return entries[0]?.[0] || ('skilled_human' as T);
  }

  let random = Math.random() * totalWeight;

  for (const [key, weight] of entries) {
    random -= weight as number;
    if (random <= 0) {
      return key;
    }
  }

  return entries[entries.length - 1][0];
}

/**
 * Selects top N education fields based on weights
 */
function selectTopEducationFields(
  weights: Partial<Record<EducationField, number>>,
  count: number
): EducationField[] {
  const entries = Object.entries(weights) as [EducationField, number][];
  entries.sort((a, b) => b[1] - a[1]);
  return entries.slice(0, count).map(([field]) => field);
}

/**
 * Generates a character based on country profile
 * @param countryCode ISO 3166-1 alpha-2 country code
 * @returns GeneratedCharacter with origin, stats, education, and traits
 */
export function generateCharacterForCountry(countryCode: string): GeneratedCharacter {
  const profile = getCountryProfile(countryCode) || getDefaultProfile();

  // Select origin type based on weights
  const originType = weightedRandomSelect(profile.originWeights);

  // Get stat modifiers (apply tendencies)
  const statModifiers = { ...profile.statTendencies };

  // Select top 3 suggested education fields
  const suggestedEducation = selectTopEducationFields(profile.educationWeights, 3);

  // Select 2-3 random cultural traits
  const traitCount = 2 + Math.floor(Math.random() * 2);
  const shuffledTraits = [...profile.culturalTraits].sort(() => Math.random() - 0.5);
  const culturalTraits = shuffledTraits.slice(0, traitCount);

  return {
    countryCode: profile.countryCode,
    countryName: profile.countryName,
    originType,
    statModifiers,
    suggestedEducation,
    culturalTraits,
    backgroundDescription: profile.tagline
  };
}

/**
 * Gets profiles filtered by a specific origin type emphasis
 * @param originType The origin type to filter by
 * @param minWeight Minimum weight threshold (default 25)
 * @returns Array of profiles where that origin has at least minWeight
 */
export function getProfilesByOriginEmphasis(
  originType: OriginType,
  minWeight: number = 25
): CountryProfile[] {
  return getProfiledCountries()
    .map(code => getCountryProfile(code))
    .filter((profile): profile is CountryProfile => {
      if (!profile) return false;
      const weight = profile.originWeights[originType] || 0;
      return weight >= minWeight;
    });
}

/**
 * Gets profiles filtered by a specific stat tendency
 * @param stat The stat to filter by
 * @param minBonus Minimum bonus threshold (default 3)
 * @returns Array of profiles where that stat has at least minBonus
 */
export function getProfilesByStatEmphasis(
  stat: keyof CountryProfile['statTendencies'],
  minBonus: number = 3
): CountryProfile[] {
  return getProfiledCountries()
    .map(code => getCountryProfile(code))
    .filter((profile): profile is CountryProfile => {
      if (!profile) return false;
      const bonus = profile.statTendencies[stat] || 0;
      return bonus >= minBonus;
    });
}

/**
 * Merges two profiles, useful for characters with dual nationality
 * @param primary Primary country profile
 * @param secondary Secondary country profile
 * @param primaryWeight Weight of primary profile (0-1, default 0.7)
 * @returns Merged profile
 */
export function mergeProfiles(
  primary: CountryProfile,
  secondary: CountryProfile,
  primaryWeight: number = 0.7
): CountryProfile {
  const secondaryWeight = 1 - primaryWeight;

  // Merge origin weights
  const originWeights: Partial<Record<OriginType, number>> = {};
  const allOrigins = new Set([
    ...Object.keys(primary.originWeights),
    ...Object.keys(secondary.originWeights)
  ]) as Set<OriginType>;

  for (const origin of allOrigins) {
    const primaryVal = primary.originWeights[origin] || 0;
    const secondaryVal = secondary.originWeights[origin] || 0;
    originWeights[origin] = Math.round(primaryVal * primaryWeight + secondaryVal * secondaryWeight);
  }

  // Merge stat tendencies
  const statTendencies: CountryProfile['statTendencies'] = {};
  const allStats = new Set([
    ...Object.keys(primary.statTendencies),
    ...Object.keys(secondary.statTendencies)
  ]) as Set<keyof CountryProfile['statTendencies']>;

  for (const stat of allStats) {
    const primaryVal = primary.statTendencies[stat] || 0;
    const secondaryVal = secondary.statTendencies[stat] || 0;
    statTendencies[stat] = Math.round(primaryVal * primaryWeight + secondaryVal * secondaryWeight);
  }

  // Merge education weights
  const educationWeights: Partial<Record<EducationField, number>> = {};
  const allFields = new Set([
    ...Object.keys(primary.educationWeights),
    ...Object.keys(secondary.educationWeights)
  ]) as Set<EducationField>;

  for (const field of allFields) {
    const primaryVal = primary.educationWeights[field] || 0;
    const secondaryVal = secondary.educationWeights[field] || 0;
    educationWeights[field] = Math.round(primaryVal * primaryWeight + secondaryVal * secondaryWeight);
  }

  // Merge cultural traits (unique)
  const culturalTraits = [
    ...new Set([...primary.culturalTraits, ...secondary.culturalTraits])
  ];

  return {
    countryCode: `${primary.countryCode}/${secondary.countryCode}`,
    countryName: `${primary.countryName}/${secondary.countryName}`,
    originWeights,
    statTendencies,
    educationWeights,
    culturalTraits,
    tagline: `${primary.tagline} / ${secondary.tagline}`
  };
}
