/**
 * Faction Event Handler
 *
 * Subscribes to game events and updates faction standings accordingly.
 * Handles mission completion, combat outcomes, and other faction-affecting events.
 */

import { EventBus, MissionCompletedEvent, GameEvent } from './eventBus';
import { useGameStore } from '../stores/enhancedGameStore';
import { FactionType, FACTION_NAMES, getRelatedFactionEffects, checkBountyStatus } from './factionSystem';
import { getMissionFactionEffects, calculateMissionFactionChanges } from './missionFactionEffects';
import { getCountryByName, getCountryByCode } from './allCountries';
import { createNewsArticle, pickRandomSource } from './newsSystem';
import {
  EscalationCombatOutcome,
  calculateEscalationConsequences,
  updateFactionCombatHistory,
  FactionCombatHistory,
} from '../combat/escalationSystem';
import { generateEscalationNews } from './newsTemplates';
import toast from 'react-hot-toast';

// =============================================================================
// STATE
// =============================================================================

interface FactionEventHandlerState {
  initialized: boolean;
  subscriptionIds: string[];
  factionCombatHistory: Record<string, FactionCombatHistory>;  // Track combat history
}

const state: FactionEventHandlerState = {
  initialized: false,
  subscriptionIds: [],
  factionCombatHistory: {},  // Persisted combat history for response speed modifiers
};

// =============================================================================
// EVENT HANDLERS
// =============================================================================

/**
 * Handle mission completion - update faction standings
 */
function handleMissionCompleted(event: MissionCompletedEvent): void {
  const store = useGameStore.getState();
  const { missionType, success, missionName } = event.data;

  // Get current country (where mission took place). selectedCountry and the
  // event location carry a country NAME; standings are keyed by ISO code.
  const countryRaw = event.location?.country || store.selectedCountry || 'US';
  const country = getCountryByName(countryRaw) || getCountryByCode(countryRaw);
  const countryCode = country?.code || countryRaw;

  // Calculate faction changes for this mission
  const changes = calculateMissionFactionChanges(missionType, success);

  console.log(`[FACTIONS] Mission ${missionName} (${missionType}) ${success ? 'SUCCESS' : 'FAILED'}`);
  console.log(`[FACTIONS] Applying ${changes.length} faction changes in ${countryCode}`);

  // Apply each faction change
  changes.forEach(({ faction, change, reason }) => {
    if (change === 0) return;

    // Use the store's modifyFactionStanding action
    store.modifyFactionStanding(faction, countryCode, change, reason);

    console.log(`[FACTIONS] ${faction} in ${countryCode}: ${change > 0 ? '+' : ''}${change} (${reason})`);
  });

  // Show summary toast for significant changes
  const significantChanges = changes.filter(c => Math.abs(c.change) >= 5);
  if (significantChanges.length > 0) {
    const summary = significantChanges
      .map(c => `${c.faction}: ${c.change > 0 ? '+' : ''}${c.change}`)
      .join(', ');

    toast(
      `Faction standings: ${summary}`,
      {
        icon: success ? '📈' : '📉',
        duration: 4000,
      }
    );

    // Generate faction reaction news (mirrors escalation news flow)
    if (store.addNewsArticle) {
      const biggest = significantChanges.reduce((a, b) =>
        Math.abs(b.change) > Math.abs(a.change) ? b : a
      );
      const factionName = FACTION_NAMES[biggest.faction];
      const city = event.location?.city || 'the operational area';
      const positive = biggest.change > 0;

      const headline = positive
        ? `${factionName} Signals Support After ${missionName}`
        : `${factionName} Condemns Fallout From ${missionName}`;

      const body = positive
        ? `Following the ${missionType} operation in ${city}, ${factionName.toLowerCase()} representatives have signaled warming relations with the operatives involved. Insiders cite "${biggest.reason}" as the driving factor. Observers expect closer cooperation in the region.`
        : `The ${missionType} operation in ${city} has drawn sharp criticism from ${factionName.toLowerCase()} circles. Sources point to "${biggest.reason}" as the cause of deteriorating relations. Analysts warn of consequences for future operations in the region.`;

      const article = createNewsArticle(
        headline,
        body,
        'superhuman',
        Math.abs(biggest.change) >= 10 ? 'major' : 'standard',
        store.gameTime,
        {
          source: pickRandomSource(positive ? 'superhuman' : 'politics'),
          region: event.location?.country,
          city: event.location?.city,
          sectorCode: event.location?.sector,
          relatedFactions: significantChanges.map(c => c.faction),
          eventType: 'mission_complete',
          eventId: event.id,
        }
      );

      store.addNewsArticle(article);
      console.log('[FACTIONS] Faction reaction news generated:', article.headline);
    }
  }
}

