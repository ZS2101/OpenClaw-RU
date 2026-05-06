import { DEFAULT_ACCOUNT_ID } from "openclaw/plugin-sdk/account-id";
import type { OpenClawConfig } from "openclaw/plugin-sdk/config-types";
import { resolveTamtamAccount } from "./accounts.js";
import { applyTamtamGroupGating } from "./group-policy.js";
import { getTamtamUpdates, type TamtamUpdate } from "./send.js";
import { resolveTamtamToken } from "./token.js";

// ─── Types ────────────────────────────────────────────────

export interface TamtamInboundMessage {
  id: string;
  chatId: string;
  userId: string;
  text: string;
  senderName?: string;
  timestamp: number;
  chatType: "dm" | "group";
}

export type TamtamMessageHandler = (msg: TamtamInboundMessage) => Promise<void>;

export interface TamtamMonitorOptions {
  cfg: OpenClawConfig;
  accountId: string;
  handler: TamtamMessageHandler;
  verbose?: boolean;
}

// ─── Long Poll monitor ────────────────────────────────────

export async function startTamtamMonitor(options: TamtamMonitorOptions): Promise<() => void> {
  const account = resolveTamtamAccount({
    cfg: options.cfg,
    accountId: options.accountId ?? DEFAULT_ACCOUNT_ID,
  });
  const token = resolveTamtamToken(account);
  if (!token) {
    throw new Error("Tamtam token not configured");
  }

  let shouldStop = false;
  let marker = 0;
  let reconnectDelay = 1000;
  const log = options.verbose ? console.log : () => {};

  async function poll(): Promise<void> {
    while (true) {
      if (shouldStop) {
        break;
      }
      try {
        const result = await getTamtamUpdates(token!, marker);
        marker = result.marker || marker;
        reconnectDelay = 1000;

        for (const update of result.updates) {
          if (shouldStop) {
            break;
          }
          await handleUpdate(update, options);
        }
      } catch (err) {
        log(`[tamtam] Poll error: ${err instanceof Error ? err.message : String(err)}`);
        await sleep(reconnectDelay);
        reconnectDelay = Math.min(reconnectDelay * 2, 30000);
      }
    }
  }

  void poll(); // non-blocking

  return () => {
    shouldStop = true;
  };
}

// ─── Update handler ───────────────────────────────────────

async function handleUpdate(update: TamtamUpdate, options: TamtamMonitorOptions): Promise<void> {
  // Only process new messages
  if (update.update_type !== "message_created") {
    return;
  }

  const msg = update.message;
  if (!msg?.body?.text?.trim()) {
    return;
  }

  const text = msg.body.text.trim();
  const userId = String(msg.sender?.user_id ?? "unknown");
  const isFromBot = msg.sender?.is_bot === true;
  if (isFromBot) {
    return;
  } // skip own/other bot messages

  // TamTam chat_type: "dialog" = DM, "chat" = group, "channel" = channel
  const chatType =
    msg.recipient?.chat_type === "chat" || msg.recipient?.chat_type === "channel" ? "group" : "dm";
  // For DMs, reply target = sender's user_id. For groups, reply target = recipient.chat_id
  // We encode groups as negative for the outbound sign convention in send.ts
  const chatId = chatType === "group" ? String(msg.recipient?.chat_id ?? userId) : userId;
  const outboundTarget = chatType === "group" ? `-${chatId}` : userId;

  // Group gating
  if (chatType === "group") {
    const gating = applyTamtamGroupGating({
      cfg: options.cfg,
      accountId: options.accountId,
      peerId: Number(chatId),
      text,
    });
    if (!gating.shouldProcess) {
      return;
    }
  }

  const inbound: TamtamInboundMessage = {
    id: msg.body?.mid ?? String(Date.now()),
    chatId,
    userId,
    text,
    senderName: msg.sender?.name,
    timestamp: update.timestamp || Date.now(),
    chatType,
  };

  // Override to: outboundTarget for correct routing back (user_id for DM, -chat_id for group)
  await options.handler({ ...inbound, chatId: outboundTarget });
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
