import type { ModelDefinitionConfig } from "openclaw/plugin-sdk/provider-model-shared";
import manifest from "./openclaw.plugin.json" with { type: "json" };

const YC = manifest.modelCatalog.providers.cometapi;

export const CometAPICLOUD_BASE_URL = YC.baseUrl;
export const CometAPICLOUD_MODEL_CATALOG: ModelDefinitionConfig[] = YC.models;

export function buildCometAPIModelDefinition(m: (typeof CometAPICLOUD_MODEL_CATALOG)[number]): ModelDefinitionConfig {
  return { ...m, api: "openai-completions" };
}
