import { useState, type KeyboardEvent } from "react";
import type { ThemeGraph } from "@/lib/graph";
import { themeLabel } from "@/lib/themes";
import { TYPE_META } from "@/lib/meta";

interface Props {
  graph: ThemeGraph;
  selected: string | null;
  onSelect: (id: string) => void;
}

export function ConnectionWeb({ graph, selected, onSelect }: Props) {
  const [hover, setHover] = useState<string | null>(null);
  const focus = hover ?? selected;
  const near = new Set<string>();
  if (focus) {
    near.add(focus);
    for (const n of graph.neighbors(focus)) near.add(n.id);
  }
  const byId = new Map(graph.nodes.map((n) => [n.id, n]));

  const onKey = (id: string) => (e: KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelect(id); }
  };

  return (
    <svg
      viewBox={`0 0 ${graph.size.w} ${graph.size.h}`}
      className="h-auto w-full"
      role="group"
      aria-label="Connection web. Each circle is a theme; lines join themes that show up together. Select a theme to see its links."
    >
      <g aria-hidden>
        {graph.edges.map((e) => {
          const a = byId.get(e.a)!, b = byId.get(e.b)!;
          const active = focus !== null && (e.a === focus || e.b === focus);
          return (
            <line
              key={`${e.a}|${e.b}`}
              x1={a.x} y1={a.y} x2={b.x} y2={b.y}
              stroke={active ? "var(--color-amber)" : "var(--color-muted)"}
              strokeWidth={1 + e.strength * 4}
              strokeLinecap="round"
              opacity={focus === null ? 0.32 : active ? 0.95 : 0.07}
              style={{ transition: "opacity 0.25s" }}
            />
          );
        })}
      </g>
      {graph.nodes.map((n) => {
        const on = focus === null || near.has(n.id);
        const sel = selected === n.id;
        const links = graph.neighbors(n.id).slice(0, 3).map((x) => themeLabel(x.id)).join(", ");
        return (
          <g
            key={n.id}
            className="web-node cursor-pointer"
            role="button"
            tabIndex={0}
            aria-pressed={sel}
            aria-label={`${themeLabel(n.id)}: ${n.count} traces, mostly ${TYPE_META[n.dominant].plural.toLowerCase()}. Linked with ${links || "nothing else"}.`}
            onClick={() => onSelect(n.id)}
            onKeyDown={onKey(n.id)}
            onMouseEnter={() => setHover(n.id)}
            onMouseLeave={() => setHover(null)}
            onFocus={() => setHover(n.id)}
            onBlur={() => setHover(null)}
            style={{ opacity: on ? 1 : 0.22, transition: "opacity 0.25s" }}
          >
            <circle cx={n.x} cy={n.y} r={Math.max(n.r + 6, 24)} fill="transparent" />
            <circle className="ring" cx={n.x} cy={n.y} r={n.r + 6} fill="none" stroke="transparent" strokeWidth={3} />
            <circle cx={n.x} cy={n.y} r={n.r} fill={n.color} fillOpacity={sel ? 0.5 : 0.2} stroke={sel ? "var(--color-fg)" : n.color} strokeWidth={sel ? 3.5 : 2} />
            <text
              x={n.x} y={n.y + n.r + 18}
              textAnchor="middle" fontSize={16}
              fill="var(--color-fg)" stroke="var(--color-ink)" strokeWidth={5} paintOrder="stroke"
              fontFamily="var(--font-sans)" fontWeight={sel ? 700 : 500}
            >
              {themeLabel(n.id)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
