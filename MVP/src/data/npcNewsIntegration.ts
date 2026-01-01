/**
 * NPC News Integration (NL-007)
 *
 * Bridges NPC Life Events to the News Generation system.
 * NPCs with significant events generate news stories:
 * - Famous people dying
 * - Criminals arrested
 * - Known contacts betraying
 * - Enemies returning for revenge
 */

import { LifeEvent, LifeEventType, getLifeEventManager } from './npcLifeEvents';
import { NPCEntity, getNPCManager } from './npcSystem';
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
 * Map NPC life event to news category
 */
function mapLifeEventToNewsCategory(event: LifeEvent): NewsCategory {
  const mapping: Partial<Record<LifeEventType, NewsCategory>> = {
    arrested: 'crime',
    released: 'crime',
    died: 'local',
    betrayed: 'crime',
    compromised: 'superhuman',
    returned: 'superhuman',
    upgraded: 'superhuman',
    promoted: 'politics',
    demoted: 'politics',
    recruited: 'local',
    married: 'entertainment',
    divorced: 'entertainment',
  };
  return mapping[event.type] || 'local';
}

/**
 * Determine importance based on NPC and event type
 */
function determineImportance(event: LifeEvent, npc?: NPCEntity): NewsImportance {
  // Deaths and betrayals are usually major
  if (event.type === 'died' || event.type === 'betrayed') {
    return npc?.relationship === 'ally' ? 'major' : 'standard';
  }

  // Returns of spared enemies are attention-grabbing
  if (event.type === 'returned' || event.type === 'upgraded') {
    return 'major';
  }

  // Arrests of high-threat individuals
  if (event.type === 'arrested') {
    if (npc?.threatLevel === 'level_5' || npc?.threatLevel === 'level_4') {
      return 'breaking';
    }
    if (npc?.threatLevel === 'level_3') {
      return 'major';
    }
  }

  return 'minor';
}

// ============================================================================
// HEADLINE GENERATION
// ============================================================================

const HEADLINE_TEMPLATES: Partial<Record<LifeEventType, string[]>> = {
  arrested: [
    '{name} Apprehended by Authorities',
    'Police Arrest {name} in {city}',
    'Criminal {name} Finally Behind Bars',
    'Wanted Figure {name} in Custody',
  ],
  released: [
    '{name} Released from Custody',
    'Controversial Release: {name} Walks Free',
    '{name} Released After Investigation',
  ],
  died: [
    '{name} Found Dead in {city}',
    'Tragic End for {name}',
    '{name} Dies Under {cause}',
    'Community Mourns Loss of {name}',
  ],
  betrayed: [
    '{name} Betrays Associates in Shocking Turn',
    'Informant {name} Breaks Ranks',
    '{name} Flips: Inside Story',
    'Double-Cross: {name} Turns Witness',
  ],
  compromised: [
    '{name}\'s Cover Blown in {city}',
    'Undercover Operative {name} Exposed',
    'Security Breach: {name} Identified',
  ],
  returned: [
    '{name} Returns to {city}',
    'Former Adversary {name} Resurfaces',
    '{name} Back and Reportedly Seeking Revenge',
    'Watch Out: {name} Has Returned',
  ],
  upgraded: [
    '{name} Growing More Dangerous',
    'Threat Level Rising: {name}',
    'Reports Suggest {name} Has Grown Stronger',
  ],
  promoted: [
    '{name} Receives Promotion',
    '{name} Advances in Ranks',
    'Career Success for {name} in {city}',
  ],
  demoted: [
    '{name} Demoted Amid Controversy',
    'Fall from Grace: {name}',
    '{name} Loses Position in Shakeup',
  ],
  recruited: [
    '{name} Joins {org}',
    'New Recruit: {name}',
    '{org} Welcomes {name}',
  ],
  married: [
    '{name} Ties the Knot',
    'Wedding Bells for {name}',
  ],
  divorced: [
    '{name} Files for Divorce',
    'Splitsville: {name} and Partner Separate',
  ],
};

/**
 * Generate a headline for the life event
 */
