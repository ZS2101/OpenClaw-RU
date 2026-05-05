import type { OpenClawConfig } from "openclaw/plugin-sdk/config-types";
import { resolveVKTeamsAccount } from "./accounts.js";
export function checkVKTeamsDmAccess(p: { cfg: OpenClawConfig; accountId: string; senderId: string }): { allowed: boolean; reason?: string } {
  const a = resolveVKTeamsAccount({ cfg: p.cfg, accountId: p.accountId });
  const af = a.allowFrom ?? [];
  const policy = a.dmPolicy ?? "open";
  if (policy === "disabled") return { allowed: false, reason: "dmPolicy=disabled" };
  if (policy === "open" || af.length === 0 || af.includes("*") || af.includes(p.senderId)) return { allowed: true };
  return { allowed: false, reason: "sender not in allowFrom" };
}
