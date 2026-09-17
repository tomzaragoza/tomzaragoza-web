"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Target } from "lucide-react";
import type {
  CourseContentSection,
  CoursePageRecord,
  CourseParagraph
} from "@/lib/course-content-shared";
import { CourseSectionContent } from "./course-section";
import styles from "./x-ads.module.css";

function paragraphText(paragraph: CourseParagraph) {
  if (typeof paragraph === "string") return paragraph;
  return paragraph.content.map((part) => typeof part === "string" ? part : part.label).join("");
}

async function updateCoursePage(payload: object) {
  const response = await fetch("/api/admin/course", {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload)
  });
  const body = await response.json();

  if (!response.ok) throw new Error(body.error ?? "Unable to save the page.");
  return body.page as CoursePageRecord;
}

export function InlineCourseHeader({ page }: { page: CoursePageRecord }) {
  const router = useRouter();
  const [draft, setDraft] = useState(page);
  const [editing, setEditing] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState("");

  async function save() {
    setIsBusy(true);
    setError("");

    try {
      const saved = await updateCoursePage({
        kind: "details",
        slug: draft.slug,
        title: draft.title,
        description: draft.description,
        outcome: draft.outcome
      });
      setDraft(saved);
      setEditing(false);
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to save the page.");
    } finally {
      setIsBusy(false);
    }
  }

  if (editing) {
    return (
      <header className={`${styles.pageHeader} ${styles.inlineHeaderForm}`}>
        <label>
          Page title
          <input
            value={draft.title}
            onChange={(event) => setDraft({ ...draft, title: event.target.value })}
          />
        </label>
        <label>
          Navigation description
          <textarea
            rows={3}
            value={draft.description}
            onChange={(event) => setDraft({ ...draft, description: event.target.value })}
          />
        </label>
        <label>
          Lesson goal
          <textarea
            rows={3}
            value={draft.outcome ?? ""}
            onChange={(event) => setDraft({ ...draft, outcome: event.target.value || undefined })}
          />
        </label>
        <div className={styles.inlineActions}>
          <button type="button" onClick={() => { setDraft(page); setEditing(false); }} disabled={isBusy}>
            Cancel
          </button>
          <button type="button" onClick={() => void save()} disabled={isBusy}>
            {isBusy ? "Saving…" : "Save details"}
          </button>
        </div>
        {error ? <p className={styles.inlineError} role="alert">{error}</p> : null}
      </header>
    );
  }

  return (
    <header className={`${styles.pageHeader} ${styles.inlineEditableHeader}`}>
      <button type="button" onClick={() => setEditing(true)} aria-label="Edit page title and lesson goal">
        <span>Edit page details</span>
      </button>
      <h1>{draft.title}</h1>
      <div className={styles.outcomeCard}>
        <Target aria-hidden="true" />
        <p>{draft.outcome ?? draft.description}</p>
      </div>
    </header>
  );
}

