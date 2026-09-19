"use client";

import { useRef, useState, type FormEvent } from "react";
import styles from "./x-ads.module.css";

function trackCheckout() {
  const pixel = (window as Window & { twq?: (...args: unknown[]) => void }).twq;
  if (!pixel) return;

  try {
    pixel("event", "tw-o6ml8-rfgj8", { value: null, currency: null });
  } catch {
    // Pixel errors must not prevent checkout.
  }
}

export function PresaleCheckout({
  returnPath,
  label = "Unlock the course — $20"
}: {
  returnPath: string;
  label?: string;
}) {
  const submitting = useRef(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function startCheckout(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current) return;
    submitting.current = true;

    const formData = new FormData(event.currentTarget);
    trackCheckout();
    const minimumLoadingTime = new Promise<void>((resolve) => window.setTimeout(resolve, 1000));
    setPending(true);
    setError("");

    try {
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { Accept: "application/json" },
        body: formData
      });
      if (!response.ok) throw new Error("Checkout is temporarily unavailable. Please try again.");

      const result = await response.json() as { url?: string };
      if (!result.url) throw new Error("Checkout is temporarily unavailable. Please try again.");

      await minimumLoadingTime;
      window.location.assign(result.url);
    } catch (checkoutError) {
      setError(checkoutError instanceof Error ? checkoutError.message : "Checkout is temporarily unavailable.");
      setPending(false);
      submitting.current = false;
    }
  }

  return (
    <form className={styles.presaleCheckout} action="/api/stripe/checkout" method="post" onSubmit={(event) => void startCheckout(event)}>
      <input type="hidden" name="returnPath" value={returnPath} />
      <button
        className={`${styles.presaleButton} ${pending ? styles.checkoutPending : ""}`}
        type="submit"
        disabled={pending}
        aria-busy={pending}
      >
        {pending ? "Opening checkout…" : label}
      </button>
      {error ? <p className={styles.checkoutError} role="alert">{error}</p> : null}
    </form>
  );
}
