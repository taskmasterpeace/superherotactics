# SuperHero Tactics - System Expansion Proposals

*8 major game systems designed to expand gameplay depth*

---

## 1. UNIVERSITY SYSTEM

### Overview
Cities with high population (>500,000) and educational indicators have universities offering training, research, and specialist recruitment.

### Course Types

| Course | Duration | Cost | Effect | Prerequisites |
|--------|----------|------|--------|---------------|
| Combat Training | 2 weeks | $5,000 | +1 MEL or RAN | None |
| Advanced Tactics | 3 weeks | $12,000 | +2 INT, unlock formations | INT 40+ |
| Medical Certification | 4 weeks | $15,000 | Can use Med Bay, +healing | INT 50+ |
| Electronics | 3 weeks | $10,000 | Hack doors, disable alarms | INT 45+ |
| Languages | 2 weeks | $3,000 | +city familiarity in region | None |
| Leadership | 4 weeks | $20,000 | Squad morale bonus | 3+ missions completed |
| Investigation | 3 weeks | $8,000 | +clue discovery rate | INT 40+ |
| Piloting | 4 weeks | $25,000 | Can fly aircraft/vehicles | AGL 45+ |

### Research Projects

| Project | Duration | Cost | Unlock |
|---------|----------|------|--------|
| Ballistic Weave | 6 weeks | $50,000 | +2 DR to light armor |
| Enhanced Optics | 4 weeks | $30,000 | +10% accuracy at long range |
| Stim Packs | 5 weeks | $40,000 | Field healing items |
| EMP Grenades | 4 weeks | $35,000 | Disables electronics |
| Power Dampeners | 8 weeks | $100,000 | Counter superpowers |

### Specialist Recruitment

Universities allow recruiting:
- **Scientists** - Faster research, unlock tech trees
- **Hackers** - Remote system access, intel gathering
- **Medics** - Better field healing, lower hospital time
- **Engineers** - Vehicle repair, base construction bonus

### Integration Points
- Character must travel to university city
- Character unavailable during course
- Personality affects learning speed (INTJ/INTP +15%, ESFP -10%)
- Fame may get you priority enrollment

---

## 2. CITY TYPE EFFECTS

### Overview
Each city has a type that affects available services, missions, and bonuses.

### City Types (10)

#### Military Cities
- **Identification**: "Fort", "Base" in name, high military presence countries
- **Bonuses**: -15% weapon prices, soldier recruitment, military contacts
- **Missions**: Escort, base defense, weapons recovery
- **Examples**: Fort Bragg, Diego Garcia, Okinawa

#### Political Cities (Capitals)
- **Identification**: Capital cities, high political influence
- **Bonuses**: Diplomatic missions, assassination contracts, intel access
- **Missions**: Bodyguard, espionage, regime change
- **Penalties**: Heavy security, collateral damage matters more

#### Industrial Cities
- **Identification**: Population >1M, manufacturing regions
- **Bonuses**: -10% armor/vehicle prices, salvage value +20%
- **Missions**: Labor disputes, corporate sabotage, theft
- **Examples**: Detroit, Shenzhen, Stuttgart

#### Seaport Cities
- **Identification**: Coastal, major shipping lanes
- **Bonuses**: Smuggling routes, naval vehicle access, international travel
- **Missions**: Drug interdiction, piracy, cargo protection
- **Examples**: Rotterdam, Singapore, Los Angeles

#### Mining Cities
- **Identification**: Resource-rich regions, low population
- **Bonuses**: Rare materials, explosive access
- **Missions**: Resource extraction protection, labor camps
- **Examples**: Johannesburg, Perth, Potosi

#### Educational Cities
- **Identification**: "University", "College" in name or nearby
- **Bonuses**: Training available, research projects, scientist recruitment
- **Missions**: Student protests, tech theft, professor rescue
- **Examples**: Cambridge, Berkeley, Heidelberg

#### Temple Cities
- **Identification**: Historical/religious significance
- **Bonuses**: Mystical contacts, cult intelligence
- **Missions**: Artifact recovery, cult investigation, religious extremism
- **Examples**: Vatican City, Varanasi, Jerusalem, Mecca

