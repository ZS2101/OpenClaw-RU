import { defineSingleProviderPluginEntry } from "openclaw/plugin-sdk/provider-entry";
import { applyQianfanConfig, QIANFAN_DEFAULT_MODEL_REF } from "./onboard.js";
import { buildQianfanProvider } from "./provider-catalog.js";

const PROVIDER_ID = "qianfan";

export default defineSingleProviderPluginEntry({
  id: PROVIDER_ID,
  name: "Qianfan Provider",
  description: "Bundled Qianfan provider plugin",
  provider: {
    label: "Qianfan",
    docsPath: "/providers/qianfan",
    auth: [
      {
        methodId: "api-key",
        label: "API-ключ Qianfan",
        wizard: { groupLabel: "¥ Qianfan" },
        groupSortKey: 2,
        hint: "API key",
        optionKey: "qianfanApiKey",
        flagName: "--qianfan-api-key",
        envVar: "QIANFAN_API_KEY",
        promptMessage: "Введите API-ключ Qianfan",
        defaultModel: QIANFAN_DEFAULT_MODEL_REF,
        applyConfig: (cfg) => applyQianfanConfig(cfg),
      },
    ],
    catalog: {
      buildProvider: buildQianfanProvider,
    },
  },
});
