/**
 * Minimal MCP "Streamable HTTP" endpoint, stateless mode.
 *
 * Hosted MCP clients (Claude.ai connectors, ChatGPT developer mode, Cursor,
 * Claude Code `mcp add --transport http`) POST JSON-RPC here. We only need
 * initialize, tools/list and tools/call, so a hand-rolled handler is far smaller
 * than pulling the SDK into the Worker.
 */

import { json, text } from './env';
import type { RoomDO } from './room';
import { TOOL_DEFINITIONS, toToolArgs } from '../shared/tools';

interface JsonRpcRequest {
  jsonrpc: '2.0';
  id?: number | string | null;
  method: string;
  params?: Record<string, unknown>;
}

const PROTOCOL_VERSION = '2025-06-18';

export async function handleMcp(request: Request, room: DurableObjectStub<RoomDO>, code: string): Promise<Response> {
  if (request.method === 'GET') {
    // No server-initiated stream in stateless mode; tell the client to POST.
    return json({ error: 'Use POST with JSON-RPC 2.0. Objectle MCP runs stateless Streamable HTTP.' }, 405);
  }
  if (request.method === 'DELETE') return new Response(null, { status: 204 });
  if (request.method !== 'POST') return text('Method Not Allowed', 405);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json(rpcError(null, -32700, 'Parse error'), 400);
  }

  const messages = Array.isArray(body) ? body : [body];
  const responses = [];
  for (const msg of messages) {
    const res = await dispatch(msg as JsonRpcRequest, room, code, request);
    if (res) responses.push(res);
  }

  // Notifications only: nothing to return
  if (responses.length === 0) return new Response(null, { status: 202 });
  return json(Array.isArray(body) ? responses : responses[0]);
}

async function dispatch(
  msg: JsonRpcRequest,
  room: DurableObjectStub<RoomDO>,
  code: string,
  request: Request
): Promise<Record<string, unknown> | null> {
  const id = msg.id ?? null;
  if (!msg || msg.jsonrpc !== '2.0' || typeof msg.method !== 'string') {
    return rpcError(id, -32600, 'Invalid Request');
  }
  // Notifications (no id) never get a response
  if (msg.method.startsWith('notifications/')) return null;

  switch (msg.method) {
    case 'initialize': {
      const origin = new URL(request.url).origin;
      return rpcResult(id, {
        protocolVersion: PROTOCOL_VERSION,
        capabilities: { tools: {} },
        serverInfo: { name: 'objectle-room', version: '2.0.0' },
        instructions:
          `You are playing Objectle in room ${code}. A human is watching every tool call live on their screen. ` +
          `Start with read_view, rotate_object to explore, then submit_guess (6 guesses). ` +
          `Room manual: ${origin}/api/room/${code}`,
      });
    }
    case 'ping':
      return rpcResult(id, {});
    case 'tools/list':
      return rpcResult(id, { tools: TOOL_DEFINITIONS });
    case 'tools/call': {
      const params = (msg.params ?? {}) as { name?: string; arguments?: Record<string, unknown> };
      if (!params.name) return rpcError(id, -32602, 'Missing tool name');
      const result = await room.callTool(code, params.name, toToolArgs(params.arguments), 'agent');
      return rpcResult(id, {
        content: [{ type: 'text', text: result.text }],
        isError: !result.success,
      });
    }
    default:
      return rpcError(id, -32601, `Method not found: ${msg.method}`);
  }
}

function rpcResult(id: JsonRpcRequest['id'], result: unknown) {
  return { jsonrpc: '2.0', id, result };
}

function rpcError(id: JsonRpcRequest['id'], code: number, message: string) {
  return { jsonrpc: '2.0', id, error: { code, message } };
}
