/**
 * Doom Clock System
 *
 * XCOM 2 Avatar Project-style meta-progression urgency mechanic.
 * A criminal mastermind is working toward "The Plan" - a progress bar
 * that creates strategic pressure for the player.
 *
 * The Plan progresses automatically based on:
 * - Time passing
 * - Shadow network activity
 * - Player ignoring criminal organizations
 *
 * The Plan can be slowed by:
 * - Completing missions targeting the mastermind
 * - Disrupting shadow network operations
 * - Arresting key lieutenants
 *
 * Threshold Events:
 * - 25%: News reports hint at coordinated activity
 * - 50%: Major criminal alliance formed
 * - 75%: Critical infrastructure targeted
 * - 100%: Catastrophic event - game over or major setback
 */

// ============ DOOM CLOCK STATE ============

export interface DoomClockState {
  // Progress toward "The Plan" (0-100)
  progress: number;

  // Rate of progress per week (base: 2)
  baseProgressRate: number;

  // Current mastermind info
  mastermind: {
    name: string;
    alias: string;
    organization: string;
    isRevealed: boolean;  // Player knows who they are
  };

  // Threshold tracking
  thresholdsPassed: {
    intel: boolean;     // 25% - hints appear
    alliance: boolean;  // 50% - factions unite
    crisis: boolean;    // 75% - infrastructure attack
    endgame: boolean;   // 100% - catastrophe
  };

  // Actions taken to slow the clock
  setbacks: number;  // Number of setbacks dealt to the mastermind
  lastSetbackWeek: number;

  // Whether the doom clock is active
  isActive: boolean;
}

// ============ DOOM CLOCK CONFIG ============

export const DOOM_CLOCK_CONFIG = {
  // Progress per week if no player intervention
  baseProgressPerWeek: 2,

  // Bonus progress from shadow network activity
  shadowNetworkBonus: 0.5,  // +0.5 per active shadow network

  // Progress reduction from player missions
  missionSetbackAmount: 5,  // -5 progress per relevant mission

  // Weekly decay of progress (small) if player is active
  activePlayerDecay: 0.5,

  // Threshold percentages
  thresholds: {
    intel: 25,
    alliance: 50,
    crisis: 75,
    endgame: 100,
  },

  // Maximum progress reduction per week
  maxWeeklyReduction: 10,
};

// ============ MASTERMIND NAMES ============

const MASTERMIND_NAMES = [
  { name: 'Viktor Volkov', alias: 'The Architect', organization: 'The Consortium' },
  { name: 'Aria Chen', alias: 'Ghost Protocol', organization: 'Digital Shadow' },
  { name: 'Marcus Blackwood', alias: 'The Collector', organization: 'The Foundation' },
  { name: 'Svetlana Morozova', alias: 'Iron Widow', organization: 'Red Veil' },
  { name: 'Omar Hassan', alias: 'The Phantom', organization: 'Silent Hand' },
  { name: 'Elena Vasquez', alias: 'La Sombra', organization: 'Nuevo Orden' },
  { name: 'Jin Takeda', alias: 'Ronin', organization: 'Shadow Shogunate' },
  { name: 'Dr. Helena Cross', alias: 'The Surgeon', organization: 'The Clinic' },
];

// ============ THRESHOLD EVENTS ============

export interface ThresholdEvent {
  threshold: number;
  name: string;
  description: string;
  consequence: string;
}

export const THRESHOLD_EVENTS: ThresholdEvent[] = [
  {
    threshold: 25,
    name: 'Intelligence Chatter',
    description: 'Intercepted communications suggest a coordinated operation.',
    consequence: 'News articles begin hinting at shadow organization activity.',
  },
  {
    threshold: 50,
    name: 'The Alliance',
    description: 'Multiple criminal organizations have united under a single banner.',
    consequence: 'Criminal orgs become more coordinated. +50% heat reduction from bribes.',
  },
  {
    threshold: 75,
    name: 'Critical Strike',
    description: 'A major attack on infrastructure has been launched.',
    consequence: 'One random country suffers -20 to all stats for 4 weeks.',
  },
  {
    threshold: 100,
    name: 'The Plan Complete',
    description: 'The mastermind has achieved their goal.',
    consequence: 'Game over or massive setback depending on difficulty.',
  },
];

// ============ DOOM CLOCK FUNCTIONS ============

/**
 * Create initial doom clock state.
 */
export function createInitialDoomClockState(): DoomClockState {
  // Pick random mastermind
  const mastermind = MASTERMIND_NAMES[Math.floor(Math.random() * MASTERMIND_NAMES.length)];

  return {
    progress: 0,
    baseProgressRate: DOOM_CLOCK_CONFIG.baseProgressPerWeek,
    mastermind: {
      name: mastermind.name,
      alias: mastermind.alias,
      organization: mastermind.organization,
      isRevealed: false,
    },
    thresholdsPassed: {
      intel: false,
      alliance: false,
      crisis: false,
      endgame: false,
    },
    setbacks: 0,
    lastSetbackWeek: 0,
    isActive: true,
  };
}

/**
 * Calculate weekly progress of the doom clock.
 *
 * @param state - Current doom clock state
 * @param shadowNetworkCount - Number of active shadow networks
 * @param playerMissionsThisWeek - Relevant missions completed
 * @returns New progress value and any threshold events triggered
 */
export function calculateWeeklyProgress(
  state: DoomClockState,
  shadowNetworkCount: number = 0,
  playerMissionsThisWeek: number = 0
): { newProgress: number; eventsTriggered: ThresholdEvent[] } {
  if (!state.isActive) {
    return { newProgress: state.progress, eventsTriggered: [] };
  }

  // Base progress
  let progressDelta = state.baseProgressRate;

  // Shadow network bonus
  progressDelta += shadowNetworkCount * DOOM_CLOCK_CONFIG.shadowNetworkBonus;

  // Player mission reduction
  const missionReduction = playerMissionsThisWeek * DOOM_CLOCK_CONFIG.missionSetbackAmount;
  progressDelta -= Math.min(missionReduction, DOOM_CLOCK_CONFIG.maxWeeklyReduction);

  // Active player decay (if they're doing anything)
  if (playerMissionsThisWeek > 0) {
    progressDelta -= DOOM_CLOCK_CONFIG.activePlayerDecay;
  }

  // Calculate new progress (clamp 0-100)
  const newProgress = Math.max(0, Math.min(100, state.progress + progressDelta));

  // Check for threshold events
  const eventsTriggered: ThresholdEvent[] = [];

  for (const event of THRESHOLD_EVENTS) {
    // Check if we crossed this threshold
    if (newProgress >= event.threshold && state.progress < event.threshold) {
      eventsTriggered.push(event);
    }
  }

  return { newProgress, eventsTriggered };
}

/**
 * Apply a setback to the doom clock.
 * Called when player completes a major mission against the mastermind.
 *
 * @param state - Current doom clock state
 * @param amount - Amount to reduce progress (default: 5)
 * @param currentWeek - Current game week
 * @returns Updated doom clock state
 */
export function applySetback(
  state: DoomClockState,
  amount: number = DOOM_CLOCK_CONFIG.missionSetbackAmount,
  currentWeek: number
): DoomClockState {
  const newProgress = Math.max(0, state.progress - amount);

  return {
    ...state,
    progress: newProgress,
    setbacks: state.setbacks + 1,
    lastSetbackWeek: currentWeek,
  };
}

/**
 * Reveal the mastermind's identity.
 * Called when player completes investigation or reaches certain story point.
 */
export function revealMastermind(state: DoomClockState): DoomClockState {
  return {
    ...state,
    mastermind: {
      ...state.mastermind,
      isRevealed: true,
    },
  };
}

/**
 * Get the current threat level based on progress.
 */
export function getThreatLevel(progress: number): 'minimal' | 'low' | 'moderate' | 'high' | 'critical' {
  if (progress < 25) return 'minimal';
  if (progress < 50) return 'low';
  if (progress < 75) return 'moderate';
  if (progress < 90) return 'high';
  return 'critical';
}

/**
 * Get a description of the current doom clock status.
 */
export function getDoomClockDescription(state: DoomClockState): string {
  const threat = getThreatLevel(state.progress);

  const descriptions: Record<string, string> = {
    minimal: 'Intelligence suggests something is brewing in the shadows, but details are scarce.',
    low: 'Coordinated criminal activity has been detected. Someone is pulling strings.',
    moderate: 'A shadow organization has united multiple criminal groups. The threat is real.',
    high: 'Critical infrastructure is at risk. Time is running out to stop The Plan.',
    critical: 'The mastermind is on the verge of victory. Immediate action required!',
  };

  return descriptions[threat];
}

/**
 * Check if the doom clock has reached game over.
 */
export function isGameOver(state: DoomClockState): boolean {
  return state.progress >= 100 && state.isActive;
}

/**
 * Get the color for UI display based on threat level.
 */
export function getDoomClockColor(progress: number): string {
  if (progress < 25) return '#4ade80';  // green
  if (progress < 50) return '#facc15';  // yellow
  if (progress < 75) return '#fb923c';  // orange
  if (progress < 90) return '#ef4444';  // red
  return '#dc2626';  // dark red (pulsing)
}

/**
 * Generate news article about doom clock progress.
 */
export function generateDoomClockNews(
  state: DoomClockState,
  thresholdEvent?: ThresholdEvent
): { headline: string; body: string; category: string } {
  if (thresholdEvent) {
    return {
      headline: thresholdEvent.name,
      body: `${thresholdEvent.description} ${thresholdEvent.consequence}`,
      category: 'doom_clock',
    };
  }

  const threat = getThreatLevel(state.progress);
  const alias = state.mastermind.isRevealed
    ? `${state.mastermind.name} (${state.mastermind.alias})`
    : 'Unknown Mastermind';

  const headlines: Record<string, string> = {
    minimal: 'Authorities Report Unusual Criminal Coordination',
    low: 'Shadow Organization Linked to Multiple Crime Rings',
    moderate: `${state.mastermind.organization} Alliance Threatens Regional Stability`,
    high: 'Critical Infrastructure Under Threat from Organized Crime',
    critical: `Final Phase: ${alias} Approaches Victory`,
  };

  return {
    headline: headlines[threat],
    body: getDoomClockDescription(state),
    category: 'doom_clock',
  };
}
