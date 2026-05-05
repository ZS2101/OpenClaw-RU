import {
  definePluginEntry,
  type OpenClawPluginApi,
  type ProviderAuthMethodNonInteractiveContext,
} from "openclaw/plugin-sdk/plugin-entry";
import {
  buildVllmProvider,
  VLLM_DEFAULT_API_KEY_ENV_VAR,
  VLLM_DEFAULT_BASE_URL,
  VLLM_MODEL_PLACEHOLDER,
  VLLM_PROVIDER_LABEL,
} from "./api.js";

const PROVIDER_ID = "vllm";

async function loadProviderSetup() {
  return await import("openclaw/plugin-sdk/provider-setup");
}

export default definePluginEntry({
  id: "vllm",
  name: "vLLM Provider",
  description: "Bundled vLLM provider plugin",
  register(api: OpenClawPluginApi) {
    api.registerProvider({
      id: PROVIDER_ID,
      label: "vLLM",
      docsPath: "/providers/vllm",
      envVars: ["VLLM_API_KEY"],
      auth: [
        {
          id: "custom",
          label: VLLM_PROVIDER_LABEL,
          hint: "Local/self-hosted OpenAI-compatible server",
          kind: "custom",
          run: async (ctx) => {
            const providerSetup = await loadProviderSetup();
            return await providerSetup.promptAndConfigureOpenAICompatibleSelfHostedProviderAuth({
              cfg: ctx.config,
              prompter: ctx.prompter,
              providerId: PROVIDER_ID,
              providerLabel: VLLM_PROVIDER_LABEL,
              defaultBaseUrl: VLLM_DEFAULT_BASE_URL,
              defaultApiKeyEnvVar: VLLM_DEFAULT_API_KEY_ENV_VAR,
              modelPlaceholder: VLLM_MODEL_PLACEHOLDER,
            });
          },
          runNonInteractive: async (ctx: ProviderAuthMethodNonInteractiveContext) => {
            const providerSetup = await loadProviderSetup();
            return await providerSetup.configureOpenAICompatibleSelfHostedProviderNonInteractive({
              ctx,
              providerId: PROVIDER_ID,
              providerLabel: VLLM_PROVIDER_LABEL,
              defaultBaseUrl: VLLM_DEFAULT_BASE_URL,
              defaultApiKeyEnvVar: VLLM_DEFAULT_API_KEY_ENV_VAR,
              modelPlaceholder: VLLM_MODEL_PLACEHOLDER,
            });
          },
        },
      ],
      discovery: {
        order: "late",
        run: async (ctx) => {
          const providerSetup = await loadProviderSetup();
          return await providerSetup.discoverOpenAICompatibleSelfHostedProvider({
            ctx,
            providerId: PROVIDER_ID,
            buildProvider: buildVllmProvider,
          });
        },
      },
      wizard: {
        setup: {
          choiceId: "vllm",
          choiceLabel: "vLLM",
          choiceHint: "Локальный / self-hosted сервер, совместимый с OpenAI",
          groupId: "vllm",
          groupLabel: "∅ vLLM",
          groupSortKey: 4,
          groupHint: "Локальный / self-hosted, совместимый с OpenAI",
          methodId: "custom",
        },
        modelPicker: {
          label: "vLLM (custom)",
          hint: "Enter vLLM URL + API key + model",
          methodId: "custom",
        },
      },
      buildUnknownModelHint: () =>
        "vLLM requires authentication to be registered as a provider. " +
        'Set VLLM_API_KEY (any value works) or run "openclaw configure". ' +
        "See: https://docs.openclaw.ai/providers/vllm",
    });
  },
});
