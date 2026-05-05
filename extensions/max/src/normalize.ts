const MAX_PREFIX = /^max:/i;

export function looksLikeMAXTargetId(raw: string): boolean {
  return raw.replace(MAX_PREFIX, "").trim().length >= 3;
}

export function normalizeMAXMessagingTarget(raw: string): string {
  return raw.replace(MAX_PREFIX, "").trim();
}

export function normalizeMAXTarget(raw: string): string {
  return raw.replace(MAX_PREFIX, "").trim();
}
