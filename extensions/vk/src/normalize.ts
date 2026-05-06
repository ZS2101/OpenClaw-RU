const VK_PREFIX = /^vk:/i;

/** Check if a string looks like a VK target (ID or peer_id) */
export function looksLikeVkTargetId(raw: string): boolean {
  const cleaned = raw.replace(VK_PREFIX, "").trim();
  // VK user IDs are positive numbers, groups/peers can be 2000000000+
  return /^\d+$/.test(cleaned);
}

/** Normalize a VK target to a canonical form (just the numeric ID) */
export function normalizeVkMessagingTarget(raw: string): string {
  return raw.replace(VK_PREFIX, "").trim();
}

/** Normalize a general VK target for config/display purposes */
export function normalizeVkTarget(raw: string): string {
  return raw.replace(VK_PREFIX, "").trim();
}
