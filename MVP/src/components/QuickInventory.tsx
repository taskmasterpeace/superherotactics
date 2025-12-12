/**
 * QuickInventory - Shows equipped items as small icons at bottom
 * Stacks same grenades and shows quantity badge
 */

import React from 'react';

interface QuickInventoryProps {
    equipment: string[];
    onItemClick: (itemName: string, itemType: 'grenade' | 'gadget') => void;
}

// Map grenade names to their image paths
const GRENADE_DATA: { [key: string]: { image: string; fallbackEmoji: string; borderColor: string } } = {
    'Frag': {
        image: '/assets/items/grenades/grenade_frag.png',
        fallbackEmoji: '💣',
        borderColor: 'border-red-500'
    },
    'Plasma': {
        image: '/assets/items/grenades/grenade_plasma.png',
        fallbackEmoji: '🌟',
        borderColor: 'border-purple-500'
    },
    'Nervegas': {
        image: '/assets/items/grenades/grenade_nervegas.png',
        fallbackEmoji: '☠️',
        borderColor: 'border-green-500'
    },
    'Concussion': {
        image: '/assets/items/grenades/grenade_nervegas.png',
        fallbackEmoji: '💥',
        borderColor: 'border-orange-500'
    },
    'Flashbang': {
        image: '/assets/items/grenades/grenade_flashbang.png',
        fallbackEmoji: '💡',
        borderColor: 'border-yellow-500'
    },
    'Smoke': {
        image: '/assets/items/grenades/grenade_smoke.png',
        fallbackEmoji: '💨',
        borderColor: 'border-gray-400'
    },
    'Incendiary': {
        image: '/assets/items/grenades/grenade_incendiary.png',
        fallbackEmoji: '🔥',
        borderColor: 'border-orange-600'
    },
    'EMP': {
        image: '/assets/items/grenades/grenade_emp.png',
        fallbackEmoji: '⚡',
        borderColor: 'border-blue-500'
    },
    'Cryo': {
        image: '/assets/items/grenades/grenade_cryo.png',
        fallbackEmoji: '❄️',
        borderColor: 'border-cyan-400'
    },
};

// Group and count items by name
interface StackedItem {
    name: string;
    count: number;
    grenadeKey: string;
}

export const QuickInventory: React.FC<QuickInventoryProps> = ({ equipment, onItemClick }) => {
    // Find and stack grenades
    const grenadeStacks: StackedItem[] = [];
    equipment.forEach(item => {
        const grenadeKey = Object.keys(GRENADE_DATA).find(g => item.includes(g));
        if (grenadeKey) {
            const existing = grenadeStacks.find(s => s.name === item);
            if (existing) {
                existing.count++;
            } else {
                grenadeStacks.push({ name: item, count: 1, grenadeKey });
            }
        }
    });

    // Find gadgets (not stacking for now)
    const gadgets = equipment.filter(item =>
        item.includes('Drone') || item.includes('Controller')
    );

    if (grenadeStacks.length === 0 && gadgets.length === 0) {
        return null;
    }

    return (
        <div className="flex gap-1 items-center">
            {/* Stacked Grenades */}
            {grenadeStacks.map((stack, i) => {
                const data = GRENADE_DATA[stack.grenadeKey];

                return (
                    <button
                        key={i}
                        onClick={() => onItemClick(stack.name, 'grenade')}
                        className={`
                            relative
                            bg-gray-800/90 hover:bg-gray-700/90
                            w-10 h-10 rounded-md
                            flex items-center justify-center
                            transition-all duration-150
                            border-2 ${data.borderColor}
                            hover:scale-110 hover:border-white
                            shadow-md hover:shadow-lg
                        `}
                        title={`${stack.name} (x${stack.count})`}
                    >
                        <img
                            src={data.image}
                            alt={stack.name}
                            className="w-7 h-7 object-contain"
                            onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                const parent = e.currentTarget.parentElement;
                                if (parent) {
                                    const span = document.createElement('span');
                                    span.className = 'text-lg';
                                    span.textContent = data.fallbackEmoji;
                                    parent.insertBefore(span, parent.firstChild);
                                }
                            }}
                        />
                        {/* Quantity badge */}
                        <span className="absolute -top-1 -right-1 bg-black/80 text-white text-xs font-bold rounded-full w-4 h-4 flex items-center justify-center border border-white/50">
                            {stack.count}
                        </span>
                    </button>
                );
            })}

            {/* Gadgets */}
            {gadgets.map((item, i) => (
                <button
                    key={`gadget-${i}`}
                    onClick={() => onItemClick(item, 'gadget')}
                    className="bg-gray-800/90 hover:bg-gray-700/90 w-10 h-10 rounded-md flex items-center justify-center text-lg transition-all duration-150 border-2 border-purple-500 hover:scale-110 hover:border-white shadow-md"
                    title={item}
                >
                    📱
                </button>
            ))}
        </div>
    );
};

export default QuickInventory;
