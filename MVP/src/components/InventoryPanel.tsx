/**
 * InventoryPanel - Complete inventory UI with tabs
 * 
 * Tabs:
 * - Main Inventory (4x4 grid)
 * - Backpack (6x8 grid) - if equipped
 * - Equipment slots (weapons, armor)
 */

import React, { useState } from 'react';
import { CharacterInventory, InventoryItem, InventoryGrid } from '../data/inventoryTypes';
import { InventoryGridComponent } from './InventoryGrid';
import { Package, ShoppingBag, Shirt } from 'lucide-react';

interface InventoryPanelProps {
    inventory: CharacterInventory;
    onItemMove: (gridIndex: number, itemId: string, toX: number, toY: number) => void;
    onItemUse: (itemId: string) => void;
    onEquip: (itemId: string, slot: string) => void;
}

export const InventoryPanel: React.FC<InventoryPanelProps> = ({
    inventory,
    onItemMove,
    onItemUse,
    onEquip,
}) => {
    const [activeTab, setActiveTab] = useState(0);

    // Get all items in the active grid
    const getItemsInGrid = (gridIndex: number): InventoryItem[] => {
        const grid = inventory.grids[gridIndex];
        if (!grid) return [];

        const items: InventoryItem[] = [];
        grid.slots.forEach((row, y) => {
            row.forEach((slot, x) => {
                if (slot.itemId) {
                    // This is an origin slot - would normally look up item from inventory
                    // For now, create placeholder
                }
            });
        });

        return items;
    };

    return (
        <div className="bg-[#0a0a1a] border-2 border-cyan-600 rounded-lg overflow-hidden">
            {/* Header with Tabs */}
            <div className="bg-gray-900 border-b-2 border-cyan-600 px-4 py-2">
                <div className="flex items-center gap-2">
                    {inventory.grids.map((grid, index) => (
                        <button
                            key={grid.id}
                            onClick={() => setActiveTab(index)}
                            className={`
                px-4 py-2 rounded-t flex items-center gap-2 transition-all
                ${activeTab === index
                                    ? 'bg-cyan-900 text-cyan-300 border-2 border-cyan-500 border-b-0'
                                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                                }
              `}
                        >
                            {index === 0 ? <Package className="w-4 h-4" /> : <ShoppingBag className="w-4 h-4" />}
                            <span className="font-bold text-sm">{grid.name}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Content */}
            <div className="p-4">
                {/* Active Grid */}
                <InventoryGridComponent
                    grid={inventory.grids[activeTab]}
                    items={getItemsInGrid(activeTab)}
                    onItemMove={(itemId, x, y) => onItemMove(activeTab, itemId, x, y)}
                    onItemRemove={(itemId) => { }}
                    onItemUse={onItemUse}
                />

                {/* Equipment Slots */}
                <div className="mt-4 grid grid-cols-3 gap-2">
                    <EquipmentSlot
                        label="Primary"
                        emoji="🔫"
                        item={inventory.equipped.primaryWeapon}
                        onEquip={() => { }}
                    />
                    <EquipmentSlot
                        label="Secondary"
                        emoji="🔫"
                        item={inventory.equipped.secondaryWeapon}
                        onEquip={() => { }}
                    />
                    <EquipmentSlot
                        label="Melee"
                        emoji="⚔️"
                        item={inventory.equipped.melee}
                        onEquip={() => { }}
                    />
                    <EquipmentSlot
                        label="Armor"
                        emoji="🦺"
                        item={inventory.equipped.armor}
                        onEquip={() => { }}
                    />
                    <EquipmentSlot
                        label="Accessory"
                        emoji="💍"
                        item={inventory.equipped.accessory1}
                        onEquip={() => { }}
                    />
                    <EquipmentSlot
                        label="Accessory"
                        emoji="💍"
                        item={inventory.equipped.accessory2}
                        onEquip={() => { }}
                    />
                </div>
            </div>
        </div>
    );
};

interface EquipmentSlotProps {
    label: string;
    emoji: string;
    item: InventoryItem | null;
    onEquip: () => void;
}

const EquipmentSlot: React.FC<EquipmentSlotProps> = ({ label, emoji, item, onEquip }) => {
    return (
        <div
            className={`
        border-2 rounded p-2 cursor-pointer transition-all
        ${item
                    ? 'bg-cyan-900/30 border-cyan-500 hover:brightness-125'
                    : 'bg-gray-800/30 border-gray-600 hover:border-gray-500'
                }
      `}
            onClick={onEquip}
        >
            <div className="text-xs text-gray-400 mb-1">{label}</div>
            {item ? (
                <>
                    <div className="text-2xl mb-1">{item.emoji}</div>
                    <div className="text-xs text-cyan-300 font-bold truncate">{item.name}</div>
                </>
            ) : (
                <div className="text-3xl text-gray-600">{emoji}</div>
            )}
        </div>
    );
};

export default InventoryPanel;
