import { useEffect, useMemo, useRef } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { byDay } from "@/lib/data";
import { count, fmtDay, money } from "@/lib/format";
import { TYPE_META, TYPE_ORDER } from "@/lib/meta";
import type { Moment } from "@/types";
import { Thread } from "./Thread";

interface Props {
  dayKey: string | null;
  momentsByDay: Map<string, Moment[]>;
  onClose: () => void;
  onNavigate: (dayKey: string) => void;
}

const activeKeys = [...byDay.keys()].sort();

export function DayDialog({ dayKey, momentsByDay, onClose, onNavigate }: Props) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (dayKey && !d.open) d.showModal();
    if (!dayKey && d.open) d.close();
  }, [dayKey]);

  const info = useMemo(() => {
    if (!dayKey) return null;
    const items = byDay.get(dayKey) ?? [];
    const prev = [...activeKeys].reverse().find((k) => k < dayKey) ?? null;
    const next = activeKeys.find((k) => k > dayKey) ?? null;
    const spend = items.reduce((s, i) => s + (i.type === "purchase" ? i.amount ?? 0 : 0), 0);
    return { items, prev, next, spend, date: new Date(`${dayKey}T00:00:00`) };
  }, [dayKey]);

  const moments = dayKey ? momentsByDay.get(dayKey) ?? [] : [];

  return (
    <dialog
      ref={ref}
      aria-labelledby="day-title"
      onClose={onClose}
      onClick={(e) => { if (e.target === e.currentTarget) ref.current?.close(); }}
      className="m-auto max-h-[90dvh] w-[min(46rem,calc(100vw-1.25rem))] rounded-2xl border border-line bg-ink-2 p-0 text-fg shadow-2xl"
    >
      {info && (
        <div className="max-h-[90dvh] overflow-y-auto p-5 md:p-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="eyebrow">A day in receipts</p>
              <h2 id="day-title" className="mt-2 font-display text-3xl font-semibold leading-tight md:text-4xl">
                {fmtDay(info.date)}
              </h2>
            </div>
            <button type="button" className="chip shrink-0" onClick={() => ref.current?.close()} aria-label="Close">
              <X className="size-4" aria-hidden />
            </button>
          </div>

          <p className="mt-4 text-sm text-muted">
            {info.items.length === 0
              ? "Nothing recorded — a quiet day."
              : `${count(info.items.length)} traces${info.spend ? ` · ${money(info.spend)} spent` : ""}`}
          </p>

          {info.items.length > 0 && (
            <ul className="mt-3 flex flex-wrap gap-2" aria-label="Trace types">
              {TYPE_ORDER.filter((t) => info.items.some((i) => i.type === t)).map((t) => {
                const Icon = TYPE_META[t].icon;
                return (
                  <li key={t} className="inline-flex items-center gap-1.5 text-xs" style={{ color: TYPE_META[t].color }}>
                    <Icon className="size-3.5" aria-hidden />
                    <span className="text-fg">{info.items.filter((i) => i.type === t).length} {TYPE_META[t].label.toLowerCase()}</span>
                  </li>
                );
              })}
            </ul>
          )}

          {moments.length > 0 && (
            <section className="mt-6 space-y-3" aria-label="Moments this day">
              {moments.map((m) => (
                <div key={m.id} className="rounded-xl border border-amber/30 bg-amber/5 p-4">
                  <p className="font-display text-lg font-semibold">{m.headline}</p>
                  <p className="mt-1 text-sm text-muted">{m.summary}</p>
                </div>
              ))}
            </section>
          )}

          {info.items.length > 0 && (
            <section className="mt-8" aria-label="Every trace">
              <h3 className="eyebrow mb-4">Every trace</h3>
              <Thread items={info.items} />
            </section>
          )}

          <nav className="mt-8 flex items-center justify-between gap-3 border-t border-line pt-5" aria-label="Browse days">
            <button type="button" className="chip disabled:opacity-40" aria-label="Previous active day" disabled={!info.prev} onClick={() => info.prev && onNavigate(info.prev)}>
              <ChevronLeft className="size-4" aria-hidden /> Previous
            </button>
            <button type="button" className="chip disabled:opacity-40" aria-label="Next active day" disabled={!info.next} onClick={() => info.next && onNavigate(info.next)}>
              Next <ChevronRight className="size-4" aria-hidden />
            </button>
          </nav>
        </div>
      )}
    </dialog>
  );
}
