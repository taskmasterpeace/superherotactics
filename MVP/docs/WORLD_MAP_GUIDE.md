# SuperHero Tactics: World Map Layer Guide

> **Purpose**: Reference document for the strategic world map layer. Designed to be converted into an infographic.

---

## QUICK VOCABULARY

| Term | Definition |
|------|------------|
| **Sector** | One cell on the 20x10 world grid (A1-T10). Contains multiple cities. |
| **City Familiarity** | 0-100% knowledge of a city. Higher = better investigation, patrol, recruitment. |
| **Status** | What a character is currently doing (14 possible states). |
| **Origin** | Character type (1-9). Determines what happens at 0 HP. |
| **Threat Level** | Power tier (1-9). Higher = more dangerous/expensive. |
| **Fame** | 0-5000. Earned through patrols/missions. Used to recruit. |
| **DR** | Damage Resistance. Armor stopping power. |
| **AP** | Action Points. Spent during tactical combat. |
| **LSW** | "Limited Super-human Warfare" - superhuman activity policies. |

---

## THE 14 CHARACTER STATUSES

Characters can only be in ONE status at a time.

### IDLE STATES
| Status | Icon | What It Does |
|--------|------|--------------|
| **READY** | `[READY_ICON]` | Awaiting orders. Can be assigned to any task. |
| **PERSONAL_LIFE** | `[PERSONAL_ICON]` | Day job, family. Recovers morale. Can't be interrupted. |

### ACTIVE OPERATIONS
| Status | Icon | What It Does | Outcome |
|--------|------|--------------|---------|
| **PATROL** | `[PATROL_ICON]` | Roaming a city | +Fame, +City Familiarity, Random encounters |
| **INVESTIGATION** | `[INVESTIGATE_ICON]` | Detective work in HOME country | Uncover intel, find hideouts |
| **COVERT_OPS** | `[COVERT_ICON]` | Investigation in FOREIGN country | Same as above, but riskier |
| **RECRUIT** | `[RECRUIT_ICON]` | Using Fame to find vigilantes | New team members |
| **TRAINING** | `[TRAINING_ICON]` | Improve stats, practice martial arts | +Stats, maintain belt rank |
| **RESEARCH** | `[RESEARCH_ICON]` | Analyze evidence, unlock tech | Tech tree progress, intel |
| **ENGINEERING** | `[ENGINEERING_ICON]` | Build/repair suits, robots, gadgets | Equipment creation |

### MOVEMENT
| Status | Icon | What It Does |
|--------|------|--------------|
| **TRAVEL** | `[TRAVEL_ICON]` | In transit between sectors | Moving on world map |

### INCAPACITATED
| Status | Icon | What It Does | Duration |
|--------|------|--------------|----------|
| **HOSPITAL** | `[HOSPITAL_ICON]` | Recovering from 0 HP (Origin 1-4 only) | Days based on injury |
| **UNCONSCIOUS** | `[UNCONSCIOUS_ICON]` | Temporary KO during combat | Minutes to hours |
| **OFF_THE_GRID** | `[HIDING_ICON]` | Hiding from authorities/enemies | Until safe |
| **DEAD** | `[DEAD_ICON]` | Permadeath. Character gone forever. | Permanent |

---

## THE 9 ORIGIN TYPES

Origin determines what happens when a character reaches 0 HP.

| Origin | Name | At 0 HP | Recovery |
|--------|------|---------|----------|
| **1** | Skilled Human | HOSPITAL | Days in med bay |
| **2** | Altered Human | HOSPITAL | Days in med bay |
| **3** | Tech Enhancement | HOSPITAL | Days + repair time |
| **4** | Mutated Human | HOSPITAL | Days in med bay |
| **5** | Spiritual Enhancement | RESPAWN | Returns after time |
| **6** | Robotic | REBUILD | Can be rebuilt if parts saved |
| **7** | Symbiotic | REGENERATE | Recovers automatically |
| **8** | Alien | VARIES | Depends on alien type |
| **9** | Unknown | MYSTERY | Unpredictable |

