import type { Item } from "@/types";
import { TYPE_META } from "@/lib/meta";
import { fmtShortDay, fmtTime, money } from "@/lib/format";

export function ReceiptCard({ item }: { item: Item }) {
  const meta = TYPE_META[item.type];
  const Icon = meta.icon;
  return (
    <article
      className="paper relative flex h-full flex-col gap-3 rounded-sm p-4 shadow-[0_14px_30px_-14px_rgb(0_0_0/0.7)]"
      style={{ borderTop: `4px solid ${meta.color}` }}
    >
      <header className="flex items-center justify-between gap-2 text-[0.68rem] uppercase tracking-widest text-paper-muted">
        <span className="inline-flex items-center gap-1.5">
          <Icon className="size-3.5" aria-hidden /> {meta.label}
        </span>
        <time dateTime={item.timestamp}>
          {fmtShortDay(item.date)} · {fmtTime(item.date)}
        </time>
      </header>

      <h3 className="font-display text-lg font-semibold leading-snug">{item.title}</h3>
      <p className="line-clamp-3 text-sm text-paper-muted">
        {item.subtitle}
        {item.type === "music" && item.album ? ` — ${item.album}` : ""}
      </p>

      <footer className="mt-auto flex items-end justify-between gap-3 border-t border-dashed border-paper-ink/30 pt-3">
        <ul className="flex flex-wrap gap-1.5" aria-label="Tags">
          {item.tags.slice(0, 3).map((t) => (
            <li key={t} className="rounded-sm bg-paper-ink/8 px-1.5 py-0.5 text-[0.68rem] text-paper-muted">
              #{t}
            </li>
          ))}
        </ul>
        {item.type === "purchase" && (
          <p className="text-right text-base font-bold tabular-nums">{money(item.amount ?? 0)}</p>
        )}
      </footer>
    </article>
  );
}
