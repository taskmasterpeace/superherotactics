/**
 * Education System - SuperHero Tactics
 *
 * A comprehensive university-style education system serving as a MAJOR POWER SYSTEM.
 * Characters can pursue degrees across multiple tracks, with education affecting:
 * - Skill unlocks (abilities you can't get otherwise)
 * - Permanent stat bonuses
 * - Prerequisite gates (equipment, facilities, jobs, advanced training)
 *
 * Time Basis: 1 month (4 weeks) uninterrupted study = Bachelor's degree equivalent
 *
 * Three Educational Tracks:
 * - Academic: Associate -> Bachelor -> Master -> Doctorate -> Post-Doc
 * - Vocational: Certificate -> Diploma -> Trade License -> Master Craftsman
 * - Military/Intel: Basic -> Advanced -> Specialist -> Elite -> Command
 */

import { GameCharacter } from '../types';

// ============================================================================
// CORE TYPES
// ============================================================================

export type EducationTrack = 'academic' | 'vocational' | 'military';

export type DegreeLevel =
  | 'none'
  // Vocational
  | 'certificate'
  | 'diploma'
  | 'trade_license'
  | 'master_craftsman'
  // Academic
  | 'associate'
  | 'bachelor'
  | 'master'
  | 'doctorate'
  | 'postdoc'
  // Military
  | 'basic'
  | 'advanced'
  | 'specialist'
  | 'elite'
  | 'command';

export type FieldCategory =
  | 'combat_sciences'
  | 'technical_engineering'
  | 'life_sciences'
  | 'social_intel'
  | 'super_science'        // Restricted
  | 'occult_mystical'      // Restricted (Spiritual origin)
  | 'underground_criminal'; // Restricted (Criminal contacts)

export type InstitutionTier = 1 | 2 | 3 | 4 | 5;

export type StudySessionType =
  | 'full'       // 8 hours, 100% learning
  | 'part_time'  // 4 hours, 40% learning
  | 'intensive'  // 12 hours, 180% learning (exhaustion risk)
  | 'online'     // 6 hours, 60% learning
  | 'practical'; // 8 hours, 120% learning (requires facility)

export type ExamResult = 'pass' | 'fail' | 'critical_fail';

// ============================================================================
// INTERFACES
// ============================================================================

export interface Specialization {
  id: string;
  name: string;
  parentField: string;
  description: string;
  skillUnlocks: string[];
  equipmentUnlocks: string[];
  jobUnlocks: string[];
}

export interface FieldOfStudy {
  id: string;
  name: string;
  category: FieldCategory;
  primaryStat: string;
  secondaryStat?: string;
  minStatValue: number;
  optimalStatValue: number;
  description: string;
  specializations: Specialization[];
  isRestricted: boolean;
  restrictionRequirement?: string;
}

export interface Degree {
  id: string;
  name: string;
  track: EducationTrack;
  level: DegreeLevel;
  field: string;
  specialization?: string;
  prerequisites: string[];
  primaryStat: string;
  minStatValue: number;
  baseWeeks: number;
  baseCost: number;
  statBonuses: Record<string, number>;
  skillUnlocks: string[];
  equipmentUnlocks: string[];
  jobUnlocks: string[];
  examCount: number;
  examDifficulty: number;
}

export interface Institution {
  id: string;
  name: string;
  country: string;
  city?: string;
  tier: InstitutionTier;
  specialties: string[];
  uniqueBenefits?: string[];
  timeModifier: number;
  costModifier: number;
  qualityModifier: number;
  requiresVisa?: boolean;
  minimumReputation?: number;
  restrictedFields?: string[];
}

export interface StudySession {
  characterId: string;
  degreeId: string;
  institutionId: string;
  startDate: number;
  progress: number;
  examsPassed: number;
  dropoutRisk: number;
  isOnline: boolean;
  sessionsThisWeek: number;
  missedSessionsStreak: number;
  totalStudyHours: number;
}

export interface StartingBackground {
  id: string;
  name: string;
  description: string;
  startingEducation: string[];
  partialProgress?: {
    degreeId: string;
    progress: number;
  };
  statBonuses: Record<string, number>;
  startingBudget: number;
  specialBenefits: string[];
  startingContacts?: string[];
}

export interface DayJob {
  id: string;
  name: string;
  requiredEducation: string[];
  minEducationLevel: DegreeLevel;
  weeklyPay: number;
  hoursPerWeek: number;
  coverBenefit: string;
  workplaceAccess?: string[];
  informationAccess?: string[];
  onCallRisk: number;
  vacationDaysPerMonth: number;
}

// ============================================================================
// DEGREE LEVEL PROGRESSIONS
// ============================================================================

export const ACADEMIC_PROGRESSION: DegreeLevel[] = [
  'associate', 'bachelor', 'master', 'doctorate', 'postdoc'
];

export const VOCATIONAL_PROGRESSION: DegreeLevel[] = [
  'certificate', 'diploma', 'trade_license', 'master_craftsman'
];

export const MILITARY_PROGRESSION: DegreeLevel[] = [
  'basic', 'advanced', 'specialist', 'elite', 'command'
];

export const DEGREE_LEVEL_DATA: Record<DegreeLevel, {
  displayName: string;
  track: EducationTrack | 'none';
  tier: number;
  baseWeeks: number;
  statBonus: number;
  skillPoints: number;
}> = {
  none: { displayName: 'None', track: 'none', tier: 0, baseWeeks: 0, statBonus: 0, skillPoints: 0 },

  // Academic (2wk -> 4wk -> 3wk -> 6wk -> 4wk)
  associate: { displayName: 'Associate', track: 'academic', tier: 1, baseWeeks: 2, statBonus: 1, skillPoints: 2 },
  bachelor: { displayName: 'Bachelor', track: 'academic', tier: 2, baseWeeks: 4, statBonus: 2, skillPoints: 4 },
  master: { displayName: 'Master', track: 'academic', tier: 3, baseWeeks: 3, statBonus: 3, skillPoints: 6 },
  doctorate: { displayName: 'Doctorate', track: 'academic', tier: 4, baseWeeks: 6, statBonus: 4, skillPoints: 8 },
  postdoc: { displayName: 'Post-Doctorate', track: 'academic', tier: 5, baseWeeks: 4, statBonus: 5, skillPoints: 10 },

  // Vocational (1wk -> 2wk -> 3wk -> 4wk)
  certificate: { displayName: 'Certificate', track: 'vocational', tier: 1, baseWeeks: 1, statBonus: 1, skillPoints: 2 },
  diploma: { displayName: 'Diploma', track: 'vocational', tier: 2, baseWeeks: 2, statBonus: 2, skillPoints: 3 },
  trade_license: { displayName: 'Trade License', track: 'vocational', tier: 3, baseWeeks: 3, statBonus: 3, skillPoints: 4 },
  master_craftsman: { displayName: 'Master Craftsman', track: 'vocational', tier: 4, baseWeeks: 4, statBonus: 4, skillPoints: 5 },

  // Military (2wk -> 3wk -> 4wk -> 4wk -> 6wk)
  basic: { displayName: 'Basic Training', track: 'military', tier: 1, baseWeeks: 2, statBonus: 1, skillPoints: 2 },
  advanced: { displayName: 'Advanced Training', track: 'military', tier: 2, baseWeeks: 3, statBonus: 2, skillPoints: 3 },
  specialist: { displayName: 'Specialist', track: 'military', tier: 3, baseWeeks: 4, statBonus: 3, skillPoints: 4 },
  elite: { displayName: 'Elite', track: 'military', tier: 4, baseWeeks: 4, statBonus: 4, skillPoints: 5 },
  command: { displayName: 'Command', track: 'military', tier: 5, baseWeeks: 6, statBonus: 5, skillPoints: 6 },
};

// ============================================================================
// FIELDS OF STUDY
// ============================================================================

