import {
  DEFAULT_ACCOUNT_ID,
  hasConfiguredSecretInput,
  patchChannelConfigForAccount,
  setSetupChannelEnabled,
} from "openclaw/plugin-sdk/setup";
import type { OpenClawConfig } from "openclaw/plugin-sdk/config-types";
import { normalizeOptionalString } from "openclaw/plugin-sdk/text-runtime";
import { resolveTamtamAccount } from "./accounts.js";
import { resolveTamtamToken } from "./token.js";

const CHANNEL = "tamtam" as const;

export const TAMTAM_TOKEN_HELP_LINES = [
  "Получите токен бота TamTam:",
  "1. Open TamTam and chat with @PrimeBot",
  "2. Type /create_bot and follow the instructions",
  "3. Copy the access token",
  "",
  "Бот использует Long Poll для получения сообщений.",
  "Docs: https://dev.tamtam.chat",
];

export const TAMTAM_ALLOWFROM_HELP_LINES = [
  "TamTam user IDs (numeric) allowed to DM the bot.",
  "Пример: 123456789",
];

export const tamtamSetupAdapter = {
  resolveAccountId: ({ accountId }: { accountId?: string }) => accountId ?? DEFAULT_ACCOUNT_ID,
  applyAccountConfig: ({ cfg, accountId, input }: { cfg: OpenClawConfig; accountId: string; input: Record<string, unknown> }) =>
    patchChannelConfigForAccount({ cfg, channel: CHANNEL, accountId, patch: input }),
  applyAccountName: ({ cfg, accountId, name }: { cfg: OpenClawConfig; accountId: string; name?: string }) =>
    name ? patchChannelConfigForAccount({ cfg, channel: CHANNEL, accountId, patch: { name } }) : cfg,
};

export function isTamTamConfigured(cfg: OpenClawConfig, accountId: string): boolean {
  return Boolean(resolveTamtamToken(resolveTamtamAccount({ cfg, accountId })));
}

export function parseTamTamAllowFromId(input: string): string | null {
  const cleaned = input.trim();
  return /^\d+$/.test(cleaned) ? cleaned : null;
}
