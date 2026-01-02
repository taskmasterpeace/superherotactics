# Jagged Alliance 2 Design Philosophy

> Based on Darius Kazemi's "Jagged Alliance 2" (Boss Fight Books) and developer interviews with Ian Currie, Shaun Lyng, and Linda Currie.

---

## The Core Team

- **Ian Currie** - Lead Designer, started as railroad worker making games in spare time
- **Shaun Lyng** - Writer, novelist and Ian's childhood friend
- **Linda Currie** - Level Designer, built ALL JA2 maps from tile sets

---

## 8 Core Principles

### 1. Systems Over Scripts
Personality emerges from simulation systems, not dialogue trees. Characters feel real because the GAME treats them as real - they have stats that matter, morale that breaks, relationships that form through shared combat.

**Applied to SHT:** Every character behavior should emerge from interacting systems, not special-case code.

### 2. Economy of Expression
Maximum character from minimum dialogue. JA2 mercenaries are defined by 3-10 second voice barks, not paragraphs of backstory. You have ONE PARAGRAPH to define a character - everything else emerges through play.

**Applied to SHT:** Callings, MBTI, and combat barks should express personality in under 10 seconds.

### 3. Embed Philosophy in Code
Document design intent where developers see it. Comments explain WHY, not WHAT. The codebase itself should teach future developers the design philosophy.

**Applied to SHT:** CLAUDE.md, comments in core systems, skill files - all should embed JA2 wisdom.

### 4. Create Meaningful Tension
The core tension: attachment vs. pragmatism. You LOVE your veteran merc with 95 Marksmanship, but the new recruit with better potential might win in the long run. Risk vs. reward at every decision.

**Applied to SHT:** Hero permadeath, scarce resources, irreversible choices create real stakes.

### 5. Physical Simulation
Bullets are objects, not dice rolls. Real ballistics create emergent stories - a bullet that misses can hit something else, penetrate walls, ricochet. The simulation creates narrative.

**Applied to SHT:** Knockback, penetration, explosions should be physical, not abstract.

### 6. Dark Humor Through Systems
Die Hard, not Deadpool. Comedy emerges from serious gameplay - the grim absurdity of war, not scripted jokes. When a grenade bounces wrong and kills your best merc, THAT'S the humor.

**Applied to SHT:** Superheroes should face genuinely grim situations. Humor comes from emergence, not quips.

### 7. Preserve Player Freedom
Non-linearity at strategic AND tactical levels. Multiple paths to victory, multiple orders of operations, multiple solutions to every problem. If there's only one right answer, you've built a puzzle, not a tactical situation.

**Applied to SHT:** World map sectors, combat encounters, investigations - all should have multiple approaches.

### 8. Customizable Experience
Let players choose their realism level. JA2 had difficulty settings that changed fundamental mechanics, not just HP pools. Some players want brutal realism, others want power fantasy.

**Applied to SHT:** Difficulty should change SYSTEMS, not just numbers.

---

## Key Design Mantras

> "95 Marksmanship should feel like GOD MODE."
> — Ian Currie on stats mattering

> "You have ONE PARAGRAPH to define a character."
> — Shaun Lyng on economy of expression

> "If there's only one right answer, you've built a puzzle, not a tactical situation."
> — Linda Currie on player freedom

> "Bullets are objects, not dice rolls."
> — Ian Currie on physical simulation

> "The tension isn't hero vs. villain. It's attachment vs. pragmatism."
> — Ian Currie on meaningful choices

---

## Questions Every Feature Should Answer

1. **Ian's Question:** Does every stat point have visible gameplay impact?
2. **Shaun's Question:** Can you express this in under 10 seconds of dialogue?
3. **Linda's Question:** How many ways can the player solve this?
4. **Shared Question:** Does this create emergent stories or scripted moments?

---

## The JA2 Litmus Test

Before shipping a feature, ask:

- [ ] Does it create TENSION (risk vs. reward, attachment vs. pragmatism)?
- [ ] Does it enable EMERGENCE (stories from systems, not scripts)?
- [ ] Does it preserve FREEDOM (multiple valid solutions)?
- [ ] Does it respect ECONOMY (maximum impact, minimum complexity)?

If no to any: reconsider the design.
