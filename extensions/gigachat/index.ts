import {
  definePluginEntry,
  type ProviderResolveDynamicModelContext,
  type ProviderRuntimeModel,
} from "openclaw/plugin-sdk/plugin-entry";
import { createProviderApiKeyAuthMethod } from "openclaw/plugin-sdk/provider-auth-api-key";
import { applyGigaChatConfig, GIGACHAT_DEFAULT_MODEL_REF } from "./onboard.js";
import { wrapGigaChatProviderStream } from "./stream.js";

const BASE_URL = "https://gigachat.devices.sberbank.ru/api/v1";

// Official GigaChat gen-2 model IDs per https://developers.sber.ru/docs/ru/gigachat/models
// Gen-1 IDs (GigaChat, GigaChat-Pro, GigaChat-Max) auto-redirect to gen-2 equivalents.
// Pricing converted from ₽ to USD at current RUB/USD rate (74.1955 as of 2026-05-09).
// Source: https://developers.sber.ru/docs/ru/gigachat/tariffs/individual-tariffs
const GIGACHAT_STATIC_MODELS = [
  {
    id: "GigaChat-2",
    name: "GigaChat 2 Lite",
    input: ["text"],
    contextWindow: 131072,
    maxTokens: 32768,
    reasoning: false,
    cost: { input: 0.88, output: 0.88, cacheRead: 0, cacheWrite: 0 },
  },
  {
    id: "GigaChat-2-Pro",
    name: "GigaChat 2 Pro",
    input: ["text", "image", "audio"],
    contextWindow: 131072,
    maxTokens: 32768,
    reasoning: false,
    cost: { input: 6.74, output: 6.74, cacheRead: 0, cacheWrite: 0 },
  },
  {
    id: "GigaChat-2-Max",
    name: "GigaChat 2 Max",
    input: ["text", "image", "audio"],
    contextWindow: 131072,
    maxTokens: 32768,
    reasoning: false,
    cost: { input: 8.76, output: 8.76, cacheRead: 0, cacheWrite: 0 },
  },
  // Gen-1 aliases — API auto-redirects to gen-2 equivalents
  {
    id: "GigaChat",
    name: "GigaChat (→ GigaChat 2 Lite)",
    input: ["text"],
    contextWindow: 131072,
    maxTokens: 32768,
    reasoning: false,
    cost: { input: 0.88, output: 0.88, cacheRead: 0, cacheWrite: 0 },
  },
  {
    id: "GigaChat-Pro",
    name: "GigaChat-Pro (→ GigaChat 2 Pro)",
    input: ["text", "image", "audio"],
    contextWindow: 131072,
    maxTokens: 32768,
    reasoning: false,
    cost: { input: 6.74, output: 6.74, cacheRead: 0, cacheWrite: 0 },
  },
  {
    id: "GigaChat-Max",
    name: "GigaChat-Max (→ GigaChat 2 Max)",
    input: ["text", "image", "audio"],
    contextWindow: 131072,
    maxTokens: 32768,
    reasoning: false,
    cost: { input: 8.76, output: 8.76, cacheRead: 0, cacheWrite: 0 },
  },
];

function resolveDynamicModel(ctx: ProviderResolveDynamicModelContext): ProviderRuntimeModel {
  // Look up the model in the static catalog for accurate params
  const entry = GIGACHAT_STATIC_MODELS.find((m) => m.id === ctx.modelId);
  return {
    id: ctx.modelId,
    name: entry?.name ?? ctx.modelId,
    api: "openai-completions",
    provider: "gigachat",
    baseUrl: BASE_URL,
    reasoning: entry?.reasoning ?? false,
    input: entry?.input ?? ["text"],
    cost: entry?.cost ?? { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
    contextWindow: entry?.contextWindow ?? 131072,
    maxTokens: entry?.maxTokens ?? 32768,
  };
}

export default definePluginEntry({
  id: "gigachat",
  name: "GigaChat Provider",
  description: "Встроенный GigaChat (Сбер) с автообновлением OAuth-токена и 3 моделями",
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
          if (!k) {
            return null;
          }
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
            models: GIGACHAT_STATIC_MODELS,
          },
        }),
      },
      resolveDynamicModel: (ctx) => resolveDynamicModel(ctx),
    });
  },
});
