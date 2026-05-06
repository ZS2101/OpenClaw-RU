import { DEFAULT_ACCOUNT_ID } from "openclaw/plugin-sdk/account-id";
import type { OpenClawConfig } from "openclaw/plugin-sdk/config-types";
import type { VKTeamsConfig, VKTeamsAccountConfig } from "./types.js";

/** Resolve a VK Teams account from config (single or per-account) */
export function resolveVKTeamsAccount(params: {
  cfg: OpenClawConfig;
  accountId: string;
}): VKTeamsAccountConfig {
  const config = (params.cfg?.channels as unknown as Record<string, unknown> | undefined)
    ?.vkteams as VKTeamsConfig | undefined;
  const defaultAccount: VKTeamsAccountConfig = {
    enabled: config?.enabled ?? true,
    token: config?.token,
    name: config?.name,
    ...config,
  };

  if (params.accountId === DEFAULT_ACCOUNT_ID) {
    return defaultAccount;
  }

  // Multi-account: look up by accountId
  const explicit = config?.accounts?.[params.accountId];
  if (explicit) {
    return { ...defaultAccount, ...explicit };
  }

  return defaultAccount;
}

/** List configured VK Teams account IDs */
export function listVKTeamsAccountIds(cfg: OpenClawConfig): string[] {
  const config = (cfg?.channels as unknown as Record<string, unknown> | undefined)?.vkteams as
    | VKTeamsConfig
    | undefined;
  if (!config?.enabled && config?.enabled !== undefined) {
    return [];
  }

  const ids = Object.keys(config?.accounts ?? {});
  return ids.length > 0 ? ids : [DEFAULT_ACCOUNT_ID];
}
