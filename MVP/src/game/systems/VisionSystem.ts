/**
 * Vision Cone & Line of Sight System
 * 
 * Features:
 * - Directional vision cones (left/right facing)
 * - Different cone widths (humans vs drones)
 * - Fog of war dimming (darker = can't see)
 * - Visual feedback when selecting units
 */

// ==================== VISION DATA (MODULAR) ====================

export interface VisionStats {
    // Base stats
    sightRange: number;  // tiles

    // Cone properties
    coneAngle: number;  // degrees (180 = half circle, 360 = full circle)
    coneDirection: 'left' | 'right' | 'up' | 'down' | 'omnidirectional';

    // Special vision
    nightVision: boolean;
    thermalVision: boolean;
    xRayVision: boolean;  // See through walls

    // Fog of war
    revealsFogPermanently: boolean;  // Explored areas stay revealed
    fogDimAmount: number;  // 0.0 - 1.0 (how dark is unseen area)
}

// Vision profiles by unit type (MODULAR - no hardcoding!)
export const VISION_PROFILES: Record<string, VisionStats> = {
    HUMAN_SOLDIER: {
        sightRange: 10,
        coneAngle: 120,  // 120° cone
        coneDirection: 'left',  // Changes based on facing
        nightVision: false,
        thermalVision: false,
        xRayVision: false,
        revealsFogPermanently: true,
        fogDimAmount: 0.7,  // Unseen areas 70% dark
    },

    HUMAN_SCOUT: {
        sightRange: 15,
        coneAngle: 150,  // Wider awareness
        coneDirection: 'left',
        nightVision: true,
        thermalVision: false,
        xRayVision: false,
        revealsFogPermanently: true,
        fogDimAmount: 0.6,
    },

    DRONE_RECON: {
        sightRange: 25,
        coneAngle: 270,  // Super wide cone
        coneDirection: 'omnidirectional',
        nightVision: true,
        thermalVision: true,
        xRayVision: false,
        revealsFogPermanently: false,  // Loses sight when moves
        fogDimAmount: 0.5,  // Less dim (better sensors)
    },

    DRONE_COMBAT: {
        sightRange: 20,
        coneAngle: 180,  // Forward-facing
        coneDirection: 'down',  // Looking down from above
        nightVision: true,
        thermalVision: true,
        xRayVision: false,
        revealsFogPermanently: false,
        fogDimAmount: 0.6,
    },

    SUPER_HUMAN: {
        sightRange: 20,
        coneAngle: 360,  // See everything around
        coneDirection: 'omnidirectional',
        nightVision: true,
        thermalVision: true,
        xRayVision: true,
        revealsFogPermanently: true,
        fogDimAmount: 0.3,  // Almost no fog
    },
};

// ==================== VISION CONE VISUALIZATION ====================

/**
 * Create vision cone graphics
 * Shows directional awareness based on unit facing
 */
export function createVisionCone(
    scene: Phaser.Scene,
    x: number,
    y: number,
    vision: VisionStats,
    facing: 'left' | 'right' | 'up' | 'down'
): Phaser.GameObjects.Graphics {
    const cone = scene.add.graphics();
    cone.setDepth(500);  // Above ground, below UI

    // Convert tiles to pixels
    const range = vision.sightRange * 64;  // Assuming 64px tiles

    // Calculate cone angle based on facing
    let startAngle = 0;
    let endAngle = 0;

    if (vision.coneAngle === 360) {
        // Full circle (omnidirectional)
        startAngle = 0;
        endAngle = Math.PI * 2;
    } else {
        // Directional cone
        const halfCone = (vision.coneAngle / 2) * (Math.PI / 180);

        switch (facing) {
            case 'right':
                startAngle = -halfCone;
                endAngle = halfCone;
                break;
            case 'left':
                startAngle = Math.PI - halfCone;
                endAngle = Math.PI + halfCone;
                break;
            case 'up':
                startAngle = -Math.PI / 2 - halfCone;
                endAngle = -Math.PI / 2 + halfCone;
                break;
            case 'down':
                startAngle = Math.PI / 2 - halfCone;
                endAngle = Math.PI / 2 + halfCone;
                break;
        }
    }

    // Draw cone
    cone.fillStyle(0x00ff00, 0.15);  // Semi-transparent green
    cone.lineStyle(2, 0x00ff00, 0.4);

    cone.beginPath();
    cone.moveTo(x, y);  // Start at unit position
    cone.arc(x, y, range, startAngle, endAngle, false);
    cone.lineTo(x, y);
    cone.closePath();
    cone.fillPath();
    cone.strokePath();

    return cone;
}

/**
 * Update cone when unit faces different direction
 */
export function updateVisionCone(
    cone: Phaser.GameObjects.Graphics,
    x: number,
    y: number,
    vision: VisionStats,
    newFacing: 'left' | 'right' | 'up' | 'down'
): void {
    cone.clear();

    // Redraw with new direction
    const range = vision.sightRange * 64;
    const halfCone = (vision.coneAngle / 2) * (Math.PI / 180);

    let startAngle = 0;
    let endAngle = 0;

    switch (newFacing) {
        case 'right':
            startAngle = -halfCone;
            endAngle = halfCone;
            break;
        case 'left':
            startAngle = Math.PI - halfCone;
            endAngle = Math.PI + halfCone;
            break;
        case 'up':
            startAngle = -Math.PI / 2 - halfCone;
            endAngle = -Math.PI / 2 + halfCone;
            break;
        case 'down':
            startAngle = Math.PI / 2 - halfCone;
            endAngle = Math.PI / 2 + halfCone;
            break;
    }

    cone.fillStyle(0x00ff00, 0.15);
    cone.lineStyle(2, 0x00ff00, 0.4);
    cone.beginPath();
    cone.moveTo(x, y);
    cone.arc(x, y, range, startAngle, endAngle, false);
    cone.lineTo(x, y);
    cone.closePath();
    cone.fillPath();
    cone.strokePath();
}

