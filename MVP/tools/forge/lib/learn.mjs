/**
 * The LEARNING BRAIN. Every character the owner SAVES is a vote for how the
 * game should feel: the fps they settle on, the emitters, sounds and release
 * frames they pick. This module distills the saved roster into
 * data/conventions.json (machine-readable, pre-fills future characters) and
 * data/TUNING_CONVENTIONS.md (readable by the owner and by Claude sessions).
 */
import fs from 'node:fs';
import path from 'node:path';

const median = a => { const s = [...a].sort((x, y) => x - y); return s.length ? s[(s.length - 1) >> 1] : undefined; };
const modal = a => {
  const m = new Map(); for (const v of a) if (v !== undefined && v !== null) m.set(JSON.stringify(v), (m.get(JSON.stringify(v)) || 0) + 1);
  let best, n = 0; for (const [k, c] of m) if (c > n) { n = c; best = k; }
  return best === undefined ? undefined : JSON.parse(best);
};
const avg = a => a.length ? a.reduce((s, v) => s + v, 0) / a.length : undefined;

/** Distill saved records into conventions. */
export function learn(records) {
  const withTuning = records.filter(r => r?.tuning?.animations);
  const conv = { updatedAt: new Date().toISOString(), sampleSize: withTuning.length, fps: undefined, perAnim: {} };
  if (!withTuning.length) return conv;
  conv.fps = median(withTuning.map(r => r.tuning.fps).filter(Number.isFinite));
  const animNames = new Set(withTuning.flatMap(r => Object.keys(r.tuning.animations)));
  for (const a of animNames) {
    const cfgs = withTuning.map(r => r.tuning.animations[a]).filter(Boolean);
    if (!cfgs.length) continue;
    const o = {};
    const fps = median(cfgs.map(c => c.fps).filter(Number.isFinite)); if (fps !== undefined) o.fps = fps;
    const rel = modal(cfgs.map(c => c.releaseFrame)); if (rel !== undefined) o.releaseFrame = rel;
    const snd = modal(cfgs.map(c => c.sound)); if (snd !== undefined) o.sound = snd;
    const emit = modal(cfgs.map(c => c.emitter).filter(e => e && e.type)); if (emit) o.emitter = emit;
    const mx = avg(cfgs.map(c => c.muzzle?.x).filter(Number.isFinite));
    const my = avg(cfgs.map(c => c.muzzle?.y).filter(Number.isFinite));
    if (mx !== undefined && my !== undefined) o.muzzle = { x: +mx.toFixed(2), y: +my.toFixed(2) };
    if (Object.keys(o).length) conv.perAnim[a] = o;
  }
  return conv;
}

/** Overlay learned conventions onto a freshly-generated tuning block. The
 *  contract still wins on STRUCTURE (which animations exist, flight pair,
 *  LSW-only cast) — conventions only tune the values inside. */
export function applyConventions(tuning, conv) {
  if (!conv || !conv.sampleSize) return tuning;
  if (Number.isFinite(conv.fps)) tuning.fps = conv.fps;
  for (const [a, learned] of Object.entries(conv.perAnim || {})) {
    const cfg = tuning.animations[a];
    if (!cfg) continue;                                  // structure is the contract's call
    if (Number.isFinite(learned.fps)) cfg.fps = learned.fps;
    if (learned.releaseFrame !== undefined && cfg.releaseFrame !== undefined) cfg.releaseFrame = learned.releaseFrame;
    if (learned.sound && cfg.sound) cfg.sound = learned.sound;
    if (learned.muzzle && cfg.muzzle) cfg.muzzle = { ...learned.muzzle };
    if (learned.emitter && cfg.emitter && cfg.emitter.type !== 'none') cfg.emitter = JSON.parse(JSON.stringify(learned.emitter));
  }
  return tuning;
}

export function loadConventions(dataDir) {
  try { return JSON.parse(fs.readFileSync(path.join(dataDir, 'conventions.json'), 'utf8')); }
  catch { return null; }
}

/** Relearn from the full roster and persist both artifacts. */
export function relearn(dataDir, records) {
  const conv = learn(records);
  fs.writeFileSync(path.join(dataDir, 'conventions.json'), JSON.stringify(conv, null, 2));
  const lines = [
    '# Tuning conventions (learned)',
    '',
    `Distilled from **${conv.sampleSize}** saved character(s), ${conv.updatedAt}. These are the owner's`,
    'demonstrated preferences — new characters pre-fill from them, and any Claude session',
    'doing animation/FX work should treat them as the house style.',
    '',
    conv.fps !== undefined ? `- **Default frame rate:** ${conv.fps} fps` : '- Default frame rate: (no signal yet)',
    '',
  ];
  for (const [a, o] of Object.entries(conv.perAnim || {})) {
    const bits = [];
    if (o.fps !== undefined) bits.push(`${o.fps} fps`);
    if (o.releaseFrame !== undefined) bits.push(`release ${o.releaseFrame}`);
    if (o.emitter) bits.push(`emitter ${o.emitter.type}${o.emitter.color ? ' ' + o.emitter.color : ''}`);
    if (o.sound) bits.push(`♪ ${o.sound}`);
    if (o.muzzle) bits.push(`muzzle ${o.muzzle.x},${o.muzzle.y}`);
    if (bits.length) lines.push(`- **${a}** — ${bits.join(' · ')}`);
  }
  fs.writeFileSync(path.join(dataDir, 'TUNING_CONVENTIONS.md'), lines.join('\n') + '\n');
  return conv;
}
