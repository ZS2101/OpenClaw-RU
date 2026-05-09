import type { OpenClawConfig } from "openclaw/plugin-sdk/config-types";

export const SELECTEL_DEFAULT_MODEL_REF = "selectel/default";

export function applySelectelConfig(cfg: OpenClawConfig): OpenClawConfig {
  const baseUrl = process.env.SELECTEL_BASE_URL?.replace(/\/+$/, "") || "";
  return {
    ...cfg,
    models: {
      ...cfg.models,
      providers: {
        ...cfg.models?.providers,
        selectel: {
          ...cfg.models?.providers?.selectel,
          api: "openai-completions",
          ...(baseUrl ? { baseUrl } : {}),
        },
      },
    },
  };
}
