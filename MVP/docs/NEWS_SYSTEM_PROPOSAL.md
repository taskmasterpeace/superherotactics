# NEWS SYSTEM PROPOSAL
## SuperHero Tactics - Passive & Aggressive Information Delivery

> **Design Philosophy**: News is both a consequence system (your actions matter) and a world-building tool (the world feels alive). Players should feel like they're operating in a living, breathing geopolitical environment where their choices ripple outward.

---

## SYSTEM OVERVIEW

The News System delivers information through two channels:
1. **PASSIVE**: Player seeks out information (News Browser, Police Scanner, Social Media)
2. **AGGRESSIVE**: Information pushes to player (Breaking Alerts, Handler Calls, Pop-ups)

---

## 1. PASSIVE NEWS (Player-Initiated)

### 1.1 News Browser / Feed (Laptop Interface)

**Design**: A web browser-style interface on the player's laptop with multiple news sources.

**Categories**:
- **World**: International events, LSW activities, geopolitical tensions
- **Local**: City-specific crime, politics, LSW sightings in current sector
- **Crime**: Gang activity, supervillain attacks, heists
- **Politics**: Elections, legislation, government scandals
- **Sports**: Superhuman athletes, exhibition matches
- **Entertainment**: LSW celebrity culture, movies about heroes

**News Outlets** (each with bias):
- **Global News Network (GNN)**: US-aligned, pro-LSW regulation
- **Eastern Times**: China/Russia-aligned, skeptical of Western heroes
- **Independent Wire**: Neutral, investigative journalism
- **Social Truth Network**: Conspiracy theories, sometimes accurate
- **Local City Papers**: 168 procedurally generated newspapers (1 per country)

**Example Headlines**:
```typescript
// World category
{
  headline: "Masked Vigilante Stops Bank Robbery in Lagos",
  source: "Lagos Daily Tribune",
  bias: "neutral",
  category: "world",
  generatedFrom: {
    playerAction: true,
    mission: "bank-robbery-lagos-043",
    characterId: "soldier-001",
    fame_change: +15
  },
  fullText: "An unidentified individual wearing tactical armor intervened in a robbery at First Bank of Nigeria yesterday. Three suspects were apprehended. Police have not commented on the vigilante's identity or legal status.",
  relatedTo: ["Nigeria", "vigilantism", "Lagos"],
  timestamp: 1234567890
}

// Crime category
{
  headline: "Technomancer Cult Claims Responsibility for Mumbai Power Outage",
  source: "Independent Wire",
  bias: "neutral",
  category: "crime",
  generatedFrom: {
    worldEvent: true,
    faction: "Technomancer-Cult",
    sector: "L15"
  },
  fullText: "A previously unknown group calling itself the 'Silicon Saints' has claimed responsibility for the coordinated cyberattack that left 2 million residents without power for 14 hours. Intelligence agencies are investigating possible LSW involvement.",
  relatedTo: ["India", "cyberterrorism", "LSW"],
  timestamp: 1234567891
}

// Politics category
{
  headline: "US Congress Debates LSW Registration Act",
  source: "Global News Network",
  bias: "pro-regulation",
  category: "politics",
  generatedFrom: {
    worldEvent: true,
    country: "United States",
    legislationType: "LSW-regulation"
  },
  fullText: "The controversial Living Superweapon Registration Act moved to the Senate floor today. Proponents argue it will increase public safety, while critics warn of civil liberties violations. The vote is expected next week.",
  relatedTo: ["United States", "LSW-regulations", "politics"],
  timestamp: 1234567892
}
```

**UI Implementation**:
- Tabbed interface: World | Local | Crime | Politics | Sports | Entertainment
- Filter by date, source, country
- Articles older than 30 days archived
- Search function for keywords
- "Related Articles" sidebar

**Data Structure**:
```typescript
interface NewsArticle {
  id: string;
  headline: string;
  source: NewsSource;
  category: NewsCategory;
  bias: 'pro-player' | 'anti-player' | 'neutral' | 'pro-regulation' | 'anti-regulation';
  generatedFrom: PlayerAction | WorldEvent | RandomEvent | RumorSeed;
  fullText: string;
  imageUrl?: string;
  relatedCountries: string[];
  relatedFactions: string[];
  timestamp: number; // game time
  expirationTime?: number; // when article becomes "old news"
  fameImpact?: number; // how this affects player fame
  publicOpinionShift?: Record<string, number>; // country -> opinion delta
  missionOpportunity?: MissionSeed; // can unlock missions
}

type NewsCategory = 'world' | 'local' | 'crime' | 'politics' | 'sports' | 'entertainment';

type NewsSource =
  | 'Global News Network'
  | 'Eastern Times'
  | 'Independent Wire'
  | 'Social Truth Network'
  | `${string} Daily Tribune`; // Procedural city newspapers
```

---

### 1.2 Police Scanner (Laptop/Phone)

**Design**: Live police radio feed showing real-time crime events in player's current sector or home base.

**Event Types**:
- Armed robbery in progress
- LSW sighting
- Gang violence
- Hostage situation
- Vehicle pursuit
- Structure fire with trapped civilians
- Suspicious activity (potential missions)

