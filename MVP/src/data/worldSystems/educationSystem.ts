// =============================================================================
// EDUCATION SYSTEM
// =============================================================================
// Character training, skill development, and certification

import type { PrimaryStats } from '../characterSheet';

// =============================================================================
// EDUCATION LEVELS
// =============================================================================

export type EducationLevel =
  | 'none'
  | 'primary' // Basic schooling
  | 'secondary' // High school
  | 'vocational' // Trade school
  | 'undergraduate' // Bachelor's degree
  | 'graduate' // Master's degree
  | 'doctoral' // PhD
  | 'military' // Military training
  | 'special_forces'; // Elite military

export const EDUCATION_LEVEL_VALUES: Record<EducationLevel, {
  baseInt: number;
  skillSlots: number;
  description: string;
}> = {
  none: { baseInt: 0, skillSlots: 1, description: 'No formal education' },
  primary: { baseInt: 5, skillSlots: 2, description: 'Basic schooling' },
  secondary: { baseInt: 10, skillSlots: 3, description: 'High school graduate' },
  vocational: { baseInt: 12, skillSlots: 4, description: 'Trade school trained' },
  undergraduate: { baseInt: 15, skillSlots: 5, description: 'Bachelor\'s degree' },
  graduate: { baseInt: 18, skillSlots: 6, description: 'Master\'s degree' },
  doctoral: { baseInt: 22, skillSlots: 7, description: 'Doctorate holder' },
  military: { baseInt: 12, skillSlots: 4, description: 'Military trained' },
  special_forces: { baseInt: 18, skillSlots: 6, description: 'Elite military' },
};

// =============================================================================
// TRAINING FACILITIES
// =============================================================================

export type TrainingCategory =
  | 'combat' // Fighting skills
  | 'firearms' // Gun handling
  | 'technical' // Electronics, hacking
  | 'medical' // First aid, surgery
  | 'leadership' // Command skills
  | 'stealth' // Infiltration
  | 'driving' // Vehicle operation
  | 'languages'; // Language learning

export interface TrainingFacility {
  id: string;
  name: string;
  category: TrainingCategory;
  quality: number; // 1-100
  maxTrainees: number;
  dailyCost: number;
  location: string;
  requirements?: {
    minStat?: Partial<PrimaryStats>;
    minEducation?: EducationLevel;
  };
}

export interface TrainingProgram {
  id: string;
  name: string;
  category: TrainingCategory;
  durationDays: number;
  skillPoints: number; // Points gained on completion
  statBonus?: Partial<PrimaryStats>;
  prerequisitePrograms?: string[];
  cost: number;
}

// =============================================================================
// BASIC TRAINING PROGRAMS
// =============================================================================

