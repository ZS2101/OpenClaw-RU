export interface YandexConfig {
  enabled?: boolean;
  token?: string;
  name?: string;
  webhookUrl?: string;
  dmPolicy?: "open" | "pairing" | "allowlist" | "disabled";
  groupPolicy?: "open" | "disabled" | "allowlist";
  allowFrom?: string[];
  groupAllowFrom?: string[];
  groups?: Record<string, YandexGroupConfig>;
  accounts?: Record<string, YandexAccountConfig>;
  defaultAccount?: string;
}

export interface YandexAccountConfig {
  enabled?: boolean;
  token?: string;
  name?: string;
  webhookUrl?: string;
  dmPolicy?: "open" | "pairing" | "allowlist" | "disabled";
  groupPolicy?: "open" | "disabled" | "allowlist";
  allowFrom?: string[];
  groupAllowFrom?: string[];
  groups?: Record<string, YandexGroupConfig>;
}

export interface YandexGroupConfig {
  requireMention?: boolean;
}

export interface YandexProbeResult {
  ok: boolean;
  latencyMs: number;
  botName?: string;
  error?: string;
}
