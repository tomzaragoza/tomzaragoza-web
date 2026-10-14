"use client";

import { useEffect } from "react";
import type { XAdsPurchasePixelData } from "@/lib/x-ads-purchase-pixel";

export function PurchasePixelEvent({ data }: { data: XAdsPurchasePixelData }) {
  useEffect(() => {
    const pixel = (window as Window & { twq?: (...args: unknown[]) => void }).twq;
    if (!pixel) return;

    const sentKey = `x-ads-purchase:${data.conversion_id}`;
    try {
      if (window.sessionStorage.getItem(sentKey)) return;
    } catch {
      // Storage can be unavailable; still send the conversion.
    }

    try {
      pixel("event", "tw-o6ml8-rfgj9", data);
    } catch {
      // Pixel errors must not affect the confirmation page.
      return;
    }

    try {
      window.sessionStorage.setItem(sentKey, "1");
    } catch {
      // Storage can be unavailable after the event is sent.
    }
  }, [data]);

  return null;
}
