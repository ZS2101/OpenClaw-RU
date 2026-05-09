import type {
  ModelCatalogEntry,
  ModelDefinitionConfig,
} from "openclaw/plugin-sdk/provider-model-shared";
import manifest from "./openclaw.plugin.json" with { type: "json" };

const YC = manifest.modelCatalog.providers.yandexcloud;

export const YANDEXCLOUD_BASE_URL = YC.baseUrl;
export const YANDEXCLOUD_MODEL_CATALOG: ModelDefinitionConfig[] = YC.models;

/** Precomputed model definition objects — avoid spread-per-call overhead. */
const MODEL_DEFINITIONS: ModelDefinitionConfig[] = YC.models.map((m) => ({
  ...m,
  api: "openai-completions" as const,
}));

/** Precomputed catalog entries for augmentModelCatalog — avoid map-per-call overhead. */
export const YANDEXCLOUD_CATALOG_ENTRIES: ModelCatalogEntry[] = MODEL_DEFINITIONS.map((m) => ({
  provider: "yandexcloud",
  id: m.id,
  name: m.name,
  ...(m.reasoning !== undefined ? { reasoning: m.reasoning } : {}),
  input: m.input ?? ["text"],
  contextWindow: m.contextWindow,
}));

export function buildYandexCloudModelDefinition(
  m: (typeof YANDEXCLOUD_MODEL_CATALOG)[number],
): ModelDefinitionConfig {
  return { ...m, api: "openai-completions" };
}
