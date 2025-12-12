/**
 * Knockback System - Force vs Weight Physics
 * 
 * Simple formula: Impact = Attack Force - (Defender Weight × 0.3)
 * 
 * Each weapon/explosion has its own force value.
 * Grenade vs Human (150 lbs) = 5-10 spaces
 * Grenade vs Hulk (600 lbs) = 0-1 spaces (tanks it)
 */

import { getCharacterWeight } from './strengthSystem';

// ==================== KNOCKBACK TABLE ====================

export interface KnockbackTier {
    minImpact: number;
    maxImpact: number;
    spacesKnockedBack: number;
}

/**
 * Impact → Distance table
 * Recalibrated for: Grenade (160 force) vs Human (150 lbs) = ~115 impact = 7 spaces
 */
export const KNOCKBACK_TABLE: KnockbackTier[] = [
    { minImpact: 0, maxImpact: 9, spacesKnockedBack: 0 },
    { minImpact: 10, maxImpact: 19, spacesKnockedBack: 1 },
    { minImpact: 20, maxImpact: 39, spacesKnockedBack: 2 },
    { minImpact: 40, maxImpact: 59, spacesKnockedBack: 3 },
    { minImpact: 60, maxImpact: 79, spacesKnockedBack: 4 },
    { minImpact: 80, maxImpact: 99, spacesKnockedBack: 5 },
    { minImpact: 100, maxImpact: 119, spacesKnockedBack: 6 },
    { minImpact: 120, maxImpact: 139, spacesKnockedBack: 7 },
    { minImpact: 140, maxImpact: 159, spacesKnockedBack: 8 },
    { minImpact: 160, maxImpact: 179, spacesKnockedBack: 9 },
    { minImpact: 180, maxImpact: 199, spacesKnockedBack: 10 },
    { minImpact: 200, maxImpact: 229, spacesKnockedBack: 12 },
    { minImpact: 230, maxImpact: 259, spacesKnockedBack: 14 },
    { minImpact: 260, maxImpact: 299, spacesKnockedBack: 16 },
    { minImpact: 300, maxImpact: 349, spacesKnockedBack: 18 },
    { minImpact: 350, maxImpact: 399, spacesKnockedBack: 20 },
    { minImpact: 400, maxImpact: 499, spacesKnockedBack: 25 },
    { minImpact: 500, maxImpact: 9999, spacesKnockedBack: 30 },
];

// ==================== WEAPON/EXPLOSION FORCES ====================

/**
 * Each weapon/explosion has specific force value
 * NOT tied to damage type - tied to actual weapon/power
 */
export interface ForceSource {
    id: string;
    name: string;
    force: number;
    description: string;
}

export const EXPLOSION_FORCES: Record<string, ForceSource> = {
    GRENADE_FRAG: { id: 'GRENADE_FRAG', name: 'Frag Grenade', force: 160, description: 'Standard military grenade' },
    GRENADE_CONCUSSION: { id: 'GRENADE_CONCUSSION', name: 'Concussion Grenade', force: 200, description: 'Higher knockback, less shrapnel' },
    GRENADE_FLASH: { id: 'GRENADE_FLASH', name: 'Flashbang', force: 80, description: 'Low force, stun effect' },
    ROCKET: { id: 'ROCKET', name: 'Rocket', force: 300, description: 'Anti-vehicle rocket' },
    MINE: { id: 'MINE', name: 'Land Mine', force: 180, description: 'Buried explosive' },
    C4: { id: 'C4', name: 'C4 Explosive', force: 250, description: 'Shaped charge' },
    CAR_BOMB: { id: 'CAR_BOMB', name: 'Car Bomb', force: 400, description: 'Vehicle-based IED' },
    MISSILE: { id: 'MISSILE', name: 'Missile', force: 500, description: 'Guided missile' },
    ARTILLERY: { id: 'ARTILLERY', name: 'Artillery Shell', force: 600, description: 'Heavy artillery' },
    NUKE_SMALL: { id: 'NUKE_SMALL', name: 'Tactical Nuke', force: 1000, description: 'Small nuclear device' },
};

export const MELEE_FORCES: Record<string, ForceSource> = {
    PUNCH: { id: 'PUNCH', name: 'Punch', force: 0, description: 'Force = attacker STR' },
    KICK: { id: 'KICK', name: 'Kick', force: 10, description: 'Force = attacker STR + 10' },
    CLUB: { id: 'CLUB', name: 'Club/Bat', force: 20, description: 'Force = attacker STR × 1.2 + 20' },
    SUPER_PUNCH: { id: 'SUPER_PUNCH', name: 'Super Punch', force: 50, description: 'Force = attacker STR × 2 + 50' },
};

export const PROJECTILE_FORCES: Record<string, ForceSource> = {
    THROW_OBJECT: { id: 'THROW_OBJECT', name: 'Thrown Object', force: 30, description: 'Force = 30 + STR/2' },
    BULLET_PISTOL: { id: 'BULLET_PISTOL', name: 'Pistol', force: 40, description: 'Low caliber' },
    BULLET_RIFLE: { id: 'BULLET_RIFLE', name: 'Rifle', force: 60, description: 'Standard rifle' },
    BUCKSHOT: { id: 'BUCKSHOT', name: 'Shotgun', force: 90, description: 'Close range spread' },
    SNIPER: { id: 'SNIPER', name: 'Sniper Rifle', force: 80, description: 'High velocity' },
    CANNON: { id: 'CANNON', name: 'Cannon', force: 200, description: 'Vehicle-mounted gun' },
};

// ==================== CALCULATION ====================

