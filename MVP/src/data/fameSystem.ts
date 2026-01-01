/**
 * Fame & Infamy System (FM-005)
 *
 * Tracks how civilians react to the player based on public reputation.
 * Fame = recognized as hero, Infamy = feared as villain.
 *
 * Unlike faction standing (which is per-faction per-country),
 * fame/infamy spreads across regions and affects civilian behavior.
 */

import { getTimeEngine } from './timeEngine';
import { Country } from './countries';

// =============================================================================
// FAME TYPES
// =============================================================================

export type FameLevel =
  | 'unknown'       // 0-9: Nobody knows you
  | 'local'         // 10-29: Known in your city
  | 'regional'      // 30-49: Known in your country
  | 'national'      // 50-69: Famous in your country
  | 'international' // 70-89: Known worldwide
  | 'legendary';    // 90-100: Household name

export type ReputationType =
  | 'hero'          // Positive public image
  | 'neutral'       // Mixed or unknown
  | 'villain';      // Negative public image

export interface FameState {
  // Core metrics
  fame: number;           // 0-100, how well-known you are
  reputation: number;     // -100 to +100, hero to villain scale

  // Derived
  fameLevel: FameLevel;
  reputationType: ReputationType;

  // Regional breakdown
  regionFame: Record<string, number>;      // countryCode -> fame
  regionReputation: Record<string, number>; // countryCode -> reputation

  // History
  lastMajorEvent?: {
    timestamp: number;
    description: string;
    fameChange: number;
    reputationChange: number;
  };
}

// =============================================================================
// FAME LEVEL THRESHOLDS
// =============================================================================

export const FAME_THRESHOLDS: Array<{
  min: number;
  max: number;
  level: FameLevel;
  recognitionChance: number;
  icon: string;
}> = [
  { min: 90, max: 100, level: 'legendary', recognitionChance: 0.95, icon: '👑' },
  { min: 70, max: 89, level: 'international', recognitionChance: 0.70, icon: '🌍' },
  { min: 50, max: 69, level: 'national', recognitionChance: 0.50, icon: '🏆' },
  { min: 30, max: 49, level: 'regional', recognitionChance: 0.30, icon: '📰' },
  { min: 10, max: 29, level: 'local', recognitionChance: 0.15, icon: '📍' },
  { min: 0, max: 9, level: 'unknown', recognitionChance: 0.05, icon: '❓' },
];

// =============================================================================
// CIVILIAN REACTIONS
// =============================================================================

export type CivilianReaction =
  | 'worship'       // Ask for autograph, offer help
  | 'admire'        // Smile, wave, whisper excitedly
  | 'respect'       // Nod, step aside
  | 'neutral'       // Ignore
  | 'uneasy'        // Avoid eye contact, hurry past
  | 'fear'          // Run away, call police
  | 'terror';       // Scream, panic

export interface CivilianReactionResult {
  reaction: CivilianReaction;
  recognized: boolean;
  description: string;
  gameplayEffect?: {
    type: 'tip' | 'flee' | 'call_police' | 'offer_help' | 'none';
    value?: number;
  };
}

/**
 * Get civilian reaction based on fame and reputation
 */
export function getCivilianReaction(
  fame: number,
  reputation: number,
  countryCode: string,
  regionFame?: Record<string, number>,
  regionReputation?: Record<string, number>
): CivilianReactionResult {
  // Use regional values if available
  const effectiveFame = regionFame?.[countryCode] ?? fame;
  const effectiveReputation = regionReputation?.[countryCode] ?? reputation;

  // Check if recognized
  const fameInfo = FAME_THRESHOLDS.find(t => effectiveFame >= t.min && effectiveFame <= t.max);
  const recognitionChance = fameInfo?.recognitionChance ?? 0.05;
  const recognized = Math.random() < recognitionChance;

  if (!recognized) {
    return {
      reaction: 'neutral',
      recognized: false,
      description: 'The civilian pays you no attention.',
    };
  }

  // Determine reaction based on reputation
  if (effectiveReputation >= 75) {
    return {
      reaction: 'worship',
      recognized: true,
      description: 'Their eyes go wide with excitement. They recognize a true hero!',
      gameplayEffect: { type: 'offer_help', value: 10 },
    };
  }
  if (effectiveReputation >= 50) {
    return {
      reaction: 'admire',
      recognized: true,
      description: 'They smile and wave, clearly impressed to see you.',
      gameplayEffect: { type: 'tip', value: 5 },
    };
  }
  if (effectiveReputation >= 25) {
    return {
      reaction: 'respect',
      recognized: true,
      description: 'They nod respectfully and step aside.',
    };
  }
  if (effectiveReputation >= -25) {
    return {
      reaction: 'neutral',
      recognized: true,
      description: 'They glance at you uncertainly, unsure what to think.',
    };
  }
  if (effectiveReputation >= -50) {
    return {
      reaction: 'uneasy',
      recognized: true,
      description: 'They avoid eye contact and hurry past nervously.',
      gameplayEffect: { type: 'flee' },
    };
  }
  if (effectiveReputation >= -75) {
    return {
      reaction: 'fear',
      recognized: true,
      description: 'They back away quickly, reaching for their phone.',
      gameplayEffect: { type: 'call_police', value: 3 },
    };
  }

  return {
    reaction: 'terror',
    recognized: true,
    description: 'They scream and flee in panic!',
    gameplayEffect: { type: 'call_police', value: 1 },
  };
}