**Example Scanner Feed**:
```typescript
{
  id: "scanner-K3-1234",
  sector: "K3",
  city: "Washington DC",
  type: "armed_robbery",
  urgency: "high",
  description: "10-31 at First National Bank, 1400 Pennsylvania Ave. Multiple suspects, possibly armed with energy weapons.",
  units_responding: ["Unit 23", "Unit 45", "SWAT-1"],
  timestamp: Date.now(),
  responseTime: 180, // seconds until police arrive
  missionSeed: {
    type: "intervention",
    difficulty: 6,
    reward: 3500,
    fame: +20,
    timeLimit: 180 // must respond before police arrive for bonus fame
  }
}
```

**Gameplay Mechanics**:
- Player can respond to scanner calls for instant missions
- Arriving before police = fame bonus
- Arriving after police = fame penalty
- Ignoring calls in home city = public opinion drop
- Scanner range: current sector + adjacent sectors

**UI Implementation**:
- Scrolling feed with audio snippets (real police radio chatter)
- Color-coded by urgency: Red (high), Yellow (medium), Blue (low)
- "Respond" button appears if player has available squad in sector
- Shows ETA for player squad vs police response time

---

### 1.3 Social Media Feed (Phone)

**Design**: Twitter/Reddit-style feed showing public reactions to player actions and world events.

**Post Types**:
1. **Citizen reactions** to recent missions
2. **LSW celebrity gossip**
3. **Conspiracy theories**
4. **Memes about your squad**
5. **Recruitment opportunities** (talented individuals seeking heroes)
6. **Villain taunts** (boss enemies calling out player)

**Example Posts**:
```typescript
// Positive reaction to player mission
{
  user: "@LagosCitizen_45",
  text: "Just saw that armored hero stop a bank robbery! Finally someone doing something about crime in this city! 💪",
  likes: 1243,
  retweets: 456,
  timestamp: Date.now(),
  sentiment: "positive",
  relatedTo: {
    missionId: "bank-robbery-lagos-043",
    characterId: "soldier-001"
  }
}

// Negative reaction (collateral damage)
{
  user: "@NYCResident_92",
  text: "That vigilante destroyed my car during that fight. No insurance covers 'superhero damage'. Who pays for this?! 😡",
  likes: 5672,
  retweets: 2341,
  timestamp: Date.now(),
  sentiment: "negative",
  relatedTo: {
    missionId: "hostage-rescue-nyc-088",
    collateralDamage: 45000
  }
}

// Recruitment opportunity
{
  user: "@TechGenius_AI",
  text: "I built something incredible. If you're fighting the good fight and need tech support, DM me. [ENCRYPTED LINK]",
  likes: 234,
  retweets: 12,
  timestamp: Date.now(),
  recruitmentSeed: {
    characterType: "engineer",
    stats: { INT: 78, SCI: 85 },
    cost: 15000,
    fame_required: 100
  }
}

// Villain taunt
{
  user: "@Technomancer_Prime",
  text: "I see you've been busy in Lagos, little hero. When you're ready for a real challenge, you know where to find me. ⚡",
  likes: 892,
  retweets: 245,
  timestamp: Date.now(),
  villainEncounter: {
    characterId: "villain-technomancer-001",
    sector: "L16",
    threatLevel: 8,
    missionUnlock: "boss-technomancer-showdown"
  }
}
```

**Gameplay Mechanics**:
- Feed updates based on player actions (1-6 hour delay)
- High fame = more reactions to your missions
- Low fame = fewer people notice you
- Public opinion affects recruitment pool
- Villain taunts can unlock boss missions
- Conspiracy posts sometimes contain accurate intel

---

### 1.4 Investigation Board (Laptop)

**Design**: String-board style interface connecting news articles, rumors, and evidence.

**Features**:
- Pin news articles to board
- Draw connections between events
- Track villain patterns (locations, MO, timestamps)
- Unlock hidden missions by connecting 3+ related articles
- Intelligence characters get bonuses to discovering connections

**Example Connection Chain**:
```
Article 1: "Power Plant Sabotage in Delhi"
    +
Article 2: "Cyber Attack on Mumbai Grid"
    +
Article 3: "Tech CEO Kidnapped in Bangalore"
    =
REVEALED MISSION: "Technomancer Cult Operating in India"
    Difficulty: 9
    Reward: $25,000 + Tech Prototype
    Fame: +50
```

---

## 2. AGGRESSIVE NEWS (System-Initiated)

### 2.1 Breaking News Alerts

**Design**: Pop-up notifications that interrupt gameplay during critical world events.

**Trigger Conditions**:
- LSW terrorist attack (>100 casualties)
- Nuclear/biological threat
- War declaration
- Major villain attack in player's home country
- Government coup
- LSW-related legislation passed

**Example Alerts**:
```typescript
{
  type: "breaking_alert",
  priority: "critical",
  headline: "BREAKING: Superhuman Attack on Tokyo Metro - 200+ Casualties",
  description: "Unidentified LSW individual detonated energy blast in Shibuya Station. Emergency services on scene. Japanese government has activated LSW Response Protocol.",
  imageUrl: "/news/tokyo-attack.jpg",
  consequences: {
    japan_lsw_regulations: "banned", // changed from "regulated"
    japan_public_opinion: -30,
    world_tension: +15
  },
  missionOpportunity: {
    type: "international_crisis_response",
    timeLimit: 48, // hours
    reward: 50000,
    fame: 100,
    unlocks: "japan-operations"
  },
  displayDuration: 10000, // milliseconds
  pausesGameplay: true // forces player to acknowledge
}
```

