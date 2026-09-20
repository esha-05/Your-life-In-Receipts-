import { useMemo, useRef, useState, type KeyboardEvent } from "react";
import { YEAR } from "@/lib/data";
import { fmtDay, monthShort } from "@/lib/format";

const isLeap = (y: number) => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
const DAYS = isLeap(YEAR) ? 366 : 365;
const pad = (n: number) => String(n).padStart(2, "0");
const keyOf = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const LEVELS = [0, 28, 52, 76, 100];

interface Props {
  counts: Map<string, number>;
  onSelect: (dayKey: string) => void;
}

export function Heatmap({ counts, onSelect }: Props) {
  const { days, offset, max, monthCols, busiest } = useMemo(() => {
    const first = new Date(YEAR, 0, 1);
    const offset = first.getDay();
    const days = Array.from({ length: DAYS }, (_, i) => {
      const date = new Date(YEAR, 0, 1 + i);
      const key = keyOf(date);
      return { key, date, n: counts.get(key) ?? 0 };
    });
    const max = Math.max(1, ...days.map((d) => d.n));
    const monthCols = Array.from({ length: 12 }, (_, m) => {
      const diff = Math.round((new Date(YEAR, m, 1).getTime() - first.getTime()) / 86400000);
      return Math.floor((offset + diff) / 7) + 1;
    });
    const busiest = days.reduce((b, d, i) => (d.n > days[b].n ? i : b), 0);
    return { days, offset, max, monthCols, busiest };
  }, [counts]);

  const [active, setActive] = useState(busiest);
  const refs = useRef<Array<HTMLButtonElement | null>>([]);

  const level = (n: number) => (n === 0 ? 0 : n / max <= 0.25 ? 1 : n / max <= 0.5 ? 2 : n / max <= 0.75 ? 3 : 4);
  const bg = (l: number) =>
    l === 0 ? "var(--color-ink-3)" : `color-mix(in oklab, var(--color-amber) ${LEVELS[l]}%, var(--color-ink-3))`;

  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    const step: Record<string, number> = { ArrowLeft: -7, ArrowRight: 7, ArrowUp: -1, ArrowDown: 1 };
    let next = active;
    if (e.key in step) next = active + step[e.key];
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = DAYS - 1;
    else return;
    e.preventDefault();
    next = Math.max(0, Math.min(DAYS - 1, next));
    setActive(next);
    refs.current[next]?.focus();
  }

  return (
    <div>
      <div className="overflow-x-auto pb-3">
        <div className="w-max">
          <div className="mb-2 grid gap-[3px] font-mono text-[0.68rem] text-muted" style={{ gridTemplateColumns: "repeat(53, 14px)" }} aria-hidden>
            {monthCols.map((col, m) => (
              <span key={m} className="whitespace-nowrap" style={{ gridColumnStart: col, gridRowStart: 1 }}>
                {monthShort(m)}
              </span>
            ))}
          </div>
          <div
            role="group"
            aria-label={`${YEAR} activity calendar. Use arrow keys to move between days, Enter to open a day.`}
            onKeyDown={onKeyDown}
            className="grid grid-flow-col gap-[3px]"
            style={{ gridTemplateRows: "repeat(7, 14px)", gridAutoColumns: "14px" }}
          >
            {Array.from({ length: offset }, (_, i) => (
              <span key={`pad-${i}`} aria-hidden />
            ))}
            {days.map((d, i) => (
              <button
                key={d.key}
                ref={(el) => { refs.current[i] = el; }}
                type="button"
                tabIndex={i === active ? 0 : -1}
                aria-label={`${fmtDay(d.date)}: ${d.n} ${d.n === 1 ? "trace" : "traces"}`}
                title={`${fmtDay(d.date)} — ${d.n}`}
                onClick={() => { setActive(i); onSelect(d.key); }}
                onFocus={() => setActive(i)}
                className="size-3.5 rounded-[3px] transition-transform hover:scale-125 focus-visible:scale-125"
                style={{ background: bg(level(d.n)) }}
              />
            ))}
          </div>
        </div>
      </div>
      <div className="mt-2 flex items-center justify-end gap-2 font-mono text-[0.68rem] text-muted" aria-hidden>
        Quiet
        {[0, 1, 2, 3, 4].map((l) => (
          <span key={l} className="size-3.5 rounded-[3px]" style={{ background: bg(l) }} />
        ))}
        Busy
      </div>
    </div>
  );
}
