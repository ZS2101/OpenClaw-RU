const OK_PREFIX = /^odnoklassniki:/i;

export function looksLikeOKTargetId(raw: string): boolean {
  const cleaned = raw.replace(OK_PREFIX, "").trim();
  // OK targets: chat_id (UUID hex), login (email-like), or numeric
  return cleaned.length >= 3;
}

export function normalizeOKMessagingTarget(raw: string): string {
  return raw.replace(OK_PREFIX, "").trim();
}

export function normalizeOKTarget(raw: string): string {
  return raw.replace(OK_PREFIX, "").trim();
}
