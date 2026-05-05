export interface OKConfig {
  enabled?: boolean;
  token?: string;
  name?: string;
  webhookUrl?: string;
  dmPolicy?: "open" | "pairing" | "allowlist" | "disabled";
  groupPolicy?: "open" | "disabled" | "allowlist";
  allowFrom?: string[];
  groupAllowFrom?: string[];
  groups?: Record<string, OKGroupConfig>;
  accounts?: Record<string, OKAccountConfig>;
  defaultAccount?: string;
}

export interface OKAccountConfig {
  enabled?: boolean;
  token?: string;
  name?: string;
  webhookUrl?: string;
  dmPolicy?: "open" | "pairing" | "allowlist" | "disabled";
  groupPolicy?: "open" | "disabled" | "allowlist";
  allowFrom?: string[];
  groupAllowFrom?: string[];
  groups?: Record<string, OKGroupConfig>;
}

export interface OKGroupConfig {
  requireMention?: boolean;
}

export interface OKProbeResult {
  ok: boolean;
  latencyMs: number;
  botName?: string;
  error?: string;
}
