import type { OpenClawConfig } from "openclaw/plugin-sdk/config-types";
import { DEFAULT_ACCOUNT_ID, patchChannelConfigForAccount } from "openclaw/plugin-sdk/setup";
import { resolveMAXAccount } from "./accounts.js";
import { resolveMAXToken } from "./token.js";

const CHANNEL = "max" as const;

export const MAX_TOKEN_HELP_LINES = [
  "Получите токен бота MAX:",
  "1. Go to max.ru → Developer settings",
  "2. Create a bot and copy the token",
  "3. Docs: https://dev.max.ru/docs-api",
  "",
  "Бот использует webhooks для получения сообщений.",
  "Задайте MAX_WEBHOOK_URL для эндпоинта webhook",
  "(e.g., https://your-server:18900/webhooks/max)",
];

export const MAX_ALLOWFROM_HELP_LINES = [
  "MAX user IDs allowed to DM the bot.",
  "Пример: 123456789",
];

export const maxSetupAdapter = {
  resolveAccountId: ({ accountId }: { accountId?: string }) => accountId ?? DEFAULT_ACCOUNT_ID,
  applyAccountConfig: ({
    cfg,
    accountId,
    input,
  }: {
    cfg: OpenClawConfig;
    accountId: string;
    input: Record<string, unknown>;
  }) => patchChannelConfigForAccount({ cfg, channel: CHANNEL, accountId, patch: input }),
  applyAccountName: ({
    cfg,
    accountId,
    name,
  }: {
    cfg: OpenClawConfig;
    accountId: string;
    name?: string;
  }) =>
    name
      ? patchChannelConfigForAccount({ cfg, channel: CHANNEL, accountId, patch: { name } })
      : cfg,
};

export function isMAXConfigured(cfg: OpenClawConfig, accountId: string): boolean {
  return Boolean(resolveMAXToken(resolveMAXAccount({ cfg, accountId })));
}

export function parseMAXAllowFromId(input: string): string | null {
  return input.trim().length >= 3 ? input.trim() : null;
}
