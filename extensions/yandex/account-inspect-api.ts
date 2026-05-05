import type { OpenClawConfig } from "openclaw/plugin-sdk/config-types";
import { DEFAULT_ACCOUNT_ID } from "openclaw/plugin-sdk/account-id";
import { resolveYandexAccount } from "./src/accounts.js";
import { resolveYandexToken } from "./src/token.js";

export function inspectYandexAccount(
  cfg: OpenClawConfig,
  accountId?: string,
): { configured: boolean; token?: string } {
  const id = accountId ?? DEFAULT_ACCOUNT_ID;
  const account = resolveYandexAccount({ cfg, accountId: id });
  const token = resolveYandexToken(account);
  return { configured: Boolean(token), token: token ?? undefined };
}
