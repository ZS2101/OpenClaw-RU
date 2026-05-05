import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";

const { setRuntime: setTamtamRuntime, getRuntime: getTamtamRuntime } =
  createPluginRuntimeStore({ pluginId: "tamtam", errorMessage: "TamTam runtime not initialized" });
export { getTamtamRuntime, setTamtamRuntime };
