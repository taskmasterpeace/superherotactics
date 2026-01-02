# News Browser Component

## Overview

The **News Browser** is a fully functional news aggregation interface for the SuperHero Tactics game. It displays dynamically generated news articles based on player missions, world events, and faction activities. The system tracks player fame and public opinion across countries.

## Features

### 1. Tabbed Category Interface
- All News (combined feed)
- World (international events)
- Local (city-specific news)
- Crime (vigilante actions, law enforcement)
- Politics (LSW regulations, government policy)
- Sports (superhuman athletics)
- Entertainment (celebrity heroes, media coverage)

### 2. Article Display
- **Headlines List**: Shows all news articles with metadata
  - News source (Global News Network, local papers, etc.)
  - Bias indicator (Pro-Player, Anti-Player, Neutral, etc.)
  - Timestamp (game time)
  - Category tag
  - Impact indicators (fame, public opinion)
  - Mission opportunity badge

- **Full Article View**: Click any headline to read
  - Complete article text
  - Source and bias information
  - Impact analysis (fame gained/lost, opinion shifts)
  - Related countries and factions
  - Mission opportunities (if applicable)

### 3. Sorting Options
- Newest First (default)
- Oldest First
- Most Impactful (by absolute fame impact)

### 4. Public Opinion Tracker
- Bottom bar shows public opinion by country
- Color-coded from Very Positive (green) to Very Negative (red)
- Range: -100 to +100

### 5. Fame System
- Displayed in header
- Range: 0 to 1000
- Affects news coverage:
  - 0-49: Local newspapers, anonymous descriptions
  - 50-149: Regional coverage, known vigilante
  - 150-299: National media, named hero
  - 300+: Global celebrity, major networks

## File Locations

### Component
```
C:\git\sht\MVP\src\components\NewsBrowser.tsx
```

### Data Templates
```
C:\git\sht\MVP\src\data\newsTemplates.ts
```

### State Management
```
C:\git\sht\MVP\src\stores\enhancedGameStore.ts
```
- `newsArticles: NewsArticle[]` - Array of all news articles
- `playerFame: number` - Player's fame score (0-1000)
- `publicOpinion: Record<string, number>` - Opinion by country code
- `addNewsArticle(article)` - Add news article to store
- `generateMissionNews(missionResult)` - Generate news from mission
- `updatePublicOpinion(country, change)` - Modify public opinion

## Integration Points

### 1. Access the News Browser

**Dev Mode (F2)**:
```
Press F2 -> Click "📰 News Browser"
```

**Programmatic**:
```typescript
import { useGameStore } from './stores/enhancedGameStore'

const setCurrentView = useGameStore(state => state.setCurrentView)
setCurrentView('news')
```

### 2. Generate News from Missions

When a mission completes, call `generateMissionNews`:

```typescript
import { useGameStore } from './stores/enhancedGameStore'

// After mission completion
const { generateMissionNews } = useGameStore.getState()

generateMissionNews({
  success: true,              // Did the mission succeed?
  collateralDamage: 15000,    // Property damage in dollars
  civilianCasualties: 0,      // Civilian deaths
  city: 'New York',           // City name
  country: 'United States',   // Country name
  missionType: 'bank_robbery', // Mission type
  enemyType: 'gang_members',  // Enemy type
  vigilantismLegal: true      // Is vigilantism legal in this country?
})
```

**Mission Types** (from `newsTemplates.ts`):
- `bank_robbery`
- `hostage_rescue`
- `assassination_attempt`
- `terrorist_attack`
- `arms_deal`
- `kidnapping`
- `gang_war`
- `lsw_rampage`

**Enemy Types**:
- `gang_members`
- `terrorists`
- `mercenaries`
- `lsw_villain`
- `corporate_security`

### 3. Manually Add News Articles

For world events, rumors, or custom articles:

