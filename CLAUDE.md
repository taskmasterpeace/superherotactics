# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is the SuperHero Tactics (SHT) game project - a turn-based tactical superhero strategy game. The repository contains game design documents, data files, and world-building content for a superhero team management game featuring:

- Turn-based tactical combat with superheroes and mercenaries
- Four faction system (US, India, China, Nigeria) 
- Time travel mechanics
- Living Super Weapons (LSWs) classification system
- Email-based dialogue system
- Multi-layered gameplay (Laptop/World/Tactical layers)

## Repository Structure

The repository is organized into two main areas:

### Root Directory CSV Files
- Combat system data tables (damage, critical hits, weapons, skills)
- World data (cities, countries, terrain codes)
- Character stats and abilities

### SuperHero Tactics/ Directory
Contains core design documents and data files:
- `FIST GDD v02.txt` - Main Game Design Document
- `SHT__ Origins, Threat Levels & Powers.txt` - Character power system specifications
- Excel files with character stats, combat calculations, and world data
- Various CSV exports and supporting materials

## Key Game Systems

### Living Super Weapon (LSW) Classification
The game uses a detailed threat assessment system for powered individuals:
- **Threat Levels**: Alpha, 1-5 scale based on power intensity and danger
- **Origins**: 9 categories (Skilled humans, Altered humans, Tech enhancement, etc.)
- **Powers**: Extensive catalog with regional variations and power levels
- **Assessment Formulas**: PCF, STAM, and SPAM mathematical models for threat evaluation

### Combat System
Based on the 4C System Advanced rules with:
- 2D grid-based tactical combat
- Success/failure charts for all actions
- Environmental interaction (knockback through walls)
- Flight mechanics with altitude tracking
- Vehicle and character movement systems

### World Design
- Hundreds of real-world cities with unique characteristics
- City classification system (Temple, Military, Political, etc.)
- Population and crime indices
- Faction-specific territories and politics

## Core Game Design Philosophy

**MMORPG Turn-Based Strategy**: Detailed strategic gameplay with simulated tactical combat
**React/Tailwind Frontend**: Modern web UI with CSV-driven backend data systems  
**AI-Generated Content**: Combat reports, news articles, and dynamic events using generative AI
**Real-Time Strategic Layer**: Time moves continuously; travel and decisions have real-time consequences
**Simulated Combat**: Quick resolution with detailed aftermath reporting (no 3D tactical complexity)

## Game Architecture

### **Three-Layer Design:**
1. **Strategic Layer**: Country selection, team management, investigations, technology research
2. **World Layer**: Real-time travel, event processing, faction interactions
3. **Combat Simulation**: AI-generated battle reports with legal/financial/reputation consequences

### **Time Management System:**
- **Base Time Flow**: 1 real day = 30 game days (2472-day countdown = 82.4 real days)
- **Travel Commitment**: International travel = 6-24 real hours; Continental = 1-3 real days
- **Strategic Depth**: Travel decisions create meaningful time commitments

### **MMORPG Player Scaling:**
- **6-Tier Progression**: Street → City → Regional → National → International → Cosmic
- **Natural Separation**: Veterans handle global crises; newcomers handle local content
- **Geographic Distribution**: Players start in different regions to prevent domination

## Key Data Systems

### **Combat System:**
- Skills/Talents system with 75+ abilities integrated with investigation bonuses
- Status effects with hospital/clone recovery mechanics  
- Armor degradation requiring repair time and resources
- Knockback mechanics with environmental destruction (FASERIP-inspired)
- LSW powers with tactical combat integration

### **Investigation System:**
- Multi-step investigation mechanics driven by city/country characteristics
- Real-time email alerts with priority levels and expiration timers
- 25 investigation templates based on city types and crime indices
- Investigation methods with faction-specific bonuses and political consequences

### **Character Progression:**
- Career system with 7 categories and 5 rank progressions  
- Technology trees unlocked through career advancement
- Country education levels affect research speed and technology access
- 30+ daily activities for character development between missions

## Working with This Repository

When making changes:
- CSV files contain game balance data and should be modified carefully
- The GDD document is the primary reference for game mechanics
- Character power descriptions follow specific formatting conventions
- Regional power variations are tracked by country/continent
- Threat assessment formulas are mathematically defined and shouldn't be altered without understanding the game balance implications