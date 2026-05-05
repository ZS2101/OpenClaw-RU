import { DEFAULT_ACCOUNT_ID } from "openclaw/plugin-sdk/account-id";
import { buildChannelOutboundSessionRoute, createChatChannelPlugin } from "openclaw/plugin-sdk/channel-core";
import { attachChannelToResult } from "openclaw/plugin-sdk/channel-send-result";
import { PAIRING_APPROVED_MESSAGE, buildTokenChannelStatusSummary, resolveConfiguredFromCredentialStatuses } from "openclaw/plugin-sdk/channel-status";
import type { OpenClawConfig } from "openclaw/plugin-sdk/config-types";
import { createChannelDirectoryAdapter } from "openclaw/plugin-sdk/directory-runtime";
import { createDefaultChannelRuntimeState } from "openclaw/plugin-sdk/status-helpers";
import { resolveMAXAccount, listMAXAccountIds } from "./accounts.js";
import { resolveMAXToken } from "./token.js";
import { looksLikeMAXTargetId, normalizeMAXMessagingTarget } from "./normalize.js";
import * as webhookModule from "./webhook.js";
import { probeMAXChannel } from "./probe.js";
import type { MAXProbeResult } from "./types.js";
import { maxSetupAdapter } from "./setup-core.js";
import { maxSetupWizard } from "./setup-surface.js";
import { sendMessageMAX } from "./api.js";

let webhookPromise: Promise<typeof webhookModule> | undefined;
async function loadWebhook() { webhookPromise ??= import("./webhook.js"); return await webhookPromise; }

const maxOutboundAdapter = {
  sendPayload: async (params: { cfg: OpenClawConfig; accountId: string; to: string; payload: { text?: string } }) => {
    const result = await sendMessageMAX(params.cfg, params.accountId, { target: normalizeMAXMessagingTarget(params.to), text: params.payload.text ?? "" });
    return { messageId: result.messageId };
  },
};

export const maxPlugin = createChatChannelPlugin({
  id: "max",
  meta: { displayName: "MAX", helpLink: "https://dev.max.ru/docs-api" },
  defaults: { queue: { debounceMs: 500 } },
  config: { channel: "max" as const, resolveAccount: resolveMAXAccount, listAccountIds: listMAXAccountIds, defaultAccountId: () => DEFAULT_ACCOUNT_ID, resolveToken: resolveMAXToken },
  setup: maxSetupAdapter,
  setupWizard: maxSetupWizard,

  lifecycle: {
    onStart: async (params) => {
      const webhook = await loadWebhook();
      webhook.setMAXWebhookHandler(async (msg) => {
        await params.onMessage({ id: msg.id, from: msg.userId, to: msg.chatId, body: msg.text, chatType: msg.chatType, senderName: msg.senderName, timestamp: msg.timestamp });
      });
      const stop = await webhook.startMAXMonitor({ cfg: params.cfg, accountId: params.accountId, handler: async () => {} });
      return { stop: () => { webhook.setMAXWebhookHandler(null); stop(); } };
    },
  },

  gateway: {
    registerHttpHandlers: ({ app }) => {
      app.post("/webhooks/max", async (req: any, res: any) => {
        try { const webhook = await loadWebhook(); await webhook.handleMAXWebhookEvent(req.body); res.json({ ok: true }); }
        catch (err) { res.status(500).json({ error: String(err) }); }
      });
    },
  },

  outbound: {
    resolveRoute: ({ cfg, accountId, to }) => buildChannelOutboundSessionRoute({ cfg, channel: "max", accountId, to }),
    send: async (params) => { const result = await maxOutboundAdapter.sendPayload(params); return attachChannelToResult(result, { channel: "max" }); },
  },

  status: {
    ...createDefaultChannelRuntimeState(),
    resolveConfigured: ({ cfg, accountId }) => resolveConfiguredFromCredentialStatuses({ cfg, channel: "max", accountId, resolveCredentialStatus: () => { const token = resolveMAXToken(resolveMAXAccount({ cfg, accountId })); return { configured: Boolean(token), token: token ?? undefined }; } }),
    buildSummary: buildTokenChannelStatusSummary({ channel: "max", label: "MAX", formatAccountLabel: (a) => a.name ?? "MAX" }),
  },

  probe: { probe: async ({ cfg, accountId }) => probeMAXChannel(cfg, accountId) },

  security: {
    checkDmAccess: ({ cfg, accountId, senderId }) => {
      const account = resolveMAXAccount({ cfg, accountId });
      const policy = account.dmPolicy ?? "pairing";
      if (policy === "open" || policy === "pairing") return { allowed: true };
      if (policy === "disabled") return { allowed: false };
      if (policy === "allowlist") return { allowed: (account.allowFrom ?? []).includes("*") || (account.allowFrom ?? []).includes(senderId) };
      return { allowed: true };
    },
  },

  groups: {
    resolveRequireMention: ({ cfg, accountId, groupId }) => resolveMAXAccount({ cfg, accountId }).groups?.[groupId]?.requireMention ?? false,
  },

  directory: createChannelDirectoryAdapter({
    channel: "max",
    resolveSelf: async ({ cfg, accountId }) => {
      const account = resolveMAXAccount({ cfg, accountId });
      try { const info = await (await import("./api.js")).probeMAX(cfg, accountId); return { id: "self", name: info.botName ?? "MAX Bot", type: "bot" }; }
      catch { return { id: "self", name: account.name ?? "MAX Bot", type: "bot" }; }
    },
    resolvePeers: async () => [],
    resolveGroups: async ({ cfg, accountId }) => Object.entries(resolveMAXAccount({ cfg, accountId }).groups ?? {}).map(([id]) => ({ id, name: `Chat ${id}`, configured: true })),
  }),

  conversationBindings: {
    supportsCurrentConversationBinding: false,
  },

  pairing: { approvedMessage: () => PAIRING_APPROVED_MESSAGE },
  messaging: { normalizeTarget: normalizeMAXMessagingTarget, looksLikeTargetId: looksLikeMAXTargetId },
});
