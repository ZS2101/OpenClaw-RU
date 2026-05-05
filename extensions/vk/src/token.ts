import type { VkAccountConfig } from "./types.js";

/** Resolve the VK API token from config or env */
export function resolveVkToken(account: VkAccountConfig): string | null {
  return account.token?.trim() || process.env.VK_BOT_TOKEN?.trim() || null;
}

/** Build Authorization header value for VK API */
export function vkAuthHeader(token: string): string {
  return `Bearer ${token}`;
}
