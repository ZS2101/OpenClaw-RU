import type { OpenClawConfig } from "openclaw/plugin-sdk/config-types";
import { DEFAULT_ACCOUNT_ID } from "openclaw/plugin-sdk/account-id";
import { resolveVkAccount } from "./accounts.js";

export interface VkAccessResult {
  allowed: boolean;
  reason?: string;
}

export function checkVkDmAccess(params: {
  cfg: OpenClawConfig;
  accountId: string;
  senderId: string;
}): VkAccessResult {
  const account = resolveVkAccount({
    cfg: params.cfg,
    accountId: params.accountId ?? DEFAULT_ACCOUNT_ID,
  });

  const policy = account.dmPolicy ?? "open";

  if (policy === "disabled") {
    return { allowed: false, reason: "dmPolicy=disabled" };
  }
  if (policy === "open") {
    return { allowed: true };
  }
  if (policy === "allowlist") {
    const allowFrom = account.allowFrom ?? [];
    if (allowFrom.includes("*") || allowFrom.includes(params.senderId)) {
      return { allowed: true };
    }
    return { allowed: false, reason: "sender not in allowFrom" };
  }
  // pairing — handled by the framework
  return { allowed: true };
}
