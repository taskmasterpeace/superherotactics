# NEWS SYSTEM QUICK REFERENCE
## SuperHero Tactics - Developer Cheat Sheet

> **Quick lookup for implementing the News System**

---

## HEADLINE GENERATION CHEAT SHEET

### Template Selection Logic

```typescript
// Step 1: Determine category
const category =
  fame >= 300 && heroName ? 'celebrity' :
  vigilantismBanned ? 'illegal' :
  !success ? 'failure' :
  civilianCasualties > 0 ? 'success_casualties' :
  collateralDamage > 5000 ? 'success_messy' : 'success_clean';

// Step 2: Select random template from category
const template = HEADLINE_TEMPLATES[category][randomIndex];

// Step 3: Fill placeholders
const headline = template
  .replace('{descriptor}', selectDescriptor(fame, heroName))
  .replace('{city}', mission.city)
  .replace('{crime}', CRIME_DESCRIPTIONS[mission.type])
  .replace('{threat}', THREAT_DESCRIPTIONS[mission.difficulty][0]);
```

### Placeholders Reference

| Placeholder | Description | Example |
|-------------|-------------|---------|
| `{descriptor}` | Hero description based on fame | "Unknown Vigilante", "Marcus Kane" |
| `{heroName}` | Character's hero name | "Delta Demolitions" |
| `{city}` | Mission city | "Lagos" |
| `{country}` | Mission country | "Nigeria" |
| `{crime}` | Mission type as news term | "Bank Robbery" |
| `{threat}` | Enemy description | "Armed Gang Members" |
| `{casualties}` | Number of civilian deaths | "5" |
| `{amount}` | Damage in thousands | "50K" |
| `{target}` | What was destroyed | "City Block", "Police Station" |
| `{faction}` | Enemy faction name | "Technomancer Cult" |

---

## FAME CALCULATION QUICK FORMULA

```typescript
// Base fame from mission outcome
base = success ? (10 + difficulty * 5) : -(5 + difficulty * 2)

// Penalties
casualties_penalty = civilianCasualties * -5
damage_penalty = floor(collateralDamage / 10000) * -1

// Bonuses
stealth_bonus = stealthKill ? +10 : 0
speed_bonus = (completionTime < estimatedTime * 0.5) ? +5 : 0

// Final
fameChange = (base + penalties + bonuses) * difficultyMultiplier
fameChange = clamp(fameChange, -50, 100)
```

### Fame Tiers

| Fame Range | Tier | Descriptor | News Coverage |
|------------|------|------------|---------------|
| 0-49 | Unknown | "Unknown Vigilante" | Local papers only |
| 50-149 | Local | "Local Hero" | City + regional papers |
| 150-299 | Regional | "Known Vigilante" | National news |
| 300-499 | National | Hero Name | International news |
| 500+ | Global | Hero Name | Everything makes headlines |

---

## PUBLIC OPINION QUICK FORMULA

```typescript
// Base change
base = success ? (cleanSuccess ? 10 : 0) : -5

// Legal modifier
legal_mod = isLegal ? +5 : -20

// Casualties
casualties_mod = civilianCasualties * -5  // capped at -30

// Saves
saves_mod = civiliansSaved * +2  // capped at +20

// Final
opinionChange = (base + legal_mod + casualties_mod + saves_mod) * govPerceptionMultiplier
```

### Opinion Effects

| Opinion Range | Tier | Reward Multiplier | Equipment Cost | Bounty |
|---------------|------|-------------------|----------------|--------|
| 50 to 100 | Loved | x2.0 | x0.8 | None |
| 10 to 49 | Liked | x1.5 | x0.9 | None |
| -10 to 9 | Neutral | x1.0 | x1.0 | None |
| -50 to -11 | Disliked | x0.7 | x1.3 | None |
| -100 to -51 | Hated | x0.5 | x1.5 | Active |

---

## WORLD EVENT WEIGHTS

