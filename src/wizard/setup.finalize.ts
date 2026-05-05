import fs from "node:fs/promises";
import path from "node:path";
import { describeCodexNativeWebSearch } from "../agents/codex-native-web-search.shared.js";
import { DEFAULT_BOOTSTRAP_FILENAME } from "../agents/workspace.js";
import { formatCliCommand } from "../cli/command-format.js";
import {
  buildGatewayInstallPlan,
  gatewayInstallErrorHint,
} from "../commands/daemon-install-helpers.js";
import {
  DEFAULT_GATEWAY_DAEMON_RUNTIME,
  GATEWAY_DAEMON_RUNTIME_OPTIONS,
} from "../commands/daemon-runtime.js";
import { resolveGatewayInstallToken } from "../commands/gateway-install-token.js";
import { formatHealthCheckFailure } from "../commands/health-format.js";
import { healthCommand } from "../commands/health.js";
import {
  detectBrowserOpenSupport,
  formatControlUiSshHint,
  openUrl,
  probeGatewayReachable,
  waitForGatewayReachable,
  resolveControlUiLinks,
} from "../commands/onboard-helpers.js";
import type { OnboardOptions } from "../commands/onboard-types.js";
import type { OpenClawConfig } from "../config/types.openclaw.js";
import { describeGatewayServiceRestart, resolveGatewayService } from "../daemon/service.js";
import { isSystemdUserServiceAvailable } from "../daemon/systemd.js";
import { ensureControlUiAssetsBuilt } from "../infra/control-ui-assets.js";
import { formatErrorMessage } from "../infra/errors.js";
import type { RuntimeEnv } from "../runtime.js";
import { restoreTerminalState } from "../terminal/restore.js";
import { runTui } from "../tui/tui.js";
import { resolveUserPath } from "../utils.js";
import { listConfiguredWebSearchProviders } from "../web-search/runtime.js";
import type { WizardPrompter } from "./prompts.js";
import { setupWizardShellCompletion } from "./setup.completion.js";
import { resolveSetupSecretInputString } from "./setup.secret-input.js";
import type { GatewayWizardSettings, WizardFlow } from "./setup.types.js";

type FinalizeOnboardingOptions = {
  flow: WizardFlow;
  opts: OnboardOptions;
  baseConfig: OpenClawConfig;
  nextConfig: OpenClawConfig;
  workspaceDir: string;
  settings: GatewayWizardSettings;
  prompter: WizardPrompter;
  runtime: RuntimeEnv;
};

