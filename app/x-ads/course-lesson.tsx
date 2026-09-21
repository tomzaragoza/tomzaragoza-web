import { Target } from "lucide-react";
import type { CoursePageRecord } from "@/lib/course-content-shared";
import { flattenCourseBlocks, legacyCourseBlocks } from "@/lib/course-blocks";
import { AnnotationBlock, CourseAnnotations } from "./course-annotations";
import { CourseBlocks } from "./course-block-content";
import { CourseVideo } from "./course-video";
import { CourseVideoLayout } from "./course-video-layout";
import styles from "./x-ads.module.css";

export function CourseLessonHeader({ page }: { page: CoursePageRecord }) {
  return <header className={styles.pageHeader}>
    <h1>{page.title}</h1>
    <div className={styles.outcomeCard}><Target aria-hidden="true" /><p>{page.outcome ?? page.description}</p></div>
  </header>;
}

export function CourseLessonBody({ page }: { page: CoursePageRecord }) {
  const blocks = page.blocks ?? legacyCourseBlocks(page.content);
  const firstVideoId = page.mainVideo ? "main-video" : flattenCourseBlocks(blocks).find(block => block.type === "video")?.id ?? null;
  return <CourseVideoLayout key={page.slug} firstVideoId={firstVideoId}><CourseAnnotations pageSlug={page.slug} blockIds={[...flattenCourseBlocks(blocks).map(block => block.id), ...(page.mainVideo ? ["main-video"] : [])]}>
    {page.mainVideo && <AnnotationBlock as="div" blockId="main-video"><CourseVideo video={page.mainVideo} pageSlug={page.slug} videoId="main-video" /></AnnotationBlock>}
    <CourseBlocks blocks={blocks} pageSlug={page.slug} />
  </CourseAnnotations></CourseVideoLayout>;
}
