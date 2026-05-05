import { defineBundledChannelEntry } from "openclaw/plugin-sdk/channel-entry-contract";

export default defineBundledChannelEntry({
  id: "yandex",
  name: "Yandex Messenger",
  description: "Плагин канала Яндекс Мессенджер",
  importMetaUrl: import.meta.url,
  plugin: {
    specifier: "./channel-plugin-api.js",
    exportName: "yandexPlugin",
  },
});
