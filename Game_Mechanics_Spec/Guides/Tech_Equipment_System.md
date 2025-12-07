# Tech & Equipment System

## Overview

Equipment is everything your character **carries, wears, or uses** beyond their innate abilities. This guide covers:
- **How to acquire equipment**
- **Equipment slots and loadouts**
- **Categories and usage**
- **Maintenance and resources**
- **Integration with other systems**

---

## Equipment Categories

| Category | Examples | Primary Use |
|----------|----------|-------------|
| **Weapons** | Firearms, melee, energy | Combat damage |
| **Armor** | Body armor, helmets, shields | Damage reduction |
| **Tech Gadgets** | Hacking tools, sensors, comms | Utility/investigation |
| **Vehicles** | Cars, helicopters, boats | Transportation/combat |
| **Drones** | Recon, combat, cargo | Remote operations |
| **Field Gear** | Grenades, ziplines, medical | Tactical support |
| **Consumables** | Ammo, batteries, medical supplies | Resource management |

---

## Acquiring Equipment

### Method 1: Purchase

Buy equipment with personal or faction funds.

| Availability | Who Can Buy | Where to Buy |
|--------------|-------------|--------------|
| Common | Anyone | Stores, online |
| Restricted | License required | Specialty dealers |
| Law_Enforcement | Police/agents only | Department supply |
| Military | Military personnel | Military supply |
| Military_Only | Active military only | Armory |
| High_Tech | TECH career Rank 3+ | R&D suppliers |
| Alien_Tech | Special clearance | Faction vaults |
| VIP_Only | Elite status | Private dealers |

### Method 2: Faction Issue

Your faction provides standard equipment:

| Faction Type | Standard Issue |
|--------------|----------------|
| Police | Pistol, body armor, radio, patrol car |
| Military | Rifle, tactical vest, comms, squad transport |
| Intelligence | Encrypted phone, surveillance kit, cover identity |
| Corporate | Laptop, encrypted comms, company vehicle |
| Vigilante | Whatever you can afford/build |

### Method 3: Research & Build

Create equipment through research (see Research_System.md):

```
Example: Building a Recon Drone

Requirements:
- Facility: Electronics Lab
- Researcher: TECH career Rank 2+
- Education: Bachelors+
- Research: Electronics_1 complete
- Time: 7 days base
- Materials: $5,000 in components
```

### Method 4: Mission Rewards

Recover equipment from missions:
- Defeated enemy gear (salvage)
- Investigation evidence (samples)
- Faction rewards (mission pay)
- Black market contacts

### Method 5: Requisition

Request equipment from faction:

| Request Level | Approval | Example Equipment |
|---------------|----------|-------------------|
| Standard | Automatic | Basic weapons, armor, comms |
| Advanced | Mission lead | Heavy weapons, vehicles |
| Special | Faction commander | Military hardware, aircraft |
| Exceptional | Council approval | Exotic tech, alien artifacts |

---

## Equipment Slots

Every character has **equipment slots** limiting what they can carry:

### Personal Slots

| Slot | Quantity | Holds |
|------|----------|-------|
| Primary Weapon | 1 | Rifle, shotgun, heavy weapon |
| Secondary Weapon | 1 | Pistol, SMG, melee weapon |
| Melee Weapon | 1 | Knife, sword, baton |
| Body Armor | 1 | Any armor type |
| Helmet | 1 | Head protection |
| Belt | 4-6 items | Small items, grenades, mags |
| Backpack | 8-12 items | Medium items, supplies |
| Hands | 2 | Currently held items |

### Weight Limits

| STR | Light Load (Lbs) | Medium Load | Heavy Load | Max Carry |
|-----|------------------|-------------|------------|-----------|
| 10 | 20 | 40 | 60 | 80 |
| 20 | 40 | 80 | 120 | 160 |
| 30 | 60 | 120 | 180 | 240 |
| 40 | 80 | 160 | 240 | 320 |
| 50+ | STR × 2 | STR × 4 | STR × 6 | STR × 8 |

**Load Effects:**
- **Light Load**: No penalties
- **Medium Load**: -1CS AGL, -1 movement
- **Heavy Load**: -2CS AGL, -2 movement, no running
- **Over Max**: Cannot move, drop items

### Concealment

Items have concealment ratings:

| Rating | Detectable | Examples |
|--------|------------|----------|
| Pocket | Pat-down | Knife, small pistol, phone |
| Jacket | Visual inspection | Pistol, SMG (folded) |
| Bag | Search required | Rifle (broken down), armor |
| Vehicle | Vehicle search | Full loadout, heavy weapons |
| Impossible | Cannot conceal | Rifle (assembled), body armor visible |

---

## Tech Gadgets

### Hacking Tools

For cyber operations and digital intrusion.

| Tool | Function | Bonus | Skill Required |
|------|----------|-------|----------------|
| Standard Laptop | General hacking | +0CS | Computer |
| Military Laptop | Hardened platform | +2CS | Computer |
| Decryption Kit | Break encryption | +3CS vs encryption | Cryptography |
| Signal Jammer | Block communications | 500ft radius | Electronics |
| RFID Cloner | Copy access cards | Auto-copy | Electronics |
| USB Exploit | Deploy malware | +2CS | Computer |
| WiFi Pineapple | Network interception | +2CS wireless | Computer |
| Stingray | Cell interception | Auto-intercept | Electronics |
| Quantum Decryptor | Break any encryption | +5CS | Quantum_Physics |

**Hacking Process:**
1. Get within range (physical or network)
2. Make Computer skill check vs target security
3. Apply tool bonuses
4. Success = access; Failure = detected

### Sensors

For detection and analysis.

| Sensor | Detects | Range | Counters |
|--------|---------|-------|----------|
| Motion Sensor | Movement | 50ft | Slow movement, jamming |
| Thermal Scanner | Heat signatures | 200ft | Thermal blanket, cold suit |
| Portable Radar | Metal/movement | 1000ft | Stealth tech, chaff |
| Metal Detector | Metal objects | 10ft | Non-metallic materials |
| Chemical Sniffer | Drugs/explosives | 50ft | Sealed containers |
| Biometric Scanner | Fingerprints/retina | Contact | Spoofing, prosthetics |
| Life Sign Detector | Heartbeat/breathing | 200ft | Dampening field |

### Communications

| Comm Device | Range | Encryption | Intercept Difficulty |
|-------------|-------|------------|---------------------|
| Walkie Talkie | 2 miles | None | Easy |
| Tactical Radio | 10 miles | Basic | Medium |
| Encrypted Radio | 10 miles | Military | Very Hard |
| Satellite Phone | Global | Basic | Medium |
| Encrypted Phone | Cell coverage | End-to-End | Hard |
| Burner Phone | Cell coverage | None | Easy but untraceable |
| Subvocal Mic | 1000ft | Basic | Medium |
| Neural Link | 500ft | Thought encrypted | Very Hard |
| Quantum Comm | Unlimited | Unbreakable | Impossible |

---

## Vehicles

### Ground Vehicles Quick Reference

| Vehicle Type | Speed (MPH) | Passengers | DR | Cost Level |
|--------------|-------------|------------|-----|------------|
| Motorcycle Sport | 180 | 1 | 5 | Medium |
| Sedan | 130 | 5 | 8 | Medium |
| Sports Car | 200 | 2 | 5 | Very High |
| SUV | 120 | 7 | 10 | High |
| Armored Car | 120 | 4 | 25 | Ultra High |
| Van Cargo | 90 | 2 | 5 | Medium |
| Van Armored (SWAT) | 80 | 8 | 25 | Very High |
| Humvee | 70 | 4 | 20 | Very High |
| APC | 60 | 12 | 35 | Ultra High |
| Tank | 40-45 | 3-4 | 50-60 | Ultra High |

### Aircraft Quick Reference

| Aircraft | Speed (MPH) | Passengers | DR | Availability |
|----------|-------------|------------|-----|--------------|
| Helicopter Light | 150 | 4 | 8 | Licensed |
| Helicopter Attack | 200 | 2 | 20 | Military Only |
| Private Jet | 500 | 8 | 8 | Licensed |
| Fighter Jet | 1500 | 1 | 15 | Military Only |
| Stealth Fighter | 1000 | 1 | 10 | Military Only |

### Vehicle Combat

| Action | Modifier | Effect |
|--------|----------|--------|
| Ram Attack | Piloting check | Damage = Speed/10 × HP/100 |
| Drive-By | -2CS attacks | Attack while moving |
| Vehicle Cover | +2CS to +4CS | Use vehicle as cover |
| Target Tires | -2CS | Control check if hit |
| Target Driver | -3CS | Through windshield (DR 5-15) |
| Target Fuel Tank | -2CS | 25% explosion if penetrated |

