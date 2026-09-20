import type { Item, ReceiptType } from "@/types";
import { TYPE_ORDER } from "./meta";
import { HIDDEN_TAGS, MARKER_TAGS, PERSONAS, themeLabel } from "./themes";
import { monthShort, money } from "./format";

const PALETTE = ["#f5b74a", "#6cb6ff", "#6fdc9b", "#b79cff", "#ff7f6b", "#f78fb3"];
const isTheme = (t: string) => !HIDDEN_TAGS.has(t) && !MARKER_TAGS.has(t);

export interface Delta { dir: "up" | "down" | "new" | "fade"; text: string }

export interface Chapter {
  id: string;
  index: number;
  startMonth: number;
  endMonth: number;
  range: string;
  items: Item[];
  persona: string;
  line: string;
  signature: string[];
  byType: Record<ReceiptType, number>;
  spend: number;
  topCategory: string | null;
  topArtist: string | null;
  nightShare: number | null;
  perMonth: number;
  spendPerMonth: number;
  deltas: Delta[];
  defining: Item[];
  color: string;
}

interface Seg { months: number[]; n: number; vec: number[] }

const dist2 = (a: number[], b: number[]) => a.reduce((s, v, i) => s + (v - b[i]) ** 2, 0);

function tally<K>(list: K[]): Map<K, number> {
  const m = new Map<K, number>();
  for (const k of list) m.set(k, (m.get(k) ?? 0) + 1);
  return m;
}

