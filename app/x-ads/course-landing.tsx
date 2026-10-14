import Image from "next/image";
import Link from "next/link";
import { ArrowDown, ArrowRight, ArrowUpRight, Check } from "lucide-react";
import { AuthControls } from "@/app/components/auth-controls";
import type { CourseNavigationItem } from "@/lib/course-content-shared";
import type { PricingTier } from "@/lib/pricing-parity";
import { LandingVideo } from "./landing-video";
import { PresaleCheckout } from "./presale-checkout";
import courseStyles from "./x-ads.module.css";
import styles from "./landing.module.css";

export function CourseLanding({ navigation, purchaseStatus }: {
  navigation: readonly CourseNavigationItem[];
  purchaseStatus: PricingTier | "error" | null;
}) {
  // Use one request time for server and client prices.
  // eslint-disable-next-line react-hooks/purity
  const initialNow = Date.now();
  const chapters = navigation.filter((chapter) => chapter.slug !== "introduction");

  return (
    <div className={`${courseStyles.page} ${styles.page}`}>
      <a className={styles.skipLink} href="#main">Skip to content</a>
      <main id="main" className={styles.main}>
        {purchaseStatus ? (
          <p className={styles.notice} role={purchaseStatus === "error" ? "alert" : "status"}>
            {purchaseStatus === "error"
              ? "We could not confirm this payment yet. Sign in to check your purchase."
              : "Sign in with your purchase email to check your course access."}
          </p>
        ) : null}
        <div className={styles.productLayout}>
          <section className={styles.hero} aria-labelledby="hero-title">
            <LandingVideo />
            <h1 id="hero-title">Learn how to find customers <span>with X Ads</span></h1>
            <p className={styles.description}>A practical X Ads course for founders who have built a product and want more people to use it. Set up, launch, and improve your ads, step by step.</p>
            <div className={styles.productMeta}>
              <Link href="/">
                <Image src="/images/tom-zaragoza.jpg" width={28} height={28} alt="" />
                <span>By Tom Zaragoza</span>
              </Link>
              <span>{chapters.length} chapters</span>
              <span>Learn at your own pace</span>
            </div>
            <a href="#curriculum" className={styles.textLink}>See what you&apos;ll learn <ArrowDown aria-hidden="true" /></a>
          </section>

          <aside className={`${courseStyles.salesCopy} ${styles.purchasePanel}`} aria-label="Course purchase">
            <PresaleCheckout returnPath="/x-ads" initialNow={initialNow} layout="sidebar" />
            <div className={styles.buyerAccess}>
              <p>Already bought the course?</p>
              <div className={styles.googleAction}><AuthControls signInOnly returnPath="/x-ads" /></div>
              <p>Sign in with your purchase email.</p>
            </div>
          </aside>

          <div className={styles.productDetails}>
            <section className={styles.outcomes} aria-labelledby="outcomes-title">
              <h2 id="outcomes-title">Your product deserves more than a launch post.</h2>
              <p>Learn how to put it in front of potential customers, understand what happens after a click, and use that information to make your next campaign better.</p>
              <ul>
                <li><Check aria-hidden="true" /> Set up your account and conversion tracking</li>
                <li><Check aria-hidden="true" /> Create ads that show what your product can do</li>
                <li><Check aria-hidden="true" /> Launch a campaign and use the results to improve it</li>
              </ul>
            </section>

            <section className={styles.curriculum} id="curriculum" aria-labelledby="curriculum-title">
              <div className={styles.sectionIntro}>
                <h2 id="curriculum-title">From setup to your first campaign.</h2>
                <p>{chapters.length} chapters covering the setup, the creative, and the numbers. Work through them in order, then come back when you need a reference.</p>
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
              <h2 id="teacher-title">Learn from someone running the ads.</h2>
              <p>Real campaigns, real products, and lessons from years of using X Ads.</p>
              <div className={styles.teacherBio}>
                <Image src="/images/tom-zaragoza.jpg" width={80} height={80} alt="Tom Zaragoza, course creator" />
                <div>
                  <p>I&apos;ve been running X Ads since 2019 and have found hundreds of customers for my products. This is the course I wanted when I started: clear instructions, real examples, and the reasoning behind each step.</p>
                  <Link className={styles.textLink} href="/">A little more about me <ArrowUpRight aria-hidden="true" /></Link>
                </div>
              </div>
            </section>

            <section className={styles.faq} aria-labelledby="faq-title">
              <h2 id="faq-title">Before you buy.</h2>
              <p>A few things to know about the course and your access.</p>
              <details>
                <summary>What does the course include?</summary>
                <p>Your purchase includes video lessons, written instructions, and future updates. Learn how to set up your account, track conversions, create ads, and improve your campaigns.</p>
              </details>
              <details>
                <summary>Who is this course for?</summary>
                <p>Founders who have built a product and want to learn how to find customers with X Ads. The course starts with account setup and takes you through launching and improving a campaign.</p>
              </details>
              <details>
                <summary>What does Pro include?</summary>
                <p>Pro includes everything in Course, plus one 30-minute consultation with Tom.</p>
              </details>
              <details>
                <summary>How do I access my purchase?</summary>
                <p>Sign in with Google using your purchase email. Choose a section from the menu on the left. Its video and written lesson appear in the main content area.</p>
              </details>
              <a className={styles.headerBuy} href="#presale">Choose your plan <ArrowRight aria-hidden="true" /></a>
            </section>
          </div>
        </div>
      </main>
      <footer className={styles.footer}>
        <Link href="/">Tom Zaragoza</Link>
        <div><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link></div>
      </footer>
    </div>
  );
}
