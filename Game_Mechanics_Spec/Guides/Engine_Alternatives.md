# Tactical RPG Engine Alternatives Research

## Overview

This document evaluates alternatives to the [Godot Tactical RPG](https://github.com/ramaureirac/godot-tactical-rpg) framework for implementing SHT's tactical combat layer. Focus is on web-based solutions using JavaScript/TypeScript to avoid traditional game engine complexity.

---

## Current Reference: Godot Tactical RPG

| Attribute | Value |
|-----------|-------|
| Stars | 846 |
| Language | GDScript |
| License | MIT |
| Last Updated | Active |
| Grid System | Isometric |
| Features | Pathfinding, turn-based, unit selection |

**Pros:**
- Complete tactical RPG framework
- Active community
- Good documentation

**Cons:**
- Requires learning GDScript/Godot
- Heavy engine dependency
- Not web-native

---

## Recommended Alternatives

### Tier 1: Web-Native Frameworks (Best Fit)

#### 1. Phaser 3 + Custom Tactical Layer
**Recommendation: PRIMARY CHOICE**

| Attribute | Value |
|-----------|-------|
| Type | 2D Game Framework |
| Language | JavaScript/TypeScript |
| Stars | 36,000+ |
| Platform | Web (all browsers) |
| Learning Curve | Moderate |

**Why Phaser:**
- Massive community and ecosystem
- Extensive documentation and tutorials
- Turn-based RPG tutorials available
- Grid physics plugins exist
- Works with your existing HTML/CSS skills

**Key Resources:**
- [Grid Movement Plugin](https://github.com/Annoraaq/grid-movement) - TypeScript, active
- [Grid Physics Plugin](https://github.com/nkholski/phaser-grid-physics) - Pathfinding included
- [Turn-Based RPG Tutorial](https://phaser.io/news/2018/09/how-to-create-a-turn-based-rpg-in-phaser-3)
- [GameDev Academy Tutorial](https://gamedevacademy.org/how-to-create-a-turn-based-rpg-game-in-phaser-3-part-1/)

**Implementation Path:**
1. Use Phaser for rendering/input
2. Implement combat logic from your existing Complete_Combat_Simulator.html
3. Add grid movement plugin for pathfinding
4. Keep CSV-based data loading

---

#### 2. Excalibur.js
**Recommendation: ALTERNATIVE**

| Attribute | Value |
|-----------|-------|
| Type | Game Engine |
| Language | TypeScript (native) |
| Stars | 1,500+ |
| Platform | Web |
| Learning Curve | Low-Moderate |

**Why Excalibur:**
- Built for TypeScript from the ground up
- Modern API design
- Full API documentation
- Scene/Actor model fits tactical combat

**Website:** https://excaliburjs.com/

**Consideration:** Less tactical RPG-specific content than Phaser, but cleaner TypeScript integration.

---

### Tier 2: Multiplayer-Ready Solutions

#### 3. Colyseus + Phaser 3
**Recommendation: FOR MMORPG FEATURES**

| Attribute | Value |
|-----------|-------|
| Type | Multiplayer Backend |
| Language | TypeScript |
| Stars | 2,500+ |
| Platform | Node.js (server) + Any (client) |

**Why Colyseus:**
- Built for real-time AND turn-based games
- State synchronization built-in
- Matchmaking included
- Works with Phaser 3 frontend

**Key Resources:**
- [Turn-Based Demo (Tic-Tac-Toe)](https://github.com/endel/colyseus-tic-tac-toe)
- [Unity Tanks Turn-Based Demo](https://github.com/colyseus/unity-demo-tanks)
- [Phaser 3 Multiplayer Starter](https://ourcade.co/templates/multiplayer-tic-tac-toe-starter/)

**Implementation Path:**
1. Colyseus server manages game state
2. Phaser 3 client renders combat
3. WebSocket sync between players
4. Your combat logic runs on server for authoritative results

---

### Tier 3: RPG-Specific Frameworks

#### 4. RPG-JS
**Recommendation: WORTH EVALUATING**

| Attribute | Value |
|-----------|-------|
| Type | RPG/MMORPG Framework |
| Language | TypeScript |
| Platform | Web |
| Focus | Complete RPG solution |

**GitHub:** https://github.com/RSamaium/RPG-JS

**Why RPG-JS:**
- Built specifically for RPGs
- Can make RPG or MMORPG with same code
- TypeScript native
- Includes tile-based maps

**Consideration:** May be overkill if you only need tactical combat layer.

---

### Tier 4: Existing Tactical RPG Projects

These are smaller projects that could serve as reference or starting points:

| Project | Stars | Language | Notes |
|---------|-------|----------|-------|
| [vigilans-nexum](https://github.com/DonColon/vigilans-nexum) | 4 | TypeScript | Fire Emblem-inspired |
| [rise-to-olympus](https://github.com/topics/tactical-rpg) | 3 | TypeScript | Greek mythology roguelike |
| [sviridoff/tactical-rpg](https://github.com/sviridoff/tactical-rpg) | ~50 | JavaScript | Fire Emblem Heroes clone |
| [Pwsjas/tactics](https://github.com/Pwsjas/tactics) | ~30 | JavaScript | Phaser-based tactical RPG |

---

## Decision Matrix

| Criteria | Godot | Phaser 3 | Excalibur | Colyseus+Phaser | RPG-JS |
|----------|-------|----------|-----------|-----------------|--------|
| Web-Native | No | Yes | Yes | Yes | Yes |
| TypeScript | No | Yes | Native | Yes | Yes |
| Tactical Combat | Built-in | Plugin | Manual | Manual | Partial |
| Multiplayer | Complex | Manual | Manual | Built-in | Built-in |
| Learning Curve | High | Medium | Low | Medium | Medium |
| Community Size | Large | Huge | Medium | Medium | Small |
| Your Existing Code | Rewrite | Adapt | Adapt | Adapt+Server | Partial |

---

## Recommended Approach

### Phase 1: Prototype with Phaser 3
1. Port Complete_Combat_Simulator.html rendering to Phaser 3
2. Use existing combat logic (JavaScript)
3. Add grid-movement plugin for pathfinding
4. Test visual system (beams, cones, projectiles)

### Phase 2: Add Multiplayer with Colyseus
1. Move combat resolution to server
2. Add state synchronization
3. Implement matchmaking
4. Add spectator mode

### Phase 3: Scale to MMORPG
1. Add persistence layer
2. Implement world map
3. Connect strategic layer
4. Add real-time elements

---

## MCP Server Consideration

You mentioned considering an MCP server. While MCP (Model Context Protocol) is designed for AI tool integration rather than game engines, you could theoretically:

1. Use MCP to connect Claude to your game server
2. Have Claude generate combat reports, news, and events
3. Use MCP for AI-driven NPC dialogue

This would complement Phaser/Colyseus rather than replace them.

---

## Conclusion

**Primary Recommendation:** Phaser 3 + Grid Movement Plugin

**Reasoning:**
1. Your team already knows JavaScript/HTML
2. Massive community support
3. Works entirely in browser
4. Can port existing combat logic with minimal changes
5. Add Colyseus later for multiplayer

**Next Steps:**
1. Create Phaser 3 proof-of-concept with 2 units
2. Implement basic grid movement
3. Port attack resolution from Complete_Combat_Simulator.html
4. Test visual effects (beams, cones)

---

## Sources

- [Phaser 3 Official](https://phaser.io/)
- [Grid Movement Plugin](https://github.com/Annoraaq/grid-movement)
- [Colyseus Framework](https://github.com/colyseus/colyseus)
- [RPG-JS](https://github.com/RSamaium/RPG-JS)
- [Excalibur.js](https://excaliburjs.com/)
- [GameFromScratch JS Engines 2025](https://gamefromscratch.com/javascript-typescript-game-engines-in-2025/)
- [Godot Tactical RPG](https://github.com/ramaureirac/godot-tactical-rpg)
