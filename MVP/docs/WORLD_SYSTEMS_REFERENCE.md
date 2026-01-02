# World Systems Reference

> **Quick Answer: Is high reputation good or bad?**
> **+100 = LEGENDARY (BEST) | -100 = HATED (WORST) | Higher is always better!**

---

## QUICK REFERENCE

```
REPUTATION  -100 (Hated) ←────────→ +100 (Legendary)   HIGHER IS BETTER
ECONOMY     Payday every Monday, starting cash $10,000
TIME        Hour-based (0-23), activities cost hours
BASE        6 types (9-16 slots), 12 facility types
NEWS        10 sources with bias, feeds investigations
```

| System | Good Value | Bad Value | Tracked In |
|--------|------------|-----------|------------|
| Reputation (all 4 axes) | +100 | -100 | `reputation` in store |
| Cash | Higher | Lower | `economy.cash` |
| Debt | $0 | Higher | `economy.totalDebt` |
| Facility Condition | 100% | 0% | `facility.condition` |
| Base Security | 100 | 0 | `base.security` |
| Hours Awake | <16 | >24 (collapse) | `gameTime` |

---

## 1. TIME SYSTEM

**File:** `src/data/timeSystem.ts`

### Hour Format
- **24-hour clock**: 0-23
- **Game starts**: January 1, 2025 at 8:00 AM (Wednesday)

### Time of Day Periods

| Period | Hours | Example Activities |
|--------|-------|-------------------|
| **Night** | 0-5 | Sleep, criminal activity |
| **Morning** | 6-11 | Work, training |
| **Afternoon** | 12-17 | Work, study |
| **Evening** | 18-23 | Personal time, night missions |

### Activity Hour Costs

| Activity | Hours | Notes |
|----------|-------|-------|
| Sleep | 8 | Required (min 6, recommended 8) |
| Full-time job | 8 | Day work |
| Part-time job | 4 | Flexible |
| Full study session | 8 | At institution |
| Part-time study | 4 | Can combine with job |
| Intensive study | 12 | Exhaustion risk |
| Online study | 6 | Anywhere with internet |
| Travel per sector | 6 | World map movement |
| Combat mission | 4+ | Variable |
| Training at base | 4 | Uses Training Room |
| Crafting | 4 | Uses Engineering Lab |
| Investigation | 4 | Uses Intel Center |

### Fatigue Penalties

| Hours Awake | Penalty |
|-------------|---------|
| 0-16 | None |
| 16-20 | -5 to all stats |
| 20-24 | -15 to all stats |
| 24+ | -30 penalty, forced collapse |

### Calendar
- Standard Gregorian (Jan-Dec, 1-31 days)
- Leap year support
- Week starts Monday (payday day)
- Weekend: Saturday & Sunday

---

## 2. ECONOMY SYSTEM

**File:** `src/data/economySystem.ts`

### Weekly Cycle
- **Payday**: Every Monday
- **Processing**: Income added, expenses deducted, debt interest applied

### Starting State
- Cash: **$10,000**
- Debt: $0

### Transaction Types

| Type | Direction | Examples |
|------|-----------|----------|
| **income** | +money | Job pay, mission rewards |
| **expense** | -money | Base upkeep, medical |
| **purchase** | -money | Equipment, vehicles |
| **sale** | +money | Selling gear |

### Income Categories
- `job_pay` - Weekly salary
- `mission_reward` - Combat/investigation completion
- `investment_return` - Passive income
- `bounty_collected` - Capturing villains
- `insurance_payout` - Claims
- `gift` - Donations, windfalls

### Expense Categories
- `base_upkeep` - Monthly facility costs
- `medical_expense` - Hospital, recovery
- `education_tuition` - Training courses
- `equipment_maintenance` - Repairs
- `travel_expense` - Transport costs
- `salary_payment` - Paying team members
- `bribe` - Corruption
- `fine` - Legal penalties

### Budget Planning
```
Weekly Income = Jobs + Missions + Investments + Other
Weekly Expenses = Base Upkeep + Salaries + Medical + Education + Maintenance
Surplus/Deficit = Income - Expenses
```

