/**
 * Criminal News Bridge
 *
 * Generates news articles from criminal organization activities and events.
 * Integrates with the existing news system to create crime news.
 */

import { Country } from './allCountries';
import { City } from './cities';
import {
  CriminalOrganization,
  getHeatLevel,
} from './criminalOrganization';
import { ActivityResult, ACTIVITY_CONFIG } from './crimeActivities';
import { SimulationEvent } from './criminalSimulation';
import {
  NewsArticle,
  NewsSource,
  NewsCategory,
  NewsBias,
  NewsImportance,
} from './newsSystem';

// ============ CRIME NEWS SOURCES ============

export const CRIME_NEWS_SOURCES: NewsSource[] = [
  {
    id: 'police_blotter',
    name: 'Police Blotter',
    bias: 'government',
    credibility: 75,
    regions: [],
    categories: ['crime'],
    description: 'Official police reports and crime statistics',
  },
  {
    id: 'crime_watch',
    name: 'Crime Watch Daily',
    bias: 'neutral',
    credibility: 60,
    regions: [],
    categories: ['crime', 'local'],
    description: 'Local crime news and community alerts',
  },
  {
    id: 'underworld_insider',
    name: 'The Underworld Insider',
    bias: 'tabloid',
    credibility: 40,
    regions: [],
    categories: ['crime'],
    description: 'Sensational crime stories and gang gossip',
  },
  {
    id: 'investigative_times',
    name: 'Investigative Times',
    bias: 'independent',
    credibility: 85,
    regions: [],
    categories: ['crime', 'politics'],
    description: 'In-depth investigations into organized crime',
  },
];

// ============ HEADLINE TEMPLATES ============

interface HeadlineTemplate {
  success: string[];
  failure: string[];
}

const ACTIVITY_HEADLINES: Record<string, HeadlineTemplate> = {
  drug_deal: {
    success: [
      'Drug Activity Reported in {city}',
      'Narcotics Trade Flourishes Despite Patrols',
      'Residents Concerned as Drug Sales Rise',
    ],
    failure: [
      'Police Bust Drug Ring in {city}',
      'Major Drug Seizure: {arrests} Arrested',
      'Undercover Operation Nets Drug Dealers',
    ],
  },
  armed_robbery: {
    success: [
      'Daring Heist Shocks {city}',
      'Armed Robbers Escape with Fortune',
      'Bank Robbery: Suspects at Large',
    ],
    failure: [
      'Robbery Foiled: {arrests} Arrested',
      'Quick Police Response Stops Heist',
      'Failed Robbery Ends in Arrests',
    ],
  },
  assassination_contract: {
    success: [
      'Prominent Figure Murdered in {city}',
      'Contract Killing Shocks Community',
      'Police Hunt Professional Killer',
    ],
    failure: [
      'Assassination Attempt Fails',
      'Target Survives Attack in {city}',
      'Would-Be Assassin Captured',
    ],
  },
  kidnapping_operation: {
    success: [
      'Kidnapping Reported in {city}',
      'Ransom Demands Follow Abduction',
      'Family Pleads for Safe Return',
    ],
    failure: [
      'Hostage Rescued in {city}',
      'Kidnapping Gang Arrested',
      'Police Storm Hideout, Save Victim',
    ],
  },
  human_trafficking_run: {
    success: [
      'Human Trafficking Ring Active',
      'Border Security Concerns Grow',
      'Authorities Investigate Smuggling Routes',
    ],
    failure: [
      'Human Trafficking Ring Busted',
      '{arrests} Traffickers Arrested',
      'Victims Rescued in Major Operation',
    ],
  },
  arms_deal: {
    success: [
      'Illegal Weapons Flood Streets',
      'Arms Trafficking Concerns Grow',
      'Black Market Guns Worry Police',
    ],
    failure: [
      'Weapons Cache Seized in {city}',
      'Arms Dealers Arrested in Sting',
      'Police Intercept Weapons Shipment',
    ],
  },
  cyber_heist: {
    success: [
      'Cyber Criminals Strike {city} Banks',
      'Millions Stolen in Digital Heist',
      'Hackers Target Financial Institutions',
    ],
    failure: [
      'Cyber Attack Thwarted by Security',
      'Digital Heist Foiled, Suspects Traced',
      'Police Track Down Hackers',
    ],
  },
  territory_expansion: {
    success: [
      'Gang Violence Spreads to New Areas',
      'Turf Wars Heat Up in {city}',
      'Criminal Influence Expanding',
    ],
    failure: [
      'Police Push Back Against Gang Expansion',
      'Crackdown Stops Criminal Advance',
      'Community Resists Gang Takeover',
    ],
  },
  default: {
    success: [
      'Criminal Activity Reported in {city}',
      'Crime Rate Rises in {city}',
      'Authorities Investigate Incidents',
    ],
    failure: [
      'Police Make Arrests in {city}',
      'Criminal Operation Disrupted',
      'Law Enforcement Scores Victory',
    ],
  },
};

