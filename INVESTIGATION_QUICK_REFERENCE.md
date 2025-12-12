# INVESTIGATION SYSTEM - QUICK REFERENCE

> **Quick lookup guide for investigation mechanics**
> See INVESTIGATION_SYSTEM_EXPANSION.md for full details

---

## EMAIL CHAIN SYSTEM

**How It Works**: Clues arrive via email as investigation progresses

**Email Types**:
- Initial Assignment (Day 0)
- Follow-Up Clues (triggered by progress)
- Informant Tips (if you have contacts)
- Urgent Updates (time pressure)
- Final Briefing (resolution)

**Triggers**:
- Time-based (Day 1, 3, 5, 7)
- Event-based (after combat, after finding clue)
- Relationship-based (fame, familiarity, informant network)

---

## EVIDENCE BOARD

**How It Works**: Visual detective board connecting clues

**Evidence Types**: Photo, Document, Physical, Testimony, Digital, Forensic

**Gameplay**:
1. Collect clues from emails/locations/combat
2. Pin to virtual board
3. Draw connections between related items
4. System detects breakthrough patterns
5. Unlock new leads automatically

**Breakthrough**: Connecting critical clues reveals major leads

---

## INFORMANT NETWORK

**Tiers**:
- Tier 1: Street ($100-500) - 40-60% reliable
- Tier 2: Mid-level ($1k-5k) - 60-80% reliable
- Tier 3: High-level ($10k-50k) - 80-95% reliable
- Tier 4: Elite (favors only) - 95-100% reliable

