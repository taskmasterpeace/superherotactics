/**
 * Escalation & Heat System
 *
 * GTA-style "wanted stars" meets XCOM extraction zones.
 *
 * Core concepts:
 * 1. HEAT - Accumulates from combat actions (gunfire, explosions, civilian harm)
 * 2. RESPONSE TIME - Based on city stats + heat level
 * 3. REINFORCEMENT WAVES - Any faction can send backup with configurable ETA
 * 4. EXTRACTION ZONES - XCOM-style "get here to leave"
 *
 * Example flow:
 * - Turn 1: Combat starts, heat = 0
 * - Turn 3: Gunfire detected, heat += 10
 * - Turn 5: Explosion, heat += 30, police ETA calculated (5 turns)
 * - Turn 7: "Police arriving in 3 turns" warning
 * - Turn 10: Police arrive from south
 * - Turn 12: Player extracts north OR fights police
 *
 * Integration Points:
 * - cities.ts: crimeIndex, safetyIndex -> response modifiers
 * - countries.ts: lawEnforcement, militaryBudget, corruption -> response times
 * - combinedEffects.ts: SurveillanceSystem.heatDecayRate -> heat decay
 * - factionSystem.ts: standings -> faction hostility
 */

import { City, getCityByName } from '../data/cities';
import { Country, getCountryByName, getCountryByCode } from '../data/countries';
import { calculateSurveillance } from '../data/combinedEffects';

// ============================================================================
// HEAT SYSTEM (GTA Stars)
// ============================================================================

export interface HeatState {
  current: number;           // 0-100 heat level
  maxReached: number;        // Highest heat this combat
  sources: HeatSource[];     // What caused the heat
  decayRate: number;         // How fast heat drops per turn of no action
  lastActionTurn: number;    // When was last heat-generating action
}

export interface HeatSource {
  turn: number;
  action: string;
  heatAdded: number;
  location?: { x: number; y: number };
}

// Heat values for different actions
export const HEAT_VALUES: Record<string, number> = {
  // Gunfire
  'pistol_shot': 5,
  'rifle_shot': 8,
  'shotgun_shot': 10,
  'sniper_shot': 12,
  'automatic_fire': 15,

  // Explosions
  'grenade': 25,
  'explosive': 35,
  'rpg': 50,
  'vehicle_explosion': 60,

  // Special
  'civilian_casualty': 40,
  'civilian_injured': 20,
  'property_damage': 10,
  'power_use_visible': 15,      // Superhuman powers seen by witnesses
  'power_use_destructive': 30,  // Powers that cause visible damage

  // Positive (reduce heat)
  'stealth_kill': -5,           // Silent takedown
  'non_lethal': -3,             // Taser, tranq
  'turn_no_action': -2,         // Quiet turn
};

// ============================================================================
// CHARACTER STAT MODIFIERS (Ian's Requirement)
// High INS = cleaner operators who generate less heat
// ============================================================================

/**
 * Unit interface for heat calculation (subset of SimUnit)
 * Using a subset to avoid circular dependencies
 */
export interface HeatModifierUnit {
  stats?: {
    INS?: number;  // Insight - awareness, perception, clean operations
  };
  weapon?: {
    suppressedModifiers?: {
      soundReduction?: number;  // If present, weapon is suppressed
    };
    damageType?: string;        // 'STUN' = non-lethal
    type?: string;              // Weapon type
  };
}

/**
 * Calculate actual heat generated from an action, modified by unit stats
 *
 * Ian's Philosophy: "Stats should feel like POWER"
 * - High INS operators are cleaner, more aware of cameras/witnesses
 * - Suppressed weapons are quieter, generate less attention
 * - Non-lethal takedowns don't trigger 911 calls
 *
 * @param baseHeat - Base heat value from HEAT_VALUES
 * @param unit - The unit performing the action
 * @returns Modified heat value (can be 0 for very clean operators)
 */
export function calculateHeatGenerated(baseHeat: number, unit?: HeatModifierUnit): number {
  if (!unit || baseHeat <= 0) return baseHeat;

  let modifier = 1.0;

  // INS (Insight) reduces heat - experienced operators are cleaner
  // INS 30+ = elite level, knows cameras, witness patterns, timing
  // INS 20+ = professional level, generally careful
  const ins = unit.stats?.INS ?? 0;
  if (ins >= 30) {
    modifier *= 0.75;  // -25% heat
  } else if (ins >= 20) {
    modifier *= 0.85;  // -15% heat
  } else if (ins >= 15) {
    modifier *= 0.95;  // -5% heat (slight benefit)
  }

  // Suppressed weapons dramatically reduce heat
  // A gunshot that nobody hears barely registers
  if (unit.weapon?.suppressedModifiers?.soundReduction) {
    modifier *= 0.5;   // -50% heat
  }

  // Non-lethal weapons generate much less heat
  // A tased person vs a shot person = very different 911 call
  if (unit.weapon?.damageType === 'STUN') {
    modifier *= 0.3;   // -70% heat
  }

  // Melee/unarmed is quieter than guns (but still noticed)
  const weaponType = unit.weapon?.type?.toLowerCase() || '';
  if (weaponType.includes('melee') || weaponType.includes('knife') || weaponType === 'unarmed') {
    modifier *= 0.6;   // -40% heat
  }

  return Math.round(baseHeat * modifier);
}

/**
 * Get heat modifier explanation for UI
 * Helps players understand why their heat generation changed
 */
export function getHeatModifierBreakdown(unit: HeatModifierUnit): {
  totalModifier: number;
  factors: Array<{ name: string; modifier: number; description: string }>;
} {
  const factors: Array<{ name: string; modifier: number; description: string }> = [];
  let totalModifier = 1.0;

  const ins = unit.stats?.INS ?? 0;
  if (ins >= 30) {
    factors.push({ name: 'Elite INS', modifier: 0.75, description: 'Elite awareness, knows cameras/witnesses' });
    totalModifier *= 0.75;
  } else if (ins >= 20) {
    factors.push({ name: 'High INS', modifier: 0.85, description: 'Professional-level caution' });
    totalModifier *= 0.85;
  } else if (ins >= 15) {
    factors.push({ name: 'Good INS', modifier: 0.95, description: 'Slightly more careful' });
    totalModifier *= 0.95;
  }

  if (unit.weapon?.suppressedModifiers?.soundReduction) {
    factors.push({ name: 'Suppressed', modifier: 0.5, description: 'Silenced weapon' });
    totalModifier *= 0.5;
  }

  if (unit.weapon?.damageType === 'STUN') {
    factors.push({ name: 'Non-Lethal', modifier: 0.3, description: 'Stun weapons draw less attention' });
    totalModifier *= 0.3;
  }

  const weaponType = unit.weapon?.type?.toLowerCase() || '';
  if (weaponType.includes('melee') || weaponType.includes('knife') || weaponType === 'unarmed') {
    factors.push({ name: 'Melee', modifier: 0.6, description: 'Quiet close combat' });
    totalModifier *= 0.6;
  }

  return { totalModifier, factors };
}

/**
 * Initialize heat state for combat
 */
export function initializeHeat(cityLawEnforcement: number = 50): HeatState {
  return {
    current: 0,
    maxReached: 0,
    sources: [],
    decayRate: Math.max(1, Math.floor(cityLawEnforcement / 25)), // Higher law = faster decay
    lastActionTurn: 0,
  };
}

/**
 * Add heat from an action
 */