/**
 * Handle combat ended - additional faction effects based on combat details
 */
function handleCombatEnded(event: GameEvent): void {
  const store = useGameStore.getState();
  const countryCode = store.selectedCountry || 'US';

  // Combat ended events may have additional data about collateral damage, civilian casualties
  const { winner, collateralDamage, civilianCasualties } = event.data as any;

  // Collateral damage affects government and media
  if (collateralDamage && collateralDamage > 10000) {
    const damageLevel = Math.min(15, Math.floor(collateralDamage / 5000));

    store.modifyFactionStanding('government', countryCode, -damageLevel,
      `Collateral damage: $${collateralDamage.toLocaleString()}`);

    store.modifyFactionStanding('media', countryCode, -damageLevel * 2,
      `Property destruction reported`);

    console.log(`[FACTIONS] Collateral damage penalty: government -${damageLevel}, media -${damageLevel * 2}`);
  }

  // Civilian casualties severely affect all standings
  if (civilianCasualties && civilianCasualties > 0) {
    const casualtyPenalty = civilianCasualties * 10;

    store.modifyFactionStanding('police', countryCode, -casualtyPenalty,
      `Civilian casualties: ${civilianCasualties}`);
    store.modifyFactionStanding('media', countryCode, -casualtyPenalty * 2,
      `Civilian casualties: ${civilianCasualties}`);
    store.modifyFactionStanding('government', countryCode, -casualtyPenalty,
      `Civilian casualties: ${civilianCasualties}`);

    toast.error(`Civilian casualties! Major reputation damage.`, { duration: 5000 });
    console.log(`[FACTIONS] Civilian casualty penalty applied: ${civilianCasualties} casualties`);
  }
}

/**
 * Handle investigation completion - affects intel-related factions
 */
function handleInvestigationCompleted(event: GameEvent): void {
  const store = useGameStore.getState();
  const countryCode = store.selectedCountry || 'US';
  const { success, investigationType } = event.data as any;

  if (success) {
    // Successful investigation improves police standing
    store.modifyFactionStanding('police', countryCode, +5,
      `Investigation completed: ${investigationType}`);

    // If it exposed corporate wrongdoing
    if (investigationType === 'corporate' || investigationType === 'corruption') {
      store.modifyFactionStanding('corporations', countryCode, -8,
        'Corporate investigation');
      store.modifyFactionStanding('media', countryCode, +10,
        'Exposé published');
    }

    // If it exposed criminal activity
    if (investigationType === 'criminal' || investigationType === 'gang') {
      store.modifyFactionStanding('underworld', countryCode, -10,
        'Criminal network exposed');
    }
  }
}

/**
 * Handle escalation combat outcome - process faction kills and consequences
 *
 * This is the critical link between tactical escalation and strategic layer:
 * - Faction kills → standing changes
 * - High-profile violence → bounties
 * - News generation → public opinion
 * - Combat history → faster future response
 */
