# Faction Relations System - Design Proposal

**SuperHero Tactics - Geopolitical Faction Management**

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Reputation per Country](#reputation-per-country)
3. [Faction Types](#faction-types)
4. [Standing Effects](#standing-effects)
5. [Faction Missions](#faction-missions)
6. [Bounty System](#bounty-system)
7. [Faction Conflicts](#faction-conflicts)
8. [Data Structures](#data-structures)
9. [Integration Points](#integration-points)
10. [Implementation Priority](#implementation-priority)

---

## System Overview

The Faction Relations System tracks your squad's reputation with various organizations across 168 countries. Each country has 6 major faction types, creating 1008+ unique faction relationships. Your actions, mission choices, and public behavior affect standing, which in turn opens/closes opportunities and triggers consequences.

**Core Mechanics:**
- Per-country reputation on a -100 to +100 scale
- 6 faction types per country (Police, Military, Underworld, Corporations, Government, Media)
- LSW regulations affect how factions treat vigilantes
- Fame and personality affect faction interactions
- Dynamic missions based on standing
- Bounty hunters/hit squads when standing drops too low

---

## 1. Reputation per Country

### Scale: Hero/Vigilante/Criminal/Terrorist

Each faction has a standing value from **-100 to +100**:

| Range | Label | Description | Color Code |
|-------|-------|-------------|------------|
| 75 to 100 | **Hero** | Trusted ally, maximum benefits | 🟢 Green |
| 50 to 74 | **Respected** | Friendly, good benefits | 🟦 Blue |
| 25 to 49 | **Neutral Positive** | Tolerated, some benefits | ⚪ White |
| 0 to 24 | **Unknown** | No reputation yet | ⚫ Gray |
| -1 to -24 | **Suspicious** | Watched, minor penalties | 🟡 Yellow |
| -25 to -49 | **Vigilante** | Illegal activity, moderate penalties | 🟠 Orange |
| -50 to -74 | **Criminal** | Active hostility, severe penalties | 🔴 Red |
| -75 to -100 | **Terrorist** | Kill on sight, bounties issued | 🟣 Purple |

### Country-Level Aggregate Reputation

In addition to faction-specific standing, each country has an **aggregate reputation** (average of all 6 factions):

- **Public Perception**: What civilians think of you
- **Border Control**: Affects travel time, vehicle searches, bribes needed
- **Mission Availability**: Some missions only appear in countries where you're neutral+

**Formula:**
```
countryReputation = (police + military + government + media + corporations + underworld) / 6
```

### Reputation Decay

Standing slowly decays toward **0** over time if you don't interact with a faction:

- **+51 to +100**: Decays at -1 per 30 days
- **-51 to -100**: Decays at +1 per 30 days
- **-50 to +50**: No decay (stable)

**Why?** Prevents permanent locks. If you become a terrorist in Russia, you can eventually rebuild (will take years in-game).

---

## 2. Faction Types

Each of the **168 countries** has **6 faction types**:

### A. Police Faction

**Role:** Law enforcement, local security, criminal investigations

**Starting Standing:**
- Based on country's `lswRegulations`:
  - **Legal LSW**: Start at +25 (welcomed)
  - **Regulated LSW**: Start at 0 (neutral)
  - **Banned LSW**: Start at -15 (suspicious)

**What They Offer:**
- Crime investigations
- Gang takedown missions
- Intel on underworld activities
- Safe houses in police stations (if standing 50+)
- Equipment discounts at police auctions (if standing 25+)

**What Angers Them:**
- Working with underworld (-10 to -25)
- Killing civilians during missions (-15 per incident)
- Using excessive force (-5 to -10)
- Refusing police contracts (-5)
- Operating in "Banned LSW" countries without permission (-10)

**What Pleases Them:**
- Completing police missions (+10 to +20)
- Capturing criminals alive instead of killing (+5)
- Solving investigations (+15)
- Patrolling high-crime cities (+2 per patrol)

---

### B. Military Faction

**Role:** National defense, large-scale operations, strategic missions

**Starting Standing:**
- Based on country's `governmentPerception`:
  - **Full Democracy**: Start at +10 (cooperative)
  - **Flawed Democracy**: Start at 0
  - **Hybrid Regime**: Start at -10 (distrustful)
  - **Authoritarian**: Start at -25 (hostile to outsiders)

**What They Offer:**
- High-paying combat missions (convoy escort, base defense)
- Military-grade equipment purchases (if standing 50+)
- Vehicle access (helicopters, APCs) for rent/purchase
- Fast travel through military airfields (if standing 75+)
- Intel on terrorism factions

**What Angers Them:**
- Sabotaging military operations (-30)
- Killing military personnel (-20)
- Working with terrorism factions (-40)
- Stealing military equipment (-25)

**What Pleases Them:**
- Completing military contracts (+15 to +30)
- Eliminating high-value terrorist targets (+25)
- Protecting military convoys (+15)
- Successful base defense (+20)

---

### C. Government Faction

**Role:** Political leadership, intelligence agencies, handler missions

**Starting Standing:**
- **Your home country**: Starts at +50 (recruited by them)
- **Allied countries** (same culture group): Start at +15
- **Neutral countries**: Start at 0
- **Hostile countries**: Start at -30

**What They Offer:**
- Handler missions (assassination, extraction, covert ops)
- Top-tier classified intel
- Diplomatic immunity (if standing 75+) - ignore low police standing
- Government funding (+$5,000/month at standing 50+)
- Access to black sites for holding prisoners

**What Angers Them:**
- Exposing classified information (-50)
- Assassinating politicians (-60)
- Working for rival governments (-40)
- Refusing handler missions (-20)
- Public embarrassment (botched missions with media coverage) (-15)

**What Pleases Them:**
- Completing covert ops (+20 to +40)
- Eliminating political enemies (+35)
- Successful extractions (+25)
- Keeping operations secret (no media coverage bonus) (+10)

---

### D. Media Faction

**Role:** News organizations, public perception, propaganda

**Starting Standing:**
- Based on country's `mediaFreedom`:
  - **70-100 (Free Press)**: Start at +10 (friendly)
  - **40-69 (Controlled)**: Start at 0
  - **0-39 (State Media)**: Start at government standing -10

**What They Offer:**
- Fame multipliers (+25% fame from missions if standing 50+)
- Exclusive interviews (gain fame, lose secrecy)
- Intel on public opinion
- Smear campaigns against enemy factions (if standing 75+)
- Early warnings about bounties on you

**What Angers Them:**
- Attacking journalists (-40)
- Censoring media (-30)
- Working with authoritarian governments in high-freedom countries (-15)
- Avoiding interviews when famous (fame 1000+) (-5 per refusal)

**What Pleases Them:**
- Giving exclusive interviews (+15)
- Heroic public actions (rescuing civilians) (+20)
- Allowing embedded journalists on missions (+10, -5 to stealth)
- Exposing corruption (+25)

---

### E. Corporations Faction

**Role:** Private military contractors, tech companies, arms dealers

**Starting Standing:**
- Based on country's `gdpPerCapita`:
  - **High GDP (60+)**: Start at +15 (wealthy market)
  - **Medium GDP (40-59)**: Start at +5
  - **Low GDP (0-39)**: Start at -5 (not profitable)

**What They Offer:**
- Advanced equipment purchases (tech suits, experimental weapons)
- Private contracts (corporate espionage, protection)
- Exclusive weapons (if standing 50+)
- Equipment repair/upgrade services (25% discount at standing 75+)
- Hiring specialists (engineers, medics) for missions

**What Angers Them:**
- Destroying corporate property (-20)
- Stealing prototypes (-35)
- Working with anti-capitalist groups (-25)
- Sabotaging infrastructure (-30)

**What Pleases Them:**
- Completing corporate contracts (+15 to +25)
- Protecting corporate assets (+20)
- Retrieving stolen property (+15)
- Purchasing high-value equipment (+2 per $10k spent)

---

### F. Underworld Faction

**Role:** Criminal syndicates, black markets, smugglers

**Starting Standing:**
- Based on city's `crimeIndex`:
  - **High Crime (60+)**: Start at +10 (strong presence)
  - **Medium Crime (30-59)**: Start at 0
  - **Low Crime (0-29)**: Start at -15 (weak presence, distrustful)

**What They Offer:**
- Black market equipment (illegal weapons, explosives)
- Smuggling services (bypass border controls)
- Intel on rival underworld factions
- Hiding criminals (if you capture someone, sell to underworld instead of police)
- Laundering money (+10% on mission rewards if standing 50+)

**What Angers Them:**
- Completing police missions against them (-15)
- Killing underworld bosses (-30)
- Raiding black markets (-25)
- Working with police/military against them (-20)

**What Pleases Them:**
- Smuggling operations (+15)
- Protecting underworld assets (+20)
- Eliminating rival gangs (+10 to them, -10 to police)
- Purchasing black market goods (+1 per $5k spent)
- Ignoring criminal activity (+5 when you witness crime and don't report)

---

## 3. Standing Effects

### Mission Availability

Factions only offer missions if standing meets threshold:

| Mission Difficulty | Minimum Standing Required |
|--------------------|---------------------------|
| Easy (1-2) | 0 (neutral) |
| Medium (3) | +25 |
| Hard (4) | +50 |
| Extreme (5) | +75 |

**Special Case:** Underworld has inverted thresholds (negative standing unlocks harder missions).

### Equipment Access

Faction-specific equipment requires standing:

| Equipment Tier | Standing Required | Examples |
|----------------|-------------------|----------|
| Basic | 0+ | Pistols, basic armor, common items |
| Advanced | +25 | Assault rifles, tactical gear |
| Military-Grade | +50 | Sniper rifles, heavy armor, explosives |
| Classified | +75 | Experimental tech, prototype weapons |

**Price Modifiers by Standing:**
- **75-100**: -25% price
- **50-74**: -10% price
- **25-49**: Normal price
- **0-24**: +15% price
- **Negative**: +50% price (if sold at all)

### Safe Houses

Safe houses provide:
- Free healing over time (1 HP per hour)
- Equipment storage (unlimited)
- Fast travel points (if 75+ standing)
- Mission briefings from that faction

**Availability:**
- **Police**: Standing 50+ unlocks police stations
- **Military**: Standing 60+ unlocks military bases
- **Government**: Standing 70+ unlocks safe houses
- **Corporations**: Standing 40+ unlocks corporate hotels
- **Underworld**: Standing 30+ unlocks hideouts
- **Media**: Standing 50+ unlocks media offices (can change public perception)

### Travel & Border Control

Country reputation affects travel:

| Country Reputation | Border Effect |
|--------------------|---------------|
| 75-100 (Hero) | -50% travel time (fast lanes, air support) |
| 50-74 (Respected) | -25% travel time |
| 25-49 (Neutral+) | Normal travel time |
| 0-24 (Unknown) | Normal travel time |
| -1 to -24 (Suspicious) | +25% travel time (searches, paperwork) |
| -25 to -49 (Vigilante) | +50% travel time (thorough searches) |
| -50 to -74 (Criminal) | +100% travel time (border hassles, bribes) |
| -75 to -100 (Terrorist) | **Cannot enter legally** (must smuggle in) |

**Smuggling:**
- Available through Underworld faction (standing 25+)
- Costs $5,000 to $50,000 depending on security level
- 10% chance of being caught (combat encounter at border)

### Price Modifiers by Country Reputation

All purchases/sales in a country affected by aggregate reputation:

| Reputation | Buy Price | Sell Price |
|------------|-----------|------------|
| 75-100 | -20% | +20% |
| 50-74 | -10% | +10% |
| 25-49 | Normal | Normal |
| 0-24 | +10% | -10% |
| -1 to -49 | +30% | -30% |
| -50 to -100 | +75% | -50% |

### Intel Quality

Higher standing = better mission intel:

| Standing | Intel Level | Details Revealed |
|----------|-------------|------------------|
| 75-100 | **Full** | Enemy positions, exact count, equipment, leader names |
| 50-74 | **Good** | Enemy count range, general equipment, map layout |
| 25-49 | **Basic** | Estimated enemy count, mission objectives |
| 0-24 | **Minimal** | Mission type, location |
| Negative | **None** | No intel, mission unavailable |

---

## 4. Faction Missions

### Mission Source by Faction

Each faction offers specific mission types (from existing `missionSystem.ts`):

| Faction | Mission Types | Standing Required |
|---------|---------------|-------------------|
| **Police** | Investigate, Patrol, Skirmish (gangs) | 0+ |
| **Military** | Escort, Protect, Skirmish (militia), Capture & Hold | 0+ |
| **Government** | Assassinate, Extract, Rescue, Infiltrate | 25+ (covert) |
| **Corporations** | Protect, Escort, Sabotage (rivals) | 0+ |
| **Media** | Investigate (exposés), Patrol (publicity) | 25+ |
| **Underworld** | Assassinate, Sabotage, Smuggling (new type) | 0+ (negative OK) |

### Faction Mission Rewards

Missions affect standing with multiple factions:

**Example: Police Gang Takedown Mission**
- **Police**: +15 standing
- **Government**: +5 standing (supporting law and order)
- **Underworld**: -20 standing (you attacked them)
- **Media**: +10 standing (if public, heroic action)

**Example: Underworld Smuggling Mission**
- **Underworld**: +20 standing
- **Police**: -15 standing
- **Government**: -10 standing
- **Media**: -25 standing (if exposed)

### Dynamic Mission Generation

Missions spawn based on world state:

```typescript
interface MissionGenerationFactors {
  countryCrimeIndex: number;      // From cities.ts
  countryTerrorism: string;       // From countries.ts
  lswRegulations: string;         // From countries.ts
  playerStanding: number;         // Your faction standing
  cityType: string[];             // From cities.ts (Industrial, Military, etc.)
}
```

**High-Crime Cities (60+)**: More police/underworld missions
**Military Cities**: More military/protection missions
**Political Cities**: More government/assassination missions
**Low LSW countries**: More anti-vigilante missions (government wants you gone)

### New Mission Type: Smuggling

```typescript
{
  id: 'smuggling_run',
  type: 'smuggling',
  name: 'Contraband Delivery',
  description: 'Transport illegal goods across borders without detection.',
  source: 'underworld',
  minSquadSize: 1,
  maxSquadSize: 4,
  recommendedThreatLevel: 2,
  baseDifficulty: 3,
  dangerLevel: 5,
  estimatedDurationMinutes: 90,
  baseReward: 12000,
  fameReward: 0,  // Covert, no fame
  reputationChange: 0,  // Handled by faction system
  expectedEnemies: { min: 0, max: 12 },  // If caught
  combatRequired: false,
  stealthOption: true,
  factionEffects: {
    underworld: +20,
    police: -15,
    government: -10,
  }
}
```

---

## 5. Bounty System

### When Bounties Trigger

Bounties activate when standing drops below thresholds:

| Standing | Bounty Level | Bounty Amount | Hunter Type |
|----------|--------------|---------------|-------------|
| -25 to -49 | **Minor** | $10,000 | Local thugs, 1-3 enemies |
| -50 to -74 | **Major** | $50,000 | Professional mercs, 4-8 enemies |
| -75 to -100 | **Extreme** | $250,000 | Elite hit squads, 8-15 enemies |

### Bounty Mechanics

**Frequency:**
- **Minor**: 10% chance per day when in that country
- **Major**: 25% chance per day when in that country
- **Extreme**: 50% chance per day, 10% chance even in other countries

**Bounty Hunter Encounters:**
- Ambush during travel (random encounter)
- Assault on safe house (if you stay in one place 2+ days)
- Intercept during missions (surprise reinforcements)

**Ending Bounties:**
- Raise standing above -25 (complete missions for rival factions)
- Pay off bounty (2x bounty amount to faction leader)
- Defeat all bounty hunters (reduces bounty by 25%, doesn't remove)
- Leave country for 30+ days (bounty becomes "inactive" but returns if you come back)

### Bounty Hunter Stats

Bounty hunters scale with threat level:

**Minor Bounty (Thugs):**
- Threat Level 1-2
- Basic weapons (pistols, shotguns)
- No armor
- Morale: 50 (flee at 50% casualties)

**Major Bounty (Mercs):**
- Threat Level 3-4
- Military weapons (assault rifles, grenades)
- Tactical armor (DR 10-15)
- Morale: 70 (disciplined)

**Extreme Bounty (Elites):**
- Threat Level 5-7
- Heavy weapons (snipers, RPGs, machine guns)
- Heavy armor (DR 20-30)
- Morale: 90 (fight to the death)
- May include 1-2 low-level LSWs (Origin 3-5)

### Multiple Bounties

You can have bounties from multiple factions simultaneously:

**Example:**
- Police: -60 (Major bounty, $50k)
- Underworld: -80 (Extreme bounty, $250k)
- **Combined encounter**: 12-23 enemies (both groups hunt you, may fight each other)

---

## 6. Faction Conflicts

### Natural Enemies

Some factions inherently conflict:

| Faction A | Faction B | Conflict Level | Effect |
|-----------|-----------|----------------|--------|
| **Police** | **Underworld** | High | +15 with one = -10 to other |
| **Government** | **Terrorism** | Extreme | +20 with one = -30 to other |
| **Military** | **Rebellion** | High | +15 with one = -15 to other |
| **Media** | **Authoritarian Gov** | Medium | In low mediaFreedom countries only |
| **Corporations** | **Underworld** | Low | Only if underworld attacks corporate assets |

### Faction Alliance

Some factions cooperate:

| Faction A | Faction B | Alliance Level | Effect |
|-----------|-----------|----------------|--------|
| **Police** | **Government** | High | +10 with one = +5 to other |
| **Military** | **Government** | High | +15 with one = +8 to other |
| **Corporations** | **Government** | Medium | In high-corruption countries (+10 = +3) |
| **Media** | **Police** | Low | In high mediaFreedom countries (+5 = +2) |

### Faction Wars

At random intervals (driven by world simulation), factions go to war:

**Triggers:**
- High crime index (60+) + low law enforcement = Police vs. Underworld war
- Terrorism activity "Active" = Government/Military vs. Terrorism war
- High government corruption (70+) = Media vs. Government conflict

**During Faction War:**
- Missions available from both sides
- Choosing a side gives +30 to chosen faction, -40 to enemy faction
- Special "decisive battle" missions (high reward, affects war outcome)
- War ends after 30-90 days (winner determined by player actions + simulation)

**Post-War Effects:**
- Winning faction gains +10 standing globally in that country
- Losing faction loses -15 standing globally
- Player keeps their standing changes

---

## 7. Data Structures

### Faction Standing Data

```typescript
interface FactionStanding {
  factionId: string;           // "police_usa", "military_russia", etc.
  factionType: FactionType;    // police, military, government, etc.
  countryCode: string;         // 2-letter ISO code (from countries.ts)
  countryName: string;         // "United States"

  standing: number;            // -100 to +100
  standingLabel: StandingLabel; // 'Hero', 'Criminal', etc.

  // History
  lastChanged: number;         // Game timestamp
  lastChangeReason: string;    // "Completed police mission: Gang Takedown"
  history: StandingEvent[];    // Last 20 events

  // Status
  activeBounty: Bounty | null;
  isMember: boolean;           // Joined faction as official member
  memberRank?: number;         // 1-10 if member

  // Unlock tracking
  unlockedMissions: string[];  // Mission IDs available
  unlockedEquipment: string[]; // Equipment IDs available
  unlockedSafeHouses: string[]; // City IDs with safe houses
}

type FactionType = 'police' | 'military' | 'government' | 'media' | 'corporations' | 'underworld';

type StandingLabel =
  | 'Hero'           // 75-100
  | 'Respected'      // 50-74
  | 'Neutral+'       // 25-49
  | 'Unknown'        // 0-24
  | 'Suspicious'     // -1 to -24
  | 'Vigilante'      // -25 to -49
  | 'Criminal'       // -50 to -74
  | 'Terrorist';     // -75 to -100

interface StandingEvent {
  timestamp: number;
  change: number;              // + or - value
  newStanding: number;
  reason: string;
  missionId?: string;
}
```

### Bounty Data

```typescript
interface Bounty {
  id: string;
  factionId: string;
  factionType: FactionType;
  countryCode: string;

  amount: number;              // Cash reward for killing you
  level: 'minor' | 'major' | 'extreme';

  issuedAt: number;            // Game timestamp
  lastAttempt?: number;        // Last bounty hunter encounter
  attemptsCount: number;       // How many times they've tried

  hunterThreatLevel: number;   // 1-9
  hunterCount: { min: number; max: number };

  status: 'active' | 'inactive' | 'paid_off' | 'expired';
}
```

### Country Reputation Summary

```typescript
interface CountryReputation {
  countryCode: string;
  countryName: string;

  // Aggregate
  overallReputation: number;   // Average of all 6 factions
  overallLabel: StandingLabel;

  // Per-faction
  factions: {
    police: number;
    military: number;
    government: number;
    media: number;
    corporations: number;
    underworld: number;
  };

  // Effects
  borderControlModifier: number; // % travel time change
  priceModifier: number;         // % price change
  canEnterLegally: boolean;

  // Active issues
  activeBounties: Bounty[];
  totalBountyAmount: number;
}
```

### Faction Mission Extension

Extend existing `MissionTemplate` from `missionSystem.ts`:

```typescript
interface MissionTemplate {
  // ... existing fields ...

  // NEW FIELDS
  factionSource: FactionType;        // Which faction offers this
  minStandingRequired: number;       // -100 to +100

  factionEffects: {                  // Standing changes on completion
    [factionType: string]: number;   // e.g., { police: +15, underworld: -20 }
  };

  failureFactionEffects?: {          // Standing changes on failure
    [factionType: string]: number;
  };

  refusalPenalty?: number;           // Standing loss if you decline mission
}
```

---

## 8. Integration Points

### Integration with Existing Systems

#### A. Character System (characterSheet.ts)

Add to `CharacterSheet` interface:

```typescript
interface CharacterSheet {
  // ... existing fields ...

  // NEW: Faction reputation tracking
  factionStandings: FactionStanding[];
  activeBounties: Bounty[];
  totalBountyValue: number;
}
```

#### B. Mission System (missionSystem.ts)

Modify mission generation:

```typescript
function generateMission(
  template: MissionTemplate,
  sector: string,
  city?: string,
  difficultyModifier: number = 0,
  playerStanding: number = 0  // NEW: affects availability
): GeneratedMission | null {

  // Check standing requirement
  if (playerStanding < template.minStandingRequired) {
    return null; // Mission not available
  }

  // ... existing logic ...
}
```

#### C. Game Store (enhancedGameStore.ts)

Add faction state:

```typescript
interface EnhancedGameStore {
  // ... existing fields ...

  // NEW: Faction system
  factionStandings: Map<string, FactionStanding>;  // Key: "factionType_countryCode"
  activeBounties: Bounty[];

  // Actions
  modifyFactionStanding: (factionId: string, change: number, reason: string) => void;
  getCountryReputation: (countryCode: string) => CountryReputation;
  checkBountyTrigger: () => void;  // Called each game day
}
```

#### D. World Map (WorldMapGrid.tsx)

Visual indicators:

- Color-code countries by aggregate reputation
- Show bounty warning icons on sectors with active hunters
- Display faction icons in city panels (which factions are present)

#### E. Combat System (CombatScene.ts)

Bounty hunter encounters:

- Generate bounty hunter squads dynamically
- Use existing combat system
- Reward for defeating hunters: remove/reduce bounty

---

## 9. Implementation Priority

### Phase 1: Core Reputation System (Week 1-2)

**Must Have:**
- [ ] `FactionStanding` data structure
- [ ] `modifyFactionStanding()` function
- [ ] Standing label calculation (Hero/Criminal/etc.)
- [ ] Per-country faction initialization (168 countries x 6 factions = 1008 entries)
- [ ] UI: Faction screen showing all standings
- [ ] Integration with existing mission completion (modify standing on mission end)

**Deliverable:** Players can see faction standings, which change based on mission outcomes.

---

### Phase 2: Standing Effects (Week 3-4)

**Must Have:**
- [ ] Mission availability gating (check `minStandingRequired`)
- [ ] Equipment access tiers (Basic/Advanced/Military/Classified)
- [ ] Price modifiers by standing
- [ ] Safe house unlocks
- [ ] Border control travel time modifiers

**Deliverable:** Reputation has tangible gameplay effects.

---

### Phase 3: Faction Missions (Week 5-6)

**Must Have:**
- [ ] Extend `MissionTemplate` with faction fields
- [ ] Mission generation filters by faction standing
- [ ] Multi-faction reputation changes on mission completion
- [ ] Faction conflict effects (Police vs. Underworld, etc.)
- [ ] Dynamic mission spawn based on country stats (crime index, terrorism)

**Deliverable:** Factions offer unique missions; choices have consequences.

---

### Phase 4: Bounty System (Week 7-8)

**Must Have:**
- [ ] Bounty data structure
- [ ] Bounty trigger logic (when standing drops below -25)
- [ ] Bounty hunter squad generation
- [ ] Random encounter system (ambush during travel)
- [ ] Bounty UI notifications
- [ ] Bounty payoff mechanic

**Deliverable:** Negative reputation creates danger; bounty hunters hunt you.

---

### Phase 5: Advanced Features (Week 9-10)

**Nice to Have:**
- [ ] Faction wars (dynamic events between factions)
- [ ] Faction membership system (officially join a faction)
- [ ] Faction ranks (climb hierarchy)
- [ ] Reputation decay over time
- [ ] Smuggling system (bypass borders when reputation is terrible)
- [ ] Media faction exclusive features (interviews, fame multipliers)

**Deliverable:** Deep faction gameplay with emergent stories.

---

## 10. Example Gameplay Scenarios

### Scenario A: The Clean Hero

**Player Actions:**
- Only takes police/military missions
- Never works with underworld
- Always captures enemies alive
- Gives media interviews

**Result after 50 missions:**
- Police: +85 (Hero)
- Military: +70 (Respected)
- Government: +60 (Respected)
- Media: +80 (Hero)
- Corporations: +40 (Neutral+)
- Underworld: -65 (Criminal)

**Effects:**
- 25% discount on police/military equipment
- Free fast travel through military bases
- Underworld issues $50k bounty (major)
- High fame (+25% from media bonus)
- Can't access black market

---

### Scenario B: The Pragmatist

**Player Actions:**
- Takes missions from all factions
- Balances police and underworld jobs
- Avoids media attention
- Completes government covert ops

**Result after 50 missions:**
- Police: +25 (Neutral+)
- Military: +40 (Neutral+)
- Government: +70 (Respected)
- Media: +5 (Unknown)
- Corporations: +30 (Neutral+)
- Underworld: +35 (Neutral+)

**Effects:**
- Access to both legal and black markets
- No bounties
- Moderate equipment discounts
- Low fame (secretive)
- Diplomatic immunity from government

---

### Scenario C: The Mercenary

**Player Actions:**
- Only works for highest bidder (corporations, underworld)
- Ignores police missions
- Operates in "Banned LSW" countries
- Kills indiscriminately

**Result after 50 missions:**
- Police: -70 (Criminal)
- Military: -40 (Vigilante)
- Government: -55 (Criminal)
- Media: -50 (Criminal)
- Corporations: +60 (Respected)
- Underworld: +75 (Hero)

**Effects:**
- $300k in active bounties (extreme + major)
- Can't enter most countries legally (must smuggle)
- +10% reward laundering through underworld
- Access to experimental corporate tech
- Full black market access
- Constant bounty hunter encounters

---

### Scenario D: The Terrorist

**Player Actions:**
- Works with terrorism factions
- Sabotages infrastructure
- Kills civilians
- Attacks media

**Result after 20 missions:**
- Police: -95 (Terrorist)
- Military: -98 (Terrorist)
- Government: -100 (Terrorist)
- Media: -85 (Terrorist)
- Corporations: -75 (Terrorist)
- Underworld: -30 (Vigilante, even criminals hate you)

**Effects:**
- **$1,000,000+ in bounties**
- Cannot enter ANY country legally
- Kill on sight by all factions
- Daily elite hit squads
- Game over if captured (prison ending)

---

## Summary

The Faction Relations System adds **geopolitical depth** to SuperHero Tactics by:

1. **Tracking reputation** across 1008+ faction-country combinations
2. **Gating content** behind standing requirements (missions, equipment, safe houses)
3. **Creating consequences** for player choices (bounties, price changes, travel restrictions)
4. **Emergent storytelling** through faction conflicts, wars, and alliances
5. **Replayability** - different playstyles create vastly different experiences

**Integration Effort:** Moderate
- Leverages existing mission system, country data, and character sheets
- Requires new UI screens (faction reputation viewer)
- Requires new combat encounters (bounty hunters)
- Requires new mission filtering logic

**Player Impact:** High
- Every mission choice matters
- Forces strategic thinking about reputation management
- Creates "clean hero" vs "ruthless mercenary" vs "underground operator" playstyles
- Adds consequences to otherwise consequence-free missions

---

**Next Steps:**
1. Review this proposal with dev team
2. Prototype Phase 1 (core reputation system) in 2 weeks
3. User test standing effects (Phase 2)
4. Full implementation over 10 weeks

---

*End of Proposal*
