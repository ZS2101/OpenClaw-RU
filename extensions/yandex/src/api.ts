import { DEFAULT_ACCOUNT_ID } from "openclaw/plugin-sdk/account-id";
import type { OpenClawConfig } from "openclaw/plugin-sdk/config-types";
import { resolveYandexAccount } from "./accounts.js";
import { resolveYandexToken, yandexAuthHeader } from "./token.js";
import type { YandexProbeResult } from "./types.js";

const API_BASE = "https://botapi.messenger.yandex.net/bot/v1";

async function yandexApiCall(
  token: string,
  method: string,
  endpoint: string,
  body?: unknown,
): Promise<Record<string, unknown>> {
  const url = `${API_BASE}${endpoint}`;
  const res = await fetch(url, {
    method,
    headers: {
      Authorization: yandexAuthHeader(token),
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Yandex API error ${res.status}: ${text}`);
  }

  return res.json() as unknown as Record<string, unknown>;
}

// ─── Send message ──────────────────────────────────────────

export async function sendMessageYandex(
  cfg: OpenClawConfig,
  accountId: string,
  params: { target: string; text: string; replyToId?: string },
): Promise<{ messageId: string }> {
  const account = resolveYandexAccount({ cfg, accountId: accountId ?? DEFAULT_ACCOUNT_ID });
  const token = resolveYandexToken(account);
  if (!token) {
    throw new Error("Yandex Messenger token not configured");
  }

  const body: Record<string, unknown> = { text: params.text };

  // Yandex uses chat_id (groups: "0/0/<guid>" or "1/0/<guid>") or login (DMs)
  // Group chat IDs contain "/" — user logins don't
  if (params.target.includes("/")) {
    body.chat_id = params.target;
  } else {
    body.login = params.target;
  }

  if (params.replyToId) {
    body.reply_message_id = Number(params.replyToId);
  }

  const result = await yandexApiCall(token, "POST", "/messages/sendText/", body);
  return { messageId: result.message_id ?? "unknown" };
}

// ─── Webhook management ────────────────────────────────────

export async function setYandexWebhook(token: string, webhookUrl: string | null): Promise<void> {
  await yandexApiCall(token, "POST", "/self/update/", {
    webhook_url: webhookUrl,
  });
}

// ─── Health probe ──────────────────────────────────────────

export async function probeYandex(
  cfg: OpenClawConfig,
  accountId: string,
): Promise<YandexProbeResult> {
  const account = resolveYandexAccount({ cfg, accountId: accountId ?? DEFAULT_ACCOUNT_ID });
  const token = resolveYandexToken(account);
  if (!token) {
    return { ok: false, latencyMs: 0, error: "No token configured" };
  }

  const startedAt = Date.now();
  try {
    const result = await yandexApiCall(token, "GET", "/self");
    return {
      ok: true,
      latencyMs: Date.now() - startedAt,
      botName: (result.display_name as string) ?? (result.login as string),
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

export async function uploadYandexFile(
  token: string,
  chatId: string | undefined,
  login: string | undefined,
  buffer: Buffer,
  fileName: string,
): Promise<{ fileId: string; messageId: number }> {
  // Yandex sends files via multipart POST /messages/sendFile/
  const url = `${API_BASE}/messages/sendFile/`;
  const formData = new FormData();
  formData.append("document", new Blob([buffer]), fileName);
  if (chatId) {
    formData.append("chat_id", chatId);
  }
  if (login) {
    formData.append("login", login);
  }

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: yandexAuthHeader(token),
    },
    body: formData,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Yandex file upload error ${res.status}: ${text}`);
  }

  const data = await res.json();
  return { fileId: data.file_id, messageId: data.message_id };
}
