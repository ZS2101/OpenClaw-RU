import type { OpenClawConfig } from "../config/types.openclaw.js";
import type { SecretInput } from "../config/types.secrets.js";
import { isSecureWebSocketUrl } from "../gateway/net.js";
import { discoverGatewayBeacons, type GatewayBonjourBeacon } from "../infra/bonjour-discovery.js";
import {
  buildGatewayDiscoveryLabel,
  buildGatewayDiscoveryTarget,
} from "../infra/gateway-discovery-targets.js";
import { resolveWideAreaDiscoveryDomain } from "../infra/widearea-dns.js";
import { resolveSecretInputModeForEnvSelection } from "../plugins/provider-auth-mode.js";
import { promptSecretRefForSetup } from "../plugins/provider-auth-ref.js";
import type { WizardPrompter } from "../wizard/prompts.js";
import { detectBinary } from "./onboard-helpers.js";
import type { SecretInputMode } from "./onboard-types.js";

const DEFAULT_GATEWAY_URL = "ws://127.0.0.1:18789";

function buildLabel(beacon: GatewayBonjourBeacon): string {
  return buildGatewayDiscoveryLabel(beacon);
}

function ensureWsUrl(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    return DEFAULT_GATEWAY_URL;
  }
  return trimmed;
}

function validateGatewayWebSocketUrl(value: string): string | undefined {
  const trimmed = value.trim();
  if (!trimmed.startsWith("ws://") && !trimmed.startsWith("wss://")) {
    return "URL должен начинаться с ws:// или wss://";
  }
  if (
    !isSecureWebSocketUrl(trimmed, {
      allowPrivateWs: process.env.OPENCLAW_ALLOW_INSECURE_PRIVATE_WS === "1",
    })
  ) {
    return (
      "Используйте wss:// для удалённых хостов, или ws://127.0.0.1/localhost через SSH-туннель. " +
      "Экстренный обход (Break-glass): OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 для доверенных частных сетей."
    );
  }
  return undefined;
}

