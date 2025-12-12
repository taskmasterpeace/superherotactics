/**
 * Complete Item Database - All Grenades, Pistols, and Gadgets
 * Updated with new icons
 */

import { InventoryItem } from './inventoryTypes';

// ==================== GRENADES (8 total) ====================

export const GRENADES = {
    // Original 5
    FRAG: {
        id: 'grenade_frag',
        name: 'Frag Grenade',
        emoji: '💣',
        category: 'grenade' as const,
        size: '1x1' as const,
        width: 1,
        height: 1,
        stackable: true,
        maxStack: 10,
        quantity: 1,
        weight: 0.4,
        imageRatio: '1:1' as const,
        imagePath: '/assets/items/grenades/grenade_frag.png',
        damage: 50,
        blastRadius: 3,
        statusEffects: ['bleeding'],
    },

    CONCUSSION: {
        id: 'grenade_concussion',
        name: 'Concussion Grenade',
        emoji: '💥',
        category: 'grenade' as const,
        size: '1x1' as const,
        width: 1,
        height: 1,
        stackable: true,
        maxStack: 10,
        quantity: 1,
        weight: 0.5,
        imageRatio: '1:1' as const,
        imagePath: '/assets/items/grenades/grenade_concussion.png',
        damage: 35,
        blastRadius: 4,
        statusEffects: ['stunned'],
    },

    FLASHBANG: {
        id: 'grenade_flashbang',
        name: 'Flashbang',
        emoji: '💡',
        category: 'grenade' as const,
        size: '1x1' as const,
        width: 1,
        height: 1,
        stackable: true,
        maxStack: 10,
        quantity: 1,
        weight: 0.3,
        imageRatio: '1:1' as const,
        imagePath: '/assets/items/grenades/grenade_flashbang.png',
        damage: 5,
        blastRadius: 5,
        statusEffects: ['stunned', 'blinded'],
    },

    INCENDIARY: {
        id: 'grenade_incendiary',
        name: 'Incendiary Grenade',
        emoji: '🔥',
        category: 'grenade' as const,
        size: '1x1' as const,
        width: 1,
        height: 1,
        stackable: true,
        maxStack: 10,
        quantity: 1,
        weight: 0.6,
        imageRatio: '1:1' as const,
        imagePath: '/assets/items/grenades/grenade_incendiary.png',
        damage: 30,
        blastRadius: 2,
        statusEffects: ['burning'],
    },

    SMOKE: {
        id: 'grenade_smoke',
        name: 'Smoke Grenade',
        emoji: '💨',
        category: 'grenade' as const,
        size: '1x1' as const,
        width: 1,
        height: 1,
        stackable: true,
        maxStack: 10,
        quantity: 1,
        weight: 0.4,
        imageRatio: '1:1' as const,
        imagePath: '/assets/items/grenades/grenade_smoke.png',
        damage: 0,
        blastRadius: 4,
        statusEffects: [],
    },

    // NEW: Advanced Grenades
    EMP: {
        id: 'grenade_emp',
        name: 'EMP Grenade',
        emoji: '⚡',
        category: 'grenade' as const,
        size: '1x1' as const,
        width: 1,
        height: 1,
        stackable: true,
        maxStack: 10,
        quantity: 1,
        weight: 0.5,
        imageRatio: '1:1' as const,
        imagePath: '/assets/items/grenades/grenade_emp.png',
        damage: 0,
        blastRadius: 3,
        statusEffects: ['disabled_tech'],
        description: 'Disables electronic devices, drones, and shields',
    },

    PLASMA: {
        id: 'grenade_plasma',
        name: 'Plasma Grenade',
        emoji: '🌟',
        category: 'grenade' as const,
        size: '1x1' as const,
        width: 1,
        height: 1,
        stackable: true,
        maxStack: 5,  // More powerful, fewer stacks
        quantity: 1,
        weight: 0.8,
        imageRatio: '1:1' as const,
        imagePath: '/assets/items/grenades/grenade_plasma.png',
        damage: 70,
        blastRadius: 3,
        statusEffects: ['burning', 'emp'],
        description: 'High-tech explosive with energy damage',
    },

    CRYO: {
        id: 'grenade_cryo',
        name: 'Cryo Grenade',
        emoji: '❄️',
        category: 'grenade' as const,
        size: '1x1' as const,
        width: 1,
        height: 1,
        stackable: true,
        maxStack: 10,
        quantity: 1,
        weight: 0.6,
        imageRatio: '1:1' as const,
        imagePath: '/assets/items/grenades/grenade_cryo.png',
        damage: 25,
        blastRadius: 3,
        statusEffects: ['frozen', 'slowed'],
        description: 'Freezes enemies, reducing movement and actions',
    },
};