export interface KnockbackResult {
    spaces: number;
    impactForce: number;
    direction: { x: number; y: number };
    stopped: boolean;
    stoppedBy?: 'wall' | 'unit' | 'edge';
    chainKnockback?: KnockbackResult;  // If knocked into another unit
}

/**
 * Calculate knockback
 * 
 * Formula: Impact = Force - (Weight × 0.3)
 * 
 * Examples:
 * - Grenade (160) vs Human STR 15 (210 lbs): 160 - 63 = 97 impact = 5 spaces ✓
 * - Grenade (160) vs Hulk STR 36 (600 lbs): 160 - 180 = -20 impact = 0 spaces ✓
 * - Rocket (300) vs Hulk: 300 - 180 = 120 impact = 7 spaces ✓
 */
export function calculateKnockback(
    attackForce: number,
    defenderSTR: number,
    attackerSTR?: number  // For melee attacks
): KnockbackResult {
    // For melee, add attacker STR to force
    let totalForce = attackForce;
    if (attackerSTR) {
        totalForce += attackerSTR;
    }

    // Get defender weight from strength table
    const defenderWeight = getCharacterWeight(defenderSTR);

    // Calculate impact: Force vs Weight
    // Weight provides resistance (1 lb = 0.3 resistance units)
    const weightResistance = defenderWeight * 0.3;
    const impactForce = Math.max(0, totalForce - weightResistance);

    // Find knockback distance from table
    const tier = KNOCKBACK_TABLE.find(
        t => impactForce >= t.minImpact && impactForce <= t.maxImpact
    ) || KNOCKBACK_TABLE[KNOCKBACK_TABLE.length - 1];

    return {
        spaces: tier.spacesKnockedBack,
        impactForce,
        direction: { x: 0, y: 0 },  // Set by combat system
        stopped: false,
    };
}

/**
 * Get knockback direction (from attacker to defender)
 */
export function getKnockbackDirection(
    attackerPos: { x: number; y: number },
    defenderPos: { x: number; y: number }
): { x: number; y: number } {
    const dx = defenderPos.x - attackerPos.x;
    const dy = defenderPos.y - attackerPos.y;
    const magnitude = Math.sqrt(dx * dx + dy * dy);

    if (magnitude === 0) {
        return { x: 0, y: 1 };  // Default direction
    }

    return {
        x: dx / magnitude,
        y: dy / magnitude,
    };
}

/**
 * Apply knockback on map (simplified - no wall breaking yet)
 * 
 * @param startPos - Starting position
 * @param direction - Direction vector
 * @param spaces - Spaces to knock back
 * @param checkTile - Function to check tile (returns: walkable, hasUnit, unitId)
 * @returns Final position and collision info
 */
export function applyKnockback(
    startPos: { x: number; y: number },
    direction: { x: number; y: number },
    spaces: number,
    remainingForce: number,  // For chain knockbacks
    checkTile: (x: number, y: number) => {
        walkable: boolean;
        hasUnit: boolean;
        unitId?: string;
        unitSTR?: number;
    }
): {
    finalPos: { x: number; y: number };
    stopped: boolean;
    stoppedBy?: 'wall' | 'unit' | 'edge';
    chainKnockback?: {
        unitId: string;
        result: KnockbackResult;
    };
} {
    let currentPos = { ...startPos };

    for (let i = 0; i < spaces; i++) {
        const nextX = Math.round(currentPos.x + direction.x);
        const nextY = Math.round(currentPos.y + direction.y);

        const tile = checkTile(nextX, nextY);

        if (!tile.walkable) {
            // Hit wall - stop here
            return {
                finalPos: currentPos,
                stopped: true,
                stoppedBy: 'wall',
            };
        }

        if (tile.hasUnit && tile.unitId && tile.unitSTR !== undefined) {
            // Hit another unit - chain knockback!
            const spacesRemaining = spaces - i;
            const chainForce = remainingForce * 0.6;  // 60% of remaining force
            const chainResult = calculateKnockback(chainForce, tile.unitSTR);

            return {
                finalPos: currentPos,
                stopped: true,
                stoppedBy: 'unit',
                chainKnockback: {
                    unitId: tile.unitId,
                    result: chainResult,
                },
            };
        }

        // Move to next space
        currentPos = { x: nextX, y: nextY };
    }

    return {
        finalPos: currentPos,
        stopped: false,
    };
}

// ==================== HELPERS ====================

/**
 * Get force value for a weapon/explosion
 */
export function getForceValue(sourceId: string): number {
    return (
        EXPLOSION_FORCES[sourceId]?.force ||
        MELEE_FORCES[sourceId]?.force ||
        PROJECTILE_FORCES[sourceId]?.force ||
        0
    );
}

/**
 * Visualization
 */
export function getKnockbackVisualization(spaces: number): string {
    if (spaces === 0) return '';
    if (spaces <= 2) return '💨';
    if (spaces <= 5) return '💥';
    if (spaces <= 10) return '💢';
    if (spaces <= 20) return '☄️';
    return '🌪️';  // Massive knockback
}

/**
 * Combat log message
 */
export function getKnockbackLogMessage(
    defenderName: string,
    spaces: number,
    stoppedBy?: 'wall' | 'unit'
): string {
    if (spaces === 0) {
        return `${defenderName} stands firm! 🛡️`;
    }

    let message = `${defenderName} knocked back ${spaces} spaces! ${getKnockbackVisualization(spaces)}`;

    if (stoppedBy === 'wall') {
        message += ` 💢 Slammed into wall!`;
    } else if (stoppedBy === 'unit') {
        message += ` 💥 Collided with ally!`;
    }

    return message;
}
