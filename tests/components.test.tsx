// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { ReceiptCard } from "@/components/ReceiptCard";
import { StackBar } from "@/components/StackBar";
import type { Item, ReceiptType } from "@/types";

afterEach(cleanup);

const make = (over: Partial<Item> = {}): Item => ({
  id: "purchase-1",
  type: "purchase",
  timestamp: "2017-03-18T14:32:00",
  title: "Food - Dinner",
  subtitle: "pizza meal",
  tags: ["comfort", "food"],
  location: null,
  amount: 340,
  currency: "INR",
  date: new Date("2017-03-18T14:32:00"),
  dayKey: "2017-03-18",
  ...over,
});

describe("<ReceiptCard />", () => {
  it("shows title, subtitle, tags and the amount for purchases", () => {
    render(<ReceiptCard item={make()} />);
    expect(screen.getByRole("heading", { name: "Food - Dinner" })).toBeTruthy();
    expect(screen.getByText("pizza meal")).toBeTruthy();
    expect(screen.getByText("#food")).toBeTruthy();
    expect(screen.getByText("₹340")).toBeTruthy();
  });

  it("appends the album for songs and shows no amount", () => {
    render(<ReceiptCard item={make({ type: "music", title: "Believer", subtitle: "Imagine Dragons", album: "Evolve", amount: undefined })} />);
    expect(screen.getByText(/Imagine Dragons — Evolve/)).toBeTruthy();
    expect(screen.queryByText(/₹/)).toBeNull();
  });

  it("renders untrusted text as text, never as markup", () => {
    const { container } = render(<ReceiptCard item={make({ title: "<img src=x onerror=alert(1)>", subtitle: "<script>alert(1)</script>" })} />);
    expect(container.querySelector("img")).toBeNull();
    expect(container.querySelector("script")).toBeNull();
    expect(screen.getByText("<img src=x onerror=alert(1)>")).toBeTruthy();
  });
});

describe("<StackBar />", () => {
  const zero = { purchase: 0, music: 0, place: 0, photo: 0, search: 0, message: 0, note: 0, event: 0, movie: 0 } satisfies Record<ReceiptType, number>;

  it("exposes the mix as an accessible image", () => {
    render(<StackBar byType={{ ...zero, purchase: 3, music: 1 }} />);
    const img = screen.getByRole("img");
    expect(img.getAttribute("aria-label")).toMatch(/3 purchases, 1 music/);
  });

  it("does not crash with no data", () => {
    render(<StackBar byType={zero} />);
    expect(screen.getByRole("img")).toBeTruthy();
  });
});
