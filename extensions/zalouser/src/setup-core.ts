import {
  createDelegatedSetupWizardProxy,
  createPatchedAccountSetupAdapter,
  type ChannelSetupWizard,
} from "openclaw/plugin-sdk/setup-runtime";

const channel = "zalouser" as const;

export const zalouserSetupAdapter = createPatchedAccountSetupAdapter({
  channelKey: channel,
  validateInput: () => null,
  buildPatch: () => ({}),
});

export function createZalouserSetupWizardProxy(
  loadWizard: () => Promise<ChannelSetupWizard>,
): ChannelSetupWizard {
  return createDelegatedSetupWizardProxy({
    channel,
    loadWizard,
    status: {
      configuredLabel: "выполнен вход",
      unconfiguredLabel: "нужен вход по QR",
      configuredHint: "рекомендуется · выполнен вход",
      unconfiguredHint: "рекомендуется · вход по QR",
      configuredScore: 1,
      unconfiguredScore: 15,
    },
    credentials: [],
    delegatePrepare: true,
    delegateFinalize: true,
  });
}