```typescript
// Probability per game day
const EVENT_WEIGHTS = {
  election: country.yearsUntilElection === 0 ? 1.0 : 0.0,  // Deterministic
  disaster: 0.05,  // 5% per day
  villain_attack: country.lswActivity / 100,  // 0-1.0 based on LSW activity
  tech_breakthrough: country.science / 100,  // 0-1.0 based on science
  political_crisis: country.governmentCorruption / 100  // 0-1.0 based on corruption
};

// Select country for event (weighted by attribute)
function selectCountryForEvent(countries, attribute) {
  const totalWeight = countries.reduce((sum, c) => sum + c[attribute], 0);
  let random = Math.random() * totalWeight;

  for (const country of countries) {
    random -= country[attribute];
    if (random <= 0) return country;
  }
}
```

---

## NEWS SOURCES

### Major Outlets (4)

| Source | Bias | Coverage | Credibility | Alignment |
|--------|------|----------|-------------|-----------|
| Global News Network | Pro-regulation | International | 85% | US-aligned |
| Eastern Times | Anti-player | International | 70% | China/Russia |
| Independent Wire | Neutral | International | 95% | Neutral |
| Social Truth Network | Anti-regulation | Internet | 40% | Conspiracy |

### Local Papers (168)

```typescript
// Generate procedurally
const formats = [
  `${city} Daily Tribune`,
  `${city} Herald`,
  `${city} Times`,
  `${city} Post`,
  `The ${city} Observer`,
  `${city} News Network`
];

const localPaper = formats[Math.floor(Math.random() * formats.length)];
```

---

## MISSION SEED GENERATION

```typescript
// From news article keywords
const KEYWORD_TO_MISSION = {
  'kidnapping|abduction': { type: 'rescue', difficulty: 6, reward: 15000 },
  'terrorist|attack|bomb': { type: 'counter_terrorism', difficulty: 8, reward: 30000 },
  'robbery|heist': { type: 'protect', difficulty: 5, reward: 10000 },
  'hideout|base': { type: 'infiltrate', difficulty: 7, reward: 20000 },
  'arms deal|weapons': { type: 'sabotage', difficulty: 6, reward: 12000 }
};

function generateMissionFromArticle(article) {
  for (const [pattern, mission] of Object.entries(KEYWORD_TO_MISSION)) {
    if (new RegExp(pattern, 'i').test(article.fullText)) {
      return createMissionFromSeed({
        ...mission,
        city: extractCityFromArticle(article),
        sector: extractSectorFromArticle(article),
        timeLimit: 72,
        sourceArticleId: article.id
      });
    }
  }
}
```

---

## RUMOR PROGRESSION TIMELINE

| Day | Stage | Template Example | Action |
|-----|-------|------------------|--------|
| -4 | 1 | "Strange lights seen over warehouse district" | Social media post |
| -3 | 2 | "Second report of activity in sector" | Local news article |
| -2 | 3 | "Police scanner: 10-10 suspicious activity" | Scanner alert |
| -1 | 4 | "URGENT: Crime confirmed, mission unlocked" | Mission available |

```typescript
// Process daily
function progressRumors(rumors, gameDay) {
  rumors.forEach(rumor => {
    rumor.stage = Math.min(4, rumor.stage + 1);

    if (rumor.stage === 4) {
      unlockMission(rumor.missionSeedId);
      generateNewsArticle(rumor);
    }
  });
}
```

---

## DATA STRUCTURE SIZES

### Memory Estimates

| Component | Size per Item | Max Items | Total |
|-----------|---------------|-----------|-------|
| NewsArticle | ~2 KB | 1000 (30 days) | ~2 MB |
| PublicOpinion | ~1 KB | 168 countries | ~168 KB |
| Rumor | ~500 bytes | 50 active | ~25 KB |
| FactionIntel | ~1 KB | 20 factions | ~20 KB |

