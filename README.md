# Your Life, In Receipts — WebRush 2026

A year of purchases, songs, places, searches, messages, notes, events and movies —
reconstructed into **moments** you can walk back through.

**Stack:** React 19 · TypeScript · Vite · Tailwind CSS v4 · Motion · Recharts · Lucide  
Frontend-only. No backend, no runtime dependency on any network service.

## Run it

```bash
npm install
npm run dev          # http://localhost:5173
npm run build        # type-check + production build
```

## Use your real data

1. Run `build_dataset.py` to produce `life_receipts_2017.json`.
2. Copy it over `src/data/life_receipts_2017.json`.
3. `npm run check-data` — validates the file (catches pandas `NaN`, which is invalid JSON).

The repo ships with a small **placeholder** dataset in the same schema so it runs out of the box
(`npm run sample-data` regenerates it).

## What's in it

The flow is **Raw data → Insights → Connections → Story**, not a list sorted by date.

| View | What it does | Where the logic lives |
| --- | --- | --- |
| **Story** | Scroll-through narrative: the year split into *chapters* (each with a persona, what changed, defining receipts), then the connection thread, top patterns, and a "what it all means" verdict with an itemized receipt. | `lib/chapters.ts`, `lib/story.ts` |
| **Web** | A force-directed map of themes with **no time axis**. Themes are linked when they appear in the same burst of activity. Select one to see its span across record types, its months, what it travels with, and sample traces. | `lib/graph.ts` |
| **Patterns** | Automatically detected behaviours, each with a chart and expandable evidence: search→purchase lag, what precedes celebrations, weekday themes, after-midnight listening, spending peak, repeat places/songs, streaks. | `lib/patterns.ts` |
| **Moments** | Time-clustered stories that connect 2+ kinds of trace (search → purchase → photo…). | `lib/moments.ts` |
| **Explore** | Every record as a receipt; filter by type, tag, month, text. | |
| **Insights** | Monthly/hourly charts, spend, artists, and the 365-day calendar. | |

### How the engines work
- **Chapters** — each month becomes a vector (theme mix + record-type mix). Adjacent months are merged bottom-up
  (Ward-style) until ~5 chapters remain, so boundaries fall where behaviour actually shifted. A chapter's persona comes from the
  themes over-represented in it compared with the whole year; "what changed" diffs it against the previous chapter.
- **Connection web** — records are grouped into bursts of activity (4h gap / 10h span); themes that co-occur in a burst get an
  edge weighted by cosine similarity. Layout is a deterministic Fruchterman–Reingold simulation plus a de-overlap pass.
- **Patterns** — independent detectors return `null` when the data is too thin, so cards only appear when there's real evidence.

Dataset assumptions live in `src/lib/themes.ts` (e.g. the random `focus/background/upbeat` mood tags are ignored).

## Quality notes

- **Accessibility** — semantic landmarks, skip link, focus moved to the new view on navigation, keyboard-navigable
  calendar (arrow keys / Home / End), native `<dialog>` for the day view (focus trap + Esc), `aria-pressed`
  filters, live result counts, `prefers-reduced-motion` respected. axe-core WCAG 2.1 AA audit: 0 violations.
- **Responsive** — mobile bottom navigation, fluid type (`clamp`), horizontally scrollable calendar.
- **Performance** — Insights (Recharts) is code-split and lazy-loaded; self-hosted variable fonts; deferred search input; all engines run once at load.
- **Design** — dark "archive" theme with cream thermal-receipt cards; type colours are consistent across every view.

## Deploy

```bash
npm i -g vercel
vercel        # preset: Vite · build: npm run build · output: dist
```