**UI Implementation**:
- Full-screen overlay with TV news style graphics
- Animated "BREAKING NEWS" banner
- Auto-pause gameplay until dismissed
- "Respond Now" or "Dismiss" buttons
- Creates permanent news article in browser

---

### 2.2 Handler Calls (Phone)

**Design**: Voice/text calls from player's government handler about urgent situations.

**Trigger Conditions**:
- Mission deadline approaching
- Intel about enemy activity in player's sector
- Budget changes (increase/decrease)
- Political pressure to act (or stand down)
- Emergency deployment request

**Handler Personality**: Changes based on player's home country
- US Handler: Professional, military background
- UK Handler: Dry humor, intelligence background
- Japan Handler: Formal, efficient
- Nigeria Handler: Direct, pragmatic

**Example Handler Calls**:
```typescript
// Mission deadline warning
{
  type: "handler_call",
  priority: "high",
  from: "Director Sarah Mendez (SHIELD)",
  message: "Commander, that kidnapping case in Chicago? We're running out of time. The senator's family is pressuring us. I need your team on this within 6 hours or I'm pulling the mission.",
  tone: "urgent",
  choices: [
    { text: "We're on it", action: "accept_mission", deadline: 6 },
    { text: "We need more time", action: "negotiate", risk: "reputation_loss" },
    { text: "Reassign to someone else", action: "decline", consequence: "fame_loss" }
  ],
  relatedMission: "senator-kidnap-chicago-045"
}

// Political pressure
{
  type: "handler_call",
  priority: "medium",
  from: "Director Sarah Mendez (SHIELD)",
  message: "Listen, the State Department is breathing down my neck about that Lagos operation. You embarrassed the local police. Maybe tone down the theatrics next time?",
  tone: "frustrated",
  consequence: {
    nigeria_diplomatic_relations: -5,
    us_nigeria_tension: +3
  },
  choices: [
    { text: "Understood", action: "acknowledge" },
    { text: "They needed help", action: "defend_action", risk: "handler_relationship" }
  ]
}

// Emergency deployment
{
  type: "handler_call",
  priority: "urgent",
  from: "Director Sarah Mendez (SHIELD)",
  message: "Drop everything. We have a THREAT_7 LSW tearing through downtown Miami. I'm activating emergency protocols. Get there NOW.",
  tone: "emergency",
  autoAccept: true, // no choice
  missionDeploy: {
    sector: "J7",
    city: "Miami",
    type: "lsw_containment",
    difficulty: 9,
    backup: ["US Military", "Local Police"]
  }
}
```

**UI Implementation**:
- Phone vibrates and shows incoming call screen
- Handler's profile picture
- Dialogue appears in speech bubbles
- Timed choices (30 seconds to respond)
- Call history saved in phone

---

### 2.3 Pop-Up Events Requiring Response

**Design**: Time-sensitive choices that create branching narratives.

**Event Types**:
1. **Moral Dilemmas**: Save hostages or pursue villain?
2. **Political Decisions**: Support new LSW law or oppose it?
3. **Resource Allocation**: Spend budget on equipment or bribes?
4. **Recruitment Offers**: Accept defecting villain or refuse?

**Example Pop-Up Events**:
```typescript
// Moral dilemma during mission
{
  type: "event_choice",
  priority: "urgent",
  title: "CRISIS: Bank Vault Flooding",
  description: "The villain triggered a fail-safe - the vault is flooding with 12 hostages inside. You can save the hostages OR pursue the villain escaping by helicopter. Choose now.",
  timer: 10, // seconds to decide
  choices: [
    {
      text: "Save the hostages",
      outcome: {
        hostages_saved: 12,
        villain_escaped: true,
        fame: +30,
        public_opinion: +15,
        mission_status: "partial_success"
      }
    },
    {
      text: "Pursue the villain",
      outcome: {
        hostages_drowned: 12,
        villain_captured: true,
        fame: -50,
        public_opinion: -40,
        mission_status: "pyrrhic_victory",
        media_headline: "Hero Lets Hostages Die to Catch Criminal"
      }
    }
  ]
}

// Political decision
{
  type: "event_choice",
  priority: "high",
  title: "LSW Registration Act - Vote Today",
  description: "The LSW Registration Act is being voted on in Congress. Your handler asks: do you publicly support it or oppose it? This will affect your legal status.",
  timer: 60,
  choices: [
    {
      text: "Support registration",
      outcome: {
        us_lsw_regulations: "strict",
        fame: +20,
        vigilante_recruitment: -30, // harder to recruit
        government_support: +25
      }
    },
    {
      text: "Oppose registration",
      outcome: {
        us_lsw_regulations: "regulated",
        fame: -10,
        vigilante_recruitment: +20,
        government_support: -15,
        media_headline: "Hero Defies Government on LSW Regulation"
      }
    },
    {
      text: "Stay silent",
      outcome: {
        us_lsw_regulations: "regulated", // passes anyway
        no_fame_change: true,
        media_headline: "Hero Remains Silent on Controversial LSW Act"
      }
    }
  ]
}
```

---

## 3. NEWS GENERATION SYSTEM

### 3.1 Player Action Consequences

**Every mission generates news based on**:
1. **Success/Failure**: Mission outcome
2. **Collateral Damage**: Property destruction, civilian casualties
3. **Method**: Stealth vs loud approach
4. **Legality**: Operating in countries that ban vigilantism
5. **Fame Level**: High fame = national news, low fame = local only

