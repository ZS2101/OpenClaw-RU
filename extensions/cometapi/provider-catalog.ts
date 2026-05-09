import type { ModelProviderConfig } from "openclaw/plugin-sdk/provider-model-shared";
import {
  buildCometAPIModelDefinition,
  COMETAPI_BASE_URL,
  COMETAPI_MODEL_CATALOG,
} from "./models.js";

export function buildCometAPIProvider(): ModelProviderConfig {
  return {
    baseUrl: COMETAPI_BASE_URL,
    api: "openai-completions",
    models: COMETAPI_MODEL_CATALOG.map(buildCometAPIModelDefinition),
  };
}
