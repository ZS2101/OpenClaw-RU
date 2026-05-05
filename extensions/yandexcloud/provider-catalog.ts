import type { ModelProviderConfig } from "openclaw/plugin-sdk/provider-model-shared";
import { buildYandexCloudModelDefinition, YANDEXCLOUD_BASE_URL, YANDEXCLOUD_MODEL_CATALOG } from "./models.js";

export function buildYandexCloudProvider(): ModelProviderConfig {
  return { baseUrl: YANDEXCLOUD_BASE_URL, api: "openai-completions", models: YANDEXCLOUD_MODEL_CATALOG.map(buildYandexCloudModelDefinition) };
}
