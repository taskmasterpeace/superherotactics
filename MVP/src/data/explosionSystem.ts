/**
 * Grenade & Explosion System
 * 
 * Complete system for:
 * 1. Throwing grenades with arc trajectory
 * 2. Hit/miss mechanics (skill-based accuracy)
 * 3. Explosions at landing point
 * 4. Area-of-effect damage and knockback from explosion center
 */

import { calculateKnockback, getKnockbackDirection, EXPLOSION_FORCES } from './knockbackSystem';

// ==================== GRENADE DEFINITIONS ====================

export interface Grenade {
    id: string;
    name: string;
    emoji: string;
    description: string;

    // Throwing
    maxRange: number;        // Max throw distance in tiles
    throwSkillRequired: string;  // 'None', 'Throwing', 'Demolitions'

    // Explosion
    blastRadius: number;     // Tiles from impact point
    damageAtCenter: number;  // Max damage at center
    damageFalloff: 'linear' | 'quadratic';  // How damage decreases with distance
    forceId: string;         // References EXPLOSION_FORCES

    // Effects
    statusEffects?: string[];  // Applied to victims (burning, stunned, etc.)
    visualEffect: 'fire' | 'smoke' | 'flash' | 'shrapnel';
    soundLevel: number;      // Alerts enemies
}

export const GRENADES: Record<string, Grenade> = {
    FRAG: {
        id: 'FRAG',
        name: 'Frag Grenade',
        emoji: '💣',
        description: 'Standard fragmentation grenade',
        maxRange: 12,
        throwSkillRequired: 'None',
        blastRadius: 3,  // 3-tile radius = 7x7 affected area
        damageAtCenter: 50,
        damageFalloff: 'linear',
        forceId: 'GRENADE_FRAG',
        statusEffects: ['bleeding'],
        visualEffect: 'shrapnel',
        soundLevel: 165,
    },

    CONCUSSION: {
        id: 'CONCUSSION',
        name: 'Concussion Grenade',
        emoji: '💥',
        description: 'High-force concussion blast',
        maxRange: 12,
        throwSkillRequired: 'None',
        blastRadius: 4,
        damageAtCenter: 35,
        damageFalloff: 'quadratic',
        forceId: 'GRENADE_CONCUSSION',
        statusEffects: ['stunned'],
        visualEffect: 'smoke',
        soundLevel: 170,
    },

    FLASHBANG: {
        id: 'FLASHBANG',
        name: 'Flashbang',
        emoji: '💡',
        description: 'Blinding flash and bang',
        maxRange: 15,
        throwSkillRequired: 'None',
        blastRadius: 5,
        damageAtCenter: 5,
        damageFalloff: 'quadratic',
        forceId: 'GRENADE_FLASH',
        statusEffects: ['stunned', 'blinded'],
        visualEffect: 'flash',
        soundLevel: 180,
    },

    INCENDIARY: {
        id: 'INCENDIARY',
        name: 'Incendiary Grenade',
        emoji: '🔥',
        description: 'Creates fire zone',
        maxRange: 12,
        throwSkillRequired: 'None',
        blastRadius: 2,
        damageAtCenter: 30,
        damageFalloff: 'linear',
        forceId: 'GRENADE_FRAG',
        statusEffects: ['burning'],
        visualEffect: 'fire',
        soundLevel: 140,
    },

    SMOKE: {
        id: 'SMOKE',
        name: 'Smoke Grenade',
        emoji: '💨',
        description: 'Creates smoke screen',
        maxRange: 15,
        throwSkillRequired: 'None',
        blastRadius: 4,
        damageAtCenter: 0,
        damageFalloff: 'linear',
        forceId: 'GRENADE_FLASH',
        statusEffects: [],
        visualEffect: 'smoke',
        soundLevel: 100,
    },
};

// ==================== THROWING MECHANICS ====================

export interface ThrowResult {
    targetedPosition: { x: number; y: number };
    actualLandingPosition: { x: number; y: number };
    hit: boolean;  // Did it land where aimed
    scatterDistance: number;  // How far off target
    scatterDirection: { x: number; y: number };
    arcPath: { x: number; y: number }[];  // Points along arc for visualization
}

