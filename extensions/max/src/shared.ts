import type { ChannelPlugin } from "openclaw/plugin-sdk/channel-core";
import { DEFAULT_ACCOUNT_ID } from "openclaw/plugin-sdk/account-id";
import { resolveMAXAccount, listMAXAccountIds } from "./accounts.js";
import { resolveMAXToken } from "./token.js";
import type { MAXProbeResult } from "./types.js";

export type ResolvedMAXAccount = ReturnType<typeof resolveMAXAccount>;

const maxConfigAdapter = {
  channel: "max" as const,
  resolveAccount: resolveMAXAccount,
  listAccountIds: listMAXAccountIds,
  defaultAccountId: () => DEFAULT_ACCOUNT_ID,
  resolveToken: resolveMAXToken,
};

function createMaxPluginBase(overrides: Partial<ChannelPlugin<ResolvedMAXAccount, MAXProbeResult>> = {}) {
  return {
    id: "max" as const,
    meta: { displayName: "MAX Messenger", helpLink: "https://dev.max.ru/docs-api" },
    config: maxConfigAdapter,
    ...overrides,
  };
}

export { createMaxPluginBase, maxConfigAdapter };
