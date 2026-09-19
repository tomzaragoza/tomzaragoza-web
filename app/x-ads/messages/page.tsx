import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getCourseAccess } from "@/lib/course-access";
import { getCourseAdminAccess } from "@/lib/course-admin";
import { getPrivateCourseAnnotations } from "@/lib/course-annotations";
import { getCourseNavigation } from "@/lib/course-content";
import {
  getCourseMessagingUser,
  getPrivateCourseMessageThreads
} from "@/lib/course-messages";
import { MobileCourseNav } from "../mobile-course-nav";
import { CourseSidebar } from "../course-sidebar";
import { CourseMessageCenter } from "./course-message-center";
import pageStyles from "../x-ads.module.css";
import styles from "./messages.module.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Messages | X Ads course",
  robots: { index: false, follow: false }
};

export default async function CourseMessagesPage() {
  const requestHeaders = await headers();
  const user = await getCourseMessagingUser(requestHeaders);
  if (!user) {
    const access = await getCourseAccess();
    redirect(access === "signed-out" ? "/login" : "/x-ads");
  }

  const [navigation, adminAccess, noteThreads, annotationThreads] = await Promise.all([
    getCourseNavigation(),
    getCourseAdminAccess(requestHeaders),
    getPrivateCourseMessageThreads(user),
    getPrivateCourseAnnotations(user)
  ]);
  const threads = [...noteThreads, ...annotationThreads]
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  const canEdit = adminAccess.status === "authorized";

  return (
    <main className={pageStyles.page}>
      <MobileCourseNav
        currentPath="/x-ads/messages"
        navigation={navigation}
        canEdit={canEdit}
      />
      <div className={pageStyles.courseShell}>
        <CourseSidebar
          currentPath="/x-ads/messages"
          navigation={navigation}
          canEdit={canEdit}
        />
        <article className={styles.content}>
          <header className={styles.header}>
            <h1>Messages</h1>
            <p>Your private conversations with Tom.</p>
          </header>
          <CourseMessageCenter initialThreads={threads} />
        </article>
      </div>
    </main>
  );
}
