/**
 * Damage System - Complete damage type and effect definitions
 * 
 * This is the authoritative source for all damage mechanics in the game.
 * Weapons, powers, and environmental hazards reference these definitions.
 */

// ==================== CORE TYPES ====================

export type DamageCategory =
    | 'PHYSICAL'
    | 'BLEED_PHYSICAL'
    | 'ENERGY'
    | 'BIOLOGICAL'
    | 'MENTAL'
    | 'OTHER';

export type DamageSubType =
    // PHYSICAL
    | 'SMASHING_MELEE'
    | 'SMASHING_PROJECTILE'
    | 'BLUNT_WEAPON'
    | 'IMPACT'
    | 'GUNFIRE_BUCKSHOT'
    | 'GUNFIRE_BULLET'
    | 'EXPLOSION_CONCUSSION'
    | 'SOUND_ULTRASONIC'
    | 'SOUND_SONIC'
    // BLEED_PHYSICAL
    | 'EXPLOSION_SHRAPNEL'
    | 'PIERCING_PROJECTILE'
    | 'GUNFIRE_AP'
    | 'EDGED_PIERCING'
    | 'EDGED_SLASHING'
    // ENERGY
    | 'ENERGY_THERMAL'
    | 'ENERGY_PLASMA'
    | 'ENERGY_ICE'
    | 'ELECTROMAGNETIC'
    | 'ELECTROMAGNETIC_BOLT'
    | 'ELECTROMAGNETIC_RADIATION'
    | 'ELECTROMAGNETIC_LASER'
    // BIOLOGICAL
    | 'TOXIN_POISON'
    | 'TOXIN_VENOM'
    | 'TOXIN_ACID'
    | 'BIOTOXIN_VIRUS'
    | 'BIOTOXIN_DISEASE'
    // MENTAL
    | 'MENTAL_CONTROL'
    | 'MENTAL_BLAST'
    // OTHER
    | 'DISINTEGRATION'
    | 'SPIRITUAL'
    | 'ASPHYXIATION'
    | 'EBULLISM'
    | 'SIPHON'
    | 'DECOMPOSITION'
    | 'SICK_NAUSEATED';

// ==================== EFFECT TYPES ====================

export interface KnockbackEffect {
    enabled: boolean;
    baseDistance: number;  // Tiles
    strengthScaling: boolean;  // Scales with attacker STR
    formula?: string;  // For complex calculations
}

export interface BleedingEffect {
    enabled: boolean;
    initialDamage: number;
    scaling: 'constant' | 'increasing' | 'decreasing';
    duration: number;  // Turns
    maxStacks: number;  // How many times it can stack
    movementPenalty?: boolean;  // Extra damage on move
    actionCostIncrease?: number;  // AP cost increase
}

export interface BurningEffect {
    enabled: boolean;
    initialDamage: number;
    damageIncrease: number;  // Damage increase per turn
    duration: number;
    spreadChance: number;  // % chance to spread to adjacent tiles
    armorDamage: boolean;  // Does it damage armor
}

export interface FreezeEffect {
    enabled: boolean;
    duration: number;
    apPenalty: number;  // AP reduction
    canShatter: boolean;  // Can be shattered for extra damage
    shatterDamage?: number;
}

export interface PoisonEffect {
    enabled: boolean;
    initialDamage: number;
    damageReduction: number;  // How much damage decreases per turn
    duration: number;
    affectsArmor: boolean;
    affectsBiological: boolean;
    affectsRobotic: boolean;
}

export interface StunEffect {
    enabled: boolean;
    duration: number;
    skipTurn: boolean;
    accuracyPenalty?: number;
    savingThrow?: boolean;  // Can resist with STA check
}

export interface OriginModifiers {
    biological: number;  // Damage multiplier vs biological
    robotic: number;     // Damage multiplier vs robotic
    energy: number;      // Damage multiplier vs energy beings
    undead: number;      // Damage multiplier vs undead
    construct: number;   // Damage multiplier vs constructs
}

export interface ArmorInteraction {
    armorEffectiveness: number;  // Multiplier (1.0 = normal, 2.0 = double protection, 0.5 = half)
    ignoresArmor: boolean;
    damagesArmor: boolean;
    bypassesShields: boolean;
}

