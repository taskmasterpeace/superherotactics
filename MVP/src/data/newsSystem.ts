/**
 * News System - SuperHero Tactics
 *
 * Generates news articles based on game events.
 * News serves multiple purposes:
 * 1. World flavor - makes the world feel alive
 * 2. Investigation leads - news stories can become cases
 * 3. Reputation feedback - see how your actions are reported
 * 4. Mission hooks - news can reveal opportunities
 *
 * News Sources have different biases and credibility levels.
 */

import { GameTime, formatDate, formatShortDate } from './timeSystem';
import { ReputationAxis } from './reputationSystem';

// ============================================================================
// CORE TYPES
// ============================================================================

export type NewsCategory =
  | 'crime'
  | 'politics'
  | 'superhuman'
  | 'business'
  | 'international'
  | 'local'
  | 'science'
  | 'entertainment'
  | 'sports'
  | 'weather'
  | 'opinion';

export type NewsBias =
  | 'pro_hero'
  | 'anti_hero'
  | 'neutral'
  | 'tabloid'
  | 'government'
  | 'corporate'
  | 'independent';

export type NewsImportance = 'breaking' | 'major' | 'standard' | 'minor' | 'filler';

export interface NewsSource {
  id: string;
  name: string;
  bias: NewsBias;
  credibility: number;    // 0-100
  regions: string[];      // Country codes covered (empty = global)
  categories: NewsCategory[];
  description: string;
}

export interface NewsArticle {
  id: string;
  headline: string;
  body: string;
  summary?: string;       // Short version for feeds

  // Source & timing
  source: NewsSource;
  publishedDay: number;
  publishedHour: number;
  category: NewsCategory;
  importance: NewsImportance;

  // Location
  region?: string;        // Country code
  city?: string;          // City name
  sectorCode?: string;    // Sector on world map

  // Related entities
  relatedCharacters: string[];   // Character IDs mentioned
  relatedFactions: string[];     // Faction IDs mentioned
  relatedLocations: string[];    // Location names mentioned

  // Gameplay hooks
  investigationLead?: string;    // Investigation ID this can start
  missionHook?: string;          // Mission ID this relates to
  reputationEffects?: Partial<Record<ReputationAxis, number>>;

  // State
  isRead: boolean;
  isBookmarked: boolean;
  expiresDay?: number;    // When news becomes old/irrelevant

  // Generated from event?
  eventType?: NewsEventType;
  eventId?: string;
}

// ============================================================================
// NEWS EVENTS
// ============================================================================

export type NewsEventType =
  | 'mission_complete'
  | 'mission_failed'
  | 'combat_witnessed'
  | 'reputation_milestone'
  | 'world_event'
  | 'faction_action'
  | 'crime_reported'
  | 'political_event'
  | 'scientific_discovery'
  | 'superhuman_sighting'
  | 'business_news';

export interface NewsEvent {
  type: NewsEventType;
  timestamp: GameTime;
  data: NewsEventData;
}

export type NewsEventData =
  | MissionCompleteData
  | MissionFailedData
  | CombatWitnessedData
  | ReputationMilestoneData
  | WorldEventData
  | FactionActionData
  | CrimeReportedData
  | SuperhumanSightingData;

export interface MissionCompleteData {
  missionId: string;
  missionName: string;
  outcome: 'success' | 'partial' | 'failure';
  visibility: number;        // 0-100, how public was this?
  location: string;
  casualties: number;
  propertyDamage: number;    // Dollar amount
  heroesInvolved: string[];
  villainsInvolved: string[];
}

export interface MissionFailedData {
  missionId: string;
  missionName: string;
  reason: string;
  visibility: number;
  location: string;
  consequences: string[];
}

export interface CombatWitnessedData {
  location: string;
  sectorCode: string;
  participants: string[];
  witnesses: number;
  casualties: number;
  duration: number;          // In minutes
  outcome: string;
}

export interface ReputationMilestoneData {
  axis: ReputationAxis;
  threshold: number;
  direction: 'up' | 'down';
  characterId: string;
  characterName: string;
}

export interface WorldEventData {
  templateId: string;
  variables: Record<string, string>;
  region?: string;
}

