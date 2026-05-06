import type { Request, Response } from "express";
import { DEFAULT_ACCOUNT_ID } from "openclaw/plugin-sdk/account-id";
import {
  buildChannelOutboundSessionRoute,
  createChatChannelPlugin,
} from "openclaw/plugin-sdk/channel-core";
import { attachChannelToResult } from "openclaw/plugin-sdk/channel-send-result";
import {
  PAIRING_APPROVED_MESSAGE,
  buildTokenChannelStatusSummary,
  resolveConfiguredFromCredentialStatuses,
} from "openclaw/plugin-sdk/channel-status";
import type { OpenClawConfig } from "openclaw/plugin-sdk/config-types";
import { createChannelDirectoryAdapter } from "openclaw/plugin-sdk/directory-runtime";
import { createDefaultChannelRuntimeState } from "openclaw/plugin-sdk/status-helpers";
import { resolveYandexAccount, listYandexAccountIds } from "./accounts.js";
import { sendMessageYandex } from "./api.js";
import { looksLikeYandexTargetId, normalizeYandexMessagingTarget } from "./normalize.js";
import { probeYandexChannel } from "./probe.js";
import { yandexSetupAdapter } from "./setup-core.js";
import { yandexSetupWizard } from "./setup-surface.js";
import { resolveYandexToken } from "./token.js";
import * as webhookModule from "./webhook.js";

// Lazy webhook loader
let webhookPromise: Promise<typeof webhookModule> | undefined;
async function loadWebhook() {
  webhookPromise ??= import("./webhook.js");
  return await webhookPromise;
}

// ─── Outbound adapter ────────────────────────────────────

const yandexOutboundAdapter = {
  sendPayload: async (params: {
    cfg: OpenClawConfig;
    accountId: string;
    to: string;
    payload: { text?: string };
  }) => {
    const result = await sendMessageYandex(params.cfg, params.accountId, {
      target: normalizeYandexMessagingTarget(params.to),
      text: params.payload.text ?? "",
    });
    return { messageId: result.messageId };
  },
};

// ─── Main plugin definition ──────────────────────────────

