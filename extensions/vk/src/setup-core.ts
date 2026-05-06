import type { OpenClawConfig } from "openclaw/plugin-sdk/config-types";
import { DEFAULT_ACCOUNT_ID, patchChannelConfigForAccount } from "openclaw/plugin-sdk/setup";
import { resolveVkAccount } from "./accounts.js";
import { resolveVkToken } from "./token.js";

const CHANNEL = "vk" as const;

export const VK_TOKEN_HELP_LINES = [
  "Получите токен сообщества VK:",
  "1. Go to vk.com → Manage your community",
  "2. Settings → API usage → Create token",
  "3. Select 'Messages' scope (at minimum)",
  "4. Copy the token (starts with vk1.a.)",
  "",
  "Бот будет использовать Long Poll для получения сообщений.",
];

export const VK_ALLOWFROM_HELP_LINES = [
  "VK user IDs (numeric) allowed to DM the bot.",
  "Пример: 123456789",
  "Find your ID at vk.com/id0 → the number in the URL.",
];

export const VK_SETUP_GROUP_POLICY_HELP = [
  "Управляет тем, как бот обрабатывает сообщения в групповых чатах:",
  "- open: отвечает на все сообщения",
  "- allowlist: отвечает только в настроенных группах",
  "- disabled: игнорирует все сообщения в группах",
];

// ─── Setup adapter (framework integration) ─────────────────

export const vkSetupAdapter = {
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

// ─── Helper: check if configured ───────────────────────────

export function isVkConfigured(cfg: OpenClawConfig, accountId: string): boolean {
  const account = resolveVkAccount({ cfg, accountId });
  return Boolean(resolveVkToken(account));
}

/** Parse VK allowFrom ID (must be numeric) */
export function parseVkAllowFromId(input: string): string | null {
  const cleaned = input.trim();
  return /^\d+$/.test(cleaned) ? cleaned : null;
}
