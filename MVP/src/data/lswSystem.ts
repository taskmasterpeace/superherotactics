/**
 * LSW SYSTEM — the classification rule, enforced.
 *
 * Canon: an LSW is a being with POWERS. Origins 2-8 (Altered, Tech-Enhanced,
 * Mutated, Spiritual, Robotic, Symbiotic, Alien) ARE LSWs and MUST carry at
 * least one power. Origin 1 (Skilled Human) and 9 (Trained Soldier) are
 * baseline humans — skilled, dangerous, but NOT LSWs and never powered.
 *
 * generatePowersForOrigin() rolls origin-flavored powers whose names the
 * combat engine already understands (beam/blast/teleport/speed/fire/ice/...).
 */

import type { CharacterPower, PowerLevel } from './characterSheet';

/** Origins that make a character an LSW. 1 = Skilled Human, 9 = Trained Soldier are NOT. */
export const LSW_ORIGINS = [2, 3, 4, 5, 6, 7, 8] as const;

// Legacy/seed characters carry STRING origins ('Trained Soldier', 'Military
// Veteran', 'Elite Marksman'…). Any of these reads as baseline human.
const NON_LSW_ORIGIN_STRINGS = [
  'skilled human', 'trained soldier', 'military veteran', 'elite marksman',
  'explosives expert', 'police', 'mercenary', 'civilian', 'unknown',
];

export function isLSWOrigin(origin: number | string | undefined | null): boolean {
  if (origin == null) return false;
  if (typeof origin === 'number') return (LSW_ORIGINS as readonly number[]).includes(origin);
  return !NON_LSW_ORIGIN_STRINGS.includes(String(origin).toLowerCase().trim());
}

/** A character is an LSW if their origin says so (powers follow the origin). */
export function isLSW(char: { origin?: number | string; originType?: number; powers?: unknown[] }): boolean {
  const origin = char.origin ?? char.originType;
  return isLSWOrigin(origin as any);
}

export function classificationLabel(char: { origin?: number; originType?: number; powers?: unknown[] }): string {
  return isLSW(char) ? 'LSW — Licensed Super Worker' : 'Baseline Human — Non-LSW';
}

// ---------------------------------------------------------------------------
// Origin-flavored power banks. Names deliberately include tokens the tactical
// engine pattern-matches ('beam', 'blast', 'fire', 'ice', 'lightning',
// 'teleport', 'speed', 'shield'...) so rolled powers manifest in combat.
// ---------------------------------------------------------------------------

interface PowerSpec { name: string; effects: string[]; limitations?: string[] }

