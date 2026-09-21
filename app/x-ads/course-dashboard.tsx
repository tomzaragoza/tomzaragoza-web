import Link from "next/link";
import { ArrowRight, BookOpen, Library } from "lucide-react";
import type { CourseAccess } from "@/lib/course-access";
import { canViewCourseLessons } from "@/lib/course-access-policy";
import type { CourseNavigationItem } from "@/lib/course-content-shared";
import type { PricingTier } from "@/lib/pricing-parity";
import { CourseSidebar } from "./course-sidebar";
import { MobileCourseNav } from "./mobile-course-nav";
import { PresaleCheckout } from "./presale-checkout";
import styles from "./x-ads.module.css";

export function CourseDashboard({ access, navigation, canEdit, purchaseStatus }: {
  access: CourseAccess;
  navigation: readonly CourseNavigationItem[];
  canEdit: boolean;
  purchaseStatus: PricingTier | "error" | null;
}) {
  const canRead = canViewCourseLessons(access);
  const purchased = access === "course" || access === "pro";
  const chapters = navigation.filter((item) => item.path !== "/x-ads");
  const firstLesson = chapters[0]?.path;
  // Keep server-rendered prices and the initial client render in sync.
  // eslint-disable-next-line react-hooks/purity
  const initialNow = Date.now();

  return (
    <main className={styles.page}>
      <a className={styles.skipLink} href="#dashboard-content">Skip to dashboard content</a>
      <MobileCourseNav currentPath="/x-ads" navigation={navigation} canEdit={canEdit} showMessages={canRead} />
      <div className={styles.courseShell}>
        <CourseSidebar currentPath="/x-ads" navigation={navigation} canEdit={canEdit} showMessages={canRead} />
        <article className={styles.dashboardContent} id="dashboard-content">
          <header className={styles.dashboardHeader}>
            <h1>Your X Ads workspace</h1>
            <p>Learn how to find customers with X Ads. Your course, conversations, and ad library live here.</p>
          </header>

          {purchaseStatus === "error" ? <p className={styles.dashboardNotice} role="alert">We could not confirm this payment yet. Refresh the page in a moment.</p> : null}
          {purchased ? <p className={styles.dashboardNotice} role="status">Your {access === "pro" ? "Pro" : "Course"} purchase is confirmed. Lessons will open when the course launches.</p> : null}

          <div className={styles.dashboardCards}>
            <section className={styles.dashboardCourse} aria-labelledby="dashboard-course-title">
              <h2 id="dashboard-course-title">X Ads Course</h2>
              <p>A practical guide to setting up, launching, and improving your campaigns.</p>
              <div className={styles.dashboardCourseMeta}><BookOpen aria-hidden="true" />{chapters.length} chapters · Work at your own pace</div>
              {canRead && firstLesson ? <Link className={styles.presaleButton} href={firstLesson}>Start the course <ArrowRight aria-hidden="true" /></Link>
                : purchased ? <p className={styles.dashboardAvailability}>Your course access is reserved.</p>
                  : <a className={styles.presaleButton} href="#presale">Buy Full Access <ArrowRight aria-hidden="true" /></a>}
            </section>
            <section className={styles.dashboardLibrary} aria-labelledby="dashboard-library-title">
              <h2 id="dashboard-library-title">Ads Library</h2>
              <p>A place for ad examples you can use as a reference. The library is coming next.</p>
              <Library className={styles.libraryIcon} aria-hidden="true" />
              <Link className={styles.dashboardTextLink} href="/x-ads/library">Open library <ArrowRight aria-hidden="true" /></Link>
            </section>
          </div>

          <div className={`${styles.salesCopy} ${styles.dashboardPricing}`}><PresaleCheckout returnPath="/x-ads" initialNow={initialNow} /></div>
        </article>
      </div>
    </main>
  );
}