export const FIELDS_OF_STUDY: FieldOfStudy[] = [
  // =========== COMBAT SCIENCES ===========
  {
    id: 'military_tactics',
    name: 'Military Tactics',
    category: 'combat_sciences',
    primaryStat: 'MEL',
    secondaryStat: 'INT',
    minStatValue: 50,
    optimalStatValue: 65,
    description: 'Squad command, battlefield strategy, and military operations.',
    isRestricted: false,
    specializations: [
      {
        id: 'squad_tactics',
        name: 'Squad Tactics',
        parentField: 'military_tactics',
        description: 'Small unit tactics and team coordination.',
        skillUnlocks: ['squad_command', 'tactical_assessment', 'flanking_bonus'],
        equipmentUnlocks: ['tactical_radio', 'command_kit'],
        jobUnlocks: ['squad_leader', 'military_advisor'],
      },
      {
        id: 'urban_warfare',
        name: 'Urban Warfare',
        parentField: 'military_tactics',
        description: 'Combat in built-up areas and close quarters.',
        skillUnlocks: ['urban_combat', 'room_clearing', 'building_assault'],
        equipmentUnlocks: ['breaching_kit', 'flashbang_grenades'],
        jobUnlocks: ['swat_operator', 'urban_combat_instructor'],
      },
      {
        id: 'strategic_planning',
        name: 'Strategic Planning',
        parentField: 'military_tactics',
        description: 'Large-scale operations and campaign planning.',
        skillUnlocks: ['strategic_planning', 'logistics_mastery', 'intel_analysis'],
        equipmentUnlocks: ['war_room_access', 'strategic_software'],
        jobUnlocks: ['military_strategist', 'defense_consultant'],
      },
    ],
  },
  {
    id: 'weapons_systems',
    name: 'Weapons Systems',
    category: 'combat_sciences',
    primaryStat: 'DEX',
    secondaryStat: 'INT',
    minStatValue: 45,
    optimalStatValue: 60,
    description: 'Firearms, explosives, and heavy weapons operation and maintenance.',
    isRestricted: false,
    specializations: [
      {
        id: 'small_arms',
        name: 'Small Arms',
        parentField: 'weapons_systems',
        description: 'Pistols, rifles, and submachine guns.',
        skillUnlocks: ['quick_draw', 'rapid_fire', 'weapon_maintenance'],
        equipmentUnlocks: ['custom_weapons', 'gunsmith_tools'],
        jobUnlocks: ['firearms_instructor', 'armorer'],
      },
      {
        id: 'heavy_weapons',
        name: 'Heavy Weapons',
        parentField: 'weapons_systems',
        description: 'Machine guns, rockets, and crew-served weapons.',
        skillUnlocks: ['heavy_weapons_prof', 'suppressive_fire', 'anti_vehicle'],
        equipmentUnlocks: ['heavy_weapons_license', 'support_weapons'],
        jobUnlocks: ['heavy_weapons_specialist', 'weapons_dealer'],
      },
      {
        id: 'precision_shooting',
        name: 'Precision Shooting',
        parentField: 'weapons_systems',
        description: 'Long-range marksmanship and sniping.',
        skillUnlocks: ['sniper_training', 'range_estimation', 'breath_control'],
        equipmentUnlocks: ['precision_rifles', 'advanced_optics'],
        jobUnlocks: ['sniper', 'marksmanship_instructor'],
      },
    ],
  },
  {
    id: 'martial_arts',
    name: 'Martial Arts',
    category: 'combat_sciences',
    primaryStat: 'MEL',
    secondaryStat: 'DEX',
    minStatValue: 50,
    optimalStatValue: 70,
    description: 'Hand-to-hand combat techniques and fighting styles.',
    isRestricted: false,
    specializations: [
      {
        id: 'striking_arts',
        name: 'Striking Arts',
        parentField: 'martial_arts',
        description: 'Boxing, kickboxing, Muay Thai - stand-up fighting.',
        skillUnlocks: ['power_punch', 'kick_combo', 'counter_strike'],
        equipmentUnlocks: ['hand_wraps', 'training_gear'],
        jobUnlocks: ['boxing_trainer', 'bouncer'],
      },
      {
        id: 'grappling_arts',
        name: 'Grappling Arts',
        parentField: 'martial_arts',
        description: 'Wrestling, Judo, BJJ - ground fighting and submissions.',
        skillUnlocks: ['takedown', 'submission_hold', 'ground_control'],
        equipmentUnlocks: ['grappling_dummy', 'gi'],
        jobUnlocks: ['wrestling_coach', 'mma_fighter'],
      },
      {
        id: 'weapon_arts',
        name: 'Weapon Arts',
        parentField: 'martial_arts',
        description: 'Kendo, Escrima, knife fighting - melee weapons.',
        skillUnlocks: ['blade_mastery', 'staff_techniques', 'improvised_weapons'],
        equipmentUnlocks: ['training_weapons', 'combat_blade'],
        jobUnlocks: ['martial_arts_instructor', 'choreographer'],
      },
    ],
  },
  {
    id: 'combat_medicine',
    name: 'Combat Medicine',
    category: 'combat_sciences',
    primaryStat: 'INT',
    secondaryStat: 'INS',
    minStatValue: 50,
    optimalStatValue: 65,
    description: 'Battlefield triage, trauma care, and field surgery.',
    isRestricted: false,
    specializations: [
      {
        id: 'field_medic',
        name: 'Field Medic',
        parentField: 'combat_medicine',
        description: 'First response medical care under fire.',
        skillUnlocks: ['combat_first_aid', 'stabilization', 'triage'],
        equipmentUnlocks: ['medic_kit', 'field_surgery_kit'],
        jobUnlocks: ['combat_medic', 'emt'],
      },
      {
        id: 'trauma_surgery',
        name: 'Trauma Surgery',
        parentField: 'combat_medicine',
        description: 'Emergency surgical intervention for critical wounds.',
        skillUnlocks: ['field_surgery', 'limb_reattachment', 'critical_save'],
        equipmentUnlocks: ['surgical_kit', 'blood_supplies'],
        jobUnlocks: ['trauma_surgeon', 'field_hospital_director'],
      },
    ],
  },
  {
    id: 'demolitions',
    name: 'Demolitions',
    category: 'combat_sciences',
    primaryStat: 'INT',
    secondaryStat: 'DEX',
    minStatValue: 55,
    optimalStatValue: 70,
    description: 'Explosives handling, breaching, and controlled demolition.',
    isRestricted: false,
    specializations: [
      {
        id: 'explosive_ordnance',
        name: 'Explosive Ordnance',
        parentField: 'demolitions',
        description: 'Bombs, mines, and improvised explosives.',
        skillUnlocks: ['bomb_making', 'mine_placement', 'safe_handling'],
        equipmentUnlocks: ['demolition_kit', 'explosive_materials'],
        jobUnlocks: ['demolitions_expert', 'bomb_disposal'],
      },
      {
        id: 'breaching',
        name: 'Breaching',
        parentField: 'demolitions',
        description: 'Controlled entry through walls, doors, and barriers.',
        skillUnlocks: ['door_breaching', 'wall_charges', 'silent_entry'],
        equipmentUnlocks: ['breaching_charges', 'shaped_charges'],
        jobUnlocks: ['entry_specialist', 'mining_blaster'],
      },
    ],
  },
  {
    id: 'vehicle_combat',
    name: 'Vehicle Combat',
    category: 'combat_sciences',
    primaryStat: 'DEX',
    secondaryStat: 'INT',
    minStatValue: 45,
    optimalStatValue: 60,
    description: 'Armed vehicle operation and combat driving.',
    isRestricted: false,
    specializations: [
      {
        id: 'combat_driving',
        name: 'Combat Driving',
        parentField: 'vehicle_combat',
        description: 'Pursuit, evasion, and vehicular combat.',
        skillUnlocks: ['pursuit_driving', 'pit_maneuver', 'evasive_driving'],
        equipmentUnlocks: ['modified_vehicle', 'pursuit_package'],
        jobUnlocks: ['getaway_driver', 'motorcade_security'],
      },
      {
        id: 'mounted_weapons',
        name: 'Mounted Weapons',
        parentField: 'vehicle_combat',
        description: 'Vehicle-mounted gun systems and turrets.',
        skillUnlocks: ['turret_operation', 'vehicle_weapons', 'moving_target'],
        equipmentUnlocks: ['vehicle_weapons_mount', 'stabilized_platform'],
        jobUnlocks: ['vehicle_gunner', 'technical_crew'],
      },
    ],
  },

  // =========== TECHNICAL/ENGINEERING ===========
  {
    id: 'robotics',
    name: 'Robotics',
    category: 'technical_engineering',
    primaryStat: 'INT',
    minStatValue: 55,
    optimalStatValue: 75,
    description: 'Design, construction, and programming of robotic systems.',
    isRestricted: false,
    specializations: [
      {
        id: 'combat_drones',
        name: 'Combat Drones',
        parentField: 'robotics',
        description: 'Offensive drone systems and automated weapons.',
        skillUnlocks: ['drone_combat', 'swarm_tactics', 'drone_repair'],
        equipmentUnlocks: ['combat_drone', 'drone_controller'],
        jobUnlocks: ['drone_operator', 'military_robotics'],
      },
      {
        id: 'medical_bots',
        name: 'Medical Bots',
        parentField: 'robotics',
        description: 'Automated medical and surgical systems.',
        skillUnlocks: ['surgical_robot_op', 'medevac_drone', 'diagnostic_ai'],
        equipmentUnlocks: ['medical_drone', 'surgical_robot'],
        jobUnlocks: ['medical_robotics_tech', 'hospital_engineer'],
      },
      {
        id: 'utility_bots',
        name: 'Utility Bots',
        parentField: 'robotics',
        description: 'Reconnaissance, logistics, and support drones.',
        skillUnlocks: ['scout_drone', 'cargo_drone', 'maintenance_bot'],
        equipmentUnlocks: ['recon_drone', 'utility_robot'],
        jobUnlocks: ['logistics_tech', 'surveillance_operator'],
      },
    ],
  },
  {
    id: 'cybernetics',
    name: 'Cybernetics',
    category: 'technical_engineering',
    primaryStat: 'INT',
    secondaryStat: 'DEX',
    minStatValue: 60,
    optimalStatValue: 80,
    description: 'Cybernetic implants and human augmentation systems.',
    isRestricted: false,
    specializations: [
      {
        id: 'implant_surgery',
        name: 'Implant Surgery',
        parentField: 'cybernetics',
        description: 'Installation and maintenance of cybernetic enhancements.',
        skillUnlocks: ['implant_install', 'rejection_treatment', 'upgrade_surgery'],
        equipmentUnlocks: ['cybersurgery_kit', 'implant_inventory'],
        jobUnlocks: ['cybersurgeon', 'augmentation_clinic'],
      },
      {
        id: 'neural_interface',
        name: 'Neural Interface',
        parentField: 'cybernetics',
        description: 'Brain-computer interfaces and neural enhancement.',
        skillUnlocks: ['neural_jack', 'memory_backup', 'reflex_boost'],
        equipmentUnlocks: ['neural_interface', 'brain_scanner'],
        jobUnlocks: ['neural_engineer', 'consciousness_researcher'],
      },
    ],
  },
  {
    id: 'vehicle_engineering',
    name: 'Vehicle Engineering',
    category: 'technical_engineering',
    primaryStat: 'INT',
    secondaryStat: 'DEX',
    minStatValue: 45,
    optimalStatValue: 65,
    description: 'Vehicle repair, modification, and custom design.',
    isRestricted: false,
    specializations: [
      {
        id: 'auto_mechanic',
        name: 'Auto Mechanic',
        parentField: 'vehicle_engineering',
        description: 'Ground vehicle repair and modification.',
        skillUnlocks: ['vehicle_repair', 'performance_mod', 'armor_install'],
        equipmentUnlocks: ['mechanic_tools', 'diagnostic_computer'],
        jobUnlocks: ['mechanic', 'custom_shop_owner'],
      },
      {
        id: 'aircraft_tech',
        name: 'Aircraft Technician',
        parentField: 'vehicle_engineering',
        description: 'Aircraft maintenance and modification.',
        skillUnlocks: ['aircraft_repair', 'avionics', 'flight_systems'],
        equipmentUnlocks: ['aircraft_tools', 'flight_computer'],
        jobUnlocks: ['aircraft_mechanic', 'helicopter_tech'],
      },
    ],
  },
  {
    id: 'electronics',
    name: 'Electronics',
    category: 'technical_engineering',
    primaryStat: 'INT',
    minStatValue: 50,
    optimalStatValue: 70,
    description: 'Electronic systems, circuits, and security systems.',
    isRestricted: false,
    specializations: [
      {
        id: 'security_systems',
        name: 'Security Systems',
        parentField: 'electronics',
        description: 'Alarms, cameras, and electronic locks.',
        skillUnlocks: ['alarm_bypass', 'camera_loop', 'electronic_lock'],
        equipmentUnlocks: ['security_kit', 'bypass_tools'],
        jobUnlocks: ['security_tech', 'alarm_installer'],
      },
      {
        id: 'communications',
        name: 'Communications',
        parentField: 'electronics',
        description: 'Radio, satellite, and encrypted communications.',
        skillUnlocks: ['radio_operation', 'signal_intercept', 'encryption'],
        equipmentUnlocks: ['comm_equipment', 'signal_jammer'],
        jobUnlocks: ['communications_tech', 'radio_operator'],
      },
    ],
  },
  {
    id: 'hacking',
    name: 'Hacking/InfoSec',
    category: 'technical_engineering',
    primaryStat: 'INT',
    minStatValue: 60,
    optimalStatValue: 80,
    description: 'Computer intrusion, network security, and data operations.',
    isRestricted: false,
    specializations: [
      {
        id: 'network_intrusion',
        name: 'Network Intrusion',
        parentField: 'hacking',
        description: 'Breaking into computer systems and networks.',
        skillUnlocks: ['system_hack', 'network_breach', 'data_theft'],
        equipmentUnlocks: ['hacking_rig', 'exploit_kit'],
        jobUnlocks: ['penetration_tester', 'cyber_criminal'],
      },
      {
        id: 'cyber_defense',
        name: 'Cyber Defense',
        parentField: 'hacking',
        description: 'Protecting systems from intrusion and attack.',
        skillUnlocks: ['firewall_setup', 'intrusion_detection', 'counter_hack'],
        equipmentUnlocks: ['security_software', 'monitoring_system'],
        jobUnlocks: ['security_analyst', 'soc_operator'],
      },
    ],
  },
  {
    id: 'power_systems',
    name: 'Power Systems',
    category: 'technical_engineering',
    primaryStat: 'INT',
    minStatValue: 55,
    optimalStatValue: 75,
    description: 'Energy systems, reactors, and power generation.',
    isRestricted: false,
    specializations: [
      {
        id: 'portable_power',
        name: 'Portable Power',
        parentField: 'power_systems',
        description: 'Batteries, generators, and mobile power sources.',
        skillUnlocks: ['generator_repair', 'battery_optimization', 'power_armor_repair'],
        equipmentUnlocks: ['power_cells', 'field_generator'],
        jobUnlocks: ['power_tech', 'field_engineer'],
      },
      {
        id: 'reactor_tech',
        name: 'Reactor Technology',
        parentField: 'power_systems',
        description: 'Large-scale power plants and reactor systems.',
        skillUnlocks: ['reactor_operation', 'containment', 'emergency_shutdown'],
        equipmentUnlocks: ['reactor_toolkit', 'radiation_gear'],
        jobUnlocks: ['reactor_operator', 'power_plant_engineer'],
      },
    ],
  },
  {
    id: 'weapons_smithing',
    name: 'Weapons Smithing',
    category: 'technical_engineering',
    primaryStat: 'INT',
    secondaryStat: 'DEX',
    minStatValue: 50,
    optimalStatValue: 70,
    description: 'Weapon modification, custom builds, and advanced crafting.',
    isRestricted: false,
    specializations: [
      {
        id: 'firearm_customization',
        name: 'Firearm Customization',
        parentField: 'weapons_smithing',
        description: 'Modifying and improving firearms.',
        skillUnlocks: ['weapon_mod', 'custom_barrel', 'trigger_job'],
        equipmentUnlocks: ['gunsmith_bench', 'precision_tools'],
        jobUnlocks: ['gunsmith', 'custom_firearms_dealer'],
      },
      {
        id: 'melee_crafting',
        name: 'Melee Weapon Crafting',
        parentField: 'weapons_smithing',
        description: 'Creating and improving melee weapons.',
        skillUnlocks: ['blade_forging', 'weapon_balance', 'edge_treatment'],
        equipmentUnlocks: ['forge', 'metalworking_tools'],
        jobUnlocks: ['bladesmith', 'prop_maker'],
      },
    ],
  },

  // =========== LIFE SCIENCES ===========
  {
    id: 'medicine',
    name: 'Medicine',
    category: 'life_sciences',
    primaryStat: 'INT',
    secondaryStat: 'INS',
    minStatValue: 55,
    optimalStatValue: 80,
    description: 'Medical diagnosis, treatment, and surgery.',
    isRestricted: false,
    specializations: [
      {
        id: 'general_practice',
        name: 'General Practice',
        parentField: 'medicine',
        description: 'Primary care and general medical treatment.',
        skillUnlocks: ['diagnosis', 'treatment', 'prescription'],
        equipmentUnlocks: ['medical_bag', 'diagnostic_tools'],
        jobUnlocks: ['doctor', 'clinic_physician'],
      },
      {
        id: 'surgery',
        name: 'Surgery',
        parentField: 'medicine',
        description: 'Surgical procedures and operations.',
        skillUnlocks: ['surgery', 'organ_repair', 'transplant'],
        equipmentUnlocks: ['surgical_suite', 'operating_tools'],
        jobUnlocks: ['surgeon', 'hospital_chief'],
      },
      {
        id: 'pharmacology',
        name: 'Pharmacology',
        parentField: 'medicine',
        description: 'Drugs, medications, and compound creation.',
        skillUnlocks: ['drug_creation', 'dosage_calc', 'antidote_synthesis'],
        equipmentUnlocks: ['pharmacy_lab', 'chemical_supplies'],
        jobUnlocks: ['pharmacist', 'pharmaceutical_researcher'],
      },
      {
        id: 'neurology',
        name: 'Neurology',
        parentField: 'medicine',
        description: 'Brain, nervous system, and mental treatment.',
        skillUnlocks: ['neural_treatment', 'mental_healing', 'psionic_treatment'],
        equipmentUnlocks: ['brain_scanner', 'neural_stimulator'],
        jobUnlocks: ['neurologist', 'brain_surgeon'],
      },
    ],
  },
  {
    id: 'biology',
    name: 'Biology',
    category: 'life_sciences',
    primaryStat: 'INT',
    minStatValue: 50,
    optimalStatValue: 70,
    description: 'Living systems, anatomy, and biological processes.',
    isRestricted: false,
    specializations: [
      {
        id: 'anatomy',
        name: 'Anatomy',
        parentField: 'biology',
        description: 'Body structure and weak points.',
        skillUnlocks: ['weak_point_targeting', 'vital_strike', 'autopsy'],
        equipmentUnlocks: ['anatomy_charts', 'dissection_kit'],
        jobUnlocks: ['anatomist', 'forensic_pathologist'],
      },
      {
        id: 'xenobiology',
        name: 'Xenobiology',
        parentField: 'biology',
        description: 'Alien and non-human biological systems.',
        skillUnlocks: ['alien_anatomy', 'creature_study', 'exotic_treatment'],
        equipmentUnlocks: ['specimen_containers', 'analysis_equipment'],
        jobUnlocks: ['xenobiologist', 'creature_handler'],
      },
    ],
  },
  {
    id: 'botany',
    name: 'Botany',
    category: 'life_sciences',
    primaryStat: 'INT',
    secondaryStat: 'INS',
    minStatValue: 40,
    optimalStatValue: 60,
    description: 'Plants, toxins, and natural medicines.',
    isRestricted: false,
    specializations: [
      {
        id: 'medicinal_plants',
        name: 'Medicinal Plants',
        parentField: 'botany',
        description: 'Herbs and plants with healing properties.',
        skillUnlocks: ['herb_identification', 'natural_remedy', 'cultivation'],
        equipmentUnlocks: ['greenhouse', 'herb_garden'],
        jobUnlocks: ['herbalist', 'natural_healer'],
      },
      {
        id: 'toxicology',
        name: 'Toxicology',
        parentField: 'botany',
        description: 'Poisons, venoms, and toxic substances.',
        skillUnlocks: ['poison_creation', 'antidote_creation', 'toxin_identification'],
        equipmentUnlocks: ['toxin_lab', 'poison_kit'],
        jobUnlocks: ['toxicologist', 'poison_expert'],
      },
    ],
  },
  {
    id: 'genetics',
    name: 'Genetics',
    category: 'life_sciences',
    primaryStat: 'INT',
    minStatValue: 65,
    optimalStatValue: 85,
    description: 'DNA, mutations, and genetic engineering.',
    isRestricted: false,
    specializations: [
      {
        id: 'gene_therapy',
        name: 'Gene Therapy',
        parentField: 'genetics',
        description: 'Treating genetic conditions and enhancement.',
        skillUnlocks: ['gene_editing', 'mutation_treatment', 'enhancement'],
        equipmentUnlocks: ['gene_lab', 'crispr_kit'],
        jobUnlocks: ['geneticist', 'gene_therapist'],
      },
      {
        id: 'cloning',
        name: 'Cloning',
        parentField: 'genetics',
        description: 'Biological replication and clone creation.',
        skillUnlocks: ['clone_creation', 'memory_transfer', 'accelerated_growth'],
        equipmentUnlocks: ['cloning_tank', 'dna_sequencer'],
        jobUnlocks: ['clone_tech', 'cloning_facility_director'],
      },
    ],
  },
  {
    id: 'chemistry',
    name: 'Chemistry',
    category: 'life_sciences',
    primaryStat: 'INT',
    minStatValue: 50,
    optimalStatValue: 70,
    description: 'Chemical compounds, reactions, and synthesis.',
    isRestricted: false,
    specializations: [
      {
        id: 'organic_chemistry',
        name: 'Organic Chemistry',
        parentField: 'chemistry',
        description: 'Carbon-based compounds and drugs.',
        skillUnlocks: ['drug_synthesis', 'compound_creation', 'quality_analysis'],
        equipmentUnlocks: ['chem_lab', 'synthesis_equipment'],
        jobUnlocks: ['chemist', 'lab_technician'],
      },
      {
        id: 'explosives_chemistry',
        name: 'Explosives Chemistry',
        parentField: 'chemistry',
        description: 'Explosive compounds and propellants.',
        skillUnlocks: ['explosive_synthesis', 'propellant_creation', 'stable_compounds'],
        equipmentUnlocks: ['explosives_lab', 'mixing_equipment'],
        jobUnlocks: ['explosives_chemist', 'pyrotechnician'],
      },
    ],
  },
  {
    id: 'forensics',
    name: 'Forensics',
    category: 'life_sciences',
    primaryStat: 'INT',
    secondaryStat: 'INS',
    minStatValue: 50,
    optimalStatValue: 70,
    description: 'Crime scene analysis and evidence processing.',
    isRestricted: false,
    specializations: [
      {
        id: 'crime_scene',
        name: 'Crime Scene Investigation',
        parentField: 'forensics',
        description: 'Evidence collection and scene analysis.',
        skillUnlocks: ['evidence_collection', 'scene_reconstruction', 'trace_analysis'],
        equipmentUnlocks: ['forensic_kit', 'evidence_containers'],
        jobUnlocks: ['csi', 'forensic_investigator'],
      },
      {
        id: 'digital_forensics',
        name: 'Digital Forensics',
        parentField: 'forensics',
        description: 'Computer and digital evidence analysis.',
        skillUnlocks: ['data_recovery', 'device_analysis', 'digital_trail'],
        equipmentUnlocks: ['forensic_workstation', 'data_recovery_tools'],
        jobUnlocks: ['digital_forensic_analyst', 'cyber_investigator'],
      },
    ],
  },

  // =========== SOCIAL/INTELLIGENCE ===========
  {
    id: 'psychology',
    name: 'Psychology',
    category: 'social_intel',
    primaryStat: 'INS',
    secondaryStat: 'CON',
    minStatValue: 45,
    optimalStatValue: 70,
    description: 'Mind, behavior, and psychological manipulation.',
    isRestricted: false,
    specializations: [
      {
        id: 'profiling',
        name: 'Criminal Profiling',
        parentField: 'psychology',
        description: 'Understanding criminal minds and behavior.',
        skillUnlocks: ['profiling', 'behavior_prediction', 'motive_analysis'],
        equipmentUnlocks: ['case_files', 'analysis_software'],
        jobUnlocks: ['profiler', 'criminal_psychologist'],
      },
      {
        id: 'therapy',
        name: 'Therapy',
        parentField: 'psychology',
        description: 'Mental health treatment and counseling.',
        skillUnlocks: ['counseling', 'trauma_treatment', 'morale_boost'],
        equipmentUnlocks: ['therapy_office', 'assessment_tools'],
        jobUnlocks: ['therapist', 'counselor'],
      },
      {
        id: 'manipulation',
        name: 'Manipulation',
        parentField: 'psychology',
        description: 'Psychological influence and control.',
        skillUnlocks: ['persuasion', 'gaslighting', 'cult_tactics'],
        equipmentUnlocks: ['propaganda_materials', 'influence_tools'],
        jobUnlocks: ['cult_expert', 'influence_consultant'],
      },
    ],
  },
  {
    id: 'interrogation',
    name: 'Interrogation',
    category: 'social_intel',
    primaryStat: 'INS',
    secondaryStat: 'CON',
    minStatValue: 50,
    optimalStatValue: 70,
    description: 'Information extraction and resistance techniques.',
    isRestricted: false,
    specializations: [
      {
        id: 'enhanced_questioning',
        name: 'Enhanced Questioning',
        parentField: 'interrogation',
        description: 'Advanced interrogation techniques.',
        skillUnlocks: ['interrogation', 'stress_positions', 'truth_detection'],
        equipmentUnlocks: ['interrogation_room', 'polygraph'],
        jobUnlocks: ['interrogator', 'intel_officer'],
      },
      {
        id: 'resistance_training',
        name: 'Resistance Training',
        parentField: 'interrogation',
        description: 'Resisting interrogation and torture.',
        skillUnlocks: ['interrogation_resistance', 'cover_maintenance', 'pain_tolerance'],
        equipmentUnlocks: ['sere_manual', 'resistance_training'],
        jobUnlocks: ['sere_instructor', 'resistance_trainer'],
      },
    ],
  },
  {
    id: 'diplomacy',
    name: 'Diplomacy',
    category: 'social_intel',
    primaryStat: 'CON',
    secondaryStat: 'INS',
    minStatValue: 45,
    optimalStatValue: 65,
    description: 'Negotiation, de-escalation, and faction relations.',
    isRestricted: false,
    specializations: [
      {
        id: 'negotiation',
        name: 'Negotiation',
        parentField: 'diplomacy',
        description: 'Deal-making and conflict resolution.',
        skillUnlocks: ['negotiation', 'hostage_negotiation', 'deal_making'],
        equipmentUnlocks: ['diplomatic_credentials', 'secure_comms'],
        jobUnlocks: ['negotiator', 'diplomat'],
      },
      {
        id: 'faction_relations',
        name: 'Faction Relations',
        parentField: 'diplomacy',
        description: 'Managing relationships between groups.',
        skillUnlocks: ['faction_diplomacy', 'alliance_building', 'peace_treaty'],
        equipmentUnlocks: ['faction_database', 'diplomatic_gifts'],
        jobUnlocks: ['faction_liaison', 'ambassador'],
      },
    ],
  },
  {
    id: 'languages',
    name: 'Languages',
    category: 'social_intel',
    primaryStat: 'INT',
    secondaryStat: 'INS',
    minStatValue: 40,
    optimalStatValue: 60,
    description: 'Foreign languages, codes, and communication.',
    isRestricted: false,
    specializations: [
      {
        id: 'regional_languages',
        name: 'Regional Languages',
        parentField: 'languages',
        description: 'Spoken languages of specific regions.',
        skillUnlocks: ['language_fluency', 'dialect_recognition', 'cultural_knowledge'],
        equipmentUnlocks: ['translation_software', 'phrase_books'],
        jobUnlocks: ['translator', 'interpreter'],
      },
      {
        id: 'cryptography',
        name: 'Cryptography',
        parentField: 'languages',
        description: 'Codes, ciphers, and encryption.',
        skillUnlocks: ['code_breaking', 'cipher_creation', 'message_encryption'],
        equipmentUnlocks: ['crypto_software', 'cipher_tools'],
        jobUnlocks: ['cryptanalyst', 'signals_intel'],
      },
    ],
  },
  {
    id: 'investigation',
    name: 'Investigation',
    category: 'social_intel',
    primaryStat: 'INS',
    secondaryStat: 'INT',
    minStatValue: 45,
    optimalStatValue: 65,
    description: 'Detective work, analysis, and case management.',
    isRestricted: false,
    specializations: [
      {
        id: 'detective_work',
        name: 'Detective Work',
        parentField: 'investigation',
        description: 'Traditional investigative techniques.',
        skillUnlocks: ['clue_discovery', 'witness_interview', 'case_solving'],
        equipmentUnlocks: ['detective_kit', 'case_management'],
        jobUnlocks: ['private_investigator', 'detective'],
      },
      {
        id: 'intel_analysis',
        name: 'Intelligence Analysis',
        parentField: 'investigation',
        description: 'Processing and analyzing intelligence data.',
        skillUnlocks: ['intel_analysis', 'pattern_recognition', 'threat_assessment'],
        equipmentUnlocks: ['analysis_software', 'intel_database'],
        jobUnlocks: ['intel_analyst', 'threat_analyst'],
      },
    ],
  },
  {
    id: 'undercover_ops',
    name: 'Undercover Operations',
    category: 'social_intel',
    primaryStat: 'CON',
    secondaryStat: 'INS',
    minStatValue: 55,
    optimalStatValue: 75,
    description: 'Disguise, infiltration, and long-term placement.',
    isRestricted: false,
    specializations: [
      {
        id: 'disguise',
        name: 'Disguise',
        parentField: 'undercover_ops',
        description: 'Physical appearance alteration.',
        skillUnlocks: ['disguise', 'voice_change', 'mannerism_mimicry'],
        equipmentUnlocks: ['disguise_kit', 'prosthetics'],
        jobUnlocks: ['makeup_artist', 'disguise_specialist'],
      },
      {
        id: 'deep_cover',
        name: 'Deep Cover',
        parentField: 'undercover_ops',
        description: 'Long-term identity maintenance.',
        skillUnlocks: ['cover_identity', 'legend_building', 'handler_contact'],
        equipmentUnlocks: ['fake_documents', 'backstop_materials'],
        jobUnlocks: ['deep_cover_agent', 'infiltration_specialist'],
      },
    ],
  },
  {
    id: 'tradecraft',
    name: 'Tradecraft',
    category: 'social_intel',
    primaryStat: 'INS',
    secondaryStat: 'CON',
    minStatValue: 50,
    optimalStatValue: 70,
    description: 'Spy skills, dead drops, and covert operations.',
    isRestricted: false,
    specializations: [
      {
        id: 'surveillance',
        name: 'Surveillance',
        parentField: 'tradecraft',
        description: 'Watching and tracking targets.',
        skillUnlocks: ['surveillance', 'counter_surveillance', 'tracking'],
        equipmentUnlocks: ['surveillance_gear', 'tracking_devices'],
        jobUnlocks: ['surveillance_operator', 'private_eye'],
      },
      {
        id: 'covert_comms',
        name: 'Covert Communications',
        parentField: 'tradecraft',
        description: 'Secret communication methods.',
        skillUnlocks: ['dead_drop', 'brush_pass', 'secure_messaging'],
        equipmentUnlocks: ['covert_radio', 'signal_gear'],
        jobUnlocks: ['signals_officer', 'courier'],
      },
    ],
  },

  // =========== SUPER-SCIENCE (Restricted) ===========
  {
    id: 'alien_technology',
    name: 'Alien Technology',
    category: 'super_science',
    primaryStat: 'INT',
    minStatValue: 70,
    optimalStatValue: 90,
    description: 'Reverse engineering and operating alien equipment.',
    isRestricted: true,
    restrictionRequirement: 'INT 70+, existing science degree, special facility access',
    specializations: [
      {
        id: 'reverse_engineering',
        name: 'Reverse Engineering',
        parentField: 'alien_technology',
        description: 'Understanding and replicating alien tech.',
        skillUnlocks: ['alien_tech_analysis', 'reverse_engineer', 'tech_adaptation'],
        equipmentUnlocks: ['alien_lab', 'analysis_tools'],
        jobUnlocks: ['xenotech_researcher', 'area_51_scientist'],
      },
      {
        id: 'alien_operation',
        name: 'Alien Equipment Operation',
        parentField: 'alien_technology',
        description: 'Using alien devices and vehicles.',
        skillUnlocks: ['alien_weapon_use', 'alien_vehicle', 'alien_interface'],
        equipmentUnlocks: ['alien_equipment_access', 'translation_device'],
        jobUnlocks: ['alien_tech_operator', 'first_contact_specialist'],
      },
    ],
  },
  {
    id: 'dimensional_physics',
    name: 'Dimensional Physics',
    category: 'super_science',
    primaryStat: 'INT',
    minStatValue: 75,
    optimalStatValue: 95,
    description: 'Portals, alternate realities, and dimensional travel.',
    isRestricted: true,
    restrictionRequirement: 'INT 75+, physics doctorate, dimensional incident exposure',
    specializations: [
      {
        id: 'portal_tech',
        name: 'Portal Technology',
        parentField: 'dimensional_physics',
        description: 'Creating and controlling dimensional gates.',
        skillUnlocks: ['portal_creation', 'dimensional_anchor', 'gate_stabilization'],
        equipmentUnlocks: ['portal_device', 'dimensional_scanner'],
        jobUnlocks: ['portal_technician', 'dimensional_researcher'],
      },
    ],
  },
  {
    id: 'power_augmentation',
    name: 'Power Augmentation',
    category: 'super_science',
    primaryStat: 'INT',
    minStatValue: 70,
    optimalStatValue: 85,
    description: 'Enhancing and modifying superhuman abilities.',
    isRestricted: true,
    restrictionRequirement: 'INT 70+, genetics or physics degree, superhuman subject access',
    specializations: [
      {
        id: 'power_enhancement',
        name: 'Power Enhancement',
        parentField: 'power_augmentation',
        description: 'Boosting existing superhuman powers.',
        skillUnlocks: ['power_boost', 'ability_unlock', 'power_control'],
        equipmentUnlocks: ['enhancement_chamber', 'power_analyzer'],
        jobUnlocks: ['power_researcher', 'enhancement_specialist'],
      },
    ],
  },
  {
    id: 'exotic_energy',
    name: 'Exotic Energy',
    category: 'super_science',
    primaryStat: 'INT',
    minStatValue: 75,
    optimalStatValue: 90,
    description: 'Plasma, dark matter, antimatter, and exotic particles.',
    isRestricted: true,
    restrictionRequirement: 'INT 75+, physics doctorate, CERN or equivalent access',
    specializations: [
      {
        id: 'plasma_weapons',
        name: 'Plasma Weapons',
        parentField: 'exotic_energy',
        description: 'Plasma-based weapon systems.',
        skillUnlocks: ['plasma_weapon_use', 'containment_field', 'energy_shaping'],
        equipmentUnlocks: ['plasma_weapon', 'containment_unit'],
        jobUnlocks: ['plasma_physicist', 'weapons_researcher'],
      },
      {
        id: 'antimatter',
        name: 'Antimatter Research',
        parentField: 'exotic_energy',
        description: 'Antimatter containment and applications.',
        skillUnlocks: ['antimatter_handling', 'annihilation_control', 'am_containment'],
        equipmentUnlocks: ['antimatter_container', 'magnetic_trap'],
        jobUnlocks: ['antimatter_scientist', 'particle_physicist'],
      },
    ],
  },
  {
    id: 'bio_engineering',
    name: 'Bio-Engineering',
    category: 'super_science',
    primaryStat: 'INT',
    minStatValue: 70,
    optimalStatValue: 90,
    description: 'Super-soldier creation and biological enhancement.',
    isRestricted: true,
    restrictionRequirement: 'INT 70+, genetics doctorate, black site access',
    specializations: [
      {
        id: 'super_soldier',
        name: 'Super Soldier Program',
        parentField: 'bio_engineering',
        description: 'Creating enhanced human soldiers.',
        skillUnlocks: ['enhancement_protocol', 'serum_creation', 'subject_stabilization'],
        equipmentUnlocks: ['enhancement_lab', 'serum_supplies'],
        jobUnlocks: ['supersoldier_researcher', 'enhancement_scientist'],
      },
      {
        id: 'origin_modification',
        name: 'Origin Modification',
        parentField: 'bio_engineering',
        description: 'Modifying superhuman origin types.',
        skillUnlocks: ['origin_analysis', 'origin_enhancement', 'origin_transfer'],
        equipmentUnlocks: ['origin_scanner', 'modification_chamber'],
        jobUnlocks: ['origin_specialist', 'mutation_researcher'],
      },
    ],
  },

  // =========== OCCULT/MYSTICAL (Restricted) ===========
  {
    id: 'temple_training',
    name: 'Temple Training',
    category: 'occult_mystical',
    primaryStat: 'INS',
    secondaryStat: 'CON',
    minStatValue: 50,
    optimalStatValue: 70,
    description: 'Meditation, focus, and mental discipline.',
    isRestricted: true,
    restrictionRequirement: 'Spiritual Enhancement origin OR temple sponsorship',
    specializations: [
      {
        id: 'meditation',
        name: 'Advanced Meditation',
        parentField: 'temple_training',
        description: 'Deep meditative states and mental fortitude.',
        skillUnlocks: ['deep_meditation', 'mental_fortress', 'chi_focus'],
        equipmentUnlocks: ['meditation_chamber', 'focus_tools'],
        jobUnlocks: ['meditation_master', 'temple_guardian'],
      },
      {
        id: 'zen_combat',
        name: 'Zen Combat',
        parentField: 'temple_training',
        description: 'Combining martial arts with spiritual focus.',
        skillUnlocks: ['zen_strike', 'spirit_defense', 'flow_state'],
        equipmentUnlocks: ['temple_weapons', 'spirit_armor'],
        jobUnlocks: ['temple_warrior', 'spiritual_bodyguard'],
      },
    ],
  },
  {
    id: 'arcane_studies',
    name: 'Arcane Studies',
    category: 'occult_mystical',
    primaryStat: 'INS',
    secondaryStat: 'INT',
    minStatValue: 55,
    optimalStatValue: 75,
    description: 'Magical theory, ritual casting, and artifact use.',
    isRestricted: true,
    restrictionRequirement: 'Spiritual Enhancement origin OR occult incident exposure',
    specializations: [
      {
        id: 'ritual_magic',
        name: 'Ritual Magic',
        parentField: 'arcane_studies',
        description: 'Ceremonial magic and complex rituals.',
        skillUnlocks: ['ritual_casting', 'circle_creation', 'component_preparation'],
        equipmentUnlocks: ['ritual_components', 'arcane_circle'],
        jobUnlocks: ['ritualist', 'occult_consultant'],
      },
      {
        id: 'artifact_use',
        name: 'Artifact Expertise',
        parentField: 'arcane_studies',
        description: 'Using and understanding magical items.',
        skillUnlocks: ['artifact_identification', 'artifact_activation', 'artifact_repair'],
        equipmentUnlocks: ['artifact_detector', 'containment_vessel'],
        jobUnlocks: ['artifact_hunter', 'museum_occultist'],
      },
    ],
  },
  {
    id: 'spirit_communion',
    name: 'Spirit Communion',
    category: 'occult_mystical',
    primaryStat: 'INS',
    minStatValue: 60,
    optimalStatValue: 80,
    description: 'Contact with otherworldly beings and spirits.',
    isRestricted: true,
    restrictionRequirement: 'Spiritual Enhancement origin, near-death experience, or spirit encounter',
    specializations: [
      {
        id: 'medium',
        name: 'Medium',
        parentField: 'spirit_communion',
        description: 'Communicating with spirits and ghosts.',
        skillUnlocks: ['spirit_speak', 'seance', 'ghost_sight'],
        equipmentUnlocks: ['spirit_board', 'ectoplasm_detector'],
        jobUnlocks: ['medium', 'spirit_investigator'],
      },
      {
        id: 'possession_defense',
        name: 'Possession Defense',
        parentField: 'spirit_communion',
        description: 'Protecting against spiritual possession.',
        skillUnlocks: ['exorcism', 'ward_creation', 'spirit_binding'],
        equipmentUnlocks: ['holy_symbols', 'binding_materials'],
        jobUnlocks: ['exorcist', 'spiritual_defender'],
      },
    ],
  },
  {
    id: 'divine_connection',
    name: 'Divine Connection',
    category: 'occult_mystical',
    primaryStat: 'INS',
    secondaryStat: 'CON',
    minStatValue: 55,
    optimalStatValue: 75,
    description: 'Faith-based powers and divine intervention.',
    isRestricted: true,
    restrictionRequirement: 'Spiritual Enhancement origin OR religious devotion (temple membership)',
    specializations: [
      {
        id: 'faith_healing',
        name: 'Faith Healing',
        parentField: 'divine_connection',
        description: 'Healing through divine power.',
        skillUnlocks: ['divine_healing', 'blessing', 'cure_affliction'],
        equipmentUnlocks: ['holy_relics', 'blessed_water'],
        jobUnlocks: ['faith_healer', 'temple_priest'],
      },
      {
        id: 'divine_smite',
        name: 'Divine Smite',
        parentField: 'divine_connection',
        description: 'Channeling divine wrath against evil.',
        skillUnlocks: ['holy_strike', 'turn_undead', 'divine_judgment'],
        equipmentUnlocks: ['sacred_weapon', 'holy_armor'],
        jobUnlocks: ['holy_warrior', 'temple_champion'],
      },
    ],
  },
  {
    id: 'occult_investigation',
    name: 'Occult Investigation',
    category: 'occult_mystical',
    primaryStat: 'INS',
    secondaryStat: 'INT',
    minStatValue: 50,
    optimalStatValue: 70,
    description: 'Investigating supernatural threats and phenomena.',
    isRestricted: true,
    restrictionRequirement: 'Occult incident exposure OR agency recruitment (Vatican, etc.)',
    specializations: [
      {
        id: 'curse_breaking',
        name: 'Curse Breaking',
        parentField: 'occult_investigation',
        description: 'Identifying and removing curses.',
        skillUnlocks: ['curse_identification', 'curse_removal', 'hex_protection'],
        equipmentUnlocks: ['curse_detector', 'cleansing_materials'],
        jobUnlocks: ['curse_breaker', 'occult_detective'],
      },
      {
        id: 'monster_hunting',
        name: 'Monster Hunting',
        parentField: 'occult_investigation',
        description: 'Tracking and eliminating supernatural threats.',
        skillUnlocks: ['monster_lore', 'weakness_identification', 'silver_weapons'],
        equipmentUnlocks: ['monster_hunter_kit', 'specialized_weapons'],
        jobUnlocks: ['monster_hunter', 'supernatural_agent'],
      },
    ],
  },

  // =========== UNDERGROUND/CRIMINAL (Restricted) ===========
  {
    id: 'safecracking',
    name: 'Safecracking',
    category: 'underground_criminal',
    primaryStat: 'DEX',
    secondaryStat: 'INT',
    minStatValue: 50,
    optimalStatValue: 70,
    description: 'Opening locks, vaults, and security containers.',
    isRestricted: true,
    restrictionRequirement: 'Criminal contacts OR underworld reputation',
    specializations: [
      {
        id: 'mechanical_locks',
        name: 'Mechanical Locks',
        parentField: 'safecracking',
        description: 'Traditional lock picking and safe manipulation.',
        skillUnlocks: ['lock_picking', 'safe_manipulation', 'vault_cracking'],
        equipmentUnlocks: ['lockpick_set', 'safe_tools'],
        jobUnlocks: ['locksmith', 'security_consultant'],
      },
      {
        id: 'electronic_bypass',
        name: 'Electronic Bypass',
        parentField: 'safecracking',
        description: 'Defeating electronic security systems.',
        skillUnlocks: ['electronic_bypass', 'keycard_clone', 'biometric_spoof'],
        equipmentUnlocks: ['bypass_kit', 'cloning_device'],
        jobUnlocks: ['security_penetration', 'tech_thief'],
      },
    ],
  },
  {
    id: 'forgery',
    name: 'Forgery',
    category: 'underground_criminal',
    primaryStat: 'DEX',
    secondaryStat: 'INT',
    minStatValue: 45,
    optimalStatValue: 65,
    description: 'Creating fake documents, IDs, and currency.',
    isRestricted: true,
    restrictionRequirement: 'Criminal contacts OR document access',
    specializations: [
      {
        id: 'document_forgery',
        name: 'Document Forgery',
        parentField: 'forgery',
        description: 'Passports, licenses, and official papers.',
        skillUnlocks: ['passport_forge', 'license_forge', 'official_documents'],
        equipmentUnlocks: ['forgery_tools', 'document_templates'],
        jobUnlocks: ['document_forger', 'identity_specialist'],
      },
      {
        id: 'art_forgery',
        name: 'Art Forgery',
        parentField: 'forgery',
        description: 'Faking artwork and valuable items.',
        skillUnlocks: ['art_replication', 'provenance_fake', 'material_aging'],
        equipmentUnlocks: ['art_supplies', 'aging_materials'],
        jobUnlocks: ['art_forger', 'antiquities_faker'],
      },
    ],
  },
  {
    id: 'assassination',
    name: 'Assassination',
    category: 'underground_criminal',
    primaryStat: 'DEX',
    secondaryStat: 'MEL',
    minStatValue: 60,
    optimalStatValue: 80,
    description: 'Silent kills, contracts, and target elimination.',
    isRestricted: true,
    restrictionRequirement: 'Criminal organization OR government black ops',
    specializations: [
      {
        id: 'silent_kills',
        name: 'Silent Elimination',
        parentField: 'assassination',
        description: 'Undetected target elimination.',
        skillUnlocks: ['silent_kill', 'body_disposal', 'no_trace'],
        equipmentUnlocks: ['silenced_weapon', 'garrote'],
        jobUnlocks: ['assassin', 'wet_work_specialist'],
      },
      {
        id: 'poison_master',
        name: 'Poison Master',
        parentField: 'assassination',
        description: 'Using toxins for untraceable kills.',
        skillUnlocks: ['undetectable_poison', 'slow_acting', 'contact_poison'],
        equipmentUnlocks: ['poison_kit', 'delivery_devices'],
        jobUnlocks: ['poisoner', 'chemical_assassin'],
      },
    ],
  },
  {
    id: 'smuggling',
    name: 'Smuggling',
    category: 'underground_criminal',
    primaryStat: 'INS',
    secondaryStat: 'CON',
    minStatValue: 45,
    optimalStatValue: 65,
    description: 'Contraband transport and border evasion.',
    isRestricted: true,
    restrictionRequirement: 'Criminal contacts OR shipping access',
    specializations: [
      {
        id: 'border_crossing',
        name: 'Border Crossing',
        parentField: 'smuggling',
        description: 'Moving goods across borders undetected.',
        skillUnlocks: ['border_evasion', 'customs_bribe', 'route_planning'],
        equipmentUnlocks: ['hidden_compartments', 'false_documents'],
        jobUnlocks: ['border_runner', 'coyote'],
      },
      {
        id: 'concealment',
        name: 'Concealment',
        parentField: 'smuggling',
        description: 'Hiding contraband in plain sight.',
        skillUnlocks: ['cavity_search_proof', 'scanner_defeat', 'creative_hiding'],
        equipmentUnlocks: ['concealment_containers', 'shielded_compartments'],
        jobUnlocks: ['concealment_expert', 'drug_mule_trainer'],
      },
    ],
  },
  {
    id: 'black_market',
    name: 'Black Market Operations',
    category: 'underground_criminal',
    primaryStat: 'CON',
    secondaryStat: 'INS',
    minStatValue: 50,
    optimalStatValue: 70,
    description: 'Illegal trade networks and rare item acquisition.',
    isRestricted: true,
    restrictionRequirement: 'Underworld reputation OR criminal organization membership',
    specializations: [
      {
        id: 'weapons_trafficking',
        name: 'Weapons Trafficking',
        parentField: 'black_market',
        description: 'Illegal arms dealing.',
        skillUnlocks: ['arms_connection', 'military_surplus', 'exotic_weapons'],
        equipmentUnlocks: ['weapons_catalog', 'supplier_contacts'],
        jobUnlocks: ['arms_dealer', 'gunrunner'],
      },
      {
        id: 'rare_items',
        name: 'Rare Items',
        parentField: 'black_market',
        description: 'Acquiring hard-to-find goods.',
        skillUnlocks: ['item_location', 'auction_access', 'collector_network'],
        equipmentUnlocks: ['item_database', 'buyer_contacts'],
        jobUnlocks: ['fence', 'rare_goods_dealer'],
      },
    ],
  },
  {
    id: 'money_laundering',
    name: 'Money Laundering',
    category: 'underground_criminal',
    primaryStat: 'INT',
    secondaryStat: 'CON',
    minStatValue: 55,
    optimalStatValue: 75,
    description: 'Financial crimes and asset concealment.',
    isRestricted: true,
    restrictionRequirement: 'Criminal organization OR financial sector access',
    specializations: [
      {
        id: 'shell_companies',
        name: 'Shell Companies',
        parentField: 'money_laundering',
        description: 'Creating fronts for illegal money.',
        skillUnlocks: ['company_creation', 'paper_trail_hiding', 'offshore_accounts'],
        equipmentUnlocks: ['incorporation_docs', 'banking_access'],
        jobUnlocks: ['money_launderer', 'financial_crime_specialist'],
      },
      {
        id: 'crypto_washing',
        name: 'Cryptocurrency Washing',
        parentField: 'money_laundering',
        description: 'Using digital currency to hide funds.',
        skillUnlocks: ['crypto_tumbling', 'wallet_obfuscation', 'exchange_manipulation'],
        equipmentUnlocks: ['crypto_wallet', 'mixing_service'],
        jobUnlocks: ['crypto_launderer', 'dark_web_banker'],
      },
    ],
  },
];

