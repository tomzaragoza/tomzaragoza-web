import Image from "next/image";
import Link from "next/link";
import { ChartNoAxesCombined, Eye, MousePointer2, Target } from "lucide-react";
import { AuthControls } from "@/app/components/auth-controls";
import type { CourseAccess } from "@/lib/course-access";
import type { CourseNavigationItem, CoursePageRecord } from "@/lib/course-content-shared";
import { CourseSectionContent } from "./course-section";
import { InlineCourseEditor, InlineCourseHeader } from "./inline-course-editor";
import { MobileCourseNav } from "./mobile-course-nav";
import styles from "./x-ads.module.css";

type CoursePageAccess = CourseAccess | "public";

function PresaleCheckout({
  returnPath,
  label = "Unlock the course — $20"
}: {
  returnPath: string;
  label?: string;
}) {
  return (
    <form className={styles.presaleCheckout} action="/api/stripe/checkout" method="post">
      <input type="hidden" name="returnPath" value={returnPath} />
      <button className={styles.presaleButton} type="submit">
        {label}
      </button>
    </form>
  );
}

function CourseAccessGate({
  access,
  returnPath
}: {
  access: Exclude<CoursePageAccess, "full" | "public">;
  returnPath: string;
}) {
  const isSignedOut = access === "signed-out";

  return (
    <section className={styles.accessGate} aria-labelledby="course-access-title">
      <p className={styles.accessEyebrow}>Course access</p>
      <h2 id="course-access-title">
        {isSignedOut ? "Sign in to access the course" : "Upgrade to unlock this lesson"}
      </h2>
      <p>
        {isSignedOut
          ? "The course is available only to signed-in accounts. Use your Google account to continue."
          : "Your account is signed in, but it does not have course access yet. Upgrade to open every lesson."}
      </p>
      {isSignedOut ? (
        <div className={styles.gateAuthControls}>
          <AuthControls />
        </div>
      ) : (
        <PresaleCheckout returnPath={returnPath} />
      )}
    </section>
  );
}

export function CoursePage({
  page,
  access,
  navigation,
  canEdit = false
}: {
  page: CoursePageRecord;
  access: CoursePageAccess;
  navigation: readonly CourseNavigationItem[];
  canEdit?: boolean;
}) {
  const isIntroduction = page.path === "/x-ads";
  const isPrinciples = page.path === "/x-ads/principles";

  return (
    <main className={styles.page}>
      <a className={styles.skipLink} href="#course-content">
        Skip to course content
      </a>

      <MobileCourseNav currentPath={page.path} navigation={navigation} />

      <div className={styles.courseShell}>
        <aside className={styles.sidebar} aria-label="Course navigation">
          <div className={styles.sidebarInner}>
            <div className={styles.switcherWrap}>
              <details className={styles.siteSwitcher}>
                <summary>
                  <Image
                    className={styles.switcherAvatar}
                    src="/images/tom-zaragoza.jpg"
                    width={32}
                    height={32}
                    alt="Tom Zaragoza"
                    priority
                  />
                  <span>X Ads Course</span>
                  <svg viewBox="0 0 16 16" aria-hidden="true">
                    <path d="m5 6 3-3 3 3M5 10l3 3 3-3" />
                  </svg>
                </summary>

                <div className={styles.switcherMenu}>
                  <Link href="/">
                    <span>Homepage</span>
                  </Link>
                  <Link className={styles.currentPage} href="/x-ads" aria-current="page">
                    <span>X Ads Course</span>
                    <span className={styles.checkmark} aria-hidden="true">✓</span>
                  </Link>
                </div>
              </details>
            </div>

            <nav className={styles.contents} aria-label="Course contents">
              {navigation.map((item, index) => (
                <div className={styles.navGroup} key={item.path}>
                  <Link
                    className={`${styles.parentLink} ${
                      page.path === item.path ? styles.activeLink : ""
                    }`}
                    href={item.path}
                    aria-current={page.path === item.path ? "page" : undefined}
                  >
                    <span className={styles.navTitle}>
                      <span className={styles.chapterNumber} aria-hidden="true">
                        {index === 0 ? "—" : String(index).padStart(2, "0")}
                      </span>
                      {item.title}
                    </span>
                    <span aria-hidden="true">→</span>
                  </Link>
                </div>
              ))}
            </nav>
            <div className={styles.accountControls}>
              {canEdit ? <Link className={styles.cmsLink} href="/admin/course">Manage course pages</Link> : null}
              <AuthControls />
            </div>
          </div>
        </aside>

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

          <div className={`${styles.mainContent} ${isIntroduction ? styles.introductionContent : ""}`}>
            {canEdit && !isIntroduction ? (
              <InlineCourseEditor page={page} isPrinciples={isPrinciples} />
            ) : access === "signed-out" ? (
              <CourseAccessGate access={access} returnPath={page.path} />
            ) : isIntroduction ? (
              <section className={styles.salesCopy}>
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
                  This textbook will teach you how to run X ads for whatever product
                  you are building.
                </p>
                <p>
                  I made it super straightforward and instructional, so don&apos;t
                  be surprised when you can&apos;t find any fluff inside. I get
                  straight to the point and tell you what you need to do immediately.
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
                  everything you need to know to do the same.
                </p>
                {access === "full" ? (
                  <>
                    <p>Your account has full access. Continue to the first lesson.</p>
                    <Link className={styles.presaleButton} href="/x-ads/principles">
                      Start the course →
                    </Link>
                  </>
                ) : (
                  <>
                    <p>
                      If this sounds good, click the button below to unlock the course
                      and let&apos;s get started.
                    </p>
                    <span className={styles.checkoutArrow} aria-hidden="true">&darr;</span>
                    <PresaleCheckout returnPath={page.path} />
                  </>
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
            ) : access === "full" ? (
                <div className={styles.lessonContent}>
                  {page.content.map((section, index) => (
                    <section
                      className={`${styles.contentSection} ${isPrinciples ? styles.principleSection : ""}`}
                      key={section.id ?? index}
                    >
                      <CourseSectionContent section={section} index={index} isPrinciples={isPrinciples} />
                    </section>
                  ))}
                </div>
            ) : (
              <CourseAccessGate
                access={access === "public" ? "signed-out" : access}
                returnPath={page.path}
              />
            )}
          </div>
        </article>
      </div>
    </main>
  );
}
