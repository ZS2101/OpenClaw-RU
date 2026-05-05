const YANDEX_PREFIX = /^yandex:/i;

export function looksLikeYandexTargetId(raw: string): boolean {
  const cleaned = raw.replace(YANDEX_PREFIX, "").trim();
  // Yandex targets: chat_id (UUID hex), login (email-like), or numeric
  return cleaned.length >= 3;
}

export function normalizeYandexMessagingTarget(raw: string): string {
  return raw.replace(YANDEX_PREFIX, "").trim();
}

export function normalizeYandexTarget(raw: string): string {
  return raw.replace(YANDEX_PREFIX, "").trim();
}
