import { defineSingleProviderPluginEntry } from "openclaw/plugin-sdk/provider-entry";
import { applyXaiModelCompat } from "openclaw/plugin-sdk/provider-tools";
import { normalizeLowercaseStringOrEmpty } from "openclaw/plugin-sdk/text-runtime";
import { applyVeniceConfig, VENICE_DEFAULT_MODEL_REF } from "./onboard.js";
import { buildVeniceProvider } from "./provider-catalog.js";

const PROVIDER_ID = "venice";

function isXaiBackedVeniceModel(modelId: string): boolean {
  return normalizeLowercaseStringOrEmpty(modelId).includes("grok");
}

export default defineSingleProviderPluginEntry({
  id: PROVIDER_ID,
  name: "Venice Provider",
  description: "Bundled Venice provider plugin",
  provider: {
    label: "Venice",
    docsPath: "/providers/venice",
    auth: [
      {
        methodId: "api-key",
        label: "API-ключ Venice AI",
        hint: "Privacy-focused (uncensored models)",
        optionKey: "veniceApiKey",
        flagName: "--venice-api-key",
        envVar: "VENICE_API_KEY",
        promptMessage: "Введите API-ключ Venice AI",
        defaultModel: VENICE_DEFAULT_MODEL_REF,
        applyConfig: (cfg) => applyVeniceConfig(cfg),
        noteMessage: [
          "Venice AI provides privacy-focused inference with uncensored models.",
          "Get your API key at: https://venice.ai/settings/api",
          "Supports 'private' (fully private) and 'anonymized' (proxy) modes.",
        ].join("\n"),
        noteTitle: "Venice AI",
        wizard: {
          groupLabel: "$ Venice AI",
          groupSortKey: 3,
        },
      },
    ],
    catalog: {
      buildProvider: buildVeniceProvider,
    },
    normalizeResolvedModel: ({ modelId, model }) =>
      isXaiBackedVeniceModel(modelId) ? applyXaiModelCompat(model) : undefined,
  },
});
