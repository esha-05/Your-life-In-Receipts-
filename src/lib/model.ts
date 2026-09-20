import type { Item, Moment } from "@/types";
import { items } from "./data";
import { buildChapters, type Chapter } from "./chapters";
import { buildGraph, type ThemeGraph } from "./graph";
import { buildMoments } from "./moments";
import { detectFindings, type Finding } from "./patterns";
import { computeStats, type Stats } from "./stats";
import { buildSummary, type Summary } from "./story";

/** Everything the UI needs, derived once from the validated receipts. */
export interface ReceiptModel {
  items: Item[];
  stats: Stats;
  moments: Moment[];
  momentsByDay: Map<string, Moment[]>;
  chapters: Chapter[];
  graph: ThemeGraph;
  findings: Finding[];
  summary: Summary;
}

const graphCache = new Map<string, ThemeGraph>();

/** Force-layout graph for the shared dataset, computed once per canvas size. */
export function getGraph(w = 1000, h = 640): ThemeGraph {
  const key = `${w}x${h}`;
  let g = graphCache.get(key);
  if (!g) {
    g = buildGraph(items, w, h);
    graphCache.set(key, g);
  }
  return g;
}

/** Pure assembly of all engines. Accepts any item list, which keeps it easy to test. */
export function buildReceiptModel(source: Item[] = items): ReceiptModel {
  const stats = computeStats(source);
  const moments = buildMoments(source);
  const chapters = buildChapters(source);
  const graph = source === items ? getGraph() : buildGraph(source);
  const findings = detectFindings(source);
  const summary = buildSummary(source, chapters, graph, findings);

  const momentsByDay = new Map<string, Moment[]>();
  for (const m of moments) {
    const list = momentsByDay.get(m.dayKey);
    if (list) list.push(m);
    else momentsByDay.set(m.dayKey, [m]);
  }
  return { items: source, stats, moments, momentsByDay, chapters, graph, findings, summary };
}

let cached: ReceiptModel | undefined;

/** Singleton model for the shipped dataset. */
export function getReceiptModel(): ReceiptModel {
  return (cached ??= buildReceiptModel());
}
