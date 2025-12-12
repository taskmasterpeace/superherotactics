/**
 * Education & Training System
 *
 * This system handles:
 * - Education facilities by city (not every city has a university!)
 * - Character enrollment in schools/training programs
 * - Skill acquisition through education
 * - Career path unlocks through education levels
 *
 * Similar structure to Healthcare System - country rating + city type = what's available
 */

// =============================================================================
// EDUCATION LEVELS
// =============================================================================

export type EducationLevel =
  | 'none'              // No formal education
  | 'elementary'        // Basic literacy (age 6-12)
  | 'high_school'       // Secondary education (age 12-18)
  | 'trade_school'      // Vocational training (2 years)
  | 'associates'        // 2-year college degree
  | 'bachelors'         // 4-year university degree
  | 'masters'           // Graduate degree (2 years)
  | 'doctorate'         // PhD/MD/JD (4-6 years)
  | 'post_doctoral'     // Advanced research position
  | 'military_basic'    // Basic military training
  | 'military_advanced' // Advanced military training
  | 'military_special'  // Special forces training
  | 'intelligence'      // Spy/intelligence training

export interface EducationLevelInfo {
  id: EducationLevel;
  name: string;
  description: string;
  yearsRequired: number;
  ageMinimum: number;
  prerequisite?: EducationLevel;
  statRequirements?: Partial<Record<string, number>>;

  // What it grants
  statBonuses?: Partial<Record<string, number>>;
  skillBonuses?: Record<string, number>;  // Skill name -> +CS
  researchCapability?: string;            // What research they can do

  // Unlocks
  unlocksCareerRanks?: number[];          // Career ranks this unlocks
  unlocksSpecialTraining?: string[];      // Special training programs

  // Cost
  costLevel: 'free' | 'low' | 'medium' | 'high' | 'very_high' | 'faction_funded';
  factionScholarship?: boolean;           // Can faction pay for it?
}

