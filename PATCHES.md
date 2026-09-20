# Apply in this order (≈ 40 min). Run `npm run verify` at the end.

## 0. Copy the new files in (drop the zip contents into your repo root)
Adds: `src/lib/{validation,finance,model}.ts`, `src/hooks/*`, `src/config/routes.ts`,
`src/components/SiteChrome.tsx`, **replaces** `src/lib/data.ts` and `src/App.tsx`,
plus `tests/`, `vitest.config.ts`, `docs/`, `.github/workflows/ci.yml`, `LICENSE`, `README.md`.

## 1. Install test tooling
```bash
npm i -D vitest jsdom @testing-library/react @testing-library/dom
# if npm reports ERESOLVE against vite 8:  add --legacy-peer-deps
```
`package.json` → scripts:
```json
"test": "vitest run",
"test:watch": "vitest",
"verify": "npm run check-data && npm run typecheck && npm test && npm run build"
```

## 2. `src/lib/patterns.ts` — make it pure (it silently read a global) + fix "expensive month"
```diff
- import { byDay } from "./data";
+ import { categoryOf, isSpend } from "./finance";
```
```diff
-function streaks(): Finding | null {
-  const keys = [...byDay.keys()].sort();
+function streaks(items: Item[]): Finding | null {
+  const byDay = new Map<string, Item[]>();
+  for (const it of items) {
+    const list = byDay.get(it.dayKey);
+    if (list) list.push(it);
+    else byDay.set(it.dayKey, [it]);
+  }
+  const keys = [...byDay.keys()].sort();
```
In `detectFindings`: `streaks()` → `streaks(items)`.

In `spendPeak`:
```diff
-  const buys = items.filter((i) => i.type === "purchase");
+  const buys = items.filter(isSpend);
```
```diff
-  for (const b of inPeak) cats.set(b.title.split(" - ")[0], (cats.get(b.title.split(" - ")[0]) ?? 0) + (b.amount ?? 0));
+  for (const b of inPeak) {
+    const c = categoryOf(b);
+    cats.set(c, (cats.get(c) ?? 0) + (b.amount ?? 0));
+  }
```

## 3. Stop counting money transfers as spending
**`src/lib/stats.ts`**
```diff
+import { categoryOf, isSpend } from "./finance";
...
-    if (it.type === "purchase") {
+    if (isSpend(it)) {
       spend += it.amount ?? 0;
-      inc(cats, it.title.split(" - ")[0], it.amount ?? 0);
+      inc(cats, categoryOf(it), it.amount ?? 0);
     }
```
**`src/lib/chapters.ts`**
```diff
+import { categoryOf, isSpend, spendOf } from "./finance";
...
-      if (it.type === "purchase") {
+      if (isSpend(it)) {
         spend += it.amount ?? 0;
-        const c = it.title.split(" - ")[0];
+        const c = categoryOf(it);
         cats.set(c, (cats.get(c) ?? 0) + (it.amount ?? 0));
       }
...
-    const maxAmt = Math.max(1, ...items.map((i) => i.amount ?? 0));
+    const maxAmt = Math.max(1, ...items.map(spendOf));
...
-      s: weight[it.type] + (it.type === "purchase" ? (Math.log1p(it.amount ?? 0) / Math.log1p(maxAmt)) * 3 : 0) + it.tags.filter((t) => signature.includes(t)).length * 2,
+      s: weight[it.type] + (Math.log1p(spendOf(it)) / Math.log1p(maxAmt)) * 3 + it.tags.filter((t) => signature.includes(t)).length * 2,
```
**`src/lib/moments.ts`**
```diff
+import { isSpend, spendOf } from "./finance";
...
-    case "purchase": return `spent ${money(it.amount ?? 0)} on ${it.title.toLowerCase()}`;
+    case "purchase": return isSpend(it)
+      ? `spent ${money(it.amount ?? 0)} on ${it.title.toLowerCase()}`
+      : `moved ${money(it.amount ?? 0)} (${it.title.toLowerCase()})`;
...
-  const spend = group.reduce((s, g) => s + (g.type === "purchase" ? g.amount ?? 0 : 0), 0);
+  const spend = group.reduce((s, g) => s + spendOf(g), 0);
```
**`src/components/DayDialog.tsx`**
```diff
+import { spendOf } from "@/lib/finance";
...
-    const spend = items.reduce((s, i) => s + (i.type === "purchase" ? i.amount ?? 0 : 0), 0);
+    const spend = items.reduce((s, i) => s + spendOf(i), 0);
```

## 4. `src/views/WebView.tsx` — reuse the cached graph (no second force layout)
```diff
-import { buildGraph } from "@/lib/graph";
+import { getGraph } from "@/lib/model";
...
-  const graph = useMemo(() => buildGraph(items, narrow ? 560 : 1000, narrow ? 780 : 640), [narrow]);
+  const graph = useMemo(() => getGraph(narrow ? 560 : 1000, narrow ? 780 : 640), [narrow]);
```

## 5. (Innovation) WebView — "moments this thread appears in"
Makes the *connection* idea actionable: pick a theme → jump straight to the moments it belongs to.
```diff
+import { useReceiptModel } from "@/hooks/useReceiptModel";
...
 export function WebView({ theme, onSelect, onOpenDay, onExplore }: Props) {
+  const { moments } = useReceiptModel();
...  (after `const detail = useMemo(...)`)
+  const related = useMemo(
+    () => moments.filter((m) => m.items.some((i) => i.tags.includes(current))).sort((a, b) => b.score - a.score),
+    [moments, current],
+  );
```
Inside the `<aside>`, before the "A few traces from this thread" block:
```tsx
<div>
  <h3 className="eyebrow mb-3">Moments this thread appears in · {related.length}</h3>
  <ul className="space-y-1">
    {related.slice(0, 3).map((m) => (
      <li key={m.id}>
        <button type="button" onClick={() => onOpenDay(m.dayKey)} className="w-full rounded-lg p-2 text-left transition-colors hover:bg-ink-3">
          <span className="block truncate text-sm">{m.headline}</span>
          <span className="block font-mono text-xs text-muted">{m.kicker}</span>
        </button>
      </li>
    ))}
  </ul>
</div>
```
(If you skip this, delete "and the moments it shows up in" from the README's Web row.)

## 6. Cheap UI/perf wins
* **Tiny text:** find/replace `text-[0.62rem]` and `text-[0.68rem]` → `text-xs` (12 px). Fixes legibility on phones.
* **Memoize list cards:** `export const ReceiptCard = memo(function ReceiptCard(...) {...})` (same for `MomentCard`).
* **Skip off-screen work:** in `index.css` add
  `#main section[id^="chapter-"] { content-visibility: auto; contain-intrinsic-size: auto 900px; }`
* **Connection web on phones:** in `ConnectionWeb.tsx` raise label `fontSize` from `16` to `graph.size.w < 700 ? 22 : 16` (the 560-px canvas is scaled to ~375 px, which shrinks 16 → ~11 px).
* **Share previews:** add `og:title`, `og:description`, `og:image` meta tags to `index.html`.

## 7. Verify
```bash
npm run verify        # dataset check → typecheck → tests → build
npm run preview       # then test 375 / 768 / 1024 / 1440 px and run Lighthouse
```
