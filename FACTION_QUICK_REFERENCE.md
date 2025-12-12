# Faction Relations - Quick Reference

**One-page cheat sheet for the faction system**

---

## Standing Scale

```
+100 ┃ ████████ HERO ████████             (75-100)  🟢 Max benefits
 +75 ┃
     ┃ ██ RESPECTED ██                   (50-74)   🟦 Good benefits
 +50 ┃
     ┃ NEUTRAL+                          (25-49)   ⚪ Some benefits
 +25 ┃
     ┃ Unknown                           (0-24)    ⚫ No benefits
   0 ┃ ═══════════════════════════════════════════════════════════
     ┃ Suspicious                        (-1 to -24)    🟡 Minor penalties
 -25 ┃ ⚠️ BOUNTY: Minor ($10k)
     ┃ VIGILANTE                         (-25 to -49)   🟠 Moderate penalties
 -50 ┃ ⚠️ BOUNTY: Major ($50k)
     ┃ ██ CRIMINAL ██                    (-50 to -74)   🔴 Severe penalties
 -75 ┃ ⚠️ BOUNTY: Extreme ($250k)
     ┃ ████ TERRORIST ████               (-75 to -100)  🟣 Kill on sight
-100 ┃
```

---

## 6 Faction Types (Per Country)

| Faction | Starts At | Offers | Angers Them | Pleases Them |
|---------|-----------|--------|-------------|--------------|
| 👮 **POLICE** | LSW based | Investigations, gang missions, safe houses | Excessive force, underworld work | Solving crimes, non-lethal captures |
| ⚔️ **MILITARY** | Gov type | Combat missions, vehicles, equipment | Sabotage, stealing | Completing contracts, anti-terrorism |
| 🏛️ **GOVERNMENT** | +50 (home) | Covert ops, intel, immunity | Exposing secrets, working for rivals | Assassinations, extractions |
| 📰 **MEDIA** | Media freedom | Fame bonuses, interviews, smear campaigns | Attacking press, censorship | Interviews, heroic actions |
| 🏢 **CORPORATIONS** | GDP based | Advanced tech, private contracts | Property damage, stealing prototypes | Contracts, purchases |
| 🎭 **UNDERWORLD** | Crime index | Black market, smuggling, laundering | Police missions against them | Smuggling, eliminating rivals |

---

## Standing Effects

### Equipment Access

| Standing | Tier | Examples |
|----------|------|----------|
| +75 | Classified | Experimental tech, prototypes |
| +50 | Military-Grade | Sniper rifles, heavy armor, explosives |
| +25 | Advanced | Assault rifles, tactical gear |
| 0+ | Basic | Pistols, basic armor |

### Price Modifiers

| Standing | Buy Price | Sell Price |
|----------|-----------|------------|
| +75 to +100 | **-25%** | **+20%** |
| +50 to +74 | -10% | +10% |
| +25 to +49 | Normal | Normal |
| 0 to +24 | +15% | -10% |
| Negative | +30-75% | -30-50% |

### Safe Houses

Unlock at: Police 50+, Military 60+, Gov 70+, Corps 40+, Underworld 30+, Media 50+

**Benefits:** Free healing, storage, fast travel (if 75+), mission briefings

---

## Country Reputation

**Aggregate = Average of all 6 factions**

### Border Control

| Aggregate Rep | Travel Time | Notes |
|---------------|-------------|-------|
| +75 to +100 | **-50%** | Fast lanes, air support |
| +50 to +74 | -25% | Expedited |
| +25 to +49 | Normal | Standard |
| 0 to +24 | Normal | Unknown traveler |
| -1 to -24 | +25% | Searches, paperwork |
| -25 to -49 | +50% | Thorough searches |
| -50 to -74 | +100% | Border hassles, bribes |
| -75 to -100 | **BLOCKED** | Must smuggle in |

---

## Bounty System

### Triggers

| Standing | Bounty Level | Amount | Hunters | Encounter Chance |
|----------|--------------|--------|---------|------------------|
| -25 to -49 | Minor | $10,000 | 1-3 thugs (TL 1-2) | 10%/day in country |
| -50 to -74 | Major | $50,000 | 4-8 mercs (TL 3-4) | 25%/day in country |
| -75 to -100 | Extreme | $250,000 | 8-15 elites (TL 5-7) | 50%/day anywhere |

### Ending Bounties

