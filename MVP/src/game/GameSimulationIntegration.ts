/**
 * GameSimulation Integration with Zustand Store
 *
 * This module connects the GameSimulation class to the React/Zustand state.
 * It registers event handlers that update the store when simulation events fire.
 */

import {
  GameSimulation,
  getGameSimulation,
  GameEvent,
  GameTime,
  FAMILIARITY_CONFIG,
  calculateFamiliarityDecay,
  updateCityFamiliarity,
} from './GameSimulation';
import { useGameStore } from '../stores/enhancedGameStore';
import { GameCharacter, CharacterStatus } from '../types';

// =============================================================================
// INTEGRATION STATE
// =============================================================================

let _isIntegrated = false;

// =============================================================================
// EVENT HANDLERS
// =============================================================================

/**
 * Handle status updates for all characters
 */
function handleStatusUpdate(event: GameEvent, sim: GameSimulation): void {
  const store = useGameStore.getState();
  const currentTime = sim.time.totalMinutes;

  // Process each character's status
  const updatedCharacters = store.characters.map((char: any) => {
    // Skip if dead
    if (char.status === 'dead') return char;

    // Check if status duration has expired
    if (char.statusDuration && char.statusStartTime) {
      const elapsed = currentTime - char.statusStartTime;
      if (elapsed >= char.statusDuration) {
        // Status expired - return to ready
        return {
          ...char,
          status: 'ready' as CharacterStatus,
          statusStartTime: undefined,
          statusDuration: undefined,
          statusData: undefined,
        };
      }
    }

    // Process status-specific effects
    switch (char.status) {
      case 'patrol':
        // Gain fame while patrolling (1 per hour)
        return {
          ...char,
          fame: Math.min(5000, (char.fame || 0) + 1),
        };

      case 'training':
        // Training progress - handled separately
        break;

      case 'investigation':
        // Investigation progress - handled separately
        break;
    }

    return char;
  });

  // Update store if any changes
  if (JSON.stringify(updatedCharacters) !== JSON.stringify(store.characters)) {
    useGameStore.setState({ characters: updatedCharacters });
  }
}

/**
 * Handle city familiarity decay (daily)
 */
function handleFamiliarityDecay(event: GameEvent, sim: GameSimulation): void {
  const store = useGameStore.getState();
  const currentTime = sim.time.totalMinutes;

  // Process each character's city familiarity
  const updatedCharacters = store.characters.map((char: any) => {
    if (!char.cityFamiliarities || char.cityFamiliarities.length === 0) {
      return char;
    }

    const birthCityId = char.birthCity;
    const decayedFamiliarities = calculateFamiliarityDecay(
      char.cityFamiliarities,
      currentTime,
      birthCityId
    );

    return {
      ...char,
      cityFamiliarities: decayedFamiliarities,
    };
  });

  useGameStore.setState({ characters: updatedCharacters });
}

/**
 * Handle travel updates
 */
function handleTravelUpdate(event: GameEvent, sim: GameSimulation): void {
  // Travel is already handled by the store's updateTravelProgress
  // This is a hook for additional travel-related processing
  const store = useGameStore.getState();

  // Update travel progress
  store.updateTravelProgress();
}

/**
 * Handle hospital recovery (daily)
 */
function handleHospitalRecovery(event: GameEvent, sim: GameSimulation): void {
  const store = useGameStore.getState();

  const updatedCharacters = store.characters.map((char: any) => {
    if (char.status !== 'hospital') return char;

    // Decrease recovery time
    const newRecoveryTime = Math.max(0, (char.recoveryTime || 0) - 1);

    if (newRecoveryTime === 0) {
      // Recovery complete
      return {
        ...char,
        status: 'ready' as CharacterStatus,
        recoveryTime: 0,
        health: {
          ...char.health,
          current: char.health.maximum, // Full health on recovery
        },
      };
    }

    return {
      ...char,
      recoveryTime: newRecoveryTime,
    };
  });

  useGameStore.setState({ characters: updatedCharacters });
}

/**
 * Handle investigation progress (hourly)
 */
