import { defineSingleProviderPluginEntry } from "openclaw/plugin-sdk/provider-entry";
import { applyLitellmConfig, LITELLM_DEFAULT_MODEL_REF } from "./onboard.js";
import { buildLitellmProvider } from "./provider-catalog.js";

const PROVIDER_ID = "litellm";

export default defineSingleProviderPluginEntry({
  id: PROVIDER_ID,
  name: "LiteLLM Provider",
  description: "Bundled LiteLLM provider plugin",
  provider: {
    label: "LiteLLM",
    docsPath: "/providers/litellm",
    auth: [
      {
        methodId: "api-key",
        label: "API-ключ LiteLLM",
        hint: "Unified gateway for 100+ LLM providers",
        optionKey: "litellmApiKey",
        flagName: "--litellm-api-key",
        envVar: "LITELLM_API_KEY",
        promptMessage: "Введите API-ключ LiteLLM",
        defaultModel: LITELLM_DEFAULT_MODEL_REF,
        applyConfig: (cfg) => applyLitellmConfig(cfg),
        noteTitle: "LiteLLM",
        noteMessage: [
          "LiteLLM provides a unified API to 100+ LLM providers.",
          "Get your API key from your LiteLLM proxy or https://litellm.ai",
          "Default proxy runs on http://localhost:4000",
        ].join("\n"),
        wizard: {
          groupLabel: "∅ LiteLLM",
          groupSortKey: 4,
          groupHint: "Единый LLM-шлюз (100+ провайдеров)",
        },
      },
    ],
    catalog: {
      buildProvider: buildLitellmProvider,
      allowExplicitBaseUrl: true,
    },
  },
});
