import type { OpenClawConfig } from "openclaw/plugin-sdk/config-types";

export const GIGACHAT_DEFAULT_MODEL_REF = "gigachat/GigaChat-2-Max";

export function applyGigaChatConfig(cfg: OpenClawConfig): OpenClawConfig {
  return {
    ...cfg,
    models: {
      ...cfg.models,
      providers: {
        ...cfg.models?.providers,
        gigachat: {
          ...cfg.models?.providers?.gigachat,
          baseUrl: "https://gigachat.devices.sberbank.ru/api/v1",
          api: "openai-completions",
        },
      },
    },
  };
}