function handleInvestigationProgress(event: GameEvent, sim: GameSimulation): void {
  const store = useGameStore.getState();

  // Find characters on investigation
  const investigators = store.characters.filter((c: any) =>
    c.status === 'investigation' || c.status === 'covert_ops'
  );

  if (investigators.length === 0) return;

  // Update investigation progress
  const updatedInvestigations = store.investigations.map((inv: any) => {
    const assignedInvestigators = investigators.filter((c: any) =>
      inv.assignedCharacters?.includes(c.id)
    );

    if (assignedInvestigators.length === 0) return inv;

    // Calculate progress based on investigator INT stat
    let progressGain = 0;
    for (const investigator of assignedInvestigators) {
      const intBonus = Math.floor((investigator.stats?.INT || 50) / 10);
      progressGain += 1 + intBonus; // 1-10 progress per hour per investigator
    }

    const newProgress = Math.min(100, inv.progress + progressGain);

    return {
      ...inv,
      progress: newProgress,
    };
  });

  useGameStore.setState({ investigations: updatedInvestigations });
}

/**
 * Handle patrol events (random encounters)
 */
function handlePatrolEvent(event: GameEvent, sim: GameSimulation): void {
  const store = useGameStore.getState();

  // Find characters on patrol
  const patrollers = store.characters.filter((c: any) => c.status === 'patrol');

  if (patrollers.length === 0) return;

  // Each patroller has a chance for an encounter
  for (const patroller of patrollers) {
    // 10% chance per patrol event (already filtered by 10% in subsystem)
    if (Math.random() < 0.5) {
      // Generate a random encounter
      const encounterTypes = [
        'Found suspicious activity',
        'Rescued civilian in distress',
        'Discovered criminal hideout',
        'Foiled petty crime',
        'Gained valuable intel',
      ];

      const encounter = encounterTypes[Math.floor(Math.random() * encounterTypes.length)];

      // Add to world events
      const newEvent = {
        id: `patrol_${Date.now()}`,
        title: `Patrol Report: ${patroller.name}`,
        description: encounter,
        location: patroller.currentCity || 'Unknown Location',
        severity: 'low',
        time: sim.timeString,
      };

      useGameStore.setState({
        worldEvents: [newEvent, ...store.worldEvents.slice(0, 19)],
      });

      // Fame gain for positive encounters
      const updatedCharacters = store.characters.map((c: any) =>
        c.id === patroller.id
          ? { ...c, fame: Math.min(5000, (c.fame || 0) + 5) }
          : c
      );
      useGameStore.setState({ characters: updatedCharacters });
    }
  }
}

/**
 * Handle random world events (daily)
 */
function handleRandomEvent(event: GameEvent, sim: GameSimulation): void {
  const store = useGameStore.getState();

  // Random world event templates
  const eventTemplates = [
    { title: 'Political Unrest', severity: 'medium', desc: 'Protests erupting in major city' },
    { title: 'Corporate Scandal', severity: 'low', desc: 'Major corporation under investigation' },
    { title: 'Natural Disaster', severity: 'high', desc: 'Earthquake/Storm/Flood reported' },
    { title: 'Superhuman Sighting', severity: 'medium', desc: 'Unregistered superhuman activity detected' },
    { title: 'Criminal Organization Activity', severity: 'high', desc: 'Cartel/Syndicate movement reported' },
    { title: 'Tech Breakthrough', severity: 'low', desc: 'New technology announced' },
    { title: 'Military Exercise', severity: 'medium', desc: 'Joint military operations announced' },
  ];

  const template = eventTemplates[Math.floor(Math.random() * eventTemplates.length)];

  const newEvent = {
    id: `world_${Date.now()}`,
    title: template.title,
    description: template.desc,
    location: 'Global',
    severity: template.severity,
    time: sim.timeString,
  };

  useGameStore.setState({
    worldEvents: [newEvent, ...store.worldEvents.slice(0, 19)],
  });
}

/**
 * Handle day passed - update store day count
 */
function handleDayPassed(event: GameEvent, sim: GameSimulation): void {
  useGameStore.setState({ day: sim.day });
}

// =============================================================================
// INTEGRATION SETUP
// =============================================================================

/**
 * Register all event handlers with the simulation
 */