export function addHeat(
  state: HeatState,
  action: string,
  turn: number,
  location?: { x: number; y: number }
): HeatState {
  const heatValue = HEAT_VALUES[action] || 5;

  const newCurrent = Math.max(0, Math.min(100, state.current + heatValue));

  return {
    ...state,
    current: newCurrent,
    maxReached: Math.max(state.maxReached, newCurrent),
    sources: [...state.sources, { turn, action, heatAdded: heatValue, location }],
    lastActionTurn: turn,
  };
}

/**
 * Apply heat decay at end of turn
 */
export function applyHeatDecay(state: HeatState, currentTurn: number): HeatState {
  // No decay if action happened this turn
  if (state.lastActionTurn === currentTurn) return state;

  // Decay heat
  const turnsQuiet = currentTurn - state.lastActionTurn;
  const decay = state.decayRate * turnsQuiet;

  return {
    ...state,
    current: Math.max(0, state.current - decay),
  };
}

/**
 * Get "star" level (0-5) from heat
 */
export function getHeatStars(heat: number): number {
  if (heat >= 80) return 5;  // Maximum response
  if (heat >= 60) return 4;  // Heavy response
  if (heat >= 40) return 3;  // Moderate response
  if (heat >= 20) return 2;  // Light response
  if (heat >= 10) return 1;  // Minimal response
  return 0;                   // No response
}

// ============================================================================
// RESPONSE TIME CALCULATION
// ============================================================================

export interface CityResponseProfile {
  lawEnforcement: number;     // 0-100, higher = faster response
  crimeIndex: number;         // 0-100, higher = slower response (busy)
  militaryPresence: number;   // 0-100, affects military response
  superhumanRegistry: boolean; // Does city track supers?
}

export interface ResponseTime {
  factionId: string;
  baseTurns: number;          // Before modifiers
  modifiedTurns: number;      // After city/heat modifiers
  reason: string;             // Why this response
  waveSize: number;           // How many units
}

/**
 * Calculate response time based on city profile and heat
 */
export function calculateResponseTime(
  factionId: string,
  heat: number,
  cityProfile: CityResponseProfile
): ResponseTime {
  const stars = getHeatStars(heat);

  // Base response times by faction
  const baseTimes: Record<string, number> = {
    'police': 8,       // Police arrive in ~8 turns base
    'swat': 12,        // SWAT takes longer to mobilize
    'military': 20,    // Military is slowest
    'private_security': 5, // Corporate security is fast
    'gang': 4,         // Gangs respond quickly to turf threats
  };

  const baseTurns = baseTimes[factionId] || 10;

  // Modifiers
  let modifier = 1.0;

  // Higher law enforcement = faster response
  modifier *= (150 - cityProfile.lawEnforcement) / 100;

  // Higher crime = slower response (police are busy)
  modifier *= (50 + cityProfile.crimeIndex) / 100;

  // Heat level speeds up response
  const heatSpeedup = 1 - (stars * 0.1); // Each star = 10% faster
  modifier *= heatSpeedup;

  const modifiedTurns = Math.max(2, Math.round(baseTurns * modifier));

  // Wave size based on stars
  const waveSizes: Record<string, number[]> = {
    'police': [0, 2, 3, 4, 6, 8],      // 0-5 stars
    'swat': [0, 0, 0, 4, 6, 8],        // Only at 3+ stars
    'military': [0, 0, 0, 0, 8, 12],   // Only at 4+ stars
    'private_security': [0, 2, 4, 6, 8, 10],
    'gang': [0, 3, 5, 7, 10, 15],
  };

  const waveSize = (waveSizes[factionId] || [0, 2, 4, 6, 8, 10])[stars];

  return {
    factionId,
    baseTurns,
    modifiedTurns,
    reason: getResponseReason(factionId, stars),
    waveSize,
  };
}

function getResponseReason(factionId: string, stars: number): string {
  if (stars === 0) return 'No response warranted';

  const reasons: Record<string, string[]> = {
    'police': [
      '',
      'Noise complaint reported',
      'Shots fired call',
      'Multiple 911 calls',
      'Officer down / Major incident',
      'Full mobilization',
    ],
    'swat': [
      '', '', '',
      'Tactical response authorized',
      'Heavy weapons detected',
      'Maximum force authorized',
    ],
    'military': [
      '', '', '', '',
      'National Guard activated',
      'Full military response',
    ],
  };

  return (reasons[factionId] || reasons['police'])[stars] || 'Response triggered';
}

// ============================================================================
// REINFORCEMENT QUEUE
// ============================================================================

export interface ReinforcementQueue {
  waves: ScheduledWave[];
  warningTurns: number;       // How many turns before arrival to warn
}

export interface ScheduledWave {
  id: string;
  factionId: string;
  arrivalTurn: number;
  size: number;
  entryPoint: 'north' | 'south' | 'east' | 'west' | 'roof' | 'underground';
  reason: string;
  announced: boolean;
  canCancel: boolean;         // Can player actions prevent this?
  cancelCondition?: string;   // What would cancel it
}

/**
 * Schedule a reinforcement wave
 */
export function scheduleWave(
  queue: ReinforcementQueue,
  factionId: string,
  currentTurn: number,
  eta: number,
  size: number,
  reason: string,
  options?: {
    entryPoint?: ScheduledWave['entryPoint'];
    canCancel?: boolean;
    cancelCondition?: string;
  }
): ReinforcementQueue {
  const wave: ScheduledWave = {
    id: `wave-${factionId}-${Date.now()}`,
    factionId,
    arrivalTurn: currentTurn + eta,
    size,
    entryPoint: options?.entryPoint || 'south',
    reason,
    announced: false,
    canCancel: options?.canCancel ?? false,
    cancelCondition: options?.cancelCondition,
  };

  return {
    ...queue,
    waves: [...queue.waves, wave],
  };
}

/**
 * Check for warnings and arrivals this turn
 */
export interface TurnEvents {
  warnings: Array<{ wave: ScheduledWave; turnsUntil: number }>;
  arrivals: ScheduledWave[];
}

export function checkWavesForTurn(
  queue: ReinforcementQueue,
  currentTurn: number
): { queue: ReinforcementQueue; events: TurnEvents } {
  const events: TurnEvents = { warnings: [], arrivals: [] };
  const updatedWaves: ScheduledWave[] = [];

  for (const wave of queue.waves) {
    const turnsUntil = wave.arrivalTurn - currentTurn;

    // Check for warning
    if (!wave.announced && turnsUntil <= queue.warningTurns && turnsUntil > 0) {
      events.warnings.push({ wave, turnsUntil });
      updatedWaves.push({ ...wave, announced: true });
    }
    // Check for arrival
    else if (turnsUntil <= 0) {
      events.arrivals.push(wave);
      // Don't add to updatedWaves - wave is consumed
    }
    else {
      updatedWaves.push(wave);
    }
  }

  return {
    queue: { ...queue, waves: updatedWaves },
    events,
  };
}

/**
 * Cancel a wave if conditions met
 */
export function tryCancelWave(
  queue: ReinforcementQueue,
  waveId: string,
  conditionMet: string
): { queue: ReinforcementQueue; cancelled: boolean } {
  const wave = queue.waves.find(w => w.id === waveId);

  if (!wave || !wave.canCancel) {
    return { queue, cancelled: false };
  }

  if (wave.cancelCondition && conditionMet !== wave.cancelCondition) {
    return { queue, cancelled: false };
  }

  return {
    queue: {
      ...queue,
      waves: queue.waves.filter(w => w.id !== waveId),
    },
    cancelled: true,
  };
}