/** Detect life chapters: merge adjacent months whose behaviour is most alike (Ward-style). */
export function buildChapters(items: Item[], target = 5): Chapter[] {
  const byMonth: Item[][] = Array.from({ length: 12 }, () => []);
  for (const it of items) byMonth[it.date.getMonth()].push(it);
  const active = byMonth.map((l, m) => (l.length ? m : -1)).filter((m) => m >= 0);
  if (active.length === 0) return [];

  // Feature vector per month: theme mix + record-type mix.
  const tagTotals = tally(items.flatMap((i) => i.tags.filter(isTheme)));
  const topTags = [...tagTotals].sort((a, b) => b[1] - a[1]).slice(0, 24).map(([t]) => t);
  const vecOf = (list: Item[]) => {
    const tags = tally(list.flatMap((i) => i.tags.filter(isTheme)));
    const tt = Math.max(1, [...tags.values()].reduce((a, b) => a + b, 0));
    const types = tally(list.map((i) => i.type));
    return [
      ...topTags.map((t) => (tags.get(t) ?? 0) / tt),
      ...TYPE_ORDER.map((t) => ((types.get(t) ?? 0) / Math.max(1, list.length)) * 0.7),
    ];
  };

  let segs: Seg[] = active.map((m) => ({ months: [m], n: byMonth[m].length, vec: vecOf(byMonth[m]) }));
  const k = Math.max(1, Math.min(target, Math.ceil(active.length / 2)));
  while (segs.length > k) {
    let best = 0, bestCost = Infinity;
    for (let i = 0; i < segs.length - 1; i++) {
      const a = segs[i], b = segs[i + 1];
      // Very short chapters aren't chapters: make them cheap to absorb into a neighbour.
      const tiny = a.months.length < 2 || b.months.length < 2 ? 0.2 : 1;
      const cost = ((a.n * b.n) / (a.n + b.n)) * dist2(a.vec, b.vec) * tiny;
      if (cost < bestCost) { bestCost = cost; best = i; }
    }
    const a = segs[best], b = segs[best + 1];
    const n = a.n + b.n;
    segs.splice(best, 2, { months: [...a.months, ...b.months], n, vec: a.vec.map((v, i) => (v * a.n + b.vec[i] * b.n) / n) });
  }

  const baseTotal = Math.max(1, [...tagTotals.values()].reduce((a, b) => a + b, 0));
  const usedPersonas = new Set<string>();
  const chapters: Chapter[] = [];

  segs.forEach((seg, index) => {
    const list = seg.months.flatMap((m) => byMonth[m]);
    const startMonth = seg.months[0];
    const endMonth = seg.months[seg.months.length - 1];
    const span = endMonth - startMonth + 1;

    // Signature: themes over-represented here compared with the whole year.
    const tags = tally(list.flatMap((i) => i.tags.filter(isTheme)));
    const tt = Math.max(1, [...tags.values()].reduce((a, b) => a + b, 0));
    const signature = [...tags]
      .map(([t, c]) => {
        const share = c / tt, base = (tagTotals.get(t) ?? 1) / baseTotal;
        return { t, c, lift: share / base, score: (share - base) * Math.sqrt(c) };
      })
      .filter((x) => x.c >= 4 && x.lift >= 1.08)
      .sort((a, b) => b.score - a.score)
      .slice(0, 4)
      .map((x) => x.t);

    // Persona: first signature theme with a persona we haven't already used.
    let persona = "", line = "";
    for (const t of signature) {
      const p = PERSONAS[t];
      if (p && !usedPersonas.has(p.title)) { persona = p.title; line = p.line; break; }
    }
    if (!persona) {
      const t = signature[0] ?? topTags[index % topTags.length];
      persona = `The ${themeLabel(t).replace(/^\w/, (c) => c.toUpperCase())} Stretch`;
      line = `${themeLabel(t)} ran through these months more than any other year-round habit.`;
    }
    usedPersonas.add(persona);

    const byType = Object.fromEntries(TYPE_ORDER.map((t) => [t, 0])) as Record<ReceiptType, number>;
    const cats = new Map<string, number>();
    const artists = tally(list.filter((i) => i.type === "music").map((i) => i.subtitle));
    let spend = 0;
    for (const it of list) {
      byType[it.type]++;
      if (it.type === "purchase") {
        spend += it.amount ?? 0;
        const c = it.title.split(" - ")[0];
        cats.set(c, (cats.get(c) ?? 0) + (it.amount ?? 0));
      }
    }
    const music = list.filter((i) => i.type === "music");
    const nightShare = music.length >= 6
      ? Math.round((music.filter((m) => m.date.getHours() >= 23 || m.date.getHours() < 5).length / music.length) * 100)
      : null;

    const maxAmt = Math.max(1, ...items.map((i) => i.amount ?? 0));
    const weight: Record<ReceiptType, number> = { event: 5, note: 4, movie: 4, message: 3, search: 2, photo: 2, place: 1.5, music: 1, purchase: 2 };
    const scored = list.map((it) => ({
      it,
      s: weight[it.type] + (it.type === "purchase" ? (Math.log1p(it.amount ?? 0) / Math.log1p(maxAmt)) * 3 : 0) + it.tags.filter((t) => signature.includes(t)).length * 2,
    })).sort((a, b) => b.s - a.s);
    const defining: Item[] = [];
    const seenType = new Set<ReceiptType>();
    for (const { it } of scored) {
      if (seenType.has(it.type)) continue;
      seenType.add(it.type);
      defining.push(it);
      if (defining.length === 3) break;
    }
    defining.sort((a, b) => a.date.getTime() - b.date.getTime());

    chapters.push({
      id: `chapter-${index + 1}`,
      index,
      startMonth, endMonth,
      range: startMonth === endMonth ? monthShort(startMonth) : `${monthShort(startMonth)}–${monthShort(endMonth)}`,
      items: list,
      persona, line, signature,
      byType, spend,
      topCategory: [...cats].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null,
      topArtist: [...artists].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null,
      nightShare,
      perMonth: list.length / span,
      spendPerMonth: spend / span,
      deltas: [],
      defining,
      color: PALETTE[index % PALETTE.length],
    });
  });

  // What changed since the previous chapter?
  chapters.forEach((c, i) => {
    if (i === 0) return;
    const p = chapters[i - 1];
    const d: Delta[] = [];
    const fresh = c.signature.find((t) => !p.signature.includes(t));
    if (fresh) d.push({ dir: "new", text: `New on the scene: #${themeLabel(fresh)}` });
    if (p.spendPerMonth > 0 && c.spendPerMonth > 0) {
      const ch = (c.spendPerMonth - p.spendPerMonth) / p.spendPerMonth;
      if (Math.abs(ch) >= 0.25) d.push({ dir: ch > 0 ? "up" : "down", text: `Spending ${ch > 0 ? "rose" : "fell"} ${Math.round(Math.abs(ch) * 100)}% a month (${money(Math.round(c.spendPerMonth))})` });
    }
    if (c.nightShare !== null && p.nightShare !== null && Math.abs(c.nightShare - p.nightShare) >= 10) {
      d.push({ dir: c.nightShare > p.nightShare ? "up" : "down", text: `After-11 PM listening went from ${p.nightShare}% to ${c.nightShare}%` });
    }
    const act = (c.perMonth - p.perMonth) / p.perMonth;
    if (Math.abs(act) >= 0.25) d.push({ dir: act > 0 ? "up" : "down", text: `Activity ${act > 0 ? "picked up" : "slowed"} ${Math.round(Math.abs(act) * 100)}% a month` });
    const faded = p.signature.find((t) => !c.signature.includes(t));
    if (faded) d.push({ dir: "fade", text: `Faded out: #${themeLabel(faded)}` });
    c.deltas = d.slice(0, 3);
  });

  return chapters;
}
