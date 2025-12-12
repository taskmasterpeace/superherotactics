/**
 * Complete Modular Data System
 * 
 * ALL game data separate from code - ready for:
 * - Character loadouts
 * - Store/catalog
 * - Mission rewards
 * - Item spawns
 * - No hardcoding anywhere!
 */

import { InventoryItem } from './inventoryTypes';
import { VisionStats } from '../game/systems/VisionSystem';

// ==================== CHARACTER TEMPLATE (MODULAR) ====================

export interface CharacterTemplate {
    id: string;
    name: string;
    class: string;  // 'Soldier', 'Scout', 'Heavy', 'Medic', etc.

    // Base stats (modular - not hardcoded!)
    stats: {
        HP: number;
        AP: number;
        STR: number;
        AGL: number;
        MEL: number;
        RNG: number;
        INS: number;
    };

    // Starting equipment (references items, not hardcoded values!)
    startingEquipment: {
        primaryWeapon: string | null;    // Item ID
        secondaryWeapon: string | null;
        melee: string | null;
        armor: string | null;
        grenades: { itemId: string; quantity: number }[];
        gadgets: string[];
    };

    // Vision profile (references vision system)
    visionProfile: string;  // 'HUMAN_SOLDIER', 'HUMAN_SCOUT', etc.

    // Skills
    skills: string[];  // ['Throwing', 'Medicine', 'Demolitions']

    // Special abilities
    abilities: string[];  // ['PowerXXX', 'TechniqueYYY']
}

// ==================== STORE/CATALOG SYSTEM ====================

export interface StoreItem {
    itemId: string;  // References item in itemDatabase

    // Pricing
    price: number;  // Base price
    currency: 'credits' | 'reputation' | 'rare_materials';

    // Availability
    availability: 'common' | 'uncommon' | 'rare' | 'legendary' | 'quest_reward';
    stockQuantity: number | 'unlimited';
    restockTime: number;  // Hours until restock

    // Requirements
    requiresLevel: number;
    requiresReputation: number;
    requiresFaction: string | null;
    requiresQuest: string | null;

    // Discounts
    discount: number;  // 0.0 - 1.0 (0.2 = 20% off)
    onSale: boolean;
}

export interface StoreCatalog {
    id: string;
    name: string;  // "Black Market", "Military Surplus", "Tech Vendor"
    description: string;
    location: string;

    // What's for sale
    items: StoreItem[];

    // Store settings
    specialization: 'weapons' | 'armor' | 'gadgets' | 'medical' | 'all';
    quality: 'low' | 'medium' | 'high' | 'elite';

    // Faction affinity
    factionBonus: { [faction: string]: number };  // Better prices for allies
}

// ==================== EXAMPLE CATALOGS (MODULAR!) ====================

export const STORE_CATALOGS: Record<string, StoreCatalog> = {
    MILITARY_SURPLUS: {
        id: 'store_military_surplus',
        name: 'Military Surplus Store',
        description: 'Government surplus weapons and gear',
        location: 'downtown',
        specialization: 'weapons',
        quality: 'medium',
        factionBonus: {
            'government': 0.15,  // 15% discount for government agents
        },
        items: [
            {
                itemId: 'pistol_standard',
                price: 500,
                currency: 'credits',
                availability: 'common',
                stockQuantity: 'unlimited',
                restockTime: 0,
                requiresLevel: 1,
                requiresReputation: 0,
                requiresFaction: null,
                requiresQuest: null,
                discount: 0,
                onSale: false,
            },
            {
                itemId: 'grenade_frag',
                price: 100,
                currency: 'credits',
                availability: 'common',
                stockQuantity: 50,
                restockTime: 24,
                requiresLevel: 1,
                requiresReputation: 0,
                requiresFaction: null,
                requiresQuest: null,
                discount: 0,
                onSale: false,
            },
            {
                itemId: 'pistol_heavy',
                price: 1200,
                currency: 'credits',
                availability: 'uncommon',
                stockQuantity: 10,
                restockTime: 48,
                requiresLevel: 3,
                requiresReputation: 100,
                requiresFaction: null,
                requiresQuest: null,
                discount: 0,
                onSale: false,
            },
        ],
    },

    BLACK_MARKET: {
        id: 'store_black_market',
        name: 'Black Market',
        description: 'Illegal weapons and experimental tech',
        location: 'underground',
        specialization: 'all',
        quality: 'high',
        factionBonus: {
            'criminal': 0.25,  // 25% discount for criminals
        },
        items: [
            {
                itemId: 'grenade_emp',
                price: 800,
                currency: 'credits',
                availability: 'rare',
                stockQuantity: 5,
                restockTime: 72,
                requiresLevel: 5,
                requiresReputation: 200,
                requiresFaction: null,
                requiresQuest: null,
                discount: 0,
                onSale: false,
            },
            {
                itemId: 'grenade_plasma',
                price: 2000,
                currency: 'credits',
                availability: 'legendary',
                stockQuantity: 2,
                restockTime: 168,  // Weekly
                requiresLevel: 8,
                requiresReputation: 500,
                requiresFaction: null,
                requiresQuest: 'find_arms_dealer',
                discount: 0,
                onSale: false,
            },
            {
                itemId: 'pistol_futuristic',
                price: 3500,
                currency: 'credits',
                availability: 'legendary',
                stockQuantity: 1,
                restockTime: 336,  // Bi-weekly
                requiresLevel: 10,
                requiresReputation: 1000,
                requiresFaction: null,
                requiresQuest: 'tech_heist',
                discount: 0,
                onSale: false,
            },
        ],
    },

    TECH_VENDOR: {
        id: 'store_tech_vendor',
        name: 'Tech Solutions',
        description: 'Cutting-edge gadgets and drones',
        location: 'tech_district',
        specialization: 'gadgets',
        quality: 'elite',
        factionBonus: {
            'corporate': 0.10,
        },
        items: [
            {
                itemId: 'drone_controller',
                price: 5000,
                currency: 'credits',
                availability: 'rare',
                stockQuantity: 3,
                restockTime: 72,
                requiresLevel: 6,
                requiresReputation: 300,
                requiresFaction: null,
                requiresQuest: null,
                discount: 0,
                onSale: true,  // ON SALE!
            },
        ],
    },
};

