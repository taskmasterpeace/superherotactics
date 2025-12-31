/**
 * NEWSPAPER EXPANSION - Local Country News Content
 *
 * The NEWSPAPER shows news for YOUR COUNTRY only:
 * - Local politics (your president, government actions)
 * - Classified ads (local job opportunities)
 * - Wanted posters (local bounties)
 * - Letters to editor (local public opinion)
 * - Crime reports (local incidents)
 *
 * The INTERNET/WEB BROWSER handles world/international news.
 */

import { GameTime } from './timeSystem';
import { Country } from './allCountries';

// =============================================================================
// CLASSIFIED ADS SYSTEM (Local Jobs & Services)
// =============================================================================

export type ClassifiedCategory =
  | 'security'      // Bodyguard, protection work
  | 'investigation' // Detective work, surveillance
  | 'retrieval'     // Recovery jobs
  | 'enforcement'   // Muscle work
  | 'specialist'    // Special skills required
  | 'underground'   // Black market hints
  | 'real_estate'   // Base opportunities
  | 'services';     // Underground services

export type ClassifiedLegality = 'legal' | 'gray' | 'illegal';

export interface ClassifiedAd {
  id: string;
  category: ClassifiedCategory;
  legality: ClassifiedLegality;
  title: string;
  description: string;
  contactInfo: string;
  isCodedMessage: boolean;
  payment: number;
  paymentType: 'cash' | 'credits' | 'equipment' | 'intel' | 'favor';
  missionId?: string;
  expiresDay?: number;
  isRead: boolean;
  respondedTo: boolean;
  publishedDay: number;
  publishedHour: number;
}

// =============================================================================
// WANTED POSTERS / BOUNTIES
// =============================================================================

export type BountyStatus = 'active' | 'claimed' | 'expired' | 'cancelled';
export type BountyIssuer = 'government' | 'corporation' | 'private' | 'criminal' | 'unknown';

export interface WantedPoster {
  id: string;
  status: BountyStatus;
  targetName: string;
  targetAlias?: string;
  targetDescription: string;
  isPlayerCharacter: boolean;
  reward: number;
  rewardCurrency: 'usd' | 'local' | 'crypto';
  issuer: BountyIssuer;
  issuerName?: string;
  deadOrAlive: 'alive' | 'dead' | 'either';
  crimes: string[];
  lastSeen?: string;
  dangerLevel: 1 | 2 | 3 | 4 | 5;
  powersKnown?: string[];
  missionId?: string;
  publishedDay: number;
  expiresDay?: number;
}

// =============================================================================
// LETTERS TO THE EDITOR
// =============================================================================

export type LetterSentiment = 'positive' | 'negative' | 'mixed' | 'neutral';
export type LetterTopic =
  | 'hero_praise'
  | 'hero_criticism'
  | 'vigilante_debate'
  | 'superhuman_rights'
  | 'collateral_damage'
  | 'government_response'
  | 'personal_story'
  | 'conspiracy'
  | 'safety_concerns';

export interface LetterToEditor {
  id: string;
  authorName: string;
  authorLocation: string;
  authorType: 'citizen' | 'business_owner' | 'victim' | 'official' | 'expert' | 'anonymous';
  subject: string;
  body: string;
  sentiment: LetterSentiment;
  topic: LetterTopic;
  relatedEvent?: string;
  relatedCharacter?: string;
  agreedCount: number;
  disagreedCount: number;
  publishedDay: number;
  publishedHour: number;
}

// =============================================================================
// LOCAL NEWS HEADLINES (Country-specific)
// =============================================================================

export interface LocalNewsHeadline {
  id: string;
  headline: string;
  summary: string;
  category: 'politics' | 'crime' | 'economy' | 'sports' | 'culture' | 'superhuman';
  isBreaking: boolean;
  publishedDay: number;
  publishedHour: number;
}

