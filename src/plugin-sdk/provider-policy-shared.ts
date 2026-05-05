import type { ModelProviderConfig } from "../config/types.js";
import type { OpenClawConfig } from "../config/types.openclaw.js";

export interface ProviderPolicyEntryParams {
  providerId: string;
}

export interface ProviderPolicyEntry {
  normalizeConfig?: (ctx: {
    provider: string;
    providerConfig: ModelProviderConfig;
  }) => ModelProviderConfig | null | undefined;
  applyConfigDefaults?: (ctx: {
    provider: string;
    config: OpenClawConfig;
    env: NodeJS.ProcessEnv;
  }) => OpenClawConfig | null | undefined;
  resolveConfigApiKey?: (ctx: {
    provider: string;
    env: NodeJS.ProcessEnv;
  }) => string | null | undefined;
}

/**
 * Create a default (no-op) provider policy entry.
 * Providers can add normalization, config defaults, or API key resolution
 * by extending the returned object.
 */
export function createDefaultProviderPolicyEntry(
  _params: ProviderPolicyEntryParams,
): ProviderPolicyEntry {
  return {};
}
