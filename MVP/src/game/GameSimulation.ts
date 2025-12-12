/**
 * GameSimulation - Central game loop and time management
 *
 * This class owns the game time state and coordinates all time-based systems:
 * - Character status processing (recovery, training, patrol, etc.)
 * - City familiarity decay
 * - Travel progress updates
 * - Event generation
 * - World events
 *
 * Design: Event-driven with registered subsystem handlers for extensibility.
 * The simulation can run in real-time (with multiplier) or step-based.
 */

// =============================================================================
// TIME UNITS
// =============================================================================

export interface GameTime {
  day: number;          // Game day (1 = start of campaign)
  hour: number;         // 0-23
  minute: number;       // 0-59
  totalMinutes: number; // Total minutes since game start (for calculations)
}

export const MINUTES_PER_HOUR = 60;
export const HOURS_PER_DAY = 24;
export const MINUTES_PER_DAY = MINUTES_PER_HOUR * HOURS_PER_DAY;

// =============================================================================
// EVENT TYPES
// =============================================================================

export type GameEventType =
  | 'tick'                    // Every tick (frequent)
  | 'hour_passed'             // Every in-game hour
  | 'day_passed'              // Every in-game day
  | 'week_passed'             // Every 7 days
  | 'status_update'           // Character status processing
  | 'familiarity_decay'       // City familiarity decay check
  | 'travel_update'           // Travel progress
  | 'investigation_progress'  // Investigation system
  | 'random_event'            // World random events
  | 'patrol_event'            // Patrol encounter
  | 'training_progress'       // Training completion
  | 'hospital_recovery'       // Hospital recovery check
  | 'custom';                 // User-defined events

export interface GameEvent {
  type: GameEventType;
  timestamp: GameTime;
  data?: Record<string, unknown>;
}

// =============================================================================
// SUBSYSTEM HANDLER
// =============================================================================

export type SubsystemHandler = (event: GameEvent, simulation: GameSimulation) => void;

export interface SubsystemRegistration {
  id: string;
  name: string;
  events: GameEventType[];
  handler: SubsystemHandler;
  priority: number;        // Lower = runs first
  enabled: boolean;
}

// =============================================================================
// CHARACTER STATUS (14 total from design doc)
// =============================================================================

export type CharacterStatus =
  | 'ready'           // Idle, awaiting commands
  | 'hospital'        // Recovering from 0 HP (Origin 1-4)
  | 'investigation'   // Detective work
  | 'covert_ops'      // Investigations outside home country
  | 'personal_life'   // Day job, family time
  | 'training'        // Improve stats, maintain martial arts
  | 'patrol'          // Farm Fame, increase City Familiarity
  | 'off_the_grid'    // Character hiding
  | 'engineering'     // Build/repair tech suits, robots
  | 'research'        // Unlock tech, analyze evidence
  | 'travel'          // In transit
  | 'recruit'         // Use Fame to find vigilantes
  | 'unconscious'     // Temporary incapacitation
  | 'dead';           // Permadeath

// =============================================================================
// ORIGIN TYPES (affects 0 HP outcome)
// =============================================================================

export type OriginType = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

export const ORIGIN_NAMES: Record<OriginType, string> = {
  1: 'Skilled Human',
  2: 'Altered Human',
  3: 'Tech Enhancement',
  4: 'Mutated Human',
  5: 'Spiritual Enhancement',
  6: 'Robotic',
  7: 'Symbiotic',
  8: 'Alien',
  9: 'Unknown',
};

export const ORIGIN_ZERO_HP_RESULT: Record<OriginType, CharacterStatus | 'unknown'> = {
  1: 'hospital',
  2: 'hospital',
  3: 'hospital',
  4: 'hospital',
  5: 'unknown',  // TBD
  6: 'ready',    // Needs repair (Engineering) - different flow
  7: 'unknown',  // TBD
  8: 'unknown',  // TBD
  9: 'unknown',  // Reserved
};

// =============================================================================
// CITY FAMILIARITY
// =============================================================================

export interface CityFamiliarity {
  cityId: string;
  cityName: string;
  familiarity: number;  // 0-100
  lastVisited: number;  // Game timestamp (totalMinutes)
}

// Familiarity config
export const FAMILIARITY_CONFIG = {
  maxFamiliarity: 100,
  birthCityFamiliarity: 100,
  dailyDecay: 0.5,          // Lose 0.5 per day when not visiting
  presenceGainPerDay: 1,    // +1/day just being in city
  patrolGainPerDay: 3,      // +3/day when patrolling
  decayStartDays: 30,       // Familiarity doesn't decay for 30 days after visit
  minFamiliarityFloor: 10,  // Birth city never goes below 10
};

