/**
 * Reputation System - SuperHero Tactics
 *
 * Four-axis reputation tracking:
 * 1. Public Fame - General public recognition and opinion
 * 2. Government Standing - Official/legal status
 * 3. Criminal Rep - Underworld respect
 * 4. Heroic Standing - Hero community opinion
 *
 * Scale: -100 (Hated) to +100 (Legendary)
 *
 * Thresholds:
 * -100 to -75: Hated/Hunted
 * -74 to -50: Feared/Despised
 * -49 to -25: Disliked/Suspected
 * -24 to -1: Unknown (negative lean)
 * 0: Neutral
 * 1 to 24: Unknown (positive lean)
 * 25 to 49: Liked/Noticed
 * 50 to 74: Respected/Famous
 * 75 to 100: Revered/Legendary
 */

// ============================================================================
// CORE TYPES
// ============================================================================

export type ReputationAxis = 'public' | 'government' | 'criminal' | 'heroic';

export type ReputationTier =
  | 'hated'       // -100 to -75
  | 'feared'      // -74 to -50
  | 'disliked'    // -49 to -25
  | 'unknown_neg' // -24 to -1
  | 'neutral'     // 0
  | 'unknown_pos' // 1 to 24
  | 'liked'       // 25 to 49
  | 'respected'   // 50 to 74
  | 'legendary';  // 75 to 100

export interface ReputationState {
  public: number;      // -100 to +100
  government: number;  // -100 to +100
  criminal: number;    // -100 to +100
  heroic: number;      // -100 to +100
}

export interface ReputationChange {
  axis: ReputationAxis;
  amount: number;
  reason: string;
  timestamp: number;   // Game day
  hidden?: boolean;    // Player may not see some changes
}

export interface ReputationHistory {
  changes: ReputationChange[];
  maxHistory: number;
}

// ============================================================================
// AXIS DISPLAY INFO
// ============================================================================

export const AXIS_INFO: Record<ReputationAxis, {
  name: string;
  icon: string;
  color: string;
  description: string;
  positiveLabel: string;
  negativeLabel: string;
}> = {
  public: {
    name: 'Public Fame',
    icon: '📺',
    color: 'blue',
    description: 'How the general public perceives you.',
    positiveLabel: 'Beloved',
    negativeLabel: 'Reviled',
  },
  government: {
    name: 'Government Standing',
    icon: '🏛️',
    color: 'green',
    description: 'Your status with official authorities.',
    positiveLabel: 'Sanctioned',
    negativeLabel: 'Wanted',
  },
  criminal: {
    name: 'Criminal Rep',
    icon: '🎭',
    color: 'purple',
    description: 'Your reputation in the underworld.',
    positiveLabel: 'Respected',
    negativeLabel: 'Target',
  },
  heroic: {
    name: 'Hero Community',
    icon: '⚡',
    color: 'yellow',
    description: 'How other heroes view you.',
    positiveLabel: 'Champion',
    negativeLabel: 'Disgrace',
  },
};

// ============================================================================
// TIER THRESHOLDS
// ============================================================================

export const TIER_THRESHOLDS: { min: number; max: number; tier: ReputationTier }[] = [
  { min: -100, max: -75, tier: 'hated' },
  { min: -74, max: -50, tier: 'feared' },
  { min: -49, max: -25, tier: 'disliked' },
  { min: -24, max: -1, tier: 'unknown_neg' },
  { min: 0, max: 0, tier: 'neutral' },
  { min: 1, max: 24, tier: 'unknown_pos' },
  { min: 25, max: 49, tier: 'liked' },
  { min: 50, max: 74, tier: 'respected' },
  { min: 75, max: 100, tier: 'legendary' },
];

