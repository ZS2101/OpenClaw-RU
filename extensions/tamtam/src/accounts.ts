import { DEFAULT_ACCOUNT_ID } from "openclaw/plugin-sdk/account-id";
import type { OpenClawConfig } from "openclaw/plugin-sdk/config-types";
import type { TamtamConfig, TamtamAccountConfig } from "./types.js";

export function resolveTamtamAccount(params: {
  cfg: OpenClawConfig;
  accountId: string;
}): TamtamAccountConfig {
  const tamtamConfig = (params.cfg?.channels as unknown as Record<string, unknown> | undefined)
    ?.tamtam as TamtamConfig | undefined;
  const defaultAccount: TamtamAccountConfig = {
    enabled: tamtamConfig?.enabled ?? true,
    token: tamtamConfig?.token,
    name: tamtamConfig?.name,
    ...tamtamConfig,
  };

  if (params.accountId === DEFAULT_ACCOUNT_ID) {
    return defaultAccount;
  }

  const accounts = tamtamConfig?.accounts ?? {};
  const explicit = accounts[params.accountId];
  if (explicit) {
    return { ...defaultAccount, ...explicit };
  }
  return defaultAccount;
}

export function listTamtamAccountIds(cfg: OpenClawConfig): string[] {
  const tamtamConfig = (cfg?.channels as unknown as Record<string, unknown> | undefined)?.tamtam as
    | TamtamConfig
    | undefined;
  if (!tamtamConfig?.enabled && tamtamConfig?.enabled !== undefined) {
    return [];
  }
  const accounts = tamtamConfig?.accounts ?? {};
  const ids = Object.keys(accounts);
  if (ids.length === 0) {
    return [DEFAULT_ACCOUNT_ID];
  }
  return ids;
}
