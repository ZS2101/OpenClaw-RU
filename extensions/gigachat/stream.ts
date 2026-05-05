/**
 * GigaChat stream wrapper.
 *
 * GigaChat uses OAuth2-style auth: a static "authorization key" (Base64
 * client_id:client_secret) is exchanged for a 30-minute access token via
 * POST /api/v2/oauth.  The access token is then used as a Bearer token on
 * every API call.
 *
 * This wrapper caches the access token and auto-refreshes it when fewer
 * than 5 minutes remain.  Users set GIGACHAT_AUTH_KEY; the wrapper does
 * the rest.  As a fallback, GIGACHAT_ACCESS_TOKEN (a pre-obtained token)
 * is also supported.
 */
import type { StreamFn } from "@mariozechner/pi-agent-core";
import type { ProviderWrapStreamFnContext } from "openclaw/plugin-sdk/plugin-entry";
import { randomUUID } from "node:crypto";

// ---------------------------------------------------------------------------
// Token cache
// ---------------------------------------------------------------------------

let _tokenCache: { token: string; expiresAt: number } | null = null;
let _tokenFetchPromise: Promise<{ token: string; expiresAt: number }> | null = null;

const GIGACHAT_OAUTH_URL = "https://ngw.devices.sberbank.ru:9443/api/v2/oauth";

async function _fetchAccessToken(authKey: string): Promise<{ token: string; expiresAt: number }> {
  const rqUid = randomUUID();

  const res = await fetch(GIGACHAT_OAUTH_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
      "RqUID": rqUid,
      Authorization: `Basic ${authKey}`,
    },
    body: "scope=GIGACHAT_API_PERS",
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`GigaChat OAuth failed (${res.status}): ${text.slice(0, 200)}`);
  }

  const data = (await res.json()) as {
    access_token: string;
    expires_at: number;
  };

  if (!data.access_token) {
    throw new Error("GigaChat OAuth response missing access_token");
  }

  return { token: data.access_token, expiresAt: (data.expires_at ?? 0) * 1000 };
}

async function _getAccessToken(authKey: string): Promise<string> {
  const minExpiry = Date.now() + 5 * 60 * 1000; // 5 min buffer

  // Return cached token if still valid
  if (_tokenCache && _tokenCache.expiresAt > minExpiry) {
    return _tokenCache.token;
  }

  // Deduplicate concurrent fetches
  if (_tokenFetchPromise) {
    const result = await _tokenFetchPromise;
    return result.token;
  }

  _tokenFetchPromise = _fetchAccessToken(authKey);

  try {
    const result = await _tokenFetchPromise;
    _tokenCache = { token: result.token, expiresAt: result.expiresAt };
    return result.token;
  } finally {
    _tokenFetchPromise = null;
  }
}

// ---------------------------------------------------------------------------
// Stream wrapper
// ---------------------------------------------------------------------------

export function wrapGigaChatProviderStream(
  ctx: ProviderWrapStreamFnContext,
): StreamFn | null | undefined {
  const authKey = process.env.GIGACHAT_AUTH_KEY;
  const accessToken = process.env.GIGACHAT_ACCESS_TOKEN;

  // Neither credential → pass through unchanged
  if (!authKey && !accessToken) return ctx.streamFn;
  if (!ctx.streamFn) return undefined;

  const baseStreamFn = ctx.streamFn;

  // Static token path — wrap synchronously
  if (accessToken && !authKey) {
    return (model, context, options) => {
      const headers: Record<string, string> = { ...model.headers };
      const existingAuth =
        headers["Authorization"] ?? headers["authorization"];
      if (!existingAuth || !existingAuth.startsWith("Bearer ")) {
        headers["Authorization"] = `Bearer ${accessToken}`;
        delete headers["authorization"];
      }
      return baseStreamFn(
        { ...model, headers } as typeof model,
        context,
        options,
      );
    };
  }

  // OAuth auto-refresh path
  const effectiveAuthKey = authKey!;

  return (model, context, options) => {
    // This StreamFn is typed as synchronous, but the pipeline handles
    // Promise<Response> naturally.  We wrap the OAuth call inside the
    // returned function so the token is always fresh at request time.
    return _getAccessToken(effectiveAuthKey).then((token) => {
      const headers: Record<string, string> = { ...model.headers };
      headers["Authorization"] = `Bearer ${token}`;
      delete headers["authorization"];
      return baseStreamFn(
        { ...model, headers } as typeof model,
        context,
        options,
      ) as ReturnType<StreamFn>;
    }) as ReturnType<StreamFn>;
  };
}

export { wrapGigaChatProviderStream as wrapStreamFn };
