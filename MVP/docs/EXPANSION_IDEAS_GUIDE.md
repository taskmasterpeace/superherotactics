# SuperHero Tactics - Expansion Ideas Guide

*A narrative guide for connecting and expanding game systems*

---

## TS vs TSX - Quick Explanation

- **`.ts` files** = Pure TypeScript. Logic, data, types, utilities. No UI.
- **`.tsx` files** = TypeScript with JSX. React components with UI markup.

Rule of thumb:
- If it renders something on screen, use `.tsx`
- If it's just data/logic/types, use `.ts`

---

## What You Have Right Now

### Core Data (Ready to Leverage)

1. **1,050 Cities** - Each with:
   - Population, crime index, sector code
   - Country assignment, region
   - City type inference possible (Temple, Military, Political, etc.)

2. **168 Countries** - Each with:
   - LSW status, military strength, political influence
   - President names, capitals
   - Election years (new system)

3. **70+ Weapons** - Full range brackets, damage types, AP costs

4. **50+ Armor** - DR values, mobility impacts

5. **381 Sound Effects** - Categorized, ready for mapping

6. **24 Vehicles** - Now with HP, fuel, DR, maintenance

7. **Personality System** - 16 MBTI types mapped to 7 behavioral traits

---

## Expansion Ideas - Connecting Systems

### 1. University System

**Concept**: Cities with high population and educational indicators have universities.

**Implementation Path**:
- Filter cities by population > 500,000
- Add `hasUniversity` flag or generate from city name patterns
- Universities offer: Training courses, research projects, recruitment of specialists
- Some courses take game-time to complete (2-3 weeks in-game)

**Integration Points**:
- Characters gain skills/stats from courses
- Research unlocks equipment, gadgets, powers
- Recruit specialists (scientists, hackers, medics)

---

### 2. City Type Effects

You mentioned these types: Temple, Military, Political, Industrial, Resort, Seaport, Mining, Educational, Company Town

**How to Infer**:
- **Military**: Cities with "Fort", "Base", military presence keywords
- **Political**: Capital cities, high political influence countries
- **Industrial**: High population, manufacturing regions
- **Seaport**: Coastal cities (infer from country's coastline data)
- **Mining**: Resource-rich regions (South Africa, Chile, Australia outback)
- **Educational**: University cities, "College" in name
- **Temple**: Historical/religious significance (Varanasi, Jerusalem, Mecca)
- **Resort**: Coastal, low crime, tourist destinations
- **Company Town**: Tech hubs (Silicon Valley, Shenzhen)

**Effects by Type**:
- Military: Better weapon prices, soldier recruitment
- Political: Influence missions, assassination targets
- Industrial: Armor/vehicle manufacturing
- Seaport: Smuggling opportunities, naval missions
- Mining: Resource extraction, labor disputes
- Educational: Training, research
- Temple: Mystical elements, cult investigations
- Resort: Undercover ops, celebrity protection
- Company: Tech gadgets, corporate espionage

---

### 3. Investigations Expansion

**Current**: Basic investigation templates exist

**Expand With**:
- Email chains (breadcrumb trails of evidence)
- Contact network (informants in each city)
- Evidence board (connecting clues visually)
- Time pressure (leads go cold)

**Integration Points**:
- City familiarity affects investigation success
- Fame opens doors (people recognize you, talk)
- Personality affects interrogation style

---

### 4. Base Building

**Concept**: XCOM-style underground/building base

**Room Types**:
- Barracks (character housing, morale)
- Armory (equipment storage, upgrade benches)
- Med Bay (injury recovery, augmentation)
- Research Lab (unlock new tech)
- Training Room (skill improvement)
- Prison (captured enemies, interrogation)
- Hangar (vehicle storage, maintenance)
- Power Plant (base power)
- Defense (auto-turrets, walls)

**Implementation Path**:
- Grid-based layout (10x10 or 15x15)
- Rooms cost money and build time
- Can be raided by enemies
- Multiple bases in different countries

---

### 5. Faction Relations

**Current**: Countries have LSW status

**Expand With**:
- Reputation per country (Hero/Vigilante/Criminal/Terrorist)
- Faction standings (Police, Military, Underworld, Corps)
- Standing affects: missions available, prices, safe houses

**Integration Points**:
- Mission outcomes affect standings
- High standing = better contracts, recruitment
- Low standing = bounty hunters, police pursuit

---

### 6. Economy Loop

**Current**: Budget exists, missions pay

**Expand With**:
- Operating costs (salaries, base upkeep, vehicle fuel)
- Income streams (contracts, salvage, investments)
- Black market for rare items
- Bribes and "donations" to factions

**Integration Points**:
- Vehicle fuel costs money
- Injuries require medical bills
- Training costs tuition
- Base rooms need maintenance

---

### 7. News System

**Current**: Election system generates newspaper events

**Expand With**:
- Dynamic news generation based on player actions
- World events affecting missions (wars, disasters, political changes)
- Player fame creates headlines
- News affects public perception, recruitment

**Integration Points**:
- Big combat victories = news coverage
- Failed missions = negative press
- Elections change country policies
- Villain attacks create opportunities

---

### 8. Character Depth

**Current**: Stats, personality, health, equipment

**Expand With**:
- Relationships between characters (friendships, rivalries)
- Personal goals (revenge, redemption, glory)
- Backstories affecting missions (former enemies, old friends)
- Mental health (PTSD, burnout, morale)

**Integration Points**:
- Pair compatible personalities for team bonuses
- Address conflicts before they blow up
- Characters with history in a city get bonuses
- R&R time prevents burnout

---

### 9. Time System

**Current**: Day counter, travel time

**Expand With**:
- Day/night cycle affects missions
- Seasons/weather affecting travel
- Calendar events (holidays, elections, anniversaries)
- Character aging (years of service)

**Integration Points**:
- Night missions = stealth bonuses
- Winter in Russia = travel penalties
- Election day = high security
- Veterans get experience bonuses

---

### 10. Powers & Superpowers

**Current**: Basic power list

**Expand With**:
- Power trees (basic > advanced > mastery)
- Power combinations (fire + wind = firestorm)
- Power costs (energy, health, materials)
- Origin stories affecting power growth

**Integration Points**:
- Threat level affects power availability
- Training unlocks new abilities
- Equipment augments powers
- Powers have combat and strategic uses

---

## Quick Wins (Low Effort, High Impact)

1. **City Type Assignment**: 2-3 hours to classify cities, immediate gameplay variety

2. **University Flag**: 30 min to add, opens training gameplay

3. **Fuel Consumption**: Already have fuel stats, just need usage calculation

4. **News Headlines**: Template system, generate from events

5. **Relationship Tracker**: Simple compatibility matrix between characters

---

## Next Steps Priority

1. **Character Creation Wizard** - Let players build custom characters
2. **Quick Combat Balancing** - Run simulations, tune damage/armor
3. **City Types** - Classify and add gameplay effects
4. **Investigation Flow** - Email chain system with clues

---

*Remember: You have the data. The systems exist. It's about connecting them now.*
