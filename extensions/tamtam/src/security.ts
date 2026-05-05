import type { OpenClawConfig } from "openclaw/plugin-sdk/config-types";
import { DEFAULT_ACCOUNT_ID } from "openclaw/plugin-sdk/account-id";
import { resolveTamtamAccount } from "./accounts.js";

export function checkTamTamDmAccess(params: {
  cfg: OpenClawConfig;
  accountId: string;
  senderId: string;
}): { allowed: boolean; reason?: string } {
  const account = resolveTamtamAccount({ cfg: params.cfg, accountId: params.accountId ?? DEFAULT_ACCOUNT_ID });
  const policy = account.dmPolicy ?? "open";
  if (policy === "disabled") return { allowed: false, reason: "dmPolicy=disabled" };
  if (policy === "open") return { allowed: true };
  if (policy === "allowlist") {
    const allowFrom = account.allowFrom ?? [];
    return { allowed: allowFrom.includes("*") || allowFrom.includes(params.senderId) };
  }
  return { allowed: true };
}
