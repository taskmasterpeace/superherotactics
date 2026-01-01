/**
 * Armor Database - Complete armor data from Armor_Complete.csv
 *
 * Includes:
 * - Light Armor (Leather Jacket to Tactical Gloves)
 * - Medium Armor (Tactical Vest to Security Armor)
 * - Heavy Armor (Military Plate to Riot Heavy)
 * - Power Armor (Mk1 through Engineering Suit)
 * - Shields (Riot to Force Shield Generator)
 * - Natural Armor (Super powers)
 * - Components (Plate inserts, modules, etc.)
 * - Materials (Base multipliers for custom building)
 */

import {
  Armor,
  ArmorCategory,
  ArmorComponent,
  CostLevel,
  Availability,
  CoverageType,
  CaliberClass,
  COST_VALUES,
} from './equipmentTypes';

// ==================== LIGHT ARMOR ====================

export const LIGHT_ARMOR: Armor[] = [
  {
    id: 'ARM_LGT_001',
    name: 'Leather Jacket',
    category: 'Light',
    description: 'Basic street protection with a concealable design',
    drPhysical: 3,
    drEnergy: 0,
    drMental: 0,
    coverage: 'Torso',
    conditionMax: 20,
    stoppingPower: 0,           // No ballistic protection
    caliberRating: 'none',
    weight: 3,
    strRequired: 0,
    movementPenalty: 0,
    stealthPenalty: 0,
    specialProperties: ['Concealable', '+1CS social situations'],
    costLevel: 'Low',
    costValue: COST_VALUES['Low'],
    availability: 'Common',
    notes: 'Basic street protection',
    emoji: '🧥',
  },
  {
    id: 'ARM_LGT_002',
    name: 'Kevlar Vest',
    category: 'Light',
    description: 'Standard body armor that stops pistol rounds',
    drPhysical: 8,
    drEnergy: 0,
    drMental: 0,
    coverage: 'Torso',
    conditionMax: 40,
    stoppingPower: 28,          // Stops .38 (25), 9mm (28) completely
    caliberRating: 'pistol',
    weight: 4,
    strRequired: 0,
    movementPenalty: 0,
    stealthPenalty: 0,
    specialProperties: ['Concealable', 'Stops pistol rounds'],
    costLevel: 'Medium',
    costValue: COST_VALUES['Medium'],
    availability: 'Common',
    notes: 'Standard body armor',
    emoji: '🦺',
  },
  {
    id: 'ARM_LGT_003',
    name: 'Stab Vest',
    category: 'Light',
    description: 'Anti-knife protection for close quarters',
    drPhysical: 5,
    drEnergy: 0,
    drMental: 0,
    coverage: 'Torso',
    conditionMax: 30,
    stoppingPower: 5,           // Only stops light melee, not ballistic
    caliberRating: 'none',
    weight: 3,
    strRequired: 0,
    movementPenalty: 0,
    stealthPenalty: 0,
    specialProperties: ['Concealable', '+3DR vs edged'],
    costLevel: 'Low',
    costValue: COST_VALUES['Low'],
    availability: 'Common',
    notes: 'Anti-knife protection',
    emoji: '🦺',
  },
  {
    id: 'ARM_LGT_004',
    name: 'Undercover Vest',
    category: 'Light',
    description: 'Thin profile armor concealable under dress shirt',
    drPhysical: 6,
    drEnergy: 0,
    drMental: 0,
    coverage: 'Torso',
    conditionMax: 35,
    stoppingPower: 20,          // Stops .22, .25 ACP, maybe small 9mm
    caliberRating: 'light_pistol',
    weight: 2,
    strRequired: 0,
    movementPenalty: 0,
    stealthPenalty: 0,
    specialProperties: ['Concealable under dress shirt'],
    costLevel: 'Medium',
    costValue: COST_VALUES['Medium'],
    availability: 'Law_Enforcement',
    notes: 'Thin profile armor',
    emoji: '👔',
  },
  {
    id: 'ARM_LGT_005',
    name: 'Motorcycle Armor',
    category: 'Light',
    description: 'Rider protection with helmet included',
    drPhysical: 5,
    drEnergy: 0,
    drMental: 0,
    coverage: 'Full',
    conditionMax: 25,
    stoppingPower: 0,           // Impact protection, not ballistic
    caliberRating: 'none',
    weight: 8,
    strRequired: 0,
    movementPenalty: 0,
    stealthPenalty: -1,
    specialProperties: ['+2DR vs road rash', 'includes helmet'],
    costLevel: 'Medium',
    costValue: COST_VALUES['Medium'],
    availability: 'Common',
    notes: 'Rider protection',
    emoji: '🏍️',
  },
  {
    id: 'ARM_LGT_006',
    name: 'Sports Padding',
    category: 'Light',
    description: 'Athletic protection covering arms and legs',
    drPhysical: 2,
    drEnergy: 0,
    drMental: 0,
    coverage: 'Limbs',
    conditionMax: 15,
    stoppingPower: 0,           // No ballistic protection
    caliberRating: 'none',
    weight: 4,
    strRequired: 0,
    movementPenalty: 0,
    stealthPenalty: 0,
    specialProperties: ['Covers arms and legs only'],
    costLevel: 'Low',
    costValue: COST_VALUES['Low'],
    availability: 'Common',
    notes: 'Athletic protection',
    emoji: '🏈',
  },
  {
    id: 'ARM_LGT_007',
    name: 'Ballistic Glasses',
    category: 'Light',
    description: 'Eye protection against shrapnel',
    drPhysical: 0,
    drEnergy: 0,
    drMental: 0,
    coverage: 'Head_Partial',
    conditionMax: 10,
    stoppingPower: 5,           // Stops shrapnel only
    caliberRating: 'none',
    weight: 0.5,
    strRequired: 0,
    movementPenalty: 0,
    stealthPenalty: 0,
    specialProperties: ['+2DR eyes only', 'shrapnel protection'],
    costLevel: 'Low',
    costValue: COST_VALUES['Low'],
    availability: 'Common',
    notes: 'Eye protection',
    emoji: '🕶️',
  },
  {
    id: 'ARM_LGT_008',
    name: 'Tactical Gloves',
    category: 'Light',
    description: 'Hand protection with improved grip',
    drPhysical: 1,
    drEnergy: 0,
    drMental: 0,
    coverage: 'Hands',
    conditionMax: 10,
    stoppingPower: 0,           // No ballistic protection
    caliberRating: 'none',
    weight: 0.5,
    strRequired: 0,
    movementPenalty: 0,
    stealthPenalty: 0,
    specialProperties: ['+1CS grip', 'knuckle protection'],
    costLevel: 'Low',
    costValue: COST_VALUES['Low'],
    availability: 'Common',
    notes: 'Hand protection',
    emoji: '🧤',
  },
];

