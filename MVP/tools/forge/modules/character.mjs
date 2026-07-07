/**
 * Character Forge module: prompt → LLM spec → art (mock or live PixelLab) →
 * a full character record with tuning defaults (fps / emitter / sound per
 * action) seeded from the contract. The record's `tuning` is the data the
 * owner refines and Claude learns from.
 */
import fs from 'node:fs';
import path from 'node:path';
import { forgeSpec } from '../lib/generators/llm.mjs';
import * as pixellab from '../lib/generators/pixellab.mjs';
import { DEFAULT_FPS, FPS_OVERRIDES } from '../lib/contract.mjs';
import { config, artMode, MVP_DIR } from '../lib/env.mjs';

const DIRKEYS = ['S', 'SE', 'E', 'NE', 'N', 'NW', 'W', 'SW'];
const MOCK_ART = ['surge', 'red_sentinel', 'merc'];

const slug = s => s.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '').slice(0, 24) || 'char';
function hash(s) { let h = 2166136261; for (const c of s) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }

/** Default per-animation tuning, seeded from the contract + the character's powers. */
function defaultTuning(spec) {
  const powerText = (spec.powers || []).join(' ');
  const castEmitter = /beam|laser|vision/i.test(powerText)
    ? { type: 'beam_thin', color: '#ff3b3b', pierce: true }
    : { type: 'beam_big', color: /fire|flame|heat/i.test(powerText) ? '#ff7a3a'
        : /ice|cryo|frost/i.test(powerText) ? '#7ad8ff'
        : /electr|storm|volt/i.test(powerText) ? '#ffe14a' : '#38f0ff', width: 0.6, area: true };
  const t = { fps: DEFAULT_FPS, animations: {
    idle:   { fps: FPS_OVERRIDES.idle ?? 4, loop: true },
    walk:   { fps: DEFAULT_FPS, loop: true },
    ranged: { fps: 8, releaseFrame: 3, muzzle: { x: 0.62, y: 0.45 },
              emitter: { type: 'projectile', sprite: 'bolt', color: '#ffd24a', speed: 320 },
              sound: 'combat.gunshot_rifle' },
    throw:  { fps: DEFAULT_FPS, releaseFrame: 'last-1', muzzle: { x: 0.55, y: 0.4 },
              emitter: { type: 'projectile', sprite: 'grenade', color: '#9aa065', speed: 220, arc: true },
              sound: 'combat.explosion_small' },
    melee:  { fps: DEFAULT_FPS, emitter: { type: 'none' }, sound: 'combat.impact_punch' },
    take_hit: { fps: FPS_OVERRIDES.take_hit ?? 8 },
    death:  { fps: FPS_OVERRIDES.death ?? 6 },
  } };
  if (spec.isLSW) t.animations.cast = {
    fps: DEFAULT_FPS, releaseFrame: 'last', muzzle: { x: 0.5, y: 0.42 },
    emitter: castEmitter, sound: /laser|beam/i.test(powerText) ? 'combat.laser_fire' : 'combat.energy_blast',
  };
  if ((spec.powers || []).some(p => /flight|fly/i.test(p))) {
    t.animations.fly_hover = { fps: DEFAULT_FPS, loop: true };
    t.animations.fly_move  = { fps: DEFAULT_FPS, loop: true };
  }
  return t;
}

/** Mock art: reuse the proven test sprites so the whole loop runs keyless. */
function mockArt(seedStr) {
  const pick = MOCK_ART[hash(seedStr) % MOCK_ART.length];
  const tokens = {};
  for (const d of DIRKEYS) tokens[d] = `/game/assets/character_token/generated/${pick}/${d}.png`;
  return { tokens, portrait: tokens.S, source: `mock:${pick}` };
}

/** Live art: PixelLab v3 → 8 rotations downloaded under MVP/public (served at /game/...). */
async function liveArt(id, artDescription, onStatus) {
  const key = config.pixellabKey;
  onStatus?.('pixellab: creating character (v3, 8 directions)…');
  const { id: plId } = await pixellab.createCharacter(key, artDescription, { name: id });
  onStatus?.(`pixellab: rendering ${plId} (3–8 min)…`);
  const { rotations } = await pixellab.waitForCharacter(key, plId, {
    onProgress: p => onStatus?.(`pixellab: ${p.status} ${(p.elapsed / 1000) | 0}s`),
  });
  const destDir = path.join(MVP_DIR, 'public', 'asset-lab', 'forge', id);
  const local = await pixellab.downloadRotations(rotations, destDir);
  const tokens = {};
  for (const [k, p] of Object.entries(local)) tokens[k] = '/game/asset-lab/forge/' + id + '/' + path.basename(p);
  return { tokens, portrait: tokens.S, source: `pixellab:${plId}`, pixellabId: plId };
}

/** The full forge: prompt → record. */
export async function forgeCharacter({ prompt, provider, art }, onStatus) {
  onStatus?.(`llm (${provider || 'default'}): writing the character…`);
  const { spec, notes, provider: usedProvider } = await forgeSpec(prompt, provider);
  const id = slug(spec.name) + '_' + (hash(prompt) % 1000);
  const mode = art || artMode();
  onStatus?.(`art: ${mode}`);
  const artOut = mode === 'live'
    ? await liveArt(id, spec.artDescription, onStatus)
    : mockArt(prompt + spec.name);
  return {
    id, ...spec,
    art: artOut,
    tuning: defaultTuning(spec),
    meta: { prompt, provider: usedProvider, artMode: mode, notes, forgedAt: new Date().toISOString() },
  };
}

/** Persistence: data/characters.json (owner content — committed on purpose). */
export function loadAll(dataDir) {
  try { return JSON.parse(fs.readFileSync(path.join(dataDir, 'characters.json'), 'utf8')); }
  catch { return []; }
}
export function saveOne(dataDir, record) {
  fs.mkdirSync(dataDir, { recursive: true });
  const all = loadAll(dataDir);
  const i = all.findIndex(c => c.id === record.id);
  if (i >= 0) all[i] = record; else all.push(record);
  fs.writeFileSync(path.join(dataDir, 'characters.json'), JSON.stringify(all, null, 2));
  return all.length;
}
export function deleteOne(dataDir, id) {
  const all = loadAll(dataDir).filter(c => c.id !== id);
  fs.writeFileSync(path.join(dataDir, 'characters.json'), JSON.stringify(all, null, 2));
  return all.length;
}
