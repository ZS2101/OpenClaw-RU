import type { OpenClawConfig } from "openclaw/plugin-sdk/config-types";
import { resolveMAXAccount } from "./accounts.js";

export function checkMAXDmAccess(params: { cfg: OpenClawConfig; accountId: string; senderId: string }): { allowed: boolean; reason?: string } {
  const account = resolveMAXAccount({ cfg: params.cfg, accountId: params.accountId });
  const policy = account.dmPolicy ?? "open";
  if (policy === "disabled") return { allowed: false, reason: "dmPolicy=disabled" };
  if (policy === "open") return { allowed: true };
  if (policy === "allowlist") return { allowed: (account.allowFrom ?? []).includes("*") || (account.allowFrom ?? []).includes(params.senderId), reason: "sender not in allowFrom" };
  return { allowed: true };
}
