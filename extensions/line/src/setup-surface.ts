import {
  createAllowFromSection,
  createStandardChannelSetupStatus,
  mergeAllowFromEntries,
} from "openclaw/plugin-sdk/setup";
import { normalizeOptionalString } from "openclaw/plugin-sdk/text-runtime";
import { resolveDefaultLineAccountId } from "./accounts.js";
import {
  isLineConfigured,
  listLineAccountIds,
  parseLineAllowFromId,
  patchLineAccountConfig,
} from "./setup-core.js";
import {
  DEFAULT_ACCOUNT_ID,
  formatDocsLink,
  resolveLineAccount,
  setSetupChannelEnabled,
  splitSetupEntries,
  type ChannelSetupDmPolicy,
  type ChannelSetupWizard,
} from "./setup-runtime-api.js";

const channel = "line" as const;

const LINE_SETUP_HELP_LINES = [
  "1) Откройте LINE Developers Console и создайте или выберите канал Messaging API",
  "2) Скопируйте channel access token и channel secret",
  "3) Включите Use webhook в настройках Messaging API",
  "4) Point the webhook at https://<gateway-host>/line/webhook",
  `Docs: ${formatDocsLink("/channels/line", "channels/line")}`,
];

const LINE_ALLOW_FROM_HELP_LINES = [
  "Добавьте в белый список ЛС LINE по user id.",
  "LINE ids чувствительны к регистру.",
  "Examples:",
  "- U1234567890abcdef1234567890abcdef",
  "- line:user:U1234567890abcdef1234567890abcdef",
  "Несколько значений: через запятую.",
  `Docs: ${formatDocsLink("/channels/line", "channels/line")}`,
];

const lineDmPolicy: ChannelSetupDmPolicy = {
  label: "LINE",
  channel,
  policyKey: "channels.line.dmPolicy",
  allowFromKey: "channels.line.allowFrom",
  resolveConfigKeys: (cfg, accountId) =>
    (accountId ?? resolveDefaultLineAccountId(cfg)) !== DEFAULT_ACCOUNT_ID
      ? {
          policyKey: `channels.line.accounts.${accountId ?? resolveDefaultLineAccountId(cfg)}.dmPolicy`,
          allowFromKey: `channels.line.accounts.${accountId ?? resolveDefaultLineAccountId(cfg)}.allowFrom`,
        }
      : {
          policyKey: "channels.line.dmPolicy",
          allowFromKey: "channels.line.allowFrom",
        },
  getCurrent: (cfg, accountId) =>
    resolveLineAccount({ cfg, accountId: accountId ?? resolveDefaultLineAccountId(cfg) }).config
      .dmPolicy ?? "pairing",
  setPolicy: (cfg, policy, accountId) =>
    patchLineAccountConfig({
      cfg,
      accountId: accountId ?? resolveDefaultLineAccountId(cfg),
      enabled: true,
      patch:
        policy === "open"
          ? {
              dmPolicy: "open",
              allowFrom: mergeAllowFromEntries(
                resolveLineAccount({
                  cfg,
                  accountId: accountId ?? resolveDefaultLineAccountId(cfg),
                }).config.allowFrom,
                ["*"],
              ),
            }
          : { dmPolicy: policy },
      clearFields: policy === "pairing" || policy === "disabled" ? ["allowFrom"] : undefined,
    }),
};

export { lineSetupAdapter } from "./setup-core.js";