/**
 * Calculate throw accuracy and landing position
 * 
 * @param throwerPos - Thrower's position
 * @param targetPos - Where they're AIMING
 * @param throwerSTR - Strength (affects max range)
 * @param hasThrowingSkill - Has 'Throwing' skill (perfect accuracy)
 * @param grenade - Grenade being thrown
 * @returns Where it actually lands
 */
export function calculateThrow(
    throwerPos: { x: number; y: number },
    targetPos: { x: number; y: number },
    throwerSTR: number,
    hasThrowingSkill: boolean,
    grenade: Grenade
): ThrowResult {
    // Calculate distance
    const dx = targetPos.x - throwerPos.x;
    const dy = targetPos.y - throwerPos.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Max range based on STR and grenade
    const maxRange = grenade.maxRange + Math.floor(throwerSTR / 10);

    // If skilled thrower - perfect accuracy
    if (hasThrowingSkill || grenade.throwSkillRequired === 'Throwing') {
        return {
            targetedPosition: targetPos,
            actualLandingPosition: targetPos,
            hit: true,
            scatterDistance: 0,
            scatterDirection: { x: 0, y: 0 },
            arcPath: calculateArcPath(throwerPos, targetPos),
        };
    }

    // UNSKILLED THROW - Scatter mechanics
    // Base scatter: 1 tile per 3 tiles distance
    const baseScatter = distance / 3;

    // Additional scatter if beyond comfortable range (60% of max)
    const comfortableRange = maxRange * 0.6;
    const rangeScatter = distance > comfortableRange
        ? (distance - comfortableRange) / 2
        : 0;

    const totalScatter = baseScatter + rangeScatter;

    // Random scatter direction
    const scatterAngle = Math.random() * Math.PI * 2;
    const scatterDist = Math.random() * totalScatter;

    const scatterX = Math.cos(scatterAngle) * scatterDist;
    const scatterY = Math.sin(scatterAngle) * scatterDist;

    const actualLanding = {
        x: Math.round(targetPos.x + scatterX),
        y: Math.round(targetPos.y + scatterY),
    };

    // Check if hit (within 1 tile)
    const hitDistance = Math.sqrt(
        Math.pow(actualLanding.x - targetPos.x, 2) +
        Math.pow(actualLanding.y - targetPos.y, 2)
    );
    const hit = hitDistance <= 1;

    return {
        targetedPosition: targetPos,
        actualLandingPosition: actualLanding,
        hit,
        scatterDistance: scatterDist,
        scatterDirection: { x: scatterX, y: scatterY },
        arcPath: calculateArcPath(throwerPos, actualLanding),
    };
}

/**
 * Calculate arc trajectory points for visual animation
 */
function calculateArcPath(
    start: { x: number; y: number },
    end: { x: number; y: number }
): { x: number; y: number }[] {
    const points: { x: number; y: number }[] = [];
    const distance = Math.sqrt(
        Math.pow(end.x - start.x, 2) +
        Math.pow(end.y - start.y, 2)
    );

    const steps = Math.ceil(distance * 2);  // 2 points per tile

    for (let i = 0; i <= steps; i++) {
        const t = i / steps;  // 0 to 1

        // Linear interpolation for x, y
        const x = start.x + (end.x - start.x) * t;
        const y = start.y + (end.y - start.y) * t;

        // Parabolic arc height (peaks at middle)
        const arcHeight = distance * 0.5 * Math.sin(t * Math.PI);

        points.push({ x, y: y - arcHeight });  // Subtract for upward arc
    }

    return points;
}

// ==================== EXPLOSION MECHANICS ====================

export interface ExplosionVictim {
    unitId: string;
    position: { x: number; y: number };
    distanceFromCenter: number;
    damage: number;
    knockbackSpaces: number;
    knockbackDirection: { x: number; y: number };
    statusEffects: string[];
}

