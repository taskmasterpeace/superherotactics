/**
 * PixelLab REST v2 client (standalone — no MCP). Generates 8-direction character
 * art + animations from a description, to the SHT style contract.
 * Docs: https://api.pixellab.ai/v2/openapi.json
 */
import fs from 'node:fs';
import path from 'node:path';

const BASE = 'https://api.pixellab.ai/v2';

// The locked SHT look, appended to every art description (see MVP/scripts/asset-pipeline/style-contract.json)
export const STYLE_SUFFIX =
  'gritty modern superhero-tactics game operative, muted realistic palette, clear readable silhouette, plain transparent background';

const DIRS = ['south', 'south-east', 'east', 'north-east', 'north', 'north-west', 'west', 'south-west'];

function headers(key) {
  return { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' };
}

async function req(key, method, endpoint, body) {
  const res = await fetch(`${BASE}${endpoint}`, {
    method, headers: headers(key), body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json; try { json = JSON.parse(text); } catch { json = { raw: text }; }
  if (!res.ok) throw new Error(`PixelLab ${method} ${endpoint} → ${res.status}: ${text.slice(0, 300)}`);
  return json;
}

export async function balance(key) {
  return req(key, 'GET', '/balance');
}

/** Create a v3 (highest quality) 8-direction character from an art description. Returns { id }. */
export async function createCharacter(key, artDescription, opts = {}) {
  const description = `${artDescription}, ${STYLE_SUFFIX}`;
  const body = {
    description,
    view: opts.view || 'low top-down',
    detail: opts.detail || 'high detail',
    outline: 'single color black outline',
    enhance_prompt: false,
    ...(opts.name ? { name: opts.name } : {}),
  };
  const r = await req(key, 'POST', '/create-character-v3', body);
  const id = r.character_id || r.id || (r.character && r.character.id);
  if (!id) throw new Error(`create-character-v3: no id in response ${JSON.stringify(r).slice(0, 200)}`);
  return { id, raw: r };
}

/** Poll a character until its 8 rotations are ready. Returns { id, rotations: {dir: url} }. */
export async function waitForCharacter(key, id, { timeoutMs = 600000, everyMs = 6000, onProgress } = {}) {
  const start = Date.now();
  for (;;) {
    const c = await req(key, 'GET', `/characters/${id}`);
    const rot = c.rotation_urls || c.rotations || {};
    const ready = DIRS.every(d => rot[d] || rot[d.replace('-', '_')]);
    const status = c.status || (ready ? 'completed' : 'processing');
    if (onProgress) onProgress({ status, elapsed: Date.now() - start });
    if (ready || status === 'completed') {
      const rotations = {};
      for (const d of DIRS) rotations[d] = rot[d] || rot[d.replace('-', '_')] || null;
      return { id, rotations, raw: c };
    }
    if (status === 'failed') throw new Error(`character ${id} failed: ${JSON.stringify(c).slice(0, 200)}`);
    if (Date.now() - start > timeoutMs) throw new Error(`character ${id} timed out`);
    await new Promise(r => setTimeout(r, everyMs));
  }
}

/** Queue an animation (template or custom). Returns the raw response. */
export async function animate(key, id, { templateId, actionDescription, directions, frameCount, name } = {}) {
  const body = {
    character_id: id,
    ...(templateId ? { template_animation_id: templateId } : {}),
    ...(actionDescription ? { action_description: actionDescription } : {}),
    ...(directions ? { directions } : {}),
    ...(frameCount ? { frame_count: frameCount } : {}),
    ...(name ? { animation_name: name } : {}),
    async_mode: true,
  };
  return req(key, 'POST', '/animate-character', body);
}

/** Download the 8 rotation PNGs into destDir/<DIR-key>.png. Returns map of dir→localPath. */
export async function downloadRotations(rotations, destDir) {
  fs.mkdirSync(destDir, { recursive: true });
  const DIRKEY = { south: 'S', 'south-east': 'SE', east: 'E', 'north-east': 'NE', north: 'N', 'north-west': 'NW', west: 'W', 'south-west': 'SW' };
  const out = {};
  for (const [dir, url] of Object.entries(rotations)) {
    if (!url) continue;
    const res = await fetch(url);
    if (!res.ok) continue;
    const buf = Buffer.from(await res.arrayBuffer());
    const p = path.join(destDir, `${DIRKEY[dir]}.png`);
    fs.writeFileSync(p, buf);
    out[DIRKEY[dir]] = p;
  }
  return out;
}

export const P0_ANIMATIONS = [
  { id: 'idle', templateId: 'breathing-idle' },
  { id: 'walk', templateId: 'walking-6-frames' },
  { id: 'throw', templateId: 'throw-object' },
  { id: 'melee', templateId: 'cross-punch' },
  { id: 'cast', templateId: 'fireball' },
  { id: 'hit', templateId: 'taking-punch' },
  { id: 'death', templateId: 'falling-back-death' },
  { id: 'ranged', actionDescription: 'aiming a rifle and firing, sharp recoil, muzzle flash' },
];
