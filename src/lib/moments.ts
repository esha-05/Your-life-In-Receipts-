import type { Item, Moment, ReceiptType } from "@/types";
import { fmtDay, money, partOfDay } from "./format";

const GAP_MS = 4 * 3600e3;   // a new moment starts after 4h of silence…
const SPAN_MS = 10 * 3600e3; // …or once it has stretched past 10h
const stripPrefix = (s: string) => s.replace(/^Message from /, "");

function phrase(it: Item): string {
  switch (it.type) {
    case "purchase": return `spent ${money(it.amount ?? 0)} on ${it.title.toLowerCase()}`;
    case "music": return `played “${it.title}” by ${it.subtitle}`;
    case "place": return `stopped at ${it.title}`;
    case "photo": return "took a photo";
    case "search": return `searched “${it.title}”`;
    case "message": return `heard from ${stripPrefix(it.title)}`;
    case "note": return "jotted down a thought";
    case "event": return `were at ${it.title}`;
    case "movie": return `watched ${it.title}`;
  }
}

function summarise(items: Item[]): string {
  const seen = new Set<ReceiptType>();
  const picks: Item[] = [];
  for (const it of items) {
    if (!seen.has(it.type)) { seen.add(it.type); picks.push(it); }
    if (picks.length === 4) break;
  }
  const rest = items.length - picks.length;
  const body = picks.map(phrase).join(", then ");
  return `You ${body}${rest > 0 ? ` — plus ${rest} more traces.` : "."}`;
}

function headline(items: Item[], part: string): string {
  const has = (t: ReceiptType) => items.find((i) => i.type === t);
  const tag = (t: string) => items.some((i) => i.tags.includes(t));
  const event = has("event");
  if (event) return event.title;
  const movie = has("movie");
  if (movie) return part === "evening" || part === "night" ? `A night in with ${movie.title}` : `Screen time: ${movie.title}`;
  if (has("message") && tag("celebration")) return "Something to celebrate";
  if (has("message") && tag("family")) return "Family on your mind";
  if (has("search") && has("purchase")) return "Looked it up, then bought it";
  if (tag("health")) return "Taking care of yourself";
  if (tag("finance")) return "Planning ahead";
  if (tag("late-night")) return "The late-night soundtrack";
  if (tag("commute")) return "On the move";
  if (tag("food")) return "Out for a bite";
  return "An ordinary, well-lived stretch";
}

function threadsOf(items: Item[]): string[] {
  const c = new Map<string, number>();
  for (const it of items) for (const t of it.tags) c.set(t, (c.get(t) ?? 0) + 1);
  return [...c].filter(([, n]) => n >= 2).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([t]) => t);
}

function build(group: Item[], n: number): Moment {
  const start = group[0].date;
  const end = group[group.length - 1].date;
  const types = [...new Set(group.map((g) => g.type))];
  const part = partOfDay(start.getHours());
  const spend = group.reduce((s, g) => s + (g.type === "purchase" ? g.amount ?? 0 : 0), 0);
  return {
    id: `moment-${n}`,
    items: group,
    start, end,
    dayKey: group[0].dayKey,
    headline: headline(group, part),
    kicker: `${fmtDay(start)} · ${part}`,
    summary: summarise(group),
    types, spend,
    threads: threadsOf(group),
    score: types.length * 3 + Math.min(group.length, 8),
  };
}

/** Split the chronological stream wherever there is a long silence. */
export function clusterItems(items: Item[]): Item[][] {
  const out: Item[][] = [];
  let cur: Item[] = [];
  for (const it of items) {
    if (cur.length) {
      const t = it.date.getTime();
      if (t - cur[cur.length - 1].date.getTime() > GAP_MS || t - cur[0].date.getTime() > SPAN_MS) {
        out.push(cur);
        cur = [];
      }
    }
    cur.push(it);
  }
  if (cur.length) out.push(cur);
  return out;
}

/** Keep clusters (3+ records) that connect 2+ kinds of trace. */
export function buildMoments(items: Item[]): Moment[] {
  const out: Moment[] = [];
  for (const group of clusterItems(items)) {
    if (group.length >= 3 && new Set(group.map((c) => c.type)).size >= 2) out.push(build(group, out.length));
  }
  return out;
}