// =============================================================================
// NEWSPAPER NAME TEMPLATES (by culture code)
// =============================================================================

/**
 * Newspaper name templates for each culture code (1-14)
 * Used to generate culturally-appropriate newspaper names based on home city
 */
export const NEWSPAPER_NAME_TEMPLATES: Record<number, string[]> = {
  1: [ // North Africa (Arabic influence)
    'Al-{city} Times',
    'The {city} Tribune',
    '{city} Observer',
    'Al-{city} Herald',
    'The {city} Chronicle',
  ],
  2: [ // Central Africa (French/English mix)
    'Le {city} Post',
    '{city} Daily',
    'The {city} Herald',
    '{city} Gazette',
    'Le Courrier de {city}',
  ],
  3: [ // Southern Africa (English)
    'The {city} Star',
    '{city} Daily Mail',
    'The {city} Times',
    '{city} Mercury',
    'The {city} Dispatch',
  ],
  4: [ // Central Asia (Russian influence)
    '{city} Today',
    'The {city} Voice',
    '{city} Daily News',
    'The {city} Sentinel',
    '{city} Chronicle',
  ],
  5: [ // South Asia (English/colonial)
    'The {city} Times',
    '{city} Express',
    'The {city} Chronicle',
    '{city} Daily',
    'The {city} Standard',
  ],
  6: [ // East & Southeast Asia
    '{city} Daily News',
    'The {city} Post',
    '{city} Morning',
    'The {city} Herald',
    '{city} Today',
  ],
  7: [ // Caribbean (English)
    'The {city} Gleaner',
    '{city} Observer',
    'The {city} Star',
    '{city} News',
    'The {city} Voice',
  ],
  8: [ // Central America (Spanish)
    'El Diario de {city}',
    'La Prensa {city}',
    '{city} Times',
    'El {city} Herald',
    'La Voz de {city}',
  ],
  9: [ // Western Europe
    'The {city} Times',
    '{city} Guardian',
    'The {city} Gazette',
    '{city} Post',
    'The {city} Telegraph',
  ],
  10: [ // Eastern Europe (Slavic)
    '{city} Gazeta',
    'The {city} Post',
    '{city} Today',
    'The {city} Daily',
    '{city} Tribune',
  ],
  11: [ // Oceania (English)
    'The {city} Herald',
    '{city} Morning Post',
    'The {city} Age',
    '{city} Daily',
    'The {city} Courier',
  ],
  12: [ // South America (Spanish/Portuguese)
    'O {city} Globo',
    'El {city}',
    'The {city} Herald',
    'Diario {city}',
    'La Nación {city}',
  ],
  13: [ // North America (English)
    'The {city} Tribune',
    '{city} Herald',
    'The {city} Post',
    '{city} Sun',
    'The {city} Inquirer',
  ],
  14: [ // Middle East (Arabic)
    'Al-{city}',
    'The {city} Times',
    '{city} Tribune',
    'Al-{city} News',
    'The {city} Standard',
  ],
};

/**
 * Generate a newspaper name for the player's home city
 * @param cityName - The name of the home base city
 * @param cultureCode - The culture code (1-14) of the city's region
 * @returns A culturally-appropriate newspaper name
 */
export function generateNewspaperName(cityName: string, cultureCode: number): string {
  const templates = NEWSPAPER_NAME_TEMPLATES[cultureCode] || NEWSPAPER_NAME_TEMPLATES[9]; // Default to Western Europe
  const template = templates[Math.floor(Math.random() * templates.length)];
  return template.replace('{city}', cityName);
}

// =============================================================================
// HEADLINE TEMPLATES (use country data)
// =============================================================================

