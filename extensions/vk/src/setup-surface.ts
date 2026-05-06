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
import { listVkAccountIds, resolveVkAccount } from "./accounts.js";
import {
  VK_ALLOWFROM_HELP_LINES,
  VK_TOKEN_HELP_LINES,
  parseVkAllowFromId,
  vkSetupAdapter,
  isVkConfigured,
} from "./setup-core.js";
import { resolveVkToken } from "./token.js";

const CHANNEL = "vk" as const;

export const vkSetupWizard: ChannelSetupWizard = {
  channel: CHANNEL,
  status: createStandardChannelSetupStatus({
    channelLabel: "VK",
    configuredLabel: "настроено",
    unconfiguredLabel: "нужен токен",
    configuredHint: "настроено",
    unconfiguredHint: "рекомендуется · нужен токен",
    configuredScore: 1,
    unconfiguredScore: 1,
    resolveConfigured: ({ cfg, accountId }) =>
      (accountId ? [accountId] : listVkAccountIds(cfg)).some((id) => isVkConfigured(cfg, id)),
  }),
  credentials: [
    {
      inputKey: "token",
      providerHint: CHANNEL,
      credentialLabel: "токен сообщества VK",
      preferredEnvVar: "VK_BOT_TOKEN",
      helpTitle: "Токен бота VK",
      helpLines: VK_TOKEN_HELP_LINES,
      envPrompt: "Обнаружен VK_BOT_TOKEN. Использовать env var?",
      keepPrompt: "VK token already configured. Keep it?",
      inputPrompt: "Введите токен сообщества VK",
      allowEnv: ({ accountId }) => accountId === DEFAULT_ACCOUNT_ID,
      inspect: ({ cfg, accountId }) => {
        const account = resolveVkAccount({ cfg, accountId });
        const hasConfigured = hasConfiguredSecretInput(account.token);
        return {
          accountConfigured: Boolean(resolveVkToken(account)) || hasConfigured,
          hasConfiguredValue: hasConfigured,
          resolvedValue: normalizeOptionalString(resolveVkToken(account) ?? undefined),
          envValue:
            accountId === DEFAULT_ACCOUNT_ID
              ? normalizeOptionalString(process.env.VK_BOT_TOKEN)
              : undefined,
        };
      },
    },
  ],
  allowFrom: createAllowFromSection({
    helpTitle: "VK user ID",
    helpLines: VK_ALLOWFROM_HELP_LINES,
    message: "VK allowFrom (numeric user IDs)",
    placeholder: "123456789",
    invalidWithoutCredentialNote:
      "VK allowFrom requires numeric user IDs. Find your ID at vk.com/settings.",
    parseInputs: splitSetupEntries,
    parseId: parseVkAllowFromId,
    resolveEntries: async ({ entries }) =>
      entries.map((entry) => {
        const id = parseVkAllowFromId(entry);
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
  finalize: async ({ _cfg, _accountId, _prompter }) => {
    // No special warnings needed for VK
  },
  disable: (cfg) => setSetupChannelEnabled(cfg, CHANNEL, false),
};

export { parseVkAllowFromId, vkSetupAdapter };
