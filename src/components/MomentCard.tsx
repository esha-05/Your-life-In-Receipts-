import { useId, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { CalendarDays, ChevronDown, Wallet } from "lucide-react";
import type { Moment } from "@/types";
import { TYPE_META } from "@/lib/meta";
import { money } from "@/lib/format";
import { Thread } from "./Thread";
import { cn } from "@/lib/cn";

interface Props {
  moment: Moment;
  onOpenDay: (dayKey: string) => void;
  featured?: boolean;
}

export function MomentCard({ moment, onOpenDay, featured }: Props) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const counts = moment.types.map((t) => ({ t, n: moment.items.filter((i) => i.type === t).length }));

  return (
    <article
      className={cn(
        "flex flex-col rounded-2xl border border-line bg-ink-2/80 p-5 md:p-6",
        featured && "border-amber/40 bg-linear-to-br from-ink-2 to-ink-3",
      )}
    >
      <p className="eyebrow">{moment.kicker}</p>
      <h3 className="mt-2 font-display text-2xl font-semibold leading-tight text-balance md:text-[1.7rem]">
        {moment.headline}
      </h3>
      <p className="mt-3 text-pretty text-[0.95rem] leading-relaxed text-muted">{moment.summary}</p>

      <ul className="mt-4 flex flex-wrap gap-2" aria-label="What this moment connects">
        {counts.map(({ t, n }) => {
          const Icon = TYPE_META[t].icon;
          return (
            <li
              key={t}
              className="inline-flex items-center gap-1.5 rounded-full border border-line px-2.5 py-1 text-xs"
              style={{ color: TYPE_META[t].color }}
            >
              <Icon className="size-3.5" aria-hidden />
              <span className="text-fg">
                {n} {TYPE_META[t].label.toLowerCase()}
                {n > 1 ? "s" : ""}
              </span>
            </li>
          );
        })}
        {moment.spend > 0 && (
          <li className="inline-flex items-center gap-1.5 rounded-full border border-line px-2.5 py-1 text-xs text-amber">
            <Wallet className="size-3.5" aria-hidden />
            <span className="text-fg">{money(moment.spend)}</span>
          </li>
        )}
      </ul>

      {moment.threads.length > 0 && (
        <p className="mt-3 font-mono text-xs text-muted">
          <span className="sr-only">Shared threads: </span>
          {moment.threads.map((t) => `#${t}`).join("  ")}
        </p>
      )}

      <div className="mt-5 flex flex-wrap items-center gap-2">
        <button
          type="button"
          className="chip"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen((o) => !o)}
        >
          Trace the thread
          <ChevronDown className={cn("size-4 transition-transform", open && "rotate-180")} aria-hidden />
        </button>
        <button type="button" className="chip" onClick={() => onOpenDay(moment.dayKey)}>
          <CalendarDays className="size-4" aria-hidden /> Whole day
        </button>
      </div>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            id={panelId}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.2, 0.7, 0.2, 1] }}
            className="overflow-hidden"
          >
            <div className="pt-6">
              <Thread items={moment.items} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </article>
  );
}
