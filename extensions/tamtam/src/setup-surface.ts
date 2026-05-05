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
import { resolveTamtamAccount } from "./accounts.js";
import { resolveTamtamToken } from "./token.js";
import {
  TAMTAM_ALLOWFROM_HELP_LINES,
  TAMTAM_TOKEN_HELP_LINES,
  parseTamTamAllowFromId,
  tamtamSetupAdapter,
  isTamTamConfigured,
} from "./setup-core.js";

const CHANNEL = "tamtam" as const;

export const tamtamSetupWizard: ChannelSetupWizard = {
  channel: CHANNEL,
  status: createStandardChannelSetupStatus({
    channelLabel: "TamTam",
    configuredLabel: "настроено",
    unconfiguredLabel: "нужен токен",
    configuredHint: "настроено",
    unconfiguredHint: "рекомендуется · нужен токен",
    configuredScore: 1,
    unconfiguredScore: 1,
    resolveConfigured: ({ cfg, accountId }) =>
      (accountId ? [accountId] : [DEFAULT_ACCOUNT_ID]).some((id) => isTamTamConfigured(cfg, id)),
  }),
  credentials: [{
    inputKey: "token",
    providerHint: CHANNEL,
    credentialLabel: "токен бота TamTam",
    preferredEnvVar: "TAMTAM_BOT_TOKEN",
    helpTitle: "Токен бота TamTam",
    helpLines: TAMTAM_TOKEN_HELP_LINES,
    envPrompt: "Обнаружен TAMTAM_BOT_TOKEN. Использовать env var?",
    keepPrompt: "TamTam token already configured. Keep it?",
    inputPrompt: "Введите токен бота TamTam",
    allowEnv: ({ accountId }) => accountId === DEFAULT_ACCOUNT_ID,
    inspect: ({ cfg, accountId }) => {
      const account = resolveTamtamAccount({ cfg, accountId });
      const hasConfigured = hasConfiguredSecretInput(account.token);
      return {
        accountConfigured: Boolean(resolveTamtamToken(account)) || hasConfigured,
        hasConfiguredValue: hasConfigured,
        resolvedValue: normalizeOptionalString(resolveTamtamToken(account) ?? undefined),
        envValue: accountId === DEFAULT_ACCOUNT_ID ? normalizeOptionalString(process.env.TAMTAM_BOT_TOKEN) : undefined,
      };
    },
  }],
  allowFrom: createAllowFromSection({
    helpTitle: "TamTam user ID",
    helpLines: TAMTAM_ALLOWFROM_HELP_LINES,
    message: "TamTam allowFrom (numeric user IDs)",
    placeholder: "123456789",
    invalidWithoutCredentialNote: "TamTam allowFrom requires numeric user IDs.",
    parseInputs: splitSetupEntries,
    parseId: parseTamTamAllowFromId,
    resolveEntries: async ({ entries }) =>
      entries.map((entry) => ({ input: entry, resolved: Boolean(parseTamTamAllowFromId(entry)), id: parseTamTamAllowFromId(entry) })),
    apply: async ({ cfg, accountId, allowFrom }) =>
      patchChannelConfigForAccount({ cfg, channel: CHANNEL, accountId, patch: { dmPolicy: "allowlist", allowFrom } }),
  }),
  finalize: async () => {},
  disable: (cfg) => setSetupChannelEnabled(cfg, CHANNEL, false),
};

export { parseTamTamAllowFromId, tamtamSetupAdapter };