export const POLITICAL_HEADLINES = {
  positive: [
    '{leaderTitle} {presidentName} Announces New Economic Initiative',
    '{leaderTitle} {presidentName} Approval Ratings Rise After Speech',
    'Government Unveils Infrastructure Project',
    '{nationality} Economy Shows Signs of Growth',
    '{leaderTitle} {presidentName} Meets with Foreign Dignitaries',
  ],
  negative: [
    '{leaderTitle} {presidentName} Faces Criticism Over Policy',
    'Opposition Calls for Reform',
    'Protesters Gather Outside Parliament',
    '{leaderTitle} {presidentName} Approval Ratings Decline',
    'Government Spending Under Scrutiny',
  ],
  neutral: [
    '{leaderTitle} {presidentName} Addresses Nation',
    'Parliament Debates New Legislation',
    'Government Reports Quarterly Progress',
    '{nationality} Delegation Attends Summit',
    'New Policy Under Review',
  ],
};

export const CRIME_HEADLINES = [
  'Police Investigate Incident in {district}',
  'Crime Rate Reported in Annual Statistics',
  'Security Forces Respond to Disturbance',
  'Authorities Seek Witnesses to {district} Incident',
  'Law Enforcement Conducts Operations',
];

export const SUPERHUMAN_HEADLINES = {
  positive: [
    'Vigilante Stops Crime in {district}',
    'Superhuman Activity Saves Lives',
    'Masked Hero Praised by Locals',
    'Unknown Super Prevents Disaster',
  ],
  negative: [
    'Vigilante Activity Causes Property Damage',
    'Government Warns Against Unregistered Supers',
    'Collateral Damage Reported After Super Battle',
    'Critics Question Vigilante Justice',
  ],
  neutral: [
    'Superhuman Activity Reported in {district}',
    'LSW Registration Deadline Approaches',
    'Government Reviews Superhuman Policy',
    'Public Opinion Split on Vigilante Activity',
  ],
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Substitute variables in template string
 */
export function substituteVars(template: string, vars: Record<string, string | number>): string {
  let result = template;
  for (const [key, value] of Object.entries(vars)) {
    result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), String(value));
  }
  return result;
}

/**
 * Generate a local news headline using country data
 */
export function generateLocalHeadline(
  country: Country,
  category: LocalNewsHeadline['category'],
  sentiment: 'positive' | 'negative' | 'neutral' = 'neutral',
  gameTime: GameTime
): LocalNewsHeadline {
  const vars = {
    presidentName: country.president,
    leaderTitle: country.leaderTitle,
    nationality: country.nationality,
    countryName: country.name,
    district: pickRandom(['Downtown', 'Industrial District', 'Harbor', 'University Area', 'Financial District']),
  };

  let headline: string;

  if (category === 'politics') {
    headline = substituteVars(pickRandom(POLITICAL_HEADLINES[sentiment]), vars);
  } else if (category === 'superhuman') {
    headline = substituteVars(pickRandom(SUPERHUMAN_HEADLINES[sentiment]), vars);
  } else {
    headline = substituteVars(pickRandom(CRIME_HEADLINES), vars);
  }

  return {
    id: generateId('news'),
    headline,
    summary: headline,
    category,
    isBreaking: Math.random() < 0.1,
    publishedDay: gameTime.day,
    publishedHour: gameTime.hour,
  };
}

/**
 * Generate political headlines specific to country's government type
 */
export function generatePoliticalNews(country: Country, gameTime: GameTime): LocalNewsHeadline[] {
  const headlines: LocalNewsHeadline[] = [];
  const isAuthoritarian = country.governmentPerception === 'Authoritarian Regime';
  const isCorrupt = country.governmentCorruption > 60;

  // Generate 2-3 political headlines
  if (isAuthoritarian) {
    // Authoritarian countries have more "positive" propaganda-style news
    headlines.push(generateLocalHeadline(country, 'politics', 'positive', gameTime));
    headlines.push(generateLocalHeadline(country, 'politics', 'neutral', gameTime));
  } else if (isCorrupt) {
    // Corrupt democracies might have more controversy
    headlines.push(generateLocalHeadline(country, 'politics', 'negative', gameTime));
    headlines.push(generateLocalHeadline(country, 'politics', 'neutral', gameTime));
  } else {
    // Clean democracies have mixed coverage
    headlines.push(generateLocalHeadline(country, 'politics', 'neutral', gameTime));
    if (Math.random() < 0.5) {
      headlines.push(generateLocalHeadline(country, 'politics', 'positive', gameTime));
    }
  }

  return headlines;
}

