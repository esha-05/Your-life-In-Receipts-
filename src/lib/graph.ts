import type { Item, ReceiptType } from "@/types";
import { TYPE_META, TYPE_ORDER } from "./meta";
import { HIDDEN_TAGS, MARKER_TAGS } from "./themes";
import { clusterItems } from "./moments";

export interface GNode {
  id: string;
  count: number;
  color: string;
  dominant: ReceiptType;
  byType: Record<ReceiptType, number>;
  monthly: number[];
  degree: number;
  x: number;
  y: number;
  r: number;
}
export interface GEdge { a: string; b: string; strength: number; together: number }
export interface ThemeGraph {
  nodes: GNode[];
  edges: GEdge[];
  hub: string;
  size: { w: number; h: number };
  neighbors: (id: string) => Array<{ id: string; strength: number; together: number }>;
}

const MAX_NODES = 22;
const MIN_COUNT = 8;

export function buildGraph(items: Item[], w = 1000, h = 640): ThemeGraph {
  // 1. Themes = frequent tags.
  const counts = new Map<string, number>();
  for (const it of items) for (const t of it.tags) if (!HIDDEN_TAGS.has(t)) counts.set(t, (counts.get(t) ?? 0) + 1);
  const ids = [...counts].filter(([, c]) => c >= MIN_COUNT).sort((a, b) => b[1] - a[1]).slice(0, MAX_NODES).map(([t]) => t);
  const idSet = new Set(ids);

  // 2. Co-occurrence: themes are linked when they appear in the same burst of activity.
  const occ = new Map<string, number>();
  const pair = new Map<string, number>();
  for (const cluster of clusterItems(items)) {
    const present = [...new Set(cluster.flatMap((c) => c.tags).filter((t) => idSet.has(t)))].sort();
    for (const t of present) occ.set(t, (occ.get(t) ?? 0) + 1);
    for (let i = 0; i < present.length; i++)
      for (let j = i + 1; j < present.length; j++) {
        const k = `${present[i]}|${present[j]}`;
        pair.set(k, (pair.get(k) ?? 0) + 1);
      }
  }
  const all: GEdge[] = [];
  for (const [k, together] of pair) {
    const [a, b] = k.split("|");
    all.push({ a, b, together, strength: together / Math.sqrt((occ.get(a) ?? 1) * (occ.get(b) ?? 1)) });
  }
  // Keep each theme's 3 strongest links so the web stays readable.
  const keep = new Set<string>();
  for (const id of ids) {
    all.filter((e) => e.a === id || e.b === id)
      .sort((x, y) => y.strength - x.strength)
      .slice(0, 3)
      .forEach((e) => keep.add(`${e.a}|${e.b}`));
  }
  const edges = all.filter((e) => keep.has(`${e.a}|${e.b}`) && e.together >= 2);

  // 3. Nodes.
  const maxC = Math.max(1, ...ids.map((i) => counts.get(i) ?? 0));
  const scale = Math.min(w, h) / 640;
  const nodes: GNode[] = ids.map((id) => {
    const byType = Object.fromEntries(TYPE_ORDER.map((t) => [t, 0])) as Record<ReceiptType, number>;
    const monthly = new Array(12).fill(0);
    for (const it of items) if (it.tags.includes(id)) { byType[it.type]++; monthly[it.date.getMonth()]++; }
    const dominant = TYPE_ORDER.reduce((b, t) => (byType[t] > byType[b] ? t : b), TYPE_ORDER[0]);
    const count = counts.get(id) ?? 0;
    return {
      id, count, byType, monthly, dominant,
      color: TYPE_META[dominant].color,
      degree: edges.filter((e) => e.a === id || e.b === id).length,
      x: 0, y: 0,
      r: (11 + Math.sqrt(count / maxC) * 22) * scale,
    };
  });

  layout(nodes, edges, w, h);

  const pool = nodes.filter((n) => !MARKER_TAGS.has(n.id));
  const hub = [...(pool.length ? pool : nodes)].sort((a, b) => b.degree * Math.sqrt(b.count) - a.degree * Math.sqrt(a.count))[0]?.id ?? "";
  const neighbors = (id: string) =>
    edges.filter((e) => e.a === id || e.b === id)
      .map((e) => ({ id: e.a === id ? e.b : e.a, strength: e.strength, together: e.together }))
      .sort((a, b) => b.strength - a.strength);

  return { nodes, edges, hub, size: { w, h }, neighbors };
}