export const EDUCATION_LEVELS: Record<EducationLevel, EducationLevelInfo> = {
  none: {
    id: 'none',
    name: 'No Formal Education',
    description: 'Street learned or self-taught',
    yearsRequired: 0,
    ageMinimum: 0,
    skillBonuses: { 'Streetwise': 1 },
    unlocksCareerRanks: [1],
    costLevel: 'free',
  },
  elementary: {
    id: 'elementary',
    name: 'Elementary School',
    description: 'Basic reading, writing, and math',
    yearsRequired: 6,
    ageMinimum: 6,
    statBonuses: { INT: 1 },
    unlocksCareerRanks: [1],
    costLevel: 'free',
  },
  high_school: {
    id: 'high_school',
    name: 'High School',
    description: 'Standard secondary education',
    yearsRequired: 6,
    ageMinimum: 12,
    prerequisite: 'elementary',
    statRequirements: { INT: 8 },
    statBonuses: { INT: 2, INS: 1 },
    unlocksCareerRanks: [1, 2],
    unlocksSpecialTraining: ['basic_firearms', 'first_aid'],
    costLevel: 'free',
  },
  trade_school: {
    id: 'trade_school',
    name: 'Trade School',
    description: 'Vocational/technical training',
    yearsRequired: 2,
    ageMinimum: 18,
    prerequisite: 'high_school',
    statRequirements: { INT: 10 },
    statBonuses: { INT: 2, INS: 2 },
    skillBonuses: { 'Technical': 1 },
    researchCapability: 'basic_tech',
    unlocksCareerRanks: [1, 2],
    costLevel: 'low',
    factionScholarship: true,
  },
  associates: {
    id: 'associates',
    name: 'Associate\'s Degree',
    description: '2-year college degree',
    yearsRequired: 2,
    ageMinimum: 18,
    prerequisite: 'high_school',
    statRequirements: { INT: 12 },
    statBonuses: { INT: 3, INS: 1 },
    skillBonuses: { 'Specialty': 1 },
    researchCapability: 'basic',
    unlocksCareerRanks: [1, 2],
    costLevel: 'medium',
    factionScholarship: true,
  },
  bachelors: {
    id: 'bachelors',
    name: 'Bachelor\'s Degree',
    description: '4-year university degree',
    yearsRequired: 4,
    ageMinimum: 18,
    prerequisite: 'high_school',
    statRequirements: { INT: 15 },
    statBonuses: { INT: 4, INS: 2 },
    skillBonuses: { 'Specialty': 2, 'Research': 1 },
    researchCapability: 'intermediate',
    unlocksCareerRanks: [1, 2, 3],
    unlocksSpecialTraining: ['research_assistant'],
    costLevel: 'high',
    factionScholarship: true,
  },
  masters: {
    id: 'masters',
    name: 'Master\'s Degree',
    description: 'Graduate degree specialization',
    yearsRequired: 2,
    ageMinimum: 22,
    prerequisite: 'bachelors',
    statRequirements: { INT: 20 },
    statBonuses: { INT: 5, INS: 3 },
    skillBonuses: { 'Specialty': 3, 'Research': 2 },
    researchCapability: 'advanced',
    unlocksCareerRanks: [1, 2, 3, 4],
    unlocksSpecialTraining: ['lead_researcher'],
    costLevel: 'very_high',
    factionScholarship: true,
  },
  doctorate: {
    id: 'doctorate',
    name: 'Doctorate (PhD/MD/JD)',
    description: 'Highest academic achievement',
    yearsRequired: 5,
    ageMinimum: 24,
    prerequisite: 'masters',
    statRequirements: { INT: 30 },
    statBonuses: { INT: 7, INS: 4 },
    skillBonuses: { 'Specialty': 4, 'Research': 3 },
    researchCapability: 'expert',
    unlocksCareerRanks: [1, 2, 3, 4, 5],
    unlocksSpecialTraining: ['principal_investigator'],
    costLevel: 'very_high',
    factionScholarship: true,
  },
  post_doctoral: {
    id: 'post_doctoral',
    name: 'Post-Doctoral Research',
    description: 'Advanced research position',
    yearsRequired: 3,
    ageMinimum: 28,
    prerequisite: 'doctorate',
    statRequirements: { INT: 35 },
    statBonuses: { INT: 8, INS: 5 },
    skillBonuses: { 'Specialty': 5, 'Research': 4 },
    researchCapability: 'cutting_edge',
    unlocksCareerRanks: [5],
    costLevel: 'faction_funded', // Usually paid position
  },
  military_basic: {
    id: 'military_basic',
    name: 'Basic Military Training',
    description: 'Boot camp and fundamentals',
    yearsRequired: 0.5,
    ageMinimum: 18,
    statRequirements: { STA: 12 },
    statBonuses: { INS: 2 },
    skillBonuses: { 'Combat': 1, 'Tactics': 1 },
    unlocksCareerRanks: [1],
    costLevel: 'free', // Military pays you
  },
  military_advanced: {
    id: 'military_advanced',
    name: 'Advanced Military Training',
    description: 'Specialized combat training',
    yearsRequired: 2,
    ageMinimum: 20,
    prerequisite: 'military_basic',
    statRequirements: { STA: 15, MEL: 15 },
    statBonuses: { INT: 1, INS: 3 },
    skillBonuses: { 'Combat': 2, 'Tactics': 2 },
    researchCapability: 'basic_military',
    unlocksCareerRanks: [1, 2, 3],
    costLevel: 'free',
  },
  military_special: {
    id: 'military_special',
    name: 'Special Forces Training',
    description: 'Elite forces training',
    yearsRequired: 2,
    ageMinimum: 22,
    prerequisite: 'military_advanced',
    statRequirements: { STA: 20, MEL: 20, AGL: 20 },
    statBonuses: { INT: 2, INS: 4 },
    skillBonuses: { 'Combat': 3, 'Tactics': 3, 'Stealth': 2 },
    researchCapability: 'military_tech',
    unlocksCareerRanks: [1, 2, 3, 4],
    costLevel: 'free',
  },
  intelligence: {
    id: 'intelligence',
    name: 'Intelligence Training',
    description: 'Spy/intelligence operative training',
    yearsRequired: 3,
    ageMinimum: 21,
    prerequisite: 'high_school',
    statRequirements: { INT: 20, INS: 20 },
    statBonuses: { INT: 3, INS: 5 },
    skillBonuses: { 'Espionage': 3, 'Deception': 2, 'Languages': 2 },
    researchCapability: 'intelligence',
    unlocksCareerRanks: [1, 2, 3, 4],
    costLevel: 'faction_funded',
  },
};

