import type { OpenClawConfig } from "openclaw/plugin-sdk/config-types";
import { DEFAULT_ACCOUNT_ID } from "openclaw/plugin-sdk/account-id";
import { resolveVkAccount } from "./accounts.js";
import { resolveVkToken } from "./token.js";

export interface VkGroupGatingResult {
  shouldProcess: boolean;
  reason?: string;
}

/**
 * Determine if a group message should be processed based on group policy.
 * VK group chats: peer_id > 2000000000
 * VK mentions: [club123456|@botname] or @botname in text
 */
export function applyVkGroupGating(params: {
  cfg: OpenClawConfig;
  accountId: string;
  peerId: number;
  text: string;
  botName?: string;
}): VkGroupGatingResult {
  const account = resolveVkAccount({
    cfg: params.cfg,
    accountId: params.accountId ?? DEFAULT_ACCOUNT_ID,
  });

  const isGroup = params.peerId > 2_000_000_000;
  if (!isGroup) return { shouldProcess: true };

  const policy = account.groupPolicy ?? "open";
  if (policy === "disabled") {
    return { shouldProcess: false, reason: "groupPolicy=disabled" };
  }

  // Check group-specific config
  const groupId = String(params.peerId);
  const groupConfig = account.groups?.[groupId];
  const requireMention = groupConfig?.requireMention ?? false;

  if (policy === "allowlist") {
    if (!account.groupAllowFrom?.length && !account.groups?.[groupId]) {
      return { shouldProcess: false, reason: "group not in allowlist" };
    }
  }

  // Mention detection for VK: [club...|@botname] or @botname
  if (requireMention && params.botName) {
    const mentioned = new RegExp(
      `\\[club\\d+\\|@?${params.botName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\]|@${params.botName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`,
      "i",
    ).test(params.text);
    if (!mentioned) {
      return { shouldProcess: false, reason: "requireMention" };
    }
  }

  return { shouldProcess: true };
}

/** Check if a VK peer_id represents a group chat */
export function isVkGroupPeer(peerId: number): boolean {
  return peerId > 2_000_000_000;
}
