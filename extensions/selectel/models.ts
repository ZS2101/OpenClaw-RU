import type { ModelDefinitionConfig } from "openclaw/plugin-sdk/provider-model-shared";
import manifest from "./openclaw.plugin.json" with { type: "json" };

const YC = manifest.modelCatalog.providers.selectel;

export const SELECTEL_BASE_URL = YC.baseUrl;
export const SELECTEL_MODEL_CATALOG: ModelDefinitionConfig[] = YC.models;

export function buildSelectelModelDefinition(
  m: (typeof SELECTEL_MODEL_CATALOG)[number],
): ModelDefinitionConfig {
  return { ...m, api: "openai-completions" };
}
