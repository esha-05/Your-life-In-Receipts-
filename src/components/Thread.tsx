import type { Item } from "@/types";
import { TYPE_META } from "@/lib/meta";
import { fmtTime, gap, money } from "@/lib/format";

/** Vertical timeline of traces — used inside moments and the day dialog. */
export function Thread({ items }: { items: Item[] }) {
  return (
    <ol className="relative ml-3 border-l border-line">
      {items.map((it, i) => {
        const meta = TYPE_META[it.type];
        const Icon = meta.icon;
        return (
          <li key={it.id} className="relative pb-5 pl-7 last:pb-0">
            <span
              className="absolute -left-3 top-0 grid size-6 place-items-center rounded-full border border-line bg-ink-2"
              style={{ color: meta.color }}
            >
              <Icon className="size-3.5" aria-hidden />
              <span className="sr-only">{meta.label}</span>
            </span>
            <p className="flex flex-wrap items-baseline gap-x-2 font-mono text-xs text-muted">
              <time dateTime={it.timestamp}>{fmtTime(it.date)}</time>
              {i > 0 && <span>+{gap(items[i - 1].date, it.date)}</span>}
            </p>
            <p className="mt-0.5 font-medium">
              {it.title}
              {it.type === "purchase" && (
                <span className="ml-2 font-mono text-sm text-amber">{money(it.amount ?? 0)}</span>
              )}
            </p>
            <p className="text-sm text-muted">{it.subtitle}</p>
          </li>
        );
      })}
    </ol>
  );
}
