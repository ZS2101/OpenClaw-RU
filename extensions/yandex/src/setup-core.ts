import type { OpenClawConfig } from "openclaw/plugin-sdk/config-types";
import { DEFAULT_ACCOUNT_ID, patchChannelConfigForAccount } from "openclaw/plugin-sdk/setup";
import { resolveYandexAccount } from "./accounts.js";
import { resolveYandexToken } from "./token.js";

const CHANNEL = "yandex" as const;

export const YANDEX_TOKEN_HELP_LINES = [
  "Получите токен бота Яндекс Мессенджера:",
  "1. Go to Yandex Messenger developer console",
  "2. Create a bot or select existing one",
  "3. Copy the OAuth token",
  "",
  "Бот использует webhooks для получения сообщений.",
  "Задайте YANDEX_WEBHOOK_URL для эндпоинта webhook",
  "(e.g., https://your-server:18900/webhooks/yandex)",
];

export const YANDEX_ALLOWFROM_HELP_LINES = [
  "Yandex logins (email-like) allowed to DM the bot.",
  "Пример: user@yandex.ru",
];

// ─── Setup adapter ────────────────────────────────────────

export const yandexSetupAdapter = {
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

export function isYandexConfigured(cfg: OpenClawConfig, accountId: string): boolean {
  const account = resolveYandexAccount({ cfg, accountId });
  return Boolean(resolveYandexToken(account));
}

export function parseYandexAllowFromId(input: string): string | null {
  const cleaned = input.trim();
  return cleaned.length >= 3 ? cleaned : null;
}
