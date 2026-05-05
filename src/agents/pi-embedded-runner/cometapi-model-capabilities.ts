/**
 * Runtime CometAPI model capability detection.
 *
 * Fetches model capabilities from CometAPI's /v1/models endpoint (OpenAI-compatible),
 * caching results in memory + disk with the same 3-layer pattern that OpenRouter uses.
 *
 * Cache layers (checked in order):
 * 1. In-memory Map (instant, cleared on process restart)
 * 2. On-disk JSON file (<stateDir>/cache/cometapi-models.json)
 * 3. CometAPI API fetch (populates both layers, requires API key)
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { resolveStateDir } from "../../config/paths.js";
import { formatErrorMessage } from "../../infra/errors.js";
import { resolveProxyFetchFromEnv } from "../../infra/net/proxy-fetch.js";
import { createSubsystemLogger } from "../../logging/subsystem.js";

const log = createSubsystemLogger("cometapi-model-capabilities");

const COMETAPI_MODELS_URL = "https://api.cometapi.com/v1/models";
const FETCH_TIMEOUT_MS = 10_000;
const DISK_CACHE_FILENAME = "cometapi-models.json";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CometApiModel {
  id: string;
  object?: string;
  created?: number;
  owned_by?: string;
  supported_endpoint_types?: string[];
  // Extended fields that CometAPI proxy may return
  name?: string;
  context_length?: number;
  max_tokens?: number;
  pricing?: {
    prompt?: string;
    completion?: string;
  };
  modality?: string;
  supported_parameters?: string[];
}

export interface CometAPIModelCapabilities {
  name: string;
  input: Array<"text" | "image">;
  reasoning: boolean;
  contextWindow: number;
  maxTokens: number;
  cost: {
    input: number;
    output: number;
    cacheRead: number;
    cacheWrite: number;
  };
}

interface DiskCachePayload {
  models: Record<string, CometAPIModelCapabilities>;
}

// ---------------------------------------------------------------------------
// Module-level API key
// ---------------------------------------------------------------------------

let _apiKey: string | undefined;

export function setCometAPIApiKey(key: string): void {
  _apiKey = key;
}

// ---------------------------------------------------------------------------
// Disk cache
// ---------------------------------------------------------------------------

function resolveDiskCacheDir(): string {
  return join(resolveStateDir(), "cache");
}

function resolveDiskCachePath(): string {
  return join(resolveDiskCacheDir(), DISK_CACHE_FILENAME);
}

function writeDiskCache(map: Map<string, CometAPIModelCapabilities>): void {
  try {
    const cacheDir = resolveDiskCacheDir();
    if (!existsSync(cacheDir)) {
      mkdirSync(cacheDir, { recursive: true });
    }
    const payload: DiskCachePayload = {
      models: Object.fromEntries(map),
    };
    writeFileSync(resolveDiskCachePath(), JSON.stringify(payload), "utf-8");
  } catch (err: unknown) {
    log.warn(`Failed to write CometAPI disk cache: ${formatErrorMessage(err)}`);
  }
}

function isValidCapabilities(value: unknown): value is CometAPIModelCapabilities {
  if (!value || typeof value !== "object") {
    return false;
  }
  const record = value as Record<string, unknown>;
  return (
    typeof record.name === "string" &&
    Array.isArray(record.input) &&
    typeof record.reasoning === "boolean" &&
    typeof record.contextWindow === "number" &&
    typeof record.maxTokens === "number"
  );
}

function readDiskCache(): Map<string, CometAPIModelCapabilities> | undefined {
  try {
    const cachePath = resolveDiskCachePath();
    if (!existsSync(cachePath)) {
      return undefined;
    }
    const raw = readFileSync(cachePath, "utf-8");
    const payload = JSON.parse(raw) as unknown;
    if (!payload || typeof payload !== "object") {
      return undefined;
    }
    const models = (payload as DiskCachePayload).models;
    if (!models || typeof models !== "object") {
      return undefined;
    }
    const map = new Map<string, CometAPIModelCapabilities>();
    for (const [id, caps] of Object.entries(models)) {
      if (isValidCapabilities(caps)) {
        map.set(id, caps);
      }
    }
    return map.size > 0 ? map : undefined;
  } catch {
    return undefined;
  }
}

// ---------------------------------------------------------------------------
// In-memory cache state
// ---------------------------------------------------------------------------

let cache: Map<string, CometAPIModelCapabilities> | undefined;
let fetchInFlight: Promise<void> | undefined;
const skipNextMissRefresh = new Set<string>();

function isImageModel(model: CometApiModel): boolean {
  // 1) Explicit modality field
  if (model.modality?.includes("image")) return true;

  // 2) supported_endpoint_types hints at image capability
  if (model.supported_endpoint_types) {
    const endpoints = Array.isArray(model.supported_endpoint_types)
      ? model.supported_endpoint_types
      : [];
    const joined = endpoints.join(" ").toLowerCase();
    if (joined.includes("image") || joined.includes("vision") || joined.includes("multimodal"))
      return true;
  }

  // 3) Model ID heuristics — common vision / multimodal model families
  const id = model.id.toLowerCase();
  const visionKeywords = [
    "vision", "vl-", "-vl", "multimodal",
    "gpt-4o", "gpt-4-turbo", "gpt-4.1",
    "claude-3.5", "claude-3-", "claude-4",
    "gemini-1.5", "gemini-2",
    "llava", "cogvlm", "qwen-vl", "qwen2-vl",
    "pixtral", "minicpm-v", "internvl", "phi-3-vision", "phi-3.5-vision",
    "glm-4v", "yi-vision", "deepseek-vl", "deepseek-vl2",
  ];
  if (visionKeywords.some((kw) => id.includes(kw))) return true;

  // 4) owned_by heuristics — providers whose default models usually support images;
  //    narrow to model ids that DON'T contain text-only markers
  const textOnlyMarkers = [
    "text-only", "textonly", "no-vision", "text-",
    "embedding", "moderation", "tts", "whisper",
    "davinci", "babbage", "curie", "ada",
    "gpt-3", "gpt-35",
  ];
  if (textOnlyMarkers.some((m) => id.includes(m))) return false;

  const owner = (model.owned_by ?? "").toLowerCase();
  const visionOwners = new Set([
    "openai", "anthropic", "google",
    "qwen", "internlm", "stepfun", "minimax",
  ]);
  // OpenAI gpt-4 class models (excluding base/old completions)
  if (owner === "openai" && (id.startsWith("gpt-4") || id.startsWith("o1") || id.startsWith("o3") || id.startsWith("o4")))
    return true;
  if (visionOwners.has(owner)) {
    // Tighten: only flag if model id doesn't look text-only
    if (/claude|gemini|sonnet|haiku|flash|sprint/.test(id)) return true;
  }

  return false;
}

function parseModel(model: CometApiModel): CometAPIModelCapabilities {
  const input: Array<"text" | "image"> = ["text"];
  if (isImageModel(model)) {
    input.push("image");
  }

  return {
    name: model.name || model.id,
    input,
    reasoning: model.supported_parameters?.includes("reasoning") ?? false,
    contextWindow: model.context_length || 128_000,
    maxTokens: model.max_tokens ?? 8192,
    cost: {
      input: parseFloat(model.pricing?.prompt || "0") * 1_000_000,
      output: parseFloat(model.pricing?.completion || "0") * 1_000_000,
      cacheRead: 0,
      cacheWrite: 0,
    },
  };
}

// ---------------------------------------------------------------------------
// API fetch
// ---------------------------------------------------------------------------

async function doFetch(): Promise<void> {
  if (!_apiKey) {
    log.debug("Skipping CometAPI model fetch — no API key set");
    return;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const fetchFn = resolveProxyFetchFromEnv() ?? globalThis.fetch;

    const response = await fetchFn(COMETAPI_MODELS_URL, {
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${_apiKey}`,
      },
    });

    if (!response.ok) {
      log.warn(`CometAPI models API returned ${response.status}`);
      return;
    }

    const data = (await response.json()) as { data?: CometApiModel[] };
    const models = data.data ?? [];
    const map = new Map<string, CometAPIModelCapabilities>();

    for (const model of models) {
      if (!model.id) {
        continue;
      }
      map.set(model.id, parseModel(model));
    }

    cache = map;
    writeDiskCache(map);
    log.debug(`Cached ${map.size} CometAPI models from API`);
  } catch (err: unknown) {
    log.warn(`Failed to fetch CometAPI models: ${formatErrorMessage(err)}`);
  } finally {
    clearTimeout(timeout);
  }
}

function triggerFetch(): void {
  if (fetchInFlight || !_apiKey) {
    return;
  }
  fetchInFlight = doFetch().finally(() => {
    fetchInFlight = undefined;
  });
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function ensureCometAPIModelCache(): void {
  if (cache) {
    return;
  }

  const disk = readDiskCache();
  if (disk) {
    cache = disk;
    log.debug(`Loaded ${disk.size} CometAPI models from disk cache`);
    return;
  }

  triggerFetch();
}

export async function loadCometAPIModelCapabilities(modelId: string): Promise<void> {
  ensureCometAPIModelCache();
  if (cache?.has(modelId)) {
    return;
  }
  let fetchPromise = fetchInFlight;
  if (!fetchPromise) {
    triggerFetch();
    fetchPromise = fetchInFlight;
  }
  await fetchPromise;
  if (!cache?.has(modelId)) {
    skipNextMissRefresh.add(modelId);
  }
}

export function getCometAPIModelCapabilities(
  modelId: string,
): CometAPIModelCapabilities | undefined {
  ensureCometAPIModelCache();
  const result = cache?.get(modelId);

  if (!result && skipNextMissRefresh.delete(modelId)) {
    return undefined;
  }
  if (!result && cache && !fetchInFlight) {
    triggerFetch();
  }

  return result;
}
