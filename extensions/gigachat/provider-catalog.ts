import type { ModelProviderConfig } from "openclaw/plugin-sdk/provider-model-shared";
import {
  buildGigaChatModelDefinition,
  GIGACHAT_BASE_URL,
  GIGACHAT_MODEL_CATALOG,
} from "./models.js";

export function buildGigaChatProvider(): ModelProviderConfig {
  return {
    baseUrl: GIGACHAT_BASE_URL,
    api: "openai-completions",
    models: GIGACHAT_MODEL_CATALOG.map(buildGigaChatModelDefinition),
  };
}
