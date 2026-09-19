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

type EditableListField = "steps" | "items";

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
            className={styles.inlinePageTitleInput}
            value={draft.title}
            onChange={(event) => setDraft({ ...draft, title: event.target.value })}
          />
        </label>
        <label>
          Navigation description
          <textarea
            className={styles.inlinePageDescriptionInput}
            rows={3}
            value={draft.description}
            onChange={(event) => setDraft({ ...draft, description: event.target.value })}
          />
        </label>
        <label>
          Lesson goal
          <textarea
            className={styles.inlineOutcomeInput}
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

  function updateListItem(
    sectionId: string,
    field: EditableListField,
    itemIndex: number,
    value: string
  ) {
    const section = draft.content.find((item) => item.id === sectionId);
    const list = section?.[field];
    if (!list) return;
    const updatedList = list.map((item, index) => index === itemIndex ? value : item);
    updateSection(sectionId, field === "steps" ? { steps: updatedList } : { items: updatedList });
  }

  function addListItem(sectionId: string, field: EditableListField) {
    const section = draft.content.find((item) => item.id === sectionId);
    const list = section?.[field] ?? [];
    const updatedList = [...list, field === "steps" ? "New step." : "New list item."];
    updateSection(sectionId, field === "steps" ? { steps: updatedList } : { items: updatedList });
  }

  function removeListItem(sectionId: string, field: EditableListField, itemIndex: number) {
    const section = draft.content.find((item) => item.id === sectionId);
    const list = section?.[field];
    if (!list) return;
    const updatedList = list.filter((_, index) => index !== itemIndex);
    updateSection(sectionId, field === "steps" ? { steps: updatedList } : { items: updatedList });
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
                className={styles.inlineSectionHeadingInput}
                value={section.heading ?? ""}
                onChange={(event) => updateSection(section.id, { heading: event.target.value })}
              />
            </label>
            <div className={styles.inlineParagraphs}>
              {section.paragraphs?.map((paragraph, paragraphIndex) => (
                <label key={paragraphIndex}>
                  {typeof paragraph === "string" ? `Paragraph ${paragraphIndex + 1}` : `Rich paragraph ${paragraphIndex + 1}`}
                  <textarea
                    className={styles.inlineParagraphInput}
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
            {section.steps ? (
              <div className={styles.inlineListFields}>
                <div className={styles.inlineFormHeader}>
                  <strong>Ordered steps</strong>
                  <button type="button" onClick={() => addListItem(section.id, "steps")}>Add step</button>
                </div>
                {section.steps.map((step, stepIndex) => (
                  <div className={styles.inlineListRow} key={stepIndex}>
                    <label>
                      Step {stepIndex + 1}
                      <textarea
                        className={styles.inlineListInput}
                        rows={3}
                        value={step}
                        onChange={(event) => updateListItem(section.id, "steps", stepIndex, event.target.value)}
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => removeListItem(section.id, "steps", stepIndex)}
                      aria-label={`Remove step ${stepIndex + 1}`}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            ) : null}
            {section.items ? (
              <div className={styles.inlineListFields}>
                <div className={styles.inlineFormHeader}>
                  <strong>Bullet list</strong>
                  <button type="button" onClick={() => addListItem(section.id, "items")}>Add item</button>
                </div>
                {section.items.map((item, itemIndex) => (
                  <div className={styles.inlineListRow} key={itemIndex}>
                    <label>
                      Item {itemIndex + 1}
                      <textarea
                        className={styles.inlineListInput}
                        rows={3}
                        value={item}
                        onChange={(event) => updateListItem(section.id, "items", itemIndex, event.target.value)}
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => removeListItem(section.id, "items", itemIndex)}
                      aria-label={`Remove list item ${itemIndex + 1}`}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            ) : null}
            <div className={styles.inlineNoteFields}>
              <div className={styles.inlineFormHeader}>
                <strong>Note</strong>
                {section.note !== undefined ? (
                  <button type="button" onClick={() => updateSection(section.id, { note: undefined })}>Remove note</button>
                ) : (
                  <button
                    type="button"
                    onClick={() => updateSection(section.id, { note: "Add note text here." })}
                  >
                    Add note
                  </button>
                )}
              </div>
              {section.note !== undefined ? (
                <label>
                  Note text
                  <textarea
                    className={styles.inlineNoteInput}
                    rows={5}
                    value={section.note}
                    onChange={(event) => updateSection(section.id, { note: event.target.value })}
                  />
                </label>
              ) : null}
            </div>
            <div className={styles.inlineMediaFields}>
              <div className={styles.inlineFormHeader}>
                <strong>Image</strong>
                {section.image ? (
                  <button type="button" onClick={() => updateSection(section.id, { image: undefined })}>Remove image</button>
                ) : (
                  <button
                    type="button"
                    onClick={() => updateSection(section.id, {
                      image: {
                        src: "",
                        alt: "",
                        width: 1200,
                        height: 675,
                        caption: "",
                        wide: true
                      }
                    })}
                  >
                    Add image
                  </button>
                )}
              </div>
              {section.image ? (
                <>
                  <label>
                    Image URL or public path
                    <input
                      placeholder="/images/example.png or https://example.com/image.png"
                      value={section.image.src}
                      onChange={(event) => updateSection(section.id, {
                        image: { ...section.image!, src: event.target.value }
                      })}
                    />
                  </label>
                  <label>
                    Alternative text
                    <textarea
                      rows={2}
                      value={section.image.alt}
                      onChange={(event) => updateSection(section.id, {
                        image: { ...section.image!, alt: event.target.value }
                      })}
                    />
                  </label>
                  <label>
                    Caption
                    <input
                      value={section.image.caption}
                      onChange={(event) => updateSection(section.id, {
                        image: { ...section.image!, caption: event.target.value }
                      })}
                    />
                  </label>
                  <label>
                    Optional source URL
                    <input
                      type="url"
                      placeholder="https://example.com/source"
                      value={section.image.source ?? ""}
                      onChange={(event) => updateSection(section.id, {
                        image: { ...section.image!, source: event.target.value || undefined }
                      })}
                    />
                  </label>
                  <div className={styles.inlineDimensionFields}>
                    <label>
                      Width
                      <input
                        type="number"
                        min={1}
                        max={10000}
                        value={section.image.width}
                        onChange={(event) => updateSection(section.id, {
                          image: { ...section.image!, width: Math.max(1, Number(event.target.value) || 1) }
                        })}
                      />
                    </label>
                    <label>
                      Height
                      <input
                        type="number"
                        min={1}
                        max={10000}
                        value={section.image.height}
                        onChange={(event) => updateSection(section.id, {
                          image: { ...section.image!, height: Math.max(1, Number(event.target.value) || 1) }
                        })}
                      />
                    </label>
                    <label className={styles.inlineCheckbox}>
                      <input
                        type="checkbox"
                        checked={section.image.wide ?? false}
                        onChange={(event) => updateSection(section.id, {
                          image: { ...section.image!, wide: event.target.checked }
                        })}
                      />
                      Use wide layout
                    </label>
                  </div>
                </>
              ) : null}
            </div>
            <div className={styles.inlineMediaFields}>
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