---

## CITY FAMILIARITY SYSTEM

Every character has knowledge of cities (0-100%).

### How Familiarity Works
```
Birth City = 100% (always)
Visited Cities = 30-90% (based on time spent)
Never Visited = 0%
```

### Familiarity Decay
- Cities you don't visit DECAY over time
- Birth city NEVER decays
- Patrol in a city to maintain/increase familiarity

### Familiarity Bonuses
| Familiarity | Investigation | Patrol | Recruitment | Navigation |
|-------------|---------------|--------|-------------|------------|
| 0-25% | -50% | -30% | Can't recruit | Get lost often |
| 26-50% | -25% | -15% | -25% | Occasional wrong turns |
| 51-75% | Normal | Normal | Normal | Know main routes |
| 76-100% | +25% | +15% | +25% | Know shortcuts |

### Bell Curve Distribution
Most characters know few cities:
- **50%** of characters know 1-2 cities
- **35%** of characters know 3-4 cities
- **15%** of characters know 5-7 cities

### Travel Patterns
- **70%** of people have NEVER left their country
- **30%** who traveled usually went to SAME CULTURE region
- Culture codes group similar regions (14 total)

---

## BASE QUALITY LEVELS (Military Budget)

Base quality is determined by the country's **Military Budget** (0-100 scale).
Higher military budget = better access to equipment, facilities, and tech.

| Level | Budget Range | Base Type | Equipment Access | Vibe |
|-------|-------------|-----------|------------------|------|
| **SCRAPPY** | 21-36 | Makeshift HQ | Salvaged, improvised | Underground resistance |
| **FUNCTIONAL** | 37-48 | Standard facility | Reliable, proven | Professional operation |
| **HIGH-TECH** | 49-90 | Military-grade | Cutting-edge, advanced | Elite black ops |

### Top 5 SCRAPPY Countries (Lowest Military Budget)
1. Sao Tome and Principe (Budget: 21)
2. Belize (Budget: 24)
3. Somalia (Budget: 25)
4. Guinea-Bissau (Budget: 25)
5. Solomon Islands (Budget: 25)

### Top 5 FUNCTIONAL Countries (Mid Military Budget)
1. Lithuania (Budget: 40)
2. Slovenia (Budget: 40)
3. Yemen (Budget: 41)
4. Hong Kong (Budget: 41)
5. Turkmenistan (Budget: 41)

### Top 5 HIGH-TECH Countries (Highest Military Budget)
1. United States (Budget: 90)
2. China (Budget: 86)
3. Japan (Budget: 82)
4. Russia (Budget: 81)
5. India (Budget: 80)

---

## BASE TYPES BY CITY TYPE

Your base appearance/capabilities depend on the city you're in.

| City Type | Base Style | Special Bonus |
|-----------|------------|---------------|
| **Political** | Government building, embassy | +Diplomacy, Intel access |
| **Military** | Bunker, armory, barracks | +Training, Weapons |
| **Industrial** | Factory, warehouse | +Engineering, Vehicles |
| **Financial** | Office tower, penthouse | +Funding, Contacts |
| **Cultural** | Historic building, museum | +Recruitment, Cover |
| **Tourist** | Hotel, resort | +Disguise, Escape routes |
| **Port** | Dockside warehouse | +Smuggling, Sea travel |
| **Tech Hub** | Data center, lab | +Research, Hacking |

---

## TIME SYSTEM

Game time flows when not paused.

### Time Units
```
1 Game Day = 24 Game Hours
1 Game Hour = 60 Game Minutes
```

### Time of Day Effects
| Period | Hours | Effects |
|--------|-------|---------|
| **Morning** | 6:00-12:00 | Normal visibility, civilians active |
| **Noon** | 12:00-18:00 | Peak activity, harder to hide |
| **Evening** | 18:00-22:00 | Reduced visibility, crime increases |
| **Night** | 22:00-6:00 | Low visibility, stealth bonus |

