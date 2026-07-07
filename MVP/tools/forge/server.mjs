/**
 * SHT FORGE — the AI-native dev tool for SuperHero Tactics.
 * Zero-dependency Node server: web UI + JSON API. Run:  node server.mjs
 * Module 1: Character (generate → refine → save). Mock mode needs NO keys.
 */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { config, artMode, FORGE_DIR, MVP_DIR, DATA_DIR } from './lib/env.mjs';
import { ROLES, ORIGINS, STYLE_SUFFIX, rankTier, normalizeSpec, health as calcHealth } from './lib/contract.mjs';
import * as pixellab from './lib/generators/pixellab.mjs';
import { forgeCharacter, loadAll, saveOne, deleteOne } from './modules/character.mjs';
import { relearn, loadConventions } from './lib/learn.mjs';
import { exportRoster } from './lib/bridge.mjs';

// every save/delete: relearn conventions from the roster + re-export into the game
function afterRosterChange() {
  const all = loadAll(DATA_DIR);
  const conv = relearn(DATA_DIR, all);
  exportRoster(MVP_DIR, all);
  console.log(`[learn] conventions from ${conv.sampleSize} record(s) · [bridge] forge-manifest.json exported`);
  return conv;
}

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json',
  '.png': 'image/png', '.webp': 'image/webp', '.wav': 'audio/wav', '.svg': 'image/svg+xml' };

function send(res, code, body, type = 'application/json') {
  const data = type === 'application/json' ? JSON.stringify(body) : body;
  res.writeHead(code, { 'Content-Type': type, 'Cache-Control': 'no-store' });
  res.end(data);
}
function serveFile(res, root, rel) {
  const p = path.normalize(path.join(root, rel));
  if (!p.startsWith(path.normalize(root))) return send(res, 403, { error: 'forbidden' });
  fs.readFile(p, (err, buf) => {
    if (err) return send(res, 404, { error: 'not found', path: rel });
    res.writeHead(200, { 'Content-Type': MIME[path.extname(p).toLowerCase()] || 'application/octet-stream' });
    res.end(buf);
  });
}
function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0; const chunks = [];
    req.on('data', c => { size += c.length; if (size > 2e6) { reject(new Error('body too large')); req.destroy(); } else chunks.push(c); });
    req.on('end', () => { try { resolve(chunks.length ? JSON.parse(Buffer.concat(chunks).toString('utf8')) : {}); } catch (e) { reject(e); } });
    req.on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x');
  const p = url.pathname;
  try {
    // ---------- API ----------
    if (p === '/api/health') {
      return send(res, 200, { ok: true, module: 'character', llmProvider: config.llmProvider,
        ollama: { url: config.ollamaUrl, model: config.ollamaModel },
        anthropicKey: !!config.anthropicKey, art: artMode(), dataDir: DATA_DIR });
    }
    if (p === '/api/contract') {
      return send(res, 200, { roles: ROLES, origins: ORIGINS, styleSuffix: STYLE_SUFFIX,
        tiers: [1, 10, 20, 30, 40, 50, 75, 100, 150, 1000].map(v => ({ min: v, ...rankTier(v) })) });
    }
    if (p === '/api/balance') {
      if (artMode() !== 'live') return send(res, 200, { mock: true, note: 'PIXELLAB_API_KEY not set (or PIXELLAB=mock) — art uses stand-in sprites.' });
      return send(res, 200, await pixellab.balance(config.pixellabKey));
    }
    if (p === '/api/forge' && req.method === 'POST') {
      const { prompt, provider, art } = await readBody(req);
      if (!prompt || !String(prompt).trim()) return send(res, 400, { error: 'prompt required' });
      const record = await forgeCharacter({ prompt: String(prompt).slice(0, 600), provider, art }, s => console.log('[forge]', s));
      return send(res, 200, { record });
    }
    if (p === '/api/bulk' && req.method === 'POST') {
      const { prompts, provider, art } = await readBody(req);
      if (!Array.isArray(prompts) || !prompts.length) return send(res, 400, { error: 'prompts[] required' });
      const records = [], errors = [];
      for (const pr of prompts.slice(0, 20)) {
        try { records.push(await forgeCharacter({ prompt: String(pr).slice(0, 600), provider, art }, s => console.log('[bulk]', s))); }
        catch (e) { errors.push({ prompt: pr, error: e.message }); }
      }
      return send(res, 200, { records, errors });
    }
    if (p === '/api/sounds') {
      // catalog for the tuner: category.base ids (matching tuning records) + a playable file each
      const root = path.join(MVP_DIR, 'public', 'assets', 'sounds');
      const out = {};
      for (const cat of fs.readdirSync(root, { withFileTypes: true })) {
        if (!cat.isDirectory()) continue;
        const seen = new Map();
        for (const f of fs.readdirSync(path.join(root, cat.name))) {
          if (!f.endsWith('.wav')) continue;
          const base = f.replace(/_\d+\.wav$/, '').replace(/\.wav$/, '');
          if (!seen.has(base)) seen.set(base, f);
        }
        out[cat.name] = [...seen.entries()].map(([base, file]) => ({ id: `${cat.name}.${base}`, file: `${cat.name}/${file}` }));
      }
      return send(res, 200, { sounds: out });
    }
    if (p === '/api/characters' && req.method === 'GET') return send(res, 200, { characters: loadAll(DATA_DIR) });
    if (p === '/api/characters' && req.method === 'POST') {
      const { record } = await readBody(req);
      if (!record?.id) return send(res, 400, { error: 'record with id required' });
      normalizeSpec(record);                       // re-validate owner edits against the contract
      record.derived = { health: calcHealth(record.stats) };
      const count = saveOne(DATA_DIR, record);
      const conv = afterRosterChange();
      return send(res, 200, { ok: true, count, learned: conv.sampleSize });
    }
    if (p === '/api/characters/delete' && req.method === 'POST') {
      const { id } = await readBody(req);
      const count = deleteOne(DATA_DIR, id);
      afterRosterChange();
      return send(res, 200, { ok: true, count });
    }
    if (p === '/api/conventions') {
      return send(res, 200, { conventions: loadConventions(DATA_DIR) || { sampleSize: 0 } });
    }

    // ---------- static ----------
    if (p.startsWith('/game/')) return serveFile(res, path.join(MVP_DIR, 'public'), p.slice(6));
    if (p === '/' || p === '/index.html') return serveFile(res, path.join(FORGE_DIR, 'public'), 'index.html');
    return serveFile(res, path.join(FORGE_DIR, 'public'), p.slice(1));
  } catch (e) {
    console.error('[forge:error]', p, e.message);
    return send(res, 500, { error: e.message });
  }
});

server.listen(config.port, () => {
  console.log(`\n  SHT FORGE  →  http://localhost:${config.port}`);
  console.log(`  llm=${config.llmProvider}  art=${artMode()}  data=${DATA_DIR}\n`);
});