// =============================================================================
// EDUCATION FACILITY TYPES
// =============================================================================

export type FacilityType =
  | 'elementary_school'
  | 'high_school'
  | 'trade_school'
  | 'community_college'
  | 'university'
  | 'research_university'
  | 'elite_university'
  | 'military_academy'
  | 'intelligence_academy'
  | 'medical_school'
  | 'law_school'
  | 'engineering_school';

export interface EducationFacility {
  id: FacilityType;
  name: string;
  description: string;

  // What education levels it offers
  offersLevels: EducationLevel[];

  // Requirements to exist in a city
  minPopulation: number;
  requiredCityTypes?: string[];   // Must have one of these city types
  minCountryEducation: number;    // Minimum country higherEducation rating

  // Quality modifiers
  baseQuality: number;            // 1-100

  // Specializations available
  specializations?: string[];

  // Enrollment
  enrollmentCapacity: number;     // Per semester
  semesterLengthDays: number;
  tuitionCost: number;            // Per semester
}

export const EDUCATION_FACILITIES: Record<FacilityType, EducationFacility> = {
  elementary_school: {
    id: 'elementary_school',
    name: 'Elementary School',
    description: 'Basic primary education',
    offersLevels: ['elementary'],
    minPopulation: 1000,
    minCountryEducation: 10,
    baseQuality: 50,
    enrollmentCapacity: 500,
    semesterLengthDays: 180,
    tuitionCost: 0, // Free
  },
  high_school: {
    id: 'high_school',
    name: 'High School',
    description: 'Secondary education',
    offersLevels: ['high_school'],
    minPopulation: 5000,
    minCountryEducation: 20,
    baseQuality: 50,
    enrollmentCapacity: 1000,
    semesterLengthDays: 180,
    tuitionCost: 0,
  },
  trade_school: {
    id: 'trade_school',
    name: 'Trade School',
    description: 'Vocational and technical training',
    offersLevels: ['trade_school'],
    minPopulation: 25000,
    minCountryEducation: 30,
    baseQuality: 60,
    specializations: ['Mechanical', 'Electrical', 'Construction', 'Medical_Tech', 'IT'],
    enrollmentCapacity: 200,
    semesterLengthDays: 120,
    tuitionCost: 2000,
  },
  community_college: {
    id: 'community_college',
    name: 'Community College',
    description: '2-year associate degree programs',
    offersLevels: ['associates'],
    minPopulation: 50000,
    minCountryEducation: 40,
    baseQuality: 55,
    specializations: ['Business', 'Nursing', 'Criminal_Justice', 'IT', 'Arts'],
    enrollmentCapacity: 500,
    semesterLengthDays: 120,
    tuitionCost: 3000,
  },
  university: {
    id: 'university',
    name: 'University',
    description: 'Standard 4-year university',
    offersLevels: ['bachelors', 'masters'],
    minPopulation: 100000,
    requiredCityTypes: ['Educational', 'Political'],
    minCountryEducation: 50,
    baseQuality: 65,
    specializations: ['Business', 'Engineering', 'Science', 'Arts', 'Law', 'Medicine'],
    enrollmentCapacity: 2000,
    semesterLengthDays: 120,
    tuitionCost: 15000,
  },
  research_university: {
    id: 'research_university',
    name: 'Research University',
    description: 'Major research institution',
    offersLevels: ['bachelors', 'masters', 'doctorate'],
    minPopulation: 250000,
    requiredCityTypes: ['Educational'],
    minCountryEducation: 65,
    baseQuality: 80,
    specializations: ['Engineering', 'Science', 'Medicine', 'Technology', 'Physics', 'Chemistry', 'Biology'],
    enrollmentCapacity: 5000,
    semesterLengthDays: 120,
    tuitionCost: 30000,
  },
  elite_university: {
    id: 'elite_university',
    name: 'Elite University',
    description: 'World-class institution (Ivy League equivalent)',
    offersLevels: ['bachelors', 'masters', 'doctorate', 'post_doctoral'],
    minPopulation: 500000,
    requiredCityTypes: ['Educational', 'Political'],
    minCountryEducation: 80,
    baseQuality: 95,
    specializations: ['All'],
    enrollmentCapacity: 3000,
    semesterLengthDays: 120,
    tuitionCost: 60000,
  },
  military_academy: {
    id: 'military_academy',
    name: 'Military Academy',
    description: 'Officer training and military education',
    offersLevels: ['military_basic', 'military_advanced', 'bachelors'],
    minPopulation: 50000,
    requiredCityTypes: ['Military'],
    minCountryEducation: 40,
    baseQuality: 75,
    specializations: ['Infantry', 'Naval', 'Air_Force', 'Intelligence', 'Engineering'],
    enrollmentCapacity: 500,
    semesterLengthDays: 180,
    tuitionCost: 0, // Military funded
  },
  intelligence_academy: {
    id: 'intelligence_academy',
    name: 'Intelligence Academy',
    description: 'Spy and intelligence operative training',
    offersLevels: ['intelligence'],
    minPopulation: 1000000, // Only in major cities
    requiredCityTypes: ['Political', 'Military'],
    minCountryEducation: 60,
    baseQuality: 85,
    specializations: ['HUMINT', 'SIGINT', 'Cyber', 'Analysis', 'Covert_Ops'],
    enrollmentCapacity: 50, // Very selective
    semesterLengthDays: 365,
    tuitionCost: 0, // Faction funded
  },
  medical_school: {
    id: 'medical_school',
    name: 'Medical School',
    description: 'Doctor and medical professional training',
    offersLevels: ['doctorate'],
    minPopulation: 250000,
    requiredCityTypes: ['Educational'],
    minCountryEducation: 70,
    baseQuality: 85,
    specializations: ['Surgery', 'Internal_Medicine', 'Neurology', 'Psychiatry', 'Forensics'],
    enrollmentCapacity: 200,
    semesterLengthDays: 120,
    tuitionCost: 50000,
  },
  law_school: {
    id: 'law_school',
    name: 'Law School',
    description: 'Legal professional training',
    offersLevels: ['doctorate'],
    minPopulation: 200000,
    requiredCityTypes: ['Educational', 'Political'],
    minCountryEducation: 60,
    baseQuality: 75,
    specializations: ['Criminal', 'Corporate', 'International', 'Constitutional'],
    enrollmentCapacity: 300,
    semesterLengthDays: 120,
    tuitionCost: 40000,
  },
  engineering_school: {
    id: 'engineering_school',
    name: 'Engineering School',
    description: 'Technical and engineering education',
    offersLevels: ['bachelors', 'masters', 'doctorate'],
    minPopulation: 150000,
    requiredCityTypes: ['Educational', 'Industrial'],
    minCountryEducation: 55,
    baseQuality: 75,
    specializations: ['Mechanical', 'Electrical', 'Computer', 'Aerospace', 'Biomedical', 'Robotics'],
    enrollmentCapacity: 1000,
    semesterLengthDays: 120,
    tuitionCost: 25000,
  },
};

