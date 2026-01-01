/**
 * World Systems Initialization
 *
 * Central initialization for all world simulation systems.
 * Call initWorldSystems() from App.tsx to start everything.
 *
 * Systems initialized (in order):
 * 1. Time Engine (core clock)
 * 2. NPC System (character registry)
 * 3. Contact System (relationships)
 * 4. Mercenary Pool (recruitment)
 * 5. Life Events (NPC life changes)
 * 6. Death Consequences (funerals, morale)
 * 7. Fame System (public opinion)
 * 8. Heat System (government attention)
 * 9. Hunt Missions (faction retaliation)
 * 10. World Simulation (political events)
 * 11. Dynamic Economy (supply/demand)
 * 12. Price Fluctuation (market events)
 * 13. Economic News (price event news)
 * 14. NPC News Integration (life event news)
 *
 * Note: Faction system (factionSystem.ts) provides utility functions
 * that are called directly by other systems, no manager needed.
 */

import { getTimeEngine } from './timeEngine';
import { getNPCManager } from './npcSystem';
import { getContactManager } from './contactSystem';
import { getMercenaryPoolManager } from './mercenaryPool';
import { getLifeEventManager } from './npcLifeEvents';
import { getDeathConsequencesManager } from './deathConsequences';
import { getCharacterRegistryManager } from './worldSystems/characterRegistry';
// Note: factionSystem exports utility functions, not a manager
import { getFameManager } from './fameSystem';
import { getHeatManager } from './heatSystem';
import { getHuntMissionManager } from './factionHuntMissions';
import { getWorldSimulation } from './worldSimulation';
import { getDynamicEconomyManager } from './dynamicEconomy';
import { getPriceEventManager } from './priceFluctuation';
import { getEconomicNewsManager } from './economicNewsIntegration';
import { getNPCNewsIntegration } from './npcNewsIntegration';

// Track initialization state
let initialized = false;
let cleanupFunctions: (() => void)[] = [];

/**
 * Initialize all world systems
 * Call this once during app startup
 */
export function initWorldSystems(): void {
  if (initialized) {
    console.log('[WORLD SYSTEMS] Already initialized');
    return;
  }

  console.log('[WORLD SYSTEMS] Initializing all systems...');

  try {
    // 1. Time Engine - core clock (auto-starts)
    const timeEngine = getTimeEngine();
    console.log('[WORLD SYSTEMS] Time Engine ready');

    // 2. NPC System - character registry
    const npcManager = getNPCManager();
    npcManager.start();
    console.log('[WORLD SYSTEMS] NPC Manager started');

    // 2b. Character Registry - global character tracking
    const charRegistry = getCharacterRegistryManager();
    charRegistry.start();
    console.log('[WORLD SYSTEMS] Character Registry started');

    // 3. Contact System - relationships
    const contactManager = getContactManager();
    contactManager.start();
    console.log('[WORLD SYSTEMS] Contact Manager started');

    // 4. Mercenary Pool - recruitment
    const mercPool = getMercenaryPoolManager();
    mercPool.start();
    console.log('[WORLD SYSTEMS] Mercenary Pool started');

    // 5. Life Events - NPC life changes
    const lifeEvents = getLifeEventManager();
    lifeEvents.start();
    console.log('[WORLD SYSTEMS] Life Event Manager started');

    // 6. Death Consequences - funerals, morale
    const deathManager = getDeathConsequencesManager();
    deathManager.start();
    console.log('[WORLD SYSTEMS] Death Consequences Manager started');

    // 7. Fame System - public opinion
    const fameManager = getFameManager();
    fameManager.start();
    console.log('[WORLD SYSTEMS] Fame Manager started');

    // 8. Heat System - government attention
    const heatManager = getHeatManager();
    heatManager.start();
    console.log('[WORLD SYSTEMS] Heat Manager started');

    // 9. Hunt Missions - faction retaliation
    const huntManager = getHuntMissionManager();
    huntManager.start();
    console.log('[WORLD SYSTEMS] Hunt Mission Manager started');

    // 10. World Simulation - political events
    const worldSim = getWorldSimulation();
    worldSim.start();
    console.log('[WORLD SYSTEMS] World Simulation started');

    // 11. Dynamic Economy - supply/demand
    const economyManager = getDynamicEconomyManager();
    economyManager.start();
    console.log('[WORLD SYSTEMS] Dynamic Economy started');

    // 12. Price Fluctuation - market events
    const priceManager = getPriceEventManager();
    priceManager.start();
    console.log('[WORLD SYSTEMS] Price Event Manager started');

    // 13. Economic News - price event news
    const economicNews = getEconomicNewsManager();
    economicNews.start();
    console.log('[WORLD SYSTEMS] Economic News Manager started');

    // 14. NPC News Integration - life event news
    const npcNews = getNPCNewsIntegration();
    npcNews.start();
    console.log('[WORLD SYSTEMS] NPC News Integration started');

    initialized = true;
    console.log('[WORLD SYSTEMS] All systems initialized successfully');

  } catch (error) {
    console.error('[WORLD SYSTEMS] Failed to initialize:', error);
    throw error;
  }
}

/**
 * Cleanup all world systems
 * Call this during app shutdown
 */
export function cleanupWorldSystems(): void {
  if (!initialized) {
    return;
  }

  console.log('[WORLD SYSTEMS] Cleaning up...');

  // Run any cleanup functions
  cleanupFunctions.forEach(fn => {
    try {
      fn();
    } catch (error) {
      console.error('[WORLD SYSTEMS] Cleanup error:', error);
    }
  });

  cleanupFunctions = [];
  initialized = false;

  console.log('[WORLD SYSTEMS] Cleanup complete');
}

/**
 * Check if world systems are initialized
 */
export function areWorldSystemsInitialized(): boolean {
  return initialized;
}

/**
 * Get current time from the time engine
 * Convenience function for components
 */
export function getCurrentGameTime() {
  return getTimeEngine().getTime();
}

/**
 * Advance game time by ticks
 * Convenience function for components
 */
export function advanceGameTime(hours: number = 0.167) { // Default 10 minutes
  return getTimeEngine().advanceTime(hours);
}

/**
 * Start auto-tick for real-time progression
 */
export function startAutoTick(intervalMs: number = 1000): void {
  getTimeEngine().startAutoTick(intervalMs);
}

/**
 * Stop auto-tick
 */
export function stopAutoTick(): void {
  getTimeEngine().stopAutoTick();
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  initWorldSystems,
  cleanupWorldSystems,
  areWorldSystemsInitialized,
  getCurrentGameTime,
  advanceGameTime,
  startAutoTick,
  stopAutoTick,
};
