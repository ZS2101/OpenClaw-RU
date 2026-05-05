import { defineBundledChannelEntry } from "openclaw/plugin-sdk/channel-entry-contract";

export default defineBundledChannelEntry({
  id: "odnoklassniki",
  name: "Odnoklassniki",
  description: "Плагин канала Одноклассники",
  importMetaUrl: import.meta.url,
  plugin: {
    specifier: "./channel-plugin-api.js",
    exportName: "okPlugin",
  },
});
