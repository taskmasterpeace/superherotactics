# SHT Combat Balance Analysis

## Overview

This document analyzes the balance between weapons, armor, HP pools, and super powers in SuperHero Tactics. The goal is to ensure meaningful tactical choices and appropriate time-to-kill (TTK) across different combat scenarios.

---

## HP Pool Standards

| Character Type | HP Range | Example |
|----------------|----------|---------|
| Civilian | 30-50 | Bystander, hostage |
| Trained Human | 60-80 | Police officer, soldier |
| Elite Human | 80-100 | Special forces, skilled hero |
| Low-Power Super | 100-150 | Street-level hero |
| Mid-Power Super | 150-200 | City-level hero |
| High-Power Super | 200-300 | National-level hero |
| Cosmic-Level | 300+ | World-level threat |

**Design Target**: Standard combat should assume 100 HP characters.

---

## Weapon Damage vs HP (Unarmored Targets)

### Melee Weapons

| Weapon | Damage | Hits to Kill (100 HP) | Notes |
|--------|--------|----------------------|-------|
| Knife | 10 | 10 hits | Fast but weak |
| Lead Pipe | 5 + STR | 8-12 hits | STR 30 = 11 damage |
| Baseball Bat | 12 | 8-9 hits | Good reach |
| Katana | 15 | 6-7 hits | Skill required |
| War Hammer | 20 | 5 hits | Slow but powerful |

**Melee TTK**: 6-12 hits (realistic for close combat)

### Ranged Weapons - Firearms

| Weapon | Damage | Hits to Kill (100 HP) | Hits per Turn | TTK (Turns) |
|--------|--------|----------------------|---------------|-------------|
| Pistol Light | 15 | 7 hits | 1-2 | 4-7 turns |
| Pistol Standard | 20 | 5 hits | 1-2 | 3-5 turns |
| Pistol Heavy | 25 | 4 hits | 1 | 4 turns |
| SMG | 20 | 5 hits | 2-3 | 2-3 turns |
| Assault Rifle | 30 | 4 hits | 2-4 | 1-2 turns |
| Battle Rifle | 35 | 3 hits | 1-2 | 2-3 turns |
| Sniper Rifle | 45 | 3 hits | 1 | 3 turns |
| Heavy MG | 30 | 4 hits | 5+ | 1 turn |
| Anti-Materiel | 60 | 2 hits | 1 | 2 turns |

**Firearm TTK**: 2-5 turns (appropriate for tactical combat)

### Energy Weapons

| Weapon | Damage | Hits to Kill (100 HP) | Special |
|--------|--------|----------------------|---------|
| Laser Rifle | 40 | 3 hits | 2.0x penetration |
| Plasma Rifle | 45 | 3 hits | Fire DOT |
| Thermal Rifle | 35 | 3 hits | Ignites flammables |
| Ice Rifle | 30 | 4 hits | Slow effect |
| Energy Rifle | 35 | 3 hits | Bypasses physical DR |
| Electric Rifle | 30 | 4 hits | Chain lightning |

**Energy TTK**: 3-4 turns (slightly faster than conventional, justified by cost/rarity)

---

## Armor DR vs Weapon Damage

### Light Armor (DR 2-12)

| Armor | DR | vs Pistol (20) | vs Rifle (30) | vs Sniper (45) |
|-------|----|--------------:|---------------:|---------------:|
| Leather Jacket | 2 | 18 net | 28 net | 43 net |
| Kevlar Vest | 8 | 12 net | 22 net | 37 net |
| Tactical Vest | 12 | 8 net | 18 net | 33 net |

**Analysis**: Light armor extends TTK by 1-2 turns vs pistols, minimal effect vs rifles.

### Medium Armor (DR 15-22)

| Armor | DR | vs Pistol (20) | vs Rifle (30) | vs Sniper (45) |
|-------|----|--------------:|---------------:|---------------:|
| Riot Gear | 15 | 5 net | 15 net | 30 net |
| Combat Armor | 18 | 2 net | 12 net | 27 net |
| Force Field Belt | 20 (energy) | N/A | N/A | N/A |
| Plasma Dispersal | 22 (energy) | N/A | N/A | N/A |

**Analysis**: Medium armor makes pistols nearly ineffective (20 hits to kill!), rifles still viable.

### Heavy Armor (DR 25-40)

| Armor | DR | vs Pistol (20) | vs Rifle (30) | vs Sniper (45) | vs Anti-Mat (60) |
|-------|----|--------------:|---------------:|---------------:|----------------:|
| Power Armor | 25 | 0 net (blocked) | 5 net | 20 net | 35 net |
| Kinetic Redist. | 28 | 0 net (blocked) | 2 net | 17 net | 32 net |
| Hardlight | 30 | 0 net (blocked) | 0 net (blocked) | 15 net | 30 net |
| Divine Blessing | 40 | 0 net (blocked) | 0 net (blocked) | 5 net | 20 net |

