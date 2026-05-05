import type { ModelDefinitionConfig } from "openclaw/plugin-sdk/provider-model-shared";

// GigaChat uses dynamic model resolution — no static model catalog in manifest.
// Provide empty defaults for compatibility with provider-catalog.ts.
const BASE_URL = "https://gigachat.devices.sberbank.ru/api/v1";

export const GIGACHAT_BASE_URL = BASE_URL;
export const GIGACHAT_MODEL_CATALOG: ModelDefinitionConfig[] = [];

export function buildGigaChatModelDefinition(
  model: ModelDefinitionConfig,
): ModelDefinitionConfig {
  return {
    ...model,
    api: "openai-completions",
  };
}
