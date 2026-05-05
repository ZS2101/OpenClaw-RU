import type { ChannelPlugin } from "openclaw/plugin-sdk/channel-core";
import type { ResolvedTamtamAccount } from "./shared.js";
import type { TamtamProbeResult } from "./types.js";
import { createTamtamPluginBase } from "./shared.js";
import { tamtamSetupWizard } from "./setup-surface.js";
import { tamtamSetupAdapter } from "./setup-core.js";

export const tamtamSetupPlugin: ChannelPlugin<ResolvedTamtamAccount, TamtamProbeResult> = {
  ...createTamtamPluginBase({
    setupWizard: tamtamSetupWizard,
    setup: tamtamSetupAdapter,
  }),
};
