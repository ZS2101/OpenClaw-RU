import { defineSingleProviderPluginEntry } from "openclaw/plugin-sdk/provider-entry";
import { buildCloudRuProvider } from "./provider-catalog.js";
import { applyCloudRuConfig, CLOUDRU_DEFAULT_MODEL_REF } from "./onboard.js";

export default defineSingleProviderPluginEntry({
  id: "cloudru",
  name: "Cloud.ru Foundation Models",
  description: "Встроенный плагин Cloud.ru Foundation Models",
  provider: {
    label: "Cloud.ru",
    docsPath: "/providers/cloudru",
    auth: [
      {
        methodId: "api-key",
        label: "API-ключ Cloud.ru",
        hint: "Ключ Foundation Models",
        optionKey: "cloudruApiKey",
        flagName: "--cloudru-api-key",
        envVar: "CLOUDRU_API_KEY",
        promptMessage: "Введите API-ключ Cloud.ru Foundation Models",
        defaultModel: CLOUDRU_DEFAULT_MODEL_REF,
        applyConfig: (cfg) => applyCloudRuConfig(cfg),
        noteMessage: [
          "Cloud.ru Foundation Models — доступ к GigaChat, Qwen, GLM и другим LLM через OpenAI-совместимый API.",
          "Ключ: https://console.cloud.ru",
        ].join("\n"),
        noteTitle: "Cloud.ru Foundation Models",
        wizard: {
          choiceId: "cloudru-api-key",
          choiceLabel: "API-ключ Cloud.ru",
          groupId: "cloudru",
          groupLabel: "₽ Cloud.ru (Evolution)",
          groupSortKey: 1,
          groupHint: "Ключ Foundation Models",
        },
      },
    ],
    catalog: {
      buildProvider: buildCloudRuProvider,
    },
  },
});
