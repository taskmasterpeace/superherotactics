/**
 * Gadget UI Handler for CombatScene
 *
 * Handles gadget-related UI events and effects.
 * Import this into CombatScene to enable gadget support.
 *
 * Usage in CombatScene:
 *   import { GadgetUIHandler } from './GadgetUIHandler';
 *   this.gadgetHandler = new GadgetUIHandler(this);
 *   this.gadgetHandler.setupEventListeners();
 */

import { EventBridge, Position } from '../EventBridge';
import {
  CombatGadget,
  GadgetResult,
  DroneConfig,
  DRONE_CONFIGS,
} from '../../combat/gadgetTypes';
import {
  resolveGadgetUse,
  consumeGadgetUse,
  createDroneUnit,
} from '../../combat/gadgetResolver';
import {
  getCombatGadget,
} from '../../combat/gadgetCombat';
import {
  processDroneTurn,
} from '../../combat/droneAI';
import { SimUnit } from '../../combat/types';

// ============ TYPES ============

interface Unit {
  id: string;
  name: string;
  team: 'blue' | 'red';
  position: Position;
  hp: number;
  maxHp: number;
  ap: number;
  dr: number;
  stats?: any;
  isDrone?: boolean;
  droneOwnerId?: string;
  droneTurnsRemaining?: number;
  droneConfig?: DroneConfig;
}

interface CombatSceneInterface {
  selectedUnitId: string | null;
  currentTeam: 'blue' | 'red';
  playerTeam: 'blue' | 'red';
  units: Map<string, Unit>;
  animating: boolean;
  offsetX: number;
  offsetY: number;

  // Methods we need
  emitAllUnitsData(): void;
  setActionMode(mode: string): void;
  getUnitData(unit: Unit): any;
  add: Phaser.GameObjects.GameObjectFactory;
  tweens: Phaser.Tweens.TweenManager;
}

// ============ GADGET UI HANDLER ============

export class GadgetUIHandler {
  private scene: CombatSceneInterface;
  private pendingGadget: { id: string; name: string; behavior: string } | null = null;
  private activeDrones: Map<string, Unit> = new Map();

  constructor(scene: CombatSceneInterface) {
    this.scene = scene;
  }

  /**
   * Setup EventBridge listeners for gadget events.
   * Call this in CombatScene's create() method.
   */
  setupEventListeners(): void {
    // Start gadget use mode (targeting)
    EventBridge.on('start-gadget-use', (data: {
      gadgetId: string;
      gadgetName: string;
      behavior: string;
    }) => {
      console.log('[GADGET] Received start-gadget-use:', data);
      this.handleStartGadgetUse(data);
    });

    // Execute gadget at position (for targeted gadgets)
    EventBridge.on('execute-gadget', (data: {
      gadgetId: string;
      targetX?: number;
      targetY?: number;
      targetUnitId?: string;
    }) => {
      console.log('[GADGET] Received execute-gadget:', data);
      this.handleExecuteGadget(data);
    });

    // Quick use gadget (no targeting, like healing self)
    EventBridge.on('quick-use-gadget', (data: {
      gadgetId: string;
      targetUnitId?: string;
    }) => {
      console.log('[GADGET] Received quick-use-gadget:', data);
      this.handleQuickUseGadget(data);
    });
  }

  /**
   * Handle start of gadget use (enter targeting mode).
   */
  private handleStartGadgetUse(data: {
    gadgetId: string;
    gadgetName: string;
    behavior: string;
  }): void {
    const unit = this.scene.selectedUnitId
      ? this.scene.units.get(this.scene.selectedUnitId)
      : null;

    if (!unit) {
      this.logMessage('system', 'System', '❌ No unit selected!');
      return;
    }

    if (unit.team !== this.scene.currentTeam) {
      this.logMessage('system', 'System', `❌ Cannot use gadget - not your turn!`);
      return;
    }

    const gadget = getCombatGadget(data.gadgetId);
    if (!gadget) {
      this.logMessage('system', 'System', `❌ Unknown gadget: ${data.gadgetId}`);
      return;
    }

    if (unit.ap < gadget.apCost) {
      this.logMessage('system', 'System', `❌ Not enough AP! (Need ${gadget.apCost})`);
      return;
    }

    // Check if gadget needs targeting
    const needsTarget = ['explosive', 'spawn_unit', 'reveal'].includes(data.behavior);

    if (needsTarget) {
      // Enter targeting mode
      this.pendingGadget = {
        id: data.gadgetId,
        name: data.gadgetName,
        behavior: data.behavior,
      };
      this.scene.setActionMode('gadget');

      this.logMessage('system', unit.name, `🔧 ${unit.name} prepares ${data.gadgetName}! Click target...`);

      // Emit event for UI to show targeting
      EventBridge.emit('gadget-targeting-started', {
        gadgetId: data.gadgetId,
        gadgetName: data.gadgetName,
        behavior: data.behavior,
        range: gadget.effect.radius || 5,
      });
    } else {
      // Immediate use (heal, buff, etc.)
      this.executeGadget(unit, data.gadgetId, undefined, undefined);
    }
  }

