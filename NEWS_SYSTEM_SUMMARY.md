# NEWS SYSTEM - IMPLEMENTATION SUMMARY

## Overview

The **News System** for SuperHero Tactics creates a living, reactive world where player actions have consequences and information flows through multiple channels (passive and aggressive delivery).

---

## Documents Created

### 1. **NEWS_SYSTEM_PROPOSAL.md** (c:\git\sht\MVP\docs\)
**30+ pages** - Comprehensive design specification covering:

- **Passive News** (Player seeks info):
  - News Browser (6 categories: World, Local, Crime, Politics, Sports, Entertainment)
  - Police Scanner (live crime feeds)
  - Social Media Feed (citizen reactions, recruitment, villain taunts)
  - Investigation Board (connect articles to unlock missions)

- **Aggressive News** (Pushes to player):
  - Breaking News Alerts (critical world events)
  - Handler Phone Calls (mission deadlines, political pressure)
  - Pop-Up Events (moral dilemmas, political decisions)

- **News Generation**:
  - Player action consequences (missions → headlines)
  - World events (elections, disasters, villain attacks)
  - Random events (filler news for immersion)
  - Rumor system (mission hints)

- **Gameplay Effects**:
  - Fame system (4 tiers: local → global celebrity)
  - Public opinion per country (-100 to +100)
  - Faction reactions (governments, criminals, media, LSW community)
  - Mission unlocks (news reveals opportunities)
  - Bounties/wanted status

- **Media Relations**:
  - Giving interviews (control narrative)
  - Press conferences (multiple outlets)
  - Friendly vs hostile media contacts
  - Spin control (damage control after failures)

- **Disinformation Warfare**:
  - Enemy propaganda (villains discredit player)
  - Cover stories (hide illegal operations)
  - Information warfare (plant false intel)

---

### 2. **NEWS_SYSTEM_QUICK_START.md** (c:\git\sht\MVP\docs\)
**Implementation guide** with step-by-step instructions:

- **Minimum Viable Implementation** (30 minutes):
  - Add news store
  - Create basic news browser
  - Hook up mission → news generation
  - Simple headline generator

- **Simple Implementation** (1-2 hours):
  - Police Scanner feed
  - Breaking News alerts
  - Social media posts

- **Advanced Features** (3-5 hours each):
  - Fame tier system
  - Public opinion tracking
  - Interview system
  - Investigation board

- **Integration Checklist**: Step-by-step tasks
- **Testing Commands**: Dev panel shortcuts
- **File Structure**: Where to put new components
- **Balancing Guidelines**: Fame/opinion gain/loss rates

---

### 3. **newsTemplates.ts** (c:\git\sht\MVP\src\data\)
**Production-ready TypeScript module** with:

- **TypeScript Interfaces**:
  - `NewsArticle`, `NewsCategory`, `NewsBias`, `NewsSource`, `NewsOrigin`

- **News Sources**:
  - 4 major sources (Global News Network, Eastern Times, Independent Wire, Social Truth Network)
  - 168 procedural city newspapers (generated per city)

- **Headline Templates** (100+ variations):
  - Mission success (clean, messy, casualties)
  - Mission failure
  - Illegal operations
  - Celebrity hero headlines
  - World events (villain attacks, political changes)
  - Rumor seeds
  - Sports/entertainment filler

- **Article Body Templates**:
  - Full article text generation
  - Context-aware descriptions

- **Social Media Templates**:
  - Positive reactions
  - Negative reactions (collateral damage)
  - Conspiracy theories
  - Recruitment hints
  - Villain taunts
  - Celebrity gossip

- **Rumor Templates**:
  - Multi-day rumor chains (Days 1-4)
  - Different rumor types (hideout, tech theft, kidnapping)

- **Helper Functions**:
  - `generateHeadline()` - Main headline generator
  - `selectDescriptor()` - Fame-based character description
  - `selectNewsSource()` - Choose appropriate news outlet
  - `fillTemplate()` - Replace template placeholders
  - `getLocalNewspaper()` - Generate city newspaper names

---

## Key Design Principles

1. **Every Action Matters**: Player missions automatically generate news
2. **Consequence Visibility**: Fame/opinion changes are clearly displayed
3. **Player Agency**: Interviews/press conferences let player shape narrative
4. **Discovery**: News reveals hidden missions and opportunities
5. **Living World**: World events occur independently of player

