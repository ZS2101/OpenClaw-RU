import type { PluginRuntime } from "openclaw/plugin-sdk/core";
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";

export interface VKTeamsRuntime extends PluginRuntime {
  stopPolling?: () => void;
}

const store = createPluginRuntimeStore<VKTeamsRuntime>({
  pluginId: "vkteams",
  errorMessage: "VK Teams runtime not initialized",
});

export const getVKTeamsRuntime = store.getRuntime;
export const setVKTeamsRuntime = store.setRuntime;