---

## Drones

### Drone Types

| Drone | Speed | Range | Flight Time | Weapons | Use |
|-------|-------|-------|-------------|---------|-----|
| Recon Small | 30 MPH | 5000ft | 30 min | None | Civilian surveillance |
| Recon Military | 60 MPH | 20000ft | 2 hr | None | Military surveillance |
| Combat Light | 50 MPH | 10000ft | 1 hr | Light | Armed surveillance |
| Combat Heavy | 80 MPH | 50000ft | 3 hr | Heavy | Combat UCAV |
| Medical | 40 MPH | 5000ft | 45 min | None | Supply delivery |
| Cargo | 35 MPH | 10000ft | 1 hr | None | Heavy lift |
| Ground Recon | 15 MPH | 3000ft | 2 hr | None | Ground surveillance |
| Ground Combat | 10 MPH | 5000ft | 3 hr | Mounted | Combat robot |
| Underwater | 10 MPH | 1000ft | 1 hr | None | Naval surveillance |
| Swarm | 40 MPH | 2000ft | 15 min | Explosive | Swarm tactics |

### Drone Operation

| Action | Skill Required | Check |
|--------|----------------|-------|
| Basic Control | Drone_Operation | No check for simple |
| Complex Maneuver | Drone_Operation | INT check |
| Combat | Drone_Operation | Ranged attack -1CS |
| Multiple Drones | Drone_Operation + AI | -1CS per drone beyond first |
| Autonomous Mode | Drone_Operation + AI | Drone uses AI stats |

---

## Weapon Modifications

Attachments that modify weapon performance:

### Optics

| Mod | Effect | Compatible | Drawback |
|-----|--------|------------|----------|
| Scope 2x | +1CS at range | Rifles, Pistols | None |
| Scope 4x | +2CS at range | Rifles only | -1CS close |
| Scope 8x | +3CS at long range | Sniper rifles | -2CS close |
| Thermal Scope | See heat | Any firearm | 4hr battery |
| Night Vision | See in dark | Any firearm | Blinded by bright light |

### Barrel

| Mod | Effect | Compatible | Drawback |
|-----|--------|------------|----------|
| Silencer | -30 dB sound | Pistols, SMGs, Rifles | -10% range |
| Flash Hider | No muzzle flash | Any firearm | None |
| Compensator | -1 recoil | Any firearm | +10 dB louder |

### Magazine

| Mod | Effect | Compatible | Drawback |
|-----|--------|------------|----------|
| Extended Mag | +50% capacity | Most firearms | +1 sec reload |
| Drum Mag | +200% capacity | SMGs, Rifles | +3 sec reload, jam risk |

### Accessories

| Mod | Effect | Compatible | Drawback |
|-----|--------|------------|----------|
| Laser Sight | +1CS close range | Any firearm | Reveals position |
| Flashlight | Illumination, can blind | Any firearm | Reveals position |
| Foregrip | -1 recoil, +stability | Rifles, SMGs | None |
| Bipod | +2CS when deployed | Rifles, MGs | Stationary required |
| Bayonet | +10 melee damage | Rifles | None |

---

## Field Gear

### Tactical Equipment

| Gear | Uses | Function | Notes |
|------|------|----------|-------|
| Breaching Charge | 1 | Destroy door/wall | 3ft hole |
| C4 Block | 1 | Demolition | Shaped or bulk |
| Flashbang | 1 | Blind/deafen | Non-lethal |
| Smoke Grenade | 1 | Concealment | -4CS through smoke |
| Tear Gas | 1 | Incapacitate area | Blindness/coughing |
| Zipline Kit | 10 | Rapid descent | 100ft cable |
| Grappling Hook | Reusable | Vertical access | 50ft rope |
| Parachute | 1 | Aerial insertion | 1000ft+ altitude |

### Infiltration

| Gear | Function | Skill Required |
|------|----------|----------------|
| Lockpick Set | Open mechanical locks | Lockpicking |
| Electronic Lockpick | Open electronic locks | Electronics |
| Glass Cutter | Silent window entry | None |
| Crowbar | Forced entry (+2CS) | None |

### Medical

