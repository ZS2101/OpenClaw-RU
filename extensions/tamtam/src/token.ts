import type { TamtamAccountConfig } from "./types.js";

export function resolveTamtamToken(account: TamtamAccountConfig): string | null {
  return account.token?.trim() || process.env.TAMTAM_BOT_TOKEN?.trim() || null;
}
