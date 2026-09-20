export type ReceiptType =
  | "purchase" | "music" | "place" | "photo" | "search"
  | "message" | "note" | "event" | "movie";

export interface Receipt {
  id: string;
  type: ReceiptType;
  /** ISO timestamp without timezone, e.g. 2017-03-18T14:32:00 */
  timestamp: string;
  title: string;
  subtitle: string;
  tags: string[];
  location: { name: string; city?: string } | null;
  // purchase
  amount?: number;
  currency?: string;
  mode?: string;
  // music
  album?: string;
  platform?: string;
  msPlayed?: number;
}

/** A Receipt with its parsed Date, computed once at load. */
export interface Item extends Receipt {
  date: Date;
  dayKey: string; // YYYY-MM-DD
}

export interface Moment {
  id: string;
  items: Item[];
  start: Date;
  end: Date;
  dayKey: string;
  headline: string;
  kicker: string;
  summary: string;
  types: ReceiptType[];
  spend: number;
  score: number;
  /** tags shared by 2+ items — the invisible threads connecting a moment */
  threads: string[];
}
