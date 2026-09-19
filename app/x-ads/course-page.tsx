import Image from "next/image";
import Link from "next/link";
import { ChartNoAxesCombined, Eye, MousePointer2, Target } from "lucide-react";
import type { CourseAccess } from "@/lib/course-access";
import { canViewCourseLessons } from "@/lib/course-access-policy";
import type { CourseNavigationItem, CoursePageRecord } from "@/lib/course-content-shared";
import type { PricingTier } from "@/lib/pricing-parity";
import { isXAdsPresaleActive } from "@/lib/x-ads-offer";
import { CourseAnnotations } from "./course-annotations";
import { CourseSectionContent } from "./course-section";
import { CourseSidebar } from "./course-sidebar";
import { InlineCourseEditor, InlineCourseHeader } from "./inline-course-editor";
import { MobileCourseNav } from "./mobile-course-nav";
import { PresaleCheckout } from "./presale-checkout";
import styles from "./x-ads.module.css";

type CoursePageAccess = CourseAccess | "public";

function CourseAccessGate({
  access,
  returnPath,
  initialNow
}: {
  access: CoursePageAccess;
  returnPath: string;
  initialNow: number;
}) {
  const hasPurchased = access === "course" || access === "pro";
  const presale = isXAdsPresaleActive(initialNow);

  return (
    <section className={styles.accessGate} aria-labelledby="course-access-title">
      <h2 id="course-access-title">
        {hasPurchased ? "Your presale purchase is confirmed" : presale ? "Buy the Presale" : "Get the course"}
      </h2>
      <p>
        {hasPurchased
          ? "The lessons are still in development. Your purchase is recorded, and the course will open to customers when it launches."
          : presale
            ? "The course is currently in development! Buy at the presale price before the September 30 launch. Prices go up then."
            : "The presale has ended. Choose the Course or Pro plan below."}
      </p>
      {hasPurchased ? (
        <Link className={styles.presaleButton} href="/x-ads#presale">
          View your purchase →
        </Link>
      ) : (
        <PresaleCheckout returnPath={returnPath} initialNow={initialNow} compact />
      )}
    </section>
  );
}