// ============================================================================
// INSTITUTIONS
// ============================================================================

export const INSTITUTIONS: Institution[] = [
  // === ELITE TIER (5) ===
  {
    id: 'mit',
    name: 'Massachusetts Institute of Technology',
    country: 'USA',
    city: 'Cambridge',
    tier: 5,
    specialties: ['robotics', 'hacking', 'power_systems', 'electronics'],
    uniqueBenefits: ['+1 tier to all tech degrees', 'AI research access'],
    timeModifier: 0.75,
    costModifier: 2.5,
    qualityModifier: 1.2,
  },
  {
    id: 'johns_hopkins',
    name: 'Johns Hopkins University',
    country: 'USA',
    city: 'Baltimore',
    tier: 5,
    specialties: ['medicine', 'biology', 'genetics', 'forensics'],
    uniqueBenefits: ['Surgery skill +10%', 'Hospital network access'],
    timeModifier: 0.75,
    costModifier: 2.5,
    qualityModifier: 1.2,
  },
  {
    id: 'west_point',
    name: 'United States Military Academy',
    country: 'USA',
    city: 'West Point',
    tier: 5,
    specialties: ['military_tactics', 'weapons_systems', 'vehicle_combat'],
    uniqueBenefits: ['Command abilities unlock faster', 'Military network'],
    timeModifier: 0.75,
    costModifier: 1.0,
    qualityModifier: 1.2,
    minimumReputation: 30,
  },
  {
    id: 'oxford',
    name: 'University of Oxford',
    country: 'United Kingdom',
    city: 'Oxford',
    tier: 5,
    specialties: ['languages', 'psychology', 'investigation', 'diplomacy'],
    uniqueBenefits: ['Double language learning speed', 'Academic network'],
    timeModifier: 0.75,
    costModifier: 2.0,
    qualityModifier: 1.2,
    requiresVisa: true,
  },
  {
    id: 'cern',
    name: 'CERN Research Center',
    country: 'Switzerland',
    city: 'Geneva',
    tier: 5,
    specialties: ['exotic_energy', 'dimensional_physics', 'power_systems'],
    uniqueBenefits: ['Exotic energy specialization', 'Particle accelerator access'],
    timeModifier: 0.75,
    costModifier: 3.0,
    qualityModifier: 1.3,
    minimumReputation: 50,
    requiresVisa: true,
  },
  {
    id: 'shaolin',
    name: 'Shaolin Temple',
    country: 'China',
    city: 'Dengfeng',
    tier: 5,
    specialties: ['martial_arts', 'temple_training', 'divine_connection'],
    uniqueBenefits: ['Belt advancement +1 tier', 'Spiritual healing for spiritual origins'],
    timeModifier: 0.8,
    costModifier: 0.5,
    qualityModifier: 1.2,
    requiresVisa: true,
  },
  {
    id: 'vatican_academy',
    name: 'Pontifical Academy',
    country: 'Vatican City',
    city: 'Vatican City',
    tier: 5,
    specialties: ['occult_investigation', 'divine_connection', 'arcane_studies'],
    uniqueBenefits: ['Exorcism certification', 'Vatican archives access'],
    timeModifier: 0.8,
    costModifier: 1.0,
    qualityModifier: 1.3,
    minimumReputation: 40,
  },

  // === PREMIUM TIER (4) ===
  {
    id: 'stanford',
    name: 'Stanford University',
    country: 'USA',
    city: 'Stanford',
    tier: 4,
    specialties: ['hacking', 'robotics', 'psychology', 'genetics'],
    timeModifier: 0.85,
    costModifier: 2.0,
    qualityModifier: 1.1,
  },
  {
    id: 'quantico',
    name: 'FBI Academy Quantico',
    country: 'USA',
    city: 'Quantico',
    tier: 4,
    specialties: ['investigation', 'interrogation', 'forensics', 'tradecraft'],
    uniqueBenefits: ['FBI network access', 'Profiling certification'],
    timeModifier: 0.85,
    costModifier: 0.5,
    qualityModifier: 1.1,
    minimumReputation: 20,
  },
  {
    id: 'langley',
    name: 'CIA Training Facility',
    country: 'USA',
    city: 'Langley',
    tier: 4,
    specialties: ['tradecraft', 'undercover_ops', 'languages', 'interrogation'],
    uniqueBenefits: ['Intelligence network', 'Cover identity support'],
    timeModifier: 0.85,
    costModifier: 0.0,
    qualityModifier: 1.1,
    minimumReputation: 30,
  },
  {
    id: 'tokyo_u',
    name: 'University of Tokyo',
    country: 'Japan',
    city: 'Tokyo',
    tier: 4,
    specialties: ['robotics', 'cybernetics', 'medicine', 'electronics'],
    uniqueBenefits: ['Cybernetics specialization', 'Japanese tech access'],
    timeModifier: 0.85,
    costModifier: 1.5,
    qualityModifier: 1.1,
    requiresVisa: true,
  },
  {
    id: 'sorbonne',
    name: 'Sorbonne University',
    country: 'France',
    city: 'Paris',
    tier: 4,
    specialties: ['psychology', 'diplomacy', 'languages', 'investigation'],
    uniqueBenefits: ['Interrogation resistance +20%', 'European network'],
    timeModifier: 0.85,
    costModifier: 1.5,
    qualityModifier: 1.1,
    requiresVisa: true,
  },
  {
    id: 'iit',
    name: 'Indian Institutes of Technology',
    country: 'India',
    city: 'Multiple',
    tier: 4,
    specialties: ['robotics', 'hacking', 'electronics', 'vehicle_engineering'],
    uniqueBenefits: ['Cost -40% for tech degrees', 'Large alumni network'],
    timeModifier: 0.9,
    costModifier: 0.6,
    qualityModifier: 1.0,
    requiresVisa: true,
  },

  // === STANDARD TIER (3) ===
  {
    id: 'state_university',
    name: 'State University (Generic)',
    country: 'USA',
    city: 'Various',
    tier: 3,
    specialties: ['medicine', 'chemistry', 'biology', 'psychology'],
    timeModifier: 1.0,
    costModifier: 1.0,
    qualityModifier: 0.85,
  },
  {
    id: 'police_academy',
    name: 'Police Academy (Generic)',
    country: 'Various',
    city: 'Various',
    tier: 3,
    specialties: ['investigation', 'weapons_systems', 'combat_medicine', 'vehicle_combat'],
    timeModifier: 1.0,
    costModifier: 0.3,
    qualityModifier: 0.8,
  },
  {
    id: 'military_base',
    name: 'Military Training Base (Generic)',
    country: 'Various',
    city: 'Various',
    tier: 3,
    specialties: ['military_tactics', 'weapons_systems', 'demolitions', 'combat_medicine'],
    timeModifier: 0.9,
    costModifier: 0.0,
    qualityModifier: 0.85,
  },

  // === BASIC TIER (2) ===
  {
    id: 'community_college',
    name: 'Community College (Generic)',
    country: 'USA',
    city: 'Various',
    tier: 2,
    specialties: ['vehicle_engineering', 'electronics', 'chemistry', 'forensics'],
    timeModifier: 1.25,
    costModifier: 0.5,
    qualityModifier: 0.7,
  },
  {
    id: 'trade_school',
    name: 'Trade School (Generic)',
    country: 'Various',
    city: 'Various',
    tier: 2,
    specialties: ['vehicle_engineering', 'weapons_smithing', 'electronics'],
    timeModifier: 1.15,
    costModifier: 0.4,
    qualityModifier: 0.7,
  },
  {
    id: 'criminal_mentor',
    name: 'Criminal Mentor',
    country: 'Various',
    city: 'Various',
    tier: 2,
    specialties: ['safecracking', 'forgery', 'smuggling', 'black_market'],
    timeModifier: 1.3,
    costModifier: 0.8,
    qualityModifier: 0.65,
  },

  // === HOME BASE (1) ===
  {
    id: 'home_training',
    name: 'Home Base Training',
    country: 'Any',
    city: 'Player Base',
    tier: 1,
    specialties: [],
    timeModifier: 1.5,
    costModifier: 0.2,
    qualityModifier: 0.5,
  },
  {
    id: 'online_university',
    name: 'Online University',
    country: 'Any',
    city: 'Remote',
    tier: 1,
    specialties: ['hacking', 'languages', 'psychology', 'investigation'],
    timeModifier: 1.4,
    costModifier: 0.7,
    qualityModifier: 0.55,
    restrictedFields: ['martial_arts', 'combat_medicine', 'demolitions'],
  },
];

