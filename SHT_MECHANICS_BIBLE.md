# SuperHero Tactics — Mechanics Design Bible

> **Version:** 1.0 — the unified mechanics design, organized from the source data
> **Date:** 2026-06-25
> **Sources evaluated:** `SuperHero Tactics World Bible.xlsx` (Country, Cities, Relations, Characters), the `Combat Compendium REAL` tables, the entire `docs/csv-source-data/Game_Mechanics_Spec/` folder (~45 spec tables), the **FIST GDD v02**, the Origins/Threat/Powers doc, the Wrestling System diagram, and the personality/emotions notes.
> **Purpose:** Be the single organizing document — the *spine* — that ties your years of data into one playable system. Where the source data contradicted itself, this doc makes a **design ruling** (marked ⚖️) so we build one thing, not three.

---

## 0. The one-paragraph pitch (the target)

A **turn-based superhero tactics game with the depth of Jagged Alliance 2 and the world-model of Crusader Kings** — you run a government-backed org (FIST and rivals) recruiting mercenaries and Living Super Weapons (LSWs) to defend your nation across **~168 real countries and ~1,050 cities**, racing a **2,472-day countdown to alien invasion**. You manage the team through a **laptop & phone** (email-as-dialogue, news, investigations), move squads on a **world map**, and drop into **tactical grid combat where heroes fly, throw cars through walls, wrestle, and blast beams through cover.** Saving the game *is* time travel.

**The three influences that define the feel:** JA2 (team/management/tactical layers, mercs with personality), X-Com (3D-grid tactics, international scope, go-to-the-threat), Freedom Force (environmental superpower combat). The hook nobody else has: **turn-based flight on the grid + destructible knockback + a data-driven living world.**

---

## 1. Design Pillars (from the FIST GDD, kept as law)

1. **Data-driven / content-heavy.** Every system is a data table. New content and rebalancing happen in spreadsheets, not code. *(This Bible is the index of those tables — see §14.)*
2. **Characters you care about.** Mercs/LSWs have personalities, relationships, secret lives, age, addictions, and *permanent* death (mostly). Death has a funeral.
3. **Choices with consequences.** Forks-in-the-Road, email replies, and collateral damage ripple through reputation, law, and politics for the rest of the campaign.
4. **The world lives without you.** Countries war, elect leaders, and spawn LSWs whether or not you act.
5. **UI *is* gameplay.** The phone/laptop is the meta-game, not a menu.
6. **Time travel as narrative save.** Loading a save is the Time Walker going to the past — with a sanity cost.

---

## 2. THE SPINE PRINCIPLE (read this first)

Single stats are weak; **combined stats create the game.** The data is layered so that:

```
COUNTRY stats (35 columns: military, intel, corruption, GDP, healthcare,
   science, media freedom, law, LSW activity/regulations, cloning, …)
        │   set the RULES, prices, services, legality, recruitment pool
        ▼
CITY type + crime + population (10 city types, crimeIndex, popRating)
        │   set TACTICAL options, services, encounters, investigations
        ▼
CULTURE region (14 codes) + TERRAIN (25 codes)
        │   set power affinity, social modifiers, map/movement constraints
        ▼
FACTION territory + relations matrix (country×country)
        │   override with home/ally/hostile/neutral modifiers
        ▼
COMBINED EFFECTS = emergent systems (cloning, black market, surveillance,
   safe houses, mercenaries, media control, politics, LSW affairs, …)
```

Everything downstream — mission difficulty, prices, what you can recruit, what's legal, how fast you heal, what powers locals have — is **computed from the country/city/terrain/faction the player is standing in.** That is the spine. (Full effect tables in §6 and §8.)

---

## 3. CORE RESOLUTION ENGINE — the "4CS" Universal Table

All actions (combat and non-combat) resolve on one chart, derived from the public-domain **4C System** (a *Marvel Super Heroes / FASERIP* descendant). This is the heart.

### 3.1 The seven primary stats
| Stat | Governs |
|---|---|
| **MEL** Melee | to-hit for melee/unarmed |
| **AGL** Agility | to-hit for ranged/energy, dodge, initiative, base movement |
| **STR** Strength | melee damage, knockback distance, lift/throw capacity |
| **STA** Stamina | health pool, endurance |
| **INT** Intelligence | tech/tactics, investigation, invention |
| **INS** Instinct | initiative, perception, detection |
| **CON** Concentration | resist mental, sustain powers, psychic attack power |

