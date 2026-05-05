import type { OpenClawConfig } from "openclaw/plugin-sdk/config-types";
import { DEFAULT_ACCOUNT_ID } from "openclaw/plugin-sdk/account-id";
import { resolveVkAccount } from "./src/accounts.js";
import { resolveVkToken } from "./src/token.js";

export function inspectVkAccount(
  cfg: OpenClawConfig,
  accountId?: string,
): { configured: boolean; token?: string } {
  const id = accountId ?? DEFAULT_ACCOUNT_ID;
  const account = resolveVkAccount({ cfg, accountId: id });
  const token = resolveVkToken(account);
  return {
    configured: Boolean(token),
    token: token ?? undefined,
  };
}