### Cleanup Strategy

```typescript
// Delete articles older than 30 days
const ARTICLE_EXPIRATION_DAYS = 30;

function cleanupOldArticles(articles, currentGameDay) {
  const threshold = currentGameDay - ARTICLE_EXPIRATION_DAYS;

  return articles.filter(article => {
    const articleDay = Math.floor(article.timestamp / 24);
    return articleDay >= threshold;
  });
}
```

---

## INTEGRATION CHECKLIST

### On Mission Complete

```typescript
// CombatScene.ts or missionSystem.ts
function onMissionComplete(mission, result) {
  // 1. Generate news
  const article = generateMissionNews(mission, result);
  gameStore.addNewsArticle(article);

  // 2. Update fame
  const fameChange = calculateFameChange(result);
  gameStore.updateCharacterFame(mission.characterId, fameChange);

  // 3. Update opinion
  const opinionChange = calculateOpinionChange(mission.country, result, mission.isLegal);
  gameStore.updatePublicOpinion(mission.countryCode, opinionChange, 'mission_complete');

  // 4. Check for bounty
  if (opinionChange < -20 && !mission.isLegal) {
    gameStore.issueBounty(mission.characterId, mission.countryCode);
  }
}
```

### Daily Tick

```typescript
// gameSimulation.ts
function advanceGameDay(gameDay) {
  // 1. Process elections
  const electionNews = processElections(gameDay, electionStates);
  electionNews.forEach(article => gameStore.addNewsArticle(article));

  // 2. Generate world events (2-5 per day)
  const numEvents = 2 + Math.floor(Math.random() * 4);
  for (let i = 0; i < numEvents; i++) {
    const event = generateRandomWorldEvent();
    if (event) processWorldEvent(event);
  }

  // 3. Progress rumors
  gameStore.processRumors(gameDay);

  // 4. Decay fame and opinion
  gameStore.characters.forEach(c => processFameDecay(c, gameDay));
  processOpinionDecay(gameStore.publicOpinion, gameDay);

  // 5. Cleanup old articles
  gameStore.archiveOldArticles(gameDay);
}
```

---

## UI COMPONENTS NEEDED

### Priority 1 (MVP)

- [x] `NewsBrowser.tsx` - Main news reading interface
  - Tabs: World, Local, Crime, Politics, Sports, Archive
  - Filters: Source, Country, Date
  - Search bar
- [ ] `ArticleCard.tsx` - Individual article display
  - Headline, source, timestamp
  - Expandable full text
  - Fame/opinion badges
  - Mission opportunity button
- [ ] `FameBadge.tsx` - Show fame changes
  - Green for positive, red for negative
  - +/- number display

### Priority 2 (World Events)

- [ ] `BreakingNewsAlert.tsx` - Full-screen urgent alerts
  - Pausable overlay
  - "BREAKING NEWS" banner animation
  - Respond/Dismiss buttons
- [ ] `NewsNotification.tsx` - Toast-style news popup
  - Brief headline
  - Click to read full article

### Priority 3 (Intel)

- [ ] `InvestigationBoard.tsx` - String-board interface
  - Pin articles
  - Draw connections
  - Pattern detection indicators
- [ ] `RumorTracker.tsx` - Track rumor progression
  - Stage indicators (1-4)
  - Countdown to mission unlock

### Priority 4 (Advanced)

- [ ] `SocialMediaFeed.tsx` - Twitter-style feed
  - Citizen reactions
  - Villain taunts
  - Recruitment opportunities
- [ ] `PoliceScanner.tsx` - Live police radio
  - Scrolling event feed
  - Audio snippets
  - Respond button
- [ ] `OpinionMeter.tsx` - Per-country opinion display
  - Bar graph -100 to +100
  - Color-coded tiers
  - Recent actions list

---

## TESTING SHORTCUTS

### Quick Test Data