**Generation Formula**:
```typescript
function generateMissionNews(mission: Mission, result: MissionResult): NewsArticle {
  const fame_tier = player.fame < 50 ? 'local' : player.fame < 150 ? 'national' : 'international';

  const headline = selectHeadline({
    success: result.success,
    collateral: result.collateralDamage,
    casualties: result.civilianCasualties,
    fame: player.fame,
    country: mission.country,
    vigilantism_legal: mission.country.vigilantism === 'legal'
  });

  const bias = determineSourceBias(mission.country, player.homeCountry);

  return {
    headline,
    source: selectNewsSource(fame_tier, bias),
    category: 'crime', // or 'world' if international
    generatedFrom: { playerAction: true, missionId: mission.id },
    fullText: generateArticleBody(mission, result),
    fameImpact: calculateFameChange(result),
    publicOpinionShift: calculateOpinionChange(mission.country, result)
  };
}
```

**Example Headlines** (generated from mission results):
```typescript
// Success, low collateral
"Vigilante Stops Armed Robbery, No Casualties"
"Masked Hero Thwarts Bank Heist in Lagos"

// Success, high collateral
"Hero Saves Hostages, Destroys City Block in Process"
"Vigilante's Reckless Tactics Cost $2M in Damages"

// Failure
"Bank Robbers Escape Despite Vigilante Intervention"
"Amateur Hero Outmatched by Experienced Criminals"

// Operating illegally
"Foreign Operative Violates Chinese Sovereignty"
"Unauthorized Vigilante Sparks Diplomatic Incident"
```

---

### 3.2 World Events (AI-Driven)

**Event Categories**:
1. **Elections**: Countries change leadership, policies shift
2. **Disasters**: Natural disasters create mission opportunities
3. **Villain Attacks**: Procedural villain activity
4. **Faction Wars**: LSW factions fight each other
5. **Technological Breakthroughs**: New equipment unlocks
6. **Political Crises**: Coups, protests, legislation

**Generation Rules**:
- 2-5 world events per game day
- Weighted by country's terrorism/lsw_activity ratings
- High-tension regions more likely to generate events
- Events can chain (disaster -> humanitarian crisis -> villain exploitation)

**Example World Events**:
```typescript
// Election changes policy
{
  type: "election",
  country: "Brazil",
  headline: "New Brazilian President Vows to 'Crack Down on Vigilantes'",
  consequence: {
    brazil_vigilantism: "banned", // changed from "regulated"
    brazil_lsw_regulations: "strict",
    us_brazil_relations: -10 // if player is US-aligned
  },
  missionImpact: {
    brazil_missions: "unavailable", // can't operate legally
    cost_multiplier: 2.0 // bribes needed to operate
  }
}

// Villain attack
{
  type: "villain_attack",
  country: "India",
  headline: "Technomancer Cult Attacks Mumbai Power Grid",
  consequence: {
    mumbai_power: "offline",
    india_lsw_activity: +10,
    civilian_casualties: 47
  },
  missionOpportunity: {
    type: "counter_terrorism",
    location: "Mumbai",
    difficulty: 8,
    timeLimit: 72,
    reward: 30000
  }
}

// Technological breakthrough
{
  type: "tech_breakthrough",
  country: "Japan",
  headline: "Japanese Scientists Develop Prototype Exo-Suit",
  consequence: {
    equipment_unlock: "exo_suit_mk1",
    japan_science: +5
  },
  purchaseOpportunity: {
    item: "exo_suit_mk1",
    cost: 150000,
    requires_fame: 200
  }
}
```

---

### 3.3 Random Events (Filler News)

**Purpose**: Make the world feel alive even when nothing major is happening.

**Types**:
- Sports scores (superhuman leagues)
- Celebrity gossip (LSW celebrities)
- Weather reports (affects missions)
- Stock market (affects budget)
- Cultural events (festivals, conventions)

**Example Filler Headlines**:
```
"Superhuman Olympics: US Team Takes Gold in Strength Competition"
"LSW Celebrity 'Thunderstrike' Announces Retirement"
"Tokyo Tech Expo Features Latest in Power Armor Design"
"Stock Market Rallies After Peaceful LSW Summit"
"Annual Hero Convention in Las Vegas Draws Record Crowds"
```

---

### 3.4 Rumor System (Mission Hints)

**Design**: Unconfirmed reports that hint at upcoming content.

**Rumor Types**:
1. **Villain Sightings**: "Strange lights seen over warehouse district"
2. **Conspiracy Theories**: "Government hiding alien technology" (sometimes true!)
3. **Informant Tips**: "My cousin works at the docks, says something big is coming in"
4. **Pattern Recognition**: "Third chemical plant robbery this month"

**Gameplay Mechanics**:
- Rumors appear 48-96 hours before actual mission becomes available
- Investigating rumors early = preparation time
- Some rumors are false leads (red herrings)
- Intelligence characters can verify rumor accuracy

**Example Rumor Chain**:
```
Day 1: Social media post - "Weird energy readings near abandoned factory"
Day 2: News article - "Local Resident Reports Strange Noises from Old Warehouse"
Day 3: Police scanner - "10-10 suspicious activity, industrial district"
Day 4: MISSION UNLOCKED - "Investigate Technomancer Hideout"
```

---

## 4. NEWS EFFECTS ON GAMEPLAY

### 4.1 Fame System

