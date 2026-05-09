import {
  definePluginEntry,
  type ProviderAuthMethod,
  type ProviderRuntimeModel,
} from "openclaw/plugin-sdk/plugin-entry";
import type { OpenClawConfig } from "openclaw/plugin-sdk/plugin-entry";
import { createProviderApiKeyAuthMethod } from "openclaw/plugin-sdk/provider-auth-api-key";
import type { ModelCatalogEntry } from "openclaw/plugin-sdk/provider-model-shared";
import { YANDEXCLOUD_CATALOG_ENTRIES, YANDEXCLOUD_MODEL_CATALOG } from "./models.js";
import { applyYandexCloudConfig, YANDEXCLOUD_DEFAULT_MODEL_REF } from "./onboard.js";
import { wrapYandexCloudProviderStream } from "./stream.js";

const BASE_URL = "https://ai.api.cloud.yandex.net/v1";

/**
 * Build the combined YandexCloud auth method: API key → Folder ID, in a single sequential wizard step.
 * Previously these were two parallel wizard choices — users would pick one and skip the other.
 */
function buildYandexCloudAuthMethod(): ProviderAuthMethod {
  const apiKeyMethod = createProviderApiKeyAuthMethod({
    providerId: "yandexcloud",
    methodId: "api-key",
    label: "API-ключ Yandex Cloud",
    hint: "Ключ Foundation Models",
    optionKey: "yandexcloudApiKey",
    flagName: "--yandexcloud-api-key",
    envVar: "YANDEX_API_KEY",
    promptMessage: "Введите API-ключ Yandex Cloud",
    defaultModel: YANDEXCLOUD_DEFAULT_MODEL_REF,
    expectedProviders: ["yandexcloud"],
    applyConfig: (cfg) => applyYandexCloudConfig(cfg),
    noteMessage: [
      "Yandex Cloud Foundation Models — OpenAI-совместимый API.",
      "Также потребуется ID каталога.",
      "Креды: https://console.cloud.yandex.ru",
    ].join("\n"),
    noteTitle: "Yandex Cloud",
    wizard: {
      choiceId: "yandexcloud-api-key",
      choiceLabel: "API-ключ Yandex Cloud",
      groupId: "yandexcloud",
      groupLabel: "₽ Yandex Cloud",
      groupHint: "Ключ и ID каталога Foundation Models",
    },
  });

  return {
    ...apiKeyMethod,
    /** Extend run: after API key, ask for folder ID. */
    run: async (ctx) => {
      const result = await apiKeyMethod.run(ctx);

      const folderId = await ctx.prompter.text({
        message: "Введите ID каталога Yandex Cloud (формат: b1g...):",
        placeholder: "b1g...",
        validate: (v: string) => {
          const trimmed = v.trim();
          if (!trimmed) {
            return "ID каталога обязателен";
          }
          if (!/^b1g[a-z0-9]+$/i.test(trimmed)) {
            return "ID каталога должен начинаться с 'b1g'";
          }
          return undefined;
        },
      });
      const trimmed = folderId.trim();

      return {
        ...result,
        configPatch: {
          ...result.configPatch,
          env: {
            ...result.configPatch?.env,
            vars: {
              ...result.configPatch?.env?.vars,
              YANDEX_FOLDER_ID: trimmed,
            },
          },
        } as Partial<OpenClawConfig>,
        notes: [
          ...(result.notes ?? []),
          `Folder ID configured: ${trimmed}`,
          `To use manually: export YANDEX_FOLDER_ID="${trimmed}"`,
        ],
      };
    },
  };
}

export default definePluginEntry({
  id: "yandexcloud",
  name: "Yandex Cloud Foundation Models",
  description: "Встроенный провайдер Yandex Cloud с 41 foundation-моделью",
  register(api) {
    api.registerProvider({
      id: "yandexcloud",
      label: "Yandex Cloud",
      docsPath: "/providers/yandexcloud",
      envVars: ["YANDEX_API_KEY", "YANDEX_FOLDER_ID"],
      auth: [buildYandexCloudAuthMethod()],
      wrapStreamFn: wrapYandexCloudProviderStream,
      catalog: {
        order: "simple",
        run: async (ctx) => {
          const k = ctx.resolveProviderApiKey("yandexcloud").apiKey;
          if (!k) {
            return null;
          }
          return {
            provider: { baseUrl: BASE_URL, api: "openai-completions", apiKey: k, models: [] },
          };
        },
      },
      augmentModelCatalog: (): ModelCatalogEntry[] => YANDEXCLOUD_CATALOG_ENTRIES,
      resolveDynamicModel: (ctx): ProviderRuntimeModel => {
        // Look up the model in the static catalog for accurate params
        const catalogEntry = YANDEXCLOUD_MODEL_CATALOG.find((m) => m.id === ctx.modelId);
        return {
          id: ctx.modelId,
          name: catalogEntry?.name ?? ctx.modelId,
          api: "openai-completions",
          provider: "yandexcloud",
          baseUrl: BASE_URL,
          reasoning: catalogEntry?.reasoning ?? false,
          input: catalogEntry?.input ?? ["text"],
          cost: catalogEntry?.cost ?? { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
          contextWindow: catalogEntry?.contextWindow ?? 131072,
          maxTokens: catalogEntry?.maxTokens ?? 16384,
        };
      },
    });
  },
});
