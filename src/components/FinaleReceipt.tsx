import type { Chapter } from "@/lib/chapters";
import { count } from "@/lib/format";
import { themeLabel } from "@/lib/themes";
import { YEAR } from "@/lib/data";

export function FinaleReceipt({ chapters, hub, total }: { chapters: Chapter[]; hub: string; total: number }) {
  return (
    <div className="paper zigzag mx-auto w-full max-w-sm rounded-t-sm p-6 shadow-[0_30px_60px_-20px_rgb(0_0_0/0.8)] md:-rotate-1">
      <p className="text-center text-xs font-bold uppercase tracking-[0.25em]">Your {YEAR}, itemized</p>
      <div className="my-4 border-t border-dashed border-paper-ink/40" />
      <ol className="space-y-2 text-sm">
        {chapters.map((c) => (
          <li key={c.id} className="flex items-baseline gap-2">
            <span className="shrink-0 font-bold">CH.{c.index + 1}</span>
            <span className="truncate uppercase">{c.persona.replace(/^The /, "")}</span>
            <span className="leader" aria-hidden />
            <span className="shrink-0 tabular-nums">{c.range.toUpperCase()}</span>
          </li>
        ))}
      </ol>
      <div className="my-4 border-t border-dashed border-paper-ink/40" />
      <p className="flex justify-between text-sm"><span>THREAD THAT TIES IT</span><span className="font-bold">#{themeLabel(hub).toUpperCase()}</span></p>
      <p className="mt-2 flex justify-between text-base font-bold"><span>TOTAL TRACES</span><span className="tabular-nums">{count(total)}</span></p>
      <div aria-hidden className="mt-5 h-9" style={{ background: "repeating-linear-gradient(90deg, var(--color-paper-ink) 0 3px, transparent 3px 5px, var(--color-paper-ink) 5px 6px, transparent 6px 10px, var(--color-paper-ink) 10px 12px, transparent 12px 15px)" }} />
      <p className="mt-3 text-center text-[0.68rem] tracking-widest text-paper-muted">KEEP THIS RECEIPT</p>
    </div>
  );
}
