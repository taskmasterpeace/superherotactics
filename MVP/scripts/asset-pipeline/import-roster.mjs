/**
 * import-roster.mjs — turn raw PixelLab rotation PNGs into game-ready tokens.
 *
 * The deterministic half of the asset system. Generation (PixelLab v3, via the
 * style contract) produces 8 raw rotation PNGs per character; this script
 * normalizes them to the game's token spec and registers them so the engine
 * auto-loads every character with ZERO code changes.
 *
 * Run from MVP/:  node scripts/asset-pipeline/import-roster.mjs
 * Requires ImageMagick `magick` on PATH.
 *
 * Source of raw rotations: public/asset-lab/sprites/<rawPrefix>_<direction>.png
 * (that's where a Claude/MCP generation drops them). Output tokens:
 * public/assets/character_token/generated/<id>/<DIR>.png  +  a manifest.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execFileSync } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MVP = path.resolve(__dirname, '..', '..');            // .../MVP
const contract = JSON.parse(fs.readFileSync(path.join(__dirname, 'style-contract.json'), 'utf8'));
const roster = JSON.parse(fs.readFileSync(path.join(__dirname, 'roster.json'), 'utf8'));

// engine direction -> PixelLab rotation file suffix
const DIRS = {
  S: 'south', SE: 'south-east', E: 'east', NE: 'north-east',
  N: 'north', NW: 'north-west', W: 'west', SW: 'south-west',
};
const H = contract.token.tokenHeight;
const filter = contract.token.resampleFilter;
const srcDir = path.join(MVP, 'public', 'asset-lab', 'sprites');
const outBase = path.join(MVP, contract.token.outDir);

function normalize(src, out) {
  const args = [src, '-trim', '+repage'];
  if (filter && filter !== 'auto') args.push('-filter', filter);
  args.push('-resize', `x${H}`, out);       // resize to fixed height, keep aspect + alpha
  execFileSync('magick', args, { stdio: 'pipe' });
}

const manifest = { version: 1, generated: 'run-stamp', tokenHeight: H, characters: [] };
let made = 0, skipped = 0;

for (const c of roster.characters) {
  if (!c.rawPrefix) { skipped++; continue; }
  const outDir = path.join(outBase, c.id);
  fs.mkdirSync(outDir, { recursive: true });
  const directions = {};
  let have = 0;
  for (const [key, suffix] of Object.entries(DIRS)) {
    const src = path.join(srcDir, `${c.rawPrefix}_${suffix}.png`);
    if (!fs.existsSync(src)) continue;
    const out = path.join(outDir, `${key}.png`);
    normalize(src, out);
    directions[key] = `assets/character_token/generated/${c.id}/${key}.png`;
    have++;
  }
  if (have === 0) { skipped++; continue; }
  // bust portrait rides along when one exists at public/assets/portraits/<id>.png
  const portraitFile = path.join(MVP, 'public', 'assets', 'portraits', `${c.id}.png`);
  manifest.characters.push({
    id: c.id, name: c.name, faction: c.faction ?? null, origin: c.origin ?? null,
    token: directions.S || Object.values(directions)[0],   // default facing = South
    directions,
    ...(fs.existsSync(portraitFile) ? { portrait: `assets/portraits/${c.id}.png` } : {}),
  });
  made++;
  console.log(`  ✓ ${c.id.padEnd(14)} ${have}/8 directions → ${c.id}/`);
}

fs.writeFileSync(
  path.join(MVP, 'public', 'assets', 'generated-manifest.json'),
  JSON.stringify(manifest, null, 2),
);
console.log(`\n${made} character(s) imported, ${skipped} skipped. Wrote public/assets/generated-manifest.json`);
