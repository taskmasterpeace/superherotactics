# NEWS SYSTEM - QUICK START GUIDE

> **TL;DR**: Add consequence-driven news generation, passive/aggressive information delivery, and media relations to make player actions feel impactful.

---

## PASSIVE vs AGGRESSIVE NEWS

| **PASSIVE** (Player seeks it) | **AGGRESSIVE** (Pushes to player) |
|-------------------------------|-----------------------------------|
| News Browser (laptop) | Breaking News Alerts |
| Police Scanner (laptop/phone) | Handler Phone Calls |
| Social Media Feed (phone) | Pop-Up Events (choices) |
| Investigation Board (laptop) | Mission Deadline Warnings |

---

## MINIMUM VIABLE IMPLEMENTATION

### Step 1: Add News Store (5 minutes)

**File**: `MVP/src/stores/enhancedGameStore.ts`

```typescript
// Add to interface
interface EnhancedGameStore {
  // ... existing properties
  newsArticles: NewsArticle[];
  playerFame: number;
  publicOpinion: Record<string, number>; // country -> opinion score

  // Actions
  generateMissionNews: (mission: Mission, result: MissionResult) => void;
  addNewsArticle: (article: NewsArticle) => void;
}

// Add to store
newsArticles: [],
playerFame: 50,
publicOpinion: {},

generateMissionNews: (mission, result) => {
  const article = {
    id: `news-${Date.now()}`,
    headline: generateHeadline(mission, result),
    source: "Local News",
    category: "crime",
    timestamp: Date.now(),
    fameImpact: result.success ? 10 : -5
  };
  set(state => ({
    newsArticles: [article, ...state.newsArticles].slice(0, 50),
    playerFame: state.playerFame + article.fameImpact
  }));
}
```

---

### Step 2: Create Basic News Browser (15 minutes)

**File**: `MVP/src/components/NewsBrowser.tsx`

```typescript
import React from 'react';
import { useGameStore } from '../stores/enhancedGameStore';
import { Newspaper } from 'lucide-react';

export const NewsBrowser: React.FC = () => {
  const { newsArticles } = useGameStore();

  return (
    <div className="bg-gray-900 text-white p-6 rounded-lg">
      <div className="flex items-center gap-2 mb-4">
        <Newspaper className="w-6 h-6" />
        <h2 className="text-2xl font-bold">News Feed</h2>
      </div>

      <div className="space-y-4">
        {newsArticles.map(article => (
          <div key={article.id} className="border border-gray-700 p-4 rounded">
            <h3 className="text-lg font-bold">{article.headline}</h3>
            <div className="text-sm text-gray-400 mt-2">
              {article.source} • {new Date(article.timestamp).toLocaleString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
```

---

### Step 3: Generate News After Missions (10 minutes)

**File**: `MVP/src/stores/enhancedGameStore.ts` (update completeMission)

```typescript
completeMission: (success) => {
  const state = get();

  // ... existing completion logic

  // GENERATE NEWS
  get().generateMissionNews(
    {
      city: state.selectedCity,
      country: state.selectedCountry,
      crimeType: "Bank Robbery" // would be dynamic
    },
    {
      success,
      collateralDamage: 0, // track this in combat
      civilianCasualties: 0
    }
  );

  // ... rest of existing code
}
```

---

### Step 4: Simple Headline Generator (10 minutes)

**File**: `MVP/src/utils/newsGenerator.ts`

```typescript
export function generateHeadline(mission: any, result: any): string {
  const { city, crimeType } = mission;
  const { success, collateralDamage, civilianCasualties } = result;

  if (!success) {
    return `Vigilante Fails to Stop ${crimeType} in ${city}`;
  }

  if (collateralDamage > 50000) {
    return `Hero Stops ${crimeType} But Causes Major Damage in ${city}`;
  }

  if (civilianCasualties > 0) {
    return `${crimeType} Thwarted, ${civilianCasualties} Civilian Casualties in ${city}`;
  }

  return `Vigilante Stops ${crimeType} in ${city}`;
}
```

---

## SIMPLE IMPLEMENTATION (1-2 hours)

### Police Scanner Feed

**File**: `MVP/src/components/PoliceScanner.tsx`