export interface FactionActionData {
  factionId: string;
  factionName: string;
  action: string;
  target?: string;
  region?: string;
}

export interface CrimeReportedData {
  crimeType: string;
  location: string;
  severity: 'minor' | 'moderate' | 'major' | 'catastrophic';
  suspects?: string[];
  victims?: number;
  investigationPossible: boolean;
}

export interface SuperhumanSightingData {
  characterName: string;
  location: string;
  action: string;
  witnesses: number;
  powers_displayed?: string[];
}

// ============================================================================
// NEWS SOURCES
// ============================================================================

export const NEWS_SOURCES: NewsSource[] = [
  // Global sources
  {
    id: 'world_news_network',
    name: 'World News Network',
    bias: 'neutral',
    credibility: 85,
    regions: [],
    categories: ['international', 'politics', 'business', 'superhuman'],
    description: 'Major international news network with global coverage.',
  },
  {
    id: 'daily_sentinel',
    name: 'The Daily Sentinel',
    bias: 'pro_hero',
    credibility: 75,
    regions: [],
    categories: ['superhuman', 'crime', 'local'],
    description: 'Newspaper known for positive superhero coverage.',
  },
  {
    id: 'truth_gazette',
    name: 'Truth Gazette',
    bias: 'anti_hero',
    credibility: 60,
    regions: [],
    categories: ['superhuman', 'crime', 'opinion'],
    description: 'Publication critical of superhuman activity.',
  },
  {
    id: 'metro_times',
    name: 'Metro Times',
    bias: 'neutral',
    credibility: 70,
    regions: [],
    categories: ['local', 'crime', 'business', 'entertainment'],
    description: 'Urban news covering city life and events.',
  },
  {
    id: 'scandal_weekly',
    name: 'Scandal Weekly',
    bias: 'tabloid',
    credibility: 30,
    regions: [],
    categories: ['entertainment', 'superhuman', 'opinion'],
    description: 'Tabloid focused on rumors and sensationalism.',
  },
  {
    id: 'government_press',
    name: 'Official Press Service',
    bias: 'government',
    credibility: 65,
    regions: [],
    categories: ['politics', 'international', 'superhuman'],
    description: 'Government-aligned news releases.',
  },
  {
    id: 'corporate_digest',
    name: 'Corporate Digest',
    bias: 'corporate',
    credibility: 70,
    regions: [],
    categories: ['business', 'science', 'politics'],
    description: 'Business-focused publication.',
  },
  {
    id: 'underground_wire',
    name: 'Underground Wire',
    bias: 'independent',
    credibility: 55,
    regions: [],
    categories: ['crime', 'superhuman', 'opinion'],
    description: 'Alternative news from unofficial sources.',
  },
  {
    id: 'science_today',
    name: 'Science Today',
    bias: 'neutral',
    credibility: 90,
    regions: [],
    categories: ['science', 'superhuman'],
    description: 'Scientific publication covering research and discoveries.',
  },
  {
    id: 'sports_central',
    name: 'Sports Central',
    bias: 'neutral',
    credibility: 80,
    regions: [],
    categories: ['sports', 'entertainment'],
    description: 'Sports news and coverage.',
  },
];

// ============================================================================
// CATEGORY INFO
// ============================================================================

export const NEWS_CATEGORY_INFO: Record<NewsCategory, {
  name: string;
  icon: string;
  color: string;
}> = {
  crime: { name: 'Crime', icon: '🚨', color: 'red' },
  politics: { name: 'Politics', icon: '🏛️', color: 'blue' },
  superhuman: { name: 'Superhuman', icon: '⚡', color: 'purple' },
  business: { name: 'Business', icon: '💼', color: 'green' },
  international: { name: 'International', icon: '🌍', color: 'cyan' },
  local: { name: 'Local', icon: '🏘️', color: 'orange' },
  science: { name: 'Science', icon: '🔬', color: 'teal' },
  entertainment: { name: 'Entertainment', icon: '🎬', color: 'pink' },
  sports: { name: 'Sports', icon: '🏆', color: 'yellow' },
  weather: { name: 'Weather', icon: '🌤️', color: 'lightblue' },
  opinion: { name: 'Opinion', icon: '💭', color: 'gray' },
};

