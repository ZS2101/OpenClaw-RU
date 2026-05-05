import type { OpenClawConfig } from "openclaw/plugin-sdk/config-types";
import { DEFAULT_ACCOUNT_ID } from "openclaw/plugin-sdk/account-id";
import { resolveMAXAccount } from "./accounts.js";
import { resolveMAXToken } from "./token.js";
import { setMAXWebhook } from "./api.js";
import { applyMAXGroupGating } from "./group-policy.js";

// ─── Types ────────────────────────────────────────────────

export interface MAXInboundMessage {
  id: string;
  chatId: string;
  userId: string;
  text: string;
  senderName?: string;
  timestamp: number;
  chatType: "dm" | "group";
}

export type MAXMessageHandler = (msg: MAXInboundMessage) => Promise<void>;

export interface MAXMonitorOptions {
  cfg: OpenClawConfig;
  accountId: string;
  handler: MAXMessageHandler;
  verbose?: boolean;
}

// ─── Active handler (bridges HTTP webhook → agent) ────────

let activeHandler: MAXMessageHandler | null = null;

export function setMAXWebhookHandler(handler: MAXMessageHandler | null): void {
  activeHandler = handler;
}

export async function handleMAXWebhookEvent(body: any): Promise<void> {
  const handler = activeHandler;
  if (!handler) return;

  // Only process message_created events — skip bot_started, message_callback, etc.
  if (body.update_type && body.update_type !== "message_created") return;

  // MAX sends an Update object: { update_type, timestamp, message }
  const msg = body.message || body;

  if (!msg?.body?.text?.trim()) return;

  const text = msg.body.text.trim();
  const msgId = msg.body?.mid ?? body.message_id ?? String(Date.now());
  const chatId = String(msg.recipient?.chat_id ?? body.chat_id ?? msg.sender?.user_id ?? msg.recipient?.user_id ?? "unknown");
  const userId = String(msg.sender?.user_id ?? body.sender?.user_id ?? "unknown");
  const isBot = msg.sender?.is_bot === true;
  if (isBot) return;

  const isGroup = chatId !== userId || Number(chatId) !== Number(userId);
  const chatType = isGroup ? "group" : "dm";

  if (chatType === "group") {
    // We don't have cfg here — group gating skipped for webhook direct events
    // The lifecycle handler processes through the framework's security layer
  }

  const inbound: MAXInboundMessage = {
    id: msgId,
    chatId,
    userId,
    text,
    senderName: msg.sender?.name ?? msg.sender?.first_name ?? body.sender?.name,
    timestamp: body.timestamp || msg.timestamp || Date.now(),
    chatType,
  };

  await handler(inbound);
}

// ─── Webhook monitoring ──────────────────────────────────

export async function startMAXMonitor(options: MAXMonitorOptions): Promise<() => void> {
  const account = resolveMAXAccount({ cfg: options.cfg, accountId: options.accountId ?? DEFAULT_ACCOUNT_ID });
  const token = resolveMAXToken(account);
  if (!token) throw new Error("MAX token not configured");

  const log = options.verbose ? console.log : () => {};

  if (account.webhookUrl) {
    try {
      await setMAXWebhook(token, account.webhookUrl, account.webhookSecret);
      log(`[max] Webhook registered: ${account.webhookUrl}`);
    } catch (err) {
      log(`[max] Webhook registration failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  } else {
    log("[max] No webhook URL configured — set webhookUrl in config or MAX_WEBHOOK_URL env");
  }

  return () => {
    if (account.webhookUrl) {
      setMAXWebhook(token, null).catch(() => {});
    }
  };
}
