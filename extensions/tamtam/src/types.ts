export interface TamtamConfig {
  enabled?: boolean;
  token?: string;
  name?: string;
  dmPolicy?: "open" | "pairing" | "allowlist" | "disabled";
  groupPolicy?: "open" | "disabled" | "allowlist";
  allowFrom?: string[];
  groupAllowFrom?: string[];
  groups?: Record<string, TamtamGroupConfig>;
  accounts?: Record<string, TamtamAccountConfig>;
  defaultAccount?: string;
  longPollWait?: number;
}

export interface TamtamAccountConfig {
  enabled?: boolean;
  token?: string;
  name?: string;
  dmPolicy?: "open" | "pairing" | "allowlist" | "disabled";
  groupPolicy?: "open" | "disabled" | "allowlist";
  allowFrom?: string[];
  groupAllowFrom?: string[];
  groups?: Record<string, TamtamGroupConfig>;
}

export interface TamtamGroupConfig {
  requireMention?: boolean;
}

export interface TamtamProbeResult {
  ok: boolean;
  latencyMs: number;
  botName?: string;
  error?: string;
}
