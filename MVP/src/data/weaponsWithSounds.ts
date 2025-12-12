/**
 * Extended Weapon Database with Sound Effects
 * 
 * Each weapon now includes:
 * - soundKey: Reference to sound in catalog
 * - soundTrigger: When to play (on_fire, on_hit, on_reload, on_equip)
 * - soundDecibels: How loud (for stealth detection)
 * - soundRange: How far enemies can hear
 */

import { Weapon } from './equipmentTypes';

export interface WeaponSound {
    soundKey: string;  // e.g., "combat.gunshot_pistol"
    trigger: 'on_fire' | 'on_hit' | 'on_reload' | 'on_equip' | 'on_draw';
    decibels: number;  // Sound intensity
    rangeInTiles: number;  // How far sound travels
}

// Extended weapon type with sounds
export interface WeaponWithSounds extends Weapon {
    sounds: WeaponSound[];
    imageRatio: '1:1' | '16:9' | '9:16';
    imagePlaceholder: string;  // Path to placeholder image
}

// Example weapon with complete sound data
export const PISTOL_M1911: WeaponWithSounds = {
    id: 'WPN_PIS_001',
    name: 'Colt M1911',
    emoji: '🔫',
    category: 'Ranged',
    damageMin: 15,
    damageMax: 25,
    range: 50,
    accuracy: 0,
    rateOfFire: 'semi',
    magazineSize: 7,
    reloadTime: 1,
    weaponWeight: 2.4,
    damageType: 'Physical',
    damageSubType: 'GUNFIRE',
    specialEffects: ['Reliable', 'Classic'],
    costLevel: 'Medium',
    availability: 'Common',
    skillRequired: 'Pistols',
    stunCapable: false,
    defaultMode: 'kill',
    alwaysLethal: true,

    // Sound data
    sounds: [
        {
            soundKey: 'combat.gunshot_pistol',
            trigger: 'on_fire',
            decibels: 140,
            rangeInTiles: 20,
        },
        {
            soundKey: 'combat.reload_pistol',
            trigger: 'on_reload',
            decibels: 60,
            rangeInTiles: 3,
        },
        {
            soundKey: 'equipment.holster_draw',
            trigger: 'on_draw',
            decibels: 40,
            rangeInTiles: 2,
        },
    ],

    // Inventory display
    imageRatio: '1:1',
    imagePlaceholder: '/assets/items/placeholders/pistol_1x1.png',
};

export const RIFLE_AR15: WeaponWithSounds = {
    id: 'WPN_RIF_001',
    name: 'AR-15',
    emoji: '🔫',
    category: 'Ranged',
    damageMin: 25,
    damageMax: 35,
    range: 100,
    accuracy: 1,
    rateOfFire: 'auto',
    magazineSize: 30,
    reloadTime: 2,
    weaponWeight: 7.5,
    damageType: 'Physical',
    damageSubType: 'GUNFIRE',
    specialEffects: ['Automatic', 'Accurate'],
    costLevel: 'High',
    availability: 'Military',
    skillRequired: 'Rifles',
    stunCapable: false,
    defaultMode: 'kill',
    alwaysLethal: true,

    sounds: [
        {
            soundKey: 'combat.gunshot_rifle',
            trigger: 'on_fire',
            decibels: 160,
            rangeInTiles: 25,
        },
        {
            soundKey: 'combat.reload_rifle',
            trigger: 'on_reload',
            decibels: 70,
            rangeInTiles: 4,
        },
        {
            soundKey: 'equipment.weapon_draw',
            trigger: 'on_draw',
            decibels: 50,
            rangeInTiles: 2,
        },
    ],

    imageRatio: '16:9',
    imagePlaceholder: '/assets/items/placeholders/rifle_3x1.png',
};

export const GRENADE_FRAG: WeaponWithSounds = {
    id: 'WPN_GRN_001',
    name: 'Frag Grenade',
    emoji: '💣',
    category: 'Thrown',
    damageMin: 40,
    damageMax: 60,
    range: 30,
    accuracy: 0,
    rateOfFire: 'single',
    magazineSize: 1,
    reloadTime: 0,
    weaponWeight: 0.4,
    damageType: 'Physical',
    damageSubType: 'SHRAPNEL',
    specialEffects: ['Area damage', 'Bleeding'],
    costLevel: 'Medium',
    availability: 'Military',
    skillRequired: 'Throwing',
    stunCapable: false,
    defaultMode: 'kill',
    alwaysLethal: true,

    sounds: [
        {
            soundKey: 'combat.grenade_pin',
            trigger: 'on_equip',
            decibels: 30,
            rangeInTiles: 1,
        },
        {
            soundKey: 'combat.grenade_throw',
            trigger: 'on_fire',
            decibels: 40,
            rangeInTiles: 3,
        },
        {
            soundKey: 'combat.explosion_medium',
            trigger: 'on_hit',
            decibels: 180,
            rangeInTiles: 35,
        },
    ],

    imageRatio: '1:1',
    imagePlaceholder: '/assets/items/placeholders/grenade_1x1.png',
};

// Gadget sounds
export interface GadgetSound {
    soundKey: string;
    trigger: 'on_activate' | 'on_deactivate' | 'on_use' | 'on_deploy' | 'ambient';
    decibels: number;
    rangeInTiles: number;
}

export const MEDKIT_ADVANCED = {
    id: 'GAD_MED_002',
    name: 'Advanced Medkit',
    emoji: '⚕️',
    category: 'Medical',

    sounds: [
        {
            soundKey: 'equipment.medkit_open',
            trigger: 'on_activate',
            decibels: 50,
            rangeInTiles: 2,
        },
        {
            soundKey: 'medical.bandage_apply',
            trigger: 'on_use',
            decibels: 40,
            rangeInTiles: 1,
        },
        {
            soundKey: 'equipment.medkit_close',
            trigger: 'on_deactivate',
            decibels: 45,
            rangeInTiles: 2,
        },
    ],

    imageRatio: '16:9',
    imagePlaceholder: '/assets/items/placeholders/medkit_2x1.png',
};

export const DRONE_COMBAT_LIGHT = {
    id: 'GAD_DRN_003',
    name: 'Combat Drone Light',
    emoji: '🚁',
    category: 'Drone',

    sounds: [
        {
            soundKey: 'drone.deploy',
            trigger: 'on_deploy',
            decibels: 80,
            rangeInTiles: 10,
        },
        {
            soundKey: 'drone.propeller_ambient',
            trigger: 'ambient',
            decibels: 65,
            rangeInTiles: 8,
        },
        {
            soundKey: 'drone.weapon_fire',
            trigger: 'on_use',
            decibels: 120,
            rangeInTiles: 15,
        },
    ],

    imageRatio: '1:1',
    imagePlaceholder: '/assets/items/placeholders/drone_1x1.png',
};
