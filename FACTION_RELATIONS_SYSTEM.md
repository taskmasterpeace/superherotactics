# FACTION RELATIONS SYSTEM
## SuperHero Tactics

**Version:** 1.0
**Date:** December 11, 2024
**Status:** Design Proposal

---

## Overview

The Faction Relations System creates a dynamic web of alliances, rivalries, and consequences across 168 countries and various organizational factions. Player actions ripple through this ecosystem, creating emergent gameplay where helping one faction may hurt another, forcing strategic choices beyond simple combat.

**Core Principle:** *Every action has diplomatic consequences*

---

## 1. FACTION TYPES

### 1.1 Government Factions (Per Country)

Each of the 168 countries has 3 government sub-factions:

#### Police / Law Enforcement
- **Role:** Domestic law enforcement, crime prevention
- **Budget:** Tied to `lawEnforcementBudget` from countries.ts
- **Strength:** Tied to `lawEnforcement` rating (0-100)
- **Concerns:** Crime reduction, civilian safety, jurisdictional authority
- **Unique Benefits:** Local intel, evidence access, witness protection

#### Military
- **Role:** National defense, international operations
- **Budget:** Tied to `militaryBudget` from countries.ts
- **Strength:** Tied to `militaryServices` rating (0-100)
- **Concerns:** National security, territorial integrity, weapons proliferation
- **Unique Benefits:** Heavy weapons, training facilities, strategic intel

#### Intelligence Services
- **Role:** Espionage, counter-intelligence, covert ops
- **Budget:** Tied to `intelligenceBudget` from countries.ts
- **Strength:** Tied to `intelligenceServices` rating (0-100)
- **Concerns:** Information security, foreign threats, deniable operations
- **Unique Benefits:** Classified intel, covert support, safe houses

**Data Integration:**
```typescript
// From countries.ts - already exists
interface Country {
  lawEnforcement: number;         // 0-100
  lawEnforcementBudget: number;   // USD
  militaryServices: number;        // 0-100
  militaryBudget: number;          // USD
  intelligenceServices: number;    // 0-100
  intelligenceBudget: number;      // USD
  governmentCorruption: number;    // 0-100 (affects faction reliability)
}
```

---

### 1.2 Corporate Factions (Global)

#### Mega-Corporations (5 Global)
- **TechNova Industries** - Silicon Valley tech giant (AI, robotics, cyber)
- **Prometheus Defense** - Military-industrial complex (weapons, armor, vehicles)
- **BioGenesis Corp** - Pharmaceutical/biotech (LSW research, cloning, medical)
- **Infinity Financial Group** - Banking/investment (funding, economic intel)
- **Atlas Energy Conglomerate** - Energy/resources (power, rare materials)

**Corporate Attributes:**
- Market Capitalization: $10B - $500B
- Influence Score: 0-100 (economic power)
- Countries with Operations: 20-100 countries
- Research Projects: Unique tech/equipment
- Public/Private Status: Affects transparency

**What They Provide:**
- Experimental equipment prototypes
- Research funding (+budget per turn)
- Corporate intelligence networks
- Legal protection/liability coverage
- Access to restricted tech

**What They Want:**
- Field testing of their tech (use their equipment in missions)
- Discretion (avoid public scandals)
- Market advantage (sabotage competitors)
- LSW specimens/data for research

---

### 1.3 Criminal Factions (Regional + Global)

#### Regional Cartels (8 Major Regions)
- **Los Zetas Cartel** - Central America/Mexico (drugs, human trafficking)
- **Sicilian Cosa Nostra** - Southern Europe (traditional organized crime)
- **Yakuza Clans** - Japan/East Asia (gambling, tech crime)
- **Russian Bratva** - Eastern Europe/Russia (weapons, cyber crime)
- **Triads** - China/Southeast Asia (smuggling, protection rackets)
- **Nigerian Crime Syndicates** - West Africa (fraud, oil theft)
- **Brazilian Commandos** - South America (favela control, drugs)
- **Indian Mafia Networks** - South Asia (contract killing, smuggling)

**Criminal Attributes:**
- Territory Control: Sectors they dominate
- Criminal Specialization: Type of crime
- Enforcement Rating: 0-100 (violence capacity)
- Corruption Network: Government officials on payroll

**What They Provide:**
- Black market equipment (illegal weapons, no questions asked)
- Underworld intel (criminal activity, smuggling routes)
- Safe houses in hostile territories
- "Cleanup" services (body disposal, evidence destruction)
- Money laundering

**What They Want:**
- Ignore their operations (look the other way)
- Eliminate rivals (take out competing gangs)
- Protection from government crackdowns
- LSW-enhanced enforcers (recruit for them)

---

### 1.4 Vigilante Factions (City-Based)

Independent hero groups operating in major cities (1050 cities = potential 100+ vigilante groups)

#### Vigilante Archetypes:
- **Street-Level Heroes** - Small team, local protection (Daredevil-style)
- **Tech Vigilantes** - Wealthy benefactor, gadget-focused (Batman-style)
- **Mutant Rights Groups** - LSW advocacy, civil rights focus
- **Mystical Defenders** - Occult threats, spiritual protection
- **Reformed Criminals** - Ex-cons turned heroes, redemption arc

**Vigilante Attributes:**
- City Base: Home city from cities.ts (1050 options)
- Team Size: 1-6 members
- Methodology: Lethal/Non-Lethal, Public/Secret
- Threat Focus: Crime, Terrorism, Supernatural, Corporate

**What They Provide:**
- Street-level intel (grassroots networks)
- Joint operations (backup in their city)
- Training in specialized techniques
- Temporary team members (loan a hero)
- Moral support (public endorsements)

