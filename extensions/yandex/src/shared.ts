import type { ChannelPlugin } from "openclaw/plugin-sdk/channel-core";
import { DEFAULT_ACCOUNT_ID } from "openclaw/plugin-sdk/account-id";
import type { OpenClawConfig } from "openclaw/plugin-sdk/config-types";
import { resolveYandexAccount, listYandexAccountIds } from "./accounts.js";
import { resolveYandexToken } from "./token.js";
import type { YandexProbeResult } from "./types.js";

export type ResolvedYandexAccount = ReturnType<typeof resolveYandexAccount>;

const yandexConfigAdapter = {
  channel: "yandex" as const,
  resolveAccount: resolveYandexAccount,
  listAccountIds: listYandexAccountIds,
  defaultAccountId: () => DEFAULT_ACCOUNT_ID,
  resolveToken: resolveYandexToken,
};

function createYandexPluginBase(
  overrides: Partial<ChannelPlugin<ResolvedYandexAccount, YandexProbeResult>> = {},
) {
  return {
    id: "yandex" as const,
    meta: {
      displayName: "Яндекс Мессенджер",
      helpLink: "https://yandex.ru/dev/messenger/",
    },
    config: yandexConfigAdapter,
    ...overrides,
  };
}

export { createYandexPluginBase, yandexConfigAdapter };
