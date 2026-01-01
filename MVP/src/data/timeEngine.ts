/**
 * Time Engine - Living Simulation Core
 *
 * Wraps timeSystem.ts with a tick-based simulation engine that:
 * 1. Advances time through ticks (1 tick = 10 minutes by default)
 * 2. Fires events on time boundaries (hour, day, week changes)
 * 3. Generates "While you were gone" summaries for time jumps
 * 4. Provides hooks for other systems to respond to time passage
 *
 * PHILOSOPHY: Time is the heartbeat of the living world.
 * Every system should respond to time passing.
 */

import {
  GameTime,
  GameDate,
  TimeOfDay,
  advanceGameTime,
  getTimeOfDay,
  hasDayChanged,
  hasWeekChanged,
  formatDate,
  formatHour,
  createInitialGameTime,
  DEFAULT_START_DATE,
  DEFAULT_START_HOUR,
} from './timeSystem';

// ============================================================================
// TIME ENGINE CONFIGURATION
// ============================================================================

export interface TimeEngineConfig {
  tickMinutes: number;       // Minutes per tick (default: 10)
  autoTick: boolean;         // Auto-advance time
  tickIntervalMs: number;    // Real-time ms between auto-ticks
  pauseOnEvents: boolean;    // Pause when significant events occur
}

export const DEFAULT_TIME_CONFIG: TimeEngineConfig = {
  tickMinutes: 10,
  autoTick: false,
  tickIntervalMs: 1000,      // 1 second real-time = 10 minutes game time
  pauseOnEvents: true,
};

// ============================================================================
// TIME EVENTS
// ============================================================================

export type TimeEventType =
  | 'tick'                   // Every tick
  | 'hour_change'            // Hour boundary crossed
  | 'time_of_day_change'     // Morning/Afternoon/Evening/Night transition
  | 'day_change'             // New day
  | 'week_change'            // Monday (payday)
  | 'month_change'           // New month
  | 'year_change'            // New year
  | 'time_jump'              // Large time skip (travel, rest, etc.)
  | 'dawn'                   // 6 AM
  | 'dusk';                  // 6 PM

export interface TimeEvent {
  type: TimeEventType;
  previousTime: GameTime;
  newTime: GameTime;
  hoursElapsed: number;
  data?: Record<string, unknown>;
}

export type TimeEventHandler = (event: TimeEvent) => void;

// ============================================================================
// "WHILE YOU WERE GONE" EVENTS
// ============================================================================

export interface WhileYouWereGoneEvent {
  id: string;
  timestamp: GameTime;
  category: 'world' | 'faction' | 'npc' | 'economy' | 'crime' | 'personal';
  headline: string;
  description: string;
  importance: 'minor' | 'normal' | 'major' | 'critical';
  effects?: {
    cityChanges?: Array<{ cityName: string; stat: string; change: number }>;
    countryChanges?: Array<{ countryCode: string; stat: string; change: number }>;
    factionChanges?: Array<{ factionId: string; relation: number }>;
    priceChanges?: Array<{ itemCategory: string; multiplier: number }>;
  };
}

export interface WhileYouWereGoneSummary {
  hoursElapsed: number;
  daysElapsed: number;
  events: WhileYouWereGoneEvent[];
  healingApplied: number;
  incomeEarned: number;
  expensesPaid: number;
}

// ============================================================================
// TIME ENGINE CLASS
// ============================================================================

export class TimeEngine {
  private currentTime: GameTime;
  private config: TimeEngineConfig;
  private eventHandlers: Map<TimeEventType, TimeEventHandler[]>;
  private autoTickInterval: NodeJS.Timeout | null = null;
  private paused: boolean = false;
  private lastTickTime: GameTime;

  constructor(
    initialTime: GameTime = createInitialGameTime(DEFAULT_START_DATE, DEFAULT_START_HOUR),
    config: Partial<TimeEngineConfig> = {}
  ) {
    this.currentTime = { ...initialTime };
    this.lastTickTime = { ...initialTime };
    this.config = { ...DEFAULT_TIME_CONFIG, ...config };
    this.eventHandlers = new Map();

    // Initialize handler arrays for each event type
    const eventTypes: TimeEventType[] = [
      'tick', 'hour_change', 'time_of_day_change', 'day_change',
      'week_change', 'month_change', 'year_change', 'time_jump',
      'dawn', 'dusk',
    ];
    eventTypes.forEach(type => this.eventHandlers.set(type, []));
  }

  // ============================================================================
  // EVENT SUBSCRIPTION
  // ============================================================================

  /**
   * Subscribe to time events
   */
  on(eventType: TimeEventType, handler: TimeEventHandler): () => void {
    const handlers = this.eventHandlers.get(eventType) || [];
    handlers.push(handler);
    this.eventHandlers.set(eventType, handlers);

    // Return unsubscribe function
    return () => {
      const updated = this.eventHandlers.get(eventType)?.filter(h => h !== handler) || [];
      this.eventHandlers.set(eventType, updated);
    };
  }