### Currency Display
- Under $1,000: `$500`
- $1,000-999,999: `$50K`
- $1M+: `$2.5M`

---

## 3. REPUTATION SYSTEM

**File:** `src/data/reputationSystem.ts`

### THE SCALE: HIGHER IS ALWAYS BETTER

```
-100 ────────────── 0 ────────────── +100
HATED           NEUTRAL          LEGENDARY
```

### Four Reputation Axes

| Axis | Icon | What It Measures |
|------|------|------------------|
| **Public** | Blue | General public perception |
| **Government** | Green | Official/legal standing |
| **Criminal** | Purple | Underworld respect |
| **Heroic** | Yellow | Hero community standing |

### Reputation Tiers

| Range | Tier | Description |
|-------|------|-------------|
| -100 to -75 | **Hated** | Actively hunted/despised |
| -74 to -50 | **Feared** | Known threat, avoided |
| -49 to -25 | **Disliked** | Unfavorable, cautious |
| -24 to -1 | **Unknown-** | Slight negative lean |
| 0 | **Neutral** | Completely unknown |
| 1 to 24 | **Unknown+** | Slight positive lean |
| 25 to 49 | **Liked** | Favorable, helpful |
| 50 to 74 | **Respected** | Well-regarded, doors open |
| 75 to 100 | **Legendary** | Iconic, major influence |

### Reputation Effects

#### Public Reputation (General Fame)

| Level | Effects |
|-------|---------|
| +50 (Respected) | 10% price discount, easier recruitment, positive media |
| +75 (Legendary) | 20% discount, VIP treatment, sponsorships, fan clubs |
| -50 (Feared) | 10% price increase, people flee, negative coverage |
| -75 (Hated) | 25% markup, mob attacks, active opposition |

#### Government Standing

| Level | Effects |
|-------|---------|
| +50 | Police cooperation, database access, official missions |
| +75 | Military equipment, classified info, diplomatic immunity |
| -50 | Warrant issued, flagged at airports |
| -75 | Shoot-on-sight, bank accounts frozen, full manhunt |

#### Criminal Reputation

| Level | Effects |
|-------|---------|
| +50 | Black market access, safe passage, underworld contacts |
| +75 | Premium black market, crime alliances, safe houses |
| -50 | Marked for robbery, information sold to enemies |
| -75 | Assassination contracts, gang hits |

#### Heroic Standing

| Level | Effects |
|-------|---------|
| +50 | Hero team-ups, shared intel, backup on missions |
| +75 | Team invitations, sidekicks, legacy items, mentor status |
| -50 | Shunned by heroes, no backup, intel blackout |
| -75 | Heroes hunt you, former allies turn hostile |

### Action → Reputation Changes

| Action | Public | Govt | Criminal | Heroic |
|--------|--------|------|----------|--------|
| Save civilians | +10 | +5 | -5 | +10 |
| Defeat villain | +15 | +10 | -10 | +15 |
| Property damage | -10 | -5 | 0 | -5 |
| Civilian casualties | **-25** | -20 | +5 | **-25** |
| Work with police | +5 | +15 | -15 | +5 |
| Criminal activity | -15 | -20 | +15 | -20 |
| Expose corruption | +20 | -10 | -10 | +15 |
| Betray heroes | -20 | 0 | +15 | **-50** |

### Reputation Decay
- Extreme values slowly drift toward neutral
- Rate: 0.5 per day
- Values between -25 and +25 don't decay
- Won't cross zero from decay alone

---

## 4. NEWS SYSTEM

**File:** `src/data/newsSystem.ts` + `newsTemplates.ts`

### News Sources

| Source | Bias | Credibility | Coverage |
|--------|------|-------------|----------|
| World News Network | Neutral | 85% | International, politics |
| Daily Sentinel | Pro-Hero | 75% | Superhuman, crime |
| Truth Gazette | Anti-Hero | 60% | Critical coverage |
| Metro Times | Neutral | 70% | Local news |
| Scandal Weekly | Tabloid | 30% | Sensational |
| Official Press Service | Government | 65% | Official statements |
| Corporate Digest | Corporate | 70% | Business focus |
| Underground Wire | Independent | 55% | Alternative views |
| Science Today | Neutral | 90% | Scientific accuracy |
| Sports Central | Neutral | 80% | Sports/entertainment |

