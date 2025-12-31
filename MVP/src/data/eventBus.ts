/**
 * EventBus - Central event system for SuperHero Tactics
 *
 * This is the core event infrastructure that connects all game systems:
 * - Combat results flow to News, Reputation, Hospital
 * - Time progression triggers Random events, Schedules, Economy
 * - Player actions update Fame and World state
 *
 * Unlike EventBridge (React ↔ Phaser), this handles game-wide system integration.
 */

// ============== EVENT TYPE DEFINITIONS ==============

export type GameEventCategory =
  | 'combat'        // Combat-related events
  | 'mission'       // Mission lifecycle events
  | 'time'          // Time progression events
  | 'player'        // Player actions
  | 'world'         // World state changes
  | 'character'     // Character state changes
  | 'news'          // News generation triggers
  | 'economy'       // Financial transactions
  | 'reputation'    // Fame/opinion changes
  | 'investigation' // Investigation progress
  | 'system';       // System-level events

export type GameEventType =
  // Combat events
  | 'combat:started'
  | 'combat:ended'
  | 'combat:unit-killed'
  | 'combat:unit-injured'
  | 'combat:victory'
  | 'combat:defeat'
  | 'combat:damage-dealt'

  // Mission events
  | 'mission:started'
  | 'mission:completed'
  | 'mission:failed'
  | 'mission:abandoned'
  | 'mission:objective-completed'

  // Time events
  | 'time:hour-passed'
  | 'time:day-passed'
  | 'time:week-passed'
  | 'time:month-passed'
  | 'time:dawn'
  | 'time:noon'
  | 'time:dusk'
  | 'time:midnight'

  // Player action events
  | 'player:travel-started'
  | 'player:travel-completed'
  | 'player:item-purchased'
  | 'player:item-sold'
  | 'player:character-recruited'
  | 'player:character-dismissed'
  | 'player:skill-trained'
  | 'player:facility-built'

  // World events
  | 'world:crime-occurred'
  | 'world:disaster-occurred'
  | 'world:political-event'
  | 'world:faction-action'
  | 'world:encounter-triggered'

  // Character events
  | 'character:leveled-up'
  | 'character:hospitalized'
  | 'character:recovered'
  | 'character:died'
  | 'character:stat-changed'
  | 'character:morale-changed'

  // News events
  | 'news:article-generated'
  | 'news:headline-published'
  | 'news:opinion-shifted'

  // Economy events
  | 'economy:income-received'
  | 'economy:expense-paid'
  | 'economy:payday'
  | 'economy:market-change'

  // Reputation events
  | 'reputation:fame-changed'
  | 'reputation:notoriety-changed'
  | 'reputation:faction-opinion-changed'

  // Investigation events
  | 'investigation:started'
  | 'investigation:clue-found'
  | 'investigation:case-solved'
  | 'investigation:case-failed'

  // System events
  | 'system:game-saved'
  | 'system:game-loaded'
  | 'system:error';

// ============== EVENT DATA INTERFACES ==============

export interface GameEventBase {
  id: string;
  type: GameEventType;
  category: GameEventCategory;
  timestamp: number;
  gameTime?: {
    day: number;
    hour: number;
    minute: number;
  };
  location?: {
    sector?: string;
    city?: string;
    country?: string;
  };
}

export interface CombatEndedEvent extends GameEventBase {
  type: 'combat:ended';
  category: 'combat';
  data: {
    victory: boolean;
    casualties: Array<{ id: string; name: string; team: string }>;
    injuries: Array<{ id: string; name: string; severity: string; bodyPart: string }>;
    survivors: Array<{ id: string; name: string; hp: number; maxHp: number }>;
    damageDealt: number;
    damageTaken: number;
    duration: number; // minutes
    fameChange: number;
    collateralDamage?: number;
  };
}

export interface MissionCompletedEvent extends GameEventBase {
  type: 'mission:completed';
  category: 'mission';
  data: {
    missionId: string;
    missionName: string;
    missionType: string;
    success: boolean;
    rewards: {
      money: number;
      xp: number;
      items: string[];
      fameChange: number;
    };
    casualties: string[];
  };
}