```typescript
import React, { useEffect } from 'react';
import { useGameStore } from '../stores/enhancedGameStore';
import { Radio } from 'lucide-react';

export const PoliceScanner: React.FC = () => {
  const { currentSector } = useGameStore();
  const [events, setEvents] = React.useState<any[]>([]);

  // Generate random police scanner events
  useEffect(() => {
    const interval = setInterval(() => {
      const eventTypes = [
        "10-31 Armed Robbery",
        "10-10 Suspicious Activity",
        "10-65 Missing Person",
        "10-71 Shots Fired"
      ];

      const newEvent = {
        id: Date.now(),
        type: eventTypes[Math.floor(Math.random() * eventTypes.length)],
        sector: currentSector,
        timestamp: Date.now()
      };

      setEvents(prev => [newEvent, ...prev.slice(0, 10)]);
    }, 30000); // New event every 30 seconds

    return () => clearInterval(interval);
  }, [currentSector]);

  return (
    <div className="bg-gray-900 text-green-400 p-4 rounded font-mono text-sm">
      <div className="flex items-center gap-2 mb-2">
        <Radio className="w-4 h-4 animate-pulse" />
        <span>POLICE SCANNER - SECTOR {currentSector}</span>
      </div>
      <div className="space-y-1 max-h-60 overflow-y-auto">
        {events.map(event => (
          <div key={event.id} className="text-xs">
            [{new Date(event.timestamp).toLocaleTimeString()}] {event.type}
          </div>
        ))}
      </div>
    </div>
  );
};
```

---

### Breaking News Alert

**File**: `MVP/src/components/BreakingNewsAlert.tsx`

```typescript
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';

interface Props {
  headline: string;
  description: string;
  onDismiss: () => void;
}

export const BreakingNewsAlert: React.FC<Props> = ({ headline, description, onDismiss }) => {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -100, opacity: 0 }}
        className="fixed top-0 left-0 right-0 z-50 bg-red-600 text-white p-4 shadow-lg"
      >
        <div className="container mx-auto flex items-start justify-between">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 animate-pulse" />
            <div>
              <div className="text-xs font-bold uppercase tracking-wider mb-1">
                BREAKING NEWS
              </div>
              <h2 className="text-xl font-bold">{headline}</h2>
              <p className="text-sm mt-1 opacity-90">{description}</p>
            </div>
          </div>
          <button
            onClick={onDismiss}
            className="text-white hover:bg-red-700 p-2 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
```

---

## ADVANCED FEATURES (3-5 hours each)

### Fame System with Tiers

```typescript
// Add to store
const FAME_TIERS = {
  local: { min: 0, max: 50, coverage: 'Local newspapers only' },
  regional: { min: 51, max: 150, coverage: 'National news coverage' },
  national: { min: 151, max: 300, coverage: 'International news coverage' },
  global: { min: 301, max: 999, coverage: 'Global celebrity status' }
};

function getFameTier(fame: number) {
  if (fame >= 301) return 'global';
  if (fame >= 151) return 'national';
  if (fame >= 51) return 'regional';
  return 'local';
}

// Fame affects news coverage
generateMissionNews: (mission, result) => {
  const tier = getFameTier(state.playerFame);

  // Low fame = only local news
  if (tier === 'local' && mission.city !== state.selectedCity) {
    return; // No coverage for missions outside home city
  }

  // Generate article based on fame tier
  const sources = {
    local: `${mission.city} Daily Tribune`,
    regional: 'National News Network',
    national: 'Global News Network',
    global: 'International Herald'
  };

  const article = {
    headline: generateHeadline(mission, result, tier),
    source: sources[tier],
    // ...
  };
}
```

---

### Public Opinion per Country

```typescript
// Track opinion per country
publicOpinion: {
  'United States': 50,
  'Nigeria': 30,
  'China': -20,
  // ...
},

// Update after missions
updatePublicOpinion: (country: string, change: number) => {
  set(state => ({
    publicOpinion: {
      ...state.publicOpinion,
      [country]: Math.max(-100, Math.min(100,
        (state.publicOpinion[country] || 0) + change
      ))
    }
  }));
},

// Effects of public opinion
getMissionCostMultiplier: (country: string) => {
  const opinion = state.publicOpinion[country] || 0;
  if (opinion > 50) return 0.8; // 20% discount (popular)
  if (opinion < -50) return 1.5; // 50% markup (unpopular)
  return 1.0; // normal cost
}
```

---

### Social Media Feed

```typescript
// Generate social posts after missions
generateSocialReactions: (mission, result) => {
  const reactions = [];

  if (result.success) {
    reactions.push({
      user: `@${mission.city}Citizen_${Math.floor(Math.random() * 100)}`,
      text: `That vigilante just saved my neighborhood! 💪`,
      likes: Math.floor(Math.random() * 1000),
      sentiment: 'positive'
    });
  }

  if (result.collateralDamage > 10000) {
    reactions.push({
      user: `@${mission.city}Resident_${Math.floor(Math.random() * 100)}`,
      text: `My car got destroyed in that fight. Who pays for this?! 😡`,
      likes: Math.floor(Math.random() * 5000),
      sentiment: 'negative'
    });
  }

  return reactions;
}
```

