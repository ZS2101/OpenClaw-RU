import { definePluginEntry, type ProviderResolveDynamicModelContext, type ProviderRuntimeModel } from "openclaw/plugin-sdk/plugin-entry";
import type { OpenClawConfig } from "openclaw/plugin-sdk/plugin-entry";
import { createProviderApiKeyAuthMethod } from "openclaw/plugin-sdk/provider-auth-api-key";
import { applyYandexCloudConfig, YANDEXCLOUD_DEFAULT_MODEL_REF } from "./onboard.js";
import { wrapYandexCloudProviderStream } from "./stream.js";

const BASE_URL = "https://ai.api.cloud.yandex.net/v1";

export default definePluginEntry({
  id: "yandexcloud", name: "Yandex Cloud Foundation Models",
  description: "Встроенный провайдер Yandex Cloud с 36 foundation-моделями",
  register(api) {
    api.registerProvider({
      id: "yandexcloud", label: "Yandex Cloud", docsPath: "/providers/yandexcloud",
      envVars: ["YANDEX_API_KEY", "YANDEX_FOLDER_ID"],
      auth: [
        createProviderApiKeyAuthMethod({
          providerId: "yandexcloud", methodId: "api-key", label: "API-ключ Yandex Cloud",
          hint: "Ключ Foundation Models", optionKey: "yandexcloudApiKey", flagName: "--yandexcloud-api-key",
          envVar: "YANDEX_API_KEY", promptMessage: "Введите API-ключ Yandex Cloud",
          defaultModel: YANDEXCLOUD_DEFAULT_MODEL_REF, expectedProviders: ["yandexcloud"],
          applyConfig: (cfg) => applyYandexCloudConfig(cfg),
          noteMessage: [
            "Yandex Cloud Foundation Models — OpenAI-совместимый API.",
            "Также потребуется ID каталога (следующий шаг).",
            "Креды: https://console.cloud.yandex.ru",
          ].join("\n"),
          noteTitle: "Yandex Cloud",
          wizard: { choiceId: "yandexcloud-api-key", choiceLabel: "API-ключ Yandex Cloud", groupId: "yandexcloud", groupLabel: "₽ Yandex Cloud", groupHint: "Ключ Foundation Models" },
          groupSortKey: 1,
        }),
        {
          id: "folder-id",
          label: "ID каталога Yandex Cloud",
          hint: "Идентификатор каталога Foundation Models (обязателен)",
          kind: "api_key" as const,
          wizard: { choiceId: "yandexcloud-folder-id", choiceLabel: "ID каталога Yandex Cloud", groupId: "yandexcloud", groupLabel: "₽ Yandex Cloud", groupHint: "ID каталога для доступа к моделям" },
          groupSortKey: 1,
          run: async (ctx): Promise<{ profiles: Array<{ profileId: string; credential: Record<string, unknown> }>; configPatch: Partial<OpenClawConfig>; notes: string[] }> => {
            const folderId = await ctx.prompter.text({
              message: "Введите ID каталога Yandex Cloud (формат: b1g...):",
              placeholder: "b1g...",
              validate: (v: string) => {
                const trimmed = v.trim();
                if (!trimmed) return "ID каталога обязателен";
                if (!/^b1g[a-z0-9]+$/i.test(trimmed)) return "ID каталога должен начинаться с 'b1g'";
                return undefined;
              },
            });
            const trimmed = folderId.trim();
            return {
              profiles: [],
              configPatch: { env: { vars: { YANDEX_FOLDER_ID: trimmed } } } as Partial<OpenClawConfig>,
              notes: [
                `Folder ID configured: ${trimmed}`,
                `To use manually: export YANDEX_FOLDER_ID="${trimmed}"`,
              ],
            };
          },
        } as import("openclaw/plugin-sdk/plugin-entry").ProviderAuthMethod,
      ],
      wrapStreamFn: wrapYandexCloudProviderStream,
      catalog: { order: "simple", run: async (ctx) => {
        const k = ctx.resolveProviderApiKey("yandexcloud").apiKey;
        if (!k) return null;
        return { provider: { baseUrl: BASE_URL, api: "openai-completions", apiKey: k, models: [] } };
      }},
      staticCatalog: { order: "simple", run: async () =>
        ({ provider: { baseUrl: BASE_URL, api: "openai-completions", models: [] } })
      },
      resolveDynamicModel: (ctx): ProviderRuntimeModel => ({
        id: ctx.modelId, name: ctx.modelId, api: "openai-completions",
        provider: "yandexcloud", baseUrl: BASE_URL, reasoning: false,
        input: ["text"], cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
        contextWindow: 32768, maxTokens: 4096,
      }),
    });
  },
});