#### Resort Cities
- **Identification**: Coastal, low crime, tourist destination
- **Bonuses**: Undercover opportunities, celebrity contacts
- **Missions**: Celebrity protection, kidnapping rescue, smuggling
- **Penalties**: Combat draws major attention
- **Examples**: Monaco, Cancun, Bali

#### Company Towns (Tech Hubs)
- **Identification**: Tech industry presence, high GDP
- **Bonuses**: Gadget access, hacker recruitment, -20% tech prices
- **Missions**: Corporate espionage, data theft, AI containment
- **Examples**: San Jose, Seoul, Bangalore, Shenzhen

#### Criminal Hubs
- **Identification**: Crime index >60, corruption
- **Bonuses**: Black market access, underworld contacts, informants
- **Missions**: Gang wars, trafficking, protection rackets
- **Penalties**: Higher random encounter rate
- **Examples**: Tijuana, Medellin, Naples, Lagos

### Data Structure
```typescript
interface CityTypeEffects {
  type: CityType;
  priceModifiers: Record<string, number>;
  availableServices: string[];
  missionTypes: string[];
  encounterModifier: number;
  recruitmentPool: string[];
}
```

---

## 3. BASE BUILDING SYSTEM

### Overview
XCOM-style underground/building base with grid-based room placement.

### Base Grid
- 10x10 grid for small base
- 15x15 grid for large base (unlockable)
- Rooms vary from 1x1 to 3x3 tiles
- Hallways required for connectivity (for tactical raids)

### Room Types

| Room | Size | Build Cost | Monthly Cost | Build Time | Capacity/Effect |
|------|------|------------|--------------|------------|-----------------|
| **Barracks** | 2x2 | $25,000 | $2,000 | 5 days | Houses 4 characters |
| **Armory** | 2x2 | $40,000 | $1,500 | 7 days | Stores 50 items, repair bench |
| **Med Bay** | 2x3 | $60,000 | $5,000 | 10 days | -30% recovery time, 4 beds |
| **Research Lab** | 3x3 | $100,000 | $8,000 | 14 days | Research projects, 2 scientists |
| **Training Room** | 2x2 | $35,000 | $3,000 | 7 days | Skill training, sparring |
| **Prison** | 2x2 | $30,000 | $2,000 | 5 days | 4 cells, interrogation |
| **Hangar** | 3x3 | $150,000 | $10,000 | 21 days | Vehicle storage, maintenance |
| **Power Plant** | 2x2 | $50,000 | $0 | 7 days | Powers 8 rooms |
| **Generator** | 1x1 | $15,000 | $500 | 3 days | Powers 2 rooms (backup) |
| **Defense Turret** | 1x1 | $20,000 | $1,000 | 3 days | Auto-defense during raids |
| **Comms Center** | 2x2 | $45,000 | $4,000 | 7 days | Mission intel, faction contact |
| **Workshop** | 2x2 | $55,000 | $3,500 | 10 days | Craft items, modify equipment |
| **Recreation** | 2x2 | $20,000 | $1,500 | 5 days | +morale recovery |
| **Storage** | 1x2 | $10,000 | $500 | 3 days | Extra inventory space |

### Base Mechanics

**Power System**:
- Each room requires power
- Power Plant covers 8 rooms
- No power = room offline
- Can be targeted in raids

**Base Raids**:
- Enemy factions can raid your base
- Combat on base grid layout
- Defend rooms, protect prisoners
- Destroyed rooms cost 50% to repair

**Multiple Bases**:
- Can build bases in different sectors
- Each base = foothold in region
- Local faction relations affect base safety

### Upgrade Paths
- Med Bay -> Surgical Suite (-50% recovery, augmentations)
- Research Lab -> Advanced Lab (2x research speed)
- Training Room -> Combat Simulator (VR missions)
- Armory -> Weapons Lab (weapon modifications)

---

## 4. ECONOMY LOOP

### Overview
Comprehensive economic system balancing income, expenses, and investments.

### Income Sources

