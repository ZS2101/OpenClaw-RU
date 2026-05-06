import { DEFAULT_ACCOUNT_ID } from "openclaw/plugin-sdk/account-id";
import type { OpenClawConfig } from "openclaw/plugin-sdk/config-types";
import type { OKConfig, OKAccountConfig } from "./types.js";

export function resolveOKAccount(params: {
  cfg: OpenClawConfig;
  accountId: string;
}): OKAccountConfig {
  const odnoklassnikiConfig = (
    params.cfg?.channels as unknown as Record<string, unknown> | undefined
  )?.odnoklassniki as OKConfig | undefined;
  const defaultAccount: OKAccountConfig = {
    enabled: odnoklassnikiConfig?.enabled ?? true,
    token: odnoklassnikiConfig?.token,
    name: odnoklassnikiConfig?.name,
    webhookUrl: odnoklassnikiConfig?.webhookUrl,
    ...odnoklassnikiConfig,
  };

  if (params.accountId === DEFAULT_ACCOUNT_ID) {
    return defaultAccount;
  }

  const accounts = odnoklassnikiConfig?.accounts ?? {};
  const explicit = accounts[params.accountId];
  if (explicit) {
    return { ...defaultAccount, ...explicit };
  }

  return defaultAccount;
}

export function listOKAccountIds(cfg: OpenClawConfig): string[] {
  const odnoklassnikiConfig = (cfg?.channels as unknown as Record<string, unknown> | undefined)
    ?.odnoklassniki as OKConfig | undefined;
  if (!odnoklassnikiConfig?.enabled && odnoklassnikiConfig?.enabled !== undefined) {
    return [];
  }

  const accounts = odnoklassnikiConfig?.accounts ?? {};
  const ids = Object.keys(accounts);
  if (ids.length === 0) {
    return [DEFAULT_ACCOUNT_ID];
  }
  return ids;
}

export function resolveOKToken(account: OKAccountConfig): string | null {
  return account.token?.trim() || null;
}
