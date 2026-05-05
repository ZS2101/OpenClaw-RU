import type { ChannelPlugin } from "openclaw/plugin-sdk/channel-core";
import type { ResolvedMAXAccount } from "./shared.js";
import type { MAXProbeResult } from "./types.js";
import { createMaxPluginBase } from "./shared.js";
import { maxSetupWizard } from "./setup-surface.js";
import { maxSetupAdapter } from "./setup-core.js";

export const maxSetupPlugin: ChannelPlugin<ResolvedMAXAccount, MAXProbeResult> = {
  ...createMaxPluginBase({ setupWizard: maxSetupWizard, setup: maxSetupAdapter }),
};
