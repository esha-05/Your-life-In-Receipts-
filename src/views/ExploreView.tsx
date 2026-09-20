import { useDeferredValue, useMemo, useState } from "react";
import { RotateCcw, Search } from "lucide-react";
import type { ReceiptType } from "@/types";
import { items } from "@/lib/data";
import type { Stats } from "@/lib/stats";
import { TYPE_META, TYPE_ORDER } from "@/lib/meta";
import { count, monthLong } from "@/lib/format";
import { ReceiptCard } from "@/components/ReceiptCard";

const PAGE = 24;

export function ExploreView({ stats, initialTag = null }: { stats: Stats; initialTag?: string | null }) {
  const [q, setQ] = useState("");
  const [types, setTypes] = useState<ReceiptType[]>([]);
  const [tag, setTag] = useState<string | null>(initialTag);
  const [month, setMonth] = useState<number | "all">("all");
  const [order, setOrder] = useState<"asc" | "desc">("asc");
  const [shown, setShown] = useState(PAGE);
  const dq = useDeferredValue(q.trim().toLowerCase());

  const list = useMemo(() => {
    const f = items.filter(
      (i) =>
        (!types.length || types.includes(i.type)) &&
        (!tag || i.tags.includes(tag)) &&
        (month === "all" || i.date.getMonth() === month) &&
        (!dq || i.title.toLowerCase().includes(dq) || i.subtitle.toLowerCase().includes(dq)),
    );
    return order === "asc" ? f : [...f].reverse();
  }, [dq, types, tag, month, order]);

  const dirty = q || types.length || tag || month !== "all";
  const reset = () => { setQ(""); setTypes([]); setTag(null); setMonth("all"); setShown(PAGE); };
  const toggleType = (t: ReceiptType) => { setTypes((c) => (c.includes(t) ? c.filter((x) => x !== t) : [...c, t])); setShown(PAGE); };

  return (
    <div className="py-10 md:py-14">
      <p className="eyebrow">The raw archive</p>
      <h1 className="mt-2 font-display text-4xl font-semibold md:text-6xl">Explore</h1>
      <p className="mt-4 max-w-2xl text-lg text-muted">Every trace, as its own little receipt. Filter, search, and wander.</p>

      <div className="mt-8 grid gap-4 md:grid-cols-[1fr_auto_auto]">
        <label className="relative block">
          <span className="sr-only">Search traces</span>
          <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden />
          <input
            type="search"
            value={q}
            onChange={(e) => { setQ(e.target.value); setShown(PAGE); }}
            placeholder="Search titles, artists, notes…"
            className="w-full rounded-full border border-line bg-ink-2 py-3 pl-11 pr-4 text-fg placeholder:text-muted"
          />
        </label>
        <label className="flex items-center gap-2 text-sm text-muted">
          Month
          <select value={month} onChange={(e) => { setMonth(e.target.value === "all" ? "all" : Number(e.target.value)); setShown(PAGE); }} className="rounded-full border border-line bg-ink-2 px-3 py-2.5 text-fg">
            <option value="all">All year</option>
            {Array.from({ length: 12 }, (_, m) => <option key={m} value={m}>{monthLong(m)}</option>)}
          </select>
        </label>
        <label className="flex items-center gap-2 text-sm text-muted">
          Order
          <select value={order} onChange={(e) => setOrder(e.target.value as "asc" | "desc")} className="rounded-full border border-line bg-ink-2 px-3 py-2.5 text-fg">
            <option value="asc">Oldest first</option>
            <option value="desc">Newest first</option>
          </select>
        </label>
      </div>

      <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Filter by type">
        {TYPE_ORDER.filter((t) => stats.byType[t] > 0).map((t) => {
          const Icon = TYPE_META[t].icon;
          return (
            <button key={t} type="button" className="chip" aria-pressed={types.includes(t)} onClick={() => toggleType(t)}>
              <Icon className="size-4" style={{ color: TYPE_META[t].color }} aria-hidden />
              {TYPE_META[t].plural}
              <span className="font-mono text-xs text-muted">{count(stats.byType[t])}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Filter by tag">
        {(tag && !stats.topTags.some((t) => t.name === tag) ? [{ name: tag, value: 0 }, ...stats.topTags] : stats.topTags).map((t) => (
          <button key={t.name} type="button" className="chip font-mono text-xs" aria-pressed={tag === t.name} onClick={() => { setTag(tag === t.name ? null : t.name); setShown(PAGE); }}>
            #{t.name}
          </button>
        ))}
      </div>

      <div className="mt-6 flex items-center justify-between gap-4">
        <p className="font-mono text-sm text-muted" role="status" aria-live="polite">
          {count(list.length)} {list.length === 1 ? "trace" : "traces"}
        </p>
        {dirty && (
          <button type="button" className="chip" onClick={reset}>
            <RotateCcw className="size-3.5" aria-hidden /> Reset
          </button>
        )}
      </div>

      {list.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-line p-12 text-center">
          <p className="font-display text-2xl">Nothing matches that.</p>
          <p className="mt-2 text-muted">Try fewer filters — or a different word.</p>
        </div>
      ) : (
        <>
          <h2 className="sr-only">Traces</h2>
          <ul className="mt-4 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {list.slice(0, shown).map((it) => (
              <li key={it.id}><ReceiptCard item={it} /></li>
            ))}
          </ul>
          {shown < list.length && (
            <div className="mt-10 text-center">
              <button type="button" className="chip px-6 py-2.5" onClick={() => setShown((s) => s + PAGE)}>
                Show {Math.min(PAGE, list.length - shown)} more
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
