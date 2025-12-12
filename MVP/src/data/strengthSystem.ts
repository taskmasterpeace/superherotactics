/**
 * Strength System - Complete strength progression and weight-based physics
 * 
 * Strength determines:
 * - Lifting capacity
 * - Weight (for knockback resistance)
 * - Melee damage bonus
 * - Ability to break/move objects
 */

// ==================== STRENGTH RANKS ====================

export interface StrengthRank {
    statValue: number;      // The actual STR stat
    rankRange: string;      // Visual grouping (1-2, 3-5, etc.)
    rank: number;           // Descriptive rank
    maxLiftLbs: number;     // Maximum weight can lift
    weightLbs: number;      // Character's body weight (for knockback)
    category: 'Normal' | 'Peak' | 'Enhanced' | 'Superhuman' | 'Cosmic';
    examples?: string;      // Notable characters at this level
}

/**
 * Complete strength progression table
 * Based on user's design with weight scaling
 */
export const STRENGTH_TABLE: StrengthRank[] = [
    // NORMAL HUMAN (1-19)
    { statValue: 1, rankRange: '1-2', rank: 2, maxLiftLbs: 50, weightLbs: 100, category: 'Normal' },
    { statValue: 2, rankRange: '1-2', rank: 3, maxLiftLbs: 60, weightLbs: 110, category: 'Normal' },
    { statValue: 3, rankRange: '3-5', rank: 4, maxLiftLbs: 80, weightLbs: 120, category: 'Normal' },
    { statValue: 4, rankRange: '3-5', rank: 5, maxLiftLbs: 100, weightLbs: 130, category: 'Normal' },
    { statValue: 5, rankRange: '3-5', rank: 4, maxLiftLbs: 115, weightLbs: 140, category: 'Normal' },
    { statValue: 6, rankRange: '3-5', rank: 5, maxLiftLbs: 120, weightLbs: 128, category: 'Normal', examples: 'Bruce Banner' },
    { statValue: 7, rankRange: '6-9', rank: 6, maxLiftLbs: 140, weightLbs: 140, category: 'Normal' },
    { statValue: 8, rankRange: '6-9', rank: 7, maxLiftLbs: 160, weightLbs: 150, category: 'Normal' },
    { statValue: 9, rankRange: '6-9', rank: 8, maxLiftLbs: 180, weightLbs: 160, category: 'Normal' },
    { statValue: 10, rankRange: '6-9', rank: 9, maxLiftLbs: 200, weightLbs: 170, category: 'Normal' },
    { statValue: 11, rankRange: '10-19', rank: 10, maxLiftLbs: 220, weightLbs: 180, category: 'Normal' },
    { statValue: 12, rankRange: '10-19', rank: 11, maxLiftLbs: 240, weightLbs: 190, category: 'Normal' },
    { statValue: 13, rankRange: '10-19', rank: 12, maxLiftLbs: 250, weightLbs: 195, category: 'Normal' },
    { statValue: 14, rankRange: '10-19', rank: 13, maxLiftLbs: 260, weightLbs: 200, category: 'Normal' },
    { statValue: 15, rankRange: '10-19', rank: 14, maxLiftLbs: 300, weightLbs: 210, category: 'Normal' },
    { statValue: 16, rankRange: '10-19', rank: 15, maxLiftLbs: 320, weightLbs: 220, category: 'Normal' },
    { statValue: 17, rankRange: '10-19', rank: 16, maxLiftLbs: 340, weightLbs: 230, category: 'Normal' },
    { statValue: 18, rankRange: '10-19', rank: 17, maxLiftLbs: 360, weightLbs: 240, category: 'Normal' },
    { statValue: 19, rankRange: '10-19', rank: 19, maxLiftLbs: 400, weightLbs: 250, category: 'Peak', examples: '20yr old max' },

    // PEAK HUMAN / ENHANCED (20-29)
    { statValue: 20, rankRange: '20-29', rank: 20, maxLiftLbs: 425, weightLbs: 260, category: 'Peak' },
    { statValue: 21, rankRange: '20-29', rank: 21, maxLiftLbs: 450, weightLbs: 270, category: 'Peak' },
    { statValue: 22, rankRange: '20-29', rank: 22, maxLiftLbs: 475, weightLbs: 280, category: 'Peak' },
    { statValue: 23, rankRange: '20-29', rank: 23, maxLiftLbs: 550, weightLbs: 290, category: 'Enhanced' },
    { statValue: 24, rankRange: '20-29', rank: 24, maxLiftLbs: 560, weightLbs: 300, category: 'Enhanced' },
    { statValue: 25, rankRange: '20-29', rank: 25, maxLiftLbs: 580, weightLbs: 320, category: 'Enhanced' },
    { statValue: 26, rankRange: '20-29', rank: 26, maxLiftLbs: 600, weightLbs: 340, category: 'Enhanced' },
    { statValue: 27, rankRange: '20-29', rank: 27, maxLiftLbs: 650, weightLbs: 360, category: 'Enhanced' },
    { statValue: 28, rankRange: '20-29', rank: 28, maxLiftLbs: 700, weightLbs: 380, category: 'Enhanced' },
    { statValue: 29, rankRange: '20-29', rank: 29, maxLiftLbs: 800, weightLbs: 400, category: 'Enhanced' },

    // SUPERHUMAN (30-39)
    { statValue: 30, rankRange: '30-39', rank: 30, maxLiftLbs: 900, weightLbs: 420, category: 'Superhuman', examples: 'Gray Hulk' },
    { statValue: 31, rankRange: '30-39', rank: 31, maxLiftLbs: 1000, weightLbs: 450, category: 'Superhuman' },
    { statValue: 32, rankRange: '30-39', rank: 32, maxLiftLbs: 1100, weightLbs: 480, category: 'Superhuman' },
    { statValue: 34, rankRange: '30-39', rank: 34, maxLiftLbs: 1200, weightLbs: 520, category: 'Superhuman' },
    { statValue: 35, rankRange: '30-39', rank: 35, maxLiftLbs: 1300, weightLbs: 560, category: 'Superhuman' },
    { statValue: 36, rankRange: '30-39', rank: 36, maxLiftLbs: 1400, weightLbs: 600, category: 'Superhuman', examples: 'Savage Hulk' },
    { statValue: 37, rankRange: '30-39', rank: 37, maxLiftLbs: 1500, weightLbs: 650, category: 'Superhuman' },
    { statValue: 38, rankRange: '30-39', rank: 38, maxLiftLbs: 1800, weightLbs: 700, category: 'Superhuman' },
    { statValue: 39, rankRange: '30-39', rank: 39, maxLiftLbs: 2200, weightLbs: 800, category: 'Superhuman' },

    // COSMIC (40+) - Extrapolated
    { statValue: 40, rankRange: '40-49', rank: 40, maxLiftLbs: 2500, weightLbs: 900, category: 'Cosmic' },
    { statValue: 45, rankRange: '40-49', rank: 45, maxLiftLbs: 3500, weightLbs: 1100, category: 'Cosmic' },
    { statValue: 50, rankRange: '50-59', rank: 50, maxLiftLbs: 5000, weightLbs: 1500, category: 'Cosmic' },
    { statValue: 60, rankRange: '60-69', rank: 60, maxLiftLbs: 10000, weightLbs: 2000, category: 'Cosmic' },
    { statValue: 70, rankRange: '70-79', rank: 70, maxLiftLbs: 20000, weightLbs: 3000, category: 'Cosmic' },
    { statValue: 80, rankRange: '80-89', rank: 80, maxLiftLbs: 50000, weightLbs: 5000, category: 'Cosmic' },
    { statValue: 90, rankRange: '90-99', rank: 90, maxLiftLbs: 100000, weightLbs: 8000, category: 'Cosmic' },
    { statValue: 100, rankRange: '100+', rank: 100, maxLiftLbs: 1000000, weightLbs: 10000, category: 'Cosmic' },
];

