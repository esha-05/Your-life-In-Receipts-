# Your Life, In Receipts

**Live app:** https://your-life-in-receipts-six.vercel.app/
**GitHub repository:** https://github.com/esha-05/your-life-in-receipts

An interactive reconstruction of one year (2017) of a person's digital
life — 2,032 fragmentary "receipts" across nine categories — turned into
discoverable moments, connected threads, and an explorable story, built
for the WebRush 2026 frontend hackathon.

## Problem Statement

WebRush 2026: *Your Life, In Receipts* — transform a dataset of
disconnected digital-life fragments (music, purchases, places, photos,
searches, notes, messages, events, movies) into a meaningful, interactive
story. A plain chronological timeline was explicitly disallowed; the
brief asked for genuine cross-category connections to be surfaced and
made explorable.

## Solution Overview

Rather than listing 2,032 receipts in date order, the app runs every
receipt through a small connection engine that:

1. Groups receipts by day and by shared tags (mood, theme, activity)
   across **different** receipt types — a purchase, a place, and a photo
   sharing the same day and the same tag becomes one connected "moment,"
   not three unrelated rows.
2. Rolls those moments up into four auto-generated **chapters** (one per
   quarter of the year), each titled and themed from the data's own
   dominant tags rather than hand-written copy.
3. Renders the same underlying graph as an interactive **Connection Web**,
   so a person can start from a theme (e.g. "commute" or "celebration")
   and see every moment it touches.
4. Surfaces higher-level **patterns** (recurring streaks, spending peaks,
   listening habits) computed once and shared across views.

Five other views — Story, Connection Web, Patterns, Moments, Explore, and
Insights — each look at the same underlying model from a different angle,
so no single view has to do everything.

## Features

- **Story view** — the four auto-generated chapters, expandable into their
  connected moments
- **Connection Web** — an interactive graph of shared themes/tags across
  receipt types; selecting a thread jumps to the moments it appears in
- **Patterns** — detected recurring behaviors (streaks, spending peaks)
  with day-level drill-down
- **Moments** — the full list of cross-category connected clusters
- **Explore** — full-text search plus category and month filtering across
  all 2,032 receipts
- **Insights** — live-computed statistics and charts (spend by category,
  listening time, monthly activity, top tags/artists) — nothing hardcoded
- **Day detail dialog** — click into any day to see everything that
  happened, across every category, side by side
- Mobile bottom navigation, keyboard-operable throughout, reduced-motion
  support

## Dataset

2,032 records across all nine required categories:

| Category | Count | Source |
|---|---|---|
| Purchases | 889 | Real — household transaction data, 2017 |
| Music | 456 | Real — Spotify listening history, 2017 |
| Places | 258 | Synthesized, anchored to real purchase dates/categories |
| Searches | 121 | Synthesized, anchored to real purchase context |
| Messages | 82 | Synthesized, anchored to real family/gift/subscription dates |
| Photos | 97 | Synthesized, anchored to synthesized place visits |
| Movies | 51 | Synthesized, anchored to real subscription dates |
| Notes | 44 | Synthesized, anchored to real finance/health/family dates |
| Events | 34 | Synthesized; seasonal titles (Diwali, Rakhi, New Year) only applied when the date genuinely falls in that real-world window |

Only Music and Purchases had real source data covering the full year; the
remaining seven categories are synthesized but deliberately timed and
tagged against those two real datasets, so the connections the app
surfaces (same-day, shared-tag clusters) reflect a plausible, internally
consistent story rather than arbitrary filler. This is documented in
full in `docs/` alongside the data-generation script.

## Architecture

```
src/
├── lib/
│   ├── data.ts         # load + normalize the raw dataset
│   ├── validation.ts   # dataset boundary/shape checks
│   ├── finance.ts       # spend vs. transfer classification, category parsing
│   ├── model.ts         # shared derived model: moments, graph, chapters, stats
│   ├── moments.ts       # connection engine: day + shared-tag clustering
│   ├── chapters.ts      # quarterly chapter generation from moments
│   ├── graph.ts         # connection-web graph layout
│   ├── patterns.ts      # streak/peak pattern detection
│   └── stats.ts         # insights aggregation
├── hooks/
│   ├── useReceiptModel.ts  # single source of truth for all derived data
│   └── useHashRoute.ts     # lightweight client-side routing
├── config/
│   └── routes.ts
├── components/          # shared UI: SiteChrome, DayDialog, cards, etc.
├── views/                # one file per view (Story/Web/Patterns/Moments/Explore/Insights)
├── types.ts
└── data/
    └── life_receipts_2017.json
tests/                    # Vitest coverage for the data/model layer
docs/                      # dataset provenance + generation notes
.github/workflows/ci.yml   # typecheck + test + build on every push
```

Data flows one direction: raw JSON → validation → normalization →
the shared model (`useReceiptModel`) → views. Every view reads from the
same computed model instead of recomputing its own version of the data,
so moments/chapters/stats stay consistent everywhere they appear.

## Accessibility

- Semantic HTML throughout (native `<dialog>` for the day detail view,
  proper heading hierarchy, landmark regions)
- Full keyboard navigation, including arrow-key tab switching and a
  skip-to-content link
- Visible focus rings on every interactive element
- `prefers-reduced-motion` respected — animations disable automatically
- Text contrast checked against WCAG AA on both the dark app theme and
  the light "receipt paper" surfaces
- ARIA labels on icon-only controls and live regions on dynamic result counts

## Responsive Design

- Mobile-first layout with a dedicated bottom navigation bar under the
  desktop tab breakpoint
- Connection Web scales its layout and label sizing for narrow viewports
- Tested at 375px, 768px, 1024px, and 1440px
- No horizontal overflow; long content (tag lists, receipt notes) wraps
  or scrolls within its own container

## Performance

- Views are code-split and lazy-loaded (only the Story view loads eagerly)
- The dataset ships as a pre-stringified JSON blob to reduce parse cost
- Derived data (moments, chapters, graph, stats) is computed once via a
  single memoized hook and shared across all views, not recomputed per view
- List cards are memoized to avoid unnecessary re-renders
- `content-visibility` used on off-screen chapter sections

## Tech Stack

- React 19 + TypeScript
- Vite
- Tailwind CSS v4
- Motion (animation, respects reduced-motion)
- Lucide React (icons)
- Recharts (Insights charts)
- Vitest + Testing Library (data/model layer coverage)

## Testing & Verification

```bash
npm run verify   # dataset validation → typecheck → tests → production build
```

This runs dataset boundary checks, TypeScript type checking, the Vitest
suite, and a production build in one pass — the same gate used before
every submission.

## Run Locally

```bash
npm install
npm run dev
```

## Production Build

```bash
npm run build
npm run preview
```

## Deployment

Deployed on Vercel: **https://your-life-in-receipts-six.vercel.app/**
Source: **https://github.com/esha-05/your-life-in-receipts**
