import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";

const { setRuntime: setVkRuntime, getRuntime: getVkRuntime } =
  createPluginRuntimeStore({
    pluginId: "vk",
    errorMessage: "VK runtime not initialized",
  });
export { getVkRuntime, setVkRuntime };