| Source | Amount | Frequency | Requirements |
|--------|--------|-----------|--------------|
| **Contract Missions** | $5,000 - $100,000 | Per mission | Faction standing |
| **Bounties** | $1,000 - $50,000 | Per capture | Target threat level |
| **Salvage** | $500 - $10,000 | Per combat | Workshop for max value |
| **Protection Fees** | $2,000/week | Weekly | City control |
| **Investments** | Variable | Monthly | Initial capital |
| **Faction Stipend** | $5,000/month | Monthly | Good standing |
| **Media Deals** | $10,000+ | Per event | High fame |

### Expenses

| Expense | Cost | Frequency | Notes |
|---------|------|-----------|-------|
| **Character Salaries** | $500 - $5,000 | Weekly | Based on threat level |
| **Base Upkeep** | Variable | Monthly | Sum of room costs |
| **Vehicle Fuel** | $50 - $500 | Per sector | Based on vehicle |
| **Medical Bills** | $1,000 - $20,000 | Per injury | Severity based |
| **Training/Courses** | $3,000 - $25,000 | Per course | See University |
| **Equipment Repair** | 10% item value | Per damage | Workshop reduces |
| **Bribes** | $500 - $10,000 | As needed | Faction dependent |
| **Safe House Rent** | $1,000/week | Weekly | Per city |

### Black Market

Special items available:
- Illegal weapons (+20% price)
- Stolen tech (random availability)
- Forged documents ($5,000)
- Contraband powers (rare)
- Information ($2,000 - $20,000)

Access requires:
- Underworld faction standing > 30
- Criminal hub city access
- Contact introduction

### Investment System

| Investment | Cost | Return | Risk |
|------------|------|--------|------|
| City Business | $50,000 | 5%/month | City stability |
| Arms Dealing | $100,000 | 15%/month | High (illegal) |
| Real Estate | $200,000 | 3%/month | Very Low |
| Tech Startup | $75,000 | 0-30%/month | High variance |

### Balance Targets
- Early game: Break even around day 30
- Mid game: $50,000+ surplus
- Late game: Multiple income streams
- Emergency fund: 2 weeks expenses

### Data Structure
```typescript
interface EconomyState {
  balance: number;
  weeklyIncome: number;
  weeklyExpenses: number;
  investments: Investment[];
  debts: Debt[];
  blackMarketAccess: boolean;
  taxEvasion: number; // 0-100, affects government standing
}
```

---

## 5. POWERS & TELEPORTATION

### Overview
Strategic-layer powers focused on world map travel and utility, not combat.

### Teleportation System

**Basic Teleportation**:
- Range based on power level (1-5)
- Level 1: Same sector only
- Level 2: Adjacent sectors
- Level 3: 3 sector range
- Level 4: Continental (10 sectors)
- Level 5: Global (any known location)

**Limitations**:
- Must have visited destination OR have beacon
- Passengers limited by power level
- Cooldown: 24 hours per use
- Blocked by power dampeners

**Teleport Beacons**:
- Craftable at Workshop ($5,000)
- Place in any visited city
- Acts as waypoint
- Can be detected/destroyed

### Other Strategic Powers

| Power | Effect | Use Case |
|-------|--------|----------|
| **Remote Viewing** | Scout sector without traveling | Intel gathering |
| **Precognition** | Preview mission difficulty | Mission selection |
| **Mind Control** | Convert enemy contact | Infiltration |
| **Healing Aura** | Reduce squad recovery time | Post-combat |
| **Tech Control** | Hack remotely | Doors, cameras |
| **Flight** | Reduce travel time 50% | Fast response |
| **Invisibility** | Avoid random encounters | Safe travel |
| **Super Speed** | Travel time -75% | Very fast response |

### Power Costs

| Power Use | Energy Cost | Cooldown |
|-----------|-------------|----------|
| Teleport (self) | 30 | 24h |
| Teleport (squad) | 50 + 10/person | 48h |
| Remote Viewing | 20 | 6h |
| Flight Travel | 10/sector | None |
| Invisibility | 15/hour | None |

### Integration with Travel
```typescript
function getTravelOptions(from: string, to: string, squadPowers: Power[]): TravelOption[] {
  const options: TravelOption[] = [];

  // Standard travel
  options.push({ type: 'ground', time: calculateGroundTime(from, to) });

  // If squad has teleporter
  if (hasPower(squadPowers, 'teleport')) {
    const teleporter = getTeleporter(squadPowers);
    if (canTeleportTo(from, to, teleporter)) {
      options.push({ type: 'teleport', time: 0, cost: 30 });
    }
  }

  // If squad has flyer
  if (hasPower(squadPowers, 'flight')) {
    options.push({ type: 'flight', time: calculateGroundTime(from, to) * 0.5 });
  }

  return options;
}
```

