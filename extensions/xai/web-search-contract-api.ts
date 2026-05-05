import {
  createWebSearchProviderContractFields,
  type WebSearchProviderPlugin,
} from "openclaw/plugin-sdk/provider-web-search-config-contract";

export function createXaiWebSearchProvider(): WebSearchProviderPlugin {
  const credentialPath = "plugins.entries.xai.config.webSearch.apiKey";

  return {
    id: "grok",
    label: "Grok (xAI)",
    hint: "Требуется API-ключ xAI · ответы с привязкой к вебу (xAI)",
    onboardingScopes: ["text-inference"],
    credentialLabel: "API-ключ xAI",
    envVars: ["XAI_API_KEY"],
    placeholder: "xai-...",
    signupUrl: "https://console.x.ai/",
    docsUrl: "https://docs.openclaw.ai/tools/web",
    autoDetectOrder: 30,
    credentialPath,
    ...createWebSearchProviderContractFields({
      credentialPath,
      searchCredential: { type: "scoped", scopeId: "grok" },
      настроеноCredential: { pluginId: "xai" },
    }),
    createTool: () => null,
  };
}