// =============================================================================
// ENHANCED CHARACTER INTERFACE
// =============================================================================

export interface EnhancedCharacter {
  id: string;
  name: string;
  realName: string;

  // Origin system
  origin: OriginType;

  // Location
  birthCity: string;                     // City ID from game's 1050 cities
  birthCountry: string;                  // Country code
  currentCity?: string;                  // Current city ID
  currentSector?: string;                // Current sector code

  // City knowledge
  cityFamiliarities: CityFamiliarity[];  // Cities this character knows

  // Status system
  status: CharacterStatus;
  statusStartTime?: number;              // When current status began
  statusDuration?: number;               // How long status lasts (minutes)
  statusData?: Record<string, unknown>;  // Status-specific data

  // Secondary stats
  fame: number;      // 0-5000
  wealth: number;    // 0-5000+

  // Primary stats (existing)
  stats: {
    MEL: number;
    AGL: number;
    STR: number;
    STA: number;
    INT: number;
    INS: number;
    CON: number;
  };

  // Rest of existing fields...
  threatLevel: string;
  powers: string[];
  equipment: string[];
  health: { current: number; maximum: number };
  shield?: number;
  maxShield?: number;
  shieldRegen?: number;
  dr?: number;
  equippedArmor?: string;
  equippedShield?: string;
  injuries: unknown[];
  medicalHistory: unknown[];
  recoveryTime: number;
}

// =============================================================================
// GAME SIMULATION CLASS
// =============================================================================

export class GameSimulation {
  // Time state
  private _time: GameTime;

  // Subsystems
  private _subsystems: Map<string, SubsystemRegistration> = new Map();

  // Running state
  private _isRunning: boolean = false;
  private _tickInterval: number | null = null;
  private _tickRate: number = 1000;        // ms between ticks
  private _timeScale: number = 1;          // Game minutes per tick

  // Event queue
  private _eventQueue: GameEvent[] = [];

  // External callbacks (for React integration)
  private _onTimeChange?: (time: GameTime) => void;
  private _onEventFired?: (event: GameEvent) => void;

  constructor(initialDay: number = 1) {
    this._time = {
      day: initialDay,
      hour: 8,  // Start at 8 AM
      minute: 0,
      totalMinutes: (initialDay - 1) * MINUTES_PER_DAY + 8 * MINUTES_PER_HOUR,
    };

    // Register built-in subsystems
    this._registerBuiltInSubsystems();
  }

  // =========================================================================
  // TIME GETTERS
  // =========================================================================

  get time(): GameTime {
    return { ...this._time };
  }

  get day(): number {
    return this._time.day;
  }

  get hour(): number {
    return this._time.hour;
  }

  get isRunning(): boolean {
    return this._isRunning;
  }

  get timeString(): string {
    const period = this._time.hour >= 12 ? 'PM' : 'AM';
    const displayHour = this._time.hour % 12 || 12;
    return `Day ${this._time.day}, ${displayHour}:${this._time.minute.toString().padStart(2, '0')} ${period}`;
  }

  // =========================================================================
  // TIME CONTROL
  // =========================================================================

  /**
   * Advance time by specified minutes
   */
  advanceTime(minutes: number): void {
    const previousHour = this._time.hour;
    const previousDay = this._time.day;

    this._time.totalMinutes += minutes;
    this._time.minute += minutes;

    // Roll over minutes to hours
    while (this._time.minute >= MINUTES_PER_HOUR) {
      this._time.minute -= MINUTES_PER_HOUR;
      this._time.hour++;
    }

    // Roll over hours to days
    while (this._time.hour >= HOURS_PER_DAY) {
      this._time.hour -= HOURS_PER_DAY;
      this._time.day++;
    }

    // Fire time events
    this._fireEvent({ type: 'tick', timestamp: this.time });

    // Check for hour change
    if (this._time.hour !== previousHour) {
      this._fireEvent({ type: 'hour_passed', timestamp: this.time });
    }

    // Check for day change
    if (this._time.day !== previousDay) {
      this._fireEvent({ type: 'day_passed', timestamp: this.time });

      // Check for week change
      if ((this._time.day - 1) % 7 === 0) {
        this._fireEvent({ type: 'week_passed', timestamp: this.time });
      }
    }

    // Notify external listeners
    this._onTimeChange?.(this.time);
  }

  /**
   * Advance by hours (convenience method)
   */
  advanceHours(hours: number): void {
    this.advanceTime(hours * MINUTES_PER_HOUR);
  }

  /**
   * Advance by days (convenience method)
   */
  advanceDays(days: number): void {
    this.advanceTime(days * MINUTES_PER_DAY);
  }

