import Link from "next/link";
import { notFound } from "next/navigation";
import { getCourseAdminAccess } from "@/lib/course-admin";
import { getAdminCourseAnnotationThreads } from "@/lib/course-annotations";
import { getAdminCourseThreads } from "@/lib/course-messages";
import { AdminAccessGate } from "../../admin-access-gate";
import { CourseMessageInbox } from "./course-message-inbox";
import styles from "./course-messages.module.css";

export const dynamic = "force-dynamic";

export default async function CourseMessagesPage() {
  const access = await getCourseAdminAccess();

  if (access.status === "signed-out") return <AdminAccessGate />;
  if (access.status === "forbidden") notFound();

  const [noteThreads, annotationThreads] = await Promise.all([
    getAdminCourseThreads(),
    getAdminCourseAnnotationThreads()
  ]);
  const threads = [...noteThreads, ...annotationThreads]
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

  return (
    <main className={styles.shell}>
      <header className={styles.header}>
        <div>
          <Link href="/admin/course">Course CMS</Link>
          <h1>Customer messages</h1>
          <p>Private conversations from course notes and inline comments.</p>
        </div>
        <Link href="/x-ads">View course</Link>
      </header>
      <CourseMessageInbox initialThreads={threads} />
    </main>
  );
}
