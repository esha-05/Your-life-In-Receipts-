import { describe, expect, it } from "vitest";
import { items } from "@/lib/data";
import { isSpend } from "@/lib/finance";
import { buildChapters } from "@/lib/chapters";
import { buildGraph } from "@/lib/graph";
import { buildMoments, clusterItems } from "@/lib/moments";
import { TYPE_ORDER } from "@/lib/meta";
import { buildReceiptModel, getReceiptModel } from "@/lib/model";
import { detectFindings } from "@/lib/patterns";
import { computeStats } from "@/lib/stats";

const HOUR = 3600e3;

describe("moment engine", () => {
  const moments = buildMoments(items);

  it("finds moments in the dataset", () => {
    expect(moments.length).toBeGreaterThan(0);
  });

  it("keeps only clusters of 3+ records that connect 2+ kinds of trace", () => {
    for (const m of moments) {
      expect(m.items.length).toBeGreaterThanOrEqual(3);
      expect(new Set(m.items.map((i) => i.type)).size).toBeGreaterThanOrEqual(2);
    }
  });

  it("never bridges a 4h silence or exceeds a 10h span", () => {
    for (const m of moments) {
      for (let i = 1; i < m.items.length; i++) {
        expect(m.items[i].date.getTime() - m.items[i - 1].date.getTime()).toBeLessThanOrEqual(4 * HOUR);
      }
      expect(m.items[m.items.length - 1].date.getTime() - m.items[0].date.getTime()).toBeLessThanOrEqual(10 * HOUR);
    }
  });

  it("has unique ids and never mentions undefined/NaN", () => {
    expect(new Set(moments.map((m) => m.id)).size).toBe(moments.length);
    for (const m of moments) expect(`${m.headline} ${m.summary}`).not.toMatch(/undefined|NaN/);
  });

  it("clusters cover every record exactly once", () => {
    expect(clusterItems(items).flat()).toHaveLength(items.length);
  });

  it("handles empty input", () => {
    expect(buildMoments([])).toEqual([]);
  });
});

describe("stats engine", () => {
  const stats = computeStats(items);

  it("adds up: every breakdown sums to the total", () => {
    const sum = (a: number[]) => a.reduce((x, y) => x + y, 0);
    expect(stats.total).toBe(items.length);
    expect(sum(Object.values(stats.byType))).toBe(stats.total);
    expect(sum(stats.hourly)).toBe(stats.total);
    expect(sum(stats.weekday)).toBe(stats.total);
    expect(sum([...stats.dayCounts.values()])).toBe(stats.total);
    expect(sum(stats.monthly.map((m) => sum(TYPE_ORDER.map((t) => m[t]))))).toBe(stats.total);
  });

  it("counts genuine spending only (no money transfers) and is finite", () => {
    const expected = items.filter(isSpend).reduce((s, i) => s + (i.amount ?? 0), 0);
    expect(Number.isFinite(stats.spend)).toBe(true);
    expect(stats.spend).toBeCloseTo(expected, 2);
    expect(stats.spendByCategory.map((c) => c.name)).not.toContain("Money transfer");
  });

  it("copes with no data", () => {
    const empty = computeStats([]);
    expect(empty.total).toBe(0);
    expect(empty.busiestDay).toBeNull();
    expect(Number.isFinite(empty.spend)).toBe(true);
  });
});

describe("chapter engine", () => {
  const chapters = buildChapters(items);

  it("produces 1–5 chapters that partition the year in order", () => {
    expect(chapters.length).toBeGreaterThanOrEqual(1);
    expect(chapters.length).toBeLessThanOrEqual(5);
    expect(chapters.reduce((n, c) => n + c.items.length, 0)).toBe(items.length);
    for (let i = 1; i < chapters.length; i++) expect(chapters[i].startMonth).toBeGreaterThan(chapters[i - 1].endMonth);
    expect(new Set(chapters.map((c) => c.id)).size).toBe(chapters.length);
  });

  it("picks at most three defining receipts from within the chapter", () => {
    for (const c of chapters) {
      expect(c.defining.length).toBeLessThanOrEqual(3);
      for (const d of c.defining) expect(c.items).toContain(d);
    }
  });

  it("handles empty input", () => {
    expect(buildChapters([])).toEqual([]);
  });
});

describe("connection graph", () => {
  const g = buildGraph(items);
  const ids = new Set(g.nodes.map((n) => n.id));

  it("has a bounded number of themes and a valid hub", () => {
    expect(g.nodes.length).toBeGreaterThan(0);
    expect(g.nodes.length).toBeLessThanOrEqual(22);
    expect(ids.has(g.hub)).toBe(true);
  });

  it("only links existing themes with strength in (0, 1]", () => {
    for (const e of g.edges) {
      expect(ids.has(e.a) && ids.has(e.b)).toBe(true);
      expect(e.strength).toBeGreaterThan(0);
      expect(e.strength).toBeLessThanOrEqual(1);
      expect(e.together).toBeGreaterThanOrEqual(2);
      expect(g.neighbors(e.a).map((n) => n.id)).toContain(e.b);
    }
  });

  it("keeps every node on the canvas, for desktop and mobile sizes", () => {
    for (const graph of [g, buildGraph(items, 560, 780)]) {
      for (const n of graph.nodes) {
        expect(n.x).toBeGreaterThanOrEqual(40);
        expect(n.x).toBeLessThanOrEqual(graph.size.w - 40);
        expect(n.y).toBeGreaterThanOrEqual(40);
        expect(n.y).toBeLessThanOrEqual(graph.size.h - 40);
      }
    }
  });

  it("is deterministic", () => {
    const pick = (x: typeof g) => x.nodes.map((n) => [n.id, Math.round(n.x), Math.round(n.y)]);
    expect(pick(buildGraph(items))).toEqual(pick(buildGraph(items)));
  });

  it("handles empty input", () => {
    const empty = buildGraph([]);
    expect(empty.nodes).toEqual([]);
    expect(empty.hub).toBe("");
  });
});

describe("pattern engine", () => {
  const findings = detectFindings(items);

  it("detects patterns, each backed by evidence", () => {
    expect(findings.length).toBeGreaterThan(0);
    expect(new Set(findings.map((f) => f.id)).size).toBe(findings.length);
    for (const f of findings) {
      expect(f.evidence.length).toBeGreaterThan(0);
      expect(`${f.headline} ${f.detail} ${f.metric.value}`).not.toMatch(/undefined|NaN/);
      if (f.bars) {
        expect(f.bars.values).toHaveLength(f.bars.labels.length);
        expect(f.bars.highlight).toBeGreaterThanOrEqual(0);
        expect(f.bars.highlight).toBeLessThan(f.bars.labels.length);
      }
    }
  });

  it("finds nothing (and does not throw) on empty input", () => {
    expect(detectFindings([])).toEqual([]);
  });
});

describe("receipt model", () => {
  it("is computed once and shared", () => {
    expect(getReceiptModel()).toBe(getReceiptModel());
  });

  it("indexes moments by day without losing any", () => {
    const m = getReceiptModel();
    const n = [...m.momentsByDay.values()].reduce((s, l) => s + l.length, 0);
    expect(n).toBe(m.moments.length);
    expect(m.summary.you).toMatch(/^Someone/);
    expect(m.summary.paragraph).not.toMatch(/undefined|NaN/);
  });

  it("survives an empty dataset", () => {
    const m = buildReceiptModel([]);
    expect(m.moments).toEqual([]);
    expect(m.chapters).toEqual([]);
    expect(m.findings).toEqual([]);
  });
});
