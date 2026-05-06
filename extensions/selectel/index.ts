import { definePluginEntry, type ProviderRuntimeModel } from "openclaw/plugin-sdk/plugin-entry";
import type { OpenClawConfig } from "openclaw/plugin-sdk/plugin-entry";
import { createProviderApiKeyAuthMethod } from "openclaw/plugin-sdk/provider-auth-api-key";
import { applySelectelConfig, Selectel_DEFAULT_MODEL_REF } from "./onboard.js";

function getSelectelBaseUrl(): string {
  return process.env.SELECTEL_BASE_URL?.replace(/\/+$/, "") || "";
}

export default definePluginEntry({
  id: "selectel",
  name: "Selectel Foundation Models",
  description: "Встроенный провайдер Selectel с настраиваемым endpoint",
  register(api) {
    api.registerProvider({
      id: "selectel",
      label: "Selectel",
      docsPath: "/providers/selectel",
      envVars: ["SELECTEL_API_KEY", "SELECTEL_BASE_URL"],
      auth: [
        createProviderApiKeyAuthMethod({
          providerId: "selectel",
          methodId: "api-key",
          label: "API-ключ Selectel",
          hint: "Ключ сервиса инференса",
          optionKey: "selectelApiKey",
          flagName: "--selectel-api-key",
          envVar: "SELECTEL_API_KEY",
          promptMessage: "Введите API-ключ Selectel",
          defaultModel: Selectel_DEFAULT_MODEL_REF,
          expectedProviders: ["selectel"],
          applyConfig: (cfg) => applySelectelConfig(cfg),
          noteMessage: [
            "Selectel Foundation Models — OpenAI-совместимый управляемый каталог.",
            "Разверните модель в консоли Selectel и введите URL endpoint (следующий шаг).",
            "Документация: https://docs.selectel.ru/foundation-models-catalog/",
          ].join("\n"),
          noteTitle: "Selectel",
          wizard: {
            choiceId: "selectel-api-key",
            choiceLabel: "API-ключ Selectel",
            groupId: "selectel",
            groupLabel: "₽ Selectel",
            groupHint: "Ключ Foundation Models",
          },
          groupSortKey: 1,
        }),
        {
          id: "base-url",
          label: "Endpoint инференса Selectel",
          hint: "URL сервиса инференса (из консоли Selectel после развёртывания модели)",
          kind: "api_key" as const,
          wizard: {
            choiceId: "selectel-base-url",
            choiceLabel: "URL эндпоинта Selectel",
            groupId: "selectel",
            groupLabel: "₽ Selectel",
            groupHint: "Endpoint сервиса инференса",
          },
          groupSortKey: 1,
          run: async (
            ctx,
          ): Promise<{
            profiles: Array<{ profileId: string; credential: Record<string, unknown> }>;
            configPatch: Partial<OpenClawConfig>;
            notes: string[];
          }> => {
            const baseUrl = await ctx.prompter.text({
              message:
                "Введите URL endpoint сервиса инференса Selectel (например, https://xxx.selectel.ru/v1):",
              placeholder: "https://xxx.selectel.ru/v1",
              validate: (v: string) => {
                const trimmed = v.trim();
                if (!trimmed) {
                  return "URL endpoint обязателен";
                }
                if (!/^https?:\/\/.+/.test(trimmed)) {
                  return "URL must start with https://";
                }
                return undefined;
              },
            });
            const trimmed = baseUrl.trim().replace(/\/+$/, "");
            return {
              profiles: [],
              configPatch: {
                env: { vars: { SELECTEL_BASE_URL: trimmed } },
              } as Partial<OpenClawConfig>,
              notes: [
                `Endpoint configured: ${trimmed}`,
                `To use manually: export SELECTEL_BASE_URL="${trimmed}"`,
                `Then use any model you deployed: selectel/<model-id>`,
              ],
            };
          },
        } as import("openclaw/plugin-sdk/plugin-entry").ProviderAuthMethod,
      ],
      catalog: {
        order: "simple",
        run: async (ctx) => {
          const k = ctx.resolveProviderApiKey("selectel").apiKey;
          if (!k) {
            return null;
          }
          const baseUrl = getSelectelBaseUrl();
          return {
            provider: {
              baseUrl: baseUrl || undefined,
              api: "openai-completions",
              apiKey: k,
              models: [],
            },
          };
        },
      },
      staticCatalog: {
        order: "simple",
        run: async () => {
          const baseUrl = getSelectelBaseUrl();
          return {
            provider: { baseUrl: baseUrl || undefined, api: "openai-completions", models: [] },
          };
        },
      },
      resolveDynamicModel: (ctx): ProviderRuntimeModel => {
        const baseUrl = getSelectelBaseUrl();
        return {
          id: ctx.modelId,
          name: ctx.modelId,
          api: "openai-completions",
          provider: "selectel",
          baseUrl: baseUrl || undefined,
          reasoning: false,
          input: ["text"],
          cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
          contextWindow: 32768,
          maxTokens: 4096,
        };
      },
    });
  },
});