  /**
   * Handle gadget execution at target position.
   */
  private handleExecuteGadget(data: {
    gadgetId: string;
    targetX?: number;
    targetY?: number;
    targetUnitId?: string;
  }): void {
    const unit = this.scene.selectedUnitId
      ? this.scene.units.get(this.scene.selectedUnitId)
      : null;

    if (!unit) return;

    const targetPos = data.targetX !== undefined && data.targetY !== undefined
      ? { x: data.targetX, y: data.targetY }
      : undefined;

    this.executeGadget(unit, data.gadgetId, targetPos, data.targetUnitId);
    this.pendingGadget = null;
    this.scene.setActionMode('idle');
  }

  /**
   * Handle quick gadget use (no targeting needed).
   */
  private handleQuickUseGadget(data: {
    gadgetId: string;
    targetUnitId?: string;
  }): void {
    const unit = this.scene.selectedUnitId
      ? this.scene.units.get(this.scene.selectedUnitId)
      : null;

    if (!unit) return;

    this.executeGadget(unit, data.gadgetId, undefined, data.targetUnitId);
  }

  /**
   * Execute a gadget effect.
   */
  private executeGadget(
    user: Unit,
    gadgetId: string,
    targetPos?: Position,
    targetUnitId?: string
  ): void {
    const gadget = getCombatGadget(gadgetId);
    if (!gadget) {
      this.logMessage('system', 'System', `❌ Unknown gadget: ${gadgetId}`);
      return;
    }

    // Check AP
    if (user.ap < gadget.apCost) {
      this.logMessage('system', 'System', `❌ Not enough AP!`);
      return;
    }

    // Convert scene units to SimUnits for resolver
    const allUnits = this.getSimUnits();

    // Resolve gadget
    const result = resolveGadgetUse(
      { ...gadget, currentUses: gadget.uses, currentCooldown: 0 },
      this.convertToSimUnit(user),
      allUnits,
      [],
      targetPos || user.position,
      targetUnitId
    );

    // Spend AP
    user.ap -= gadget.apCost;

    if (result.success) {
      // Log result
      this.logMessage('gadget', user.name, `🔧 ${result.message}`, user.team);

      // Handle spawned drones
      if (result.spawnedUnits && result.spawnedUnits.length > 0) {
        for (const drone of result.spawnedUnits) {
          this.spawnDroneSprite(drone, targetPos || user.position);
        }
      }

      // Handle healing
      if (result.healingDone && result.healingDone > 0) {
        this.showHealEffect(targetPos || user.position, result.healingDone);
        // Update healed unit's HP in scene
        for (const unitId of result.affectedUnits) {
          const targetUnit = this.scene.units.get(unitId);
          if (targetUnit) {
            const simUnit = allUnits.find(u => u.id === unitId);
            if (simUnit) {
              targetUnit.hp = simUnit.hp;
            }
          }
        }
      }

      // Handle reveal
      if (result.revealedTiles && result.revealedTiles.length > 0) {
        this.showRevealEffect(targetPos || user.position, gadget.effect.radius || 5);
        EventBridge.emit('tiles-revealed', {
          tiles: result.revealedTiles,
          duration: gadget.effect.duration || 3,
        });
      }

      // Handle explosive
      if (result.damageDealt && result.damageDealt > 0) {
        this.showExplosionEffect(targetPos || user.position);
        // Update damaged units
        for (const unitId of result.affectedUnits) {
          const targetUnit = this.scene.units.get(unitId);
          if (targetUnit) {
            const simUnit = allUnits.find(u => u.id === unitId);
            if (simUnit) {
              targetUnit.hp = simUnit.hp;
            }
          }
        }
      }

      // Handle extraction
      if (result.extracting) {
        EventBridge.emit('extraction-called', {
          teamId: user.team,
          unitIds: result.affectedUnits,
        });
      }

      // Consume gadget
      EventBridge.emit('consume-gadget', {
        unitId: user.id,
        gadgetId: gadgetId,
      });
    } else {
      this.logMessage('system', 'System', `❌ ${result.message}`);
    }

    this.scene.emitAllUnitsData();
  }

  /**
   * Spawn a drone sprite in the scene.
   */
  private spawnDroneSprite(drone: SimUnit, position: Position): void {
    // Emit event for scene to create the drone unit
    EventBridge.emit('spawn-drone-unit', {
      id: drone.id,
      name: drone.name,
      team: drone.team,
      position,
      hp: drone.hp,
      maxHp: drone.maxHp,
      weapon: drone.weapon,
      isDrone: true,
      droneOwnerId: drone.droneOwnerId,
      droneTurnsRemaining: drone.droneTurnsRemaining,
      droneConfig: drone.droneConfig,
    });

    this.logMessage('system', drone.name, `🤖 ${drone.name} deployed!`, drone.team);
  }

