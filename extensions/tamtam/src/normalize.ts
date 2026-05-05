const TAMTAM_PREFIX = /^tamtam:/i;

export function looksLikeTamtamTargetId(raw: string): boolean {
  const cleaned = raw.replace(TAMTAM_PREFIX, "").trim();
  return /^-?\d+$/.test(cleaned);
}

export function normalizeTamtamMessagingTarget(raw: string): string {
  return raw.replace(TAMTAM_PREFIX, "").trim();
}

export function normalizeTamtamTarget(raw: string): string {
  return raw.replace(TAMTAM_PREFIX, "").trim();
}