export interface TimePassedEvent extends GameEventBase {
  type: 'time:hour-passed' | 'time:day-passed' | 'time:week-passed';
  category: 'time';
  data: {
    previousTime: { day: number; hour: number };
    currentTime: { day: number; hour: number };
    hoursElapsed: number;
  };
}

export interface CharacterHospitalizedEvent extends GameEventBase {
  type: 'character:hospitalized';
  category: 'character';
  data: {
    characterId: string;
    characterName: string;
    injuries: Array<{ bodyPart: string; severity: string; healingDays: number }>;
    hospitalName: string;
    estimatedRecovery: number; // days
  };
}

export interface NewsGeneratedEvent extends GameEventBase {
  type: 'news:article-generated';
  category: 'news';
  data: {
    articleId: string;
    headline: string;
    category: string;
    relatedEventId?: string;
    fameImpact: number;
    opinionImpact: number;
  };
}

export interface ReputationChangedEvent extends GameEventBase {
  type: 'reputation:fame-changed' | 'reputation:notoriety-changed';
  category: 'reputation';
  data: {
    previousValue: number;
    newValue: number;
    change: number;
    reason: string;
    sourceEventId?: string;
  };
}

// Union type for all events
export type GameEvent =
  | CombatEndedEvent
  | MissionCompletedEvent
  | TimePassedEvent
  | CharacterHospitalizedEvent
  | NewsGeneratedEvent
  | ReputationChangedEvent
  | (GameEventBase & { data?: any });

// ============== CALLBACK TYPES ==============

export type EventCallback<T = any> = (event: T) => void;
export type EventFilter = (event: GameEvent) => boolean;

export interface EventSubscription {
  id: string;
  eventType: GameEventType | GameEventType[] | '*';
  callback: EventCallback;
  filter?: EventFilter;
  once?: boolean;
  priority?: number; // Higher = called first
}

// ============== EVENT HISTORY ==============

export interface EventHistoryConfig {
  maxEvents: number;
  persistToStorage: boolean;
  storageKey: string;
}

// ============== EVENTBUS CLASS ==============

class EventBusClass {
  private subscriptions: Map<string, EventSubscription> = new Map();
  private eventHistory: GameEvent[] = [];
  private historyConfig: EventHistoryConfig = {
    maxEvents: 1000,
    persistToStorage: false,
    storageKey: 'sht_event_history'
  };
  private nextSubscriptionId = 1;
  private paused = false;
  private eventQueue: GameEvent[] = [];

  // ============== SUBSCRIPTION METHODS ==============

  /**
   * Subscribe to one or more event types
   */
  on<T extends GameEvent = GameEvent>(
    eventType: GameEventType | GameEventType[] | '*',
    callback: EventCallback<T>,
    options?: { filter?: EventFilter; priority?: number }
  ): string {
    const id = `sub_${this.nextSubscriptionId++}`;
    const subscription: EventSubscription = {
      id,
      eventType,
      callback: callback as EventCallback,
      filter: options?.filter,
      priority: options?.priority ?? 0
    };
    this.subscriptions.set(id, subscription);
    return id;
  }

  /**
   * Subscribe to an event type, but only trigger once
   */
  once<T extends GameEvent = GameEvent>(
    eventType: GameEventType | GameEventType[] | '*',
    callback: EventCallback<T>
  ): string {
    const id = `sub_${this.nextSubscriptionId++}`;
    const subscription: EventSubscription = {
      id,
      eventType,
      callback: callback as EventCallback,
      once: true
    };
    this.subscriptions.set(id, subscription);
    return id;
  }

  /**
   * Unsubscribe by subscription ID
   */
  off(subscriptionId: string): boolean {
    return this.subscriptions.delete(subscriptionId);
  }

  /**
   * Remove all subscriptions for an event type
   */
  offAll(eventType?: GameEventType): void {
    if (!eventType) {
      this.subscriptions.clear();
      return;
    }

    for (const [id, sub] of this.subscriptions) {
      if (sub.eventType === eventType ||
          (Array.isArray(sub.eventType) && sub.eventType.includes(eventType))) {
        this.subscriptions.delete(id);
      }
    }
  }

