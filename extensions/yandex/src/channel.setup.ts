import type { ChannelPlugin } from "openclaw/plugin-sdk/channel-core";
import type { ResolvedYandexAccount } from "./shared.js";
import type { YandexProbeResult } from "./types.js";
import { createYandexPluginBase } from "./shared.js";
import { yandexSetupWizard } from "./setup-surface.js";
import { yandexSetupAdapter } from "./setup-core.js";

export const yandexSetupPlugin: ChannelPlugin<ResolvedYandexAccount, YandexProbeResult> = {
  ...createYandexPluginBase({
    setupWizard: yandexSetupWizard,
    setup: yandexSetupAdapter,
  }),
};
