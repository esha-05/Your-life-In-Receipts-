import { useMemo } from "react";
import { ArrowRight } from "lucide-react";
import { items } from "@/lib/data";
import { buildGraph } from "@/lib/graph";
import { TYPE_META, TYPE_ORDER } from "@/lib/meta";
import { count, fmtShortDay, monthShort } from "@/lib/format";
import { spread, themeLabel } from "@/lib/themes";
import { useMedia } from "@/lib/useMedia";
import { ConnectionWeb } from "@/components/ConnectionWeb";
import { MiniBars } from "@/components/MiniBars";
import { StackBar } from "@/components/StackBar";
import { cn } from "@/lib/cn";

interface Props {
  theme: string | null;
  onSelect: (t: string) => void;
  onOpenDay: (k: string) => void;
  onExplore: (t: string) => void;
}

export function WebView({ theme, onSelect, onOpenDay, onExplore }: Props) {
  const narrow = useMedia("(max-width: 700px)");
  const graph = useMemo(() => buildGraph(items, narrow ? 560 : 1000, narrow ? 780 : 640), [narrow]);
  const current = theme && graph.nodes.some((n) => n.id === theme) ? theme : graph.hub;
  const node = graph.nodes.find((n) => n.id === current);

  const detail = useMemo(() => {
    if (!node) return null;
    const list = items.filter((i) => i.tags.includes(current));
    return { list, sample: spread(list, 5), kinds: TYPE_ORDER.filter((t) => node.byType[t] > 0), links: graph.neighbors(current) };
  }, [node, current, graph]);

  return (
    <div className="py-10 md:py-14">
      <p className="eyebrow">No calendar required</p>
      <h1 className="mt-2 font-display text-4xl font-semibold md:text-6xl">Connections</h1>
      <p className="mt-4 max-w-2xl text-lg text-muted text-pretty">
        Every circle is a theme in your life. Two themes are joined when they keep showing up in the same stretch of activity —
        a message next to a gift next to a celebration. Bigger circle, more traces. Pick one to follow its thread.
      </p>

      <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted" aria-label="Colour legend">
        <span>Colour = the kind of trace that carries the theme most:</span>
        {TYPE_ORDER.filter((t) => graph.nodes.some((n) => n.dominant === t)).map((t) => (
          <span key={t} className="inline-flex items-center gap-1.5">
            <span className="size-2.5 rounded-full" style={{ background: TYPE_META[t].color }} aria-hidden /> {TYPE_META[t].plural}
          </span>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_24rem]">
        <div className="space-y-4">
          <div className="rounded-2xl border border-line bg-ink-2/60 p-2 md:p-4">
            <ConnectionWeb graph={graph} selected={current} onSelect={onSelect} />
          </div>
          <ul className="flex flex-wrap gap-2" aria-label="All themes">
            {[...graph.nodes].sort((a, b) => b.count - a.count).map((n) => (
              <li key={n.id}>
                <button type="button" className="chip font-mono text-xs" aria-pressed={current === n.id} onClick={() => onSelect(n.id)}>
                  #{themeLabel(n.id)} <span className="text-muted">{n.count}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>

        {node && detail && (
          <aside aria-label={`Details for ${themeLabel(current)}`} className="space-y-6 rounded-2xl border border-line bg-ink-2/80 p-5 md:p-6 lg:sticky lg:top-24 lg:self-start">
            <div>
              <p className="eyebrow">Theme</p>
              <h2 className="mt-1 font-display text-3xl font-semibold">#{themeLabel(current)}</h2>
              <p className="mt-2 text-sm text-muted">
                {count(node.count)} traces spanning {detail.kinds.length} {detail.kinds.length === 1 ? "kind" : "kinds"} of record — {detail.kinds.map((k) => TYPE_META[k].plural.toLowerCase()).join(", ")}.
              </p>
            </div>

            <StackBar byType={node.byType} />

            <div>
              <h3 className="eyebrow mb-3">Across the year</h3>
              <MiniBars labels={node.monthly.map((_, i) => monthShort(i))} values={node.monthly} highlight={node.monthly.indexOf(Math.max(...node.monthly))} />
            </div>

            <div>
              <h3 className="eyebrow mb-3">Travels with</h3>
              {detail.links.length === 0 ? (
                <p className="text-sm text-muted">Stands on its own.</p>
              ) : (
                <ul className="space-y-2">
                  {detail.links.map((l) => (
                    <li key={l.id}>
                      <button type="button" className="group w-full text-left" onClick={() => onSelect(l.id)}>
                        <span className="flex items-baseline justify-between gap-3 text-sm">
                          <span className="font-mono">#{themeLabel(l.id)}</span>
                          <span className="font-mono text-xs text-muted">together {l.together}×</span>
                        </span>
                        <span className="mt-1.5 block h-1.5 rounded-full bg-ink-3" aria-hidden>
                          <span className="block h-full rounded-full bg-amber transition-[width]" style={{ width: `${Math.round(l.strength * 100)}%` }} />
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div>
              <h3 className="eyebrow mb-3">A few traces from this thread</h3>
              <ul className="space-y-1">
                {detail.sample.map((it) => {
                  const Icon = TYPE_META[it.type].icon;
                  return (
                    <li key={it.id}>
                      <button type="button" onClick={() => onOpenDay(it.dayKey)} className={cn("flex w-full items-start gap-3 rounded-lg p-2 text-left transition-colors hover:bg-ink-3")}>
                        <Icon className="mt-0.5 size-4 shrink-0" style={{ color: TYPE_META[it.type].color }} aria-hidden />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm">{it.title}</span>
                          <span className="block font-mono text-xs text-muted">{fmtShortDay(it.date)}</span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>

            <button type="button" className="chip w-full justify-center" onClick={() => onExplore(current)}>
              Open all {count(detail.list.length)} in Explore <ArrowRight className="size-4" aria-hidden />
            </button>
          </aside>
        )}
      </div>
    </div>
  );
}