// ==================== MEDIUM ARMOR ====================

export const MEDIUM_ARMOR: Armor[] = [
  {
    id: 'ARM_MED_001',
    name: 'Tactical Vest',
    category: 'Medium',
    description: 'Standard military vest with MOLLE attachment points',
    drPhysical: 12,
    drEnergy: 2,
    drMental: 0,
    coverage: 'Torso',
    conditionMax: 60,
    stoppingPower: 32,          // Stops pistol rounds, marginal on .45
    caliberRating: 'pistol',
    weight: 8,
    strRequired: 10,
    movementPenalty: 0,
    stealthPenalty: -1,
    specialProperties: ['+4 gear slots', 'MOLLE compatible'],
    costLevel: 'Medium',
    costValue: COST_VALUES['Medium'],
    availability: 'Military',
    notes: 'Standard military vest',
    emoji: '🪖',
  },
  {
    id: 'ARM_MED_002',
    name: 'Riot Gear',
    category: 'Medium',
    description: 'Crowd control armor with helmet included',
    drPhysical: 15,
    drEnergy: 5,
    drMental: 0,
    coverage: 'Full',
    conditionMax: 80,
    stoppingPower: 38,          // Stops heavy pistol rounds
    caliberRating: 'heavy_pistol',
    weight: 15,
    strRequired: 15,
    movementPenalty: -1,
    stealthPenalty: -2,
    specialProperties: ['+2CS vs melee', 'includes helmet'],
    costLevel: 'High',
    costValue: COST_VALUES['High'],
    availability: 'Law_Enforcement',
    notes: 'Crowd control armor',
    emoji: '🛡️',
  },
  {
    id: 'ARM_MED_003',
    name: 'Combat Armor',
    category: 'Medium',
    description: 'Modular infantry armor accepting plate inserts',
    drPhysical: 18,
    drEnergy: 5,
    drMental: 0,
    coverage: 'Full',
    conditionMax: 100,
    stoppingPower: 45,          // With plates, stops intermediate rifle
    caliberRating: 'rifle',
    weight: 20,
    strRequired: 20,
    movementPenalty: -1,
    stealthPenalty: -2,
    specialProperties: ['Modular', 'accepts plates'],
    costLevel: 'High',
    costValue: COST_VALUES['High'],
    availability: 'Military',
    notes: 'Infantry armor',
    emoji: '🎖️',
  },
  {
    id: 'ARM_MED_004',
    name: 'SWAT Armor',
    category: 'Medium',
    description: 'Tactical entry armor with integrated radio',
    drPhysical: 20,
    drEnergy: 8,
    drMental: 0,
    coverage: 'Full',
    conditionMax: 90,
    stoppingPower: 45,          // Rifle rated tactical armor
    caliberRating: 'rifle',
    weight: 18,
    strRequired: 15,
    movementPenalty: -1,
    stealthPenalty: -2,
    specialProperties: ['+2CS breaching', 'radio integrated'],
    costLevel: 'Very_High',
    costValue: COST_VALUES['Very_High'],
    availability: 'Law_Enforcement',
    notes: 'Tactical entry armor',
    emoji: '🚔',
  },
  {
    id: 'ARM_MED_005',
    name: 'Hazmat Suit',
    category: 'Medium',
    description: 'Environmental protection against gas, chemical, and radiation',
    drPhysical: 5,
    drEnergy: 10,
    drMental: 0,
    coverage: 'Full',
    conditionMax: 50,
    stoppingPower: 0,           // Not ballistic protection
    caliberRating: 'none',
    weight: 12,
    strRequired: 10,
    movementPenalty: -2,
    stealthPenalty: -3,
    specialProperties: ['Immune to gas/chemical/radiation'],
    costLevel: 'High',
    costValue: COST_VALUES['High'],
    availability: 'Specialized',
    notes: 'Environmental protection',
    emoji: '☢️',
  },
  {
    id: 'ARM_MED_006',
    name: 'Fire Suit',
    category: 'Medium',
    description: 'Firefighter protection with heat immunity',
    drPhysical: 5,
    drEnergy: 25,
    drMental: 0,
    coverage: 'Full',
    conditionMax: 60,
    stoppingPower: 0,           // Not ballistic protection
    caliberRating: 'none',
    weight: 15,
    strRequired: 15,
    movementPenalty: -2,
    stealthPenalty: -3,
    specialProperties: ['Immune to fire damage'],
    costLevel: 'High',
    costValue: COST_VALUES['High'],
    availability: 'Specialized',
    notes: 'Firefighter protection',
    emoji: '🔥',
  },
  {
    id: 'ARM_MED_007',
    name: 'Dive Suit Armored',
    category: 'Medium',
    description: 'Combat diver armor rated to 200m depth',
    drPhysical: 10,
    drEnergy: 5,
    drMental: 0,
    coverage: 'Full',
    conditionMax: 70,
    stoppingPower: 25,          // Light pistol protection
    caliberRating: 'light_pistol',
    weight: 25,
    strRequired: 20,
    movementPenalty: -2,
    stealthPenalty: -2,
    specialProperties: ['Underwater capable', '200m depth'],
    costLevel: 'High',
    costValue: COST_VALUES['High'],
    availability: 'Military',
    notes: 'Combat diver armor',
    emoji: '🤿',
  },
  {
    id: 'ARM_MED_008',
    name: 'Security Armor',
    category: 'Medium',
    description: 'Professional appearance for corporate security',
    drPhysical: 10,
    drEnergy: 3,
    drMental: 0,
    coverage: 'Torso',
    conditionMax: 50,
    stoppingPower: 28,          // Stops standard pistol rounds
    caliberRating: 'pistol',
    weight: 10,
    strRequired: 10,
    movementPenalty: 0,
    stealthPenalty: -1,
    specialProperties: ['Professional appearance'],
    costLevel: 'Medium',
    costValue: COST_VALUES['Medium'],
    availability: 'Common',
    notes: 'Corporate security',
    emoji: '💼',
  },
];

// ==================== HEAVY ARMOR ====================

