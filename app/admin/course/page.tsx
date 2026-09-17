import Link from "next/link";
import { authHint } from "@/lib/auth";
import { CourseEditor } from "./course-editor";
import styles from "./course-editor.module.css";

export default function CourseAdminPage() {
  return (
    <main className={styles.shell}>
      <div className={styles.header}>
        <div>
          <Link href="/admin">Admin</Link>
          <h1>Course editor</h1>
          <p>Choose a page, then select a section to edit its copy or attach a video.</p>
        </div>
        <Link href="/x-ads">View course</Link>
      </div>
      <CourseEditor authHint={authHint()} />
    </main>
  );
}
