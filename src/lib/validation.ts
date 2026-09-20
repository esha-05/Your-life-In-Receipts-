import type { Receipt, ReceiptType } from "@/types";

/**
 * Exhaustive by construction: adding a member to `ReceiptType` without listing
 * it here is a compile error, so the runtime check can never drift from the type.
 */
const KNOWN_TYPES: Record<ReceiptType, true> = {
  purchase: true,
  music: true,
  place: true,
  photo: true,
  search: true,
  message: true,
  note: true,
  event: true,
  movie: true,
};

export const isReceiptType = (v: unknown): v is ReceiptType =>
  typeof v === "string" && Object.hasOwn(KNOWN_TYPES, v);

const isStringArray = (v: unknown): v is string[] => Array.isArray(v) && v.every((t) => typeof t === "string");

/**
 * Runtime guard for one record of the (untrusted) JSON dataset.
 * Mirrors `scripts/check-data.mjs`, so the build-time and run-time checks agree.
 */
export function isValidReceipt(value: unknown): value is Receipt {
  if (typeof value !== "object" || value === null) return false;
  const r = value as Record<string, unknown>;
  const loc = r.location;
  return (
    typeof r.id === "string" && r.id.length > 0 &&
    isReceiptType(r.type) &&
    typeof r.timestamp === "string" && !Number.isNaN(Date.parse(r.timestamp)) &&
    typeof r.title === "string" && r.title.length > 0 &&
    typeof r.subtitle === "string" &&
    isStringArray(r.tags) &&
    (r.amount === undefined || (typeof r.amount === "number" && Number.isFinite(r.amount))) &&
    (loc === null || loc === undefined || (typeof loc === "object" && typeof (loc as { name?: unknown }).name === "string"))
  );
}

export interface ParseResult {
  receipts: Receipt[];
  /** How many records were dropped because they failed validation. */
  rejected: number;
}

/** Validate a raw JSON payload. Never throws: bad input yields an empty, well-typed result. */
export function parseReceipts(raw: unknown): ParseResult {
  if (!Array.isArray(raw)) return { receipts: [], rejected: 0 };
  const receipts = raw.filter(isValidReceipt);
  return { receipts, rejected: raw.length - receipts.length };
}
