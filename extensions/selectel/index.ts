import {
  definePluginEntry,
  type ProviderAuthMethod,
  type ProviderRuntimeModel,
} from "openclaw/plugin-sdk/plugin-entry";
import type { OpenClawConfig } from "openclaw/plugin-sdk/plugin-entry";
import { createProviderApiKeyAuthMethod } from "openclaw/plugin-sdk/provider-auth-api-key";
import { applySelectelConfig, SELECTEL_DEFAULT_MODEL_REF } from "./onboard.js";

function getSelectelBaseUrl(): string {
  return process.env.SELECTEL_BASE_URL?.replace(/\/+$/, "") || "";
}

function getSelectelContextWindow(): number {
  const val = process.env.SELECTEL_MODEL_CONTEXT_WINDOW;
  if (val) {
    const n = Number(val);
    if (Number.isFinite(n) && n >= 1024) {
      return n;
    }
  }
  return 32768; // sensible default
}

function getSelectelMaxTokens(): number {
  const val = process.env.SELECTEL_MAX_TOKENS;
  if (val) {
    const n = Number(val);
    if (Number.isFinite(n) && n >= 256) {
      return n;
    }
  }
  return 4096; // sensible default
}

/**
 * Build the combined Selectel auth method: API key → URL, in a single wizard step.
 */
function buildSelectelAuthMethod(): ProviderAuthMethod {
  const apiKeyMethod = createProviderApiKeyAuthMethod({
    providerId: "selectel",
    methodId: "api-key",
    label: "API-ключ Selectel",
    hint: "Ключ сервиса инференса",
    optionKey: "selectelApiKey",
    flagName: "--selectel-api-key",
    envVar: "SELECTEL_API_KEY",
    promptMessage: "Введите API-ключ Selectel",
    defaultModel: SELECTEL_DEFAULT_MODEL_REF,
    expectedProviders: ["selectel"],
    applyConfig: (cfg) => applySelectelConfig(cfg),
    noteMessage: [
      "Selectel Foundation Models — OpenAI-совместимый управляемый каталог.",
      "Разверните модель в консоли Selectel — затем введите ключ и URL эндпоинта.",
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
  });

  return {
    ...apiKeyMethod,
    /** Extend run: after API key, ask for inference endpoint URL. */
    run: async (ctx) => {
      const result = await apiKeyMethod.run(ctx);

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

      // Ask for the deployed model's context window
      const contextWindowStr = await ctx.prompter.text({
        message:
          "Введите размер контекстного окна развёрнутой модели (в токенах, например 131072):",
        placeholder: "131072",
        validate: (v: string) => {
          const trimmed = v.trim();
          if (!trimmed) {
            return "Размер контекстного окна обязателен";
          }
          const n = Number(trimmed);
          if (!Number.isFinite(n) || n < 1024) {
            return "Введите число токенов (минимум 1024)";
          }
          return undefined;
        },
      });
      const contextWindow = Number(contextWindowStr.trim());

      // Ask for max generation tokens
      const maxTokensStr = await ctx.prompter.text({
        message: "Введите максимальное число токенов генерации (maxTokens, например 32768):",
        placeholder: "32768",
        validate: (v: string) => {
          const trimmed = v.trim();
          if (!trimmed) {
            return "maxTokens обязателен";
          }
          const n = Number(trimmed);
          if (!Number.isFinite(n) || n < 256) {
            return "Введите число токенов (минимум 256)";
          }
          return undefined;
        },
      });
      const maxTokens = Number(maxTokensStr.trim());

      return {
        ...result,
        configPatch: {
          ...result.configPatch,
          env: {
            ...result.configPatch?.env,
            vars: {
              ...result.configPatch?.env?.vars,
              SELECTEL_BASE_URL: trimmed,
              SELECTEL_MODEL_CONTEXT_WINDOW: String(contextWindow),
              SELECTEL_MAX_TOKENS: String(maxTokens),
            },
          },
        } as Partial<OpenClawConfig>,
        notes: [
          ...(result.notes ?? []),
          `Endpoint configured: ${trimmed}`,
          `Model context window: ${contextWindow.toLocaleString()} tokens`,
          `Max tokens: ${maxTokens.toLocaleString()}`,
          `To use manually: export SELECTEL_BASE_URL="${trimmed}" SELECTEL_MODEL_CONTEXT_WINDOW=${contextWindow} SELECTEL_MAX_TOKENS=${maxTokens}`,
        ],
      };
    },
  };
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
      envVars: [
        "SELECTEL_API_KEY",
        "SELECTEL_BASE_URL",
        "SELECTEL_MODEL_CONTEXT_WINDOW",
        "SELECTEL_MAX_TOKENS",
      ],
      auth: [buildSelectelAuthMethod()],
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
        const contextWindow = getSelectelContextWindow();
        const maxTokens = getSelectelMaxTokens();
        return {
          id: ctx.modelId,
          name: ctx.modelId,
          api: "openai-completions",
          provider: "selectel",
          baseUrl: baseUrl || undefined,
          reasoning: false,
          input: ["text"],
          cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
          contextWindow,
          maxTokens,
        };
      },
    });
  },
});
