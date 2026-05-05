import type { OpenClawConfig } from "openclaw/plugin-sdk/config-types";
import { DEFAULT_ACCOUNT_ID } from "openclaw/plugin-sdk/account-id";
import { resolveVKTeamsAccount } from "./accounts.js";
import { getVTEvents, type VTEvent } from "./send.js";

export interface VTInboundMessage {
  id: string; chatId: string; userId: string; text: string;
  senderName?: string; timestamp: number; chatType: "dm"|"group";
}
export type VTMessageHandler = (msg: VTInboundMessage) => Promise<void>;

export async function startVTMonitor(opts: {
  cfg: OpenClawConfig; accountId: string; handler: VTMessageHandler;
  verbose?: boolean;
}): Promise<() => void> {
  const a = resolveVKTeamsAccount({ cfg: opts.cfg, accountId: opts.accountId ?? DEFAULT_ACCOUNT_ID });
  const t = a.token?.trim() || process.env.VKTEAMS_BOT_TOKEN?.trim();
  if (!t) throw new Error("VK Teams token not configured");

  let shouldStop = false; let lastEventId = 0; let delay = 1000;
  const log = opts.verbose ? console.log : () => {};

  async function poll() {
    while (!shouldStop) {
      try {
        const { events } = await getVTEvents(opts.cfg, opts.accountId, lastEventId, 30);
        delay = 1000;
        for (const ev of events) {
          if (shouldStop) break;
          lastEventId = Math.max(lastEventId, ev.eventId);
          if (ev.type !== "newMessage") continue;

          const p = ev.payload;

          // Skip bot's own messages (echo prevention)
          if (p.from?.isBot) continue;

          const text = p.text?.trim();
          if (!text) continue;

          // Use chat.type for DM/group detection (Official SDK enum: private/group/channel)
          const chatType: "dm" | "group" =
            p.chat?.type === "private" ? "dm" : "group";

          const chatId = p.chat?.chatId ?? "unknown";
          const userId = p.from?.userId ?? "unknown";

          const inbound: VTInboundMessage = {
            id: p.msgId ?? String(ev.eventId),
            chatId,
            userId,
            text,
            senderName: p.from
              ? `${p.from.firstName ?? ""} ${p.from.lastName ?? ""}`.trim() || p.from.nick || undefined
              : undefined,
            timestamp: p.timestamp ?? Date.now(),
            chatType,
          };
          await opts.handler(inbound);
        }
      } catch (err) {
        log(`[vkteams] Poll error: ${err instanceof Error ? err.message : String(err)}`);
        await sleep(delay); delay = Math.min(delay * 2, 30000);
      }
    }
  }
  poll();
  return () => { shouldStop = true; };
}
function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }
