import type { OpenClawConfig } from "openclaw/plugin-sdk/config-types";
import { DEFAULT_ACCOUNT_ID } from "openclaw/plugin-sdk/account-id";
import { resolveVKTeamsAccount } from "./src/accounts.js";
import { resolveVKTeamsToken } from "./src/token.js";

export function vkteamsChannelEnabled(cfg: OpenClawConfig, accountId?: string): boolean {
  const id = accountId ?? DEFAULT_ACCOUNT_ID;
  const account = resolveVKTeamsAccount({ cfg, accountId: id });
  const token = resolveVKTeamsToken(account);
  return account.enabled !== false && Boolean(token);
}
