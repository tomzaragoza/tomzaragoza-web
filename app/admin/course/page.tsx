import Link from "next/link";
import { notFound } from "next/navigation";
import { getCourseAdminAccess } from "@/lib/course-admin";
import { getAdminCoursePages, getCourseNavigation } from "@/lib/course-content";
import { CourseSidebar } from "@/app/x-ads/course-sidebar";
import { MobileCourseNav } from "@/app/x-ads/mobile-course-nav";
import pageStyles from "@/app/x-ads/x-ads.module.css";
import { AdminAccessGate } from "../admin-access-gate";
import { CourseEditor } from "./course-editor";
import styles from "./course-editor.module.css";

export const dynamic = "force-dynamic";

export default async function CourseAdminPage() {
  const access = await getCourseAdminAccess();

  if (access.status === "signed-out") return <AdminAccessGate />;
  if (access.status === "forbidden") notFound();

  const [pages, navigation] = await Promise.all([
    getAdminCoursePages(),
    getCourseNavigation()
  ]);

  return (
    <main className={pageStyles.page}>
      <a className={pageStyles.skipLink} href="#course-editor">Skip to course editor</a>
      <MobileCourseNav currentPath="/admin/course" navigation={navigation} canEdit />
      <div className={pageStyles.courseShell}>
        <CourseSidebar currentPath="/admin/course" navigation={navigation} canEdit />
        <article className={pageStyles.dashboardContent} id="course-editor">
          <div className={styles.header}>
            <div>
              <h1>Course CMS</h1>
              <p>Create groups and pages. Open any page to edit its content.</p>
            </div>
            <div className={styles.headerActions}>
              <Link href="/admin">Admin</Link>
              <Link href="/admin/course/watch-stats">Watch stats</Link>
              <Link href="/admin/course/messages">Messages</Link>
              <Link href="/x-ads">View course</Link>
            </div>
          </div>
          <CourseEditor pages={pages} />
        </article>
      </div>
    </main>
  );
}