export async function finalizeSetupWizard(
  options: FinalizeOnboardingOptions,
): Promise<{ launchedTui: boolean }> {
  const { flow, opts, baseConfig, nextConfig, settings, prompter, runtime } = options;
  let gatewayProbe: { ok: boolean; detail?: string } = { ok: true };

  const withWizardProgress = async <T>(
    label: string,
    options: { doneMessage?: string | (() => string | undefined) },
    work: (progress: { update: (message: string) => void }) => Promise<T>,
  ): Promise<T> => {
    const progress = prompter.progress(label);
    try {
      return await work(progress);
    } finally {
      progress.stop(
        typeof options.doneMessage === "function" ? options.doneMessage() : options.doneMessage,
      );
    }
  };

  const systemdAvailable =
    process.platform === "linux" ? await isSystemdUserServiceAvailable() : true;
  if (process.platform === "linux" && !systemdAvailable) {
    await prompter.note(
      "Пользовательские службы systemd недоступны. Пропускаем проверку lingering и установку службы.",
      "Systemd",
    );
  }

  if (process.platform === "linux" && systemdAvailable) {
    const { ensureSystemdUserLingerInteractive } = await import("../commands/systemd-linger.js");
    await ensureSystemdUserLingerInteractive({
      runtime,
      prompter: {
        confirm: prompter.confirm,
        note: prompter.note,
      },
      reason:
        "Установки на Linux по умолчанию используют пользовательскую службу systemd. Без включенного lingering, systemd останавливает сессию пользователя при выходе/простое и убивает Шлюз.",
      requireConfirm: false,
    });
  }

  const explicitInstallDaemon =
    typeof opts.installDaemon === "boolean" ? opts.installDaemon : undefined;
  let installDaemon: boolean;
  if (explicitInstallDaemon !== undefined) {
    installDaemon = explicitInstallDaemon;
  } else if (process.platform === "linux" && !systemdAvailable) {
    installDaemon = false;
  } else if (flow === "quickstart") {
    installDaemon = true;
  } else {
    installDaemon = await prompter.confirm({
      message: "Установить службу шлюза (рекомендуется)",
      initialValue: true,
    });
  }

  if (process.platform === "linux" && !systemdAvailable && installDaemon) {
    await prompter.note(
      "Systemd user services are unavailable; skipping service install. Use your container supervisor or `docker compose up -d`.",
      "Служба шлюза",
    );
    installDaemon = false;
  }

  if (installDaemon) {
    const daemonRuntime =
      flow === "quickstart"
        ? DEFAULT_GATEWAY_DAEMON_RUNTIME
        : await prompter.select({
            message: "Среда выполнения службы шлюза",
            options: GATEWAY_DAEMON_RUNTIME_OPTIONS,
            initialValue: opts.daemonRuntime ?? DEFAULT_GATEWAY_DAEMON_RUNTIME,
          });
    if (flow === "quickstart") {
      await prompter.note(
        "«Быстрый старт» использует Node для службы шлюза (стабильно + поддерживается).",
        "Среда выполнения службы шлюза",
      );
    }
    const service = resolveGatewayService();
    const loaded = await service.isLoaded({ env: process.env });
    let restartWasScheduled = false;
    if (loaded) {
      const action = await prompter.select({
        message: "Служба шлюза уже установлена",
        options: [
          { value: "restart", label: "Перезапустить" },
          { value: "reinstall", label: "Переустановить" },
          { value: "skip", label: "Пропустить" },
        ],
      });
      if (action === "restart") {
        let restartDoneMessage = "Служба шлюза перезапущена.";
        await withWizardProgress(
          "Служба шлюза",
          { doneMessage: () => restartDoneMessage },
          async (progress) => {
            progress.update("Перезапуск службы шлюза...");
            const restartResult = await service.restart({
              env: process.env,
              stdout: process.stdout,
            });
            const restartStatus = describeGatewayServiceRestart("Шлюз", restartResult);
            restartDoneMessage = restartStatus.progressMessage;
            restartWasScheduled = restartStatus.scheduled;
          },
        );
      } else if (action === "reinstall") {
        await withWizardProgress(
          "Служба шлюза",
          { doneMessage: "Служба шлюза удалена." },
          async (progress) => {
            progress.update("Удаление службы шлюза...");
            await service.uninstall({ env: process.env, stdout: process.stdout });
          },
        );
      }
    }

    if (
      !loaded ||
      (!restartWasScheduled && loaded && !(await service.isLoaded({ env: process.env })))
    ) {
      const progress = prompter.progress("Служба шлюза");
      let installError: string | null = null;
      try {
        progress.update("Подготовка службы шлюза...");
        const tokenResolution = await resolveGatewayInstallToken({
          config: nextConfig,
          env: process.env,
        });
        for (const warning of tokenResolution.warnings) {
          await prompter.note(warning, "Служба шлюза");
        }
        if (tokenResolution.unavailableReason) {
          installError = [
            "Установка шлюза заблокирована:",
            tokenResolution.unavailableReason,
            "Исправьте конфиг авторизации / токен шлюза и перезапустите настройку.",
          ].join(" ");
        } else {
          const { programArguments, workingDirectory, environment } = await buildGatewayInstallPlan(
            {
              env: process.env,
              port: settings.port,
              runtime: daemonRuntime,
              warn: (message, title) => prompter.note(message, title),
              config: nextConfig,
            },
          );

          progress.update("Установка службы шлюза...");
          await service.install({
            env: process.env,
            stdout: process.stdout,
            programArguments,
            workingDirectory,
            environment,
          });
        }
      } catch (err) {
        installError = formatErrorMessage(err);
      } finally {
        progress.stop(
          installError ? "Ошибка установки службы шлюза." : "Служба шлюза установлена.",
        );
      }
      if (installError) {
        await prompter.note(`Gateway service install failed: ${installError}`, "Шлюз");
        await prompter.note(gatewayInstallErrorHint(), "Шлюз");
      }
    }
  }

  if (!opts.skipHealth) {
    const probeLinks = resolveControlUiLinks({
      bind: nextConfig.gateway?.bind ?? "loopback",
      port: settings.port,
      customBindHost: nextConfig.gateway?.customBindHost,
      basePath: undefined,
    });
    // Daemon install/restart can briefly flap the WS; wait a bit so health check doesn't false-fail.
    gatewayProbe = await waitForGatewayReachable({
      url: probeLinks.wsUrl,
      token: settings.gatewayToken,
      deadlineMs: 15_000,
    });
    if (gatewayProbe.ok) {
      try {
        await healthCommand({ json: false, timeoutMs: 10_000 }, runtime);
      } catch (err) {
        runtime.error(formatHealthCheckFailure(err));
        await prompter.note(
          [
            "Docs:",
            "https://docs.openclaw.ai/gateway/health",
            "https://docs.openclaw.ai/gateway/troubleshooting",
          ].join("\n"),
          "Справка по проверке статуса (Health check)",
        );
      }
    } else if (installDaemon) {
      runtime.error(
        formatHealthCheckFailure(
          new Error(
            gatewayProbe.detail ?? `gateway did not become reachable at ${probeLinks.wsUrl}`,
          ),
        ),
      );
      await prompter.note(
        [
          "Docs:",
          "https://docs.openclaw.ai/gateway/health",
          "https://docs.openclaw.ai/gateway/troubleshooting",
        ].join("\n"),
        "Справка по проверке статуса (Health check)",
      );
    } else {
      await prompter.note(
        [
          "Шлюз пока не обнаружен.",
          "Настройка запущена без установки службы шлюза, поэтому фоновый шлюз не ожидается.",
          `Start now: ${formatCliCommand("openclaw gateway run")}`,
          `Or rerun with: ${formatCliCommand("openclaw onboard --install-daemon")}`,
          `Or skip this probe next time: ${formatCliCommand("openclaw onboard --skip-health")}`,
        ].join("\n"),
        "Шлюз",
      );
    }
  }

  const controlUiEnabled =
    nextConfig.gateway?.controlUi?.enabled ?? baseConfig.gateway?.controlUi?.enabled ?? true;
  if (!opts.skipUi && controlUiEnabled) {
    const controlUiAssets = await ensureControlUiAssetsBuilt(runtime);
    if (!controlUiAssets.ok && controlUiAssets.message) {
      runtime.error(controlUiAssets.message);
    }
  }

  await prompter.note(
    [
      "Добавьте узлы (nodes) для дополнительных функций:",
      "- macOS app (system + notifications)",
      "- iOS app (camera/canvas)",
      "- Android app (camera/canvas)",
    ].join("\n"),
    "Дополнительные приложения",
  );

  const controlUiBasePath =
    nextConfig.gateway?.controlUi?.basePath ?? baseConfig.gateway?.controlUi?.basePath;
  const links = resolveControlUiLinks({
    bind: settings.bind,
    port: settings.port,
    customBindHost: settings.customBindHost,
    basePath: controlUiBasePath,
  });
  const authedUrl =
    settings.authMode === "token" && settings.gatewayToken
      ? `${links.httpUrl}#token=${encodeURIComponent(settings.gatewayToken)}`
      : links.httpUrl;
  let resolvedGatewayPassword = "";
  if (settings.authMode === "password") {
    try {
      resolvedGatewayPassword =
        (await resolveSetupSecretInputString({
          config: nextConfig,
          value: nextConfig.gateway?.auth?.password,
          path: "gateway.auth.password",
          env: process.env,
        })) ?? "";
    } catch (error) {
      await prompter.note(
        [
          "Could not resolve gateway.auth.password SecretRef for setup auth.",
          formatErrorMessage(error),
        ].join("\n"),
        "Авторизация шлюза",
      );
    }
  }

  if (opts.skipHealth || !gatewayProbe.ok) {
    gatewayProbe = await probeGatewayReachable({
      url: links.wsUrl,
      token: settings.authMode === "token" ? settings.gatewayToken : undefined,
      password: settings.authMode === "password" ? resolvedGatewayPassword : "",
    });
  }
  const gatewayStatusLine = gatewayProbe.ok
    ? "Шлюз: доступен"
    : `Gateway: not detected${gatewayProbe.detail ? ` (${gatewayProbe.detail})` : ""}`;
  const bootstrapPath = path.join(
    resolveUserPath(options.workspaceDir),
    DEFAULT_BOOTSTRAP_FILENAME,
  );
  const hasBootstrap = await fs
    .access(bootstrapPath)
    .then(() => true)
    .catch(() => false);

  await prompter.note(
    [
      `Web UI: ${links.httpUrl}`,
      settings.authMode === "token" && settings.gatewayToken
        ? `Web UI (with token): ${authedUrl}`
        : undefined,
      `Gateway WS: ${links.wsUrl}`,
      gatewayStatusLine,
      "Docs: https://docs.openclaw.ai/web/control-ui",
    ]
      .filter(Boolean)
      .join("\n"),
    "Интерфейс управления",
  );

  let controlUiOpened = false;
  let controlUiOpenHint: string | undefined;
  let seededInBackground = false;
  let hatchChoice: "tui" | "web" | "later" | null = null;
  let launchedTui = false;

  if (!opts.skipUi && gatewayProbe.ok) {
    if (hasBootstrap) {
      await prompter.note(
        [
          "Это ключевой момент настройки, который делает вашего агента отражением вас самих.",
          "Пожалуйста, не торопитесь.",
          "Чем больше вы ему расскажете, тем лучше будет результат.",
          'Мы отправим: «Просыпайся, дружище!»',
        ].join("\n"),
        "Запустить TUI (лучший вариант!)",
      );
    }

    await prompter.note(
      [
        "Токен шлюза: общий ключ авторизации для Шлюза и Control UI.",
        "Stored in: $OPENCLAW_CONFIG_PATH (default: ~/.openclaw/openclaw.json) under gateway.auth.token, or in OPENCLAW_GATEWAY_TOKEN.",
        `View token: ${formatCliCommand("openclaw config get gateway.auth.token")}`,
        `Generate token: ${formatCliCommand("openclaw doctor --generate-gateway-token")}`,
        "Web UI keeps dashboard URL tokens in memory for the current tab and strips them from the URL after load.",
        `Open the dashboard anytime: ${formatCliCommand("openclaw dashboard --no-open")}`,
        "Если появится запрос: вставьте токен в настройки Control UI (или используйте URL дашборда с токеном).",
      ].join("\n"),
      "Токен",
    );

    hatchChoice = await prompter.select({
      message: "Как вы хотите запустить бота?",
      options: [
        { value: "tui", label: "Запустить в TUI (рекомендуется)" },
        { value: "web", label: "Открыть Web UI" },
        { value: "later", label: "Сделать это позже" },
      ],
      initialValue: "tui",
    });

    if (hatchChoice === "tui") {
      restoreTerminalState("pre-setup tui", { resumeStdinIfPaused: true });
      await runTui({
        url: links.wsUrl,
        token: settings.authMode === "token" ? settings.gatewayToken : undefined,
        password: settings.authMode === "password" ? resolvedGatewayPassword : "",
        // Safety: setup TUI should not auto-deliver to lastProvider/lastTo.
        deliver: false,
        message: hasBootstrap ? "Просыпайся, дружище!" : undefined,
      });
      launchedTui = true;
    } else if (hatchChoice === "web") {
      const browserSupport = await detectBrowserOpenSupport();
      if (browserSupport.ok) {
        controlUiOpened = await openUrl(authedUrl);
        if (!controlUiOpened) {
          controlUiOpenHint = formatControlUiSshHint({
            port: settings.port,
            basePath: controlUiBasePath,
            token: settings.authMode === "token" ? settings.gatewayToken : undefined,
          });
        }
      } else {
        controlUiOpenHint = formatControlUiSshHint({
          port: settings.port,
          basePath: controlUiBasePath,
          token: settings.authMode === "token" ? settings.gatewayToken : undefined,
        });
      }
      await prompter.note(
        [
          `Dashboard link (with token): ${authedUrl}`,
          controlUiOpened
            ? "Открыто в браузере. Не закрывайте эту вкладку для управления OpenClaw."
            : "Скопируйте и вставьте этот URL в браузер на этом компьютере, чтобы управлять OpenClaw.",
          controlUiOpenHint,
        ]
          .filter(Boolean)
          .join("\n"),
        "Дашборд готов",
      );
    } else {
      await prompter.note(
        `When you're ready: ${formatCliCommand("openclaw dashboard --no-open")}`,
        "Позже",
      );
    }
  } else if (opts.skipUi) {
    await prompter.note("Пропуск настройки Control UI / TUI.", "Интерфейс управления");
  }

  await prompter.note(
    [
      "Сделайте бэкап воркспейса вашего агента.",
      "Документация: https://docs.openclaw.ai/concepts/agent-workspace",
    ].join("\n"),
    "Бэкап воркспейса",
  );

  await prompter.note(
    "Запуск агентов на вашем компьютере несет риски — обезопасьте свою конфигурацию: https://docs.openclaw.ai/security",
    "Безопасность",
  );

  await setupWizardShellCompletion({ flow, prompter });

  const shouldOpenControlUi =
    !opts.skipUi &&
    gatewayProbe.ok &&
    settings.authMode === "token" &&
    Boolean(settings.gatewayToken) &&
    hatchChoice === null;
  if (shouldOpenControlUi) {
    const browserSupport = await detectBrowserOpenSupport();
    if (browserSupport.ok) {
      controlUiOpened = await openUrl(authedUrl);
      if (!controlUiOpened) {
        controlUiOpenHint = formatControlUiSshHint({
          port: settings.port,
          basePath: controlUiBasePath,
          token: settings.gatewayToken,
        });
      }
    } else {
      controlUiOpenHint = formatControlUiSshHint({
        port: settings.port,
        basePath: controlUiBasePath,
        token: settings.gatewayToken,
      });
    }

    await prompter.note(
      [
        `Dashboard link (with token): ${authedUrl}`,
        controlUiOpened
          ? "Открыто в браузере. Не закрывайте эту вкладку для управления OpenClaw."
          : "Скопируйте и вставьте этот URL в браузер на этом компьютере, чтобы управлять OpenClaw.",
        controlUiOpenHint,
      ]
        .filter(Boolean)
        .join("\n"),
      "Дашборд готов",
    );
  }

  const codexNativeSummary = describeCodexNativeWebSearch(nextConfig);
  const webSearchProvider = nextConfig.tools?.web?.search?.provider;
  const webSearchEnabled = nextConfig.tools?.web?.search?.enabled;
  const configuredSearchProviders = listConfiguredWebSearchProviders({ config: nextConfig });
  if (webSearchProvider) {
    const { resolveExistingKey, hasExistingKey, hasKeyInEnv } =
      await import("../commands/onboard-search.js");
    const entry = configuredSearchProviders.find((e) => e.id === webSearchProvider);
    const label = entry?.label ?? webSearchProvider;
    const storedKey = entry ? resolveExistingKey(nextConfig, webSearchProvider) : undefined;
    const keyConfigured = entry ? hasExistingKey(nextConfig, webSearchProvider) : false;
    const envAvailable = entry ? hasKeyInEnv(entry) : false;
    const hasKey = keyConfigured || envAvailable;
    const keySource = storedKey
      ? "API-ключ: сохранен в конфиге."
      : keyConfigured
        ? "API-ключ: настроен через ссылку на секрет (secret reference)."
        : envAvailable
          ? `API key: provided via ${entry?.envVars.join(" / ")} env var.`
          : undefined;
    if (!entry) {
      await prompter.note(
        [
          `Web search provider ${label} is selected but unavailable under the current plugin policy.`,
          "web_search will not work until the provider is re-enabled or a different provider is selected.",
          `  ${formatCliCommand("openclaw configure --section web")}`,
          "",
          "Документация: https://docs.openclaw.ai/tools/web",
        ].join("\n"),
        "Веб-поиск",
      );
    } else if (webSearchEnabled !== false && hasKey) {
      await prompter.note(
        [
          "Веб-поиск включен, поэтому ваш агент сможет искать информацию в интернете при необходимости.",
          "",
          `Provider: ${label}`,
          ...(keySource ? [keySource] : []),
          "Документация: https://docs.openclaw.ai/tools/web",
        ].join("\n"),
        "Веб-поиск",
      );
    } else if (!hasKey) {
      await prompter.note(
        [
          `Provider ${label} is selected but no API key was found.`,
          "web_search will not work until a key is added.",
          `  ${formatCliCommand("openclaw configure --section web")}`,
          "",
          `Get your key at: ${entry?.signupUrl ?? "https://docs.openclaw.ai/tools/web"}`,
          "Документация: https://docs.openclaw.ai/tools/web",
        ].join("\n"),
        "Веб-поиск",
      );
    } else {
      await prompter.note(
        [
          `Web search (${label}) is configured but disabled.`,
          `Re-enable: ${formatCliCommand("openclaw configure --section web")}`,
          "",
          "Документация: https://docs.openclaw.ai/tools/web",
        ].join("\n"),
        "Веб-поиск",
      );
    }
  } else {
    // Legacy configs may have a working key (e.g. apiKey or BRAVE_API_KEY) without
    // an explicit provider. Runtime auto-detects these, so avoid saying "skipped".
    const { hasExistingKey, hasKeyInEnv } = await import("../commands/onboard-search.js");
    const legacyDetected = configuredSearchProviders.find(
      (e) => hasExistingKey(nextConfig, e.id) || hasKeyInEnv(e),
    );
    if (legacyDetected) {
      await prompter.note(
        [
          `Web search is available via ${legacyDetected.label} (auto-detected).`,
          "Документация: https://docs.openclaw.ai/tools/web",
        ].join("\n"),
        "Веб-поиск",
      );
    } else if (codexNativeSummary) {
      await prompter.note(
        [
          "Провайдер управляемого веб-поиска был пропущен.",
          codexNativeSummary,
          "Документация: https://docs.openclaw.ai/tools/web",
        ].join("\n"),
        "Веб-поиск",
      );
    } else {
      await prompter.note(
        [
          "Веб-поиск пропущен. Вы можете включить его позже:",
          `  ${formatCliCommand("openclaw configure --section web")}`,
          "",
          "Документация: https://docs.openclaw.ai/tools/web",
        ].join("\n"),
        "Веб-поиск",
      );
    }
  }

  if (codexNativeSummary) {
    await prompter.note(
      [
        codexNativeSummary,
        "Используется только для моделей с поддержкой Codex.",
        "Документация: https://docs.openclaw.ai/tools/web",
      ].join("\n"),
      "Нативный поиск Codex",
    );
  }

  await prompter.note(
    'Что дальше: https://openclaw.ai/showcase ("Что люди создают").',
    "Что дальше?",
  );

  await prompter.outro(
    controlUiOpened
      ? "Настройка завершена. Дашборд открыт; не закрывайте эту вкладку для управления OpenClaw."
      : seededInBackground
        ? "Настройка завершена. Web UI запущен в фоновом режиме; вы можете открыть его в любой момент по ссылке на дашборд выше."
        : "Настройка завершена. Используйте ссылку на дашборд выше для управления OpenClaw.",
  );

  return { launchedTui };
}
