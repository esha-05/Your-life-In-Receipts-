import { Suspense, lazy, useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, MotionConfig, motion } from "motion/react";
import { StoryView } from "@/views/StoryView";
import { DayDialog } from "@/components/DayDialog";
import { MobileNav, SiteFooter, SiteHeader, SkipLink, ViewFallback } from "@/components/SiteChrome";
import { DEFAULT_VIEW, VIEW_IDS } from "@/config/routes";
import { useHashRoute } from "@/hooks/useHashRoute";
import { useReceiptModel } from "@/hooks/useReceiptModel";

// The landing view is eager; everything else is code-split.
const WebView = lazy(() => import("@/views/WebView").then((m) => ({ default: m.WebView })));
const PatternsView = lazy(() => import("@/views/PatternsView").then((m) => ({ default: m.PatternsView })));
const MomentsView = lazy(() => import("@/views/MomentsView").then((m) => ({ default: m.MomentsView })));
const ExploreView = lazy(() => import("@/views/ExploreView").then((m) => ({ default: m.ExploreView })));
const InsightsView = lazy(() => import("@/views/InsightsView"));

export default function App() {
  const model = useReceiptModel();
  const [view, goto] = useHashRoute(VIEW_IDS, DEFAULT_VIEW);
  const [day, setDay] = useState<string | null>(null);
  const [theme, setTheme] = useState<string | null>(null);
  const [exploreSeed, setExploreSeed] = useState<{ tag: string | null; n: number }>({ tag: null, n: 0 });
  const mainRef = useRef<HTMLElement>(null);
  const first = useRef(true);

  // Move focus + scroll to the top of the new view (skip the very first render).
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    window.scrollTo({ top: 0 });
    mainRef.current?.focus({ preventScroll: true });
  }, [view]);

  const openTheme = useCallback((t: string) => { setTheme(t); goto("web"); }, [goto]);
  const openExplore = useCallback((t: string) => { setExploreSeed((s) => ({ tag: t, n: s.n + 1 })); goto("explore"); }, [goto]);

  if (model.items.length === 0) {
    return (
      <main className="grid min-h-dvh place-items-center p-8 text-center">
        <p className="font-display text-2xl">No valid records found in src/data/life_receipts_2017.json</p>
      </main>
    );
  }

  return (
    <MotionConfig reducedMotion="user">
      <SkipLink />
      <SiteHeader view={view} />

      <main id="main" ref={mainRef} tabIndex={-1} className="mx-auto max-w-7xl px-4 pb-28 outline-none md:px-8 lg:pb-16">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={view}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22 }}
          >
            <Suspense fallback={<ViewFallback />}>
              {view === "story" && (
                <StoryView
                  stats={model.stats}
                  momentCount={model.moments.length}
                  chapters={model.chapters}
                  graph={model.graph}
                  findings={model.findings}
                  summary={model.summary}
                  onTheme={openTheme}
                  goto={goto}
                />
              )}
              {view === "web" && <WebView theme={theme} onSelect={setTheme} onOpenDay={setDay} onExplore={openExplore} />}
              {view === "patterns" && <PatternsView findings={model.findings} onOpenDay={setDay} />}
              {view === "moments" && <MomentsView moments={model.moments} onOpenDay={setDay} />}
              {view === "explore" && <ExploreView key={exploreSeed.n} stats={model.stats} initialTag={exploreSeed.tag} />}
              {view === "insights" && <InsightsView stats={model.stats} onOpenDay={setDay} />}
            </Suspense>
          </motion.div>
        </AnimatePresence>
        <SiteFooter />
      </main>

      <MobileNav view={view} />
      <DayDialog dayKey={day} momentsByDay={model.momentsByDay} onClose={() => setDay(null)} onNavigate={setDay} />
    </MotionConfig>
  );
}