// ============================================================================
// EXTRACTION SYSTEM (XCOM-style)
// ============================================================================

export interface ExtractionZone {
  id: string;
  position: { x: number; y: number };
  radius: number;             // Tiles from center
  direction: 'north' | 'south' | 'east' | 'west';
  available: boolean;         // Can be used?
  cooldown: number;           // Turns until available again
  extractedUnits: string[];   // Unit IDs that have extracted
}

export interface ExtractionState {
  zones: ExtractionZone[];
  extractedUnits: string[];
  missionCanEnd: boolean;     // All required extractions done?
}

/**
 * Create extraction zones for a map
 */
export function createExtractionZones(
  mapWidth: number,
  mapHeight: number,
  directions: Array<'north' | 'south' | 'east' | 'west'>
): ExtractionZone[] {
  const zones: ExtractionZone[] = [];

  for (const dir of directions) {
    let position: { x: number; y: number };

    switch (dir) {
      case 'north':
        position = { x: Math.floor(mapWidth / 2), y: 0 };
        break;
      case 'south':
        position = { x: Math.floor(mapWidth / 2), y: mapHeight - 1 };
        break;
      case 'east':
        position = { x: mapWidth - 1, y: Math.floor(mapHeight / 2) };
        break;
      case 'west':
        position = { x: 0, y: Math.floor(mapHeight / 2) };
        break;
    }

    zones.push({
      id: `extract-${dir}`,
      position,
      radius: 2,
      direction: dir,
      available: true,
      cooldown: 0,
      extractedUnits: [],
    });
  }

  return zones;
}

/**
 * Check if a unit can extract at their position
 */
export function canExtract(
  unitPosition: { x: number; y: number },
  zones: ExtractionZone[]
): ExtractionZone | null {
  for (const zone of zones) {
    if (!zone.available) continue;

    const dist = Math.abs(unitPosition.x - zone.position.x) +
                 Math.abs(unitPosition.y - zone.position.y);

    if (dist <= zone.radius) {
      return zone;
    }
  }

  return null;
}

/**
 * Extract a unit
 */
export function extractUnit(
  state: ExtractionState,
  unitId: string,
  zoneId: string
): ExtractionState {
  const zone = state.zones.find(z => z.id === zoneId);
  if (!zone) return state;

  return {
    ...state,
    zones: state.zones.map(z =>
      z.id === zoneId
        ? { ...z, extractedUnits: [...z.extractedUnits, unitId] }
        : z
    ),
    extractedUnits: [...state.extractedUnits, unitId],
  };
}

// ============================================================================
// COMBAT STATE INTEGRATION
// ============================================================================

export interface EscalationCombatState {
  heat: HeatState;
  reinforcements: ReinforcementQueue;
  extraction: ExtractionState;
  cityProfile: CityResponseProfile;
  turn: number;

  // Active factions in this combat
  factions: string[];
  factionHostility: Map<string, string[]>;  // faction -> hostile to factions
}

/**
 * Initialize escalation state for combat
 */
export function initializeEscalation(
  cityProfile: CityResponseProfile,
  playerEntryDirection: 'north' | 'south' | 'east' | 'west',
  mapWidth: number = 15,
  mapHeight: number = 15
): EscalationCombatState {
  // Extraction is opposite of entry
  const exitDirections: Record<string, 'north' | 'south' | 'east' | 'west'> = {
    'north': 'south',
    'south': 'north',
    'east': 'west',
    'west': 'east',
  };

  return {
    heat: initializeHeat(cityProfile.lawEnforcement),
    reinforcements: { waves: [], warningTurns: 2 },
    extraction: {
      zones: createExtractionZones(mapWidth, mapHeight, [
        playerEntryDirection,
        exitDirections[playerEntryDirection],
      ]),
      extractedUnits: [],
      missionCanEnd: false,
    },
    cityProfile,
    turn: 0,
    factions: ['player', 'enemy'],
    factionHostility: new Map([
      ['player', ['enemy']],
      ['enemy', ['player']],
    ]),
  };
}

/**
 * Process end of turn - check heat, reinforcements, etc.
 */
export function processEscalationTurn(
  state: EscalationCombatState
): {
  state: EscalationCombatState;
  events: {
    warnings: Array<{ message: string; turnsUntil: number; faction: string }>;
    arrivals: Array<{ faction: string; size: number; entryPoint: string }>;
    heatChange: number;
  };
} {
  const newTurn = state.turn + 1;

  // Apply heat decay
  const newHeat = applyHeatDecay(state.heat, newTurn);

  // Check reinforcement waves
  const { queue, events: waveEvents } = checkWavesForTurn(
    state.reinforcements,
    newTurn
  );

  // Auto-trigger police if heat is high enough
  const stars = getHeatStars(newHeat.current);
  let updatedQueue = queue;

  if (stars >= 1 && !queue.waves.some(w => w.factionId === 'police')) {
    const response = calculateResponseTime('police', newHeat.current, state.cityProfile);
    if (response.waveSize > 0) {
      updatedQueue = scheduleWave(
        updatedQueue,
        'police',
        newTurn,
        response.modifiedTurns,
        response.waveSize,
        response.reason,
        { entryPoint: 'south' }
      );
    }
  }

  // SWAT at 3+ stars
  if (stars >= 3 && !queue.waves.some(w => w.factionId === 'swat')) {
    const response = calculateResponseTime('swat', newHeat.current, state.cityProfile);
    if (response.waveSize > 0) {
      updatedQueue = scheduleWave(
        updatedQueue,
        'swat',
        newTurn,
        response.modifiedTurns,
        response.waveSize,
        response.reason,
        { entryPoint: 'roof' }
      );
    }
  }

  return {
    state: {
      ...state,
      heat: newHeat,
      reinforcements: updatedQueue,
      turn: newTurn,
    },
    events: {
      warnings: waveEvents.warnings.map(w => ({
        message: `${w.wave.factionId.toUpperCase()} arriving in ${w.turnsUntil} turns!`,
        turnsUntil: w.turnsUntil,
        faction: w.wave.factionId,
      })),
      arrivals: waveEvents.arrivals.map(w => ({
        faction: w.factionId,
        size: w.size,
        entryPoint: w.entryPoint,
      })),
      heatChange: newHeat.current - state.heat.current,
    },
  };
}

// ============================================================================
// UI HELPERS
// ============================================================================

/**
 * Get display info for current escalation state
 */
export function getEscalationDisplay(state: EscalationCombatState): {
  stars: number;
  starsMax: number;
  heat: number;
  heatMax: number;
  incomingWaves: Array<{
    faction: string;
    turnsUntil: number;
    size: number;
    entryPoint: string;
  }>;
  extractionAvailable: boolean;
  extractedCount: number;
} {
  const stars = getHeatStars(state.heat.current);

  const incomingWaves = state.reinforcements.waves
    .filter(w => w.arrivalTurn > state.turn)
    .map(w => ({
      faction: w.factionId,
      turnsUntil: w.arrivalTurn - state.turn,
      size: w.size,
      entryPoint: w.entryPoint,
    }))
    .sort((a, b) => a.turnsUntil - b.turnsUntil);

  return {
    stars,
    starsMax: 5,
    heat: state.heat.current,
    heatMax: 100,
    incomingWaves,
    extractionAvailable: state.extraction.zones.some(z => z.available),
    extractedCount: state.extraction.extractedUnits.length,
  };
}

/**
 * Format incoming wave for display
 */
export function formatIncomingWave(
  faction: string,
  turnsUntil: number,
  size: number
): string {
  const factionNames: Record<string, string> = {
    'police': '🚔 Police',
    'swat': '🚨 SWAT',
    'military': '🪖 Military',
    'gang': '💀 Gang',
    'private_security': '🛡️ Security',
  };

  const name = factionNames[faction] || faction;
  return `${name} (${size}) - ${turnsUntil} turn${turnsUntil !== 1 ? 's' : ''}`;
}

// ============================================================================
// CHARACTER OPINIONS SYSTEM (Shaun's Requirement)
// Characters voice opinions at decision points based on calling
// "You have ONE PARAGRAPH to define a character. Everything else emerges through play."
// ============================================================================

export interface EscalationSituation {
  heat: number;
  stars: number;
  incomingPolice: number;      // Turns until police arrive
  incomingSwat: number;        // Turns until SWAT arrive
  incomingMilitary: number;    // Turns until military arrive
  enemiesRemaining: number;
  alliesAlive: number;
  alliesWounded: number;
  objectiveComplete: boolean;
  extractionAvailable: boolean;
}

export interface EscalationOpinion {
  characterId: string;
  characterName: string;
  calling: string;
  recommendation: 'fight' | 'flee' | 'negotiate' | 'neutral';
  quote: string;           // 5-15 words, personality-driven
  confidence: number;      // How strongly they feel (0-100)
}

// Calling-based escalation reactions
// Shaun: "Personality should reveal through GAMEPLAY, not exposition"
const CALLING_REACTIONS: Record<string, {
  fightQuotes: string[];
  fleeQuotes: string[];
  negotiateQuotes: string[];
  preference: 'fight' | 'flee' | 'negotiate' | 'neutral';
  confidenceBase: number;
}> = {
  // PROTECTIVE
  protector: {
    fightQuotes: [
      "I won't abandon people who need us.",
      "We stay until everyone's safe.",
    ],
    fleeQuotes: [
      "Getting ourselves killed helps no one.",
      "Live to protect another day.",
    ],
    negotiateQuotes: [
      "Maybe we can resolve this peacefully.",
    ],
    preference: 'neutral', // Depends on civilians
    confidenceBase: 70,
  },
  guardian: {
    fightQuotes: [
      "This ground is worth defending.",
      "I've held worse positions.",
    ],
    fleeQuotes: [
      "Retreat to defensible ground.",
    ],
    negotiateQuotes: [],
    preference: 'fight',
    confidenceBase: 75,
  },
  shepherd: {
    fightQuotes: [],
    fleeQuotes: [
      "We got everyone out. That's what matters.",
      "Safety first. Always.",
    ],
    negotiateQuotes: [
      "Let me talk to them.",
    ],
    preference: 'flee',
    confidenceBase: 65,
  },

  // JUSTICE
  avenger: {
    fightQuotes: [
      "They're corrupt. They deserve what's coming.",
      "Justice doesn't flee.",
    ],
    fleeQuotes: [],
    negotiateQuotes: [],
    preference: 'fight',
    confidenceBase: 85,
  },
  reformer: {
    fightQuotes: [
      "Sometimes you have to break the system.",
    ],
    fleeQuotes: [
      "Violence won't change anything.",
    ],
    negotiateQuotes: [
      "There has to be a better way.",
      "Let's talk this out.",
    ],
    preference: 'negotiate',
    confidenceBase: 60,
  },
  liberator: {
    fightQuotes: [
      "Freedom isn't given. It's taken.",
      "Every tyrant falls eventually.",
    ],
    fleeQuotes: [],
    negotiateQuotes: [],
    preference: 'fight',
    confidenceBase: 80,
  },

  // REDEMPTION
  repentant: {
    fightQuotes: [],
    fleeQuotes: [
      "I've caused enough death.",
    ],
    negotiateQuotes: [
      "Maybe I can make this right.",
    ],
    preference: 'negotiate',
    confidenceBase: 50,
  },
  survivor: {
    fightQuotes: [
      "I've survived worse.",
    ],
    fleeQuotes: [
      "I didn't survive this long by being stupid.",
      "Know when to fold.",
    ],
    negotiateQuotes: [],
    preference: 'flee',
    confidenceBase: 75,
  },
  seeker: {
    fightQuotes: [],
    fleeQuotes: [],
    negotiateQuotes: [
      "What's the lesson here?",
    ],
    preference: 'neutral',
    confidenceBase: 40,
  },

  // DUTY
  soldier: {
    fightQuotes: [
      "Orders are orders. We hold.",
      "Soldiers don't run.",
    ],
    fleeQuotes: [
      "Tactical retreat. Regroup and reassess.",
    ],
    negotiateQuotes: [],
    preference: 'fight',
    confidenceBase: 80,
  },
  professional: {
    fightQuotes: [
      "We finish the job.",
    ],
    fleeQuotes: [
      "Mission's compromised. Extract.",
      "No point dying for nothing.",
    ],
    negotiateQuotes: [],
    preference: 'neutral',
    confidenceBase: 70,
  },
  legacy: {
    fightQuotes: [
      "My family never ran.",
      "This is what we're made for.",
    ],
    fleeQuotes: [],
    negotiateQuotes: [],
    preference: 'fight',
    confidenceBase: 75,
  },

  // SELF-INTEREST
  mercenary: {
    fightQuotes: [
      "There's a bounty for this. I want it.",
    ],
    fleeQuotes: [
      "Money's not worth dying for.",
      "No bonus is worth a body bag.",
    ],
    negotiateQuotes: [],
    preference: 'flee',
    confidenceBase: 85,
  },
  glory_hound: {
    fightQuotes: [
      "This is going to be LEGENDARY.",
      "Picture the headlines!",
    ],
    fleeQuotes: [],
    negotiateQuotes: [],
    preference: 'fight',
    confidenceBase: 90,
  },
  thrill_seeker: {
    fightQuotes: [
      "Finally, some REAL opposition!",
      "This is what I live for!",
    ],
    fleeQuotes: [
      "Boring. Let's bounce.",
    ],
    negotiateQuotes: [],
    preference: 'fight',
    confidenceBase: 95,
  },
  collector: {
    fightQuotes: [],
    fleeQuotes: [
      "Nothing here worth dying for.",
    ],
    negotiateQuotes: [],
    preference: 'flee',
    confidenceBase: 60,
  },

  // IDEOLOGY
  idealist: {
    fightQuotes: [
      "We stand for something.",
    ],
    fleeQuotes: [
      "Live to fight another day.",
    ],
    negotiateQuotes: [
      "They'll understand if we explain.",
    ],
    preference: 'negotiate',
    confidenceBase: 55,
  },
  zealot: {
    fightQuotes: [
      "We don't run from corrupt authority!",
      "The cause demands sacrifice!",
      "Martyrs inspire more than cowards.",
    ],
    fleeQuotes: [],
    negotiateQuotes: [],
    preference: 'fight',
    confidenceBase: 100,
  },
  visionary: {
    fightQuotes: [
      "Sometimes you have to break things.",
    ],
    fleeQuotes: [
      "The plan requires us alive.",
    ],
    negotiateQuotes: [
      "I can make them see reason.",
    ],
    preference: 'neutral',
    confidenceBase: 65,
  },

  // POWER
  conqueror: {
    fightQuotes: [
      "They dare challenge ME?",
      "I don't retreat. They do.",
    ],
    fleeQuotes: [],
    negotiateQuotes: [],
    preference: 'fight',
    confidenceBase: 90,
  },
  architect: {
    fightQuotes: [],
    fleeQuotes: [
      "Strategic withdrawal. It's all part of the plan.",
    ],
    negotiateQuotes: [
      "Let me handle this.",
    ],
    preference: 'negotiate',
    confidenceBase: 75,
  },
  untouchable: {
    fightQuotes: [
      "They can't touch us.",
    ],
    fleeQuotes: [
      "I won't be vulnerable. We leave.",
    ],
    negotiateQuotes: [],
    preference: 'flee',
    confidenceBase: 80,
  },

  // IDENTITY
  outcast: {
    fightQuotes: [
      "I'll prove I belong here.",
    ],
    fleeQuotes: [],
    negotiateQuotes: [],
    preference: 'fight',
    confidenceBase: 70,
  },
  reluctant: {
    fightQuotes: [],
    fleeQuotes: [
      "I never asked for this. Let's go.",
      "This isn't my fight.",
    ],
    negotiateQuotes: [],
    preference: 'flee',
    confidenceBase: 60,
  },
  born_to_it: {
    fightQuotes: [
      "This is my destiny.",
      "I was made for this.",
    ],
    fleeQuotes: [],
    negotiateQuotes: [],
    preference: 'fight',
    confidenceBase: 80,
  },

  // RELATIONSHIPS
  loyalist: {
    fightQuotes: [
      "I go where the team goes.",
    ],
    fleeQuotes: [
      "If it protects the team, we leave.",
    ],
    negotiateQuotes: [],
    preference: 'neutral',
    confidenceBase: 65,
  },
  rival: {
    fightQuotes: [
      "I'll show them what I'm worth.",
    ],
    fleeQuotes: [],
    negotiateQuotes: [],
    preference: 'fight',
    confidenceBase: 75,
  },
  romantic: {
    fightQuotes: [],
    fleeQuotes: [
      "I can't lose you. We leave. Now.",
    ],
    negotiateQuotes: [],
    preference: 'flee',
    confidenceBase: 90,
  },

  // DARK
  nihilist: {
    fightQuotes: [
      "Doesn't matter either way.",
    ],
    fleeQuotes: [
      "Whatever.",
    ],
    negotiateQuotes: [],
    preference: 'neutral',
    confidenceBase: 20,
  },
  predator: {
    fightQuotes: [
      "More prey. Good.",
      "The hunt continues.",
    ],
    fleeQuotes: [],
    negotiateQuotes: [],
    preference: 'fight',
    confidenceBase: 85,
  },
  chaos_agent: {
    fightQuotes: [
      "Let's make this INTERESTING.",
      "Time to tear it all down!",
    ],
    fleeQuotes: [],
    negotiateQuotes: [],
    preference: 'fight',
    confidenceBase: 95,
  },
};

/**
 * Get a character's opinion on the escalation situation
 *
 * Shaun's Philosophy: "Characters reveal themselves through GAMEPLAY"
 * - Each calling has a default preference
 * - Situation modifies the recommendation
 * - Quotes are SHORT (5-15 words), personality-driven
 */
export function getEscalationReaction(
  characterId: string,
  characterName: string,
  calling: string,
  situation: EscalationSituation
): EscalationOpinion {
  const reactions = CALLING_REACTIONS[calling] || CALLING_REACTIONS.professional;
  let recommendation = reactions.preference;
  let confidence = reactions.confidenceBase;

  // Situation modifiers
  if (situation.incomingSwat > 0 && situation.incomingSwat <= 3) {
    // SWAT imminent - most characters reconsider
    if (recommendation === 'fight') {
      confidence -= 20;
    } else {
      confidence += 10;
    }
  }

  if (situation.alliesWounded >= situation.alliesAlive / 2) {
    // Half the team wounded - lean toward flee
    if (recommendation === 'fight') {
      confidence -= 15;
    }
  }

  if (situation.objectiveComplete) {
    // Objective done - lean toward flee
    if (recommendation === 'fight') {
      confidence -= 25;
    } else if (recommendation === 'flee') {
      confidence += 20;
    }
  }

  if (situation.stars >= 4) {
    // Very high heat - extreme responses
    if (calling === 'zealot' || calling === 'thrill_seeker') {
      confidence += 10; // They love this
    } else {
      confidence -= 10;
    }
  }

  // Determine final recommendation based on confidence
  if (confidence < 30 && reactions.preference !== 'neutral') {
    recommendation = 'neutral';
  }

  // Select quote based on recommendation
  let quotes: string[];
  switch (recommendation) {
    case 'fight':
      quotes = reactions.fightQuotes;
      break;
    case 'flee':
      quotes = reactions.fleeQuotes;
      break;
    case 'negotiate':
      quotes = reactions.negotiateQuotes;
      break;
    default:
      // Neutral - pick from any available
      quotes = [...reactions.fightQuotes, ...reactions.fleeQuotes, ...reactions.negotiateQuotes];
      break;
  }

  // Fallback quote if none available
  if (quotes.length === 0) {
    quotes = ["I'll follow your lead."];
    recommendation = 'neutral';
    confidence = Math.min(confidence, 40);
  }

  const quote = quotes[Math.floor(Math.random() * quotes.length)];

  return {
    characterId,
    characterName,
    calling,
    recommendation,
    quote,
    confidence: Math.max(0, Math.min(100, confidence)),
  };
}

/**
 * Collect opinions from all squad members
 * Returns summary of what the squad thinks
 */
export function collectSquadOpinions(
  squad: Array<{ id: string; name: string; calling?: string }>,
  situation: EscalationSituation
): {
  opinions: EscalationOpinion[];
  consensus: 'fight' | 'flee' | 'negotiate' | 'split';
  strongestVoice: EscalationOpinion | null;
} {
  const opinions = squad.map(member =>
    getEscalationReaction(
      member.id,
      member.name,
      member.calling || 'professional',
      situation
    )
  );

  // Count votes weighted by confidence
  const votes = { fight: 0, flee: 0, negotiate: 0, neutral: 0 };
  let strongestVoice: EscalationOpinion | null = null;

  for (const opinion of opinions) {
    votes[opinion.recommendation] += opinion.confidence;
    if (!strongestVoice || opinion.confidence > strongestVoice.confidence) {
      strongestVoice = opinion;
    }
  }

  // Determine consensus
  const total = votes.fight + votes.flee + votes.negotiate + votes.neutral;
  let consensus: 'fight' | 'flee' | 'negotiate' | 'split';

  if (votes.fight > total * 0.5) {
    consensus = 'fight';
  } else if (votes.flee > total * 0.5) {
    consensus = 'flee';
  } else if (votes.negotiate > total * 0.5) {
    consensus = 'negotiate';
  } else {
    consensus = 'split';
  }

  return { opinions, consensus, strongestVoice };
}

// ============================================================================
// ESCAPE OPTIONS SYSTEM (Linda's Requirement)
// Multiple ways to end escalation based on map/city/preparation
// ============================================================================

