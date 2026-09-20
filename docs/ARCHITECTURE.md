# Architecture

## Goals

1. Turn untrusted, fragmented records into a **typed, validated model** once.
2. Keep all analysis **pure and testable** (no React, no globals, no I/O).
3. Keep the UI **thin**: views read the model and render; they do not compute.

## Layers

```mermaid
flowchart TD
  JSON[(life_receipts_2017.json)] --> V[lib/validation.ts]
  V --> D[lib/data.ts<br/>Item[] · byDay · YEAR]
  D --> E1[stats.ts]
  D --> E2[moments.ts]
  D --> E3[chapters.ts]
  D --> E4[graph.ts]
  D --> E5[patterns.ts]
  E1 & E2 & E3 & E4 & E5 --> M[lib/model.ts<br/>ReceiptModel · cached]
  M --> H[hooks/useReceiptModel]
  H --> A[App.tsx<br/>route → view]
  A --> Views[views/*]
  Views --> C[components/*]
```

| Layer | Folder | Rule |
|---|---|---|
| Boundary | `lib/validation.ts`, `lib/data.ts` | The only code that touches raw JSON. Everything downstream receives `Item[]`. |
| Domain | `lib/*.ts` | Pure functions of `Item[]`. Must not import React components. |
| Model | `lib/model.ts` | Assembles engines into one `ReceiptModel`; caches it (and the graph per canvas size). |
| State / wiring | `hooks/`, `config/` | Routing, model access, navigation definitions. |
| Presentation | `views/`, `components/` | Read-only consumers of the model; own only UI state (filters, open panels). |

## Engines

| Engine | Input → Output | Key parameters |
|---|---|---|
| `moments` | `Item[]` → `Moment[]` | 4 h gap, 10 h span, ≥ 3 records, ≥ 2 kinds |
| `chapters` | `Item[]` → `Chapter[]` | ≤ 5 chapters, Ward-style adjacent merge, signature lift ≥ 1.08 |
| `graph` | `Item[]` → `ThemeGraph` | ≥ 8 occurrences, ≤ 22 themes, 3 links/theme, 420-step FR layout |
| `patterns` | `Item[]` → `Finding[]` | 8 detectors, each with evidence |
| `stats` | `Item[]` → `Stats` | aggregates for charts and KPIs |
| `story` | model parts → `Summary` | narrative sentences |

## Decision records

**Hash routing over a router library.** Six flat views need no nested routes. `useHashRoute` is ~20 lines, adds no dependency and deep links survive static hosting.

**One cached model.** Previously derived data was rebuilt in several places (the force layout ran twice on desktop). `getReceiptModel()` and `getGraph(w, h)` compute each result once.

**Validation at the boundary.** The dataset is JSON produced by a Python script; a bad record should degrade gracefully, not white-screen. `parseReceipts` drops and counts bad records; `check-data` fails the build early.

**`finance.ts` for spend.** "Purchase" ≠ "spending" (bank transfers are purchases in the source data). One helper defines the rule so stats, chapters, moments, patterns and the day dialog agree.

**Code splitting by route.** The landing view is eager; Web, Patterns, Moments, Explore and Insights are lazy. Recharts only loads with Insights.

## Testing strategy

Engines are pure, so tests assert **invariants** (partitions, bounds, symmetry, determinism, "sums add up", "never `NaN`") rather than snapshots, plus explicit **empty-data** cases. Components are tested for content, accessible names and XSS-safety with Testing Library.
