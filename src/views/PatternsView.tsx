import { useId, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ChevronDown } from "lucide-react";
import type { Finding } from "@/lib/patterns";
import { TYPE_META } from "@/lib/meta";
import { fmtShortDay, fmtTime } from "@/lib/format";
import { MiniBars } from "@/components/MiniBars";
import { cn } from "@/lib/cn";

function FindingCard({ f, onOpenDay }: { f: Finding; onOpenDay: (k: string) => void }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  return (
    <article className="flex flex-col rounded-2xl border border-line bg-ink-2/80 p-6 md:p-7">
      <div className="flex items-start justify-between gap-4">
        <p className="eyebrow flex items-center gap-2">
          <span className="grid size-8 place-items-center rounded-lg bg-amber/10 text-amber"><f.icon className="size-4" aria-hidden /></span>
          {f.kicker}
        </p>
        <p className="shrink-0 text-right">
          <span className="block font-display text-2xl font-semibold leading-none text-amber tabular-nums md:text-3xl">{f.metric.value}</span>
          <span className="mt-1 block font-mono text-[0.68rem] text-muted">{f.metric.label}</span>
        </p>
      </div>

      <h2 className="mt-5 font-display text-2xl font-semibold leading-snug text-balance md:text-[1.7rem]">{f.headline}</h2>
      <p className="mt-3 text-pretty leading-relaxed text-muted">{f.detail}</p>

      {f.bars && (
        <MiniBars className="mt-6" labels={f.bars.labels} values={f.bars.values} highlight={f.bars.highlight} unit={f.bars.unit} />
      )}

      <div className="mt-6">
        <button type="button" className="chip" aria-expanded={open} aria-controls={id} onClick={() => setOpen((o) => !o)}>
          Show the evidence ({f.evidence.length})
          <ChevronDown className={cn("size-4 transition-transform", open && "rotate-180")} aria-hidden />
        </button>
      </div>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div id={id} initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.28 }} className="overflow-hidden">
            <ul className="mt-4 divide-y divide-line rounded-xl border border-line">
              {f.evidence.map((it) => {
                const Icon = TYPE_META[it.type].icon;
                return (
                  <li key={it.id}>
                    <button type="button" onClick={() => onOpenDay(it.dayKey)} className="flex w-full items-start gap-3 p-3 text-left transition-colors hover:bg-ink-3" title="Open this day">
                      <Icon className="mt-0.5 size-4 shrink-0" style={{ color: TYPE_META[it.type].color }} aria-hidden />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm">{it.title}</span>
                        <span className="block truncate text-xs text-muted">{it.subtitle}</span>
                      </span>
                      <span className="shrink-0 text-right font-mono text-xs text-muted">{fmtShortDay(it.date)}<br />{fmtTime(it.date)}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </article>
  );
}

export function PatternsView({ findings, onOpenDay }: { findings: Finding[]; onOpenDay: (k: string) => void }) {
  return (
    <div className="py-10 md:py-14">
      <p className="eyebrow">Found by the data</p>
      <h1 className="mt-2 font-display text-4xl font-semibold md:text-6xl">Patterns</h1>
      <p className="mt-4 max-w-2xl text-lg text-muted text-pretty">
        Habits you never decided on. Each card is something the records reveal only when different kinds of traces are read
        together — and each one shows its evidence, so you can check the claim yourself.
      </p>
      {findings.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-line p-12 text-center">
          <p className="font-display text-2xl">Not enough data to spot patterns yet.</p>
        </div>
      ) : (
        <div className="mt-10 grid items-start gap-6 lg:grid-cols-2">
          {findings.map((f) => <FindingCard key={f.id} f={f} onOpenDay={onOpenDay} />)}
        </div>
      )}
    </div>
  );
}
