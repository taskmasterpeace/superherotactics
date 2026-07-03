# JA2 Gap Analysis — Strategic Layer & World-Map Interaction

> **Framing:** A Jagged Alliance 2 dev-team review of SuperHero Tactics' non-combat
> layer — what exists, what's half-built, what's genuinely missing, and the order to
> fix it in. Written 2026-07-03 off five parallel code audits.
>
> **Verdict legend:** ✅ EXISTS (works today) · 🟡 PARTIAL (scaffolded/stubbed) · ❌ MISSING (design only)
>
> ## ✅ STATUS: FULFILLED (2026-07-03, commits `5bca4c4`…`a5bf954`)
> Every item in the §12 task list shipped and was runtime-verified:
> **P0** phone gating · map→character sheet · build ETA + on-grid state · safe-house
> separation · 120 cities for the 29 empty countries. **P1** ⚡SIMULATE from the
> sector panel (+ dead DEPLOY/ENTER COMBAT buttons wired) · New Pool standing cost ·
> merc-card roster (portrait/condition/mood/weapon) · vehicle purchase + garage
> capacity. **P2** the Design→Research→Fabricate spine (Engineering Bay laptop app;
> the 14 dangling `researchRequired` ids are now a real tech tree; Engineering skill
> speeds fabrication; custom suits land in the armory) · per-item flammability wired
> to combat fire. **P3** sector intel block · right-click merc orders · strategic
> contagion (spread/quarantine/hospital-cure) · the Handler persona texting on
> standing shifts · encyclopedia acquisition tags (BUY/RESEARCH-LOCKED/CRAFTED + 🔥).
> Also shipped alongside: the daily-edition newspaper engine and the LSW rule
> (origins 2-8 = powered LSWs; skilled humans/trained soldiers are baseline humans —
> including the origin-weight NaN fix that had silently prevented ALL LSW spawns).

---

## 1. STOP — You already have this (surfacing, not building)

The single most valuable finding: several things you went looking for are **already built and just not reachable from where you looked.** Do not rebuild these — *expose* them.

| You asked for… | Reality | Where it lives | What's actually needed |
|---|---|---|---|
| "Prototype for fast combat, simulate, see aftermath, measure damage, check scaling" | ✅ **Exists ×4** | `InstantCombat.tsx` (batch sim, win-rates/damage/hit-rates), `FastCombat.tsx` (speed 1x–instant + full attack log), `QuickCombatSimulator.tsx` (auto-resolve + loot/casualties), `npm run test:battery` → `BALANCE_NOTES.md` | Put a **"Simulate"** button in the flow; wire results to a summary screen. Zero new sim logic. |
| "See what it looks like after combat / damage against us" | ✅ Exists | `combatResultsHandler.ts` returns XP, loot-from-enemies, fame delta, damage dealt/taken, collateral, civilian casualties | Surface the aftermath screen post-fight. |
| "How do I see character stats / the sheet?" | ✅ Exists | `CharacterScreen.tsx` — tabs Identity, **Psyche** (mood/MBTI/calling/roles), Stats, Powers, Skills, Equipment, Background, World, Faction | Add a click path **from the map roster** (see §4). Reach it today via Laptop → **Operatives** tile. |
| "I don't see personality" | ✅ Exists | The **Psyche tab** (built last session) shows MBTI, volatility, drive, aggression, calling | Same visibility fix as above. |
| Soldier/specialist/scientist/investigator/operative/support | ✅ Exists | `CharacterRole` + role-effectiveness engine drives the strength bars | Nothing — working. |
| Contagious diseases | 🟡 Foundation exists | `diseased` status (30-turn contagion), `BIOTOXIN_DISEASE` + `NECROTIC_BITE` damage types | Combat contagion is wired; only the **strategic** spread (roster/city) is new. |
| Vehicles ("where are they stored?") | 🟡 More than "data only" | `fleetVehicles` state, assign/unassign actions, **VEHICLES tab** with crew mgmt | Add purchase + a **garage** home (see §8). The CLAUDE.md "DATA ONLY" note is stale. |
| Where vehicles/militia/liberation live | ✅ In the store | `trainSectorMilitia`, `liberationProgress`, `repairVehicle` all exist | Not shown on the map (see §3). |

**Takeaway:** ~40% of your "missing" list is a *visibility* problem, not a *build* problem. That's the cheapest, highest-impact work available.

---

## 2. The real gaps (what to actually build)