**Derived:** Health = `STA×2 + STR` · Initiative = `(AGL+INS)/2 + mods` · Karma/Luck = `(INT+INS+CON)/3`.

### 3.2 Rank tiers (FASERIP ladder)
Raw values map to ranks: Feeble(1–2) · Poor(3–5) · Typical(6–10) · Good(11–20) · Excellent(21–30) · Remarkable(31–40) · Incredible(41–50) · Amazing(51–75) · Monstrous(76–100) · Unearthly(101–150) · Shift X/Y/Z · Class 1000/3000/5000 · Beyond. *(Same ladder governs strength→lift, knockback→distance, etc. — one scale to rule them all.)*

### 3.3 Resolution procedure
1. Pick the stat (MEL melee / AGL ranged / CON mental).
2. Compute the **final column** = stat rank ± **Column Shifts (CS)** from skills, powers, stance, cover, target dodge, range, altitude, terrain.
3. Roll **d100**.
4. Read the outcome band on the final column → one of **Failed / Minor / Success / Major**.
   - Failed = miss (0×) · Minor = glancing (0.5×) · Success = solid (1.0×) · Major = critical (1.5× + knockback + crit-table roll).
5. Apply damage × multiplier − armor DR; apply knockback, status, crit.

**Column Shift is the universal currency.** Every modifier in the game is expressed as ±CS, so they all stack on one axis. (Dodge converts AGL/AGL+INS → −CS for the attacker; cover +1/+2/+3 CS defense; altitude height +1..+3 CS; range −1..−3 CS; etc.)

> ⚖️ **RULING — one table:** Ship **`Universal_Table_FIXED`** (roll 99 = always Fail, 00 = always Major; Majors stay rare until high tiers). Retire the base table (power-creep) and keep `Advanced_Universal_Table` only as the lookup implementation. This kills the #1 contradiction across the combat files.

---

## 4. CHARACTER MODEL

A character is **~55 fields** in nine groups (the `Complete_Character_Sheet`):

- **Primary stats** (the 7 above).
- **LSW classification:** Origin (9 types), Threat Level (Alpha→5), Primary/Secondary/Tertiary **Powers**.
- **Identity:** real name, code name, secret-identity flag, age, nationality, current location.
- **Skills / Talents / Martial Arts:** 11 combat skills, 45+ talents, ~10 martial-art styles (each a ±CS package, see §5.8).
- **Personality & Emotions:** one of 20 personality types → drives **combat AI target choice** (§5.10) and idle behavior.
- **Career & Education:** 7 career categories × 5 ranks; 9 education tiers → unlock research/tech (§7.6).
- **Health & Injuries:** HP, wounds, status effects, addictions, terminal disease.
- **Relationships:** who loves/hates whom (affects squads, morale, FITR events).
- **Background:** legal history, fame, country reputations.

**Origins (9)** each grant tendencies + a **weakness** and a **threat/reputation modifier**, and change **damage interactions**: e.g. *Tech Enhancement* takes +80% from EMP/drain; *Construct* can't bleed, immune to poison; *Altered (elemental)* takes extra from the opposing element; *Alien/Cosmic/Divine* gated by artifacts/equals. (Source: `Origin_Types`, `Origin_Damage_Interactions`.)

**Threat Level (the LeFevre scale):** Alpha (peak human) → L1..L5 (reality-altering). Used everywhere: initiative bonus (+5/level), mission gating, scaling. Three optional scoring lenses exist — **PCF** (raw power = Intensity×Control×Range/1000), **STAM** (volatility/intent), **SPAM** (situational) — useful for AI threat assessment and recruitment pricing.

> ⚖️ **RULING — characters don't level up** (per GDD). They improve only through **training** (raises stats/skills, and *erodes* without upkeep) and gain **one extra power** via the Time Chain. This is JA2-merc growth, not RPG XP — keep it.

---

## 5. TACTICAL LAYER (Combat)

2D grid with a **Z (altitude) axis**. 1 square ≈ 2 m.