// ============================================================================
// STARTING BACKGROUNDS
// ============================================================================

export const STARTING_BACKGROUNDS: StartingBackground[] = [
  {
    id: 'former_military',
    name: 'Former Military',
    description: 'Served in armed forces with combat experience.',
    startingEducation: ['basic_military_tactics', 'cert_weapons_systems'],
    statBonuses: { MEL: 2, DEX: 1 },
    startingBudget: 5000,
    specialBenefits: ['Weapon proficiencies', 'Military contacts', 'VA healthcare'],
    startingContacts: ['military'],
  },
  {
    id: 'med_school_dropout',
    name: 'Med School Dropout',
    description: 'Three years of medical school before circumstances intervened.',
    partialProgress: { degreeId: 'doctorate_medicine', progress: 75 },
    statBonuses: { INT: 3 },
    startingBudget: 2000,
    specialBenefits: ['Medical knowledge (no license)', 'Hospital contacts'],
    startingContacts: ['medical'],
  },
  {
    id: 'street_smart',
    name: 'Street Smart',
    description: 'Grew up on the streets, learned survival the hard way.',
    startingEducation: ['cert_safecracking'],
    statBonuses: { INS: 2 },
    startingBudget: 1000,
    specialBenefits: ['Underground contacts', 'Street knowledge', 'Survival instincts'],
    startingContacts: ['criminal'],
  },
  {
    id: 'corporate_drone',
    name: 'Corporate Drone',
    description: 'Years in the corporate world before seeking something more.',
    startingEducation: ['bachelor_generic'],
    statBonuses: { INT: 1, CON: 1 },
    startingBudget: 15000,
    specialBenefits: ['Corporate cover easy', 'Business contacts', '401k savings'],
    startingContacts: ['corporate'],
  },
  {
    id: 'academia',
    name: 'Academic',
    description: 'Spent years in research and higher education.',
    startingEducation: ['master_generic'],
    statBonuses: { INT: 3 },
    startingBudget: 8000,
    specialBenefits: ['Research bonuses', 'Academic network', 'Publication access'],
    startingContacts: ['academic'],
  },
  {
    id: 'trade_worker',
    name: 'Trade Worker',
    description: 'Skilled tradesperson with practical expertise.',
    startingEducation: ['trade_license_vehicle_engineering'],
    statBonuses: { DEX: 2 },
    startingBudget: 10000,
    specialBenefits: ['Hands-on expertise', 'Trade union membership', 'Tool ownership'],
    startingContacts: ['trade'],
  },
  {
    id: 'intelligence_asset',
    name: 'Intelligence Asset',
    description: 'Former intelligence operative or asset.',
    startingEducation: ['advanced_tradecraft'],
    statBonuses: { INS: 2, CON: 1 },
    startingBudget: 5000,
    specialBenefits: ['Cover identity ready', 'Handler contact', 'Spy training'],
    startingContacts: ['intelligence'],
  },
  {
    id: 'trust_fund',
    name: 'Trust Fund',
    description: 'Born wealthy with access to the best education money can buy.',
    startingEducation: ['bachelor_generic'],
    statBonuses: {},
    startingBudget: 50000,
    specialBenefits: ['Choose any Bachelor degree', 'Social connections', 'No work requirement'],
    startingContacts: ['high_society'],
  },
  {
    id: 'immigrant',
    name: 'Immigrant',
    description: 'Came from another country with foreign credentials.',
    startingEducation: ['foreign_degree'],
    statBonuses: { INT: 1 },
    startingBudget: 3000,
    specialBenefits: ['+2 Languages', 'Cultural knowledge', 'Foreign contacts'],
    startingContacts: ['diaspora'],
  },
  {
    id: 'self_taught',
    name: 'Self-Taught',
    description: 'No formal education but a natural learner.',
    startingEducation: [],
    statBonuses: { INT: 2, INS: 2 },
    startingBudget: 5000,
    specialBenefits: ['Learn faster (+10%)', 'Adaptable', 'Certificates only start'],
    startingContacts: [],
  },
  {
    id: 'child_prodigy',
    name: 'Child Prodigy',
    description: 'Genius who earned advanced degrees at a young age.',
    startingEducation: ['doctorate_generic'],
    statBonuses: { INT: 5, MEL: -2 },
    startingBudget: 12000,
    specialBenefits: ['Genius intellect', 'Academic fame', 'Social awkwardness'],
    startingContacts: ['academic'],
  },
  {
    id: 'ex_con',
    name: 'Ex-Convict',
    description: 'Did time and learned skills behind bars.',
    startingEducation: ['diploma_criminal'],
    statBonuses: { MEL: 1, INS: 1 },
    startingBudget: 500,
    specialBenefits: ['Prison contacts', 'Criminal network', 'Survival skills'],
    startingContacts: ['criminal', 'prison'],
  },
];