export const yandexPlugin = createChatChannelPlugin({
  id: "yandex",
  meta: {
    displayName: "Yandex Messenger",
    helpLink: "https://yandex.ru/dev/messenger/",
  },
  defaults: {
    queue: { debounceMs: 500 },
  },
  config: {
    channel: "yandex" as const,
    resolveAccount: resolveYandexAccount,
    listAccountIds: listYandexAccountIds,
    defaultAccountId: () => DEFAULT_ACCOUNT_ID,
    resolveToken: resolveYandexToken,
  },
  setup: yandexSetupAdapter,
  setupWizard: yandexSetupWizard,

  // ─── Lifecycle (webhook registration) ─────────────────
  lifecycle: {
    onStart: async (params) => {
      const webhook = await loadWebhook();

      // Set the global webhook handler so the HTTP endpoint can reach the agent
      webhook.setYandexWebhookHandler(async (msg) => {
        await params.onMessage({
          id: msg.id,
          from: msg.userId,
          to: msg.chatId,
          body: msg.text,
          chatType: msg.chatType,
          senderName: msg.senderName,
          timestamp: msg.timestamp,
        });
      });

      const stop = await webhook.startYandexMonitor({
        cfg: params.cfg,
        accountId: params.accountId,
        handler: async () => {}, // handled via global handler
      });

      return {
        stop: () => {
          webhook.setYandexWebhookHandler(null);
          stop();
        },
      };
    },
  },

  // ─── Gateway: register webhook HTTP handler ────────────
  gateway: {
    registerHttpHandlers: ({ app }) => {
      app.post("/webhooks/yandex", async (req: Request, res: Response) => {
        try {
          const webhook = await loadWebhook();
          await webhook.handleYandexWebhookEvent(req.body);
          res.json({ ok: true });
        } catch (err) {
          res.status(500).json({ error: String(err) });
        }
      });
    },
  },

  // ─── Outbound ────────────────────────────────────────
  outbound: {
    resolveRoute: ({ cfg, accountId, to }) =>
      buildChannelOutboundSessionRoute({
        cfg,
        channel: "yandex",
        accountId,
        to,
      }),
    send: async (params) => {
      const result = await yandexOutboundAdapter.sendPayload({
        cfg: params.cfg,
        accountId: params.accountId,
        to: params.to,
        payload: params.payload,
      });
      return attachChannelToResult(result, { channel: "yandex" });
    },
  },

  // ─── Status ──────────────────────────────────────────
  status: {
    ...createDefaultChannelRuntimeState(),
    resolveConfigured: ({ cfg, accountId }) =>
      resolveConfiguredFromCredentialStatuses({
        cfg,
        channel: "yandex",
        accountId,
        resolveCredentialStatus: () => {
          const token = resolveYandexToken(resolveYandexAccount({ cfg, accountId }));
          return { configured: Boolean(token), token: token ?? undefined };
        },
      }),
    buildSummary: buildTokenChannelStatusSummary({
      channel: "yandex",
      label: "Яндекс Мессенджер",
      formatAccountLabel: (account) => account.name ?? "Yandex",
    }),
  },

  // ─── Probe ───────────────────────────────────────────
  probe: {
    probe: async ({ cfg, accountId }) => {
      return probeYandexChannel(cfg, accountId);
    },
  },

  // ─── Security ────────────────────────────────────────
  security: {
    checkDmAccess: ({ cfg, accountId, senderId }) => {
      const account = resolveYandexAccount({ cfg, accountId });
      const policy = account.dmPolicy ?? "pairing";
      if (policy === "open" || policy === "pairing") {
        return { allowed: true };
      }
      if (policy === "disabled") {
        return { allowed: false };
      }
      if (policy === "allowlist") {
        const allowFrom = account.allowFrom ?? [];
        return {
          allowed: allowFrom.includes("*") || allowFrom.includes(senderId),
        };
      }
      return { allowed: true };
    },
  },

  // ─── Groups ──────────────────────────────────────────
  groups: {
    resolveRequireMention: ({ cfg, accountId, groupId }) => {
      const account = resolveYandexAccount({ cfg, accountId });
      const groupConfig = account.groups?.[groupId];
      return groupConfig?.requireMention ?? false;
    },
  },

  // ─── Directory ───────────────────────────────────────
  directory: createChannelDirectoryAdapter({
    channel: "yandex",
    resolveSelf: async ({ cfg, accountId }) => {
      const account = resolveYandexAccount({ cfg, accountId });
      const token = resolveYandexToken(account);
      if (!token) {
        return null;
      }
      try {
        const info = await (await import("./api.js")).probeYandex(cfg, accountId);
        return { id: "self", name: info.botName ?? account.name ?? "Yandex Bot", type: "bot" };
      } catch {
        return { id: "self", name: account.name ?? "Yandex Bot", type: "bot" };
      }
    },
    resolvePeers: async () => [],
    resolveGroups: async ({ cfg, accountId }) => {
      const account = resolveYandexAccount({ cfg, accountId });
      const groups = account.groups ?? {};
      return Object.entries(groups).map(([id, _config]) => ({
        id,
        name: `Chat ${id}`,
        configured: true,
      }));
    },
  }),

  // ─── Pairing ─────────────────────────────────────────
  conversationBindings: {
    supportsCurrentConversationBinding: false,
  },

  pairing: {
    approvedMessage: () => PAIRING_APPROVED_MESSAGE,
  },

  // ─── Target resolution ───────────────────────────────
  messaging: {
    normalizeTarget: normalizeYandexMessagingTarget,
    looksLikeTargetId: looksLikeYandexTargetId,
  },
});
