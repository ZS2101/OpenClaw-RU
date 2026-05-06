import { DEFAULT_ACCOUNT_ID } from "openclaw/plugin-sdk/account-id";
import type { ChannelPlugin } from "openclaw/plugin-sdk/channel-core";
import type { ResolvedVkAccount } from "./accounts.js";
import { resolveVkAccount, listVkAccountIds } from "./accounts.js";
import { vkSetupAdapter } from "./setup-core.js";
import { vkSetupWizard } from "./setup-surface.js";
import { resolveVkToken } from "./token.js";
import type { VkProbeResult } from "./types.js";

// Lazy-loaded send module
let sendModulePromise: Promise<typeof import("./send.js")> | undefined;
async function _loadSendModule() {
  sendModulePromise ??= import("./send.js");
  return await sendModulePromise;
}

// ─── Config adapter ───────────────────────────────────────

const vkConfigAdapter = {
  channel: "vk" as const,
  resolveAccount: resolveVkAccount,
  listAccountIds: listVkAccountIds,
  defaultAccountId: () => DEFAULT_ACCOUNT_ID,
  resolveToken: resolveVkToken,
};

// ─── Channel plugin base ──────────────────────────────────

function createVkPluginBase(
  overrides: Partial<ChannelPlugin<ResolvedVkAccount, VkProbeResult>> = {},
) {
  return {
    id: "vk" as const,
    meta: {
      displayName: "ВКонтакте",
      helpLink: "https://vk.com/dev",
    },
    config: vkConfigAdapter,
    setup: vkSetupAdapter,
    setupWizard: vkSetupWizard,
    ...overrides,
  };
}

export { createVkPluginBase, vkConfigAdapter };

// ─── Resolved account type ────────────────────────────────

export type ResolvedVkAccount = ReturnType<typeof resolveVkAccount>;