export const NEWS_IMPORTANCE_INFO: Record<NewsImportance, {
  label: string;
  color: string;
  duration: number;  // Days until considered old
}> = {
  breaking: { label: 'BREAKING', color: 'red', duration: 1 },
  major: { label: 'Major', color: 'orange', duration: 3 },
  standard: { label: '', color: 'white', duration: 7 },
  minor: { label: '', color: 'gray', duration: 3 },
  filler: { label: '', color: 'gray', duration: 1 },
};

// ============================================================================
// NEWS STATE
// ============================================================================

export interface NewsState {
  articles: NewsArticle[];
  maxArticles: number;
  unreadCount: number;
  bookmarkedIds: string[];
  lastCheckedDay: number;
}

export const DEFAULT_NEWS_STATE: NewsState = {
  articles: [],
  maxArticles: 100,
  unreadCount: 0,
  bookmarkedIds: [],
  lastCheckedDay: 0,
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Generate unique article ID
 */
export function generateArticleId(): string {
  return `news_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Get news source by ID
 */
export function getNewsSourceById(id: string): NewsSource | undefined {
  return NEWS_SOURCES.find(s => s.id === id);
}

/**
 * Get sources for a category
 */
export function getSourcesForCategory(category: NewsCategory): NewsSource[] {
  return NEWS_SOURCES.filter(s => s.categories.includes(category));
}

/**
 * Get sources by bias
 */
export function getSourcesByBias(bias: NewsBias): NewsSource[] {
  return NEWS_SOURCES.filter(s => s.bias === bias);
}

/**
 * Pick a random source for a category
 */
export function pickRandomSource(category: NewsCategory): NewsSource {
  const sources = getSourcesForCategory(category);
  if (sources.length === 0) {
    // Default to a neutral source
    return NEWS_SOURCES.find(s => s.bias === 'neutral') || NEWS_SOURCES[0];
  }
  return sources[Math.floor(Math.random() * sources.length)];
}

/**
 * Create initial news state
 */
export function createInitialNewsState(): NewsState {
  return { ...DEFAULT_NEWS_STATE };
}

/**
 * Add article to news state
 */
export function addNewsArticle(
  state: NewsState,
  article: NewsArticle
): NewsState {
  const newArticles = [article, ...state.articles];

  // Trim to max
  if (newArticles.length > state.maxArticles) {
    // Keep bookmarked articles, remove oldest non-bookmarked
    const bookmarked = newArticles.filter(a => state.bookmarkedIds.includes(a.id));
    const nonBookmarked = newArticles.filter(a => !state.bookmarkedIds.includes(a.id));

    while (bookmarked.length + nonBookmarked.length > state.maxArticles && nonBookmarked.length > 0) {
      nonBookmarked.pop();
    }

    return {
      ...state,
      articles: [...bookmarked, ...nonBookmarked].sort((a, b) => b.publishedDay - a.publishedDay),
      unreadCount: state.unreadCount + (article.isRead ? 0 : 1),
    };
  }

  return {
    ...state,
    articles: newArticles,
    unreadCount: state.unreadCount + (article.isRead ? 0 : 1),
  };
}

/**
 * Mark article as read
 */
export function markArticleRead(
  state: NewsState,
  articleId: string
): NewsState {
  const article = state.articles.find(a => a.id === articleId);
  if (!article || article.isRead) return state;

  return {
    ...state,
    articles: state.articles.map(a =>
      a.id === articleId ? { ...a, isRead: true } : a
    ),
    unreadCount: Math.max(0, state.unreadCount - 1),
  };
}

/**
 * Toggle bookmark
 */
export function toggleBookmark(
  state: NewsState,
  articleId: string
): NewsState {
  const isBookmarked = state.bookmarkedIds.includes(articleId);

  return {
    ...state,
    bookmarkedIds: isBookmarked
      ? state.bookmarkedIds.filter(id => id !== articleId)
      : [...state.bookmarkedIds, articleId],
    articles: state.articles.map(a =>
      a.id === articleId ? { ...a, isBookmarked: !isBookmarked } : a
    ),
  };
}

/**
 * Get articles by category
 */
export function getArticlesByCategory(
  state: NewsState,
  category: NewsCategory
): NewsArticle[] {
  return state.articles.filter(a => a.category === category);
}

/**
 * Get articles by region
 */
export function getArticlesByRegion(
  state: NewsState,
  region: string
): NewsArticle[] {
  return state.articles.filter(a => a.region === region);
}

/**
 * Get unread articles
 */
export function getUnreadArticles(state: NewsState): NewsArticle[] {
  return state.articles.filter(a => !a.isRead);
}

/**
 * Get bookmarked articles
 */
export function getBookmarkedArticles(state: NewsState): NewsArticle[] {
  return state.articles.filter(a => a.isBookmarked);
}

/**
 * Get articles with investigation leads
 */
export function getArticlesWithLeads(state: NewsState): NewsArticle[] {
  return state.articles.filter(a => a.investigationLead);
}

/**
 * Check if article is expired
 */
export function isArticleExpired(article: NewsArticle, currentDay: number): boolean {
  if (!article.expiresDay) return false;
  return currentDay > article.expiresDay;
}

/**
 * Clean expired articles
 */
export function cleanExpiredArticles(
  state: NewsState,
  currentDay: number
): NewsState {
  return {
    ...state,
    articles: state.articles.filter(a =>
      a.isBookmarked || !isArticleExpired(a, currentDay)
    ),
  };
}

/**
 * Get recent articles (last N days)
 */
export function getRecentArticles(
  state: NewsState,
  currentDay: number,
  days: number = 7
): NewsArticle[] {
  return state.articles.filter(a => currentDay - a.publishedDay <= days);
}

// ============================================================================
// ARTICLE CREATION HELPERS
// ============================================================================

/**
 * Create a news article
 */
export function createNewsArticle(
  headline: string,
  body: string,
  category: NewsCategory,
  importance: NewsImportance,
  gameTime: GameTime,
  options: Partial<NewsArticle> = {}
): NewsArticle {
  const source = options.source || pickRandomSource(category);
  const importanceInfo = NEWS_IMPORTANCE_INFO[importance];

  return {
    id: generateArticleId(),
    headline,
    body,
    summary: options.summary || headline,
    source,
    publishedDay: gameTime.day,
    publishedHour: gameTime.hour,
    category,
    importance,
    region: options.region,
    city: options.city,
    sectorCode: options.sectorCode,
    relatedCharacters: options.relatedCharacters || [],
    relatedFactions: options.relatedFactions || [],
    relatedLocations: options.relatedLocations || [],
    investigationLead: options.investigationLead,
    missionHook: options.missionHook,
    reputationEffects: options.reputationEffects,
    isRead: false,
    isBookmarked: false,
    expiresDay: gameTime.day + importanceInfo.duration,
    eventType: options.eventType,
    eventId: options.eventId,
  };
}

// ============================================================================
// FORMAT FUNCTIONS
// ============================================================================

/**
 * Format article timestamp
 */
export function formatArticleTime(article: NewsArticle, currentDay: number): string {
  const daysAgo = currentDay - article.publishedDay;

  if (daysAgo === 0) {
    return 'Today';
  } else if (daysAgo === 1) {
    return 'Yesterday';
  } else if (daysAgo < 7) {
    return `${daysAgo} days ago`;
  } else {
    return `${Math.floor(daysAgo / 7)} weeks ago`;
  }
}

/**
 * Get bias label
 */
export function getBiasLabel(bias: NewsBias): string {
  const labels: Record<NewsBias, string> = {
    pro_hero: 'Pro-Hero',
    anti_hero: 'Anti-Hero',
    neutral: 'Neutral',
    tabloid: 'Tabloid',
    government: 'Government',
    corporate: 'Corporate',
    independent: 'Independent',
  };
  return labels[bias];
}

/**
 * Get credibility label
 */
export function getCredibilityLabel(credibility: number): string {
  if (credibility >= 85) return 'Highly Credible';
  if (credibility >= 70) return 'Credible';
  if (credibility >= 50) return 'Mixed';
  if (credibility >= 30) return 'Questionable';
  return 'Unreliable';
}
