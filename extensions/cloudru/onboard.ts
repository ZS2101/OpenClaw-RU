import type { OpenClawConfig } from "openclaw/plugin-sdk/config-types";

export const CLOUDRU_DEFAULT_MODEL_REF = "cloudru/GigaChat";

export function applyCloudRuConfig(cfg: OpenClawConfig): OpenClawConfig {
  return {
    ...cfg,
    models: {
      ...cfg.models,
      providers: {
        ...cfg.models?.providers,
        cloudru: {
          ...cfg.models?.providers?.cloudru,
          baseUrl: "https://foundation-models.api.cloud.ru/v1",
          api: "openai-completions",
        },
      },
    },
  };
}
