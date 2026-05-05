import type { OpenClawConfig } from "openclaw/plugin-sdk/config-types";
import { DEFAULT_ACCOUNT_ID } from "openclaw/plugin-sdk/account-id";
import { probeVKTeams } from "./send.js";
import type { VKTeamsProbeResult } from "./types.js";
export async function probeVKTeamsChannel(cfg: OpenClawConfig, a: string): Promise<VKTeamsProbeResult> { return probeVKTeams(cfg, a ?? DEFAULT_ACCOUNT_ID); }
