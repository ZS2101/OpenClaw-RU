import type { YandexAccountConfig } from "./types.js";

export function resolveYandexToken(account: YandexAccountConfig): string | null {
  return account.token?.trim() || process.env.YANDEX_BOT_TOKEN?.trim() || null;
}

export function yandexAuthHeader(token: string): string {
  return `OAuth ${token}`;
}
