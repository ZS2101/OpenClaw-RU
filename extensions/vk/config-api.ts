import type { OpenClawConfig } from "openclaw/plugin-sdk/config-types";
import { DEFAULT_ACCOUNT_ID } from "openclaw/plugin-sdk/account-id";
import { resolveVkAccount } from "./src/accounts.js";
import { resolveVkToken } from "./src/token.js";

export function vkChannelEnabled(cfg: OpenClawConfig, accountId?: string): boolean {
  const id = accountId ?? DEFAULT_ACCOUNT_ID;
  const account = resolveVkAccount({ cfg, accountId: id });
  const token = resolveVkToken(account);
  return account.enabled !== false && Boolean(token);
}
