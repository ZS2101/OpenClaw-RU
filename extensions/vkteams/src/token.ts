import type { VKTeamsAccountConfig } from "./types.js";

/** Resolve VK Teams token from account config or env var */
export function resolveVTToken(a: VKTeamsAccountConfig): string | null {
  return a.token?.trim() || process.env.VKTEAMS_BOT_TOKEN?.trim() || null;
}
