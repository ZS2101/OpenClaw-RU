import { defineSingleProviderPluginEntry } from "openclaw/plugin-sdk/provider-entry";
import { applyVercelAiGatewayConfig, VERCEL_AI_GATEWAY_DEFAULT_MODEL_REF } from "./onboard.js";
import { buildVercelAiGatewayProvider } from "./provider-catalog.js";

const PROVIDER_ID = "vercel-ai-gateway";

export default defineSingleProviderPluginEntry({
  id: PROVIDER_ID,
  name: "Vercel AI Gateway Provider",
  description: "Bundled Vercel AI Gateway provider plugin",
  provider: {
    label: "Vercel AI Gateway",
    docsPath: "/providers/vercel-ai-gateway",
    auth: [
      {
        methodId: "api-key",
        label: "API-ключ Vercel AI Gateway",
        hint: "API key",
        optionKey: "aiGatewayApiKey",
        flagName: "--ai-gateway-api-key",
        envVar: "AI_GATEWAY_API_KEY",
        promptMessage: "Введите API-ключ Vercel AI Gateway",
        defaultModel: VERCEL_AI_GATEWAY_DEFAULT_MODEL_REF,
        applyConfig: (cfg) => applyVercelAiGatewayConfig(cfg),
        wizard: {
          choiceId: "ai-gateway-api-key",
          groupId: "ai-gateway",
          groupLabel: "$ Vercel AI Gateway",
          groupSortKey: 3,
        },
      },
    ],
    catalog: {
      buildProvider: buildVercelAiGatewayProvider,
    },
  },
});
