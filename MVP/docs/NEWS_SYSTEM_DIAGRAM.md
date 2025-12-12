# NEWS SYSTEM - ARCHITECTURE DIAGRAM

```
╔═══════════════════════════════════════════════════════════════════════════════╗
║                         SUPERHERO TACTICS - NEWS SYSTEM                        ║
╚═══════════════════════════════════════════════════════════════════════════════╝

                              ┌─────────────────┐
                              │  PLAYER ACTIONS │
                              │  (Missions)     │
                              └────────┬────────┘
                                       │
                    ┌──────────────────┼──────────────────┐
                    │                  │                  │
                    ▼                  ▼                  ▼
            ┌──────────────┐   ┌──────────────┐  ┌──────────────┐
            │   Success?   │   │  Collateral  │  │  Casualties  │
            │   Failure?   │   │   Damage?    │  │    Count?    │
            └──────┬───────┘   └──────┬───────┘  └──────┬───────┘
                   │                  │                  │
                   └──────────────────┼──────────────────┘
                                      ▼
                          ┌───────────────────────┐
                          │  NEWS GENERATOR       │
                          │  (newsTemplates.ts)   │
                          └───────────┬───────────┘
                                      │
                      ┌───────────────┼───────────────┐
                      │               │               │
                      ▼               ▼               ▼
            ┌─────────────────┐ ┌──────────┐ ┌──────────────┐
            │ Select Template │ │  Fame    │ │   Country    │
            │   Based on:     │ │  Level   │ │ Vigilantism  │
            │ - Success       │ │ Affects  │ │   Legal?     │
            │ - Damage        │ │ Headline │ │              │
            │ - Legal Status  │ │  Type    │ │              │
            └─────────────────┘ └──────────┘ └──────────────┘
                      │               │               │
                      └───────────────┼───────────────┘
                                      ▼
                          ┌───────────────────────┐
                          │   GENERATED ARTICLE   │
                          │ - Headline            │
                          │ - Source              │
                          │ - Body Text           │
                          │ - Fame Impact         │
                          │ - Opinion Shift       │
                          └───────────┬───────────┘
                                      │
                      ┌───────────────┼───────────────┐
                      │               │               │
                      ▼               ▼               ▼
              ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
              │ News Store   │ │  Social Feed │ │   World      │
              │ (Articles)   │ │  (Posts)     │ │   Events     │
              └──────┬───────┘ └──────┬───────┘ └──────┬───────┘
                     │                │                │
                     └────────────────┼────────────────┘
                                      ▼
╔═══════════════════════════════════════════════════════════════════════════════╗
║                        PASSIVE NEWS (Player Seeks)                             ║
╚═══════════════════════════════════════════════════════════════════════════════╝

        ┌────────────────────┐         ┌────────────────────┐
        │  NEWS BROWSER      │         │  POLICE SCANNER    │
        │  (Laptop)          │         │  (Laptop/Phone)    │
        │                    │         │                    │
        │  Categories:       │         │  Live Events:      │
        │  • World           │         │  • Armed Robbery   │
        │  • Local           │         │  • LSW Sighting    │
        │  • Crime           │         │  • Suspicious Act. │
        │  • Politics        │         │  • Shots Fired     │
        │  • Sports          │         │                    │
        │  • Entertainment   │         │  → Respond Button  │
        └────────┬───────────┘         └────────┬───────────┘
                 │                              │
                 │      ┌────────────────────┐  │
                 └──────►   LAPTOP UI       ◄──┘
                        │   (Strategic)     │
                        └────────┬──────────┘
                                 │
        ┌────────────────────────┼────────────────────────┐
        │                        │                        │
        ▼                        ▼                        ▼
┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐
│  SOCIAL MEDIA    │    │  INVESTIGATION   │    │   MEDIA          │
│  FEED (Phone)    │    │  BOARD (Laptop)  │    │   RELATIONS      │
│                  │    │                  │    │   (Laptop)       │
│  • Reactions     │    │  Connect:        │    │                  │
│  • Recruitment   │    │  • Articles      │    │  • Schedule      │
│  • Villain Taunts│    │  • Rumors        │    │    Interview     │
│  • Gossip        │    │  • Evidence      │    │  • Give Statement│
│                  │    │                  │    │  • Damage Control│
│  → Click to view │    │  → Unlock Mission│    │                  │
└──────────────────┘    └──────────────────┘    └──────────────────┘

╔═══════════════════════════════════════════════════════════════════════════════╗
║                      AGGRESSIVE NEWS (Pushes to Player)                        ║
╚═══════════════════════════════════════════════════════════════════════════════╝

        ┌────────────────────┐         ┌────────────────────┐
        │  BREAKING NEWS     │         │  HANDLER CALLS     │
        │  ALERT             │         │  (Phone)           │
        │                    │         │                    │
        │  Full-screen       │         │  Urgent:           │
        │  overlay for:      │         │  • Mission Deadline│
        │  • LSW Attacks     │         │  • Political Issue │
        │  • War Declarations│         │  • Emergency Deploy│
        │  • Nuclear Threats │         │  • Intel Report    │
        │                    │         │                    │
        │  → Must Acknowledge│         │  → Timed Choices   │
        └────────┬───────────┘         └────────┬───────────┘
                 │                              │
                 │      ┌────────────────────┐  │
                 └──────►   NOTIFICATION    ◄──┘
                        │   SYSTEM          │
                        └────────┬──────────┘
                                 │
                                 ▼
                        ┌────────────────────┐
                        │  POP-UP EVENTS     │
                        │  (Choice Dialogs)  │
                        │                    │
                        │  • Moral Dilemmas  │
                        │  • Political Votes │
                        │  • Resource Choices│
                        │                    │
                        │  → Consequences    │
                        └────────────────────┘

╔═══════════════════════════════════════════════════════════════════════════════╗
║                           CONSEQUENCE SYSTEMS                                  ║
╚═══════════════════════════════════════════════════════════════════════════════╝

        ┌────────────────────┐         ┌────────────────────┐
        │   FAME SYSTEM      │         │  PUBLIC OPINION    │
        │                    │         │  (Per Country)     │
        │  Tiers:            │         │                    │
        │  • 0-50: Local     │         │  Scale: -100 to 100│
        │  • 51-150: Regional│         │                    │
        │  • 151-300: Natl.  │         │  Effects:          │
        │  • 301+: Global    │         │  • >50: Discounts  │
        │                    │         │  • 0-50: Normal    │
        │  Effects:          │         │  • -50-0: Markup   │
        │  • Recruitment     │         │  • <-50: Wanted    │
        │  • Coverage Level  │         │                    │
        │  • Mission Unlocks │         │  → Per Mission     │
        └────────┬───────────┘         └────────┬───────────┘
                 │                              │
                 └──────────────┬───────────────┘
                                ▼
                       ┌────────────────────┐
                       │  FACTION REACTIONS │
                       │                    │
                       │  • Government      │
                       │  • Police          │
                       │  • Military        │
                       │  • Criminals       │
                       │  • LSW Community   │
                       │  • Corporations    │
                       │  • Media Outlets   │
                       └────────┬───────────┘
                                │
                                ▼
                       ┌────────────────────┐
                       │  MISSION UNLOCKS   │
                       │                    │
                       │  News → Missions:  │
                       │  • Direct (Article)│
                       │  • Pattern (3+)    │
                       │  • Rumor Chain     │
                       │  • Public Demand   │
                       └────────────────────┘

╔═══════════════════════════════════════════════════════════════════════════════╗
║                         WORLD EVENT GENERATOR                                  ║
╚═══════════════════════════════════════════════════════════════════════════════╝

                        ┌────────────────────┐
                        │   GAME CLOCK       │
                        │   Advances         │
                        └────────┬───────────┘
                                 │
                                 │ (30% chance per hour)
                                 ▼
                        ┌────────────────────┐
                        │  Event Generator   │
                        │                    │
                        │  Types:            │
                        │  • Elections       │
                        │  • Disasters       │
                        │  • Villain Attacks │
                        │  • Tech Advances   │
                        │  • Political Crisis│
                        └────────┬───────────┘
                                 │
                      ┌──────────┼──────────┐
                      │          │          │
                      ▼          ▼          ▼
              ┌──────────┐ ┌──────────┐ ┌──────────┐
              │ Weighted │ │ Country  │ │ Generate │
              │   By:    │ │ Selected │ │  News    │
              │ • LSW    │ │  Based   │ │ Article  │
              │ Activity │ │  On Risk │ │          │
              │ • Terror │ │  Profile │ │          │
              └──────────┘ └──────────┘ └──────────┘
                      │          │          │
                      └──────────┼──────────┘
                                 ▼
                        ┌────────────────────┐
                        │  World Event News  │
                        │  + Mission Unlock  │
                        │  + Consequences    │
                        └────────────────────┘

╔═══════════════════════════════════════════════════════════════════════════════╗
║                         DISINFORMATION SYSTEM                                  ║
╚═══════════════════════════════════════════════════════════════════════════════╝

        ┌────────────────────┐         ┌────────────────────┐
        │  ENEMY PROPAGANDA  │         │  PLAYER SPIN       │
        │                    │         │  CONTROL           │
        │  Villains/Rivals:  │         │                    │
        │  • Fake Articles   │         │  Actions:          │
        │  • Discredit Player│         │  • Give Interview  │
        │  • Plant Evidence  │         │  • Leak Evidence   │
        │                    │         │  • Cover Story     │
        │  → Public Opinion  │         │  • Frame Rival     │
        │     Decreases      │         │                    │
        └────────┬───────────┘         └────────┬───────────┘
                 │                              │
                 │      ┌────────────────────┐  │
                 └──────►  COUNTER-MISSION  ◄──┘
                        │  Clear Your Name  │
                        └────────┬──────────┘
                                 │
                                 ▼
                        ┌────────────────────┐
                        │   INFORMATION      │
                        │   WARFARE          │
                        │   (Advanced)       │
                        │                    │
                        │  • Plant False Intel│
                        │  • Psyops          │
                        │  • Distraction     │
                        └────────────────────┘

╔═══════════════════════════════════════════════════════════════════════════════╗
║                           DATA FLOW SUMMARY                                    ║
╚═══════════════════════════════════════════════════════════════════════════════╝

   Player Action → News Generator → Article Created → Multiple Destinations
                        │                                      │
                        │                                      ├─→ News Browser
                        ▼                                      ├─→ Social Feed
                 Fame + Opinion                                ├─→ Faction Reactions
                    Changes                                    └─→ Mission Unlocks
                        │
                        ▼
              Affects Future Missions
         (Recruitment, Costs, Availability)

╔═══════════════════════════════════════════════════════════════════════════════╗
║                            TECHNICAL STACK                                     ║
╚═══════════════════════════════════════════════════════════════════════════════╝

┌─────────────────────────────────────────────────────────────────────────────┐
│  STATE MANAGEMENT (enhancedGameStore.ts)                                    │
│                                                                              │
│  • newsArticles: NewsArticle[]                                               │
│  • playerFame: number                                                        │
│  • publicOpinion: Record<string, number>                                     │
│  • bounties: Bounty[]                                                        │
│  • mediaContacts: MediaContact[]                                             │
│  • rumors: Rumor[]                                                           │
│                                                                              │
│  Actions:                                                                    │
│  • generateMissionNews(mission, result)                                      │
│  • addNewsArticle(article)                                                   │
│  • updatePublicOpinion(country, change)                                      │
│  • giveInterview(outlet, responses)                                          │
│  • investigateRumor(rumorId)                                                 │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│  DATA LAYER (newsTemplates.ts)                                              │
│                                                                              │
│  • HEADLINE_TEMPLATES: 100+ headline variations                              │
│  • ARTICLE_BODY_TEMPLATES: Full text generation                              │
│  • SOCIAL_TEMPLATES: Social media post variations                            │
│  • RUMOR_TEMPLATES: Multi-day rumor chains                                   │
│  • WORLD_EVENT_TEMPLATES: Procedural world events                            │
│                                                                              │
│  Functions:                                                                  │
│  • generateHeadline(context)                                                 │
│  • selectDescriptor(fame)                                                    │
│  • selectNewsSource(tier, country, city)                                     │
│  • fillTemplate(template, replacements)                                      │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│  UI COMPONENTS (React + TypeScript)                                         │
│                                                                              │
│  • NewsBrowser.tsx - Article reader with tabs                               │
│  • PoliceScanner.tsx - Live crime feed                                      │
│  • SocialFeed.tsx - Twitter-style interface                                 │
│  • BreakingNewsAlert.tsx - Full-screen alerts                               │
│  • InterviewScreen.tsx - Q&A interface                                      │
│  • InvestigationBoard.tsx - String-board connections                        │
│  • MediaRelations.tsx - Contact management                                  │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Component Interaction Flow

```
┌──────────────┐
│ Player       │
│ Completes    │──┐
│ Mission      │  │
└──────────────┘  │
                  │
       ┌──────────▼─────────┐
       │ enhancedGameStore  │
       │ .completeMission() │
       └──────────┬─────────┘
                  │
                  │ Calls
                  ▼
       ┌──────────────────────┐
       │ generateMissionNews()│
       │ (uses newsTemplates) │
       └──────────┬───────────┘
                  │
         ┌────────┴────────┐
         │                 │
         ▼                 ▼
   ┌─────────┐      ┌──────────────┐
   │ Article │      │ Social Posts │
   │ Created │      │ Generated    │
   └────┬────┘      └──────┬───────┘
        │                  │
        │                  │
        ▼                  ▼
   ┌────────────────────────────┐
   │ Store Updated:             │
   │ • newsArticles.push()      │
   │ • playerFame += impact     │
   │ • publicOpinion[country]++ │
   └────────────┬───────────────┘
                │
                │ React re-renders
                ▼
       ┌────────────────┐
       │ UI Components  │
       │ • NewsBrowser  │
       │ • SocialFeed   │
       │ Display Update │
       └────────────────┘
