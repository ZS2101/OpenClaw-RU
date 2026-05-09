import type { ModelProviderConfig } from "openclaw/plugin-sdk/provider-model-shared";
import {
  buildSelectelModelDefinition,
  SELECTEL_BASE_URL,
  SELECTEL_MODEL_CATALOG,
} from "./models.js";

function resolveBaseUrl(): string | undefined {
  const envUrl = process.env.SELECTEL_BASE_URL?.replace(/\/+$/, "");
  if (envUrl) {
    return envUrl;
  }
  return SELECTEL_BASE_URL || undefined;
}

export function buildSelectelProvider(): ModelProviderConfig {
  return {
    baseUrl: resolveBaseUrl(),
    api: "openai-completions",
    models: SELECTEL_MODEL_CATALOG.map(buildSelectelModelDefinition),
  };
}
