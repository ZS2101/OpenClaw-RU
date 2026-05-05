import { defineSingleProviderPluginEntry } from "openclaw/plugin-sdk/provider-entry";
import { applyQwenNativeStreamingUsageCompat } from "./api.js";
import { buildQwenMediaUnderstandingProvider } from "./media-understanding-provider.js";
import { isQwenCodingPlanBaseUrl, QWEN_36_PLUS_MODEL_ID, QWEN_BASE_URL } from "./models.js";
import {
  applyQwenConfig,
  applyQwenConfigCn,
  applyQwenStandardConfig,
  applyQwenStandardConfigCn,
  QWEN_DEFAULT_MODEL_REF,
} from "./onboard.js";
import { buildQwenProvider } from "./provider-catalog.js";
import { buildQwenVideoGenerationProvider } from "./video-generation-provider.js";

const PROVIDER_ID = "qwen";
const LEGACY_PROVIDER_ID = "modelstudio";

function normalizeProviderId(value: string): string {
  return value.trim().toLowerCase();
}

function resolveConfiguredQwenBaseUrl(
  config: { models?: { providers?: Record<string, { baseUrl?: string } | undefined> } } | undefined,
): string | undefined {
  const providers = config?.models?.providers;
  if (!providers) {
    return undefined;
  }
  for (const [providerId, provider] of Object.entries(providers)) {
    const normalized = normalizeProviderId(providerId);
    if (normalized !== PROVIDER_ID && normalized !== LEGACY_PROVIDER_ID) {
      continue;
    }
    const baseUrl = provider?.baseUrl?.trim();
    if (baseUrl) {
      return baseUrl;
    }
  }
  return undefined;
}

function isQwen36PlusUnsupportedForConfig(params: {
  config: Parameters<typeof resolveConfiguredQwenBaseUrl>[0];
  baseUrl?: string;
}): boolean {
  return isQwenCodingPlanBaseUrl(params.baseUrl ?? resolveConfiguredQwenBaseUrl(params.config));
}