### 5.1 Turn & action economy
- **6 AP / turn.** Move = 1 AP/sq (cap = AGL/5 sq base) · Attack = 3 AP · Power = 1–10 AP · Aim = 2 AP (+1CS, ×3) · Reload/Item/Stand/Cover = 2 AP · Sprint = 2× move, no attack.
- **Initiative** = (AGL+INS)/2 + threat/power/surprise mods; act high→low; **Overwatch/Ready** interrupts (X-Com style).
- **Free-movement / exploration phase** before contact (no AP); on first enemy sighting → "CONTACT!" → initiative → AP combat begins.

### 5.2 Stances & modes (`Combat_Modes_Stances`)
Persistent **stances** (Neutral/Defensive/Aggressive/Grappling/Low/Mobile/Power/Sniper) trade offense↔defense↔movement in ±CS; toggle **modes** (Alert/Overwatch/Aim/Suppressive/Guard/Ready) cost AP and enable reactions. Character-specific: Berserk, Focus, Stealth, Flight-Combat, Super-Speed (extra actions).

### 5.3 Grid, range, cover, LOS
- Range bands: Point-blank +2CS / Short 0 / Medium 0 / Long −1 / Extreme −2 / Max −3, capped per weapon.
- Cover: Light +1 / Medium +2 / Heavy +3 CS defense; **destructible** (cover degrades a tier when penetrated).
- LOS raycast; partial cover −1..−3CS; area effects bypass LOS.

### 5.4 ⭐ FLIGHT & ALTITUDE — the signature system (`Flight_Altitude_System`)
**7 discrete altitude levels (Z0 ground → Z6 extreme).** Each adds movement cost, height **+1..+3 CS** advantage, and **−CS to-hit-from-ground / weapon falloff** as you climb. Transitions are actions: Takeoff/Land (2 AP, vulnerable), Climb/Dive (1 AP; Dive = +1CS & +50% move; Hover = +1CS but sitting duck), Emergency Descent, Strafing Run, Aerial Intercept, **Aerial Grapple** (both may fall). **Indoor ceilings cap altitude** (max Z = ceiling_ft ÷ 10); breaking through ceilings needs a STR check + structural damage; subways = no flight. Weather (wind/storm/fog) applies escalating −CS.

> ⚖️ **RULING — flight balance brakes (sims found these broken):** add **altitude stamina drain** (Z4+ costs 1 STA/turn, Z6 costs 2), **area-weapon falloff at high altitude** (grenades/explosives lose effect Z3+ — fixes the 94.7%-win "altitude bombing"), and **takeoff/landing −2CS defense window** (fixes flyer-vs-ground dominance). Indoor/urban/weather already balance flight to ~30–58% win in sims — *those are working as intended and are the reason maps must vary.*

> ⚖️ **RULING — altitude scale unification:** altitude LEVELS (Z0–Z6) are the grid truth; "power tiers add +X feet" only sets a flyer's **max reachable Z**, not a second unit. One model.

### 5.5 Attack resolution & damage
- **To-hit:** MEL (melee) / AGL (ranged & thrown) / CON (mental) / INT or AGL (tech).
- **Damage:** melee = STR(+power) ; ranged = weapon ; thrown = STR + object ; energy/mental = power rank (often **ignores physical armor**).
- **Armor:** `Final = Damage×OutcomeMult − Effective_DR`, where `Effective_DR = DR × (1 − penetration_mult)`. Separate Physical/Energy/Mental DR pools.
- **30+ damage types** (`DAMAGE TYPE TABLE`), grouped Physical / Bleed / Energy / Biological / Mental / Other — each with distinct riders (fire spreads & persists; electricity ×2 vs robots & paralyzes; radiation melts living only; acid ×2 vs armor; psychic/laser/plasma penetrate cover ×2; siphon heals attacker; disintegration; asphyxiation; etc.). *This is the depth that makes team composition and damage-typing matter.*

### 5.6 Criticals & injury (`CRIT TABLE`, `Injury_System`)
A **Major** (or called shot) rolls the crit/injury table → **body-part targeting** and severity: bruise/KO/broken jaw/ribs/head-trauma (smashing); puncture/punctured-lung/eye-gouge/through-and-through (piercing); hamstring/finger-chop/limb-loss/artery (slashing). Severe outcomes apply **permanent disability** (lost eye/arm/leg → stat penalties) curable only by **Regeneration power, prosthetics (tech tree), or hospital surgery + weeks.** Death → Dying → death saves → permadeath, with **cloning** (country-gated) as the resurrection hook. A d100 wound table maps overall outcome (Fatal→Survivability incl. "Adrenaline Rush" auto-stabilize).

