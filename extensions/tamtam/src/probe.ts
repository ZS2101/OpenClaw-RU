import type { OpenClawConfig } from "openclaw/plugin-sdk/config-types";
import { DEFAULT_ACCOUNT_ID } from "openclaw/plugin-sdk/account-id";
import { probeTamtam } from "./send.js";
import type { TamtamProbeResult } from "./types.js";

export async function probeTamtamChannel(
  cfg: OpenClawConfig,
  accountId: string,
): Promise<TamtamProbeResult> {
  return probeTamtam(cfg, accountId ?? DEFAULT_ACCOUNT_ID);
}
