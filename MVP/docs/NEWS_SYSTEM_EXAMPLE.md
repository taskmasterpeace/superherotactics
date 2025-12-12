# NEWS SYSTEM - COMPLETE EXAMPLE IMPLEMENTATION

> **30-Minute Quick Start**: This example shows how to add basic news generation to your game.

---

## Step 1: Add to Store (5 minutes)

**File**: `c:\git\sht\MVP\src\stores\enhancedGameStore.ts`

```typescript
import NewsTemplates from '../data/newsTemplates';

// Add to interface (around line 52)
interface EnhancedGameStore {
  // ... existing properties

  // NEWS SYSTEM
  newsArticles: NewsArticle[];
  playerFame: number;
  publicOpinion: Record<string, number>;

  // NEWS ACTIONS
  generateMissionNews: (mission: any, result: any) => void;
  addNewsArticle: (article: any) => void;
}

// Add to initial state (around line 135)
export const useGameStore = create<EnhancedGameStore>((set, get) => ({
  // ... existing state

  // NEWS SYSTEM STATE
  newsArticles: [],
  playerFame: 50,
  publicOpinion: {},

  // NEWS ACTIONS
  generateMissionNews: (mission, result) => {
    const headline = NewsTemplates.generateHeadline({
      success: result.success,
      collateralDamage: result.collateralDamage || 0,
      civilianCasualties: result.civilianCasualties || 0,
      fame: get().playerFame,
      city: mission.city,
      country: mission.country,
      crime: NewsTemplates.getCrimeTypeDescription(mission.type),
      threat: NewsTemplates.getThreatDescription(mission.enemyType),
      vigilantismLegal: true, // Would check country.vigilantism
      heroName: 'Shadow Operative' // Would use character name
    });

    const fameTier = get().playerFame < 50 ? 'local' :
                     get().playerFame < 150 ? 'regional' :
                     get().playerFame < 300 ? 'national' : 'global';

    const source = NewsTemplates.selectNewsSource(
      fameTier,
      mission.country,
      mission.city
    );

    const fameChange = result.success ? 15 : -10;
    const opinionChange = result.success ? 10 : -5;

    const article = {
      id: `news-${Date.now()}`,
      headline,
      source,
      category: 'crime' as const,
      bias: 'neutral' as const,
      generatedFrom: {
        type: 'player_action' as const,
        missionId: mission.id
      },
      timestamp: Date.now(),
      relatedCountries: [mission.country],
      relatedFactions: [],
      fameImpact: fameChange,
      publicOpinionShift: { [mission.country]: opinionChange }
    };

    set(state => ({
      newsArticles: [article, ...state.newsArticles].slice(0, 50),
      playerFame: Math.max(0, state.playerFame + fameChange),
      publicOpinion: {
        ...state.publicOpinion,
        [mission.country]: Math.max(-100, Math.min(100,
          (state.publicOpinion[mission.country] || 0) + opinionChange
        ))
      }
    }));

    console.log('📰 NEWS:', headline);
  },

  addNewsArticle: (article) => {
    set(state => ({
      newsArticles: [article, ...state.newsArticles].slice(0, 50)
    }));
  },
}));
```

---

## Step 2: Create News Browser Component (10 minutes)

**File**: `c:\git\sht\MVP\src\components\NewsBrowser.tsx`

