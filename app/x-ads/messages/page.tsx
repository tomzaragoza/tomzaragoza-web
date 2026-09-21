import type { Metadata } from "next";
import Link from "next/link";
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
  const access = await getCourseAccess(requestHeaders);
  if (access === "signed-out") redirect("/sign-in?returnPath=%2Fx-ads%2Fmessages");
  const user = await getCourseMessagingUser(requestHeaders);

  const [navigation, adminAccess, noteThreads, annotationThreads] = await Promise.all([
    getCourseNavigation(),
    getCourseAdminAccess(requestHeaders),
    user ? getPrivateCourseMessageThreads(user) : [],
    user ? getPrivateCourseAnnotations(user) : []
  ]);
  const threads = [...noteThreads, ...annotationThreads]
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  const canEdit = adminAccess.status === "authorized";

  return (
    <main className={pageStyles.page}>
      <a className={pageStyles.skipLink} href="#messages-content">Skip to messages</a>
      <MobileCourseNav
        currentPath="/x-ads/messages"
        navigation={navigation}
        canEdit={canEdit}
        showMessages={Boolean(user)}
      />
      <div className={pageStyles.courseShell}>
        <CourseSidebar
          currentPath="/x-ads/messages"
          navigation={navigation}
          canEdit={canEdit}
          showMessages={Boolean(user)}
        />
        <article className={styles.content} id="messages-content">
          <header className={styles.header}>
            <h1>Messages</h1>
            <p>Your private conversations with Tom.</p>
          </header>
          {user ? <CourseMessageCenter initialThreads={threads} /> : (
            <section className={styles.emptyState}>
              <h2>No messages yet</h2>
              <p>Pro includes private course messaging when the course launches.</p>
              <Link className={pageStyles.presaleButton} href="/x-ads#pro-plan">View Pro access →</Link>
            </section>
          )}
        </article>
      </div>
    </main>
  );
}
