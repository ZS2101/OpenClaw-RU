import type { ModelProviderConfig } from "openclaw/plugin-sdk/provider-model-shared";
import { buildCometAPIModelDefinition, CometAPICLOUD_BASE_URL, CometAPICLOUD_MODEL_CATALOG } from "./models.js";

export function buildCometAPIProvider(): ModelProviderConfig {
  return { baseUrl: CometAPICLOUD_BASE_URL, api: "openai-completions", models: CometAPICLOUD_MODEL_CATALOG.map(buildCometAPIModelDefinition) };
}
