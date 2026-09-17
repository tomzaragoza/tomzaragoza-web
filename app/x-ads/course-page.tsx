import Image from "next/image";
import Link from "next/link";
import { ChartNoAxesCombined, Eye, MousePointer2 } from "lucide-react";
import { AuthControls } from "@/app/components/auth-controls";
import type { CourseAccess } from "@/lib/course-access";
import { courseNavigation, coursePages, type CoursePageDefinition } from "./course-data";
import { MobileCourseNav } from "./mobile-course-nav";
import styles from "./x-ads.module.css";

type CoursePageAccess = CourseAccess | "public";

function PrincipleAnimation({ index }: { index: number }) {
  if (index === 0) {
    return (
      <div className={`${styles.principleVisual} ${styles.engineVisual}`} aria-hidden="true">
        <span className={`${styles.signalDot} ${styles.signalDotOne}`} />
        <span className={`${styles.signalDot} ${styles.signalDotTwo}`} />
        <span className={`${styles.signalDot} ${styles.signalDotThree}`} />
        <span className={styles.signalHub} />
        <span className={styles.signalResult} />
      </div>
    );
  }

  if (index === 1) {
    return (
      <div className={`${styles.principleVisual} ${styles.pixelVisual}`} aria-hidden="true">
        <div className={styles.pixelGrid}>
          {Array.from({ length: 12 }, (_, pixelIndex) => <span key={pixelIndex} />)}
        </div>
      </div>
    );
  }

  if (index === 2) {
    return (
      <div className={`${styles.principleVisual} ${styles.nativeVisual}`} aria-hidden="true">
        <div className={`${styles.miniPost} ${styles.adPost}`}><span /><span /><span /></div>
        <div className={`${styles.miniPost} ${styles.nativePost}`}><span /><span /><span /></div>
      </div>
    );
  }

  if (index === 3) {
    return (
      <div className={`${styles.principleVisual} ${styles.demoVisual}`} aria-hidden="true">
        <span className={styles.demoTrack} />
        <span className={styles.demoProduct} />
        <span className={styles.demoResult} />
      </div>
    );
  }

  return (
    <div className={`${styles.principleVisual} ${styles.feedVisual}`} aria-hidden="true">
      <div className={styles.miniFeed}>
        <div><span /><span /></div>
        <div><span /><span /></div>
        <div><span /><span /></div>
        <div><span /><span /></div>
      </div>
    </div>
  );
}

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
  access
}: {
  page: CoursePageDefinition;
  access: CoursePageAccess;
}) {
  const isIntroduction = page.path === "/x-ads";
  const isPrinciples = page.path === "/x-ads/principles";

  return (
    <main className={styles.page}>
      <a className={styles.skipLink} href="#course-content">
        Skip to course content
      </a>

      <MobileCourseNav currentPath={page.path} />

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
              {courseNavigation.map((item, index) => (
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
              <AuthControls />
            </div>
          </div>
        </aside>

        <article className={styles.content} id="course-content">
          <header className={styles.pageHeader}>
            <h1>{page.title}</h1>
            <p className={styles.pageDescription}>
              {isIntroduction ? (
                <>
                  Go from complete beginner to getting{" "}
                  <span className={styles.inlineOutcome}><Eye aria-hidden="true" /> impressions</span>,{" "}
                  <span className={styles.inlineOutcome}><MousePointer2 aria-hidden="true" /> clicks</span>, and{" "}
                  <span className={styles.inlineOutcome}><ChartNoAxesCombined aria-hidden="true" /> conversions</span>{" "}
                  for your product in less than 1 hour.
                </>
              ) : page.description}
            </p>
          </header>

          <div className={`${styles.mainContent} ${isIntroduction ? styles.introductionContent : ""}`}>
            {access === "signed-out" ? (
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
                  <p>{courseNavigation.length - 1} chapters to help you prepare, launch, and improve your campaigns.</p>
                  <ol className={styles.chapterList}>
                    {courseNavigation.slice(1).map((chapter, index) => (
                      <li key={chapter.path}>
                        <Link className={styles.chapterLink} href={chapter.path}>
                          <span className={styles.chapterNumber} aria-hidden="true">
                            {String(index + 1).padStart(2, "0")}
                          </span>
                          <div>
                            <h3>{chapter.title}</h3>
                            <p>{coursePages.find((item) => item.path === chapter.path)?.description}</p>
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
                      key={index}
                    >
                      {section.heading ? (
                        isPrinciples ? (
                          <div className={styles.principleHeader}>
                            <h2>{section.heading}</h2>
                            <PrincipleAnimation index={index} />
                          </div>
                        ) : <h2>{section.heading}</h2>
                      ) : null}
                      {section.paragraphs?.map((paragraph, paragraphIndex) => (
                        <p key={paragraphIndex}>
                          {typeof paragraph === "string"
                            ? paragraph
                            : paragraph.content.map((part, partIndex) =>
                                typeof part === "string" ? (
                                  part
                                ) : (
                                  <a
                                    href={part.href}
                                    key={partIndex}
                                    target={part.external ? "_blank" : undefined}
                                    rel={part.external ? "noreferrer" : undefined}
                                  >
                                    {part.label}
                                  </a>
                                )
                              )}
                        </p>
                      ))}
                      {section.steps ? (
                        <ol className={styles.setupSteps}>
                          {section.steps.map((step) => <li key={step}>{step}</li>)}
                        </ol>
                      ) : null}
                      {section.items ? (
                        <ul>
                          {section.items.map((item) => <li key={item}>{item}</li>)}
                        </ul>
                      ) : null}
                      {section.note ? <p className={styles.lessonNote}>{section.note}</p> : null}
                      {section.image ? (
                        <figure
                          className={[
                            styles.lessonFigure,
                            section.image.wide ? styles.lessonFigureWide : "",
                            section.image.wide && section.image.height >= section.image.width * 0.8
                              ? styles.lessonFigurePortrait
                              : ""
                          ].filter(Boolean).join(" ")}
                        >
                          <a href={section.image.src} target="_blank" rel="noreferrer" aria-label={`Open full-size image: ${section.image.alt}`}>
                            <Image
                              src={section.image.src}
                              alt={section.image.alt}
                              width={section.image.width}
                              height={section.image.height}
                              unoptimized
                            />
                          </a>
                          <figcaption>
                            {section.image.caption}{" "}
                            <a href={section.image.source} target="_blank" rel="noreferrer">Source: X</a>
                          </figcaption>
                        </figure>
                      ) : null}
                      {section.links ? (
                        <div className={styles.lessonLinks}>
                          {section.links.map((link) => (
                            <Link key={link.href} href={link.href}
                              target={link.href.startsWith("https://") ? "_blank" : undefined}
                              rel={link.href.startsWith("https://") ? "noreferrer" : undefined}
                            >{link.label}</Link>
                          ))}
                        </div>
                      ) : null}
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