export const HEAVY_ARMOR: Armor[] = [
  {
    id: 'ARM_HVY_001',
    name: 'Military Plate',
    category: 'Heavy',
    description: 'Full military protection with ceramic/steel plates',
    drPhysical: 25,
    drEnergy: 10,
    drMental: 0,
    coverage: 'Full',
    conditionMax: 150,
    stoppingPower: 55,          // Stops most rifle rounds
    caliberRating: 'heavy_rifle',
    weight: 30,
    strRequired: 25,
    movementPenalty: -2,
    stealthPenalty: -3,
    specialProperties: ['Ceramic/steel plates', 'rifle rated'],
    costLevel: 'Very_High',
    costValue: COST_VALUES['Very_High'],
    availability: 'Military',
    notes: 'Full military protection',
    emoji: '🪖',
  },
  {
    id: 'ARM_HVY_002',
    name: 'Bomb Suit',
    category: 'Heavy',
    description: 'EOD protection with blast resistance',
    drPhysical: 40,
    drEnergy: 15,
    drMental: 0,
    coverage: 'Full',
    conditionMax: 200,
    stoppingPower: 80,          // Maximum ballistic protection
    caliberRating: 'anti_materiel',
    weight: 80,
    strRequired: 35,
    movementPenalty: -4,
    stealthPenalty: -4,
    specialProperties: ['Blast resistant', '+20DR vs explosion'],
    costLevel: 'Ultra_High',
    costValue: COST_VALUES['Ultra_High'],
    availability: 'Military',
    notes: 'EOD protection',
    emoji: '💣',
  },
  {
    id: 'ARM_HVY_003',
    name: 'Juggernaut Armor',
    category: 'Heavy',
    description: 'Heavy assault armor immune to knockback',
    drPhysical: 35,
    drEnergy: 15,
    drMental: 0,
    coverage: 'Full',
    conditionMax: 180,
    stoppingPower: 65,          // Stops heavy rifle rounds
    caliberRating: 'anti_materiel',
    weight: 50,
    strRequired: 30,
    movementPenalty: -3,
    stealthPenalty: -4,
    specialProperties: ['Intimidation +2CS', 'cannot be knocked back'],
    costLevel: 'Ultra_High',
    costValue: COST_VALUES['Ultra_High'],
    availability: 'Military_Only',
    notes: 'Heavy assault armor',
    emoji: '🦾',
  },
  {
    id: 'ARM_HVY_004',
    name: 'Exo Frame',
    category: 'Heavy',
    description: 'Powered strength-enhancing frame',
    drPhysical: 20,
    drEnergy: 10,
    drMental: 0,
    coverage: 'Full',
    conditionMax: 120,
    stoppingPower: 45,          // Moderate rifle protection
    caliberRating: 'rifle',
    weight: 60,
    strRequired: 15,
    movementPenalty: -1,
    stealthPenalty: -3,
    specialProperties: ['STR +20 while worn', 'powered'],
    costLevel: 'Ultra_High',
    costValue: COST_VALUES['Ultra_High'],
    availability: 'High_Tech',
    notes: 'Strength-enhancing frame',
    emoji: '🤖',
  },
  {
    id: 'ARM_HVY_005',
    name: 'Medieval Plate',
    category: 'Heavy',
    description: 'Historical knight armor with edged bonus',
    drPhysical: 20,
    drEnergy: 0,
    drMental: 0,
    coverage: 'Full',
    conditionMax: 100,
    stoppingPower: 15,          // Good vs melee, NOT vs bullets
    caliberRating: 'none',
    weight: 45,
    strRequired: 30,
    movementPenalty: -3,
    stealthPenalty: -4,
    specialProperties: ['Historical', '+2CS vs edged'],
    costLevel: 'High',
    costValue: COST_VALUES['High'],
    availability: 'Specialized',
    notes: 'Knight armor',
    emoji: '⚔️',
  },
  {
    id: 'ARM_HVY_006',
    name: 'Riot Heavy',
    category: 'Heavy',
    description: 'Maximum riot protection with integrated comms',
    drPhysical: 30,
    drEnergy: 10,
    drMental: 0,
    coverage: 'Full',
    conditionMax: 160,
    stoppingPower: 50,          // Stops intermediate rifle
    caliberRating: 'heavy_rifle',
    weight: 40,
    strRequired: 25,
    movementPenalty: -2,
    stealthPenalty: -3,
    specialProperties: ['Full coverage', 'integrated comms'],
    costLevel: 'Very_High',
    costValue: COST_VALUES['Very_High'],
    availability: 'Law_Enforcement',
    notes: 'Maximum riot protection',
    emoji: '🛡️',
  },
];

// ==================== POWER ARMOR ====================

