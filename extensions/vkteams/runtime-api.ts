import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
const s = createPluginRuntimeStore({ pluginId: "vkteams", errorMessage: "VK Teams runtime not initialized" });
export const getVKTeamsRuntime = s.getRuntime;
export const setVKTeamsRuntime = s.setRuntime;