> ⚖️ **RULING — one crit path:** the prototype %-roll crit table is deprecated; use the body-part crit table feeding the `Injury_System` d100 wound roll (modifiers: Major −0, called-shot −30, overkill −20). One pipeline: *hit → Major/called → crit table (what & where) → injury table (how bad & recovery).* 

### 5.7 Status effects (`Status_Effects_Complete`)
A large catalog in **severity tiers I/II/III** with durations and **treatment tiers** (time → first-aid → hospital → advanced → power). Includes the combat CC suite (stun/daze/prone/blind/frozen/burning/paralyze/fear/berserk/confuse/charm/mind-control), the medical suite (bleeding/poison/disease/radiation/sickness), and the meta suite (power-dampened/drained, memory-loss, cloned, hospitalized, quarantined) — plus **wrestling holds** (pinned/choked/limb-damaged) and **temporal** effects (aged/time-displaced/reality-phased).

### 5.8 Strength, lifting, throwing, environment (`STRENGTH AND WEIGHT`, `Lifting_Throwing_Projectile_System`, `Environmental_Objects`)
- **Strength ladder** maps STR rank → liftable weight (Typical 200 lb … Remarkable 1 ton … Amazing 5 t … Monstrous 10 t … Unearthly 25 t … Shift+ cosmic). Same ladder gates *what materials you can break* (glass→drywall→wood→brick→concrete→steel→titanium→vibranium→adamantium).
- **~50 environmental objects** you can grab & throw, each with weight, damage, area, **STR requirement**, dollar value, and **legal consequence tier** (trash can $50/minimal … city bus $300k STR60+/extreme … nuclear cask $1M/ultimate). Throwing a car is real and *expensive*.

> ⚖️ **RULING — one throwing formula** (three conflicting ones exist). Canonical:
> `Range_sq = clamp( (STR_rank_value − Weight/50) , 1 , STR/10 )` ;
> `Damage = base_by_weight_class + STR/scale + (squares_thrown × 3, cap +15 momentum)` ; heavy/vehicle throws apply −1..−3CS accuracy and area damage = 0.75× to adjacent. Fill the **STR 50–81 gap** in the equivalencies table so the ladder is continuous.

### 5.9 Wrestling / grappling (`Wrestling_Martial_Arts_Complete` + diagram)
A real **state machine**: Standing Clinch → Mount / Back / Side / Half-Guard / Guard / Turtle, each with AP upkeep and strike ±CS. Initiate (4 AP) = `(STR+MEL)/2` vs `(STA+MEL)/2` on the Universal Table; a **3-roll struggle** decides position/escape/reversal. **Holds & submissions** (arm-lock, RNC, triangle, kimura, guillotine, crushing-hold STR50+) and **throws** (hip/shoulder/suplex/power-slam/sweep/spinning/counter/superhuman-launch STR70+). **Martial arts** specialize it (Judo +throws, Aikido +redirect/defense, Krav Maga +escape/strikes, Wrestling +control, BJJ-style submissions, Boxing/Capoeira/Ninjitsu). **Super-strength grappling** scales to throw-through-walls and orbital throws. *This is one of the most complete systems in the data — lead with it as a differentiator.*