  /**
   * Emit a time event to all subscribers
   */
  private emit(event: TimeEvent): void {
    const handlers = this.eventHandlers.get(event.type) || [];
    handlers.forEach(handler => {
      try {
        handler(event);
      } catch (error) {
        console.error(`Error in time event handler for ${event.type}:`, error);
      }
    });
  }

  // ============================================================================
  // TIME ADVANCEMENT
  // ============================================================================

  /**
   * Advance time by one tick
   */
  tick(): TimeEvent[] {
    const tickHours = this.config.tickMinutes / 60;
    return this.advanceTime(tickHours);
  }

  /**
   * Advance time by a specific number of hours
   */
  advanceTime(hours: number): TimeEvent[] {
    if (hours <= 0 || this.paused) return [];

    const previousTime = { ...this.currentTime };
    this.currentTime = advanceGameTime(this.currentTime, hours);

    const events = this.detectTimeEvents(previousTime, this.currentTime, hours);

    // Emit all detected events
    events.forEach(event => this.emit(event));

    this.lastTickTime = { ...this.currentTime };
    return events;
  }

  /**
   * Jump time forward (for travel, rest, activities)
   * Returns a "While you were gone" summary
   */
  jumpTime(hours: number): WhileYouWereGoneSummary {
    const previousTime = { ...this.currentTime };
    const events = this.advanceTime(hours);

    // Generate "While you were gone" events based on hours elapsed
    const wywgEvents = this.generateWhileYouWereGoneEvents(previousTime, this.currentTime, hours);

    // Emit time_jump event
    const jumpEvent: TimeEvent = {
      type: 'time_jump',
      previousTime,
      newTime: this.currentTime,
      hoursElapsed: hours,
      data: { wywgEvents },
    };
    this.emit(jumpEvent);

    return {
      hoursElapsed: hours,
      daysElapsed: Math.floor(hours / 24),
      events: wywgEvents,
      healingApplied: this.calculateHealingForHours(hours),
      incomeEarned: 0, // Will be calculated by economy system
      expensesPaid: 0, // Will be calculated by economy system
    };
  }

  /**
   * Detect what time boundary events occurred
   */
  private detectTimeEvents(previous: GameTime, current: GameTime, hoursElapsed: number): TimeEvent[] {
    const events: TimeEvent[] = [];

    // Always emit tick
    events.push({
      type: 'tick',
      previousTime: previous,
      newTime: current,
      hoursElapsed,
    });

    // Hour change
    if (previous.hour !== current.hour) {
      events.push({
        type: 'hour_change',
        previousTime: previous,
        newTime: current,
        hoursElapsed,
      });

      // Dawn (6 AM)
      if (current.hour === 6) {
        events.push({
          type: 'dawn',
          previousTime: previous,
          newTime: current,
          hoursElapsed,
        });
      }

      // Dusk (6 PM / 18:00)
      if (current.hour === 18) {
        events.push({
          type: 'dusk',
          previousTime: previous,
          newTime: current,
          hoursElapsed,
        });
      }
    }

    // Time of day change
    if (previous.timeOfDay !== current.timeOfDay) {
      events.push({
        type: 'time_of_day_change',
        previousTime: previous,
        newTime: current,
        hoursElapsed,
        data: { from: previous.timeOfDay, to: current.timeOfDay },
      });
    }

    // Day change
    if (hasDayChanged(previous, current)) {
      events.push({
        type: 'day_change',
        previousTime: previous,
        newTime: current,
        hoursElapsed,
      });

      // Month change
      if (previous.date.month !== current.date.month) {
        events.push({
          type: 'month_change',
          previousTime: previous,
          newTime: current,
          hoursElapsed,
        });
      }

      // Year change
      if (previous.date.year !== current.date.year) {
        events.push({
          type: 'year_change',
          previousTime: previous,
          newTime: current,
          hoursElapsed,
        });
      }
    }

    // Week change
    if (hasWeekChanged(previous, current)) {
      events.push({
        type: 'week_change',
        previousTime: previous,
        newTime: current,
        hoursElapsed,
      });
    }

    return events;
  }

  // ============================================================================
  // "WHILE YOU WERE GONE" GENERATION
  // ============================================================================