export interface SpecialMechanics {
    canTargetItems: boolean;
    cannotBeDodged: boolean;  // Like lasers (speed of light)
    canImpale: boolean;
    canBreakBones: boolean;
    canBlock: boolean;  // Can be blocked with weapon/shield
    canParry: boolean;
    areaOfEffect?: string;  // e.g., "3x3", "5x5"
    spreadRadius?: number;  // For contagious effects
    environmental: boolean;  // Affects environment (fire spreads, ice freezes ground)
}

// ==================== DAMAGE DEFINITION ====================

export interface DamageDefinition {
    id: string;
    name: string;
    category: DamageCategory;
    subType: DamageSubType;
    emoji: string;
    description: string;

    // Effects
    knockback?: KnockbackEffect;
    bleeding?: BleedingEffect;
    burning?: BurningEffect;
    freeze?: FreezeEffect;
    poison?: PoisonEffect;
    stun?: StunEffect;

    // Modifiers
    originModifiers: OriginModifiers;
    armorInteraction: ArmorInteraction;
    specialMechanics: SpecialMechanics;

    // Damage over time
    dotType?: 'constant' | 'increasing' | 'decreasing' | 'scaling';
    visualEffect?: string;  // Animation/particle ID
}

// ==================== DAMAGE DATABASE ====================

