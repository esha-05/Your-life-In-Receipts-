import { cn } from "@/lib/cn";

interface Props {
  labels: string[];
  values: number[];
  highlight?: number;
  unit?: string;
  color?: string;
  className?: string;
}

export function MiniBars({ labels, values, highlight = -1, unit = "", color = "var(--color-amber)", className }: Props) {
  const max = Math.max(1, ...values);
  const summary = labels.map((l, i) => `${l} ${values[i]}${unit && unit !== "pairs" ? unit : ""}`).join(", ");
  return (
    <div role="img" aria-label={`Bar chart. ${summary}.${highlight >= 0 ? ` Highest: ${labels[highlight]}.` : ""}`} className={cn("select-none", className)}>
      <div className="flex h-28 items-end gap-1.5 pt-5" aria-hidden>
        {values.map((v, i) => (
          <div key={i} className="flex h-full min-w-0 flex-1 flex-col justify-end" title={`${labels[i]}: ${v}${unit}`}>
            <div
              className="relative w-full rounded-t-[3px]"
              style={{
                height: `${Math.max(v > 0 ? 4 : 1, (v / max) * 100)}%`,
                background: i === highlight ? color : "color-mix(in oklab, var(--color-muted) 45%, var(--color-ink-3))",
              }}
            >
              {i === highlight && <span className="absolute inset-x-0 -top-4 text-center font-mono text-[0.62rem] leading-none text-amber">{v}</span>}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-1.5 flex gap-1.5 font-mono text-[0.62rem] text-muted" aria-hidden>
        {labels.map((l, i) => (
          <span key={i} className={cn("min-w-0 flex-1 truncate text-center", i === highlight && "text-amber")}>{l}</span>
        ))}
      </div>
    </div>
  );
}
