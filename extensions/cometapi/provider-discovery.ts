import { createProviderDiscoveryEntry } from "openclaw/plugin-sdk/provider-discovery-shared";
import manifest from "./openclaw.plugin.json" with { type: "json" };
export default createProviderDiscoveryEntry(manifest);