const ORG_EVENT_HEADLINES: Record<string, string[]> = {
  spawn: [
    'New Criminal Organization Emerges',
    'Gang Activity Detected in {city}',
    'Authorities Monitor New Criminal Group',
  ],
  eliminated: [
    '{org} Dismantled by Authorities',
    'Criminal Organization Falls in {city}',
    'End of an Era: {org} Destroyed',
  ],
  conflict: [
    'Gang War Erupts in {city}',
    '{org} Clashes with Rivals',
    'Violence Escalates: {org} Under Attack',
  ],
  arrest: [
    'Major Bust: {arrests} Arrested',
    'Police Raid {org} Operations',
    'Sweep Targets Organized Crime',
  ],
  state_change: [
    '{org} Activity Shifts in {city}',
    'Criminal Landscape Evolving',
    'Power Dynamics Change in Underworld',
  ],
};

// ============ NEWS GENERATION ============

/**
 * Generate a news article from a criminal activity.
 */
export function generateActivityNews(
  org: CriminalOrganization,
  activityResult: ActivityResult,
  city: City,
  country: Country,
  currentDay: number,
  currentHour: number
): NewsArticle | null {
  // Only generate news for newsworthy activities
  if (!activityResult.newsworthy) {
    return null;
  }

  const config = ACTIVITY_CONFIG[activityResult.activityType];
  const templates = ACTIVITY_HEADLINES[activityResult.activityType] || ACTIVITY_HEADLINES.default;
  const headlineList = activityResult.success ? templates.success : templates.failure;

  // Select headline template
  const headlineTemplate = headlineList[Math.floor(Math.random() * headlineList.length)];
  const headline = headlineTemplate
    .replace('{city}', city.name)
    .replace('{arrests}', String(activityResult.personnelLost || 'several'));

  // Select source based on crime type and success
  const source = selectNewsSource(activityResult, country);

  // Determine importance
  const importance = determineImportance(activityResult, org);

  // Generate body text
  const body = generateArticleBody(org, activityResult, city, country, source.bias);

  return {
    id: `crime_news_${Date.now()}_${Math.random()}`,
    headline,
    body,
    summary: headline,

    source,
    publishedDay: currentDay,
    publishedHour: currentHour,
    category: 'crime',
    importance,

    region: country.code,
    city: city.name,
    sectorCode: city.sector,

    relatedCharacters: [],
    relatedFactions: [org.id],
    relatedLocations: [city.name],

    investigationLead: activityResult.success ? undefined : `inv_${org.id}`,
    missionHook: undefined,
    reputationEffects: {
      criminal: activityResult.success ? 5 : -5,
    },

    isRead: false,
    isBookmarked: false,
    expiresDay: currentDay + 7,

    eventType: 'crime_reported' as any,
    eventId: org.id,
  };
}

/**
 * Generate a news article from a simulation event.
 */
export function generateEventNews(
  event: SimulationEvent,
  country: Country,
  currentDay: number,
  currentHour: number
): NewsArticle | null {
  // Only generate news for newsworthy events
  if (!event.newsworthy) {
    return null;
  }

  const headlineList = ORG_EVENT_HEADLINES[event.type] || ORG_EVENT_HEADLINES.state_change;
  const headlineTemplate = headlineList[Math.floor(Math.random() * headlineList.length)];

  const headline = headlineTemplate
    .replace('{city}', event.city)
    .replace('{org}', event.orgName)
    .replace('{arrests}', String((event.details as any).arrests || 'several'));

  // Select appropriate source
  const source = CRIME_NEWS_SOURCES[Math.floor(Math.random() * CRIME_NEWS_SOURCES.length)];

  // Determine importance
  let importance: NewsImportance = 'standard';
  if (event.type === 'eliminated') importance = 'major';
  if (event.type === 'conflict') importance = 'major';
  if (event.type === 'spawn') importance = 'minor';

  // Generate body
  const body = generateEventBody(event, country, source.bias);

  return {
    id: `event_news_${Date.now()}_${Math.random()}`,
    headline: event.headline || headline,
    body,
    summary: event.description,

    source,
    publishedDay: currentDay,
    publishedHour: currentHour,
    category: 'crime',
    importance,

    region: country.code,
    city: event.city,

    relatedCharacters: [],
    relatedFactions: [event.orgId],
    relatedLocations: [event.city],

    isRead: false,
    isBookmarked: false,
    expiresDay: currentDay + 14,

    eventType: 'crime_reported' as any,
    eventId: event.id,
  };
}

