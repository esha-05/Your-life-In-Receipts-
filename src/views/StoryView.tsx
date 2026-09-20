import { motion, useScroll } from "motion/react";
import { ArrowRight, Lightbulb, Network } from "lucide-react";
import type { Chapter } from "@/lib/chapters";
import type { ThemeGraph } from "@/lib/graph";
import type { Finding } from "@/lib/patterns";
import type { Summary } from "@/lib/story";
import type { Stats } from "@/lib/stats";
import { themeLabel } from "@/lib/themes";
import { smoothScrollTo } from "@/lib/useMedia";
import { Hero } from "@/components/Hero";
import { ChapterSection } from "@/components/ChapterSection";
import { FinaleReceipt } from "@/components/FinaleReceipt";

interface Props {
  stats: Stats;
  momentCount: number;
  chapters: Chapter[];
  graph: ThemeGraph;
  findings: Finding[];
  summary: Summary;
  onTheme: (tag: string) => void;
  goto: (v: "web" | "patterns" | "explore" | "moments") => void;
}

function ChapterStrip({ chapters }: { chapters: Chapter[] }) {
  return (
    <ol className="mt-8 flex gap-1.5" aria-label="Chapters of the year">
      {chapters.map((c) => (
        <li key={c.id} className="min-w-0" style={{ flex: `${c.endMonth - c.startMonth + 1} 1 0` }}>
          <button
            type="button"
            className="group block w-full text-left"
            aria-label={`Chapter ${c.index + 1}: ${c.persona}, ${c.range}`}
            onClick={() => smoothScrollTo(document.getElementById(c.id))}
          >
            <span className="block h-2.5 rounded-full transition-transform group-hover:scale-y-150" style={{ background: c.color }} />
            <span className="mt-2 block truncate font-mono text-[0.68rem] text-muted group-hover:text-fg">
              {c.index + 1}<span className="hidden sm:inline"> · {c.persona.replace(/^The /, "")}</span>
            </span>
            <span className="hidden truncate font-mono text-[0.62rem] text-muted/80 sm:block">{c.range}</span>
          </button>
        </li>
      ))}
    </ol>
  );
}

export function StoryView({ stats, momentCount, chapters, graph, findings, summary, onTheme, goto }: Props) {
  const { scrollYProgress } = useScroll();
  const hubLinks = graph.neighbors(graph.hub).slice(0, 4);

  return (
    <>
      <motion.div style={{ scaleX: scrollYProgress }} className="fixed inset-x-0 top-0 z-50 h-0.5 origin-left bg-amber" aria-hidden />

      <Hero
        stats={stats}
        momentCount={momentCount}
        onBegin={() => smoothScrollTo(document.getElementById("chapters"))}
        onExplore={() => goto("explore")}
      />

      <section id="chapters" aria-labelledby="chapters-title" className="scroll-mt-16 border-t border-line pt-14 pb-2">
        <p className="eyebrow">The shape of the year</p>
        <h2 id="chapters-title" className="mt-2 max-w-3xl font-display text-3xl font-semibold text-balance md:text-5xl">
          {chapters.length} versions of you, one year
        </h2>
        <p className="mt-4 max-w-2xl text-lg text-muted text-pretty">
          Chapters aren't set by the calendar. They begin wherever your habits, spending and taste shifted — so each one
          has its own personality. Pick one to jump in, or just keep scrolling.
        </p>
        <ChapterStrip chapters={chapters} />
      </section>

      {chapters.map((c) => (
        <ChapterSection key={c.id} chapter={c} total={chapters.length} onTheme={onTheme} />
      ))}

      <section aria-labelledby="threads-title" className="border-t border-line py-16 md:py-24">
        <div className="grid gap-10 lg:grid-cols-2">
          <div>
            <p className="eyebrow flex items-center gap-2"><Network className="size-4" aria-hidden /> The connections</p>
            <h2 id="threads-title" className="mt-3 font-display text-3xl font-semibold text-balance md:text-5xl">
              Strip away the dates and one thread is left
            </h2>
            <p className="mt-4 max-w-xl text-lg text-muted text-pretty">
              Across the whole year, <strong className="text-fg">#{themeLabel(graph.hub)}</strong> shows up beside more
              of your other themes than anything else. The connection web lays every theme out by how often they appear together — no calendar involved.
            </p>
            <button type="button" className="mt-7 inline-flex items-center gap-2 rounded-full bg-amber px-5 py-3 font-medium text-ink hover:brightness-110" onClick={() => goto("web")}>
              Open the connection web <ArrowRight className="size-4" aria-hidden />
            </button>
          </div>
          <div className="rounded-2xl border border-line bg-ink-2/70 p-6 md:p-8">
            <p className="eyebrow">#{themeLabel(graph.hub)} travels with</p>
            <ul className="mt-5 flex flex-wrap gap-3">
              {hubLinks.map((l) => (
                <li key={l.id}>
                  <button type="button" className="chip text-base" onClick={() => onTheme(l.id)}>
                    #{themeLabel(l.id)} <span className="font-mono text-xs text-muted">×{l.together}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {findings.length > 0 && (
        <section aria-labelledby="patterns-title" className="border-t border-line py-16 md:py-24">
          <p className="eyebrow flex items-center gap-2"><Lightbulb className="size-4" aria-hidden /> Things you might not have noticed</p>
          <h2 id="patterns-title" className="mt-3 max-w-3xl font-display text-3xl font-semibold text-balance md:text-5xl">
            The data noticed {findings.length} patterns
          </h2>
          <ul className="mt-8 grid gap-4 md:grid-cols-3">
            {findings.slice(0, 3).map((f) => (
              <li key={f.id} className="rounded-2xl border border-line bg-ink-2/70 p-6">
                <p className="eyebrow flex items-center gap-2"><f.icon className="size-4 text-amber" aria-hidden /> {f.kicker}</p>
                <p className="mt-3 font-display text-2xl font-semibold leading-snug text-balance">{f.headline}</p>
                <p className="mt-4 font-mono text-sm text-amber">{f.metric.value} <span className="text-muted">{f.metric.label}</span></p>
              </li>
            ))}
          </ul>
          <button type="button" className="chip mt-7" onClick={() => goto("patterns")}>
            See all patterns and the evidence <ArrowRight className="size-4" aria-hidden />
          </button>
        </section>
      )}

      <section aria-labelledby="finale-title" className="border-t border-line py-16 md:py-28">
        <div className="grid items-center gap-14 lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <p className="eyebrow">The verdict</p>
            <h2 id="finale-title" className="mt-3 font-display text-4xl font-semibold md:text-6xl">What it all means</h2>
            <p className="mt-6 max-w-2xl font-display text-xl leading-relaxed text-pretty md:text-2xl">{summary.paragraph}</p>
            <p className="mt-8 eyebrow">You, in one line</p>
            <p className="mt-2 font-display text-2xl italic text-amber md:text-3xl">{summary.you}</p>
            <div className="mt-9 flex flex-wrap gap-3">
              <button type="button" className="chip" onClick={() => goto("moments")}>Read the moments</button>
              <button type="button" className="chip" onClick={() => goto("explore")}>Browse every trace</button>
            </div>
          </div>
          <FinaleReceipt chapters={chapters} hub={summary.hub} total={stats.total} />
        </div>
      </section>
    </>
  );
}