// =============================================================================
// CITY EDUCATION CALCULATION
// =============================================================================

export interface CityEducationInfo {
  cityName: string;
  countryName: string;

  // What's available
  availableFacilities: FacilityType[];

  // Best available
  highestEducationLevel: EducationLevel;
  bestFacilityQuality: number;

  // Specializations available in this city
  availableSpecializations: string[];

  // Why
  reason: string;
}

/**
 * Calculate what education facilities are available in a city
 */
export function getCityEducation(
  cityPopulation: number,
  cityTypes: string[],
  countryEducation: number,     // Country's higherEducation rating (0-100)
  countryName: string,
  cityName: string
): CityEducationInfo {

  const availableFacilities: FacilityType[] = [];
  const availableSpecializations: string[] = [];
  let highestLevel: EducationLevel = 'none';
  let bestQuality = 0;
  let reason = '';

  // Check each facility type
  for (const [facilityId, facility] of Object.entries(EDUCATION_FACILITIES)) {
    const meetsPopulation = cityPopulation >= facility.minPopulation;
    const meetsEducation = countryEducation >= facility.minCountryEducation;
    const meetsCityType = !facility.requiredCityTypes ||
      facility.requiredCityTypes.some(t => cityTypes.includes(t));

    if (meetsPopulation && meetsEducation && meetsCityType) {
      availableFacilities.push(facilityId as FacilityType);

      // Track best quality
      const qualityWithCountryBonus = facility.baseQuality * (countryEducation / 100);
      if (qualityWithCountryBonus > bestQuality) {
        bestQuality = qualityWithCountryBonus;
      }

      // Track highest education level
      for (const level of facility.offersLevels) {
        const levelRank = getEducationLevelRank(level);
        if (levelRank > getEducationLevelRank(highestLevel)) {
          highestLevel = level;
        }
      }

      // Collect specializations
      if (facility.specializations) {
        for (const spec of facility.specializations) {
          if (!availableSpecializations.includes(spec)) {
            availableSpecializations.push(spec);
          }
        }
      }
    }
  }

  // Generate reason
  if (availableFacilities.length === 0) {
    reason = `Population too small or country education rating too low`;
  } else if (availableFacilities.includes('elite_university')) {
    reason = `World-class education hub`;
  } else if (availableFacilities.includes('research_university')) {
    reason = `Major research and education center`;
  } else if (availableFacilities.includes('university')) {
    reason = `Standard university city`;
  } else if (availableFacilities.includes('military_academy')) {
    reason = `Military education center`;
  } else {
    reason = `Basic education facilities only`;
  }

  return {
    cityName,
    countryName,
    availableFacilities,
    highestEducationLevel: highestLevel,
    bestFacilityQuality: Math.round(bestQuality),
    availableSpecializations,
    reason,
  };
}

