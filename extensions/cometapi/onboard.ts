import type { OpenClawConfig } from "openclaw/plugin-sdk/config-types";

export const CometAPI_DEFAULT_MODEL_REF = "cometapi/gpt-4o-mini";

export function applyCometAPIConfig(cfg: OpenClawConfig): OpenClawConfig {
  return {
    ...cfg,
    models: {
      ...cfg.models,
      providers: {
        ...cfg.models?.providers,
        cometapi: {
          ...cfg.models?.providers?.cometapi,
          baseUrl: "https://api.cometapi.com/v1",
          api: "openai-completions",
        },
      },
    },
  };
}
