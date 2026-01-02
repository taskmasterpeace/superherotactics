# SuperHero Tactics - World Layer Interview

**Instructions**: Record yourself reading and answering these questions. Just talk through your thoughts - stream of consciousness is perfect. Reference question numbers so I can match your answers (like "A1, I want option B because...").

---

# PART 1: COMBAT MODES

The big question: You mentioned "instant combat" and "fast combat" that you can watch.

## A1. How many combat modes do you want?

- **A)** TWO modes - Instant (just get results) plus Full tactical (turn-by-turn)
- **B)** THREE modes - Instant, Fast (watch it auto-play), and Full tactical
- **C)** Something else?

## A2. For INSTANT combat, what does the player see?

- **A)** Just the results screen - who won, casualties, loot
- **B)** A quick 2-3 second combat flash animation, then results
- **C)** Brief text summary scrolling by like a combat log
- **D)** Nothing visible - time just passes and you get results

## A3. For FAST or AUTO combat, what speed options?

- **A)** Single speed, like 4x normal
- **B)** Multiple speeds - 2x, 4x, 8x, skip to end
- **C)** "Highlight reel" mode - only shows the hits, kills, and crits

## A4. Can players INTERRUPT fast combat to take manual control?

- **A)** Yes, any time - switches to full tactical immediately
- **B)** Only at the start of their turn
- **C)** No - once auto combat starts, it runs to completion

## A5. What determines which combat mode is available?

- **A)** Player always chooses before each mission
- **B)** Based on mission difficulty - easy missions allow auto, hard ones require manual
- **C)** Squad leader's tactical skill unlocks more options
- **D)** Always player's choice regardless of anything

## A6. For instant mode, how are results calculated?

- **A)** Pre-calculated based on power comparison - fast and deterministic
- **B)** Actually simulate the full combat invisibly - same randomness as playing it
- **C)** Hybrid - simulate key moments, calculate the rest

---

# PART 2: WORLD MAP

The world is a 40x24 grid with 222 sectors containing 1,050 cities across 168 countries.

## B1. Empty sectors - what are they?

Only 222 of 960 grid squares have cities. What about the rest?

- **A)** Traversable but empty - just terrain to cross
- **B)** Blocked or impassable - oceans, wastelands, no-go zones
- **C)** Can have random encounters, hidden bases, resource caches

## B2. Map visibility - fog of war?

- **A)** Player sees the entire world map always
- **B)** Fog of war until you've visited a sector
- **C)** Fog clears based on intel access or satellite coverage
- **D)** Different visibility depending on faction territory

## B3. How does selecting a sector work?

- **A)** Click a sector, get a popup with options like travel, scout, deploy
- **B)** Click to select sector, then use action buttons on the side
- **C)** Right-click context menu
- **D)** Drag and drop units onto sectors

## B4. Mini-map?

Should there be a mini-map always visible in corners, or just the full map screen when you open it?

## B5. Day and night on the world map?

- **A)** Terminator line showing which parts of Earth are in day vs night
- **B)** Whole map tints based on the player's current local time
- **C)** Each sector shows its own local time and lighting
- **D)** No visual representation - just a time display somewhere

## B6. Weather on the world map?

- **A)** Yes, weather that affects travel time, visibility, and combat
- **B)** Visual only - clouds and rain for flavor but no gameplay effect
- **C)** Not needed for this game

---

# PART 3: SQUADS AND TEAMS

## C1. How many squads can the player control at once?

- **A)** ONE squad - focus everything on that team
- **B)** TWO or THREE squads - small scale operations
- **C)** Unlimited squads - full strategy game scale
- **D)** Start with one, unlock more through progression

## C2. Maximum characters per squad?

- **A)** 4 characters - tight tactical team
- **B)** 6 characters - X-COM style
- **C)** 8 to 10 - larger operations
- **D)** Variable depending on mission type

## C3. Can one character be in multiple squads?

- **A)** No, exclusive - each character assigned to one squad only
- **B)** Yes, can be freely reassigned between missions
- **C)** Loan system - can temporarily assign with cooldowns

## C4. How do injuries affect squad availability?

