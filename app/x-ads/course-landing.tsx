import Image from "next/image";
import Link from "next/link";
import { ArrowDown, ArrowRight, ArrowUpRight, Check } from "lucide-react";
import { AuthControls } from "@/app/components/auth-controls";
import type { CourseNavigationItem } from "@/lib/course-content-shared";
import type { PricingTier } from "@/lib/pricing-parity";
import { isXAdsPresaleActive } from "@/lib/x-ads-offer";
import { LandingVideo } from "./landing-video";
import { PresaleCheckout } from "./presale-checkout";
import courseStyles from "./x-ads.module.css";
import styles from "./landing.module.css";

export function CourseLanding({ navigation, purchaseStatus }: {
  navigation: readonly CourseNavigationItem[];
  purchaseStatus: PricingTier | "error" | null;
}) {
  // Use one request time for server rendering and the client countdown.
  // eslint-disable-next-line react-hooks/purity
  const initialNow = Date.now();
  const chapters = navigation.filter((chapter) => chapter.slug !== "introduction");

  return (
    <div className={`${courseStyles.page} ${styles.page}`}>
      <a className={styles.skipLink} href="#main">Skip to content</a>
      <header className={styles.header}>
        <Link href="/x-ads" className={styles.brand} aria-label="Learn X Ads home">
          <Image className={styles.brandMark} src="/images/tom-zaragoza.jpg" width={32} height={32} alt="Tom Zaragoza" />
          <span>Learn X Ads<span className={styles.brandSuffix}> / by Tom Zaragoza</span></span>
        </Link>
        <nav aria-label="Main navigation" className={styles.navigation}>
          <a className={styles.headerBuy} href="#presale">Buy Full Access <ArrowRight aria-hidden="true" /></a>
        </nav>
      </header>

      <main id="main" className={styles.main}>
        {purchaseStatus ? (
          <p className={styles.notice} role={purchaseStatus === "error" ? "alert" : "status"}>
            {purchaseStatus === "error"
              ? "We could not confirm this payment yet. Sign in to check your purchase."
              : "Sign in with your purchase email to check your course access."}
          </p>
        ) : null}
        <section className={styles.hero} aria-labelledby="hero-title">
          <div className={styles.heroCopy}>
            <h1 id="hero-title">Learn how to find customers <span>with X Ads</span></h1>
            <p className={styles.description}>A practical X Ads course for founders who have built a product and want more people to use it. Set up, launch, and improve your ads, step by step.</p>
            <div className={styles.heroActions}>
              <div className={styles.googleAction}><AuthControls signInOnly returnPath="/x-ads" /></div>
              <a href="#curriculum" className={styles.textLink}>Explore the course <ArrowDown aria-hidden="true" /></a>
            </div>
            <p className={styles.accessNote}>{isXAdsPresaleActive(initialNow) ? "Presale is open until October 16." : "Sign in to view your account and course access."}</p>
          </div>
          <LandingVideo />
        </section>

        <section className={styles.outcomes} aria-labelledby="outcomes-title">
          <h2 id="outcomes-title">Your product deserves<br />more than a launch post.</h2>
          <div>
            <p>Learn how to put it in front of potential customers, understand what happens after a click, and use that information to make your next campaign better.</p>
            <ul>
              <li><Check aria-hidden="true" /> Start with the fundamentals</li>
              <li><Check aria-hidden="true" /> Follow practical instructions</li>
              <li><Check aria-hidden="true" /> Apply it to your own product</li>
            </ul>
          </div>
        </section>

        <section className={styles.curriculum} id="curriculum" aria-labelledby="curriculum-title">
          <div className={styles.sectionIntro}>
            <h2 id="curriculum-title">From “where do I start?”<br />to your first campaign.</h2>
            <p>{chapters.length} chapters covering the setup, the creative, and the numbers. Work through them in order, then come back when you need a reference.</p>
            <a className={styles.textLink} href="#presale">See course plans <ArrowUpRight aria-hidden="true" /></a>
          </div>
          <ol className={styles.chapters}>
            {chapters.map((chapter, index) => (
              <li key={chapter.path}>
                <Link href={chapter.path}>
                  <span className={styles.chapterNumber} aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
                  <div><h3>{chapter.title}</h3><p>{chapter.description}</p></div>
                  <ArrowUpRight aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ol>
        </section>

        <section className={styles.teacher} aria-labelledby="teacher-title">
          <Image src="/images/tom-zaragoza.jpg" width={112} height={112} alt="Tom Zaragoza, course creator" />
          <div>
            <h2 id="teacher-title">Hey, Tom here.</h2>
            <p>I&apos;ve been running X Ads since 2019 and have found hundreds of customers for my products. This is the course I wanted when I started: clear instructions, real examples, and the reasoning behind each step.</p>
            <Link className={styles.textLink} href="/">A little more about me <ArrowUpRight aria-hidden="true" /></Link>
          </div>
        </section>

        <div className={`${courseStyles.salesCopy} ${styles.pricing}`}>
          <PresaleCheckout returnPath="/x-ads" initialNow={initialNow} />
        </div>
      </main>
      <footer className={styles.footer}>
        <Link href="/">Tom Zaragoza</Link>
        <div><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link></div>
      </footer>
    </div>
  );
}
