import { DEFAULT_ACCOUNT_ID } from "openclaw/plugin-sdk/account-id";
import type { OpenClawConfig } from "openclaw/plugin-sdk/config-types";
import { resolveMAXAccount } from "./accounts.js";
import { setMAXWebhook } from "./api.js";
import { resolveMAXToken } from "./token.js";

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

interface MAXWebhookBody {
  update_type?: string;
  timestamp?: number;
  message_id?: string;
  chat_id?: string;
  sender?: { user_id?: string; name?: string; first_name?: string; is_bot?: boolean };
  // When MAX sends a message directly (not wrapped in update.message)
  body?: { text?: string; mid?: string };
  recipient?: { chat_id?: string; user_id?: string };
  message?: {
    body?: { text?: string; mid?: string };
    sender?: { user_id?: string; name?: string; first_name?: string; is_bot?: boolean };
    recipient?: { chat_id?: string; user_id?: string };
    timestamp?: number;
  };
}

let activeHandler: MAXMessageHandler | null = null;

export function setMAXWebhookHandler(handler: MAXMessageHandler | null): void {
  activeHandler = handler;
}

export async function handleMAXWebhookEvent(body: unknown): Promise<void> {
  const handler = activeHandler;
  if (!handler) {
    return;
  }

  const b = body as MAXWebhookBody;

  // Only process message_created events — skip bot_started, message_callback, etc.
  if (b.update_type && b.update_type !== "message_created") {
    return;
  }

  // MAX sends an Update object: { update_type, timestamp, message }
  const msg = b.message || b;

  if (!msg.body?.text?.trim()) {
    return;
  }

  const text = msg.body.text.trim();
  const msgId = msg.body?.mid ?? b.message_id ?? String(Date.now());
  const chatId =
    msg.recipient?.chat_id ??
    b.chat_id ??
    msg.sender?.user_id ??
    msg.recipient?.user_id ??
    "unknown";
  const userId = msg.sender?.user_id ?? b.sender?.user_id ?? "unknown";
  const isBot = msg.sender?.is_bot === true;
  if (isBot) {
    return;
  }

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
    senderName: msg.sender?.name ?? msg.sender?.first_name ?? b.sender?.name,
    timestamp: b.timestamp || msg.timestamp || Date.now(),
    chatType,
  };

  await handler(inbound);
}

// ─── Webhook monitoring ──────────────────────────────────

export async function startMAXMonitor(options: MAXMonitorOptions): Promise<() => void> {
  const account = resolveMAXAccount({
    cfg: options.cfg,
    accountId: options.accountId ?? DEFAULT_ACCOUNT_ID,
  });
  const token = resolveMAXToken(account);
  if (!token) {
    throw new Error("MAX token not configured");
  }

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