  /**
   * Process drone turns at end of round.
   */
  processDroneTurns(): void {
    for (const [id, drone] of this.activeDrones) {
      if (drone.hp <= 0) {
        this.activeDrones.delete(id);
        continue;
      }

      // Tick duration
      if (drone.droneTurnsRemaining !== undefined) {
        drone.droneTurnsRemaining--;
        if (drone.droneTurnsRemaining <= 0) {
          drone.hp = 0;
          this.logMessage('system', drone.name, `🔋 ${drone.name} battery depleted!`);
          EventBridge.emit('drone-expired', { droneId: drone.id });
          this.activeDrones.delete(id);
          continue;
        }
      }

      // Process drone AI
      const allUnits = this.getSimUnits();
      const simDrone = this.convertToSimUnit(drone);
      const action = processDroneTurn(simDrone, allUnits);

      // Update drone position if moved
      if (action.targetPosition) {
        drone.position = action.targetPosition;
      }

      // Log drone action
      if (action.type === 'attack') {
        this.logMessage('combat', drone.name, `🎯 ${drone.name} attacks!`, drone.team);
      } else if (action.type === 'heal') {
        const healResult = action.result as any;
        if (healResult?.healAmount) {
          this.logMessage('heal', drone.name, `💚 ${drone.name} heals ${healResult.healAmount} HP`, drone.team);
        }
      }
    }
  }

  /**
   * Show heal effect at position.
   */
  private showHealEffect(pos: Position, amount: number): void {
    EventBridge.emit('show-effect', {
      type: 'heal',
      position: pos,
      value: amount,
    });
  }

  /**
   * Show reveal effect at position.
   */
  private showRevealEffect(pos: Position, radius: number): void {
    EventBridge.emit('show-effect', {
      type: 'reveal',
      position: pos,
      radius,
    });
  }

  /**
   * Show explosion effect at position.
   */
  private showExplosionEffect(pos: Position): void {
    EventBridge.emit('show-effect', {
      type: 'explosion',
      position: pos,
    });
  }

  /**
   * Get the pending gadget (for click handling in scene).
   */
  getPendingGadget(): { id: string; name: string; behavior: string } | null {
    return this.pendingGadget;
  }

  /**
   * Cancel pending gadget use.
   */
  cancelPendingGadget(): void {
    this.pendingGadget = null;
    EventBridge.emit('gadget-targeting-cancelled', {});
  }

  /**
   * Convert scene units to SimUnits.
   */
  private getSimUnits(): SimUnit[] {
    const units: SimUnit[] = [];
    for (const [_id, unit] of this.scene.units) {
      units.push(this.convertToSimUnit(unit));
    }
    return units;
  }

  /**
   * Convert a scene Unit to SimUnit.
   */
  private convertToSimUnit(unit: Unit): SimUnit {
    return {
      id: unit.id,
      name: unit.name,
      team: unit.team,
      hp: unit.hp,
      maxHp: unit.maxHp,
      shieldHp: 0,
      maxShieldHp: 0,
      dr: unit.dr || 0,
      stoppingPower: 0,
      origin: 'Human' as any,
      stats: unit.stats || { MEL: 15, RNG: 15, AGL: 15, CON: 15, INS: 15, WIL: 15, INT: 15 },
      stance: 'standing' as any,
      cover: 'none' as any,
      statusEffects: [],
      accuracyPenalty: 0,
      weapon: {
        id: 'default',
        name: 'Default',
        damage: { min: 10, max: 15 },
        range: 10,
        accuracy: 70,
        apCost: 3,
        ammo: 30,
        maxAmmo: 30,
        penetration: 0,
        fireModes: ['single'],
        currentFireMode: 'single',
      },
      disarmed: false,
      alive: unit.hp > 0,
      acted: false,
      position: unit.position,
      isDrone: unit.isDrone,
      droneOwnerId: unit.droneOwnerId,
      droneTurnsRemaining: unit.droneTurnsRemaining,
      droneConfig: unit.droneConfig,
    };
  }

  /**
   * Log a message to the combat log.
   */
  private logMessage(type: string, actor: string, message: string, team?: 'blue' | 'red'): void {
    EventBridge.emit('log-entry', {
      id: `gadget_${Date.now()}`,
      timestamp: Date.now(),
      type,
      actor,
      actorTeam: team,
      message,
    });
  }
}

// ============ EXPORT EVENTS FOR UI ============

/**
 * Events emitted by gadget system:
 *
 * 'gadget-targeting-started' - Gadget use started, show targeting UI
 *   { gadgetId, gadgetName, behavior, range }
 *
 * 'gadget-targeting-cancelled' - Targeting cancelled
 *   {}
 *
 * 'spawn-drone-unit' - Spawn a new drone unit
 *   { id, name, team, position, hp, maxHp, ... }
 *
 * 'consume-gadget' - Gadget was used, update inventory
 *   { unitId, gadgetId }
 *
 * 'tiles-revealed' - Tiles revealed by sensor
 *   { tiles: Position[], duration }
 *
 * 'extraction-called' - Extraction vehicle called
 *   { teamId, unitIds }
 *
 * 'drone-expired' - Drone battery died
 *   { droneId }
 *
 * 'show-effect' - Show visual effect
 *   { type: 'heal'|'reveal'|'explosion', position, value?, radius? }
 */