export function CoursePage({
  page,
  access,
  navigation,
  canEdit = false,
  purchaseStatus = null
}: {
  page: CoursePageRecord;
  access: CoursePageAccess;
  navigation: readonly CourseNavigationItem[];
  canEdit?: boolean;
  purchaseStatus?: PricingTier | "error" | null;
}) {
  const isIntroduction = page.path === "/x-ads";
  const isPrinciples = page.path === "/x-ads/principles";
  const hasCourseAccess = access !== "public" && canViewCourseLessons(access);
  const hasMessaging = hasCourseAccess;
  const confirmedPurchaseStatus = purchaseStatus === "pro"
    ? access === "pro"
    : purchaseStatus === "course"
      ? access === "course" || access === "pro"
      : false;
  // Read the request time once so the server and client show the same initial price.
  // eslint-disable-next-line react-hooks/purity
  const initialNow = Date.now();
  const currentPageIndex = navigation.findIndex((item) => item.path === page.path);
  const previousPage = currentPageIndex > 0 ? navigation[currentPageIndex - 1] : undefined;
  const nextPage = currentPageIndex >= 0 ? navigation[currentPageIndex + 1] : undefined;

  return (
    <main className={styles.page}>
      <a className={styles.skipLink} href="#course-content">
        Skip to course content
      </a>

      <MobileCourseNav
        currentPath={page.path}
        navigation={navigation}
        canEdit={canEdit}
        showMessages={hasMessaging}
        showAccountControls={access !== "signed-out" && access !== "public"}
      />

      <div className={styles.courseShell}>
        <CourseSidebar
          currentPath={page.path}
          navigation={navigation}
          canEdit={canEdit}
          showMessages={hasMessaging}
          showAccountControls={access !== "signed-out" && access !== "public"}
        />

        <article className={styles.content} id="course-content">
          {canEdit && !isIntroduction ? (
            <InlineCourseHeader page={page} />
          ) : (
            <header className={styles.pageHeader}>
              <h1>{page.title}</h1>
              {isIntroduction ? (
                <p className={styles.pageDescription}>
                  Go from complete beginner to getting{" "}
                  <span className={styles.inlineOutcome}><Eye aria-hidden="true" /> impressions</span>,{" "}
                  <span className={styles.inlineOutcome}><MousePointer2 aria-hidden="true" /> clicks</span>, and{" "}
                  <span className={styles.inlineOutcome}><ChartNoAxesCombined aria-hidden="true" /> conversions</span>{" "}
                  for your product in less than 1 hour.
                </p>
              ) : (
                <div className={styles.outcomeCard}>
                  <Target aria-hidden="true" />
                  <p>{page.outcome ?? page.description}</p>
                </div>
              )}
            </header>
          )}

          <div className={`${styles.mainContent} ${isIntroduction ? styles.introductionContent : ""} ${
            hasMessaging && !isIntroduction && !canEdit ? styles.annotatedMainContent : ""
          }`}>
            {canEdit && !isIntroduction ? (
              <InlineCourseEditor page={page} isPrinciples={isPrinciples} />
            ) : isIntroduction ? (
              <section className={styles.salesCopy}>
                {confirmedPurchaseStatus && (purchaseStatus === "course" || purchaseStatus === "pro") ? (
                  <p className={styles.purchaseNotice} role="status">
                    Payment confirmed. Your {purchaseStatus === "pro" ? "Pro" : "Course"} presale purchase is recorded.
                  </p>
                ) : purchaseStatus === "error" ? (
                  <p className={styles.purchaseError} role="alert">
                    We could not confirm this payment yet. Refresh the page in a moment.
                  </p>
                ) : null}
                <div className={styles.authorGreeting}>
                  <Image
                    src="/images/tom-zaragoza.jpg"
                    width={44}
                    height={44}
                    alt="Tom Zaragoza"
                  />
                  <p>Hey, Tom here!</p>
                </div>
                <p>
                  This course will teach you how to run X ads for whatever product
                  you are building.
                </p>
                <p>
                  I&apos;m building the course to be{" "}
                  <em>super</em>{" "}
                  straightforward and instructional. I get straight to the point,
                  tell you what you need to do, and explain fundamentals so you know
                  the reasoning
                  behind the actions you&apos;ll take.
                </p>
                <p>
                  I&apos;ve been running ads on X since 2019 and I can confidently
                  say it&apos;s the best place to advertise on for indie hackers,
                  founders, vibe coders that are building software products. Your
                  customers are on X, it&apos;s cheap to run ads on the platform,
                  and it just <em>works</em>.
                </p>
                <p>
                  I&apos;ve found hundreds of customers from X Ads and I&apos;ll show you
                  everything you need to know to do the same!
                </p>
                {hasCourseAccess ? (
                  <>
                    <p>
                      Your account has course preview access.
                      Continue to the first lesson.
                    </p>
                    <Link className={styles.presaleButton} href="/x-ads/principles">
                      Start the course →
                    </Link>
                  </>
                ) : access === "course" || access === "pro" ? (
                  <p>
                    Your {access === "pro" ? "Pro" : "Course"} presale purchase is recorded.
                    The lessons will open to customers when the course launches.
                  </p>
                ) : (
                  <PresaleCheckout returnPath={page.path} initialNow={initialNow} />
                )}
                <section className={styles.curriculum} aria-labelledby="curriculum-title">
                  <h2 id="curriculum-title">Inside the course</h2>
                  <p>{navigation.length - 1} chapters to help you prepare, launch, and improve your campaigns.</p>
                  <ol className={styles.chapterList}>
                    {navigation.slice(1).map((chapter, index) => (
                      <li key={chapter.path}>
                        <Link className={styles.chapterLink} href={chapter.path}>
                          <span className={styles.chapterNumber} aria-hidden="true">
                            {String(index + 1).padStart(2, "0")}
                          </span>
                          <div>
                            <h3>{chapter.title}</h3>
                            <p>{chapter.description}</p>
                          </div>
                          <span aria-hidden="true">→</span>
                        </Link>
                      </li>
                    ))}
                  </ol>
                </section>
              </section>
            ) : hasCourseAccess ? (
              hasMessaging ? (
                <CourseAnnotations pageSlug={page.slug}>
                  <div className={styles.lessonContent}>
                    {page.content.map((section, index) => (
                      <section
                        className={`${styles.contentSection} ${isPrinciples ? styles.principleSection : ""}`}
                        key={section.id ?? index}
                      >
                        <CourseSectionContent
                          section={section}
                          index={index}
                          isPrinciples={isPrinciples}
                          pageSlug={page.slug}
                        />
                      </section>
                    ))}
                  </div>
                </CourseAnnotations>
              ) : (
                <div className={styles.lessonContent}>
                  {page.content.map((section, index) => (
                    <section
                      className={`${styles.contentSection} ${isPrinciples ? styles.principleSection : ""}`}
                      key={section.id ?? index}
                    >
                      <CourseSectionContent
                        section={section}
                        index={index}
                        isPrinciples={isPrinciples}
                      />
                    </section>
                  ))}
                </div>
              )
            ) : (
              <CourseAccessGate
                access={access === "public" ? "signed-out" : access}
                returnPath={page.path}
                initialNow={initialNow}
              />
            )}
          </div>

          {previousPage || nextPage ? (
            <nav className={styles.courseFooter} aria-label="Previous and next course pages">
              {previousPage ? (
                <Link className={styles.courseFooterLink} href={previousPage.path}>
                  <span>← Previous</span>
                  <strong>
                    {previousPage.path === "/x-ads" ? "Introduction" : previousPage.title}
                  </strong>
                </Link>
              ) : null}
              {nextPage ? (
                <Link
                  className={`${styles.courseFooterLink} ${styles.nextCoursePage}`}
                  href={nextPage.path}
                >
                  <span>Next →</span>
                  <strong>{nextPage.title}</strong>
                </Link>
              ) : null}
            </nav>
          ) : null}
        </article>
      </div>
    </main>
  );
}