---

## INTEGRATION CHECKLIST

- [ ] Add `newsArticles` to enhancedGameStore
- [ ] Add `playerFame` to enhancedGameStore
- [ ] Add `publicOpinion` to enhancedGameStore
- [ ] Create `generateMissionNews` function
- [ ] Create `NewsBrowser` component
- [ ] Add News tab to Laptop UI
- [ ] Hook up news generation in `completeMission`
- [ ] Create `generateHeadline` utility function
- [ ] Test: Complete mission → See news article
- [ ] Test: Fame increases after successful mission
- [ ] Add `PoliceScanner` component (optional)
- [ ] Add `BreakingNewsAlert` component (optional)
- [ ] Add Social Media Feed (optional)

---

## EXAMPLE DATA FLOW

```
1. Player completes bank robbery mission
   ↓
2. completeMission(success=true) called
   ↓
3. generateMissionNews() creates article:
   {
     headline: "Vigilante Stops Bank Robbery in Lagos",
     source: "Lagos Daily Tribune",
     fameImpact: +15
   }
   ↓
4. Article added to newsArticles array
   ↓
5. Fame increases: 50 → 65
   ↓
6. Public opinion increases: Nigeria +10
   ↓
7. Player opens Laptop → News tab
   ↓
8. NewsBrowser shows new article
   ↓
9. Player reads headline, feels impact
```

---

## TESTING COMMANDS (Dev Mode)

```typescript
// Add to Dev Panel (F2)
{
  label: "Generate Test News",
  action: () => {
    gameStore.addNewsArticle({
      headline: "TEST: Major LSW Event in Your City",
      source: "Test News Network",
      category: "world",
      timestamp: Date.now(),
      fameImpact: 20
    });
  }
},
{
  label: "Set Fame to 200",
  action: () => gameStore.set({ playerFame: 200 })
},
{
  label: "Set Public Opinion High",
  action: () => gameStore.updatePublicOpinion("United States", 50)
}
```

---

## FILE STRUCTURE

```
MVP/
  src/
    components/
      NewsBrowser.tsx         ← News article reader
      PoliceScanner.tsx       ← Live police feed
      SocialFeed.tsx          ← Twitter-style feed
      BreakingNewsAlert.tsx   ← Urgent alerts
      InterviewScreen.tsx     ← Press conferences
      InvestigationBoard.tsx  ← Connect-the-dots

    utils/
      newsGenerator.ts        ← Headline templates
      fameSystem.ts           ← Fame calculations
      opinionSystem.ts        ← Public opinion logic

    data/
      newsTemplates.ts        ← Headline templates
      mediaSources.ts         ← News outlet data

    stores/
      enhancedGameStore.ts    ← Add news state here

  docs/
    NEWS_SYSTEM_PROPOSAL.md   ← Full specification
    NEWS_SYSTEM_QUICK_START.md ← This file
```

---

## NEXT STEPS

**Phase 1** (MVP - 2-3 hours):
1. Add news store fields
2. Create NewsBrowser component
3. Hook up mission → news generation
4. Test: See your actions make headlines

**Phase 2** (Enhanced - 4-6 hours):
1. Add Police Scanner
2. Add Fame tier system
3. Add Public Opinion tracking
4. Add Breaking News alerts

**Phase 3** (Advanced - 8-10 hours):
1. Add Social Media Feed
2. Add Interview system
3. Add Investigation Board
4. Add Media Relations

**Phase 4** (Polish - 4-6 hours):
1. Add News templates variety
2. Add Rumor system
3. Add Bounty system
4. Add Disinformation mechanics

---

## DESIGN PRINCIPLES

1. **Every Action Matters**: Missions should generate news
2. **Delayed Gratification**: News appears 1-6 hours after mission (realism)
3. **Consequence Visibility**: Player sees fame/opinion changes
4. **Player Agency**: Interviews let player shape narrative
5. **Discovery**: News reveals mission opportunities

---

## BALANCING GUIDELINES

- **Fame Gain**: +5 to +30 per mission (scale with difficulty)
- **Fame Loss**: -10 to -50 for failures/collateral damage
- **Opinion Gain**: +5 to +20 per successful mission in country
- **Opinion Loss**: -10 to -40 for illegal ops/casualties
- **News Frequency**: 1-3 articles per mission (fame-dependent)

---

*Start with Phase 1, test thoroughly, then expand to Phase 2+*