### Article Importance & Expiration

| Importance | Expires After |
|------------|--------------|
| Breaking | 1 day |
| Major | 3 days |
| Standard | 7 days |
| Minor | 3 days |
| Filler | 1 day |

### News Categories
- crime, politics, superhuman, business, international
- local, science, entertainment, sports, weather, opinion

### News → Investigation Hook
Some articles include `investigationLead` linking to investigation system.

---

## 5. BASE BUILDING SYSTEM

**File:** `src/data/baseSystem.ts`

### Base Types

| Type | Grid | Slots | Security | Monthly | Purchase |
|------|------|-------|----------|---------|----------|
| **Warehouse** | 3x3 | 9 | 20 | $2,000 | $50,000 |
| **Safehouse** | 3x3 | 9 | 40 | $3,000 | $75,000 |
| **Mansion** | 3x4 | 12 | 30 | $8,000 | $200,000 |
| **Underground** | 3x4 | 12 | 60 | $5,000 | $150,000 |
| **Corporate** | 3x4 | 12 | 35 | $10,000 | $250,000 |
| **Compound** | 4x4 | 16 | 70 | $15,000 | $500,000 |

### Facility Types & Bonuses

#### Education-Boosting Facilities

| Facility | Education Bonus | Fields Affected |
|----------|-----------------|-----------------|
| Training Room | +20/40/60% | Combat sciences, martial arts, tactics |
| Library | +15/30/45% | Academic, languages, investigation |
| Simulator | +25/50/75% | Vehicle combat, weapons systems |

#### Medical Facilities

| Facility | Healing Bonus | Other |
|----------|---------------|-------|
| Medical Bay | +25/50/100% | Base surgery capability |
| Pharmacy | +10/20/30% | Drug production, antidotes |

#### Operations Facilities

| Facility | Investigation Bonus | Other |
|----------|---------------------|-------|
| Intel Center | +20/40/60% | Surveillance |
| Communications | +10/20/30% | Hacking, coordination |

#### Support Facilities

| Facility | Bonus | Notes |
|----------|-------|-------|
| Engineering Lab | +20/40/60% crafting | Repairs, mods |
| Armory | +10/20/30% crafting | Weapon storage |
| Garage | 2/4/6 vehicle slots | Vehicle storage |
| Living Quarters | +2/4/6 team capacity | Housing |
| Power Generator | +50/100/200 power | Required for tech |
| Security System | +15/30/50% security | Base defense |

### Power System
- Each base type has base power capacity
- Facilities consume power (higher level = more power)
- Power Generators ADD capacity
- Over capacity = base crippled

### Construction
- Facilities take hours to build (24-96 hours depending on level)
- Queue multiple projects
- Can cancel for 75% refund (based on progress)

### Base Limits
- Maximum 3 bases total
- One active base at a time

---

## 6. SYSTEM INTERCONNECTIONS

```
         TIME SYSTEM
              ↓
    ┌─────────┴─────────┐
    ↓                   ↓
ECONOMY             ACTIVITIES
(Payday Mon)        (Hour costs)
    ↓                   ↓
    └─────────┬─────────┘
              ↓
         BASE BUILDING
         (Upkeep costs)
              ↓
    ┌─────────┴─────────┐
    ↓                   ↓
REPUTATION           NEWS
(Affects prices)    (Reports events)
    ↓                   ↓
    └─────────┬─────────┘
              ↓
         CHARACTERS
```

### Key Connections

| From | To | Effect |
|------|-----|--------|
| Time | Economy | Monday triggers payday |
| Time | News | Articles expire over days |
| Reputation | Economy | Public rep affects prices (±10-25%) |
| Reputation | News | Milestones generate articles |
| Base | Economy | Monthly upkeep deducted |
| Base | Education | Facility bonuses speed learning |
| Base | Healing | Medical Bay speeds recovery |
| News | Investigation | Articles provide leads |

