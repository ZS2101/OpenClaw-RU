import type { OpenClawConfig } from "openclaw/plugin-sdk/config-types";
import { DEFAULT_ACCOUNT_ID } from "openclaw/plugin-sdk/account-id";
import { probeMAX } from "./api.js";
import type { MAXProbeResult } from "./types.js";

export async function probeMAXChannel(cfg: OpenClawConfig, accountId: string): Promise<MAXProbeResult> {
  return probeMAX(cfg, accountId ?? DEFAULT_ACCOUNT_ID);
}