// ============================================================================
// DAY JOBS
// ============================================================================

export const DAY_JOBS: DayJob[] = [
  // NO EDUCATION REQUIRED
  {
    id: 'janitor',
    name: 'Janitor',
    requiredEducation: [],
    minEducationLevel: 'none',
    weeklyPay: 500,
    hoursPerWeek: 40,
    coverBenefit: 'Access to buildings after hours',
    workplaceAccess: ['keys', 'security_codes'],
    onCallRisk: 10,
    vacationDaysPerMonth: 1,
  },
  {
    id: 'laborer',
    name: 'Construction Laborer',
    requiredEducation: [],
    minEducationLevel: 'none',
    weeklyPay: 700,
    hoursPerWeek: 45,
    coverBenefit: 'Physical fitness cover, site access',
    workplaceAccess: ['construction_sites'],
    onCallRisk: 5,
    vacationDaysPerMonth: 1,
  },
  {
    id: 'fast_food',
    name: 'Fast Food Worker',
    requiredEducation: [],
    minEducationLevel: 'none',
    weeklyPay: 450,
    hoursPerWeek: 35,
    coverBenefit: 'Flexible hours, forgettable',
    onCallRisk: 20,
    vacationDaysPerMonth: 1,
  },

  // CERTIFICATE LEVEL
  {
    id: 'security_guard',
    name: 'Security Guard',
    requiredEducation: ['cert_weapons_systems'],
    minEducationLevel: 'certificate',
    weeklyPay: 900,
    hoursPerWeek: 40,
    coverBenefit: 'Armed, building access, patrol routes',
    workplaceAccess: ['security_systems', 'patrol_areas'],
    informationAccess: ['security_schedules', 'building_layouts'],
    onCallRisk: 30,
    vacationDaysPerMonth: 1,
  },
  {
    id: 'driver',
    name: 'Driver',
    requiredEducation: ['cert_vehicle_combat', 'cert_vehicle_engineering'],
    minEducationLevel: 'certificate',
    weeklyPay: 800,
    hoursPerWeek: 45,
    coverBenefit: 'Vehicle access, route knowledge',
    workplaceAccess: ['company_vehicles'],
    informationAccess: ['delivery_schedules'],
    onCallRisk: 25,
    vacationDaysPerMonth: 1,
  },
  {
    id: 'clerk',
    name: 'Office Clerk',
    requiredEducation: [],
    minEducationLevel: 'certificate',
    weeklyPay: 700,
    hoursPerWeek: 40,
    coverBenefit: 'Office access, document handling',
    workplaceAccess: ['office_areas', 'filing_systems'],
    informationAccess: ['company_records'],
    onCallRisk: 5,
    vacationDaysPerMonth: 2,
  },

  // ASSOCIATE/DIPLOMA LEVEL
  {
    id: 'technician',
    name: 'IT Technician',
    requiredEducation: ['assoc_hacking', 'assoc_electronics'],
    minEducationLevel: 'associate',
    weeklyPay: 1400,
    hoursPerWeek: 40,
    coverBenefit: 'Computer system access, after-hours entry',
    workplaceAccess: ['server_rooms', 'network_infrastructure'],
    informationAccess: ['system_passwords', 'network_maps'],
    onCallRisk: 40,
    vacationDaysPerMonth: 2,
  },
  {
    id: 'emt',
    name: 'EMT / Paramedic',
    requiredEducation: ['assoc_combat_medicine', 'diploma_medicine'],
    minEducationLevel: 'associate',
    weeklyPay: 1200,
    hoursPerWeek: 36,
    coverBenefit: 'Medical access, emergency response cover',
    workplaceAccess: ['hospitals', 'ambulance'],
    informationAccess: ['patient_records', 'emergency_frequencies'],
    onCallRisk: 60,
    vacationDaysPerMonth: 2,
  },

  // BACHELOR LEVEL
  {
    id: 'engineer',
    name: 'Engineer',
    requiredEducation: ['bachelor_robotics', 'bachelor_vehicle_engineering', 'bachelor_power_systems'],
    minEducationLevel: 'bachelor',
    weeklyPay: 2500,
    hoursPerWeek: 45,
    coverBenefit: 'Technical facility access, professional cover',
    workplaceAccess: ['engineering_labs', 'technical_facilities'],
    informationAccess: ['blueprints', 'technical_specs'],
    onCallRisk: 20,
    vacationDaysPerMonth: 3,
  },
  {
    id: 'nurse',
    name: 'Registered Nurse',
    requiredEducation: ['bachelor_medicine'],
    minEducationLevel: 'bachelor',
    weeklyPay: 2200,
    hoursPerWeek: 36,
    coverBenefit: 'Hospital access, medical supplies',
    workplaceAccess: ['hospitals', 'pharmacies'],
    informationAccess: ['patient_records', 'medication_access'],
    onCallRisk: 50,
    vacationDaysPerMonth: 3,
  },
  {
    id: 'analyst',
    name: 'Intelligence Analyst',
    requiredEducation: ['bachelor_investigation', 'bachelor_psychology'],
    minEducationLevel: 'bachelor',
    weeklyPay: 2800,
    hoursPerWeek: 40,
    coverBenefit: 'Agency cover, classified access potential',
    workplaceAccess: ['secure_facilities'],
    informationAccess: ['intelligence_databases', 'classified_reports'],
    onCallRisk: 30,
    vacationDaysPerMonth: 3,
  },

  // MASTER LEVEL
  {
    id: 'manager',
    name: 'Department Manager',
    requiredEducation: ['master_generic'],
    minEducationLevel: 'master',
    weeklyPay: 4000,
    hoursPerWeek: 50,
    coverBenefit: 'Executive access, hiring authority',
    workplaceAccess: ['executive_areas', 'hr_systems'],
    informationAccess: ['employee_records', 'company_strategy'],
    onCallRisk: 40,
    vacationDaysPerMonth: 4,
  },
  {
    id: 'consultant',
    name: 'Security Consultant',
    requiredEducation: ['master_hacking', 'master_tradecraft', 'master_investigation'],
    minEducationLevel: 'master',
    weeklyPay: 5000,
    hoursPerWeek: 30,
    coverBenefit: 'Multiple client access, flexible schedule',
    workplaceAccess: ['client_facilities'],
    informationAccess: ['security_assessments', 'vulnerability_reports'],
    onCallRisk: 25,
    vacationDaysPerMonth: 5,
  },

  // DOCTORATE LEVEL
  {
    id: 'doctor',
    name: 'Medical Doctor',
    requiredEducation: ['doctorate_medicine'],
    minEducationLevel: 'doctorate',
    weeklyPay: 8000,
    hoursPerWeek: 50,
    coverBenefit: 'Full hospital privileges, prescription authority',
    workplaceAccess: ['hospitals', 'operating_rooms', 'pharmacies'],
    informationAccess: ['medical_records', 'controlled_substances'],
    onCallRisk: 70,
    vacationDaysPerMonth: 4,
  },
  {
    id: 'researcher',
    name: 'Research Scientist',
    requiredEducation: ['doctorate_genetics', 'doctorate_biology', 'doctorate_chemistry'],
    minEducationLevel: 'doctorate',
    weeklyPay: 6000,
    hoursPerWeek: 45,
    coverBenefit: 'Lab access, grant funding, academic cover',
    workplaceAccess: ['research_labs', 'universities'],
    informationAccess: ['research_data', 'experimental_results'],
    onCallRisk: 15,
    vacationDaysPerMonth: 5,
  },
  {
    id: 'executive',
    name: 'Corporate Executive',
    requiredEducation: ['doctorate_generic', 'master_generic'],
    minEducationLevel: 'doctorate',
    weeklyPay: 10000,
    hoursPerWeek: 60,
    coverBenefit: 'C-suite access, board connections, travel justification',
    workplaceAccess: ['executive_suites', 'board_rooms'],
    informationAccess: ['corporate_secrets', 'financial_data'],
    onCallRisk: 50,
    vacationDaysPerMonth: 6,
  },
];

