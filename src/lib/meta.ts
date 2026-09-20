import {
  Camera, CalendarHeart, Film, MapPin, MessageSquareText, Music2,
  Search, ShoppingBag, StickyNote, type LucideIcon,
} from "lucide-react";
import type { ReceiptType } from "@/types";

export interface TypeMeta {
  label: string;
  plural: string;
  icon: LucideIcon;
  color: string; // hex — used by charts + inline styles
  verb: string;  // used by the story engine
}

export const TYPE_META: Record<ReceiptType, TypeMeta> = {
  purchase: { label: "Purchase", plural: "Purchases", icon: ShoppingBag, color: "#f5b74a", verb: "bought" },
  music: { label: "Song", plural: "Music", icon: Music2, color: "#6fdc9b", verb: "listened to" },
  place: { label: "Place", plural: "Places", icon: MapPin, color: "#6cb6ff", verb: "stopped at" },
  photo: { label: "Photo", plural: "Photos", icon: Camera, color: "#f78fb3", verb: "snapped" },
  search: { label: "Search", plural: "Searches", icon: Search, color: "#b79cff", verb: "searched for" },
  message: { label: "Message", plural: "Messages", icon: MessageSquareText, color: "#5ad1d9", verb: "heard from" },
  note: { label: "Note", plural: "Notes", icon: StickyNote, color: "#c9c2b0", verb: "jotted down" },
  event: { label: "Event", plural: "Events", icon: CalendarHeart, color: "#d4e157", verb: "attended" },
  movie: { label: "Movie", plural: "Movies", icon: Film, color: "#ff7f6b", verb: "watched" },
};

export const TYPE_ORDER = Object.keys(TYPE_META) as ReceiptType[];
