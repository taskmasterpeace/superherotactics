/**
 * Quick Grenade Test Menu
 * Simple overlay to select and throw grenades
 */

import React, { useState } from 'react';
import { X } from 'lucide-react';
import { EventBridge } from '../game/EventBridge';

interface GrenadeMenuProps {
    onClose: () => void;
    unitEquipment: string[];
}

const GRENADE_DATA = {
    'Frag Grenade': { id: 'FRAG', emoji: '💣', damage: 50, radius: 3, color: 'bg-red-600' },
    'Plasma Grenade': { id: 'PLASMA', emoji: '🌟', damage: 70, radius: 3, color: 'bg-purple-600' },
    'Concussion Grenade': { id: 'CONCUSSION', emoji: '💥', damage: 35, radius: 4, color: 'bg-orange-600' },
    'Flashbang': { id: 'FLASHBANG', emoji: '💡', damage: 5, radius: 5, color: 'bg-yellow-600' },
    'Smoke Grenade': { id: 'SMOKE', emoji: '💨', damage: 0, radius: 4, color: 'bg-gray-600' },
    'Incendiary Grenade': { id: 'INCENDIARY', emoji: '🔥', damage: 30, radius: 2, color: 'bg-red-700' },
    'EMP Grenade': { id: 'EMP', emoji: '⚡', damage: 0, radius: 3, color: 'bg-blue-600' },
    'Cryo Grenade': { id: 'CRYO', emoji: '❄️', damage: 25, radius: 3, color: 'bg-cyan-600' },
};

export const GrenadeMenu: React.FC<GrenadeMenuProps> = ({ onClose, unitEquipment }) => {
    // Find grenades in equipment
    const availableGrenades = Object.entries(GRENADE_DATA).filter(([name]) =>
        unitEquipment.some(item => item.includes(name.split(' ')[0]))
    );

    const selectGrenade = (grenadeId: string) => {
        console.log(`🎯 Throwing ${grenadeId}`);
        EventBridge.emit('throw-grenade-mode', { grenadeId });
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-lg p-6 max-w-2xl w-full border-2 border-orange-500">
                {/* Header */}
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-orange-400">💣 Select Grenade</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {availableGrenades.length > 0 ? (
                    <div className="grid grid-cols-2 gap-4">
                        {availableGrenades.map(([name, data]) => (
                            <button
                                key={data.id}
                                onClick={() => selectGrenade(data.id)}
                                className={`${data.color} hover:opacity-80 p-6 rounded-lg text-white transition`}
                            >
                                <div className="text-4xl mb-2">{data.emoji}</div>
                                <div className="font-bold text-lg">{name}</div>
                                <div className="text-sm text-gray-200 mt-2">
                                    Damage: {data.damage} | Radius: {data.radius} tiles
                                </div>
                                <div className="mt-3 text-xs bg-black/30 rounded px-2 py-1">
                                    Click to throw (Hotkey: G)
                                </div>
                            </button>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12 text-gray-400">
                        <div className="text-6xl mb-4">📦</div>
                        <div className="text-xl">No grenades equipped!</div>
                        <div className="text-sm mt-2">
                            Go to Equipment Loadout Editor (F2) to equip grenades
                        </div>
                    </div>
                )}

                {/* Instructions */}
                <div className="mt-6 p-4 bg-gray-900/50 rounded border border-gray-700">
                    <div className="text-sm text-gray-300">
                        <strong className="text-orange-400">How to use:</strong>
                        <ol className="mt-2 space-y-1 ml-4 list-decimal">
                            <li>Select a grenade above</li>
                            <li>Click on the map to set target</li>
                            <li>Grenade will arc to that location</li>
                            <li>Explosion damages all units in radius</li>
                        </ol>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GrenadeMenu;
