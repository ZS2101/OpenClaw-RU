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
import { listOKAccountIds, resolveOKAccount } from "./accounts.js";
import { resolveOKToken } from "./token.js";
import {
  OK_ALLOWFROM_HELP_LINES,
  OK_TOKEN_HELP_LINES,
  parseOKAllowFromId,
  okSetupAdapter,
  isOKConfigured,
} from "./setup-core.js";

const CHANNEL = "odnoklassniki" as const;

export const okSetupWizard: ChannelSetupWizard = {
  channel: CHANNEL,
  status: createStandardChannelSetupStatus({
    channelLabel: "Odnoklassniki",
    configuredLabel: "настроено",
    unconfiguredLabel: "нужен токен",
    configuredHint: "настроено",
    unconfiguredHint: "рекомендуется · нужен токен + URL вебхука",
    configuredScore: 1,
    unconfiguredScore: 1,
    resolveConfigured: ({ cfg, accountId }) =>
      (accountId ? [accountId] : listOKAccountIds(cfg)).some((id) =>
        isOKConfigured(cfg, id),
      ),
  }),
  credentials: [
    {
      inputKey: "token",
      providerHint: CHANNEL,
      credentialLabel: "токен бота Одноклассников",
      preferredEnvVar: "OK_BOT_TOKEN",
      helpTitle: "Токен бота Одноклассников",
      helpLines: OK_TOKEN_HELP_LINES,
      envPrompt: "Обнаружен OK_BOT_TOKEN. Использовать env var?",
      keepPrompt: "OK token already configured. Keep it?",
      inputPrompt: "Введите токен бота Одноклассников",
      allowEnv: ({ accountId }) => accountId === DEFAULT_ACCOUNT_ID,
      inspect: ({ cfg, accountId }) => {
        const account = resolveOKAccount({ cfg, accountId });
        const hasConfigured = hasConfiguredSecretInput(account.token);
        return {
          accountConfigured: Boolean(resolveOKToken(account)) || hasConfigured,
          hasConfiguredValue: hasConfigured,
          resolvedValue: normalizeOptionalString(resolveOKToken(account) ?? undefined),
          envValue:
            accountId === DEFAULT_ACCOUNT_ID
              ? normalizeOptionalString(process.env.OK_BOT_TOKEN)
              : undefined,
        };
      },
    },
  ],
  allowFrom: createAllowFromSection({
    helpTitle: "OK user ID",
    helpLines: OK_ALLOWFROM_HELP_LINES,
    message: "OK allowFrom (numeric user IDs)",
    placeholder: "123456789",
    invalidWithoutCredentialNote:
      "OK allowFrom requires numeric user IDs.",
    parseInputs: splitSetupEntries,
    parseId: parseOKAllowFromId,
    resolveEntries: async ({ entries }) =>
      entries.map((entry) => {
        const id = parseOKAllowFromId(entry);
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
  finalize: async () => {},
  disable: (cfg) => setSetupChannelEnabled(cfg, CHANNEL, false),
};

export { parseOKAllowFromId, okSetupAdapter };