```typescript
import { useGameStore } from './stores/enhancedGameStore'
import { NewsArticle } from './data/newsTemplates'

const { addNewsArticle } = useGameStore.getState()

const customArticle: NewsArticle = {
  id: `news-${Date.now()}`,
  headline: "LSW Registration Act Passes in Germany",
  source: "Global News Network",
  category: "politics",
  bias: "pro-regulation",
  generatedFrom: {
    type: "world_event",
    eventType: "legislation"
  },
  fullText: "Berlin - The German parliament has passed...",
  relatedCountries: ["Germany"],
  relatedFactions: ["LSW Rights Coalition"],
  timestamp: Date.now(),
  fameImpact: 0,
  publicOpinionShift: { "Germany": -15 }
}

addNewsArticle(customArticle)
```

## News Generation Logic

### Headline Selection
The system selects headlines based on mission outcome:

1. **Success + No Collateral**: Clean victory templates
2. **Success + High Collateral**: Messy victory templates
3. **Success + Casualties**: Critical coverage templates
4. **Failure**: Failure templates
5. **Illegal Operation**: Diplomatic incident templates
6. **High Fame**: Celebrity hero templates

### News Source Selection
Sources are chosen based on fame tier and bias:

**Fame Tiers**:
- **Local** (0-49): City newspapers
- **Regional** (50-149): Mix of local and major sources
- **National** (150-299): Mostly major sources
- **Global** (300+): All major international sources

**Major Sources**:
- **Global News Network** (GNN): Pro-regulation, US-aligned, credibility 85
- **Eastern Times**: Anti-player, China-Russia aligned, credibility 70
- **Independent Wire**: Neutral, high credibility 95
- **Social Truth Network**: Anti-regulation, conspiracy-leaning, credibility 40

### Impact Calculations

**Fame Impact**:
```typescript
// Success
baseImpact = +10 to +20
if (civilianCasualties > 0) fameImpact -= casualties * 3
if (collateralDamage > 50000) fameImpact -= 5

// Failure
fameImpact = -10 to -20
```

**Public Opinion**:
```typescript
// Success in legal country
opinionShift = +10
if (civilianCasualties > 0) opinionShift -= casualties * 5
if (collateralDamage > 100000) opinionShift -= 10

// Success in illegal country
opinionShift = -5 (diplomatic incident)

// Failure
opinionShift = -10
```

## Testing

### Dev Mode Test Buttons (F2)

**Generate Success Story**:
- Clean bank robbery stop in New York
- +15-20 fame, +10 opinion (United States)

**Generate Messy Victory**:
- Hostage rescue with high collateral and 3 casualties
- Mixed fame impact, negative opinion shift

**Generate Failure Story**:
- Failed assassination prevention in illegal country
- -10-20 fame, -10 opinion (United States)

### Manual Testing Flow

1. Press **F2** to open Dev Mode
2. Click **"📰 News Browser"** to open news interface
3. Click **"Generate Success Story"** to create sample news
4. Browse headlines by category
5. Click headlines to read full articles
6. Check public opinion bar at bottom
7. Test sorting options (Newest, Oldest, Most Impactful)
8. Generate multiple articles to test filtering

## Styling

The News Browser uses a professional news website aesthetic:

**Color Scheme**:
- Background: Dark gray (`bg-gray-900`)
- Header: Blue gradient (`from-blue-900 to-blue-800`)
- Bias indicators:
  - Pro-Player: Green (`text-green-400`)
  - Anti-Player: Red (`text-red-400`)
  - Neutral: Gray (`text-gray-400`)
  - Pro-Regulation: Blue (`text-blue-400`)
  - Anti-Regulation: Orange (`text-orange-400`)

**Layout**:
- Full-screen component (100% width/height)
- Fixed header with tabs and controls
- Scrollable article list
- Fixed footer with public opinion tracker
- Responsive grid for opinion cards

## Future Enhancements

### Planned Features
1. **Social Media Feed**: Show reactions, conspiracy theories, recruitment hints
2. **Rumor System**: 4-day progression leading to mission unlocks
3. **World Events**: Elections, disasters, villain attacks
4. **Mission Opportunities**: Click articles to unlock related missions
5. **Article Expiration**: Old news fades after X days
6. **Search/Filter**: Search by keyword, filter by country/faction
7. **Bookmark System**: Save important articles
8. **News Alerts**: Popup notifications for critical news
9. **Faction-Specific Sources**: News from villain organizations
10. **Image Support**: Article images with aspect ratio support

### Integration with Other Systems
- **Email System**: Receive news links via email
- **Investigation System**: News articles as investigation triggers
- **Faction Relations**: News affects faction opinion
- **Economic System**: Market impacts from news events
- **Strategic Layer**: Territory control affects local news bias

## Technical Notes

### Performance Considerations
- Articles limited to last 100 (configurable in `enhancedGameStore.ts`)
- List virtualization not implemented (consider for 1000+ articles)
- Timestamps use game time (minutes since start)

### TypeScript Types
All types are defined in `newsTemplates.ts`:
- `NewsArticle` - Full article structure
- `NewsCategory` - Category union type
- `NewsBias` - Bias union type
- `NewsSource` - Source name (string)
- `NewsOrigin` - Article origin metadata
- `HeadlineContext` - Context for headline generation

### State Structure
```typescript
interface EnhancedGameStore {
  newsArticles: NewsArticle[]
  playerFame: number
  publicOpinion: Record<string, number>
  addNewsArticle: (article: NewsArticle) => void
  generateMissionNews: (missionResult: {...}) => void
  updatePublicOpinion: (country: string, change: number) => void
}
```

## Troubleshooting

**Issue**: News articles not appearing
- Check that `generateMissionNews` is being called after missions
- Verify `newsArticles` array in dev tools
- Ensure `currentView` is set to `'news'`

**Issue**: Fame/opinion not updating
- Check that `fameImpact` and `publicOpinionShift` are set in article
- Verify calculations in `generateMissionNews` function
- Check store state in React DevTools

**Issue**: TypeScript errors on `currentView`
- Ensure `'news'` is added to `currentView` union type in store
- May need to restart TypeScript server

**Issue**: Component not rendering
- Verify import in `App.tsx`
- Check that view condition matches: `{currentView === 'news' && <NewsBrowser />}`
- Ensure no CSS conflicts hiding component

## Examples

### Example 1: Mission Integration
```typescript
// In your combat completion handler
const handleMissionComplete = (result: MissionResult) => {
  const { generateMissionNews } = useGameStore.getState()

  generateMissionNews({
    success: result.missionSuccess,
    collateralDamage: result.propertyDamage,
    civilianCasualties: result.civilianDeaths,
    city: result.location.city,
    country: result.location.country,
    missionType: result.missionType,
    enemyType: result.enemyFaction,
    vigilantismLegal: result.location.vigilantismStatus === 'legal'
  })

  // Navigate to news to see coverage
  useGameStore.getState().setCurrentView('news')
}
```

### Example 2: World Event News
```typescript
// In your world event generator
const triggerElection = (country: string) => {
  const { addNewsArticle } = useGameStore.getState()

  addNewsArticle({
    id: `election-${country}-${Date.now()}`,
    headline: `${country} Elects Pro-LSW Candidate`,
    source: "Global News Network",
    category: "politics",
    bias: "pro-player",
    generatedFrom: { type: "world_event", eventType: "election" },
    fullText: `${country}'s recent election has brought a pro-superhuman candidate to power...`,
    relatedCountries: [country],
    relatedFactions: [],
    timestamp: useGameStore.getState().gameTime.day * 1440,
    publicOpinionShift: { [country]: 20 }
  })
}
```

## Credits

**Implementation**: Claude Code (Anthropic)
**Design**: Based on NEWS_SYSTEM_SUMMARY.md spec
**Templates**: C:\git\sht\MVP\src\data\newsTemplates.ts
**Integration**: SuperHero Tactics MVP

---

Last Updated: December 2024
Version: 1.0.0