**What They Want:**
- Respect for their jurisdiction (don't interfere)
- Shared values (non-lethal, accountability)
- Help with major threats (too big for them alone)
- Recognition (not treated as criminals)

**Conflicts:**
- Some vigilantes use lethal force (may conflict with player)
- Jurisdictional disputes (who operates where)
- Methods disagreements (torture, collateral damage)

---

### 1.5 Media Factions (Global + National)

#### Global Media Networks (3)
- **World News Network (WNN)** - American, centrist
- **Global Broadcasting Corporation (GBC)** - European, liberal
- **International Press Service (IPS)** - Asian, state-aligned

#### National Media (Per Country)
Tied to `mediaFreedom` rating from countries.ts:
- **Free Press (75-100):** Independent, investigative
- **Controlled Media (50-74):** Government-influenced, self-censoring
- **State Propaganda (0-49):** Government mouthpiece, no independence

**Media Attributes:**
- Reach: Local/National/Global
- Bias: Pro-Government, Anti-Government, Corporate, Independent
- Freedom Rating: From `mediaFreedom` in countries.ts
- Audience Size: Millions of viewers/readers

**What They Provide:**
- Public opinion management (spin stories favorably)
- Information warfare (expose enemies)
- Fame boost (positive coverage = +Fame)
- Early warnings (journalists tip you off)
- Pressure on governments (force political action)

**What They Want:**
- Exclusive stories (give them scoops)
- Access (embedded journalists on missions)
- Transparency (answer tough questions)
- Drama (exciting content drives ratings)

**Media Mechanics:**
- High `mediaFreedom` countries: Media harder to control, more objective
- Low `mediaFreedom` countries: Media controllable via government contacts
- Scandals spread faster in free press nations
- Authoritarian regimes can suppress stories (if you have government standing)

---

### 1.6 Public Opinion (Per Country)

Not a traditional "faction" but a measurable force representing the general population.

**Public Attributes:**
- Population Size: From `population` in countries.ts
- Government Trust: Tied to `governmentPerception` and `governmentCorruption`
- Fear Level: Rises with terrorism/LSW incidents
- Hope Level: Rises with successful hero interventions

**What Public Opinion Provides:**
- Civilian cooperation (witnesses come forward)
- Recruitment pool (volunteers join your team)
- Political pressure (government forced to support you)
- Economic support (donations, crowdfunding)

**What Public Opinion Wants:**
- Safety (reduce crime/terrorism)
- Transparency (know what you're doing)
- Minimal collateral damage (protect civilians)
- Justice (villains punished, not killed indiscriminately)

**Public Mechanics:**
- Democratic countries (Full/Flawed Democracy): Public opinion matters more
- Authoritarian countries: Public opinion matters less, easier to suppress
- Fame system already exists - this is "informed public opinion"
- High collateral damage = public backlash even if mission succeeds

---

## 2. REPUTATION SCALE

### 2.1 Standing Values

**Range:** -100 to +100 (signed integer)

| Standing | Range | Label | Color | Icon |
|----------|-------|-------|-------|------|
| -100 to -75 | Mortal Enemy | Red | ⚔️ |
| -74 to -50 | Hostile | Dark Orange | 🔥 |
| -49 to -25 | Unfriendly | Orange | ⚠️ |
| -24 to -10 | Suspicious | Yellow | 👁️ |
| -9 to +9 | Neutral | Gray | ➖ |
| +10 to +24 | Friendly | Light Green | 🤝 |
| +25 to +49 | Trusted | Green | ✅ |
| +50 to +74 | Allied | Blue | 🛡️ |
| +75 to +100 | Devoted | Purple | ⭐ |

### 2.2 Standing Effects by Tier

#### Mortal Enemy (-100 to -75)
**Unlocks:**
- Nothing

**Restrictions:**
- Actively hunted in their territory
- Shoot-on-sight orders
- Bounties placed on your team
- Equipment sabotage (gear bought from them may fail)
- Intel blackout (no information sharing)
- Mission refusal (won't hire you)

**Special Events:**
- Assassination attempts on team members
- Ambushes during missions
- Media smear campaigns
- Allied factions pressured to drop you

---

#### Hostile (-74 to -50)
**Unlocks:**
- Nothing

**Restrictions:**
- Refused service (can't buy from them)
- No mission contracts
- Active obstruction (block your operations)
- Legal harassment (arrests, warrants)
- No intel sharing
- Allies warned against you

**Special Events:**
- Confrontations in neutral zones
- Legal challenges and lawsuits
- Character recruitment attempts (poach your team)

---

#### Unfriendly (-49 to -25)
**Unlocks:**
- Basic transactions (at 150% price markup)

**Restrictions:**
- Distrusted (constant surveillance)
- No special equipment access
- No classified intel
- Mission offers rare and low-paying
- No backup or support

**Special Events:**
- Bureaucratic delays
- Equipment "shortages"
- Tip-offs to your enemies

---

#### Suspicious (-24 to -10)
**Unlocks:**
- Standard commercial transactions (at 125% markup)
- Basic mission contracts (low-tier only)

**Restrictions:**
- No sensitive intel
- No advanced equipment
- No support services
- Watched closely (investigations)

**Special Events:**
- Background checks
- Loyalty tests

---

#### Neutral (-9 to +9)
**Default starting standing with most factions**

**Unlocks:**
- Normal commercial transactions (standard prices)
- Standard mission contracts
- Basic intel (publicly available info)

**Restrictions:**
- No special treatment
- No classified access
- No backup or favors
- No unique equipment

**Note:** Most factions start here. You must earn trust or enmity.

---

#### Friendly (+10 to +24)
**Unlocks:**
- Equipment discount (10% off)
- Priority mission contracts
- Basic intel sharing
- Minor favors (info lookups, small assistance)
- Friendly warnings (tip-offs about threats)

**Restrictions:**
- Still no classified/sensitive access
- No major resource commitments

---

#### Trusted (+25 to +49)
**Unlocks:**
- Significant discount (20% off)
- Classified intel access (mission briefings, threat assessments)
- Advanced equipment access (restricted/specialized gear)
- Backup support (reinforcements in emergencies)
- Safe houses and safehouses
- Legal protection (lawyers, fixers)

**Restrictions:**
- No access to experimental/prototype tech
- No carte blanche authority

---

#### Allied (+50 to +74)
**Unlocks:**
- Major discount (30% off)
- Full intel access (strategic plans, deep intelligence)
- Prototype equipment (experimental gear)
- Dedicated support (on-call backup)
- Joint operations (coordinated missions)
- Political support (lobbying, legal immunity)
- Training facilities (stat/skill bonuses)

**Restrictions:**
- Expected reciprocity (must help when asked)

---

#### Devoted (+75 to +100)
**Highest tier - reserved for closest allies**

**Unlocks:**
- Everything free or near-free (50% off even unique items)
- Unrestricted access (all intel, all equipment)
- Blank check support (resources on demand)
- Unique faction perks:
  - **Military:** Strategic weapons (nukes, orbital strikes - narrative only)
  - **Corporate:** Exclusive prototype armor/weapons (best gear in game)
  - **Intelligence:** Deep cover identities, global surveillance access
  - **Vigilante:** Permanent team member (hero joins your roster)
  - **Media:** Total media control (spin any story favorably)
  - **Public:** Civilian militia volunteers (extra units in combat)

**Restrictions:**
- Extremely hard to reach (+75 requires major campaign investment)
- Can be lost quickly (major betrayals = instant drop to Hostile)

---

## 3. ACTIONS THAT AFFECT STANDING

### 3.1 Mission Completions

#### Mission Source = Direct Beneficiary

When completing missions from `missionSystem.ts`:

```typescript
export type MissionSource =
  | 'police'            // +10 to +20 with local Police faction
  | 'military'          // +10 to +20 with country Military
  | 'special_forces'    // +10 to +20 with Intelligence Services
  | 'underworld'        // +10 to +20 with Criminal faction
  | 'terrorism'         // -20 to -40 with Government, +10 with extremist groups
  | 'handler'           // +5 to +10 with Intelligence (your government)
  | 'private';          // +10 to +20 with Corporate client
```

**Calculation:**
- Base: Mission success = +10 Standing
- Bonus: +5 if completed with minimal collateral
- Bonus: +5 if completed ahead of schedule
- Penalty: -5 if excessive force used
- Penalty: -10 if civilians killed

**Example:**
Complete "VIP Extraction" (source: handler) successfully with no civilian casualties:
- **Your Government Intelligence:** +15 Standing
- **Local Police:** +5 Standing (assisted national operation)
- **Public Opinion:** +3 Standing (saved VIP)

---

#### Secondary Beneficiaries/Victims

**Who Else Is Affected:**

| Mission Type | Benefits | Harmed |
|--------------|----------|--------|
| Extract VIP | Intelligence (+15), Public (+5) | Enemy faction (-20) |
| Escort Convoy | Military (+15), Public (+3) | Attackers (-15) |
| Protect Location | Client (+20), Public (+5) | Attackers (-20) |
| Assassinate Target | Client (+25), Rivals (+10) | Target's allies (-30), Public (-10 if controversial) |
| Skirmish (Gang) | Police (+15), Public (+10) | Gang (-30), other gangs (+5) |
| Rescue Hostage | Police (+15), Public (+20), Families (+30) | Kidnappers (-40) |
| Investigate | Source (+10), Media (+5) | Investigated party (-15) |

---

### 3.2 Collateral Damage

Every mission tracks collateral:
- Civilian casualties
- Property destruction ($ value)
- Friendly fire
- Environmental damage

**Standing Impact:**

| Collateral Level | Public Opinion | Local Police | National Military | Media |
|------------------|----------------|--------------|-------------------|-------|
| None (0 casualties, <$10k damage) | +5 | +3 | 0 | +2 |
| Minimal (1-2 casualties, $10k-$50k) | -2 | -2 | 0 | 0 |
| Moderate (3-5 casualties, $50k-$200k) | -8 | -8 | -3 | -5 |
| Heavy (6-10 casualties, $200k-$1M) | -20 | -15 | -8 | -15 |
| Catastrophic (11+ casualties, $1M+) | -40 | -30 | -15 | -30 |

**Modifiers:**
- Democratic countries (Full/Flawed Democracy): 1.5x collateral penalty
- Authoritarian regimes: 0.5x collateral penalty (less accountability)
- High `mediaFreedom`: Media reports spread faster, harder to suppress
- Low `mediaFreedom`: Can suppress bad press with government standing

**Example:**
Mission in United States (Full Democracy, mediaFreedom: 83):
- 4 civilian casualties, $100k property damage = "Moderate"
- Public Opinion: -12 (base -8 × 1.5 democratic multiplier)
- US Police: -12
- US Military: -4.5 → -5
- Media: -8 (investigative reporting)

---

### 3.3 Public vs Covert Actions

**Public Actions:**
- Affects Public Opinion and Media strongly
- Government factions react based on political implications
- Fame gained/lost more dramatically

**Covert Actions:**
- Public Opinion mostly unaffected (unless exposed)
- Intelligence factions appreciate discretion (+bonus)
- If exposed: Double the negative Standing impact

**Mission Settings (added to missionSystem.ts):**
```typescript
interface MissionTemplate {
  // ...existing fields
  publicity: 'public' | 'covert' | 'deniable';
}
```

**Publicity Modifiers:**

| Publicity | Public Opinion Impact | Media Impact | Intel Bonus | If Exposed |
|-----------|----------------------|--------------|-------------|------------|
| Public | 1.0x | 1.5x | 0 | N/A |
| Covert | 0.25x | 0.25x | +5 Intel Standing | 2.0x negative |
| Deniable | 0x (none) | 0x | +10 Intel Standing | 3.0x negative |

**Example - Assassination Mission:**
- Public: -10 Public Opinion (controversial killing)
- Covert: -2.5 Public Opinion, +5 Intelligence Standing
- Deniable: 0 Public Opinion (nobody knows), +10 Intelligence Standing
  - But if exposed: -30 Public Opinion, -40 Media Standing

---

### 3.4 Gifts, Bribes, Donations

Direct standing manipulation via money/resources.

**Gift Types:**

| Gift | Cost | Standing Gain | Restrictions |
|------|------|---------------|--------------|
| Small Donation | $5,000 | +2 | Any faction, anytime |
| Major Donation | $25,000 | +8 | Friendly or better |
| Equipment Donation | $50,000 | +12 | Trusted or better |
| Bribe (small) | $10,000 | +5 | Criminal/Corrupt Gov only |
| Bribe (large) | $50,000 | +20 | Criminal/Corrupt Gov only |
| Tech Share | $100,000 | +25 | Corporate/Intel only |

**Corruption Modifier:**
For government factions, `governmentCorruption` (0-100) from countries.ts affects bribery:

```typescript
// Bribe effectiveness
const bribeMultiplier = 1 + (governmentCorruption / 100);

// Example:
// Country with governmentCorruption: 80
// Large bribe ($50k) gives +20 × 1.8 = +36 Standing
```

**Ethical Concerns:**
- Bribing government = -10 Public Opinion if discovered (10% chance per bribe)
- Bribing in democratic countries = higher discovery chance (20%)
- Bribing in authoritarian regimes = lower discovery chance (5%)

---

### 3.5 Faction-Specific Actions

#### Intelligence Factions
- **Share Intel:** Give them info from other sources (+5 to +15 depending on quality)
- **Recruit Informant:** Plant spy in rival faction (+10)
- **Covert Op Success:** Complete deniable mission (+15)
- **Intelligence Leak:** Accidentally expose classified info (-30)

#### Corporate Factions
- **Use Their Equipment:** Every mission using their gear (+1 per item, max +5/mission)
- **Field Test Prototype:** Use experimental equipment (+10)
- **Positive PR:** Successfully showcase their tech (+8)
- **Equipment Failure:** Their gear fails publicly (-15)
- **Corporate Espionage:** Steal competitor's tech (+20 with client, -40 with victim)

#### Criminal Factions
- **Ignore Their Operations:** Turn blind eye to criminal activity (+8)
- **Eliminate Rival Gang:** Take out competing criminal org (+15)
- **Money Laundering:** Use their services to clean dirty money (+5)
- **Snitch:** Report their activities to police (-50, instant Hostile)
- **Protection Racket:** Defend their territory (+10)

#### Vigilante Factions
- **Joint Mission:** Team up for a mission (+12)
- **Respect Jurisdiction:** Leave their city alone (+5)
- **Share Resources:** Give them equipment or intel (+8)
- **Jurisdictional Conflict:** Operate in their city without permission (-15)
- **Ideological Betrayal:** Kill when they're non-lethal (-25)

#### Media Factions
- **Exclusive Interview:** Give them a story (+10)
- **Embedded Journalist:** Allow reporter on mission (+15 if successful, -20 if disaster)
- **Press Conference:** Answer questions publicly (+5 if honest)
- **Media Blackout:** Refuse all questions (-8)
- **Journalist Endangered:** Reporter hurt on your watch (-30)

#### Public Opinion
- **Save Civilians:** Rescue innocent people (+5 per person)
- **Disaster Relief:** Help during natural disaster/attack (+20)
- **Public Appearance:** Speech, meet-and-greet (+3)
- **Civilian Casualty:** Kill innocent person (-10 per person)
- **False Promise:** Fail to deliver on public commitment (-15)

---

## 4. FACTION BENEFITS

### 4.1 Government Faction Benefits

#### Police / Law Enforcement

| Standing | Benefits Unlocked |
|----------|-------------------|
| Neutral | Standard law enforcement cooperation |
| Friendly | - 10% discount on non-lethal equipment (stun guns, tear gas)<br>- Access to crime databases (criminal records, warrants)<br>- Priority dispatch (police backup arrives faster) |
| Trusted | - 20% discount on police gear<br>- Evidence locker access (confiscated weapons, drugs as quest items)<br>- Witness protection (safe houses for rescued civilians)<br>- "Consulting Detective" status (join investigations as expert) |
| Allied | - 30% discount<br>- Police SWAT backup (call for reinforcements in urban combat)<br>- Legal immunity for minor infractions (trespassing, breaking & entering during missions)<br>- Crime scene access (investigate before official police) |
| Devoted | - 50% discount<br>- Deputized authority (can make arrests)<br>- Forensics lab access (analyze evidence, identify substances)<br>- Internal affairs intel (corrupt cops exposed)<br>- "Police Scanner" perk (real-time crime alerts in city) |

**Low Standing Penalties:**

| Standing | Penalties |
|----------|-----------|
| Suspicious | Increased police scrutiny (investigated after every mission) |
| Unfriendly | Warrants issued for questioning, detained if caught without cause |
| Hostile | Arrest warrants, treated as criminal organization |
| Mortal Enemy | Shoot-on-sight orders, SWAT raids on your base |

---

#### Military

| Standing | Benefits Unlocked |
|----------|-------------------|
| Neutral | Standard military non-interference |
| Friendly | - 10% discount on military surplus gear<br>- Base access (can visit military installations)<br>- Training courses (+1 to Shooting or Heavy Weapons skill) |
| Trusted | - 20% discount<br>- Military intelligence (satellite imagery, enemy troop movements)<br>- Arsenal access (restricted military weapons: assault rifles, explosives)<br>- Close Air Support (request helicopter/drone reconnaissance) |
| Allied | - 30% discount<br>- Elite training (Special Forces course: +2 to MEL or RAN stats)<br>- Vehicle access (borrow military vehicles for missions)<br>- Artillery support (limited - call in airstrikes on mission)<br>- Forward Operating Base (military base in foreign territory as safe zone) |
| Devoted | - 50% discount<br>- Strategic weapons (narrative access to cruise missiles, experimental tech)<br>- Joint Task Force status (military units fight alongside you)<br>- Top-secret clearance (access to classified threats, black projects)<br>- "Military Liaison" perk (always have military support in national operations) |

**Low Standing Penalties:**

| Standing | Penalties |
|----------|-----------|
| Suspicious | Travel restrictions (flight clearances denied) |
| Unfriendly | Equipment embargoes (military gear unavailable) |
| Hostile | Declared enemy combatants, military operations against you |
| Mortal Enemy | Drone strikes, special forces assassination teams |

---

#### Intelligence Services

| Standing | Benefits Unlocked |
|----------|-------------------|
| Neutral | Standard operational independence |
| Friendly | - Classified intel briefings (known threats in region)<br>- Covert identity (fake IDs, passports)<br>- Dead drop access (secure communication) |
| Trusted | - Deep intelligence (enemy faction locations, personnel files)<br>- Safe house network (global - 20+ cities)<br>- Signals intelligence (phone taps, email intercepts)<br>- "Handler" assigned (mission coordinator, emergency contact) |
| Allied | - Strategic intelligence (enemy plans, upcoming attacks)<br>- Black budget access (+$10,000/month discretionary funds)<br>- Covert operations support (ghost you in/out of countries)<br>- Asset recruitment (turn enemy agents into double agents)<br>- Experimental spy tech (gadgets, surveillance gear) |
| Devoted | - Total intelligence access (all global threats, all factions)<br>- "Ghost" status (can operate anywhere with full deniability)<br>- Unlimited black budget (money for any operation)<br>- Sleeper agent network (informants in every major faction)<br>- "Spymaster" perk (access to all intelligence faction benefits globally) |

**Low Standing Penalties:**

| Standing | Penalties |
|----------|-----------|
| Suspicious | Surveillance (your communications monitored) |
| Unfriendly | Asset denial (informants pulled, safe houses closed) |
| Hostile | Active sabotage (missions leaked to enemies) |
| Mortal Enemy | Black ops assassination, false flag operations to discredit you |

---

### 4.2 Corporate Faction Benefits

#### Example: Prometheus Defense (Military-Industrial)

| Standing | Benefits Unlocked |
|----------|-------------------|
| Neutral | Standard commercial prices |
| Friendly | - 10% discount on weapons & armor<br>- Early access (new products 1 month before public release)<br>- Field testing invitations (try prototypes for feedback) |
| Trusted | - 20% discount<br>- Prototype equipment (experimental weapons not yet on market)<br>- R&D contracts (+$5,000 per mission using their gear)<br>- Corporate security backup (private military contractors) |
| Allied | - 30% discount<br>- Exclusive equipment (unique weapons only for allies)<br>- Custom modifications (tailor gear to your specs)<br>- Research partnership (co-develop new tech, share profits)<br>- Corporate jet access (fast travel to major cities) |
| Devoted | - 50% discount<br>- Bleeding-edge tech (best gear in game, unreleased)<br>- Corporate army (full PMC support for major operations)<br>- Board member status (influence company direction)<br>- "Corporate Champion" perk (all Prometheus gear free) |

**Other Corporate Examples:**
- **TechNova Industries:** AI systems, hacking tools, drones, cyber warfare
- **BioGenesis Corp:** Medical supplies, LSW enhancement drugs, cloning tech
- **Infinity Financial:** Money laundering, shell companies, economic warfare intel
- **Atlas Energy:** Experimental power sources, energy weapons, rare materials

**Low Standing Penalties:**

| Standing | Penalties |
|----------|-----------|
| Suspicious | Price increases (125% markup) |
| Unfriendly | Blacklisted (refused service, equipment disabled remotely) |
| Hostile | Corporate espionage (steal your secrets), smear campaigns |
| Mortal Enemy | PMC hit squads, legal warfare (lawsuits, asset seizures) |

---

### 4.3 Criminal Faction Benefits

#### Example: Los Zetas Cartel (Central America)

| Standing | Benefits Unlocked |
|----------|-------------------|
| Neutral | No interaction (they ignore you) |
| Friendly | - Black market access (illegal weapons, no serial numbers)<br>- Underworld intel (criminal activity, smuggling routes)<br>- Fake documents (forged IDs, false credentials) |
| Trusted | - 20% discount on black market gear<br>- Safe houses in cartel territory<br>- Smuggling services (move contraband across borders)<br>- "Made Man" status (cartel protection in their regions)<br>- Dirty jobs (assassination contracts, intimidation) |
| Allied | - 30% discount<br>- Sicarios (cartel enforcers as backup)<br>- Drug trade access (sell confiscated drugs for cash)<br>- Corruption network (bribe government officials through cartel)<br>- "Cartel Lieutenant" rank (command respect in underworld) |
| Devoted | - 50% discount<br>- Cartel army (heavily armed enforcers for major operations)<br>- Total underworld control (all criminal intel in region)<br>- Untouchable status (government won't touch you due to cartel pressure)<br>- "Cartel Boss" perk (criminal empire benefits) |

**Ethical Dilemma:**
- High standing with criminals = low standing with police/military
- Using cartel services = public opinion penalties
- Operating in cartel territory = missions involve moral gray areas

**Low Standing Penalties:**

| Standing | Penalties |
|----------|-----------|
| Suspicious | Suspicious activity (cartel watches you) |
| Unfriendly | Territory denial (attacked if entering their sectors) |
| Hostile | Bounties (cartel places hit on your team) |
| Mortal Enemy | Total war (cartel uses all resources to kill you) |

---

### 4.4 Vigilante Faction Benefits

#### Example: "The Midnight Watch" (New York City)

**Team:** 4 members (Leader "Shadowstrike," Tech "Circuit," Bruiser "Titan," Mystic "Raven")

| Standing | Benefits Unlocked |
|----------|-------------------|
| Neutral | Professional courtesy (no interference) |
| Friendly | - Street intel (gang activity, local crimes in their city)<br>- Joint patrol (team up for night patrols)<br>- Emergency contact (call for backup in their city) |
| Trusted | - Hideout access (use their base as safe house)<br>- Shared resources (borrow equipment, vehicles)<br>- Training partner (+1 skill in their specialty)<br>- "Associate Hero" status (public sees you as allies) |
| Allied | - Temporary member (borrow one hero for a mission)<br>- Strategic alliance (coordinate operations in region)<br>- Combined tactics (unique team combos in combat)<br>- Reputation boost (their fans become your fans) |
| Devoted | - Permanent member (one hero joins your roster full-time)<br>- Full cooperation (entire team available for critical missions)<br>- Merged operations (your bases become one network)<br>- "Legendary Alliance" perk (fame boost in their city) |

**Ideological Conflicts:**
- Non-lethal vigilante groups: Penalize you for killing (-10 Standing per kill)
- Lethal vigilante groups: Penalize you for showing mercy (-5 Standing per capture)
- Tech vigilantes: Want non-LSW solutions (dislike relying on powers)
- Mutant rights vigilantes: Want LSW acceptance (dislike anti-LSW actions)

**Low Standing Penalties:**

| Standing | Penalties |
|----------|-----------|
| Suspicious | Territory warning (asked to leave their city) |
| Unfriendly | Active opposition (they interfere with your missions) |
| Hostile | Public feud (media sees you as rivals, fame penalty) |
| Mortal Enemy | Combat encounters (they hunt you as villain) |

---

### 4.5 Media Faction Benefits

#### Example: World News Network (WNN - Global)

| Standing | Benefits Unlocked |
|----------|-------------------|
| Neutral | Standard news coverage (objective reporting) |
| Friendly | - Positive coverage (+5 Fame per mission)<br>- Interview opportunities (public appearances boost reputation)<br>- Early warnings (journalists tip you about stories) |
| Trusted | - Spin control (negative stories suppressed or reframed)<br>- Investigative support (journalists dig up intel for you)<br>- Media blitz (+15 Fame for major operations)<br>- "Media Darling" status (public appearances easier) |
| Allied | - Full editorial control (approve stories before publication)<br>- Character pieces (deep profiles boost individual hero fame)<br>- Crisis management (scandals minimized or buried)<br>- Propaganda (shape public opinion on issues) |
| Devoted | - Total media control (WNN becomes your PR arm)<br>- Global reach (stories reach all 168 countries)<br>- Information warfare (discredit enemies via media)<br>- "Media Mogul" perk (control narrative globally) |

**Media Freedom Modifier:**

From countries.ts `mediaFreedom` rating:

| mediaFreedom | Media Control Difficulty |
|--------------|--------------------------|
| 0-25 (State Propaganda) | Easy - Media does what government says |
| 26-50 (Controlled) | Medium - Can influence via money/connections |
| 51-75 (Self-Censoring) | Hard - Investigative but cautious |
| 76-100 (Free Press) | Very Hard - Independent, hard to control |

**Low Standing Penalties:**

| Standing | Penalties |
|----------|-----------|
| Suspicious | Neutral coverage (no fame boost) |
| Unfriendly | Negative coverage (-5 Fame per mission) |
| Hostile | Hit pieces (investigative journalism exposes scandals, -15 Fame) |
| Mortal Enemy | Total character assassination (-30 Fame, public opinion plummets) |

---

### 4.6 Public Opinion Benefits

#### Country-Wide Reputation

Public Opinion is tracked per country (168 total), tied to:
- `population` (larger populations = more impact)
- `governmentPerception` (democracies respond more to public will)

| Standing | Benefits Unlocked |
|----------|-------------------|
| Neutral | Standard public interaction |
| Friendly | - Civilian cooperation (witnesses come forward)<br>- Local support (donations: +$1,000/month in that country)<br>- Recruitment boost (easier to find volunteers) |
| Trusted | - Hero worship (+10 Fame in country)<br>- Economic support (donations: +$5,000/month)<br>- Political pressure (government must support you)<br>- Civilian militia (volunteers assist in major threats) |
| Allied | - National heroes (+25 Fame in country)<br>- Government mandate (officials must cooperate)<br>- Crowdfunding (major donations: +$15,000/month)<br>- Popular uprisings (public protests against your enemies) |
| Devoted | - Living legends (+50 Fame in country)<br>- Total public backing (government can't oppose you)<br>- Economic boom (donations: +$30,000/month)<br>- "National Treasure" perk (country's resources at your disposal) |

**Democratic Multiplier:**

From countries.ts `governmentPerception`:

| Government Type | Public Opinion Impact |
|-----------------|----------------------|
| Full Democracy | 2.0x (public opinion very powerful) |
| Flawed Democracy | 1.5x (public opinion matters) |
| Hybrid Regime | 1.0x (moderate influence) |
| Authoritarian | 0.5x (public opinion weak) |

**Example:**
- Public Opinion Standing: +60 (Allied) in United States (Full Democracy)
- Base benefit: +$15,000/month donations
- Democratic multiplier: × 2.0 = +$30,000/month
- Plus: Government mandate (US government must support you)

**Low Standing Penalties:**

| Standing | Penalties |
|----------|-----------|
| Suspicious | Public distrust (fewer volunteers, -2 recruitment) |
| Unfriendly | Protests (-5 Fame, public demonstrations against you) |
| Hostile | Riots (-15 Fame, civilian attacks, government pressured to act) |
| Mortal Enemy | Mob justice (-30 Fame, civilians actively hunt you, lynching attempts) |

---

## 5. FACTION CONFLICTS

### 5.1 Direct Oppositions

#### Law vs Crime

| Action | Police Standing | Criminal Standing |
|--------|-----------------|-------------------|
| Arrest gang members | +10 | -15 |
| Turn blind eye to crime | -12 | +8 |
| Bust drug operation | +15 | -25 |
| Use black market weapons | -8 | +5 |
| Kill cartel boss | +20 | -40 (or +20 with rival cartel) |

**Balancing Act:**
- Work with police = lose criminal contacts (intel blackout in underworld)
- Work with criminals = lose police support (legal trouble, arrests)
- Neutral path: Minimal interaction with both (stable but limited benefits)

---

#### Military vs Vigilantes

Many vigilante groups distrust military authority and vice versa.

| Action | Military Standing | Vigilante Standing |
|--------|-------------------|--------------------|
| Follow military orders strictly | +8 | -10 (seen as government lackey) |
| Operate independently | -5 | +8 (respect autonomy) |
| Use military weapons in civilian area | +5 | -12 (excessive force) |
| Prioritize civilian safety over mission | -8 | +15 (heroic values) |

**Ideological Divide:**
- Military: Chain of command, national security, collateral acceptable
- Vigilantes: Personal accountability, local protection, minimize harm

---

#### Corporate vs Public Opinion

Corporations prioritize profits; public wants safety and ethics.

| Action | Corporate Standing | Public Opinion |
|--------|-------------------|----------------|
| Field test dangerous prototype | +15 | -10 (risk to civilians) |
| Refuse to use unsafe corporate tech | -12 | +8 (prioritize safety) |
| Cover up corporate scandal | +20 | -25 (corruption) |
| Expose corporate wrongdoing | -30 | +20 (justice) |

**Example Scenario:**
BioGenesis Corp wants you to field-test experimental LSW drug.
- **Accept:** +15 BioGenesis, -10 Public Opinion (dangerous human testing)
- **Refuse:** -12 BioGenesis, +8 Public Opinion (ethical choice)
- **Test fails publicly:** -25 BioGenesis, -20 Public Opinion (disaster)

---

#### Intelligence vs Media

Intelligence wants secrecy; media wants transparency.

| Action | Intelligence Standing | Media Standing |
|--------|-----------------------|----------------|
| Classify mission details | +10 | -8 (lack of transparency) |
| Full press disclosure | -15 | +12 (open governance) |
| Leak classified info to press | -40 | +25 (whistleblower) |
| Suppress media investigation | +15 | -30 (censorship) |

**Example Scenario:**
You complete covert assassination. Media demands details.
- **Classify:** +10 Intelligence, -8 Media, 0 Public Opinion
- **Disclose:** -15 Intelligence, +12 Media, -5 Public Opinion (controversial kill)
- **Lie:** -5 Intelligence (annoyed), -20 Media (when caught), -15 Public Opinion

---

### 5.2 Regional Rivalries

#### Criminal Faction Rivalries

Helping one gang hurts their rivals.

**Example: Los Zetas vs Sinaloa Cartel**

| Action | Los Zetas | Sinaloa | Mexican Police |
|--------|-----------|---------|----------------|
| Protect Zetas shipment | +15 | -20 | -15 |
| Bust Sinaloa operation | +10 | -25 | +20 |
| Kill Zetas lieutenant | -30 | +15 | +25 |
| Stay neutral in cartel war | 0 | 0 | +5 (appreciated) |

**Strategic Choice:**
- Pick a side: Gain strong ally in one cartel, permanent enemy in other
- Stay neutral: Keep options open but miss criminal benefits
- Play both sides: Risky (if discovered, both cartels turn Hostile)

---

#### Vigilante Turf Wars

Some cities have multiple vigilante groups with conflicting methods.

**Example: Gotham City (fictional example)**

- **The Dark Knights:** Non-lethal, fear-based, high-tech
- **The Punishers:** Lethal, military-style, brutal

| Action | Dark Knights | Punishers |
|--------|--------------|-----------|
| Capture criminals alive | +12 | -10 |
| Execute criminals | -25 | +15 |
| Use non-lethal tactics | +10 | -5 |
| Torture for information | -20 | +8 |

**Ideological Conflict:**
- You cannot satisfy both
- Must choose which philosophy to support
- City reputation affected by which group you align with

---

#### Corporate Competition

Mega-corps compete for market dominance.

**Example: TechNova vs Prometheus Defense**

| Action | TechNova | Prometheus |
|--------|----------|------------|
| Use TechNova equipment | +5 per mission | -3 per mission |
| Steal Prometheus tech for TechNova | +30 | -50 |
| Public endorsement of TechNova | +20 | -15 |
| Sabotage TechNova facility | -40 | +25 |

**Economic Warfare:**
- Corporations pay for exclusivity ("use only our gear")
- Espionage missions: Steal tech from competitors
- Sabotage missions: Destroy rival facilities
- Marketing ops: Public demonstrations of their equipment

---

### 5.3 Government Faction Internal Conflicts

Within a single country, factions may conflict:

#### Police vs Intelligence

- **Police:** Want transparency, rule of law, arrests
- **Intelligence:** Want secrecy, deniability, elimination

**Example: Captured terrorist**

| Action | Police Standing | Intelligence Standing |
|--------|-----------------|----------------------|
| Arrest and trial | +15 | -10 (security risk) |
| Rendition (secret prison) | -20 | +15 (interrogation) |
| Execute on site | -25 | +20 (problem solved) |
| Let escape for tracking | -15 | +25 (intelligence operation) |

---

#### Military vs Public Opinion

Especially in democracies.

| Action | Military Standing | Public Opinion |
|--------|-------------------|----------------|
| Collateral damage in combat | +5 (acceptable) | -20 (outrage) |
| Refuse military orders to minimize civilian risk | -15 | +20 |
| Use strategic weapons in city | +10 | -40 (mass casualties) |

---

### 5.4 Faction Relationship Matrix

**How Factions View Each Other**

This affects their reactions to your alliances.

| Your Ally → | Police | Military | Intel | Corporate | Criminal | Vigilante | Media | Public |
|-------------|--------|----------|-------|-----------|----------|-----------|-------|--------|
| **Police** | - | +10 | +5 | 0 | -40 | +8 | +5 | +15 |
| **Military** | +10 | - | +15 | +5 | -20 | -10 | 0 | +5 |
| **Intel** | +5 | +15 | - | +8 | -10 | -5 | -15 | -5 |
| **Corporate** | 0 | +5 | +8 | - | +10 | -5 | +10 | -10 |
| **Criminal** | -40 | -20 | -10 | +10 | - | -20 | -5 | -30 |
| **Vigilante** | +8 | -10 | -5 | -5 | -20 | - | +5 | +20 |
| **Media** | +5 | 0 | -15 | +10 | -5 | +5 | - | +15 |
| **Public** | +15 | +5 | -5 | -10 | -30 | +20 | +15 | - |

**How to Read:**
- Rows = Your primary alliance
- Columns = How that faction views other factions
- Values = Standing modifier when you work with that faction

**Example:**
You are Allied (+60) with Police.
- When you work with Military: Police approve (+10 bonus to Police standing)
- When you work with Criminals: Police disapprove (-40 penalty to Police standing)

**Complex Example:**
You complete mission for Criminal faction (+15 Criminal standing).
- Police: -40 (they hate criminals)
- Military: -20 (criminals are enemies)
- Public Opinion: -30 (public distrusts criminals)
- Corporate: +10 (corporations deal with criminals quietly)
- Vigilantes: -20 (most vigilantes fight crime)

**Strategic Implication:**
- High standing with one faction can lock you out of opposing factions
- Balanced approach = mediocre standing with everyone, no strong benefits
- Specialized approach = devoted ally + mortal enemies, high-risk/high-reward

---

## 6. SYSTEM INTEGRATION

### 6.1 Data Structure

```typescript
// factionSystem.ts

export type FactionType =
  | 'police'
  | 'military'
  | 'intelligence'
  | 'corporate'
  | 'criminal'
  | 'vigilante'
  | 'media'
  | 'public';

export type FactionScope =
  | 'global'      // Operates worldwide (mega-corps, global media)
  | 'national'    // Country-specific (government factions, public opinion)
  | 'regional'    // Multi-country region (cartels, regional vigilantes)
  | 'local';      // City-specific (local vigilantes, city media)

export interface Faction {
  id: string;                    // Unique identifier
  name: string;                  // Display name
  type: FactionType;
  scope: FactionScope;

  // Scope-specific identifiers
  countryCode?: string;          // If national (e.g., "US", "CN")
  regionCodes?: string[];        // If regional (e.g., ["US", "MX", "CA"])
  cityId?: number;               // If local (from cities.ts)

  // Attributes
  power: number;                 // 0-100: Political/economic/military power
  wealth: number;                // 0-100: Financial resources
  influence: number;             // 0-100: Social/media influence

  // Relationships
  allies: string[];              // Faction IDs of allied factions
  enemies: string[];             // Faction IDs of enemy factions

  // Player interaction
  standing: number;              // -100 to +100: Player's reputation
  standingLabel: StandingLabel;  // Auto-calculated from standing

  // Benefits
  equipmentDiscount: number;     // 0-50%: Based on standing
  uniqueEquipment: string[];     // Equipment IDs unlocked at Allied+
  uniqueMissions: string[];      // Mission IDs available

  // Special flags
  isSecret: boolean;             // Hidden until discovered
  requiresContact: boolean;      // Need introduction to interact
}

export type StandingLabel =
  | 'mortal_enemy'   // -100 to -75
  | 'hostile'        // -74 to -50
  | 'unfriendly'     // -49 to -25
  | 'suspicious'     // -24 to -10
  | 'neutral'        // -9 to +9
  | 'friendly'       // +10 to +24
  | 'trusted'        // +25 to +49
  | 'allied'         // +50 to +74
  | 'devoted';       // +75 to +100

export function getStandingLabel(standing: number): StandingLabel {
  if (standing <= -75) return 'mortal_enemy';
  if (standing <= -50) return 'hostile';
  if (standing <= -25) return 'unfriendly';
  if (standing <= -10) return 'suspicious';
  if (standing <= 9) return 'neutral';
  if (standing <= 24) return 'friendly';
  if (standing <= 49) return 'trusted';
  if (standing <= 74) return 'allied';
  return 'devoted';
}

export function getEquipmentDiscount(standing: number): number {
  if (standing >= 75) return 50;  // Devoted
  if (standing >= 50) return 30;  // Allied
  if (standing >= 25) return 20;  // Trusted
  if (standing >= 10) return 10;  // Friendly
  if (standing >= -10) return 0;  // Neutral
  if (standing >= -25) return -25; // Suspicious (markup)
  if (standing >= -50) return -50; // Unfriendly (markup)
  return -100; // Hostile/Enemy (refused service)
}
```

---

### 6.2 Standing Changes

```typescript
// factionStandingSystem.ts

export interface StandingChange {
  factionId: string;
  amount: number;
  reason: string;
  timestamp: number;
  missionId?: string;
}

export interface StandingModifiers {
  collateralDamage: number;      // -40 to +5
  missionSuccess: number;        // +10 to +25
  publicity: number;             // 0x to 1.5x multiplier
  governmentType: number;        // 0.5x to 2.0x multiplier (democracies)
  mediaFreedom: number;          // 0.5x to 2.0x multiplier (free press)
  corruption: number;            // 1.0x to 2.0x multiplier (bribery)
}

export function calculateMissionStandingChange(
  mission: GeneratedMission,
  result: MissionResult,
  factionId: string
): number {
  let baseChange = 0;

  // 1. Mission source = primary beneficiary
  if (mission.template.source === getFactionType(factionId)) {
    baseChange = 10; // Base success
    if (result.success) baseChange += 5;
    if (result.aheadOfSchedule) baseChange += 5;
  }

  // 2. Collateral damage penalty
  const collateralPenalty = calculateCollateralPenalty(
    result.casualties,
    result.propertyDamage,
    factionId
  );
  baseChange += collateralPenalty;

  // 3. Secondary beneficiaries
  const secondaryBonus = getSecondaryBeneficiaryBonus(
    mission.template.type,
    factionId
  );
  baseChange += secondaryBonus;

  // 4. Apply modifiers
  const modifiers = getStandingModifiers(mission, factionId);
  let finalChange = baseChange;

  if (modifiers.publicity) {
    finalChange *= modifiers.publicity;
  }

  if (modifiers.governmentType) {
    finalChange *= modifiers.governmentType;
  }

  return Math.round(finalChange);
}

export function calculateCollateralPenalty(
  casualties: number,
  propertyDamage: number,
  factionId: string
): number {
  let penalty = 0;

  // Civilian casualties
  if (casualties === 0) {
    penalty = 5; // Bonus for zero casualties
  } else if (casualties <= 2) {
    penalty = -2;
  } else if (casualties <= 5) {
    penalty = -8;
  } else if (casualties <= 10) {
    penalty = -20;
  } else {
    penalty = -40;
  }

  // Property damage
  if (propertyDamage > 1000000) {
    penalty -= 10;
  } else if (propertyDamage > 200000) {
    penalty -= 5;
  }

  // Faction-specific modifiers
  const faction = getFaction(factionId);
  if (faction.type === 'public') {
    penalty *= 1.5; // Public opinion cares more
  } else if (faction.type === 'military') {
    penalty *= 0.5; // Military expects collateral
  }

  return Math.round(penalty);
}

export function applyStandingChange(
  factionId: string,
  change: number,
  reason: string,
  missionId?: string
): void {
  const faction = getFaction(factionId);

  // Apply change
  faction.standing = Math.max(-100, Math.min(100, faction.standing + change));

  // Update label
  faction.standingLabel = getStandingLabel(faction.standing);

  // Log change
  logStandingChange({
    factionId,
    amount: change,
    reason,
    timestamp: Date.now(),
    missionId,
  });

  // Trigger notifications
  if (change >= 10 || change <= -10) {
    showStandingNotification(faction, change, reason);
  }

  // Check for standing tier changes
  checkStandingTierChange(faction, change);
}

export function checkStandingTierChange(
  faction: Faction,
  change: number
): void {
  const previousLabel = getStandingLabel(faction.standing - change);
  const currentLabel = faction.standingLabel;

  if (previousLabel !== currentLabel) {
    // Standing tier changed!
    showTierChangeNotification(faction, previousLabel, currentLabel);

    // Unlock/lock benefits
    if (currentLabel === 'allied' || currentLabel === 'devoted') {
      unlockUniqueBenefits(faction);
    }

    if (currentLabel === 'hostile' || currentLabel === 'mortal_enemy') {
      triggerHostileEvents(faction);
    }
  }
}
```

---

### 6.3 Faction Conflict Resolution

```typescript
// factionConflictSystem.ts

export interface FactionRelationship {
  factionA: string;
  factionB: string;
  relationship: number; // -100 to +100 (how A views B)
  type: 'ally' | 'rival' | 'neutral' | 'enemy';
}

// Faction Relationship Matrix (simplified)
export const FACTION_RELATIONSHIPS: Record<string, Record<string, number>> = {
  police: {
    military: 10,
    intelligence: 5,
    criminal: -40,
    vigilante: 8,
    corporate: 0,
    media: 5,
    public: 15,
  },
  military: {
    police: 10,
    intelligence: 15,
    criminal: -20,
    vigilante: -10,
    corporate: 5,
    media: 0,
    public: 5,
  },
  // ... etc for all faction types
};

export function applyFactionConflict(
  playerAction: string, // Which faction you helped
  amount: number         // Standing gained with that faction
): Map<string, number> {
  const conflicts = new Map<string, number>();
  const actionFactionType = getFactionType(playerAction);

  // Check all other factions
  for (const faction of getAllFactions()) {
    if (faction.id === playerAction) continue;

    const relationship = FACTION_RELATIONSHIPS[actionFactionType]?.[faction.type] ?? 0;

    if (relationship !== 0) {
      // Apply relationship modifier
      const conflictChange = Math.round((amount * relationship) / 100);

      if (conflictChange !== 0) {
        conflicts.set(faction.id, conflictChange);
        applyStandingChange(
          faction.id,
          conflictChange,
          `Indirect effect of helping ${getFaction(playerAction).name}`
        );
      }
    }
  }

  return conflicts;
}

// Example usage:
// Player completes mission for Police (+15 standing)
// applyFactionConflict('us_police', 15) returns:
// - Criminal factions: -6 (police/criminal relationship: -40, so 15 * -0.4 = -6)
// - Vigilantes: +1 (police/vigilante relationship: +8, so 15 * 0.08 = +1.2 ≈ +1)
// - Public: +2 (police/public relationship: +15, so 15 * 0.15 = +2.25 ≈ +2)
```

---

### 6.4 UI Integration

#### Faction Screen

New screen accessible from Laptop UI:

```
📱 LAPTOP UI
├── News/Web Browser
├── Investigations
├── Hospital
├── Education/Training
├── Email System
├── Character Management
├── Base Overview
└── 🆕 FACTION RELATIONS ← NEW
```

**Faction Relations Screen:**

```
┌────────────────────────────────────────────────────────┐
│  FACTION RELATIONS                                      │
├────────────────────────────────────────────────────────┤
│                                                         │
│  Filter: [All] [Government] [Corporate] [Criminal]     │
│          [Vigilante] [Media] [Public]                  │
│                                                         │
│  Sort by: [Standing ▼] [Name] [Type] [Power]          │
│                                                         │
├────────────────────────────────────────────────────────┤
│  🇺🇸 United States Police                              │
│  ✅ TRUSTED (+42)                                       │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  Benefits: 20% Discount, Evidence Access, SWAT Backup  │
│  Next Tier: ALLIED at +50 (8 standing away)            │
│  [View Details] [Recent Changes]                       │
├────────────────────────────────────────────────────────┤
│  🏢 Prometheus Defense (Global)                        │
│  🤝 FRIENDLY (+18)                                      │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  Benefits: 10% Discount, Early Access to New Weapons   │
│  Next Tier: TRUSTED at +25 (7 standing away)           │
│  [View Details] [Recent Changes]                       │
├────────────────────────────────────────────────────────┤
│  💀 Los Zetas Cartel (Central America)                 │
│  ⚠️ UNFRIENDLY (-32)                                   │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  Penalties: Refused Service, Territory Threats         │
│  Warning: 18 standing from HOSTILE (-50)               │
│  [View Details] [Recent Changes]                       │
├────────────────────────────────────────────────────────┤
│  🌍 United States Public Opinion                       │
│  🛡️ ALLIED (+67)                                       │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  Benefits: +25 Fame, Gov't Mandate, $15k/month         │
│  Next Tier: DEVOTED at +75 (8 standing away)           │
│  [View Details] [Recent Changes]                       │
└────────────────────────────────────────────────────────┘
```

**Faction Detail View:**

```
┌────────────────────────────────────────────────────────┐
│  🇺🇸 UNITED STATES POLICE                              │
│  Law Enforcement - National Faction                    │
├────────────────────────────────────────────────────────┤
│  Standing: TRUSTED (+42)                               │
│  ✅ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│     Devoted  Allied  Trusted  Friendly  Neutral        │
│                        ▲ You are here                  │
├────────────────────────────────────────────────────────┤
│  ATTRIBUTES                                            │
│  Power:     ████████░░ 82                              │
│  Wealth:    ███████░░░ 68                              │
│  Influence: ████████░░ 75                              │
├────────────────────────────────────────────────────────┤
│  CURRENT BENEFITS                                      │
│  ✓ 20% Equipment Discount                             │
│  ✓ Evidence Locker Access                             │
│  ✓ Witness Protection                                 │
│  ✓ Consulting Detective Status                        │
│                                                         │
│  LOCKED BENEFITS (ALLIED +50)                          │
│  🔒 30% Discount                                       │
│  🔒 SWAT Backup                                        │
│  🔒 Legal Immunity                                     │
│  🔒 Crime Scene Priority Access                       │
├────────────────────────────────────────────────────────┤
│  RELATIONSHIPS                                         │
│  Allies:   🇺🇸 US Military (+10), 🇺🇸 US Public (+15) │
│  Rivals:   💀 Criminal Factions (-40)                  │
├────────────────────────────────────────────────────────┤
│  RECENT STANDING CHANGES                               │
│  ▲ +15  Mission: Gang Takedown (2 days ago)           │
│  ▼ -8   Collateral Damage (5 days ago)                │
│  ▲ +10  Hostage Rescue (7 days ago)                   │
│  ▲ +5   Donation: $25,000 (12 days ago)               │
├────────────────────────────────────────────────────────┤
│  AVAILABLE MISSIONS                                    │
│  🎯 Gang Bust (Easy) - $5,000 + 100 Fame              │
│  🎯 Witness Protection (Medium) - $6,000 + 80 Fame    │
│  🎯 Evidence Recovery (Hard) - $8,000 + 120 Fame      │
│                                                         │
│  [Accept Mission] [Donate] [Back]                     │
└────────────────────────────────────────────────────────┘
```

---

#### Mission Briefing - Standing Preview

When accepting a mission, show predicted standing changes:

```
┌────────────────────────────────────────────────────────┐
│  MISSION BRIEFING: VIP EXTRACTION                      │
├────────────────────────────────────────────────────────┤
│  Client: 🇺🇸 US Intelligence (FRIENDLY +18)            │
│  Location: Sector M7, Bogotá, Colombia                │
│  Difficulty: HARD                                      │
│  Reward: $15,000 + 150 Fame                            │
├────────────────────────────────────────────────────────┤
│  PREDICTED STANDING CHANGES (if successful):           │
│                                                         │
│  🇺🇸 US Intelligence        ▲ +15 to +20               │
│  🇺🇸 US Public Opinion      ▲ +5                       │
│  🇨🇴 Colombian Military     ▲ +8 (cooperation)         │
│                                                         │
│  💀 Los Zetas Cartel        ▼ -20 (target's allies)    │
│  💀 FARC Rebels             ▼ -15 (operation in area)  │
│                                                         │
│  ⚠️ WARNING: High collateral risk in urban area        │
│     Civilian casualties will severely impact:          │
│     - Colombian Public Opinion (▼ up to -40)           │
│     - Global Media (▼ up to -30)                       │
├────────────────────────────────────────────────────────┤
│  [Accept Mission] [Decline] [More Info]               │
└────────────────────────────────────────────────────────┘
```

---

#### Post-Mission Standing Report

After mission completion:

```
┌────────────────────────────────────────────────────────┐
│  MISSION COMPLETE: VIP EXTRACTION                      │
│  Result: SUCCESS                                       │
├────────────────────────────────────────────────────────┤
│  Reward: $15,000 + 150 Fame                            │
│  Collateral: 1 civilian casualty, $45,000 damage       │
├────────────────────────────────────────────────────────┤
│  FACTION STANDING CHANGES:                             │
│                                                         │
│  🇺🇸 US Intelligence        ▲ +18                      │
│     FRIENDLY (+18) → FRIENDLY (+36)                    │
│     Reason: Mission success (+15), covert bonus (+3)   │
│                                                         │
│  🇨🇴 Colombian Military     ▲ +10                      │
│     NEUTRAL (+2) → FRIENDLY (+12)                      │
│     Reason: Cooperation (+8), intel sharing (+2)       │
│                                                         │
│  🇨🇴 Colombian Public       ▼ -5                       │
│     FRIENDLY (+15) → FRIENDLY (+10)                    │
│     Reason: Civilian casualty (-5)                     │
│                                                         │
│  💀 Los Zetas Cartel        ▼ -22                      │
│     UNFRIENDLY (-18) → HOSTILE (-40)                   │
│     ⚠️ NOW HOSTILE - Territory threats active!         │
│                                                         │
│  📰 Global Media            ▲ +8                       │
│     NEUTRAL (+3) → FRIENDLY (+11)                      │
│     Reason: Successful rescue (+8)                     │
├────────────────────────────────────────────────────────┤
│  TIER CHANGES:                                         │
│  🔓 US Intelligence: Unlocked Safe House Network!      │
│  ⚠️ Los Zetas Cartel: Now HOSTILE - Bounties placed!  │
├────────────────────────────────────────────────────────┤
│  [Continue] [View Factions]                           │
└────────────────────────────────────────────────────────┘
```

---

## 7. GAMEPLAY EXAMPLES

### Example 1: The Police vs Criminal Dilemma

**Scenario:**
You've built TRUSTED standing (+40) with US Police by doing numerous gang busts. Los Zetas Cartel (currently UNFRIENDLY at -30) approaches you with a lucrative offer: eliminate a rival gang for $50,000.

**Decision Tree:**

#### Option A: Accept Cartel Mission
- **Immediate:**
  - +$50,000
  - Los Zetas: +20 Standing (▲ -30 → -10 SUSPICIOUS)
  - US Police: -25 Standing (▼ +40 → +15 FRIENDLY)
  - Public Opinion: -15 (working with cartel)

- **Consequences:**
  - Lose "Consulting Detective" status with police
  - Gain access to black market weapons
  - Rival gang (Sinaloa Cartel): -30 Standing (instant enemy)

#### Option B: Refuse and Report to Police
- **Immediate:**
  - +$0
  - Los Zetas: -20 Standing (▼ -30 → -50 HOSTILE)
  - US Police: +15 Standing (▲ +40 → +55 ALLIED!)
  - Public Opinion: +8 (integrity)

- **Consequences:**
  - Unlock ALLIED benefits with police (30% discount, SWAT backup)
  - Los Zetas now HOSTILE (territory attacks, bounties)
  - Police launch operation against cartel (new missions)

#### Option C: Accept but Double-Cross (Inform Police)
- **Immediate:**
  - +$50,000 (upfront payment)
  - Los Zetas: +10 initially, then -60 when betrayed (→ -80 MORTAL ENEMY)
  - US Police: +25 Standing (▲ +40 → +65 ALLIED)
  - Public Opinion: +5 (if kept secret) or -20 (if exposed as double agent)

- **Consequences:**
  - MORTAL ENEMY with cartel (assassination attempts, ambushes)
  - Police use intel for major bust (thank you bonus: +$20,000)
  - Reputation as untrustworthy (all criminal factions: -10 Standing)

**Best Choice Depends On:**
- Current playstyle (law enforcement vs criminal underworld)
- Need for money vs reputation
- Willingness to handle cartel retaliation

---

### Example 2: Corporate Prototype Testing

**Scenario:**
Prometheus Defense (FRIENDLY +20) offers you an experimental power armor prototype to field test. It has 30% chance of critical failure (explosion) but offers +5 DR if successful.

**Decision Tree:**

#### Option A: Accept and Test
- **Immediate:**
  - Prometheus Defense: +15 Standing (▲ +20 → +35 TRUSTED)
  - +$10,000 testing fee

- **Success (70% chance):**
  - Mission succeeds with prototype armor
  - Prometheus: Additional +10 Standing (▲ +35 → +45 TRUSTED)
  - Unlock prototype equipment catalog
  - Public Opinion: +5 (cool tech)

- **Failure (30% chance):**
  - Armor explodes, 2d10 damage to wearer
  - Prometheus: -15 Standing (▼ +35 → +20 FRIENDLY)
  - Public Opinion: -15 (dangerous tech)
  - Media: -10 (corporate negligence story)
  - Mission failure risk

#### Option B: Refuse Testing
- **Immediate:**
  - Prometheus Defense: -10 Standing (▼ +20 → +10 FRIENDLY)
  - $0 reward
  - No risk

#### Option C: Accept but Use in Safe Environment
- **Immediate:**
  - Prometheus Defense: +8 Standing (▲ +20 → +28 TRUSTED)
  - +$5,000 testing fee (half pay for safe test)
  - No combat data = less valuable

- **Success:**
  - Prometheus: +5 Standing (total +13, → +33 TRUSTED)
  - Unlock standard equipment catalog (not prototypes)

- **Failure:**
  - Controlled environment = no public fallout
  - Prometheus: -5 Standing (▼ +28 → +23 FRIENDLY)

**Strategic Consideration:**
- Reaching TRUSTED (+25) with Prometheus unlocks 20% discount on all gear
- Worth the risk if you can afford potential failure
- Failure in public vs private dramatically changes consequences

---

### Example 3: Media Scandal Management

**Scenario:**
During a mission, you accidentally killed 2 civilians. World News Network (WNN - NEUTRAL +5) has footage and threatens to run a story. This will:
- Public Opinion: -20
- Police: -15
- Government: -10

WNN offers options:

#### Option A: Full Transparency (Honest Interview)
- **Immediate:**
  - Story runs with your perspective
  - Public Opinion: -10 (reduced from -20 due to honesty)
  - Police: -8 (reduced from -15)
  - WNN: +12 Standing (appreciate honesty) (▲ +5 → +17 FRIENDLY)

- **Long-term:**
  - Build trust with media (future scandals easier to manage)
  - Public sees you as accountable

#### Option B: Suppress Story (Use Government Contacts)
- **Requirements:**
  - Intelligence Services: TRUSTED or higher
  - Success chance: 60% + (Intelligence Standing / 2)

- **Success:**
  - Story buried
  - Public Opinion: -2 (rumors only)
  - WNN: -20 Standing (▼ +5 → -15 UNFRIENDLY)
  - Intelligence: +10 Standing (favor used)

- **Failure:**
  - Story runs anyway, now with "cover-up" angle
  - Public Opinion: -30 (worse than original -20)
  - WNN: -30 Standing (▼ +5 → -25 UNFRIENDLY)
  - Intelligence: -5 Standing (failed operation)
  - Media: Additional -15 (censorship attempt)

#### Option C: Bribe Journalist ($25,000)
- **Immediate:**
  - -$25,000
  - Story doesn't run
  - WNN: -10 Standing (▼ +5 → -5 NEUTRAL)
  - 20% chance of exposure each turn

- **If Exposed:**
  - Bribery scandal breaks
  - Public Opinion: -40 (corruption)
  - All Media: -25 Standing
  - Criminal Factions: +5 (approve of bribery)

#### Option D: Discredit Journalist
- **Requirements:**
  - Intelligence Services: FRIENDLY or higher
  - Spend $15,000

- **Success (50% chance):**
  - Journalist loses credibility
  - Story dismissed as unreliable
  - Public Opinion: -5 (some believe story)
  - WNN: -25 Standing (▼ +5 → -20 SUSPICIOUS)
  - Intelligence: +8 Standing (successful op)

- **Failure:**
  - Smear campaign exposed
  - Public Opinion: -35 (worse than original)
  - WNN: -40 Standing (▼ +5 → -35 UNFRIENDLY)
  - All Media: -20 Standing (attack on press)

**Best Choice:**
- Option A (Honesty) if you value long-term media relations
- Option B (Suppress) if you have high Intelligence standing and need to protect reputation immediately
- High-risk, high-reward: Option B or D could backfire catastrophically

---

### Example 4: Vigilante Turf War

**Scenario:**
Two vigilante groups operate in New York City:

- **The Midnight Watch (Non-Lethal, FRIENDLY +15)**
  - 4 members, Batman-style
  - Want you to capture criminals alive

- **The Enforcers (Lethal, NEUTRAL +2)**
  - 3 members, Punisher-style
  - Want you to execute dangerous criminals

Both offer to team up for a major gang operation. **You can only choose one.**

#### Option A: Team with Midnight Watch (Non-Lethal)
- **Mission:**
  - Capture 12 gang members alive
  - Midnight Watch: +15 Standing (▲ +15 → +30 TRUSTED)
  - Public Opinion: +12 (heroic justice)
  - Police: +10 (arrests)
  - The Enforcers: -12 Standing (▼ +2 → -10 SUSPICIOUS)

- **Unlocks:**
  - Midnight Watch hideout access
  - Borrow "Circuit" (tech specialist) for missions
  - +1 Insight from training

- **Consequences:**
  - Gang members escape from jail (30% chance)
  - If escape: Public Opinion -8, Police -5
  - Enforcers now avoid you in NYC

#### Option B: Team with Enforcers (Lethal)
- **Mission:**
  - Execute gang leadership (8 targets)
  - The Enforcers: +20 Standing (▲ +2 → +22 FRIENDLY)
  - Public Opinion: -8 (controversial killings)
  - Police: -12 (vigilante justice)
  - Midnight Watch: -25 Standing (▼ +15 → -10 SUSPICIOUS)

- **Unlocks:**
  - Enforcers safe house access
  - Joint lethal operations (higher rewards)
  - Access to military-grade weapons

- **Consequences:**
  - Gang permanently dismantled (no escape risk)
  - Media: -10 (violence concerns)
  - Midnight Watch now opposes you in NYC

#### Option C: Decline Both, Solo Operation
- **Mission:**
  - Handle gang yourself
  - Choose lethal or non-lethal on your own terms
  - Midnight Watch: -5 Standing (▼ +15 → +10 FRIENDLY)
  - Enforcers: -3 Standing (▼ +2 → -1 NEUTRAL)

- **Benefits:**
  - Full control over methods
  - No obligations to either group
  - Keep both relationships neutral

- **Drawbacks:**
  - No backup (harder mission)
  - No special unlocks
  - Miss opportunity for strong alliance

**Strategic Consideration:**
- Midnight Watch: Better for heroic playstyle, public approval
- Enforcers: Better for pragmatic playstyle, criminal deterrence
- Solo: Maintain flexibility but miss team benefits

---

## 8. ADVANCED MECHANICS

### 8.1 Faction Discovery System

Not all factions are visible from the start.

#### Hidden Factions

**Criminal Syndicates:**
- Start hidden until discovered
- Discovery methods:
  - Intelligence investigation (requires TRUSTED with Intel)
  - Underworld contact (requires FRIENDLY with any criminal faction)
  - Mission encounter (random chance during criminal missions)

**Secret Vigilante Groups:**
- Operate covertly
- Discovery methods:
  - Media investigation
  - Public rumors (high Public Opinion in city)
  - Direct encounter (save them during mission)

**Corporate Shadow Operations:**
- Public corporations have secret divisions
- Discovery methods:
  - Corporate espionage mission
  - Whistleblower contact
  - Intelligence briefing (ALLIED with Intel)

#### Discovery Benefits

Once discovered:
- Faction appears in Faction Relations screen
- Can begin building standing
- Access to unique missions
- Potential for exclusive equipment/intel

**Example:**
- **Prometheus Defense** is public (known from start)
- **Prometheus Black Division** is hidden (experimental weapons, illegal tech)
  - Discovered by: Corporate espionage mission or ALLIED with Prometheus
  - Provides: Banned weapons, prototype armor, deniable tech

---

### 8.2 Faction Events

Factions generate dynamic events based on standing and world state.

#### Positive Events (High Standing)

**Allied or Devoted Factions:**

- **Gifts:** Faction sends free equipment
  - Police: Body armor, non-lethal weapons
  - Military: Assault rifles, grenades
  - Corporate: Prototype gear
  - Criminal: Illegal weapons, drugs (sellable)

- **Intel Tips:** Faction warns you of threats
  - "We've intercepted chatter about an attack on your base"
  - "Our informant says [enemy faction] is planning an operation"

- **Rescue Missions:** Faction requests your help
  - "Our agent is captured, please extract them"
  - Success: +20 Standing, +$20,000
  - Failure: -15 Standing, faction asset lost

- **Joint Operations:** Faction invites you to major op
  - "We're raiding [enemy stronghold], want to join?"
  - Rewards: +25 Standing, unique loot, +$30,000

#### Negative Events (Low Standing)

**Hostile or Mortal Enemy Factions:**

- **Ambushes:** Faction attacks you during travel
  - Combat encounter on world map
  - 5-10 enemies in tactical combat
  - Lose: Characters captured or injured
  - Win: +10 Standing (they respect strength)

- **Sabotage:** Faction damages your equipment
  - 10% chance per mission that gear fails
  - "Your rifle jams!" (critical failure)
  - Traced back to faction influence

- **Smear Campaigns:** Faction damages your reputation
  - Media: -10 to -20 Public Opinion
  - False stories about your team
  - Requires counter-PR mission to fix

- **Bounties:** Faction places price on your head
  - Mercenaries hunt you (random encounters)
  - Other factions may claim bounty
  - Bounty amount: $10,000 to $100,000
  - Can be removed by: Improving standing or eliminating faction leadership

#### Neutral Events (Any Standing)

- **Faction Wars:** Two factions go to war
  - Must choose side or stay neutral
  - Choosing side: +30 with ally, -40 with enemy
  - Neutral: -10 with both (seen as cowards)

- **Leadership Change:** Faction gets new leader
  - Standing resets to 50% of current value
  - Example: +60 Standing → +30 Standing (new leader doesn't know you)
  - Opportunity to rebuild quickly (new leader wants allies)

- **Scandal:** Faction exposed for wrongdoing
  - Public Opinion of faction drops
  - Can support or condemn faction
  - Support: +20 faction, -15 Public
  - Condemn: -30 faction, +10 Public

---

### 8.3 Faction Alliances (Late-Game)

Once ALLIED (+50) with 3+ factions of same type, unlock **Faction Alliance** system.

#### Alliance Formation

**Requirements:**
- 3+ factions of same type at ALLIED or better
- $50,000 formation cost
- 30-day commitment period

**Benefits:**
- **Unified Command:** All alliance factions share intel
- **Combined Forces:** Call for backup from any alliance member
- **Economic Bonus:** +$10,000/month from alliance
- **Political Power:** Alliance can pressure governments

**Types of Alliances:**

#### Law Enforcement Alliance
- 3+ Police factions at ALLIED
- Benefits:
  - International warrants (arrest criminals globally)
  - Global evidence database
  - Interpol-level coordination
  - +25 Fame in all member countries

#### Military Alliance
- 3+ Military factions at ALLIED
- Benefits:
  - Joint strike forces (military backup anywhere)
  - Strategic weapons access
  - Shared military intel
  - Forward operating bases globally

#### Corporate Consortium
- 3+ Corporate factions at ALLIED
- Benefits:
  - R&D partnership (exclusive tech)
  - Economic power (influence governments)
  - Global logistics (fast travel)
  - +$50,000/month profit share

#### Criminal Empire
- 3+ Criminal factions at ALLIED
- Benefits:
  - Global smuggling network
  - Unlimited black market access
  - Corruption network (bribe anyone)
  - +$30,000/month illicit income
  - **Warning:** Public Opinion in all democratic countries: -40

---

### 8.4 Reputation Decay

Standing is not permanent - it decays over time if not maintained.

#### Decay Rate

| Standing | Decay Rate | Reason |
|----------|------------|--------|
| Devoted (+75 to +100) | -2 per month | "What have you done for us lately?" |
| Allied (+50 to +74) | -1 per month | Expectations remain high |
| Trusted (+25 to +49) | -0.5 per month | Slowly forgotten |
| Friendly (+10 to +24) | -0.25 per month | Minimal decay |
| Neutral (-9 to +9) | 0 | No change |
| Suspicious (-24 to -10) | +0.25 per month | Grudges fade slowly |
| Unfriendly (-49 to -25) | +0.5 per month | Anger diminishes |
| Hostile (-74 to -50) | +1 per month | Willing to forgive eventually |
| Mortal Enemy (-100 to -75) | +2 per month | Even enemies tire of war |

#### Preventing Decay

- **Complete missions for faction:** Resets decay timer
- **Donations:** Small donations (+$5,000) prevent decay for 2 months
- **Joint operations:** Working together maintains standing
- **DEVOTED standing:** Once reached, minimum standing = +50 (can't decay below ALLIED)

---

## 9. IMPLEMENTATION ROADMAP

### Phase 1: Core System (Week 1-2)
- [ ] Create `factionSystem.ts` with interfaces
- [ ] Generate faction database (168 countries × 3 gov factions = 504 government factions)
- [ ] Generate 5 mega-corporations
- [ ] Generate 8 major criminal organizations
- [ ] Implement standing calculation system
- [ ] Add faction standing to `enhancedGameStore.ts`

### Phase 2: Mission Integration (Week 3)
- [ ] Update `missionSystem.ts` with standing rewards
- [ ] Implement collateral damage tracking
- [ ] Add faction conflict resolution (helping one hurts another)
- [ ] Create post-mission standing report UI

### Phase 3: UI Development (Week 4)
- [ ] Create Faction Relations screen in Laptop UI
- [ ] Add faction detail view
- [ ] Implement mission briefing standing preview
- [ ] Add standing change notifications

### Phase 4: Benefits System (Week 5-6)
- [ ] Implement equipment discount system
- [ ] Create unique equipment unlocks
- [ ] Add faction-specific missions
- [ ] Implement backup/support mechanics (SWAT, military, etc.)

### Phase 5: Advanced Mechanics (Week 7-8)
- [ ] Add faction events (gifts, ambushes, intel tips)
- [ ] Implement bounty system
- [ ] Create faction alliance system
- [ ] Add standing decay mechanic

### Phase 6: Vigilante & Media (Week 9)
- [ ] Generate 100+ vigilante groups (tied to major cities)
- [ ] Create media faction mechanics
- [ ] Implement publicity system (public vs covert missions)
- [ ] Add media freedom modifiers

### Phase 7: Polish & Balance (Week 10)
- [ ] Balance standing gain/loss values
- [ ] Tune faction conflict relationships
- [ ] Add faction lore/descriptions
- [ ] Test edge cases and exploits

---

## 10. BALANCE CONSIDERATIONS

### 10.1 Preventing Exploits

**Problem:** Player farms easy missions with one faction to reach DEVOTED, then ignores them.

**Solution:**
- Standing decay requires maintenance
- DEVOTED requires continued interaction (minimum 1 mission/month)
- Benefits scale with recent activity (dormant DEVOTED = reduced benefits)

---

**Problem:** Player bribes way to high standing without earning it.

**Solution:**
- Bribery caps: Maximum +20 Standing from donations (can't buy ALLIED/DEVOTED)
- Bribery discovery chance (democracies punish corruption)
- Requires FRIENDLY to donate large amounts (they won't accept bribes from strangers)

---

**Problem:** Player exploits faction conflicts (helps A to hurt B, then helps B to hurt A, repeat).

**Solution:**
- Factions remember betrayals (switching sides = -40 Standing, labeled "Untrustworthy")
- "Mercenary" reputation (all factions distrust you if you switch too often)
- Some factions refuse to work with "Untrustworthy" characters

---

### 10.2 Difficulty Scaling

**Easy Mode (Forgiving):**
- Standing changes: +50% positive, -50% negative
- Decay rate: 0.5x
- Conflict penalties: -50%
- Collateral forgiveness: Higher thresholds

**Normal Mode (Balanced):**
- Standard values as designed

**Hard Mode (Unforgiving):**
- Standing changes: -25% positive, +50% negative
- Decay rate: 2x
- Conflict penalties: +50%
- Collateral extremely punishing

---

## 11. NARRATIVE INTEGRATION

### 11.1 Faction Storylines

Each major faction has a narrative arc:

#### Example: Prometheus Defense Arc

1. **Introduction (FRIENDLY +10):**
   - Mission: Field test new rifle
   - Meet CEO: Marcus Steele
   - Learn about corporate philosophy

2. **Rising Action (TRUSTED +25):**
   - Unlock prototype lab
   - Meet R&D team
   - Mission: Protect research facility from attack
   - Discover corporate espionage subplot

3. **Climax (ALLIED +50):**
   - Mission: Retrieve stolen tech from rival corp
   - Choose: Return to Prometheus or expose illegal research
   - Decision affects corporation's future

4. **Resolution (DEVOTED +75):**
   - Invited to board of directors
   - Influence company direction (ethical vs profit-driven)
   - Unlock "Corporate Champion" status
   - Final mission: Defend HQ from hostile takeover (literal combat)

---

### 11.2 Faction Questlines

**Multi-Mission Story Arcs:**

#### "The Cartel War" (Criminal Faction)

**Chapter 1:** Introduction
- Los Zetas contact you for small job
- +10 Standing, $5,000

**Chapter 2:** Escalation
- Sinaloa Cartel retaliates
- Choose: Help Zetas or switch sides
- +20 Standing with chosen side, -30 with enemy

**Chapter 3:** Total War
- All-out conflict
- Mission: Major raid on enemy stronghold
- +30 Standing, $50,000, unique weapon unlock

**Chapter 4:** Resolution
- Defeat enemy cartel leadership
- Control their territory (new sectors accessible)
- DEVOTED status with winning cartel
- Consequences: Police and Public Opinion penalties

---

## 12. FUTURE EXPANSIONS

### 12.1 Faction Customization

Allow player to create custom factions:

- **Your Own Organization:** Build reputation as independent hero group
- **Splinter Factions:** Break away from existing faction (create rival)
- **Mercenary Company:** Neutral faction that works for highest bidder

### 12.2 Faction Warfare

Full-scale wars between factions:

- **Territory Control:** Factions fight for sectors
- **Player Choice:** Join one side or profit from both
- **Dynamic World:** Winning factions expand, losing factions collapse

### 12.3 Diplomatic Victory

Win condition: Achieve DEVOTED with all major factions (near-impossible):

- **Master Diplomat:** Balance all relationships
- **Global Influence:** Control world politics
- **Narrative Ending:** Unique ending for perfect diplomacy

---

## CONCLUSION

The Faction Relations System transforms SuperHero Tactics from a tactical combat game into a rich geopolitical simulator where every action has far-reaching consequences. Players must balance competing interests, manage their reputation carefully, and navigate complex webs of alliances and rivalries.

**Core Design Pillars:**

1. **Meaningful Choices:** Every mission affects multiple factions
2. **Strategic Depth:** Long-term planning required (can't please everyone)
3. **Emergent Gameplay:** Faction conflicts create unique scenarios
4. **Replayability:** Different faction paths = different playthroughs
5. **Consequences:** Actions have lasting impact on world state

**Integration with Existing Systems:**

- **Combat:** Tactical missions generate standing changes
- **World Map:** Faction control affects sector accessibility
- **Character System:** Reputation affects recruitment and morale
- **Economy:** Standing affects equipment prices and income
- **Investigation:** Faction relationships provide intel access

This system leverages the existing 168 countries, 1050 cities, and mission framework to create a living, reactive world that responds to player choices.

---

**Next Steps:**
1. Review and approve design
2. Begin Phase 1 implementation (core system)
3. Integrate with existing `missionSystem.ts` and `enhancedGameStore.ts`
4. Create UI mockups for Faction Relations screen
5. Balance testing with real gameplay scenarios

---

*End of Faction Relations System Proposal*
*Version 1.0 - December 11, 2024*
