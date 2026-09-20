import { Receipt } from "lucide-react";
import { VIEWS, type ViewId } from "@/config/routes";
import { YEAR } from "@/lib/data";
import { cn } from "@/lib/cn";

export function SkipLink() {
  return (
    <a href="#main" className="sr-only z-50 rounded-full bg-amber px-4 py-2 font-medium text-ink focus:not-sr-only focus:fixed focus:left-4 focus:top-4">
      Skip to content
    </a>
  );
}

export function SiteHeader({ view }: { view: ViewId }) {
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-ink/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 md:px-8">
        <a href="#/story" className="flex items-center gap-2.5 font-display text-lg font-semibold">
          <span className="grid size-8 place-items-center rounded-lg bg-amber text-ink"><Receipt className="size-4.5" aria-hidden /></span>
          <span>Life in Receipts <span className="font-mono text-xs font-normal text-muted">’{String(YEAR).slice(2)}</span></span>
        </a>
        <nav aria-label="Primary" className="hidden lg:block">
          <ul className="flex gap-1">
            {VIEWS.map(({ id, label, icon: Icon }) => (
              <li key={id}>
                <a
                  href={`#/${id}`}
                  aria-current={view === id ? "page" : undefined}
                  className={cn("inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm text-muted transition-colors hover:text-fg", view === id && "bg-ink-3 text-fg")}
                >
                  <Icon className="size-4" aria-hidden /> {label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}

export function MobileNav({ view }: { view: ViewId }) {
  return (
    <nav aria-label="Primary (mobile)" className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-ink/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden">
      <ul className="grid grid-cols-6">
        {VIEWS.map(({ id, label, icon: Icon }) => (
          <li key={id}>
            <a
              href={`#/${id}`}
              aria-current={view === id ? "page" : undefined}
              className={cn("flex min-h-14 flex-col items-center justify-center gap-1 py-2 text-xs text-muted", view === id && "text-amber")}
            >
              <Icon className="size-5" aria-hidden /> {label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-line pt-8 text-sm text-muted">
      <p className="max-w-2xl text-pretty">
        A reconstruction of {YEAR}. Purchases and listening come from real logs; the surrounding traces —
        places, searches, messages, events — are synthesized around them so the moments connect.
      </p>
      <p className="mt-2 font-mono text-xs">Built for WebRush 2026 · React · TypeScript · Tailwind · Motion · Recharts</p>
    </footer>
  );
}

export function ViewFallback() {
  return (
    <div className="py-24 text-center font-mono text-sm text-muted" role="status">
      Printing your receipts…
    </div>
  );
}