// =============================================================================
// FAME CHANGE CALCULATIONS
// =============================================================================

export interface FameEvent {
  type:
    | 'heroic_act'      // Saved lives, stopped villain
    | 'villain_act'     // Killed civilians, destroyed property
    | 'public_battle'   // Fought in public
    | 'media_coverage'  // News story about you
    | 'viral_moment'    // Social media spread
    | 'time_decay';     // Natural fade

  magnitude: 'minor' | 'moderate' | 'major' | 'legendary';
  wasPublic: boolean;
  location?: string;
  description: string;
}

const FAME_CHANGES: Record<FameEvent['type'], Record<FameEvent['magnitude'], {
  fameChange: number;
  reputationChange: number;
}>> = {
  heroic_act: {
    minor: { fameChange: 2, reputationChange: 5 },
    moderate: { fameChange: 5, reputationChange: 10 },
    major: { fameChange: 10, reputationChange: 20 },
    legendary: { fameChange: 25, reputationChange: 40 },
  },
  villain_act: {
    minor: { fameChange: 1, reputationChange: -5 },
    moderate: { fameChange: 3, reputationChange: -10 },
    major: { fameChange: 8, reputationChange: -25 },
    legendary: { fameChange: 20, reputationChange: -50 },
  },
  public_battle: {
    minor: { fameChange: 3, reputationChange: 0 },
    moderate: { fameChange: 7, reputationChange: 0 },
    major: { fameChange: 15, reputationChange: 0 },
    legendary: { fameChange: 30, reputationChange: 0 },
  },
  media_coverage: {
    minor: { fameChange: 5, reputationChange: 0 },
    moderate: { fameChange: 10, reputationChange: 0 },
    major: { fameChange: 20, reputationChange: 0 },
    legendary: { fameChange: 35, reputationChange: 0 },
  },
  viral_moment: {
    minor: { fameChange: 3, reputationChange: 0 },
    moderate: { fameChange: 8, reputationChange: 0 },
    major: { fameChange: 15, reputationChange: 0 },
    legendary: { fameChange: 25, reputationChange: 0 },
  },
  time_decay: {
    minor: { fameChange: -1, reputationChange: 0 },
    moderate: { fameChange: -2, reputationChange: 0 },
    major: { fameChange: -3, reputationChange: 0 },
    legendary: { fameChange: -5, reputationChange: 0 },
  },
};

/**
 * Calculate fame/reputation changes from an event
 */
export function calculateFameChange(event: FameEvent): {
  fameChange: number;
  reputationChange: number;
} {
  const baseChanges = FAME_CHANGES[event.type][event.magnitude];

  let fameChange = baseChanges.fameChange;
  let reputationChange = baseChanges.reputationChange;

  // Public events get more fame
  if (event.wasPublic) {
    fameChange = Math.round(fameChange * 1.5);
  }

  return { fameChange, reputationChange };
}

// =============================================================================
// FAME STATE MANAGEMENT
// =============================================================================

export function getFameLevel(fame: number): FameLevel {
  const info = FAME_THRESHOLDS.find(t => fame >= t.min && fame <= t.max);
  return info?.level ?? 'unknown';
}

export function getReputationType(reputation: number): ReputationType {
  if (reputation >= 25) return 'hero';
  if (reputation <= -25) return 'villain';
  return 'neutral';
}

/**
 * Apply a fame event to the current state
 */