export const TIER_DISPLAY: Record<ReputationTier, {
  label: string;
  color: string;
  description: string;
}> = {
  hated: { label: 'Hated', color: 'red', description: 'Actively hunted or despised' },
  feared: { label: 'Feared', color: 'orange', description: 'Known threat, avoid at all costs' },
  disliked: { label: 'Disliked', color: 'yellow', description: 'Unfavorable opinion, cautious' },
  unknown_neg: { label: 'Unknown', color: 'gray', description: 'Mostly unknown, slight negative' },
  neutral: { label: 'Neutral', color: 'gray', description: 'Completely unknown' },
  unknown_pos: { label: 'Unknown', color: 'gray', description: 'Mostly unknown, slight positive' },
  liked: { label: 'Liked', color: 'lightgreen', description: 'Favorable opinion, helpful' },
  respected: { label: 'Respected', color: 'green', description: 'Well-regarded, opens doors' },
  legendary: { label: 'Legendary', color: 'gold', description: 'Iconic status, major influence' },
};

// ============================================================================
// REPUTATION EFFECTS BY AXIS
// ============================================================================

export const REPUTATION_EFFECTS: Record<ReputationAxis, {
  high: string[];        // Benefits at +50
  veryHigh: string[];    // Benefits at +75
  low: string[];         // Penalties at -50
  veryLow: string[];     // Penalties at -75
}> = {
  public: {
    high: [
      'Store prices -10%',
      'Fans may approach for autographs',
      'Positive media coverage',
      'Easier recruitment',
    ],
    veryHigh: [
      'Store prices -20%',
      'VIP treatment everywhere',
      'Sponsorship opportunities',
      'Celebrity status opens all doors',
      'Fan clubs provide tips and assistance',
    ],
    low: [
      'Store prices +10%',
      'Crowds may turn hostile',
      'Negative media coverage',
      'Recruitment harder',
    ],
    veryLow: [
      'Store prices +25%',
      'Mob attacks possible',
      'Media campaigns against you',
      'Recruitment nearly impossible',
      'Public bounties placed',
    ],
  },

  government: {
    high: [
      'Faster airport processing',
      'Police cooperation',
      'Access to government databases',
      'Official missions available',
    ],
    veryHigh: [
      'Full law enforcement cooperation',
      'Military equipment access',
      'Classified information access',
      'Government funding available',
      'Diplomatic immunity possible',
    ],
    low: [
      'Airport scrutiny, delays',
      'Police surveillance',
      'Restricted from government facilities',
      'Warrants may be issued',
    ],
    veryLow: [
      'Arrest on sight orders',
      'Bank accounts frozen',
      'Passport revoked',
      'Military response teams deployed',
      'International wanted status',
    ],
  },

  criminal: {
    high: [
      'Black market access',
      'Safe passage in criminal areas',
      'Underworld contacts available',
      'Inside information on crimes',
    ],
    veryHigh: [
      'Premium black market prices',
      'Criminal organizations offer alliances',
      'Assassination contracts available',
      'Money laundering services',
      'Safe houses everywhere',
    ],
    low: [
      'Black market closed',
      'Criminal areas dangerous',
      'Bounties placed by gangs',
      'Underworld enemies',
    ],
    veryLow: [
      'Hit squads sent after you',
      'All criminal contacts severed',
      'Cannot enter criminal territories',
      'Major bounty from syndicates',
      'Informants sell you out',
    ],
  },

  heroic: {
    high: [
      'Hero team-ups available',
      'Shared intelligence network',
      'Backup available on missions',
      'Training from senior heroes',
    ],
    veryHigh: [
      'Hero team invitations',
      'Sidekicks want to join you',
      'Legacy items may be gifted',
      'Full hero community support',
      'Mentor opportunities',
    ],
    low: [
      'Heroes refuse to work with you',
      'Excluded from hero networks',
      'No backup available',
      'Criticized by hero community',
    ],
    veryLow: [
      'Hero community actively opposes you',
      'Other heroes may attack on sight',
      'Treated as villain by heroes',
      'Hero teams hunt you',
      'Permanent blacklist',
    ],
  },
};