**Fame Changes**:
- Positive news coverage: +5 to +50 fame
- Negative news coverage: -10 to -100 fame
- Ignored crisis in home country: -20 fame
- International hero work: +15 fame (global)

**Fame Tiers**:
- 0-50: Local vigilante (only local news covers you)
- 51-150: Regional hero (national news coverage)
- 151-300: National icon (international news coverage)
- 301+: Global celebrity (everything you do makes headlines)

**Fame Effects**:
- Recruitment pool size (high fame attracts better recruits)
- Equipment prices (celebrity discount or markup)
- Mission availability (some missions require fame threshold)
- Villain targeting (high fame = villains challenge you)

---

### 4.2 Public Opinion System

**Per-Country Tracking**:
```typescript
interface PublicOpinion {
  countryId: string;
  opinion: number; // -100 to +100
  lastActionTimestamp: number;
  recentHeadlines: string[]; // last 5 headlines about player
}
```

**Opinion Modifiers**:
- Operating legally: +5 per mission
- Operating illegally: -15 per mission
- Saving civilians: +10
- Collateral damage: -20
- Catching major villain: +30
- Letting villain escape: -10

**Opinion Effects**:
- Positive (>50): Discounts, easier recruitment, police cooperation
- Neutral (0-50): Normal operations
- Negative (-50 to 0): Higher costs, hostile media
- Hostile (<-50): Wanted status, police interference, bounties

---

### 4.3 Faction Reactions

**Faction Types**:
1. **Government**: Your handler's organization
2. **Police**: Local law enforcement
3. **Military**: National defense forces
4. **Criminal Underworld**: Gangs, cartels
5. **LSW Community**: Other heroes and villains
6. **Corporations**: Tech companies, weapons manufacturers
7. **Media**: News outlets

**Reaction System**:
```typescript
// Example: You stop a terrorist attack in Nigeria
{
  player_action: "terrorist_attack_stopped",
  location: "Lagos, Nigeria",
  factions: {
    nigeria_government: { reaction: "grateful", relation_change: +25 },
    nigeria_police: { reaction: "cooperative", relation_change: +15 },
    global_news_network: { reaction: "positive_coverage", article_bias: "pro_player" },
    technomancer_cult: { reaction: "vengeful", spawn_retaliation_mission: true },
    lagos_citizens: { reaction: "celebratory", public_opinion: +20 }
  }
}
```

---

### 4.4 Mission Opportunities

**News-Generated Missions**:
1. **Direct Unlocks**: News article explicitly mentions a problem
2. **Pattern Recognition**: Connect 3+ articles to reveal hidden mission
3. **Rumor Investigation**: Follow rumor chain to unlock mission early
4. **Public Demand**: High public opinion + crisis = emergency request

**Example Mission Unlocks**:
```typescript
// Direct unlock from news
NewsArticle: "Serial Kidnapper Strikes Again in Tokyo"
  → Mission Unlocked: "Hunt the Tokyo Kidnapper"
  → Difficulty: 7
  → Reward: $20,000 + Fame +40

// Pattern recognition
NewsArticle 1: "Chemical Plant Robbery in Delhi"
NewsArticle 2: "Pharmaceutical Lab Broken Into"
NewsArticle 3: "Biotech Warehouse Raided"
  → Pattern Detected: "Someone is building a biological weapon"
  → Mission Unlocked: "Stop the Bio-Terrorist"
  → Difficulty: 9
  → Reward: $50,000 + Fame +80
```

---

### 4.5 Bounties / Wanted Status

**Trigger Conditions**:
- Operating in country where vigilantism is banned
- High collateral damage (>$100,000)
- Civilian casualties (>5 deaths)
- Attacking police or military
- Public opinion <-50 in a country

**Bounty System**:
```typescript
interface Bounty {
  characterId: string;
  country: string;
  amount: number; // reward for capture
  crimeType: 'vigilantism' | 'property_damage' | 'assault' | 'murder';
  wantedLevel: 1 | 2 | 3 | 4 | 5; // 1 = local police, 5 = international manhunt
  activeUntil: number; // timestamp
  consequences: {
    travel_restricted: boolean;
    police_hostility: boolean;
    mission_availability: number; // percentage reduction
  }
}
```

**News Coverage of Bounties**:
```
Headline: "Chinese Government Issues Arrest Warrant for 'Shadow Operative'"
Body: "The Ministry of Public Security has placed a 5 million yuan bounty on the unidentified vigilante who operated illegally in Shanghai last week. Officials warn citizens not to approach the armed suspect."
```

---

## 5. MEDIA RELATIONS SYSTEM

### 5.1 Giving Interviews

**Design**: Player can schedule interviews with news outlets to control narrative.

**Interview Types**:
1. **Press Conference**: Formal, multiple outlets
2. **Exclusive Interview**: One outlet, builds relationship
3. **Social Media Statement**: Direct to public, no filter

**Interview Questions** (procedurally generated based on recent events):
```typescript
// After high-collateral mission
Question: "Critics say your tactics are reckless. How do you respond to the $2 million in damages caused during last week's operation?"

Choices:
A) "Saving lives is worth any cost" → Public opinion: +15 (heroic), Government: -10 (costly)
B) "I regret the damage and will be more careful" → Public opinion: +5 (humble), Media: +10 (cooperative)
C) "The real criminals are the ones I stopped" → Public opinion: -5 (deflecting), Villain faction: -10 (angered)
D) Decline to answer → Media: -15 (evasive), No other effects
```