/**
 * Get strength rank data for a given STR value
 */
export function getStrengthRank(str: number): StrengthRank {
    // Find exact match or closest lower value
    const rank = STRENGTH_TABLE.find(r => r.statValue === str)
        || STRENGTH_TABLE.filter(r => r.statValue <= str).pop()
        || STRENGTH_TABLE[0];

    return rank;
}

/**
 * Get character weight based on STR (determines knockback resistance)
 */
export function getCharacterWeight(str: number): number {
    return getStrengthRank(str).weightLbs;
}

/**
 * Get lifting capacity
 */
export function getLiftingCapacity(str: number): number {
    return getStrengthRank(str).maxLiftLbs;
}

/**
 * Calculate melee damage bonus from strength
 */
export function getStrengthDamageBonus(str: number): number {
    if (str < 10) return 0;
    if (str < 20) return Math.floor((str - 10) / 2);  // +0 to +5
    if (str < 30) return 5 + Math.floor((str - 20) / 2);  // +5 to +10
    if (str < 40) return 10 + Math.floor((str - 30) / 1);  // +10 to +20
    return 20 + Math.floor((str - 40) / 2);  // +20+
}

// ==================== MATERIAL STRENGTH ====================

export interface MaterialStrength {
    name: string;
    hpPerInch: number;  // HP of material per inch thickness
    breakStrength: number;  // Minimum STR to break 1 inch
    emoji: string;
}

export const MATERIALS: Record<string, MaterialStrength> = {
    WOOD_SOFT: { name: 'Soft Wood', hpPerInch: 5, breakStrength: 15, emoji: '🪵' },
    WOOD_HARD: { name: 'Hard Wood', hpPerInch: 10, breakStrength: 20, emoji: '🌳' },
    DRYWALL: { name: 'Drywall', hpPerInch: 3, breakStrength: 10, emoji: '🧱' },
    BRICK: { name: 'Brick', hpPerInch: 20, breakStrength: 25, emoji: '🧱' },
    CONCRETE: { name: 'Concrete', hpPerInch: 30, breakStrength: 35, emoji: '🏗️' },
    STEEL: { name: 'Steel', hpPerInch: 50, breakStrength: 50, emoji: '⚙️' },
    REINFORCED_CONCRETE: { name: 'Reinforced Concrete', hpPerInch: 60, breakStrength: 60, emoji: '🏢' },
    TITANIUM: { name: 'Titanium', hpPerInch: 80, breakStrength: 70, emoji: '💎' },
    VIBRANIUM: { name: 'Vibranium', hpPerInch: 200, breakStrength: 100, emoji: '🛡️' },
};

/**
 * Check if character can break material
 */
export function canBreakMaterial(str: number, material: MaterialStrength, thickness: number = 1): boolean {
    const requiredStr = material.breakStrength * thickness;
    return str >= requiredStr;
}

/**
 * Calculate damage to material from impact
 */
export function calculateMaterialDamage(impactForce: number, material: MaterialStrength): number {
    // Damage = impactForce - material.breakStrength
    return Math.max(0, impactForce - material.breakStrength);
}
