import type { MAXAccountConfig } from "./types.js";

export function resolveMAXToken(account: MAXAccountConfig): string | null {
  return account.token?.trim() || process.env.MAX_BOT_TOKEN?.trim() || null;
}
