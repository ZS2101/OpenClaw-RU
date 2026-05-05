export interface VkConfig {
  enabled?: boolean;
  token?: string;
  name?: string;
  /** VK community/group ID (required for Long Poll) */
  groupId?: number;
  dmPolicy?: "open" | "pairing" | "allowlist" | "disabled";
  groupPolicy?: "open" | "disabled" | "allowlist";
  allowFrom?: string[];
  groupAllowFrom?: string[];
  groups?: Record<string, VkGroupConfig>;
  accounts?: Record<string, VkAccountConfig>;
  defaultAccount?: string;
  /** Long Poll wait timeout in seconds (default: 25) */
  longPollWait?: number;
  /** VK API version (default: "5.199") */
  apiVersion?: string;
}

export interface VkAccountConfig {
  enabled?: boolean;
  token?: string;
  name?: string;
  /** VK community/group ID (required for Long Poll) */
  groupId?: number;
  dmPolicy?: "open" | "pairing" | "allowlist" | "disabled";
  groupPolicy?: "open" | "disabled" | "allowlist";
  allowFrom?: string[];
  groupAllowFrom?: string[];
  groups?: Record<string, VkGroupConfig>;
  longPollWait?: number;
  apiVersion?: string;
}

export interface VkGroupConfig {
  requireMention?: boolean;
}

export interface VkProbeResult {
  ok: boolean;
  latencyMs: number;
  groupName?: string;
  memberCount?: number;
  error?: string;
}