/**
 * Get numeric rank for education level (for comparison)
 */
function getEducationLevelRank(level: EducationLevel): number {
  const ranks: Record<EducationLevel, number> = {
    none: 0,
    elementary: 1,
    high_school: 2,
    trade_school: 3,
    associates: 3,
    military_basic: 3,
    bachelors: 4,
    military_advanced: 4,
    masters: 5,
    military_special: 5,
    intelligence: 5,
    doctorate: 6,
    post_doctoral: 7,
  };
  return ranks[level];
}

// =============================================================================
// ENROLLMENT SYSTEM
// =============================================================================

export type EnrollmentStatus =
  | 'not_enrolled'
  | 'enrolled'
  | 'on_leave'
  | 'suspended'
  | 'graduated'
  | 'dropped_out';

export interface Enrollment {
  characterId: string;
  facilityType: FacilityType;
  facilityCity: string;
  educationLevel: EducationLevel;
  specialization?: string;

  // Progress
  status: EnrollmentStatus;
  enrolledAt: number;           // Game time
  expectedGraduation: number;   // Game time
  creditsCompleted: number;
  creditsRequired: number;
  currentGPA: number;           // 0-4.0

  // Costs
  tuitionPaid: number;
  tuitionOwed: number;
  scholarshipPercent: number;   // 0-100% tuition covered

  // Attendance
  classesAttended: number;
  classesMissed: number;
  lastAttendance: number;       // Game time
}

