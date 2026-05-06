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
import { createChannelDirectoryAdapter } from "openclaw/plugin-sdk/directory-runtime";
import { createDefaultChannelRuntimeState } from "openclaw/plugin-sdk/status-helpers";
import { resolveVKTeamsAccount, listVKTeamsAccountIds } from "./accounts.js";
import * as m from "./monitor.js";
import { looksLikeVKTeamsTargetId, normalizeVKTeamsMessagingTarget } from "./normalize.js";
import { probeVKTeamsChannel } from "./probe.js";
import { sendVKTeamsMessage, getVKTeamsSelf } from "./send.js";
import { vtSetupAdapter } from "./setup-core.js";
import { vtSetupWizard } from "./setup-surface.js";
import { resolveVTToken } from "./token.js";
let mp: Promise<typeof m> | undefined;
async function lm() {
  mp ??= import("./monitor.js");
  return await mp;
}

export const vtPlugin = createChatChannelPlugin({
  id: "vkteams",
  meta: { displayName: "VK Teams", helpLink: "https://teams.vk.com/botapi" },
  defaults: { queue: { debounceMs: 500 } },
  config: {
    channel: "vkteams" as const,
    resolveAccount: resolveVKTeamsAccount,
    listAccountIds: listVKTeamsAccountIds,
    defaultAccountId: () => DEFAULT_ACCOUNT_ID,
    resolveToken: resolveVTToken,
  },
  setup: vtSetupAdapter,
  setupWizard: vtSetupWizard,
  lifecycle: {
    onStart: async (params) => {
      const mon = await lm();
      const stop = await mon.startVTMonitor({
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
      buildChannelOutboundSessionRoute({ cfg, channel: "vkteams", accountId, to }),
    send: async (params) => {
      const r = await sendVKTeamsMessage(
        params.cfg,
        params.accountId,
        normalizeVKTeamsMessagingTarget(params.to),
        params.payload.text ?? "",
      );
      return attachChannelToResult(r, { channel: "vkteams" });
    },
  },
  status: {
    ...createDefaultChannelRuntimeState(),
    resolveConfigured: ({ cfg, accountId }) =>
      resolveConfiguredFromCredentialStatuses({
        cfg,
        channel: "vkteams",
        accountId,
        resolveCredentialStatus: () => {
          const t = resolveVTToken(resolveVKTeamsAccount({ cfg, accountId }));
          return { configured: Boolean(t), token: t ?? undefined };
        },
      }),
    buildSummary: buildTokenChannelStatusSummary({
      channel: "vkteams",
      label: "VK Teams",
      formatAccountLabel: (a) => a.name ?? "VK Teams",
    }),
  },
  probe: { probe: async ({ cfg, accountId }) => probeVKTeamsChannel(cfg, accountId) },
  security: {
    checkDmAccess: ({ cfg, accountId, senderId }) => {
      const a = resolveVKTeamsAccount({ cfg, accountId });
      const af = a.allowFrom ?? [];
      return {
        allowed:
          a.dmPolicy !== "disabled" &&
          (af.length === 0 || af.includes("*") || af.includes(senderId)),
      };
    },
  },
  groups: {
    resolveRequireMention: ({ cfg, accountId, groupId }) =>
      resolveVKTeamsAccount({ cfg, accountId }).groups?.[groupId]?.requireMention ?? false,
  },
  directory: createChannelDirectoryAdapter({
    channel: "vkteams",
    resolveSelf: async ({ cfg, accountId }) => {
      try {
        const info = await getVKTeamsSelf(cfg, accountId);
        return { id: "self", name: info.firstName ?? "VK Teams Bot", type: "bot" };
      } catch {
        return { id: "self", name: "VK Teams Bot", type: "bot" };
      }
    },
    resolvePeers: async () => [],
    resolveGroups: async ({ cfg, accountId }) =>
      Object.entries(resolveVKTeamsAccount({ cfg, accountId }).groups ?? {}).map(([id]) => ({
        id,
        name: `Chat ${id}`,
        configured: true,
      })),
  }),
  conversationBindings: {
    supportsCurrentConversationBinding: false,
  },

  pairing: { approvedMessage: () => PAIRING_APPROVED_MESSAGE },
  messaging: {
    normalizeTarget: normalizeVKTeamsMessagingTarget,
    looksLikeTargetId: looksLikeVKTeamsTargetId,
  },
});