**Analysis**: Heavy armor requires AP ammo, energy weapons, or super-strength attacks.

---

## Armor Effectiveness Summary

| Weapon Tier | Effective Against Armor DR |
|-------------|---------------------------|
| Melee (5-15) | DR 0-5 only |
| Pistols (15-25) | DR 0-15 |
| Rifles (30-35) | DR 0-20 |
| Snipers (45) | DR 0-30 |
| Heavy/Anti-Mat (50-60) | DR 0-40 |
| Super Powers (40-80) | DR 0-50+ |

**Design Intent**: Each armor tier countered by next weapon tier. Creates rock-paper-scissors dynamics.

---

## Ammunition Modifiers Impact

### AP Ammo (2.0x Penetration, -25% Damage vs Unarmored)

| Weapon | Base | AP Damage | AP Penetration | vs DR 20 (Base) | vs DR 20 (AP) |
|--------|------|-----------|----------------|-----------------|---------------|
| Pistol Standard | 20 | 15 | 40 | 0 net | 0 net (still blocked) |
| Assault Rifle | 30 | 22 | 60 | 10 net | 22 net |
| Sniper Rifle | 45 | 34 | 90 | 25 net | 34 net |

**Analysis**: AP ammo critical for medium armor, reduces damage vs unarmored. Tactical choice!

### Hollow Point (0.5x Penetration, +25% Damage vs Unarmored)

| Weapon | Base | HP Damage | HP Penetration | Use Case |
|--------|------|-----------|----------------|----------|
| Pistol Standard | 20 | 25 | 10 | Unarmored targets, no over-pen |
| Assault Rifle | 30 | 37 | 15 | High damage, low penetration |

**Analysis**: Hollow point excellent vs civilians/unarmored, terrible vs any armor.

---

## Super Powers vs Conventional Weapons

### Power Damage Ranges

| Power Level | Damage Range | Equivalent To |
|-------------|--------------|---------------|
| Low | 20-30 | Pistol to Rifle |
| Medium | 40-60 | Sniper to Anti-Materiel |
| High | 70-100 | Vehicle weapons |
| Cosmic | 100+ | Military ordinance |

### Super Strength Damage

| STR | Punch Damage | Thrown Object | vs 100 HP Target |
|-----|--------------|---------------|------------------|
| 30 | 6 | Light (5 + 3 = 8) | 12-17 hits |
| 50 | 10 | Medium (15 + 5 = 20) | 5-10 hits |
| 70 | 14 | Heavy (30 + 7 = 37) | 3-7 hits |
| 100 | 20 | Very Heavy (50 + 10 = 60) | 2-5 hits |
| 150 | 30 | Massive (100 + 15 = 115) | 1-3 hits |

**Analysis**: Super strength scales well, thrown objects can match heavy weapons.

### Energy Projection Powers

| Power Rating | Damage | vs Civilian (50 HP) | vs Elite (100 HP) | vs Super (200 HP) |
|--------------|--------|---------------------|-------------------|-------------------|
| 30 | 30 | 2 hits | 4 hits | 7 hits |
| 50 | 50 | 1 hit | 2 hits | 4 hits |
| 70 | 70 | 1 hit | 2 hits | 3 hits |
| 100 | 100 | 1 hit | 1 hit | 2 hits |

**Analysis**: High power ratings can one-shot normal humans - appropriate for superhero genre.

---

## Grappling Balance

### Position Advantage

| Position | Control Bonus | Escape DC | Hold Options |
|----------|---------------|-----------|--------------|
| Clinch | +0 | Easy (DC 10) | 2 |
| Front Mount | +2CS | Moderate (DC 15) | 4 |
| Back Mount | +3CS | Hard (DC 18) | 5 |
| Side Control | +2CS | Moderate (DC 15) | 4 |

### Hold Damage vs HP

| Hold Type | Damage/Turn | Turns to Incapacitate | Escape Window |
|-----------|-------------|----------------------|---------------|
| Choke | 10 + STR/10 | 8-10 turns | Can escape while conscious |
| Joint Lock | 5 + STR/10 | Submission, not KO | Pain forces surrender |
| Crush | 15 + STR/5 | 5-7 turns | Requires high STR |

**Analysis**: Grappling is slower than weapons but:
- Can't be used at range
- Avoids lethal damage
- Capture instead of kill option

---

## Time-to-Kill Matrix

