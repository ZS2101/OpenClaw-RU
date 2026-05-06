const VT_PREFIX = /^vkteams:/i;

/** Check if a routing target looks like a VK Teams identifier */
export function looksLikeVKTeamsTargetId(raw: string): boolean {
  return raw.replace(VT_PREFIX, "").trim().length >= 3;
}

/** Strip the vkteams: prefix from a messaging target */
export function normalizeVKTeamsMessagingTarget(raw: string): string {
  return raw.replace(VT_PREFIX, "").trim();
}

export { normalizeVKTeamsMessagingTarget as normalizeVKTeamsTarget };