**Interview Outcomes**:
- Positive coverage: +Fame, +Public Opinion
- Negative coverage: -Fame, -Public Opinion
- Neutral coverage: +Media Relationship (useful later)
- Controversial statement: +Fame, +Public Opinion in some countries, -in others

---

### 5.2 Press Conferences

**Trigger Conditions**:
- After major mission success
- After major mission failure (damage control)
- Before international operations (build support)
- After achieving fame milestone

**Mechanics**:
- Answer 3-5 questions from different outlets
- Each outlet has different bias/agenda
- Can end conference early (looks evasive)
- Can bring team members (they may improvise answers)

---

### 5.3 Managing Narrative

**Spin Control**:
```typescript
// After mission with civilian casualties
NewsArticle (Before Spin): "Vigilante's Reckless Attack Kills 3 Bystanders"

Player Actions:
1) Give interview → "Terrorists Used Hostages as Shields"
   → Article Updated: "Hero Faces Impossible Choice in Hostage Crisis"

2) Release evidence → Security footage shows terrorist tactics
   → Article Updated: "Analysis: Vigilante Had No Choice"

3) Compensate families → $50,000 donation to victims' families
   → Article Updated: "Hero Takes Responsibility, Supports Victims"

4) Stay silent → Original article stands
   → Fame: -30, Public Opinion: -20
```

---

### 5.4 Friendly vs Hostile Media Contacts

**Relationship Tracking**:
```typescript
interface MediaContact {
  name: string;
  outlet: NewsSource;
  bias: 'pro_player' | 'neutral' | 'anti_player';
  relationship: number; // -100 to +100
  specialization: 'investigative' | 'political' | 'crime' | 'entertainment';
  trustLevel: number; // 0-100, affects leak probability
}
```

**Friendly Media Benefits**:
- Positive spin on your missions
- Advance warning of negative stories
- Can leak information to undermine enemies
- Exclusive interviews boost fame

**Hostile Media Risks**:
- Negative spin on your missions
- Investigative exposés (reveal secret identity?)
- Collaborate with your enemies
- Difficult interview questions

---

## 6. FAKE NEWS / DISINFORMATION

### 6.1 Enemy Propaganda

**Sources**:
1. **Villain Organizations**: Discredit player to reduce support
2. **Rival Nations**: Geopolitical manipulation
3. **Corrupt Corporations**: Protecting their interests
4. **Criminal Enterprises**: Reduce police/public cooperation with player

**Example Propaganda**:
```typescript
// Villain-sponsored fake news
{
  headline: "EXCLUSIVE: 'Hero' Linked to Illegal Arms Trafficking",
  source: "Social Truth Network", // conspiracy site controlled by villain
  category: "crime",
  isFakeNews: true,
  generatedBy: {
    faction: "Technomancer Cult",
    purpose: "discredit_player"
  },
  fullText: "Anonymous sources within law enforcement claim the vigilante known as [PLAYER] has been smuggling weapons across international borders. Documents obtained by this outlet suggest...",
  consequences: {
    public_opinion: -15,
    police_cooperation: -20,
    investigation_mission: true // player must clear their name
  }
}
```

**Counter-Propaganda Missions**:
- Hack news site to remove fake article
- Find evidence proving it's fake
- Track down anonymous source (villain operative)
- Give interview to deny allegations

---

### 6.2 Cover Stories

**Player-Generated Disinformation**:
- After covert operation: "Gas Leak Causes Explosion" (not your grenade)
- After villain capture: "Criminal Turned Himself In" (hide your involvement)
- After illegal operation: "Local Police Made Arrest" (avoid international incident)

**Mechanics**:
```typescript
// After mission in country where vigilantism is banned
Mission Complete: Stop Arms Deal in Beijing

Choices:
1) Take credit publicly
   → Fame: +30
   → China bounty: $1,000,000
   → China operations: BANNED

2) Leak to friendly journalist (cover story)
   → Fame: +10 (rumor mill credits you anyway)
   → China bounty: NONE
   → Cost: $5,000 (bribe journalist)

3) Frame rival faction
   → Fame: +5
   → Rival faction: -30 relations
   → Moral consequences: ???
```

---

### 6.3 Information Warfare

**Advanced Tactics** (requires Intelligence characters):
1. **Plant False Intel**: Leak fake villain location to lure them into trap
2. **Discredit Enemy**: Fabricate evidence against rival organization
3. **Psyops**: Use media to demoralize enemy faction
4. **Distraction**: Generate fake crisis to divert attention from real operation

**Example Info Warfare**:
```typescript
// Player plants false intel
Action: "Leak fake villain hideout to media"
  → News Article: "Anonymous Tip: Technomancer Cult Base in Sector M12"
  → Police raid M12 (find nothing)
  → Villain faction: distracted, moves resources to defend M12
  → Player: Attacks real base in M8 (reduced defenses)

Risk: If exposed as fake, lose media trust + public opinion
```

---

## 7. TECHNICAL IMPLEMENTATION

### 7.1 Data Structure

```typescript
// Core news system
interface NewsSystem {
  articles: NewsArticle[];
  scannerEvents: ScannerEvent[];
  socialPosts: SocialPost[];
  mediaContacts: MediaContact[];
  rumors: Rumor[];
  fameLevel: number;
  publicOpinion: Record<string, number>; // country -> opinion
  bounties: Bounty[];
  mediaRelationships: Record<string, number>; // outlet -> relationship
}

// News generation queue
interface NewsGenerationQueue {
  playerActions: PlayerAction[]; // missions completed, awaiting news generation
  worldEvents: WorldEvent[]; // scheduled world events
  rumorSeeds: RumorSeed[]; // rumors to plant
  processingDelay: number; // hours delay before news appears (realism)
}
```

