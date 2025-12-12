/**
 * Drone System with Picture-in-Picture Camera
 * 
 * Phaser 3 supports multiple cameras!
 * We can create a mini-map drone camera view that shows what the drone sees
 */

// ==================== DRONE DATA (Modular - No Hardcoding) ====================

export interface DroneType {
    id: string;
    name: string;
    emoji: string;

    // Flight characteristics
    speedMPH: number;
    speedTilesPerTurn: number;
    maxAltitude: number;  // feet
    flightTimeTurns: number;  // How long before battery dies

    // Combat
    hp: number;
    armor: number;
    weaponMount?: string;  // null for recon

    // Sensors
    sightRadius: number;  // tiles
    thermalVision: boolean;
    nightVision: boolean;

    // Camera feed
    hasCameraFeed: boolean;
    cameraQuality: 'low' | 'medium' | 'high';

    // Deployment
    apCostToDeploy: number;
    controlRange: number;  // tiles from operator
}

// Drone database (modular - load from JSON or DB)
export const DRONE_TYPES: Record<string, DroneType> = {
    RECON_SMALL: {
        id: 'drone_recon_small',
        name: 'Recon Drone (Small)',
        emoji: '🚁',
        speedMPH: 30,
        speedTilesPerTurn: 6,
        maxAltitude: 500,
        flightTimeTurns: 10,
        hp: 20,
        armor: 0,
        weaponMount: undefined,
        sightRadius: 15,
        thermalVision: false,
        nightVision: true,
        hasCameraFeed: true,
        cameraQuality: 'medium',
        apCostToDeploy: 3,
        controlRange: 50,
    },

    RECON_MILITARY: {
        id: 'drone_recon_military',
        name: 'Recon Drone (Military)',
        emoji: '🛸',
        speedMPH: 60,
        speedTilesPerTurn: 12,
        maxAltitude: 2000,
        flightTimeTurns: 20,
        hp: 40,
        armor: 5,
        weaponMount: undefined,
        sightRadius: 25,
        thermalVision: true,
        nightVision: true,
        hasCameraFeed: true,
        cameraQuality: 'high',
        apCostToDeploy: 3,
        controlRange: 100,
    },

    COMBAT_LIGHT: {
        id: 'drone_combat_light',
        name: 'Combat Drone (Light)',
        emoji: '🎯',
        speedMPH: 50,
        speedTilesPerTurn: 10,
        maxAltitude: 1000,
        flightTimeTurns: 15,
        hp: 60,
        armor: 8,
        weaponMount: 'light_mg',
        sightRadius: 20,
        thermalVision: true,
        nightVision: true,
        hasCameraFeed: true,
        cameraQuality: 'high',
        apCostToDeploy: 3,
        controlRange: 60,
    },

    KAMIKAZE: {
        id: 'drone_kamikaze',
        name: 'Kamikaze Drone',
        emoji: '💥',
        speedMPH: 80,
        speedTilesPerTurn: 16,
        maxAltitude: 500,
        flightTimeTurns: 5,  // Short flight time
        hp: 10,
        armor: 0,
        weaponMount: 'explosive_payload',
        sightRadius: 10,
        thermalVision: false,
        nightVision: false,
        hasCameraFeed: true,
        cameraQuality: 'low',
        apCostToDeploy: 2,  // Quick deploy
        controlRange: 30,
    },
};

// ==================== PHASER 3 DRONE CAMERA SYSTEM ====================

export interface DroneCameraConfig {
    // Picture-in-Picture position
    x: number;  // Screen position (pixels from left)
    y: number;  // Screen position (pixels from top)
    width: number;  // Camera viewport width
    height: number;  // Camera viewport height

    // Camera settings
    zoom: number;  // 1.0 = normal, 2.0 = 2x zoom
    borderColor: number;  // Camera border color
    borderWidth: number;

    // Effects
    nightVisionEffect: boolean;
    thermalEffect: boolean;
    staticEffect: boolean;  // Signal interference
}

/**
 * Create a Picture-in-Picture camera for drone view
 * This is a Phaser 3 feature - multiple cameras on one scene!
 */
export function createDroneCamera(
    scene: Phaser.Scene,
    droneX: number,
    droneY: number,
    config: DroneCameraConfig
): Phaser.Cameras.Scene2D.Camera {

    // Create a new camera (Phaser supports multiple!)
    const droneCamera = scene.cameras.add(
        config.x,
        config.y,
        config.width,
        config.height
    );

    // Center camera on drone position
    droneCamera.centerOn(droneX, droneY);

    // Set zoom level
    droneCamera.setZoom(config.zoom);

    // Add border effect (HUD frame)
    droneCamera.setBackgroundColor(0x000000);

    // Optional: Add effects
    if (config.nightVisionEffect) {
        // Green tint for night vision
        droneCamera.setTint(0x00ff00);
        droneCamera.setAlpha(0.8);
    }

    if (config.thermalEffect) {
        // Red/orange tint for thermal
        droneCamera.setTint(0xff4400);
    }

    // Set depth so it appears on top
    droneCamera.setScroll(0, 0);  // Don't scroll with main camera

    return droneCamera;
}

/**
 * Update drone camera to follow drone position
 */
export function updateDroneCamera(
    camera: Phaser.Cameras.Scene2D.Camera,
    droneX: number,
    droneY: number,
    smooth: boolean = true
): void {
    if (smooth) {
        // Smooth follow
        camera.pan(droneX, droneY, 200, 'Linear');
    } else {
        // Instant snap
        camera.centerOn(droneX, droneY);
    }
}

