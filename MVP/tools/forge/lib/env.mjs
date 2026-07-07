/**
 * Zero-dep config: reads MVP/tools/forge/.env.local (KEY=VALUE lines), then
 * lets real environment variables override. Keys NEVER live in the repo.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const FORGE_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const MVP_DIR   = path.resolve(FORGE_DIR, '..', '..');          // .../MVP
export const REPO_DIR  = path.resolve(MVP_DIR, '..');                  // .../sht
export const DATA_DIR  = path.join(FORGE_DIR, 'data');

function parseEnvFile(p) {
  const out = {};
  try {
    for (const line of fs.readFileSync(p, 'utf8').split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && !line.trim().startsWith('#')) out[m[1]] = m[2].replace(/^["']|["']$/g, '');
    }
  } catch { /* no file — fine */ }
  return out;
}

const fileEnv = parseEnvFile(path.join(FORGE_DIR, '.env.local'));
const get = (k, d) => process.env[k] ?? fileEnv[k] ?? d;

export const config = {
  port: Number(get('PORT', 5174)),
  llmProvider: get('LLM_PROVIDER', 'mock'),               // mock | ollama | anthropic
  ollamaUrl: get('OLLAMA_URL', 'http://192.168.1.217:11434'),
  ollamaModel: get('OLLAMA_MODEL', 'qwen3.5'),
  anthropicKey: get('ANTHROPIC_API_KEY', ''),
  anthropicModel: get('ANTHROPIC_MODEL', 'claude-haiku-4-5-20251001'),
  pixellabKey: get('PIXELLAB_API_KEY', ''),
  pixellabMode: get('PIXELLAB', ''),                       // 'mock' forces mock even with a key
};
export const artMode = () => (config.pixellabKey && config.pixellabMode !== 'mock') ? 'live' : 'mock';
