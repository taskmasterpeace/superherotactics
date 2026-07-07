/**
 * LLM generator: prompt → structured character spec.
 * Providers: mock (deterministic, keyless), ollama (owner's LAN box), anthropic.
 * The system prompt encodes THE CONTRACT (rank scale, LSW rule, roles, no purple).
 */
import { config } from '../env.mjs';
import { ROLES, ORIGINS, STAT_KEYS, normalizeSpec } from '../contract.mjs';

const SYSTEM = `You create characters for SuperHero Tactics, a gritty geopolitical superhero tactics game.
Return ONLY a JSON object, no markdown fences, with exactly these fields:
{"name":"codename","realName":"full name","origin":1-9,"role":"one of ${ROLES.join('|')}",
 "faction":"hero|vigilante|mercenary|military|criminal|government","stats":{"MEL":n,"AGL":n,"STR":n,"STA":n,"INT":n,"INS":n,"CON":n},
 "powers":["..."],"backstory":"2-3 sentences","artDescription":"visual-only description for a pixel artist: build, outfit, colors, gear"}

RULES (the game's law):
- Origins: ${Object.entries(ORIGINS).map(([k, v]) => `${k}=${v}`).join(', ')}.
- THE RANK SCALE: origins 1 and 9 are BASELINE HUMANS — every stat 1-39 (39 = maximum human limit; 20-29 exceptional; give specialists a signature stat near their cap).
  Origins 2-8 are LSWs (superhumans) — stats 40+ (40-49 low superhuman, 50-74 superhuman, 75-99 high superhuman, 100+ cosmic; most LSWs live 40-90, only world-enders exceed 150).
- Stats: MEL melee, AGL agility, STR strength, STA stamina, INT intellect, INS instinct, CON constitution/willpower.
- powers: ONLY for origins 2-8, 1-4 powers, concrete (e.g. "Flight", "Heat Vision", "Kinetic Absorption"). Humans get [].
- artDescription: purely visual, no lore. NEVER use purple/violet/lavender in colors.
- Respect the user's concept; if they name a power/nation/vibe, honor it.`;

function stripFences(t) {
  return t.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/,'').trim();
}
function extractJson(t) {
  const s = stripFences(String(t));
  const a = s.indexOf('{'), b = s.lastIndexOf('}');
  if (a === -1 || b <= a) throw new Error('no JSON object in LLM output');
  return JSON.parse(s.slice(a, b + 1));
}

// ---------- providers ----------
async function ollama(prompt) {
  const res = await fetch(`${config.ollamaUrl}/api/chat`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: config.ollamaModel, stream: false, format: 'json',
      messages: [{ role: 'system', content: SYSTEM }, { role: 'user', content: prompt }] }),
  });
  if (!res.ok) throw new Error(`ollama ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const j = await res.json();
  return extractJson(j.message?.content ?? '');
}

async function anthropic(prompt) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'x-api-key': config.anthropicKey, 'anthropic-version': '2023-06-01', 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: config.anthropicModel, max_tokens: 1200, system: SYSTEM,
      messages: [{ role: 'user', content: prompt }] }),
  });
  if (!res.ok) throw new Error(`anthropic ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const j = await res.json();
  return extractJson(j.content?.[0]?.text ?? '');
}

// ---------- mock (deterministic, keyless, obeys the contract) ----------
function hash(s) { let h = 2166136261; for (const c of s) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }
function rng(seed) { let s = (seed >>> 0) || 1; return () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; }; }

const POWER_BANK = [
  [/fire|flame|torch|burn/i, ['Fire Generation', 'Heat Aura']],
  [/ice|frost|cryo|cold/i, ['Cryokinesis', 'Ice Armor']],
  [/electr|lightning|volt|storm/i, ['Electrokinesis', 'Storm Call']],
  [/fly|flight|wing|sky|air/i, ['Flight']],
  [/strong|strength|brick|tank|hulk/i, ['Super Strength', 'Invulnerable Skin']],
  [/speed|fast|quick|blur/i, ['Super Speed']],
  [/mind|psychic|psi|telepat/i, ['Telepathy', 'Psychic Blast']],
  [/beam|laser|vision|energy|blast/i, ['Energy Blast', 'Power Beams']],
  [/teleport|blink|phase/i, ['Teleportation']],
  [/shadow|dark|night/i, ['Shadow Step', 'Darkness Field']],
];
const NAMES = ['Vanguard','Kestrel','Bulwark','Nightpath','Ember','Warden','Halcyon','Ridgeline','Corsair','Meridian','Vortex','Longbow'];

function mock(prompt) {
  const h = hash(prompt), r = rng(h);
  // intent overrides dice: an explicit LSW/power concept is ALWAYS superhuman,
  // an explicit baseline concept is always human; only ambiguity rolls (60% LSW)
  const saysHuman = /no powers|powerless|baseline|ordinary|normal human|\bhuman\b/i.test(prompt);
  const wantsLSW = !saysHuman && /lsw|super|power|hero|villain|mutant|alien|psychic|cosmic|controls|flight|beam|fire|flame|lightning|storm|ice|frost|electr|wield|kinesis|energy|blast|teleport|shadow/i.test(prompt);
  const origin = saysHuman ? (r() < 0.8 ? 1 : 9)
    : wantsLSW ? 2 + Math.floor(r() * 7)
    : (r() < 0.6 ? 2 + Math.floor(r() * 7) : 1);
  const lsw = origin >= 2 && origin <= 8;
  const lo = lsw ? 42 : 14, spread = lsw ? 38 : 22;
  const stats = {};
  for (const k of STAT_KEYS) stats[k] = Math.round(lo + r() * spread);
  const role = /scien|lab/i.test(prompt) ? 'scientist' : /invest|detect/i.test(prompt) ? 'investigator'
    : /spy|covert|operat/i.test(prompt) ? 'operative' : /medic|support|heal/i.test(prompt) ? 'support'
    : /tech|hack|engineer/i.test(prompt) ? 'specialist' : 'soldier';
  const powers = [];
  if (lsw) { for (const [re, ps] of POWER_BANK) if (re.test(prompt)) { powers.push(...ps); break; }
    if (!powers.length) powers.push(['Energy Blast', 'Super Strength', 'Flight'][h % 3]); }
  const name = (prompt.match(/"([^"]{2,24})"/)?.[1]) || NAMES[h % NAMES.length];
  return {
    name, realName: name + ' ' + ['Reyes','Okafor','Volkov','Tanaka','Mensah','Novak'][h % 6],
    origin, role, faction: lsw ? 'hero' : 'mercenary', stats, powers,
    backstory: `Forged from the concept: "${prompt.slice(0, 120)}". ${lsw ? 'Registered LSW; powers manifested under fire.' : 'Baseline human professional; earned every scar.'}`,
    artDescription: prompt.slice(0, 160),
    _mock: true,
  };
}

/** prompt → normalized spec. Retries once on parse failure (live providers). */
export async function forgeSpec(prompt, provider = config.llmProvider) {
  const run = provider === 'ollama' ? ollama : provider === 'anthropic' ? anthropic : null;
  let spec, lastErr;
  if (!run) spec = mock(prompt);
  else {
    for (let attempt = 0; attempt < 2 && !spec; attempt++) {
      try { spec = await run(prompt); } catch (e) { lastErr = e; }
    }
    if (!spec) throw new Error(`LLM (${provider}) failed: ${lastErr?.message}`);
  }
  const notes = normalizeSpec(spec);
  return { spec, notes, provider: run ? provider : 'mock' };
}
