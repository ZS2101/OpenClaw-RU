import { DEFAULT_ACCOUNT_ID } from "openclaw/plugin-sdk/account-id";
import type { OpenClawConfig } from "openclaw/plugin-sdk/config-types";
import type { YandexConfig, YandexAccountConfig } from "./types.js";

export function resolveYandexAccount(params: {
  cfg: OpenClawConfig;
  accountId: string;
}): YandexAccountConfig {
  const yandexConfig = (params.cfg?.channels as unknown as Record<string, unknown> | undefined)
    ?.yandex as YandexConfig | undefined;
  const defaultAccount: YandexAccountConfig = {
    enabled: yandexConfig?.enabled ?? true,
    token: yandexConfig?.token,
    name: yandexConfig?.name,
    webhookUrl: yandexConfig?.webhookUrl,
    ...yandexConfig,
  };

  if (params.accountId === DEFAULT_ACCOUNT_ID) {
    return defaultAccount;
  }

  const accounts = yandexConfig?.accounts ?? {};
  const explicit = accounts[params.accountId];
  if (explicit) {
    return { ...defaultAccount, ...explicit };
  }

  return defaultAccount;
}

export function listYandexAccountIds(cfg: OpenClawConfig): string[] {
  const yandexConfig = (cfg?.channels as unknown as Record<string, unknown> | undefined)?.yandex as
    | YandexConfig
    | undefined;
  if (!yandexConfig?.enabled && yandexConfig?.enabled !== undefined) {
    return [];
  }

  const accounts = yandexConfig?.accounts ?? {};
  const ids = Object.keys(accounts);
  if (ids.length === 0) {
    return [DEFAULT_ACCOUNT_ID];
  }
  return ids;
}

export function resolveYandexToken(account: YandexAccountConfig): string | null {
  return account.token?.trim() || null;
}