function generateHeadline(event: LifeEvent, npc?: NPCEntity): string {
  const templates = HEADLINE_TEMPLATES[event.type];
  if (!templates || templates.length === 0) {
    return event.description; // Fall back to default description
  }

  const template = templates[Math.floor(Math.random() * templates.length)];

  return template
    .replace('{name}', event.npcName)
    .replace('{city}', event.newLocation?.city || npc?.currentCity || 'Unknown City')
    .replace('{cause}', event.details || 'Unknown Circumstances')
    .replace('{org}', npc?.employer || 'an Organization');
}

// ============================================================================
// ARTICLE BODY GENERATION
// ============================================================================

const BODY_TEMPLATES: Partial<Record<LifeEventType, (event: LifeEvent, npc?: NPCEntity) => string>> = {
  arrested: (event, npc) => {
    const city = npc?.currentCity || 'an undisclosed location';
    const role = npc?.role || 'individual';
    return `Authorities in ${city} have confirmed the arrest of ${event.npcName}, ` +
      `a known ${role} with reported ties to underground activities. ` +
      `The arrest follows an ongoing investigation. ` +
      `Further details are expected as the case proceeds.`;
  },

  released: (event, npc) => {
    return `${event.npcName} has been released from custody, according to official sources. ` +
      `The circumstances surrounding the release remain under wraps. ` +
      `Legal experts suggest the case may have lacked sufficient evidence.`;
  },

  died: (event, npc) => {
    const cause = event.details || 'causes yet to be determined';
    const city = npc?.currentCity || 'the area';
    return `${event.npcName} was found deceased in ${city}. ` +
      `Initial reports indicate ${cause}. ` +
      `Authorities have opened an investigation. ` +
      `Those who knew ${event.npcName} expressed shock at the news.`;
  },

  betrayed: (event, npc) => {
    const role = npc?.role || 'figure';
    return `In a stunning development, ${event.npcName} has betrayed former associates. ` +
      `The ${role} is reportedly cooperating with authorities or rival factions. ` +
      `This betrayal could have far-reaching consequences for ongoing operations. ` +
      `Former allies are said to be reassessing their security protocols.`;
  },

  compromised: (event, npc) => {
    return `${event.npcName}'s identity has been exposed, sources confirm. ` +
      `The individual, who was operating under cover, is now at significant risk. ` +
      `It remains unclear how the breach occurred. ` +
      `Security analysts warn this could compromise ongoing intelligence operations.`;
  },

  returned: (event, npc) => {
    const city = event.newLocation?.city || npc?.currentCity || 'the region';
    const timesSpared = npc?.timesSpared || 1;
    return `${event.npcName} has resurfaced in ${city} after a period of absence. ` +
      `Sources suggest the individual may be seeking revenge against those who previously defeated them. ` +
      (timesSpared > 1
        ? `This marks their ${timesSpared}th return after being spared. `
        : `Having been spared once before, they appear determined not to fail again. `) +
      `Residents are advised to remain vigilant.`;
  },

  upgraded: (event, npc) => {
    return `Intelligence reports indicate ${event.npcName} has grown significantly more capable. ` +
      `${event.details || 'The individual appears to have upgraded their skills and equipment.'} ` +
      `Threat assessments are being updated accordingly. ` +
      `Those with previous encounters should exercise extreme caution.`;
  },

  promoted: (event, npc) => {
    const role = npc?.role || 'position';
    return `${event.npcName} has received a promotion within their organization. ` +
      `The advancement reflects recognition of their contributions as a ${role}. ` +
      `Colleagues offered congratulations on the career milestone.`;
  },

  demoted: (event, npc) => {
    return `${event.npcName} has been demoted from their previous position. ` +
      `Sources suggest internal politics or performance issues led to the decision. ` +
      `The demotion may signal broader changes within the organization.`;
  },

  recruited: (event, npc) => {
    const newRole = npc?.role || 'member';
    return `${event.npcName} has been recruited as a ${newRole}. ` +
      `The recruitment signals the individual's transition into new responsibilities. ` +
      `Details of their new role remain limited.`;
  },

  married: (event, npc) => {
    return `${event.npcName} has gotten married in a private ceremony. ` +
      `Friends and family gathered to celebrate the occasion. ` +
      `The couple has requested privacy during this special time.`;
  },

  divorced: (event, npc) => {
    return `${event.npcName} has filed for divorce, according to public records. ` +
      `The split comes after an undisclosed period of marriage. ` +
      `Neither party has issued a public statement.`;
  },
};

