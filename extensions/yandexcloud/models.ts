import type { ModelDefinitionConfig } from "openclaw/plugin-sdk/provider-model-shared";
import manifest from "./openclaw.plugin.json" with { type: "json" };

const YC = manifest.modelCatalog.providers.yandexcloud;

export const YANDEXCLOUD_BASE_URL = YC.baseUrl;
export const YANDEXCLOUD_MODEL_CATALOG: ModelDefinitionConfig[] = YC.models;

export function buildYandexCloudModelDefinition(m: (typeof YANDEXCLOUD_MODEL_CATALOG)[number]): ModelDefinitionConfig {
  return { ...m, api: "openai-completions" };
}