export function integrateSimulationWithStore(): GameSimulation {
  if (_isIntegrated) {
    return getGameSimulation();
  }

  const sim = getGameSimulation();

  // Register custom subsystems for store integration
  sim.registerSubsystem({
    id: 'store_status_handler',
    name: 'Store Status Handler',
    events: ['status_update'],
    priority: 100,
    enabled: true,
    handler: handleStatusUpdate,
  });

  sim.registerSubsystem({
    id: 'store_familiarity_handler',
    name: 'Store Familiarity Handler',
    events: ['familiarity_decay'],
    priority: 100,
    enabled: true,
    handler: handleFamiliarityDecay,
  });

  sim.registerSubsystem({
    id: 'store_travel_handler',
    name: 'Store Travel Handler',
    events: ['travel_update'],
    priority: 100,
    enabled: true,
    handler: handleTravelUpdate,
  });

  sim.registerSubsystem({
    id: 'store_hospital_handler',
    name: 'Store Hospital Handler',
    events: ['hospital_recovery'],
    priority: 100,
    enabled: true,
    handler: handleHospitalRecovery,
  });

  sim.registerSubsystem({
    id: 'store_investigation_handler',
    name: 'Store Investigation Handler',
    events: ['investigation_progress'],
    priority: 100,
    enabled: true,
    handler: handleInvestigationProgress,
  });

  sim.registerSubsystem({
    id: 'store_patrol_handler',
    name: 'Store Patrol Handler',
    events: ['patrol_event'],
    priority: 100,
    enabled: true,
    handler: handlePatrolEvent,
  });

  sim.registerSubsystem({
    id: 'store_random_event_handler',
    name: 'Store Random Event Handler',
    events: ['random_event'],
    priority: 100,
    enabled: true,
    handler: handleRandomEvent,
  });

  sim.registerSubsystem({
    id: 'store_day_handler',
    name: 'Store Day Handler',
    events: ['day_passed'],
    priority: 50,
    enabled: true,
    handler: handleDayPassed,
  });

  // Sync initial day from store
  const store = useGameStore.getState();
  if (store.day !== sim.day) {
    // Create new simulation with store's day
    // For now, just log the mismatch
    console.log(`Day mismatch: store=${store.day}, sim=${sim.day}`);
  }

  _isIntegrated = true;
  return sim;
}

/**
 * Start the simulation in real-time mode
 */
export function startSimulation(minutesPerSecond: number = 60): void {
  const sim = integrateSimulationWithStore();
  sim.start(1000, minutesPerSecond); // 1 tick per second, N game minutes per tick
}

/**
 * Pause the simulation
 */
export function pauseSimulation(): void {
  const sim = getGameSimulation();
  sim.pause();
}

/**
 * Step simulation forward manually
 */
export function stepSimulation(minutes: number = 60): void {
  const sim = integrateSimulationWithStore();
  sim.advanceTime(minutes);
  sim.processEventQueue();
}

/**
 * Skip to next morning
 */
export function skipToMorning(): void {
  const sim = integrateSimulationWithStore();
  sim.skipToMorning();
  sim.processEventQueue();
}

// =============================================================================
// REACT HOOK
// =============================================================================

import { useState, useEffect } from 'react';

/**
 * React hook for using game simulation
 */
export function useGameSimulation() {
  const [time, setTime] = useState<GameTime>(getGameSimulation().time);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    const sim = integrateSimulationWithStore();

    // Subscribe to time changes
    sim.onTimeChange((newTime) => {
      setTime(newTime);
    });

    // Check running state periodically
    const interval = setInterval(() => {
      setIsRunning(sim.isRunning);
    }, 500);

    return () => {
      clearInterval(interval);
    };
  }, []);

  return {
    time,
    day: time.day,
    hour: time.hour,
    timeString: getGameSimulation().timeString,
    isRunning,
    start: (speed?: number) => startSimulation(speed),
    pause: pauseSimulation,
    step: (minutes?: number) => stepSimulation(minutes),
    skipToMorning,
    advanceHours: (hours: number) => {
      const sim = getGameSimulation();
      sim.advanceHours(hours);
      sim.processEventQueue();
    },
    advanceDays: (days: number) => {
      const sim = getGameSimulation();
      sim.advanceDays(days);
      sim.processEventQueue();
    },
  };
}

// =============================================================================
// EXPORTS
// =============================================================================

export default {
  integrateSimulationWithStore,
  startSimulation,
  pauseSimulation,
  stepSimulation,
  skipToMorning,
  useGameSimulation,
};
