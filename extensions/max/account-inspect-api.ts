import type { OpenClawConfig } from "openclaw/plugin-sdk/config-types";
import { DEFAULT_ACCOUNT_ID } from "openclaw/plugin-sdk/account-id";
import { resolveMAXAccount } from "./src/accounts.js";
import { resolveMAXToken } from "./src/token.js";

export function inspectMAXAccount(cfg: OpenClawConfig, accountId?: string): { configured: boolean; token?: string } {
  const account = resolveMAXAccount({ cfg, accountId: accountId ?? DEFAULT_ACCOUNT_ID });
  return { configured: Boolean(resolveMAXToken(account)), token: resolveMAXToken(account) ?? undefined };
}