---

## Example Data Flow

```
Player completes bank robbery mission
  ↓
generateMissionNews() analyzes result:
  - Success? Collateral damage? Casualties?
  - Fame level determines coverage (local vs international)
  - Vigilantism legal in country?
  ↓
Generate headline from templates:
  "Vigilante Stops Bank Robbery in Lagos"
  ↓
Calculate consequences:
  - Fame: +20
  - Nigeria public opinion: +10
  - Lagos city familiarity: +5
  ↓
Create article and add to store
  ↓
Generate 2-3 social media reactions
  ↓
Player opens News Browser → Sees headline
  ↓
Player feels impact of their actions
```

---

## Example Headlines Generated

**Low Fame, Clean Success**:
> "Unknown Vigilante Stops Armed Robbery in Lagos"

**High Fame, Clean Success**:
> "Legendary Shadow Operative Strikes Again in Tokyo"

**Success with Collateral Damage**:
> "Hero Saves Hostages, Destroys City Block in Process"

**Success with Casualties**:
> "Bank Robbery Stopped, 3 Civilians Killed in Crossfire"

**Failure**:
> "Amateur Vigilante Outmatched, Criminals Escape"

**Illegal Operation**:
> "Foreign Operative Violates Chinese Sovereignty, Arrest Warrant Issued"

**World Event**:
> "Technomancer Cult Attacks Mumbai Power Grid - 47 Dead"

**Political Event**:
> "New Brazilian President Vows to 'Crack Down on Vigilantes'"

---

## Fame System (4 Tiers)

| Tier | Fame Range | Coverage | Description |
|------|-----------|----------|-------------|
| **Local** | 0-50 | City newspapers only | "Unknown Vigilante" |
| **Regional** | 51-150 | National news | "The Armored Operative" |
| **National** | 151-300 | International news | "Known Hero" |
| **Global** | 301+ | Global celebrity | Hero name used in headlines |

**Fame Effects**:
- Recruitment pool size (high fame attracts elite recruits)
- Equipment prices (celebrity discount/markup)
- Mission availability (some require fame threshold)
- Villain targeting (high fame = boss fights)

---

## Public Opinion System

**Per-Country Tracking** (-100 to +100):

- **Positive (>50)**: Discounts, easier recruitment, police cooperation
- **Neutral (0-50)**: Normal operations
- **Negative (-50 to 0)**: Higher costs, hostile media
- **Hostile (<-50)**: Wanted status, police interference, bounties

**Modifiers**:
- Operating legally: +5 per mission
- Operating illegally: -15 per mission
- Saving civilians: +10
- Collateral damage: -20
- Catching major villain: +30

---

## Media Relations

**Friendly Media Benefits**:
- Positive spin on missions
- Advance warning of negative stories
- Can leak information to undermine enemies
- Exclusive interviews boost fame

**Hostile Media Risks**:
- Negative spin on missions
- Investigative exposés
- Collaborate with enemies
- Difficult interview questions

---

## Technical Integration

### Files Created:
```
c:\git\sht\MVP\docs\NEWS_SYSTEM_PROPOSAL.md
c:\git\sht\MVP\docs\NEWS_SYSTEM_QUICK_START.md
c:\git\sht\MVP\src\data\newsTemplates.ts
c:\git\sht\NEWS_SYSTEM_SUMMARY.md (this file)
```

### Store Updates Required:
```typescript
// enhancedGameStore.ts
interface EnhancedGameStore {
  newsArticles: NewsArticle[];
  playerFame: number;
  publicOpinion: Record<string, number>;
  bounties: Bounty[];
  mediaContacts: MediaContact[];

  generateMissionNews: (mission, result) => void;
  addNewsArticle: (article) => void;
  updatePublicOpinion: (country, change) => void;
}
```

### New Components Needed:
```
NewsBrowser.tsx         - Main news reading interface
PoliceScanner.tsx       - Live police radio feed
SocialFeed.tsx          - Twitter-style feed
BreakingNewsAlert.tsx   - Urgent full-screen alerts
InterviewScreen.tsx     - Press conference UI
InvestigationBoard.tsx  - String-board connections
MediaRelations.tsx      - Manage media contacts
```

