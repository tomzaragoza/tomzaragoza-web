import { getCourseVideoSource } from "@/lib/course-video";
import type { CourseVideo as CourseVideoDefinition } from "@/lib/course-content-shared";
import styles from "./x-ads.module.css";

export function CourseVideo({ video }: { video: CourseVideoDefinition }) {
  const source = getCourseVideoSource(video.url);

  if (!source) return null;

  return (
    <figure className={styles.lessonVideo}>
      <div className={styles.lessonVideoFrame}>
        {source.kind === "embed" ? (
          <iframe
            src={source.src}
            title={video.title || "Course video"}
            allow="accelerometer; autoplay; encrypted-media; picture-in-picture; fullscreen"
            allowFullScreen
            loading="lazy"
            referrerPolicy="strict-origin-when-cross-origin"
          />
        ) : (
          <video controls playsInline preload="metadata">
            <source src={source.src} />
            {video.captionsUrl ? (
              <track kind="captions" src={video.captionsUrl} srcLang="en" label="English" default />
            ) : null}
          </video>
        )}
      </div>
      {video.title ? <figcaption>{video.title}</figcaption> : null}
    </figure>
  );
}
