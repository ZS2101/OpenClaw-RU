import {
  createAllowFromSection,
  createStandardChannelSetupStatus,
  DEFAULT_ACCOUNT_ID,
  hasConfiguredSecretInput,
  patchChannelConfigForAccount,
  setSetupChannelEnabled,
  splitSetupEntries,
} from "openclaw/plugin-sdk/setup";
import type { ChannelSetupWizard } from "openclaw/plugin-sdk/setup";
import { normalizeOptionalString } from "openclaw/plugin-sdk/text-runtime";
import { listYandexAccountIds, resolveYandexAccount } from "./accounts.js";
import { resolveYandexToken } from "./token.js";
import {
  YANDEX_ALLOWFROM_HELP_LINES,
  YANDEX_TOKEN_HELP_LINES,
  parseYandexAllowFromId,
  yandexSetupAdapter,
  isYandexConfigured,
} from "./setup-core.js";

const CHANNEL = "yandex" as const;

export const yandexSetupWizard: ChannelSetupWizard = {
  channel: CHANNEL,
  status: createStandardChannelSetupStatus({
    channelLabel: "Yandex Messenger",
    configuredLabel: "настроено",
    unconfiguredLabel: "нужен токен",
    configuredHint: "настроено",
    unconfiguredHint: "рекомендуется · нужен токен + URL вебхука",
    configuredScore: 1,
    unconfiguredScore: 1,
    resolveConfigured: ({ cfg, accountId }) =>
      (accountId ? [accountId] : listYandexAccountIds(cfg)).some((id) =>
        isYandexConfigured(cfg, id),
      ),
  }),
  credentials: [
    {
      inputKey: "token",
      providerHint: CHANNEL,
      credentialLabel: "OAuth-токен Яндекс Мессенджера",
      preferredEnvVar: "YANDEX_BOT_TOKEN",
      helpTitle: "Токен бота Яндекс Мессенджера",
      helpLines: YANDEX_TOKEN_HELP_LINES,
      envPrompt: "Обнаружен YANDEX_BOT_TOKEN. Использовать env var?",
      keepPrompt: "Yandex token already configured. Keep it?",
      inputPrompt: "Введите OAuth-токен Яндекс Мессенджера",
      allowEnv: ({ accountId }) => accountId === DEFAULT_ACCOUNT_ID,
      inspect: ({ cfg, accountId }) => {
        const account = resolveYandexAccount({ cfg, accountId });
        const hasConfigured = hasConfiguredSecretInput(account.token);
        return {
          accountConfigured: Boolean(resolveYandexToken(account)) || hasConfigured,
          hasConfiguredValue: hasConfigured,
          resolvedValue: normalizeOptionalString(resolveYandexToken(account) ?? undefined),
          envValue:
            accountId === DEFAULT_ACCOUNT_ID
              ? normalizeOptionalString(process.env.YANDEX_BOT_TOKEN)
              : undefined,
        };
      },
    },
  ],
  allowFrom: createAllowFromSection({
    helpTitle: "Yandex login",
    helpLines: YANDEX_ALLOWFROM_HELP_LINES,
    message: "Yandex allowFrom (logins/emails)",
    placeholder: "user@yandex.ru",
    invalidWithoutCredentialNote:
      "Yandex allowFrom requires valid logins.",
    parseInputs: splitSetupEntries,
    parseId: parseYandexAllowFromId,
    resolveEntries: async ({ entries }) =>
      entries.map((entry) => {
        const id = parseYandexAllowFromId(entry);
        return { input: entry, resolved: Boolean(id), id };
      }),
    apply: async ({ cfg, accountId, allowFrom }) =>
      patchChannelConfigForAccount({
        cfg,
        channel: CHANNEL,
        accountId,
        patch: { dmPolicy: "allowlist", allowFrom },
      }),
  }),
  finalize: async ({ cfg, accountId, prompter }) => {
    // No special warnings
  },
  disable: (cfg) => setSetupChannelEnabled(cfg, CHANNEL, false),
};

export { parseYandexAllowFromId, yandexSetupAdapter };
