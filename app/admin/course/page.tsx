import Link from "next/link";
import { notFound } from "next/navigation";
import { getCourseAdminAccess } from "@/lib/course-admin";
import { getAdminCoursePages } from "@/lib/course-content";
import { AdminAccessGate } from "../admin-access-gate";
import { CourseEditor } from "./course-editor";
import styles from "./course-editor.module.css";

export const dynamic = "force-dynamic";

export default async function CourseAdminPage() {
  const access = await getCourseAdminAccess();

  if (access.status === "signed-out") return <AdminAccessGate />;
  if (access.status === "forbidden") notFound();

  const pages = await getAdminCoursePages();

  return (
    <main className={styles.shell}>
      <div className={styles.header}>
        <div>
          <Link href="/admin">Admin</Link>
          <h1>Course CMS</h1>
          <p>Create course pages here. Open any page to edit its content in place.</p>
        </div>
        <Link href="/x-ads">View course</Link>
      </div>
      <CourseEditor pages={pages} />
    </main>
  );
}
