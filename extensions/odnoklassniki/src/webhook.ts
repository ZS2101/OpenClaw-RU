import { DEFAULT_ACCOUNT_ID } from "openclaw/plugin-sdk/account-id";
import type { OpenClawConfig } from "openclaw/plugin-sdk/config-types";
import { resolveOKAccount } from "./accounts.js";
import { setOKWebhook } from "./api.js";
import { resolveOKToken } from "./token.js";

// ─── Types ────────────────────────────────────────────────

export interface OKInboundMessage {
  id: string;
  chatId: string;
  userId: string;
  text: string;
  senderName?: string;
  timestamp: number;
  chatType: "dm" | "group";
}

export type OKMessageHandler = (msg: OKInboundMessage) => Promise<void>;

export interface OKMonitorOptions {
  cfg: OpenClawConfig;
  accountId: string;
  handler: OKMessageHandler;
  verbose?: boolean;
}

// ─── Active handler (bridges HTTP webhook → agent) ────────

let activeHandler: OKMessageHandler | null = null;

export function setOKWebhookHandler(handler: OKMessageHandler | null): void {
  activeHandler = handler;
}

export async function handleOKWebhookEvent(
  body: unknown,
  _options?: OKMonitorOptions,
): Promise<void> {
  const handler = activeHandler;
  if (!handler) {
    return;
  }

  // OK sends: { webhookType: "MESSAGE_CREATED", sender: { user_id, name }, recipient: { chat_id }, message: { text, mid, seq }, timestamp }
  if (body?.webhookType !== "MESSAGE_CREATED") {
    return;
  }

  const chatId = body.recipient?.chat_id || "unknown";
  const userId = body.sender?.user_id || "unknown";
  const text = body.message?.text?.trim();
  if (!text) {
    return;
  }

  // OK.ru: ALL webhook messages are user→group/bot chats.
  // There's no chat_type in the webhook payload to distinguish DMs from multi-user groups.
  // Treat all as "dm" since they're direct user-to-bot interactions.
  // Group gating (mention requirements) doesn't apply to this context.
  const chatType = "dm" as const;

  const inbound: OKInboundMessage = {
    id: body.message?.mid || String(Date.now()),
    chatId,
    userId,
    text,
    senderName: body.sender?.name,
    timestamp: body.timestamp || Date.now(),
    chatType,
  };

  await handler(inbound);
}

// ─── Webhook monitoring ──────────────────────────────────

export async function startOKMonitor(options: OKMonitorOptions): Promise<() => void> {
  const account = resolveOKAccount({
    cfg: options.cfg,
    accountId: options.accountId ?? DEFAULT_ACCOUNT_ID,
  });
  const token = resolveOKToken(account);
  if (!token) {
    throw new Error("OK token not configured");
  }

  const log = options.verbose ? console.log : () => {};

  // Register webhook if URL is configured
  if (account.webhookUrl) {
    try {
      await setOKWebhook(token, account.webhookUrl);
      log(`[ok] Webhook registered: ${account.webhookUrl}`);
    } catch (err) {
      log(`[ok] Webhook registration failed: ${err instanceof Error ? err.message : String(err)}`);
      log("[ok] Continuing — webhook may already be registered");
    }
  } else {
    log("[ok] No webhook URL configured — set webhookUrl in config or OK_WEBHOOK_URL env");
  }

  return () => {
    if (account.webhookUrl) {
      setOKWebhook(token, null).catch(() => {});
    }
  };
}