  /**
   * Skip to next morning (8 AM)
   */
  skipToMorning(): void {
    const hoursUntilMorning = this._time.hour >= 8
      ? (24 - this._time.hour + 8)
      : (8 - this._time.hour);
    this.advanceHours(hoursUntilMorning);
    this._time.minute = 0;
  }

  // =========================================================================
  // REAL-TIME SIMULATION
  // =========================================================================

  /**
   * Start real-time simulation
   */
  start(tickRateMs: number = 1000, gameMinutesPerTick: number = 1): void {
    if (this._isRunning) return;

    this._tickRate = tickRateMs;
    this._timeScale = gameMinutesPerTick;
    this._isRunning = true;

    this._tickInterval = window.setInterval(() => {
      this.advanceTime(this._timeScale);
    }, this._tickRate);
  }

  /**
   * Pause real-time simulation
   */
  pause(): void {
    if (!this._isRunning) return;

    this._isRunning = false;
    if (this._tickInterval !== null) {
      clearInterval(this._tickInterval);
      this._tickInterval = null;
    }
  }

  /**
   * Set time scale (game minutes per real second)
   */
  setTimeScale(minutesPerSecond: number): void {
    this._timeScale = minutesPerSecond;

    // Restart if running
    if (this._isRunning) {
      this.pause();
      this.start(this._tickRate, this._timeScale);
    }
  }

  // =========================================================================
  // SUBSYSTEM REGISTRATION
  // =========================================================================

  /**
   * Register a subsystem handler
   */
  registerSubsystem(registration: SubsystemRegistration): void {
    this._subsystems.set(registration.id, registration);
  }

  /**
   * Unregister a subsystem
   */
  unregisterSubsystem(id: string): void {
    this._subsystems.delete(id);
  }

  /**
   * Enable/disable a subsystem
   */
  setSubsystemEnabled(id: string, enabled: boolean): void {
    const sub = this._subsystems.get(id);
    if (sub) {
      sub.enabled = enabled;
    }
  }

  /**
   * Get all registered subsystems
   */
  getSubsystems(): SubsystemRegistration[] {
    return Array.from(this._subsystems.values());
  }

  // =========================================================================
  // EVENT SYSTEM
  // =========================================================================

  /**
   * Fire an event to all relevant subsystems
   */
  private _fireEvent(event: GameEvent): void {
    // Get handlers sorted by priority
    const handlers = Array.from(this._subsystems.values())
      .filter(sub => sub.enabled && sub.events.includes(event.type))
      .sort((a, b) => a.priority - b.priority);

    // Execute handlers
    for (const handler of handlers) {
      try {
        handler.handler(event, this);
      } catch (err) {
        console.error(`Error in subsystem ${handler.id}:`, err);
      }
    }

    // Notify external listeners
    this._onEventFired?.(event);
  }

  /**
   * Queue an event to fire on next tick
   */
  queueEvent(type: GameEventType, data?: Record<string, unknown>): void {
    this._eventQueue.push({
      type,
      timestamp: this.time,
      data,
    });
  }

  /**
   * Process queued events
   */
  processEventQueue(): void {
    while (this._eventQueue.length > 0) {
      const event = this._eventQueue.shift()!;
      this._fireEvent(event);
    }
  }

  // =========================================================================
  // EXTERNAL HOOKS (React integration)
  // =========================================================================

  /**
   * Set callback for time changes
   */
  onTimeChange(callback: (time: GameTime) => void): void {
    this._onTimeChange = callback;
  }

  /**
   * Set callback for events
   */
  onEventFired(callback: (event: GameEvent) => void): void {
    this._onEventFired = callback;
  }

  // =========================================================================
  // BUILT-IN SUBSYSTEMS
  // =========================================================================

