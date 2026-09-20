import type { Item } from "@/types";

/**
 * Purchase categories that move money around instead of spending it.
 * Counting them as spend inflated "Total spent" and made the wrong month look expensive.
 */
const NON_SPEND_CATEGORIES = new Set(["Money transfer"]);

/** "Food - Dinner" -> "Food". */
export const categoryOf = (it: Item): string => it.title.split(" - ")[0];

/** True for purchases that are genuine spending. */
export const isSpend = (it: Item): boolean => it.type === "purchase" && !NON_SPEND_CATEGORIES.has(categoryOf(it));

/** Amount that counts towards spending (0 for everything else). */
export const spendOf = (it: Item): number => (isSpend(it) ? it.amount ?? 0 : 0);
