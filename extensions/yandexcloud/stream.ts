/**
 * Yandex Cloud stream wrapper.
 *
 * OpenClaw's openai-completions adapter sends `Authorization: Bearer <key>`.
 * Yandex Cloud requires `Authorization: Api-Key <key>` and an `x-folder-id`
 * header on every request. This wrapper swaps the prefix and injects the
 * folder-id.
 */
import type { StreamFn } from "@mariozechner/pi-agent-core";
import type { ProviderWrapStreamFnContext } from "openclaw/plugin-sdk/plugin-entry";
import type { OpenClawConfig } from "openclaw/plugin-sdk/plugin-entry";

function resolveFolderId(config?: OpenClawConfig): string | undefined {
  // Prefer process env (set manually by user)
  if (process.env.YANDEX_FOLDER_ID) {
    return process.env.YANDEX_FOLDER_ID;
  }
  // Fall back to config (set by onboarding wizard)
  const cfgFolderId = config?.env?.YANDEX_FOLDER_ID;
  if (typeof cfgFolderId === "string" && cfgFolderId.length > 0) {
    return cfgFolderId;
  }
  const cfgVarsFolderId = config?.env?.vars?.YANDEX_FOLDER_ID;
  if (typeof cfgVarsFolderId === "string" && cfgVarsFolderId.length > 0) {
    return cfgVarsFolderId;
  }
  return undefined;
}

function resolveApiKey(config?: OpenClawConfig): string | undefined {
  if (process.env.YANDEX_API_KEY) {
    return process.env.YANDEX_API_KEY;
  }
  const cfgKey = config?.env?.YANDEX_API_KEY;
  if (typeof cfgKey === "string" && cfgKey.length > 0) {
    return cfgKey;
  }
  const cfgVarsKey = config?.env?.vars?.YANDEX_API_KEY;
  if (typeof cfgVarsKey === "string" && cfgVarsKey.length > 0) {
    return cfgVarsKey;
  }
  return undefined;
}

export function wrapYandexCloudProviderStream(
  ctx: ProviderWrapStreamFnContext,
): StreamFn | null | undefined {
  const apiKey = resolveApiKey(ctx.config);
  const folderId = resolveFolderId(ctx.config);

  // No credentials → pass through unchanged (will fail at API level)
  if (!apiKey || !folderId) {
    return ctx.streamFn;
  }

  if (!ctx.streamFn) {
    return undefined;
  }

  const baseStreamFn = ctx.streamFn;

  return (model, context, options) => {
    const headers: Record<string, string> = { ...model.headers };

    // Replace Bearer → Api-Key (or inject if missing)
    const existingAuth = headers["Authorization"] ?? headers["authorization"];
    if (existingAuth && existingAuth.startsWith("Bearer ")) {
      headers["Authorization"] = existingAuth.replace("Bearer ", "Api-Key ");
      delete headers["authorization"];
    } else if (!existingAuth) {
      headers["Authorization"] = `Api-Key ${apiKey}`;
    } else {
      headers["Authorization"] = existingAuth;
      delete headers["authorization"];
    }

    headers["x-folder-id"] = folderId;

    return baseStreamFn({ ...model, headers } as typeof model, context, options);
  };
}

export { wrapYandexCloudProviderStream as wrapStreamFn };
