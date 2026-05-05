import type { ModelDefinitionConfig } from "openclaw/plugin-sdk/provider-model-shared";
import manifest from "./openclaw.plugin.json" with { type: "json" };

const CLOUDRU_MANIFEST = manifest.modelCatalog.providers.cloudru;

export const CLOUDRU_BASE_URL = CLOUDRU_MANIFEST.baseUrl;
export const CLOUDRU_MODEL_CATALOG: ModelDefinitionConfig[] = CLOUDRU_MANIFEST.models;

export function buildCloudRuModelDefinition(m: (typeof CLOUDRU_MODEL_CATALOG)[number]): ModelDefinitionConfig {
  return { ...m, api: "openai-completions" };
}
