#!/usr/bin/env node
/**
 * pixellab-mcp.mjs — call PixelLab MCP tools over HTTP from a script.
 *
 * Why this exists: style_images/reference images must be base64. Relaying
 * base64 through a chat context corrupts it (~1 flipped char per 2KB kills
 * the PNG zlib stream). This client reads files from disk and builds the
 * JSON-RPC call directly, so bytes stay byte-perfect. It is also the batch
 * tool for icon-factory / style-grounded generation runs.
 *
 * Usage:
 *   node pixellab-mcp.mjs call <tool_name> <args.json>
 *   node pixellab-mcp.mjs call get_object '{"object_id":"..."}'
 *
 * In the args JSON, any string of the form "@file:<path>" is replaced with
 * the base64 of that file (path relative to CWD). Works at any depth.
 *
 * Key resolution: PIXELLAB_API_KEY env var, else the pixellab MCP entry in
 * ~/.claude.json. The key is never printed.
 */
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const MCP_URL = 'https://api.pixellab.ai/mcp';

function resolveKey() {
  if (process.env.PIXELLAB_API_KEY) return process.env.PIXELLAB_API_KEY;
  try {
    const cfg = JSON.parse(fs.readFileSync(path.join(os.homedir(), '.claude.json'), 'utf8'));
    const entry = cfg.mcpServers?.pixellab
      ?? Object.values(cfg.projects ?? {}).map(p => p.mcpServers?.pixellab).find(Boolean);
    const auth = entry?.headers?.Authorization ?? '';
    if (auth.startsWith('Bearer ')) return auth.slice(7);
  } catch { /* fall through */ }
  return null;
}

function inlineFiles(value) {
  if (typeof value === 'string' && value.startsWith('@file:')) {
    return fs.readFileSync(value.slice(6)).toString('base64');
  }
  if (Array.isArray(value)) return value.map(inlineFiles);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, inlineFiles(v)]));
  }
  return value;
}

/** Parse a streamable-HTTP MCP response (plain JSON or SSE) into JSON-RPC messages. */
async function parseResponse(res) {
  const text = await res.text();
  const type = res.headers.get('content-type') ?? '';
  if (type.includes('text/event-stream')) {
    const msgs = [];
    for (const line of text.split(/\r?\n/)) {
      if (line.startsWith('data:')) {
        const body = line.slice(5).trim();
        if (body) try { msgs.push(JSON.parse(body)); } catch { /* keepalive */ }
      }
    }
    return msgs;
  }
  return text ? [JSON.parse(text)] : [];
}

async function rpc(key, sessionId, body) {
  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json, text/event-stream',
    'Authorization': `Bearer ${key}`,
  };
  if (sessionId) headers['mcp-session-id'] = sessionId;
  const res = await fetch(MCP_URL, { method: 'POST', headers, body: JSON.stringify(body) });
  if (!res.ok && res.status !== 202) {
    throw new Error(`HTTP ${res.status}: ${(await res.text()).slice(0, 300)}`);
  }
  return { messages: await parseResponse(res), sessionId: res.headers.get('mcp-session-id') ?? sessionId };
}

async function callTool(toolName, args) {
  const key = resolveKey();
  if (!key) throw new Error('No PixelLab key found (PIXELLAB_API_KEY or ~/.claude.json)');

  const init = await rpc(key, null, {
    jsonrpc: '2.0', id: 1, method: 'initialize',
    params: {
      protocolVersion: '2025-03-26',
      capabilities: {},
      clientInfo: { name: 'sht-asset-pipeline', version: '1.0.0' },
    },
  });
  const sessionId = init.sessionId;
  await rpc(key, sessionId, { jsonrpc: '2.0', method: 'notifications/initialized' });

  const call = await rpc(key, sessionId, {
    jsonrpc: '2.0', id: 2, method: 'tools/call',
    params: { name: toolName, arguments: args },
  });
  const reply = call.messages.find(m => m.id === 2);
  if (!reply) throw new Error(`No reply message: ${JSON.stringify(call.messages).slice(0, 300)}`);
  if (reply.error) throw new Error(`Tool error: ${JSON.stringify(reply.error).slice(0, 500)}`);
  return reply.result;
}

const [, , cmd, toolName, argsInput] = process.argv;
if (cmd !== 'call' || !toolName) {
  console.error('Usage: node pixellab-mcp.mjs call <tool_name> <args.json | JSON string>');
  process.exit(1);
}
const rawArgs = argsInput?.endsWith('.json') ? fs.readFileSync(argsInput, 'utf8') : (argsInput ?? '{}');
const args = inlineFiles(JSON.parse(rawArgs));

callTool(toolName, args).then(result => {
  for (const item of result.content ?? []) {
    if (item.type === 'text') console.log(item.text);
    else console.log(`[${item.type}]`);
  }
  if (result.isError) process.exit(2);
}).catch(err => {
  console.error('FAILED:', err.message);
  process.exit(1);
});