export const POWER_ARMOR: Armor[] = [
  {
    id: 'ARM_PWR_001',
    name: 'Power Armor Mk1',
    category: 'Power',
    description: 'Basic power armor with flight and HUD',
    drPhysical: 30,
    drEnergy: 30,
    drMental: 0,
    coverage: 'Full',
    conditionMax: 200,
    stoppingPower: 55,          // Heavy rifle protection
    caliberRating: 'heavy_rifle',
    weight: 150,
    strRequired: 0,
    movementPenalty: 0,
    stealthPenalty: -4,
    specialProperties: ['STR +30', 'Flight', 'HUD', '4hr battery'],
    costLevel: 'Ultra_High',
    costValue: COST_VALUES['Ultra_High'],
    availability: 'High_Tech',
    notes: 'Basic power armor',
    emoji: '🦸',
  },
  {
    id: 'ARM_PWR_002',
    name: 'Power Armor Mk2',
    category: 'Power',
    description: 'Advanced power armor with AI assist',
    drPhysical: 40,
    drEnergy: 40,
    drMental: 5,
    coverage: 'Full',
    conditionMax: 250,
    stoppingPower: 70,          // Near anti-materiel protection
    caliberRating: 'anti_materiel',
    weight: 120,
    strRequired: 0,
    movementPenalty: 1,
    stealthPenalty: -3,
    specialProperties: ['STR +40', 'Flight', 'HUD', '8hr battery', 'AI assist'],
    costLevel: 'Ultra_High',
    costValue: COST_VALUES['Ultra_High'],
    availability: 'High_Tech',
    notes: 'Advanced power armor',
    emoji: '🦾',
  },
  {
    id: 'ARM_PWR_003',
    name: 'Stealth Suit',
    category: 'Power',
    description: 'Infiltration power armor with active camo',
    drPhysical: 15,
    drEnergy: 15,
    drMental: 0,
    coverage: 'Full',
    conditionMax: 100,
    stoppingPower: 38,          // Heavy pistol, light ballistic
    caliberRating: 'heavy_pistol',
    weight: 30,
    strRequired: 0,
    movementPenalty: 2,
    stealthPenalty: 3,
    specialProperties: ['Active camo', 'sound dampening', 'thermal masking'],
    costLevel: 'Ultra_High',
    costValue: COST_VALUES['Ultra_High'],
    availability: 'High_Tech',
    notes: 'Infiltration power armor',
    emoji: '👤',
  },
  {
    id: 'ARM_PWR_004',
    name: 'Flight Suit',
    category: 'Power',
    description: 'Air superiority suit optimized for aerial combat',
    drPhysical: 20,
    drEnergy: 25,
    drMental: 0,
    coverage: 'Full',
    conditionMax: 120,
    stoppingPower: 45,          // Rifle protection
    caliberRating: 'rifle',
    weight: 40,
    strRequired: 0,
    movementPenalty: 0, // Flight 50mph
    stealthPenalty: -2,
    specialProperties: ['Flight primary', 'Flight 50mph', 'aerial combat optimized'],
    costLevel: 'Ultra_High',
    costValue: COST_VALUES['Ultra_High'],
    availability: 'High_Tech',
    notes: 'Air superiority suit',
    emoji: '✈️',
  },
  {
    id: 'ARM_PWR_005',
    name: 'Aqua Suit',
    category: 'Power',
    description: 'Naval power armor with torpedo mount',
    drPhysical: 25,
    drEnergy: 20,
    drMental: 0,
    coverage: 'Full',
    conditionMax: 150,
    stoppingPower: 50,          // Heavy rifle protection underwater
    caliberRating: 'heavy_rifle',
    weight: 60,
    strRequired: 0,
    movementPenalty: 0, // Swim 30mph
    stealthPenalty: -2,
    specialProperties: ['Underwater 500m', 'Swim 30mph', 'torpedo launcher mount'],
    costLevel: 'Ultra_High',
    costValue: COST_VALUES['Ultra_High'],
    availability: 'High_Tech',
    notes: 'Naval power armor',
    emoji: '🌊',
  },
  {
    id: 'ARM_PWR_006',
    name: 'Heavy Assault Suit',
    category: 'Power',
    description: 'Walking tank with weapon mounts and mini-missiles',
    drPhysical: 50,
    drEnergy: 35,
    drMental: 0,
    coverage: 'Full',
    conditionMax: 300,
    stoppingPower: 100,         // Stops almost anything
    caliberRating: 'anti_materiel',
    weight: 200,
    strRequired: 0,
    movementPenalty: -1,
    stealthPenalty: -5,
    specialProperties: ['STR +50', 'weapon mounts', 'mini-missile rack'],
    costLevel: 'Ultra_High',
    costValue: COST_VALUES['Ultra_High'],
    availability: 'Military_Only',
    notes: 'Walking tank',
    emoji: '🦖',
  },
  {
    id: 'ARM_PWR_007',
    name: 'Medical Suit',
    category: 'Power',
    description: 'Combat medic armor with auto-stabilization',
    drPhysical: 20,
    drEnergy: 20,
    drMental: 0,
    coverage: 'Full',
    conditionMax: 100,
    stoppingPower: 45,          // Rifle protection
    caliberRating: 'rifle',
    weight: 50,
    strRequired: 0,
    movementPenalty: 0,
    stealthPenalty: -2,
    specialProperties: ['Auto-stabilize wearer', '+3CS medicine checks'],
    costLevel: 'Ultra_High',
    costValue: COST_VALUES['Ultra_High'],
    availability: 'Medical',
    notes: 'Combat medic armor',
    emoji: '⚕️',
  },
  {
    id: 'ARM_PWR_008',
    name: 'Engineering Suit',
    category: 'Power',
    description: 'Construction/repair armor with built-in tools',
    drPhysical: 25,
    drEnergy: 25,
    drMental: 0,
    coverage: 'Full',
    conditionMax: 150,
    stoppingPower: 50,          // Heavy rifle protection
    caliberRating: 'heavy_rifle',
    weight: 80,
    strRequired: 0,
    movementPenalty: 0,
    stealthPenalty: -3,
    specialProperties: ['Built-in tools', 'welding', 'cutting', 'repair drones'],
    costLevel: 'Ultra_High',
    costValue: COST_VALUES['Ultra_High'],
    availability: 'High_Tech',
    notes: 'Construction/repair armor',
    emoji: '🔧',
  },
];

// ==================== SHIELDS ====================

export const SHIELDS: Armor[] = [
  {
    id: 'ARM_SHD_001',
    name: 'Riot Shield',
    category: 'Shield',
    description: 'Standard riot shield with block action',
    drPhysical: 20,
    drEnergy: 5,
    drMental: 0,
    coverage: 'Directional',
    conditionMax: 80,
    stoppingPower: 35,          // Stops pistols when blocking
    caliberRating: 'heavy_pistol',
    weight: 8,
    strRequired: 15,
    movementPenalty: 0,
    stealthPenalty: -1,
    specialProperties: ['Block action', '+2CS vs melee from front'],
    costLevel: 'Medium',
    costValue: COST_VALUES['Medium'],
    availability: 'Law_Enforcement',
    notes: 'Standard riot shield',
    emoji: '🛡️',
  },
  {
    id: 'ARM_SHD_002',
    name: 'Ballistic Shield',
    category: 'Shield',
    description: 'Entry team shield stopping rifle rounds',
    drPhysical: 30,
    drEnergy: 10,
    drMental: 0,
    coverage: 'Directional',
    conditionMax: 120,
    stoppingPower: 50,          // Stops rifle rounds when blocking
    caliberRating: 'heavy_rifle',
    weight: 15,
    strRequired: 20,
    movementPenalty: -1,
    stealthPenalty: -2,
    specialProperties: ['Block action', 'stops rifle rounds from front'],
    costLevel: 'High',
    costValue: COST_VALUES['High'],
    availability: 'Law_Enforcement',
    notes: 'Entry team shield',
    emoji: '🛡️',
  },
  {
    id: 'ARM_SHD_003',
    name: 'Tower Shield',
    category: 'Shield',
    description: 'Maximum physical shield with full body coverage',
    drPhysical: 25,
    drEnergy: 5,
    drMental: 0,
    coverage: 'Directional',
    conditionMax: 100,
    stoppingPower: 45,          // Good rifle protection
    caliberRating: 'rifle',
    weight: 25,
    strRequired: 25,
    movementPenalty: -2,
    stealthPenalty: -3,
    specialProperties: ['Full body coverage from front'],
    costLevel: 'High',
    costValue: COST_VALUES['High'],
    availability: 'Specialized',
    notes: 'Maximum physical shield',
    emoji: '🏰',
  },
  {
    id: 'ARM_SHD_004',
    name: 'Energy Shield',
    category: 'Shield',
    description: 'Tech energy barrier excellent vs energy attacks',
    drPhysical: 15,
    drEnergy: 40,
    drMental: 10,
    coverage: 'Directional',
    conditionMax: 60,
    stoppingPower: 30,          // Less effective vs ballistics
    caliberRating: 'pistol',
    weight: 5,
    strRequired: 0,
    movementPenalty: 0,
    stealthPenalty: -1,
    specialProperties: ['Block action', 'excellent vs energy', '2hr battery'],
    costLevel: 'Ultra_High',
    costValue: COST_VALUES['Ultra_High'],
    availability: 'High_Tech',
    notes: 'Tech energy barrier',
    emoji: '⚡',
  },
  {
    id: 'ARM_SHD_005',
    name: 'Buckler',
    category: 'Shield',
    description: 'Small shield for parry action',
    drPhysical: 10,
    drEnergy: 0,
    drMental: 0,
    coverage: 'Directional',
    conditionMax: 40,
    stoppingPower: 15,          // Only blocks melee
    caliberRating: 'none',
    weight: 3,
    strRequired: 10,
    movementPenalty: 0,
    stealthPenalty: 0,
    specialProperties: ['Parry action', '+1CS melee defense'],
    costLevel: 'Low',
    costValue: COST_VALUES['Low'],
    availability: 'Common',
    notes: 'Small shield',
    emoji: '🔘',
  },
  {
    id: 'ARM_SHD_006',
    name: 'Force Shield Generator',
    category: 'Shield',
    description: 'Projected force field bubble covering 3x3 area',
    drPhysical: 25,
    drEnergy: 50,
    drMental: 15,
    coverage: 'Bubble',
    conditionMax: 100,
    stoppingPower: 60,          // Strong vs everything
    caliberRating: 'heavy_rifle',
    weight: 10,
    strRequired: 0,
    movementPenalty: 0,
    stealthPenalty: -2,
    specialProperties: ['3x3 area bubble', '1hr battery', 'stationary'],
    costLevel: 'Ultra_High',
    costValue: COST_VALUES['Ultra_High'],
    availability: 'High_Tech',
    notes: 'Projected force field',
    emoji: '🔮',
  },
];

