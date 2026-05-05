import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
import type { PluginRuntime } from "openclaw/plugin-sdk/core";

export interface YandexRuntime extends PluginRuntime {
  stopWebhook?: () => void;
}

const { setRuntime: setYandexRuntime, getRuntime: getYandexRuntime } =
  createPluginRuntimeStore<YandexRuntime>({
    pluginId: "yandex",
    errorMessage: "Yandex Messenger runtime not initialized",
  });
export { getYandexRuntime, setYandexRuntime };