| Item | Effect | Uses | Skill |
|------|--------|------|-------|
| First Aid Kit | +2CS Medicine, stabilize | 10 | First_Aid |
| Trauma Kit | +3CS Medicine, treat critical | 5 | Medicine |
| Surgical Kit | Field surgery capable | 20 | Surgery |
| Defibrillator | Restart heart (DC 15) | Reusable | First_Aid |
| Auto-Injector Stim | +2CS all stats 10 min | 1 | None |
| Auto-Injector Painkiller | Ignore wound penalties 1 hr | 1 | None |
| Auto-Injector Antidote | Cure poison/toxin | 1 | None |
| Blood Coagulant | Stop bleeding instantly | 3 | First_Aid |

---

## Resource Management

### Ammunition

Track ammunition for firearms:

| Weapon Type | Magazine Size | Reload Time |
|-------------|---------------|-------------|
| Pistol Light | 15 | 2 sec |
| Pistol Standard | 17 | 2 sec |
| Pistol Heavy | 8 | 2 sec |
| Revolver | 6 | 5 sec |
| SMG | 30 | 3 sec |
| Shotgun | 8 | 5 sec |
| Assault Rifle | 30 | 4 sec |
| Sniper Rifle | 10 | 6 sec |
| Machine Gun | 100 | 6 sec |

**Ammo Types:**
- **Standard FMJ**: Baseline damage/penetration
- **Hollow Point**: +25% vs unarmored, 0.5x penetration
- **Armor Piercing**: -25% vs unarmored, 2.0x penetration
- **Tungsten Core**: -25% vs unarmored, 2.5x penetration
- **Incendiary**: Fire DOT (5 damage/turn)
- **Subsonic**: -10% damage, -20 dB (stealth)
- **Rubber**: -75% damage (non-lethal)

### Power/Battery

Tech equipment consumes power:

| Item Category | Typical Battery Life |
|---------------|---------------------|
| Small Sensors | 8-24 hours |
| Thermal/Night Vision | 4-8 hours |
| Laptops | 4-8 hours |
| Comms Devices | 8-72 hours |
| Signal Jammers | 2-4 hours |
| Drones | 15 min - 3 hours |

**Power Sources:**
- Rechargeable Battery: 50 Wh, 4hr recharge
- Power Bank: 200 Wh, 8hr recharge
- Solar Panel: 100 Wh/day
- Fuel Cell: 500 Wh, cartridge swap
- Arc Reactor: Unlimited (superhero tech)

### Consumables Tracking

| Resource | Track By | Resupply |
|----------|----------|----------|
| Ammunition | Magazines | Purchase, mission supply |
| Medical Supplies | Uses remaining | Purchase, mission supply |
| Grenades | Individual | Purchase, mission supply |
| Batteries | Hours remaining | Recharge, purchase |
| Fuel | % tank | Refuel stations |
| Money | Currency | Income, missions |

---

## Equipment Integration

### With Research System

Research unlocks equipment:

| Research Tier | Equipment Unlocked |
|---------------|--------------------|
| Basic | Standard weapons, basic armor, consumer tech |
| Intermediate | Military weapons, tactical armor, professional tech |
| Advanced | Heavy weapons, power armor components, military tech |
| Expert | Energy weapons, full power armor, cutting-edge tech |
| Experimental | Alien tech, exotic materials, superhero gear |

### With Career System

Career affects equipment access:

| Career | Equipment Access |
|--------|------------------|
| TECH | All tech gadgets, research equipment |
| PHY (Military) | Military weapons, vehicles, tactical gear |
| PHY (Police) | Law enforcement weapons, less-lethal |
| MED | Medical equipment, biological samples |
| PSY | Psi-tech, psychological tools |
| BIZ | Civilian gear, high-end purchases |
| ART | Disguise kits, performance equipment |
| EDU | Research tools, archival access |

### With Investigation System

Equipment provides investigation bonuses:

| Equipment | Investigation Bonus |
|-----------|---------------------|
| Forensic Kit | +3CS crime scene |
| Hacking Tools | +3CS cyber investigation |
| Surveillance Gear | +2CS surveillance |
| Sensors | +2CS detection |
| Biometric Scanner | +2CS identity verification |
| Thermal Scanner | +2CS hidden room detection |

---

## Example Loadouts

### Street Level Hero (Batman-style)

```
Primary Weapon: None (relies on gadgets)
Secondary Weapon: Batarangs (throwing stars)
Melee Weapon: Collapsible staff
Body Armor: Tactical Suit (DR 15)
Helmet: Cowl with night vision, comms

Belt (6 slots):
- Grappling Hook
- Smoke Grenades (x3)
- Flashbangs (x2)
- Mini-EMP device
- Medical Auto-Injector
- Lockpick Set

Backpack: None (cape storage only)

Vehicle: Batmobile-equivalent (Armored sports car)
```

