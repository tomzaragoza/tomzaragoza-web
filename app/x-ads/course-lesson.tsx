import type { CoursePageRecord } from "@/lib/course-content-shared";
import { flattenCourseBlocks, legacyCourseBlocks } from "@/lib/course-blocks";
import { CourseBlocks } from "./course-block-content";
import { CourseVideo } from "./course-video";
import { CourseVideoLayout } from "./course-video-layout";
import styles from "./x-ads.module.css";

export function CourseLessonHeader({ page }: { page: CoursePageRecord }) {
  return <header className={styles.pageHeader}>
    <h1>{page.title}</h1>
    <p className={styles.pageDescription}>{page.outcome ?? page.description}</p>
  </header>;
}

export function CourseLessonBody({ page }: { page: CoursePageRecord }) {
  const blocks = page.blocks ?? legacyCourseBlocks(page.content);
  const firstVideoId = page.mainVideo ? "main-video" : flattenCourseBlocks(blocks).find(block => block.type === "video")?.id ?? null;
  return <CourseVideoLayout key={page.slug} firstVideoId={firstVideoId}>
    {page.mainVideo && <CourseVideo video={page.mainVideo} pageSlug={page.slug} videoId="main-video" />}
    <CourseBlocks blocks={blocks} pageSlug={page.slug} />
  </CourseVideoLayout>;
}
