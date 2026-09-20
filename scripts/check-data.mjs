// Validates src/data/life_receipts_2017.json before you build.  Run: npm run check-data
import { readFileSync } from "node:fs";

const file = new URL("../src/data/life_receipts_2017.json", import.meta.url);
const text = readFileSync(file, "utf8");

if (/\bNaN\b|\bInfinity\b/.test(text)) {
  console.error("✗ File contains NaN/Infinity (Python wrote a missing pandas value). Not valid JSON.");
  console.error('  Fix in build_dataset.py: json.dump(..., allow_nan=False) will show you which field, or replace NaN with None / "".');
  process.exit(1);
}
const data = JSON.parse(text);
const types = new Set(["purchase", "music", "place", "photo", "search", "message", "note", "event", "movie"]);
const counts = {};
let bad = 0;
for (const r of data) {
  counts[r.type] = (counts[r.type] ?? 0) + 1;
  if (!types.has(r.type) || !r.id || !r.title || Number.isNaN(Date.parse(r.timestamp)) || !Array.isArray(r.tags)) {
    if (bad++ < 5) console.error("✗ bad record:", JSON.stringify(r).slice(0, 160));
  }
}
console.log(`✓ ${data.length} records`, counts);
if (bad) { console.error(`✗ ${bad} malformed records`); process.exit(1); }
