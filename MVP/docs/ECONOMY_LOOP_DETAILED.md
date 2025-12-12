# ECONOMY LOOP - Detailed Implementation Proposal

## Core Philosophy
**Every economic action ties to 2-3 other systems:**
- Income ties to: Faction standing, Fame, Country GDP, Mission type
- Expenses tie to: Country prices, Combined Effects, Squad size
- Black market ties to: combinedEffects.blackMarket, Country corruption
- Medical ties to: combinedEffects.medical, Country healthcare

---

## TIME SYSTEM (Critical for Testing)

### Time Progression Speeds
| Mode | Speed | Use Case |
|------|-------|----------|
| **Paused** | 0x | Planning, reading, inventory |
| **Normal** | 1 hour = 1 second | Active play |
| **Fast** | 1 hour = 0.25 sec | Waiting for travel |
| **Very Fast** | 1 day = 2 sec | Long recovery, testing |
| **Ultra** | 1 week = 2 sec | Testing economy only |

### Time Events
```typescript
interface TimeEvent {
  type: 'hourly' | 'daily' | 'weekly' | 'monthly';
  callback: () => void;
}

// Events that fire at each interval
const timeEvents = {
  hourly: [
    'updateTravelProgress',
    'checkPatrolEncounters',
    'updateHeatDecay',
  ],
  daily: [
    'processRecovery',
    'updateFactionStandings',
    'generateNews',
    'checkMissionExpiry',
  ],
  weekly: [
    'paySalaries',
    'payRent',
    'processInvestments',
    'generateNewMissions',
  ],
  monthly: [
    'payBaseUpkeep',
    'receiveFactionStipend',
    'processElections',
    'updateWorldEvents',
  ],
};
```

### UI Controls
```
[<<] [<] [||] [>] [>>] [>>>]
 1x   -   Pause  +   Fast  Ultra

Day 47 | 14:30 | Week 7 | $125,430
```

---

## INCOME SOURCES (Tied to Combined Effects)

### 1. Mission Rewards
**Base reward modified by country GDP:**
```typescript
function getMissionReward(mission: Mission, country: Country): number {
  const baseReward = mission.baseReward;
  const gdpMultiplier = country.gdpPerCapita / 50; // 0.1 to 2.0
  const factionBonus = getFactionStandingBonus(mission.faction);

  return Math.round(baseReward * gdpMultiplier * factionBonus);
}
```

| Mission Type | Base Reward | GDP Scaling |
|--------------|-------------|-------------|
| Patrol | $1,000 | Low (0.5x) |
| Rescue | $5,000 | Medium (1x) |
| Assault | $10,000 | Medium (1x) |
| Investigation | $3,000 | Low (0.5x) |
| Assassination | $25,000 | High (1.5x) |
| Government Contract | $50,000 | Very High (2x) |

### 2. Faction Stipends (Monthly)
**Tied to faction standing AND country budget:**
```typescript
function getMonthlyStipend(faction: FactionType, standing: number, country: Country): number {
  if (standing < 50) return 0; // Must be "Friend" or better

  const baseStipend = {
    police: 3000,
    military: 8000,
    government: 10000,
    corporations: 15000,
    underworld: 5000,
    media: 2000,
  }[faction];

  // Country budget affects stipend
  const budgetMultiplier = getBudgetMultiplier(faction, country);

  // Standing bonus (50-100 = 1x to 2x)
  const standingMultiplier = 1 + (standing - 50) / 50;

  return Math.round(baseStipend * budgetMultiplier * standingMultiplier);
}
```

| Faction | Base Stipend | Country Stat Affecting It |
|---------|--------------|---------------------------|
| Police | $3,000/mo | LawEnforcementBudget |
| Military | $8,000/mo | MilitaryBudget |
| Government | $10,000/mo | GDP National |
| Corporations | $15,000/mo | GDP Per Capita |
| Underworld | $5,000/mo | Corruption (inverse) |
| Media | $2,000/mo | MediaFreedom |

### 3. Salvage & Loot
**Tied to enemy equipment tier (from combinedEffects):**
```typescript
function getSalvageValue(enemy: Enemy, country: Country): number {
  const effects = calculateAllCombinedEffects(country);
  const equipmentTier = effects.research.researchTier; // 1-4

  const baseSalvage = {
    1: 100,  // Tier 1: rusty AKs
    2: 300,  // Tier 2: standard military
    3: 750,  // Tier 3: modern equipment
    4: 2000, // Tier 4: cutting edge
  }[equipmentTier];

  return baseSalvage * enemy.gearCount;
}
```

### 4. Bounties (from Faction System)
```typescript
function claimBounty(target: Character, captureMethod: 'alive' | 'dead'): number {
  const baseBounty = target.bounty;
  const aliveBonus = captureMethod === 'alive' ? 1.5 : 1.0;
  const fameBonus = playerFame > 70 ? 1.2 : 1.0; // Famous = better deals

  return Math.round(baseBounty * aliveBonus * fameBonus);
}
```

