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
    description: "Step-by-step X Ads lessons, from account setup to campaign improvement.",
    features: [
      "Step-by-step course lessons",
      "Account setup, analytics, and conversion tracking",
      "Creating, launching, and improving your campaigns",
      "Future course updates included"
    ]
  },
  {
    tier: "pro",
    name: "Pro",
    description: "Get the complete course plus a 30-minute consultation with Tom.",
    features: [
      "Everything in Course, including future updates",
      "One 30-minute consultation with Tom"
    ]
  }
];

type PaymentMethod = "stripe" | "paypal";

function trackCheckout() {
  const pixel = (window as Window & {
    twq?: (...args: unknown[]) => void;
  }).twq;

  if (!pixel) return;

  try {
    pixel("event", "tw-o6ml8-rfgj8", {});
  } catch {
    // Pixel errors must not prevent checkout.
  }
}

export function PresaleCheckout({
  returnPath,
  initialNow,
  tiers = ["course", "pro"],
  compact = false,
  layout = "plans"
}: {
  returnPath: string;
  initialNow: number;
  tiers?: readonly PricingTier[];
  compact?: boolean;
  layout?: "plans" | "sidebar";
}) {
  const [now, setNow] = useState(initialNow);
  const [pending, setPending] = useState<{ tier: PricingTier; method: PaymentMethod } | null>(null);
  const [error, setError] = useState("");
  const [selectedTier, setSelectedTier] = useState<PricingTier>(tiers[0] ?? "course");
  const presale = isXAdsPresaleActive(now);
  const sidebar = layout === "sidebar";

  useEffect(() => {
    const firstTick = window.setTimeout(() => setNow(Date.now()), 0);
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => {
      window.clearTimeout(firstTick);
      window.clearInterval(timer);
    };
  }, []);

  async function startCheckout(event: FormEvent<HTMLFormElement>, tier: PricingTier, method: PaymentMethod) {
    event.preventDefault();
    if (pending) return;

    const displayedAmount = getXAdsPrice(tier, now);
    trackCheckout();
    const minimumLoadingTime = new Promise<void>((resolve) => window.setTimeout(resolve, 1000));
    setPending({ tier, method });
    setError("");

    try {
      const response = await fetch(`/api/${method}/checkout`, {
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
      setPending(null);
    }
  }

  function checkoutForm(tier: PricingTier, method: PaymentMethod, compactButton = false) {
    const plan = plans.find((item) => item.tier === tier)!;
    const isPending = pending?.tier === tier && pending.method === method;
    return (
      <form
        className={`${styles.presaleCheckout} ${compactButton ? styles.gateOffer : ""}`}
        action={`/api/${method}/checkout`}
        method="post"
        onSubmit={(event) => void startCheckout(event, tier, method)}
        key={`${tier}-${method}`}
      >
        <input type="hidden" name="returnPath" value={returnPath} />
        <input type="hidden" name="pricingTier" value={tier} />
        <button
          className={`${styles.presaleButton} ${tier === "course" ? styles.courseButton : ""} ${method === "paypal" ? styles.paypalButton : ""} ${isPending ? styles.checkoutPending : ""}`}
          type="submit"
          disabled={pending !== null}
          aria-busy={isPending}
        >
          {isPending
            ? `Opening ${method === "paypal" ? "PayPal" : "checkout"}…`
            : method === "paypal"
              ? `Pay with PayPal · ${formatXAdsPrice(getXAdsPrice(tier, now))}`
              : `Buy ${plan.name} · ${formatXAdsPrice(getXAdsPrice(tier, now))}`}
        </button>
      </form>
    );
  }

  if (compact) {
    return (
      <>
        <div className={styles.gateOffers} aria-label="Choose a course plan">
          {plans.filter((plan) => tiers.includes(plan.tier)).map((plan) => (
            <section className={styles.gatePlan} key={plan.tier} aria-label={plan.name}>
              <h3>{plan.name}</h3>
              <p>{plan.description}</p>
              {checkoutForm(plan.tier, "stripe", true)}
              {checkoutForm(plan.tier, "paypal", true)}
            </section>
          ))}
        </div>
        {error ? <p className={styles.checkoutError} role="alert">{error}</p> : null}
      </>
    );
  }

  return (
    <section className={styles.presaleSection} id="presale" aria-labelledby="presale-title">
      <h2 id="presale-title">Get the course</h2>
      <p>Learn to find customers with X Ads. Choose the course on its own, or add a consultation with Tom.</p>
      {sidebar ? (
        <fieldset className={styles.planSelector} disabled={pending !== null}>
          <legend className={styles.visuallyHidden}>Choose a course plan</legend>
          {plans.filter((plan) => tiers.includes(plan.tier)).map((plan) => (
            <label key={plan.tier}>
              <input type="radio" name="course-plan" value={plan.tier} checked={selectedTier === plan.tier} onChange={() => setSelectedTier(plan.tier)} />
              <span>{plan.name}<small>{formatXAdsPrice(getXAdsPrice(plan.tier, now))} USD</small></span>
            </label>
          ))}
        </fieldset>
      ) : null}
      <div className={styles.pricingPlans} aria-label="Choose a course plan">
        {plans.filter((plan) => tiers.includes(plan.tier) && (!sidebar || plan.tier === selectedTier)).map((plan) => (
          <article
            id={`${plan.tier}-plan`}
            className={`${styles.pricingPlan} ${plan.tier === "pro" ? styles.proPricingPlan : ""}`}
            key={plan.tier}
          >
            <div className={styles.pricingPlanHeader}>
              <h3>{plan.name}</h3>
              <p>
                {presale ? <del>{formatXAdsPrice(getXAdsRegularPrice(plan.tier))}</del> : null}
                <strong>{formatXAdsPrice(getXAdsPrice(plan.tier, now))}</strong>
                <span> USD{sidebar ? " · one-time" : ""}</span>
              </p>
            </div>
            {!sidebar ? <p className={styles.pricingPlanDescription}>{plan.description}</p> : null}
            <ul>{plan.features.map((feature) => <li key={feature}>{feature}</li>)}</ul>
            {checkoutForm(plan.tier, "stripe")}
            {checkoutForm(plan.tier, "paypal")}
          </article>
        ))}
      </div>
      {error ? <p className={styles.checkoutError} role="alert">{error}</p> : null}
    </section>
  );
}