export type EscapeType =
  | 'extract_edge'      // Move to map edge
  | 'rooftop_evac'      // Helicopter extraction
  | 'underground'       // Sewer/tunnel escape
  | 'blend_in'          // Disguise and walk away
  | 'bribe'             // Pay off checkpoint
  | 'negotiate'         // Talk your way out
  | 'vehicle_escape'    // Drive away
  | 'surrender';        // Give up (last resort)

export interface EscapeOption {
  type: EscapeType;
  name: string;
  description: string;
  available: boolean;
  reason?: string;              // Why available/unavailable
  cost?: number;                // Cash cost (for bribe)
  successChance: number;        // 0-100
  stealthBonus?: boolean;       // Does this avoid more heat?
  consequences?: {
    standingChange?: Record<string, number>;
    heatAfter?: number;         // Heat level after escape
    missionStatus: 'success' | 'partial' | 'abort' | 'fail';
  };
}

// City types that affect escape options
export type CityType = 'Industrial' | 'Political' | 'Military' | 'Educational' |
                       'Temple' | 'Mining' | 'Company' | 'Resort' | 'Seaport' | '';

/**
 * Get available escape options based on context
 *
 * Linda's Philosophy: "If there's only one right answer, you've built a puzzle"
 * - Always provide 2-3 valid options
 * - Context (city type, standings, preparation) opens more options
 * - Every option has trade-offs
 *
 * @param cityTypes - Array of city types from city data
 * @param factionStandings - Player standings with factions
 * @param corruption - Country corruption level (0-100)
 * @param inventory - What resources/equipment available
 */
export function getAvailableEscapeOptions(
  cityTypes: CityType[],
  factionStandings: Record<string, number>,
  corruption: number,
  inventory: {
    cash?: number;
    hasHelicopter?: boolean;
    hasVehicle?: boolean;
    hasCivilianClothes?: boolean;
    hasHeavyWeapons?: boolean;
    sewerAccess?: boolean;
  }
): EscapeOption[] {
  const options: EscapeOption[] = [];
  const policeStanding = factionStandings['police'] ?? 0;
  const militaryStanding = factionStandings['military'] ?? 0;

  // 1. Extract at Edge - ALWAYS available
  options.push({
    type: 'extract_edge',
    name: 'Extract at Map Edge',
    description: 'Move all units to extraction zone and leave.',
    available: true,
    successChance: 100,
    consequences: {
      missionStatus: 'success',
      heatAfter: 0,
    },
  });

  // 2. Rooftop Evacuation - Requires helicopter + good standing
  const hasRooftopOption = inventory.hasHelicopter &&
    (militaryStanding >= 50 || cityTypes.includes('Company') || cityTypes.includes('Political'));
  options.push({
    type: 'rooftop_evac',
    name: 'Rooftop Evac',
    description: 'Call in helicopter extraction from rooftop.',
    available: hasRooftopOption,
    reason: !inventory.hasHelicopter
      ? 'Requires helicopter support'
      : militaryStanding < 50
        ? 'Military standing too low for airspace clearance'
        : undefined,
    successChance: hasRooftopOption ? 95 : 0,
    stealthBonus: true,
    consequences: {
      missionStatus: 'success',
      heatAfter: 10,
      standingChange: { military: -5 }, // Using military resources
    },
  });

  // 3. Underground Escape - City type dependent
  const hasUnderground = inventory.sewerAccess ||
    cityTypes.includes('Industrial') ||
    cityTypes.includes('Seaport') ||
    cityTypes.includes('Mining');
  options.push({
    type: 'underground',
    name: 'Underground Escape',
    description: 'Escape through sewers, tunnels, or maintenance passages.',
    available: hasUnderground,
    reason: !hasUnderground ? 'No underground access in this area' : undefined,
    successChance: hasUnderground ? 85 : 0,
    stealthBonus: true,
    consequences: {
      missionStatus: 'success',
      heatAfter: 5,
    },
  });

  // 4. Blend In - Requires civilian clothes, no heavy weapons
  const canBlendIn = inventory.hasCivilianClothes && !inventory.hasHeavyWeapons &&
    (cityTypes.includes('Resort') || cityTypes.includes('Educational') ||
     cityTypes.some(t => t === '')); // Any civilian area
  options.push({
    type: 'blend_in',
    name: 'Blend In',
    description: 'Change clothes and walk away in the crowd.',
    available: canBlendIn,
    reason: inventory.hasHeavyWeapons
      ? 'Cannot blend in with heavy weapons'
      : !inventory.hasCivilianClothes
        ? 'No civilian clothes available'
        : undefined,
    successChance: canBlendIn ? 75 : 0,
    stealthBonus: true,
    consequences: {
      missionStatus: 'success',
      heatAfter: 0,
    },
  });

  // 5. Bribe Checkpoint - Requires cash + corruption
  const bribeCost = Math.round(5000 * (2 - corruption / 100)); // Cheaper in corrupt areas
  const canBribe = (inventory.cash ?? 0) >= bribeCost && corruption >= 40;
  options.push({
    type: 'bribe',
    name: 'Bribe Checkpoint',
    description: `Pay off authorities ($${bribeCost.toLocaleString()}).`,
    available: canBribe,
    cost: bribeCost,
    reason: (inventory.cash ?? 0) < bribeCost
      ? `Need $${bribeCost.toLocaleString()}`
      : corruption < 40
        ? 'Authorities cannot be bribed here'
        : undefined,
    successChance: canBribe ? Math.min(95, 50 + corruption / 2) : 0,
    consequences: {
      missionStatus: 'success',
      heatAfter: 20,
      standingChange: { police: -10 }, // They know you're dirty
    },
  });

  // 6. Negotiate - Requires positive police standing
  const canNegotiate = policeStanding >= 25;
  options.push({
    type: 'negotiate',
    name: 'Negotiate',
    description: 'Use reputation to talk your way out.',
    available: canNegotiate,
    reason: !canNegotiate ? 'Police standing too low' : undefined,
    successChance: canNegotiate ? Math.min(90, 50 + policeStanding / 2) : 0,
    consequences: {
      missionStatus: 'partial', // Mission aborted but reputation intact
      heatAfter: 0,
      standingChange: { police: 5 }, // Cooperation bonus
    },
  });

  // 7. Vehicle Escape - Requires vehicle
  const hasVehicleOption = inventory.hasVehicle &&
    (cityTypes.includes('Industrial') || cityTypes.includes('Military') ||
     cityTypes.includes('Seaport'));
  options.push({
    type: 'vehicle_escape',
    name: 'Vehicle Escape',
    description: 'Drive through roadblock and escape.',
    available: hasVehicleOption,
    reason: !inventory.hasVehicle
      ? 'No vehicle available'
      : !hasVehicleOption
        ? 'Roads too congested for vehicle escape'
        : undefined,
    successChance: hasVehicleOption ? 70 : 0,
    consequences: {
      missionStatus: 'success',
      heatAfter: 30, // Dramatic chase
      standingChange: { police: -15 }, // Evading arrest
    },
  });

  // 8. Surrender - Always available (last resort)
  options.push({
    type: 'surrender',
    name: 'Surrender',
    description: 'Lay down weapons. Risk arrest.',
    available: true,
    successChance: 100,
    consequences: {
      missionStatus: 'fail',
      heatAfter: 0,
      standingChange: { police: 10 }, // Cooperation
    },
  });

  return options;
}

/**
 * Get escape options as a quick summary for UI
 */
