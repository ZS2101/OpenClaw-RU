import type { OpenClawConfig } from "openclaw/plugin-sdk/config-types";
import { DEFAULT_ACCOUNT_ID } from "openclaw/plugin-sdk/account-id";
import { resolveOKAccount } from "./accounts.js";
import { resolveOKToken } from "./token.js";
import type { OKProbeResult } from "./types.js";

const API_BASE = "https://api.ok.ru/graph/me";
const API_ROOT = "https://api.ok.ru/graph";

async function okApiCall(
  token: string,
  method: string,
  body?: any,
): Promise<any> {
  const url = `${API_BASE}/${method}?access_token=${encodeURIComponent(token)}`;
  const res = await fetch(url, {
    method: body ? "POST" : "GET",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OK API error ${res.status}: ${text}`);
  }

  const data = await res.json();
  if (data.error_code) {
    throw new Error(`OK API error: ${data.error_msg || data.error_code}`);
  }
  return data;
}

// ─── Send message ──────────────────────────────────────────
// API: POST https://api.ok.ru/graph/chat:{chatId}/messages?access_token=...

export async function sendMessageOK(
  cfg: OpenClawConfig,
  accountId: string,
  params: { target: string; text: string; replyToId?: string },
): Promise<{ messageId: string }> {
  const account = resolveOKAccount({ cfg, accountId: accountId ?? DEFAULT_ACCOUNT_ID });
  const token = resolveOKToken(account);
  if (!token) throw new Error("OK token not configured");

  const body: Record<string, unknown> = {
    recipient: { chat_id: params.target },
    message: { text: params.text },
  };

  if (params.replyToId) {
    // API expects reply_to = mid: prefix format (e.g. "mid:C3ecb9d02a600.15cea67d78d2059")
    (body.message as any).reply_to = params.replyToId;
  }

  // Send uses chat-scoped endpoint, not /me/ prefix
  const url = `${API_ROOT}/${encodeURIComponent(params.target)}/messages?access_token=${encodeURIComponent(token)}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json;charset=utf-8" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OK API error ${res.status}: ${text}`);
  }

  const result = await res.json();
  if (result.error_code) {
    throw new Error(`OK API error: ${result.error_msg || result.error_code}`);
  }

  // Response echoes message with mid field
  return { messageId: result.mid ?? "unknown" };
}

// ─── Webhook management ────────────────────────────────────

export async function setOKWebhook(token: string, webhookUrl: string | null): Promise<void> {
  if (webhookUrl) {
    await okApiCall(token, "subscribe", { url: webhookUrl });
  } else {
    await okApiCall(token, "unsubscribe");
  }
}

export async function getOKSubscriptions(token: string): Promise<any[]> {
  // API returns: { subscriptions: [{ url, time }] }
  const result = await okApiCall(token, "subscriptions");
  return result.subscriptions ?? [];
}

// ─── Health probe ──────────────────────────────────────────

export async function probeOK(
  cfg: OpenClawConfig,
  accountId: string,
): Promise<OKProbeResult> {
  const account = resolveOKAccount({ cfg, accountId: accountId ?? DEFAULT_ACCOUNT_ID });
  const token = resolveOKToken(account);
  if (!token) return { ok: false, latencyMs: 0, error: "No token configured" };

  const startedAt = Date.now();
  try {
    await okApiCall(token, "me");
    return { ok: true, latencyMs: Date.now() - startedAt };
  } catch (err) {
    return {
      ok: false,
      latencyMs: Date.now() - startedAt,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

// ─── File upload ───────────────────────────────────────────

export async function uploadOKFile(
  token: string,
  buffer: Buffer,
  fileName: string,
  attachmentType = "FILE",
): Promise<string> {
  // Step 1: get upload URL
  const url = `${API_BASE}/fileUploadUrl?type=${encodeURIComponent(attachmentType)}&access_token=${encodeURIComponent(token)}`;
  const res = await fetch(url, { method: "GET" });
  if (!res.ok) throw new Error(`OK fileUploadUrl error ${res.status}`);
  const uploadResult = await res.json();
  if (uploadResult.error_code) throw new Error(`OK API error: ${uploadResult.error_msg || uploadResult.error_code}`);
  const uploadUrl = uploadResult.url || uploadResult;
  if (!uploadUrl) throw new Error("Failed to get OK upload URL");

  // Step 2: upload file via multipart
  const formData = new FormData();
  formData.append("file", new Blob([buffer]), fileName);

  const uploadRes = await fetch(uploadUrl, { method: "POST", body: formData });
  if (!uploadRes.ok) throw new Error(`OK file upload error ${uploadRes.status}`);

  return uploadResult.token || "unknown";
}