// ==================== NATURAL ARMOR (SUPER POWERS) ====================

export const NATURAL_ARMOR: Armor[] = [
  {
    id: 'ARM_NAT_001',
    name: 'Super Durability (Low)',
    category: 'Natural',
    description: 'Low-level durability super power',
    drPhysical: 15,
    drEnergy: 10,
    drMental: 0,
    coverage: 'Full',
    conditionMax: Infinity,
    stoppingPower: 35,          // Stops pistol rounds
    caliberRating: 'heavy_pistol',
    weight: 0,
    strRequired: 0,
    movementPenalty: 0,
    stealthPenalty: 0,
    specialProperties: ['Regenerates', 'no condition loss'],
    costLevel: 'Free',
    costValue: 0,
    availability: 'Specialized',
    notes: 'Low-level durability power',
    emoji: '💪',
  },
  {
    id: 'ARM_NAT_002',
    name: 'Super Durability (High)',
    category: 'Natural',
    description: 'High-level durability super power',
    drPhysical: 30,
    drEnergy: 20,
    drMental: 0,
    coverage: 'Full',
    conditionMax: Infinity,
    stoppingPower: 70,          // Stops most weapons
    caliberRating: 'anti_materiel',
    weight: 0,
    strRequired: 0,
    movementPenalty: 0,
    stealthPenalty: 0,
    specialProperties: ['Regenerates', 'no condition loss'],
    costLevel: 'Free',
    costValue: 0,
    availability: 'Specialized',
    notes: 'High-level durability power',
    emoji: '💪',
  },
  {
    id: 'ARM_NAT_003',
    name: 'Stone Skin',
    category: 'Natural',
    description: 'Rocky transformation with blunt resistance',
    drPhysical: 25,
    drEnergy: 5,
    drMental: 0,
    coverage: 'Full',
    conditionMax: Infinity,
    stoppingPower: 50,          // Rock stops most rounds
    caliberRating: 'heavy_rifle',
    weight: 0,
    strRequired: 0,
    movementPenalty: -1,
    stealthPenalty: -2,
    specialProperties: ['+5DR vs blunt', '-5DR vs sonic'],
    costLevel: 'Free',
    costValue: 0,
    availability: 'Specialized',
    notes: 'Rocky transformation',
    emoji: '🪨',
  },
  {
    id: 'ARM_NAT_004',
    name: 'Metal Skin',
    category: 'Natural',
    description: 'Metallic transformation vulnerable to magnetic',
    drPhysical: 35,
    drEnergy: 15,
    drMental: 0,
    coverage: 'Full',
    conditionMax: Infinity,
    stoppingPower: 80,          // Metal stops almost everything
    caliberRating: 'anti_materiel',
    weight: 0,
    strRequired: 0,
    movementPenalty: -1,
    stealthPenalty: -2,
    specialProperties: ['+10DR vs edged', 'vulnerable to magnetic'],
    costLevel: 'Free',
    costValue: 0,
    availability: 'Specialized',
    notes: 'Metallic transformation',
    emoji: '🔩',
  },
  {
    id: 'ARM_NAT_005',
    name: 'Force Aura',
    category: 'Natural',
    description: 'Psychic force field with visible glow',
    drPhysical: 20,
    drEnergy: 30,
    drMental: 10,
    coverage: 'Full',
    conditionMax: Infinity,
    stoppingPower: 55,          // Force field stops heavy rounds
    caliberRating: 'heavy_rifle',
    weight: 0,
    strRequired: 0,
    movementPenalty: 0,
    stealthPenalty: 0,
    specialProperties: ['Visible glow', 'can project shield'],
    costLevel: 'Free',
    costValue: 0,
    availability: 'Specialized',
    notes: 'Psychic force field',
    emoji: '🌟',
  },
  {
    id: 'ARM_NAT_006',
    name: 'Adaptive Armor',
    category: 'Natural',
    description: 'Reactive adaptation gaining resistance',
    drPhysical: 20,
    drEnergy: 20,
    drMental: 0,
    coverage: 'Full',
    conditionMax: Infinity,
    stoppingPower: 45,          // Adapts over time
    caliberRating: 'rifle',
    weight: 0,
    strRequired: 0,
    movementPenalty: 0,
    stealthPenalty: 0,
    specialProperties: ['After hit: +10DR vs that damage type for 1hr'],
    costLevel: 'Free',
    costValue: 0,
    availability: 'Specialized',
    notes: 'Reactive adaptation',
    emoji: '🧬',
  },
  {
    id: 'ARM_NAT_007',
    name: 'Regeneration Armor',
    category: 'Natural',
    description: 'Self-repairing biology that never breaks',
    drPhysical: 10,
    drEnergy: 10,
    drMental: 0,
    coverage: 'Full',
    conditionMax: Infinity,
    stoppingPower: 25,          // Low stopping but heals fast
    caliberRating: 'light_pistol',
    weight: 0,
    strRequired: 0,
    movementPenalty: 0,
    stealthPenalty: 0,
    specialProperties: ['Heals 5 condition per turn', 'never breaks'],
    costLevel: 'Free',
    costValue: 0,
    availability: 'Specialized',
    notes: 'Self-repairing biology',
    emoji: '❤️‍🩹',
  },
  {
    id: 'ARM_NAT_008',
    name: 'Elastic Body',
    category: 'Natural',
    description: 'Stretchy form with blunt immunity',
    drPhysical: 5,
    drEnergy: 5,
    drMental: 0,
    coverage: 'Full',
    conditionMax: Infinity,
    stoppingPower: 40,          // Bullets pass through harmlessly
    caliberRating: 'rifle',
    weight: 0,
    strRequired: 0,
    movementPenalty: 0,
    stealthPenalty: 0,
    specialProperties: ['Blunt damage halved', 'immune to knockback'],
    costLevel: 'Free',
    costValue: 0,
    availability: 'Specialized',
    notes: 'Stretchy form',
    emoji: '🧘',
  },
];

