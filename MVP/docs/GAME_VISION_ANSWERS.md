# SuperHero Tactics: Complete Vision Document

> **Source**: User brain dump - December 2024
> **Status**: CANONICAL - This is the definitive design vision

---

## THE CORE LOOP

### One Sentence Goal
**Empower your country, build a team that's ready for what comes after the 8-year mark.**

### What You're Actually Doing
- Gather resources
- Manage personnel
- Get good standing with the government
- Prepare for the transition (country → company)

### Play Session
- ~2 hours typical
- Think: Jagged Alliance 2, XCOM, Crusader Kings, Fallout

### Game Modes
- **Campaign**: Has an ending (8-year mark transition)
- **Sandbox**: Endless mode
- **Multiplayer**: Time travel to compete against others (mobile compatible)

---

## YOU WORK FOR A COUNTRY

This is NOT like XCOM where you control sectors. You work for a country.

### The Relationship
```
COUNTRY → gives you MISSIONS via HANDLER/LIAISON
COUNTRY → gives you monthly BUDGET
COUNTRY → tells you what to do (patrol this city, etc.)
YOU → execute missions, manage team, build reputation
```

### The Handler System
- Handler sends you emails (passive)
- Handler calls you (active/urgent)
- Handler might call asking "did you get my email from 2 days ago?"
- Handler has STATS that affect mission quality he can get you
- Handler can be CORRUPT
- You can REQUEST specific missions through handler
- Handler's stats determine success of your requests

### The Transition
- Start: Work for country
- Later: Become your own company
- Countries mix, you can recruit from anywhere
- United Nations involvement

---

## SECTORS VS CITIES

### What Sectors Are
- Grid cells on world map (20x10)
- Container for up to 4 cities
- You TRAVEL to sectors, then DRILL DOWN to cities
- Click sector with multiple cities → menu to specify destination

### What Cities Are
- Where your characters LIVE
- Where your BASE is located
- Where you DO STUFF
- Where events happen
- Has crime index, safety index, underworld activity

### City Selection Flow
```
Click Sector → See cities in sector (max 4) → Pick city → Character goes there
```

---

## THE 14 CHARACTER STATUSES

| Status | What They're Doing | Player Interaction |
|--------|--------------------|--------------------|
| **READY** | Idle, becoming familiar with city | Full control |
| **HOSPITAL** | Recovering from injuries | Wait |
| **INVESTIGATION** | Detective work | Check progress |
| **COVERT_OPS** | Secret missions abroad | Minimal - they're autonomous |
| **PERSONAL_LIFE** | Vacation, day job, family | None - they need this |
| **TRAINING** | Improving stats/skills | Wait for completion |
| **PATROL** | Roaming the city | Handler may require this |
| **OFF_THE_GRID** | Missing/captured/hiding | Unknown status |
| **ENGINEERING** | Building/repairing tech | Wait for completion |
| **RESEARCH** | Analyzing evidence, unlocking tech | Wait for completion |
| **TRAVEL** | In transit | Track on map |
| **RECRUIT** | Finding new team members | Choose where they look |
| **UNCONSCIOUS** | Temporarily incapacitated | Combat event |
| **DEAD** | Gone (but can be cloned) | Funeral, then clone window |

### Recruiting Locations
When a character goes to RECRUIT status, they can target:
- Police station
- Military base
- Civilian locations
- Based on their CONNECTIONS

---

## SECRET IDENTITY SYSTEM

| Has Secret Identity | Needs Personal Time? | Notes |
|---------------------|----------------------|-------|
| YES (superhero) | NO | Can work continuously |
| NO (soldier/public) | YES | Needs vacations |

- Soldiers and military can have secret identities
- Public figures need personal time and vacations
- Vacations boost MORALE

---

## MISSION SYSTEM

### Mission Sources
1. **Police** - Local crime, street level
2. **Military** - National defense, operations
3. **Special Forces** - Black ops, covert
4. **Underworld** - Criminal organizations (varies by region)
5. **Terrorism** - Ideological groups (different from underworld)

### Regional Differences
| Region | Primary Threat | Secondary |
|--------|----------------|-----------|
| South America | Underworld (Cartel) | Lower terrorism |
| Africa | Terrorism | Underworld |
| Middle East | Terrorism | Various |
| Europe | Mixed | Organized crime |
| North America | Underworld | Domestic terrorism |

