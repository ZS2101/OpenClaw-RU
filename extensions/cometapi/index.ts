import {
  definePluginEntry,
  type ProviderResolveDynamicModelContext,
  type ProviderRuntimeModel,
} from "openclaw/plugin-sdk/plugin-entry";
import { createProviderApiKeyAuthMethod } from "openclaw/plugin-sdk/provider-auth-api-key";
import { DEFAULT_CONTEXT_TOKENS } from "openclaw/plugin-sdk/provider-model-shared";
import {
  setCometAPIApiKey,
  getCometAPIModelCapabilities,
  loadCometAPIModelCapabilities,
} from "openclaw/plugin-sdk/provider-stream-family";
import { applyCometAPIConfig, COMETAPI_DEFAULT_MODEL_REF } from "./onboard.js";

const PROVIDER_ID = "cometapi";
const BASE_URL = "https://api.cometapi.com/v1";
const COMETAPI_DEFAULT_MAX_TOKENS = 8192;

export default definePluginEntry({
  id: "cometapi",
  name: "CometAPI Provider",
  description: "Встроенный CometAPI — российский AI-прокси с динамическим разрешением моделей",
  register(api) {
    function buildDynamicCometAPIModel(
      ctx: ProviderResolveDynamicModelContext,
    ): ProviderRuntimeModel {
      const capabilities = getCometAPIModelCapabilities(ctx.modelId);
      return {
        id: ctx.modelId,
        name: capabilities?.name ?? ctx.modelId,
        api: "openai-completions",
        provider: PROVIDER_ID,
        baseUrl: BASE_URL,
        reasoning: capabilities?.reasoning ?? false,
        input: capabilities?.input ?? ["text"],
        cost: capabilities?.cost ?? { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
        contextWindow: capabilities?.contextWindow ?? DEFAULT_CONTEXT_TOKENS,
        maxTokens: capabilities?.maxTokens ?? COMETAPI_DEFAULT_MAX_TOKENS,
      };
    }

    api.registerProvider({
      id: PROVIDER_ID,
      label: "CometAPI",
      docsPath: "/providers/cometapi",
      envVars: ["COMETAPI_API_KEY"],
      auth: [
        createProviderApiKeyAuthMethod({
          providerId: PROVIDER_ID,
          methodId: "api-key",
          label: "API-ключ CometAPI",
          hint: "API-ключ",
          optionKey: "cometapiApiKey",
          flagName: "--cometapi-api-key",
          envVar: "COMETAPI_API_KEY",
          promptMessage: "Введите API-ключ CometAPI",
          defaultModel: COMETAPI_DEFAULT_MODEL_REF,
          expectedProviders: [PROVIDER_ID],
          applyConfig: (cfg) => applyCometAPIConfig(cfg),
          noteMessage: [
            "CometAPI — российский AI-прокси. OpenAI, Claude, 200+ моделей с оплатой в рублях.",
            "Любая модель: cometapi/gpt-4o, cometapi/claude-sonnet-4-5.",
            "Ключ: https://api.cometapi.com/console/token",
          ].join("\n"),
          noteTitle: "CometAPI",
          wizard: {
            choiceId: "cometapi-api-key",
            choiceLabel: "API-ключ CometAPI",
            groupId: "cometapi",
            groupLabel: "₽ CometAPI",
            groupHint: "Российский AI-прокси",
          },
          groupSortKey: 1,
        }),
      ],
      catalog: {
        order: "simple",
        run: async (ctx) => {
          const k = ctx.resolveProviderApiKey(PROVIDER_ID).apiKey;
          if (!k) {
            return null;
          }
          return {
            provider: { baseUrl: BASE_URL, api: "openai-completions", apiKey: k, models: [] },
          };
        },
      },
      staticCatalog: {
        order: "simple",
        run: async () => ({
          provider: { baseUrl: BASE_URL, api: "openai-completions", models: [] },
        }),
      },
      resolveDynamicModel: (ctx) => buildDynamicCometAPIModel(ctx),
      prepareDynamicModel: async (ctx) => {
        // Seed API key before fetch — catalog.run may not have been called yet.
        const k = ctx.resolveProviderApiKey(PROVIDER_ID).apiKey;
        if (k) {
          setCometAPIApiKey(k);
        }
        await loadCometAPIModelCapabilities(ctx.modelId);
      },
    });
  },
});
