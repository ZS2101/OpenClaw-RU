import type { OpenClawConfig } from "openclaw/plugin-sdk/config-types";
import { DEFAULT_ACCOUNT_ID } from "openclaw/plugin-sdk/account-id";
import { resolveMAXAccount } from "./accounts.js";

export function applyMAXGroupGating(params: { cfg: OpenClawConfig; accountId: string; chatId: string; text: string; botName?: string }): { shouldProcess: boolean; reason?: string } {
  const account = resolveMAXAccount({ cfg: params.cfg, accountId: params.accountId ?? DEFAULT_ACCOUNT_ID });
  const isGroup = params.chatId !== params.accountId;
  if (!isGroup) return { shouldProcess: true };
  const policy = account.groupPolicy ?? "open";
  if (policy === "disabled") return { shouldProcess: false, reason: "groupPolicy=disabled" };
  const groupConfig = account.groups?.[params.chatId];
  if (policy === "allowlist" && !account.groupAllowFrom?.length && !account.groups?.[params.chatId]) return { shouldProcess: false, reason: "group not in allowlist" };
  if (groupConfig?.requireMention && params.botName && !params.text.toLowerCase().includes(`@${params.botName.toLowerCase()}`)) return { shouldProcess: false, reason: "requireMention" };
  return { shouldProcess: true };
}
