import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
import type { PluginRuntime } from "openclaw/plugin-sdk/core";

export interface OKRuntime extends PluginRuntime {
  stopWebhook?: () => void;
}

const { setRuntime: setOKRuntime, getRuntime: getOKRuntime } =
  createPluginRuntimeStore<OKRuntime>({
    pluginId: "odnoklassniki",
    errorMessage: "OK Messenger runtime not initialized",
  });
export { getOKRuntime, setOKRuntime };
