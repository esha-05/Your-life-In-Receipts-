import { BookOpen, ChartColumn, Compass, Lightbulb, Network, Sparkles, type LucideIcon } from "lucide-react";

/** Single source of truth for navigation: header, mobile bar and router all read this. */
export const VIEWS = [
  { id: "story", label: "Story", icon: BookOpen },
  { id: "web", label: "Web", icon: Network },
  { id: "patterns", label: "Patterns", icon: Lightbulb },
  { id: "moments", label: "Moments", icon: Sparkles },
  { id: "explore", label: "Explore", icon: Compass },
  { id: "insights", label: "Insights", icon: ChartColumn },
] as const satisfies ReadonlyArray<{ id: string; label: string; icon: LucideIcon }>;

export type ViewId = (typeof VIEWS)[number]["id"];
export const VIEW_IDS: readonly ViewId[] = VIEWS.map((v) => v.id);
export const DEFAULT_VIEW: ViewId = "story";
