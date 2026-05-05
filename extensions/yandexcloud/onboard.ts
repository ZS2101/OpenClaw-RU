import type { OpenClawConfig } from "openclaw/plugin-sdk/config-types";

export const YANDEXCLOUD_DEFAULT_MODEL_REF = "yandexcloud/yandexgpt";

export function applyYandexCloudConfig(cfg: OpenClawConfig): OpenClawConfig {
  return {
    ...cfg,
    models: {
      ...cfg.models,
      providers: {
        ...cfg.models?.providers,
        yandexcloud: {
          ...cfg.models?.providers?.yandexcloud,
          baseUrl: "https://ai.api.cloud.yandex.net/v1",
          api: "openai-completions",
        },
      },
    },
  };
}
