/** Tags that carry no meaning on their own. */
/** `misc` is a catch-all; `focus/background/upbeat` are mood buckets assigned at random for daytime listening. */
export const HIDDEN_TAGS = new Set(["misc", "focus", "background", "upbeat"]);
/** Tags the dataset adds just to mark a record type — not "themes" in a persona sense. */
export const MARKER_TAGS = new Set(["visit", "memory", "research", "communication", "reflection"]);

const LABELS: Record<string, string> = {
  communication: "messages",
  visit: "places",
  memory: "photos",
  research: "searches",
  reflection: "notes",
  "future-planning": "future planning",
  "late-night": "late nights",
  "fresh-start": "fresh starts",
};
export const themeLabel = (t: string) => LABELS[t] ?? t;

export interface Persona { title: string; line: string }

export const PERSONAS: Record<string, Persona> = {
  finance: { title: "The Planner", line: "Money started pointing at the future — savings and investments took the lead." },
  "future-planning": { title: "The Planner", line: "Money started pointing at the future — savings and investments took the lead." },
  family: { title: "The Family Anchor", line: "Home and family pulled the days into their orbit." },
  celebration: { title: "The Celebrator", line: "Gifts, gatherings and plenty of reasons to show up." },
  health: { title: "The Self-Care Season", line: "Looking after yourself moved up the list." },
  "self-care": { title: "The Self-Care Season", line: "Looking after yourself moved up the list." },
  entertainment: { title: "The Screen Season", line: "Evenings belonged to stories on a screen." },
  routine: { title: "The Creature of Habit", line: "Small recurring things set the rhythm of the days." },
  "late-night": { title: "The Night Owl", line: "The days started late and the music ran later." },
  reflective: { title: "The Night Thinker", line: "Quiet hours, slow songs, a lot of thinking." },
  quiet: { title: "The Quiet Stretch", line: "Fewer loud moments, more still ones." },
  commute: { title: "The Commuter", line: "Life happened in motion — stations, stops and short hops." },
  travel: { title: "The Wanderer", line: "Distance crept into the routine." },
  food: { title: "The Comfort Seeker", line: "Small meals and familiar tastes carried the mood." },
  comfort: { title: "The Comfort Seeker", line: "Small meals and familiar tastes carried the mood." },
  learning: { title: "The Learner", line: "Curiosity took over: courses, tutorials, searches." },
  home: { title: "The Nester", line: "The house got the attention." },
  research: { title: "The Researcher", line: "Nothing got bought before it got looked up." },
  social: { title: "The Socialite", line: "Friends filled the calendar." },
  work: { title: "The Office Regular", line: "Work set the tempo." },
  leisure: { title: "The Weekend Escaper", line: "Days off were spent well away from the desk." },
  festival: { title: "The Festival Season", line: "Traditions and festivals set the mood." },
  energetic: { title: "The Early Riser", line: "Mornings had momentum." },
  "fresh-start": { title: "The Fresh Starter", line: "New beginnings, one morning at a time." },
  unwind: { title: "The Evening Unwinder", line: "The best part of the day was after it ended." },
};

export const TRAITS: Record<string, string> = {
  finance: "plans for the future",
  family: "keeps family close",
  celebration: "shows up for celebrations",
  health: "looks after their health",
  entertainment: "unwinds with a screen",
  "late-night": "listens late into the night",
  commute: "is always on the move",
  food: "finds comfort in food",
  learning: "keeps learning",
  home: "looks after home",
  research: "looks things up before deciding",
};

export const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export const pct = (n: number, d: number) => (d ? Math.round((n / d) * 100) : 0);

/** Pick n evenly spaced elements. */
export function spread<T>(arr: T[], n: number): T[] {
  if (arr.length <= n) return arr;
  return Array.from({ length: n }, (_, i) => arr[Math.round((i * (arr.length - 1)) / (n - 1))]);
}
