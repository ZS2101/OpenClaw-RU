import type { OpenClawConfig } from "openclaw/plugin-sdk/config-types";
import { DEFAULT_ACCOUNT_ID } from "openclaw/plugin-sdk/account-id";
import { probeVk } from "./send.js";
import type { VkProbeResult } from "./types.js";

export async function probeVkChannel(
  cfg: OpenClawConfig,
  accountId: string,
): Promise<VkProbeResult> {
  return probeVk(cfg, accountId ?? DEFAULT_ACCOUNT_ID);
}
