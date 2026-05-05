import type { OKAccountConfig } from "./types.js";

export function resolveOKToken(account: OKAccountConfig): string | null {
  return account.token?.trim() || process.env.OK_BOT_TOKEN?.trim() || null;
}

export function okAuthParam(token: string): string {
  return `access_token=${encodeURIComponent(token)}`;
}
