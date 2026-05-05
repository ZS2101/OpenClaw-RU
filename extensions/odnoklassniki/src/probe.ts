import type { OpenClawConfig } from "openclaw/plugin-sdk/config-types";
import { DEFAULT_ACCOUNT_ID } from "openclaw/plugin-sdk/account-id";
import { probeOK } from "./api.js";
import type { OKProbeResult } from "./types.js";

export async function probeOKChannel(
  cfg: OpenClawConfig,
  accountId: string,
): Promise<OKProbeResult> {
  return probeOK(cfg, accountId ?? DEFAULT_ACCOUNT_ID);
}
