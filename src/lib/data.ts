import raw from "@/data/life_receipts_2017.json";
import type { Item, Receipt } from "@/types";

/** Parse once, drop anything unparseable, sort chronologically. */
export const items: Item[] = (raw as unknown as Receipt[])
  .map((r) => {
    const date = new Date(r.timestamp);
    return { ...r, tags: r.tags ?? [], date, dayKey: r.timestamp.slice(0, 10) } as Item;
  })
  .filter((r) => !Number.isNaN(r.date.getTime()))
  .sort((a, b) => a.date.getTime() - b.date.getTime());

export const byDay = new Map<string, Item[]>();
for (const it of items) {
  const list = byDay.get(it.dayKey);
  if (list) list.push(it);
  else byDay.set(it.dayKey, [it]);
}

export const YEAR = items[0]?.date.getFullYear() ?? 2017;