/**
 * Check if character meets requirements for enrollment
 */
export function canEnroll(
  characterStats: Record<string, number>,
  characterAge: number,
  currentEducation: EducationLevel,
  targetLevel: EducationLevel
): { canEnroll: boolean; reason: string } {

  const levelInfo = EDUCATION_LEVELS[targetLevel];

  // Check prerequisite
  if (levelInfo.prerequisite && currentEducation !== levelInfo.prerequisite) {
    const prereqInfo = EDUCATION_LEVELS[levelInfo.prerequisite];
    return {
      canEnroll: false,
      reason: `Requires ${prereqInfo.name} first`,
    };
  }

  // Check age
  if (characterAge < levelInfo.ageMinimum) {
    return {
      canEnroll: false,
      reason: `Must be at least ${levelInfo.ageMinimum} years old`,
    };
  }

  // Check stat requirements
  if (levelInfo.statRequirements) {
    for (const [stat, required] of Object.entries(levelInfo.statRequirements)) {
      const current = characterStats[stat] || 0;
      if (current < required) {
        return {
          canEnroll: false,
          reason: `${stat} must be at least ${required} (current: ${current})`,
        };
      }
    }
  }

  return { canEnroll: true, reason: 'Meets all requirements' };
}

/**
 * Calculate time to complete education
 */
export function calculateEducationTime(
  level: EducationLevel,
  characterINT: number
): { semestersRequired: number; daysRequired: number } {

  const levelInfo = EDUCATION_LEVELS[level];
  const baseYears = levelInfo.yearsRequired;

  // INT bonus: high INT can graduate faster (max 20% faster)
  const intBonus = Math.min(0.2, (characterINT - 15) * 0.01);
  const adjustedYears = baseYears * (1 - intBonus);

  // Convert to semesters (2 per year) and days
  const semestersRequired = Math.ceil(adjustedYears * 2);
  const daysRequired = Math.ceil(adjustedYears * 365);

  return { semestersRequired, daysRequired };
}

// =============================================================================
// TRAINING PROGRAMS (Short-term skill training)
// =============================================================================

export interface TrainingProgram {
  id: string;
  name: string;
  description: string;

  // Requirements
  prerequisiteEducation?: EducationLevel;
  prerequisiteSkills?: Record<string, number>;
  statRequirements?: Partial<Record<string, number>>;

  // Time and cost
  durationDays: number;
  cost: number;

  // What you get
  skillsGranted: Record<string, number>;  // Skill -> +CS
  statBonuses?: Partial<Record<string, number>>;

  // Where available
  facilityRequired?: FacilityType[];
  cityTypeRequired?: string[];
}

