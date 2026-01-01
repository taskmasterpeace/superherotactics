/**
 * World News Integration (WE-007)
 *
 * Bridges WorldSimulation events to the News Generation system.
 * Converts WorldEvents into NewsArticles for display.
 */

import { WorldEvent, WorldEventCategory, getWorldSimulation } from './worldSimulation';
import { getTimeEngine } from './timeEngine';
import {
  NewsArticle,
  NewsCategory,
  NewsImportance,
  createNewsArticle,
  pickRandomSource,
} from './newsSystem';

// ============================================================================
// EVENT TO NEWS MAPPING
// ============================================================================

/**
 * Map world event category to news category
 */
function mapEventToNewsCategory(eventCategory: WorldEventCategory): NewsCategory {
  const mapping: Record<WorldEventCategory, NewsCategory> = {
    gang_territory: 'crime',
    political: 'politics',
    economic: 'business',
    crime_wave: 'crime',
    superhuman: 'superhuman',
    natural_disaster: 'local',
    military: 'politics',
    social: 'local',
  };
  return mapping[eventCategory] || 'local';
}

/**
 * Map event importance to news importance
 */
function mapImportance(eventImportance: WorldEvent['importance']): NewsImportance {
  const mapping: Record<WorldEvent['importance'], NewsImportance> = {
    minor: 'minor',
    normal: 'standard',
    major: 'major',
    critical: 'breaking',
  };
  return mapping[eventImportance];
}

/**
 * Generate article body from world event
 */
function generateArticleBody(event: WorldEvent): string {
  const bodies: Record<WorldEventCategory, string[]> = {
    gang_territory: [
      `Local authorities are responding to reports of increased gang activity in the ${event.affectedCities[0]} area. `,
      'Residents are advised to exercise caution. ',
      'Police have increased patrols in affected neighborhoods.',
    ],
    political: [
      `Political developments continue to unfold in ${event.affectedCountries[0]}. `,
      'Observers are monitoring the situation closely. ',
      'International response remains measured as events develop.',
    ],
    economic: [
      `Financial markets are reacting to the latest economic indicators from ${event.affectedCountries[0]}. `,
      'Analysts suggest this could impact regional trade. ',
      'Businesses are adjusting their strategies accordingly.',
    ],
    crime_wave: [
      `Law enforcement in ${event.affectedCities[0]} is responding to a spike in criminal activity. `,
      'Citizens are urged to report suspicious behavior. ',
      'Additional resources have been allocated to address the situation.',
    ],
    superhuman: [
      `Superhuman activity was detected in the ${event.affectedCities[0]} metropolitan area. `,
      'Authorities are assessing the situation and potential threat level. ',
      'LSW response protocols have been activated.',
    ],
    natural_disaster: [
      `Emergency services are responding to a natural disaster affecting the ${event.affectedCities[0]} region. `,
      'Evacuation orders may be in effect for certain areas. ',
      'Relief efforts are being coordinated with local authorities.',
    ],
    military: [
      `Military activity in ${event.affectedCountries[0]} has drawn international attention. `,
      'Defense analysts are evaluating potential implications. ',
      'Diplomatic channels remain open.',
    ],
    social: [
      `Social unrest continues in ${event.affectedCities[0]} as citizens express their concerns. `,
      'Authorities are monitoring the situation. ',
      'Both peaceful and disruptive elements have been reported.',
    ],
  };

  const parts = bodies[event.category] || ['Details are still emerging on this developing story.'];
  return parts.join('');
}

// ============================================================================
// CONVERSION FUNCTIONS
// ============================================================================

/**
 * Convert a WorldEvent to a NewsArticle
 */