### Activity Durations
| Activity | Duration |
|----------|----------|
| Patrol (1 shift) | 8 hours |
| Investigation | 4-24 hours |
| Training session | 4 hours |
| Travel (per sector) | 6 hours (walking) |
| Hospital recovery | 1-30 days |

---

## TRAVEL SYSTEM

### Speed by Transport
| Method | Sectors/Hour | Notes |
|--------|--------------|-------|
| Walking | 0.17 (6 hrs/sector) | Always available |
| Ground Vehicle | 0.5-1.0 | Roads required |
| Aircraft | 2.0-4.0 | Need airport/helipad |
| Sea Vehicle | 0.3-0.8 | Water sectors only |
| Teleport (Power) | Instant | Rare power |

### Travel Time Formula
```
Time = Distance (sectors) × Base Time / Vehicle Speed
```

---

## PRIMARY STATS (7 Stats)

Every character has 7 primary stats (1-100 scale).

| Stat | Abbreviation | Used For |
|------|--------------|----------|
| **Melee** | MEL | Hand-to-hand combat accuracy |
| **Agility** | AGL | Dodge, movement, initiative |
| **Strength** | STR | Damage, carry weight, knockback |
| **Stamina** | STA | AP pool, fatigue resistance |
| **Intelligence** | INT | Investigation, research, hacking |
| **Instinct** | INS | Perception, ambush detection |
| **Constitution** | CON | HP, injury resistance |

### Stat Ratings
| Range | Rating | Description |
|-------|--------|-------------|
| 1-20 | Poor | Below average civilian |
| 21-40 | Average | Normal human |
| 41-60 | Good | Trained professional |
| 61-80 | Excellent | Elite operative |
| 81-100 | Superhuman | Peak/enhanced |

---

## SECONDARY STATS

| Stat | Range | Description |
|------|-------|-------------|
| **Fame** | 0-5000 | Public recognition. Earn from patrols, missions. Spend to recruit. |
| **Wealth** | $0-∞ | Personal money. Separate from team budget. |
| **Health** | Current/Max | Hit points. 0 = incapacitated (see Origin). |
| **Shield** | 0-Max | Energy shield (if equipped). Absorbs damage before HP. |
| **DR** | 0-100 | Damage Resistance from armor. Reduces incoming damage. |
| **Morale** | 0-100 | Mental state. Low = desertion risk. |
| **Fatigue** | 0-100 | Tiredness. High = stat penalties. |

---

## WORLD MAP GRID

The world is divided into a **20 column × 10 row** grid.

### Sector Naming
- Rows: A-J (top to bottom)
- Columns: 1-20 (left to right)
- Example: **E12** = Row E, Column 12

### What's In Each Sector
- Multiple cities (from 1050 total)
- Country territories
- Terrain type (affects travel)
- Points of interest

---

## LSW (SUPERHUMAN) POLICIES

Each country has different superhuman regulations.

| Policy | What It Means |
|--------|---------------|
| **BANNED** | Superhuman activity illegal. Vigilantes hunted. |
| **REGULATED** | Must register. Licensed heroes allowed. |
| **LEGAL** | Open superhuman activity. Wild west. |

### Consequences
- **Banned Countries**: Covert ops only, high arrest risk
- **Regulated Countries**: Need to work with authorities or hide
- **Legal Countries**: Open operations, but more competition

---

## CULTURE CODES (14 Regions)

Culture codes group similar regions for character generation and diplomacy.

| Code | Region | Countries Example |
|------|--------|-------------------|
| 1 | North Africa | Algeria, Egypt, Morocco |
| 2 | Central Africa | Congo, Cameroon, Nigeria |
| 3 | Southern Africa | South Africa, Zimbabwe |
| 4 | Central Asia | Kazakhstan, Uzbekistan |
| 5 | South Asia | India, Pakistan, Bangladesh |
| 6 | East & Southeast Asia | China, Japan, Vietnam |
| 7 | Caribbean | Jamaica, Cuba, Haiti |
| 8 | Central America | Mexico, Guatemala |
| 9 | Western Europe | UK, France, Germany |
| 10 | Eastern Europe | Russia, Poland, Ukraine |
| 11 | Oceania | Australia, New Zealand |
| 12 | South America | Brazil, Argentina |
| 13 | North America | USA, Canada |
| 14 | Middle East | Saudi Arabia, Iran, Israel |

