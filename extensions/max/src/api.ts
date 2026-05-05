import type { OpenClawConfig } from "openclaw/plugin-sdk/config-types";
import { DEFAULT_ACCOUNT_ID } from "openclaw/plugin-sdk/account-id";
import { resolveMAXAccount } from "./accounts.js";
import { resolveMAXToken } from "./token.js";
import type { MAXProbeResult } from "./types.js";

const API_BASE = "https://platform-api.max.ru";

async function maxApiCall(
  token: string,
  method: string,
  endpoint: string,
  body?: any,
  queryParams?: Record<string, string>,
): Promise<any> {
  let url = `${API_BASE}${endpoint}`;
  if (queryParams) {
    const qs = new URLSearchParams(queryParams).toString();
    if (qs) url += `?${qs}`;
  }
  const options: RequestInit = {
    method,
    headers: {
      Authorization: token,
      "Content-Type": "application/json",
    },
  };
  if (body) options.body = JSON.stringify(body);

  const res = await fetch(url, options);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`MAX API error ${res.status}: ${text}`);
  }
  return res.json();
}

// ─── Send message ──────────────────────────────────────────

export async function sendMessageMAX(
  cfg: OpenClawConfig,
  accountId: string,
  params: { target: string; text: string; replyToId?: string },
): Promise<{ messageId: string }> {
  const account = resolveMAXAccount({ cfg, accountId: accountId ?? DEFAULT_ACCOUNT_ID });
  const token = resolveMAXToken(account);
  if (!token) throw new Error("MAX token not configured");

  const body: Record<string, any> = {
    text: params.text,
  };

  // user_id / chat_id are URL query params per MAX API spec
  const queryParams: Record<string, string> = {};
  const targetNum = Number(params.target);
  if (!isNaN(targetNum) && targetNum < 0) {
    queryParams.chat_id = String(Math.abs(targetNum));
  } else if (!isNaN(targetNum)) {
    queryParams.user_id = String(targetNum);
  } else {
    queryParams.user_id = params.target;
  }

  // reply via link object (NewMessageLink) per MAX API spec
  if (params.replyToId) {
    body.link = { mid: params.replyToId };
  }

  const result = await maxApiCall(token, "POST", "/messages", body, queryParams);
  // Response: { message: { body: { mid: "..." }, ... } }
  return { messageId: result.message?.body?.mid ?? result.message_id ?? result.id ?? "unknown" };
}

// ─── Webhook management ────────────────────────────────────

export async function setMAXWebhook(
  token: string,
  webhookUrl: string | null,
  secret?: string,
): Promise<void> {
  if (webhookUrl) {
    const body: Record<string, any> = {
      url: webhookUrl,
      update_types: [
        "message_created",
        "message_callback",
        "bot_started",
      ],
    };
    if (secret) body.secret = secret;
    await maxApiCall(token, "POST", "/subscriptions", body);
  } else {
    await maxApiCall(token, "DELETE", "/subscriptions");
  }
}

// ─── Health probe ──────────────────────────────────────────

export async function probeMAX(
  cfg: OpenClawConfig,
  accountId: string,
): Promise<MAXProbeResult> {
  const account = resolveMAXAccount({ cfg, accountId: accountId ?? DEFAULT_ACCOUNT_ID });
  const token = resolveMAXToken(account);
  if (!token) return { ok: false, latencyMs: 0, error: "No token configured" };

  const startedAt = Date.now();
  try {
    const info = await maxApiCall(token, "GET", "/me");
    return {
      ok: true,
      latencyMs: Date.now() - startedAt,
      botName: info.name ?? info.first_name,
    };
  } catch (err) {
    return {
      ok: false,
      latencyMs: Date.now() - startedAt,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

// ─── File upload ───────────────────────────────────────────

export async function uploadMAXFile(
  token: string,
  buffer: Buffer,
  fileName: string,
): Promise<string> {
  const url = `${API_BASE}/uploads`;
  const formData = new FormData();
  formData.append("file", new Blob([buffer]), fileName);

  const res = await fetch(url, {
    method: "POST",
    headers: { Authorization: token },
    body: formData,
  });

  if (!res.ok) throw new Error(`MAX upload error ${res.status}`);
  const data = await res.json();
  return data.file_id ?? data.id ?? "unknown";
}
