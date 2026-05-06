import { DEFAULT_ACCOUNT_ID } from "openclaw/plugin-sdk/account-id";
import type { OpenClawConfig } from "openclaw/plugin-sdk/config-types";
import type { MAXConfig, MAXAccountConfig } from "./types.js";

export function resolveMAXAccount(params: {
  cfg: OpenClawConfig;
  accountId: string;
}): MAXAccountConfig {
  const maxConfig = (params.cfg?.channels as unknown as Record<string, unknown> | undefined)
    ?.max as MAXConfig | undefined;
  const def: MAXAccountConfig = {
    enabled: maxConfig?.enabled ?? true,
    token: maxConfig?.token,
    name: maxConfig?.name,
    webhookUrl: maxConfig?.webhookUrl,
    ...maxConfig,
  };
  if (params.accountId === DEFAULT_ACCOUNT_ID) {
    return def;
  }
  const acc = maxConfig?.accounts?.[params.accountId];
  return acc ? { ...def, ...acc } : def;
}

export function listMAXAccountIds(cfg: OpenClawConfig): string[] {
  const maxConfig = (cfg?.channels as unknown as Record<string, unknown> | undefined)?.max as
    | MAXConfig
    | undefined;
  if (!maxConfig?.enabled && maxConfig?.enabled !== undefined) {
    return [];
  }
  const ids = Object.keys(maxConfig?.accounts ?? {});
  return ids.length > 0 ? ids : [DEFAULT_ACCOUNT_ID];
}