### 5. Black Market Sales
**Tied to combinedEffects.blackMarket:**
```typescript
function getBlackMarketSellPrice(item: Item, country: Country): number {
  const effects = calculateAllCombinedEffects(country);
  const bm = effects.blackMarket;

  if (!bm.available) return 0; // Can't sell

  // Black market pays MORE in places with high demand
  const demandMultiplier = bm.accessDifficulty === 'open' ? 0.5 : // Flooded market
                           bm.accessDifficulty === 'contacts_needed' ? 0.7 :
                           bm.accessDifficulty === 'deep_underworld' ? 0.9 : 0;

  return Math.round(item.baseValue * demandMultiplier);
}
```

### 6. Media Deals (Fame-Based)
| Fame Level | Deal Type | Payment |
|------------|-----------|---------|
| 50+ | Local Interview | $2,000 |
| 65+ | National Interview | $10,000 |
| 80+ | Sponsorship | $5,000/week |
| 90+ | Movie Rights | $100,000 one-time |

**Media system tie-in:**
```typescript
function getMediaDealOptions(fame: number, country: Country): MediaDeal[] {
  const effects = calculateAllCombinedEffects(country);
  const media = effects.media;

  if (!media.journalismQuality || media.journalismQuality === 'propaganda') {
    return []; // State media doesn't pay for hero stories
  }

  // More media freedom = more deal options
  return generateDeals(fame, media.pressFreedom);
}
```

---

## EXPENSES (Tied to Combined Effects)

### 1. Character Salaries (Weekly)
**Tied to country GDP (living costs):**
```typescript
function getWeeklySalary(character: Character, country: Country): number {
  const effects = calculateAllCombinedEffects(country);
  const baseSalary = character.threatLevel * 500; // $500-$5000 base

  // Local cost of living
  const costOfLiving = country.gdpPerCapita / 50;

  // Merc system affects expectations
  const mercExpectations = effects.mercenaries.mercenariesAvailable ? 1.2 : 1.0;

  return Math.round(baseSalary * costOfLiving * mercExpectations);
}
```

| Character Threat Level | Base Salary | In USA (GDP 95) | In Somalia (GDP 5) |
|------------------------|-------------|-----------------|-------------------|
| 1 (Thug) | $500/week | $950/week | $50/week |
| 5 (Veteran) | $2,500/week | $4,750/week | $250/week |
| 10 (Elite) | $5,000/week | $9,500/week | $500/week |

### 2. Medical Costs
**Tied to combinedEffects.medical:**
```typescript
function getMedicalCost(injury: Injury, country: Country): number {
  const effects = calculateAllCombinedEffects(country);
  const medical = effects.medical;

  const baseCost = {
    light: 500,
    moderate: 2000,
    severe: 10000,
    critical: 25000,
  }[injury.severity];

  return Math.round(baseCost * medical.healthcareCost);
}
```

**Hospital tier affects recovery:**
| Hospital Tier | Recovery Multiplier | Available In |
|---------------|---------------------|--------------|
| 1 (Field) | 0.5x (slower) | Healthcare < 40 |
| 2 (Basic) | 0.75x | Healthcare 40-59 |
| 3 (Good) | 1.0x | Healthcare 60-79 |
| 4 (World Class) | 1.5x (faster) | Healthcare 80+ |

### 3. Safe House Rent
**Tied to combinedEffects.safeHouses:**
```typescript
function getSafeHouseRent(type: SafeHouseType, country: Country): number {
  const effects = calculateAllCombinedEffects(country);
  const sh = effects.safeHouses;

  return {
    flophouse: sh.flophouseCost,
    apartment: sh.apartmentCost,
    safehouse: sh.safehouseCost,
    fortress: sh.fortressCost,
  }[type];
}
```

### 4. Equipment Repair
**Tied to research tier (tech availability):**
```typescript
function getRepairCost(item: Item, country: Country): number {
  const effects = calculateAllCombinedEffects(country);
  const baseCost = item.value * 0.1; // 10% of value

  // High tech countries = cheaper repairs (parts available)
  const techDiscount = effects.research.techAvailability === 'cutting_edge' ? 0.5 :
                       effects.research.techAvailability === 'standard' ? 0.75 :
                       effects.research.techAvailability === 'limited' ? 1.0 : 1.5;

  return Math.round(baseCost * techDiscount);
}
```

### 5. Bribes
**Tied to combinedEffects.politics + police:**
```typescript
function getBribeCost(target: BribeTarget, country: Country): number {
  const effects = calculateAllCombinedEffects(country);

  switch (target) {
    case 'cop':
      return effects.police.canBeBribed ?
        Math.round(500 * effects.police.bribeCostMultiplier) : Infinity;
    case 'politician':
      return effects.politics.canBribePoliticians ?
        effects.politics.politicianBribeCost : Infinity;
    case 'judge':
      return effects.politics.canBribeJudges ?
        effects.politics.judgeBribeCost : Infinity;
    case 'border_guard':
      return effects.borders.bribeBorderGuards ?
        effects.borders.bribeCost : Infinity;
  }
}
```

