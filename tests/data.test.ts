import { describe, expect, it } from "vitest";
import { byDay, items, YEAR } from "@/lib/data";
import { categoryOf, isSpend, spendOf } from "@/lib/finance";
import { isReceiptType } from "@/lib/validation";

describe("dataset", () => {
  it("loads a full year of records", () => {
    expect(items.length).toBeGreaterThan(2000);
    expect(YEAR).toBe(2017);
  });

  it("is sorted chronologically with valid dates and day keys", () => {
    for (let i = 0; i < items.length; i++) {
      expect(Number.isNaN(items[i].date.getTime())).toBe(false);
      expect(items[i].dayKey).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      if (i > 0) expect(items[i].date.getTime()).toBeGreaterThanOrEqual(items[i - 1].date.getTime());
    }
  });

  it("only contains supported receipt types and always has a tags array", () => {
    for (const it of items) {
      expect(isReceiptType(it.type)).toBe(true);
      expect(Array.isArray(it.tags)).toBe(true);
    }
  });

  it("indexes every record by day exactly once", () => {
    const total = [...byDay.values()].reduce((n, list) => n + list.length, 0);
    expect(total).toBe(items.length);
  });
});

describe("finance helpers", () => {
  const base = { id: "x", subtitle: "", tags: [], location: null, timestamp: "2017-01-01T00:00:00", date: new Date("2017-01-01T00:00:00"), dayKey: "2017-01-01" } as const;

  it("counts real purchases as spend", () => {
    const dinner = { ...base, type: "purchase", title: "Food - Dinner", amount: 340 } as const;
    expect(categoryOf(dinner)).toBe("Food");
    expect(isSpend(dinner)).toBe(true);
    expect(spendOf(dinner)).toBe(340);
  });

  it("does not count money transfers or non-purchases", () => {
    const transfer = { ...base, type: "purchase", title: "Money transfer - Home", amount: 10000 } as const;
    const song = { ...base, type: "music", title: "Song", amount: 5 } as const;
    expect(isSpend(transfer)).toBe(false);
    expect(spendOf(transfer)).toBe(0);
    expect(spendOf(song)).toBe(0);
  });
});
