# SuperHero Tactics - Master Implementation Plan

> **Created**: December 2024
> **Purpose**: Complete inventory of ALL systems and implementation roadmap
> **Orchestration**: Claude Flow v2.7 with multi-agent swarms

---

## PROJECT SCOPE SUMMARY

| Category | Count | Status |
|----------|-------|--------|
| Data Files | 47+ | Implemented |
| UI Components | 32+ | Mix of working/stub |
| Weapons | 70+ | Data only, 13 in combat |
| Armor | 50+ | Data only, not wired |
| Shields | 15+ | Data only, not wired |
| Grenades | 11 | Working in combat |
| Vehicles | 24 | Data only, not used |
| Cities | 1050 | Working |
| Countries | 168 | Working |
| Combined Systems | 12 | Designed, not implemented |
| Mission Types | 11 | Templates only |
| Damage Types | 30+ | Designed, not applied |

---

## IMPLEMENTATION TIERS

### TIER 1: Wire Existing Data (Combat Critical)
**Priority: HIGHEST** - Data exists, just needs connection

| Task | Location | Effort |
|------|----------|--------|
| Import 70+ weapons to CombatScene | CombatScene.ts + weapons.ts | Medium |
| Apply DR to damage calculations | CombatScene.ts + armor.ts | Low |
| Apply shield absorption | CombatScene.ts + shieldItems.ts | Low |
| Trigger status effects (bleed, burn, stun) | CombatScene.ts + damageSystem.ts | Medium |
| Character stats in combat (MEL/INT/INS/CON) | CombatScene.ts + characterStatusSystem.ts | Medium |
| Advanced knockback physics | CombatScene.ts + knockbackSystem.ts | Medium |
| Free movement before enemy contact | CombatScene.ts | Medium |

### TIER 2: Strategic Layer (World Map)
**Priority: HIGH** - Makes the game playable

| Task | Location | Effort |
|------|----------|--------|
| Time progression UI (calendar, day/night) | WorldMapGrid.tsx + gameStore | Low |
| Mission generation from locations | missionSystem.ts + locationEffects.ts | High |
| Combat results → strategic rewards | CombatScene.ts + enhancedGameStore.ts | Medium |
| Faction standing changes | factionSystem.ts | Medium |
| Multiple squad management | enhancedGameStore.ts + SquadRoster.tsx | High |
| Vehicle integration for travel | vehicleSystem.ts + travelSystem.ts | Medium |

### TIER 3: Laptop Layer (Strategic UI)
**Priority: HIGH** - Core game interface

| Task | Location | Effort |
|------|----------|--------|
| News Browser component | NEW: NewsBrowser.tsx | Medium |
| News generation from missions | newsTemplates.ts | Medium |
| Fame/public opinion tracking | enhancedGameStore.ts | Low |
| Investigation system gameplay | NEW: InvestigationBoard.tsx | High |
| Email/briefing system | NEW: EmailSystem.tsx | Medium |
| Hospital management | NEW: HospitalScreen.tsx | Medium |
| Education/training system | educationSystem.ts | High |
| Base building overview | NEW: BaseBuilder.tsx | Very High |

### TIER 4: Combat Polish
**Priority: MEDIUM** - Enhances tactical depth

| Task | Location | Effort |
|------|----------|--------|
| Grappling mechanics | CombatScene.ts + GrapplePanel.tsx | High |
| Martial arts styles | NEW: martialArtsSystem.ts | High |
| Powers/abilities system | NEW: powersSystem.ts | Very High |
| Environmental destruction | CombatScene.ts | Medium |
| Body part targeting | CombatScene.ts + characterStatusSystem.ts | Medium |
| Injury system integration | CombatScene.ts + enhancedGameStore.ts | Medium |

### TIER 5: Combined Effects
**Priority: MEDIUM** - Makes locations unique

