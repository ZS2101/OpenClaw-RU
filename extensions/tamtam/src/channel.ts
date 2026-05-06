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
import { resolveTamtamAccount, listTamtamAccountIds } from "./accounts.js";
import * as monitorModule from "./monitor.js";
import { looksLikeTamtamTargetId, normalizeTamtamMessagingTarget } from "./normalize.js";
import { probeTamtamChannel } from "./probe.js";
import { sendMessageTamtam } from "./send.js";
import { tamtamSetupAdapter } from "./setup-core.js";
import { tamtamSetupWizard } from "./setup-surface.js";
import { resolveTamtamToken } from "./token.js";
let monitorPromise: Promise<typeof monitorModule> | undefined;
async function loadMonitor() {
  monitorPromise ??= import("./monitor.js");
  return await monitorPromise;
}

const tamtamOutboundAdapter = {
  sendPayload: async (params: {
    cfg: OpenClawConfig;
    accountId: string;
    to: string;
    payload: { text?: string };
  }) => {
    const result = await sendMessageTamtam(params.cfg, params.accountId, {
      target: normalizeTamtamMessagingTarget(params.to),
      text: params.payload.text ?? "",
    });
    return { messageId: result.messageId };
  },
};

export const tamtamPlugin = createChatChannelPlugin({
  id: "tamtam",
  meta: {
    displayName: "TamTam",
    helpLink: "https://dev.tamtam.chat",
  },
  defaults: { queue: { debounceMs: 500 } },
  config: {
    channel: "tamtam" as const,
    resolveAccount: resolveTamtamAccount,
    listAccountIds: listTamtamAccountIds,
    defaultAccountId: () => DEFAULT_ACCOUNT_ID,
    resolveToken: resolveTamtamToken,
  },
  setup: tamtamSetupAdapter,
  setupWizard: tamtamSetupWizard,

  lifecycle: {
    onStart: async (params) => {
      const monitor = await loadMonitor();
      const stop = await monitor.startTamtamMonitor({
        cfg: params.cfg,
        accountId: params.accountId,
        handler: async (msg) => {
          await params.onMessage({
            id: msg.id,
            from: msg.userId,
            to: msg.chatId,
            body: msg.text,
            chatType: msg.chatType,
            senderName: msg.senderName,
            timestamp: msg.timestamp,
          });
        },
      });
      return { stop };
    },
  },

  outbound: {
    resolveRoute: ({ cfg, accountId, to }) =>
      buildChannelOutboundSessionRoute({ cfg, channel: "tamtam", accountId, to }),
    send: async (params) => {
      const result = await tamtamOutboundAdapter.sendPayload({
        cfg: params.cfg,
        accountId: params.accountId,
        to: params.to,
        payload: params.payload,
      });
      return attachChannelToResult(result, { channel: "tamtam" });
    },
  },

  status: {
    ...createDefaultChannelRuntimeState(),
    resolveConfigured: ({ cfg, accountId }) =>
      resolveConfiguredFromCredentialStatuses({
        cfg,
        channel: "tamtam",
        accountId,
        resolveCredentialStatus: () => {
          const token = resolveTamtamToken(resolveTamtamAccount({ cfg, accountId }));
          return { configured: Boolean(token), token: token ?? undefined };
        },
      }),
    buildSummary: buildTokenChannelStatusSummary({
      channel: "tamtam",
      label: "TamTam",
      formatAccountLabel: (account) => account.name ?? "TamTam",
    }),
  },

  probe: {
    probe: async ({ cfg, accountId }) => probeTamtamChannel(cfg, accountId),
  },

  security: {
    checkDmAccess: ({ cfg, accountId, senderId }) => {
      const account = resolveTamtamAccount({ cfg, accountId });
      const policy = account.dmPolicy ?? "pairing";
      if (policy === "open" || policy === "pairing") {
        return { allowed: true };
      }
      if (policy === "disabled") {
        return { allowed: false };
      }
      if (policy === "allowlist") {
        const allowFrom = account.allowFrom ?? [];
        return { allowed: allowFrom.includes("*") || allowFrom.includes(senderId) };
      }
      return { allowed: true };
    },
  },

  groups: {
    resolveRequireMention: ({ cfg, accountId, groupId }) => {
      const account = resolveTamtamAccount({ cfg, accountId });
      return account.groups?.[groupId]?.requireMention ?? false;
    },
  },

  directory: createChannelDirectoryAdapter({
    channel: "tamtam",
    resolveSelf: async ({ cfg, accountId }) => {
      const account = resolveTamtamAccount({ cfg, accountId });
      const token = resolveTamtamToken(account);
      if (!token) {
        return null;
      }
      try {
        const info = await (await import("./send.js")).probeTamtam(cfg, accountId);
        return { id: "self", name: info.botName ?? "TamTam Bot", type: "bot" };
      } catch {
        return { id: "self", name: account.name ?? "TamTam Bot", type: "bot" };
      }
    },
    resolvePeers: async () => [],
    resolveGroups: async ({ cfg, accountId }) => {
      const account = resolveTamtamAccount({ cfg, accountId });
      return Object.entries(account.groups ?? {}).map(([id, _config]) => ({
        id,
        name: `Chat ${id}`,
        configured: true,
      }));
    },
  }),

  conversationBindings: {
    supportsCurrentConversationBinding: false,
  },

  pairing: { approvedMessage: () => PAIRING_APPROVED_MESSAGE },
  messaging: {
    normalizeTarget: normalizeTamtamMessagingTarget,
    looksLikeTargetId: looksLikeTamtamTargetId,
  },
});
