"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Target, ChevronDown, PencilLine, Eye, Save, Upload, Settings2 } from "lucide-react";
import type { PartialBlock } from "@blocknote/core";
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/mantine/style.css";
import type { CoursePageRecord } from "@/lib/course-content-shared";
import { courseBlocksSchema, legacyCourseBlocks } from "@/lib/course-blocks";
import { CourseLessonHeader, CourseLessonBody } from "./course-lesson";
import { useCourseEditing } from "./course-editing-context";
import courseStyles from "./x-ads.module.css";
import { CourseVideo } from "./course-video";
import { uploadCourseFile } from "./course-upload";
import styles from "./course-document.module.css";

export default function CourseRichEditor({ page }: { page: CoursePageRecord }) {
  const router = useRouter();
  const [draft, setDraft] = useState(page);
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const { preview, setPreview } = useCourseEditing();
  const settingsRef = useRef<HTMLDetailsElement>(null);
  const [error, setError] = useState("");
  const [status, setStatus] = useState(page.hasDraft ? "Draft saved" : page.isPublished ? "Published" : "Unpublished page");
  const [uploads, setUploads] = useState<Record<string, { name: string; percent: number }>>({});
  const controllers = useRef(new Map<string, AbortController>());
  const [markdown, setMarkdown] = useState("");

  const isUploading = Object.keys(uploads).length > 0;
  const editor = useCreateBlockNote({
    initialContent: (page.blocks?.length ? page.blocks : legacyCourseBlocks(page.content).length ? legacyCourseBlocks(page.content) : undefined) as PartialBlock[] | undefined,
    uploadFile: file => upload(file, false),
  });

  useEffect(() => {
    if (!dirty && !isUploading) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); };
    const guard = (event: MouseEvent) => {
      const link = (event.target as HTMLElement).closest("a[href]") as HTMLAnchorElement | null;
      if (link && link.target !== "_blank" && new URL(link.href).pathname !== window.location.pathname && !window.confirm("Leave this page? Unsaved edits and active uploads will be lost.")) { event.preventDefault(); event.stopPropagation(); }
    };
    window.addEventListener("beforeunload", warn);
    document.addEventListener("click", guard, true);
    return () => { window.removeEventListener("beforeunload", warn); document.removeEventListener("click", guard, true); };
  }, [dirty, isUploading]);
  useEffect(() => {
    const active = controllers.current;
    return () => active.forEach(controller => controller.abort());
  }, []);

  useEffect(() => {
    function closeSettings(event: PointerEvent) {
      if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) settingsRef.current.open = false;
    }
    document.addEventListener("pointerdown", closeSettings);
    return () => document.removeEventListener("pointerdown", closeSettings);
  }, []);

  function changeView(next: boolean) {
    if (settingsRef.current) settingsRef.current.open = false;
    setPreview(next);
    window.scrollTo({ top: 0, behavior: "instant" });
  }

  function changed() { setDirty(true); setStatus("Unsaved changes"); }
  async function upload(file: File, mainVideo: boolean) {
    const id = crypto.randomUUID();
    const controller = new AbortController();
    controllers.current.set(id, controller);
    setUploads(current => ({ ...current, [id]: { name: file.name, percent: 0 } }));
    setError("");
    try {
      return await uploadCourseFile(file, page.slug, mainVideo, percent => setUploads(current => ({ ...current, [id]: { name: file.name, percent } })), controller.signal);
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "Unable to upload the file.";
      setError(message);
      throw caught;
    } finally {
      controllers.current.delete(id);
      setUploads(current => { const next = { ...current }; delete next[id]; return next; });
    }
  }
  async function mainVideo(file?: File) {
    if (!file) return;
    try {
      const url = await upload(file, true);
      setDraft(current => ({ ...current, mainVideo: { url, title: "" } }));
      changed();
    } catch { /* upload() displays the error. */ }
  }
  async function save(publish = false) {
    setBusy(true); setError("");
    try {
      const blocks = courseBlocksSchema.parse(editor.document);
      const response = await fetch("/api/admin/course", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...draft, kind: "draft", blocks, revision: draft.revision ?? 0 }) });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Unable to save the draft.");
      setDraft(body.page); setDirty(false); setStatus("Draft saved. Customers still see the published page.");
      if (publish) {
        const result = await fetch("/api/admin/course", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ kind: "publish", slug: draft.slug, revision: body.page.revision }) });
        const published = await result.json();
        if (!result.ok) throw new Error(published.error || "Unable to publish the page.");
        setDraft(published.page); setStatus("Published. Customers can see these changes.");
        router.refresh();
      }
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Unable to save the page."); }
    finally { setBusy(false); }
  }
  const toolbar = <nav className={styles.toolbar} aria-label="Course page editing">
    <div className={styles.toolbarActions}>
      <button type="button" aria-pressed={!preview} disabled={busy || isUploading} onClick={() => changeView(false)}><PencilLine aria-hidden="true" />Edit page</button>
      <button type="button" aria-pressed={preview} disabled={busy || isUploading} onClick={() => changeView(true)}><Eye aria-hidden="true" />Customer preview</button>
      <button type="button" disabled={busy || isUploading} onClick={() => void save()}><Save aria-hidden="true" />Save draft</button>
      <button className={styles.publish} type="button" disabled={busy || isUploading} onClick={() => void save(true)}><Upload aria-hidden="true" />{busy ? "Saving…" : "Publish changes"}</button>
      <details className={styles.settings} ref={settingsRef} onKeyDown={event => {
        if (event.key === "Escape") { event.currentTarget.open = false; event.currentTarget.querySelector("summary")?.focus(); }
      }}>
        <summary><Settings2 aria-hidden="true" />Page settings <ChevronDown aria-hidden="true" /></summary>
        <div className={styles.settingsPanel}>
          <label>Navigation description<textarea value={draft.description} maxLength={500} disabled={busy} onChange={event => { setDraft({ ...draft, description: event.target.value }); changed(); }} /></label>
          <div className={styles.videoPanel}>
            <label>{draft.mainVideo ? "Replace main video" : "Add main video (optional)"}<input type="file" accept="video/mp4,video/webm" disabled={busy || isUploading} onChange={event => { void mainVideo(event.target.files?.[0]); event.target.value = ""; }} /></label>
            <small>MP4 or WebM, up to 2 GB.</small>
            {draft.mainVideo && <label>Video caption (optional)<input type="text" maxLength={160} value={draft.mainVideo.title ?? ""} disabled={busy} onChange={event => { setDraft({ ...draft, mainVideo: { ...draft.mainVideo!, title: event.target.value } }); changed(); }} /></label>}
            {draft.mainVideo && <button type="button" disabled={busy || isUploading} onClick={() => { setDraft({ ...draft, mainVideo: null }); changed(); }}>Remove video</button>}
          </div>
          <label>Markdown import<textarea placeholder="Paste Markdown to add it to the end of the page" value={markdown} disabled={busy} onChange={event => setMarkdown(event.target.value)} /></label>
          <button type="button" disabled={busy || !markdown.trim()} onClick={async () => {
            try { const blocks = await editor.tryParseMarkdownToBlocks(markdown); editor.insertBlocks(blocks, editor.document.at(-1)!, "after"); setMarkdown(""); changed(); }
            catch { setError("Unable to import this Markdown."); }
          }}>Add Markdown</button>
        </div>
      </details>
    </div>
    <span className={styles.saveStatus} role="status">{status}</span>
  </nav>;
  const previewPage = preview ? { ...draft, blocks: courseBlocksSchema.parse(editor.document) } : null;
  return <div className={styles.editor} data-course-editor data-customer-preview={preview}>
    {toolbar}
    <div className={styles.editorBody}>
    {error && <p className={styles.error} role="alert">{error}</p>}
    {Object.entries(uploads).map(([id, item]) => <div className={styles.progress} key={id}><span>{item.name}</span><progress max={100} value={item.percent} aria-label={`Uploading ${item.name}`} /><span>{item.percent}%</span><button type="button" onClick={() => controllers.current.get(id)?.abort()}>Cancel upload</button></div>)}
    {previewPage ? <>
      <CourseLessonHeader page={previewPage} />
      <div className={`${courseStyles.mainContent} ${courseStyles.annotatedMainContent}`}><CourseLessonBody page={previewPage} /></div>
    </> : <>
      <header className={`${courseStyles.pageHeader} ${styles.editorHeader}`}>
        <input className={styles.title} aria-label="Page title" maxLength={160} value={draft.title} disabled={busy} onChange={event => { setDraft({ ...draft, title: event.target.value }); changed(); }} />
        <div className={styles.outcome}><Target aria-hidden="true" /><textarea aria-label="Lesson outcome" rows={2} maxLength={500} value={draft.outcome ?? draft.description} disabled={busy} onChange={event => { setDraft({ ...draft, outcome: event.target.value }); changed(); }} /></div>
      </header>
      {draft.mainVideo && <CourseVideo video={draft.mainVideo} />}
      <div className={styles.blockEditor}><BlockNoteView editor={editor} theme="dark" editable={!busy} onChange={changed} /></div>
    </>}
    </div>
  </div>;
}
