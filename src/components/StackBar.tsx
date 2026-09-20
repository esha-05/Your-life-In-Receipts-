import type { ReceiptType } from "@/types";
import { TYPE_META, TYPE_ORDER } from "@/lib/meta";
import { count } from "@/lib/format";

export function StackBar({ byType }: { byType: Record<ReceiptType, number> }) {
  const total = Math.max(1, TYPE_ORDER.reduce((s, t) => s + byType[t], 0));
  const present = TYPE_ORDER.filter((t) => byType[t] > 0);
  return (
    <div>
      <div
        role="img"
        aria-label={`Mix of traces: ${present.map((t) => `${byType[t]} ${TYPE_META[t].plural.toLowerCase()}`).join(", ")}`}
        className="flex h-3 overflow-hidden rounded-full bg-ink-3"
      >
        {present.map((t) => (
          <span key={t} style={{ width: `${(byType[t] / total) * 100}%`, background: TYPE_META[t].color }} />
        ))}
      </div>
      <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
        {present.map((t) => (
          <li key={t} className="inline-flex items-center gap-1.5">
            <span className="size-2.5 rounded-sm" style={{ background: TYPE_META[t].color }} aria-hidden />
            {TYPE_META[t].plural} <span className="font-mono text-fg">{count(byType[t])}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
