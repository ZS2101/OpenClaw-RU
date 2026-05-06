import type { OpenClawConfig } from "openclaw/plugin-sdk/config-types";
import { DEFAULT_ACCOUNT_ID, patchChannelConfigForAccount } from "openclaw/plugin-sdk/setup";
import { resolveVKTeamsAccount } from "./accounts.js";
import { resolveVTToken } from "./token.js";

const CH = "vkteams" as const;

export const VT_HELP = [
  "Получите токен бота VK Teams:",
  "1. VK Teams admin panel → Bots → Create bot",
  "2. Copy the token (format: 001.XXXX.XXXX:XXXX)",
  "3. Docs: https://teams.vk.com/botapi",
  "",
  "Default API URL: https://myteam.mail.ru/bot/v1",
  "Для on-premise задайте apiUrl в конфиге или VKTEAMS_API_URL как env var.",
  "",
  "API использует GET-запросы с токеном в параметрах.",
];

// ─── Setup adapter (framework integration) ─────────────────

export const vtSetupAdapter = {
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
      channel: CH,
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
      channel: CH,
      accountId,
      patch: { name },
    });
  },
};

// ─── Helper: check if configured ───────────────────────────

export function isVTConfigured(cfg: OpenClawConfig, accountId: string): boolean {
  return Boolean(resolveVTToken(resolveVKTeamsAccount({ cfg, accountId })));
}
