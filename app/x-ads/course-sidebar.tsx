import Image from "next/image";
import Link from "next/link";
import { AuthControls } from "@/app/components/auth-controls";
import type { CourseNavigationItem } from "@/lib/course-content-shared";
import styles from "./x-ads.module.css";

export function CourseSidebar({
  currentPath,
  navigation,
  canEdit = false,
  showMessages = true,
  showAccountControls = true
}: {
  currentPath: string;
  navigation: readonly CourseNavigationItem[];
  canEdit?: boolean;
  showMessages?: boolean;
  showAccountControls?: boolean;
}) {
  return (
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
              <Link href="/"><span>Homepage</span></Link>
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
                className={`${styles.parentLink} ${currentPath === item.path ? styles.activeLink : ""}`}
                href={item.path}
                aria-current={currentPath === item.path ? "page" : undefined}
              >
                <span className={styles.navTitle}>
                  <span className={styles.chapterNumber} aria-hidden="true">
                    {index === 0 ? "—" : String(index).padStart(2, "0")}
                  </span>
                  {item.path === "/x-ads" ? "Introduction" : item.title}
                </span>
                <span aria-hidden="true">→</span>
              </Link>
            </div>
          ))}
        </nav>

        {showAccountControls ? (
          <div className={styles.accountControls}>
            {canEdit ? <Link className={styles.cmsLink} href="/admin/course">Manage course pages</Link> : null}
            <AuthControls
              courseAccount
              adminMessages={canEdit}
              showMessages={showMessages}
            />
          </div>
        ) : null}
      </div>
    </aside>
  );
}
