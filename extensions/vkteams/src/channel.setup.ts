import type { ChannelPlugin } from "openclaw/plugin-sdk/channel-core";
import { vtSetupAdapter } from "./setup-core.js";
import { vtSetupWizard } from "./setup-surface.js";
import type { ResolvedVKTeamsAccount } from "./shared.js";
import { createVTPluginBase } from "./shared.js";
import type { VKTeamsProbeResult } from "./types.js";

/** Standalone setup-only plugin (used by setup registry) */
export const vtSetupPlugin: ChannelPlugin<ResolvedVKTeamsAccount, VKTeamsProbeResult> = {
  ...createVTPluginBase({ setupWizard: vtSetupWizard, setup: vtSetupAdapter }),
};
