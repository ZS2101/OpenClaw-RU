import type { OpenClawConfig } from "openclaw/plugin-sdk/config-types";
import { DEFAULT_ACCOUNT_ID } from "openclaw/plugin-sdk/account-id";
import { resolveYandexAccount } from "./accounts.js";

export interface YandexGroupGatingResult {
  shouldProcess: boolean;
  reason?: string;
}

export function applyYandexGroupGating(params: {
  cfg: OpenClawConfig;
  accountId: string;
  chatId: string;
  text: string;
  botName?: string;
}): YandexGroupGatingResult {
  const account = resolveYandexAccount({
    cfg: params.cfg,
    accountId: params.accountId ?? DEFAULT_ACCOUNT_ID,
  });

  // Yandex group chat IDs have format "0/0/<guid>" or "1/0/<guid>"
  // DM targets are user logins (no slashes)
  const isGroup = params.chatId.includes("/");

  if (!isGroup) return { shouldProcess: true };

  const policy = account.groupPolicy ?? "open";
  if (policy === "disabled") {
    return { shouldProcess: false, reason: "groupPolicy=disabled" };
  }

  const groupConfig = account.groups?.[params.chatId];
  const requireMention = groupConfig?.requireMention ?? false;

  if (policy === "allowlist") {
    if (!account.groupAllowFrom?.length && !account.groups?.[params.chatId]) {
      return { shouldProcess: false, reason: "group not in allowlist" };
    }
  }

  if (requireMention && params.botName) {
    const mentioned = params.text.toLowerCase().includes(`@${params.botName.toLowerCase()}`);
    if (!mentioned) {
      return { shouldProcess: false, reason: "requireMention" };
    }
  }

  return { shouldProcess: true };
}