### Tech Hero (Iron Man-style)

```
Armor: Power Armor Mk50
- Integrated weapons
- Flight capability
- AI assistant
- All sensors built-in
- Arc reactor power (unlimited)

Weapons: Integrated repulsors, missiles
Additional: Briefcase armor for civilian mode
Vehicle: Not needed (armor flies)
```

### Special Ops Agent (Black Widow-style)

```
Primary Weapon: SMG (concealed)
Secondary Weapon: Dual Pistols
Melee Weapon: Knife + Widow's Bite (electric stunner)
Body Armor: Tactical Suit (DR 12, concealable)

Belt (6 slots):
- Extra magazines (x4)
- Garrote wire
- Flash drive (data extraction)
- Micro-camera
- Comms earpiece
- Lock bypass

Gadgets:
- Grappling Hook bracelet
- Encrypted phone
- Face-changing tech
```

### Heavy Weapons Specialist

```
Primary Weapon: Machine Gun or Anti-Materiel Rifle
Secondary Weapon: Heavy Pistol
Melee Weapon: Combat Knife
Body Armor: Heavy Tactical (DR 20)
Helmet: Ballistic + Comms

Belt (4 slots - limited by armor):
- Extra magazines (x2)
- Grenades (x2)

Backpack (10 slots):
- Ammo boxes (x4)
- C4 charges (x2)
- Detonators
- First Aid Kit
- Rations
- Water

Vehicle: Squad transport
```

---

## Maintenance and Repair

### Equipment Condition

| Condition | Effect | Cost to Repair |
|-----------|--------|----------------|
| New/Excellent | Full stats | N/A |
| Good | Full stats | N/A |
| Fair | -5% performance | 10% original cost |
| Poor | -15% performance | 25% original cost |
| Damaged | -25% performance | 50% original cost |
| Broken | Non-functional | 75% or replace |

### Maintenance Schedule

| Equipment Type | Maintenance Interval |
|----------------|---------------------|
| Firearms | After every mission |
| Melee Weapons | Weekly |
| Armor | After damage taken |
| Electronics | Monthly |
| Vehicles | Per 1000 miles |
| Drones | After every use |

### Field Repair

| Repair Type | Time | Skill | Materials |
|-------------|------|-------|-----------|
| Quick Fix | 5 min | None | None |
| Basic Repair | 30 min | Relevant skill | Basic tools |
| Full Repair | 2-8 hours | Relevant skill | Parts + tools |
| Rebuild | 1-7 days | Relevant skill + facility | Full materials |

---

## Quick Reference

### Cost Levels

| Level | Approximate Cost |
|-------|-----------------|
| Free | $0 (improvised) |
| Low | $10-100 |
| Medium | $100-1,000 |
| High | $1,000-10,000 |
| Very High | $10,000-100,000 |
| Ultra High | $100,000+ |
| Priceless | Not purchasable |

### Availability Quick Reference

| Code | Who Can Get It |
|------|---------------|
| Common | Anyone |
| Restricted | Licensed/background check |
| Specialized | Profession-specific |
| Law_Enforcement | Police/agents |
| Military | Military personnel |
| Military_Only | Active military |
| VIP_Only | Elite/billionaire |
| High_Tech | Tech career Rank 3+ |
| Alien_Tech | Special clearance |

### Skill Quick Reference

| Skill | Required For |
|-------|-------------|
| Computer | Hacking tools |
| Electronics | Sensors, some hacking |
| Piloting_Ground | Ground vehicles |
| Piloting_Air | Aircraft |
| Piloting_Water | Watercraft |
| Drone_Operation | All drones |
| Medicine | Medical tech |
| Lockpicking | Infiltration gear |
| Demolitions | Explosives |
| Stealth | Surveillance placement |

---

## Related Files

| File | Contents |
|------|----------|
| Tech_Gadgets_Complete.csv | Full gadget database |
| Weapons_Complete.csv | Weapon specifications |
| Vehicles_Complete.csv | Vehicle specifications |
| Armor_Complete.csv | Armor specifications |
| Research_System.md | How to build equipment |
| Education_Career_System.md | Access requirements |

---

*Last Updated: 2024-12-05*
*Version: 1.0*