// ==================== ARMOR COMPONENTS ====================

export const ARMOR_COMPONENTS: ArmorComponent[] = [
  {
    id: 'CMP_001',
    name: 'Ceramic Plate Insert',
    slot: 'Torso',
    drPhysicalBonus: 8,
    drEnergyBonus: 2,
    drMentalBonus: 0,
    weightAdd: 4,
    effect: 'Stops rifle rounds; breaks after 3 hits',
    compatibleWith: 'Light/Medium',
    costLevel: 'Medium',
    costValue: COST_VALUES['Medium'],
    availability: 'Military',
    notes: 'Replaceable plates',
  },
  {
    id: 'CMP_002',
    name: 'Steel Plate Insert',
    slot: 'Torso',
    drPhysicalBonus: 10,
    drEnergyBonus: 0,
    drMentalBonus: 0,
    weightAdd: 6,
    effect: 'Heavy but durable; no break limit',
    compatibleWith: 'Light/Medium',
    costLevel: 'Medium',
    costValue: COST_VALUES['Medium'],
    availability: 'Common',
    notes: 'Old school protection',
  },
  {
    id: 'CMP_003',
    name: 'Titanium Plate Insert',
    slot: 'Torso',
    drPhysicalBonus: 12,
    drEnergyBonus: 3,
    drMentalBonus: 0,
    weightAdd: 3,
    effect: 'Lightweight rifle protection',
    compatibleWith: 'Light/Medium',
    researchRequired: 'Metallurgy_1',
    costLevel: 'High',
    costValue: COST_VALUES['High'],
    availability: 'Military',
    notes: 'Advanced material',
  },
  {
    id: 'CMP_004',
    name: 'Graphene Weave',
    slot: 'Any',
    drPhysicalBonus: 5,
    drEnergyBonus: 5,
    drMentalBonus: 0,
    weightAdd: 0.5,
    effect: 'Flexible; no weight penalty',
    compatibleWith: 'Any',
    researchRequired: 'Materials_3',
    costLevel: 'Ultra_High',
    costValue: COST_VALUES['Ultra_High'],
    availability: 'High_Tech',
    notes: 'Cutting edge material',
  },
  {
    id: 'CMP_005',
    name: 'Trauma Pad',
    slot: 'Torso',
    drPhysicalBonus: 0,
    drEnergyBonus: 0,
    drMentalBonus: 0,
    weightAdd: 1,
    effect: 'Reduces blunt trauma; -5 knockback damage',
    compatibleWith: 'Light/Medium',
    costLevel: 'Low',
    costValue: COST_VALUES['Low'],
    availability: 'Common',
    notes: 'Behind plate padding',
  },
  {
    id: 'CMP_006',
    name: 'Neck Guard',
    slot: 'Neck',
    drPhysicalBonus: 5,
    drEnergyBonus: 2,
    drMentalBonus: 0,
    weightAdd: 2,
    effect: 'Protects throat/neck; -1CS head turn',
    compatibleWith: 'Medium/Heavy',
    costLevel: 'Medium',
    costValue: COST_VALUES['Medium'],
    availability: 'Military',
    notes: 'Vulnerable area protection',
  },
  {
    id: 'CMP_007',
    name: 'Groin Guard',
    slot: 'Groin',
    drPhysicalBonus: 8,
    drEnergyBonus: 3,
    drMentalBonus: 0,
    weightAdd: 2,
    effect: 'Protects groin area',
    compatibleWith: 'Medium/Heavy',
    costLevel: 'Medium',
    costValue: COST_VALUES['Medium'],
    availability: 'Military',
    notes: 'Critical area protection',
  },
  {
    id: 'CMP_012',
    name: 'Helmet Ballistic',
    slot: 'Head',
    drPhysicalBonus: 10,
    drEnergyBonus: 3,
    drMentalBonus: 0,
    weightAdd: 3,
    effect: 'Full head protection; -1CS perception',
    compatibleWith: 'Medium/Heavy',
    costLevel: 'High',
    costValue: COST_VALUES['High'],
    availability: 'Military',
    notes: 'Combat helmet',
  },
  {
    id: 'CMP_015',
    name: 'Visor HUD',
    slot: 'Face',
    drPhysicalBonus: 2,
    drEnergyBonus: 2,
    drMentalBonus: 0,
    weightAdd: 0.5,
    effect: 'Heads-up display; targeting +1CS',
    compatibleWith: 'Helmet required',
    researchRequired: 'Electronics_2',
    costLevel: 'Very_High',
    costValue: COST_VALUES['Very_High'],
    availability: 'High_Tech',
    notes: 'Smart visor',
  },
  {
    id: 'CMP_016',
    name: 'Night Vision Module',
    slot: 'Head',
    drPhysicalBonus: 0,
    drEnergyBonus: 0,
    drMentalBonus: 0,
    weightAdd: 1,
    effect: 'See in darkness; blinded by bright light',
    compatibleWith: 'Helmet required',
    researchRequired: 'Electronics_1',
    costLevel: 'High',
    costValue: COST_VALUES['High'],
    availability: 'Military',
    notes: 'Low light vision',
  },
  {
    id: 'CMP_017',
    name: 'Thermal Module',
    slot: 'Head',
    drPhysicalBonus: 0,
    drEnergyBonus: 0,
    drMentalBonus: 0,
    weightAdd: 1,
    effect: 'See heat signatures; through thin walls',
    compatibleWith: 'Helmet required',
    researchRequired: 'Electronics_2',
    costLevel: 'Very_High',
    costValue: COST_VALUES['Very_High'],
    availability: 'Military',
    notes: 'Heat vision',
  },
  {
    id: 'CMP_023',
    name: 'Jump Jets',
    slot: 'Back',
    drPhysicalBonus: 0,
    drEnergyBonus: 0,
    drMentalBonus: 0,
    weightAdd: 15,
    effect: 'Jump 10 squares; hover 1 turn; 5 uses',
    compatibleWith: 'Power',
    researchRequired: 'Propulsion_2',
    costLevel: 'Ultra_High',
    costValue: COST_VALUES['Ultra_High'],
    availability: 'High_Tech',
    notes: 'Jet-assisted jumps',
  },
  {
    id: 'CMP_024',
    name: 'Flight Pack',
    slot: 'Back',
    drPhysicalBonus: 0,
    drEnergyBonus: 0,
    drMentalBonus: 0,
    weightAdd: 20,
    effect: 'Flight 30mph; 2hr battery',
    compatibleWith: 'Power',
    researchRequired: 'Propulsion_3',
    costLevel: 'Ultra_High',
    costValue: COST_VALUES['Ultra_High'],
    availability: 'High_Tech',
    notes: 'Full flight capability',
  },
  {
    id: 'CMP_025',
    name: 'Stealth Coating',
    slot: 'Surface',
    drPhysicalBonus: 0,
    drEnergyBonus: 0,
    drMentalBonus: 0,
    weightAdd: 2,
    effect: '+2CS stealth; -50% thermal signature',
    compatibleWith: 'Power',
    researchRequired: 'Stealth_2',
    costLevel: 'Ultra_High',
    costValue: COST_VALUES['Ultra_High'],
    availability: 'High_Tech',
    notes: 'Active camouflage lite',
  },
];

