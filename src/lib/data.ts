import raw from "@/data/life_receipts_2017.json";
import type { Item } from "@/types";
import { parseReceipts } from "./validation";

/** Validate at the boundary, parse dates once, sort chronologically. */
const { receipts, rejected } = parseReceipts(raw);
if (rejected > 0 && import.meta.env.DEV) {
  console.warn(`[data] skipped ${rejected} malformed record(s) — run \`npm run check-data\``);
}

export const items: Item[] = receipts
  .map((r): Item => ({ ...r, date: new Date(r.timestamp), dayKey: r.timestamp.slice(0, 10) }))
  .sort((a, b) => a.date.getTime() - b.date.getTime());

export const byDay = new Map<string, Item[]>();
for (const it of items) {
  const list = byDay.get(it.dayKey);
  if (list) list.push(it);
  else byDay.set(it.dayKey, [it]);
}

export const YEAR = items[0]?.date.getFullYear() ?? 2017;
