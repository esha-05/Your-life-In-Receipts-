import { describe, expect, it } from "vitest";
import raw from "@/data/life_receipts_2017.json";
import { isReceiptType, isValidReceipt, parseReceipts } from "@/lib/validation";

const good = {
  id: "purchase-1",
  type: "purchase",
  timestamp: "2017-03-18T14:32:00",
  title: "Food - Dinner",
  subtitle: "pizza",
  tags: ["food"],
  location: { name: "Pune" },
  amount: 340,
};

describe("receipt validation", () => {
  it("accepts a well-formed receipt", () => {
    expect(isValidReceipt(good)).toBe(true);
    expect(isValidReceipt({ ...good, location: null })).toBe(true);
  });

  it.each([
    ["null", null],
    ["a string", "receipt"],
    ["a missing id", { ...good, id: undefined }],
    ["an empty title", { ...good, title: "" }],
    ["an unknown type", { ...good, type: "invoice" }],
    ["an unparseable timestamp", { ...good, timestamp: "yesterday" }],
    ["non-array tags", { ...good, tags: "food" }],
    ["non-string tags", { ...good, tags: [1, 2] }],
    ["a NaN amount", { ...good, amount: Number.NaN }],
    ["a malformed location", { ...good, location: { city: "Pune" } }],
  ])("rejects %s", (_label, value) => {
    expect(isValidReceipt(value)).toBe(false);
  });

  it("knows exactly the nine receipt types", () => {
    for (const t of ["purchase", "music", "place", "photo", "search", "message", "note", "event", "movie"]) {
      expect(isReceiptType(t)).toBe(true);
    }
    expect(isReceiptType("toString")).toBe(false); // prototype keys are not types
  });

  it("drops bad records and reports how many, without throwing", () => {
    const { receipts, rejected } = parseReceipts([good, { nope: true }, 42, null]);
    expect(receipts).toHaveLength(1);
    expect(rejected).toBe(3);
    expect(parseReceipts("not an array")).toEqual({ receipts: [], rejected: 0 });
  });

  it("the shipped dataset has zero malformed records", () => {
    const { rejected } = parseReceipts(raw);
    expect(rejected).toBe(0);
  });
});