### 5.10 ⭐ Personality-driven AI (`PERSONALITY TARGET SELECTION`)
Each of **20 personality types** maps to a combat **target preference**: *most health / least health / major threat (most damage dealt) / minor threat / random.* Combined with origin/threat and stance, this gives enemies (and AI allies) **character-consistent behavior** — a bully focuses the weak, a pragmatist focuses the biggest threat. Extend this into idle/world behavior (the GDD's "becoming familiar with the city / texting concerns / hiding an addiction").

### 5.11 Sound, stealth, doors (`Sound_Detection_System`, `Door_Interaction_System`)
Full **decibel model**: actions emit dB (careful-walk 15 … pistol 140 … explosion 180), walls dampen by material, and `Hearing_Range = (INS/5) × (Effective_dB/30)`. Suppressors + careful movement = sub-threshold (JA2 stealth). Doors/windows/furniture have HP, STR-to-break, lock tiers (pick AP 3–8 / breach charge / kick / ram), soundproofing, and **cover values** (flip a table = +1CS; topple a bookshelf = crush damage). This is the JA2 "interior tactics" texture.

### 5.12 ⚖️ BAMPI — formalize the attack-shape system
The data names five attack shapes — **B**eam, **A**rea, **M**elee, **P**rojectile, **I**nstant — but the `BAMPI` table is only notes. **Ruling: make BAMPI a first-class attack descriptor** every weapon/power carries:
- **Beam:** sustained, must maintain aim across turns to keep damaging; **chargeable** (more damage, but stand still & become vulnerable, risk collateral); penetrates per type.
- **Area:** AoE with center→edge falloff; altitude falloff (§5.4).
- **Melee:** range 0–1, uses MEL, enables wrestling.
- **Projectile:** travels, can be dodged/intercepted, penetration & continuation (line attacks hit up to 5 targets, damage drops each pass).
- **Instant:** hitscan (laser/psychic), can't be dodged by sub-light targets.
This single descriptor drives a **Power Activation Engine** (`activatePower(unit, power, target)` that branches on BAMPI) — the missing piece that makes all 30+ powers actually castable.

---

## 6. WORLD LAYER (Strategic map)

The map is **sectors** (~500 km each) over Earth (later: alien worlds, space). You issue squad orders; time runs in real-ish time; you go *to* the threat (X-Com/Dragon-style).

### 6.1 Country attributes → effects (THE SPINE, `Country_Attribute_Effects`)
All ~35 country columns translate to **±CS and access rules**. Examples (full table in source):
| Stat | High value does… |
|---|---|
| Government type | Democracy: +2CS legal / −1CS covert. Authoritarian: inverse. |
| Corruption | High: −2CS official, **+3CS bribes/blackmail**, cheap black market. |
| Military / Intel budget | High: −2CS infiltration & covert, +detection risk, +military gear access. |
| Media freedom | High: +media-investigation, −cover-ups (and vice-versa for propaganda). |
| Healthcare | High: faster healing, +medical methods, **enables cloning**. |
| Science + Education | High: +tech research speed, reverse-engineering, "innovation hub." |
| LSW activity / regulations / vigilantism | Set recruitment rate, encounter frequency, and **whether public ops are legal**. |
| Cloning | Banned → permadeath; High → 90% resurrection, 7-day clone. |
| Cyber | High: −hacking, +cyber surveillance. |

**Combos** (the emergent layer): High Military+Intel = *Security State*; Low Gov+High Corruption = *Failed State* (only force/bribes work); High Sci+Edu = *Innovation Hub*; High Healthcare+Cloning = *Medical Center*; High LSW+Legal = *LSW Haven* (+4CS recruitment).

### 6.2 City types → effects (`City_Type_Effects`)
10 types (Temple/Military/Political/Industrial/Resort/Seaport/Mining/Educational/Company/Village). Each sets **investigation bonus, recruitment pool, equipment access, a special ability, and LSW power affinity** (e.g., Military = +military investigations/recruits + arsenal −20% gear; Temple = +mystical + 24h sanctuary; Seaport = +smuggling/maritime). Multi-type cities stack (secondary = half). **Crime index** and **population rating** further modify stealth vs resources and legal vs underground access.

### 6.3 Culture (14) & terrain (25)
- **Culture regions** give social ±CS (same-culture +2, opposed −1; language barrier −2) and **power affinity** (South Asia +2CS spiritual & mystical LSWs; North America +2CS tech investigations & mutation powers; etc.).
- **Terrain codes** set **map tactics + travel cost** (desert +50% move/low cover; jungle +75% & concealment; mountains +100%; ice/snow hazards; wasteland/exclusion-zone radiation). Terrain also picks the **combat map template**.

### 6.4 Factions, relations, territory
4 playable factions — **US/FIST** (military-industrial), **India/Establishment 24** (spiritual-diplomatic), **China/Collective** (surveillance-control), **Nigeria/Adaptive** (resource-network) — each with starting territories, a signature investigation method, win condition, and ±CS identity. A full **country×country relations matrix** (World Bible "Countries Relations Chart") drives alliances/wars; **faction territory** overlays **Home (+3CS, legal immunity) / Ally (+1) / Hostile (−2) / Neutral** on top of base country stats. (Many more NPC factions exist for combat: police, military, mercs, super-criminals, terrorists, jackals, militias — the GDD's full faction list.)

### 6.5 Travel, vehicles, living world
- **Travel-time system** by mode (walk/vehicle/train/commercial-air/private-jet/military/ship/sub/**LSW flight & super-speed/teleport/time-travel**) × distance band; complications (weather/checkpoints/customs) add delay & detection. Time ratio ≈ **1 real day : 30 game days** → 82 real days to the 2,472-day invasion.
- **Vehicles** double as world-map movement *and* tactical units (ground/air/sea, with HP/DR/passengers/weapon-mounts).
- **Dynamic political events + world-state sim** (`Dynamic_Political_Events`, `World_State_Tracking_System`): tech wars, border crises, resource wars, treaty revisions, cyber/temporal crises — fired by player actions or AI, cascading through the relations matrix. **The crime/underworld simulation** (already built in code: org lifecycles, 16 activities, weekly tick, per-city crimeIndex) feeds missions/news/investigations.

---

## 7. LAPTOP & PHONE LAYER (Meta-game)

Opening the laptop **pauses time** (you may un-pause). Four apps + the phone.

### 7.1 EMAIL = the dialogue/mission system (signature)
RPG dialogue happens **as email.** Pick a *Subject*, the body shows the reply options, hit **Send** = your choice. **Priority** flags mark urgent (mission-givers, heads of state). Ignoring email lets events happen without you. *This replaces the "walk to the wizard" loop — missions arrive in your inbox.* (`Email_Investigation_Templates`.)

### 7.2 NEWS
- **"Point of Interest"** (international) telegraphs AI faction moves (e.g., troop buildup before an invasion).
- **BNN/ANN** (national) surfaces super-criminals, elections, scandals, and **investigation clues** (cities of interest). News is generated from world-state + your missions (already wired in code).

### 7.3 PERSONNEL
Roster + detailed unit sheets (stats/powers/skills/relationships/popularity), **who loves/hates whom (emojis)**, **country relationships** (who's near war), potential recruits (vigilantes/foreign nationals/imprisoned super-criminals), a **prisoner database**, and **obituaries** (a dead hero stays on the roster until their funeral).

### 7.4 INVESTIGATIONS → the engine that builds tech & missions
A loop: an **email alert** (template chosen by city/type/country) → choose a **method** (Covert / Official / Force / Diplomatic, with **faction-signature methods**) → resolve on the Universal Table using **investigator skills** + country cooperation + city/culture ±CS → **consequences** (intel, relationships, follow-ups, legal/political fallout, **combat trigger**). Outputs: build **tech suits** (flight/fighting/stealth), **reverse-engineer** defeated-enemy tech, repair robot teammates, find recruits. (`Investigation_Templates/Methods/Skills/Consequences`.)

### 7.5 PHONE (dial-a-number)
Literally call characters/governments/orgs by number — order a robot from a Chinese lab, ask Pakistan for an alliance, call the teleporter from Saudi Arabia. Numbers can be handed out like cheat codes IRL. Speaker mode renders dialogue as louder comic bubbles.

### 7.6 DAILY ACTIVITIES, careers, tech, research
Idle units take **activities** (the GDD status system): **Ready, Patrol** (catch crime live, +popularity, street intel), **Train** (raise stats/skills — *they erode without it; robots can't train*), **Hospital** (heal/injury/disease/mental/terminal), **Investigation, CovertOps** (rescue/assassinate/sabotage abroad), **Engineering** (build suits/robots/implants, repair tech mates), **Research** (unlock suits, power-combos, cures, analyze evidence), **Personal Life** (secret identities), **Off-the-Grid** (hide, +travel time), **Travel, Recruit.** Careers: **7 categories × 5 ranks** (Medical/Arts/Liberal-Arts/Engineering/Business/Psychology/Physical) and **9 education tiers** gate **technology trees & research projects** (the path to advanced suits, implants, cloning, prosthetics).

---

## 8. COMBINED-EFFECTS SYSTEMS (the spine, made playable)

Each is a formula over country/city stats (the data supports all of these; several already exist in code):

| System | Driven by | Gives |
|---|---|---|
| **Cloning / resurrection** | Healthcare + Science + GDP + country Cloning law | clone quality, wait time, memory-transfer success |
| **Black market** | Corruption + Military − Law | illegal gear access & price |
| **Surveillance / detection** | Intel + Cyber + (100−MediaFreedom) | how fast you're spotted; hack difficulty |
| **Medical / recovery** | Healthcare + GDP + Lifestyle | hospital quality, recovery speed |
| **Research speed** | Science + Education + GDP + Cyber | tech-unlock rate |
| **Organized crime** | Corruption + (100−Law) | gang missions, underworld contacts |
| **Mercenaries** | Military + GDP + Corruption | merc availability/quality/price |
| **Safe houses** | Corruption + (100−Law) + (100−Intel) | hideout security |
| **Border control** | Military + Intel + Law | visa difficulty, smuggling, escape routes |
| **Media control** | MediaFreedom + Corruption + Cyber | story planting, troll farms, censorship |
| **Politics** | GDP + Corruption + MediaFreedom | lobbying, bribes, coup chance |
| **LSW affairs** | LSWActivity + Intel + Military + Science | registration, govt stance, public opinion |

> ⚖️ **RULING:** these are the *point* of the spine. Each must actually feed mission generation, prices, and difficulty (the code currently computes some but doesn't consume them). Wiring this is the highest-value strategic-depth work.

---

## 9. ECONOMY, FAME & CONSEQUENCES (`Public_Perception`)

- **Fame** rises with heroics, falls with civilian harm; gates recruitment, prices, mission access, and villain attention. **Public opinion** is tracked per country.
- **Reputation events** have a **scale** (local→global), a **reputation delta**, a **financial cost**, a **legal action**, and an **insurance impact** — from "stopped street crime (+2, reward)" to "nuclear facility damage (−50 global, $100M–10B, environmental-terrorism charges, global insurance collapse)." Collateral damage is a *years-long* consequence, not a slap.
- **Legal system** scales by jurisdiction & country stats (allied nations minimal; hostile escalated): property → civil suits → federal → war-crimes.

---

## 10. PROGRESSION & SCALING (`Player_Scaling`)

**6 tiers** gate geographic scope, team size, funding, tech, authority, and the **threat-level cap** you may face:
1 Street Operative (1 city, 1–2, $5–15k, ≤L1) → 2 City Defender → 3 Regional Agent → 4 National Operative → 5 International Coordinator → 6 Cosmic Guardian (unlimited, 8–15, $2M+, L5+). XP by mission type (street +50 … alien-contact +3000). **Catch-up** via mentoring (+50% XP), resource/intel sharing, and **geographic separation** (new players seeded to different regions so veterans don't dominate — the MMORPG/multiplayer hook, deferred).

---

## 11. TIME & THE TIME-TRAVEL SAVE (signature)

Time advances continuously on the world layer (≈1 real day : 30 game days), pausable in the laptop. **Saving/loading is diegetic time travel** via the Time Walker (Sandra Locke):
- **To the past = load a save**, but each jump **drives the Time Walker toward madness** and *reduces available destinations* (save slots/checkpoints). You can run tasks to realign the timeline and recover sanity.
- **To the future = win against impossible odds**, at the cost of **temporarily losing the Time Walker** (no time travel until she returns) — and she comes back *changed* (cyborg arm, warnings, even a duplicate of a teammate).
This turns save-scumming into a *mechanic with consequences* and a story engine. (Greenfield — design now, build later.)

---

## 12. STORY & FACTION CONTEXT (frame for content)

2019: musician **Rusty Richards** vanishes, returns claiming Earth is responsible for an alien genocide; an armada arrives in **2,472 days.** The Greys gene-modify select humans into **LSWs**. After the "Tragedy at Andrews," the UN passes the **LSW Threshold Treaty** (no superhumans across borders). The US spins up **FIST** (First Infantry Strike Team) under Vaughn Galloway to recruit/contain/eliminate. Four faction powers emerge (US, India/Establishment 24, China, Nigeria). Named leads exist (Kaiser Eziobi/Lagos, Col. Raghavan Reddy/India, Liu Xiao/China, etc.). Content is written by pro writers; **death matters, funerals happen, some return like comics.**

---

## 13. DESIGN RULINGS (the canonical contradiction-fixes, collected)

1. **Universal Table:** ship `_FIXED`; retire base. (§3.3)
2. **Crit/injury:** one pipeline (crit table → injury d100); drop prototype %-table. (§5.6)
3. **Throwing:** one formula; fill STR 50–81 gap. (§5.8)
4. **Flight balance:** altitude stamina, area-weapon falloff, takeoff/landing window. (§5.4)
5. **Altitude:** Z-levels are truth; power tiers set max-Z only. (§5.4)
6. **BAMPI:** promote to a real attack-shape descriptor + a Power Activation Engine. (§5.12)
7. **Strength ladder = the one rank ladder** for lift/break/knockback/throw. (§3.2/§5.8)
8. **No XP leveling;** growth via training (with erosion) + 1 power via Time Chain. (§4)
9. **Combined-effects must be consumed** by mission-gen/pricing/difficulty, not just computed. (§8)
10. **Three city/country datasets exist** (`worldData` 43 = legacy; `allCountries`/`allCities` 168/1050 = canonical; `cities.ts` used by combat). **Unify on `allCountries`+`allCities` (ISO-code linked).** (build note)

---

## 14. DATA → MECHANICS MAP (so it stays data-driven)

| System | Source of truth |
|---|---|
| Resolution / stats | `Universal_Table_FIXED`, `Primary_Stats_Spec`, `Stat_Rank_Mapping` |
| Turn/grid/stances/dodge | `Initiative_Turn_Order`, `Tactical_Grid_System`, `Combat_Modes_Stances`, `DODGE CHART` |
| Damage/types/crit/status/injury/knockback | `DAMAGE TABLE`, `DAMAGE TYPE TABLE`, `CRIT TABLE`, `Status_Effects_Complete`, `Injury_System`, `Knockback_Mechanics`, `Penetration_Continuation_System` |
| Strength/wrestling/throwing/skills | `STRENGTH AND WEIGHT`, `Wrestling_Martial_Arts_Complete`, `Lifting_Throwing_Projectile_System`, `Environmental_Objects`, `Complete_Skills_Talents`, `Improvised_Weapons` |
| Powers/origins/threat/flight | `LSW_Powers_Complete_Database`, `LSW_Power_Combat_Mechanics`, `Origin_Types`, `Origin_Damage_Interactions`, `Flight_Altitude_System`, `Building_Flight_Limitations`, `Power_Attack_Stats` |
| Equipment | `Weapons_Complete`, `Armor_Complete`, `Ammunition_System`, `Vehicles_Complete`, `Tech_Gadgets_Complete`, `Sound_Detection_System`, `Door_Interaction_System` |
| Geopolitical spine | World Bible `Country`/`Cities`/`Countries Relations`, `Country_Attribute_Effects`, `City_Type_Effects`, `Culture_Region_Effects`, `TerrainCodes`, `Faction_Specification`, `Faction_Relationships_Complete`, `Travel_Time_System` |
| Strategic/meta | `Investigation_*`, `Email_Investigation_Templates`, `Daily_Activity_Framework`, `Time_Management`, `Education_Career_Complete`, `Technology_Trees_Integrated`, `Research_Projects`, `Public_Perception`, `Player_Scaling`, `Dynamic_Political_Events`, `World_State_Tracking_System` |
| Personality AI | `PERSONALITY TARGET SELECTION`, Personality/Emotions notes |
| Characters | World Bible `Characters`, `Complete_Character_Sheet`, `Character_Builder`, `Character_Archetypes` |

---

## 15. HOW THIS MAPS TO THE BUILD (brief)

The code already has: the FASERIP combat scene, 168 countries / 1050 cities, the crime sim, factions/squads/bases/territory, news/economy/time engines. The biggest **mechanics gaps vs this Bible**: (1) **flight/altitude Z-axis** (combat grid is 2D today), (2) **Power Activation Engine + BAMPI** (only ~2 of 30 powers fire), (3) **combined-effects consumption** (computed, not used), (4) **dataset unification** (3 overlapping country/city sets). These four are the design-critical bridges from "rich data" to "the game on the page."

---

*This Bible is the organizing spine. Each section points at the data tables that own the numbers, so the game stays content-heavy and re-balanceable without code changes — Pillar #1.*
