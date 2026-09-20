import { describe, expect, it } from "vitest";
import { count, gap, partOfDay } from "@/lib/format";

describe("format helpers", () => {
  it("groups numbers the Indian way", () => {
    expect(count(1234567)).toBe("12,34,567");
  });

  it("describes the gap between two times", () => {
    const t = new Date("2017-01-01T10:00:00").getTime();
    const at = (min: number) => new Date(t + min * 60000);
    expect(gap(at(0), at(0))).toBe("same time");
    expect(gap(at(0), at(45))).toBe("45 min");
    expect(gap(at(0), at(120))).toBe("2h");
    expect(gap(at(0), at(150))).toBe("2h 30m");
  });

  it("labels parts of the day", () => {
    expect(partOfDay(3)).toBe("night");
    expect(partOfDay(8)).toBe("morning");
    expect(partOfDay(13)).toBe("afternoon");
    expect(partOfDay(19)).toBe("evening");
    expect(partOfDay(23)).toBe("night");
  });
});
