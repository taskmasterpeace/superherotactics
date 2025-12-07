# SHT Phaser 3 Tactical Prototype v3

A proof-of-concept tactical combat system using Phaser 3 with AI vs AI testing.

## Quick Start

1. Open `index.html` in any modern browser
2. No build step, no npm, no server required - just open the file

## How to Play

### Controls
- **Click** a blue unit to select it
- **Click** on a tile to move there
- **Click** on an enemy to attack (will auto-move if needed for melee)
- **End Turn** → Switch to enemy team
- **AI vs AI** → Watch both teams fight automatically!

### Combat System
- Uses Balance v1.2 weapon/armor values from the main simulator
- A* pathfinding for movement
- Cover system (green tiles give defensive bonus)
- Visual effects: projectiles, beams, cones, rings, melee

### Units
**Blue Team:**
- Alpha (Rifle) - Standard soldier
- Bravo (Shotgun) - Close range specialist
- Charlie (Sniper) - Long range, fragile
- Delta (Energy Beam) - Tech specialist

**Red Team:**
- Red-1 (Rifle) - Standard soldier
- Red-2 (SMG) - Fast attacker
- Red-3 (Wide Beam) - Heavy, armored
- Red-4 (Shotgun) - Close range

## AI vs AI Mode

Click the purple "AI vs AI" button to watch automated combat:
- Both teams controlled by AI
- Detailed decision logging in combat log
- AI considers weapon range, positioning, and wounded targets
- Great for testing balance and AI behavior

## Features Demonstrated

- [x] Phaser 3 rendering
- [x] Grid-based movement
- [x] A* pathfinding
- [x] Turn-based combat
- [x] AP system
- [x] Attack resolution (same formulas as Complete_Combat_Simulator)
- [x] Visual effects (projectile, beam, cone, ring, melee)
- [x] Cover system
- [x] Armor/DR system with energy penetration
- [x] Combat log with detailed AI decisions
- [x] Victory detection
- [x] AI vs AI auto-battle mode
- [x] Smart melee (auto-move then attack)

## If You Don't Like It

Delete this entire folder:
```
Game_Mechanics_Spec/Phaser_Tactical_Prototype/
```

That's it - everything is self-contained.

## Next Steps (if keeping)

1. ~~Add AI for enemy turns~~ ✓ Done
2. Add more unit types
3. Add ability system (powers, special moves)
4. Add sound effects
5. Add multiplayer via Colyseus
6. Add isometric view option
7. Add height/elevation system
8. Batch simulation mode (run 100 fights for stats)

## Technical Notes

- Single HTML file with inline JavaScript
- Phaser 3.70.0 loaded from CDN
- No external dependencies
- No build process required
- ~1200 lines of code (v3 with AI systems)

## Comparison to HTML Simulator

| Feature | Complete_Combat_Simulator | Phaser Prototype v3 |
|---------|--------------------------|---------------------|
| Engine | Vanilla JS + CSS | Phaser 3 |
| Grid | 25x25 | 15x15 |
| Movement | Instant | Animated |
| Pathfinding | None | A* |
| Effects | CSS animations | Phaser tweens |
| Enemy AI | Random/Basic | Smart targeting |
| AI vs AI Mode | No | Yes |
| Scalability | Limited | Better |
| Future potential | Low | High |
