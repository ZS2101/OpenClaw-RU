import type { ModelProviderConfig } from "openclaw/plugin-sdk/provider-model-shared";
import {
  buildYandexCloudModelDefinition,
  YANDEXCLOUD_BASE_URL,
  YANDEXCLOUD_MODEL_CATALOG,
} from "./models.js";

/** Precomputed model definitions — built once at module load. */
const PRECOMPUTED_MODELS = YANDEXCLOUD_MODEL_CATALOG.map(buildYandexCloudModelDefinition);

let _provider: ModelProviderConfig | undefined;

export function buildYandexCloudProvider(): ModelProviderConfig {
  return (_provider ??= {
    baseUrl: YANDEXCLOUD_BASE_URL,
    api: "openai-completions",
    models: PRECOMPUTED_MODELS,
  });
}