```

---

## File Dependencies

```
newsTemplates.ts
    │
    ├── Used by: enhancedGameStore.ts (generateMissionNews)
    ├── Used by: newsGenerator.ts (utility functions)
    └── Used by: worldEventGenerator.ts (world events)

enhancedGameStore.ts
    │
    ├── Consumed by: NewsBrowser.tsx
    ├── Consumed by: PoliceScanner.tsx
    ├── Consumed by: SocialFeed.tsx
    ├── Consumed by: InterviewScreen.tsx
    └── Consumed by: BreakingNewsAlert.tsx

React Components
    │
    └── All integrate into:
        ├── Laptop UI (strategic layer)
        └── Phone UI (mobile interface)
```

---

## Integration Points with Existing Systems

```
NEWS SYSTEM ←→ EXISTING SYSTEMS

News System          Integrates With           Data Flow
─────────────────────────────────────────────────────────────
generateMissionNews  CombatScene              Mission results →
                     completeMission()         News articles

Fame System          RecruitingPage           Fame →
                     Recruitment Pool          Better recruits

Public Opinion       World Map                Opinion →
                     Mission Costs             Price modifiers

Police Scanner       Sector System            Current sector →
                     Mission Triggers          Scanner events

Breaking Alerts      Notification System      Critical events →
                     GameNotification          Toast/Modal