// ============ HELPER FUNCTIONS ============

function selectNewsSource(activityResult: ActivityResult, country: Country): NewsSource {
  // Government sources more likely for failed crimes (police perspective)
  if (!activityResult.success && Math.random() > 0.5) {
    return CRIME_NEWS_SOURCES.find(s => s.id === 'police_blotter')!;
  }

  // Tabloids love sensational stories
  if (activityResult.activityType === 'assassination_contract' ||
      activityResult.activityType === 'kidnapping_operation') {
    return CRIME_NEWS_SOURCES.find(s => s.id === 'underworld_insider')!;
  }

  // Default to crime watch
  return CRIME_NEWS_SOURCES.find(s => s.id === 'crime_watch')!;
}

function determineImportance(activityResult: ActivityResult, org: CriminalOrganization): NewsImportance {
  const config = ACTIVITY_CONFIG[activityResult.activityType];

  if (config.riskLevel === 'extreme') return 'breaking';
  if (config.riskLevel === 'high') return 'major';
  if (org.heat > 60) return 'major';
  if (!activityResult.success && activityResult.personnelLost > 3) return 'major';

  return 'standard';
}

function generateArticleBody(
  org: CriminalOrganization,
  activityResult: ActivityResult,
  city: City,
  country: Country,
  bias: NewsBias
): string {
  const config = ACTIVITY_CONFIG[activityResult.activityType];

  let body = '';

  // Opening paragraph based on success
  if (activityResult.success) {
    body += `${city.name} - Authorities are investigating reports of ${config.name.toLowerCase()} ` +
      `in the ${city.cityTypes[0] || 'downtown'} district. `;
  } else {
    body += `${city.name} - Law enforcement officials announced ${activityResult.personnelLost || 'multiple'} ` +
      `arrests following a failed ${config.name.toLowerCase()} attempt. `;
  }

  // Middle paragraph based on bias
  switch (bias) {
    case 'government':
      body += `Police spokesperson stated that the department is committed to maintaining public safety. ` +
        `"We will not tolerate criminal activity in our community," the official said. `;
      break;
    case 'tabloid':
      body += `Sources close to the investigation revealed shocking details about the incident. ` +
        `Witnesses reported hearing gunshots and seeing suspicious vehicles flee the scene. `;
      break;
    case 'independent':
      body += `This incident appears to be part of a larger pattern of criminal activity in the region. ` +
        `Community advocates are calling for increased investment in prevention programs. `;
      break;
    default:
      body += `Residents in the area expressed concern about rising crime rates. ` +
        `Local businesses have reported increased security measures in response. `;
  }

  // Closing paragraph
  if (org.heat > 50) {
    body += `Authorities believe this may be connected to ongoing gang activity in the area.`;
  } else {
    body += `The investigation is ongoing. Anyone with information is urged to contact local authorities.`;
  }

  return body;
}

function generateEventBody(
  event: SimulationEvent,
  country: Country,
  bias: NewsBias
): string {
  let body = `${event.city} - ${event.description}. `;

  switch (event.type) {
    case 'eliminated':
      body += `Law enforcement officials confirmed the dismantling of the criminal organization. ` +
        `The operation was the result of months of investigation and coordination between agencies. `;
      break;
    case 'conflict':
      body += `Violence erupted as rival criminal factions clashed in the streets. ` +
        `Residents are advised to avoid the affected areas until further notice. `;
      break;
    case 'arrest':
      body += `Multiple arrests were made during the operation. ` +
        `Seized assets include weapons, cash, and evidence of criminal enterprise. `;
      break;
    default:
      body += `Authorities are monitoring the situation and have increased patrols in the area. `;
  }

  body += `This story is developing and will be updated as more information becomes available.`;

  return body;
}

// ============ BATCH NEWS GENERATION ============

/**
 * Generate all newsworthy articles from a week's simulation events.
 */
export function generateWeeklyNews(
  events: SimulationEvent[],
  country: Country,
  currentDay: number
): NewsArticle[] {
  const articles: NewsArticle[] = [];

  // Get newsworthy events
  const newsworthyEvents = events.filter(e => e.newsworthy);

  // Limit to prevent news spam (max 5 stories per week)
  const limitedEvents = newsworthyEvents.slice(0, 5);

  for (const event of limitedEvents) {
    const article = generateEventNews(
      event,
      country,
      currentDay,
      8 + Math.floor(Math.random() * 12) // Random hour 8am-8pm
    );

    if (article) {
      articles.push(article);
    }
  }

  return articles;
}