---

## THREAT LEVELS (Power Tiers)

| Threat | Power Level | Examples |
|--------|-------------|----------|
| THREAT_1 | Street level | Trained human, basic gear |
| THREAT_2 | Enhanced | Peak human, minor powers |
| THREAT_3 | Superhuman | Flight, super strength |
| THREAT_4 | Major threat | City-level danger |
| THREAT_5 | Extreme | Regional threat |
| THREAT_6 | Catastrophic | National threat |
| THREAT_7 | Global | World-ending potential |
| THREAT_8 | Cosmic | Universal scale |
| THREAT_9 | Abstract | Reality-warping |

---

## KEY GAME LOOPS

### Daily Loop
```
Morning → Assign characters to activities
         ↓
Day     → Activities progress, random events
         ↓
Evening → Review results, plan next day
         ↓
Night   → Night missions, recovery, repeat
```

### Mission Loop
```
Intel → Investigation uncovers target
       ↓
Plan  → Assemble squad, equip, travel
       ↓
Execute → Tactical combat
         ↓
Aftermath → Loot, injuries, reputation
```

### Character Growth Loop
```
Recruit → Fame spent to find new members
         ↓
Train   → Improve stats, learn skills
         ↓
Equip   → Gear up from armory
         ↓
Deploy  → Send on missions
         ↓
Advance → Gain experience, unlock powers
```

---

## BASE BACKGROUND PLACEHOLDERS

For AI image generation (16:9 aspect ratio, pixel art style):

### SCRAPPY BASE (Military Budget 21-36)
```
[PLACEHOLDER: SCRAPPY_BASE_16x9]
Prompt: "Pixel art, 16:9, underground resistance hideout,
exposed pipes, salvaged military crates, dim industrial lighting,
makeshift war table with paper maps, concrete walls with graffiti,
old CRT monitors on wooden crates, tangled cables, ammo boxes,
sandbags, stolen weapons rack, rebel underground bunker aesthetic"
```

### FUNCTIONAL BASE (Military Budget 37-48)
```
[PLACEHOLDER: FUNCTIONAL_BASE_16x9]
Prompt: "Pixel art, 16:9, professional military operations center,
standard issue equipment, multiple security monitors,
fluorescent lighting, metal desks with radios,
weapons locker, tactical planning board, filing cabinets,
clean but utilitarian, organized military workspace,
camouflage netting, modest but effective command post"
```

### HIGH-TECH BASE (Military Budget 49-90)
```
[PLACEHOLDER: HIGHTECH_BASE_16x9]
Prompt: "Pixel art, 16:9, elite black ops command center,
polished floors, holographic tactical displays,
wall of high-tech screens showing global intel,
clean white and blue military architecture,
advanced medical bay visible, weapons R&D lab,
sleek minimalist design, blue LED accent lighting,
futuristic military super-soldier facility"
```

---

## INFOGRAPHIC SECTIONS SUMMARY

When converting to infographic, use these sections:

1. **VOCABULARY BOX** - Key terms with icons
2. **STATUS WHEEL** - 14 statuses in a circle with icons
3. **ORIGIN CHART** - 9 origins with 0 HP outcomes
4. **FAMILIARITY METER** - Visual 0-100% bar with bonuses
5. **BASE TIERS** - 3 columns: Scrappy/Functional/High-Tech (by Military Budget)
6. **STAT HEXAGON** - 7 stats in a radar chart
7. **WORLD GRID** - Mini map showing sector system
8. **TIME CLOCK** - 24-hour cycle with activity windows
9. **GAME LOOPS** - Flowchart arrows showing progression

---

*Document Version 1.0 - December 2024*
*For SuperHero Tactics by [Your Studio]*