---

## 7. CHARACTER INTEGRATION (How Characters Use These Systems)

### Jobs & Income
- Characters with `dayJob` get paid weekly on Monday
- Job type determines salary
- Part-time jobs allow study/training same day

### Reputation
- Each character action affects team reputation
- High public rep = better recruitment options
- Low government rep = team becomes fugitives

### Base Facilities
- Training Room: Faster skill learning
- Medical Bay: Faster injury recovery
- Living Quarters: Team capacity limit

### Future Integration Points
- [ ] Character schedules (hourly activities)
- [ ] Personal reputation vs team reputation
- [ ] Facility assignment (who uses what)

---

## 8. STORE INTEGRATION

**File:** `src/stores/enhancedGameStore.ts`

### State Fields

```typescript
// Time
gameTime: { minutes, day, year }
timeSpeed: 0-4 (paused to ultra fast)

// Economy
economy: { cash, weeklyIncome, weeklyExpenses, transactions[], ... }
budget: number (legacy, synced with economy.cash)

// Reputation
reputation: { public, government, criminal, heroic } // -100 to +100

// News
newsState: { articles[], unreadCount, ... }
newsArticles: NewsArticle[] (legacy array)

// Base
baseState: { bases[], activeBaseId, maxBases, constructionProjects[] }
```

### Key Actions

```typescript
// Time
advanceTime(hours)
setTimeSpeed(speed)

// Economy
recordTransaction(type, category, amount, description)
processWeeklyPayday()
getEconomyStats()

// Reputation
adjustReputationAxis(axis, delta, reason)
getReputationEffects()
processReputationDecay()

// Base
purchaseBase(type, name, sectorCode, countryCode)
buildFacility(baseId, facilityType, gridX, gridY)
upgradeFacilityAt(baseId, gridX, gridY)
removeFacilityAt(baseId, gridX, gridY)
processConstruction(hours)
getBaseBonuses(baseId)
```

---

## 9. NEXT STEPS (UI & Gameplay Hooks)

### UI Components Needed

| Component | Purpose | Priority |
|-----------|---------|----------|
| TimeDisplay | Show current time, speed controls | High |
| NewsBrowser | Read articles, track investigations | High |
| BaseManager | Build/manage facilities | Medium |
| ReputationPanel | Show 4 axes with effects | Medium |
| EconomyDashboard | Budget, transactions | Medium |

### Gameplay Hooks to Implement

| Hook | Trigger | Effect |
|------|---------|--------|
| Combat → News | Mission complete | Generate news article |
| Combat → Reputation | Casualties/success | Adjust reputation |
| Day Change → Economy | Monday | Process payday |
| Facility → Education | Training | Apply bonus to learning |
| Facility → Healing | Medical Bay | Faster recovery |

---

## 10. CHARACTER LIFE CYCLE SYSTEM

**File:** `src/data/characterLifeCycle.ts`

### City Familiarity (Per Character)

Each character tracks their own familiarity with cities they visit.

| Level | Range | Discount | Unlocks |
|-------|-------|----------|---------|
| **Stranger** | 0-20 | 0% | Nothing |
| **Visitor** | 21-40 | 5% | Basic navigation, cheap lodging |
| **Familiar** | 41-60 | 10% | Shortcuts, some contacts |
| **Local** | 61-80 | 15% | Underground access, trusted contacts |
| **Native** | 81-100 | 20% | Safe houses, insider networks, home base bonus |

### How Familiarity Increases

| Action | Familiarity Gained |
|--------|-------------------|
| Day spent in city | +1 |
| Mission completed | +2 |
| Contact made | +5 |
| Property/safe house bought | +10 |
| Study session | +3 |

### Familiarity Decay

- Unused cities slowly decay
- Decay rate: 0.5 per week absent
- Minimum before decay: 30 days absent
- Never decays below 10 (if previously visited)
- Hometown never decays

---

### Autonomous Activities

When not on missions, characters DO things based on personality.

#### Activity Categories

