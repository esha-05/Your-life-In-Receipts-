// Generates a small PLACEHOLDER dataset with the exact same schema as build_dataset.py.
// Replace src/data/life_receipts_2017.json with your real file — nothing else needs to change.
import { writeFileSync } from "node:fs";

let s = 42;
const rnd = () => ((s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296);
const pick = (a) => a[Math.floor(rnd() * a.length)];
const int = (a, b) => a + Math.floor(rnd() * (b - a + 1));
const iso = (d) => d.toISOString().slice(0, 19);

const cats = {
  Food: { sub: ["Snacks", "Restaurant", "Tea"], tags: ["food", "comfort"], amt: [40, 650], places: ["Vaishali Restaurant", "German Bakery", "Local Tea Stall", "FC Road Food Court"] },
  Transportation: { sub: ["Auto", "Train", "Bus"], tags: ["commute", "travel"], amt: [20, 400], places: ["Shivaji Nagar Station", "Deccan Bus Depot", "MG Road Junction"] },
  Household: { sub: ["Groceries", "Appliances"], tags: ["home"], amt: [150, 2500], places: ["Kirana Store, Lane 4", "City Mall", "Sunrise Supermarket"] },
  Health: { sub: ["Medicine", "Doctor"], tags: ["health", "self-care"], amt: [100, 1800], places: ["Apollo Pharmacy", "Family Clinic"] },
  Family: { sub: ["Dinner", "Trip"], tags: ["family"], amt: [300, 4000], places: ["Grandma's House", "Family Gathering Hall"] },
  Gift: { sub: ["Birthday", "Festival"], tags: ["family", "celebration"], amt: [400, 5000], places: ["Phoenix Mall", "Gift Corner"] },
  subscription: { sub: ["Tata Sky", "Netflix"], tags: ["entertainment", "routine"], amt: [199, 800], places: [] },
  "Equity Mutual Fund A": { sub: ["SIP"], tags: ["finance", "future-planning"], amt: [2000, 10000], places: [] },
};
const searches = {
  Food: ["easy dinner recipes", "best restaurants Pune"], Household: ["how to fix mixer grinder", "home cleaning tips"],
  Health: ["home remedies for cold", "nearest pharmacy open now"], Gift: ["birthday gift ideas for mother"],
  subscription: ["best web series 2017", "upcoming movies this weekend"], "Equity Mutual Fund A": ["SIP vs lump sum investment"],
};
const notes = ["Feeling good about saving a bit more this month.", "Had a long day, but the evening tea helped.", "Mom's birthday coming up, must plan something special.", "Great weekend, finally relaxed after a busy week.", "Need to review my mutual fund performance this quarter."];
const msgs = [["Mom", "Bring something sweet when you come home."], ["Sneha", "Family function this Sunday, you coming?"], ["Priya", "That new series is so good, we need to talk about it."], ["Office Group", "Team outing planned for next month!"]];
const movies = [["Dangal", "Drama", "Theatre"], ["Stranger Things S2", "Sci-Fi", "Netflix"], ["Sacred Games", "Thriller", "Netflix"], ["Golmaal Again", "Comedy", "Theatre"], ["Newton", "Drama", "Theatre"]];
const events = [["Family Birthday Celebration", "celebration"], ["Weekend Trek", "leisure"], ["College Friends Reunion", "social"], ["Cousin's Wedding", "celebration"]];
const tracks = [["Shape of You", "Ed Sheeran", "÷"], ["Closer", "The Chainsmokers", "Collage"], ["Tum Hi Ho", "Arijit Singh", "Aashiqui 2"], ["Kar Gayi Chull", "Badshah", "Kapoor & Sons"], ["Despacito", "Luis Fonsi", "Vida"], ["Ae Dil Hai Mushkil", "Arijit Singh", "ADHM"], ["Believer", "Imagine Dragons", "Evolve"]];

const out = [];
let n = 0;
const rec = (o) => out.push({ id: `${o.type}-${++n}`, location: null, ...o });
const tagsOf = (t) => [...new Set(t)].sort();

for (let d = 0; d < 365; d++) {
  const day = new Date(Date.UTC(2017, 0, 1 + d));
  const dow = day.getUTCDay();
  const anchors = rnd() < (dow === 0 || dow === 6 ? 0.85 : 0.55) ? int(1, 3) : 0;
  for (let a = 0; a < anchors; a++) {
    const cat = pick(Object.keys(cats));
    const c = cats[cat];
    const t = new Date(day.getTime() + int(8, 21) * 3600e3 + int(0, 59) * 60e3);
    const place = c.places.length ? pick(c.places) : null;
    rec({ type: "purchase", timestamp: iso(t), title: `${cat} - ${pick(c.sub)}`, subtitle: cat, amount: int(c.amt[0], c.amt[1]), currency: "INR", mode: pick(["Cash", "UPI", "Debit Card"]), tags: tagsOf(c.tags), location: place ? { name: "Pune" } : null });
    if (place) {
      rec({ type: "place", timestamp: iso(new Date(t.getTime() + int(-3, 3) * 3600e3)), title: place, subtitle: `Visited near ${cat.toLowerCase()} errand`, tags: tagsOf([...c.tags, "visit"]), location: { name: place, city: "Pune" } });
      if (rnd() < 0.4) rec({ type: "photo", timestamp: iso(new Date(t.getTime() + int(5, 40) * 60e3)), title: `Photo at ${place}`, subtitle: pick(["Quick snap", "Candid moment", "For memories"]), tags: tagsOf([...c.tags, "memory"]), location: { name: place, city: "Pune" } });
    }
    if (searches[cat] && rnd() < 0.5) rec({ type: "search", timestamp: iso(new Date(t.getTime() - int(1, 24) * 3600e3)), title: pick(searches[cat]), subtitle: "Web search", tags: tagsOf([...c.tags, "research"]) });
    if (["Family", "Health", "Equity Mutual Fund A"].includes(cat) && rnd() < 0.65) rec({ type: "note", timestamp: iso(new Date(t.getTime() + int(1, 8) * 3600e3)), title: "Personal Note", subtitle: pick(notes), tags: tagsOf([...c.tags, "reflection"]) });
    if (["Family", "Gift", "subscription"].includes(cat) && rnd() < 0.75) { const [who, body] = pick(msgs); rec({ type: "message", timestamp: iso(new Date(t.getTime() - int(1, 12) * 3600e3)), title: `Message from ${who}`, subtitle: body, tags: tagsOf([...c.tags, "communication"]) }); }
    if (["Family", "Gift"].includes(cat) && rnd() < 0.6) { const [e, tag] = pick(events); rec({ type: "event", timestamp: iso(t), title: e, subtitle: `A ${tag} moment`, tags: tagsOf([...c.tags, tag]), location: { name: "Pune", city: "Pune" } }); }
    if (cat === "subscription" && rnd() < 0.8) { const [m, g, p] = pick(movies); rec({ type: "movie", timestamp: iso(new Date(t.getTime() + int(2, 6) * 3600e3)), title: m, subtitle: `${g} on ${p}`, tags: tagsOf([...c.tags, g.toLowerCase(), "entertainment"]) }); }
  }
  const listens = rnd() < 0.5 ? int(1, 3) : 0;
  for (let k = 0; k < listens; k++) {
    const hour = pick([7, 8, 9, 18, 19, 20, 23, 0, 1, 14]);
    const [title, artist, album] = pick(tracks);
    const late = hour >= 23 || hour < 5;
    rec({ type: "music", timestamp: iso(new Date(day.getTime() + hour * 3600e3 + int(0, 59) * 60e3)), title, subtitle: artist, album, platform: "android", msPlayed: int(90000, 260000), tags: tagsOf([late ? "late-night" : "focus", ...(hour >= 7 && hour <= 10 ? ["commute"] : [])]) });
  }
}
out.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
writeFileSync(new URL("../src/data/life_receipts_2017.json", import.meta.url), JSON.stringify(out, null, 2));
console.log("sample records:", out.length);
