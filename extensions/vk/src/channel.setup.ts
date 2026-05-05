import type { ChannelPlugin } from "openclaw/plugin-sdk/channel-core";
import type { ResolvedVkAccount } from "./shared.js";
import type { VkProbeResult } from "./types.js";
import { createVkPluginBase } from "./shared.js";
import { vkSetupWizard } from "./setup-surface.js";
import { vkSetupAdapter } from "./setup-core.js";

/** Setup-only plugin (lighter, for bootstrap/discovery paths) */
export const vkSetupPlugin: ChannelPlugin<ResolvedVkAccount, VkProbeResult> = {
  ...createVkPluginBase({
    setupWizard: vkSetupWizard,
    setup: vkSetupAdapter,
  }),
};