---

### 7.2 Integration with Existing Systems

**Store Updates** (enhancedGameStore.ts):
```typescript
interface EnhancedGameStore {
  // ... existing properties

  // NEW: News System
  newsArticles: NewsArticle[];
  scannerEvents: ScannerEvent[];
  socialFeed: SocialPost[];
  mediaContacts: MediaContact[];
  rumors: Rumor[];
  playerFame: number;
  publicOpinion: Record<string, number>;
  bounties: Bounty[];

  // NEW: News Actions
  generateMissionNews: (mission: Mission, result: MissionResult) => void;
  generateWorldEvent: () => void;
  respondToScannerCall: (eventId: string) => void;
  giveInterview: (outlet: string, responses: string[]) => void;
  investigateRumor: (rumorId: string) => void;
  clearBounty: (bountyId: string) => void;
}
```

---

### 7.3 UI Components

**New Components Needed**:
1. `NewsBrowser.tsx` - Main news reading interface
2. `PoliceScanner.tsx` - Live police radio feed
3. `SocialFeed.tsx` - Twitter-style social media
4. `InvestigationBoard.tsx` - String-board connections
5. `InterviewScreen.tsx` - Interview Q&A interface
6. `BreakingNewsAlert.tsx` - Full-screen urgent alerts
7. `MediaRelations.tsx` - Manage media contacts

**Integration Points**:
- Laptop UI: News Browser tab, Police Scanner tab
- Phone UI: Social Feed, Incoming Calls
- World Map: Breaking alerts overlay
- Character Screen: Fame display, Bounty warnings

---

### 7.4 Performance Considerations

**Optimization Strategies**:
1. **Article Expiration**: Delete articles older than 90 game days
2. **Scanner Event Cleanup**: Remove resolved events after 24 hours
3. **Social Feed Pagination**: Load 50 posts at a time
4. **Lazy Loading**: Only generate article full text when player reads it
5. **Caching**: Cache generated headlines to avoid regeneration

**Database Schema** (if using Supabase):
```sql
CREATE TABLE news_articles (
  id UUID PRIMARY KEY,
  headline TEXT NOT NULL,
  source TEXT NOT NULL,
  category TEXT NOT NULL,
  generated_from JSONB, -- stores playerAction/worldEvent data
  full_text TEXT,
  related_countries TEXT[],
  timestamp BIGINT,
  fame_impact INTEGER,
  public_opinion_shifts JSONB
);

CREATE INDEX idx_news_timestamp ON news_articles(timestamp);
CREATE INDEX idx_news_category ON news_articles(category);
```

---

## 8. EXAMPLE NEWS GENERATION WORKFLOWS

### Workflow 1: Player Completes Mission
```
1. Player completes bank robbery mission in Lagos
2. MissionResult calculated: success=true, collateral=$5000, casualties=0
3. generateMissionNews() called
4. System determines:
   - Fame tier: 75 (national coverage)
   - Vigilantism legal in Nigeria: YES
   - Collateral low: positive spin
5. Generate headline: "Vigilante Stops Bank Robbery, Minimal Damage"
6. Select source: "Lagos Daily Tribune" (local paper)
7. Generate full text using template + mission data
8. Calculate consequences:
   - Fame: +20
   - Nigeria public opinion: +10
   - Lagos city familiarity: +5
9. Create news article and save to store
10. Create social media reactions (3-5 posts)
11. If player fame >100, generate national news article too
12. Add to news browser, notify player via toast
```

---

### Workflow 2: World Event Triggers
```
1. Game clock advances to Day 15, 14:00
2. World event generator rolls: 30% chance per hour
3. Roll succeeds, select event type: "villain_attack"
4. Select country weighted by lswActivity + terrorismActivity
5. Selected: India (high lswActivity)
6. Generate villain attack details:
   - Faction: Technomancer Cult
   - Location: Mumbai
   - Severity: 7/10
7. Create news article: "Technomancer Cult Attacks Mumbai Power Grid"
8. Calculate consequences:
   - India lswActivity: +10
   - Mumbai power: offline for 48 hours
   - Civilian casualties: 47
9. Create mission opportunity:
   - Type: counter_terrorism
   - Difficulty: 8
   - Reward: $30,000
   - Time limit: 72 hours
10. Add article to news browser
11. If player in India: send breaking news alert
12. If player fame >150: send breaking news alert (international hero)
13. Generate 2-3 social media reactions
14. Add rumor seed for follow-up mission
```

---

### Workflow 3: Rumor Chain
```
Day 1:
  - Generate rumor seed: "Warehouse district investigation"
  - Post to social media: "Weird lights seen over abandoned warehouse"
  - Player sees post in social feed

Day 2:
  - Generate related news: "Local Resident Reports Strange Noises"
  - Add to local news section
  - If player investigating: unlock additional clue

Day 3:
  - Scanner event: "10-10 suspicious activity, warehouse district"
  - Player can respond to scanner call
  - If player responds: investigate immediately
  - If player ignores: delay mission unlock

Day 4:
  - Mission unlocked: "Investigate Technomancer Hideout"
  - Generate news article: "Police Baffled by Warehouse Mystery"
  - Player can now accept mission from mission board

Player Actions:
  - If investigates rumor early (Day 1-2): mission unlocked Day 3 (bonus prep time)
  - If investigates late (Day 3): mission unlocked Day 4 (standard)
  - If ignores: mission becomes emergency crisis Day 7 (penalty)
```