/** Deterministic Fruchterman–Reingold layout, then a de-overlap pass. */
function layout(nodes: GNode[], edges: GEdge[], w: number, h: number) {
  const n = nodes.length;
  if (!n) return;
  const idx = new Map(nodes.map((nd, i) => [nd.id, i]));
  const pos = nodes.map((_, i) => ({ x: w / 2 + Math.cos((i / n) * 2 * Math.PI) * w * 0.3, y: h / 2 + Math.sin((i / n) * 2 * Math.PI) * h * 0.3 }));
  const k = Math.sqrt((w * h) / n) * 0.8;
  let temp = w / 7;
  for (let it = 0; it < 420; it++) {
    const d = pos.map(() => ({ x: 0, y: 0 }));
    for (let i = 0; i < n; i++)
      for (let j = i + 1; j < n; j++) {
        const dx = pos[i].x - pos[j].x, dy = pos[i].y - pos[j].y;
        const dist = Math.max(0.5, Math.hypot(dx, dy));
        const f = (k * k) / dist;
        d[i].x += (dx / dist) * f; d[i].y += (dy / dist) * f;
        d[j].x -= (dx / dist) * f; d[j].y -= (dy / dist) * f;
      }
    for (const e of edges) {
      const i = idx.get(e.a)!, j = idx.get(e.b)!;
      const dx = pos[i].x - pos[j].x, dy = pos[i].y - pos[j].y;
      const dist = Math.max(0.5, Math.hypot(dx, dy));
      const f = ((dist * dist) / k) * (0.25 + e.strength);
      d[i].x -= (dx / dist) * f; d[i].y -= (dy / dist) * f;
      d[j].x += (dx / dist) * f; d[j].y += (dy / dist) * f;
    }
    for (let i = 0; i < n; i++) {
      d[i].x += (w / 2 - pos[i].x) * 0.08; d[i].y += (h / 2 - pos[i].y) * 0.08;
      const len = Math.max(0.01, Math.hypot(d[i].x, d[i].y));
      const m = Math.min(len, temp);
      pos[i].x += (d[i].x / len) * m; pos[i].y += (d[i].y / len) * m;
    }
    temp *= 0.985;
  }
  // Fit to the canvas.
  const pad = 70;
  const xs = pos.map((p) => p.x), ys = pos.map((p) => p.y);
  const [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
  nodes.forEach((nd, i) => {
    nd.x = pad + ((pos[i].x - x0) / Math.max(1, x1 - x0)) * (w - pad * 2);
    nd.y = pad + ((pos[i].y - y0) / Math.max(1, y1 - y0)) * (h - pad * 2);
  });
  // Nudge apart any circles (plus label room) that still overlap.
  for (let pass = 0; pass < 40; pass++)
    for (let i = 0; i < n; i++)
      for (let j = i + 1; j < n; j++) {
        const dx = nodes[j].x - nodes[i].x, dy = nodes[j].y - nodes[i].y;
        const dist = Math.max(0.01, Math.hypot(dx, dy));
        const min = nodes[i].r + nodes[j].r + 26;
        if (dist < min) {
          const push = (min - dist) / 2;
          nodes[i].x -= (dx / dist) * push; nodes[i].y -= (dy / dist) * push;
          nodes[j].x += (dx / dist) * push; nodes[j].y += (dy / dist) * push;
        }
      }
  for (const nd of nodes) {
    nd.x = Math.min(w - 40, Math.max(40, nd.x));
    nd.y = Math.min(h - 40, Math.max(40, nd.y));
  }
}
