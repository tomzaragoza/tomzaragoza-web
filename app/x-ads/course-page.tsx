import Link from "next/link";
import type { CourseAccess } from "@/lib/course-access";
import { canViewCourseLessons } from "@/lib/course-access-policy";
import type { CourseNavigationItem, CoursePageRecord } from "@/lib/course-content-shared";
import type { PricingTier } from "@/lib/pricing-parity";
import { CourseEditingProvider } from "./course-editing-context";
import { CourseLessonHeader, CourseLessonBody } from "./course-lesson";
import { CourseSidebar } from "./course-sidebar";
import { InlineCourseEditor } from "./inline-course-editor";
import { MobileCourseNav } from "./mobile-course-nav";
import { PresaleCheckout } from "./presale-checkout";
import styles from "./x-ads.module.css";

export function CoursePage({
  page,
  access,
  navigation,
  canEdit = false,
  purchaseStatus = null
}: {
  page: CoursePageRecord;
  access: CourseAccess | "public";
  navigation: readonly CourseNavigationItem[];
  canEdit?: boolean;
  purchaseStatus?: PricingTier | "error" | null;
}) {
  const hasCourseAccess = canViewCourseLessons(access);
  const showAccountControls = access !== "signed-out" && access !== "public";
  const confirmedPurchase = purchaseStatus === "pro" ? access === "pro"
    : purchaseStatus === "course" && (access === "course" || access === "pro");
  // Keep server-rendered prices and the initial client render in sync.
  // eslint-disable-next-line react-hooks/purity
  const initialNow = Date.now();
  const sections = navigation.filter((section) => section.slug !== "introduction");
  const currentIndex = sections.findIndex((section) => section.path === page.path);
  const previousSection = currentIndex > 0 ? sections[currentIndex - 1] : undefined;
  const nextSection = currentIndex >= 0 ? sections[currentIndex + 1] : undefined;

  const content = (
    <main className={styles.page}>
      <a className={styles.skipLink} href="#course-content">Skip to course content</a>
      <MobileCourseNav currentPath={page.path} navigation={navigation} canEdit={canEdit}
        showMessages={canEdit} showAccountControls={showAccountControls} />
      <div className={styles.courseShell}>
        <CourseSidebar currentPath={page.path} navigation={navigation} canEdit={canEdit}
          showMessages={canEdit} showAccountControls={showAccountControls} />
        <article className={`${styles.content} ${canEdit ? styles.editorContent : ""}`} id="course-content">
          {purchaseStatus === "error" ? (
            <p className={styles.dashboardNotice} role="alert">We could not confirm this payment yet. Refresh the page in a moment.</p>
          ) : confirmedPurchase ? (
            <p className={styles.dashboardNotice} role="status">Your {purchaseStatus === "pro" ? "Pro" : "Course"} purchase is confirmed.</p>
          ) : null}
          {!canEdit ? <CourseLessonHeader page={page} /> : null}
          <div className={`${styles.mainContent} ${canEdit ? styles.editorMainContent : !hasCourseAccess ? styles.gatedMainContent : styles.readerMainContent}`}>
            {canEdit ? <InlineCourseEditor key={page.slug} page={page} />
              : hasCourseAccess ? <CourseLessonBody page={page} />
                : (
                  <section className={styles.accessGate} aria-labelledby="course-access-title">
                    <h2 id="course-access-title">{showAccountControls ? "Get the course" : "Sign in to view this lesson"}</h2>
                    <p>{showAccountControls
                      ? "Purchase the course to view its videos and written lessons. If you already bought it, sign in with your purchase email."
                      : "Sign in with your purchase email to view the videos and written lessons. If you haven't bought the course, you can view the plans below."}</p>
                    {showAccountControls ? <PresaleCheckout returnPath={page.path} initialNow={initialNow} compact /> : (
                      <div className={styles.accessActions}>
                        <Link className={styles.presaleButton} href={`/sign-in?returnPath=${encodeURIComponent(page.path)}`}>Sign in to your course</Link>
                        <Link className={styles.dashboardTextLink} href="/x-ads#presale">View course plans →</Link>
                      </div>
                    )}
                  </section>
                )}
          </div>
          {previousSection || nextSection ? (
            <nav className={styles.courseFooter} aria-label="Previous and next course sections">
              {previousSection ? <Link className={styles.courseFooterLink} href={previousSection.path}><span>← Previous</span><strong>{previousSection.title}</strong></Link> : null}
              {nextSection ? <Link className={`${styles.courseFooterLink} ${styles.nextCoursePage}`} href={nextSection.path}><span>Next →</span><strong>{nextSection.title}</strong></Link> : null}
            </nav>
          ) : null}
        </article>
      </div>
    </main>
  );
  return canEdit ? <CourseEditingProvider>{content}</CourseEditingProvider> : content;
}