export function getEscapeOptionsSummary(
  options: EscapeOption[]
): {
  available: string[];
  unavailable: string[];
  bestOption: EscapeOption | null;
} {
  const available = options.filter(o => o.available).map(o => o.name);
  const unavailable = options.filter(o => !o.available).map(o => o.name);

  // Best option: highest success chance with good outcome
  const bestOption = options
    .filter(o => o.available && o.consequences?.missionStatus !== 'fail')
    .sort((a, b) => b.successChance - a.successChance)[0] || null;

  return { available, unavailable, bestOption };
}

// ============================================================================
// ESCALATION CONSEQUENCES (Phase 5)
// Combat outcomes → strategic consequences
// ============================================================================

/**
 * Track kills by faction during combat for post-combat processing
 */
export interface EscalationFactionKills {
  police: number;
  swat: number;
  military: number;
  civilian: number;
  enemy: number;       // Regular enemies (no faction penalty)
  allied: number;      // Friendly fire
}

/**
 * Full escalation combat outcome for strategic processing
 */
export interface EscalationCombatOutcome {
  // Location
  cityName: string;
  countryName: string;
  countryCode: string;

  // Combat stats
  factionKills: EscalationFactionKills;
  heatMaxReached: number;     // Highest heat during combat
  starsMaxReached: number;    // Highest star level
  turnsWithPolice: number;    // Turns spent fighting police
  turnsWithSwat: number;      // Turns spent fighting SWAT
  turnsWithMilitary: number;  // Turns spent fighting military

  // Outcome
  extractionType?: EscapeType;  // How did combat end?
  wasWitnessed: boolean;
  propertyDamage: number;       // 0-100 scale

  // Timestamp
  timestamp: number;
}

/**
 * Standing changes calculated from escalation
 */
export interface EscalationStandingChange {
  factionType: string;
  change: number;
  reason: string;
}

/**
 * Calculate standing changes from escalation combat outcome
 *
 * Consequences:
 * - Killing police = major police standing drop, triggers bounty at <-25
 * - Killing SWAT = police + military standing drop
 * - Killing military = military + government standing drop
 * - High heat = media coverage = media standing affected
 * - Future response: lastCombatAgainstFaction stored for faster response
 */
export function calculateEscalationConsequences(
  outcome: EscalationCombatOutcome
): {
  standingChanges: EscalationStandingChange[];
  bountyTriggered: boolean;
  newsTemplateId: string;
  futureResponseModifier: number;  // Multiplier for future response times
} {
  const changes: EscalationStandingChange[] = [];
  let newsTemplateId = 'escalation_minor';
  let bountyTriggered = false;
  let futureResponseModifier = 1.0;

  // Police kills
  if (outcome.factionKills.police > 0) {
    const policeChange = -20 * outcome.factionKills.police;
    changes.push({
      factionType: 'police',
      change: policeChange,
      reason: `Killed ${outcome.factionKills.police} police officer${outcome.factionKills.police > 1 ? 's' : ''} in ${outcome.cityName}`,
    });

    // Police killing affects media too
    changes.push({
      factionType: 'media',
      change: Math.round(policeChange * 0.5),
      reason: `Police confrontation reported in ${outcome.cityName}`,
    });

    // Government doesn't like cop-killers
    changes.push({
      factionType: 'government',
      change: Math.round(policeChange * 0.3),
      reason: `Violence against law enforcement`,
    });

    // Bounty threshold
    if (outcome.factionKills.police >= 2) {
      bountyTriggered = true;
    }

    // Future response faster
    futureResponseModifier *= 0.8;  // 20% faster response next time
    newsTemplateId = 'escalation_police_killed';
  }

  // SWAT kills (even worse)
  if (outcome.factionKills.swat > 0) {
    const swatChange = -25 * outcome.factionKills.swat;
    changes.push({
      factionType: 'police',
      change: swatChange,
      reason: `Killed ${outcome.factionKills.swat} SWAT operator${outcome.factionKills.swat > 1 ? 's' : ''} in ${outcome.cityName}`,
    });

    // SWAT are often military-trained
    changes.push({
      factionType: 'military',
      change: Math.round(swatChange * 0.4),
      reason: `Tactical response team casualties`,
    });

    bountyTriggered = true;
    futureResponseModifier *= 0.7;  // 30% faster
    newsTemplateId = 'escalation_swat_killed';
  }

  // Military kills (international incident potential)
  if (outcome.factionKills.military > 0) {
    const militaryChange = -30 * outcome.factionKills.military;
    changes.push({
      factionType: 'military',
      change: militaryChange,
      reason: `Killed ${outcome.factionKills.military} military personnel in ${outcome.cityName}`,
    });

    // Government takes military deaths very seriously
    changes.push({
      factionType: 'government',
      change: Math.round(militaryChange * 0.7),
      reason: `Military casualties in domestic operation`,
    });

    // Media coverage
    changes.push({
      factionType: 'media',
      change: Math.round(militaryChange * 0.4),
      reason: `Military engagement reported`,
    });

    bountyTriggered = true;
    futureResponseModifier *= 0.6;  // 40% faster
    newsTemplateId = 'escalation_military_killed';
  }

  // Civilian casualties (worst reputation damage)
  if (outcome.factionKills.civilian > 0) {
    const civilianPenalty = -15 * outcome.factionKills.civilian;
    changes.push({
      factionType: 'police',
      change: civilianPenalty,
      reason: `${outcome.factionKills.civilian} civilian casualt${outcome.factionKills.civilian > 1 ? 'ies' : 'y'} in ${outcome.cityName}`,
    });
    changes.push({
      factionType: 'government',
      change: civilianPenalty,
      reason: `Civilian casualties`,
    });
    changes.push({
      factionType: 'media',
      change: civilianPenalty * 2,  // Media hates civilian casualties
      reason: `Civilian casualties reported`,
    });

    newsTemplateId = 'escalation_civilian_casualties';
  }

  // High heat = media coverage even without kills
  if (outcome.starsMaxReached >= 3 && changes.length === 0) {
    changes.push({
      factionType: 'media',
      change: -5 * outcome.starsMaxReached,
      reason: `Major disturbance in ${outcome.cityName}`,
    });
    newsTemplateId = 'escalation_major_incident';
  }

  // Property damage
  if (outcome.propertyDamage >= 30) {
    const damageLevel = Math.min(15, Math.floor(outcome.propertyDamage / 5));
    changes.push({
      factionType: 'corporations',
      change: -damageLevel,
      reason: `Property damage in ${outcome.cityName}`,
    });
  }

  return {
    standingChanges: changes,
    bountyTriggered,
    newsTemplateId,
    futureResponseModifier,
  };
}

/**
 * Track faction kills during combat
 * Call this when a unit is killed to update the tally
 */
export function recordFactionKill(
  kills: EscalationFactionKills,
  unitFaction: string
): EscalationFactionKills {
  const factionLower = unitFaction.toLowerCase();

  // Map unit factions to kill categories
  if (factionLower === 'police' || factionLower === 'cop') {
    return { ...kills, police: kills.police + 1 };
  }
  if (factionLower === 'swat') {
    return { ...kills, swat: kills.swat + 1 };
  }
  if (factionLower === 'military' || factionLower === 'soldier') {
    return { ...kills, military: kills.military + 1 };
  }
  if (factionLower === 'civilian') {
    return { ...kills, civilian: kills.civilian + 1 };
  }
  if (factionLower === 'allied' || factionLower === 'player') {
    return { ...kills, allied: kills.allied + 1 };
  }

  // Default: enemy (no special penalty)
  return { ...kills, enemy: kills.enemy + 1 };
}

