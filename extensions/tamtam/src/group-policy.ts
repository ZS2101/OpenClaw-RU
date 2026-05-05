import type { OpenClawConfig } from "openclaw/plugin-sdk/config-types";
import { DEFAULT_ACCOUNT_ID } from "openclaw/plugin-sdk/account-id";
import { resolveTamtamAccount } from "./accounts.js";

export interface TamtamGroupGatingResult {
  shouldProcess: boolean;
  reason?: string;
}

/** TamTam uses negative outbound targets for group routing. DMs use positive user_id. */
export function isTamtamGroup(peerId: number): boolean {
  return peerId < 0;
}

export function applyTamtamGroupGating(params: {
  cfg: OpenClawConfig;
  accountId: string;
  peerId: number;
  text: string;
  botName?: string;
}): TamtamGroupGatingResult {
  const account = resolveTamtamAccount({ cfg: params.cfg, accountId: params.accountId ?? DEFAULT_ACCOUNT_ID });

  const policy = account.groupPolicy ?? "open";
  if (policy === "disabled") return { shouldProcess: false, reason: "groupPolicy=disabled" };

  const groupId = String(Math.abs(params.peerId));
  const groupConfig = account.groups?.[groupId];
  const requireMention = groupConfig?.requireMention ?? false;

  if (policy === "allowlist") {
    if (!account.groupAllowFrom?.length && !account.groups?.[groupId]) {
      return { shouldProcess: false, reason: "group not in allowlist" };
    }
  }

  if (requireMention && params.botName) {
    const mentioned = params.text.toLowerCase().includes(`@${params.botName.toLowerCase()}`);
    if (!mentioned) return { shouldProcess: false, reason: "requireMention" };
  }

  return { shouldProcess: true };
}
