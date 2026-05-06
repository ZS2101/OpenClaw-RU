import { DEFAULT_ACCOUNT_ID } from "openclaw/plugin-sdk/account-id";
import type { OpenClawConfig } from "openclaw/plugin-sdk/config-types";
import { resolveVKTeamsAccount } from "./accounts.js";

export interface VKTeamsGroupGatingResult {
  shouldProcess: boolean;
  reason?: string;
}

/**
 * Apply VK Teams group message gating.
 * VK Teams chat types: "private" (DM), "group", "channel".
 * In the monitor, group/channel messages are treated as "group".
 */
export function applyVKTeamsGroupGating(params: {
  cfg: OpenClawConfig;
  accountId: string;
  chatId: string;
  text: string;
  botName?: string;
}): VKTeamsGroupGatingResult {
  const account = resolveVKTeamsAccount({
    cfg: params.cfg,
    accountId: params.accountId ?? DEFAULT_ACCOUNT_ID,
  });

  const policy = account.groupPolicy ?? "open";
  if (policy === "disabled") {
    return { shouldProcess: false, reason: "groupPolicy=disabled" };
  }

  // Check group-specific config
  const groupConfig = account.groups?.[params.chatId];
  const requireMention = groupConfig?.requireMention ?? false;

  if (policy === "allowlist") {
    if (!account.groupAllowFrom?.length && !account.groups?.[params.chatId]) {
      return { shouldProcess: false, reason: "group not in allowlist" };
    }
  }

  // Mention detection: @botname or @firstname lastname
  if (requireMention && params.botName) {
    const mentioned = params.text.toLowerCase().includes(`@${params.botName.toLowerCase()}`);
    if (!mentioned) {
      return { shouldProcess: false, reason: "requireMention" };
    }
  }

  return { shouldProcess: true };
}
