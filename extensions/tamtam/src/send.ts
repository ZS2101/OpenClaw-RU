import { DEFAULT_ACCOUNT_ID } from "openclaw/plugin-sdk/account-id";
import type { OpenClawConfig } from "openclaw/plugin-sdk/config-types";
import { resolveTamtamAccount } from "./accounts.js";
import { resolveTamtamToken } from "./token.js";
import type { TamtamProbeResult } from "./types.js";

const API_BASE = "https://botapi.tamtam.chat";

async function tamtamApiCall(
  token: string,
  method: string,
  params?: Record<string, unknown>,
  httpMethod: "GET" | "POST" = "POST",
  queryParams?: Record<string, string>,
): Promise<unknown> {
  const url = new URL(`${API_BASE}/${method}`);
  url.searchParams.set("access_token", token);
  if (queryParams) {
    for (const [k, v] of Object.entries(queryParams)) {
      url.searchParams.set(k, v);
    }
  }

  const options: RequestInit = { method: httpMethod };
  if (params && httpMethod === "POST") {
    options.headers = { "Content-Type": "application/json" };
    options.body = JSON.stringify(params);
  } else if (params && httpMethod === "GET") {
    for (const [k, v] of Object.entries(params)) {
      url.searchParams.set(k, String(v));
    }
  }

  const res = await fetch(url.toString(), options);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Tamtam API error ${res.status}: ${text}`);
  }
  return res.json();
}

// ─── Send message ──────────────────────────────────────────

export async function sendMessageTamtam(
  cfg: OpenClawConfig,
  accountId: string,
  params: { target: string; text: string; replyToId?: string },
): Promise<{ messageId: string }> {
  const account = resolveTamtamAccount({ cfg, accountId: accountId ?? DEFAULT_ACCOUNT_ID });
  const token = resolveTamtamToken(account);
  if (!token) {
    throw new Error("Tamtam token not configured");
  }

  // TamTam uses user_id for DMs and chat_id for groups.
  // We encode group targets as negative numbers (sign convention).
  const body: Record<string, unknown> = { text: params.text };
  const queryParams: Record<string, string> = {};

  const targetNum = Number(params.target);
  if (!isNaN(targetNum) && targetNum < 0) {
    // Negative target → group chat_id
    queryParams.chat_id = String(Math.abs(targetNum));
  } else if (!isNaN(targetNum)) {
    // Positive target → user_id (DM)
    queryParams.user_id = String(targetNum);
  } else {
    // Non-numeric target — try as user_id
    queryParams.user_id = params.target;
  }

  // Reply via link object (NewMessageLink): { type, mid }
  if (params.replyToId) {
    body.link = { type: "reply", mid: params.replyToId };
  }

  // Response: SendMessageResult { message: Message { body: { mid: "..." } } }
  const result = (await tamtamApiCall(token, "messages", body, "POST", queryParams)) as Record<
    string,
    unknown
  >;
  return {
    messageId:
      (result.message as Record<string, unknown>)?.body?.["mid"] ?? result.message_id ?? "unknown",
  };
}

// ─── Long Poll (getUpdates) ────────────────────────────────

export interface TamtamUpdate {
  update_type: string;
  timestamp: number;
  message?: unknown;
  callback?: unknown;
  user?: unknown;
  chat_id?: number;
}

export async function getTamtamUpdates(
  token: string,
  marker: number,
): Promise<{ updates: TamtamUpdate[]; marker: number }> {
  // GET /updates with query params per spec
  const result = (await tamtamApiCall(token, "updates", undefined, "GET", {
    marker: String(marker),
    limit: "50",
    timeout: "30",
  })) as Record<string, unknown>;
  return {
    updates: (result.updates ?? []) as TamtamUpdate[],
    marker: (result.marker ?? marker) as number,
  };
}

// ─── Health probe ──────────────────────────────────────────

export async function probeTamtam(
  cfg: OpenClawConfig,
  accountId: string,
): Promise<TamtamProbeResult> {
  const account = resolveTamtamAccount({ cfg, accountId: accountId ?? DEFAULT_ACCOUNT_ID });
  const token = resolveTamtamToken(account);
  if (!token) {
    return { ok: false, latencyMs: 0, error: "No token configured" };
  }

  const startedAt = Date.now();
  try {
    const info = await tamtamApiCall(token, "me", {}, "GET");
    return {
      ok: true,
      latencyMs: Date.now() - startedAt,
      botName: (info as Record<string, unknown>).name as string,
    };
  } catch (err) {
    return {
      ok: false,
      latencyMs: Date.now() - startedAt,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

// ─── Group/user info ───────────────────────────────────────

export async function resolveTamtamChatInfo(
  token: string,
  chatId: number,
): Promise<{ chatId: number; title?: string; type?: string } | null> {
  try {
    const result = await tamtamApiCall(token, `chats/${chatId}`, {}, "GET");
    return result
      ? {
          chatId: (result as Record<string, unknown>).chat_id as number,
          title: (result as Record<string, unknown>).title as string,
          type: (result as Record<string, unknown>).type as string,
        }
      : null;
  } catch {
    return null;
  }
}
