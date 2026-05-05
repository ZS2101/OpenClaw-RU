import type { ChannelPlugin } from "openclaw/plugin-sdk/channel-core";
import { DEFAULT_ACCOUNT_ID } from "openclaw/plugin-sdk/account-id";
import {
  clearAccountEntryFields,
  createChatChannelPlugin,
} from "openclaw/plugin-sdk/channel-core";
import type { OpenClawConfig } from "openclaw/plugin-sdk/config-types";
import {
  createComputedAccountStatusAdapter,
  createDefaultChannelRuntimeState,
} from "openclaw/plugin-sdk/status-helpers";
import { formatErrorMessage } from "openclaw/plugin-sdk/error-runtime";
import { normalizeOptionalString } from "openclaw/plugin-sdk/text-runtime";
import { createChannelDirectoryAdapter } from "openclaw/plugin-sdk/directory-runtime";
import {
  buildChannelOutboundSessionRoute,
} from "openclaw/plugin-sdk/channel-core";
import { attachChannelToResult } from "openclaw/plugin-sdk/channel-send-result";
import type { ResolvedVkAccount } from "./accounts.js";
import { resolveVkAccount, listVkAccountIds } from "./accounts.js";
import { resolveVkToken } from "./token.js";
import { looksLikeVkTargetId, normalizeVkMessagingTarget } from "./normalize.js";
import * as monitorModule from "./monitor.js";
import * as probeModule from "./probe.js";
import type { VkProbeResult } from "./types.js";
import { vkSecurityAdapter } from "./security.js";
import { vkSetupAdapter } from "./setup-core.js";
import { vkSetupWizard } from "./setup-surface.js";

// Lazy-loaded send module
let sendModulePromise: Promise<typeof import("./send.js")> | undefined;
async function loadSendModule() {
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

function createVkPluginBase(overrides: Partial<ChannelPlugin<ResolvedVkAccount, VkProbeResult>> = {}) {
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
