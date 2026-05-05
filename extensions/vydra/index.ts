import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { createProviderApiKeyAuthMethod } from "openclaw/plugin-sdk/provider-auth-api-key";
import { buildVydraImageGenerationProvider } from "./image-generation-provider.js";
import { applyVydraConfig, VYDRA_DEFAULT_IMAGE_MODEL_REF } from "./onboard.js";
import { buildVydraSpeechProvider } from "./speech-provider.js";
import { buildVydraVideoGenerationProvider } from "./video-generation-provider.js";

const PROVIDER_ID = "vydra";

export default definePluginEntry({
  id: PROVIDER_ID,
  name: "Vydra Provider",
  description: "Bundled Vydra image, video, and speech provider",
  register(api) {
    api.registerProvider({
      id: PROVIDER_ID,
      label: "Vydra",
      docsPath: "/providers/vydra",
      envVars: ["VYDRA_API_KEY"],
      auth: [
        createProviderApiKeyAuthMethod({
          providerId: PROVIDER_ID,
          methodId: "api-key",
          label: "API-ключ Vydra",
          hint: "Image, video, and speech API key",
          optionKey: "vydraApiKey",
          flagName: "--vydra-api-key",
          envVar: "VYDRA_API_KEY",
          promptMessage: "Введите API-ключ Vydra",
          defaultModel: VYDRA_DEFAULT_IMAGE_MODEL_REF,
          expectedProviders: [PROVIDER_ID],
          applyConfig: (cfg) => applyVydraConfig(cfg),
          wizard: {
            choiceId: "vydra-api-key",
            choiceLabel: "API-ключ Vydra",
            choiceHint: "API-ключ для изображений, видео и речи",
            groupId: "vydra",
            groupLabel: "$ Vydra",
            groupSortKey: 3,
            groupHint: "Изображения, видео и речь",
            onboardingScopes: ["image-generation"],
          },
        }),
      ],
    });
    api.registerSpeechProvider(buildVydraSpeechProvider());
    api.registerImageGenerationProvider(buildVydraImageGenerationProvider());
    api.registerVideoGenerationProvider(buildVydraVideoGenerationProvider());
  },
});