Investigation Board  Investigation System     Articles →
                     Mission Unlocks           Hidden missions

Media Contacts       Faction System           Relationships →
                     Faction Standings         Media bias
```

---

## Database Schema (if using Supabase)

```sql
CREATE TABLE news_articles (
  id UUID PRIMARY KEY,
  headline TEXT NOT NULL,
  source TEXT NOT NULL,
  category TEXT NOT NULL,
  bias TEXT,
  generated_from JSONB,
  full_text TEXT,
  related_countries TEXT[],
  related_factions TEXT[],
  timestamp BIGINT,
  expiration_time BIGINT,
  fame_impact INTEGER,
  public_opinion_shifts JSONB,
  mission_opportunity JSONB
);

CREATE TABLE social_posts (
  id UUID PRIMARY KEY,
  user_handle TEXT NOT NULL,
  text TEXT NOT NULL,
  likes INTEGER DEFAULT 0,
  retweets INTEGER DEFAULT 0,
  sentiment TEXT,
  related_article UUID REFERENCES news_articles(id),
  timestamp BIGINT
);

CREATE TABLE rumors (
  id UUID PRIMARY KEY,
  day INTEGER NOT NULL,
  text TEXT NOT NULL,
  sector TEXT,
  mission_unlock_id TEXT,
  active BOOLEAN DEFAULT true,
  timestamp BIGINT
);

CREATE INDEX idx_news_timestamp ON news_articles(timestamp);
CREATE INDEX idx_news_category ON news_articles(category);
CREATE INDEX idx_social_timestamp ON social_posts(timestamp);
```

---

This diagram shows the complete architecture of the News System and how it integrates with existing SuperHero Tactics systems.
