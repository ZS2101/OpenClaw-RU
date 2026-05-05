import { DEFAULT_ACCOUNT_ID } from "openclaw/plugin-sdk/account-id";
import {
  buildChannelOutboundSessionRoute,
  clearAccountEntryFields,
  createChatChannelPlugin,
} from "openclaw/plugin-sdk/channel-core";
import { createAccountStatusSink } from "openclaw/plugin-sdk/channel-lifecycle";
import { attachChannelToResult } from "openclaw/plugin-sdk/channel-send-result";
import {
  PAIRING_APPROVED_MESSAGE,
  buildTokenChannelStatusSummary,
  projectCredentialSnapshotFields,
  resolveConfiguredFromCredentialStatuses,
} from "openclaw/plugin-sdk/channel-status";
import type { OpenClawConfig } from "openclaw/plugin-sdk/config-types";
import { createChannelDirectoryAdapter } from "openclaw/plugin-sdk/directory-runtime";
import { formatErrorMessage } from "openclaw/plugin-sdk/error-runtime";
import {
  createComputedAccountStatusAdapter,
  createDefaultChannelRuntimeState,
} from "openclaw/plugin-sdk/status-helpers";
import { normalizeOptionalString } from "openclaw/plugin-sdk/text-runtime";
import { resolveVkAccount, listVkAccountIds, type ResolvedVkAccount } from "./accounts.js";
import { resolveVkToken } from "./token.js";
import { looksLikeVkTargetId, normalizeVkMessagingTarget } from "./normalize.js";
import * as monitorModule from "./monitor.js";
import { probeVkChannel } from "./probe.js";
import type { VkProbeResult } from "./types.js";
import { vkSetupAdapter } from "./setup-core.js";
import { vkSetupWizard } from "./setup-surface.js";
import {
  sendMessageVk,
  resolveVkGroupInfo,
  resolveVkUserInfo,
} from "./send.js";

// Lazy monitor loader (avoids loading Long Poll on plugin discovery)
let monitorPromise: Promise<typeof monitorModule> | undefined;
async function loadMonitor() {
  monitorPromise ??= import("./monitor.js");
  return await monitorPromise;
}

// ─── Outbound adapter ────────────────────────────────────

const vkOutboundAdapter = {
  sendPayload: async (params: {
    cfg: OpenClawConfig;
    accountId: string;
    to: string;
    payload: { text?: string };
  }) => {
    const peerId = Number(normalizeVkMessagingTarget(params.to));
    if (isNaN(peerId)) throw new Error(`Invalid VK peer ID: ${params.to}`);
    const result = await sendMessageVk(params.cfg, params.accountId, {
      peerId,
      text: params.payload.text,
    });
    return { messageId: String(result.messageId) };
  },
};

// ─── Main plugin definition ──────────────────────────────

export const vkPlugin = createChatChannelPlugin({
  id: "vk",
  meta: {
    displayName: "VK",
    helpLink: "https://vk.com/dev",
  },
  defaults: {
    queue: { debounceMs: 500 },
  },
  config: {
    channel: "vk" as const,
    resolveAccount: resolveVkAccount,
    listAccountIds: listVkAccountIds,
    defaultAccountId: () => DEFAULT_ACCOUNT_ID,
    resolveToken: resolveVkToken,
  },
  setup: vkSetupAdapter,
  setupWizard: vkSetupWizard,

  // ─── Monitoring (Long Poll) ──────────────────────────
  lifecycle: {
    onStart: async (params) => {
      const monitor = await loadMonitor();
      const stop = await monitor.startVkMonitor({
        cfg: params.cfg,
        accountId: params.accountId,
        handler: async (msg) => {
          await params.onMessage({
            id: String(msg.id),
            from: String(msg.senderId),
            to: String(msg.peerId),
            body: msg.text,
            chatType: msg.chatType,
            senderName: undefined,
            timestamp: msg.timestamp,
          });
        },
      });
      return { stop };
    },
  },

  // ─── Outbound ────────────────────────────────────────
  outbound: {
    resolveRoute: ({ cfg, accountId, to }) =>
      buildChannelOutboundSessionRoute({
        cfg,
        channel: "vk",
        accountId,
        to,
      }),
    send: async (params) => {
      const result = await vkOutboundAdapter.sendPayload({
        cfg: params.cfg,
        accountId: params.accountId,
        to: params.to,
        payload: params.payload,
      });
      return attachChannelToResult(result, { channel: "vk" });
    },
  },

  // ─── Status ──────────────────────────────────────────
  status: {
    ...createDefaultChannelRuntimeState(),
    resolveConfigured: ({ cfg, accountId }) =>
      resolveConfiguredFromCredentialStatuses({
        cfg,
        channel: "vk",
        accountId,
        resolveCredentialStatus: () => {
          const token = resolveVkToken(
            resolveVkAccount({ cfg, accountId }),
          );
          return { configured: Boolean(token), token: token ?? undefined };
        },
      }),
    buildSummary: buildTokenChannelStatusSummary({
      channel: "vk",
      label: "VK",
      formatAccountLabel: (account) => account.name ?? "VK",
    }),
  },

  // ─── Probe / health check ────────────────────────────
  probe: {
    probe: async ({ cfg, accountId }) => {
      return probeVkChannel(cfg, accountId);
    },
  },

  // ─── Security ────────────────────────────────────────
  security: {
    checkDmAccess: ({ cfg, accountId, senderId }) => {
      const account = resolveVkAccount({ cfg, accountId });
      const policy = account.dmPolicy ?? "pairing";
      if (policy === "open" || policy === "pairing") return { allowed: true };
      if (policy === "disabled") return { allowed: false };
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
      const account = resolveVkAccount({ cfg, accountId });
      const groupConfig = account.groups?.[groupId];
      return groupConfig?.requireMention ?? false;
    },
  },

  // ─── Directory ───────────────────────────────────────
  directory: createChannelDirectoryAdapter({
    channel: "vk",
    resolveSelf: async ({ cfg, accountId }) => {
      const account = resolveVkAccount({ cfg, accountId });
      const token = resolveVkToken(account);
      if (!token) return null;
      // Try to get group info
      const groupId = account.groupId;
      if (groupId) {
        const info = await resolveVkGroupInfo(token, groupId);
        if (info) return { id: String(info.id), name: info.name, type: "group" };
      }
      return { id: "unknown", name: account.name ?? "VK Bot", type: "bot" };
    },
    resolvePeers: async ({ cfg, accountId }) => {
      // VK doesn't have a "list contacts" API. Return empty for now.
      return [];
    },
    resolveGroups: async ({ cfg, accountId }) => {
      const account = resolveVkAccount({ cfg, accountId });
      const groups = account.groups ?? {};
      return Object.entries(groups).map(([id, config]) => ({
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
    normalizeTarget: normalizeVkMessagingTarget,
    looksLikeTargetId: looksLikeVkTargetId,
  },
});
