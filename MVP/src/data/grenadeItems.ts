/**
 * Updated Grenade Definitions with Real Image Paths
 */

import { Grenade } from './explosionSystem';

// Grenade image paths (now using real icons!)
export const GRENADE_IMAGE_PATHS = {
    FRAG: '/assets/items/grenades/grenade_frag.png',
    CONCUSSION: '/assets/items/grenades/grenade_concussion.png',
    FLASHBANG: '/assets/items/grenades/grenade_flashbang.png',
    INCENDIARY: '/assets/items/grenades/grenade_incendiary.png',
    SMOKE: '/assets/items/grenades/grenade_smoke.png',
};

// Inventory item definitions for grenades
export const GRENADE_INVENTORY_ITEMS = {
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
        imagePath: GRENADE_IMAGE_PATHS.FRAG,
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
        imagePath: GRENADE_IMAGE_PATHS.CONCUSSION,
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
        imagePath: GRENADE_IMAGE_PATHS.FLASHBANG,
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
        imagePath: GRENADE_IMAGE_PATHS.INCENDIARY,
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
        imagePath: GRENADE_IMAGE_PATHS.SMOKE,
    },
};