### TTK (Turns) - Unarmored Targets

| Weapon vs Target | Civilian (50) | Elite (100) | Super (200) |
|------------------|---------------|-------------|-------------|
| Pistol (20) | 3 turns | 5 turns | 10 turns |
| Rifle (30) | 2 turns | 4 turns | 7 turns |
| Sniper (45) | 2 turns | 3 turns | 5 turns |
| Energy (35-45) | 2 turns | 3 turns | 5 turns |
| Super Power (60) | 1 turn | 2 turns | 4 turns |

### TTK (Turns) - DR 15 Armor (Riot Gear/Combat Armor)

| Weapon vs Target | Civilian (50) | Elite (100) | Super (200) |
|------------------|---------------|-------------|-------------|
| Pistol (20→5 net) | 10 turns | 20 turns | 40 turns |
| Rifle (30→15 net) | 4 turns | 7 turns | 14 turns |
| Sniper (45→30 net) | 2 turns | 4 turns | 7 turns |
| Rifle+AP (22→22 net) | 3 turns | 5 turns | 9 turns |

**Design Target**: 3-5 turns for standard Elite vs Elite combat.

---

## Balance Issues Identified

### Issue 1: Pistols vs Medium Armor
**Problem**: DR 15+ makes pistols take 20+ hits to kill.
**Solution**: Ensure pistol users have AP ammo option or fallback to called shots (targeting unarmored areas at -2CS).

### Issue 2: Super Powers vs Normals
**Problem**: High power ratings (70+) one-shot civilians.
**Solution**: This is intentional for superhero genre. Provide civilians options to flee, hide, or have supers protect them.

### Issue 3: Energy Weapons vs Physical Armor
**Problem**: Physical armor doesn't protect against energy weapons, energy armor doesn't protect against bullets.
**Solution**: High-tier armor (Power Armor, Hardlight) should have both physical AND energy DR. Budget armor only protects against one type.

### Issue 4: Grappling Escape Difficulty
**Problem**: High STR characters can maintain holds indefinitely.
**Solution**: Escape attempts should use highest of STR or AGL. Allies can assist escape attempts.

---

## Recommended Balance Adjustments

### 1. Armor Updates
- Add hybrid DR to high-tier armors (both physical and energy reduction)
- Power Armor: DR 25 physical, DR 15 energy
- Hardlight: DR 30 energy, DR 20 physical

### 2. Called Shot Rules
- Called shots to unarmored areas (face, joints) bypass DR at -2CS to hit
- Creates counter to heavy armor without requiring special weapons

### 3. Suppression Fire
- Automatic weapons can suppress area (no damage, but targets take -2CS to actions in area)
- Gives full-auto weapons utility beyond raw damage

### 4. Power Scaling
- Powers that deal 60+ damage should require proportional drawbacks (AP cost, cooldown, visible telegraph)
- Cosmic-level powers (100+ damage) should have campaign-defining consequences

---

## Quick Reference Tables

### Weapon Selection by Enemy Type

| Enemy Armor | Recommended Weapon | Backup Option |
|-------------|--------------------|---------------|
| None (DR 0) | Pistol, Hollow Point | Any |
| Light (DR 2-8) | Pistol, Standard | SMG |
| Medium (DR 12-18) | Rifle, AP ammo | Sniper |
| Heavy (DR 20-30) | Anti-Materiel, Energy | Super powers |
| Exotic (DR 30+) | Super powers | Grappling (bypass DR) |

### Defense Selection by Expected Threat

| Expected Threat | Recommended Armor | Cost |
|-----------------|-------------------|------|
| Street crime | Kevlar Vest (DR 8) | Medium |
| Military | Combat Armor (DR 18) | High |
| Superhuman | Power Armor (DR 25) | Very High |
| Cosmic | Exotic/Divine (DR 30+) | Ultra High |

---

## Conclusion

The SHT combat system provides meaningful choices through:

1. **Armor/Weapon Tiers**: Each armor tier requires next weapon tier to defeat efficiently
2. **Ammunition Tradeoffs**: AP vs Hollow Point creates tactical decisions
3. **Power Scaling**: Supers are appropriately devastating vs normals
4. **Grappling Alternative**: Non-lethal option with different risk/reward
5. **Penetration System**: Cover and obstacles matter but can be defeated

**Target TTK**: 3-5 turns for balanced fights ensures combat is quick but allows tactical decisions.

---

*Related Files:*
- `Weapons_Complete.csv`
- `Armor_Equipment.csv`
- `Tech_Gadgets_Complete.csv`
- `Wrestling_Martial_Arts_Complete.csv`
- `Penetration_Continuation_System.csv`
