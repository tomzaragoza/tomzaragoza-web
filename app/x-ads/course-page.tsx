import Image from "next/image";
import Link from "next/link";
import { AuthControls } from "@/app/components/auth-controls";
import { courseNavigation, type CoursePageDefinition } from "./course-data";
import { MobileCourseNav } from "./mobile-course-nav";
import styles from "./x-ads.module.css";

function PresaleCheckout({
  returnPath,
  label = "Buy the Presale — $20"
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

export function CoursePage({ page }: { page: CoursePageDefinition }) {
  const isIntroduction = page.path === "/x-ads";

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
              {courseNavigation.map((item) => (
                <div className={styles.navGroup} key={item.path}>
                  <Link
                    className={`${styles.parentLink} ${
                      page.path === item.path ? styles.activeLink : ""
                    }`}
                    href={item.path}
                    aria-current={page.path === item.path ? "page" : undefined}
                  >
                    <span>{item.title}</span>
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
          </header>

          <div className={`${styles.mainContent} ${isIntroduction ? styles.introductionContent : ""}`}>
            {isIntroduction ? (
              <section className={styles.salesCopy}>
                <p className={styles.salesGreeting}>Hey, Tom here</p>
                <p>
                  You&apos;re probably here because you clicked an ad on X, have
                  built something, and you want to get into the hands of your first
                  customers.
                </p>
                <p>
                  <span className={styles.salesLine}>Well, you&apos;re in luck.</span>
                  If your customers are on X, running ads on X is the{" "}
                  <em>perfect</em> way to reach them.
                </p>

                <PresaleCheckout returnPath={page.path} />

                <div className={styles.salesPoints}>
                  <p>
                    You don&apos;t need to be a reply guy for 6 months just to get
                    your first user.
                  </p>
                  <p>
                    You don&apos;t need to &quot;build an audience&quot; or
                    &quot;build in public&quot; just to get your first customer.
                  </p>
                </div>

                <p>
                  With X ads, you can skip all of that and sell{" "}
                  <em>directly to your customers</em>.
                </p>
                <p>and this course will help show you how.</p>

                <p>
                  I&apos;ve spent thousands of dollars of my own money learning how
                  to run X Ads so you don&apos;t have to. Been doing this since 2019,
                  pre Elon and post Elon.
                </p>
                <p>
                  I&apos;ll show you what works, what doesn&apos;t work, things you
                  should avoid, things you should do, and more. Packaged into one
                  course just for you.
                </p>

                <PresaleCheckout returnPath={page.path} />
              </section>
            ) : (
              <>
                <div className={styles.lessonPreview} aria-hidden="true" inert>
                  {page.content.map((section, index) => (
                    <section className={styles.contentSection} key={index}>
                      {section.heading ? <h2>{section.heading}</h2> : null}
                      {section.paragraphs?.map((paragraph) => (
                        <p key={paragraph}>{paragraph}</p>
                      ))}
                      {section.items ? (
                        <ul>
                          {section.items.map((item) => <li key={item}>{item}</li>)}
                        </ul>
                      ) : null}
                    </section>
                  ))}
                </div>

                <section className={styles.comingSoon} aria-labelledby="coming-soon-title">
                  <h2 id="coming-soon-title">Coming soon!</h2>
                  <p>
                    I&apos;m in the process of building out this course and running a
                    presale. Click the button below to buy the presale and get notified
                    when it comes out!
                  </p>
                  <PresaleCheckout returnPath={page.path} />
                </section>
              </>
            )}
          </div>
        </article>
      </div>
    </main>
  );
}