// ==================== PISTOLS (4 types) ====================

export const PISTOLS = {
    STANDARD: {
        id: 'pistol_standard',
        name: 'Standard Pistol',
        emoji: '🔫',
        category: 'weapon' as const,
        size: '1x1' as const,
        width: 1,
        height: 1,
        stackable: false,
        maxStack: 1,
        quantity: 1,
        weight: 2.0,
        imageRatio: '1:1' as const,
        imagePath: '/assets/items/pistols/pistol_standard.png',
        damage: { min: 12, max: 18 },
        range: 10,
        magazineSize: 15,
        accuracy: 0,  // No modifier
        description: '9mm service pistol - reliable and common',
    },

    HEAVY: {
        id: 'pistol_heavy',
        name: 'Heavy Pistol',
        emoji: '🔫',
        category: 'weapon' as const,
        size: '1x1' as const,
        width: 1,
        height: 1,
        stackable: false,
        maxStack: 1,
        quantity: 1,
        weight: 2.8,
        imageRatio: '1:1' as const,
        imagePath: '/assets/items/pistols/pistol_heavy.png',
        damage: { min: 18, max: 28 },
        range: 12,
        magazineSize: 10,
        accuracy: -1,  // Harder to control
        description: '.45 caliber heavy hitter - high damage',
    },

    REVOLVER: {
        id: 'pistol_revolver',
        name: 'Revolver',
        emoji: '🔫',
        category: 'weapon' as const,
        size: '1x1' as const,
        width: 1,
        height: 1,
        stackable: false,
        maxStack: 1,
        quantity: 1,
        weight: 2.5,
        imageRatio: '1:1' as const,
        imagePath: '/assets/items/pistols/pistol_revolver.png',
        damage: { min: 20, max: 30 },
        range: 10,
        magazineSize: 6,
        accuracy: +1,  // Very accurate
        description: '.357 Magnum wheel gun - powerful and accurate',
    },

    FUTURISTIC: {
        id: 'pistol_futuristic',
        name: 'Energy Pistol',
        emoji: '🔫',
        category: 'weapon' as const,
        size: '1x1' as const,
        width: 1,
        height: 1,
        stackable: false,
        maxStack: 1,
        quantity: 1,
        weight: 1.5,
        imageRatio: '1:1' as const,
        imagePath: '/assets/items/pistols/pistol_futuristic.png',
        damage: { min: 15, max: 25 },
        range: 15,
        magazineSize: 20,  // Energy cell
        accuracy: +2,  // Laser sight
        damageType: 'Energy',
        description: 'Advanced energy weapon - no recoil, high accuracy',
    },
};

// ==================== GADGETS ====================

export const GADGETS = {
    DRONE_CONTROLLER: {
        id: 'drone_controller',
        name: 'Drone Controller',
        emoji: '📱',
        category: 'gadget' as const,
        size: '1x1' as const,
        width: 1,
        height: 1,
        stackable: false,
        maxStack: 1,
        quantity: 1,
        weight: 0.5,
        imageRatio: '1:1' as const,
        imagePath: '/assets/items/gadgets/drone_controller.png',
        description: 'Deploy and control combat and recon drones',
        apCost: 3,  // Cost to deploy drone
        cooldownTurns: 0,
        modes: ['Deploy Recon Drone', 'Deploy Combat Drone', 'Recall Drone'],
    },
};

// ==================== COMBINED EXPORT ====================

export const ALL_ITEMS = {
    ...GRENADES,
    ...PISTOLS,
    ...GADGETS,
};

// Helper to get item by ID
export function getItemById(id: string): InventoryItem | null {
    return Object.values(ALL_ITEMS).find(item => item.id === id) || null;
}

// Get all items of a category
export function getItemsByCategory(category: string): InventoryItem[] {
    return Object.values(ALL_ITEMS).filter(item => item.category === category);
}