- Raise standing above -25
- Pay 2x bounty amount
- Leave country for 30+ days (becomes inactive)
- Defeating hunters reduces bounty by 25% (doesn't remove)

---

## Faction Conflicts

### Natural Enemies

Standing with one **reduces** standing with other:

- Police ↔️ Underworld (high)
- Government ↔️ Terrorism (extreme)
- Military ↔️ Rebellion (high)

### Allies

Standing with one **increases** standing with other:

- Police + Government (high)
- Military + Government (high)
- Corporations + Government (medium, if corrupt)

---

## Mission Sources by Faction

| Faction | Mission Types | Standing Required |
|---------|---------------|-------------------|
| Police | Investigate, Patrol, Gang Skirmish | 0+ |
| Military | Escort, Protect, Militia Skirmish, Capture & Hold | 0+ |
| Government | Assassinate, Extract, Rescue, Infiltrate | 25+ (covert) |
| Corporations | Protect, Escort, Sabotage (rivals) | 0+ |
| Media | Investigate (exposés), Patrol (publicity) | 25+ |
| Underworld | Assassinate, Sabotage, Smuggling | 0+ (neg OK) |

**Mission Difficulty Unlocks:**
- Easy (1-2): 0+ standing
- Medium (3): 25+ standing
- Hard (4): 50+ standing
- Extreme (5): 75+ standing

---

## Example Reputation Changes

### Police Gang Takedown Mission

- Police: **+15**
- Government: +5
- Underworld: **-20**
- Media: +10 (if public)

### Underworld Smuggling Mission

- Underworld: **+20**
- Police: **-15**
- Government: -10
- Media: -25 (if exposed)

### Government Assassination Mission

- Government: **+35**
- Media: -15 (controversial)
- Military: +8 (allied faction)

---

## Playstyle Archetypes

### 🦸 The Clean Hero

**Actions:** Police/military missions, non-lethal, media friendly

**Result:**
- Police: +85
- Military: +70
- Media: +80
- Underworld: -65 (bounty!)

**Effects:** High fame, cheap equipment, underworld bounties

---

### 🕵️ The Pragmatist

**Actions:** All factions, balance police + underworld, avoid media

**Result:**
- All factions: +25 to +40
- No extreme standings

**Effects:** Access to all markets, no bounties, diplomatic

---

### 💰 The Mercenary

**Actions:** Highest bidder, corporations/underworld, kill indiscriminately

**Result:**
- Police: -70
- Underworld: +75
- Corporations: +60

**Effects:** $300k bounties, black market access, smuggling required

---

### 💣 The Terrorist

**Actions:** Sabotage, civilian kills, anti-government

**Result:**
- All factions: -75 to -100

**Effects:** $1M+ bounties, kill on sight, game over risk

---

## Implementation Checklist

### Phase 1: Core (Week 1-2)
- [ ] Data structures (`FactionStanding`, `Bounty`)
- [ ] Standing modification function
- [ ] Initialize 1008 faction entries (168 countries × 6 factions)
- [ ] UI: Faction screen

### Phase 2: Effects (Week 3-4)
- [ ] Mission availability gating
- [ ] Equipment tiers
- [ ] Price modifiers
- [ ] Safe houses
- [ ] Border control

### Phase 3: Missions (Week 5-6)
- [ ] Faction-specific missions
- [ ] Multi-faction reputation changes
- [ ] Dynamic mission spawning

### Phase 4: Bounties (Week 7-8)
- [ ] Bounty triggers
- [ ] Hunter squad generation
- [ ] Random encounters
- [ ] Bounty payoff

### Phase 5: Advanced (Week 9-10)
- [ ] Faction wars
- [ ] Membership system
- [ ] Reputation decay
- [ ] Smuggling

---

## Integration Files

- **Data:** `c:\git\sht\MVP\src\data\factionSystem.ts`
- **Countries:** `c:\git\sht\MVP\src\data\countries.ts` (168 countries)
- **Cities:** `c:\git\sht\MVP\src\data\cities.ts` (1050 cities, crime index)
- **Missions:** `c:\git\sht\MVP\src\data\missionSystem.ts` (extend with faction fields)
- **Store:** `c:\git\sht\MVP\src\stores\enhancedGameStore.ts` (add faction state)

---

**See:** `FACTION_RELATIONS_PROPOSAL.md` for full design details