```typescript
// Generate test article
const testArticle: NewsArticle = {
  id: 'test-001',
  headline: 'Vigilante Stops Bank Robbery in Lagos',
  source: 'Lagos Daily Tribune',
  category: 'crime',
  bias: 'neutral',
  generatedFrom: { type: 'player_action', missionId: 'test-mission' },
  fullText: 'An unidentified individual stopped a robbery at First Bank.',
  relatedCountries: ['NG'],
  relatedFactions: [],
  timestamp: Date.now(),
  fameImpact: 20,
  publicOpinionShift: { 'NG': 10 }
};

gameStore.addNewsArticle(testArticle);
```

### Test Commands (add to dev console)

```typescript
// window.testNews = { ... }

window.testNews = {
  // Generate 10 random articles
  generateTestArticles: () => {
    for (let i = 0; i < 10; i++) {
      gameStore.addNewsArticle(createRandomArticle());
    }
  },

  // Set character fame
  setFame: (characterId, fame) => {
    gameStore.updateCharacter(characterId, { fame });
  },

  // Set country opinion
  setOpinion: (countryCode, opinion) => {
    gameStore.updatePublicOpinion(countryCode, opinion - gameStore.getPublicOpinion(countryCode).opinion, 'manual');
  },

  // Trigger breaking news
  breakingNews: () => {
    const event = generateVillainAttack(ALL_COUNTRIES);
    processWorldEvent(event);
  }
};
```

---

## COMMON PITFALLS

### 1. Forgetting to Clamp Values

```typescript
// ❌ BAD
character.fame += fameChange;

// ✅ GOOD
character.fame = Math.max(0, Math.min(999, character.fame + fameChange));
```

### 2. Not Converting Game Time

```typescript
// ❌ BAD - using real time
article.timestamp = Date.now();

// ✅ GOOD - using game time
article.timestamp = gameStore.currentGameTime;  // in hours
```

### 3. Leaking References

```typescript
// ❌ BAD - mutates original
const articles = gameStore.newsArticles;
articles.push(newArticle);

// ✅ GOOD - creates copy
gameStore.addNewsArticle(newArticle);  // Uses zustand set()
```

### 4. Infinite Loops in Opinion Decay

```typescript
// ❌ BAD - processes every tick
gameStore.opinions.forEach(o => decayOpinion(o));

// ✅ GOOD - only process daily
if (gameStore.currentGameTime % 24 === 0) {
  processOpinionDecay();
}
```

---

## PERFORMANCE OPTIMIZATION

### 1. Lazy Load Article Full Text

```typescript
// Don't generate full text until player clicks
interface NewsArticle {
  // ... other fields
  fullText?: string;  // Optional initially
  generateFullText: () => string;  // Function to generate on demand
}

// In ArticleCard
const fullText = article.fullText || article.generateFullText();
```

### 2. Paginate News Feed

```typescript
const ARTICLES_PER_PAGE = 20;

function NewsBrowser() {
  const [page, setPage] = useState(0);
  const visibleArticles = articles.slice(page * ARTICLES_PER_PAGE, (page + 1) * ARTICLES_PER_PAGE);

  return (
    <div>
      {visibleArticles.map(a => <ArticleCard key={a.id} article={a} />)}
      <Pagination page={page} setPage={setPage} total={Math.ceil(articles.length / ARTICLES_PER_PAGE)} />
    </div>
  );
}
```

### 3. Memoize Expensive Calculations

```typescript
import { useMemo } from 'react';

function NewsBrowser() {
  const filteredArticles = useMemo(() => {
    return gameStore.newsArticles
      .filter(a => matchesFilters(a, filters))
      .sort((a, b) => b.timestamp - a.timestamp);
  }, [gameStore.newsArticles, filters]);
}
```

---

## BALANCING KNOBS