  // ============== EMIT METHODS ==============

  /**
   * Emit an event to all subscribers
   */
  emit(event: GameEvent): void {
    // Add metadata if missing
    if (!event.id) {
      event.id = this.generateEventId();
    }
    if (!event.timestamp) {
      event.timestamp = Date.now();
    }

    // If paused, queue the event
    if (this.paused) {
      this.eventQueue.push(event);
      return;
    }

    // Add to history
    this.addToHistory(event);

    // Get matching subscriptions sorted by priority
    const matchingSubscriptions = this.getMatchingSubscriptions(event);

    // Call callbacks
    const toRemove: string[] = [];
    for (const sub of matchingSubscriptions) {
      try {
        // Apply filter if present
        if (sub.filter && !sub.filter(event)) {
          continue;
        }

        sub.callback(event);

        // Mark for removal if once
        if (sub.once) {
          toRemove.push(sub.id);
        }
      } catch (error) {
        console.error(`EventBus: Error in subscriber ${sub.id} for ${event.type}:`, error);
      }
    }

    // Remove once subscriptions
    for (const id of toRemove) {
      this.subscriptions.delete(id);
    }
  }

  /**
   * Emit a simple event by type with optional data
   */
  emitSimple(
    type: GameEventType,
    category: GameEventCategory,
    data?: any,
    location?: GameEventBase['location']
  ): void {
    this.emit({
      id: this.generateEventId(),
      type,
      category,
      timestamp: Date.now(),
      location,
      data
    } as GameEvent);
  }

  // ============== CONVENIENCE EMIT METHODS ==============

  /**
   * Emit combat ended event
   */
  emitCombatEnded(data: CombatEndedEvent['data'], location?: GameEventBase['location']): void {
    this.emit({
      id: this.generateEventId(),
      type: 'combat:ended',
      category: 'combat',
      timestamp: Date.now(),
      location,
      data
    });
  }

  /**
   * Emit mission completed event
   */
  emitMissionCompleted(data: MissionCompletedEvent['data'], location?: GameEventBase['location']): void {
    this.emit({
      id: this.generateEventId(),
      type: 'mission:completed',
      category: 'mission',
      timestamp: Date.now(),
      location,
      data
    });
  }

  /**
   * Emit time passed event
   */
  emitTimePassed(
    type: 'time:hour-passed' | 'time:day-passed' | 'time:week-passed',
    data: TimePassedEvent['data']
  ): void {
    this.emit({
      id: this.generateEventId(),
      type,
      category: 'time',
      timestamp: Date.now(),
      data
    });
  }

  /**
   * Emit character hospitalized event
   */
  emitCharacterHospitalized(data: CharacterHospitalizedEvent['data']): void {
    this.emit({
      id: this.generateEventId(),
      type: 'character:hospitalized',
      category: 'character',
      timestamp: Date.now(),
      data
    });
  }

  /**
   * Emit reputation change event
   */
  emitReputationChanged(
    type: 'fame' | 'notoriety',
    data: ReputationChangedEvent['data']
  ): void {
    this.emit({
      id: this.generateEventId(),
      type: type === 'fame' ? 'reputation:fame-changed' : 'reputation:notoriety-changed',
      category: 'reputation',
      timestamp: Date.now(),
      data
    });
  }

  // ============== HISTORY METHODS ==============

  /**
   * Get event history, optionally filtered
   */
  getHistory(options?: {
    category?: GameEventCategory;
    type?: GameEventType;
    since?: number;
    limit?: number;
  }): GameEvent[] {
    let events = [...this.eventHistory];

    if (options?.category) {
      events = events.filter(e => e.category === options.category);
    }
    if (options?.type) {
      events = events.filter(e => e.type === options.type);
    }
    if (options?.since) {
      events = events.filter(e => e.timestamp >= options.since);
    }
    if (options?.limit) {
      events = events.slice(-options.limit);
    }

    return events;
  }

  /**
   * Get most recent events
   */
  getRecentEvents(count: number = 10): GameEvent[] {
    return this.eventHistory.slice(-count);
  }

