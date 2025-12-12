/**
 * InventoryGrid - Tetris-style drag-and-drop inventory
 * 
 * Features:
 * - Grid-based placement
 * - Different item sizes (1x1, 2x1, 3x1, 1x2, etc.)
 * - Drag and drop
 * - Stacking for compatible items
 * - Weight limits
 * - Multiple tabs (Main, Backpack)
 */

import React, { useState } from 'react';
import { InventoryGrid as GridType, InventoryItem, canPlaceItem, placeItem, removeItem } from '../data/inventoryTypes';

interface InventoryGridProps {
    grid: GridType;
    items: InventoryItem[];  // All items in this grid
    onItemMove: (itemId: string, toX: number, toY: number) => void;
    onItemRemove: (itemId: string) => void;
    onItemUse: (itemId: string) => void;
}

export const InventoryGridComponent: React.FC<InventoryGridProps> = ({
    grid,
    items,
    onItemMove,
    onItemRemove,
    onItemUse,
}) => {
    const [draggedItem, setDraggedItem] = useState<InventoryItem | null>(null);
    const [hoverSlot, setHoverSlot] = useState<{ x: number; y: number } | null>(null);

    const getItemAtSlot = (x: number, y: number): InventoryItem | null => {
        const slot = grid.slots[y]?.[x];
        if (!slot) return null;

        const itemId = slot.itemId || slot.occupiedBy;
        if (!itemId) return null;

        return items.find(item => item.id === itemId) || null;
    };

    const handleDragStart = (item: InventoryItem) => {
        setDraggedItem(item);
    };

    const handleDragOver = (e: React.DragEvent, x: number, y: number) => {
        e.preventDefault();
        setHoverSlot({ x, y });
    };

    const handleDrop = (e: React.DragEvent, x: number, y: number) => {
        e.preventDefault();
        if (draggedItem) {
            onItemMove(draggedItem.id, x, y);
            setDraggedItem(null);
            setHoverSlot(null);
        }
    };

    const canPlace = (item: InventoryItem, x: number, y: number): boolean => {
        return canPlaceItem(grid, item, x, y);
    };

    return (
        <div className="bg-gray-900 border-2 border-cyan-600 rounded-lg p-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
                <div className="text-cyan-400 font-bold text-sm">
                    📦 {grid.name}
                </div>
                <div className="text-xs text-gray-400">
                    Weight: {grid.currentWeight.toFixed(1)} / {grid.weightLimit} lbs
                </div>
            </div>

            {/* Grid */}
            <div
                className="grid gap-1"
                style={{
                    gridTemplateColumns: `repeat(${grid.width}, 50px)`,
                    gridTemplateRows: `repeat(${grid.height}, 50px)`,
                }}
            >
                {Array.from({ length: grid.height }).map((_, y) =>
                    Array.from({ length: grid.width }).map((_, x) => {
                        const slot = grid.slots[y][x];
                        const item = getItemAtSlot(x, y);
                        const isOrigin = slot.itemId !== null;
                        const canPlaceHere = draggedItem && canPlace(draggedItem, x, y);

                        return (
                            <div
                                key={`${x}-${y}`}
                                className={`
                  relative border transition-all
                  ${slot.itemId || slot.occupiedBy ? 'border-transparent' : 'border-gray-700'}
                  ${hoverSlot?.x === x && hoverSlot?.y === y && canPlaceHere ? 'bg-green-900/30 border-green-500' : ''}
                  ${hoverSlot?.x === x && hoverSlot?.y === y && !canPlaceHere && draggedItem ? 'bg-red-900/30 border-red-500' : ''}
                  ${!slot.itemId && !slot.occupiedBy ? 'bg-gray-800/50' : ''}
                `}
                                onDragOver={(e) => handleDragOver(e, x, y)}
                                onDrop={(e) => handleDrop(e, x, y)}
                            >
                                {/* Show item only at origin slot */}
                                {isOrigin && item && (
                                    <div
                                        draggable
                                        onDragStart={() => handleDragStart(item)}
                                        className={`
                      absolute cursor-move
                      bg-gradient-to-br from-cyan-800 to-blue-900
                      border-2 border-cyan-500 rounded
                      flex flex-col items-center justify-center
                      hover:brightness-125 transition-all
                      hover:scale-105 hover:z-10
                    `}
                                        style={{
                                            width: `${item.width * 50 + (item.width - 1) * 4}px`,
                                            height: `${item.height * 50 + (item.height - 1) * 4}px`,
                                            left: 0,
                                            top: 0,
                                        }}
                                        onClick={() => onItemUse(item.id)}
                                        title={`${item.name}${item.stackable ? ` x${item.quantity}` : ''}\n${item.weight} lbs\nClick to use, drag to move`}
                                    >
                                        {/* Item emoji/icon */}
                                        <div className="text-3xl mb-1">{item.emoji}</div>

                                        {/* Item name */}
                                        <div className="text-xs text-cyan-300 font-bold text-center px-1">
                                            {item.name}
                                        </div>

                                        {/* Stack count */}
                                        {item.stackable && item.quantity > 1 && (
                                            <div className="absolute top-1 right-1 bg-orange-600 text-white text-xs font-bold rounded px-1.5 py-0.5">
                                                x{item.quantity}
                                            </div>
                                        )}

                                        {/* PLACEHOLDER IMAGE INDICATOR */}
                                        <div className="absolute bottom-1 left-1 text-[8px] text-gray-400 bg-black/50 px-1 rounded">
                                            {item.imageRatio}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>

            {/* Legend */}
            <div className="mt-3 text-xs text-gray-500 flex gap-4">
                <span>💡 Click to use</span>
                <span>🔄 Drag to move</span>
                <span>🎒 Stackable items combine</span>
            </div>
        </div>
    );
};

export default InventoryGridComponent;
