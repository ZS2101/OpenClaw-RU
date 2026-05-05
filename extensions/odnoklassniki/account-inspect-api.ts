import type { OpenClawConfig } from "openclaw/plugin-sdk/config-types";
import { DEFAULT_ACCOUNT_ID } from "openclaw/plugin-sdk/account-id";
import { resolveOKAccount } from "./src/accounts.js";
import { resolveOKToken } from "./src/token.js";

export function inspectOKAccount(
  cfg: OpenClawConfig,
  accountId?: string,
): { configured: boolean; token?: string } {
  const id = accountId ?? DEFAULT_ACCOUNT_ID;
  const account = resolveOKAccount({ cfg, accountId: id });
  const token = resolveOKToken(account);
  return { configured: Boolean(token), token: token ?? undefined };
}
