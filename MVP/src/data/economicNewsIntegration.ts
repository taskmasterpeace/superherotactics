/**
 * Economic News Integration (EL-008)
 *
 * Generates news articles from economic events:
 * - Price fluctuations
 * - Market conditions
 * - Currency changes
 * - Supply/demand shifts
 */

import { PriceEvent, getPriceEventManager, PriceEventType } from './priceFluctuation';
import { getDynamicEconomyManager, MarketCondition, GoodsCategory } from './dynamicEconomy';
import { getTimeEngine } from './timeEngine';
import {
  NewsArticle,
  NewsCategory,
  NewsImportance,
  createNewsArticle,
  pickRandomSource,
} from './newsSystem';
import { getCountryByCode } from './countries';

// ============================================================================
// NEWS GENERATION FROM PRICE EVENTS
// ============================================================================

const IMPORTANCE_MAP: Partial<Record<PriceEventType, NewsImportance>> = {
  coup: 'breaking',
  civil_war: 'breaking',
  sanctions: 'major',
  natural_disaster: 'breaking',
  pandemic: 'breaking',
  currency_crisis: 'major',
  arms_deal: 'standard',
  factory_opened: 'minor',
  factory_closed: 'standard',
  trade_agreement: 'standard',
  boom: 'standard',
  recession: 'major',
  black_market_raid: 'minor',
  smuggling_route: 'minor',
  war_nearby: 'major',
  peacetime: 'standard',
};

const BODY_TEMPLATES: Partial<Record<PriceEventType, (event: PriceEvent, countryName: string) => string>> = {
  coup: (event, countryName) =>
    `The military takeover in ${countryName} has flooded local markets with surplus equipment. ` +
    `Weapons and ammunition prices have dropped significantly as armories are emptied. ` +
    `Economic analysts predict this glut will last until the new government stabilizes.`,

  civil_war: (event, countryName) =>
    `Ongoing conflict in ${countryName} has created critical shortages of essential supplies. ` +
    `Medical supplies and weapons have seen prices double as demand outstrips supply. ` +
    `International aid organizations are struggling to maintain deliveries.`,

  sanctions: (event, countryName) =>
    `International sanctions against ${countryName} are beginning to bite. ` +
    `Electronics and vehicles are increasingly difficult to source, with prices climbing. ` +
    `The embargo is expected to last until diplomatic relations improve.`,

  natural_disaster: (event, countryName) =>
    `A devastating natural disaster has struck ${countryName}, creating urgent demand for medical supplies. ` +
    `Prices for essential goods have spiked as relief efforts are mobilized. ` +
    `International aid is being coordinated but local markets remain strained.`,

  pandemic: (event, countryName) =>
    `A health emergency in ${countryName} has sent medical supply prices soaring. ` +
    `Hospitals report critical shortages as demand overwhelms supply chains. ` +
    `Emergency measures are in effect to stabilize the healthcare system.`,

  arms_deal: (event, countryName) =>
    `A major arms deal has resulted in surplus military equipment entering the ${countryName} market. ` +
    `Defense contractors are offloading inventory at reduced prices. ` +
    `This represents a temporary opportunity for buyers in the region.`,

  currency_crisis: (event, countryName) =>
    `The ${countryName} economy is reeling from a currency crisis. ` +
    `As the local currency collapses, prices in USD terms have dropped dramatically. ` +
    `Economists warn this may lead to further instability.`,

  boom: (event, countryName) =>
    `${countryName} is experiencing an economic boom, with demand for goods surging. ` +
    `Prices have risen as consumers compete for limited inventory. ` +
    `Analysts expect this growth phase to continue for several quarters.`,

  recession: (event, countryName) =>
    `Economic recession has gripped ${countryName}, forcing prices downward. ` +
    `Consumer demand has collapsed, leaving merchants with excess inventory. ` +
    `Bargain hunters may find opportunities in this downturn.`,

  black_market_raid: (event, countryName) =>
    `Authorities in ${countryName} have conducted a major raid on black market operations. ` +
    `Underground prices have spiked as supply networks are disrupted. ` +
    `Law enforcement vows to continue cracking down on illegal trade.`,

  smuggling_route: (event, countryName) =>
    `A new smuggling route has been established into ${countryName}, according to sources. ` +
    `Black market prices have dropped as supply increases. ` +
    `Authorities are reportedly investigating the operation.`,

  war_nearby: (event, countryName) =>
    `Conflict in neighboring regions is affecting markets in ${countryName}. ` +
    `Demand for weapons and protective equipment has increased dramatically. ` +
    `Prices are expected to remain elevated while instability continues.`,

  peacetime: (event, countryName) =>
    `Peace has returned to ${countryName}, stabilizing local markets. ` +
    `Prices for weapons and ammunition have begun to normalize. ` +
    `Economic recovery is expected as security improves.`,
};

/**
 * Generate news article from a price event
 */
export function priceEventToNewsArticle(event: PriceEvent): NewsArticle {
  const country = getCountryByCode(event.countryCode);
  const countryName = country?.name || event.countryCode;
  const timeEngine = getTimeEngine();
  const time = timeEngine.getTime();

  const importance = IMPORTANCE_MAP[event.type] || 'standard';
  const category: NewsCategory = 'business';
  const source = pickRandomSource(category);

  const bodyGenerator = BODY_TEMPLATES[event.type];
  const body = bodyGenerator
    ? bodyGenerator(event, countryName)
    : `Economic conditions in ${countryName} are affecting local markets. ` +
      `Prices are fluctuating as supply and demand adjust to new conditions.`;

  return createNewsArticle({
    headline: event.headline,
    body,
    summary: `${event.type.replace('_', ' ')} affecting prices in ${countryName}`,
    source,
    publishedDay: time.day,
    publishedHour: time.hour,
    category,
    importance,
    region: event.countryCode,
    eventType: 'business_news',
    eventId: event.id,
    expiresDay: time.day + Math.min(14, event.durationDays),
  });
}

// ============================================================================
// MARKET CONDITION NEWS
// ============================================================================

const MARKET_CONDITION_HEADLINES: Record<MarketCondition, string[]> = {
  boom: [
    'Economic Boom Drives Consumer Spending',
    'Markets Surge on Strong Growth',
    'Prosperity Returns: Economy Thriving',
  ],
  normal: [
    'Markets Stabilize After Volatility',
    'Economy Returns to Normal',
    'Steady Growth Expected',
  ],
  recession: [
    'Recession Fears Grip Economy',
    'Downturn Deepens: Markets Struggle',
    'Economic Contraction Continues',
  ],
  crisis: [
    'Economic Crisis: Markets in Freefall',
    'Emergency Measures as Economy Collapses',
    'Crisis Deepens: Desperate Times',
  ],
  shortage: [
    'Supply Shortages Create Panic Buying',
    'Critical Goods Running Low',
    'Shortages Drive Prices Sky High',
  ],
  flooded: [
    'Market Glut: Prices Plummet',
    'Oversupply Creates Buyer\'s Market',
    'Excess Inventory Forces Discounts',
  ],
};

/**
 * Generate news for market condition changes
 */
export function generateMarketConditionNews(
  countryCode: string,
  oldCondition: MarketCondition,
  newCondition: MarketCondition
): NewsArticle | null {
  if (oldCondition === newCondition) return null;

  const country = getCountryByCode(countryCode);
  const countryName = country?.name || countryCode;
  const timeEngine = getTimeEngine();
  const time = timeEngine.getTime();

  const headlines = MARKET_CONDITION_HEADLINES[newCondition];
  const headline = headlines[Math.floor(Math.random() * headlines.length)];

  const importance: NewsImportance =
    newCondition === 'crisis' || newCondition === 'shortage' ? 'major' :
    newCondition === 'boom' || newCondition === 'flooded' ? 'standard' : 'minor';

  const source = pickRandomSource('business');

  const body =
    `Economic conditions in ${countryName} have shifted from ${oldCondition} to ${newCondition}. ` +
    `Local businesses are adapting to the new market environment. ` +
    `Analysts are monitoring the situation for further developments.`;

  return createNewsArticle({
    headline: `${countryName}: ${headline}`,
    body,
    summary: `${countryName} economy shifts to ${newCondition} condition`,
    source,
    publishedDay: time.day,
    publishedHour: time.hour,
    category: 'business',
    importance,
    region: countryCode,
    eventType: 'business_news',
    expiresDay: time.day + 7,
  });
}

// ============================================================================
// ECONOMIC NEWS MANAGER
// ============================================================================

let economicNewsManagerInstance: EconomicNewsManager | null = null;

export class EconomicNewsManager {
  private generatedArticles: NewsArticle[] = [];
  private marketConditions: Map<string, MarketCondition> = new Map();
  private started: boolean = false;

  start(): void {
    if (this.started) return;
    this.started = true;

    const timeEngine = getTimeEngine();

    // Check for market condition changes daily
    timeEngine.on('day_change', () => {
      this.checkMarketConditions();
    });
  }

  /**
   * Generate news from a price event
   */
  generateFromPriceEvent(event: PriceEvent): NewsArticle {
    const article = priceEventToNewsArticle(event);
    this.generatedArticles.push(article);

    // Keep last 50 articles
    if (this.generatedArticles.length > 50) {
      this.generatedArticles = this.generatedArticles.slice(-50);
    }

    return article;
  }

  /**
   * Check for market condition changes and generate news
   */
  private checkMarketConditions(): void {
    const economyManager = getDynamicEconomyManager();

    // Check all tracked markets
    for (const [countryCode, oldCondition] of this.marketConditions) {
      const market = economyManager.getMarket(countryCode);
      const newCondition = market.condition;

      if (oldCondition !== newCondition) {
        const article = generateMarketConditionNews(countryCode, oldCondition, newCondition);
        if (article) {
          this.generatedArticles.push(article);
        }
        this.marketConditions.set(countryCode, newCondition);
      }
    }
  }

  /**
   * Start tracking a country's market
   */
  trackMarket(countryCode: string): void {
    const economyManager = getDynamicEconomyManager();
    const market = economyManager.getMarket(countryCode);
    this.marketConditions.set(countryCode, market.condition);
  }

  /**
   * Get generated economic news
   */
  getArticles(): NewsArticle[] {
    return [...this.generatedArticles];
  }

  /**
   * Get articles for a specific country
   */
  getArticlesForCountry(countryCode: string): NewsArticle[] {
    return this.generatedArticles.filter(a => a.region === countryCode);
  }
}

export function getEconomicNewsManager(): EconomicNewsManager {
  if (!economicNewsManagerInstance) {
    economicNewsManagerInstance = new EconomicNewsManager();
  }
  return economicNewsManagerInstance;
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  priceEventToNewsArticle,
  generateMarketConditionNews,
  getEconomicNewsManager,
};
