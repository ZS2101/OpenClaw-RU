import type { OpenClawConfig } from "openclaw/plugin-sdk/config-types";
import { DEFAULT_ACCOUNT_ID, patchChannelConfigForAccount } from "openclaw/plugin-sdk/setup";
import { resolveOKAccount } from "./accounts.js";
import { resolveOKToken } from "./token.js";

const CHANNEL = "odnoklassniki" as const;

export const OK_TOKEN_HELP_LINES = [
  "Получите токен бота Одноклассников:",
  "1. Go to apiok.ru → Create a bot",
  "2. Select your OK group",
  "3. Copy the access token",
  "",
  "Бот использует webhooks для получения сообщений.",
  "Задайте OK_WEBHOOK_URL для эндпоинта webhook",
  "(e.g., https://your-server:18900/webhooks/odnoklassniki)",
];

export const OK_ALLOWFROM_HELP_LINES = [
  "OK user IDs (numeric) allowed to DM the bot.",
  "Пример: 123456789",
];

export const okSetupAdapter = {
  resolveAccountId: ({ accountId }: { accountId?: string }) => accountId ?? DEFAULT_ACCOUNT_ID,
  applyAccountConfig: ({
    cfg,
    accountId,
    input,
  }: {
    cfg: OpenClawConfig;
    accountId: string;
    input: Record<string, unknown>;
  }) => {
    return patchChannelConfigForAccount({
      cfg,
      channel: CHANNEL,
      accountId,
      patch: input,
    });
  },
  applyAccountName: ({
    cfg,
    accountId,
    name,
  }: {
    cfg: OpenClawConfig;
    accountId: string;
    name?: string;
  }) => {
    if (!name) {
      return cfg;
    }
    return patchChannelConfigForAccount({
      cfg,
      channel: CHANNEL,
      accountId,
      patch: { name },
    });
  },
};

export function isOKConfigured(cfg: OpenClawConfig, accountId: string): boolean {
  const account = resolveOKAccount({ cfg, accountId });
  return Boolean(resolveOKToken(account));
}

export function parseOKAllowFromId(input: string): string | null {
  const cleaned = input.trim();
  return /^\d+$/.test(cleaned) ? cleaned : null;
}
