import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
import type { PluginRuntime } from "openclaw/plugin-sdk/core";

export interface VkRuntime extends PluginRuntime {
  /** Stop the Long Poll loop */
  stopPolling?: () => void;
}

const { setRuntime: setVkRuntime, getRuntime: getVkRuntime } =
  createPluginRuntimeStore<VkRuntime>({
    pluginId: "vk",
    errorMessage: "VK runtime not initialized",
  });
export { getVkRuntime, setVkRuntime };
