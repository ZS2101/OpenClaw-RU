import type { ModelProviderConfig } from "openclaw/plugin-sdk/provider-model-shared";
import { buildSelectelModelDefinition, SelectelCLOUD_BASE_URL, SelectelCLOUD_MODEL_CATALOG } from "./models.js";

export function buildSelectelProvider(): ModelProviderConfig {
  return { baseUrl: SelectelCLOUD_BASE_URL, api: "openai-completions", models: SelectelCLOUD_MODEL_CATALOG.map(buildSelectelModelDefinition) };
}
