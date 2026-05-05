import type { OpenClawConfig } from "openclaw/plugin-sdk/config-types";
import { DEFAULT_ACCOUNT_ID } from "openclaw/plugin-sdk/account-id";
import { resolveYandexAccount } from "./accounts.js";

export interface YandexAccessResult {
  allowed: boolean;
  reason?: string;
}

export function checkYandexDmAccess(params: {
  cfg: OpenClawConfig;
  accountId: string;
  senderId: string;
}): YandexAccessResult {
  const account = resolveYandexAccount({
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