export default defineSingleProviderPluginEntry({
  id: PROVIDER_ID,
  name: "Qwen Provider",
  description: "Bundled Qwen Cloud provider plugin",
  provider: {
    label: "Qwen Cloud",
    docsPath: "/providers/qwen",
    aliases: ["modelstudio", "qwencloud"],
    auth: [
      {
        methodId: "standard-api-key-cn",
        label: "Стандартный API-ключ для Китая (pay-as-you-go)",
        hint: "Endpoint: dashscope.aliyuncs.com",
        optionKey: "modelstudioStandardApiKeyCn",
        flagName: "--modelstudio-standard-api-key-cn",
        envVar: "QWEN_API_KEY",
        promptMessage: "Введите API-ключ Qwen Cloud (Стандартный эндпоинт, Китай)",
        defaultModel: QWEN_DEFAULT_MODEL_REF,
        applyConfig: (cfg) => applyQwenStandardConfigCn(cfg),
        noteMessage: [
          "Manage API keys: https://home.qwencloud.com/api-keys",
          "Docs: https://docs.qwencloud.com/",
          "Endpoint: dashscope.aliyuncs.com/compatible-mode/v1",
          "Models: qwen3.6-plus, qwen3.5-plus, qwen3-coder-plus, etc.",
        ].join("\n"),
        noteTitle: "Qwen Cloud Standard (China)",
        wizard: {
          choiceHint: "Эндпоинт: dashscope.aliyuncs.com",
          groupLabel: "¥ Qwen Cloud",
          groupSortKey: 2,
          groupHint: "Стандартный / Тариф Coding (CN / Глобальный) + мультимодальный roadmap",
        },
      },
      {
        methodId: "standard-api-key",
        label: "Стандартный API-ключ для Глобальный/Intl (pay-as-you-go)",
        hint: "Endpoint: dashscope-intl.aliyuncs.com",
        optionKey: "modelstudioStandardApiKey",
        flagName: "--modelstudio-standard-api-key",
        envVar: "QWEN_API_KEY",
        promptMessage: "Введите API-ключ Qwen Cloud (Стандартный эндпоинт, Глобальный/Intl)",
        defaultModel: QWEN_DEFAULT_MODEL_REF,
        applyConfig: (cfg) => applyQwenStandardConfig(cfg),
        noteMessage: [
          "Manage API keys: https://home.qwencloud.com/api-keys",
          "Docs: https://docs.qwencloud.com/",
          "Endpoint: dashscope-intl.aliyuncs.com/compatible-mode/v1",
          "Models: qwen3.6-plus, qwen3.5-plus, qwen3-coder-plus, etc.",
        ].join("\n"),
        noteTitle: "Qwen Cloud Standard (Global/Intl)",
        wizard: {
          choiceHint: "Эндпоинт: dashscope-intl.aliyuncs.com",
          groupLabel: "¥ Qwen Cloud",
          groupSortKey: 2,
          groupHint: "Стандартный / Тариф Coding (CN / Глобальный) + мультимодальный roadmap",
        },
      },
      {
        methodId: "api-key-cn",
        label: "API-ключ тарифа Coding для Китая (подписка)",
        hint: "Endpoint: coding.dashscope.aliyuncs.com",
        optionKey: "modelstudioApiKeyCn",
        flagName: "--modelstudio-api-key-cn",
        envVar: "QWEN_API_KEY",
        promptMessage: "Введите API-ключ Qwen Cloud тариф Coding (Китай)",
        defaultModel: QWEN_DEFAULT_MODEL_REF,
        applyConfig: (cfg) => applyQwenConfigCn(cfg),
        noteMessage: [
          "Manage API keys: https://home.qwencloud.com/api-keys",
          "Docs: https://docs.qwencloud.com/",
          "Endpoint: coding.dashscope.aliyuncs.com",
          "Models: qwen3.5-plus, glm-5, kimi-k2.5, MiniMax-M2.5, etc.",
        ].join("\n"),
        noteTitle: "Qwen Cloud Coding Plan (China)",
        wizard: {
          choiceHint: "Эндпоинт: coding.dashscope.aliyuncs.com",
          groupLabel: "¥ Qwen Cloud",
          groupSortKey: 2,
          groupHint: "Стандартный / Тариф Coding (CN / Глобальный) + мультимодальный roadmap",
        },
      },
      {
        methodId: "api-key",
        label: "API-ключ тарифа Coding для Глобальный/Intl (подписка)",
        hint: "Endpoint: coding-intl.dashscope.aliyuncs.com",
        optionKey: "modelstudioApiKey",
        flagName: "--modelstudio-api-key",
        envVar: "QWEN_API_KEY",
        promptMessage: "Введите API-ключ Qwen Cloud тариф Coding (Глобальный/Intl)",
        defaultModel: QWEN_DEFAULT_MODEL_REF,
        applyConfig: (cfg) => applyQwenConfig(cfg),
        noteMessage: [
          "Manage API keys: https://home.qwencloud.com/api-keys",
          "Docs: https://docs.qwencloud.com/",
          "Endpoint: coding-intl.dashscope.aliyuncs.com",
          "Models: qwen3.5-plus, glm-5, kimi-k2.5, MiniMax-M2.5, etc.",
        ].join("\n"),
        noteTitle: "Qwen Cloud Coding Plan (Global/Intl)",
        wizard: {
          choiceHint: "Эндпоинт: coding-intl.dashscope.aliyuncs.com",
          groupLabel: "¥ Qwen Cloud",
          groupSortKey: 2,
          groupHint: "Стандартный / Тариф Coding (CN / Глобальный) + мультимодальный roadmap",
        },
      },
    ],
    catalog: {
      run: async (ctx) => {
        const apiKey = ctx.resolveProviderApiKey(PROVIDER_ID).apiKey;
        if (!apiKey) {
          return null;
        }
        const baseUrl = resolveConfiguredQwenBaseUrl(ctx.config) ?? QWEN_BASE_URL;
        return {
          provider: {
            ...buildQwenProvider({ baseUrl }),
            apiKey,
          },
        };
      },
    },
    applyNativeStreamingUsageCompat: ({ providerConfig }) =>
      applyQwenNativeStreamingUsageCompat(providerConfig),
    normalizeConfig: ({ providerConfig }) => {
      if (!isQwenCodingPlanBaseUrl(providerConfig.baseUrl)) {
        return undefined;
      }
      const models = providerConfig.models?.filter((model) => model.id !== QWEN_36_PLUS_MODEL_ID);
      return models && models.length !== providerConfig.models?.length
        ? { ...providerConfig, models }
        : undefined;
    },
    suppressBuiltInModel: (ctx) => {
      const provider = normalizeProviderId(ctx.provider);
      if (
        (provider !== PROVIDER_ID && provider !== LEGACY_PROVIDER_ID) ||
        ctx.modelId !== QWEN_36_PLUS_MODEL_ID ||
        !isQwen36PlusUnsupportedForConfig({ config: ctx.config, baseUrl: ctx.baseUrl })
      ) {
        return undefined;
      }
      return {
        suppress: true,
        errorMessage:
          "Unknown model: qwen/qwen3.6-plus. qwen3.6-plus is not supported on the Qwen Coding Plan endpoint; use a Standard pay-as-you-go Qwen endpoint or choose qwen/qwen3.5-plus.",
      };
    },
  },
  register(api) {
    api.registerMediaUnderstandingProvider(buildQwenMediaUnderstandingProvider());
    api.registerVideoGenerationProvider(buildQwenVideoGenerationProvider());
  },
});
