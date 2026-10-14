import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, Library } from "lucide-react";
import { getCourseAccess } from "@/lib/course-access";
import { canViewCourseLessons } from "@/lib/course-access-policy";
import { getCourseAdminAccess } from "@/lib/course-admin";
import { getCourseNavigation } from "@/lib/course-content";
import { CourseSidebar } from "../course-sidebar";
import { MobileCourseNav } from "../mobile-course-nav";
import styles from "../x-ads.module.css";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Ads Library | X Ads", robots: { index: false, follow: false } };

export default async function AdsLibraryPage() {
  const access = await getCourseAccess();
  if (access === "signed-out") redirect("/sign-in?returnPath=%2Fx-ads%2Flibrary");
  if (!canViewCourseLessons(access)) redirect("/x-ads");
  const [navigation, adminAccess] = await Promise.all([getCourseNavigation(), getCourseAdminAccess()]);
  const canEdit = adminAccess.status === "authorized";
  const showMessages = canViewCourseLessons(access);

  return (
    <main className={styles.page}>
      <a className={styles.skipLink} href="#library-content">Skip to library content</a>
      <MobileCourseNav currentPath="/x-ads/library" navigation={navigation} canEdit={canEdit} showMessages={showMessages} />
      <div className={styles.courseShell}>
        <CourseSidebar currentPath="/x-ads/library" navigation={navigation} canEdit={canEdit} showMessages={showMessages} />
        <article className={styles.dashboardContent} id="library-content">
          <header className={styles.dashboardHeader}><h1>Ads Library</h1><p>Ad examples to help you plan your next campaign.</p></header>
          <section className={styles.libraryEmpty}>
            <h2>Your ad library is coming next</h2>
            <p>There are no ads here yet. You can explore the course while the library is being prepared.</p>
            <Library aria-hidden="true" />
            <Link className={styles.presaleButton} href="/x-ads">Back to your workspace <ArrowRight aria-hidden="true" /></Link>
          </section>
        </article>
      </div>
    </main>
  );
}