function handleEscalationOutcome(event: GameEvent): void {
  const store = useGameStore.getState();
  const outcome = event.data as EscalationCombatOutcome;

  if (!outcome || !outcome.factionKills) {
    console.log('[FACTIONS] Escalation event missing data');
    return;
  }

  const countryCode = outcome.countryCode || store.selectedCountry || 'US';

  console.log('[FACTIONS] Processing escalation outcome:', {
    city: outcome.cityName,
    country: outcome.countryName,
    factionKills: outcome.factionKills,
    maxHeat: outcome.heatMaxReached,
    maxStars: outcome.starsMaxReached,
  });

  // Calculate consequences
  const consequences = calculateEscalationConsequences(outcome);

  // Apply standing changes
  if (consequences.standingChanges.length > 0) {
    console.log('[FACTIONS] Applying escalation standing changes:');

    for (const change of consequences.standingChanges) {
      store.modifyFactionStanding(
        change.factionType as FactionType,
        countryCode,
        change.change,
        change.reason
      );
      console.log(`  ${change.factionType}: ${change.change > 0 ? '+' : ''}${change.change} (${change.reason})`);
    }

    // Show toast for significant changes
    const totalNegative = consequences.standingChanges
      .filter(c => c.change < 0)
      .reduce((sum, c) => sum + c.change, 0);

    if (totalNegative <= -30) {
      toast.error('Major faction reputation damage!', { duration: 5000 });
    } else if (totalNegative <= -15) {
      toast('Faction standings affected', { icon: '⚠️', duration: 4000 });
    }
  }

  // Check for bounty trigger
  if (consequences.bountyTriggered) {
    // Check current police standing
    const policeStanding = store.getFactionStanding?.('police', countryCode) ?? 0;
    if (policeStanding < -25) {
      toast.error('BOUNTY POSTED! You are now wanted.', { duration: 6000 });
      console.log('[FACTIONS] Bounty triggered - police standing:', policeStanding);
    }
  }

  // Update faction combat history for future response speed
  const kills = outcome.factionKills;
  if (kills.police > 0) {
    state.factionCombatHistory = updateFactionCombatHistory(
      state.factionCombatHistory,
      'police',
      outcome.cityName,
      outcome.countryName,
      kills.police,
      outcome.timestamp
    );
  }
  if (kills.swat > 0) {
    state.factionCombatHistory = updateFactionCombatHistory(
      state.factionCombatHistory,
      'police',  // SWAT is part of police faction
      outcome.cityName,
      outcome.countryName,
      kills.swat,
      outcome.timestamp
    );
  }
  if (kills.military > 0) {
    state.factionCombatHistory = updateFactionCombatHistory(
      state.factionCombatHistory,
      'military',
      outcome.cityName,
      outcome.countryName,
      kills.military,
      outcome.timestamp
    );
  }

  // Generate news article
  const totalCasualties = kills.police + kills.swat + kills.military + kills.civilian;
  if (totalCasualties > 0 || outcome.starsMaxReached >= 3) {
    const gameTime = store.gameTime;
    const fame = store.fame ?? 0;

    const newsArticle = generateEscalationNews(
      consequences.newsTemplateId,
      {
        cityName: outcome.cityName,
        countryName: outcome.countryName,
        casualties: totalCasualties,
        propertyDamage: outcome.propertyDamage,
      },
      gameTime,
      fame
    );

    // Add to news store
    if (store.addNewsArticle) {
      store.addNewsArticle(newsArticle);
      console.log('[FACTIONS] Escalation news generated:', newsArticle.headline);
    }
  }

  console.log('[FACTIONS] Escalation processing complete');
}

/**
 * Get faction response speed modifier based on combat history
 * Used by escalation system to speed up future responses
 */
export function getFactionResponseModifier(factionId: string): number {
  const history = state.factionCombatHistory[factionId];
  return history?.responseSpeedModifier ?? 1.0;
}

/**
 * Get total faction kills from history
 */
export function getFactionKillCount(factionId: string): number {
  const history = state.factionCombatHistory[factionId];
  return history?.totalKills ?? 0;
}

// =============================================================================
// INITIALIZATION
// =============================================================================

/**
 * Initialize faction event handler
 * Call this once during app startup
 */
export function initFactionEventHandler(): void {
  if (state.initialized) {
    console.log('[FACTION_EVENTS] Already initialized');
    return;
  }

  console.log('[FACTION_EVENTS] Initializing faction event handler...');

  // Subscribe to mission completion events (priority 7 - after economy, before news)
  state.subscriptionIds.push(
    EventBus.on<MissionCompletedEvent>('mission:completed', handleMissionCompleted, { priority: 7 })
  );

  // Subscribe to combat ended events for collateral damage tracking
  state.subscriptionIds.push(
    EventBus.on<GameEvent>('combat:ended', handleCombatEnded, { priority: 6 })
  );

  // Subscribe to investigation completion (if event exists)
  state.subscriptionIds.push(
    EventBus.on<GameEvent>('investigation:completed', handleInvestigationCompleted, { priority: 7 })
  );

  // Subscribe to escalation combat outcome - process faction kills
  state.subscriptionIds.push(
    EventBus.on<GameEvent>('escalation:outcome', handleEscalationOutcome, { priority: 6 })
  );

  state.initialized = true;
  console.log('[FACTION_EVENTS] Faction event handler initialized with', state.subscriptionIds.length, 'subscriptions');
}

/**
 * Cleanup faction event handler
 * Call this during app shutdown
 */
export function cleanupFactionEventHandler(): void {
  if (!state.initialized) return;

  console.log('[FACTION_EVENTS] Cleaning up...');

  state.subscriptionIds.forEach(id => EventBus.off(id));
  state.subscriptionIds = [];
  state.initialized = false;
}

/**
 * Check if faction event handler is initialized
 */
export function isFactionEventHandlerInitialized(): boolean {
  return state.initialized;
}

export default initFactionEventHandler;