```typescript
import React, { useState } from 'react';
import { useGameStore } from '../stores/enhancedGameStore';
import { Newspaper, TrendingUp, MapPin, Calendar } from 'lucide-react';

export const NewsBrowser: React.FC = () => {
  const { newsArticles, playerFame, publicOpinion } = useGameStore();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = ['all', 'world', 'local', 'crime', 'politics'];

  const filteredArticles = selectedCategory === 'all'
    ? newsArticles
    : newsArticles.filter(a => a.category === selectedCategory);

  const getFameTier = (fame: number) => {
    if (fame >= 300) return { tier: 'Global Celebrity', color: 'text-purple-400' };
    if (fame >= 150) return { tier: 'National Icon', color: 'text-blue-400' };
    if (fame >= 50) return { tier: 'Regional Hero', color: 'text-green-400' };
    return { tier: 'Local Vigilante', color: 'text-gray-400' };
  };

  const fameTier = getFameTier(playerFame);

  return (
    <div className="bg-gray-900 text-white min-h-screen p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Newspaper className="w-8 h-8 text-blue-400" />
            <h1 className="text-3xl font-bold">News Feed</h1>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-yellow-400" />
              <span className="text-sm text-gray-400">Fame:</span>
              <span className={`text-lg font-bold ${fameTier.color}`}>
                {playerFame}
              </span>
            </div>
            <div className="text-xs text-gray-400">{fameTier.tier}</div>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex gap-2 border-b border-gray-700 pb-2">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-t capitalize ${
                selectedCategory === cat
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Articles */}
      <div className="space-y-4">
        {filteredArticles.length === 0 ? (
          <div className="text-center text-gray-500 py-12">
            <Newspaper className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p>No news articles yet. Complete missions to make headlines!</p>
          </div>
        ) : (
          filteredArticles.map(article => (
            <div
              key={article.id}
              className="bg-gray-800 border border-gray-700 rounded-lg p-4 hover:border-blue-500 transition cursor-pointer"
            >
              {/* Headline */}
              <h2 className="text-xl font-bold mb-2 text-blue-300">
                {article.headline}
              </h2>

              {/* Meta Info */}
              <div className="flex items-center gap-4 text-sm text-gray-400 mb-3">
                <span className="font-semibold">{article.source}</span>
                <span>•</span>
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {new Date(article.timestamp).toLocaleDateString()}
                </div>
                {article.relatedCountries.length > 0 && (
                  <>
                    <span>•</span>
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {article.relatedCountries[0]}
                    </div>
                  </>
                )}
              </div>

              {/* Impact Indicators */}
              {(article.fameImpact || article.publicOpinionShift) && (
                <div className="flex gap-4 text-xs">
                  {article.fameImpact && (
                    <div className={`px-2 py-1 rounded ${
                      article.fameImpact > 0
                        ? 'bg-green-900/30 text-green-400'
                        : 'bg-red-900/30 text-red-400'
                    }`}>
                      Fame: {article.fameImpact > 0 ? '+' : ''}{article.fameImpact}
                    </div>
                  )}
                  {article.publicOpinionShift && Object.entries(article.publicOpinionShift).map(([country, change]) => (
                    <div
                      key={country}
                      className={`px-2 py-1 rounded ${
                        change > 0
                          ? 'bg-blue-900/30 text-blue-400'
                          : 'bg-orange-900/30 text-orange-400'
                      }`}
                    >
                      {country}: {change > 0 ? '+' : ''}{change}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
```

---

## Step 3: Hook Up Mission Completion (5 minutes)

**File**: `c:\git\sht\MVP\src\stores\enhancedGameStore.ts`

Find the `completeMission` function and add news generation:

```typescript
completeMission: (success) => {
  const state = get();

  // ... existing completion logic

  // GENERATE NEWS
  get().generateMissionNews(
    {
      id: 'mission-' + Date.now(),
      city: state.selectedCity,
      country: state.selectedCountry,
      type: 'bank_robbery', // Would be dynamic based on mission
      enemyType: 'gang_members'
    },
    {
      success,
      collateralDamage: 0, // TODO: Track in combat
      civilianCasualties: 0 // TODO: Track in combat
    }
  );

  // ... rest of existing code
}
```

---

## Step 4: Add News Tab to UI (5 minutes)

**File**: `c:\git\sht\MVP\src\App.tsx`

Add News Browser to your view switcher:

```typescript
import { NewsBrowser } from './components/NewsBrowser';

// In your view switcher (around line 60+)
{currentView === 'news' && <NewsBrowser />}

// In your dev panel or menu, add:
<button onClick={() => setCurrentView('news')}>
  📰 News
</button>
```

---

## Step 5: Test It! (5 minutes)

1. Start the dev server: `npm run dev`
2. Complete a mission (any mission)
3. Open News tab
4. See your headline!

**Example Output**:
```
📰 NEWS: Vigilante Stops Bank Robbery in Washington DC
Source: Washington DC Daily Tribune
Fame: 50 → 65 (+15)
Public Opinion (United States): +10
```

---

## Testing Commands

Add these to your dev panel (F2) for easy testing:

```typescript
// In your dev panel component
{
  label: "Generate Test News",
  action: () => {
    gameStore.generateMissionNews(
      {
        id: 'test-mission',
        city: 'Lagos',
        country: 'Nigeria',
        type: 'bank_robbery',
        enemyType: 'gang_members'
      },
      {
        success: true,
        collateralDamage: 5000,
        civilianCasualties: 0
      }
    );
  }
},
{
  label: "Generate Failed Mission News",
  action: () => {
    gameStore.generateMissionNews(
      {
        id: 'test-mission-2',
        city: 'Tokyo',
        country: 'Japan',
        type: 'hostage_rescue',
        enemyType: 'terrorists'
      },
      {
        success: false,
        collateralDamage: 150000,
        civilianCasualties: 3
      }
    );
  }
},
{
  label: "Set Fame to 200",
  action: () => gameStore.set({ playerFame: 200 })
},
{
  label: "Set Fame to 400 (Global)",
  action: () => gameStore.set({ playerFame: 400 })
}
```

---

## What You Get

After these 30 minutes, you'll have:

✅ **News articles generated after every mission**
- Headlines change based on success/failure/collateral/casualties
- Different headlines for different fame levels
- News sources vary by fame (local paper vs international)

✅ **Fame system working**
- Increases/decreases based on mission results
- 4 tiers: Local (0-50), Regional (51-150), National (151-300), Global (301+)
- Displayed in News Browser header

✅ **Public opinion tracking**
- Per-country opinion scores
- Changes displayed on articles
- Stored for future use (prices, recruitment, bounties)

✅ **News Browser UI**
- Tabbed interface (All, World, Local, Crime, Politics)
- Displays headlines with meta info
- Shows fame/opinion impact
- Responsive, professional design

---

## Next Steps (Optional Enhancements)

### Add Police Scanner (30 minutes)
See `NEWS_SYSTEM_QUICK_START.md` Section 1.2

### Add Social Media Feed (30 minutes)
Generate 2-3 social posts per mission using `SOCIAL_TEMPLATES`

### Add Breaking News Alerts (20 minutes)
Full-screen modal for urgent world events

### Add Interview System (2 hours)
Let player give press conferences to control narrative

---

## Example Headlines You'll See

**Low Fame, Success**:
> "Unknown Vigilante Stops Bank Robbery in Lagos"

**High Fame, Success**:
> "Legendary Shadow Operative Strikes Again in Tokyo"

**Success with Damage**:
> "Hero Saves Hostages, Destroys City Block in Process"

**Failure**:
> "Vigilante Fails to Stop Terrorist Attack in Mumbai"

**High Casualties**:
> "Hostage Rescue Ends in Tragedy: 5 Civilians Dead"

---

## Troubleshooting

**"Headlines are always the same"**
- Check that you're passing different `success`, `collateralDamage`, `civilianCasualties` values
- Verify `playerFame` is changing
- Templates select randomly - try generating 5-10 articles

**"No articles appearing"**
- Check console for "📰 NEWS:" log
- Verify `completeMission` is calling `generateMissionNews`
- Check `newsArticles` in React DevTools

**"Fame not changing"**
- Check that `fameImpact` is being calculated
- Verify store update in browser DevTools (Zustand tab)
- Try manual fame change with dev button

**"TypeScript errors"**
- Import `NewsArticle` type from `newsTemplates.ts`
- Add `as const` to string literals for category/bias
- Check all required NewsArticle fields are present

---

## Full Example Article Object

```typescript
{
  id: "news-1702345678901",
  headline: "Vigilante Stops Bank Robbery in Washington DC",
  source: "Washington DC Daily Tribune",
  category: "crime",
  bias: "neutral",
  generatedFrom: {
    type: "player_action",
    missionId: "mission-1702345678900"
  },
  timestamp: 1702345678901,
  relatedCountries: ["United States"],
  relatedFactions: [],
  fameImpact: 15,
  publicOpinionShift: {
    "United States": 10
  }
}
```

---

**Congratulations!** You now have a working News System that makes player actions feel impactful.

Next: Expand with Police Scanner, Social Feed, and Interviews using the full specification in `NEWS_SYSTEM_PROPOSAL.md`.
