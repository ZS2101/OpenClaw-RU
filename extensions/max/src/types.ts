export interface MAXConfig {
  enabled?: boolean;
  token?: string;
  name?: string;
  webhookUrl?: string;
  webhookSecret?: string;
  dmPolicy?: "open" | "pairing" | "allowlist" | "disabled";
  groupPolicy?: "open" | "disabled" | "allowlist";
  allowFrom?: string[];
  groupAllowFrom?: string[];
  groups?: Record<string, MAXGroupConfig>;
  accounts?: Record<string, MAXAccountConfig>;
  defaultAccount?: string;
}

export interface MAXAccountConfig {
  enabled?: boolean;
  token?: string;
  name?: string;
  webhookUrl?: string;
  webhookSecret?: string;
  dmPolicy?: "open" | "pairing" | "allowlist" | "disabled";
  groupPolicy?: "open" | "disabled" | "allowlist";
  allowFrom?: string[];
  groupAllowFrom?: string[];
  groups?: Record<string, MAXGroupConfig>;
}

export interface MAXGroupConfig { requireMention?: boolean; }

export interface MAXProbeResult {
  ok: boolean;
  latencyMs: number;
  botName?: string;
  error?: string;
}