### 6. Vehicle Costs
**Tied to border control (fuel smuggling) + economy:**
```typescript
function getVehicleCosts(vehicle: Vehicle, distance: number, country: Country): number {
  const effects = calculateAllCombinedEffects(country);

  const baseFuelCost = vehicle.fuelPerSector * distance;
  const localFuelPrice = effects.economy.priceMultiplier;

  // Smuggled fuel available in corrupt countries
  const smuggleDiscount = effects.borders.smugglerAvailable ? 0.7 : 1.0;

  return Math.round(baseFuelCost * localFuelPrice * smuggleDiscount);
}
```

---

## INVESTMENT SYSTEM (Country-Specific)

### Investment Types by Country Stats

| Investment | Requires | Return | Risk Factor |
|------------|----------|--------|-------------|
| **Local Business** | GDP > 30 | 3-8%/mo | Country stability |
| **Arms Dealing** | Corruption > 50, Military > 40 | 10-20%/mo | Law enforcement |
| **Real Estate** | GDP > 50 | 2-4%/mo | Very low |
| **Tech Startup** | Science > 60, Education > 50 | 0-40%/mo | High variance |
| **Black Market Fence** | Underworld standing > 60 | 15%/mo | Police raids |
| **Media Company** | MediaFreedom > 50, Fame > 60 | 5%/mo + fame boost | Reputation |

**Risk Calculation:**
```typescript
function calculateInvestmentRisk(investment: Investment, country: Country): number {
  const effects = calculateAllCombinedEffects(country);

  switch (investment.type) {
    case 'arms_dealing':
      // Risk = law enforcement - corruption
      return Math.max(0, country.lawEnforcement - country.governmentCorruption);
    case 'black_market_fence':
      return effects.blackMarket.policeRaidChance;
    case 'tech_startup':
      return 100 - effects.research.researchTier * 20;
    default:
      return 100 - effects.politics.stabilityRating;
  }
}
```

---

## STARTING MONEY (By Country)

**Tied to GDP Per Capita:**
```typescript
function getStartingMoney(country: Country): number {
  const baseAmount = 50000;
  const gdpMultiplier = country.gdpPerCapita / 50;

  return Math.round(baseAmount * gdpMultiplier);
}
```

| Country | GDP Per Capita | Starting Money |
|---------|----------------|----------------|
| USA | 95 | $95,000 |
| Germany | 85 | $85,000 |
| Brazil | 45 | $45,000 |
| Nigeria | 20 | $20,000 |
| Somalia | 5 | $5,000 |

**Starting money affects early game difficulty!**

---

## ECONOMY UI

### Financial Overview Panel
```
╔══════════════════════════════════════════╗
║  FINANCES                    Day 47      ║
╠══════════════════════════════════════════╣
║  Balance: $125,430                       ║
║  ▲ +$12,500 this week                    ║
╠══════════════════════════════════════════╣
║  INCOME (Weekly)                         ║
║  ├─ Missions............... $8,000       ║
║  ├─ Military Stipend....... $4,000       ║
║  ├─ Investments............ $2,500       ║
║  └─ Salvage................ $1,200       ║
║                         Total: $15,700   ║
╠══════════════════════════════════════════╣
║  EXPENSES (Weekly)                       ║
║  ├─ Salaries (4 chars)..... $3,200       ║
║  ├─ Base Upkeep............ $2,500       ║
║  ├─ Safe House (Lagos)..... $800         ║
║  └─ Vehicle Fuel........... $400         ║
║                         Total: $6,900    ║
╠══════════════════════════════════════════╣
║  NET: +$8,800/week                       ║
║  Runway: 18 weeks at current burn        ║
╚══════════════════════════════════════════╝
```

### Transaction Log
```typescript
interface Transaction {
  id: string;
  day: number;
  type: 'income' | 'expense';
  category: string;
  amount: number;
  description: string;
  relatedEntity?: string; // character, mission, item
}
```

---

## DATA STRUCTURE

```typescript
interface EconomyState {
  balance: number;

  // Income tracking
  weeklyIncome: {
    missions: number;
    stipends: Record<FactionType, number>;
    investments: number;
    salvage: number;
    bounties: number;
    media: number;
    other: number;
  };

  // Expense tracking
  weeklyExpenses: {
    salaries: number;
    baseUpkeep: number;
    safeHouses: number;
    medical: number;
    repairs: number;
    fuel: number;
    bribes: number;
    other: number;
  };

  // Investments
  investments: Investment[];

  // History for graphs
  history: {
    day: number;
    balance: number;
    income: number;
    expenses: number;
  }[];
}

interface Investment {
  id: string;
  type: InvestmentType;
  country: string;
  principal: number;
  currentValue: number;
  monthlyReturn: number;
  riskLevel: number;
  startDay: number;
}
```

---

## IMPLEMENTATION PRIORITY

1. **Time System** - Need this for everything else
2. **Basic Income/Expense** - Mission rewards, salaries
3. **Country Modifiers** - GDP affects everything
4. **Combined Effects Integration** - Wire to existing systems
5. **Investment System** - Late game money sink
6. **UI** - Financial dashboard