/**
 * Remove drone camera when drone is destroyed/recalled
 */
export function removeDroneCamera(
    scene: Phaser.Scene,
    camera: Phaser.Cameras.Scene2D.Camera
): void {
    scene.cameras.remove(camera, true);
}

// ==================== DRONE CAMERA UI OVERLAY ====================

/**
 * Create HUD overlay for drone camera feed
 * Shows: Battery, altitude, signal strength, etc.
 */
export interface DroneCameraHUD {
    container: Phaser.GameObjects.Container;
    batteryText: Phaser.GameObjects.Text;
    altitudeText: Phaser.GameObjects.Text;
    signalText: Phaser.GameObjects.Text;
    crosshair: Phaser.GameObjects.Graphics;
}

export function createDroneCameraHUD(
    scene: Phaser.Scene,
    x: number,
    y: number,
    width: number,
    height: number
): DroneCameraHUD {
    const container = scene.add.container(x, y);
    container.setDepth(10000);  // Always on top

    // Frame border
    const border = scene.add.graphics();
    border.lineStyle(3, 0x00ff00, 1);
    border.strokeRect(0, 0, width, height);
    container.add(border);

    // "DRONE CAM" label
    const label = scene.add.text(5, 5, 'DRONE CAM', {
        fontSize: '12px',
        color: '#00ff00',
        fontFamily: 'monospace',
    });
    container.add(label);

    // Battery indicator
    const batteryText = scene.add.text(width - 80, 5, 'BAT: 100%', {
        fontSize: '10px',
        color: '#00ff00',
        fontFamily: 'monospace',
    });
    container.add(batteryText);

    // Altitude
    const altitudeText = scene.add.text(5, height - 20, 'ALT: 500ft', {
        fontSize: '10px',
        color: '#00ff00',
        fontFamily: 'monospace',
    });
    container.add(altitudeText);

    // Signal strength
    const signalText = scene.add.text(width - 80, height - 20, 'SIG: ████', {
        fontSize: '10px',
        color: '#00ff00',
        fontFamily: 'monospace',
    });
    container.add(signalText);

    // Crosshair in center
    const crosshair = scene.add.graphics();
    crosshair.lineStyle(2, 0x00ff00, 0.8);
    const centerX = width / 2;
    const centerY = height / 2;
    crosshair.strokeCircle(centerX, centerY, 10);
    crosshair.moveTo(centerX - 15, centerY);
    crosshair.lineTo(centerX + 15, centerY);
    crosshair.moveTo(centerX, centerY - 15);
    crosshair.lineTo(centerX, centerY + 15);
    crosshair.strokePath();
    container.add(crosshair);

    return {
        container,
        batteryText,
        altitudeText,
        signalText,
        crosshair,
    };
}

/**
 * Update HUD with drone status
 */
export function updateDroneCameraHUD(
    hud: DroneCameraHUD,
    battery: number,  // 0-100
    altitude: number,  // feet
    signalStrength: number,  // 0-100
    distance: number  // from operator
): void {
    // Battery
    hud.batteryText.setText(`BAT: ${battery}%`);
    if (battery < 20) {
        hud.batteryText.setColor('#ff0000');  // Red warning
    }

    // Altitude
    hud.altitudeText.setText(`ALT: ${altitude}ft`);

    // Signal strength bars
    const bars = Math.ceil((signalStrength / 100) * 4);
    const barString = '█'.repeat(bars) + '░'.repeat(4 - bars);
    hud.signalText.setText(`SIG: ${barString}`);

    if (signalStrength < 30) {
        hud.signalText.setColor('#ff0000');  // Red = losing signal
    }
}

// ==================== USAGE EXAMPLE ====================

/*
// In CombatScene.ts:

// 1. Deploy drone
const deployDrone = (operatorUnit: Unit, droneType: DroneType) => {
    // Spawn drone unit
    const drone = spawnDroneUnit(operatorUnit.position, droneType);
    
    // Create camera for drone
    const droneCamera = createDroneCamera(this, drone.x, drone.y, {
        x: this.cameras.main.width - 220,  // Top-right corner
        y: 10,
        width: 200,
        height: 150,
        zoom: 1.5,
        borderColor: 0x00ff00,
        borderWidth: 3,
        nightVisionEffect: droneType.nightVision,
        thermalEffect: droneType.thermalVision,
        staticEffect: false,
    });
    
    // Create HUD overlay
    const droneHUD = createDroneCameraHUD(this, 
        this.cameras.main.width - 220, 10, 200, 150
    );
    
    // Store references
    drone.camera = droneCamera;
    drone.hud = droneHUD;
};

// 2. Update each frame
update() {
    activeDrones.forEach(drone => {
        // Update camera position
        updateDroneCamera(drone.camera, drone.x, drone.y, true);
        
        // Update HUD
        const distance = Phaser.Math.Distance.Between(
            drone.x, drone.y, 
            drone.operator.x, drone.operator.y
        );
        
        updateDroneCameraHUD(drone.hud, 
            drone.battery,
            drone.altitude,
            calculateSignalStrength(distance, drone.type.controlRange),
            distance
        );
    });
}

// 3. Destroy when recalled/destroyed
const destroyDrone = (drone: DroneUnit) => {
    removeDroneCamera(this, drone.camera);
    drone.hud.container.destroy();
    drone.sprite.destroy();
};
*/