// ==================== ARMOR MATERIALS ====================

export interface ArmorMaterial {
  id: string;
  name: string;
  drPhysicalMult: number;
  drEnergyMult: number;
  weightMult: number;
  conditionMult: number | 'Infinite' | 'Self_Repair';
  costMult: number;
  researchRequired?: string;
  specialProperties: string;
  notes: string;
}

export const ARMOR_MATERIALS: ArmorMaterial[] = [
  {
    id: 'MAT_001',
    name: 'Standard',
    drPhysicalMult: 1.0,
    drEnergyMult: 1.0,
    weightMult: 1.0,
    conditionMult: 1.0,
    costMult: 1.0,
    specialProperties: 'None',
    notes: 'Baseline material',
  },
  {
    id: 'MAT_002',
    name: 'Hardened Steel',
    drPhysicalMult: 1.3,
    drEnergyMult: 0.9,
    weightMult: 1.4,
    conditionMult: 1.5,
    costMult: 1.5,
    researchRequired: 'Metallurgy_1',
    specialProperties: 'Heavy but durable',
    notes: 'Traditional armor material',
  },
  {
    id: 'MAT_003',
    name: 'Titanium',
    drPhysicalMult: 1.2,
    drEnergyMult: 1.1,
    weightMult: 0.7,
    conditionMult: 1.3,
    costMult: 3.0,
    researchRequired: 'Metallurgy_2',
    specialProperties: 'Lightweight strength',
    notes: 'Advanced alloy',
  },
  {
    id: 'MAT_004',
    name: 'Ceramic Composite',
    drPhysicalMult: 1.4,
    drEnergyMult: 1.0,
    weightMult: 0.8,
    conditionMult: 0.6,
    costMult: 2.0,
    researchRequired: 'Materials_1',
    specialProperties: 'Breaks easier but great protection',
    notes: 'Modern body armor',
  },
  {
    id: 'MAT_005',
    name: 'Carbon Fiber',
    drPhysicalMult: 1.1,
    drEnergyMult: 1.0,
    weightMult: 0.5,
    conditionMult: 1.0,
    costMult: 2.5,
    researchRequired: 'Materials_2',
    specialProperties: 'Ultra lightweight',
    notes: 'Racing/sport applications',
  },
  {
    id: 'MAT_006',
    name: 'Kevlar Weave',
    drPhysicalMult: 1.2,
    drEnergyMult: 0.8,
    weightMult: 0.6,
    conditionMult: 0.8,
    costMult: 1.5,
    specialProperties: 'Flexible; degrades faster',
    notes: 'Fabric armor base',
  },
  {
    id: 'MAT_007',
    name: 'Graphene Layer',
    drPhysicalMult: 1.5,
    drEnergyMult: 1.3,
    weightMult: 0.3,
    conditionMult: 1.2,
    costMult: 10.0,
    researchRequired: 'Materials_3',
    specialProperties: 'Best weight-to-protection ratio',
    notes: 'Cutting edge',
  },
  {
    id: 'MAT_008',
    name: 'Absorbium Alloy',
    drPhysicalMult: 2.0,
    drEnergyMult: 1.5,
    weightMult: 0.6,
    conditionMult: 2.0,
    costMult: 50.0,
    researchRequired: 'Alien_Tech',
    specialProperties: 'Absorbs kinetic energy; nearly indestructible',
    notes: 'Rare alien metal',
  },
  {
    id: 'MAT_009',
    name: 'Indestructium',
    drPhysicalMult: 2.5,
    drEnergyMult: 1.0,
    weightMult: 1.5,
    conditionMult: 'Infinite',
    costMult: 100.0,
    researchRequired: 'Alien_Tech',
    specialProperties: 'Virtually indestructible',
    notes: 'Rarest metal',
  },
  {
    id: 'MAT_010',
    name: 'Energy Hardened',
    drPhysicalMult: 1.0,
    drEnergyMult: 2.0,
    weightMult: 1.0,
    conditionMult: 1.0,
    costMult: 5.0,
    researchRequired: 'Energy_Tech_2',
    specialProperties: 'Excellent energy resistance',
    notes: 'Energy weapon defense',
  },
  {
    id: 'MAT_013',
    name: 'Bio Organic',
    drPhysicalMult: 1.2,
    drEnergyMult: 1.2,
    weightMult: 0.8,
    conditionMult: 'Self_Repair',
    costMult: 15.0,
    researchRequired: 'Bio_Tech_3',
    specialProperties: 'Regenerates 5 condition/hour',
    notes: 'Living armor',
  },
  {
    id: 'MAT_014',
    name: 'Nano Weave',
    drPhysicalMult: 1.4,
    drEnergyMult: 1.4,
    weightMult: 0.6,
    conditionMult: 'Self_Repair',
    costMult: 20.0,
    researchRequired: 'Nano_Tech_3',
    specialProperties: 'Regenerates 10 condition/hour; can reshape',
    notes: 'Nanomachine armor',
  },
];

