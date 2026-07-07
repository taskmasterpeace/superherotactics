/**
 * The BRIDGE: forge roster → the live game. Writes public/assets/
 * forge-manifest.json in the same shape as generated-manifest.json, so
 * PreloadScene loads every forged character as `gen_<id>` / `gen_<id>_<DIR>`
 * textures with zero per-character code. Tuning rides along for the combat
 * layer to consume. Runs on every save — the roster in the game IS the
 * roster in the forge.
 */
import fs from 'node:fs';
import path from 'node:path';

const strip = u => (typeof u === 'string' ? u.replace(/^\/game\//, '') : u);

export function exportRoster(mvpDir, records) {
  const characters = records.map(r => ({
    id: r.id, name: r.name, faction: r.faction ?? null, origin: r.origin ?? null, forge: true,
    token: strip(r.art?.tokens?.S),
    directions: Object.fromEntries(Object.entries(r.art?.tokens || {}).map(([d, u]) => [d, strip(u)])),
    ...(r.art?.portrait ? { portrait: strip(r.art.portrait) } : {}),
    stats: r.stats, powers: r.powers || [], tuning: r.tuning,
  }));
  const manifest = { version: 1, generated: new Date().toISOString(), source: 'sht-forge', characters };
  fs.writeFileSync(path.join(mvpDir, 'public', 'assets', 'forge-manifest.json'), JSON.stringify(manifest, null, 2));
  return manifest;
}