export function worldEventToNewsArticle(event: WorldEvent): NewsArticle {
  const timeEngine = getTimeEngine();
  const gameTime = timeEngine.getTime();

  const category = mapEventToNewsCategory(event.category);
  const importance = mapImportance(event.importance);
  const source = pickRandomSource(category);

  return createNewsArticle({
    headline: event.headline,
    body: event.description + ' ' + generateArticleBody(event),
    category,
    source,
    importance,
    timestamp: event.timestamp,
    location: event.affectedCities[0] || event.affectedCountries[0] || 'Unknown',
    isBreaking: event.importance === 'critical',
  });
}

/**
 * Get news articles from recent world events
 */
export function getWorldEventNews(count: number = 10): NewsArticle[] {
  const worldSim = getWorldSimulation();
  const recentEvents = worldSim.getRecentEvents(count);
  return recentEvents.map(worldEventToNewsArticle);
}

/**
 * Get news articles for a specific city
 */
export function getCityNews(cityName: string): NewsArticle[] {
  const worldSim = getWorldSimulation();
  const cityEvents = worldSim.getEventsForCity(cityName);
  return cityEvents.map(worldEventToNewsArticle);
}

/**
 * Get news articles for a specific country
 */
export function getCountryNews(countryCode: string): NewsArticle[] {
  const worldSim = getWorldSimulation();
  const countryEvents = worldSim.getEventsForCountry(countryCode);
  return countryEvents.map(worldEventToNewsArticle);
}

// ============================================================================
// EVENT LOG DISPLAY DATA
// ============================================================================

export interface EventLogEntry {
  id: string;
  timestamp: string;
  headline: string;
  category: WorldEventCategory;
  importance: 'minor' | 'normal' | 'major' | 'critical';
  location: string;
  isActive: boolean;
  expiresIn?: number; // Hours until effect ends
}

/**
 * Get formatted event log entries
 */
export function getEventLogEntries(count: number = 20): EventLogEntry[] {
  const worldSim = getWorldSimulation();
  const timeEngine = getTimeEngine();
  const currentHour = timeEngine.getTime().totalHours;

  const recentEvents = worldSim.getRecentEvents(count);

  return recentEvents.map(event => {
    const isActive = worldSim.getActiveEvents().some(e => e.id === event.id);
    const expiresIn = event.expiresAt ? Math.max(0, event.expiresAt - currentHour) : undefined;

    return {
      id: event.id,
      timestamp: formatEventTimestamp(event.timestamp),
      headline: event.headline,
      category: event.category,
      importance: event.importance,
      location: event.affectedCities[0] || event.affectedCountries[0] || 'Global',
      isActive,
      expiresIn,
    };
  });
}

/**
 * Format timestamp for display
 */
function formatEventTimestamp(time: { date: { day: number; month: number; year: number }; hour: number }): string {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[time.date.month - 1]} ${time.date.day}, ${time.hour}:00`;
}

// ============================================================================
// CATEGORY ICONS & COLORS
// ============================================================================

export const EVENT_CATEGORY_DISPLAY: Record<WorldEventCategory, { icon: string; color: string; label: string }> = {
  gang_territory: { icon: '🔫', color: 'text-red-400', label: 'Gang Activity' },
  political: { icon: '🏛️', color: 'text-blue-400', label: 'Political' },
  economic: { icon: '📈', color: 'text-green-400', label: 'Economic' },
  crime_wave: { icon: '🚨', color: 'text-orange-400', label: 'Crime Wave' },
  superhuman: { icon: '⚡', color: 'text-purple-400', label: 'Superhuman' },
  natural_disaster: { icon: '🌪️', color: 'text-gray-400', label: 'Disaster' },
  military: { icon: '🎖️', color: 'text-yellow-400', label: 'Military' },
  social: { icon: '📢', color: 'text-cyan-400', label: 'Social' },
};

export const EVENT_IMPORTANCE_DISPLAY: Record<string, { color: string; label: string }> = {
  minor: { color: 'text-gray-400', label: 'Minor' },
  normal: { color: 'text-white', label: 'Normal' },
  major: { color: 'text-yellow-400', label: 'Major' },
  critical: { color: 'text-red-400', label: 'Breaking' },
};
