/**
 * Equipment Loadout Editor
 * 
 * Features:
 * - Select character
 * - Equip weapons, grenades, gadgets from database
 * - Preview items with images
 * - Test sounds
 * - Save loadout and go to Combat Lab
 */

import React, { useState, useEffect } from 'react';
import { useGameStore } from '../stores/enhancedGameStore';
import { GRENADES, PISTOLS, GADGETS, ALL_ITEMS } from '../data/itemDatabase';
import { Package, Play, Save, Sword, Crosshair, Zap } from 'lucide-react';
import { AudioPlayer } from '../utils/audioPlayer';

export const LoadoutEditor: React.FC = () => {
    const { characters, updateCharacter } = useGameStore();
    const [selectedCharId, setSelectedCharId] = useState<string | null>(null);
    const [selectedSlot, setSelectedSlot] = useState<'primary' | 'secondary' | 'grenade' | 'gadget' | null>(null);

    const selectedChar = characters.find((c: any) => c.id === selectedCharId);

    // Initialize AudioPlayer on mount
    useEffect(() => {
        AudioPlayer.init();
    }, []);

    const playSound = (soundKey: string) => {
        console.log(`Playing sound: ${soundKey}`);
        AudioPlayer.play(soundKey).catch(err => {
            console.warn('Sound playback failed:', err);
        });
    };

    const equipItem = (itemId: string) => {
        if (!selectedCharId || !selectedSlot) return;

        console.log(`Equipping ${itemId} to ${selectedSlot} on ${selectedCharId}`);

        // Update character equipment
        const item = Object.values(ALL_ITEMS).find((i: any) => i.id === itemId);
        if (item) {
            // Add to equipment array
            const currentEquipment = selectedChar?.equipment || [];
            const newEquipment = [...currentEquipment, item.name];

            updateCharacter(selectedCharId, { equipment: newEquipment });
        }

        setSelectedSlot(null);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-cyan-400 mb-2">⚔️ Equipment Loadout Editor</h1>
                    <p className="text-gray-300">Equip your heroes with weapons, grenades, and gadgets from the database</p>
                </div>

                <div className="grid grid-cols-3 gap-6">
                    {/* LEFT: Character Selection */}
                    <div className="bg-gray-800/50 rounded-lg p-6 border-2 border-cyan-600">
                        <h2 className="text-xl font-bold text-cyan-400 mb-4">📋 Select Character</h2>
                        <div className="space-y-2 max-h-96 overflow-y-auto">
                            {characters.map((char: any) => (
                                <button
                                    key={char.id}
                                    onClick={() => setSelectedCharId(char.id)}
                                    className={`w-full p-3 rounded text-left transition
                    ${selectedCharId === char.id
                                            ? 'bg-cyan-600 text-white'
                                            : 'bg-gray-700 hover:bg-gray-600 text-gray-200'
                                        }`}
                                >
                                    <div className="font-bold">{char.name}</div>
                                    <div className="text-xs text-gray-400">
                                        {char.equipment?.length || 0} items equipped
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* MIDDLE: Current Loadout */}
                    <div className="bg-gray-800/50 rounded-lg p-6 border-2 border-purple-600">
                        <h2 className="text-xl font-bold text-purple-400 mb-4">
                            {selectedChar ? `${selectedChar.name}'s Loadout` : 'Select a Character'}
                        </h2>

                        {selectedChar ? (
                            <div className="space-y-4">
                                {/* Primary Weapon */}
                                <LoadoutSlot
                                    label="Primary Weapon"
                                    icon={<Crosshair className="w-5 h-5" />}
                                    onClick={() => setSelectedSlot('primary')}
                                    isSelected={selectedSlot === 'primary'}
                                    equipped={selectedChar.equipment?.[0]}
                                />

                                {/* Secondary Weapon */}
                                <LoadoutSlot
                                    label="Secondary Weapon"
                                    icon={<Sword className="w-5 h-5" />}
                                    onClick={() => setSelectedSlot('secondary')}
                                    isSelected={selectedSlot === 'secondary'}
                                    equipped={selectedChar.equipment?.[1]}
                                />

                                {/* Grenades */}
                                <LoadoutSlot
                                    label="Grenades"
                                    icon={<span className="text-xl">💣</span>}
                                    onClick={() => setSelectedSlot('grenade')}
                                    isSelected={selectedSlot === 'grenade'}
                                    equipped={selectedChar.equipment?.[2]}
                                />

                                {/* Gadget */}
                                <LoadoutSlot
                                    label="Gadget"
                                    icon={<Zap className="w-5 h-5" />}
                                    onClick={() => setSelectedSlot('gadget')}
                                    isSelected={selectedSlot === 'gadget'}
                                    equipped={selectedChar.equipment?.[3]}
                                />

                                {/* Current Equipment List */}
                                <div className="mt-6 p-4 bg-gray-900/50 rounded border border-gray-700">
                                    <div className="text-sm font-bold text-gray-400 mb-2">All Equipment:</div>
                                    {selectedChar.equipment && selectedChar.equipment.length > 0 ? (
                                        <div className="space-y-1">
                                            {selectedChar.equipment.map((item: any, i: number) => (
                                                <div key={i} className="text-sm text-cyan-300">• {item}</div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-sm text-gray-500">No equipment</div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="text-center text-gray-500 py-12">
                                Select a character to view their loadout
                            </div>
                        )}
                    </div>

                    {/* RIGHT: Item Database */}
                    <div className="bg-gray-800/50 rounded-lg p-6 border-2 border-orange-600">
                        <h2 className="text-xl font-bold text-orange-400 mb-4">
                            {selectedSlot ? `Select ${selectedSlot}` : '📦 Item Database'}
                        </h2>

                        {selectedSlot ? (
                            <div className="space-y-2 max-h-96 overflow-y-auto">
                                {selectedSlot === 'primary' || selectedSlot === 'secondary' ? (
                                    // Pistols
                                    Object.values(PISTOLS).map(pistol => (
                                        <ItemCard
                                            key={pistol.id}
                                            item={pistol}
                                            onEquip={() => equipItem(pistol.id)}
                                            onPlaySound={() => playSound('combat.gunshot_pistol')}
                                        />
                                    ))
                                ) : selectedSlot === 'grenade' ? (
                                    // Grenades
                                    Object.values(GRENADES).map(grenade => (
                                        <ItemCard
                                            key={grenade.id}
                                            item={grenade}
                                            onEquip={() => equipItem(grenade.id)}
                                            onPlaySound={() => playSound('combat.explosion_medium')}
                                        />
                                    ))
                                ) : selectedSlot === 'gadget' ? (
                                    // Gadgets
                                    Object.values(GADGETS).map(gadget => (
                                        <ItemCard
                                            key={gadget.id}
                                            item={gadget}
                                            onEquip={() => equipItem(gadget.id)}
                                            onPlaySound={() => playSound('ui.select')}
                                        />
                                    ))
                                ) : null}
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <DatabaseCategory label="Pistols" count={Object.keys(PISTOLS).length} color="text-blue-400" />
                                <DatabaseCategory label="Grenades" count={Object.keys(GRENADES).length} color="text-orange-400" />
                                <DatabaseCategory label="Gadgets" count={Object.keys(GADGETS).length} color="text-purple-400" />
                                <div className="mt-6 p-4 bg-gray-900/50 rounded border border-gray-700">
                                    <div className="text-sm text-gray-400">
                                        Click a loadout slot on the left to browse items
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Bottom Actions */}
                <div className="mt-8 flex gap-4 justify-center">
                    <button
                        onClick={() => window.location.href = '/combat'}
                        className="px-6 py-3 bg-cyan-600 hover:bg-cyan-500 rounded-lg font-bold text-white flex items-center gap-2"
                    >
                        <Crosshair className="w-5 h-5" />
                        Go to Combat Lab
                    </button>
                    <button className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-bold text-white flex items-center gap-2">
                        <Save className="w-5 h-5" />
                        Save All Loadouts
                    </button>
                </div>
            </div>
        </div>
    );
};

// Loadout Slot Component
interface LoadoutSlotProps {
    label: string;
    icon: React.ReactNode;
    onClick: () => void;
    isSelected: boolean;
    equipped?: string;
}

const LoadoutSlot: React.FC<LoadoutSlotProps> = ({ label, icon, onClick, isSelected, equipped }) => (
    <button
        onClick={onClick}
        className={`w-full p-4 rounded-lg border-2 transition ${isSelected
                ? 'bg-purple-600 border-purple-400'
                : 'bg-gray-700 border-gray-600 hover:border-purple-500'
            }`}
    >
        <div className="flex items-center gap-3">
            <div className="text-purple-300">{icon}</div>
            <div className="flex-1 text-left">
                <div className="font-bold text-sm">{label}</div>
                {equipped ? (
                    <div className="text-xs text-cyan-300">{equipped}</div>
                ) : (
                    <div className="text-xs text-gray-500">Empty</div>
                )}
            </div>
        </div>
    </button>
);

// Item Card Component
interface ItemCardProps {
    item: any;
    onEquip: () => void;
    onPlaySound: () => void;
}

const ItemCard: React.FC<ItemCardProps> = ({ item, onEquip, onPlaySound }) => (
    <div className="bg-gray-700 rounded-lg p-3 border border-gray-600 hover:border-cyan-500 transition">
        <div className="flex items-center gap-3">
            {/* Icon */}
            {item.imagePath ? (
                <img src={item.imagePath} alt={item.name} className="w-12 h-12 object-contain" />
            ) : (
                <div className="w-12 h-12 flex items-center justify-center text-2xl bg-gray-800 rounded">
                    {item.emoji}
                </div>
            )}

            {/* Info */}
            <div className="flex-1">
                <div className="font-bold text-sm text-white">{item.name}</div>
                {item.damage ? (
                    <div className="text-xs text-gray-400">
                        {typeof item.damage === 'object'
                            ? `${item.damage.min}-${item.damage.max} dmg`
                            : `${item.damage} dmg`
                        }
                    </div>
                ) : null}
            </div>

            {/* Actions */}
            <div className="flex gap-2">
                <button
                    onClick={onPlaySound}
                    className="p-2 bg-blue-600 hover:bg-blue-500 rounded"
                    title="Test Sound"
                >
                    <Play className="w-4 h-4" />
                </button>
                <button
                    onClick={onEquip}
                    className="p-2 bg-green-600 hover:bg-green-500 rounded"
                    title="Equip"
                >
                    <Package className="w-4 h-4" />
                </button>
            </div>
        </div>
    </div>
);

// Database Category Component
interface DatabaseCategoryProps {
    label: string;
    count: number;
    color: string;
}

const DatabaseCategory: React.FC<DatabaseCategoryProps> = ({ label, count, color }) => (
    <div className="p-3 bg-gray-900/50 rounded border border-gray-700">
        <div className={`font-bold ${color}`}>{label}</div>
        <div className="text-sm text-gray-400">{count} items available</div>
    </div>
);

export default LoadoutEditor;
