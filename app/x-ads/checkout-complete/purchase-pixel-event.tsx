"use client";

import { useEffect } from "react";

export function PurchasePixelEvent() {
  useEffect(() => {
    const eventId = process.env.NEXT_PUBLIC_X_PURCHASE_EVENT_ID?.trim() || "tw-o6ml8-rfgj9";
    const pixel = (window as Window & { twq?: (...args: unknown[]) => void }).twq;
    if (!pixel) return;

    try {
      pixel("event", eventId, { value: null, currency: null });
    } catch {
      // Pixel errors must not affect the confirmation page.
    }
  }, []);

  return null;
}
