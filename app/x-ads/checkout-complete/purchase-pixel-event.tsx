"use client";

import { useEffect } from "react";

export function PurchasePixelEvent() {
  useEffect(() => {
    const pixel = (window as Window & { twq?: (...args: unknown[]) => void }).twq;
    if (!pixel) return;

    try {
      pixel("event", "tw-o6ml8-rfgj9", { value: null, currency: null });
    } catch {
      // Pixel errors must not affect the confirmation page.
    }
  }, []);

  return null;
}