  /**
   * Get events by category
   */
  getEventsByCategory(category: GameEventCategory, limit?: number): GameEvent[] {
    const events = this.eventHistory.filter(e => e.category === category);
    return limit ? events.slice(-limit) : events;
  }

  /**
   * Clear event history
   */
  clearHistory(): void {
    this.eventHistory = [];
    if (this.historyConfig.persistToStorage) {
      try {
        localStorage.removeItem(this.historyConfig.storageKey);
      } catch (e) {
        // Ignore storage errors
      }
    }
  }

  // ============== PERSISTENCE METHODS ==============

  /**
   * Configure event history persistence
   */
  configureHistory(config: Partial<EventHistoryConfig>): void {
    this.historyConfig = { ...this.historyConfig, ...config };

    // Load from storage if persistence is now enabled
    if (config.persistToStorage) {
      this.loadFromStorage();
    }
  }

  /**
   * Enable/disable automatic persistence
   */
  enablePersistence(enabled: boolean = true): void {
    this.historyConfig.persistToStorage = enabled;
    if (enabled) {
      this.loadFromStorage();
    }
  }

  /**
   * Save event history to localStorage
   */
  saveToStorage(): boolean {
    try {
      const eventsToSave = this.eventHistory.slice(-100); // Save last 100 events
      localStorage.setItem(
        this.historyConfig.storageKey,
        JSON.stringify({
          version: 1,
          savedAt: Date.now(),
          events: eventsToSave
        })
      );
      console.log(`[EventBus] Saved ${eventsToSave.length} events to storage`);
      return true;
    } catch (e) {
      console.error('[EventBus] Failed to save to storage:', e);
      return false;
    }
  }

  /**
   * Load event history from localStorage
   */
  loadFromStorage(): boolean {
    try {
      const saved = localStorage.getItem(this.historyConfig.storageKey);
      if (!saved) {
        console.log('[EventBus] No saved event history found');
        return false;
      }

      const parsed = JSON.parse(saved);

      // Handle both old format (array) and new format (object with metadata)
      const events = Array.isArray(parsed) ? parsed : parsed.events;

      if (!Array.isArray(events)) {
        console.warn('[EventBus] Invalid saved event history format');
        return false;
      }

      // Merge with existing history, avoiding duplicates
      const existingIds = new Set(this.eventHistory.map(e => e.id));
      const newEvents = events.filter((e: GameEvent) => !existingIds.has(e.id));

      if (newEvents.length > 0) {
        this.eventHistory = [...newEvents, ...this.eventHistory];
        // Trim to max
        if (this.eventHistory.length > this.historyConfig.maxEvents) {
          this.eventHistory = this.eventHistory.slice(-this.historyConfig.maxEvents);
        }
        console.log(`[EventBus] Loaded ${newEvents.length} events from storage`);
      }

      return true;
    } catch (e) {
      console.error('[EventBus] Failed to load from storage:', e);
      return false;
    }
  }

  /**
   * Export event history for game saves
   */
  exportHistory(): { version: number; events: GameEvent[]; exportedAt: number } {
    return {
      version: 1,
      events: this.eventHistory,
      exportedAt: Date.now()
    };
  }

  /**
   * Import event history from a game save
   */
  importHistory(data: { version: number; events: GameEvent[] }): boolean {
    if (!data || !Array.isArray(data.events)) {
      console.error('[EventBus] Invalid import data');
      return false;
    }

    this.eventHistory = data.events;
    console.log(`[EventBus] Imported ${data.events.length} events`);

    // Persist if enabled
    if (this.historyConfig.persistToStorage) {
      this.saveToStorage();
    }

    return true;
  }

  /**
   * Get statistics about event history
   */
  getHistoryStats(): {
    totalEvents: number;
    eventsByCategory: Record<string, number>;
    eventsByType: Record<string, number>;
    oldestEvent: number | null;
    newestEvent: number | null;
  } {
    const stats = {
      totalEvents: this.eventHistory.length,
      eventsByCategory: {} as Record<string, number>,
      eventsByType: {} as Record<string, number>,
      oldestEvent: null as number | null,
      newestEvent: null as number | null
    };

    for (const event of this.eventHistory) {
      // Count by category
      stats.eventsByCategory[event.category] = (stats.eventsByCategory[event.category] || 0) + 1;

      // Count by type
      stats.eventsByType[event.type] = (stats.eventsByType[event.type] || 0) + 1;

      // Track timestamps
      if (stats.oldestEvent === null || event.timestamp < stats.oldestEvent) {
        stats.oldestEvent = event.timestamp;
      }
      if (stats.newestEvent === null || event.timestamp > stats.newestEvent) {
        stats.newestEvent = event.timestamp;
      }
    }

    return stats;
  }

