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
import { resolveOKAccount, listOKAccountIds } from "./accounts.js";
import { sendMessageOK } from "./api.js";
import { looksLikeOKTargetId, normalizeOKMessagingTarget } from "./normalize.js";
import { probeOKChannel } from "./probe.js";
import { okSetupAdapter } from "./setup-core.js";
import { okSetupWizard } from "./setup-surface.js";
import { resolveOKToken } from "./token.js";
import * as webhookModule from "./webhook.js";

// Lazy webhook loader
let webhookPromise: Promise<typeof webhookModule> | undefined;
async function loadWebhook() {
  webhookPromise ??= import("./webhook.js");
  return await webhookPromise;
}

// ─── Outbound adapter ────────────────────────────────────

const odnoklassnikiOutboundAdapter = {
  sendPayload: async (params: {
    cfg: OpenClawConfig;
    accountId: string;
    to: string;
    payload: { text?: string };
  }) => {
    const result = await sendMessageOK(params.cfg, params.accountId, {
      target: normalizeOKMessagingTarget(params.to),
      text: params.payload.text ?? "",
    });
    return { messageId: result.messageId };
  },
};

// ─── Main plugin definition ──────────────────────────────

export const okPlugin = createChatChannelPlugin({
  id: "odnoklassniki",
  meta: {
    displayName: "Odnoklassniki",
    helpLink: "https://odnoklassniki.ru/dev/messenger/",
  },
  defaults: {
    queue: { debounceMs: 500 },
  },
  config: {
    channel: "odnoklassniki" as const,
    resolveAccount: resolveOKAccount,
    listAccountIds: listOKAccountIds,
    defaultAccountId: () => DEFAULT_ACCOUNT_ID,
    resolveToken: resolveOKToken,
  },
  setup: okSetupAdapter,
  setupWizard: okSetupWizard,

  // ─── Lifecycle (webhook registration) ─────────────────
  lifecycle: {
    onStart: async (params) => {
      const webhook = await loadWebhook();

      // Set the global webhook handler so the HTTP endpoint can reach the agent
      webhook.setOKWebhookHandler(async (msg) => {
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

      const stop = await webhook.startOKMonitor({
        cfg: params.cfg,
        accountId: params.accountId,
        handler: async () => {}, // handled via global handler
      });

      return {
        stop: () => {
          webhook.setOKWebhookHandler(null);
          stop();
        },
      };
    },
  },

  // ─── Gateway: register webhook HTTP handler ────────────
  gateway: {
    registerHttpHandlers: ({ app }) => {
      app.post("/webhooks/odnoklassniki", async (req: Request, res: Response) => {
        try {
          const webhook = await loadWebhook();
          await webhook.handleOKWebhookEvent(req.body);
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
        channel: "odnoklassniki",
        accountId,
        to,
      }),
    send: async (params) => {
      const result = await odnoklassnikiOutboundAdapter.sendPayload({
        cfg: params.cfg,
        accountId: params.accountId,
        to: params.to,
        payload: params.payload,
      });
      return attachChannelToResult(result, { channel: "odnoklassniki" });
    },
  },

  // ─── Status ──────────────────────────────────────────
  status: {
    ...createDefaultChannelRuntimeState(),
    resolveConfigured: ({ cfg, accountId }) =>
      resolveConfiguredFromCredentialStatuses({
        cfg,
        channel: "odnoklassniki",
        accountId,
        resolveCredentialStatus: () => {
          const token = resolveOKToken(resolveOKAccount({ cfg, accountId }));
          return { configured: Boolean(token), token: token ?? undefined };
        },
      }),
    buildSummary: buildTokenChannelStatusSummary({
      channel: "odnoklassniki",
      label: "OK Messenger",
      formatAccountLabel: (account) => account.name ?? "OK",
    }),
  },

  // ─── Probe ───────────────────────────────────────────
  probe: {
    probe: async ({ cfg, accountId }) => {
      return probeOKChannel(cfg, accountId);
    },
  },

  // ─── Security ────────────────────────────────────────
  security: {
    checkDmAccess: ({ cfg, accountId, senderId }) => {
      const account = resolveOKAccount({ cfg, accountId });
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
      const account = resolveOKAccount({ cfg, accountId });
      const groupConfig = account.groups?.[groupId];
      return groupConfig?.requireMention ?? false;
    },
  },

  // ─── Directory ───────────────────────────────────────
  directory: createChannelDirectoryAdapter({
    channel: "odnoklassniki",
    resolveSelf: async ({ cfg, accountId }) => {
      const account = resolveOKAccount({ cfg, accountId });
      const token = resolveOKToken(account);
      if (!token) {
        return null;
      }
      try {
        const info = await (await import("./api.js")).probeOK(cfg, accountId);
        return { id: "self", name: info.botName ?? account.name ?? "OK Bot", type: "bot" };
      } catch {
        return { id: "self", name: account.name ?? "OK Bot", type: "bot" };
      }
    },
    resolvePeers: async () => [],
    resolveGroups: async ({ cfg, accountId }) => {
      const account = resolveOKAccount({ cfg, accountId });
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
    normalizeTarget: normalizeOKMessagingTarget,
    looksLikeTargetId: looksLikeOKTargetId,
  },
});
