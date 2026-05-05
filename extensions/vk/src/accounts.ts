import type { OpenClawConfig, ChannelConfig } from "openclaw/plugin-sdk/config-types";
import { DEFAULT_ACCOUNT_ID } from "openclaw/plugin-sdk/account-id";
import type { VkConfig, VkAccountConfig } from "./types.js";

/** Resolve a VK account from config (single-account or per-account) */
export function resolveVkAccount(params: {
  cfg: OpenClawConfig;
  accountId: string;
}): VkAccountConfig {
  const vkConfig = (params.cfg?.channels as any)?.vk as VkConfig | undefined;
  const defaultAccount: VkAccountConfig = {
    enabled: vkConfig?.enabled ?? true,
    token: vkConfig?.token,
    name: vkConfig?.name,
    ...vkConfig,
  };

  if (params.accountId === DEFAULT_ACCOUNT_ID) return defaultAccount;

  // Multi-account: look up by accountId
  const accounts = vkConfig?.accounts ?? {};
  const explicit = accounts[params.accountId];
  if (explicit) return { ...defaultAccount, ...explicit };

  return defaultAccount;
}

/** List configured VK account IDs */
export function listVkAccountIds(cfg: OpenClawConfig): string[] {
  const vkConfig = (cfg?.channels as any)?.vk as VkConfig | undefined;
  if (!vkConfig?.enabled && vkConfig?.enabled !== undefined) return [];

  const accounts = vkConfig?.accounts ?? {};
  const ids = Object.keys(accounts);
  if (ids.length === 0) return [DEFAULT_ACCOUNT_ID];
  return ids;
}

/** Resolve VK token from account config */
export function resolveVkToken(account: VkAccountConfig): string | null {
  return account.token?.trim() || null;
}
