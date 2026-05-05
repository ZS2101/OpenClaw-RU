import type { ChannelPlugin } from "openclaw/plugin-sdk/channel-core";
import type { ResolvedOKAccount } from "./shared.js";
import type { OKProbeResult } from "./types.js";
import { createOKPluginBase } from "./shared.js";
import { okSetupWizard } from "./setup-surface.js";
import { okSetupAdapter } from "./setup-core.js";

export const okSetupPlugin: ChannelPlugin<ResolvedOKAccount, OKProbeResult> = {
  ...createOKPluginBase({
    setupWizard: okSetupWizard,
    setup: okSetupAdapter,
  }),
};
