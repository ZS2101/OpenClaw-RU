import type { OpenClawConfig } from "openclaw/plugin-sdk/config-types";
import { DEFAULT_ACCOUNT_ID } from "openclaw/plugin-sdk/account-id";
import { resolveTamtamAccount } from "./src/accounts.js";
import { resolveTamtamToken } from "./src/token.js";

export function inspectTamTamAccount(cfg: OpenClawConfig, accountId?: string): { configured: boolean; token?: string } {
  const account = resolveTamtamAccount({ cfg, accountId: accountId ?? DEFAULT_ACCOUNT_ID });
  const token = resolveTamtamToken(account);
  return { configured: Boolean(token), token: token ?? undefined };
}