export async function promptRemoteGatewayConfig(
  cfg: OpenClawConfig,
  prompter: WizardPrompter,
  options?: { secretInputMode?: SecretInputMode },
): Promise<OpenClawConfig> {
  let selectedBeacon: GatewayBonjourBeacon | null = null;
  let suggestedUrl = cfg.gateway?.remote?.url ?? DEFAULT_GATEWAY_URL;
  let discoveryTlsFingerprint: string | undefined;
  let trustedDiscoveryUrl: string | undefined;

  const hasBonjourTool = (await detectBinary("dns-sd")) || (await detectBinary("avahi-browse"));
  const wantsDiscover = hasBonjourTool
    ? await prompter.confirm({
        message: "Искать шлюз в LAN (через Bonjour)?",
        initialValue: true,
      })
    : false;

  if (!hasBonjourTool) {
    await prompter.note(
      [
        "Для поиска через Bonjour требуется dns-sd (macOS) или avahi-browse (Linux).",
        "Документация: https://docs.openclaw.ai/gateway/discovery",
      ].join("\n"),
      "Discovery (Поиск устройств)",
    );
  }

  if (wantsDiscover) {
    const wideAreaDomain = resolveWideAreaDiscoveryDomain({
      configDomain: cfg.discovery?.wideArea?.domain,
    });
    const spin = prompter.progress("Поиск шлюзов...");
    const beacons = await discoverGatewayBeacons({ timeoutMs: 2000, wideAreaDomain });
    spin.stop(beacons.length > 0 ? `Found ${beacons.length} gateway(s)` : "Шлюзы не найдены");

    if (beacons.length > 0) {
      const selection = await prompter.select({
        message: "Выбрать шлюз",
        options: [
          ...beacons.map((beacon, index) => ({
            value: String(index),
            label: buildLabel(beacon),
          })),
          { value: "manual", label: "Ввести URL вручную" },
        ],
      });
      if (selection !== "manual") {
        const idx = Number.parseInt(selection, 10);
        selectedBeacon = Number.isFinite(idx) ? (beacons[idx] ?? null) : null;
      }
    }
  }

  if (selectedBeacon) {
    const target = buildGatewayDiscoveryTarget(selectedBeacon);
    if (target.endpoint) {
      const { host, port } = target.endpoint;
      const mode = await prompter.select({
        message: "Способ подключения",
        options: [
          {
            value: "direct",
            label: `Direct gateway WS (${host}:${port})`,
          },
          { value: "ssh", label: "SSH-туннель (loopback)" },
        ],
      });
      if (mode === "direct") {
        suggestedUrl = `wss://${host}:${port}`;
        const fingerprint = target.endpoint.gatewayTlsFingerprintSha256;
        const trusted = await prompter.confirm({
          message: `Trust this gateway? Host: ${host}:${port} TLS fingerprint: ${fingerprint ?? "not advertised (connection will not be pinned)"}`,
          initialValue: false,
        });
        if (trusted) {
          discoveryTlsFingerprint = fingerprint;
          trustedDiscoveryUrl = suggestedUrl;
          await prompter.note(
            [
              "Прямой удаленный доступ по умолчанию использует TLS.",
              `Using: ${suggestedUrl}`,
              ...(fingerprint ? [`TLS pin: ${fingerprint}`] : []),
              "Если ваш шлюз работает только через loopback, выберите SSH-туннель и оставьте ws://127.0.0.1:18789.",
            ].join("\n"),
            "Прямое удаленное подключение",
          );
        } else {
          // Clear the discovered endpoint so the manual prompt falls back to a safe default.
          suggestedUrl = DEFAULT_GATEWAY_URL;
        }
      } else {
        suggestedUrl = DEFAULT_GATEWAY_URL;
        await prompter.note(
          [
            "Запустите туннель перед использованием CLI:",
            `ssh -N -L 18789:127.0.0.1:18789 <user>@${host}${target.sshPort ? ` -p ${target.sshPort}` : ""}`,
            "Документация: https://docs.openclaw.ai/gateway/remote",
          ].join("\n"),
          "SSH-туннель",
        );
      }
    }
  }

  const urlInput = await prompter.text({
    message: "WebSocket URL шлюза",
    initialValue: suggestedUrl,
    validate: (value) => validateGatewayWebSocketUrl(value),
  });
  const url = ensureWsUrl(urlInput);
  const pinnedDiscoveryFingerprint =
    discoveryTlsFingerprint && url === trustedDiscoveryUrl ? discoveryTlsFingerprint : undefined;

  const authChoice = await prompter.select({
    message: "Авторизация шлюза",
    options: [
      { value: "token", label: "Токен (рекомендуется)" },
      { value: "password", label: "Пароль" },
      { value: "off", label: "Без авторизации" },
    ],
  });

  let token: SecretInput | undefined = cfg.gateway?.remote?.token;
  let password: SecretInput | undefined = cfg.gateway?.remote?.password;
  if (authChoice === "token") {
    const selectedMode = await resolveSecretInputModeForEnvSelection({
      prompter,
      explicitMode: options?.secretInputMode,
      copy: {
        modeMessage: "Как вы хотите указать этот токен шлюза?",
        plaintextLabel: "Ввести токен сейчас",
        plaintextHint: "Сохраняет токен прямо в конфиге OpenClaw",
      },
    });
    if (selectedMode === "ref") {
      const resolved = await promptSecretRefForSetup({
        provider: "gateway-remote-token",
        config: cfg,
        prompter,
        preferredEnvVar: "OPENCLAW_GATEWAY_TOKEN",
        copy: {
          sourceMessage: "Где хранится этот токен шлюза?",
          envVarPlaceholder: "OPENCLAW_GATEWAY_TOKEN",
        },
      });
      token = resolved.ref;
    } else {
      token = (
        await prompter.text({
          message: "Токен шлюза",
          initialValue: typeof token === "string" ? token : undefined,
          validate: (value) => (value?.trim() ? undefined : "Обязательно"),
        })
      ).trim();
    }
    password = undefined;
  } else if (authChoice === "password") {
    const selectedMode = await resolveSecretInputModeForEnvSelection({
      prompter,
      explicitMode: options?.secretInputMode,
      copy: {
        modeMessage: "Как вы хотите указать этот пароль шлюза?",
        plaintextLabel: "Ввести пароль сейчас",
        plaintextHint: "Сохраняет пароль прямо в конфиге OpenClaw",
      },
    });
    if (selectedMode === "ref") {
      const resolved = await promptSecretRefForSetup({
        provider: "gateway-remote-password",
        config: cfg,
        prompter,
        preferredEnvVar: "OPENCLAW_GATEWAY_PASSWORD",
        copy: {
          sourceMessage: "Где хранится этот пароль шлюза?",
          envVarPlaceholder: "OPENCLAW_GATEWAY_PASSWORD",
        },
      });
      password = resolved.ref;
    } else {
      password = (
        await prompter.text({
          message: "Пароль шлюза",
          initialValue: typeof password === "string" ? password : undefined,
          validate: (value) => (value?.trim() ? undefined : "Обязательно"),
        })
      ).trim();
    }
    token = undefined;
  } else {
    token = undefined;
    password = undefined;
  }

  return {
    ...cfg,
    gateway: {
      ...cfg.gateway,
      mode: "remote",
      remote: {
        url,
        ...(token !== undefined ? { token } : {}),
        ...(password !== undefined ? { password } : {}),
        ...(pinnedDiscoveryFingerprint ? { tlsFingerprint: pinnedDiscoveryFingerprint } : {}),
      },
    },
  };
}