- **A)** Injured characters completely unavailable until fully healed
- **B)** Injured can still deploy but with reduced stats
- **C)** Player chooses - rest them or deploy injured with risk of making it worse

## C5. Do squads need a home base?

- **A)** Yes, must return to base between missions
- **B)** No, squads can operate indefinitely in the field
- **C)** Need resupply after a certain number of missions
- **D)** Depends on vehicle and logistics setup

## C6. Squad morale - how deep?

- **A)** Simple - High, Medium, Low affecting combat stats
- **B)** Complex - individual relationships, personality compatibility (MBTI system already in code)
- **C)** Skip morale for now, add it later

## C7. Can a squad split up during a mission?

- **A)** No, always stay together as a unit
- **B)** Yes, can split for different tactical objectives
- **C)** Only if they have the right equipment like comm gear

---

# PART 4: VEHICLES

The code already has 24 vehicle types defined - motorcycles, cars, trucks, helicopters, jets, boats, even tanks.

## D1. How many vehicle types for the first version?

- **A)** 3 to 5 core types - like car, helicopter, jet
- **B)** 10 or more for variety
- **C)** All 24 from the start

## D2. How do players get vehicles?

- **A)** Start with a fleet, can't get more
- **B)** Purchase from markets
- **C)** Steal or capture during missions
- **D)** All of the above

## D3. Can vehicles be damaged?

- **A)** Yes - they have HP, need maintenance, can be destroyed
- **B)** No - vehicles are just transportation, not tracked
- **C)** Only damaged during combat, not from travel

## D4. Fuel system?

- **A)** Yes - fuel limits range, need to refuel
- **B)** No - unlimited range within vehicle specs
- **C)** Abstracted into general operational costs

## D5. Can vehicles fight in combat?

- **A)** Transport only - just get you there
- **B)** Vehicle weapons usable in tactical combat
- **C)** Some vehicles like tanks and gunships are full combat units
- **D)** Vehicles just for insertion and extraction, not mid-battle

## D6. Multiple vehicles per mission?

- **A)** One vehicle per squad
- **B)** Multiple vehicles allowed - convoy operations
- **C)** Vehicle drops you off then leaves the area

## D7. Vehicle crews?

- **A)** Vehicles need dedicated pilots or drivers
- **B)** Any character can operate any vehicle
- **C)** Skill-based - better pilots get better performance

---

# PART 5: TRAVEL

Currently travel is 6 hours per sector of distance.

## E1. Is 6 hours per sector the right speed?

- **A)** Yes, keep it as is
- **B)** Faster - 2 to 4 hours for ground, even less for air
- **C)** Slower - give travel more strategic weight
- **D)** Should vary by terrain, which is already designed but not hooked up

## E2. What happens DURING travel?

- **A)** Nothing - just wait for arrival
- **B)** Random encounters can happen
- **C)** Can use the laptop and do activities while traveling
- **D)** Gather intel about the destination en route

## E3. Can travel be interrupted or redirected?

- **A)** Yes - change destination anytime
- **B)** Yes, but with a time or fuel penalty
- **C)** No - once you start traveling, you're committed

## E4. Can multiple squads travel simultaneously?

- **A)** Yes, all tracked independently on the map
- **B)** Focus on one squad, others complete in background
- **C)** Only one squad can move at a time

## E5. Should terrain affect travel beyond just speed?

The code has terrain modifiers for speed. Should terrain also affect:

- **A)** Speed only
- **B)** Speed plus detection risk and fuel consumption
- **C)** Speed plus terrain-specific random events
- **D)** All of the above

---

# PART 6: THE LAPTOP INTERFACE

The laptop is like the player's phone or computer for managing everything.

## F1. Is the laptop the MAIN interface?

- **A)** Yes, the laptop is home base - everything accessed through it
- **B)** Laptop for strategic stuff, but combat and map are separate views
- **C)** Laptop is optional - can use direct menus instead

## F2. What apps should be on the laptop?

Read through this list and tell me which ones you want:

- Email - mission briefings, messages from contacts
- News Browser - public events, hidden intel
- Maps - world navigation
- Dossiers - character and faction information files
- Shop - buy equipment and vehicles
- Bank - finances and transactions
- Contacts - NPCs and handlers you know
- Calendar - upcoming events and deadlines
- Medical - hospital and recovery status
- Intel - investigation management
- Training - skill development
- Base Management - your headquarters
- Anything else you want?

## F3. Phone vs Laptop - different functions?

- **A)** Same apps, just different screen sizes
- **B)** Phone for quick info checks, laptop for full management
- **C)** Phone only for communications, laptop for everything else
- **D)** Just the laptop, no phone needed

## F4. Notifications - how do urgent events get your attention?

- **A)** Popup notifications that interrupt whatever you're doing
- **B)** Only notified when you're on the laptop or phone
- **C)** Inbox system - you check when you're ready
- **D)** Different urgency levels with different behaviors

## F5. Can players customize the laptop?

- **A)** Yes - wallpapers, app layouts, personalization
- **B)** No - keep it functional only
- **C)** Unlockable themes as rewards

---

# PART 7: MISSIONS

## G1. How are missions discovered?

- **A)** They automatically appear based on location and time
- **B)** Through contacts and handlers who offer jobs
- **C)** Through news articles and investigation
- **D)** All of the above

## G2. Mission briefings - how much info?

- **A)** Full intel - enemy count, map layout, all objectives
- **B)** Partial info - general idea with some unknowns
- **C)** Varies based on how much intel you've gathered

## G3. Can missions expire?

- **A)** Yes - time-limited opportunities that go away
- **B)** No - missions stay available until you complete them
- **C)** Mix - some are time-sensitive, some are permanent

## G4. What happens when you FAIL a mission?

- **A)** Just lose the reward, can retry later
- **B)** Reputation and fame penalties
- **C)** Situation escalates and gets worse
- **D)** Permanent consequences - targets escape forever, allies can die

## G5. Side objectives during missions?

- **A)** Just the main objective, keep it simple
- **B)** Optional bonus objectives for extra loot or intel
- **C)** Branching objectives with different outcomes

## G6. Mission chains - connected storylines?

- **A)** All standalone, unconnected missions
- **B)** Some missions connect into story arcs
- **C)** Main campaign storyline plus side missions

---

# PART 8: MONEY AND ECONOMY

## H1. Primary income source?

- **A)** Mission rewards only
- **B)** Territory control gives passive income
- **C)** Investments and businesses
- **D)** Mix of mission rewards and passive income

## H2. What costs money?

Tell me which of these should have costs:

- Equipment and vehicles
- Character salaries and upkeep
- Medical bills and recovery
- Base maintenance
- Travel and fuel
- All of them?

## H3. Multiple currencies?

- **A)** Single currency - just money or credits
- **B)** Money plus influence or favors as a second currency
- **C)** Money plus separate reputation per faction

## H4. Black market?

- **A)** Yes - separate shop for illegal gear with higher risk
- **B)** Integrated - legality just affects what's available where
- **C)** Skip this for now

## H5. Can the player go into debt?

- **A)** No - must have funds to spend
- **B)** Yes - with consequences like loan sharks or faction demands
- **C)** Emergency loans available from allies

---

# PART 9: TIME AND CALENDAR

## I1. How much time pressure should there be?

- **A)** Heavy - lots of timed events and deadlines
- **B)** Moderate - some time-sensitive stuff but mostly flexible
- **C)** Light - time is a resource, not a pressure

## I2. Calendar events?

- **A)** Random world events on specific dates
- **B)** Scheduled mission windows you need to hit
- **C)** Holidays and special occasions that affect gameplay
- **D)** All of the above

## I3. Do characters age over time?

- **A)** No aging - time is abstract
- **B)** Yes - characters age, can retire, eventually die of old age
- **C)** Just track injury recovery and training time

## I4. How does time pass between missions?

- **A)** Player always controls time speed
- **B)** Auto-advance to the next event or mission
- **C)** Daily activities that require decisions

---

# PART 10: FAME AND PUBLIC OPINION

## J1. Fame - per character or per organization?

- **A)** Per character - some heroes become more famous than others
- **B)** Organization or squad fame only
- **C)** Both individual and group fame

