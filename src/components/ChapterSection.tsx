import { motion } from "motion/react";
import { ArrowDownRight, ArrowUpRight, Minus, Sparkles } from "lucide-react";
import type { Chapter, Delta } from "@/lib/chapters";
import { count, money } from "@/lib/format";
import { themeLabel } from "@/lib/themes";
import { ReceiptCard } from "./ReceiptCard";
import { StackBar } from "./StackBar";

const reveal = {
  initial: { opacity: 0, y: 26 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" },
  transition: { duration: 0.6, ease: [0.2, 0.7, 0.2, 1] as const },
};

function DeltaIcon({ dir }: { dir: Delta["dir"] }) {
  const cls = "mt-0.5 size-4 shrink-0";
  if (dir === "up") return <ArrowUpRight className={cls} aria-hidden />;
  if (dir === "down") return <ArrowDownRight className={cls} aria-hidden />;
  if (dir === "new") return <Sparkles className={cls} aria-hidden />;
  return <Minus className={cls} aria-hidden />;
}

interface Props {
  chapter: Chapter;
  total: number;
  onTheme: (tag: string) => void;
}

export function ChapterSection({ chapter: c, total, onTheme }: Props) {
  const titleId = `${c.id}-title`;
  return (
    <section id={c.id} aria-labelledby={titleId} className="scroll-mt-16 border-t border-line py-16 md:py-24">
      <div className="grid gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:gap-16">
        <motion.div {...reveal} className="lg:sticky lg:top-24 lg:self-start">
          <p className="eyebrow flex items-center gap-2">
            <span className="size-2.5 rounded-full" style={{ background: c.color }} aria-hidden />
            Chapter {c.index + 1} of {total} · {c.range}
          </p>
          <h2 id={titleId} className="mt-4 font-display text-[clamp(2.4rem,5.5vw,4.25rem)] font-semibold leading-[1.02] tracking-tight text-balance">
            {c.persona}
          </h2>
          <div className="mt-4 h-1 w-20 rounded-full" style={{ background: c.color }} aria-hidden />
          <p className="mt-5 max-w-md text-lg leading-relaxed text-muted text-pretty">{c.line}</p>

          <dl className="mt-8 grid max-w-md grid-cols-2 gap-x-6 gap-y-5">
            <div>
              <dt className="eyebrow">Traces</dt>
              <dd className="mt-1 font-display text-2xl font-semibold tabular-nums">{count(c.items.length)}</dd>
            </div>
            {c.spend > 0 && (
              <div>
                <dt className="eyebrow">Spent</dt>
                <dd className="mt-1 font-display text-2xl font-semibold tabular-nums">{money(c.spend)}</dd>
              </div>
            )}
            {c.topCategory && (
              <div>
                <dt className="eyebrow">Money went to</dt>
                <dd className="mt-1 text-lg">{c.topCategory}</dd>
              </div>
            )}
            {c.topArtist && (
              <div>
                <dt className="eyebrow">On repeat</dt>
                <dd className="mt-1 text-lg">{c.topArtist}</dd>
              </div>
            )}
            {c.nightShare !== null && (
              <div>
                <dt className="eyebrow">Songs after 11 PM</dt>
                <dd className="mt-1 text-lg tabular-nums">{c.nightShare}%</dd>
              </div>
            )}
          </dl>

          {c.signature.length > 0 && (
            <ul className="mt-8 flex flex-wrap gap-2" aria-label="Themes of this chapter">
              {c.signature.map((t) => (
                <li key={t}>
                  <button type="button" className="chip font-mono text-xs" onClick={() => onTheme(t)} title="See how this theme connects to everything else">
                    #{themeLabel(t)}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </motion.div>

        <div className="space-y-10">
          {c.deltas.length > 0 && (
            <motion.div {...reveal} className="rounded-2xl border border-line bg-ink-2/70 p-5 md:p-6">
              <h3 className="eyebrow">What changed since the last chapter</h3>
              <ul className="mt-4 space-y-3">
                {c.deltas.map((d, i) => (
                  <li key={i} className="flex gap-3 text-[0.95rem]">
                    <span style={{ color: c.color }}><DeltaIcon dir={d.dir} /></span>
                    <span>{d.text}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          )}

          <motion.div {...reveal}>
            <h3 className="eyebrow mb-4">What these months were made of</h3>
            <StackBar byType={c.byType} />
          </motion.div>

          <div>
            <h3 className="eyebrow mb-4">Receipts that define it</h3>
            <ul className="grid gap-5 sm:grid-cols-2">
              {c.defining.map((it, i) => (
                <motion.li key={it.id} {...reveal} transition={{ ...reveal.transition, delay: i * 0.08 }} className={i === 0 && c.defining.length === 3 ? "sm:col-span-2" : ""}>
                  <ReceiptCard item={it} />
                </motion.li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
