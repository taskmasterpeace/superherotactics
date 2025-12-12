/**
 * Shield and Armor Equipment Items
 * These items can be equipped by characters to provide shield HP buffer and damage reduction
 */

export interface ShieldItem {
  id: string;
  name: string;
  type: 'shield' | 'armor' | 'both';
  // Shield stats (buffer before HP)
  shieldPoints: number;
  shieldRegen: number; // Per turn regeneration
  // Armor stats (DR - reduces damage)
  drPhysical: number;
  drEnergy: number;
  // Requirements
  strRequired: number;
  // Meta
  description: string;
  emoji: string;
  costLevel: 'Free' | 'Low' | 'Medium' | 'High' | 'Very_High' | 'Ultra_High';
  availability: 'Common' | 'Military' | 'High_Tech' | 'Rare' | 'Unique';
}

export const SHIELD_ITEMS: ShieldItem[] = [
  // Energy Shields (provide shield buffer)
  {
    id: 'SHD_001',
    name: 'Personal Force Field',
    type: 'shield',
    shieldPoints: 25,
    shieldRegen: 5,
    drPhysical: 0,
    drEnergy: 0,
    strRequired: 0,
    description: 'Lightweight energy barrier that regenerates over time',
    emoji: '🔮',
    costLevel: 'High',
    availability: 'High_Tech',
  },
  {
    id: 'SHD_002',
    name: 'Kinetic Shield',
    type: 'shield',
    shieldPoints: 50,
    shieldRegen: 10,
    drPhysical: 5,
    drEnergy: 0,
    strRequired: 20,
    description: 'Captain America style vibranium-alloy shield that absorbs kinetic energy',
    emoji: '🛡️',
    costLevel: 'Ultra_High',
    availability: 'Unique',
  },
  {
    id: 'SHD_003',
    name: 'Energy Barrier Generator',
    type: 'shield',
    shieldPoints: 40,
    shieldRegen: 8,
    drPhysical: 0,
    drEnergy: 10,
    strRequired: 10,
    description: 'Projects a protective energy field that blocks energy attacks',
    emoji: '⚡',
    costLevel: 'Very_High',
    availability: 'High_Tech',
  },
  {
    id: 'SHD_004',
    name: 'Riot Shield',
    type: 'shield',
    shieldPoints: 30,
    shieldRegen: 0,
    drPhysical: 15,
    drEnergy: 0,
    strRequired: 15,
    description: 'Standard police riot shield, blocks physical attacks',
    emoji: '🚔',
    costLevel: 'Medium',
    availability: 'Military',
  },
  // Armor Items (provide DR)
  {
    id: 'ARM_001',
    name: 'Tactical Vest',
    type: 'armor',
    shieldPoints: 0,
    shieldRegen: 0,
    drPhysical: 10,
    drEnergy: 2,
    strRequired: 10,
    description: 'Standard tactical body armor with ceramic plates',
    emoji: '🦺',
    costLevel: 'Medium',
    availability: 'Military',
  },
  {
    id: 'ARM_002',
    name: 'Power Armor Mk1',
    type: 'both',
    shieldPoints: 30,
    shieldRegen: 5,
    drPhysical: 25,
    drEnergy: 15,
    strRequired: 0, // Armor provides strength
    description: 'Powered exoskeleton with integrated shields and heavy plating',
    emoji: '🤖',
    costLevel: 'Ultra_High',
    availability: 'High_Tech',
  },
  {
    id: 'ARM_003',
    name: 'Kevlar Suit',
    type: 'armor',
    shieldPoints: 0,
    shieldRegen: 0,
    drPhysical: 8,
    drEnergy: 0,
    strRequired: 0,
    description: 'Concealed kevlar weave suit for undercover work',
    emoji: '👔',
    costLevel: 'High',
    availability: 'Common',
  },
  {
    id: 'ARM_004',
    name: 'Nano-Weave Bodysuit',
    type: 'both',
    shieldPoints: 20,
    shieldRegen: 4,
    drPhysical: 12,
    drEnergy: 8,
    strRequired: 0,
    description: 'Advanced nano-material suit that self-repairs and adapts',
    emoji: '🕴️',
    costLevel: 'Ultra_High',
    availability: 'Rare',
  },
  {
    id: 'ARM_005',
    name: 'Combat Exoskeleton',
    type: 'armor',
    shieldPoints: 0,
    shieldRegen: 0,
    drPhysical: 20,
    drEnergy: 10,
    strRequired: 15,
    description: 'Military-grade powered frame with heavy armor plates',
    emoji: '🦾',
    costLevel: 'Very_High',
    availability: 'Military',
  },
  {
    id: 'ARM_006',
    name: 'Stealth Suit',
    type: 'armor',
    shieldPoints: 0,
    shieldRegen: 0,
    drPhysical: 5,
    drEnergy: 5,
    strRequired: 0,
    description: 'Lightweight suit optimized for infiltration with minimal protection',
    emoji: '🥷',
    costLevel: 'High',
    availability: 'High_Tech',
  },
];

// Helper functions
export function getShieldItemById(id: string): ShieldItem | undefined {
  return SHIELD_ITEMS.find(item => item.id === id);
}

export function getShieldItemByName(name: string): ShieldItem | undefined {
  return SHIELD_ITEMS.find(item => item.name.toLowerCase() === name.toLowerCase());
}

export function getShieldItems(): ShieldItem[] {
  return SHIELD_ITEMS.filter(item => item.type === 'shield' || item.type === 'both');
}

export function getArmorItems(): ShieldItem[] {
  return SHIELD_ITEMS.filter(item => item.type === 'armor' || item.type === 'both');
}

export function calculateTotalProtection(items: ShieldItem[]): {
  totalShield: number;
  totalShieldRegen: number;
  totalDrPhysical: number;
  totalDrEnergy: number;
} {
  return items.reduce((acc, item) => ({
    totalShield: acc.totalShield + item.shieldPoints,
    totalShieldRegen: acc.totalShieldRegen + item.shieldRegen,
    totalDrPhysical: acc.totalDrPhysical + item.drPhysical,
    totalDrEnergy: acc.totalDrEnergy + item.drEnergy,
  }), { totalShield: 0, totalShieldRegen: 0, totalDrPhysical: 0, totalDrEnergy: 0 });
}

export default SHIELD_ITEMS;
