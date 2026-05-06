import { DEFAULT_ACCOUNT_ID } from "openclaw/plugin-sdk/account-id";
import type { ChannelPlugin } from "openclaw/plugin-sdk/channel-core";
import { resolveTamtamAccount, listTamtamAccountIds } from "./accounts.js";
import { resolveTamtamToken } from "./token.js";
import type { TamtamProbeResult } from "./types.js";

export type ResolvedTamtamAccount = ReturnType<typeof resolveTamtamAccount>;

const tamtamConfigAdapter = {
  channel: "tamtam" as const,
  resolveAccount: resolveTamtamAccount,
  listAccountIds: listTamtamAccountIds,
  defaultAccountId: () => DEFAULT_ACCOUNT_ID,
  resolveToken: resolveTamtamToken,
};

function createTamtamPluginBase(
  overrides: Partial<ChannelPlugin<ResolvedTamtamAccount, TamtamProbeResult>> = {},
) {
  return {
    id: "tamtam" as const,
    meta: {
      displayName: "TamTam",
      helpLink: "https://dev.tamtam.chat",
    },
    config: tamtamConfigAdapter,
    ...overrides,
  };
}

export { createTamtamPluginBase, tamtamConfigAdapter };
