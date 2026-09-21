import { notFound } from "next/navigation";
import { getCourseAdminAccess } from "@/lib/course-admin";
import { getAdminCourseAnnotationThreads } from "@/lib/course-annotations";
import { getAdminCourseThreads } from "@/lib/course-messages";
import { getCourseNavigation } from "@/lib/course-content";
import { CourseSidebar } from "@/app/x-ads/course-sidebar";
import { MobileCourseNav } from "@/app/x-ads/mobile-course-nav";
import pageStyles from "@/app/x-ads/x-ads.module.css";
import { AdminAccessGate } from "../../admin-access-gate";
import { CourseMessageInbox } from "./course-message-inbox";

export const dynamic = "force-dynamic";

export default async function CourseMessagesPage() {
  const access = await getCourseAdminAccess();

  if (access.status === "signed-out") return <AdminAccessGate />;
  if (access.status === "forbidden") notFound();

  const [noteThreads, annotationThreads, navigation] = await Promise.all([
    getAdminCourseThreads(),
    getAdminCourseAnnotationThreads(),
    getCourseNavigation()
  ]);
  const threads = [...noteThreads, ...annotationThreads]
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

  return (
    <main className={pageStyles.page}>
      <a className={pageStyles.skipLink} href="#admin-messages">Skip to messages</a>
      <MobileCourseNav currentPath="/admin/course/messages" navigation={navigation} canEdit />
      <div className={pageStyles.courseShell}>
        <CourseSidebar currentPath="/admin/course/messages" navigation={navigation} canEdit />
        <article className={pageStyles.dashboardContent} id="admin-messages">
          <header className={pageStyles.dashboardHeader}>
            <h1>Customer messages</h1>
            <p>Private conversations from course notes and inline comments.</p>
          </header>
          <CourseMessageInbox initialThreads={threads} />
        </article>
      </div>
    </main>
  );
}