---

## 6. INVESTIGATION SYSTEM

### Overview
Deep investigation gameplay with email chains, evidence boards, and time pressure. Characters use INT, fame, and city familiarity to uncover truths.

### Email Chain System

**Concept**: Investigations unfold through intercepted/forwarded emails forming breadcrumb trails.

| Email Type | Content | Clue Value |
|------------|---------|------------|
| **Tip-off** | Anonymous hint about activity | Starting point |
| **Transaction** | Money transfer, purchase records | Links people to events |
| **Communication** | Conversations between suspects | Reveals relationships |
| **Schedule** | Meeting times, travel plans | Actionable intel |
| **Confession** | Incriminating statements | Case-breaking |

**Chain Mechanics**:
- Each email links to 1-3 other clues
- Must find linking evidence to unlock next email
- Dead ends possible (red herrings)
- Time-sensitive: some emails expire

### Contact Network

**Informant Types**:

| Type | Location | Intel Quality | Cost | Risk |
|------|----------|---------------|------|------|
| **Street Rat** | Criminal hubs | Low rumors | $100 | Low |
| **Bartender** | Any city | Social intel | $200 | Very Low |
| **Cop** | Political cities | Police files | $500 | Medium |
| **Journalist** | Capitals | Public records | $300 | Low |
| **Hacker** | Tech hubs | Digital records | $1,000 | Medium |
| **Insider** | Faction-specific | High value | $2,000+ | High |

**Building Rapport**:
- First contact: Basic info only
- 3+ meetings: Tips about opportunities
- 5+ meetings: Warns you of danger
- 10+ meetings: Risks themselves for you

**City Familiarity Bonus**:
- 0-20%: No contacts available
- 21-50%: Street level only
- 51-80%: Professional contacts
- 81-100%: Insider access

### Evidence Board

**Visual Clue Connection**:
- Drag-and-drop interface
- Connect clues with lines
- Correct connections unlock new leads
- Wrong connections waste time

**Evidence Types**:
```
[PERSON] ---- worked for ----> [ORGANIZATION]
    |                              |
 seen at                      owns
    |                              |
[LOCATION] <--- shipped to --- [ITEM]
```

**Board States**:
- Red: Unverified clue
- Yellow: Partially confirmed
- Green: Verified connection
- Blue: Actionable intel

### Time Pressure

| Lead Type | Cold Timer | Consequence |
|-----------|------------|-------------|
| Hot tip | 24 hours | Lead vanishes |
| Witness | 72 hours | Witness leaves town |
| Document | 1 week | Evidence destroyed |
| Location | 2 weeks | Target moves |
| Organization | 1 month | Restructure, new identities |

**Urgency Mechanics**:
- Timer visible on each clue
- Can "preserve" evidence with resources
- Failed investigations = reputation hit
- Cold cases can be reopened (harder)

### Character Stats in Investigation

| Stat | Effect |
|------|--------|
| **INT 60+** | Spot hidden clues, faster connections |
| **INT 80+** | Predict next move, see through lies |
| **Fame 50+** | Witnesses more willing to talk |
| **Fame 80+** | Intimidate suspects, media access |
| **City Familiarity 70+** | Know who to ask, shortcuts |
| **Personality INTJ/INTP** | +20% deduction speed |
| **Personality ENFJ/ESFJ** | +20% rapport building |

### Investigation Types

**Missing Person**:
- Last known location
- Interview friends/family
- Check hospitals, morgues
- Track phone/financial records
- Time critical (48 hours golden window)

**Criminal Syndicate**:
- Map organization structure
- Identify leaders
- Find evidence of crimes
- Build case or eliminate
- Long-term (weeks/months)

**Corruption**:
- Follow the money
- Find witnesses
- Secure evidence before destroyed
- Protect informants
- Political consequences

**Cult Investigation**:
- Infiltration option
- Identify recruitment patterns
- Find compound location
- Rescue members
- Mystical elements possible