// ==================== LOOT TABLES (MODULAR) ====================

export interface LootTable {
    id: string;
    name: string;
    rolls: number;  // How many items to drop

    // Item pools
    items: Array<{
        itemId: string;
        weight: number;  // Drop chance weight
        minQuantity: number;
        maxQuantity: number;
    }>;
}

export const LOOT_TABLES: Record<string, LootTable> = {
    ENEMY_SOLDIER: {
        id: 'loot_enemy_soldier',
        name: 'Soldier Loot',
        rolls: 2,
        items: [
            { itemId: 'pistol_standard', weight: 30, minQuantity: 1, maxQuantity: 1 },
            { itemId: 'grenade_frag', weight: 20, minQuantity: 1, maxQuantity: 3 },
            { itemId: 'grenade_smoke', weight: 15, minQuantity: 1, maxQuantity: 2 },
            { itemId: 'ammo_9mm', weight: 35, minQuantity: 10, maxQuantity: 30 },
        ],
    },

    WEAPON_CRATE: {
        id: 'loot_weapon_crate',
        name: 'Weapon Crate',
        rolls: 3,
        items: [
            { itemId: 'pistol_heavy', weight: 20, minQuantity: 1, maxQuantity: 1 },
            { itemId: 'pistol_revolver', weight: 15, minQuantity: 1, maxQuantity: 1 },
            { itemId: 'grenade_concussion', weight: 25, minQuantity: 2, maxQuantity: 5 },
            { itemId: 'grenade_flashbang', weight: 25, minQuantity: 2, maxQuantity: 5 },
            { itemId: 'grenade_incendiary', weight: 15, minQuantity: 1, maxQuantity: 3 },
        ],
    },

    BOSS_DROP: {
        id: 'loot_boss',
        name: 'Boss Loot',
        rolls: 5,
        items: [
            { itemId: 'pistol_futuristic', weight: 10, minQuantity: 1, maxQuantity: 1 },
            { itemId: 'grenade_plasma', weight: 15, minQuantity: 1, maxQuantity: 2 },
            { itemId: 'grenade_emp', weight: 20, minQuantity: 2, maxQuantity: 4 },
            { itemId: 'drone_controller', weight: 5, minQuantity: 1, maxQuantity: 1 },
            { itemId: 'rare_component', weight: 50, minQuantity: 1, maxQuantity: 5 },
        ],
    },
};

// ==================== HELPER FUNCTIONS ====================

/**
 * Get item from any store
 */
export function findItemInStores(itemId: string): StoreItem | null {
    for (const catalog of Object.values(STORE_CATALOGS)) {
        const item = catalog.items.find(i => i.itemId === itemId);
        if (item) return item;
    }
    return null;
}

/**
 * Get all stores selling an item
 */
export function getStoresSellingItem(itemId: string): StoreCatalog[] {
    return Object.values(STORE_CATALOGS).filter(catalog =>
        catalog.items.some(item => item.itemId === itemId)
    );
}

/**
 * Calculate final price with discounts
 */
export function calculatePrice(
    storeItem: StoreItem,
    playerReputation: number,
    playerFaction: string | null
): number {
    let price = storeItem.price;

    // Apply item discount
    if (storeItem.onSale) {
        price *= (1 - storeItem.discount);
    }

    // Apply faction bonus
    const store = Object.values(STORE_CATALOGS).find(s =>
        s.items.includes(storeItem)
    );

    if (store && playerFaction && store.factionBonus[playerFaction]) {
        price *= (1 - store.factionBonus[playerFaction]);
    }

    return Math.floor(price);
}

/**
 * Roll loot table
 */
export function rollLootTable(lootTable: LootTable): Array<{ itemId: string; quantity: number }> {
    const loot: Array<{ itemId: string; quantity: number }> = [];

    for (let i = 0; i < lootTable.rolls; i++) {
        // Calculate total weight
        const totalWeight = lootTable.items.reduce((sum, item) => sum + item.weight, 0);

        // Random roll
        let roll = Math.random() * totalWeight;

        // Find item
        for (const item of lootTable.items) {
            roll -= item.weight;
            if (roll <= 0) {
                const quantity = Math.floor(
                    Math.random() * (item.maxQuantity - item.minQuantity + 1) + item.minQuantity
                );
                loot.push({ itemId: item.itemId, quantity });
                break;
            }
        }
    }

    return loot;
}