export const TRAINING_PROGRAMS: TrainingProgram[] = [
  // Combat training
  {
    id: 'basic-combat',
    name: 'Basic Combat Training',
    category: 'combat',
    durationDays: 7,
    skillPoints: 10,
    statBonus: { MEL: 2, STR: 1 },
    cost: 2000,
  },
  {
    id: 'advanced-combat',
    name: 'Advanced Combat Training',
    category: 'combat',
    durationDays: 14,
    skillPoints: 20,
    statBonus: { MEL: 3, AGL: 2 },
    prerequisitePrograms: ['basic-combat'],
    cost: 5000,
  },
  {
    id: 'martial-arts',
    name: 'Martial Arts Intensive',
    category: 'combat',
    durationDays: 30,
    skillPoints: 40,
    statBonus: { MEL: 5, AGL: 3, CON: 2 },
    prerequisitePrograms: ['advanced-combat'],
    cost: 15000,
  },

  // Firearms training
  {
    id: 'basic-firearms',
    name: 'Basic Firearms Handling',
    category: 'firearms',
    durationDays: 5,
    skillPoints: 10,
    cost: 1500,
  },
  {
    id: 'marksman',
    name: 'Marksman Course',
    category: 'firearms',
    durationDays: 14,
    skillPoints: 25,
    statBonus: { INS: 2 },
    prerequisitePrograms: ['basic-firearms'],
    cost: 4000,
  },
  {
    id: 'sniper',
    name: 'Sniper Training',
    category: 'firearms',
    durationDays: 30,
    skillPoints: 50,
    statBonus: { INS: 4, CON: 2 },
    prerequisitePrograms: ['marksman'],
    cost: 20000,
  },

  // Technical training
  {
    id: 'basic-electronics',
    name: 'Electronics Fundamentals',
    category: 'technical',
    durationDays: 10,
    skillPoints: 15,
    statBonus: { INT: 2 },
    cost: 3000,
  },
  {
    id: 'hacking',
    name: 'Cybersecurity & Hacking',
    category: 'technical',
    durationDays: 21,
    skillPoints: 35,
    statBonus: { INT: 4 },
    prerequisitePrograms: ['basic-electronics'],
    cost: 10000,
  },

  // Medical training
  {
    id: 'first-aid',
    name: 'First Aid Certification',
    category: 'medical',
    durationDays: 3,
    skillPoints: 10,
    cost: 500,
  },
  {
    id: 'combat-medic',
    name: 'Combat Medic Training',
    category: 'medical',
    durationDays: 14,
    skillPoints: 30,
    statBonus: { INT: 2, INS: 1 },
    prerequisitePrograms: ['first-aid'],
    cost: 8000,
  },
  {
    id: 'field-surgery',
    name: 'Field Surgery',
    category: 'medical',
    durationDays: 30,
    skillPoints: 50,
    statBonus: { INT: 3, INS: 2, CON: 2 },
    prerequisitePrograms: ['combat-medic'],
    cost: 25000,
  },

  // Stealth training
  {
    id: 'basic-stealth',
    name: 'Stealth Fundamentals',
    category: 'stealth',
    durationDays: 7,
    skillPoints: 15,
    statBonus: { AGL: 2 },
    cost: 3000,
  },
  {
    id: 'infiltration',
    name: 'Infiltration Specialist',
    category: 'stealth',
    durationDays: 21,
    skillPoints: 40,
    statBonus: { AGL: 3, INS: 2 },
    prerequisitePrograms: ['basic-stealth'],
    cost: 12000,
  },

  // Leadership
  {
    id: 'squad-leadership',
    name: 'Squad Leadership',
    category: 'leadership',
    durationDays: 14,
    skillPoints: 25,
    statBonus: { CON: 3, INT: 1 },
    cost: 6000,
  },
  {
    id: 'tactical-command',
    name: 'Tactical Command',
    category: 'leadership',
    durationDays: 30,
    skillPoints: 50,
    statBonus: { CON: 5, INT: 2, INS: 2 },
    prerequisitePrograms: ['squad-leadership'],
    cost: 20000,
  },

  // Driving
  {
    id: 'tactical-driving',
    name: 'Tactical Driving',
    category: 'driving',
    durationDays: 5,
    skillPoints: 15,
    statBonus: { AGL: 1, INS: 1 },
    cost: 2000,
  },
  {
    id: 'pilot-basic',
    name: 'Basic Pilot License',
    category: 'driving',
    durationDays: 30,
    skillPoints: 40,
    statBonus: { AGL: 2, INS: 2, INT: 1 },
    prerequisitePrograms: ['tactical-driving'],
    cost: 25000,
  },
];

// =============================================================================
// TRAINING STATE
// =============================================================================

export interface CharacterTraining {
  characterId: string;
  currentProgram?: {
    programId: string;
    startDate: Date;
    completionDate: Date;
    facilityId: string;
  };
  completedPrograms: string[]; // Program IDs
  totalTrainingDays: number;
  skillPointsEarned: number;
}

export function calculateTrainingQuality(
  countryEducation: number, // 0-100
  countryScience: number,
  countryGdp: number
): number {
  // Combined formula: (Education * 2 + Science + GDP/2) / 3.5
  return Math.min(100, (countryEducation * 2 + countryScience + countryGdp / 2) / 3.5);
}

export function getAvailablePrograms(
  characterTraining: CharacterTraining,
  category?: TrainingCategory
): TrainingProgram[] {
  return TRAINING_PROGRAMS.filter(program => {
    // Filter by category if specified
    if (category && program.category !== category) return false;

    // Check prerequisites
    if (program.prerequisitePrograms) {
      const hasAllPrereqs = program.prerequisitePrograms.every(
        prereq => characterTraining.completedPrograms.includes(prereq)
      );
      if (!hasAllPrereqs) return false;
    }

    // Don't show already completed programs
    if (characterTraining.completedPrograms.includes(program.id)) return false;

    return true;
  });
}

export function startTrainingProgram(
  training: CharacterTraining,
  programId: string,
  facilityId: string
): boolean {
  const program = TRAINING_PROGRAMS.find(p => p.id === programId);
  if (!program) return false;

  // Check if already training
  if (training.currentProgram) return false;

  const now = new Date();
  const completionDate = new Date(now.getTime() + program.durationDays * 24 * 60 * 60 * 1000);

  training.currentProgram = {
    programId,
    startDate: now,
    completionDate,
    facilityId,
  };

  return true;
}

export function completeTraining(
  training: CharacterTraining
): { success: boolean; program?: TrainingProgram } {
  if (!training.currentProgram) {
    return { success: false };
  }

  const program = TRAINING_PROGRAMS.find(p => p.id === training.currentProgram!.programId);
  if (!program) {
    return { success: false };
  }

  // Mark as completed
  training.completedPrograms.push(program.id);
  training.totalTrainingDays += program.durationDays;
  training.skillPointsEarned += program.skillPoints;
  training.currentProgram = undefined;

  return { success: true, program };
}