### Example Scenario

**"The Vanishing Scientist"**:
1. Receive tip: Dr. Chen missing from biotech lab
2. Email 1: Her last message mentions "meeting them"
3. Visit lab (city familiarity check)
4. Find: Transaction record - $50,000 deposit
5. Contact: Hacker traces payment to shell company
6. Email 2: Company linked to HYDRA front
7. Evidence board: Connect Dr. Chen -> Payment -> Shell Corp -> HYDRA
8. Intel: HYDRA safehouse in sector K-7
9. Decision: Rescue mission or surveillance?
10. Time pressure: 72 hours before she's moved

### Data Structure
```typescript
interface Investigation {
  id: string;
  type: 'missing_person' | 'syndicate' | 'corruption' | 'cult';
  title: string;
  status: 'active' | 'cold' | 'solved' | 'failed';
  startDay: number;
  clues: Clue[];
  connections: Connection[];
  contacts: ContactRelation[];
  timeRemaining?: number;
}

interface Clue {
  id: string;
  type: 'email' | 'document' | 'testimony' | 'physical';
  content: string;
  verified: boolean;
  expiresDay?: number;
  linkedClues: string[];
}
```

---

## 7. FACTION RELATIONS

### Overview
Dynamic reputation system where your actions shape how Police, Military, Underworld, Corporations, Government, and Media treat you.

### Reputation Scale

| Level | Standing | Label | Effects |
|-------|----------|-------|---------|
| 100 | Maximum | **Champion** | VIP treatment, free passage |
| 75-99 | Excellent | **Trusted Ally** | Best prices, priority missions |
| 50-74 | Good | **Friend** | Discounts, safe houses |
| 25-49 | Neutral | **Known** | Normal treatment |
| 0-24 | Poor | **Suspicious** | Higher prices, limited access |
| -25 to -1 | Bad | **Unwelcome** | Refused service, watched |
| -50 to -26 | Hostile | **Enemy** | Active opposition |
| -75 to -51 | War | **Hunt Target** | Bounty hunters sent |
| -100 to -76 | Maximum | **Kill on Sight** | Shoot first |

### Faction Types

#### Police
- **Positive**: Help investigations, share intel, backup available
- **Negative**: Arrest attempts, roadblocks, evidence planted
- **Raises**: Capturing criminals, preventing crime, testimony
- **Lowers**: Vigilantism, civilian casualties, obstruction

#### Military
- **Positive**: Equipment access, base entry, air support
- **Negative**: Deployed against you, restricted zones
- **Raises**: National defense missions, veteran status
- **Lowers**: Attacking soldiers, stealing equipment, treason

#### Underworld
- **Positive**: Black market, safe houses, muscle for hire
- **Negative**: Assassins, robberies, betrayal
- **Raises**: Jobs for crime bosses, keeping quiet
- **Lowers**: Busting operations, working with cops

#### Corporations
- **Positive**: Funding, tech access, legal support
- **Negative**: Private security, lawsuits, smear campaigns
- **Raises**: Corporate security jobs, recovering assets
- **Lowers**: Exposing corruption, property damage

#### Government
- **Positive**: Official sanction, funding, intel agencies
- **Negative**: Declared enemy of state, frozen assets
- **Raises**: Following protocols, regime missions
- **Lowers**: Unsanctioned ops, embarrassing incidents

#### Media
- **Positive**: Positive coverage, fame boost, tip-offs
- **Negative**: Negative coverage, fame damage, exposed secrets
- **Raises**: Interviews, saving reporters, good optics
- **Lowers**: Refusing interviews, caught doing bad things

### Standing Effects

| Standing | Price Modifier | Mission Access | Other |
|----------|----------------|----------------|-------|
| Champion | -30% | Exclusive | Free safe houses |
| Trusted | -20% | Priority | Backup on request |
| Friend | -10% | Standard+ | Safe houses available |
| Known | 0% | Standard | Normal |
| Suspicious | +10% | Limited | Watched |
| Unwelcome | +30% | Minimal | Refused service |
| Enemy | N/A | None | Active opposition |
| Hunt Target | N/A | None | Bounty: $10,000+ |
| Kill on Sight | N/A | None | Shoot first |

