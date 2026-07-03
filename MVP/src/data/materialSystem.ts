/**
 * MATERIAL SYSTEM — every item has a flammable rating.
 *
 * Items may declare `material` / `flammability` explicitly (equipmentTypes
 * fields); anything that doesn't gets a rating resolved from its name and
 * category. The tactical layer uses the EQUIPPED armor's rating to decide
 * how well fire sticks to a unit: steel plate shrugs off ignition, a leather
 * jacket turns you into a torch.
 *
 * Ratings use the same 0..1 scale as FireSpreadSystem's terrain table.
 */

export const MATERIAL_FLAMMABILITY: Record<string, number> = {
  cloth: 0.85,
  leather: 0.7,
  wood: 0.9,
  organic: 0.7,
  plastic: 0.6,
  polymer: 0.5,
  kevlar: 0.2,
  ceramic: 0.05,
  steel: 0.0,
  iron: 0.0,
  titanium: 0.0,
  graphene: 0.1,
  energy: 0.0,
  absorbium: 0.0,
  indestructium: 0.0,
};

/** Name-pattern rules — resolves the whole 280-item catalog without editing every record. */
const NAME_RULES: { pattern: RegExp; flammability: number }[] = [
  { pattern: /fire.?(resistant|proof)|cbrn|hazmat|asbestos/i, flammability: 0.0 },
  { pattern: /steel|titanium|iron|plate|metal/i, flammability: 0.05 },
  { pattern: /ceramic|composite/i, flammability: 0.1 },
  { pattern: /graphene|nano/i, flammability: 0.1 },
  { pattern: /energy|shield|force.?field|absorbium/i, flammability: 0.0 },
  { pattern: /kevlar|ballistic|tactical|riot/i, flammability: 0.25 },
  { pattern: /leather|jacket|coat/i, flammability: 0.7 },
  { pattern: /cloth|hoodie|shirt|gi\b|robe|suit\b/i, flammability: 0.6 },
  { pattern: /exo|power.?armor|mech/i, flammability: 0.05 },
];

const DEFAULT_FLAMMABILITY = 0.4;

/**
 * Resolve an item's flammable rating: explicit field → material → name rules
 * → default. Works with a raw name string or an item object.
 */
export function getItemFlammability(item: string | { name?: string; material?: string; flammability?: number } | null | undefined): number {
  if (item == null) return DEFAULT_FLAMMABILITY;
  if (typeof item !== 'string') {
    if (typeof item.flammability === 'number') return Math.max(0, Math.min(1, item.flammability));
    if (item.material && MATERIAL_FLAMMABILITY[item.material.toLowerCase()] !== undefined) {
      return MATERIAL_FLAMMABILITY[item.material.toLowerCase()];
    }
  }
  const name = typeof item === 'string' ? item : (item.name || '');
  for (const rule of NAME_RULES) {
    if (rule.pattern.test(name)) return rule.flammability;
  }
  return DEFAULT_FLAMMABILITY;
}

/** Unarmored people burn like people (organic). */
export const UNARMORED_FLAMMABILITY = 0.7;

/**
 * How the equipped armor's rating shapes a burn:
 *  - 0.0  → fire can't take hold (ignition negated)
 *  - 0.25 → half-length burn
 *  - 0.5  → normal burn
 *  - 1.0  → half again as long
 */
export function burnDurationMultiplier(flammability: number): number {
  if (flammability <= 0.05) return 0; // effectively fireproof
  return 0.5 + flammability;
}

/** Human-readable label for encyclopedia/tooltips. */
export function flammabilityLabel(f: number): string {
  if (f <= 0.05) return 'Fireproof';
  if (f <= 0.25) return 'Low';
  if (f <= 0.5) return 'Moderate';
  if (f <= 0.75) return 'High';
  return 'Extreme';
}
