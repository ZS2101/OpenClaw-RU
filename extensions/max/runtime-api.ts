import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";

const { setRuntime: setMAXRuntime, getRuntime: getMAXRuntime } =
  createPluginRuntimeStore({ pluginId: "max", errorMessage: "MAX runtime not initialized" });
export { getMAXRuntime, setMAXRuntime };