### Faction Missions

**Police Missions**:
- Arrest warrant assistance
- Evidence collection
- Witness protection
- Anti-gang operations

**Military Missions**:
- Base defense
- Equipment recovery
- Escort operations
- Counter-terrorism

**Underworld Missions**:
- "Debt collection"
- Smuggling
- Intimidation
- Hits (major reputation hit with others)

**Corporate Missions**:
- Industrial espionage
- Asset protection
- Hostile takeover "assistance"
- Cover-ups

### Bounty System

When standing drops below -50 with certain factions:

| Faction | Bounty Type | Hunters |
|---------|-------------|---------|
| Police | Arrest warrant | Cops, bounty hunters |
| Military | Wanted poster | Soldiers, PMCs |
| Underworld | Contract | Assassins, gangs |
| Corporation | "Retrieval order" | Private security |
| Government | Black ops | Agents, drones |

**Bounty Levels**:
- $5,000: Amateur hunters
- $25,000: Professional hunters
- $100,000: Elite teams
- $500,000: Kill squads

**Clearing Bounties**:
- Do enough positive work (slow)
- Pay off bounty (2x amount)
- Complete special mission
- Change identity (costly)

### Faction Conflicts

Some factions inherently oppose each other:

| Faction A | Faction B | Conflict |
|-----------|-----------|----------|
| Police | Underworld | Eternal enemies |
| Corporations | Media | Expose vs suppress |
| Government | "Rebels" | Political |
| Military | Certain Corps | Contractors vs soldiers |

**Implications**:
- Helping one may hurt the other
- Can't be Champion with opposing factions
- Cross-faction missions create dilemmas

### Country Modifiers

LSW (Legal Status of Vigilantes) affects faction starting positions:

| LSW Status | Police Start | Government Start |
|------------|--------------|------------------|
| Legal | +25 | +25 |
| Tolerated | 0 | 0 |
| Illegal | -25 | -25 |
| Hostile | -50 | -50 |

### Data Structure
```typescript
interface FactionStanding {
  faction: FactionType;
  standing: number; // -100 to 100
  recentChanges: StandingChange[];
  activeBounty?: Bounty;
  completedMissions: string[];
}

interface Bounty {
  amount: number;
  issuedBy: FactionType;
  reason: string;
  hunters: HunterTeam[];
  dayIssued: number;
}
```

---

## 8. NEWS SYSTEM

### Overview
Dynamic news generation reflecting player actions and world events. Two modes: passive (news comes to you) and active (seeking information).

### Passive News (Push)

**Alert Types**:

| Priority | Examples | Notification |
|----------|----------|--------------|
| **Breaking** | Your combat reported, major villain attack | Full screen alert |
| **Important** | Election results, faction changes | Banner notification |
| **Standard** | World events, crime reports | News feed update |
| **Background** | Weather, sports, celebrity | Scrolling ticker |

**Trigger Events**:
- Combat with 3+ participants
- Character death (either side)
- Building destruction
- Mission completion/failure
- Civilian casualties
- Power use in public

### Active News (Pull)

**News Browser Interface**:
- Categories: World, Local, Crime, Politics, Business, Entertainment
- Search function for keywords
- Archive of past 30 days
- Bookmarking for investigations

**Intel Gathering**:
- Crime reports hint at villain activity
- Political news affects faction standing
- Business news reveals corporate targets
- Entertainment tracks celebrity movements

### Dynamic Headline Generation

**Template System**:
```
[ACTION] in [CITY]: [DETAIL]
[CHARACTER] [VERB] [TARGET] in [LOCATION]
[FACTION] [RESPONSE] after [EVENT]
```

**Example Headlines by Event**:

| Event | Positive Outcome | Negative Outcome |
|-------|------------------|------------------|
| Combat Victory | "Heroes Save [City] from [Villain]!" | "Vigilante Violence Rocks [City]" |
| Civilian Saved | "[Hero] Rescues [N] Hostages" | N/A |
| Civilian Casualty | N/A | "Tragedy: [N] Dead in [City] Battle" |
| Building Destroyed | "Collateral Damage in Heroic Stand" | "Reckless 'Hero' Levels [Building]" |
| Villain Escaped | N/A | "[Villain] Escapes [Hero]'s Grasp" |
| Mission Success | "[Hero] Foils [Crime] Plot" | N/A |
| Mission Failure | N/A | "Failed Operation Leaves [City] Vulnerable" |

