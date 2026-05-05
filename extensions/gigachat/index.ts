import {
  definePluginEntry,
  type ProviderResolveDynamicModelContext,
  type ProviderRuntimeModel,
} from "openclaw/plugin-sdk/plugin-entry";
import { createProviderApiKeyAuthMethod } from "openclaw/plugin-sdk/provider-auth-api-key";
import { applyGigaChatConfig, GIGACHAT_DEFAULT_MODEL_REF } from "./onboard.js";
import { wrapGigaChatProviderStream } from "./stream.js";

const BASE_URL = "https://gigachat.devices.sberbank.ru/api/v1";

function resolveDynamicModel(
  ctx: ProviderResolveDynamicModelContext,
): ProviderRuntimeModel {
  return {
    id: ctx.modelId,
    name: ctx.modelId,
    api: "openai-completions",
    provider: "gigachat",
    baseUrl: BASE_URL,
    reasoning: false,
    input: ["text"],
    cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
    contextWindow: 32768,
    maxTokens: 4096,
  };
}

export default definePluginEntry({
  id: "gigachat",
  name: "GigaChat Provider",
  description:
    "Встроенный GigaChat (Сбер) с автообновлением OAuth-токена и 3 моделями",
  register(api) {
    api.registerProvider({
      id: "gigachat",
      label: "GigaChat",
      docsPath: "/providers/gigachat",
      envVars: ["GIGACHAT_AUTH_KEY", "GIGACHAT_ACCESS_TOKEN"],
      auth: [
        createProviderApiKeyAuthMethod({
          providerId: "gigachat",
          methodId: "api-key",
          label: "Ключ авторизации GigaChat",
          hint: "Base64-ключ из кабинета разработчика Сбера",
          optionKey: "gigachatAuthKey",
          flagName: "--gigachat-auth-key",
          envVar: "GIGACHAT_AUTH_KEY",
          promptMessage: "Введите ключ авторизации GigaChat",
          defaultModel: GIGACHAT_DEFAULT_MODEL_REF,
          expectedProviders: ["gigachat"],
          applyConfig: (cfg) => applyGigaChatConfig(cfg),
          noteMessage: [
            "GigaChat by Sberbank — OpenAI-compatible API with OAuth auth.",
            "Get your authorization key at the Sber developer portal.",
            "The provider auto-refreshes access tokens (30-min expiry).",
            "Docs: https://developers.sber.ru/docs/ru/gigachat/api/overview",
          ].join("\n"),
          noteTitle: "GigaChat (Sberbank)",
          wizard: {
            choiceId: "gigachat-auth-key",
            choiceLabel: "Ключ авторизации GigaChat",
            groupId: "gigachat",
            groupLabel: "₽ GigaChat (Сбер)",
            groupSortKey: 1,
            groupHint: "Ключ авторизации Base64",
          },
        }),
      ],
      wrapStreamFn: wrapGigaChatProviderStream,
      catalog: {
        order: "simple",
        run: async (ctx) => {
          const k = ctx.resolveProviderApiKey("gigachat").apiKey;
          if (!k) return null;
          return {
            provider: {
              baseUrl: BASE_URL,
              api: "openai-completions",
              apiKey: k,
              models: [],
            },
          };
        },
      },
      staticCatalog: {
        order: "simple",
        run: async () => ({
          provider: {
            baseUrl: BASE_URL,
            api: "openai-completions",
            models: [
              {
                id: "GigaChat-2-Lite",
                name: "GigaChat 2 Lite",
                input: ["text"],
                contextWindow: 131072,
                maxTokens: 32768,
                reasoning: false,
                cost: {
                  input: 0.65,  // 65 ₽ per 1M tokens (≈$0.65 USD)
                  output: 0.65,
                  cacheRead: 0,
                  cacheWrite: 0,
                },
              },
              {
                id: "GigaChat-2-Pro",
                name: "GigaChat 2 Pro",
                input: ["text", "image", "audio"],
                contextWindow: 131072,
                maxTokens: 32768,
                reasoning: false,
                cost: {
                  input: 5.0,  // 500 ₽ per 1M tokens (≈$5.00 USD)
                  output: 5.0,
                  cacheRead: 0,
                  cacheWrite: 0,
                },
              },
              {
                id: "GigaChat-2-Max",
                name: "GigaChat 2 Max",
                input: ["text", "image", "audio"],
                contextWindow: 131072,
                maxTokens: 32768,
                reasoning: false,
                cost: {
                  input: 6.5,  // 650 ₽ per 1M tokens (≈$6.50 USD)
                  output: 6.5,
                  cacheRead: 0,
                  cacheWrite: 0,
                },
              },
            ],
          },
        }),
      },
      resolveDynamicModel: (ctx) => resolveDynamicModel(ctx),
    });
  },
});
