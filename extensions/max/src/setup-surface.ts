import { createAllowFromSection, createStandardChannelSetupStatus, DEFAULT_ACCOUNT_ID, hasConfiguredSecretInput, patchChannelConfigForAccount, setSetupChannelEnabled, splitSetupEntries } from "openclaw/plugin-sdk/setup";
import type { ChannelSetupWizard } from "openclaw/plugin-sdk/setup";
import { normalizeOptionalString } from "openclaw/plugin-sdk/text-runtime";
import { resolveMAXAccount } from "./accounts.js";
import { resolveMAXToken } from "./token.js";
import { MAX_ALLOWFROM_HELP_LINES, MAX_TOKEN_HELP_LINES, parseMAXAllowFromId, maxSetupAdapter, isMAXConfigured } from "./setup-core.js";

const CHANNEL = "max" as const;

export const maxSetupWizard: ChannelSetupWizard = {
  channel: CHANNEL,
  status: createStandardChannelSetupStatus({
    channelLabel: "MAX",
    configuredLabel: "настроено",
    unconfiguredLabel: "нужен токен",
    configuredHint: "настроено",
    unconfiguredHint: "рекомендуется · нужен токен + URL вебхука",
    configuredScore: 1, unconfiguredScore: 1,
    resolveConfigured: ({ cfg }) => isMAXConfigured(cfg, DEFAULT_ACCOUNT_ID),
  }),
  credentials: [{
    inputKey: "token", providerHint: CHANNEL,
    credentialLabel: "токен бота MAX",
    preferredEnvVar: "MAX_BOT_TOKEN",
    helpTitle: "Токен бота MAX", helpLines: MAX_TOKEN_HELP_LINES,
    envPrompt: "Обнаружен MAX_BOT_TOKEN. Использовать env var?",
    keepPrompt: "MAX token already configured. Keep it?",
    inputPrompt: "Введите токен бота MAX",
    allowEnv: ({ accountId }) => accountId === DEFAULT_ACCOUNT_ID,
    inspect: ({ cfg, accountId }) => {
      const account = resolveMAXAccount({ cfg, accountId });
      return {
        accountConfigured: Boolean(resolveMAXToken(account)) || hasConfiguredSecretInput(account.token),
        hasConfiguredValue: hasConfiguredSecretInput(account.token),
        resolvedValue: normalizeOptionalString(resolveMAXToken(account) ?? undefined),
        envValue: accountId === DEFAULT_ACCOUNT_ID ? normalizeOptionalString(process.env.MAX_BOT_TOKEN) : undefined,
      };
    },
  }],
  allowFrom: createAllowFromSection({
    helpTitle: "MAX user ID", helpLines: MAX_ALLOWFROM_HELP_LINES,
    message: "MAX allowFrom (user IDs)", placeholder: "123456789",
    invalidWithoutCredentialNote: "MAX allowFrom requires valid user IDs.",
    parseInputs: splitSetupEntries, parseId: parseMAXAllowFromId,
    resolveEntries: async ({ entries }) => entries.map((entry) => ({ input: entry, resolved: Boolean(parseMAXAllowFromId(entry)), id: parseMAXAllowFromId(entry) })),
    apply: async ({ cfg, accountId, allowFrom }) => patchChannelConfigForAccount({ cfg, channel: CHANNEL, accountId, patch: { dmPolicy: "allowlist", allowFrom } }),
  }),
  finalize: async () => {},
  disable: (cfg) => setSetupChannelEnabled(cfg, CHANNEL, false),
};

export { parseMAXAllowFromId, maxSetupAdapter };
