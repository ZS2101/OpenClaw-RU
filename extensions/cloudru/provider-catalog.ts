import type { ModelProviderConfig } from "openclaw/plugin-sdk/provider-model-shared";
import { buildCloudRuModelDefinition, CLOUDRU_BASE_URL, CLOUDRU_MODEL_CATALOG } from "./models.js";

export function buildCloudRuProvider(): ModelProviderConfig {
  return { baseUrl: CLOUDRU_BASE_URL, api: "openai-completions", models: CLOUDRU_MODEL_CATALOG.map(buildCloudRuModelDefinition) };
}
