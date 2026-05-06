import { DEFAULT_ACCOUNT_ID } from "openclaw/plugin-sdk/account-id";
import type { ChannelPlugin } from "openclaw/plugin-sdk/channel-core";
import { resolveVKTeamsAccount, listVKTeamsAccountIds } from "./accounts.js";
import { resolveVTToken } from "./token.js";
import type { VKTeamsProbeResult } from "./types.js";

export type ResolvedVKTeamsAccount = ReturnType<typeof resolveVKTeamsAccount>;

// ─── Config adapter ───────────────────────────────────────

const vc = {
  channel: "vkteams" as const,
  resolveAccount: resolveVKTeamsAccount,
  listAccountIds: listVKTeamsAccountIds,
  defaultAccountId: () => DEFAULT_ACCOUNT_ID,
  resolveToken: resolveVTToken,
};

// ─── Channel plugin base ──────────────────────────────────

function createVTPluginBase(
  o: Partial<ChannelPlugin<ResolvedVKTeamsAccount, VKTeamsProbeResult>> = {},
) {
  return {
    id: "vkteams" as const,
    meta: {
      displayName: "VK Teams",
      helpLink: "https://teams.vk.com/botapi",
    },
    config: vc,
    ...o,
  };
}

export { createVTPluginBase, vc as vkteamsConfigAdapter };
