import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
import type { PluginRuntime } from "openclaw/plugin-sdk/core";

export interface MAXRuntime extends PluginRuntime { stopWebhook?: () => void; }

const { setRuntime: setMAXRuntime, getRuntime: getMAXRuntime } =
  createPluginRuntimeStore<MAXRuntime>({ pluginId: "max", errorMessage: "MAX runtime not initialized" });
export { getMAXRuntime, setMAXRuntime };
