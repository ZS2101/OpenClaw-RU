import type { VKTeamsAccountConfig } from "./types.js";
export function resolveVTToken(a: VKTeamsAccountConfig): string|null { return a.token?.trim() || process.env.VKTEAMS_BOT_TOKEN?.trim() || null; }