| Gap | Verdict | Why it matters |
|---|---|---|
| **Design → Research → Fabricate loop** | ❌ | The spine that makes Engineering, research stations, crafting facilities, and the scientist/specialist roles all matter at once. §5. |
| Character sheet unreachable from map | ❌ | You literally couldn't find it. §4. |
| Facility build ETA + on-grid "under construction" state | 🟡 | Time is tracked; nothing shows on the grid. §7. |
| Per-item flammable rating | 🟡 | Fire system exists but is tile-based; items have no material. §6. |
| Cities for 29 empty countries (Albania et al.) | ❌ (data) | Genuine data gap, *not* a lookup bug. §9. |
| New Pool costs nothing / no standing hit | 🟡 | You asked for it to cost handler standing. §9. |
| Phone shows team before you hire anyone | 🐛 | Seed characters leaking through. §11. |
| Map roster has no portraits, no enemy presence, no sector inventory, no right-click, no map-side assignments | ❌ | Core JA2 texture. §3. |

---

## 3. World-Map Interaction Panel (JA2 controls & visibility)

**File:** `components/WorldMap/WorldMapGrid.tsx` (~2500 lines)

### What's already good ✅
- **Individual merc selection** — map markers + roster, single & **shift-click multi-select** (true JA2 selection).
- **Squad management** — full SQUADS tab (create, assign members, morale, vehicle).
- **Travel** — select merc(s) → click sector → animated move with **ETA countdown** + dotted path + cancel.
- **Territory/faction overlays** — control colors, contested pulse, home-country gold tint, country locator search.
- **Sector panel** — region, countries (with border security), city list, terrain/climate, available missions.

### The JA2 texture that's missing ❌ / 🟡
| Capability | Status | Note |
|---|---|---|
| **Click merc → open character sheet** | ❌ | `onCharacterClick` exists but only `console.log`s (line ~2464). **This is why you couldn't find stats.** |
| Merc **portraits** in roster | ❌ | Roster shows a status icon only; portraits exist in `CharacterPortrait`. |
| Roster at-a-glance (wounds, morale trend, equipped weapon, contract) | 🟡 | Only status icon + sector today. |
| **Enemy presence / troop counts** per sector | ❌ | Territory % shows; no unit counts, no threat heat. |
| **Militia** on map | ❌ | `trainSectorMilitia` exists in store; never displayed. |
| **Sector liberation** progress bar | ❌ | `liberationProgress` tracked; not shown. |
| **Sector inventory** (loot cached in a sector) | ❌ | No concept yet. |
| **Right-click context menu** (merc/sector) | ❌ | No context menus anywhere. |
| **Map-side assignment** (patrol / train / doctor / repair here) | ❌ | Systems exist; no map buttons. JA2's whole assignment UX. |
| **Fog of war** on the strategic map | ❌ | All sectors always visible. (May be intentional — superhero recon.) |
| Hotkeys | ❌ | Mouse/button only. |

