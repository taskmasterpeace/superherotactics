/**
 * Ad-hoc sanity table for the rank-scale combat wiring (not a battery test).
 * Verifies statMod / statBonus / statStep / dodge / strength produce sane
 * numbers for representative human vs superhuman matchups. Run:
 *   npx tsx src/combat/rankScaleSanity.ts
 */
import { statMod, statBonus, statStep } from '../data/combatStatScaling';
import { getDodgeAccuracyPenalty } from '../data/dodgeSystem';
import { getStrengthDamageBonus } from '../data/strengthSystem';
import { rankNorm } from '../data/rankSystem';

const SAMPLES = [
  { label: 'weak civilian', v: 10 },
  { label: 'average human', v: 20 },
  { label: 'trained human', v: 25 },
  { label: 'elite human', v: 33 },
  { label: 'max human', v: 39 },
  { label: 'low superhuman', v: 45 },
  { label: 'superhuman', v: 60 },
  { label: 'high superhuman', v: 90 },
  { label: 'cosmic', v: 200 },
  { label: 'deity', v: 2000 },
];

console.log('\n=== rankNorm / statMod / statBonus / statStep / dodgePenalty / STRdmg ===');
console.log('stat  label            rankNorm  statMod  statBonus  statStep  dodgePen  STRdmg');
for (const s of SAMPLES) {
  const row = [
    String(s.v).padEnd(5),
    s.label.padEnd(16),
    String(rankNorm(s.v)).padStart(8),
    String(statMod(s.v)).padStart(8),
    String(statBonus(s.v)).padStart(10),
    String(statStep(s.v)).padStart(9),
    String(getDodgeAccuracyPenalty(s.v)).padStart(9),
    String(getStrengthDamageBonus(s.v)).padStart(7),
  ].join(' ');
  console.log(row);
}

// Simulated ranged to-hit (mirrors CombatScene.calculateHitChance shape):
// base weapon 70 + attacker AGL statMod + attacker INT statMod - defender dodge, clamped 5..95
function simHit(atkAgl: number, atkInt: number, defAgl: number): number {
  let h = 70 + statMod(atkAgl) + statMod(atkInt) - getDodgeAccuracyPenalty(defAgl);
  return Math.max(5, Math.min(95, Math.round(h)));
}
console.log('\n=== simulated ranged hit% (weapon base 70) ===');
const atks = [
  { label: 'max-human shooter (AGL39,INT30)', agl: 39, int: 30 },
  { label: 'average shooter (AGL20,INT20)', agl: 20, int: 20 },
  { label: 'superhuman shooter (AGL60,INT50)', agl: 60, int: 50 },
];
const defs = [
  { label: 'average human (AGL20)', agl: 20 },
  { label: 'max human (AGL39)', agl: 39 },
  { label: 'superhuman (AGL60)', agl: 60 },
  { label: 'cosmic (AGL200)', agl: 200 },
];
for (const a of atks) {
  const line = defs.map(d => `${d.label.split(' ')[0]}:${simHit(a.agl, a.int, d.agl)}%`).join('  ');
  console.log(`${a.label.padEnd(34)} -> ${line}`);
}

// Validate resolveHitOutcome: land-rate must equal the shown hit%.
// (Mirror of CombatScene.resolveHitOutcome — module-local there.)
function resolveHitOutcome(roll: number, hitPct: number): 'miss' | 'graze' | 'hit' | 'crit' {
  if (roll >= hitPct) return 'miss';
  const margin = (hitPct - roll) / Math.max(1, hitPct);
  if (margin < 0.30) return 'graze';
  if (margin < 0.85) return 'hit';
  return 'crit';
}
console.log('\n=== resolveHitOutcome distribution (10k rolls) — land% should == hitPct ===');
for (const hitPct of [30, 50, 62, 80]) {
  const N = 10000; const c = { miss: 0, graze: 0, hit: 0, crit: 0 };
  for (let i = 0; i < N; i++) c[resolveHitOutcome(Math.random() * 100, hitPct)]++;
  const land = ((N - c.miss) / N * 100).toFixed(0);
  console.log(`hitPct ${String(hitPct).padStart(2)} -> land ${land}%  (graze ${(c.graze/N*100).toFixed(0)}%  hit ${(c.hit/N*100).toFixed(0)}%  crit ${(c.crit/N*100).toFixed(0)}%)`);
}
console.log('');