## J2. What does fame actually DO?

- **A)** Affects which missions become available
- **B)** Affects how NPCs react to you
- **C)** Affects government and law enforcement response
- **D)** All of the above

## J3. Can fame go negative - like infamy?

- **A)** Yes - villain path is possible with negative fame
- **B)** Fame just goes to zero, no infamy
- **C)** Reputation is separate from fame

## J4. Public opinion varies by country - how much does that matter?

- **A)** Critical - affects all operations in that country
- **B)** Flavor - news mentions it but minimal gameplay impact
- **C)** Unlocks or locks certain missions in that region

---

# PART 11: INVESTIGATIONS

## K1. How complex are investigations?

- **A)** Simple - find the target, complete the objective
- **B)** Complex - multiple leads, gathering clues
- **C)** Branching - discoveries open up new paths

## K2. Investigation timing?

- **A)** Progress happens over game time - hours and days
- **B)** Instant results when you take actions
- **C)** Mix - quick checks plus long surveillance operations

## K3. Can investigations fail?

- **A)** Yes - targets can escape, trails can go cold
- **B)** No failure, they just take longer
- **C)** Success rate based on difficulty and skills

---

# PART 12: FACTIONS AND TERRITORY

## L1. How many factions for the first version?

- **A)** 2 or 3 major factions
- **B)** 5 or 6 diverse factions
- **C)** Many small factions in each region

## L2. How complex are faction relationships?

- **A)** Simple - Allied, Neutral, or Hostile
- **B)** Numeric reputation score per faction
- **C)** Complex - multiple dimensions to each relationship

## L3. Can the player control territory?

- **A)** Yes - conquer and hold sectors
- **B)** Influence only, not direct control
- **C)** Skip territory control for now

## L4. Do AI factions act on their own?

- **A)** Yes - they expand, fight each other, make deals
- **B)** They only react to what the player does
- **C)** Static until the player engages with them

---

# PART 13: BASE BUILDING

## M1. How important is base building for the first version?

- **A)** Essential - need an operational headquarters
- **B)** Simple version - just upgrade slots
- **C)** Skip it for now, add later

## M2. One base or multiple?

- **A)** One main headquarters only
- **B)** Regional safe houses
- **C)** Full network of bases

## M3. What should the base have?

Tell me which of these matter most:

- Medical bay for healing
- Armory for equipment storage
- Training room for skills
- Lab for research and crafting
- Prison for holding captured enemies
- Vehicle bay for maintenance
- Communications for intel range
- Living quarters for morale
- Other facilities?

---

# PART 14: PROGRESSION

## N1. How do characters improve?

- **A)** XP and levels
- **B)** Skill trees
- **C)** Use-based - using an ability improves it
- **D)** Equipment-based only - no character growth

## N2. How does the organization progress?

- **A)** Unlock new features over time
- **B)** Reputation gates access to content
- **C)** Story-driven unlocks
- **D)** All of the above

## N3. Recruiting new characters?

- **A)** Hire from a pool anytime
- **B)** Discover through missions and events
- **C)** Create custom characters
- **D)** Mix of all methods

---

# PART 15: PRIORITIES

## O1. Rank these features for the first playable version

Which are must-haves, which are nice-to-haves, which can wait?

- Multiple combat modes (instant, fast, full)
- Full vehicle system with fuel and damage
- Multi-squad management
- Complete laptop interface
- Territory and faction control
- Base building
- Investigation system
- Economy and income loop

## O2. The core loop

In one sentence, what's the experience you want players to have in the first playable version?

## O3. How much content for a playable demo?

- **A)** 30 minutes - single mission arc
- **B)** 2 to 3 hours - short campaign
- **C)** 10 plus hours - full game slice

---

# FINAL THOUGHTS

## Anything else about your vision for the world layer?

## What games should I reference for inspiration?

You mentioned Jagged Alliance. What else?

## What's the ONE thing that MUST work or the game fails?

What's the dealbreaker?

---

*Just record yourself talking through all of this. Reference the question numbers when you can. Stream of consciousness is perfect - I'll organize your answers into a spec.*
