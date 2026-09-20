import { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, MotionConfig, motion } from "motion/react";
import { BookOpen, ChartColumn, Compass, Lightbulb, Network, Receipt, Sparkles, type LucideIcon } from "lucide-react";
import { items, YEAR } from "@/lib/data";
import { buildMoments } from "@/lib/moments";
import { computeStats } from "@/lib/stats";
import { buildChapters } from "@/lib/chapters";
import { buildGraph } from "@/lib/graph";
import { detectFindings } from "@/lib/patterns";
import { buildSummary } from "@/lib/story";
import { cn } from "@/lib/cn";
import { StoryView } from "@/views/StoryView";
import { WebView } from "@/views/WebView";
import { PatternsView } from "@/views/PatternsView";
import { MomentsView } from "@/views/MomentsView";
import { ExploreView } from "@/views/ExploreView";
import { DayDialog } from "@/components/DayDialog";
import type { Moment } from "@/types";

const InsightsView = lazy(() => import("@/views/InsightsView"));

type View = "story" | "web" | "patterns" | "moments" | "explore" | "insights";
const VIEWS: Array<{ id: View; label: string; icon: LucideIcon }> = [
  { id: "story", label: "Story", icon: BookOpen },
  { id: "web", label: "Web", icon: Network },
  { id: "patterns", label: "Patterns", icon: Lightbulb },
  { id: "moments", label: "Moments", icon: Sparkles },
  { id: "explore", label: "Explore", icon: Compass },
  { id: "insights", label: "Insights", icon: ChartColumn },
];

const readHash = (): View => {
  const h = window.location.hash.replace(/^#\/?/, "");
  return (VIEWS.find((v) => v.id === h)?.id ?? "story") as View;
};

export default function App() {
  const [view, setView] = useState<View>(readHash);
  const [day, setDay] = useState<string | null>(null);
  const mainRef = useRef<HTMLElement>(null);
  const first = useRef(true);

  const [theme, setTheme] = useState<string | null>(null);
  const [exploreSeed, setExploreSeed] = useState<{ tag: string | null; n: number }>({ tag: null, n: 0 });

  const stats = useMemo(() => computeStats(items), []);
  const moments = useMemo(() => buildMoments(items), []);
  const chapters = useMemo(() => buildChapters(items), []);
  const graph = useMemo(() => buildGraph(items), []);
  const findings = useMemo(() => detectFindings(items), []);
  const summary = useMemo(() => buildSummary(items, chapters, graph, findings), [chapters, graph, findings]);
  const momentsByDay = useMemo(() => {
    const m = new Map<string, Moment[]>();
    for (const x of moments) m.set(x.dayKey, [...(m.get(x.dayKey) ?? []), x]);
    return m;
  }, [moments]);

  useEffect(() => {
    const on = () => setView(readHash());
    window.addEventListener("hashchange", on);
    return () => window.removeEventListener("hashchange", on);
  }, []);

  // Move focus + scroll to the top of the new view (skip the very first render).
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    window.scrollTo({ top: 0 });
    mainRef.current?.focus({ preventScroll: true });
  }, [view]);

  const goto = useCallback((v: View) => { window.location.hash = `/${v}`; }, []);
  const openTheme = useCallback((t: string) => { setTheme(t); goto("web"); }, [goto]);
  const openExplore = useCallback((t: string) => { setExploreSeed((s) => ({ tag: t, n: s.n + 1 })); goto("explore"); }, [goto]);

  if (items.length === 0) {
    return (
      <main className="grid min-h-dvh place-items-center p-8 text-center">
        <p className="font-display text-2xl">No records found in src/data/life_receipts_2017.json</p>
      </main>
    );
  }

  return (
    <MotionConfig reducedMotion="user">
      <a href="#main" className="sr-only z-50 rounded-full bg-amber px-4 py-2 font-medium text-ink focus:not-sr-only focus:fixed focus:left-4 focus:top-4">
        Skip to content
      </a>

      <header className="sticky top-0 z-30 border-b border-line bg-ink/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 md:px-8">
          <a href="#/story" className="flex items-center gap-2.5 font-display text-lg font-semibold">
            <span className="grid size-8 place-items-center rounded-lg bg-amber text-ink"><Receipt className="size-4.5" aria-hidden /></span>
            <span>Life in Receipts <span className="font-mono text-xs font-normal text-muted">’{String(YEAR).slice(2)}</span></span>
          </a>
          <nav aria-label="Primary" className="hidden lg:block">
            <ul className="flex gap-1">
              {VIEWS.map(({ id, label, icon: Icon }) => (
                <li key={id}>
                  <a
                    href={`#/${id}`}
                    aria-current={view === id ? "page" : undefined}
                    className={cn("inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm text-muted transition-colors hover:text-fg", view === id && "bg-ink-3 text-fg")}
                  >
                    <Icon className="size-4" aria-hidden /> {label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </header>

      <main id="main" ref={mainRef} tabIndex={-1} className="mx-auto max-w-7xl px-4 pb-28 outline-none md:px-8 lg:pb-16">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={view}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22 }}
          >
            {view === "story" && (
              <StoryView stats={stats} momentCount={moments.length} chapters={chapters} graph={graph} findings={findings} summary={summary} onTheme={openTheme} goto={goto} />
            )}
            {view === "web" && <WebView theme={theme} onSelect={setTheme} onOpenDay={setDay} onExplore={openExplore} />}
            {view === "patterns" && <PatternsView findings={findings} onOpenDay={setDay} />}
            {view === "moments" && <MomentsView moments={moments} onOpenDay={setDay} />}
            {view === "explore" && <ExploreView key={exploreSeed.n} stats={stats} initialTag={exploreSeed.tag} />}
            {view === "insights" && (
              <Suspense fallback={<div className="py-24 text-center font-mono text-sm text-muted" role="status">Printing your insights…</div>}>
                <InsightsView stats={stats} onOpenDay={setDay} />
              </Suspense>
            )}
          </motion.div>
        </AnimatePresence>

        <footer className="mt-16 border-t border-line pt-8 text-sm text-muted">
          <p className="max-w-2xl text-pretty">
            A reconstruction of {YEAR}. Purchases and listening come from real logs; the surrounding traces —
            places, searches, messages, events — are synthesized around them so the moments connect.
          </p>
          <p className="mt-2 font-mono text-xs">Built for WebRush 2026 · React · TypeScript · Tailwind · Motion · Recharts</p>
        </footer>
      </main>

      <nav aria-label="Primary (mobile)" className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-ink/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden">
        <ul className="grid grid-cols-6">
          {VIEWS.map(({ id, label, icon: Icon }) => (
            <li key={id}>
              <a
                href={`#/${id}`}
                aria-current={view === id ? "page" : undefined}
                className={cn("flex flex-col items-center gap-1 py-2.5 text-[0.68rem] text-muted", view === id && "text-amber")}
              >
                <Icon className="size-5" aria-hidden /> {label}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <DayDialog dayKey={day} momentsByDay={momentsByDay} onClose={() => setDay(null)} onNavigate={setDay} />
    </MotionConfig>
  );
}
