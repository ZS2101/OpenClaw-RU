import type { OpenClawConfig } from "openclaw/plugin-sdk/config-types";
import { DEFAULT_ACCOUNT_ID } from "openclaw/plugin-sdk/account-id";
import { probeYandex } from "./api.js";
import type { YandexProbeResult } from "./types.js";

export async function probeYandexChannel(
  cfg: OpenClawConfig,
  accountId: string,
): Promise<YandexProbeResult> {
  return probeYandex(cfg, accountId ?? DEFAULT_ACCOUNT_ID);
}
