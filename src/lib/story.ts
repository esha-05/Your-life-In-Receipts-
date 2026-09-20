import type { Item } from "@/types";
import type { Chapter } from "./chapters";
import type { Finding } from "./patterns";
import type { ThemeGraph } from "./graph";
import { TRAITS, themeLabel } from "./themes";

export interface Summary {
  you: string;
  paragraph: string;
  hub: string;
}

const lower = (p: string) => p.replace(/^The /, "the ");
const join = (a: string[]) => (a.length <= 1 ? a.join("") : `${a.slice(0, -1).join(", ")} and ${a[a.length - 1]}`);

export function buildSummary(items: Item[], chapters: Chapter[], graph: ThemeGraph, findings: Finding[]): Summary {
  const counts = new Map<string, number>();
  for (const it of items) for (const t of it.tags) if (TRAITS[t]) counts.set(t, (counts.get(t) ?? 0) + 1);
  const traits = [...counts].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([t]) => TRAITS[t]);
  const you = traits.length ? `Someone who ${join(traits)}.` : "Someone with a lot going on.";

  const first = chapters[0], last = chapters[chapters.length - 1];
  const middle = chapters.slice(1, -1).map((c) => lower(c.persona));
  const year = items[0]?.date.getFullYear();
  const parts = [
    chapters.length > 1
      ? `${year} began as ${lower(first.persona)} and ended as ${lower(last.persona)}.`
      : `${year} was one long stretch of ${first ? lower(first.persona) : "ordinary days"}.`,
    middle.length ? `In between came ${join(middle)}.` : "",
    graph.hub ? `Through all of it, #${themeLabel(graph.hub)} kept turning up beside everything else — the thread that ties the year together.` : "",
    findings[0] ? `And something was hiding in plain sight: ${findings[0].headline.replace(/[.]$/, "").replace(/^\w/, (c) => c.toLowerCase())}.` : "",
  ];
  return { you, paragraph: parts.filter(Boolean).join(" "), hub: graph.hub };
}