/**
 * Create a classified ad
 */
export function createClassifiedAd(
  category: ClassifiedCategory,
  legality: ClassifiedLegality,
  gameTime: GameTime,
  options: Partial<ClassifiedAd> = {}
): ClassifiedAd {
  return {
    id: generateId('classified'),
    category,
    legality,
    title: options.title || 'Position Available',
    description: options.description || 'Contact for details.',
    contactInfo: options.contactInfo || 'Reply to Box #' + Math.floor(Math.random() * 9000 + 1000),
    isCodedMessage: legality === 'illegal' && Math.random() < 0.5,
    payment: options.payment || Math.floor(Math.random() * 10000) + 1000,
    paymentType: options.paymentType || 'cash',
    missionId: options.missionId,
    expiresDay: options.expiresDay || gameTime.day + 7,
    isRead: false,
    respondedTo: false,
    publishedDay: gameTime.day,
    publishedHour: gameTime.hour,
  };
}

/**
 * Create a wanted poster
 */
export function createWantedPoster(
  targetName: string,
  issuer: BountyIssuer,
  gameTime: GameTime,
  options: Partial<WantedPoster> = {}
): WantedPoster {
  return {
    id: generateId('wanted'),
    status: 'active',
    targetName,
    targetAlias: options.targetAlias,
    targetDescription: options.targetDescription || 'Individual wanted for questioning.',
    isPlayerCharacter: options.isPlayerCharacter || false,
    reward: options.reward || Math.floor(Math.random() * 50000) + 5000,
    rewardCurrency: options.rewardCurrency || 'local',
    issuer,
    issuerName: options.issuerName,
    deadOrAlive: options.deadOrAlive || 'alive',
    crimes: options.crimes || ['Unknown'],
    lastSeen: options.lastSeen,
    dangerLevel: options.dangerLevel || 2,
    powersKnown: options.powersKnown,
    missionId: options.missionId,
    publishedDay: gameTime.day,
    expiresDay: options.expiresDay,
  };
}

/**
 * Create a letter to the editor
 */
export function createLetter(
  topic: LetterTopic,
  sentiment: LetterSentiment,
  gameTime: GameTime,
  options: Partial<LetterToEditor> = {}
): LetterToEditor {
  const authorTypes: LetterToEditor['authorType'][] = ['citizen', 'business_owner', 'victim', 'anonymous'];

  return {
    id: generateId('letter'),
    authorName: options.authorName || pickRandom(['J. Smith', 'Concerned Citizen', 'Anonymous', 'Local Resident']),
    authorLocation: options.authorLocation || 'Local',
    authorType: options.authorType || pickRandom(authorTypes),
    subject: options.subject || 'Reader Opinion',
    body: options.body || 'I have thoughts on recent events.',
    sentiment,
    topic,
    relatedEvent: options.relatedEvent,
    relatedCharacter: options.relatedCharacter,
    agreedCount: Math.floor(Math.random() * 1000),
    disagreedCount: Math.floor(Math.random() * 500),
    publishedDay: gameTime.day,
    publishedHour: gameTime.hour,
  };
}

// =============================================================================
// EXPORTS
// =============================================================================

export const NewspaperExpansion = {
  generateLocalHeadline,
  generatePoliticalNews,
  createClassifiedAd,
  createWantedPoster,
  createLetter,
  substituteVars,
  generateNewspaperName,
  NEWSPAPER_NAME_TEMPLATES,
};

export default NewspaperExpansion;