**Trust System** (0-100):
- 0-20: Distrustful (won't share critical intel)
- 21-40: Professional (basic tips)
- 41-60: Reliable (better intel)
- 61-80: Trusted (exclusive leads)
- 81-100: Loyal (free tips, introduces elite contacts)

**Maintenance**: Contact every 14 days or trust decays -5 per week

---

## INVESTIGATION PHASES

### PHASE 1: DISCOVERY (2-5 days)
**Objective**: Gather initial clues
**Actions**: Visit crime scene, interview witnesses, request files
**Completion**: 3+ clues + 1 lead identified

### PHASE 2: RESEARCH (3-7 days)
**Objective**: Analyze evidence, identify suspects
**Actions**: Database search, informant consultation, background checks
**Completion**: 1 suspect + 1 location identified

### PHASE 3: SURVEILLANCE (4-10 days)
**Objective**: Track suspects, locate hideout
**Actions**: Physical/electronic surveillance, drone recon, undercover
**Completion**: Confirm hideout + suspect schedule

### PHASE 4: CONFRONTATION (1-3 days)
**Objective**: Capture/eliminate target
**Actions**: Tactical raid, arrest warrant, negotiation, ambush, assassination
**Completion**: Case resolved (arrest, capture, kill, or negotiate)

---

## TIME PRESSURE

**Deadline Types**:
- Hard: Auto-fail if exceeded
- Soft: Penalties accumulate
- Escalating: Gets worse over time

**Lead Decay**:
- Day 0-2: 100% effective
- Day 3-5: 80% effective
- Day 6-9: 60% effective
- Day 10-14: 40% effective
- Day 15+: 20% effective

**Pressure Levels**:
- 0-25%: Calm (normal)
- 26-50%: Moderate (check-in emails)
- 51-75%: High (-1 CS penalty)
- 76-99%: Critical (-2 CS penalty)
- 100%+: Extreme (-3 CS penalty)

---

## SKILL CHECKS

**Primary Stats** (converted to CS):
- INT: Analysis, research, deduction
- INS: Reading people, spotting lies
- CHA: Interrogation, informants
- AGL: Surveillance, stealth
- CON: Long stakeouts

**Investigation Skills**:
- Detective: +1 to +3 CS (general investigation)
- Forensics: +1 to +3 CS (physical evidence)
- Interrogation: +1 to +3 CS (questioning)
- Surveillance: +1 to +3 CS (tracking)
- Research: +1 to +3 CS (databases)
- Streetwise: +1 to +3 CS (underground intel)
- Hacking: +1 to +3 CS (digital)
- Law: +1 to +3 CS (legal procedures)

**Team Bonuses**:
- Each additional investigator: +1 CS (max +3)
- Skill diversity (4+ types): +1 CS
- High teamwork: +1 CS
- Leadership: +1 CS

---

## BRANCHING OUTCOMES

**Resolution Types**:
1. **Arrest** (Legal): +3 faction, full rewards
2. **Capture** (Extralegal): +2 faction, standard rewards
3. **Elimination** (Lethal): +1 faction, reduced rewards
4. **Negotiation** (Diplomatic): +4 faction, bonus rewards
5. **Escape** (Failed): -3 faction, no rewards
6. **Collateral Disaster**: -5 faction, scandal

**Outcome Factors**:
- Leads discovered (WHO/WHERE/WHAT/WHY)
- Approach (violent/peaceful)
- Casualties (zero best)
- Time remaining

---

## INTEGRATION CHECKLIST

**Existing Systems**:
- ✅ Fame: Successful investigations → +10 to +40
- ✅ City Familiarity: Each investigation → +10 to +20
- ✅ Personality: Affects approach and choices
- ✅ Faction Standing: +1 to +5 per resolution
- ✅ World Map: Travel to investigation location
- ✅ Tactical Combat: Confrontation triggers CombatScene

**New Data Files Needed**:
1. `investigationSystem.ts` - Templates, emails, leads
2. `evidenceBoard.ts` - Clues, connections, breakthroughs
3. `informantNetwork.ts` - Informants, trust, intel
4. `investigationSkills.ts` - Skills, stats, bonuses

**New Components Needed**:
1. `EmailInbox.tsx` - Email management
2. `EvidenceBoard.tsx` - Visual board with connections
3. `InformantNetwork.tsx` - Contact management
4. `InvestigationPhaseManager.tsx` - Phase progression
5. `InvestigationResolution.tsx` - Outcome display

---

## SAMPLE INVESTIGATION TIMELINE

**"The Warehouse Murders" (Lagos, 10-day deadline)**:

- **Day 0**: Receive email assignment
- **Day 1**: Visit crime scene (Discovery phase)
- **Day 2**: Autopsy results email arrives
- **Day 3**: Informant tip (if you have network)
- **Day 4**: Database search (Research phase)
- **Day 5**: Evidence board breakthrough
- **Day 6**: Physical surveillance (Surveillance phase)
- **Day 7**: Gather tactical intel
- **Day 8**: Confrontation (Raid/Arrest/Negotiate)
- **Day 9**: Resolution and rewards
- **Day 10**: Deadline (if not completed)

**Optimal Path**: 8-9 days with all leads discovered

---

## KEYBOARD SHORTCUTS (Proposed)

- `E`: Open Email Inbox
- `V`: Open Evidence Board
- `I`: Open Informant Network
- `P`: View Investigation Phases
- `T`: View Timeline/Deadlines
- `R`: View Resolution Options

---

## DIFFICULTY SCALING

**Investigation Difficulty** (1-10):

| Difficulty | Column | Example |
|------------|--------|---------|
| 1-2 | 4-5 | Petty crime, local gang |
| 3-4 | 6-7 | Corporate espionage, murder |
| 5-6 | 8-9 | International smuggling, conspiracy |
| 7-8 | 10-11 | Terrorist plot, spy network |
| 9-10 | 12-13 | World-threatening, cosmic |

**Modifiers Apply**:
- Skills: +1 to +3 CS each
- Team: +1 to +3 CS
- Informants: +1 to +4 CS
- City familiarity: +0 to +2 CS
- Faction specialty: +1 to +4 CS

---

## COST BREAKDOWN

**Typical Investigation Costs**:
- Travel: $500-2,000
- Forensics: $2,000
- Database access: $500-1,000
- Informant tips: $100-50,000
- Equipment: $1,000-10,000
- Legal fees: $5,000
- Bribes: $10,000-100,000

**Typical Rewards**:
- Low priority: $10,000-30,000
- Medium priority: $40,000-80,000
- High priority: $100,000-150,000
- Critical priority: $200,000-300,000

**Net Profit**: Usually 2-5x costs if successful

---

## QUICK START (For New Investigations)

1. **Receive Email** → Accept assignment
2. **Travel to City** → Use world map
3. **Discovery Phase** → Visit crime scene, collect 3+ clues
4. **Research Phase** → Analyze evidence, identify suspect
5. **Surveillance Phase** (optional) → Gather tactical intel
6. **Confrontation Phase** → Raid/Arrest/Negotiate
7. **Resolution** → Collect rewards, read epilogue

**Minimum Time**: 6 days (speedrun)
**Average Time**: 8-10 days
**Maximum Time**: Deadline varies (7-20 days)

---

## COMMON MISTAKES TO AVOID

1. ❌ Rushing to confrontation without surveillance (harder combat)
2. ❌ Ignoring informant maintenance (lose contacts)
3. ❌ Missing evidence board breakthroughs (waste time)
4. ❌ Letting leads decay (harder investigation)
5. ❌ Exceeding deadline (investigation fails)
6. ❌ High collateral damage (faction anger)
7. ❌ Ignoring time pressure emails (reduced standing)

---

## PRO TIPS

1. ✅ Build informant network early (faster investigations)
2. ✅ Use evidence board actively (free breakthroughs)
3. ✅ Balance speed vs. thoroughness
4. ✅ Surveillance saves lives (better combat odds)
5. ✅ Negotiate when possible (best outcomes)
6. ✅ Match investigator skills to investigation type
7. ✅ Watch opportunity windows (time-limited events)

---

For full system details, see **INVESTIGATION_SYSTEM_EXPANSION.md** (16,000 words).
