import { DEFAULT_ACCOUNT_ID } from "openclaw/plugin-sdk/account-id";
import type { ChannelPlugin } from "openclaw/plugin-sdk/channel-core";
import { resolveOKAccount, listOKAccountIds } from "./accounts.js";
import { resolveOKToken } from "./token.js";
import type { OKProbeResult } from "./types.js";

export type ResolvedOKAccount = ReturnType<typeof resolveOKAccount>;

const odnoklassnikiConfigAdapter = {
  channel: "odnoklassniki" as const,
  resolveAccount: resolveOKAccount,
  listAccountIds: listOKAccountIds,
  defaultAccountId: () => DEFAULT_ACCOUNT_ID,
  resolveToken: resolveOKToken,
};

function createOKPluginBase(
  overrides: Partial<ChannelPlugin<ResolvedOKAccount, OKProbeResult>> = {},
) {
  return {
    id: "odnoklassniki" as const,
    meta: {
      displayName: "Одноклассники",
      helpLink: "https://apiok.ru",
    },
    config: odnoklassnikiConfigAdapter,
    ...overrides,
  };
}

export { createOKPluginBase, odnoklassnikiConfigAdapter };