### Underworld vs Terrorism
- **Underworld**: Tries to FIT IN with regular society
- **Terrorism**: Does NOT try to fit in, ideological

### Mission Flow
```
1. Handler sends EMAIL (passive)
2. You read email, see mission
3. You can ACCEPT or IGNORE
4. If ignore too long, handler CALLS (active)
5. Missions have TIME LIMITS
6. Consequences for ignoring
```

### Requesting Missions
```
You → Request specific mission type to Handler
Handler → Rolls based on his STATS
Success → You get the mission
Failure → "I'll see what I can do"
Corruption → Handler may sabotage or leak
```

---

## COMMUNICATION SYSTEM

### Passive Communication (Email)
- Mission briefings
- Handler updates
- News alerts
- Financial reports
- Investigation results

### Active Communication (Phone/Text)
- Urgent alerts
- Handler follow-ups ("did you get my email?")
- Character arrivals ("I'm here, waiting. What's up?")
- Emergency calls

### The Web Browser (In-Game Internet)
- News websites
- Mercenary pages
- Event stories
- World updates
- AI-generated content

### Newspapers
- Major events only
- "When something is THAT big"
- Physical newspaper visual

### Character Communication Flow
```
Character travels → Arrives → MESSAGE: "Arrived at [city]"
                           → Wait 1-2 hours
                           → TEXT: "I'm here waiting"
                           → Wait more
                           → PHONE CALL: "Yo, I'm here. What do you want me to do?"
```

---

## INVESTIGATION SYSTEM

### The Four Elements
1. **WHY** - Terrorism, Underworld, Conspiracy, etc.
2. **WHO** - Named suspect or unknown
3. **WHERE** - City, sector, location
4. **WHAT** - The actual crime/event

### How It Works
- Investigation starts with 1 of 3 elements known
- Player must figure out the rest
- Creates INFINITE investigation possibilities

### Investigation Stats
| Stat | Meaning |
|------|---------|
| **DANGER** | Physical risk to investigator |
| **DIFFICULTY** | How hard to solve |

### Reading the Stats
- High Danger + Low Difficulty = Quick but risky
- Low Danger + High Difficulty = Safe but time-consuming
- High both = Serious mission
- Low both = Easy training mission

---

## COMBAT TRIGGERS

### When Combat Starts
1. **Location Event** - Your characters are there when something happens
2. **Planned Assault** - You send team to a location
3. **Bar Fight** - Random encounter
4. **Investigation Gone Wrong** - Intel gathering leads to confrontation
5. **Ambush** - Enemy attacks you

### Player Choice
- You can choose to TAKE OVER the fight
- Or let AI handle it (auto-resolve)
- Can observe AI vs AI combat

### Combat Outcomes
| Outcome | What Happens |
|---------|--------------|
| **Victory** | Mission complete, loot, reputation |
| **Defeat** | Characters captured/killed/injured |
| **Retreat** | Escape via escape route (if possible) |
| **Surrender** | Depends on enemy faction relationship |

### Retreat System
- Escape routes marked on tactical map (colored grids)
- Need certain distance from enemy
- Success chance based on distance + stats

### Surrender System
- Depends on FACTION RELATIONSHIPS
- Some factions accept surrender
- Some execute prisoners
- Some take hostages

---

## CHARACTER DEATH & CLONING

### Death Flow
```
Character dies → Funeral → Clone window opens → Timer starts
                        → If cloned in time: Character returns
                        → If timer expires: Permanent death
```

### Cloning Rules
- Must be done within time limit
- Depends on how they died
- Some deaths unrecoverable
- Cloning tech varies by country

### Captured Characters
- Status becomes OFF_THE_GRID
- Location unknown
- Can be rescued
- Can escape
- Can be turned/betrayed

---

## THE CALENDAR SYSTEM

### Why It's Needed
- Schedule meetings (president, government officials)
- Track mission deadlines
- Plan character activities
- See upcoming events
- Manage vacations

### Calendar Events
- Government meetings
- Mission deadlines
- Character return dates
- Vacation schedules
- World events
- Handler check-ins

---

## BASE SYSTEM

### Starting Base
- Player STARTS with a base
- Located in chosen city
- Quality based on country's military budget

### Future Expansion
- Can have SATELLITE bases
- Choose base location within country
- Different cities = different base styles