/**
 * Generate article body from life event
 */
function generateArticleBody(event: LifeEvent, npc?: NPCEntity): string {
  const generator = BODY_TEMPLATES[event.type];
  if (generator) {
    return generator(event, npc);
  }
  return event.description + (event.details ? ` ${event.details}` : '');
}

// ============================================================================
// NEWS ARTICLE GENERATION
// ============================================================================

/**
 * Convert a life event to a news article
 */
export function lifeEventToNewsArticle(event: LifeEvent): NewsArticle | null {
  // Only generate news for newsworthy events
  if (!event.isNewsworthy) {
    return null;
  }

  const npcManager = getNPCManager();
  const npc = npcManager.getNPC(event.npcId);
  const timeEngine = getTimeEngine();
  const time = timeEngine.getTime();

  const category = mapLifeEventToNewsCategory(event);
  const importance = determineImportance(event, npc);
  const source = pickRandomSource(category);

  const headline = generateHeadline(event, npc);
  const body = generateArticleBody(event, npc);

  return createNewsArticle({
    headline,
    body,
    summary: event.description,
    source,
    publishedDay: time.day,
    publishedHour: time.hour,
    category,
    importance,
    region: npc?.currentCountry || event.newLocation?.country,
    city: npc?.currentCity || event.newLocation?.city,
    relatedCharacters: [event.npcId],
    relatedFactions: npc?.employer ? [npc.employer] : [],
    eventType: 'faction_action', // Closest built-in type
    eventId: event.id,
    expiresDay: time.day + 7, // News expires after a week
  });
}

/**
 * Process all newsworthy life events and generate articles
 */
export function processLifeEventsToNews(events: LifeEvent[]): NewsArticle[] {
  return events
    .filter(e => e.isNewsworthy)
    .map(e => lifeEventToNewsArticle(e))
    .filter((article): article is NewsArticle => article !== null);
}

// ============================================================================
// NPC NEWS INTEGRATION MANAGER
// ============================================================================

let integrationInstance: NPCNewsIntegration | null = null;

export class NPCNewsIntegration {
  private started: boolean = false;
  private generatedArticles: NewsArticle[] = [];

  start(): void {
    if (this.started) return;
    this.started = true;

    const timeEngine = getTimeEngine();

    // Process life events daily and generate news
    timeEngine.on('day_change', () => {
      const lifeEventManager = getLifeEventManager();
      const recentEvents = lifeEventManager.getNewsworthyEvents();

      // Only process events from the last day
      const currentTime = timeEngine.getTime().totalHours;
      const todaysEvents = recentEvents.filter(
        e => currentTime - e.timestamp <= 24
      );

      const articles = processLifeEventsToNews(todaysEvents);
      this.generatedArticles.push(...articles);

      // Keep last 50 articles
      if (this.generatedArticles.length > 50) {
        this.generatedArticles = this.generatedArticles.slice(-50);
      }
    });
  }

  /**
   * Get all generated NPC news articles
   */
  getArticles(): NewsArticle[] {
    return [...this.generatedArticles];
  }

  /**
   * Get articles for a specific NPC
   */
  getArticlesForNPC(npcId: string): NewsArticle[] {
    return this.generatedArticles.filter(
      a => a.relatedCharacters.includes(npcId)
    );
  }

  /**
   * Manually generate news from a life event
   */
  generateNewsFromEvent(event: LifeEvent): NewsArticle | null {
    const article = lifeEventToNewsArticle(event);
    if (article) {
      this.generatedArticles.push(article);
    }
    return article;
  }
}

export function getNPCNewsIntegration(): NPCNewsIntegration {
  if (!integrationInstance) {
    integrationInstance = new NPCNewsIntegration();
  }
  return integrationInstance;
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  lifeEventToNewsArticle,
  processLifeEventsToNews,
  getNPCNewsIntegration,
};