| System | Formula | Implementation |
|--------|---------|----------------|
| Cloning | Healthcare + Science + GDP | Clone cost, quality, time |
| Black Market | Corruption + Military - Law | Equipment prices, availability |
| Surveillance | Intel + Cyber + 100-MediaFreedom | Detection timer, hacking |
| Medical | Healthcare + GDP + Lifestyle | Recovery speed |
| Research | Science + Education + GDP + Cyber | Tech unlock speed |
| Organized Crime | Corruption + 100-Law | Gang contacts, missions |
| Mercenaries | Military + GDP + Corruption | Hire cost, quality |
| Safe Houses | Corruption + 100-Law + 100-Intel | Security level |
| Border Control | Military + Intel + Law | Visa difficulty |
| Media | MediaFreedom + Corruption + Cyber | News spin control |
| Politics | GDP + Corruption + MediaFreedom | Bribery, lobbying |
| Superhuman Affairs | LSW + Intel + Military + Science | Registration enforcement |

### TIER 6: UI Overhaul (RetroUI)
**Priority: LOW** (after features work)

| Task | Notes |
|------|-------|
| Install RetroUI | `npx shadcn add @retroui/button` etc |
| Replace all buttons | NeoBrutalism style |
| Replace all inputs | Bold borders, shadows |
| Replace alerts/modals | High contrast design |
| Theme customization | Adjust yellow intensity |
| Dark/light mode | RetroUI supports both |

### TIER 7: Fast Combat View
**Priority: LOW** - Enhancement feature

| Task | Notes |
|------|-------|
| Combat summary screen | Watch battle outcomes without tactical grid |
| Turn-by-turn highlights | Key moments visualization |
| Injury report display | Who got hurt, how badly |
| Outcome animation | Victory/defeat splash |

### TIER 8: Image Asset Management
**Priority: LOW** - Future AI generation

| Asset Type | Aspect Ratio | Count Needed |
|------------|--------------|--------------|
| Character portraits | 1:1 (256x256) | ~200+ |
| Weapon icons | 1:1 (64x64) | 70+ |
| Armor icons | 1:1 (64x64) | 50+ |
| Vehicle images | 16:9 (512x288) | 24 |
| City backgrounds | 16:9 (1920x1080) | ~50 |
| Country flags | 3:2 (150x100) | 168 |
| Faction logos | 1:1 (128x128) | 6 |
| Power icons | 1:1 (64x64) | 300+ |
| Equipment icons | 1:1 (64x64) | 100+ |
| UI elements | Various | 50+ |

---

## CURRENT WORKING FEATURES

### Fully Working
- Turn-based tactical combat (Phaser 3)
- A* pathfinding + fog of war + line of sight
- Weapon range brackets with accuracy modifiers
- Hit result system (miss/graze/hit/crit)
- Grenades with arc trajectory + explosion
- Sound effects integration (381 sounds)
- AI combat mode (red vs blue)
- World map with 1050 cities across 168 countries
- Squad travel with vehicle assignment
- Personality system + idle escalation
- Time progression (pauseable, multi-speed)
- Inventory and equipment panels

### Partially Working
- Damage system (defined, not applied)
- Armor/DR (data exists, not used)
- Shields (data exists, not tracked)
- Knockback (basic only, advanced not used)
- Character injuries (system exists, not integrated)
- Mission templates (exist, no generation)
- Faction relations (data structure, no impact)

### Designed Not Implemented
- Free movement before combat
- Education/training system
- Hospital recovery with location quality
- News system
- Election system
- Base building
- Mission generation
- Investigation gameplay
- Martial arts progression
- Powers/abilities in combat

---

## CLAUDE FLOW SWARM STRATEGY

### How Swarms Work

Claude Flow uses **multi-agent coordination** where specialized agents work in parallel:

```
┌─────────────────────────────────────────────────────────────┐
│                    QUEEN (Coordinator)                       │
│  - Breaks down objectives into tasks                        │
│  - Assigns tasks to worker agents                           │
│  - Monitors progress and handles failures                   │
│  - Coordinates shared memory/state                          │
└─────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│  RESEARCHER   │   │    CODER      │   │    TESTER     │
│ - Analyzes    │   │ - Implements  │   │ - Writes tests│
│   existing    │   │   features    │   │ - Validates   │
│   code        │   │ - Refactors   │   │   behavior    │
│ - Documents   │   │ - Integrates  │   │ - Reports     │
└───────────────┘   └───────────────┘   └───────────────┘
```

### Agent Types Available