  // ============== CONTROL METHODS ==============

  /**
   * Pause event emission (events are queued)
   */
  pause(): void {
    this.paused = true;
  }

  /**
   * Resume event emission and process queued events
   */
  resume(): void {
    this.paused = false;
    while (this.eventQueue.length > 0) {
      const event = this.eventQueue.shift();
      if (event) this.emit(event);
    }
  }

  /**
   * Get subscription count
   */
  getSubscriptionCount(): number {
    return this.subscriptions.size;
  }

  /**
   * Get subscriptions for debugging
   */
  getSubscriptions(): EventSubscription[] {
    return Array.from(this.subscriptions.values());
  }

  // ============== PRIVATE METHODS ==============

  private generateEventId(): string {
    return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private addToHistory(event: GameEvent): void {
    this.eventHistory.push(event);

    // Trim history if needed
    if (this.eventHistory.length > this.historyConfig.maxEvents) {
      this.eventHistory = this.eventHistory.slice(-this.historyConfig.maxEvents);
    }

    // Persist if enabled
    if (this.historyConfig.persistToStorage) {
      try {
        localStorage.setItem(
          this.historyConfig.storageKey,
          JSON.stringify(this.eventHistory.slice(-100)) // Only persist last 100
        );
      } catch (e) {
        // Ignore storage errors
      }
    }
  }

  private getMatchingSubscriptions(event: GameEvent): EventSubscription[] {
    const matching: EventSubscription[] = [];

    for (const sub of this.subscriptions.values()) {
      if (this.subscriptionMatches(sub, event.type)) {
        matching.push(sub);
      }
    }

    // Sort by priority (higher first)
    matching.sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));

    return matching;
  }

  private subscriptionMatches(sub: EventSubscription, eventType: GameEventType): boolean {
    if (sub.eventType === '*') return true;
    if (sub.eventType === eventType) return true;
    if (Array.isArray(sub.eventType) && sub.eventType.includes(eventType)) return true;
    return false;
  }
}

// ============== SINGLETON EXPORT ==============

export const EventBus = new EventBusClass();

// ============== HELPER FUNCTIONS ==============

/**
 * Create a combat ended event from EnhancedCombatResult
 */
export function createCombatEndedEvent(
  result: {
    victory: boolean;
    casualties: Array<{ characterId: string; characterName: string }>;
    injuries: Array<{ characterId: string; characterName: string; severity: string; bodyPart: string }>;
    survivors: Array<{ characterId: string; characterName: string; currentHp: number; maxHp: number }>;
    totalDamageDealt: number;
    totalDamageTaken: number;
    rounds: number;
    fameChange: number;
    collateralDamage?: number;
  },
  location?: { sector?: string; city?: string; country?: string }
): CombatEndedEvent {
  return {
    id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type: 'combat:ended',
    category: 'combat',
    timestamp: Date.now(),
    location,
    data: {
      victory: result.victory,
      casualties: result.casualties.map(c => ({
        id: c.characterId,
        name: c.characterName,
        team: 'blue'
      })),
      injuries: result.injuries.map(i => ({
        id: i.characterId,
        name: i.characterName,
        severity: i.severity,
        bodyPart: i.bodyPart
      })),
      survivors: result.survivors.map(s => ({
        id: s.characterId,
        name: s.characterName,
        hp: s.currentHp,
        maxHp: s.maxHp
      })),
      damageDealt: result.totalDamageDealt,
      damageTaken: result.totalDamageTaken,
      duration: result.rounds * 6, // Assume 6 minutes per round
      fameChange: result.fameChange,
      collateralDamage: result.collateralDamage
    }
  };
}

export default EventBus;