// ==================== COMBINED ARRAYS ====================

export const ALL_ARMOR: Armor[] = [
  ...LIGHT_ARMOR,
  ...MEDIUM_ARMOR,
  ...HEAVY_ARMOR,
  ...POWER_ARMOR,
  ...SHIELDS,
  ...NATURAL_ARMOR,
];

// ==================== UTILITY FUNCTIONS ====================

export function getArmorById(id: string): Armor | undefined {
  return ALL_ARMOR.find((a) => a.id === id);
}

export function getArmorByName(name: string): Armor | undefined {
  return ALL_ARMOR.find((a) => a.name.toLowerCase() === name.toLowerCase());
}

export function getArmorByCategory(category: ArmorCategory): Armor[] {
  return ALL_ARMOR.filter((a) => a.category === category);
}

export function getComponentById(id: string): ArmorComponent | undefined {
  return ARMOR_COMPONENTS.find((c) => c.id === id);
}

export function getMaterialById(id: string): ArmorMaterial | undefined {
  return ARMOR_MATERIALS.find((m) => m.id === id);
}

/**
 * Calculate effective protection of armor
 */
export function calculateEffectiveProtection(armor: Armor): number {
  // Weighted average: physical matters most, then energy, then mental
  return armor.drPhysical * 0.5 + armor.drEnergy * 0.35 + armor.drMental * 0.15;
}

/**
 * Calculate armor efficiency (protection per weight)
 */
export function calculateArmorEfficiency(armor: Armor): number {
  const protection = calculateEffectiveProtection(armor);
  if (armor.weight === 0) return protection * 10; // Weightless is very efficient
  return protection / armor.weight;
}

/**
 * Get armor recommendations based on budget and requirements
 */
export function getRecommendedArmor(
  budget: number,
  str: number,
  stealthRequired: boolean = false,
  mobilityRequired: boolean = false
): Armor[] {
  return ALL_ARMOR.filter((a) => {
    if (a.costValue > budget) return false;
    if (a.strRequired > str) return false;
    if (stealthRequired && a.stealthPenalty < -1) return false;
    if (mobilityRequired && a.movementPenalty < -1) return false;
    if (a.category === 'Natural') return false; // Natural armor is from powers, not purchasable
    return true;
  }).sort(
    (a, b) => calculateEffectiveProtection(b) - calculateEffectiveProtection(a)
  );
}

/**
 * Calculate armor with material modifications
 */
export function applyMaterial(
  baseArmor: Armor,
  material: ArmorMaterial
): Armor {
  const newCondition =
    material.conditionMult === 'Infinite'
      ? Infinity
      : material.conditionMult === 'Self_Repair'
        ? baseArmor.conditionMax
        : baseArmor.conditionMax * (material.conditionMult as number);

  return {
    ...baseArmor,
    id: `${baseArmor.id}_${material.id}`,
    name: `${material.name} ${baseArmor.name}`,
    drPhysical: Math.round(baseArmor.drPhysical * material.drPhysicalMult),
    drEnergy: Math.round(baseArmor.drEnergy * material.drEnergyMult),
    weight: Math.round(baseArmor.weight * material.weightMult * 10) / 10,
    conditionMax: newCondition,
    costValue: Math.round(baseArmor.costValue * material.costMult),
    specialProperties: [
      ...baseArmor.specialProperties,
      material.specialProperties,
    ],
    researchRequired: material.researchRequired,
    notes: `${baseArmor.notes} (${material.notes})`,
  };
}

/**
 * Calculate armor with component added
 */
export function addComponent(
  baseArmor: Armor,
  component: ArmorComponent
): Armor {
  return {
    ...baseArmor,
    id: `${baseArmor.id}_${component.id}`,
    name: `${baseArmor.name} + ${component.name}`,
    drPhysical: baseArmor.drPhysical + component.drPhysicalBonus,
    drEnergy: baseArmor.drEnergy + component.drEnergyBonus,
    drMental: baseArmor.drMental + component.drMentalBonus,
    weight: baseArmor.weight + component.weightAdd,
    costValue: baseArmor.costValue + component.costValue,
    specialProperties: [...baseArmor.specialProperties, component.effect],
    researchRequired: component.researchRequired || baseArmor.researchRequired,
  };
}

/**
 * Get armor DR values for combat calculations.
 * Used by CombatScene to apply damage reduction.
 *
 * @param armorNameOrId - Armor name (e.g., "Kevlar Vest") or ID (e.g., "ARM_LGT_002")
 * @returns Object with DR values and stopping power, or defaults if not found
 */
export interface ArmorDRValues {
  drPhysical: number;
  drEnergy: number;
  drMental: number;
  stoppingPower: number;
  armorName: string | null;
}

export function getArmorDRValues(armorNameOrId: string | undefined): ArmorDRValues {
  if (!armorNameOrId) {
    return {
      drPhysical: 0,
      drEnergy: 0,
      drMental: 0,
      stoppingPower: 0,
      armorName: null,
    };
  }

  // Try to find by ID first, then by name
  const armor = getArmorById(armorNameOrId) || getArmorByName(armorNameOrId);

  if (!armor) {
    return {
      drPhysical: 0,
      drEnergy: 0,
      drMental: 0,
      stoppingPower: 0,
      armorName: null,
    };
  }

  return {
    drPhysical: armor.drPhysical,
    drEnergy: armor.drEnergy,
    drMental: armor.drMental,
    stoppingPower: armor.stoppingPower || 0,
    armorName: armor.name,
  };
}

/**
 * Get combined armor DR from multiple equipped pieces.
 * Handles separate armor pieces like torso armor + helmet.
 *
 * @param equippedArmor - Array of armor names/IDs (e.g., ["Kevlar Vest", "Combat Helmet"])
 * @returns Combined DR values (stacks additively)
 */
export function getCombinedArmorDR(equippedArmor: string[]): ArmorDRValues {
  const result: ArmorDRValues = {
    drPhysical: 0,
    drEnergy: 0,
    drMental: 0,
    stoppingPower: 0,
    armorName: null,
  };

  const armorNames: string[] = [];

  for (const armorItem of equippedArmor) {
    const values = getArmorDRValues(armorItem);
    if (values.armorName) {
      result.drPhysical += values.drPhysical;
      result.drEnergy += values.drEnergy;
      result.drMental += values.drMental;
      // Stopping power uses highest value (doesn't stack)
      result.stoppingPower = Math.max(result.stoppingPower, values.stoppingPower);
      armorNames.push(values.armorName);
    }
  }

  result.armorName = armorNames.length > 0 ? armorNames.join(' + ') : null;
  return result;
}
