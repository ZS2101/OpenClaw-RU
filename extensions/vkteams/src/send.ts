import { DEFAULT_ACCOUNT_ID } from "openclaw/plugin-sdk/account-id";
import type { OpenClawConfig } from "openclaw/plugin-sdk/config-types";
import { resolveVKTeamsAccount } from "./accounts.js";
import { resolveVTToken } from "./token.js";
import type { VKTeamsProbeResult } from "./types.js";

const DEFAULT_API_URL = "https://myteam.mail.ru/bot/v1";

function vtApiBase(cfg: OpenClawConfig, accountId: string): string {
  const account = resolveVKTeamsAccount({ cfg, accountId: accountId ?? DEFAULT_ACCOUNT_ID });
  return account.apiUrl?.trim() || process.env.VKTEAMS_API_URL?.trim() || DEFAULT_API_URL;
}

async function vtApiCall(
  cfg: OpenClawConfig,
  accountId: string,
  endpoint: string,
  params?: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const account = resolveVKTeamsAccount({ cfg, accountId: accountId ?? DEFAULT_ACCOUNT_ID });
  const token = resolveVTToken(account);
  if (!token) {
    throw new Error("VK Teams token not configured");
  }

  const base = vtApiBase(cfg, accountId);
  const url = new URL(`${base}${endpoint}`);
  url.searchParams.set("token", token);
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined) {
        url.searchParams.set(k, v as string);
      }
    }
  }

  const res = await fetch(url.toString());
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`VK Teams API error ${res.status}: ${t}`);
  }
  const data = await res.json();
  if (!data.ok) {
    throw new Error(`VK Teams API: ${data.description ?? "unknown error"}`);
  }
  return data;
}

// ─── Self ─────────────────────────────────────────────────

export async function getVKTeamsSelf(
  cfg: OpenClawConfig,
  accountId: string,
): Promise<Record<string, unknown>> {
  return vtApiCall(cfg, accountId, "/self/get");
}

// ─── Messages ────────────────────────────────────────────

export async function sendVKTeamsMessage(
  cfg: OpenClawConfig,
  accountId: string,
  chatId: string,
  text: string,
  replyMsgId?: string,
): Promise<{ msgId: string }> {
  const result = await vtApiCall(cfg, accountId, "/messages/sendText", {
    chatId,
    text,
    replyMsgId,
  });
  return { msgId: result.msgId ?? "unknown" };
}

/** Send a file by reference (already uploaded file_id). */
export async function sendVKTeamsFile(
  cfg: OpenClawConfig,
  accountId: string,
  chatId: string,
  fileId: string,
  caption?: string,
): Promise<{ msgId: string }> {
  const result = await vtApiCall(cfg, accountId, "/messages/sendFile", { chatId, fileId, caption });
  return { msgId: result.msgId ?? "unknown" };
}

/** Upload and send a new file via POST multipart. */
export async function uploadVKTeamsFile(
  cfg: OpenClawConfig,
  accountId: string,
  chatId: string,
  buffer: Buffer,
  fileName: string,
  caption?: string,
): Promise<{ fileId: string; msgId: string }> {
  const account = resolveVKTeamsAccount({ cfg, accountId: accountId ?? DEFAULT_ACCOUNT_ID });
  const token = resolveVTToken(account);
  if (!token) {
    throw new Error("VK Teams token not configured");
  }

  const base = vtApiBase(cfg, accountId);
  const url = new URL(`${base}/messages/sendFile`);
  url.searchParams.set("token", token);
  url.searchParams.set("chatId", chatId);
  if (caption) {
    url.searchParams.set("caption", caption);
  }

  const formData = new FormData();
  formData.append("file", new Blob([buffer]), fileName);

  const res = await fetch(url.toString(), { method: "POST", body: formData });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`VK Teams file upload error ${res.status}: ${t}`);
  }
  const data = await res.json();
  if (!data.ok) {
    throw new Error(`VK Teams API: ${data.description ?? "unknown error"}`);
  }
  return { fileId: data.fileId, msgId: data.msgId };
}

export async function editVKTeamsMessage(
  cfg: OpenClawConfig,
  accountId: string,
  chatId: string,
  msgId: string,
  text: string,
): Promise<void> {
  await vtApiCall(cfg, accountId, "/messages/editText", { chatId, msgId, text });
}

export async function deleteVKTeamsMessage(
  cfg: OpenClawConfig,
  accountId: string,
  chatId: string,
  msgId: string,
): Promise<void> {
  await vtApiCall(cfg, accountId, "/messages/deleteMessages", { chatId, msgId });
}

// ─── Events (Long Poll) ──────────────────────────────────

export interface VTEvent {
  eventId: number;
  type: string;
  payload: {
    chat?: { chatId: string; type?: string; title?: string };
    from?: {
      userId: string;
      firstName?: string;
      lastName?: string;
      nick?: string;
      isBot?: boolean;
    };
    text?: string;
    msgId?: string;
    timestamp?: number;
    parts?: Array<{ type: string; payload?: unknown }>;
  };
}

export async function getVTEvents(
  cfg: OpenClawConfig,
  accountId: string,
  lastEventId: number,
  pollTime = 60,
): Promise<{ events: VTEvent[] }> {
  const result = await vtApiCall(cfg, accountId, "/events/get", { lastEventId, pollTime });
  return { events: result.events ?? [] };
}

// ─── Chats ───────────────────────────────────────────────

export async function getVTChatInfo(
  cfg: OpenClawConfig,
  accountId: string,
  chatId: string,
): Promise<Record<string, unknown>> {
  return vtApiCall(cfg, accountId, "/chats/getInfo", { chatId });
}

export async function sendVTAction(
  cfg: OpenClawConfig,
  accountId: string,
  chatId: string,
  action: string,
): Promise<void> {
  await vtApiCall(cfg, accountId, "/chats/sendActions", {
    chatId,
    actions: JSON.stringify([{ type: action }]),
  });
}

// ─── Probe ───────────────────────────────────────────────

export async function probeVKTeams(
  cfg: OpenClawConfig,
  accountId: string,
): Promise<VKTeamsProbeResult> {
  const account = resolveVKTeamsAccount({ cfg, accountId: accountId ?? DEFAULT_ACCOUNT_ID });
  const token = resolveVTToken(account);
  if (!token) {
    return { ok: false, latencyMs: 0, error: "No token configured" };
  }
  const startedAt = Date.now();
  try {
    const info = await getVKTeamsSelf(cfg, accountId);
    return {
      ok: true,
      latencyMs: Date.now() - startedAt,
      botName: info.firstName ?? info.nick ?? "VK Teams Bot",
    };
  } catch (err) {
    return {
      ok: false,
      latencyMs: Date.now() - startedAt,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