### Base Rooms (Future)
- Training Room
- Armory
- Research Lab
- Robotics Lab
- Medical Bay
- Prison/Holding cells
- Living quarters

### Base Attacks
- Enemies can attack while you're away
- AUTO-RESOLVE based on defenses
- Stash/inventory at risk

---

## BUDGET & ECONOMY

### Monthly Budget
- Country gives you budget
- Covers: Fuel, salaries, equipment, operations
- Can be increased through reputation

### Budget Breakdown (Cascading)
```
Total Budget
├── Fuel
├── Salaries
├── Equipment
├── Operations
└── Discretionary
```

### Special Deals
- Oil companies → Free fuel (but they want favors)
- Corporations → Sponsorship
- Other countries → Alliance benefits

---

## TRAVEL SYSTEM

### Costs
- Fuel (costs money)
- Time
- Risk (random events possible)

### Travel Flow
```
Select characters → Assign to vehicle → Choose destination
                                      → Travel begins
                                      → Arrival message
                                      → Waiting period
                                      → Character texts
                                      → Character calls
```

---

## CHARACTER TYPES

### Categories
1. **Scientists** - Research, analysis
2. **Engineers** - Building, repairs
3. **Soldiers** - Combat, security
4. **Superpowered** - Powers, special abilities

### No Hard Limit
- Can have 50+ characters
- Different types serve different purposes
- Can overlap (soldier with powers)

### Character Progression
- Send to EDUCATION for skills
- TRAINING for stats
- SURGERY for augmentation (implants, augmented arm)
- CLONING if they die

---

## IMPLANTS & AUGMENTATION

### Options
- Augmented limbs
- Enhanced senses
- Combat implants
- Medical implants

### Surgery System
- Requires medical facility
- Recovery time
- Cost
- Permanent modification

---

## FACTION RELATIONSHIPS

### Types of Factions
- Countries (government)
- Underworld organizations
- Terrorist groups
- Corporations
- Other superhero teams

### Relationship Effects
- Mission availability
- Surrender acceptance
- Trade deals
- Intel sharing
- Combat behavior

---

## THE THREE MOST IMPORTANT MVP FEATURES

1. **MOVEMENT SYSTEM**
   - Put characters in vehicles
   - Send to countries/cities
   - Track travel progress
   - Arrival notifications

2. **LIFE CYCLE SYSTEM**
   - Characters do things based on status
   - Scheduled events
   - Passive activities
   - Time-based progression

3. **COMMUNICATION SYSTEM**
   - Emails (passive)
   - Texts (waiting status)
   - Phone calls (urgent)
   - News/Web (world events)

---

## THE BIG PICTURE VISION

### What This Game Actually Is
> "It's not just a game. It's a world."

### The AI/LLM Integration
- AI generates dialogue
- AI creates modifiers and balances
- AI runs playtests
- LLM agents create stories
- Local LLM generates narrative you play in
- Infinite gameplay, infinite stories

### Data-Driven Design
```
BASE STATS + MODIFIERS → Applied to → STORIES/EVENTS/WEAPONS
                      → Creates → Infinite content
                      → AI can → Generate text, balance, test
```

### Living World Features
- People get married
- People have kids
- Time passes (aging system)
- Careers progress
- Cities change
- World events accumulate

---

## QUICK REFERENCE: WHAT TO BUILD FIRST

### Phase 1: Movement
- [ ] Characters can be assigned to vehicles
- [ ] Vehicles travel to sectors/cities
- [ ] Travel shows on map
- [ ] Arrival messages work

### Phase 2: Life Cycle
- [ ] Status system working (14 statuses)
- [ ] Time progression affects status
- [ ] Characters do things while in status
- [ ] Status expiration/completion

### Phase 3: Communication
- [ ] Email system (send/receive)
- [ ] Text messages (character → player)
- [ ] Phone calls (urgent alerts)
- [ ] News browser (world events)

### Phase 4: Handler System
- [ ] Handler character exists
- [ ] Handler sends missions via email
- [ ] Handler calls for follow-up
- [ ] Handler stats affect missions

### Phase 5: Investigations
- [ ] WHY/WHO/WHERE/WHAT framework
- [ ] Danger/Difficulty ratings
- [ ] Progress tracking
- [ ] Results generation

---

*Document Version 1.0 - December 2024*
*This is the canonical vision document for SuperHero Tactics*
