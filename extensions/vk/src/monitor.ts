import type { OpenClawConfig } from "openclaw/plugin-sdk/config-types";
import { DEFAULT_ACCOUNT_ID } from "openclaw/plugin-sdk/account-id";
import { resolveVkAccount } from "./accounts.js";
import { resolveVkToken } from "./token.js";
import {
  getLongPollServer,
  getLongPollEvents,
  type VkLongPollServer,
  type VkLongPollEvent,
} from "./send.js";
import { applyVkGroupGating, isVkGroupPeer } from "./group-policy.js";
import type { VkProbeResult } from "./types.js";

// ─── Types ────────────────────────────────────────────────

export interface VkInboundMessage {
  id: number;
  peerId: number;
  senderId: number;
  text: string;
  conversationMessageId?: number;
  replyMessageId?: number;
  attachments?: any[];
  timestamp: number;
  chatType: "dm" | "group";
}

export type VkMessageHandler = (msg: VkInboundMessage) => Promise<void>;

export interface VkMonitorOptions {
  cfg: OpenClawConfig;
  accountId: string;
  handler: VkMessageHandler;
  verbose?: boolean;
}

// ─── Long Poll monitor ────────────────────────────────────

export async function startVkMonitor(options: VkMonitorOptions): Promise<() => void> {
  const account = resolveVkAccount({
    cfg: options.cfg,
    accountId: options.accountId ?? DEFAULT_ACCOUNT_ID,
  });
  const token = resolveVkToken(account);
  if (!token) throw new Error("VK token not configured");

  let shouldStop = false;
  let pollServer: VkLongPollServer | null = null;
  let reconnectDelay = 1000;

  const log = options.verbose ? console.log : () => {};

  async function connect(): Promise<void> {
    const groupId = account.groupId;
    if (!groupId) {
      throw new Error("VK groupId not configured — set 'groupId' in VK channel config");
    }

    pollServer = await getLongPollServer(token!, groupId, account.apiVersion);
    log(`[vk] Long Poll connected, ts=${pollServer.ts}`);
  }

  async function poll(): Promise<void> {
    while (!shouldStop) {
      try {
        if (!pollServer) {
          await connect();
          if (!pollServer) {
            await sleep(reconnectDelay);
            reconnectDelay = Math.min(reconnectDelay * 2, 30000);
            continue;
          }
        }

        const result = await getLongPollEvents(
          pollServer.server,
          pollServer.key,
          pollServer.ts,
          account.longPollWait ?? 25,
        );

        pollServer.ts = result.ts;
        reconnectDelay = 1000; // reset on success

        for (const update of result.updates) {
          await handleUpdate(update, options);
        }
      } catch (err) {
        log(`[vk] Long Poll error: ${err instanceof Error ? err.message : String(err)}`);
        pollServer = null;
        await sleep(reconnectDelay);
        reconnectDelay = Math.min(reconnectDelay * 2, 30000);
      }
    }
  }

  // Start polling (non-blocking)
  const pollPromise = poll();

  return () => {
    shouldStop = true;
  };
}

// ─── Update handler ───────────────────────────────────────

async function handleUpdate(update: VkLongPollEvent, options: VkMonitorOptions): Promise<void> {
  if (update.type !== "message_new") return;

  const msg = update.object;
  if (!msg?.message) return;

  const message = msg.message;
  const peerId = message.peer_id;
  const senderId = message.from_id;
  const text = message.text || "";
  const messageId = message.conversation_message_id || message.id;

  // Skip own messages (out=1 in community Long Poll message_new events)
  if (message.out === 1) return;

  if (!senderId || !text.trim()) return;

  const chatType = isVkGroupPeer(peerId) ? "group" : "dm";

  // Group gating
  if (chatType === "group") {
    const gating = applyVkGroupGating({
      cfg: options.cfg,
      accountId: options.accountId,
      peerId,
      text,
    });
    if (!gating.shouldProcess) return;
  }

  const inbound: VkInboundMessage = {
    id: messageId || 0,
    peerId,
    senderId,
    text,
    conversationMessageId: message.conversation_message_id,
    replyMessageId: message.reply_message?.id,
    attachments: message.attachments,
    timestamp: message.date ? message.date * 1000 : Date.now(),
    chatType,
  };

  await options.handler(inbound);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
