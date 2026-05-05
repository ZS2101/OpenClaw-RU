import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";

const { setRuntime: setYandexRuntime, getRuntime: getYandexRuntime } =
  createPluginRuntimeStore({
    pluginId: "yandex",
    errorMessage: "Yandex Messenger runtime not initialized",
  });
export { getYandexRuntime, setYandexRuntime };
