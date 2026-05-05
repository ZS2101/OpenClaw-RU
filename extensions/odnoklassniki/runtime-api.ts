import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";

const { setRuntime: setOKRuntime, getRuntime: getOKRuntime } =
  createPluginRuntimeStore({
    pluginId: "odnoklassniki",
    errorMessage: "OK Messenger runtime not initialized",
  });
export { getOKRuntime, setOKRuntime };
