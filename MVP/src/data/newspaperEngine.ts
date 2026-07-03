/**
 * NEWSPAPER ENGINE — the daily edition generator.
 *
 * Every game day, the player's home country prints a PAPER: a masthead named
 * by culture, a front page led by real game events (missions, combat,
 * investigations), and sections filled by the country's actual character —
 * its politics (government perception + corruption), its streets (crime
 * index), its LSW DESK (colored by the country's LSW law: Banned regimes
 * demonize supers, Legal ones celebrate them), and its business pages (GDP).
 *
 * Press freedom is a lens, not a skin: under propaganda regimes, negative
 * political stories are seized and replaced by ministry notices; biased
 * presses soften them. A free press prints everything.
 *
 * Editions are pure data — the store keeps a back-issue shelf, the
 * NewspaperFrontPage component lays them out like print.
 */

import type { Country } from './countries';
import type { NewsArticle } from './newsSystem';
import {
  generateNewspaperName,
  generatePoliticalNews,
  generateLocalHeadline,
  substituteVars,
} from './newspaperExpansion';
import { calculateMediaSystem, MediaSystem } from './combinedEffects';
import { getCountryOrganization } from './countryOrganizations';
import { getInvasionPhase, INVASION_WIRE } from './invasionEndgame';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface EditionStory {
  id: string;
  /** Links back to a real store article when the story came from game events */
  articleId?: string;
  headline: string;
  summary: string;
  body?: string;
  category: 'politics' | 'crime' | 'superhuman' | 'economy' | 'world' | 'local';
  isBreaking: boolean;
  /** True when the censor got to it first */
  isCensored?: boolean;
  /** From actual gameplay (player-caused) rather than ambient generation */
  isPlayerRelated?: boolean;
  sourceNote?: string;
}

export interface NewspaperEdition {
  id: string;
  day: number;
  masthead: string;
  motto: string;
  dateline: string;
  countryName: string;
  countryCode?: string;
  quality: MediaSystem['journalismQuality'];
  pressFreedom: number;
  censorshipNote?: string;
  /** Lead + up to 4 more */
  frontPage: EditionStory[];
  national: EditionStory[];
  lswDesk: EditionStory[];
  world: EditionStory[];
  business: EditionStory[];
}

// ---------------------------------------------------------------------------
// Ambient banks the expansion file doesn't cover
// ---------------------------------------------------------------------------

const ECONOMY_HEADLINES = {
  boom: [
    '{nationality} Markets Rally to Record Highs',
    'Foreign Investment Pours Into {countryName}',
    'Unemployment Falls as Industry Expands',
    'Central Bank Signals Confidence in {nationality} Economy',
  ],
  stable: [
    'Markets Close Flat in Quiet Trading Day',
    'Central Bank Holds Rates Steady',
    'Small Businesses Report Steady Quarter',
    'Trade Figures Meet Expectations',
  ],
  bust: [
    'Currency Slides as Investors Lose Confidence',
    'Layoffs Announced Across {nationality} Industry',
    'Inflation Squeezes Household Budgets',
    'Economists Warn of Deepening Downturn',
  ],
};

const WORLD_WIRE = [
  'Summit on Superhuman Regulation Ends Without Accord',
  'Border Tensions Flare in Disputed Sector',
  'International Markets React to LSW Incident Abroad',
  'UN Panel Debates Cross-Border Vigilante Activity',
  'Global Shipping Lanes Report Piracy Uptick',
  'Foreign Ministry Recalls Ambassador Amid Row',
];

const LSW_DESK_BY_LAW: Record<string, { lean: 'positive' | 'negative' | 'neutral'; extra: string[] }> = {
  Banned: {
    lean: 'negative',
    extra: [
      'Ministry Reminds Citizens: Report Unregistered Superhumans',
      'Security Forces Conduct Anti-LSW Sweep in {district}',
      'State Media: "Powered Individuals Threaten Public Order"',
    ],
  },
  Regulated: {
    lean: 'neutral',
    extra: [
      'LSW Registration Office Extends Weekend Hours',
      'Licensing Board Reviews {district} Incident',
      'New LSW Compliance Rules Take Effect Next Month',
    ],
  },
  Legal: {
    lean: 'positive',
    extra: [
      'Local LSW Honored at City Ceremony',
      'Super-Powered Volunteers Join Disaster Response',
      'Poll: Majority Support Expanded LSW Protections',
    ],
  },
};

const MOTTO_BY_QUALITY: Record<MediaSystem['journalismQuality'], string> = {
  propaganda: 'The Voice of the Nation',
  biased: 'Your Trusted Source',
  mixed: 'All the News That Matters',
  professional: 'Independent Since 1947',
  excellent: 'Without Fear or Favor',
};

