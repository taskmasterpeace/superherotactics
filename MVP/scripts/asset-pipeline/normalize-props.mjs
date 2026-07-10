#!/usr/bin/env node
/**
 * normalize-props.mjs — quantize map-prop art to the combat grid.
 *
 * Rule (owner, 2026-07-10): everything occupies whole grid cells and is
 * sized exactly to them. Raw PixelLab props come at arbitrary canvases;
 * this script trims each to content, scales it to its declared footprint
 * (cells * cellPx, tall props get extra canvas above, anchored bottom),
 * and emits a manifest the engine and previews consume.
 *
 * Footprints live in prop-footprints.json. Canopy props (trees) also get
 * a widened visual canvas but keep their 1-cell footprint.
 *
 * Usage: node normalize-props.mjs [--cell 44]
 * In:    MVP/public/asset-lab/map/<name>.png
 * Out:   MVP/public/asset-lab/map/grid/<name>.png + grid-manifest.json
 */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const MAP_DIR = path.resolve(HERE, '../../public/asset-lab/map');
const OUT_DIR = path.join(MAP_DIR, 'grid');

const config = JSON.parse(fs.readFileSync(path.join(HERE, 'prop-footprints.json'), 'utf8'));
const cellArg = process.argv.indexOf('--cell');
const CELL = cellArg > -1 ? Number(process.argv[cellArg + 1]) : config.cellPx;

fs.mkdirSync(OUT_DIR, { recursive: true });
const manifest = { cellPx: CELL, generated: new Date().toISOString().slice(0, 10), props: {} };
let done = 0, skipped = [];

for (const [name, spec] of Object.entries(config.props)) {
  const src = path.join(MAP_DIR, `${name}.png`);
  if (!fs.existsSync(src)) { skipped.push(name); continue; }

  const [cw, ch] = spec.cells;
  const visualW = (spec.canopy ?? cw) * CELL;
  const visualH = Math.round(ch * CELL * (spec.tall ?? 1));
  const out = path.join(OUT_DIR, `${name}.png`);

  // trim to content, scale to fit the visual canvas (pixel-art point filter),
  // anchor bottom-center so the base sits on the footprint cells
  execFileSync('magick', [
    src,
    '-trim', '+repage',
    '-filter', 'point',
    '-resize', `${visualW}x${visualH}`,
    '-background', 'none',
    '-gravity', 'South',
    '-extent', `${visualW}x${visualH}`,
    out,
  ]);

  manifest.props[name] = {
    file: `grid/${name}.png`,
    cells: spec.cells,
    canvas: [visualW, visualH],
    anchor: 'bottom-center',
    ...(spec.canopy ? { canopy: spec.canopy } : {}),
  };
  done++;
}

fs.writeFileSync(path.join(MAP_DIR, 'grid-manifest.json'), JSON.stringify(manifest, null, 2));
console.log(`normalized ${done} props @ ${CELL}px cells -> ${path.relative(process.cwd(), OUT_DIR)}`);
if (skipped.length) console.log(`skipped (no source art): ${skipped.join(', ')}`);
