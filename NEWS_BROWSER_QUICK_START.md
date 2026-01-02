# News Browser - Quick Start Guide

## 🚀 Access News Browser

### Method 1: Dev Mode (Fastest for Testing)
1. Press **F2** (opens Dev Mode panel)
2. Click **"📰 News Browser"**

### Method 2: Programmatic
```typescript
import { useGameStore } from './stores/enhancedGameStore'

const setCurrentView = useGameStore(state => state.setCurrentView)
setCurrentView('news')
```

## 🧪 Generate Test News

In Dev Mode (F2), use these buttons:

### Generate Success Story
```
✅ Clean bank robbery stop in New York
📊 +15-20 fame, +10 opinion
```

### Generate Messy Victory
```
⚠️ Hostage rescue with $250K damage, 3 casualties
📊 Mixed fame, negative opinion
```

### Generate Failure Story
```
❌ Failed mission in illegal country
📊 -10-20 fame, -10 opinion
```

## 📝 Generate News from Code

### From Mission Results
```typescript
const { generateMissionNews } = useGameStore.getState()

generateMissionNews({
  success: true,              // Mission outcome
  collateralDamage: 15000,    // Property damage ($)
  civilianCasualties: 0,      // Civilian deaths
  city: 'New York',           // City name
  country: 'United States',   // Country name
  missionType: 'bank_robbery',// See mission types below
  enemyType: 'gang_members',  // See enemy types below
  vigilantismLegal: true      // Legal status in country
})
```

### Custom World Events
```typescript
const { addNewsArticle } = useGameStore.getState()

addNewsArticle({
  id: `news-${Date.now()}`,
  headline: "Major LSW Attack in Tokyo",
  source: "Global News Network",
  category: "world",
  bias: "neutral",
  generatedFrom: { type: "world_event" },
  relatedCountries: ["Japan"],
  relatedFactions: ["Red Storm"],
  timestamp: Date.now(),
  fameImpact: 0,
  publicOpinionShift: { "Japan": -20 }
})
```

## 📋 Reference Data

### Mission Types
- `bank_robbery`
- `hostage_rescue`
- `assassination_attempt`
- `terrorist_attack`
- `arms_deal`
- `kidnapping`
- `gang_war`
- `lsw_rampage`

### Enemy Types
- `gang_members`
- `terrorists`
- `mercenaries`
- `lsw_villain`
- `corporate_security`

### News Categories
- `world` - International events
- `local` - City-specific news
- `crime` - Law enforcement, vigilantes
- `politics` - LSW regulations, government
- `sports` - Superhuman athletics
- `entertainment` - Celebrity heroes

### News Sources
- **Global News Network** - Pro-regulation, US-aligned
- **Eastern Times** - Anti-player, China/Russia-aligned
- **Independent Wire** - Neutral, high credibility
- **Social Truth Network** - Anti-regulation, conspiracy
- **Local Papers** - Generated per city

### Bias Types
- `pro-player` - Favorable coverage
- `anti-player` - Critical coverage
- `neutral` - Unbiased reporting
- `pro-regulation` - Supports LSW laws
- `anti-regulation` - Opposes LSW laws

## 🎯 Fame System

| Fame Range | Tier | Coverage | Description |
|------------|------|----------|-------------|
| 0-49 | Local | City newspapers | "Unknown Vigilante" |
| 50-149 | Regional | Mix of sources | "Known Vigilante" |
| 150-299 | National | Major sources | Named hero |
| 300+ | Global | All major networks | Celebrity status |

## 📊 Public Opinion Scale

| Range | Label | Color |
|-------|-------|-------|
| +50 to +100 | Very Positive | Green |
| +20 to +49 | Positive | Lime |
| -19 to +19 | Neutral | Yellow |
| -20 to -49 | Negative | Orange |
| -50 to -100 | Very Negative | Red |

## 💡 Tips

1. **Test Flow**: Generate 3-4 news articles to see filtering/sorting in action
2. **Check Opinion**: Public opinion bar shows at bottom
3. **Read Articles**: Click headlines for full details
4. **Sort Options**: Try "Most Impactful" to see high-impact news first
5. **Category Tabs**: Filter by category to focus on specific news types

## 🐛 Troubleshooting

**No news showing?**
- Generate test news via F2 panel
- Check that store has articles: `useGameStore.getState().newsArticles`

**Component not rendering?**
- Verify you're in 'news' view: `currentView === 'news'`
- Check console for errors
- Ensure TypeScript compiled correctly

**Build errors?**
- Run `npm run build` in MVP directory
- Check that all imports are correct

## 📁 File Locations

```
C:\git\sht\MVP\src\components\NewsBrowser.tsx         # Main component
C:\git\sht\MVP\src\data\newsTemplates.ts              # Templates & types
C:\git\sht\MVP\src\stores\enhancedGameStore.ts        # State management
C:\git\sht\MVP\src\App.tsx                            # App integration

C:\git\sht\NEWS_BROWSER_README.md                     # Full documentation
C:\git\sht\NEWS_BROWSER_IMPLEMENTATION_SUMMARY.md     # Implementation details
C:\git\sht\NEWS_BROWSER_QUICK_START.md                # This file
```

## ✅ Next Steps

1. Hook up to mission completion system
2. Add world event generators
3. Generate full article text (templates exist)
4. Add article images
5. Implement rumor progression system

---

**Quick Access**: Press **F2** → **"📰 News Browser"**