export function applyFameEvent(
  state: FameState,
  event: FameEvent,
  timestamp: number
): FameState {
  const { fameChange, reputationChange } = calculateFameChange(event);

  const newFame = Math.max(0, Math.min(100, state.fame + fameChange));
  const newReputation = Math.max(-100, Math.min(100, state.reputation + reputationChange));

  // Update regional values if location specified
  const newRegionFame = { ...state.regionFame };
  const newRegionReputation = { ...state.regionReputation };

  if (event.location) {
    newRegionFame[event.location] = Math.max(0, Math.min(100,
      (newRegionFame[event.location] ?? state.fame) + Math.round(fameChange * 1.5)
    ));
    newRegionReputation[event.location] = Math.max(-100, Math.min(100,
      (newRegionReputation[event.location] ?? state.reputation) + Math.round(reputationChange * 1.5)
    ));
  }

  return {
    fame: newFame,
    reputation: newReputation,
    fameLevel: getFameLevel(newFame),
    reputationType: getReputationType(newReputation),
    regionFame: newRegionFame,
    regionReputation: newRegionReputation,
    lastMajorEvent: (Math.abs(fameChange) >= 5 || Math.abs(reputationChange) >= 10) ? {
      timestamp,
      description: event.description,
      fameChange,
      reputationChange,
    } : state.lastMajorEvent,
  };
}

/**
 * Create initial fame state
 */
export function createInitialFameState(): FameState {
  return {
    fame: 0,
    reputation: 0,
    fameLevel: 'unknown',
    reputationType: 'neutral',
    regionFame: {},
    regionReputation: {},
  };
}

// =============================================================================
// FAME MANAGER SINGLETON
// =============================================================================

let fameManagerInstance: FameManager | null = null;

export class FameManager {
  private state: FameState;
  private started: boolean = false;

  constructor() {
    this.state = createInitialFameState();
  }

  start(): void {
    if (this.started) return;
    this.started = true;

    // Subscribe to time for decay
    const timeEngine = getTimeEngine();
    timeEngine.on('day_change', () => {
      this.applyDailyDecay();
    });
  }

  getState(): FameState {
    return { ...this.state };
  }

  applyEvent(event: FameEvent): void {
    const timeEngine = getTimeEngine();
    const timestamp = timeEngine.getTime().totalHours;
    this.state = applyFameEvent(this.state, event, timestamp);
  }

  private applyDailyDecay(): void {
    // Fame decays 1 point per week if not active
    // More famous = faster decay (hard to stay at top)
    const decayAmount = this.state.fame >= 70 ? 2 : this.state.fame >= 40 ? 1 : 0;

    if (decayAmount > 0) {
      this.applyEvent({
        type: 'time_decay',
        magnitude: 'minor',
        wasPublic: false,
        description: 'Out of the spotlight',
      });
    }
  }

  getCivilianReaction(countryCode: string): CivilianReactionResult {
    return getCivilianReaction(
      this.state.fame,
      this.state.reputation,
      countryCode,
      this.state.regionFame,
      this.state.regionReputation
    );
  }

  /**
   * Get fame info for display
   */
  getFameDisplay(): {
    level: FameLevel;
    fame: number;
    reputation: number;
    type: ReputationType;
    icon: string;
    color: string;
  } {
    const fameInfo = FAME_THRESHOLDS.find(
      t => this.state.fame >= t.min && this.state.fame <= t.max
    );

    let color = '#9ca3af'; // Gray for neutral
    if (this.state.reputation >= 50) color = '#22c55e'; // Green for hero
    else if (this.state.reputation >= 25) color = '#3b82f6'; // Blue
    else if (this.state.reputation <= -50) color = '#ef4444'; // Red for villain
    else if (this.state.reputation <= -25) color = '#f97316'; // Orange

    return {
      level: this.state.fameLevel,
      fame: this.state.fame,
      reputation: this.state.reputation,
      type: this.state.reputationType,
      icon: fameInfo?.icon ?? '❓',
      color,
    };
  }
}

export function getFameManager(): FameManager {
  if (!fameManagerInstance) {
    fameManagerInstance = new FameManager();
  }
  return fameManagerInstance;
}

// =============================================================================
// EXPORTS
// =============================================================================

export default {
  getCivilianReaction,
  calculateFameChange,
  getFameLevel,
  getReputationType,
  applyFameEvent,
  createInitialFameState,
  getFameManager,
};
