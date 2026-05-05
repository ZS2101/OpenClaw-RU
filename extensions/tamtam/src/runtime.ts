import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
import type { PluginRuntime } from "openclaw/plugin-sdk/core";

export interface TamtamRuntime extends PluginRuntime {
  stopPolling?: () => void;
}

const { setRuntime: setTamtamRuntime, getRuntime: getTamtamRuntime } =
  createPluginRuntimeStore<TamtamRuntime>({
    pluginId: "tamtam",
    errorMessage: "TamTam runtime not initialized",
  });
export { getTamtamRuntime, setTamtamRuntime };