export const DAMAGE_TYPES: Record<string, DamageDefinition> = {
    // ===== PHYSICAL DAMAGE =====

    SMASHING_MELEE: {
        id: 'SMASHING_MELEE',
        name: 'Smashing Melee',
        category: 'PHYSICAL',
        subType: 'SMASHING_MELEE',
        emoji: '👊',
        description: 'Punch or unarmed strike',
        knockback: {
            enabled: true,
            baseDistance: 1,
            strengthScaling: true,
        },
        originModifiers: { biological: 1.0, robotic: 0.8, energy: 0.5, undead: 1.0, construct: 0.7 },
        armorInteraction: {
            armorEffectiveness: 1.2,  // Armor quite effective
            ignoresArmor: false,
            damagesArmor: false,
            bypassesShields: false,
        },
        specialMechanics: {
            canTargetItems: false,
            cannotBeDodged: false,
            canImpale: false,
            canBreakBones: true,
            canBlock: true,
            canParry: true,
            environmental: false,
        },
    },

    BLUNT_WEAPON: {
        id: 'BLUNT_WEAPON',
        name: 'Blunt Weapon',
        category: 'PHYSICAL',
        subType: 'BLUNT_WEAPON',
        emoji: '🔨',
        description: 'Baseball bat, club, mace',
        knockback: {
            enabled: true,
            baseDistance: 2,
            strengthScaling: true,
        },
        originModifiers: { biological: 1.0, robotic: 0.9, energy: 0.6, undead: 1.0, construct: 0.8 },
        armorInteraction: {
            armorEffectiveness: 1.0,
            ignoresArmor: false,
            damagesArmor: false,
            bypassesShields: false,
        },
        specialMechanics: {
            canTargetItems: false,
            cannotBeDodged: false,
            canImpale: false,
            canBreakBones: true,
            canBlock: true,
            canParry: false,
            environmental: false,
        },
    },

    GUNFIRE_BUCKSHOT: {
        id: 'GUNFIRE_BUCKSHOT',
        name: 'Buckshot',
        category: 'PHYSICAL',
        subType: 'GUNFIRE_BUCKSHOT',
        emoji: '💥',
        description: 'Shotgun spread - high damage, severe falloff',
        knockback: {
            enabled: true,
            baseDistance: 3,
            strengthScaling: false,
        },
        originModifiers: { biological: 1.0, robotic: 0.7, energy: 0.3, undead: 0.9, construct: 0.6 },
        armorInteraction: {
            armorEffectiveness: 2.0,  // Armor HIGHLY effective
            ignoresArmor: false,
            damagesArmor: false,
            bypassesShields: false,
        },
        specialMechanics: {
            canTargetItems: true,
            cannotBeDodged: false,
            canImpale: false,
            canBreakBones: true,
            canBlock: false,
            canParry: false,
            areaOfEffect: 'cone',
            environmental: false,
        },
    },

    GUNFIRE_BULLET: {
        id: 'GUNFIRE_BULLET',
        name: 'Gunfire',
        category: 'PHYSICAL',
        subType: 'GUNFIRE_BULLET',
        emoji: '🔫',
        description: 'Standard bullets',
        originModifiers: { biological: 1.0, robotic: 0.5, energy: 0.2, undead: 0.8, construct: 0.4 },
        armorInteraction: {
            armorEffectiveness: 1.5,
            ignoresArmor: false,
            damagesArmor: false,
            bypassesShields: false,
        },
        specialMechanics: {
            canTargetItems: true,
            cannotBeDodged: false,
            canImpale: false,
            canBreakBones: true,
            canBlock: false,
            canParry: false,
            environmental: false,
        },
    },

    EXPLOSION_CONCUSSION: {
        id: 'EXPLOSION_CONCUSSION',
        name: 'Concussion Blast',
        category: 'PHYSICAL',
        subType: 'EXPLOSION_CONCUSSION',
        emoji: '💣',
        description: 'Explosive shockwave',
        knockback: {
            enabled: true,
            baseDistance: 4,
            strengthScaling: false,
        },
        stun: {
            enabled: true,
            duration: 1,
            skipTurn: false,
            accuracyPenalty: 30,
            savingThrow: true,
        },
        originModifiers: { biological: 1.0, robotic: 1.0, energy: 0.8, undead: 0.9, construct: 0.9 },
        armorInteraction: {
            armorEffectiveness: 0.7,  // Armor less effective vs explosions
            ignoresArmor: false,
            damagesArmor: true,
            bypassesShields: false,
        },
        specialMechanics: {
            canTargetItems: true,
            cannotBeDodged: true,  // Can't dodge explosions
            canImpale: false,
            canBreakBones: true,
            canBlock: false,
            canParry: false,
            areaOfEffect: '3x3',
            environmental: true,
        },
    },

    // ===== BLEED PHYSICAL DAMAGE =====

    EXPLOSION_SHRAPNEL: {
        id: 'EXPLOSION_SHRAPNEL',
        name: 'Shrapnel Explosion',
        category: 'BLEED_PHYSICAL',
        subType: 'EXPLOSION_SHRAPNEL',
        emoji: '💥',
        description: 'Explosion with metal fragments',
        knockback: {
            enabled: true,
            baseDistance: 3,
            strengthScaling: false,
        },
        bleeding: {
            enabled: true,
            initialDamage: 5,
            scaling: 'constant',
            duration: 3,
            maxStacks: 3,
            movementPenalty: true,
        },
        originModifiers: { biological: 1.2, robotic: 0.8, energy: 0.3, undead: 0.9, construct: 0.6 },
        armorInteraction: {
            armorEffectiveness: 0.8,
            ignoresArmor: false,
            damagesArmor: true,
            bypassesShields: false,
        },
        specialMechanics: {
            canTargetItems: true,
            cannotBeDodged: true,
            canImpale: true,
            canBreakBones: true,
            canBlock: false,
            canParry: false,
            areaOfEffect: '5x5',
            environmental: true,
        },
    },

    GUNFIRE_AP: {
        id: 'GUNFIRE_AP',
        name: 'Armor Piercing Rounds',
        category: 'BLEED_PHYSICAL',
        subType: 'GUNFIRE_AP',
        emoji: '🎯',
        description: 'Armor-piercing bullets',
        bleeding: {
            enabled: true,
            initialDamage: 3,
            scaling: 'decreasing',
            duration: 2,
            maxStacks: 2,
        },
        originModifiers: { biological: 1.0, robotic: 1.2, energy: 0.4, undead: 0.8, construct: 1.1 },
        armorInteraction: {
            armorEffectiveness: 0.5,  // Armor HALF as effective
            ignoresArmor: false,
            damagesArmor: true,
            bypassesShields: false,
        },
        specialMechanics: {
            canTargetItems: true,
            cannotBeDodged: false,
            canImpale: true,
            canBreakBones: false,
            canBlock: false,
            canParry: false,
            environmental: false,
        },
    },

    EDGED_SLASHING: {
        id: 'EDGED_SLASHING',
        name: 'Slashing',
        category: 'BLEED_PHYSICAL',
        subType: 'EDGED_SLASHING',
        emoji: '🗡️',
        description: 'Sword, knife, axe',
        bleeding: {
            enabled: true,
            initialDamage: 4,
            scaling: 'constant',
            duration: 4,
            maxStacks: 5,
            movementPenalty: true,
            actionCostIncrease: 1,
        },
        originModifiers: { biological: 1.3, robotic: 0.3, energy: 0.1, undead: 0.7, construct: 0.4 },
        armorInteraction: {
            armorEffectiveness: 1.0,
            ignoresArmor: false,
            damagesArmor: false,
            bypassesShields: false,
        },
        specialMechanics: {
            canTargetItems: true,
            cannotBeDodged: false,
            canImpale: false,
            canBreakBones: false,
            canBlock: true,
            canParry: true,
            environmental: false,
        },
    },

    EDGED_PIERCING: {
        id: 'EDGED_PIERCING',
        name: 'Piercing',
        category: 'BLEED_PHYSICAL',
        subType: 'EDGED_PIERCING',
        emoji: '🔱',
        description: 'Spear, rapier, spike',
        bleeding: {
            enabled: true,
            initialDamage: 3,
            scaling: 'constant',
            duration: 3,
            maxStacks: 3,
        },
        originModifiers: { biological: 1.2, robotic: 0.5, energy: 0.2, undead: 0.8, construct: 0.6 },
        armorInteraction: {
            armorEffectiveness: 0.8,  // Better vs armor than slashing
            ignoresArmor: false,
            damagesArmor: false,
            bypassesShields: false,
        },
        specialMechanics: {
            canTargetItems: true,
            cannotBeDodged: false,
            canImpale: true,  // Can pin targets
            canBreakBones: false,
            canBlock: true,
            canParry: true,
            environmental: false,
        },
    },

    // ===== ENERGY DAMAGE =====

    ENERGY_THERMAL: {
        id: 'ENERGY_THERMAL',
        name: 'Thermal',
        category: 'ENERGY',
        subType: 'ENERGY_THERMAL',
        emoji: '🔥',
        description: 'Fire damage',
        burning: {
            enabled: true,
            initialDamage: 5,
            damageIncrease: 2,  // Increases by 2 each turn
            duration: 3,
            spreadChance: 0.3,  // 30% to spread
            armorDamage: true,
        },
        originModifiers: { biological: 1.2, robotic: 0.7, energy: 0.5, undead: 0.8, construct: 0.9 },
        armorInteraction: {
            armorEffectiveness: 0.6,  // Energy bypasses most armor
            ignoresArmor: false,
            damagesArmor: true,
            bypassesShields: true,
        },
        specialMechanics: {
            canTargetItems: true,
            cannotBeDodged: false,
            canImpale: false,
            canBreakBones: false,
            canBlock: false,
            canParry: false,
            environmental: true,  // Sets terrain on fire
        },
    },

    ENERGY_ICE: {
        id: 'ENERGY_ICE',
        name: 'Ice',
        category: 'ENERGY',
        subType: 'ENERGY_ICE',
        emoji: '❄️',
        description: 'Freezing cold',
        freeze: {
            enabled: true,
            duration: 2,
            apPenalty: 2,
            canShatter: true,
            shatterDamage: 20,
        },
        originModifiers: { biological: 1.0, robotic: 0.9, energy: 0.6, undead: 0.7, construct: 0.8 },
        armorInteraction: {
            armorEffectiveness: 0.7,
            ignoresArmor: false,
            damagesArmor: false,
            bypassesShields: true,
        },
        specialMechanics: {
            canTargetItems: false,
            cannotBeDodged: false,
            canImpale: false,
            canBreakBones: false,
            canBlock: false,
            canParry: false,
            environmental: true,  // Freezes terrain
        },
    },

    ELECTROMAGNETIC_LASER: {
        id: 'ELECTROMAGNETIC_LASER',
        name: 'Laser',
        category: 'ENERGY',
        subType: 'ELECTROMAGNETIC_LASER',
        emoji: '⚡',
        description: 'Laser beam - cannot be dodged',
        burning: {
            enabled: true,
            initialDamage: 3,
            damageIncrease: 1,
            duration: 2,
            spreadChance: 0,
            armorDamage: true,
        },
        originModifiers: { biological: 1.0, robotic: 1.3, energy: 0.8, undead: 0.9, construct: 1.2 },
        armorInteraction: {
            armorEffectiveness: 0.5,
            ignoresArmor: false,
            damagesArmor: true,
            bypassesShields: false,
        },
        specialMechanics: {
            canTargetItems: true,
            cannotBeDodged: true,  // Speed of light
            canImpale: false,
            canBreakBones: false,
            canBlock: false,
            canParry: false,
            environmental: false,
        },
    },

    ELECTROMAGNETIC_BOLT: {
        id: 'ELECTROMAGNETIC_BOLT',
        name: 'Electronic Bolt',
        category: 'ENERGY',
        subType: 'ELECTROMAGNETIC_BOLT',
        emoji: '⚡',
        description: 'Electric shock',
        stun: {
            enabled: true,
            duration: 1,
            skipTurn: true,
            savingThrow: true,
        },
        originModifiers: { biological: 1.0, robotic: 2.0, energy: 0.5, undead: 0.6, construct: 1.8 },
        armorInteraction: {
            armorEffectiveness: 0.3,  // Electricity bypasses armor
            ignoresArmor: false,
            damagesArmor: false,
            bypassesShields: true,
        },
        specialMechanics: {
            canTargetItems: true,
            cannotBeDodged: false,
            canImpale: false,
            canBreakBones: false,
            canBlock: false,
            canParry: false,
            areaOfEffect: 'chain',  // Can chain to nearby targets
            environmental: false,
        },
    },

    // ===== BIOLOGICAL DAMAGE =====

    TOXIN_POISON: {
        id: 'TOXIN_POISON',
        name: 'Poison',
        category: 'BIOLOGICAL',
        subType: 'TOXIN_POISON',
        emoji: '☠️',
        description: 'Toxic poison',
        poison: {
            enabled: true,
            initialDamage: 10,
            damageReduction: 2,  // Reduces by 2 each turn
            duration: 5,
            affectsArmor: false,
            affectsBiological: true,
            affectsRobotic: false,
        },
        dotType: 'decreasing',
        originModifiers: { biological: 1.5, robotic: 0, energy: 0.3, undead: 0, construct: 0 },
        armorInteraction: {
            armorEffectiveness: 0,  // Ignores armor
            ignoresArmor: true,
            damagesArmor: false,
            bypassesShields: true,
        },
        specialMechanics: {
            canTargetItems: false,
            cannotBeDodged: false,
            canImpale: false,
            canBreakBones: false,
            canBlock: false,
            canParry: false,
            environmental: false,
        },
    },

    TOXIN_ACID: {
        id: 'TOXIN_ACID',
        name: 'Acid',
        category: 'BIOLOGICAL',
        subType: 'TOXIN_ACID',
        emoji: '🧪',
        description: 'Corrosive acid',
        poison: {
            enabled: true,
            initialDamage: 8,
            damageReduction: 1,
            duration: 4,
            affectsArmor: true,  // Damages armor!
            affectsBiological: true,
            affectsRobotic: true,
        },
        originModifiers: { biological: 1.2, robotic: 1.0, energy: 0.5, undead: 0.8, construct: 1.1 },
        armorInteraction: {
            armorEffectiveness: 0.5,
            ignoresArmor: false,
            damagesArmor: true,  // Eats through armor
            bypassesShields: true,
        },
        specialMechanics: {
            canTargetItems: true,  // Melts items
            cannotBeDodged: false,
            canImpale: false,
            canBreakBones: false,
            canBlock: false,
            canParry: false,
            environmental: true,  // Damages terrain
        },
    },

    // ===== MENTAL DAMAGE =====

    MENTAL_BLAST: {
        id: 'MENTAL_BLAST',
        name: 'Mental Blast',
        category: 'MENTAL',
        subType: 'MENTAL_BLAST',
        emoji: '🧠',
        description: 'Psychic attack',
        stun: {
            enabled: true,
            duration: 2,
            skipTurn: false,
            accuracyPenalty: 40,
            savingThrow: true,
        },
        originModifiers: { biological: 1.2, robotic: 0, energy: 1.0, undead: 0.5, construct: 0 },
        armorInteraction: {
            armorEffectiveness: 0,  // Physical armor useless
            ignoresArmor: true,
            damagesArmor: false,
            bypassesShields: true,
        },
        specialMechanics: {
            canTargetItems: false,
            cannotBeDodged: true,  // Can't dodge thoughts
            canImpale: false,
            canBreakBones: false,
            canBlock: false,
            canParry: false,
            environmental: false,
        },
    },

    // ===== OTHER DAMAGE =====

    DISINTEGRATION: {
        id: 'DISINTEGRATION',
        name: 'Disintegration',
        category: 'OTHER',
        subType: 'DISINTEGRATION',
        emoji: '💀',
        description: 'Turns target to dust',
        originModifiers: { biological: 1.5, robotic: 1.5, energy: 1.2, undead: 1.5, construct: 1.5 },
        armorInteraction: {
            armorEffectiveness: 0,
            ignoresArmor: true,
            damagesArmor: true,
            bypassesShields: true,
        },
        specialMechanics: {
            canTargetItems: true,
            cannotBeDodged: false,
            canImpale: false,
            canBreakBones: false,
            canBlock: false,
            canParry: false,
            environmental: false,
        },
    },

    ASPHYXIATION: {
        id: 'ASPHYXIATION',
        name: 'Asphyxiation',
        category: 'OTHER',
        subType: 'ASPHYXIATION',
        emoji: '😵',
        description: 'Suffocation damage',
        poison: {
            enabled: true,
            initialDamage: 5,
            damageReduction: 0,  // Constant until ended
            duration: 10,  // Based on STA
            affectsArmor: false,
            affectsBiological: true,
            affectsRobotic: false,
        },
        dotType: 'constant',
        originModifiers: { biological: 2.0, robotic: 0, energy: 0.5, undead: 0, construct: 0 },
        armorInteraction: {
            armorEffectiveness: 0,
            ignoresArmor: true,
            damagesArmor: false,
            bypassesShields: true,
        },
        specialMechanics: {
            canTargetItems: false,
            cannotBeDodged: true,
            canImpale: false,
            canBreakBones: false,
            canBlock: false,
            canParry: false,
            environmental: false,
        },
    },
};

