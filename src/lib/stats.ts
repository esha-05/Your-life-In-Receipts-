import type { Item, ReceiptType } from "@/types";
import { TYPE_ORDER } from "./meta";
import { categoryOf, isSpend } from "./finance";

export interface Stats {
  total: number;
  byType: Record<ReceiptType, number>;
  monthly: Array<{ month: number } & Record<ReceiptType, number>>;
  hourly: number[];
  weekday: number[];
  spend: number;
  spendByCategory: Array<{ name: string; value: number }>;
  topArtists: Array<{ name: string; value: number }>;
  topTags: Array<{ name: string; value: number }>;
  listeningHours: number;
  busiestDay: { key: string; count: number } | null;
  busiestMonth: number;
  dayCounts: Map<string, number>;
}

const zero = () => Object.fromEntries(TYPE_ORDER.map((t) => [t, 0])) as Record<ReceiptType, number>;
const top = (m: Map<string, number>, n: number) =>
  [...m].sort((a, b) => b[1] - a[1]).slice(0, n).map(([name, value]) => ({ name, value }));
const inc = (m: Map<string, number>, k: string, by = 1) => m.set(k, (m.get(k) ?? 0) + by);

export function computeStats(items: Item[]): Stats {
  const byType = zero();
  const monthly = Array.from({ length: 12 }, (_, month) => ({ month, ...zero() }));
  const hourly = new Array(24).fill(0);
  const weekday = new Array(7).fill(0);
  const cats = new Map<string, number>();
  const artists = new Map<string, number>();
  const tags = new Map<string, number>();
  const dayCounts = new Map<string, number>();
  let spend = 0, ms = 0;

  for (const it of items) {
    byType[it.type]++;
    monthly[it.date.getMonth()][it.type]++;
    hourly[it.date.getHours()]++;
    weekday[it.date.getDay()]++;
    inc(dayCounts, it.dayKey);
    for (const t of it.tags) inc(tags, t);
    if (isSpend(it)) {
      spend += it.amount ?? 0;
      inc(cats, categoryOf(it), it.amount ?? 0);
    }
    if (it.type === "music") {
      ms += it.msPlayed ?? 0;
      inc(artists, it.subtitle);
    }
  }

  const busiest = [...dayCounts].sort((a, b) => b[1] - a[1])[0];
  const monthTotals = monthly.map((m) => TYPE_ORDER.reduce((s, t) => s + m[t], 0));

  return {
    total: items.length,
    byType, monthly, hourly, weekday, spend,
    spendByCategory: top(cats, 6),
    topArtists: top(artists, 6),
    topTags: top(tags, 12),
    listeningHours: Math.round(ms / 3600e3),
    busiestDay: busiest ? { key: busiest[0], count: busiest[1] } : null,
    busiestMonth: monthTotals.indexOf(Math.max(...monthTotals)),
    dayCounts,
  };
}