---

## Implementation Phases

### Phase 1 (MVP - 2-3 hours):
- [x] Design specification
- [x] Template system
- [ ] Add news store
- [ ] Create NewsBrowser component
- [ ] Hook up mission → news generation
- [ ] Test basic headline generation

### Phase 2 (Enhanced - 4-6 hours):
- [ ] Police Scanner component
- [ ] Fame tier system
- [ ] Public opinion tracking
- [ ] Breaking news alerts
- [ ] Social media feed

### Phase 3 (Advanced - 8-10 hours):
- [ ] Interview system
- [ ] Investigation board
- [ ] Media relations
- [ ] Rumor chains
- [ ] Bounty system

### Phase 4 (Polish - 4-6 hours):
- [ ] Template variety expansion
- [ ] Disinformation mechanics
- [ ] World event generator
- [ ] Advanced consequences

---

## Example Usage in Code

```typescript
import NewsTemplates from '../data/newsTemplates';

// After mission completes
const headline = NewsTemplates.generateHeadline({
  success: true,
  collateralDamage: 5000,
  civilianCasualties: 0,
  fame: 75,
  city: "Lagos",
  country: "Nigeria",
  crime: "Bank Robbery",
  threat: "Armed Gang Members",
  vigilantismLegal: true,
  heroName: "Shadow Operative"
});
// Output: "Shadow Operative Stops Bank Robbery in Lagos"

const source = NewsTemplates.selectNewsSource('regional', 'Nigeria', 'Lagos');
// Output: "Lagos Daily Tribune" or "Global News Network"

const article = {
  id: `news-${Date.now()}`,
  headline,
  source,
  category: 'crime',
  timestamp: Date.now(),
  fameImpact: 15,
  publicOpinionShift: { 'Nigeria': 10 }
};

gameStore.addNewsArticle(article);
```

---

## Balancing Guidelines

**Fame Progression**:
- +5 to +30 per mission (scaled by difficulty)
- -10 to -50 for failures/casualties
- Fame decays 5% per week if inactive
- International missions: 1.25x fame multiplier

**Public Opinion**:
- +5 to +20 per successful legal mission
- -10 to -40 for illegal operations/casualties
- Opinion decays 2% per week toward neutral
- Max change per mission: ±30 points

**News Frequency**:
- 80% of player missions generate news
- 30% chance of world event per game hour
- 1-3 articles per mission (fame-dependent)
- Rumors appear 48 hours before missions

---

## Success Metrics

**How to measure if system is working**:

1. **Engagement**:
   - Do players read news articles?
   - Time spent in news browser
   - Rumor investigations

2. **Impact**:
   - Missions discovered via news/scanner
   - Fame driving recruitment
   - Public opinion affecting costs

3. **Immersion**:
   - Player feedback: "Does world feel alive?"
   - Players reference headlines
   - "Headline moments" memorable

4. **Balance**:
   - Fame progression feels rewarding
   - Bounties create tension (not frustration)
   - Media relations add depth (not busywork)

---

## Next Steps

1. **Review** the full proposal (NEWS_SYSTEM_PROPOSAL.md)
2. **Follow** the quick start guide (NEWS_SYSTEM_QUICK_START.md)
3. **Import** newsTemplates.ts into project
4. **Start** with Phase 1 MVP (2-3 hours)
5. **Test** thoroughly before expanding to Phase 2

---

## Design Highlights

**What makes this system special**:

1. **Consequence-Driven**: Every mission creates headlines (player actions matter)
2. **Multi-Channel**: Passive (browse) + Aggressive (alerts) delivery
3. **Living World**: Events occur independently of player
4. **Strategic Depth**: Fame/opinion are resources to manage
5. **Narrative Control**: Interviews let player shape their story
6. **Discovery Mechanic**: News reveals missions (investigation gameplay)
7. **Faction Reactions**: Different groups respond differently to same event
8. **Information Warfare**: Advanced players can manipulate media

---

**Core Philosophy**: *"Your missions make headlines. Your headlines shape the world."*

The News System transforms SHT from a tactical game into a **geopolitical simulation** where your reputation, public image, and media savvy are as important as your combat skills.