| Category | Driven By | Auto Threshold |
|----------|-----------|----------------|
| **Work** | Discipline, Initiative | Always auto |
| **Social** | Sociability | Up to $100 |
| **Recovery** | Harm Avoidance, Health deficit | Up to $500 |
| **Adventure** | Risk Tolerance, Impatience | Never auto (always asks) |
| **Growth** | Low Impatience, Initiative | Up to $200 |

#### Activity Desire Calculation

```
Work Desire = (Discipline × 0.5) + (Initiative × 0.3) + (10 - Impatience) × 0.2
Social Desire = (Sociability × 0.7) + (10 - Volatility) × 0.3
Recovery Desire = (Harm Avoidance × 0.4) + (10 - Risk Tolerance) × 0.3 + Health Deficit
Adventure Desire = (Risk Tolerance × 0.5) + (Impatience × 0.3) + (10 - Discipline) × 0.2
Growth Desire = (10 - Impatience) × 0.4 + (Initiative × 0.3) + (Discipline × 0.3)
```

#### City Type → Activity Support

| City Type | Work | Social | Recovery | Adventure | Growth |
|-----------|:----:|:------:|:--------:|:---------:|:------:|
| Military | 3 | 1 | 2 | 2 | 2 |
| Resort | 1 | 3 | 3 | 3 | 1 |
| Educational | 2 | 2 | 1 | 1 | 3 |
| Temple | 1 | 1 | 3 | 1 | 3 |
| Industrial | 3 | 1 | 1 | 2 | 2 |
| Political | 3 | 3 | 1 | 1 | 2 |
| Seaport | 2 | 2 | 1 | 3 | 1 |
| Mining | 3 | 1 | 1 | 2 | 1 |
| Company | 3 | 2 | 1 | 1 | 2 |

### Personality → City Preferences

| Personality Trait | Attracted To | Repelled By |
|-------------------|--------------|-------------|
| High Sociability (8+) | Resort, Political | Mining, Military |
| Low Sociability (3-) | Mining, Industrial | Resort, Political |
| High Risk Tolerance (8+) | Military, Seaport | Educational, Temple |
| Low Risk Tolerance (3-) | Educational, Temple | Military, Seaport |
| High Initiative (8+) | Company, Industrial | Temple |
| High Discipline (8+) | Military, Political | Resort |
| Low Discipline (3-) | Resort, Seaport | Military |
| High Harm Avoidance (8+) | Temple, Educational | Military |

### Daily Idle Processing

```
When time advances a day:
FOR each character not on mission:
  1. Calculate activity desires from personality
  2. Pick highest desire that city can satisfy
  3. IF activity cost < threshold → Auto-do, log to player
  4. IF activity cost ≥ threshold → Add to pendingRequests
  5. Update city familiarity +1
  6. Apply morale effects
```

### Store Integration

```typescript
// State
pendingActivityRequests: ActivityRequest[]
completedActivityReports: DailyActivityReport[]
lastDayProcessed: number

// Actions
processCharacterIdleDay(characterId)     // Process one character
processAllIdleCharacters()               // Process all idle characters
approveActivityRequest(requestId)        // Player approves expensive activity
denyActivityRequest(requestId)           // Player denies activity
getCharacterFamiliarity(charId, cityId)  // Get familiarity level
getCharacterActivityDesires(charId)      // Get what character wants to do
```

---

## Quick Lookup Tables

### Is This Value Good or Bad?

| Value | Good | Bad |
|-------|------|-----|
| Reputation +100 | Yes | |
| Reputation -100 | | Yes |
| Cash $100,000 | Yes | |
| Debt $50,000 | | Yes |
| Security 100 | Yes | |
| Condition 100% | Yes | |
| Hours Awake 8 | Yes | |
| Hours Awake 24+ | | Yes (collapse) |
| City Familiarity 100 | Yes | |
| City Familiarity 0 | | Yes (stranger) |
| Morale 100 | Yes | |
| Morale 0 | | Yes (desertion risk) |

---

*Last Updated: December 2024*
*Source Files: timeSystem.ts, economySystem.ts, reputationSystem.ts, newsSystem.ts, baseSystem.ts, characterLifeCycle.ts*
