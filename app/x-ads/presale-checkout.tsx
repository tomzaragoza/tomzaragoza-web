"use client";

import { useEffect, useState, type FormEvent } from "react";
import type { PricingTier } from "@/lib/pricing-parity";
import {
  formatXAdsPrice,
  getXAdsPrice,
  getXAdsRegularPrice,
  isXAdsPresaleActive,
  xAdsPresaleEndsAt
} from "@/lib/x-ads-offer";
import styles from "./x-ads.module.css";

const plans: Array<{
  tier: PricingTier;
  name: string;
  description: string;
  features: string[];
}> = [
  {
    tier: "course",
    name: "Course",
    description: "Get access to only the course content when it launches!",
    features: ["Course lessons when they launch", "Future course updates"]
  },
  {
    tier: "pro",
    name: "Pro",
    description: "Get the course, in-course messaging, and a consultation with Tom.",
    features: [
      "Course access when it launches",
      "In-course messaging for questions about the course",
      "One 30-minute consultation"
    ]
  }
];

function countdownParts(now: number) {
  const seconds = Math.max(0, Math.floor((xAdsPresaleEndsAt - now) / 1000));
  return [
    { label: "days", value: Math.floor(seconds / 86400) },
    { label: "hours", value: Math.floor((seconds % 86400) / 3600) },
    { label: "minutes", value: Math.floor((seconds % 3600) / 60) },
    { label: "seconds", value: seconds % 60 }
  ];
}

function trackCheckout(tier: PricingTier, unitAmount: number) {
  const eventId = process.env.NEXT_PUBLIC_X_CHECKOUT_EVENT_ID?.trim() || "tw-o6ml8-rfgj8";
  const pixel = (window as Window & {
    twq?: (...args: unknown[]) => void;
  }).twq;

  if (!pixel) return;

  try {
    pixel("event", eventId, {
      value: unitAmount / 100,
      currency: "USD",
      contents: [{
        content_id: `x-ads-${tier}`,
        content_name: tier === "pro" ? "X Ads Course Pro" : "X Ads Course",
        content_price: unitAmount / 100,
        num_items: 1
      }]
    });
  } catch {
    // Pixel errors must not prevent checkout.
  }
}

export function PresaleCheckout({
  returnPath,
  initialNow,
  tiers = ["course", "pro"],
  compact = false
}: {
  returnPath: string;
  initialNow: number;
  tiers?: readonly PricingTier[];
  compact?: boolean;
}) {
  const [now, setNow] = useState(initialNow);
  const [pendingTier, setPendingTier] = useState<PricingTier | null>(null);
  const [error, setError] = useState("");
  const presale = isXAdsPresaleActive(now);

  useEffect(() => {
    const firstTick = window.setTimeout(() => setNow(Date.now()), 0);
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => {
      window.clearTimeout(firstTick);
      window.clearInterval(timer);
    };
  }, []);

  async function startCheckout(event: FormEvent<HTMLFormElement>, tier: PricingTier) {
    event.preventDefault();
    if (pendingTier) return;

    const displayedAmount = getXAdsPrice(tier, now);
    trackCheckout(tier, displayedAmount);
    const minimumLoadingTime = new Promise<void>((resolve) => window.setTimeout(resolve, 1000));
    setPendingTier(tier);
    setError("");

    try {
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { Accept: "application/json" },
        body: new FormData(event.currentTarget)
      });

      if (!response.ok) throw new Error("Checkout is temporarily unavailable. Please try again.");

      const result = await response.json() as {
        url?: string;
        unitAmount?: number;
      };

      if (!result.url || typeof result.unitAmount !== "number") {
        throw new Error("Checkout is temporarily unavailable. Please try again.");
      }

      if (result.unitAmount !== displayedAmount) {
        setNow(xAdsPresaleEndsAt);
        throw new Error("The price changed. Please review the current price and try again.");
      }

      await minimumLoadingTime;
      window.location.assign(result.url);
    } catch (checkoutError) {
      setError(checkoutError instanceof Error ? checkoutError.message : "Checkout is temporarily unavailable.");
      setPendingTier(null);
    }
  }

  function checkoutForm(tier: PricingTier, compactButton = false) {
    const plan = plans.find((item) => item.tier === tier)!;
    return (
      <form
        className={`${styles.presaleCheckout} ${compactButton ? styles.gateOffer : ""}`}
        action="/api/stripe/checkout"
        method="post"
        onSubmit={(event) => void startCheckout(event, tier)}
        key={tier}
      >
        <input type="hidden" name="returnPath" value={returnPath} />
        <input type="hidden" name="pricingTier" value={tier} />
        <button
          className={`${styles.presaleButton} ${tier === "course" ? styles.courseButton : ""} ${pendingTier === tier ? styles.checkoutPending : ""}`}
          type="submit"
          disabled={pendingTier !== null}
          aria-busy={pendingTier === tier}
        >
          {pendingTier === tier
            ? "Opening checkout…"
            : `Buy ${plan.name} · ${formatXAdsPrice(getXAdsPrice(tier, now))}`}
        </button>
      </form>
    );
  }

  if (compact) {
    return (
      <>
        <div className={styles.gateOffers} aria-label="Choose a course plan">
          {plans.filter((plan) => tiers.includes(plan.tier)).map((plan) => checkoutForm(plan.tier, true))}
        </div>
        {error ? <p className={styles.checkoutError} role="alert">{error}</p> : null}
      </>
    );
  }

  return (
    <section className={styles.presaleSection} id="presale" aria-labelledby="presale-title">
      <h2 id="presale-title">
        {presale ? "Get the course presale" : "The presale has ended"}
      </h2>
      {presale ? (
        <>
          <p>I&apos;m currently developing the course and recording video lessons.</p>
          <p>
            I launch on September 30th and prices go up on that date, so buy the
            presale to get it at a discount!
          </p>
        </>
      ) : (
        <p>The presale has ended. Course and Pro now cost their regular prices.</p>
      )}
      {presale ? (
        <div className={styles.presaleCountdown} role="timer" aria-label="Time until presale ends">
          {countdownParts(now).map((part) => (
            <div key={part.label}>
              <strong>{String(part.value).padStart(2, "0")}</strong>
              <span>{part.label}</span>
            </div>
          ))}
        </div>
      ) : null}
      {presale ? <p className={styles.presaleDeadline}>Presale ends September 30, 2026 at 12:00 a.m. ET.</p> : null}
      <div className={styles.pricingPlans} aria-label="Choose a course plan">
        {plans.filter((plan) => tiers.includes(plan.tier)).map((plan) => (
          <article
            className={`${styles.pricingPlan} ${plan.tier === "pro" ? styles.proPricingPlan : ""}`}
            key={plan.tier}
          >
            <div className={styles.pricingPlanHeader}>
              <h3>{plan.name}</h3>
              <p>
                {presale ? <del>{formatXAdsPrice(getXAdsRegularPrice(plan.tier))}</del> : null}
                <strong>{formatXAdsPrice(getXAdsPrice(plan.tier, now))}</strong>
                <span> USD</span>
              </p>
            </div>
            <p className={styles.pricingPlanDescription}>{plan.description}</p>
            <ul>{plan.features.map((feature) => <li key={feature}>{feature}</li>)}</ul>
            {checkoutForm(plan.tier)}
          </article>
        ))}
      </div>
      {error ? <p className={styles.checkoutError} role="alert">{error}</p> : null}
    </section>
  );
}
