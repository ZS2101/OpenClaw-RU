import type { OpenClawConfig } from "openclaw/plugin-sdk/config-types";
import { DEFAULT_ACCOUNT_ID } from "openclaw/plugin-sdk/account-id";
import { resolveYandexAccount } from "./accounts.js";
import { resolveYandexToken } from "./token.js";
import { setYandexWebhook } from "./api.js";
import { applyYandexGroupGating } from "./group-policy.js";

// ─── Types ────────────────────────────────────────────────

export interface YandexInboundMessage {
  id: string;
  chatId: string;
  userId: string;
  text: string;
  senderName?: string;
  timestamp: number;
  chatType: "dm" | "group";
}

export type YandexMessageHandler = (msg: YandexInboundMessage) => Promise<void>;

export interface YandexMonitorOptions {
  cfg: OpenClawConfig;
  accountId: string;
  handler: YandexMessageHandler;
  verbose?: boolean;
}

// ─── Webhook monitoring ───────────────────────────────────

export async function startYandexMonitor(options: YandexMonitorOptions): Promise<() => void> {
  const account = resolveYandexAccount({
    cfg: options.cfg,
    accountId: options.accountId ?? DEFAULT_ACCOUNT_ID,
  });
  const token = resolveYandexToken(account);
  if (!token) throw new Error("Yandex Messenger token not configured");

  const log = options.verbose ? console.log : () => {};

  // Register webhook if URL is configured
  if (account.webhookUrl) {
    try {
      await setYandexWebhook(token, account.webhookUrl);
      log(`[yandex] Webhook registered: ${account.webhookUrl}`);
    } catch (err) {
      log(`[yandex] Webhook registration failed: ${err instanceof Error ? err.message : String(err)}`);
      log("[yandex] Continuing — webhook may already be registered");
    }
  } else {
    log("[yandex] No webhook URL configured — set webhookUrl in config or YANDEX_WEBHOOK_URL env");
  }

  return () => {
    // Cleanup: unregister webhook on stop
    if (account.webhookUrl) {
      setYandexWebhook(token, null).catch(() => {});
    }
  };
}

// ─── Webhook event handler ────────────────────────────────

// ─── Active handler (bridges HTTP webhook → agent) ────

let activeHandler: YandexMessageHandler | null = null;

export function setYandexWebhookHandler(handler: YandexMessageHandler | null): void {
  activeHandler = handler;
}

export async function handleYandexWebhookEvent(
  body: any,
  options?: YandexMonitorOptions,
): Promise<void> {
  const handler = activeHandler;
  if (!handler) return;

  // Yandex webhook body is { ok, updates: [...] } — same shape as getUpdates response
  const updates: any[] = body?.updates;
  if (!Array.isArray(updates) || updates.length === 0) return;

  for (const update of updates) {
    // Skip non-text updates (stickers, files with no text, etc.)
    const text: string | undefined = update.text?.trim();
    if (!text) continue;

    // Skip messages from bots (including our own echoes)
    if (update.from?.robot) continue;

    const chatType: "dm" | "group" =
      update.chat?.type === "private" ? "dm" :
      update.chat?.type === "group" ? "group" :
      update.chat?.type === "channel" ? "group" :  // treat channels as groups
      "dm";

    // For DMs (private), the chat has no `id` — use sender's login as chatId
    // For groups/channels, use chat.id
    const chatId: string =
      update.chat?.id ?? update.from?.login ?? "unknown";
    const userId: string = update.from?.login ?? update.from?.id ?? "unknown";

    // Group gating
    if (chatType === "group") {
      const gating = applyYandexGroupGating({
        cfg: options?.cfg,
        accountId: options?.accountId,
        chatId,
        text,
      });
      if (!gating.shouldProcess) continue;
    }

    const inbound: YandexInboundMessage = {
      id: String(update.message_id ?? Date.now()),
      chatId,
      userId,
      text,
      senderName: update.from?.display_name,
      timestamp: update.timestamp ?? Date.now(),
      chatType,
    };

    await handler(inbound);
  }
}