export const TRAINING_PROGRAMS: Record<string, TrainingProgram> = {
  basic_firearms: {
    id: 'basic_firearms',
    name: 'Basic Firearms Training',
    description: 'Learn to safely handle and shoot firearms',
    durationDays: 7,
    cost: 500,
    skillsGranted: { 'Shooting': 1 },
    cityTypeRequired: ['Military', 'Political'],
  },
  advanced_firearms: {
    id: 'advanced_firearms',
    name: 'Advanced Firearms Training',
    description: 'Tactical shooting and advanced techniques',
    prerequisiteSkills: { 'Shooting': 1 },
    durationDays: 14,
    cost: 2000,
    skillsGranted: { 'Shooting': 1, 'Quick_Draw': 1 },
    facilityRequired: ['military_academy'],
  },
  first_aid: {
    id: 'first_aid',
    name: 'First Aid Certification',
    description: 'Basic emergency medical training',
    durationDays: 3,
    cost: 200,
    skillsGranted: { 'First_Aid': 2 },
  },
  emt_certification: {
    id: 'emt_certification',
    name: 'EMT Certification',
    description: 'Emergency Medical Technician training',
    prerequisiteSkills: { 'First_Aid': 1 },
    durationDays: 30,
    cost: 1500,
    skillsGranted: { 'First_Aid': 1, 'Medicine': 1 },
    facilityRequired: ['trade_school', 'community_college'],
  },
  martial_arts_basic: {
    id: 'martial_arts_basic',
    name: 'Basic Martial Arts',
    description: 'Foundational hand-to-hand combat',
    statRequirements: { AGL: 10 },
    durationDays: 30,
    cost: 300,
    skillsGranted: { 'Martial_Arts': 1 },
  },
  martial_arts_advanced: {
    id: 'martial_arts_advanced',
    name: 'Advanced Martial Arts',
    description: 'Advanced techniques and combat application',
    prerequisiteSkills: { 'Martial_Arts': 2 },
    statRequirements: { AGL: 15, MEL: 15 },
    durationDays: 90,
    cost: 2000,
    skillsGranted: { 'Martial_Arts': 1 },
  },
  driving_course: {
    id: 'driving_course',
    name: 'Driving Course',
    description: 'Learn to operate vehicles',
    durationDays: 7,
    cost: 500,
    skillsGranted: { 'Driving': 2 },
  },
  tactical_driving: {
    id: 'tactical_driving',
    name: 'Tactical Driving',
    description: 'Evasive driving and pursuit techniques',
    prerequisiteSkills: { 'Driving': 2 },
    durationDays: 14,
    cost: 3000,
    skillsGranted: { 'Driving': 1, 'Evasion': 1 },
    facilityRequired: ['military_academy'],
  },
  pilot_license: {
    id: 'pilot_license',
    name: 'Pilot License',
    description: 'Learn to fly aircraft',
    statRequirements: { INT: 12, AGL: 12 },
    durationDays: 60,
    cost: 15000,
    skillsGranted: { 'Pilot': 2 },
  },
  hacking_basics: {
    id: 'hacking_basics',
    name: 'Cybersecurity Basics',
    description: 'Introduction to computer security and hacking',
    prerequisiteEducation: 'high_school',
    statRequirements: { INT: 15 },
    durationDays: 30,
    cost: 2000,
    skillsGranted: { 'Computers': 1, 'Hacking': 1 },
    facilityRequired: ['trade_school', 'university'],
  },
  demolitions: {
    id: 'demolitions',
    name: 'Demolitions Training',
    description: 'Explosives handling and controlled demolition',
    prerequisiteEducation: 'military_basic',
    durationDays: 21,
    cost: 5000,
    skillsGranted: { 'Demolitions': 3 },
    facilityRequired: ['military_academy'],
  },
  sniper_school: {
    id: 'sniper_school',
    name: 'Sniper School',
    description: 'Long-range precision shooting',
    prerequisiteEducation: 'military_advanced',
    prerequisiteSkills: { 'Shooting': 3 },
    statRequirements: { INS: 20, CON: 15 },
    durationDays: 60,
    cost: 0, // Military funded
    skillsGranted: { 'Sniper': 3, 'Stealth': 1 },
    facilityRequired: ['military_academy'],
  },
  interrogation: {
    id: 'interrogation',
    name: 'Interrogation Techniques',
    description: 'Information extraction and interview skills',
    prerequisiteEducation: 'intelligence',
    statRequirements: { INS: 18, CON: 15 },
    durationDays: 30,
    cost: 0, // Intelligence funded
    skillsGranted: { 'Interrogation': 3, 'Psychology': 1 },
    facilityRequired: ['intelligence_academy'],
  },
  language_immersion: {
    id: 'language_immersion',
    name: 'Language Immersion',
    description: 'Intensive foreign language training',
    statRequirements: { INT: 12 },
    durationDays: 90,
    cost: 5000,
    skillsGranted: { 'Languages': 2 },
    facilityRequired: ['university', 'elite_university'],
  },
};

// =============================================================================
// EXPORTS
// =============================================================================

export default {
  EDUCATION_LEVELS,
  EDUCATION_FACILITIES,
  TRAINING_PROGRAMS,
  getCityEducation,
  canEnroll,
  calculateEducationTime,
};
