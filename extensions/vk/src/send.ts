import { DEFAULT_ACCOUNT_ID } from "openclaw/plugin-sdk/account-id";
import type { OpenClawConfig } from "openclaw/plugin-sdk/config-types";
import { resolveVkAccount } from "./accounts.js";
import { resolveVkToken } from "./token.js";
import type { VkProbeResult } from "./types.js";

const VK_API_BASE = "https://api.vk.com/method/";

/** Generic VK API call with token auth */
async function vkApiCall(
  token: string,
  method: string,
  params: Record<string, string | number>,
  apiVersion = "5.199",
): Promise<unknown> {
  const url = new URL(`${VK_API_BASE}${method}`);
  url.searchParams.set("access_token", token);
  url.searchParams.set("v", apiVersion);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, String(value));
  }

  const res = await fetch(url.toString());
  const data = await res.json();

  if (data.error) {
    throw new Error(`VK API error: ${data.error.error_msg} (code ${data.error.error_code})`);
  }
  return data.response;
}

// ─── Send message ──────────────────────────────────────────

export interface VkSendParams {
  text?: string;
  peerId: number;
  replyTo?: number;
  attachment?: string;
  keyboard?: string;
  randomId?: number;
}

export async function sendMessageVk(
  cfg: OpenClawConfig,
  accountId: string,
  params: VkSendParams,
): Promise<{ messageId: number }> {
  const account = resolveVkAccount({ cfg, accountId: accountId ?? DEFAULT_ACCOUNT_ID });
  const token = resolveVkToken(account);
  if (!token) {
    throw new Error("VK token not configured");
  }

  const randomId = params.randomId ?? Math.floor(Math.random() * 2_147_483_647);

  const apiParams: Record<string, string | number> = {
    peer_id: params.peerId,
    random_id: randomId,
  };
  if (params.text) {
    apiParams.message = params.text;
  }
  if (params.replyTo) {
    apiParams.reply_to = params.replyTo;
  }
  if (params.attachment) {
    apiParams.attachment = params.attachment;
  }
  if (params.keyboard) {
    apiParams.keyboard = params.keyboard;
  }

  const result = await vkApiCall(token, "messages.send", apiParams, account.apiVersion);
  // VK API: single peer → response = integer message_id; multiple → array of {peer_id, message_id}
  const msgId =
    typeof result === "number"
      ? result
      : ((Array.isArray(result)
          ? result[0]?.message_id
          : (result as Record<string, unknown>)?.message_id) ?? 0);
  return { messageId: msgId };
}

// ─── Probe / health check ──────────────────────────────────

export async function probeVk(cfg: OpenClawConfig, accountId: string): Promise<VkProbeResult> {
  const account = resolveVkAccount({ cfg, accountId: accountId ?? DEFAULT_ACCOUNT_ID });
  const token = resolveVkToken(account);
  if (!token) {
    return { ok: false, latencyMs: 0, error: "No token configured" };
  }

  const startedAt = Date.now();
  try {
    const result = await vkApiCall(token, "groups.getById", {}, account.apiVersion);
    const latencyMs = Date.now() - startedAt;
    const group = Array.isArray(result) ? result[0] : null;
    return {
      ok: true,
      latencyMs,
      groupName: group?.name,
      memberCount: group?.members_count,
    };
  } catch (err) {
    return {
      ok: false,
      latencyMs: Date.now() - startedAt,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

// ─── Long Poll ─────────────────────────────────────────────

export interface VkLongPollServer {
  key: string;
  server: string;
  ts: number;
}

export interface VkLongPollEvent {
  type: string;
  object: unknown;
  group_id: number;
}

export async function getLongPollServer(
  token: string,
  groupId: number,
  apiVersion = "5.199",
): Promise<VkLongPollServer> {
  const result = await vkApiCall(
    token,
    "groups.getLongPollServer",
    { group_id: groupId },
    apiVersion,
  );
  return result as VkLongPollServer;
}

export async function getLongPollEvents(
  server: string,
  key: string,
  ts: number,
  wait = 25,
): Promise<{ ts: number; updates: VkLongPollEvent[] }> {
  const url = new URL(server);
  url.searchParams.set("act", "a_check");
  url.searchParams.set("key", key);
  url.searchParams.set("ts", String(ts));
  url.searchParams.set("wait", String(wait));

  const res = await fetch(url.toString());
  const data = await res.json();

  if (data.failed) {
    const codes: Record<number, string> = {
      1: "history expired",
      2: "key expired",
      3: "user info lost",
      4: "version expired",
    };
    const detail =
      typeof data.failed === "number" ? (codes[data.failed] ?? `code ${data.failed}`) : data.failed;
    throw new Error(`Long Poll failed: ${detail}`);
  }
  return { ts: data.ts ?? ts, updates: data.updates ?? [] };
}

// ─── Group info ────────────────────────────────────────────

export async function resolveVkGroupInfo(
  token: string,
  groupId: number,
  apiVersion = "5.199",
): Promise<{ id: number; name: string; screenName?: string } | null> {
  try {
    const result = await vkApiCall(token, "groups.getById", { group_id: groupId }, apiVersion);
    const group = Array.isArray(result) ? result[0] : null;
    if (!group) {
      return null;
    }
    return { id: group.id, name: group.name, screenName: group.screen_name };
  } catch {
    return null;
  }
}

// ─── User info ─────────────────────────────────────────────

export async function resolveVkUserInfo(
  token: string,
  userId: number,
  apiVersion = "5.199",
): Promise<{ id: number; firstName: string; lastName: string } | null> {
  try {
    const result = await vkApiCall(
      token,
      "users.get",
      { user_ids: userId, fields: "" },
      apiVersion,
    );
    const user = Array.isArray(result) ? result[0] : null;
    if (!user) {
      return null;
    }
    return { id: user.id, firstName: user.first_name, lastName: user.last_name };
  } catch {
    return null;
  }
}
