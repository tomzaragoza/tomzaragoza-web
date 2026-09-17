"use client";

import { useMemo, useState } from "react";
import type {
  CourseContentSection,
  CoursePageRecord,
  CourseParagraph
} from "@/lib/course-content-shared";
import styles from "./course-editor.module.css";

type CoursePayload = { pages: CoursePageRecord[] };

function authHeaders(token: string) {
  return {
    authorization: `Bearer ${token}`,
    "content-type": "application/json"
  };
}

function paragraphText(paragraph: CourseParagraph) {
  if (typeof paragraph === "string") return paragraph;
  return paragraph.content.map((part) => typeof part === "string" ? part : part.label).join("");
}

export function CourseEditor({ authHint }: { authHint: string }) {
  const [token, setToken] = useState("");
  const [pages, setPages] = useState<CoursePageRecord[]>([]);
  const [selectedSlug, setSelectedSlug] = useState("");
  const [activeSectionId, setActiveSectionId] = useState("");
  const [status, setStatus] = useState("Enter the admin token to load the course.");
  const [error, setError] = useState("");
  const [isBusy, setIsBusy] = useState(false);

  const selectedPage = useMemo(
    () => pages.find((page) => page.slug === selectedSlug),
    [pages, selectedSlug]
  );
  const activeSection = selectedPage?.content.find((section) => section.id === activeSectionId);

  function selectPage(slug: string, nextPages = pages) {
    const page = nextPages.find((item) => item.slug === slug);
    setSelectedSlug(slug);
    setActiveSectionId(page?.content[0]?.id ?? "");
  }

  async function loadPages(nextToken = token) {
    setIsBusy(true);
    setError("");
    setStatus("Loading course pages.");

    try {
      const response = await fetch("/api/admin/course", { headers: authHeaders(nextToken) });
      const body = await response.json();

      if (!response.ok) throw new Error(body.error ?? "Unable to load the course.");

      const payload = body as CoursePayload;
      const firstPage = payload.pages.find((page) => page.slug !== "introduction") ?? payload.pages[0];
      setPages(payload.pages);
      if (firstPage) selectPage(firstPage.slug, payload.pages);
      setStatus(`Loaded ${payload.pages.length} course pages.`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to load the course.");
      setStatus("Load failed.");
    } finally {
      setIsBusy(false);
    }
  }

  function updatePage(patch: Partial<CoursePageRecord>) {
    if (!selectedPage) return;
    setPages((current) => current.map((page) =>
      page.slug === selectedPage.slug ? { ...page, ...patch } : page
    ));
  }

  function updateSection(sectionId: string, patch: Partial<CourseContentSection>) {
    if (!selectedPage) return;
    updatePage({
      content: selectedPage.content.map((section) =>
        section.id === sectionId ? { ...section, ...patch } : section
      )
    });
  }

  function updateParagraph(sectionId: string, paragraphIndex: number, value: string) {
    const section = selectedPage?.content.find((item) => item.id === sectionId);
    if (!section?.paragraphs) return;
    updateSection(sectionId, {
      paragraphs: section.paragraphs.map((paragraph, index) =>
        index === paragraphIndex ? value : paragraph
      )
    });
  }

  function addParagraph(sectionId: string) {
    const section = selectedPage?.content.find((item) => item.id === sectionId);
    if (!section) return;
    updateSection(sectionId, { paragraphs: [...(section.paragraphs ?? []), "New paragraph."] });
  }

  function addSection() {
    if (!selectedPage) return;
    const id = `section-${crypto.randomUUID()}`;
    updatePage({
      content: [
        ...selectedPage.content,
        { id, heading: "New section", paragraphs: ["Add the section content here."] }
      ]
    });
    setActiveSectionId(id);
  }

  function removeSection(sectionId: string) {
    if (!selectedPage || !window.confirm("Remove this section? This takes effect after you save the page.")) {
      return;
    }

    const nextContent = selectedPage.content.filter((section) => section.id !== sectionId);
    updatePage({ content: nextContent });
    setActiveSectionId(nextContent[0]?.id ?? "");
  }

  async function savePage() {
    if (!selectedPage) return;
    setIsBusy(true);
    setError("");
    setStatus(`Saving ${selectedPage.title}.`);

    try {
      const response = await fetch("/api/admin/course", {
        method: "PUT",
        headers: authHeaders(token),
        body: JSON.stringify(selectedPage)
      });
      const body = await response.json();

      if (!response.ok) throw new Error(body.error ?? "Unable to save the page.");

      setPages((current) => current.map((page) =>
        page.slug === body.page.slug ? body.page : page
      ));
      setStatus(`Saved ${body.page.title}.`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to save the page.");
      setStatus("Save failed.");
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <div className={styles.editor}>
      <form
        className={styles.tokenRow}
        onSubmit={(event) => {
          event.preventDefault();
          const formData = new FormData(event.currentTarget);
          const nextToken = String(formData.get("admin-token") ?? "");
          setToken(nextToken);
          void loadPages(nextToken);
        }}
      >
        <label htmlFor="course-admin-token">
          Admin token
          <input
            id="course-admin-token"
            name="admin-token"
            type="password"
            value={token}
            onChange={(event) => setToken(event.target.value)}
            autoComplete="current-password"
          />
        </label>
        <button type="submit" disabled={isBusy || !token}>Load course</button>
      </form>

      <p className={styles.hint}>{authHint}</p>
      <div className={styles.status} aria-live="polite">
        <span>{status}</span>
        {error ? <span className={styles.error}>{error}</span> : null}
      </div>

      {pages.length > 0 ? (
        <>
          <div className={styles.pageBar}>
            <label>
              Course page
              <select value={selectedSlug} onChange={(event) => selectPage(event.target.value)}>
                {pages.map((page) => <option value={page.slug} key={page.slug}>{page.title}</option>)}
              </select>
            </label>
            <button type="button" onClick={() => void savePage()} disabled={isBusy || !selectedPage}>
              {isBusy ? "Saving…" : "Save page"}
            </button>
          </div>

          {selectedPage ? (
            <div className={styles.workspace}>
              <aside className={styles.sectionList} aria-label="Page sections">
                <div className={styles.sectionListHeader}>
                  <span>Sections</span>
                  <button type="button" onClick={addSection}>Add section</button>
                </div>
                {selectedPage.content.length > 0 ? selectedPage.content.map((section, index) => (
                  <button
                    className={`${styles.sectionButton} ${section.id === activeSectionId ? styles.sectionButtonActive : ""}`}
                    type="button"
                    onClick={() => setActiveSectionId(section.id ?? "")}
                    key={section.id}
                  >
                    <span>{section.heading || `Section ${index + 1}`}</span>
                    <small>{section.video ? "Video attached" : "No video"}</small>
                  </button>
                )) : <p className={styles.empty}>This page has no sections yet.</p>}
              </aside>

              <section className={styles.sectionEditor} aria-label="Selected section editor">
                {activeSection ? (
                  <>
                    <div className={styles.sectionEditorHeader}>
                      <h2>{activeSection.heading || "Untitled section"}</h2>
                      <button className={styles.dangerButton} type="button" onClick={() => removeSection(activeSection.id)}>
                        Remove section
                      </button>
                    </div>

                    <label>
                      Section heading
                      <input
                        value={activeSection.heading ?? ""}
                        onChange={(event) => updateSection(activeSection.id, { heading: event.target.value })}
                      />
                    </label>

                    <div className={styles.fieldGroup}>
                      <div className={styles.fieldGroupHeader}>
                        <span>Paragraphs</span>
                        <button type="button" onClick={() => addParagraph(activeSection.id)}>Add paragraph</button>
                      </div>
                      {activeSection.paragraphs?.map((paragraph, index) => (
                        <label key={index}>
                          {typeof paragraph === "string" ? `Paragraph ${index + 1}` : `Rich paragraph ${index + 1}`}
                          <textarea
                            value={paragraphText(paragraph)}
                            onChange={(event) => updateParagraph(activeSection.id, index, event.target.value)}
                            readOnly={typeof paragraph !== "string"}
                            rows={5}
                          />
                          {typeof paragraph !== "string" ? (
                            <small>Rich links are preserved. Edit this paragraph in code for now.</small>
                          ) : null}
                        </label>
                      ))}
                    </div>

                    <div className={styles.videoEditor}>
                      <div className={styles.fieldGroupHeader}>
                        <span>Video recording</span>
                        {activeSection.video ? (
                          <button type="button" onClick={() => updateSection(activeSection.id, { video: undefined })}>
                            Remove video
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => updateSection(activeSection.id, { video: { url: "", title: "" } })}
                          >
                            Add video
                          </button>
                        )}
                      </div>
                      {activeSection.video ? (
                        <>
                          <label>
                            Recording URL
                            <input
                              type="url"
                              placeholder="https://www.loom.com/share/..."
                              value={activeSection.video.url}
                              onChange={(event) => updateSection(activeSection.id, {
                                video: { ...activeSection.video!, url: event.target.value }
                              })}
                            />
                          </label>
                          <label>
                            Video title
                            <input
                              value={activeSection.video.title ?? ""}
                              onChange={(event) => updateSection(activeSection.id, {
                                video: { ...activeSection.video!, title: event.target.value }
                              })}
                            />
                          </label>
                          <label>
                            Captions file URL
                            <input
                              type="url"
                              placeholder="https://example.com/captions.vtt"
                              value={activeSection.video.captionsUrl ?? ""}
                              onChange={(event) => updateSection(activeSection.id, {
                                video: {
                                  ...activeSection.video!,
                                  captionsUrl: event.target.value || undefined
                                }
                              })}
                            />
                          </label>
                          <p>Supports YouTube, Vimeo, Loom, MP4, and WebM URLs.</p>
                        </>
                      ) : (
                        <p>Add a hosted recording to show it inside this section.</p>
                      )}
                    </div>
                  </>
                ) : (
                  <div className={styles.emptyState}>
                    <p>Select a section, or add the first section to this page.</p>
                  </div>
                )}
              </section>
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