// ==================== FOG OF WAR DIMMING ====================

/**
 * Create fog of war overlay
 * Dims entire map, then reveals areas in vision cones
 */
export function createFogOfWar(
    scene: Phaser.Scene,
    width: number,
    height: number
): Phaser.GameObjects.Graphics {
    const fog = scene.add.graphics();
    fog.setDepth(600);  // Above vision cones

    // Fill entire map with dark fog
    fog.fillStyle(0x000000, 0.8);  // 80% dark
    fog.fillRect(0, 0, width, height);

    // Use blend mode to allow "cutting out" visible areas
    fog.setBlendMode(Phaser.BlendModes.MULTIPLY);

    return fog;
}

/**
 * Update fog of war based on vision cones
 * Clear fog in visible areas
 */
export function updateFogOfWar(
    fog: Phaser.GameObjects.Graphics,
    visibleAreas: Array<{
        x: number;
        y: number;
        vision: VisionStats;
        facing: 'left' | 'right' | 'up' | 'down';
    }>,
    mapWidth: number,
    mapHeight: number
): void {
    fog.clear();

    // Create render texture for fog
    const rt = fog.scene.make.renderTexture({
        width: mapWidth,
        height: mapHeight,
    }, false);

    // Fill with fog
    rt.fill(0x000000, 0.8);

    // Cut out visible areas
    visibleAreas.forEach(area => {
        const range = area.vision.sightRange * 64;
        const halfCone = (area.vision.coneAngle / 2) * (Math.PI / 180);

        let startAngle = 0;
        let endAngle = Math.PI * 2;

        if (area.vision.coneAngle !== 360) {
            switch (area.facing) {
                case 'right':
                    startAngle = -halfCone;
                    endAngle = halfCone;
                    break;
                case 'left':
                    startAngle = Math.PI - halfCone;
                    endAngle = Math.PI + halfCone;
                    break;
                case 'up':
                    startAngle = -Math.PI / 2 - halfCone;
                    endAngle = -Math.PI / 2 + halfCone;
                    break;
                case 'down':
                    startAngle = Math.PI / 2 - halfCone;
                    endAngle = Math.PI / 2 + halfCone;
                    break;
            }
        }

        // Erase fog in this area (reveal)
        const graphics = fog.scene.add.graphics();
        graphics.fillStyle(0xffffff, 1);
        graphics.beginPath();
        graphics.moveTo(area.x, area.y);
        graphics.arc(area.x, area.y, range, startAngle, endAngle, false);
        graphics.lineTo(area.x, area.y);
        graphics.closePath();
        graphics.fillPath();

        rt.erase(graphics, area.x - range, area.y - range);
        graphics.destroy();
    });

    // Draw result
    rt.draw(fog);
    rt.destroy();
}

// ==================== SELECTION FEEDBACK ====================

/**
 * Show vision cone when unit is selected
 * Pulse effect to draw attention
 */
export function showSelectionVisionCone(
    scene: Phaser.Scene,
    unit: { x: number; y: number; vision: VisionStats; facing: 'left' | 'right' }
): Phaser.GameObjects.Graphics {
    const cone = createVisionCone(scene, unit.x, unit.y, unit.vision, unit.facing);

    // Pulse animation
    scene.tweens.add({
        targets: cone,
        alpha: { from: 0.3, to: 0.1 },
        duration: 800,
        yoyo: true,
        repeat: -1,  // Infinite while selected
    });

    return cone;
}

/**
 * Hide vision cone when unit is deselected
 */
export function hideSelectionVisionCone(
    cone: Phaser.GameObjects.Graphics
): void {
    cone.destroy();
}

// ==================== USAGE EXAMPLE ====================

/*
// In CombatScene.ts:

// 1. Setup fog of war system
create() {
    this.fogOfWar = createFogOfWar(this, mapWidth, mapHeight);
}

// 2. When unit is selected
onUnitSelected(unit: Unit) {
    // Show their vision cone
    unit.visionCone = showSelectionVisionCone(this, {
        x: unit.sprite.x,
        y: unit.sprite.y,
        vision: VISION_PROFILES[unit.type],  // e.g., 'HUMAN_SOLDIER'
        facing: unit.facing,  // 'left' or 'right'
    });
}

// 3. When unit is deselected
onUnitDeselected(unit: Unit) {
    hideSelectionVisionCone(unit.visionCone);
}

// 4. Update fog every frame
update() {
    const visibleAreas = this.units.map(unit => ({
        x: unit.sprite.x,
        y: unit.sprite.y,
        vision: VISION_PROFILES[unit.type],
        facing: unit.facing,
    }));
    
    updateFogOfWar(this.fogOfWar, visibleAreas, mapWidth, mapHeight);
}

// 5. When unit changes facing (moves, attacks)
unit.facing = newDirection;
if (unit.visionCone) {
    updateVisionCone(
        unit.visionCone,
        unit.sprite.x,
        unit.sprite.y,
        VISION_PROFILES[unit.type],
        newDirection
    );
}
*/