const ORIGIN_POWER_BANK: Record<number, PowerSpec[]> = {
  2: [ // Altered Human — accidents, experiments, serums
    { name: 'Energy Blast', effects: ['Ranged energy damage', 'Ignores light cover'] },
    { name: 'Psychic Blast', effects: ['Mental damage', 'Bypasses physical armor'], limitations: ['Drains focus'] },
    { name: 'Super Speed', effects: ['Extra movement', 'Bonus evasion'] },
    { name: 'Regeneration', effects: ['Heals each turn', 'Resists bleed'] },
    { name: 'Kinetic Shield', effects: ['Absorbs incoming damage'], limitations: ['Recharges slowly'] },
  ],
  3: [ // Tech Enhancement — cybernetics, exo-rigs, implants
    { name: 'Optic Laser Beam', effects: ['Precision beam damage', 'Long range'] },
    { name: 'Integrated Shield Projector', effects: ['Deployable energy shield'], limitations: ['Power cell limited'] },
    { name: 'Servo Strength', effects: ['Melee damage boost', 'Carry capacity up'] },
    { name: 'Targeting Suite', effects: ['Accuracy bonus', 'Ignores smoke/dark'] },
    { name: 'Jump Jets', effects: ['Leap over obstacles', 'Vertical mobility'], limitations: ['Loud'] },
  ],
  4: [ // Mutated Human — elemental / physical mutation
    { name: 'Fireball', effects: ['Area fire damage', 'Ignites flammables'] },
    { name: 'Ice Bolt', effects: ['Cold damage', 'Slows target'] },
    { name: 'Lightning Chain', effects: ['Arcs between targets'], limitations: ['Grounded targets resist'] },
    { name: 'Stone Skin', effects: ['Damage reduction', 'Knockback resist'], limitations: ['Slower movement'] },
    { name: 'Claws & Fangs', effects: ['Natural melee weapons', 'Causes bleed'] },
  ],
  5: [ // Spiritual Enhancement — blessed, cursed, channelers
    { name: 'Healing Aura', effects: ['Heals nearby allies'], limitations: ['Not self'] },
    { name: 'Spirit Blast', effects: ['Spiritual damage', 'Hurts the intangible'] },
    { name: 'Warding Aura', effects: ['Allies gain defense nearby'] },
    { name: 'Second Sight', effects: ['See through fog of war', 'Sense hidden enemies'] },
  ],
  6: [ // Robotic / Synthetic
    { name: 'Arm Cannon Beam', effects: ['Heavy beam damage'], limitations: ['Cooldown'] },
    { name: 'Armored Chassis', effects: ['Built-in damage reduction', 'No bleed'] },
    { name: 'Overclock', effects: ['Extra AP burst'], limitations: ['Self-damage on use'] },
    { name: 'Sensor Array', effects: ['Extended vision', 'Detect stealth'] },
  ],
  7: [ // Symbiotic — bonded organisms
    { name: 'Symbiote Tendrils', effects: ['Reach melee attacks', 'Can grapple'] },
    { name: 'Adaptive Regeneration', effects: ['Rapid healing'], limitations: ['Weak to fire'] },
    { name: 'Shapeshift Mass', effects: ['Absorb impacts', 'Squeeze through gaps'] },
  ],
  8: [ // Alien
    { name: 'Gravity Crush', effects: ['Area gravity damage', 'Knockdown'] },
    { name: 'Teleport', effects: ['Short-range teleportation'], limitations: ['Line of sight'] },
    { name: 'Phase Shift', effects: ['Walk through walls briefly'], limitations: ['Costly'] },
    { name: 'Alien Physiology', effects: ['Immune to poison/disease', 'Odd biology confuses medics'] },
  ],
};

function powerLevelForThreat(threat: number): { level: PowerLevel; rank: number } {
  if (threat >= 5) return { level: 'extreme', rank: 80 };
  if (threat >= 4) return { level: 'high', rank: 60 };
  if (threat >= 3) return { level: 'medium', rank: 40 };
  return { level: 'low', rank: 25 };
}

/**
 * Roll powers for a character. LSW origins get 1-3 origin-flavored powers
 * (threat raises count and rank); baseline humans (1, 9) get NONE — that's
 * the whole point of the classification.
 */
export function generatePowersForOrigin(origin: number, threatLevel: number = 2): CharacterPower[] {
  if (!isLSWOrigin(origin)) return [];
  const bank = ORIGIN_POWER_BANK[origin] || ORIGIN_POWER_BANK[2];
  const count = Math.min(bank.length, threatLevel >= 5 ? 3 : threatLevel >= 3 ? 2 : 1);
  const { level, rank } = powerLevelForThreat(threatLevel);

  // draw without replacement
  const pool = [...bank];
  const picks: PowerSpec[] = [];
  for (let i = 0; i < count && pool.length > 0; i++) {
    picks.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
  }

  return picks.map((p, i) => ({
    powerId: `pw-${origin}-${p.name.toLowerCase().replace(/[^a-z]+/g, '-')}`,
    name: p.name,
    level,
    rank: rank + Math.floor(Math.random() * 15) - 7 + (i === 0 ? 5 : 0), // primary power slightly stronger
    description: p.effects.join('; '),
    effects: p.effects,
    limitations: p.limitations,
  }));
}