| Agent | Use For |
|-------|---------|
| `researcher` | Analyze codebase, find patterns, understand systems |
| `coder` | Implement features, write code |
| `tester` | Write tests, validate functionality |
| `reviewer` | Code review, security audit |
| `planner` | Break down complex tasks |
| `backend-dev` | Server/API work |
| `system-architect` | Design decisions |
| `code-analyzer` | Understand existing code |

### Starting a Swarm

```bash
# Option 1: CLI command
claude-flow swarm "implement news system MVP" --claude

# Option 2: Hive-mind (coordinated workers)
claude-flow hive-mind spawn "wire armor DR to combat" --claude

# Option 3: Via Claude Code Task tool (parallel agents)
Task("Research", "Analyze newsTemplates.ts...", "researcher")
Task("Coder", "Create NewsBrowser.tsx...", "coder")
Task("Tester", "Write tests for news generation...", "tester")
```

### Memory System

Agents share state via `.swarm/memory.db`:
- Decisions logged for cross-agent reference
- Patterns learned from successful implementations
- Context preserved across sessions

---

## RECOMMENDED SWARM CONFIGURATIONS

### Config 1: Wire Combat Data (Tier 1)

```bash
claude-flow swarm "Wire existing data files to CombatScene:
1. Import weapons from weapons.ts (70+ weapons)
2. Apply DR from armor.ts to damage calculations
3. Apply shield absorption from shieldItems.ts
4. Trigger status effects from damageSystem.ts
5. Add character stats (MEL/INT/INS) to combat rolls" --claude
```

### Config 2: News System MVP (Tier 3)

```bash
claude-flow swarm "Implement News System MVP:
1. Add news state to enhancedGameStore.ts
2. Create NewsBrowser.tsx component
3. Hook mission completion to news generation
4. Implement fame/public opinion tracking
Use existing newsTemplates.ts for generation" --claude
```

### Config 3: Strategic Loop (Tier 2)

```bash
claude-flow swarm "Complete strategic game loop:
1. Mission generation based on city/country stats
2. Combat results update faction standings
3. Time progression affects world events
4. Connect patrol encounters to gameplay" --claude
```

---

## FILE REFERENCE

### Key Data Files
| File | Content |
|------|---------|
| `weapons.ts` | 70+ weapons with range brackets |
| `armor.ts` | 50+ armor with DR values |
| `damageSystem.ts` | 30+ damage types |
| `knockbackSystem.ts` | Force physics |
| `explosionSystem.ts` | Grenades, explosions |
| `shieldItems.ts` | 15+ shields |
| `vehicleSystem.ts` | 24 vehicles |
| `factionSystem.ts` | 6 factions, standings |
| `locationEffects.ts` | Country→gameplay mapping |
| `combinedEffects.ts` | 12 combined systems |
| `missionSystem.ts` | 11 mission types |
| `educationSystem.ts` | 12 education levels |
| `newsTemplates.ts` | News generation templates |
| `personalitySystem.ts` | MBTI→behavior mapping |

### Key Components
| Component | Purpose |
|-----------|---------|
| `WorldMapGrid.tsx` | World map interface |
| `CombatScene.ts` | Phaser tactical combat |
| `CharacterScreen.tsx` | Character management |
| `enhancedGameStore.ts` | Central game state |

---

## IMPLEMENTATION ORDER RECOMMENDATION

### Week 1-2: Combat Wiring
1. Import weapon database to combat
2. Wire armor DR
3. Wire shield absorption
4. Wire status effects

### Week 3-4: Strategic Loop
5. Mission generation from locations
6. Combat results → rewards
7. Time progression UI
8. Faction standing updates

### Week 5-6: Laptop Layer
9. News system MVP
10. Investigation system
11. Hospital management
12. Email briefings

### Week 7-8: UI & Polish
13. RetroUI integration
14. Fast combat view
15. Asset placeholder system
16. Multiple squads

### Future
17. Base building
18. Martial arts
19. Powers system
20. Mobile companion

---

## NEXT STEPS

1. **Choose starting tier** - What to implement first?
2. **Launch swarm** - Use Claude Flow to parallelize work
3. **Iterate** - Review, test, refine

---

*This document serves as the master reference for SHT implementation scope.*