export const lineSetupWizard: ChannelSetupWizard = {
  channel,
  status: createStandardChannelSetupStatus({
    channelLabel: "LINE",
    configuredLabel: "настроено",
    unconfiguredLabel: "нужен токен + секрет",
    configuredHint: "настроено",
    unconfiguredHint: "нужен токен + секрет",
    configuredScore: 1,
    unconfiguredScore: 0,
    includeStatusLine: true,
    resolveConfigured: ({ cfg, accountId }) =>
      isLineConfigured(cfg, accountId ?? resolveDefaultLineAccountId(cfg)),
    resolveExtraStatusLines: ({ cfg }) => [`Accounts: ${listLineAccountIds(cfg).length || 0}`],
  }),
  introNote: {
    title: "LINE Messaging API",
    lines: LINE_SETUP_HELP_LINES,
    shouldShow: ({ cfg, accountId }) =>
      !isLineConfigured(cfg, accountId ?? resolveDefaultLineAccountId(cfg)),
  },
  credentials: [
    {
      inputKey: "token",
      providerHint: channel,
      credentialLabel: "токен доступа канала (channel access token)",
      preferredEnvVar: "LINE_CHANNEL_ACCESS_TOKEN",
      helpTitle: "LINE Messaging API",
      helpLines: LINE_SETUP_HELP_LINES,
      envPrompt: "Обнаружен LINE_CHANNEL_ACCESS_TOKEN. Использовать env var?",
      keepPrompt: "LINE channel access token already configured. Keep it?",
      inputPrompt: "Введите channel access token LINE",
      allowEnv: ({ accountId }) => accountId === DEFAULT_ACCOUNT_ID,
      inspect: ({ cfg, accountId }) => {
        const resolved = resolveLineAccount({ cfg, accountId });
        return {
          accountConfigured: Boolean(
            normalizeOptionalString(resolved.channelAccessToken) &&
            normalizeOptionalString(resolved.channelSecret),
          ),
          hasConfiguredValue: Boolean(
            normalizeOptionalString(resolved.config.channelAccessToken) ??
            normalizeOptionalString(resolved.config.tokenFile),
          ),
          resolvedValue: normalizeOptionalString(resolved.channelAccessToken),
          envValue:
            accountId === DEFAULT_ACCOUNT_ID
              ? normalizeOptionalString(process.env.LINE_CHANNEL_ACCESS_TOKEN)
              : undefined,
        };
      },
      applyUseEnv: ({ cfg, accountId }) =>
        patchLineAccountConfig({
          cfg,
          accountId,
          enabled: true,
          clearFields: ["channelAccessToken", "tokenFile"],
          patch: {},
        }),
      applySet: ({ cfg, accountId, resolvedValue }) =>
        patchLineAccountConfig({
          cfg,
          accountId,
          enabled: true,
          clearFields: ["tokenFile"],
          patch: { channelAccessToken: resolvedValue },
        }),
    },
    {
      inputKey: "password",
      providerHint: "line-secret",
      credentialLabel: "секрет канала (channel secret)",
      preferredEnvVar: "LINE_CHANNEL_SECRET",
      helpTitle: "LINE Messaging API",
      helpLines: LINE_SETUP_HELP_LINES,
      envPrompt: "Обнаружен LINE_CHANNEL_SECRET. Использовать env var?",
      keepPrompt: "LINE channel secret already configured. Keep it?",
      inputPrompt: "Введите channel secret LINE",
      allowEnv: ({ accountId }) => accountId === DEFAULT_ACCOUNT_ID,
      inspect: ({ cfg, accountId }) => {
        const resolved = resolveLineAccount({ cfg, accountId });
        return {
          accountConfigured: Boolean(
            normalizeOptionalString(resolved.channelAccessToken) &&
            normalizeOptionalString(resolved.channelSecret),
          ),
          hasConfiguredValue: Boolean(
            normalizeOptionalString(resolved.config.channelSecret) ??
            normalizeOptionalString(resolved.config.secretFile),
          ),
          resolvedValue: normalizeOptionalString(resolved.channelSecret),
          envValue:
            accountId === DEFAULT_ACCOUNT_ID
              ? normalizeOptionalString(process.env.LINE_CHANNEL_SECRET)
              : undefined,
        };
      },
      applyUseEnv: ({ cfg, accountId }) =>
        patchLineAccountConfig({
          cfg,
          accountId,
          enabled: true,
          clearFields: ["channelSecret", "secretFile"],
          patch: {},
        }),
      applySet: ({ cfg, accountId, resolvedValue }) =>
        patchLineAccountConfig({
          cfg,
          accountId,
          enabled: true,
          clearFields: ["secretFile"],
          patch: { channelSecret: resolvedValue },
        }),
    },
  ],
  allowFrom: createAllowFromSection({
    helpTitle: "LINE allowlist",
    helpLines: LINE_ALLOW_FROM_HELP_LINES,
    message: "LINE allowFrom (user id)",
    placeholder: "U1234567890abcdef1234567890abcdef",
    invalidWithoutCredentialNote:
      "LINE allowFrom requires raw user ids like U1234567890abcdef1234567890abcdef.",
    parseInputs: splitSetupEntries,
    parseId: parseLineAllowFromId,
    apply: ({ cfg, accountId, allowFrom }) =>
      patchLineAccountConfig({
        cfg,
        accountId,
        enabled: true,
        patch: { dmPolicy: "allowlist", allowFrom },
      }),
  }),
  dmPolicy: lineDmPolicy,
  completionNote: {
    title: "LINE webhook",
    lines: [
      "Включите Use webhook в консоли LINE после сохранения учетных данных.",
      "Default webhook URL: https://<gateway-host>/line/webhook",
      "Если вы задали channels.line.webhookPath, обновите URL для соответствия.",
      `Docs: ${formatDocsLink("/channels/line", "channels/line")}`,
    ],
  },
  disable: (cfg) => setSetupChannelEnabled(cfg, channel, false),
};
