import type { OpenClawConfig } from "openclaw/plugin-sdk/config-types";
import { DEFAULT_ACCOUNT_ID } from "openclaw/plugin-sdk/account-id";
import { resolveOKAccount } from "./accounts.js";

export interface OKAccessResult {
  allowed: boolean;
  reason?: string;
}

export function checkOKDmAccess(params: {
  cfg: OpenClawConfig;
  accountId: string;
  senderId: string;
}): OKAccessResult {
  const account = resolveOKAccount({
    cfg: params.cfg,
    accountId: params.accountId ?? DEFAULT_ACCOUNT_ID,
  });

  const policy = account.dmPolicy ?? "open";

  if (policy === "disabled") return { allowed: false, reason: "dmPolicy=disabled" };
  if (policy === "open") return { allowed: true };
  if (policy === "allowlist") {
    const allowFrom = account.allowFrom ?? [];
    if (allowFrom.includes("*") || allowFrom.includes(params.senderId)) {
      return { allowed: true };
    }
    return { allowed: false, reason: "sender not in allowFrom" };
  }
  return { allowed: true };
}