  private _registerBuiltInSubsystems(): void {
    // Status update processor (hourly)
    this.registerSubsystem({
      id: 'status_processor',
      name: 'Character Status Processor',
      events: ['hour_passed'],
      priority: 10,
      enabled: true,
      handler: (event, sim) => {
        sim.queueEvent('status_update');
      },
    });

    // Familiarity decay (daily)
    this.registerSubsystem({
      id: 'familiarity_decay',
      name: 'City Familiarity Decay',
      events: ['day_passed'],
      priority: 20,
      enabled: true,
      handler: (event, sim) => {
        sim.queueEvent('familiarity_decay');
      },
    });

    // Travel update (every tick)
    this.registerSubsystem({
      id: 'travel_processor',
      name: 'Travel Progress Processor',
      events: ['tick'],
      priority: 5,
      enabled: true,
      handler: (event, sim) => {
        sim.queueEvent('travel_update');
      },
    });

    // Hospital recovery (daily)
    this.registerSubsystem({
      id: 'hospital_recovery',
      name: 'Hospital Recovery Processor',
      events: ['day_passed'],
      priority: 15,
      enabled: true,
      handler: (event, sim) => {
        sim.queueEvent('hospital_recovery');
      },
    });

    // Investigation progress (hourly)
    this.registerSubsystem({
      id: 'investigation_processor',
      name: 'Investigation Progress',
      events: ['hour_passed'],
      priority: 25,
      enabled: true,
      handler: (event, sim) => {
        sim.queueEvent('investigation_progress');
      },
    });

    // Training progress (hourly)
    this.registerSubsystem({
      id: 'training_processor',
      name: 'Training Progress',
      events: ['hour_passed'],
      priority: 30,
      enabled: true,
      handler: (event, sim) => {
        sim.queueEvent('training_progress');
      },
    });

    // Patrol events (hourly, randomized)
    this.registerSubsystem({
      id: 'patrol_processor',
      name: 'Patrol Event Generator',
      events: ['hour_passed'],
      priority: 40,
      enabled: true,
      handler: (event, sim) => {
        // 10% chance per hour for patrol event
        if (Math.random() < 0.1) {
          sim.queueEvent('patrol_event');
        }
      },
    });

    // Random world events (daily)
    this.registerSubsystem({
      id: 'random_events',
      name: 'Random Event Generator',
      events: ['day_passed'],
      priority: 50,
      enabled: true,
      handler: (event, sim) => {
        // 25% chance per day for random event
        if (Math.random() < 0.25) {
          sim.queueEvent('random_event');
        }
      },
    });
  }
}

// =============================================================================
// SINGLETON INSTANCE
// =============================================================================

let _gameSimulationInstance: GameSimulation | null = null;

export function getGameSimulation(): GameSimulation {
  if (!_gameSimulationInstance) {
    _gameSimulationInstance = new GameSimulation();
  }
  return _gameSimulationInstance;
}

export function resetGameSimulation(initialDay: number = 1): GameSimulation {
  _gameSimulationInstance = new GameSimulation(initialDay);
  return _gameSimulationInstance;
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Calculate familiarity decay for a character's city knowledge
 */
export function calculateFamiliarityDecay(
  familiarities: CityFamiliarity[],
  currentTime: number,
  birthCityId: string
): CityFamiliarity[] {
  return familiarities.map(f => {
    // Don't decay birth city below floor
    const isBirthCity = f.cityId === birthCityId;
    const minFloor = isBirthCity ? FAMILIARITY_CONFIG.minFamiliarityFloor : 0;

    // Calculate days since last visit
    const daysSinceVisit = Math.floor(
      (currentTime - f.lastVisited) / MINUTES_PER_DAY
    );

    // No decay for first N days
    if (daysSinceVisit <= FAMILIARITY_CONFIG.decayStartDays) {
      return f;
    }

    // Calculate decay
    const decayDays = daysSinceVisit - FAMILIARITY_CONFIG.decayStartDays;
    const decay = decayDays * FAMILIARITY_CONFIG.dailyDecay;
    const newFamiliarity = Math.max(minFloor, f.familiarity - decay);

    return {
      ...f,
      familiarity: newFamiliarity,
    };
  });
}

/**
 * Add or update familiarity for a city
 */
export function updateCityFamiliarity(
  familiarities: CityFamiliarity[],
  cityId: string,
  cityName: string,
  currentTime: number,
  gain: number = FAMILIARITY_CONFIG.presenceGainPerDay
): CityFamiliarity[] {
  const existing = familiarities.find(f => f.cityId === cityId);

  if (existing) {
    return familiarities.map(f =>
      f.cityId === cityId
        ? {
            ...f,
            familiarity: Math.min(FAMILIARITY_CONFIG.maxFamiliarity, f.familiarity + gain),
            lastVisited: currentTime,
          }
        : f
    );
  }

  // Add new familiarity
  return [
    ...familiarities,
    {
      cityId,
      cityName,
      familiarity: gain,
      lastVisited: currentTime,
    },
  ];
}

/**
 * Get familiarity bonus for a character in a city
 */
export function getFamiliarityBonus(
  familiarities: CityFamiliarity[],
  cityId: string
): number {
  const f = familiarities.find(fam => fam.cityId === cityId);
  if (!f) return -20; // Unknown city penalty

  // Scale from -10 (0 familiarity) to +10 (100 familiarity)
  return Math.floor((f.familiarity - 50) / 5);
}

// =============================================================================
// EXPORTS
// =============================================================================

export default GameSimulation;