// ============================================================================
// STUDY SESSION MECHANICS
// ============================================================================

export const STUDY_SESSION_TYPES: Record<StudySessionType, {
  name: string;
  duration: number;
  learningRate: number;
  requirements: string[];
  risks: string[];
}> = {
  full: {
    name: 'Full Study',
    duration: 8,
    learningRate: 1.0,
    requirements: ['Institution or home base'],
    risks: [],
  },
  part_time: {
    name: 'Part-Time Study',
    duration: 4,
    learningRate: 0.4,
    requirements: ['Can combine with job'],
    risks: [],
  },
  intensive: {
    name: 'Intensive Study',
    duration: 12,
    learningRate: 1.8,
    requirements: ['No other activities'],
    risks: ['Exhaustion risk', 'Morale drain'],
  },
  online: {
    name: 'Online Study',
    duration: 6,
    learningRate: 0.6,
    requirements: ['Internet access'],
    risks: ['Some fields unavailable'],
  },
  practical: {
    name: 'Practical Lab',
    duration: 8,
    learningRate: 1.2,
    requirements: ['Facility access', 'Equipment'],
    risks: ['Lab accident possible'],
  },
};

export const WEEKLY_STUDY_REQUIREMENTS = {
  fullProgress: 3,
  reducedProgress: 2,
  minimalProgress: 1,
  frozen: 0,
};