```typescript
// Adjust these values to tune the system
const NEWS_SYSTEM_CONFIG = {
  // Headline generation
  ARTICLE_GENERATION_CHANCE: 0.8,  // 80% of missions generate news
  FAME_THRESHOLD_CELEBRITY: 300,    // Fame needed for celebrity headlines

  // Fame system
  FAME_DECAY_RATE: 0.02,            // 2% per week if inactive
  FAME_MAX_CHANGE: 100,             // Max fame change per mission
  FAME_DIFFICULTY_MULTIPLIER: 1.5,  // Bonus for hard missions

  // Opinion system
  OPINION_DECAY_RATE: 0.01,         // 1% per week toward neutral
  OPINION_MAX_CHANGE: 30,           // Max opinion change per mission
  OPINION_BOUNTY_THRESHOLD: -50,    // Opinion level that triggers bounty

  // World events
  WORLD_EVENT_FREQUENCY: 0.3,       // 30% chance per game day
  DISASTER_BASE_CHANCE: 0.05,       // 5% per day
  ELECTION_NEWS_ALWAYS: true,       // Always generate news for elections

  // Cleanup
  ARTICLE_EXPIRATION_DAYS: 30,      // Archive after 30 days
  MAX_ARTICLES_IN_MEMORY: 1000,     // Hard cap on total articles

  // Mission generation
  RUMOR_ADVANCE_DAYS: 4,            // Rumors appear 4 days before mission
  MISSION_UNLOCK_PROBABILITY: 0.3,  // 30% of world events unlock missions
};
```

---

## DEBUGGING TOOLS

### Log News Generation

```typescript
// Add to generateMissionNews()
if (process.env.NODE_ENV === 'development') {
  console.log('📰 News Generated:', {
    headline: article.headline,
    fame: article.fameImpact,
    opinion: article.publicOpinionShift,
    category: article.category,
    bias: article.bias
  });
}
```

### Visualize Opinion Changes

```typescript
// Add to CharacterScreen
function OpinionDebugPanel({ character }) {
  const countries = ALL_COUNTRIES;

  return (
    <div className="opinion-debug">
      <h3>Public Opinion Heatmap</h3>
      {countries.map(c => {
        const opinion = gameStore.getPublicOpinion(c.code);
        const color = opinion.opinion >= 0 ? `rgba(34,197,94,${opinion.opinion/100})` : `rgba(239,68,68,${Math.abs(opinion.opinion)/100})`;

        return (
          <div key={c.code} style={{ background: color, padding: '4px' }}>
            {c.code}: {opinion.opinion}
          </div>
        );
      })}
    </div>
  );
}
```

---

## QUICK START IMPLEMENTATION

### Step 1: Add to gameStore

```typescript
// enhancedGameStore.ts
interface EnhancedGameStore {
  // ... existing
  newsArticles: NewsArticle[];
  addNewsArticle: (article: NewsArticle) => void;
}

export const useGameStore = create<EnhancedGameStore>((set, get) => ({
  newsArticles: [],

  addNewsArticle: (article) => {
    set(state => ({
      newsArticles: [article, ...state.newsArticles].slice(0, 1000)  // Keep last 1000
    }));
  }
}));
```

### Step 2: Generate First Article

```typescript
// missionSystem.ts
import { generateMissionNews } from './newsGenerator';

function completeMission(mission, result) {
  // ... existing mission completion logic

  // Generate news
  const article = generateMissionNews(mission, result);
  gameStore.addNewsArticle(article);
}
```

### Step 3: Display in UI

```typescript
// NewsBrowser.tsx
export function NewsBrowser() {
  const articles = useGameStore(state => state.newsArticles);

  return (
    <div className="news-browser">
      <h2>Recent News</h2>
      {articles.map(article => (
        <div key={article.id} className="article">
          <h3>{article.headline}</h3>
          <p>{article.source} • {formatTimeAgo(article.timestamp)}</p>
        </div>
      ))}
    </div>
  );
}
```

---

**That's it!** Start with these basics and expand from there.