### Fame Integration

Your fame level determines coverage:

| Fame | Coverage |
|------|----------|
| 0-20 | Not mentioned by name |
| 21-40 | "A vigilante" |
| 41-60 | Named in local news |
| 61-80 | Named in national news |
| 81-100 | International headlines, interviews requested |

**Fame Changes from News**:
- Positive headline: +2 to +10 fame
- Negative headline: -5 to -15 fame
- No coverage: No change
- Interview given: +5 fame (if positive)

### Public Perception Meter

**Scale**: -100 (Menace) to +100 (Beloved)

| Perception | Label | Effects |
|------------|-------|---------|
| 75-100 | **Beloved** | +30% recruitment, civilians help |
| 50-74 | **Respected** | +15% recruitment |
| 25-49 | **Accepted** | Normal |
| 0-24 | **Controversial** | Mixed reactions |
| -25 to -1 | **Distrusted** | -15% recruitment |
| -50 to -26 | **Feared** | Civilians flee, -30% recruitment |
| -75 to -51 | **Hated** | Protests, vigilante hunters |
| -100 to -76 | **Menace** | Public enemy, military response |

**Perception Modifiers**:
- Civilian saved: +3
- Civilian casualty: -10
- Building destroyed: -5
- Villain captured: +5
- Villain killed: +2 (some think excessive)
- Clean victory (no collateral): +7

### World Events (Procedural)

| Event Type | Frequency | Effect |
|------------|-----------|--------|
| **Natural Disaster** | Rare | Rescue missions, travel disruption |
| **War Outbreak** | Very Rare | Military faction active, arms prices up |
| **Election** | Per country calendar | Government faction changes |
| **Economic Crisis** | Uncommon | Prices up, crime up |
| **Villain Attack** | Common | New missions available |
| **Festival/Holiday** | Per calendar | Security changes, crowds |
| **Corporate Scandal** | Uncommon | Corp faction weakened |
| **Police Strike** | Rare | Crime spree opportunity |

### Newspaper UI

```
+------------------------------------------+
| DAILY GLOBAL              Day 47 | 🔍    |
+------------------------------------------+
| BREAKING: [Headline]                     |
| [Image placeholder]                      |
| [2-3 sentence summary]                   |
+------------------------------------------+
| WORLD        | LOCAL        | CRIME      |
|--------------|--------------|------------|
| - Headline 1 | - Headline 1 | - Headline |
| - Headline 2 | - Headline 2 | - Headline |
+------------------------------------------+
| YOUR COVERAGE                            |
| Recent mentions: [list]                  |
| Public Perception: [meter]               |
+------------------------------------------+
```

### News as Intel

**Information Extraction**:
- Crime reports: Possible mission locations
- Business news: Corporate target movements
- Political news: Government faction mood
- Obituaries: Confirm kills, find patterns
- Classifieds: Hidden messages (investigations)

### Data Structure
```typescript
interface NewsArticle {
  id: string;
  headline: string;
  category: 'world' | 'local' | 'crime' | 'politics' | 'business' | 'entertainment';
  priority: 'breaking' | 'important' | 'standard' | 'background';
  day: number;
  city?: string;
  country?: string;
  relatedCharacters: string[];
  fameImpact: number;
  perceptionImpact: number;
  content: string;
  isRead: boolean;
}

interface PublicPerception {
  global: number; // -100 to 100
  perCountry: Record<string, number>;
  recentEvents: PerceptionEvent[];
  trend: 'rising' | 'stable' | 'falling';
}
```

---

## Implementation Priority

### Phase 1 (Foundation)
1. City Type Effects - Low effort, immediate variety
2. Economy Loop - Core gameplay balance
3. News System - Player feedback

### Phase 2 (Depth)
4. Faction Relations - Strategic consequences
5. Investigation System - Alternative gameplay
6. University System - Character progression

### Phase 3 (Expansion)
7. Base Building - Major feature
8. Powers/Teleportation - Quality of life

---

*Generated: December 2024*