export function InlineCourseEditor({
  page,
  isPrinciples
}: {
  page: CoursePageRecord;
  isPrinciples: boolean;
}) {
  const router = useRouter();
  const [draft, setDraft] = useState(page);
  const [editingSectionId, setEditingSectionId] = useState("");
  const [isBusy, setIsBusy] = useState(false);
  const [status, setStatus] = useState("Select a section to edit it.");
  const [error, setError] = useState("");
  const editingSection = draft.content.find((section) => section.id === editingSectionId);

  function updateSection(sectionId: string, patch: Partial<CourseContentSection>) {
    setDraft((current) => ({
      ...current,
      content: current.content.map((section) =>
        section.id === sectionId ? { ...section, ...patch } : section
      )
    }));
  }

  function updateParagraph(sectionId: string, paragraphIndex: number, value: string) {
    const section = draft.content.find((item) => item.id === sectionId);
    if (!section?.paragraphs) return;
    updateSection(sectionId, {
      paragraphs: section.paragraphs.map((paragraph, index) =>
        index === paragraphIndex ? value : paragraph
      )
    });
  }

  function addSection() {
    const id = `section-${crypto.randomUUID()}`;
    setDraft((current) => ({
      ...current,
      content: [...current.content, {
        id,
        heading: "New section",
        paragraphs: ["Add the section content here."]
      }]
    }));
    setEditingSectionId(id);
    setStatus("New section added. Save it when the content is ready.");
  }

  async function save() {
    setIsBusy(true);
    setError("");
    setStatus("Saving page.");

    try {
      const saved = await updateCoursePage({
        kind: "content",
        slug: draft.slug,
        content: draft.content
      });
      setDraft(saved);
      setEditingSectionId("");
      setStatus("Page saved.");
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to save the page.");
      setStatus("Save failed.");
    } finally {
      setIsBusy(false);
    }
  }

  function removeSection(sectionId: string) {
    if (!window.confirm("Remove this section? The change takes effect after you save the page.")) return;
    setDraft((current) => ({
      ...current,
      content: current.content.filter((section) => section.id !== sectionId)
    }));
    setEditingSectionId("");
    setStatus("Section removed. Save the page to confirm the change.");
  }

  return (
    <div className={styles.lessonContent}>
      <div className={styles.inlineToolbar}>
        <div>
          <strong>Editing course content</strong>
          <span aria-live="polite">{status}</span>
        </div>
        <div>
          <Link href="/admin/course">Manage pages</Link>
          <button type="button" onClick={addSection} disabled={isBusy}>Add section</button>
          <button type="button" onClick={() => void save()} disabled={isBusy}>
            {isBusy ? "Saving…" : "Save page"}
          </button>
        </div>
      </div>
      {error ? <p className={styles.inlineError} role="alert">{error}</p> : null}

      {draft.content.length === 0 ? (
        <button className={styles.inlineEmptyState} type="button" onClick={addSection}>
          Add the first section
        </button>
      ) : null}

      {draft.content.map((section, index) => (
        editingSection?.id === section.id ? (
          <section
            className={`${styles.contentSection} ${styles.inlineSectionForm}`}
            key={section.id}
          >
            <div className={styles.inlineFormHeader}>
              <strong>Edit section</strong>
              <button type="button" onClick={() => removeSection(section.id)}>Remove</button>
            </div>
            <label>
              Section heading
              <input
                value={section.heading ?? ""}
                onChange={(event) => updateSection(section.id, { heading: event.target.value })}
              />
            </label>
            <div className={styles.inlineParagraphs}>
              {section.paragraphs?.map((paragraph, paragraphIndex) => (
                <label key={paragraphIndex}>
                  {typeof paragraph === "string" ? `Paragraph ${paragraphIndex + 1}` : `Rich paragraph ${paragraphIndex + 1}`}
                  <textarea
                    rows={5}
                    value={paragraphText(paragraph)}
                    onChange={(event) => updateParagraph(section.id, paragraphIndex, event.target.value)}
                    readOnly={typeof paragraph !== "string"}
                  />
                  {typeof paragraph !== "string" ? <small>Linked text is preserved and read-only here.</small> : null}
                </label>
              ))}
              <button
                type="button"
                onClick={() => updateSection(section.id, {
                  paragraphs: [...(section.paragraphs ?? []), "New paragraph."]
                })}
              >
                Add paragraph
              </button>
            </div>
            <div className={styles.inlineVideoFields}>
              <div className={styles.inlineFormHeader}>
                <strong>Video recording</strong>
                {section.video ? (
                  <button type="button" onClick={() => updateSection(section.id, { video: undefined })}>Remove video</button>
                ) : (
                  <button type="button" onClick={() => updateSection(section.id, { video: { url: "" } })}>Add video</button>
                )}
              </div>
              {section.video ? (
                <>
                  <label>
                    Recording URL
                    <input
                      type="url"
                      placeholder="https://www.loom.com/share/..."
                      value={section.video.url}
                      onChange={(event) => updateSection(section.id, {
                        video: { ...section.video!, url: event.target.value }
                      })}
                    />
                  </label>
                  <label>
                    Video title
                    <input
                      value={section.video.title ?? ""}
                      onChange={(event) => updateSection(section.id, {
                        video: { ...section.video!, title: event.target.value }
                      })}
                    />
                  </label>
                  <label>
                    Captions file URL
                    <input
                      type="url"
                      value={section.video.captionsUrl ?? ""}
                      onChange={(event) => updateSection(section.id, {
                        video: { ...section.video!, captionsUrl: event.target.value || undefined }
                      })}
                    />
                  </label>
                </>
              ) : null}
            </div>
            <div className={styles.inlineActions}>
              <button type="button" onClick={() => { setDraft(page); setEditingSectionId(""); }}>
                Cancel changes
              </button>
              <button type="button" onClick={() => void save()} disabled={isBusy}>
                {isBusy ? "Saving…" : "Save section"}
              </button>
            </div>
          </section>
        ) : (
          <div className={styles.inlineSectionShell} key={section.id}>
            <button
              className={styles.inlineSectionTrigger}
              type="button"
              onClick={() => setEditingSectionId(section.id)}
              aria-label={`Edit ${section.heading || `section ${index + 1}`}`}
            >
              <span>Edit section</span>
            </button>
            <section className={`${styles.contentSection} ${isPrinciples ? styles.principleSection : ""}`}>
              <CourseSectionContent section={section} index={index} isPrinciples={isPrinciples} />
            </section>
          </div>
        )
      ))}
    </div>
  );
}
