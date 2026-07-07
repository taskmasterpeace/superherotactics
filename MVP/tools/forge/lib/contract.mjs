/**
 * THE CONTRACT — the game's look + rules, loaded from the real sources of truth
 * (style-contract.json, action-set.json) plus the rank-scale bands that mirror
 * MVP/src/data/rankSystem.ts. Every generator obeys this; it is what keeps a
 * 200-character roster looking and playing like one game.
 */
import fs from 'node:fs';
import path from 'node:path';
import { MVP_DIR } from './env.mjs';

const readJson = p => JSON.parse(fs.readFileSync(p, 'utf8'));
export const styleContract = readJson(path.join(MVP_DIR, 'scripts/asset-pipeline/style-contract.json'));
export const actionSet     = readJson(path.join(MVP_DIR, 'scripts/asset-pipeline/action-set.json'));

export const STYLE_SUFFIX = styleContract.character.stylePrompt;
export const DEFAULT_FPS  = actionSet.playback?.defaultFps ?? 6;
export const FPS_OVERRIDES = actionSet.playback?.overrides ?? {};

export const ROLES = ['soldier', 'specialist', 'scientist', 'investigator', 'operative', 'support'];
export const ORIGINS = {
  1: 'Skilled Human', 2: 'Altered Human', 3: 'Tech Hero', 4: 'Mutated',
  5: 'Spiritual', 6: 'Robotic', 7: 'Symbiotic', 8: 'Alien', 9: 'Unknown',
};
export const isLSWOrigin = o => o >= 2 && o <= 8;   // the LSW rule: origins 2–8 have powers

// Rank scale (mirrors rankSystem.ts): humans live 1–39, superhuman 40+, cosmic 100+
export const HUMAN_MIN = 1, HUMAN_MAX = 39, LSW_MIN = 40, STAT_CAP = 5000;
export const STAT_KEYS = ['MEL', 'AGL', 'STR', 'STA', 'INT', 'INS', 'CON'];

export function rankTier(v) {
  if (v <= 9)  return { label: 'Average Human',  color: '#94a3b8' };
  if (v <= 19) return { label: 'Above-Average',  color: '#38bdf8' };
  if (v <= 29) return { label: 'Exceptional',    color: '#22d3ee' };
  if (v <= 39) return { label: 'Max Human',      color: '#2dd4bf' };
  if (v <= 49) return { label: 'Low Superhuman', color: '#a3e635' };
  if (v <= 74) return { label: 'Superhuman',     color: '#facc15' };
  if (v <= 99) return { label: 'High Superhuman',color: '#f59e0b' };
  if (v <= 149)return { label: 'Low Cosmic',     color: '#fb923c' };
  if (v <= 999)return { label: 'Cosmic',         color: '#ef4444' };
  return { label: 'Beyond', color: '#f8fafc' };
}

/** Validate + clamp an LLM character spec to the contract. Mutating fixes, returns notes. */
export function normalizeSpec(spec) {
  const notes = [];
  spec.origin = Math.min(9, Math.max(1, Math.round(Number(spec.origin) || 1)));
  spec.isLSW = isLSWOrigin(spec.origin);
  if (!ROLES.includes(spec.role)) { notes.push(`role '${spec.role}' → soldier`); spec.role = 'soldier'; }
  spec.name = String(spec.name || 'Unnamed').slice(0, 40);
  spec.realName = String(spec.realName || spec.name).slice(0, 60);
  spec.faction = String(spec.faction || (spec.isLSW ? 'hero' : 'mercenary')).slice(0, 40);
  spec.backstory = String(spec.backstory || '').slice(0, 800);
  spec.artDescription = String(spec.artDescription || spec.name).slice(0, 300);

  const stats = spec.stats || {};
  const lo = spec.isLSW ? LSW_MIN : HUMAN_MIN;
  const hi = spec.isLSW ? STAT_CAP : HUMAN_MAX;
  for (const k of STAT_KEYS) {
    let v = Math.round(Number(stats[k]));
    if (!Number.isFinite(v)) { v = spec.isLSW ? 45 : 20; notes.push(`stat ${k} missing → ${v}`); }
    const c = Math.min(hi, Math.max(lo, v));
    if (c !== v) notes.push(`stat ${k} ${v} → clamped ${c} (${spec.isLSW ? 'LSW 40+' : 'human 1-39'})`);
    stats[k] = c;
  }
  stats.PSI = stats.CON;                                   // PSI mirrors CON (owner spec)
  spec.stats = stats;

  spec.powers = Array.isArray(spec.powers) ? spec.powers.map(p => String(p).slice(0, 50)).slice(0, 6) : [];
  if (!spec.isLSW && spec.powers.length) { notes.push(`human: stripped powers [${spec.powers.join(', ')}]`); spec.powers = []; }
  if (spec.isLSW && !spec.powers.length) { notes.push('LSW with no powers → Enhanced Physiology'); spec.powers = ['Enhanced Physiology']; }
  return notes;
}

export const health = s => s.MEL + s.AGL + s.STA + s.STR;   // owner formula
