import type { OpenClawConfig } from "openclaw/plugin-sdk/config-types";
import { DEFAULT_ACCOUNT_ID } from "openclaw/plugin-sdk/account-id";
import { resolveVKTeamsAccount } from "./src/accounts.js";
import { resolveVTToken } from "./src/token.js";
export function inspectVKTeamsAccount(cfg: OpenClawConfig, accountId?: string): { configured: boolean; token?: string } {
  const t = resolveVTToken(resolveVKTeamsAccount({ cfg, accountId: accountId ?? DEFAULT_ACCOUNT_ID }));
  return { configured: Boolean(t), token: t ?? undefined };
}