/**
 * Create empty faction kills tracker
 */
export function createEmptyFactionKills(): EscalationFactionKills {
  return {
    police: 0,
    swat: 0,
    military: 0,
    civilian: 0,
    enemy: 0,
    allied: 0,
  };
}

/**
 * Store for tracking last combat against each faction
 * Used to speed up future responses when player has history of violence
 */
export interface FactionCombatHistory {
  lastCombatTimestamp: number;        // Game timestamp
  lastCombatCity: string;
  lastCombatCountry: string;
  totalKills: number;
  responseSpeedModifier: number;      // Cumulative modifier (0.5 = 50% faster)
}

/**
 * Update faction combat history after escalation
 */
export function updateFactionCombatHistory(
  history: Record<string, FactionCombatHistory>,
  factionId: string,
  cityName: string,
  countryName: string,
  kills: number,
  timestamp: number
): Record<string, FactionCombatHistory> {
  const existing = history[factionId] || {
    lastCombatTimestamp: 0,
    lastCombatCity: '',
    lastCombatCountry: '',
    totalKills: 0,
    responseSpeedModifier: 1.0,
  };

  // Each kill makes future response 5% faster, min 0.5x
  const newModifier = Math.max(0.5, existing.responseSpeedModifier * Math.pow(0.95, kills));

  return {
    ...history,
    [factionId]: {
      lastCombatTimestamp: timestamp,
      lastCombatCity: cityName,
      lastCombatCountry: countryName,
      totalKills: existing.totalKills + kills,
      responseSpeedModifier: newModifier,
    },
  };
}

// ============================================================================
// CITY/COUNTRY INTEGRATION
// Builds response profiles from real world data
// ============================================================================

/**
 * Build a CityResponseProfile from actual city and country data
 *
 * This connects the escalation system to the strategic layer:
 * - City crime/safety indices affect how overwhelmed police are
 * - Country law enforcement affects response speed
 * - Military budget affects military response capability
 * - LSW regulations indicate superhuman tracking
 *
 * @param cityName - Name of the city (from mission.targetCity)
 * @param countryName - Name of the country (from mission.targetCountry)
 * @param factionStandings - Optional player standings with factions
 */
export function buildCityResponseProfile(
  cityName: string,
  countryName?: string,
  factionStandings?: Record<string, number>
): CityResponseProfile {
  const city = getCityByName(cityName);
  const country = countryName
    ? getCountryByName(countryName)
    : city ? getCountryByName(city.country) : undefined;

  // Default profile for unknown locations
  if (!city && !country) {
    return {
      lawEnforcement: 50,
      crimeIndex: 50,
      militaryPresence: 30,
      superhumanRegistry: false,
    };
  }

  // Build profile from available data
  const profile: CityResponseProfile = {
    // Country law enforcement is the base
    lawEnforcement: country?.lawEnforcement ?? 50,

    // City crime index (higher crime = slower response, police are busy)
    crimeIndex: city?.crimeIndex ?? 50,

    // Military presence from country's military budget
    militaryPresence: country?.militaryBudget ?? 30,

    // Superhuman registry based on LSW regulations
    superhumanRegistry: country?.lswRegulations === 'Regulated' || country?.lswRegulations === 'Legal',
  };

  // Apply faction standing modifiers
  if (factionStandings) {
    // Low police standing = they respond faster (want to catch you)
    if (factionStandings['police'] !== undefined && factionStandings['police'] < -25) {
      profile.lawEnforcement = Math.min(100, profile.lawEnforcement + 20);
    }

    // Very low standing = military might be involved
    if (factionStandings['police'] !== undefined && factionStandings['police'] < -50) {
      profile.militaryPresence = Math.min(100, profile.militaryPresence + 30);
    }
  }

  return profile;
}

/**
 * Get country response modifiers for escalation
 * Returns multipliers that affect response times and wave sizes
 */
export function getCountryResponseModifiers(countryName: string): {
  policeSpeedMultiplier: number;    // <1 = faster, >1 = slower
  swatSpeedMultiplier: number;
  militarySpeedMultiplier: number;
  waveSizeMultiplier: number;       // How many reinforcements
  corruptionBribeChance: number;    // Can you bribe your way out? (0-100)
} {
  const country = getCountryByName(countryName);

  if (!country) {
    return {
      policeSpeedMultiplier: 1.0,
      swatSpeedMultiplier: 1.0,
      militarySpeedMultiplier: 1.0,
      waveSizeMultiplier: 1.0,
      corruptionBribeChance: 0,
    };
  }

  // Higher law enforcement = faster police response
  const policeSpeed = 1.5 - (country.lawEnforcement / 100);

  // SWAT depends on government type and law enforcement
  const isAdvancedGov = country.governmentPerception === 'Full Democracy' ||
                         country.governmentPerception === 'Flawed Democracy';
  const swatSpeed = isAdvancedGov ? (1.3 - (country.lawEnforcement / 100)) : 1.5;

  // Military response depends on military budget
  const militarySpeed = 1.5 - (country.militaryBudget / 150);

  // Wave size depends on population density / development
  const waveSizeMultiplier = 0.5 + (country.lawEnforcement / 100);

  // Corruption enables bribes
  const corruptionBribeChance = Math.max(0, country.governmentCorruption - 30);

  return {
    policeSpeedMultiplier: Math.max(0.5, policeSpeed),
    swatSpeedMultiplier: Math.max(0.6, swatSpeed),
    militarySpeedMultiplier: Math.max(0.7, militarySpeed),
    waveSizeMultiplier: Math.max(0.5, Math.min(2.0, waveSizeMultiplier)),
    corruptionBribeChance,
  };
}

/**
 * Get heat decay rate from country's surveillance level
 * Higher surveillance = heat decays slower (they're watching)
 */
export function getHeatDecayFromSurveillance(countryName: string): number {
  const country = getCountryByName(countryName);
  if (!country) return 2; // Default decay

  const surveillance = calculateSurveillance(country);
  // heatDecayRate from surveillance is % per day, we need per turn
  // Convert: higher surveillance = slower decay in combat
  // Return turns of quiet before heat starts to decay noticeably
  return Math.max(1, Math.round(surveillance.heatDecayRate / 2));
}

/**
 * Initialize escalation from mission data
 * This is the main entry point for combat → escalation connection
 */
export function initializeEscalationFromMission(
  targetCity: string,
  targetCountry: string,
  playerEntryDirection: 'north' | 'south' | 'east' | 'west',
  mapWidth: number = 15,
  mapHeight: number = 15,
  factionStandings?: Record<string, number>
): EscalationCombatState {
  // Build profile from real data
  const cityProfile = buildCityResponseProfile(targetCity, targetCountry, factionStandings);

  // Get country-specific modifiers
  const countryModifiers = getCountryResponseModifiers(targetCountry);

  // Get heat decay rate from surveillance
  const heatDecayRate = getHeatDecayFromSurveillance(targetCountry);

  // Create base escalation state
  const state = initializeEscalation(cityProfile, playerEntryDirection, mapWidth, mapHeight);

  // Override heat decay with surveillance-based value
  state.heat.decayRate = heatDecayRate;

  // Store country modifiers for later use
  (state as any).countryModifiers = countryModifiers;
  (state as any).targetCity = targetCity;
  (state as any).targetCountry = targetCountry;

  return state;
}
