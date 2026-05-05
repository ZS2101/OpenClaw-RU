import type { OpenClawConfig } from "openclaw/plugin-sdk/config-types";
import { DEFAULT_ACCOUNT_ID } from "openclaw/plugin-sdk/account-id";
import { resolveTamtamAccount } from "./src/accounts.js";
import { resolveTamtamToken } from "./src/token.js";

export function tamtamChannelEnabled(cfg: OpenClawConfig, accountId?: string): boolean {
  const id = accountId ?? DEFAULT_ACCOUNT_ID;
  const account = resolveTamtamAccount({ cfg, accountId: id });
  const token = resolveTamtamToken(account);
  return account.enabled !== false && Boolean(token);
}