---

## 9. HEADLINE GENERATION TEMPLATES

### Template System
```typescript
const HEADLINE_TEMPLATES = {
  mission_success: [
    "{Descriptor} {Action} {Crime} in {City}",
    "Vigilante {Action} {Threat}, {Outcome}",
    "{City} {Crime}: {Descriptor} Intervenes"
  ],
  mission_failure: [
    "{Descriptor} Fails to Stop {Crime}",
    "{Threat} Escapes Despite Vigilante Effort",
    "Amateur Hero Outmatched in {City}"
  ],
  high_collateral: [
    "{Descriptor}'s Tactics Cost {Amount} in Damages",
    "Hero Saves Day, Destroys {Target} in Process",
    "Reckless Vigilante Causes Chaos in {City}"
  ]
};

const DESCRIPTORS = {
  low_fame: ["Unknown Vigilante", "Masked Individual", "Unidentified Hero"],
  medium_fame: ["The Armored Operative", "Known Vigilante", player.heroName],
  high_fame: [player.heroName, "Celebrity Hero", "Famous Vigilante"]
};

function generateHeadline(mission: Mission, result: MissionResult): string {
  const template = selectTemplate(result);
  const descriptor = selectDescriptor(player.fame);
  const action = selectAction(result.success);

  return template
    .replace("{Descriptor}", descriptor)
    .replace("{Action}", action)
    .replace("{Crime}", mission.crimeType)
    .replace("{City}", mission.city)
    .replace("{Outcome}", selectOutcome(result));
}
```

---

## 10. BALANCING & TUNING

### Tuning Knobs
```typescript
const NEWS_SYSTEM_CONFIG = {
  // Article generation
  player_action_news_chance: 0.8, // 80% of missions generate news
  world_event_frequency: 0.3, // 30% chance per game hour
  rumor_advance_time: 48, // hours before rumor becomes mission

  // Fame system
  fame_decay_rate: 0.95, // 5% decay per game week if inactive
  fame_mission_multiplier: 1.5, // bonus fame for high-difficulty missions
  fame_international_bonus: 1.25, // bonus for operating abroad

  // Public opinion
  opinion_decay_rate: 0.98, // 2% decay toward neutral per game week
  opinion_max_change_per_mission: 30, // cap on single-mission opinion swings

  // Media relations
  interview_cooldown: 24, // hours between interviews
  media_relationship_decay: 0.99, // 1% decay per week if no interaction

  // Bounties
  bounty_decay_time: 168, // hours (1 week) before bounty reduces
  bounty_cost_multiplier: 1.5, // 50% more expensive to operate with bounty
};
```

---

## 11. FUTURE EXPANSIONS

### Phase 2 Features
1. **TV News Broadcasts**: Animated news anchor delivers breaking news
2. **Citizen Journalism**: Player can upload mission footage
3. **Deepfakes**: Villains create fake videos of player
4. **News Documentaries**: Long-form retrospectives on player's career
5. **Podcast Interviews**: Audio-only long-form interviews
6. **Foreign Language News**: Translated articles from non-English countries
7. **Meme Culture**: Players can create/share memes about missions
8. **News Archives**: Museum-style historical record of player's career

### Phase 3 Features (Multiplayer)
1. **Rival Hero Coverage**: News about other players
2. **PvP Trash Talk**: Players can give interviews about each other
3. **Faction Propaganda**: Player-led factions can run propaganda campaigns
4. **Community Events**: Global news events triggered by community goals

---

## 12. SUCCESS METRICS

**How to measure if News System is working**:

1. **Engagement**:
   - % of players who read news articles
   - Average time spent in news browser
   - % of players who investigate rumors

2. **Impact**:
   - % of missions discovered via news/scanner/social feed
   - Fame system driving recruitment decisions
   - Public opinion affecting mission costs/availability

3. **Immersion**:
   - Player feedback: "Does the world feel alive?"
   - Do players reference news articles in discussions?
   - Do players remember their "headline moments"?

4. **Balance**:
   - Fame progression curve feels rewarding
   - Bounties create meaningful tension (not frustration)
   - Media relations add depth (not busywork)

---

## CONCLUSION

The News System transforms SuperHero Tactics from a tactical combat game into a **living world simulation** where player actions have consequences and the media landscape shapes your journey from unknown vigilante to global icon.

**Core Design Pillars**:
1. **Consequence**: Every action generates news
2. **Agency**: Player controls narrative through interviews
3. **Discovery**: News reveals mission opportunities
4. **Immersion**: World feels reactive and alive
5. **Strategy**: Managing fame/opinion is as important as combat

**Implementation Priority**:
1. **Phase 1** (MVP): News browser, basic headline generation, fame system
2. **Phase 2**: Police scanner, social feed, media relations
3. **Phase 3**: Investigation board, disinformation, advanced interviews

This system integrates seamlessly with existing game mechanics (missions, characters, world map, factions) while adding a rich meta-layer of narrative consequence and geopolitical intrigue.

---

*"Your missions make headlines. Your headlines shape the world."*