// ==================== HELPER FUNCTIONS ====================

/**
 * Get damage definition by ID
 */
export function getDamageType(id: string): DamageDefinition | undefined {
    return DAMAGE_TYPES[id];
}

/**
 * Calculate damage against specific origin
 */
export function calculateOriginDamage(
    baseDamage: number,
    damageTypeId: string,
    targetOrigin: keyof OriginModifiers
): number {
    const damageType = getDamageType(damageTypeId);
    if (!damageType) return baseDamage;

    const modifier = damageType.originModifiers[targetOrigin];
    return Math.floor(baseDamage * modifier);
}

/**
 * Calculate damage with armor
 */
export function calculateArmoredDamage(
    baseDamage: number,
    damageTypeId: string,
    armorValue: number
): number {
    const damageType = getDamageType(damageTypeId);
    if (!damageType) return Math.max(0, baseDamage - armorValue);

    if (damageType.armorInteraction.ignoresArmor) {
        return baseDamage;
    }

    const effectiveArmor = armorValue * damageType.armorInteraction.armorEffectiveness;
    return Math.max(0, baseDamage - effectiveArmor);
}

/**
 * Get all damage types by category
 */
export function getDamageTypesByCategory(category: DamageCategory): DamageDefinition[] {
    return Object.values(DAMAGE_TYPES).filter(dt => dt.category === category);
}

/**
 * Check if damage type can cause effect
 */
export function canCauseKnockback(damageTypeId: string): boolean {
    const dt = getDamageType(damageTypeId);
    return dt?.knockback?.enabled ?? false;
}

export function canCauseBleeding(damageTypeId: string): boolean {
    const dt = getDamageType(damageTypeId);
    return dt?.bleeding?.enabled ?? false;
}

export function canCauseBurning(damageTypeId: string): boolean {
    const dt = getDamageType(damageTypeId);
    return dt?.burning?.enabled ?? false;
}

export function canCauseFreeze(damageTypeId: string): boolean {
    const dt = getDamageType(damageTypeId);
    return dt?.freeze?.enabled ?? false;
}

export function canCausePoison(damageTypeId: string): boolean {
    const dt = getDamageType(damageTypeId);
    return dt?.poison?.enabled ?? false;
}

export function canCauseStun(damageTypeId: string): boolean {
    const dt = getDamageType(damageTypeId);
    return dt?.stun?.enabled ?? false;
}
