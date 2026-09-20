import { CalendarDays, Flame, MapPin, Moon, PartyPopper, Repeat, Search, Zap, type LucideIcon } from "lucide-react";
import type { Item, ReceiptType } from "@/types";
   import { categoryOf, isSpend } from "./finance";
import { fmtShortDay, money, monthLong, monthShort, partOfDay } from "./format";
import { HIDDEN_TAGS, MARKER_TAGS, WEEKDAYS, pct, spread, themeLabel } from "./themes";
import { TYPE_META } from "./meta";

export interface Finding {
  id: string;
  icon: LucideIcon;
  kicker: string;
  headline: string;
  detail: string;
  metric: { value: string; label: string };
  evidence: Item[];
  bars?: { labels: string[]; values: number[]; highlight: number; unit?: string };
}

const HOUR = 3600e3;
const median = (a: number[]) => { const s = [...a].sort((x, y) => x - y); return s[Math.floor(s.length / 2)]; };
const isLate = (d: Date) => d.getHours() >= 23 || d.getHours() < 5;
const dur = (h: number) => (h < 1 ? "under an hour" : h < 48 ? `${Math.round(h)} hours` : `${Math.round(h / 24)} days`);

/** 1 — do searches turn into purchases? */
function searchToPurchase(items: Item[]): Finding | null {
  const searches = items.filter((i) => i.type === "search");
  const purchases = items.filter((i) => i.type === "purchase");
  if (searches.length < 5) return null;
  const pairs: Array<{ s: Item; p: Item; lag: number; tag: string }> = [];
  for (const s of searches) {
    const shared = s.tags.filter((t) => !MARKER_TAGS.has(t) && !HIDDEN_TAGS.has(t));
    const p = purchases.find((x) => {
      const d = x.date.getTime() - s.date.getTime();
      return d > 0 && d <= 72 * HOUR && x.tags.some((t) => shared.includes(t));
    });
    if (p) pairs.push({ s, p, lag: (p.date.getTime() - s.date.getTime()) / HOUR, tag: shared.find((t) => p.tags.includes(t)) ?? "" });
  }
  if (pairs.length < 4) return null;
  const share = pct(pairs.length, searches.length);
  const med = median(pairs.map((x) => x.lag));
  const topTag = [...pairs.reduce((m, x) => m.set(x.tag, (m.get(x.tag) ?? 0) + 1), new Map<string, number>())].sort((a, b) => b[1] - a[1])[0]?.[0];
  const edges = [6, 12, 24, 48, 72];
  const buckets = edges.map((hi, i) => pairs.filter((x) => x.lag > (edges[i - 1] ?? 0) && x.lag <= hi).length);
  return {
    id: "search-to-purchase",
    icon: Search,
    kicker: "Search → Purchase",
    headline: share >= 100 ? "Every search you made ended in a purchase" : share >= 90 ? "Nearly every search you made ended in a purchase" : `${share}% of your searches ended in a purchase`,
    detail: `The gap between looking something up and paying for it is usually ${dur(med)}${topTag ? ` — most often for #${themeLabel(topTag)}` : ""}. You research first, then commit.`,
    metric: { value: dur(med), label: "typical wait" },
    evidence: spread(pairs, 3).flatMap((x) => [x.s, x.p]),
    bars: { labels: ["<6h", "6–12h", "12–24h", "1–2d", "2–3d"], values: buckets, highlight: buckets.indexOf(Math.max(...buckets)), unit: "pairs" },
  };
}

/** 2 — what surrounds celebrations? */
function beforeEvents(items: Item[]): Finding | null {
  const events = items.filter((i) => i.type === "event");
  if (events.length < 5) return null;
  const kinds: ReceiptType[] = ["message", "search", "purchase", "note"];
  const hits = new Map<ReceiptType, Array<{ e: Item; x: Item }>>(kinds.map((k) => [k, []]));
  for (const e of events) {
    for (const k of kinds) {
      const x = [...items].reverse().find((i) => i.type === k && i.date < e.date && e.date.getTime() - i.date.getTime() <= 48 * HOUR);
      if (x) hits.get(k)!.push({ e, x });
    }
  }
  const ranked = kinds.map((k) => ({ k, n: hits.get(k)!.length })).sort((a, b) => b.n - a.n);
  const top = ranked[0];
  if (pct(top.n, events.length) < 40) return null;
  const second = ranked[1];
  return {
    id: "before-events",
    icon: PartyPopper,
    kicker: "Before the big days",
    headline: "Celebrations never come out of nowhere",
    detail: `${top.n} of your ${events.length} events were preceded by a ${TYPE_META[top.k].label.toLowerCase()} in the 48 hours before${pct(second.n, events.length) >= 40 ? `, and ${second.n} by a ${TYPE_META[second.k].label.toLowerCase()}` : ""}. The build-up is part of the story.`,
    metric: { value: `${pct(top.n, events.length)}%`, label: `had a ${TYPE_META[top.k].label.toLowerCase()} first` },
    evidence: spread(hits.get(top.k)!, 3).flatMap((h) => [h.x, h.e]),
    bars: { labels: kinds.map((k) => TYPE_META[k].label), values: kinds.map((k) => pct(hits.get(k)!.length, events.length)), highlight: kinds.indexOf(top.k), unit: "%" },
  };
}