// ============================================================================
// DEFAULT STATE
// ============================================================================

export const DEFAULT_REPUTATION_STATE: ReputationState = {
  public: 0,
  government: 0,
  criminal: 0,
  heroic: 0,
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Clamp reputation value to valid range
 */
export function clampReputation(value: number): number {
  return Math.max(-100, Math.min(100, Math.round(value)));
}

/**
 * Get reputation tier from value
 */
export function getReputationTier(value: number): ReputationTier {
  for (const threshold of TIER_THRESHOLDS) {
    if (value >= threshold.min && value <= threshold.max) {
      return threshold.tier;
    }
  }
  return 'neutral';
}

/**
 * Get tier display info
 */
export function getTierDisplay(tier: ReputationTier) {
  return TIER_DISPLAY[tier];
}

/**
 * Create initial reputation state
 */
export function createInitialReputationState(
  overrides?: Partial<ReputationState>
): ReputationState {
  return {
    ...DEFAULT_REPUTATION_STATE,
    ...overrides,
  };
}

/**
 * Create initial reputation history
 */
export function createReputationHistory(): ReputationHistory {
  return {
    changes: [],
    maxHistory: 50,
  };
}

/**
 * Adjust reputation on a single axis
 */
export function adjustReputation(
  state: ReputationState,
  axis: ReputationAxis,
  amount: number
): ReputationState {
  return {
    ...state,
    [axis]: clampReputation(state[axis] + amount),
  };
}

/**
 * Adjust multiple reputation axes at once
 */
export function adjustMultipleReputation(
  state: ReputationState,
  changes: { axis: ReputationAxis; amount: number }[]
): ReputationState {
  let newState = { ...state };
  for (const change of changes) {
    newState = adjustReputation(newState, change.axis, change.amount);
  }
  return newState;
}

/**
 * Record a reputation change in history
 */
export function recordReputationChange(
  history: ReputationHistory,
  change: ReputationChange
): ReputationHistory {
  const newChanges = [change, ...history.changes];
  if (newChanges.length > history.maxHistory) {
    newChanges.pop();
  }
  return {
    ...history,
    changes: newChanges,
  };
}

/**
 * Get effects active for current reputation level
 */
export function getActiveEffects(
  state: ReputationState,
  axis: ReputationAxis
): string[] {
  const value = state[axis];
  const effects = REPUTATION_EFFECTS[axis];
  const active: string[] = [];

  if (value >= 75) {
    active.push(...effects.veryHigh, ...effects.high);
  } else if (value >= 50) {
    active.push(...effects.high);
  } else if (value <= -75) {
    active.push(...effects.veryLow, ...effects.low);
  } else if (value <= -50) {
    active.push(...effects.low);
  }

  return active;
}

/**
 * Get all active effects across all axes
 */
export function getAllActiveEffects(state: ReputationState): Record<ReputationAxis, string[]> {
  return {
    public: getActiveEffects(state, 'public'),
    government: getActiveEffects(state, 'government'),
    criminal: getActiveEffects(state, 'criminal'),
    heroic: getActiveEffects(state, 'heroic'),
  };
}

/**
 * Check if reputation meets a threshold
 */
export function meetsThreshold(
  state: ReputationState,
  axis: ReputationAxis,
  threshold: number
): boolean {
  return state[axis] >= threshold;
}

/**
 * Check if reputation is below a threshold
 */
export function belowThreshold(
  state: ReputationState,
  axis: ReputationAxis,
  threshold: number
): boolean {
  return state[axis] < threshold;
}

// ============================================================================
// REPUTATION MODIFIERS
// ============================================================================

/**
 * Calculate price modifier from public reputation
 */
export function getPriceModifier(publicRep: number): number {
  if (publicRep >= 75) return 0.80;  // 20% discount
  if (publicRep >= 50) return 0.90;  // 10% discount
  if (publicRep <= -75) return 1.25; // 25% markup
  if (publicRep <= -50) return 1.10; // 10% markup
  return 1.0;
}

/**
 * Calculate recruitment modifier from reputation
 */
export function getRecruitmentModifier(state: ReputationState): number {
  // Average of public and heroic reputation
  const avgRep = (state.public + state.heroic) / 2;

  if (avgRep >= 75) return 1.5;   // 50% bonus
  if (avgRep >= 50) return 1.25;  // 25% bonus
  if (avgRep <= -75) return 0.5;  // 50% penalty
  if (avgRep <= -50) return 0.75; // 25% penalty
  return 1.0;
}

/**
 * Check if government arrest is likely
 */
export function isArrestRisk(governmentRep: number): boolean {
  return governmentRep <= -50;
}

/**
 * Check if criminal hit squads are a risk
 */
export function isHitSquadRisk(criminalRep: number): boolean {
  return criminalRep <= -75;
}

/**
 * Check if heroes might attack
 */
export function isHeroHostileRisk(heroicRep: number): boolean {
  return heroicRep <= -75;
}

// ============================================================================
// ACTION -> REPUTATION MAPPINGS
// ============================================================================

export type ReputationAction =
  | 'save_civilians'
  | 'defeat_villain'
  | 'property_damage'
  | 'civilian_casualties'
  | 'work_with_police'
  | 'defy_authorities'
  | 'criminal_activity'
  | 'expose_corruption'
  | 'media_interview'
  | 'charity_work'
  | 'mercenary_work'
  | 'vigilante_justice'
  | 'team_up_heroes'
  | 'betray_heroes'
  | 'help_criminals'
  | 'fight_criminals'
  // Education actions
  | 'education_certificate'
  | 'education_associate'
  | 'education_bachelor'
  | 'education_master'
  | 'education_doctorate'
  | 'education_military'
  | 'education_criminal'
  | 'education_dropout';

export const ACTION_REPUTATION_CHANGES: Record<ReputationAction, {
  public: number;
  government: number;
  criminal: number;
  heroic: number;
}> = {
  save_civilians: { public: 10, government: 5, criminal: -5, heroic: 10 },
  defeat_villain: { public: 15, government: 10, criminal: -10, heroic: 15 },
  property_damage: { public: -10, government: -5, criminal: 0, heroic: -5 },
  civilian_casualties: { public: -25, government: -20, criminal: 5, heroic: -25 },
  work_with_police: { public: 5, government: 15, criminal: -15, heroic: 5 },
  defy_authorities: { public: 5, government: -20, criminal: 10, heroic: -5 },
  criminal_activity: { public: -15, government: -20, criminal: 15, heroic: -20 },
  expose_corruption: { public: 20, government: -10, criminal: -10, heroic: 15 },
  media_interview: { public: 10, government: 0, criminal: -5, heroic: 5 },
  charity_work: { public: 10, government: 5, criminal: -5, heroic: 10 },
  mercenary_work: { public: -5, government: -5, criminal: 10, heroic: -10 },
  vigilante_justice: { public: 0, government: -15, criminal: -10, heroic: -5 },
  team_up_heroes: { public: 5, government: 5, criminal: -5, heroic: 15 },
  betray_heroes: { public: -20, government: 0, criminal: 15, heroic: -50 },
  help_criminals: { public: -15, government: -15, criminal: 20, heroic: -20 },
  fight_criminals: { public: 10, government: 10, criminal: -20, heroic: 10 },
  // Education actions - reputation gains on training completion
  education_certificate: { public: 3, government: 2, criminal: 0, heroic: 2 },
  education_associate: { public: 5, government: 3, criminal: 0, heroic: 3 },
  education_bachelor: { public: 10, government: 5, criminal: 0, heroic: 5 },
  education_master: { public: 15, government: 8, criminal: 0, heroic: 10 },
  education_doctorate: { public: 20, government: 12, criminal: 0, heroic: 15 },
  education_military: { public: 5, government: 20, criminal: -5, heroic: 10 },
  education_criminal: { public: -5, government: -10, criminal: 15, heroic: -5 },
  education_dropout: { public: -5, government: -3, criminal: 0, heroic: -3 },
};

/**
 * Apply reputation changes from an action
 */
export function applyActionReputation(
  state: ReputationState,
  action: ReputationAction,
  multiplier: number = 1
): ReputationState {
  const changes = ACTION_REPUTATION_CHANGES[action];
  return adjustMultipleReputation(state, [
    { axis: 'public', amount: changes.public * multiplier },
    { axis: 'government', amount: changes.government * multiplier },
    { axis: 'criminal', amount: changes.criminal * multiplier },
    { axis: 'heroic', amount: changes.heroic * multiplier },
  ]);
}

// ============================================================================
// FORMAT FUNCTIONS
// ============================================================================

/**
 * Format reputation value for display
 */
export function formatReputation(value: number): string {
  const sign = value > 0 ? '+' : '';
  return `${sign}${value}`;
}

/**
 * Get reputation description
 */
export function getReputationDescription(axis: ReputationAxis, value: number): string {
  const tier = getReputationTier(value);
  const info = AXIS_INFO[axis];

  if (value > 0) {
    return `${info.positiveLabel} (${formatReputation(value)})`;
  } else if (value < 0) {
    return `${info.negativeLabel} (${formatReputation(value)})`;
  }
  return 'Neutral';
}

/**
 * Get summary of all reputations
 */
export function getReputationSummary(state: ReputationState): string[] {
  return [
    `Public: ${getReputationDescription('public', state.public)}`,
    `Government: ${getReputationDescription('government', state.government)}`,
    `Criminal: ${getReputationDescription('criminal', state.criminal)}`,
    `Heroic: ${getReputationDescription('heroic', state.heroic)}`,
  ];
}

// ============================================================================
// DECAY SYSTEM
// ============================================================================

/**
 * Apply reputation decay over time
 * Extreme reputations slowly drift toward neutral
 */
export function applyReputationDecay(
  state: ReputationState,
  daysElapsed: number,
  decayRate: number = 0.5
): ReputationState {
  const decay = (value: number): number => {
    if (Math.abs(value) <= 25) return value; // No decay for low values

    const decayAmount = Math.sign(value) * decayRate * daysElapsed;
    const newValue = value - decayAmount;

    // Don't cross zero from decay
    if (Math.sign(newValue) !== Math.sign(value) && value !== 0) {
      return 0;
    }

    return clampReputation(newValue);
  };

  return {
    public: decay(state.public),
    government: decay(state.government),
    criminal: decay(state.criminal),
    heroic: decay(state.heroic),
  };
}

// ============================================================================
// MILESTONE CHECKS
// ============================================================================

export interface ReputationMilestone {
  axis: ReputationAxis;
  threshold: number;
  name: string;
  reached: boolean;
}

/**
 * Check for newly reached milestones
 */
export function checkMilestones(
  oldState: ReputationState,
  newState: ReputationState
): ReputationMilestone[] {
  const milestones: ReputationMilestone[] = [];
  const axes: ReputationAxis[] = ['public', 'government', 'criminal', 'heroic'];
  const thresholds = [25, 50, 75, -25, -50, -75];

  for (const axis of axes) {
    for (const threshold of thresholds) {
      const wasBelow = threshold > 0
        ? oldState[axis] < threshold
        : oldState[axis] > threshold;
      const isNow = threshold > 0
        ? newState[axis] >= threshold
        : newState[axis] <= threshold;

      if (wasBelow && isNow) {
        const tierAtThreshold = getReputationTier(threshold);
        const tierInfo = getTierDisplay(tierAtThreshold);
        milestones.push({
          axis,
          threshold,
          name: `${AXIS_INFO[axis].name}: ${tierInfo.label}`,
          reached: true,
        });
      }
    }
  }

  return milestones;
}