### Designer recommendation
The map is a solid skeleton. The JA2 *feel* comes from three additions, in order:
1. **Click roster/marker → character sheet** (trivial, unblocks your #1 complaint).
2. **Merc-card roster** — portrait + condition + mood + equipped weapon + one-click assign. This is the JA2 sidebar.
3. **Sector intel** — enemy presence, militia, liberation bar. Turns the map from a travel grid into a theater of war.

---

## 4. Character visibility & control

Everything a JA2 player wants to *know* about a merc is built — mood, MBTI, calling, role strengths, city familiarity, cover job, injuries, degrees (Psyche + Personnel + Stats tabs). The problem is **reachability**: it all lives behind the Laptop → Operatives tile. Nothing on the world map opens it.

**Fix:** a single `openCharacterSheet(id)` path wired to (a) the map roster row, (b) the map marker, (c) the Personnel row, (d) the phone contact. One action, four call-sites.

---

## 5. THE MISSING SPINE — Design → Research → Fabricate

*This is the headline build.* You said it best: **"designing something is different than making it."** Right now that entire loop is scaffolded but dead:

- **Engineering skill** = a label. Gates nothing, crafts nothing, unlocks nothing (each skill level only gives +5% combat hit).
- **Crafting** = a mirage. `engineering_lab` / `armory` / `pharmacy` facilities have a `craftingBonus`, but it only **discounts purchases** — no recipes, no production.
- **Research** = doesn't exist. Armor pieces reference `researchRequired: 'PRJ_027'`, `'Stealth_2'` — **projects that are never defined**, so that gear is permanently locked.
- **Design vs Make** = no blueprint concept at all.
- **Engineering/Research as activities** = not in the activity scheduler; they're status labels with no output.

### The loop to build (makes 4 systems light up at once)
```
DESIGN            RESEARCH               FABRICATE            EQUIP
(scientist/        (research station,     (engineering_lab,    (unique item
 specialist        INT+time →             armory + character   enters inventory)
 drafts a          unlock blueprint)      Engineering skill →
 blueprint)                               build over days)
```
- **Design** — a scientist/specialist character spends days producing a **Blueprint** (stats + material + requirements). Gated by INT/role. This is the "design" half.
- **Research** — a Research Station (base facility) + assigned character turns a locked concept (those dangling `PRJ_*` refs!) into an available blueprint over time. *The dead armor references become the tech tree.*
- **Fabricate** — the Engineering Lab + a character with the **Engineering skill** builds the blueprint into a real item over days (this is finally what Engineering *does*).
- **Equip** — item lands in inventory like any other.

### Why this is the right investment
One system retroactively justifies: the Engineering skill, the scientist & specialist roles, three base facilities, the `craftingBonus` stat, the `researchRequired` fields, the engineering/research character statuses, and "make your own super-suit." It's the biggest coherence win on the board.

**Scope note:** Start minimal — 1 blueprint type (a custom armor piece), 3 stations, a 3-step flow. Prove the loop, then expand to weapons/gadgets/super-suits.

---

## 6. Combat simulation & item properties

### Fast combat — ✅ already built (see §1). Action: *surface it*, don't build it.
Wire a **"Simulate Battle"** entry point (from a sector's ENTER COMBAT, or a dev/League screen) to `QuickCombatSimulator` for in-game auto-resolve, and keep `InstantCombat` + `test:battery` as the balance tools. Feed `combatResultsHandler` output into a proper aftermath screen.

### Flammable rating — 🟡 clean addition
- **Exists:** `FireSpreadSystem` with `MATERIAL_FLAMMABILITY` (wood 0.9 → kevlar 0.2 → steel 0.0), a `burning` status that spreads and damages armor. But it's **tile-based** — items have no material.
- **Build:** add `material?: string` + `flammability?: number (0–1)` to the Weapon/Armor/Gadget interfaces (`equipmentTypes.ts`), populate the DBs, and let the burning system read an equipped item's flammability. Small, self-contained, high flavor ("your kevlar-vest merc caught fire").

### Contagious disease — 🟡 foundation exists
Combat-level `diseased` contagion + `BIOTOXIN_DISEASE`/`NECROTIC_BITE` are wired. The **new** part is *strategic*: a disease that spreads across your roster/base/city over days (quarantine decisions, medical-bay containment). Reuses the existing status as its combat face.

### Damage/status system — ✅ deep already
12+ damage subtypes, 20+ status effects (burning, bleeding ×3, poisoned ×3, diseased, tear_gassed, eye_burn, stunned, grappled, suppressed, panicked…). Rich foundation; the gap is surfacing/using it, not defining more.

---

## 7. Base building & facilities UX

**Files:** `BaseManager.tsx`, `baseSystem.ts`

### What's solid ✅
- Purchase → name → build flow works: 6 base types (Warehouse→Compound, 9–16 slots, $50k–$500k), 13 facility types with real, wired bonuses (training speed, healing, investigation, crafting-discount, vehicle slots, team capacity, power).
- Construction queue with hours-remaining + progress bar in a side panel.

### The two confusions you hit
1. **"Landlord tips / False walls / Safehouse weekly rentals in Argentina"** → these are **NOT base facilities.** They're the **Safe House** panel — a *separate* country-level weekly-rental hideout system — rendering right next to your base grid with no visual separation. Fix: divider + header ("SAFE HOUSES — temporary rentals, separate from your base") or move to its own tab.
2. **Facility build has no on-grid feedback** 🟡 — time *is* tracked (Training Room = 24h) but the **grid cell shows nothing while building** and there's **no estimated completion time**. Fix: an "under construction" cell state (hardhat icon + % ring) and an ETA line ("completes Day 6, 14:00").

---

## 8. Vehicles

**Files:** `vehicleSystem.ts` (24 vehicles), store `fleetVehicles`, `WorldMapGrid` VEHICLES tab.

### Reality: more built than the docs claim ✅🟡
- ✅ Fleet state, crew **assign/unassign**, VEHICLES tab UI, vehicle-carries-squad-on-travel.
- ❌ **No purchase/acquisition** — 24 vehicles defined, none buyable.
- ❌ **No garage/storage** — "where are they stored?" → nowhere. The **Vehicle Garage** facility even defines `+2/+4/+6 slots` that nothing uses.
- ❌ No vehicle-specific travel modifiers (speed/terrain/fuel defined in data, not wired to `travelSystem`).

### Recommendation
Answer "where are vehicles stored?" by making the **Vehicle Garage facility the fleet's home**: a garage grants slots, vehicles are bought into it, and travel pulls from the garage's sector. Small wiring job that closes the loop and makes a dead facility matter.

---

## 9. Recruitment, handler standing & city data

### New Pool button 🟡
Currently **free**, regenerates 10 candidates, **no standing/cost**. You want it to cost handler/country standing. There's no individual "handler" — the analog is your **home country's government faction standing**. Wire `handleRegeneratePool()` to a small `modifyFactionStanding('government', homeCountry, -N)` + optional cash cost, with the cost shown on the button. (Design: burning through candidate pools makes your employer impatient — good pressure.)

### Handler concept
Consider formalizing a **Handler** as the face of your home-country government standing (a name, a portrait, phone calls when standing shifts) — it'd give the faction number a character. Reuses the phone-call system you just built.

### Cities — genuine data gap (not a bug) ❌
- **1,050 cities across 138 of ~168 countries. 29 countries have ZERO cities.** Lookup is **clean** (ISO code, no name/code mismatch).
- **Albania (AL) is one of the 29.** Others: Andorra, Austria, Bosnia, Brunei, Bahamas, Botswana, Belize, Estonia, W. Sahara, Fiji, Eq. Guinea, Guyana, Iceland, Kyrgyzstan, Monaco, Moldova, Montenegro, N. Macedonia, Namibia, Nepal, PNG, Solomon Is., Slovenia, Slovakia, Suriname, S. Sudan, São Tomé, Eswatini, Uganda.
- **Not a blocker:** the city screen offers a "Use Placeholder City" fallback. But it reads as broken.
- **Fix:** generate 3–8 real cities each for the 29 countries (name, population, type, crime/safety, sector code, culture code) via an agent pass. ~150 city records.

---

## 10. Equipment — designer notes (you asked)

The Equipment Encyclopedia is a keeper. Suggestions:

- **Organize by acquisition, not just type.** Today research-locked gear is dead weight in the list. Tag every item **Buy / Craft / Research-locked / Field-found**, and filter by it. Once §5 ships, "Research-locked" becomes a *goal* instead of a dead end.
- **Tier by world-fit:** Civilian → Military → Superhuman → Prototype. Matches your country black-market/border systems (some tiers only available in the right country).
- **Add the missing categories (spec 28):** **ammo as an item** (currently reload is combat-only), plus a **tools/consumables** category (repair kits, medkits, breach charges) — these feed crafting and field ops.
- **Add material + flammability** (§6) so the encyclopedia can show "Material: Kevlar · Flammability: Low" — reads great and drives the fire mechanic.
- **Subtractions:** none yet — the 280-item DB is an asset. The problem is *reachability/soul*, not count. Prune only after crafting reveals which items are redundant with craftable ones.

---

## 11. Bugs found this pass 🐛

| Bug | Where | Fix |
|---|---|---|
| **Phone shows "Your Team" before you hire anyone** | Seed characters (Alpha/Bravo/Charlie/Delta) exist in default state; phone lists all `characters` | Gate the phone/roster to *recruited* characters (or clear seed squad at new-game). |
| **Daily passive investigation lead crashed every day-tick** | `investigationGenerator.ts` read nonexistent `store.cities` | ✅ Already fixed this session. |
| CLAUDE.md says vehicles "DATA ONLY" | Stale | Update after §8. |
| Dangling `researchRequired` refs lock armor forever | `armor.ts` → undefined `PRJ_*` | Resolved by §5 (they become the tech tree). |

---

## 12. The plan — prioritized task list

**P0 — Playthrough blockers & confusions (do first, all small):**
1. Gate phone/roster to recruited characters (kill the "call before hiring" bug).
2. Click map roster/marker → open character sheet (`openCharacterSheet`).
3. Base facility: on-grid "under construction" state + estimated completion time.
4. Separate the Safe House panel from base facilities (divider/header/tab).
5. Generate cities for the 29 empty countries (agent data pass).

**P1 — Surface what's already built (cheap, high impact):**
6. "Simulate Battle" entry point → `QuickCombatSimulator` + aftermath screen from `combatResultsHandler`.
7. New Pool costs home-country standing (+ optional cash), shown on the button.
8. Merc-card roster on the map: portrait + condition + mood + equipped weapon + one-click assign.
9. Vehicles: purchase flow + Vehicle Garage as fleet storage (wire the dead slots).

**P2 — The spine (the big build):**
10. **Design → Research → Fabricate** loop (minimal: 1 custom-armor blueprint, 3 stations, 3-step flow). Lights up Engineering, scientist/specialist roles, 3 facilities.
11. Per-item flammable rating wired to the existing fire system.

**P3 — JA2 depth (after the core loop):**
12. Sector intel: enemy presence + militia + liberation bar on the map.
13. Map-side assignment (patrol/train/doctor/repair here) + right-click context menus.
14. Strategic contagious-disease layer (roster/base spread, quarantine).
15. Handler as a character (home-gov standing gets a face + phone calls).
16. Equipment: acquisition tags + ammo/consumables categories.

*Combat itself stays confirm-only per standing direction — the sim tools already exist; we're surfacing, not rebuilding.*
