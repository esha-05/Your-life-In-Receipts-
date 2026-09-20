import { useMemo, useState } from "react";
import type { Moment, ReceiptType } from "@/types";
import { TYPE_META, TYPE_ORDER } from "@/lib/meta";
import { monthLong } from "@/lib/format";
import { MomentCard } from "@/components/MomentCard";

const PAGE = 9;

interface Props {
  moments: Moment[];
  onOpenDay: (k: string) => void;
}

export function MomentsView({ moments, onOpenDay }: Props) {
  const [sort, setSort] = useState<"connected" | "time">("connected");
  const [month, setMonth] = useState<number | "all">("all");
  const [types, setTypes] = useState<ReceiptType[]>([]);
  const [shown, setShown] = useState(PAGE);

  const list = useMemo(() => {
    const f = moments.filter(
      (m) => (month === "all" || m.start.getMonth() === month) && types.every((t) => m.types.includes(t)),
    );
    return f.sort(sort === "time" ? (a, b) => a.start.getTime() - b.start.getTime() : (a, b) => b.score - a.score || a.start.getTime() - b.start.getTime());
  }, [moments, sort, month, types]);

  const present = TYPE_ORDER.filter((t) => moments.some((m) => m.types.includes(t)));
  const reset = () => { setTypes([]); setMonth("all"); setShown(PAGE); };

  return (
    <div className="py-10 md:py-14">
      <p className="eyebrow">Story view</p>
      <h1 className="mt-2 font-display text-4xl font-semibold md:text-6xl">Moments</h1>
      <p className="mt-4 max-w-2xl text-lg text-muted text-pretty">
        Traces that happened close together are stitched into one story. Each moment connects at least two kinds of trace —
        a search that became a purchase, a message that became a celebration.
      </p>

      <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-4">
        <div className="flex items-center gap-2" role="group" aria-label="Sort moments">
          <button type="button" className="chip" aria-pressed={sort === "connected"} onClick={() => setSort("connected")}>Most connected</button>
          <button type="button" className="chip" aria-pressed={sort === "time"} onClick={() => setSort("time")}>Chronological</button>
        </div>
        <label className="flex items-center gap-2 text-sm text-muted">
          Month
          <select
            value={month}
            onChange={(e) => { setMonth(e.target.value === "all" ? "all" : Number(e.target.value)); setShown(PAGE); }}
            className="rounded-full border border-line bg-ink-2 px-3 py-1.5 text-fg"
          >
            <option value="all">All year</option>
            {Array.from({ length: 12 }, (_, m) => <option key={m} value={m}>{monthLong(m)}</option>)}
          </select>
        </label>
      </div>

      <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Must include these traces">
        {present.map((t) => {
          const Icon = TYPE_META[t].icon;
          const on = types.includes(t);
          return (
            <button
              key={t}
              type="button"
              className="chip"
              aria-pressed={on}
              onClick={() => { setTypes(on ? types.filter((x) => x !== t) : [...types, t]); setShown(PAGE); }}
            >
              <Icon className="size-4" style={{ color: TYPE_META[t].color }} aria-hidden /> {TYPE_META[t].plural}
            </button>
          );
        })}
      </div>

      <p className="mt-6 font-mono text-sm text-muted" role="status" aria-live="polite">
        {list.length} {list.length === 1 ? "moment" : "moments"}
      </p>

      {list.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-line p-10 text-center">
          <p className="font-display text-2xl">No moment ties all of those together.</p>
          <button type="button" className="chip mt-5" onClick={reset}>Clear filters</button>
        </div>
      ) : (
        <>
          <h2 className="sr-only">Moments</h2>
          <div className="mt-4 grid items-start gap-5 md:grid-cols-2 xl:grid-cols-3">
            {list.slice(0, shown).map((m) => <MomentCard key={m.id} moment={m} onOpenDay={onOpenDay} />)}
          </div>
          {shown < list.length && (
            <div className="mt-10 text-center">
              <button type="button" className="chip px-6 py-2.5" onClick={() => setShown((s) => s + PAGE)}>
                Show more ({list.length - shown} left)
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
