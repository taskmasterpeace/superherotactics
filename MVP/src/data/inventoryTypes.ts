/**
 * Inventory System - Tetris-style grid with item sizes
 * 
 * Item Sizes:
 * - 1x1: Grenades, Pistols, Ammo
 * - 2x1: SMGs, Medkits
 * - 3x1: Rifles, Shotguns
 * - 1x2: Swords (vertical)
 * - 2x2: Armor pieces, Large items
 * - 3x2: Sniper rifles
 */

export type ItemSize = '1x1' | '2x1' | '3x1' | '1x2' | '2x2' | '3x2' | '4x2';

export interface InventorySlot {
    x: number;  // Grid X position
    y: number;  // Grid Y position
    itemId: string | null;  // What's in this slot
    occupiedBy?: string;  // ID of item occupying this slot (if multi-slot item)
}

export interface InventoryItem {
    id: string;
    name: string;
    emoji: string;
    category: 'weapon' | 'armor' | 'grenade' | 'medical' | 'gadget' | 'ammo' | 'utility';
    size: ItemSize;  // How many slots it takes
    width: number;   // In slots (e.g., 3 for rifle)
    height: number;  // In slots (e.g., 1 for rifle)
    stackable: boolean;
    maxStack: number;
    quantity: number;
    weight: number;
    imageRatio: string;  // "16:9", "9:16", "1:1" for placeholder
}

export interface InventoryGrid {
    id: string;
    name: string;  // "Main Inventory", "Backpack", "Vest Pouches"
    width: number;  // Grid width in slots
    height: number; // Grid height in slots
    slots: InventorySlot[][];
    weightLimit: number;
    currentWeight: number;
}

export interface CharacterInventory {
    equipped: {
        primaryWeapon: InventoryItem | null;
        secondaryWeapon: InventoryItem | null;
        melee: InventoryItem | null;
        armor: InventoryItem | null;
        accessory1: InventoryItem | null;
        accessory2: InventoryItem | null;
    };
    grids: InventoryGrid[];  // ["Main 4x4", "Backpack 6x8"]
    activeGridIndex: number;  // Which tab is open
}

// Item size definitions for common items
export const ITEM_SIZES: Record<string, { width: number; height: number; ratio: string }> = {
    // 1x1 - Small items
    'grenade': { width: 1, height: 1, ratio: '1:1' },
    'pistol': { width: 1, height: 1, ratio: '1:1' },
    'ammo_box': { width: 1, height: 1, ratio: '1:1' },
    'medkit_small': { width: 1, height: 1, ratio: '1:1' },

    // 2x1 - Medium horizontal
    'smg': { width: 2, height: 1, ratio: '16:9' },
    'medkit': { width: 2, height: 1, ratio: '16:9' },

    // 3x1 - Large horizontal (rifles)
    'rifle': { width: 3, height: 1, ratio: '16:9' },
    'shotgun': { width: 3, height: 1, ratio: '16:9' },
    'assault_rifle': { width: 3, height: 1, ratio: '16:9' },

    // 1x2 - Tall items (swords)
    'sword': { width: 1, height: 2, ratio: '9:16' },
    'katana': { width: 1, height: 2, ratio: '9:16' },
    'spear': { width: 1, height: 2, ratio: '9:16' },

    // 2x2 - Square large
    'armor_vest': { width: 2, height: 2, ratio: '1:1' },
    'backpack': { width: 2, height: 2, ratio: '1:1' },

    // 3x2 - Very large
    'sniper_rifle': { width: 3, height: 2, ratio: '16:9' },
    'rocket_launcher': { width: 3, height: 2, ratio: '16:9' },

    // 4x2 - Huge
    'minigun': { width: 4, height: 2, ratio: '16:9' },
};

// Initialize empty grid
export function createInventoryGrid(id: string, name: string, width: number, height: number, weightLimit: number): InventoryGrid {
    const slots: InventorySlot[][] = [];

    for (let y = 0; y < height; y++) {
        slots[y] = [];
        for (let x = 0; x < width; x++) {
            slots[y][x] = {
                x,
                y,
                itemId: null,
            };
        }
    }

    return {
        id,
        name,
        width,
        height,
        slots,
        weightLimit,
        currentWeight: 0,
    };
}

// Check if item can fit at position
export function canPlaceItem(
    grid: InventoryGrid,
    item: InventoryItem,
    x: number,
    y: number
): boolean {
    // Check bounds
    if (x + item.width > grid.width || y + item.height > grid.height) {
        return false;
    }

    // Check if slots are empty
    for (let dy = 0; dy < item.height; dy++) {
        for (let dx = 0; dx < item.width; dx++) {
            const slot = grid.slots[y + dy][x + dx];
            if (slot.itemId !== null) {
                return false;
            }
        }
    }

    // Check weight limit
    if (grid.currentWeight + item.weight > grid.weightLimit) {
        return false;
    }

    return true;
}

// Place item in grid
export function placeItem(
    grid: InventoryGrid,
    item: InventoryItem,
    x: number,
    y: number
): InventoryGrid {
    if (!canPlaceItem(grid, item, x, y)) {
        return grid;
    }

    const newGrid = { ...grid };
    newGrid.slots = grid.slots.map(row => row.map(slot => ({ ...slot })));

    // Mark all occupied slots
    for (let dy = 0; dy < item.height; dy++) {
        for (let dx = 0; dx < item.width; dx++) {
            const slot = newGrid.slots[y + dy][x + dx];
            if (dx === 0 && dy === 0) {
                slot.itemId = item.id;  // Origin slot holds the item
            } else {
                slot.occupiedBy = item.id;  // Other slots reference it
            }
        }
    }

    newGrid.currentWeight += item.weight;

    return newGrid;
}

// Remove item from grid
export function removeItem(
    grid: InventoryGrid,
    itemId: string
): InventoryGrid {
    const newGrid = { ...grid };
    newGrid.slots = grid.slots.map(row => row.map(slot => ({ ...slot })));

    let itemWeight = 0;

    // Find and remove item
    for (let y = 0; y < grid.height; y++) {
        for (let x = 0; x < grid.width; x++) {
            const slot = newGrid.slots[y][x];
            if (slot.itemId === itemId) {
                // Found origin slot - get item weight first
                // (would need to look up actual item)
                slot.itemId = null;
            }
            if (slot.occupiedBy === itemId) {
                slot.occupiedBy = undefined;
            }
        }
    }

    newGrid.currentWeight -= itemWeight;

    return newGrid;
}

// Auto-find slot for item (tries to fit it anywhere)
export function findSlotForItem(
    grid: InventoryGrid,
    item: InventoryItem
): { x: number; y: number } | null {
    for (let y = 0; y < grid.height; y++) {
        for (let x = 0; x < grid.width; x++) {
            if (canPlaceItem(grid, item, x, y)) {
                return { x, y };
            }
        }
    }
    return null;
}
