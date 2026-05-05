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
import { inspectTelegramAccount } from "./account-inspect.js";
import { listTelegramAccountIds, resolveTelegramAccount } from "./accounts.js";
import {
  parseTelegramAllowFromId,
  resolveTelegramAllowFromEntries,
  TELEGRAM_TOKEN_HELP_LINES,
  TELEGRAM_USER_ID_HELP_LINES,
  telegramSetupAdapter,
} from "./setup-core.js";
import {
  buildTelegramDmAccessWarningLines,
  ensureTelegramDefaultGroupMentionGate,
  shouldShowTelegramDmAccessWarning,
  telegramSetupDmPolicy,
} from "./setup-surface.helpers.js";

const channel = "telegram" as const;

export const telegramSetupWizard: ChannelSetupWizard = {
  channel,
  status: createStandardChannelSetupStatus({
    channelLabel: "Telegram",
    configuredLabel: "настроено",
    unconfiguredLabel: "нужен токен",
    configuredHint: "рекомендуется · настроено",
    unconfiguredHint: "рекомендуется · дружелюбно для новичков",
    configuredScore: 1,
    unconfiguredScore: 10,
    resolveConfigured: ({ cfg, accountId }) =>
      (accountId ? [accountId] : listTelegramAccountIds(cfg)).some((resolvedAccountId) => {
        const account = inspectTelegramAccount({ cfg, accountId: resolvedAccountId });
        return account.configured;
      }),
  }),
  prepare: async ({ cfg, accountId, credentialValues }) => ({
    cfg: ensureTelegramDefaultGroupMentionGate(cfg, accountId),
    credentialValues,
  }),
  credentials: [
    {
      inputKey: "token",
      providerHint: channel,
      credentialLabel: "токен бота Telegram",
      preferredEnvVar: "TELEGRAM_BOT_TOKEN",
      helpTitle: "Токен бота Telegram",
      helpLines: TELEGRAM_TOKEN_HELP_LINES,
      envPrompt: "Обнаружен TELEGRAM_BOT_TOKEN. Использовать env var?",
      keepPrompt: "Telegram token already configured. Keep it?",
      inputPrompt: "Введите токен бота Telegram",
      allowEnv: ({ accountId }) => accountId === DEFAULT_ACCOUNT_ID,
      inspect: ({ cfg, accountId }) => {
        const resolved = resolveTelegramAccount({ cfg, accountId });
        const hasConfiguredBotToken = hasConfiguredSecretInput(resolved.config.botToken);
        const hasConfiguredValue =
          hasConfiguredBotToken || Boolean(resolved.config.tokenFile?.trim());
        return {
          accountConfigured: Boolean(resolved.token) || hasConfiguredValue,
          hasConfiguredValue,
          resolvedValue: normalizeOptionalString(resolved.token),
          envValue:
            accountId === DEFAULT_ACCOUNT_ID
              ? normalizeOptionalString(process.env.TELEGRAM_BOT_TOKEN)
              : undefined,
        };
      },
    },
  ],
  allowFrom: createAllowFromSection({
    helpTitle: "Telegram user id",
    helpLines: TELEGRAM_USER_ID_HELP_LINES,
    credentialInputKey: "token",
    message: "Telegram allowFrom (numeric sender id; @username resolves to id)",
    placeholder: "@username",
    invalidWithoutCredentialNote:
      "Telegram token missing; use numeric sender ids (usernames require a bot token).",
    parseInputs: splitSetupEntries,
    parseId: parseTelegramAllowFromId,
    resolveEntries: async ({ cfg, accountId, credentialValues, entries }) =>
      resolveTelegramAllowFromEntries({
        credentialValue: credentialValues.token,
        entries,
        apiRoot: resolveTelegramAccount({ cfg, accountId }).config.apiRoot,
      }),
    apply: async ({ cfg, accountId, allowFrom }) =>
      patchChannelConfigForAccount({
        cfg,
        channel,
        accountId,
        patch: { dmPolicy: "allowlist", allowFrom },
      }),
  }),
  finalize: async ({ cfg, accountId, prompter }) => {
    if (!shouldShowTelegramDmAccessWarning(cfg, accountId)) {
      return;
    }
    await prompter.note(
      buildTelegramDmAccessWarningLines(accountId).join("\n"),
      "Telegram DM access warning",
    );
  },
  dmPolicy: telegramSetupDmPolicy,
  disable: (cfg) => setSetupChannelEnabled(cfg, channel, false),
};

export { parseTelegramAllowFromId, telegramSetupAdapter };