/** 3 — which weekday owns which theme? */
function weekdayLift(items: Item[]): Finding | null {
  const N = items.length;
  const perDay = new Array(7).fill(0);
  const tagTotal = new Map<string, number>();
  const cell = new Map<string, number>();
  for (const it of items) {
    const d = it.date.getDay();
    perDay[d]++;
    for (const t of it.tags) {
      if (MARKER_TAGS.has(t) || HIDDEN_TAGS.has(t)) continue;
      tagTotal.set(t, (tagTotal.get(t) ?? 0) + 1);
      cell.set(`${d}|${t}`, (cell.get(`${d}|${t}`) ?? 0) + 1);
    }
  }
  let best: { d: number; t: string; lift: number; n: number; score: number } | null = null;
  for (const [k, n] of cell) {
    const [ds, t] = k.split("|");
    const d = Number(ds);
    const total = tagTotal.get(t) ?? 0;
    if (total < 20 || n < 10) continue;
    const lift = (n / total) / (perDay[d] / N);
    const score = (lift - 1) * Math.sqrt(n);
    if (lift >= 1.35 && (!best || score > best.score)) best = { d, t, lift, n, score };
  }
  if (!best) return null;
  const { d, t, lift } = best;
  const total = tagTotal.get(t) ?? 0;
  const shares = WEEKDAYS.map((_, i) => pct(cell.get(`${i}|${t}`) ?? 0, total));
  const ev = items.filter((i) => i.date.getDay() === d && i.tags.includes(t));
  return {
    id: "weekday-theme",
    icon: CalendarDays,
    kicker: "Weekly rhythm",
    headline: `${WEEKDAYS[d]}s belong to #${themeLabel(t)}`,
    detail: `${pct(best.n, total)}% of everything tagged #${themeLabel(t)} lands on a ${WEEKDAYS[d]} — ${lift.toFixed(1)}× what an even week would give. It's a habit, not a coincidence.`,
    metric: { value: `${lift.toFixed(1)}×`, label: `more on ${WEEKDAYS[d]}s` },
    evidence: spread(ev, 4),
    bars: { labels: WEEKDAYS.map((w) => w.slice(0, 3)), values: shares, highlight: d, unit: "%" },
  };
}

/** 4 — the after-midnight soundtrack. */
function nightOwl(items: Item[]): Finding | null {
  const music = items.filter((i) => i.type === "music");
  if (music.length < 20) return null;
  const late = music.filter((m) => isLate(m.date));
  const overall = pct(late.length, music.length);
  if (overall < 8) return null;
  const monthly = Array.from({ length: 12 }, (_, m) => {
    const list = music.filter((x) => x.date.getMonth() === m);
    return { n: list.length, share: pct(list.filter((x) => isLate(x.date)).length, list.length) };
  });
  const peak = monthly.reduce((b, x, i) => (x.n >= 8 && x.share > (monthly[b].n >= 8 ? monthly[b].share : -1) ? i : b), 0);
  const artist = [...late.reduce((m, x) => m.set(x.subtitle, (m.get(x.subtitle) ?? 0) + 1), new Map<string, number>())].sort((a, b) => b[1] - a[1])[0]?.[0];
  return {
    id: "night-owl",
    icon: Moon,
    kicker: "After dark",
    headline: `${overall}% of your listening happens after 11 PM`,
    detail: `It peaked in ${monthLong(peak)} at ${monthly[peak].share}%.${artist ? ` ${artist} is your after-midnight soundtrack.` : ""}`,
    metric: { value: `${overall}%`, label: "of songs, late" },
    evidence: spread(late, 5),
    bars: { labels: monthly.map((_, i) => monthShort(i)), values: monthly.map((x) => x.share), highlight: peak, unit: "%" },
  };
}