const CENSOR_NOTICE = 'This report was removed by order of the Information Ministry.';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

let editionSeq = 0;
function sid(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${(editionSeq++).toString(36)}`;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function storyFromArticle(a: NewsArticle | any, category: EditionStory['category']): EditionStory {
  return {
    id: sid('st'),
    articleId: a.id,
    headline: a.headline,
    summary: a.summary || a.body?.slice(0, 140) || a.headline,
    body: a.body,
    category,
    isBreaking: a.importance === 'major' || a.importance === 'critical',
    isPlayerRelated: !!(a.eventType || a.missionHook || (a.relatedCharacters?.length)),
    sourceNote: a.source?.name,
  };
}

function ambient(headline: string, category: EditionStory['category'], vars: Record<string, string | number>, breaking = false): EditionStory {
  const text = substituteVars(headline, vars);
  return { id: sid('st'), headline: text, summary: text, category, isBreaking: breaking };
}

/** Apply the censor: propaganda seizes negative politics, biased softens. */
function applyCensorship(stories: EditionStory[], quality: MediaSystem['journalismQuality']): EditionStory[] {
  if (quality !== 'propaganda' && quality !== 'biased') return stories;
  return stories.map(s => {
    const negativePolitics = s.category === 'politics' &&
      /criticism|decline|protest|scrutiny|reform|scandal|corrupt/i.test(s.headline);
    if (!negativePolitics) return s;
    if (quality === 'propaganda') {
      return {
        ...s,
        isCensored: true,
        headline: '[ SEIZED BY THE INFORMATION MINISTRY ]',
        summary: CENSOR_NOTICE,
        body: CENSOR_NOTICE,
      };
    }
    // biased: soften the headline
    return { ...s, headline: s.headline.replace(/Criticism|Decline|Scrutiny/gi, 'Discussion'), sourceNote: 'Editorial review applied' };
  });
}

// ---------------------------------------------------------------------------
// The generator
// ---------------------------------------------------------------------------

export interface EditionInputs {
  country: Country;
  city?: string;
  day: number;
  /** All current store articles — the engine splits home vs world itself */
  articles: NewsArticle[] | any[];
  /** Optional: is-home matcher (falls back to region/name compare) */
  isHome?: (a: any) => boolean;
}

export function generateDailyEdition(inputs: EditionInputs): NewspaperEdition {
  const { country, city, day, articles } = inputs;
  const media = calculateMediaSystem(country);
  const quality = media.journalismQuality;
  const gameTime = { day, hour: 6, minutes: 0 } as any; // papers print at dawn

  const vars = {
    presidentName: (country as any).president || 'the President',
    leaderTitle: (country as any).leaderTitle || 'President',
    nationality: (country as any).nationality || country.name,
    countryName: country.name,
    district: pick(['Downtown', 'Industrial District', 'Harbor', 'University Area', 'Financial District']),
  };

  const isHome = inputs.isHome || ((a: any) => {
    const keys = [country.name, (country as any).code, city].filter(Boolean).map(s => String(s).toLowerCase());
    const fields = [a.region, a.city, ...(a.relatedCountries || [])].filter(Boolean).map((s: any) => String(s).toLowerCase());
    return fields.some(f => keys.some(k => f === k || f.includes(k)));
  });

  // --- Split real articles (recent = last 3 days so the paper isn't stale) --
  const recent = (articles || []).filter((a: any) => {
    const d = a.publishedDay ?? Math.floor((a.timestamp || 0) / 1440);
    return day - d <= 3;
  });
  const realHome = recent.filter(isHome);
  const realWorld = recent.filter((a: any) => !isHome(a));

  // --- NATIONAL: politics + crime, count/tone driven by country stats -------
  const national: EditionStory[] = [];
  for (const h of generatePoliticalNews(country as any, gameTime)) {
    national.push({ id: sid('st'), headline: h.headline, summary: h.summary, category: 'politics', isBreaking: h.isBreaking });
  }
  // crime coverage scales with how criminal the country actually is
  const crimeLoad = (country as any).crimeIndex ?? (100 - ((country as any).lawEnforcement ?? 50));
  const crimeStories = crimeLoad > 66 ? 3 : crimeLoad > 33 ? 2 : 1;
  for (let i = 0; i < crimeStories; i++) {
    const h = generateLocalHeadline(country as any, 'crime', 'neutral', gameTime);
    national.push({ id: sid('st'), headline: h.headline, summary: h.summary, category: 'crime', isBreaking: h.isBreaking });
  }
  // real home stories join the national desk
  for (const a of realHome.slice(0, 4)) national.push(storyFromArticle(a, a.category === 'crime' ? 'crime' : 'local'));

  // --- LSW DESK: tone set by the country's LSW law; the NATIONAL ORG (T1)
  // is the desk's recurring character — its raids, statements and scandals.
  const law = (country as any).lswRegulations || 'Regulated';
  const desk = LSW_DESK_BY_LAW[law] || LSW_DESK_BY_LAW.Regulated;
  const lswActivity = (country as any).lswActivity ?? 30;
  const org = getCountryOrganization((country as any).code || country.name);
  const lswDesk: EditionStory[] = [];
  const lswCount = lswActivity > 60 ? 3 : lswActivity > 25 ? 2 : 1;
  for (let i = 0; i < lswCount; i++) {
    const h = generateLocalHeadline(country as any, 'superhuman', desk.lean, gameTime);
    lswDesk.push({ id: sid('st'), headline: h.headline, summary: h.summary, category: 'superhuman', isBreaking: h.isBreaking });
  }
  lswDesk.push(ambient(pick(desk.extra), 'superhuman', vars));
  if (org) {
    const ORG_LINES: Record<string, string[]> = {
      sponsors: [
        `${org.acronym} ${org.leaderTitle} ${org.leaderName} Announces Expanded LSW Benefits`,
        `${org.orgName} Parades New Powered Recruits Through the Capital`,
      ],
      regulates: [
        `${org.acronym} Publishes Updated Registration Compliance Figures`,
        `${org.leaderTitle} ${org.leaderName}: "${org.acronym} Will Audit Every License"`,
      ],
      hunts: [
        `${org.acronym} Claims Another Successful Anti-LSW Operation`,
        `${org.orgName} Expands Informant Network — Rewards Doubled`,
      ],
      denies: [
        `Officials Repeat: No Superhuman Activity In This Country`,
        `Foreign Reports of Powered Individuals "Fabrications," Says Ministry`,
      ],
    };
    const line = pick(ORG_LINES[org.stance] || ORG_LINES.regulates);
    lswDesk.unshift({
      id: sid('st'), headline: line,
      summary: org.agenda,
      category: 'superhuman', isBreaking: false,
      sourceNote: org.acronym,
    });
  }

  // --- BUSINESS: GDP + corruption pick the register -------------------------
  const gdp = (country as any).gdpPerCapita ?? (country as any).gdp ?? 50;
  const corruption = (country as any).governmentCorruption ?? 50;
  const econKey = gdp > 60 && corruption < 55 ? 'boom' : gdp < 30 || corruption > 75 ? 'bust' : 'stable';
  const business: EditionStory[] = [
    ambient(pick(ECONOMY_HEADLINES[econKey]), 'economy', vars),
    ambient(pick(ECONOMY_HEADLINES[econKey === 'boom' ? 'stable' : econKey]), 'economy', vars),
  ];

  // --- WORLD: real foreign stories, wire filler when quiet ------------------
  const world: EditionStory[] = realWorld.slice(0, 4).map((a: any) => storyFromArticle(a, 'world'));
  while (world.length < 2) world.push(ambient(pick(WORLD_WIRE), 'world', vars));
  // The armada casts a longer shadow every phase (spec 111 foreshadowing)
  const invasionPhase = getInvasionPhase(day);
  if (invasionPhase !== 'distant_signals' || Math.random() < 0.3) {
    world.unshift(ambient(pick(INVASION_WIRE[invasionPhase]), 'world', vars,
      invasionPhase === 'arrival_imminent' || invasionPhase === 'invasion'));
  }

  // --- Censor pass BEFORE choosing the front page ---------------------------
  const censoredNational = applyCensorship(national, quality);

  // --- FRONT PAGE: real player-related news leads; breaking ambient backs it
  const candidates = [
    ...censoredNational.filter(s => !s.isCensored),
    ...lswDesk,
    ...world,
    ...business,
  ];
  candidates.sort((a, b) =>
    (Number(b.isPlayerRelated) * 4 + Number(b.isBreaking) * 2) -
    (Number(a.isPlayerRelated) * 4 + Number(a.isBreaking) * 2)
  );
  const frontPage = candidates.slice(0, 5);

  return {
    id: `edition_${day}_${(country as any).code || country.name}`,
    day,
    masthead: generateNewspaperName(city || country.name, (country as any).cultureCode ?? 13),
    motto: MOTTO_BY_QUALITY[quality],
    dateline: `Day ${day} — ${city ? `${city}, ` : ''}${country.name}`,
    countryName: country.name,
    countryCode: (country as any).code,
    quality,
    pressFreedom: media.pressFreedom,
    censorshipNote: quality === 'propaganda'
      ? 'All content reviewed and approved by the Information Ministry.'
      : quality === 'biased'
        ? 'Published under national editorial guidance.'
        : undefined,
    frontPage,
    national: censoredNational,
    lswDesk,
    world,
    business,
  };
}
