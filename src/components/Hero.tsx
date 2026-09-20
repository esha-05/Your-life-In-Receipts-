import { useEffect, useState } from "react";
import { animate, motion, useReducedMotion } from "motion/react";
import { ArrowDown, Compass } from "lucide-react";
import type { Stats } from "@/lib/stats";
import { TYPE_META, TYPE_ORDER } from "@/lib/meta";
import { count, money } from "@/lib/format";
import { YEAR } from "@/lib/data";

function useCountUp(target: number) {
  const reduce = useReducedMotion();
  const [n, setN] = useState(reduce ? target : 0);
  useEffect(() => {
    if (reduce) { setN(target); return; }
    const c = animate(0, target, { duration: 1.6, ease: "easeOut", onUpdate: (v) => setN(Math.round(v)) });
    return () => c.stop();
  }, [target, reduce]);
  return n;
}

interface Props {
  stats: Stats;
  momentCount: number;
  onExplore: () => void;
  onBegin: () => void;
}

export function Hero({ stats, momentCount, onExplore, onBegin }: Props) {
  const total = useCountUp(stats.total);
  const reduce = useReducedMotion();

  return (
    <section aria-labelledby="hero-title" className="grid items-center gap-12 py-10 md:py-16 lg:grid-cols-[1.15fr_0.85fr]">
      <div>
        <p className="eyebrow">A reconstruction · {YEAR}</p>
        <h1 id="hero-title" className="mt-4 font-display text-[clamp(2.8rem,8vw,6rem)] font-semibold leading-[0.95] tracking-tight text-balance">
          Your life,
          <br />
          in <em className="font-normal text-amber">receipts.</em>
        </h1>
        <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted text-pretty">
          <span className="font-mono text-fg tabular-nums" aria-label={`${stats.total} traces`}>{count(total)}</span>{" "}
          small traces — purchases, songs, places, searches, messages — stitched into{" "}
          <strong className="font-semibold text-fg">{count(momentCount)} moments</strong> — and one story about who you were.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <button type="button" onClick={onBegin} className="inline-flex items-center gap-2 rounded-full bg-amber px-5 py-3 font-medium text-ink transition hover:brightness-110">
            Begin the story <ArrowDown className="size-4" aria-hidden />
          </button>
          <button type="button" onClick={onExplore} className="inline-flex items-center gap-2 rounded-full border border-line px-5 py-3 font-medium transition hover:border-muted hover:bg-ink-3">
            <Compass className="size-4" aria-hidden /> Browse every trace
          </button>
        </div>
      </div>

      <motion.div
        initial={reduce ? false : { clipPath: "inset(0 0 100% 0)" }}
        animate={{ clipPath: "inset(0 0 -24px 0)" }}
        transition={{ duration: 1.4, ease: [0.3, 0.7, 0.2, 1] }}
        className="mx-auto w-full max-w-sm"
      >
        <div className="paper zigzag rounded-t-sm p-6 shadow-[0_30px_60px_-20px_rgb(0_0_0/0.8)] md:rotate-2">
          <p className="text-center text-xs font-bold uppercase tracking-[0.25em]">Life &amp; Co.</p>
          <p className="mt-1 text-center text-[0.68rem] text-paper-muted">RECEIPT NO. {YEAR}-0001 · FULL YEAR</p>
          <div className="my-4 border-t border-dashed border-paper-ink/40" />
          <ul className="space-y-2 text-sm">
            {TYPE_ORDER.filter((t) => stats.byType[t] > 0).map((t, i) => {
              const Icon = TYPE_META[t].icon;
              return (
                <motion.li
                  key={t}
                  initial={reduce ? false : { opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + i * 0.09 }}
                  className="flex items-center gap-2"
                >
                  <Icon className="size-3.5 shrink-0" aria-hidden />
                  <span className="uppercase">{TYPE_META[t].plural}</span>
                  <span className="leader" aria-hidden />
                  <span className="font-bold tabular-nums">{count(stats.byType[t])}</span>
                </motion.li>
              );
            })}
          </ul>
          <div className="my-4 border-t border-dashed border-paper-ink/40" />
          <p className="flex justify-between text-base font-bold">
            <span>TOTAL TRACES</span>
            <span className="tabular-nums">{count(stats.total)}</span>
          </p>
          <p className="mt-1 flex justify-between text-xs text-paper-muted">
            <span>SPENT</span>
            <span className="tabular-nums">{money(stats.spend)}</span>
          </p>
          <div
            aria-hidden
            className="mt-5 h-10"
            style={{ background: "repeating-linear-gradient(90deg, var(--color-paper-ink) 0 2px, transparent 2px 5px, var(--color-paper-ink) 5px 6px, transparent 6px 9px, var(--color-paper-ink) 9px 12px, transparent 12px 14px)" }}
          />
          <p className="mt-3 text-center text-[0.68rem] tracking-widest text-paper-muted">THANK YOU FOR LIVING</p>
        </div>
      </motion.div>
    </section>
  );
}
