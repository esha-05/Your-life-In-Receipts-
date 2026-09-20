import { useMemo } from "react";
import { getReceiptModel, type ReceiptModel } from "@/lib/model";

/** Single entry point for derived data; the heavy work runs once per page load. */
export function useReceiptModel(): ReceiptModel {
  return useMemo(getReceiptModel, []);
}
