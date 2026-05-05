import type { OpenClawConfig } from "openclaw/plugin-sdk/config-types";
import { DEFAULT_ACCOUNT_ID } from "openclaw/plugin-sdk/account-id";
import { resolveOKAccount } from "./accounts.js";

export interface OKGroupGatingResult {
  shouldProcess: boolean;
  reason?: string;
}

export function applyOKGroupGating(params: {
  cfg: OpenClawConfig;
  accountId: string;
  chatId: string;
  text: string;
  botName?: string;
}): OKGroupGatingResult {
  const account = resolveOKAccount({
    cfg: params.cfg,
    accountId: params.accountId ?? DEFAULT_ACCOUNT_ID,
  });

  // OK.ru group chats are identified by type=GROUP_CHAT or type=CHAT in /chats response.
  // The webhook payload doesn't include chat_type, so gating relies on callers to
  // pre-filter via the /chats endpoint. If caller doesn't know, treat as DM (skip gating).
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