/** 5 — the priciest month. */
function spendPeak(items: Item[]): Finding | null {
  const buys = items.filter(isSpend);
  if (buys.length < 12) return null;
  const monthly = new Array(12).fill(0);
  for (const b of buys) monthly[b.date.getMonth()] += b.amount ?? 0;
  const peak = monthly.indexOf(Math.max(...monthly));
  const others = monthly.filter((_, i) => i !== peak && monthly[i] > 0);
  const typical = others.length ? others.reduce((a, b) => a + b, 0) / others.length : 0;
  const inPeak = buys.filter((b) => b.date.getMonth() === peak);
  const cats = new Map<string, number>();
  for (const b of inPeak) {
     const c = categoryOf(b);
     cats.set(c, (cats.get(c) ?? 0) + (b.amount ?? 0));
   }
  const [cat, catSum] = [...cats].sort((a, b) => b[1] - a[1])[0] ?? ["", 0];
  return {
    id: "spend-peak",
    icon: Flame,
    kicker: "The expensive month",
    headline: `${monthLong(peak)} cost you the most`,
    detail: `${money(monthly[peak])}${typical ? ` — ${(monthly[peak] / typical).toFixed(1)}× a typical month` : ""}. ${cat} alone was ${pct(catSum, monthly[peak])}% of it.`,
    metric: { value: money(monthly[peak]), label: monthLong(peak) },
    evidence: [...inPeak].sort((a, b) => (b.amount ?? 0) - (a.amount ?? 0)).slice(0, 5),
    bars: { labels: monthly.map((_, i) => monthShort(i)), values: monthly.map((v) => Math.round(v / 1000)), highlight: peak, unit: "k ₹" },
  };
}

/** 6 — places you keep returning to. */
function repeatVisit(items: Item[]): Finding | null {
  const places = new Map<string, Item[]>();
  for (const i of items) if (i.type === "place") places.set(i.title, [...(places.get(i.title) ?? []), i]);
  const top = [...places].sort((a, b) => b[1].length - a[1].length)[0];
  if (!top || top[1].length < 5) return null;
  const [name, visits] = top;
  const part = [...visits.reduce((m, v) => m.set(partOfDay(v.date.getHours()), (m.get(partOfDay(v.date.getHours())) ?? 0) + 1), new Map<string, number>())].sort((a, b) => b[1] - a[1])[0][0];
  return {
    id: "repeat-place",
    icon: MapPin,
    kicker: "Gravity",
    headline: `You kept coming back to ${name}`,
    detail: `${visits.length} visits across the year, mostly in the ${part}. Some places quietly become part of the routine.`,
    metric: { value: String(visits.length), label: "visits" },
    evidence: spread(visits, 5),
  };
}

/** 7 — longest streak of days with something to show. */
   function streaks(items: Item[]): Finding | null {
     const byDay = new Map<string, Item[]>();
     for (const it of items) {
       const list = byDay.get(it.dayKey);
       if (list) list.push(it);
       else byDay.set(it.dayKey, [it]);
     }
     const keys = [...byDay.keys()].sort();
  if (keys.length < 10) return null;
  const day = (k: string) => Date.parse(`${k}T00:00:00Z`) / 86400000;
  let best = { len: 1, s: 0, e: 0 }, curS = 0, gap = { n: 0 };
  for (let i = 1; i <= keys.length; i++) {
    const cont = i < keys.length && day(keys[i]) - day(keys[i - 1]) === 1;
    if (!cont) {
      const len = i - curS;
      if (len > best.len) best = { len, s: curS, e: i - 1 };
      if (i < keys.length) gap.n = Math.max(gap.n, day(keys[i]) - day(keys[i - 1]) - 1);
      curS = i;
    }
  }
  if (best.len < 5) return null;
  const first = byDay.get(keys[best.s])!, last = byDay.get(keys[best.e])!;
  const d = (k: string) => fmtShortDay(new Date(`${k}T00:00:00`));
  return {
    id: "streak",
    icon: Zap,
    kicker: "Momentum",
    headline: `${best.len} days in a row with something to show`,
    detail: `From ${d(keys[best.s])} to ${d(keys[best.e])}, no day went silent. Your longest quiet spell was ${gap.n} days.`,
    metric: { value: String(best.len), label: "day streak" },
    evidence: [...first.slice(0, 2), ...last.slice(-2)],
  };
}

/** 8 — the song on repeat. */
function repeatSong(items: Item[]): Finding | null {
  const tracks = new Map<string, Item[]>();
  for (const i of items) if (i.type === "music") tracks.set(i.title, [...(tracks.get(i.title) ?? []), i]);
  const top = [...tracks].sort((a, b) => b[1].length - a[1].length)[0];
  if (!top || top[1].length < 4) return null;
  return {
    id: "repeat-song",
    icon: Repeat,
    kicker: "On repeat",
    headline: `“${top[0]}” never left`,
    detail: `${top[1][0].subtitle} shows up ${top[1].length} times in your listening. Songs you replay say more than songs you discover.`,
    metric: { value: String(top[1].length), label: "plays" },
    evidence: spread(top[1], 5),
  };
}

export function detectFindings(items: Item[]): Finding[] {
  return [searchToPurchase(items), beforeEvents(items), weekdayLift(items), nightOwl(items), spendPeak(items), repeatVisit(items), streaks(items), repeatSong(items)]
    .filter((f): f is Finding => f !== null);
}