  /**
   * Generate events that happened during a time jump
   * More hours = more events, with weighted randomness
   */
  private generateWhileYouWereGoneEvents(
    from: GameTime,
    to: GameTime,
    hours: number
  ): WhileYouWereGoneEvent[] {
    const events: WhileYouWereGoneEvent[] = [];
    const days = Math.floor(hours / 24);

    // Only generate events for significant time jumps (4+ hours)
    if (hours < 4) return events;

    // Event generation rates (per 24 hours)
    const eventsPerDay = {
      minor: 2,
      normal: 1,
      major: 0.3,
      critical: 0.05,
    };

    // Generate minor events
    const minorEventCount = Math.floor((hours / 24) * eventsPerDay.minor * Math.random() * 2);
    for (let i = 0; i < minorEventCount; i++) {
      events.push(this.generateRandomEvent('minor', from, to));
    }

    // Generate normal events (if 12+ hours)
    if (hours >= 12) {
      const normalEventCount = Math.floor((hours / 24) * eventsPerDay.normal * (0.5 + Math.random()));
      for (let i = 0; i < normalEventCount; i++) {
        events.push(this.generateRandomEvent('normal', from, to));
      }
    }

    // Generate major events (if 24+ hours)
    if (hours >= 24) {
      if (Math.random() < eventsPerDay.major * days) {
        events.push(this.generateRandomEvent('major', from, to));
      }
    }

    // Generate critical events (if 48+ hours, rare)
    if (hours >= 48) {
      if (Math.random() < eventsPerDay.critical * days) {
        events.push(this.generateRandomEvent('critical', from, to));
      }
    }

    // Sort by importance (critical first)
    const importanceOrder = { critical: 0, major: 1, normal: 2, minor: 3 };
    events.sort((a, b) => importanceOrder[a.importance] - importanceOrder[b.importance]);

    return events;
  }

  /**
   * Generate a random world event
   */
  private generateRandomEvent(
    importance: WhileYouWereGoneEvent['importance'],
    from: GameTime,
    to: GameTime
  ): WhileYouWereGoneEvent {
    // Event templates by category and importance
    const templates = {
      minor: [
        { category: 'crime', headline: 'Minor crime spike in local area', description: 'Police report increased petty theft.' },
        { category: 'economy', headline: 'Local market fluctuation', description: 'Prices shifted slightly.' },
        { category: 'world', headline: 'Weather advisory issued', description: 'Temporary travel conditions affected.' },
        { category: 'npc', headline: 'Contact checked in', description: 'One of your contacts left a message.' },
      ],
      normal: [
        { category: 'crime', headline: 'Gang activity reported', description: 'Rival factions clashed in the streets.' },
        { category: 'economy', headline: 'Supply chain disruption', description: 'Some goods are temporarily scarce.' },
        { category: 'faction', headline: 'Faction territory shift', description: 'Power dynamics changed in the region.' },
        { category: 'world', headline: 'Political tensions rise', description: 'Government officials issued statements.' },
      ],
      major: [
        { category: 'crime', headline: 'Major criminal operation exposed', description: 'Law enforcement made significant arrests.' },
        { category: 'economy', headline: 'Economic shock hits markets', description: 'Prices across categories affected.' },
        { category: 'faction', headline: 'Faction war erupts', description: 'Multiple factions engaged in open conflict.' },
        { category: 'world', headline: 'Political crisis develops', description: 'Government stability questioned.' },
      ],
      critical: [
        { category: 'world', headline: 'Coup attempt reported', description: 'Military forces mobilized.' },
        { category: 'faction', headline: 'Major faction eliminated', description: 'Power vacuum created in the region.' },
        { category: 'economy', headline: 'Currency collapse', description: 'Massive economic upheaval.' },
        { category: 'crime', headline: 'Cartel leader assassinated', description: 'Criminal underworld in chaos.' },
      ],
    };

    const templateList = templates[importance] as Array<{category: string; headline: string; description: string}>;
    const template = templateList[Math.floor(Math.random() * templateList.length)];

    // Pick a random timestamp during the time jump
    const hoursOffset = Math.floor(Math.random() * (to.totalHours - from.totalHours));
    const timestamp = advanceGameTime(from, hoursOffset);

    return {
      id: `wywg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp,
      category: template.category as WhileYouWereGoneEvent['category'],
      headline: template.headline,
      description: template.description,
      importance,
    };
  }

  // ============================================================================
  // HEALING OVER TIME
  // ============================================================================

  /**
   * Calculate HP recovery for time elapsed
   * Base rate: 1 HP per hour while resting, 0.5 HP per hour active
   */
  private calculateHealingForHours(hours: number): number {
    // Assume resting for sleep hours (8 per 24), active otherwise
    const days = hours / 24;
    const restingHours = days * 8;
    const activeHours = hours - restingHours;

    const restingHealing = restingHours * 1.0;
    const activeHealing = activeHours * 0.5;

    return Math.floor(restingHealing + activeHealing);
  }

  // ============================================================================
  // AUTO-TICK CONTROL
  // ============================================================================

  /**
   * Start auto-ticking
   */
  startAutoTick(): void {
    if (this.autoTickInterval) return;

    this.config.autoTick = true;
    this.autoTickInterval = setInterval(() => {
      if (!this.paused) {
        this.tick();
      }
    }, this.config.tickIntervalMs);
  }

  /**
   * Stop auto-ticking
   */
  stopAutoTick(): void {
    if (this.autoTickInterval) {
      clearInterval(this.autoTickInterval);
      this.autoTickInterval = null;
    }
    this.config.autoTick = false;
  }

  /**
   * Pause time progression
   */
  pause(): void {
    this.paused = true;
  }

  /**
   * Resume time progression
   */
  resume(): void {
    this.paused = false;
  }

  /**
   * Check if paused
   */
  isPaused(): boolean {
    return this.paused;
  }

  // ============================================================================
  // GETTERS
  // ============================================================================

  getTime(): GameTime {
    return { ...this.currentTime };
  }

  getDate(): GameDate {
    return { ...this.currentTime.date };
  }

  getHour(): number {
    return this.currentTime.hour;
  }

  getTimeOfDay(): TimeOfDay {
    return this.currentTime.timeOfDay;
  }

  getFormattedDate(): string {
    return formatDate(this.currentTime.date);
  }

  getFormattedTime(): string {
    return formatHour(this.currentTime.hour);
  }

  getFormattedDateTime(): string {
    return `${this.getFormattedDate()} at ${this.getFormattedTime()}`;
  }

  isNight(): boolean {
    return this.currentTime.timeOfDay === 'night';
  }

  isDay(): boolean {
    return this.currentTime.timeOfDay === 'morning' || this.currentTime.timeOfDay === 'afternoon';
  }

  isWeekend(): boolean {
    return this.currentTime.isWeekend;
  }

  // ============================================================================
  // SETTERS (for loading saved games)
  // ============================================================================

  setTime(time: GameTime): void {
    this.currentTime = { ...time };
    this.lastTickTime = { ...time };
  }

  // ============================================================================
  // SERIALIZATION
  // ============================================================================

  serialize(): { currentTime: GameTime; config: TimeEngineConfig } {
    return {
      currentTime: { ...this.currentTime },
      config: { ...this.config },
    };
  }

  static deserialize(data: { currentTime: GameTime; config?: Partial<TimeEngineConfig> }): TimeEngine {
    return new TimeEngine(data.currentTime, data.config);
  }
}

// ============================================================================
// SINGLETON INSTANCE (for global access)
// ============================================================================

let timeEngineInstance: TimeEngine | null = null;

export function getTimeEngine(): TimeEngine {
  if (!timeEngineInstance) {
    timeEngineInstance = new TimeEngine();
  }
  return timeEngineInstance;
}

export function initializeTimeEngine(
  initialTime?: GameTime,
  config?: Partial<TimeEngineConfig>
): TimeEngine {
  timeEngineInstance = new TimeEngine(initialTime, config);
  return timeEngineInstance;
}

// ============================================================================
// TIME-BASED EFFECTS HELPERS
// ============================================================================

/**
 * Get crime modifier for current time of day
 * Night = higher crime, Day = lower crime
 */
export function getCrimeTimeModifier(timeOfDay: TimeOfDay): number {
  switch (timeOfDay) {
    case 'night': return 1.5;    // 50% more crime at night
    case 'evening': return 1.2;  // 20% more in evening
    case 'morning': return 0.8;  // 20% less in morning
    case 'afternoon': return 1.0; // Normal
  }
}

/**
 * Check if shops are open based on time
 */
export function areShopsOpen(timeOfDay: TimeOfDay, shopType: string): boolean {
  switch (shopType) {
    case 'blackmarket':
      // Black market only operates at night/evening
      return timeOfDay === 'night' || timeOfDay === 'evening';
    case 'general':
    case 'military':
    case 'tech':
    case 'police':
    case 'medical':
      // Normal shops: morning and afternoon only
      return timeOfDay === 'morning' || timeOfDay === 'afternoon';
    default:
      return true;
  }
}

/**
 * Get encounter difficulty modifier for time of day
 * Night encounters are harder
 */
export function getEncounterDifficultyModifier(timeOfDay: TimeOfDay): number {
  switch (timeOfDay) {
    case 'night': return 1.3;    // 30% harder at night
    case 'evening': return 1.1;  // 10% harder in evening
    case 'morning': return 0.9;  // 10% easier in morning (criminals tired)
    case 'afternoon': return 1.0;
  }
}

/**
 * Get visibility modifier for time of day
 * Affects detection and accuracy
 */
export function getVisibilityModifier(timeOfDay: TimeOfDay): number {
  switch (timeOfDay) {
    case 'night': return 0.6;    // 40% reduced visibility
    case 'evening': return 0.85; // 15% reduced
    case 'morning': return 0.95; // 5% reduced (fog/mist)
    case 'afternoon': return 1.0; // Full visibility
  }
}