export interface ExplosionResult {
    centerPosition: { x: number; y: number };
    radius: number;
    victims: ExplosionVictim[];
    tilesAffected: { x: number; y: number }[];
}

/**
 * Calculate explosion effects on all units in radius
 * 
 * @param centerPos - Where grenade landed
 * @param grenade - Grenade type
 * @param units - All units on map with position and STR
 * @returns Damage and knockback for each victim
 */
export function calculateExplosion(
    centerPos: { x: number; y: number },
    grenade: Grenade,
    units: Array<{
        id: string;
        position: { x: number; y: number };
        str: number;
    }>
): ExplosionResult {
    const victims: ExplosionVictim[] = [];
    const tilesAffected: { x: number; y: number }[] = [];

    // Get all tiles in radius
    for (let dx = -grenade.blastRadius; dx <= grenade.blastRadius; dx++) {
        for (let dy = -grenade.blastRadius; dy <= grenade.blastRadius; dy++) {
            const tileX = centerPos.x + dx;
            const tileY = centerPos.y + dy;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance <= grenade.blastRadius) {
                tilesAffected.push({ x: tileX, y: tileY });
            }
        }
    }

    // Check each unit
    units.forEach(unit => {
        const dx = unit.position.x - centerPos.x;
        const dy = unit.position.y - centerPos.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Unit in blast radius?
        if (distance <= grenade.blastRadius) {
            // Calculate damage based on distance
            let damageMult = 1.0;

            if (grenade.damageFalloff === 'linear') {
                // Linear: 100% at center, 0% at edge
                damageMult = 1 - (distance / grenade.blastRadius);
            } else {
                // Quadratic: More gentle falloff
                damageMult = Math.pow(1 - (distance / grenade.blastRadius), 2);
            }

            const damage = Math.floor(grenade.damageAtCenter * damageMult);

            // Calculate knockback FROM EXPLOSION CENTER
            const explosionForce = EXPLOSION_FORCES[grenade.forceId]?.force || 160;
            const knockbackResult = calculateKnockback(explosionForce * damageMult, unit.str);

            // Knockback direction: FROM center TO unit
            const knockbackDir = distance === 0
                ? { x: 0, y: 1 }  // If standing on grenade, push down
                : { x: dx / distance, y: dy / distance };

            victims.push({
                unitId: unit.id,
                position: unit.position,
                distanceFromCenter: distance,
                damage,
                knockbackSpaces: knockbackResult.spaces,
                knockbackDirection: knockbackDir,
                statusEffects: grenade.statusEffects || [],
            });
        }
    });

    return {
        centerPosition: centerPos,
        radius: grenade.blastRadius,
        victims,
        tilesAffected,
    };
}

// ==================== COMBAT LOG MESSAGES ====================

export function getThrowLogMessage(
    throwerName: string,
    grenade: Grenade,
    throwResult: ThrowResult
): string {
    if (throwResult.hit) {
        return `${throwerName} throws ${grenade.name} ${grenade.emoji} - Perfect throw!`;
    } else {
        return `${throwerName} throws ${grenade.name} ${grenade.emoji} - Scattered ${Math.round(throwResult.scatterDistance)} tiles off target!`;
    }
}

export function getExplosionLogMessage(
    grenade: Grenade,
    explosionResult: ExplosionResult
): string {
    const victimCount = explosionResult.victims.length;

    if (victimCount === 0) {
        return `${grenade.name} ${grenade.emoji} explodes harmlessly!`;
    }

    return `${grenade.name} ${grenade.emoji} EXPLODES! ${victimCount} ${victimCount === 1 ? 'target' : 'targets'} caught in blast!`;
}

export function getVictimLogMessage(victim: ExplosionVictim): string {
    let message = `💥 ${victim.damage} damage`;

    if (victim.knockbackSpaces > 0) {
        message += `, knocked back ${victim.knockbackSpaces} spaces`;
    }

    if (victim.statusEffects.length > 0) {
        message += ` (${victim.statusEffects.join(', ')})`;
    }

    return message;
}