// ============================================================================
// DROPOUT RISK FACTORS
// ============================================================================

export const DROPOUT_RISK_FACTORS = {
  statBelowMin: 15,
  missedSessions: 10,
  failedExam: 5,
  lowMorale: 20,
  highStress: 25,
  combatInjury: 10,
};

export const DROPOUT_CONSEQUENCES = {
  progressLoss: 0.5,
  cooldownMonths: 6,
  retainCompleted: true,
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export function getFieldById(fieldId: string): FieldOfStudy | undefined {
  return FIELDS_OF_STUDY.find(f => f.id === fieldId);
}

export function getFieldsByCategory(category: FieldCategory): FieldOfStudy[] {
  return FIELDS_OF_STUDY.filter(f => f.category === category);
}

export function getInstitutionById(id: string): Institution | undefined {
  return INSTITUTIONS.find(i => i.id === id);
}

export function getInstitutionsByTier(tier: InstitutionTier): Institution[] {
  return INSTITUTIONS.filter(i => i.tier === tier);
}

export function getInstitutionsForField(fieldId: string): Institution[] {
  return INSTITUTIONS.filter(i =>
    i.specialties.includes(fieldId) || i.specialties.length === 0
  );
}

export function getBackgroundById(id: string): StartingBackground | undefined {
  return STARTING_BACKGROUNDS.find(b => b.id === id);
}

export function getDayJobById(id: string): DayJob | undefined {
  return DAY_JOBS.find(j => j.id === id);
}

export function getAvailableJobs(educationLevel: DegreeLevel, degrees: string[]): DayJob[] {
  const levelTier = DEGREE_LEVEL_DATA[educationLevel]?.tier || 0;

  return DAY_JOBS.filter(job => {
    const requiredTier = DEGREE_LEVEL_DATA[job.minEducationLevel]?.tier || 0;
    if (levelTier < requiredTier) return false;

    if (job.requiredEducation.length > 0) {
      return job.requiredEducation.some(req => degrees.includes(req));
    }

    return true;
  });
}

export function calculateLearningSpeed(
  primaryStat: number,
  field: FieldOfStudy,
  institution: Institution,
  isOnline: boolean
): number {
  const statModifier = 100 / (primaryStat + 20);
  const locationModifier = institution.timeModifier;
  const onlineModifier = isOnline ? 1.4 : 1.0;

  return statModifier * locationModifier * onlineModifier;
}

export function calculateDropoutRisk(
  character: GameCharacter,
  session: StudySession,
  field: FieldOfStudy
): number {
  let risk = session.dropoutRisk;

  const primaryStatValue = (character as any)[field.primaryStat.toLowerCase()] || 40;
  if (primaryStatValue < field.minStatValue) {
    const deficit = field.minStatValue - primaryStatValue;
    risk += Math.floor(deficit / 10) * DROPOUT_RISK_FACTORS.statBelowMin;
  }

  if (session.missedSessionsStreak >= 3) {
    risk += DROPOUT_RISK_FACTORS.missedSessions;
  }

  const morale = (character as any).morale || 50;
  if (morale < 30) {
    risk += DROPOUT_RISK_FACTORS.lowMorale;
  }

  const stress = (character as any).stress || 0;
  if (stress > 80) {
    risk += DROPOUT_RISK_FACTORS.highStress;
  }

  return Math.min(100, Math.max(0, risk));
}

export function calculateSessionProgress(
  sessionType: StudySessionType,
  institution: Institution,
  primaryStat: number,
  field: FieldOfStudy
): number {
  const sessionData = STUDY_SESSION_TYPES[sessionType];
  const baseProgress = sessionData.learningRate * 100;

  const qualityMod = institution.qualityModifier;

  const statRange = field.optimalStatValue - field.minStatValue;
  const statPosition = Math.max(0, Math.min(1, (primaryStat - field.minStatValue) / statRange));
  const statMod = 0.8 + (statPosition * 0.4);

  return baseProgress * qualityMod * statMod;
}

export function rollExam(
  primaryStat: number,
  studyHours: number,
  examDifficulty: number
): ExamResult {
  const statBonus = primaryStat;
  const studyBonus = Math.min(30, Math.floor(studyHours / 10));

  const roll = Math.floor(Math.random() * 100) + 1;
  const target = statBonus + studyBonus;
  const adjusted = roll + target - examDifficulty;

  if (adjusted < 20) return 'critical_fail';
  if (adjusted < 50) return 'fail';
  return 'pass';
}

export function canAccessRestrictedField(
  character: GameCharacter,
  field: FieldOfStudy
): { canAccess: boolean; reason?: string } {
  if (!field.isRestricted) {
    return { canAccess: true };
  }

  switch (field.category) {
    case 'super_science':
      const int = (character as any).int || 40;
      if (int < 70) {
        return { canAccess: false, reason: 'Requires INT 70+' };
      }
      return { canAccess: true };

    case 'occult_mystical':
      if (character.origin === 5) {
        return { canAccess: true };
      }
      return { canAccess: false, reason: 'Requires Spiritual Enhancement origin or temple sponsorship' };

    case 'underground_criminal':
      return { canAccess: false, reason: 'Requires criminal contacts or underworld reputation' };

    default:
      return { canAccess: true };
  }
}

export function formatDegreeLevel(level: DegreeLevel): string {
  return DEGREE_LEVEL_DATA[level]?.displayName || 'Unknown';
}

export function getNextDegreeLevel(current: DegreeLevel, track: EducationTrack): DegreeLevel | null {
  let progression: DegreeLevel[];

  switch (track) {
    case 'academic':
      progression = ACADEMIC_PROGRESSION;
      break;
    case 'vocational':
      progression = VOCATIONAL_PROGRESSION;
      break;
    case 'military':
      progression = MILITARY_PROGRESSION;
      break;
  }

  const currentIndex = progression.indexOf(current);
  if (currentIndex === -1 || currentIndex === progression.length - 1) {
    return null;
  }

  return progression[currentIndex + 1];
}

export function calculateDegreeCost(
  baseCost: number,
  institution: Institution
): number {
  return Math.floor(baseCost * institution.costModifier);
}

export function calculateDegreeTime(
  baseWeeks: number,
  institution: Institution,
  primaryStat: number,
  optimalStat: number
): number {
  let time = baseWeeks * institution.timeModifier;

  if (primaryStat > optimalStat) {
    time *= 0.9;
  } else if (primaryStat < optimalStat) {
    const deficit = optimalStat - primaryStat;
    time *= 1 + (deficit / 100);
  }

  return Math.ceil(time);
}

// ============================================================================
// TYPE EXTENSIONS
// ============================================================================

declare module '../types' {
  interface GameCharacter {
    completedDegrees?: string[];
    currentStudy?: StudySession;
    background?: string;
    int?: number;
    ins?: number;
    con?: number;
    mel?: number;
    dex?: number;
    morale?: number;
    stress?: number;
    currentJob?: string;
    vacationDaysRemaining?: number;
  }
}
