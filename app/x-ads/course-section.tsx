import Image from "next/image";
import Link from "next/link";
import type { CourseContentSection } from "@/lib/course-content-shared";
import { AnnotationBlock } from "./course-annotations";
import { CourseNoteThread } from "./course-note-thread";
import { CourseVideo } from "./course-video";
import styles from "./x-ads.module.css";

function PrincipleAnimation({ index }: { index: number }) {
  if (index === 0) {
    return (
      <div className={`${styles.principleVisual} ${styles.engineVisual}`} aria-hidden="true">
        <span className={`${styles.signalDot} ${styles.signalDotOne}`} />
        <span className={`${styles.signalDot} ${styles.signalDotTwo}`} />
        <span className={`${styles.signalDot} ${styles.signalDotThree}`} />
        <span className={styles.signalHub} />
        <span className={styles.signalResult} />
      </div>
    );
  }

  if (index === 1) {
    return (
      <div className={`${styles.principleVisual} ${styles.pixelVisual}`} aria-hidden="true">
        <div className={styles.pixelGrid}>
          {Array.from({ length: 12 }, (_, pixelIndex) => <span key={pixelIndex} />)}
        </div>
      </div>
    );
  }

  if (index === 2) {
    return (
      <div className={`${styles.principleVisual} ${styles.nativeVisual}`} aria-hidden="true">
        <div className={`${styles.miniPost} ${styles.adPost}`}><span /><span /><span /></div>
        <div className={`${styles.miniPost} ${styles.nativePost}`}><span /><span /><span /></div>
      </div>
    );
  }

  if (index === 3) {
    return (
      <div className={`${styles.principleVisual} ${styles.demoVisual}`} aria-hidden="true">
        <span className={styles.demoTrack} />
        <span className={styles.demoProduct} />
        <span className={styles.demoResult} />
      </div>
    );
  }

  return (
    <div className={`${styles.principleVisual} ${styles.feedVisual}`} aria-hidden="true">
      <div className={styles.miniFeed}>
        <div><span /><span /></div>
        <div><span /><span /></div>
        <div><span /><span /></div>
        <div><span /><span /></div>
      </div>
    </div>
  );
}

export function CourseSectionContent({
  section,
  index,
  isPrinciples,
  pageSlug
}: {
  section: CourseContentSection;
  index: number;
  isPrinciples: boolean;
  pageSlug?: string;
}) {
  const blockId = (path: string) => pageSlug && section.id
    ? `${section.id}:${path}`
    : undefined;

  return (
    <>
      {section.heading ? (
        isPrinciples ? (
          <div className={styles.principleHeader}>
            <AnnotationBlock as="h2" blockId={blockId("heading")}>{section.heading}</AnnotationBlock>
            <PrincipleAnimation index={index} />
          </div>
        ) : (
          <AnnotationBlock as="h2" blockId={blockId("heading")}>{section.heading}</AnnotationBlock>
        )
      ) : null}
      {section.paragraphs?.map((paragraph, paragraphIndex) => (
        <AnnotationBlock
          as="p"
          blockId={blockId(`paragraph:${paragraphIndex}`)}
          key={paragraphIndex}
        >
          {typeof paragraph === "string"
            ? paragraph
            : paragraph.content.map((part, partIndex) =>
                typeof part === "string" ? (
                  part
                ) : (
                  <a
                    href={part.href}
                    key={partIndex}
                    target={part.external ? "_blank" : undefined}
                    rel={part.external ? "noreferrer" : undefined}
                  >
                    {part.label}
                  </a>
                )
              )}
        </AnnotationBlock>
      ))}
      {section.video ? <CourseVideo video={section.video} /> : null}
      {section.steps ? (
        <ol className={styles.setupSteps}>
          {section.steps.map((step, stepIndex) => (
            <AnnotationBlock
              as="li"
              blockId={blockId(`step:${stepIndex}`)}
              key={`${stepIndex}-${step}`}
            >
              {step}
            </AnnotationBlock>
          ))}
        </ol>
      ) : null}
      {section.items ? (
        <ul>
          {section.items.map((item, itemIndex) => (
            <AnnotationBlock
              as="li"
              blockId={blockId(`item:${itemIndex}`)}
              key={`${itemIndex}-${item}`}
            >
              {item}
            </AnnotationBlock>
          ))}
        </ul>
      ) : null}
      {section.note ? (
        <CourseNoteThread note={section.note} pageSlug={pageSlug} sectionId={section.id} />
      ) : null}
      {section.image ? (
        <figure
          className={[
            styles.lessonFigure,
            section.image.wide ? styles.lessonFigureWide : "",
            section.image.wide && section.image.height >= section.image.width * 0.8
              ? styles.lessonFigurePortrait
              : ""
          ].filter(Boolean).join(" ")}
        >
          <a href={section.image.src} target="_blank" rel="noreferrer" aria-label={`Open full-size image: ${section.image.alt}`}>
            <Image
              src={section.image.src}
              alt={section.image.alt}
              width={section.image.width}
              height={section.image.height}
              unoptimized
            />
          </a>
          {section.image.caption || section.image.source ? (
            <figcaption>
              {section.image.caption}
              {section.image.caption && section.image.source ? " " : null}
              {section.image.source ? (
                <a href={section.image.source} target="_blank" rel="noreferrer">Source</a>
              ) : null}
            </figcaption>
          ) : null}
        </figure>
      ) : null}
      {section.links ? (
        <div className={styles.lessonLinks}>
          {section.links.map((link) => (
            <Link key={link.href} href={link.href}
              target={link.href.startsWith("https://") ? "_blank" : undefined}
              rel={link.href.startsWith("https://") ? "noreferrer" : undefined}
            >{link.label}</Link>
          ))}
        </div>
      ) : null}
    </>
  );
}
