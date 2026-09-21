"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { FolderOpen, FileText, GripVertical } from "lucide-react";
import { arrangeCoursePages, courseStructure, moveCoursePage, type CourseDropPosition } from "@/lib/course-structure";
import type { CoursePageRecord } from "@/lib/course-content-shared";
import styles from "./course-editor.module.css";

export function CourseEditor({ pages }: { pages: CoursePageRecord[] }) {
  const router = useRouter();
  const [newKind, setNewKind] = useState<"page" | "group">("page");
  const [dropTarget, setDropTarget] = useState<{ slug: string; position: CourseDropPosition } | null>(null);
  const dropTargetRef = useRef<typeof dropTarget>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isSavingOrder, setIsSavingOrder] = useState(false);
  const [createError, setCreateError] = useState("");
  const [orderError, setOrderError] = useState("");
  const [orderedPages, setOrderedPages] = useState(pages);
  const [draggedSlug, setDraggedSlug] = useState<string | null>(null);
  const draggedSlugRef = useRef<string | null>(null);
  const orderedPagesRef = useRef(pages);
  const startingOrderRef = useRef(pages);

  function updateLocalOrder(nextPages: CoursePageRecord[]) {
    orderedPagesRef.current = nextPages;
    setOrderedPages(nextPages);
  }

  async function saveOrder(nextPages: CoursePageRecord[], previousPages: CoursePageRecord[]) {
    if (JSON.stringify(courseStructure(nextPages)) === JSON.stringify(courseStructure(previousPages))) return;

    setIsSavingOrder(true);
    setOrderError("");

    try {
      const response = await fetch("/api/admin/course", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          kind: "structure",
          items: courseStructure(nextPages),
          previous: courseStructure(previousPages)
        })
      });
      const body = await response.json();

      if (!response.ok) throw new Error(body.error ?? "Unable to save the page order.");

      updateLocalOrder(body.pages);
      router.refresh();
    } catch (caught) {
      updateLocalOrder(previousPages);
      setOrderError(caught instanceof Error ? caught.message : "Unable to save the page order.");
    } finally {
      setIsSavingOrder(false);
    }
  }

  function startDragging(event: React.PointerEvent<HTMLButtonElement>, slug: string) {
    if (isCreating || isSavingOrder || slug === "introduction") return;

    startingOrderRef.current = orderedPagesRef.current;
    draggedSlugRef.current = slug;
    setDraggedSlug(slug);
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function dragPage(event: React.PointerEvent<HTMLButtonElement>) {
    const activeSlug = draggedSlugRef.current;
    if (!activeSlug) return;
    const target = document.elementFromPoint(event.clientX, event.clientY)?.closest<HTMLElement>("[data-course-slug]");
    const targetPage = orderedPagesRef.current.find(page => page.slug === target?.dataset.courseSlug);
    const activePage = orderedPagesRef.current.find(page => page.slug === activeSlug);
    let next: typeof dropTarget = null;
    if (target && targetPage && targetPage.slug !== activeSlug && targetPage.parentSlug !== activeSlug) {
      const rect = target.getBoundingClientRect();
      const fraction = (event.clientY - rect.top) / rect.height;
      const position = targetPage.slug === "introduction" ? "after"
        : targetPage.pageKind === "group" && activePage?.pageKind !== "group" && fraction >= .25 && fraction <= .75 ? "inside"
        : fraction < .5 ? "before" : "after";
      next = { slug: targetPage.slug, position };
    }
    dropTargetRef.current = next;
    setDropTarget(next);
    if (event.clientY < 80) window.scrollBy(0, -18);
    else if (event.clientY > window.innerHeight - 80) window.scrollBy(0, 18);
  }

  function finishDragging(event: React.PointerEvent<HTMLButtonElement>, cancel = false) {
    const slug = draggedSlugRef.current;
    if (!slug) return;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    const target = dropTargetRef.current;
    draggedSlugRef.current = null;
    dropTargetRef.current = null;
    setDraggedSlug(null);
    setDropTarget(null);
    if (cancel || !target) return;
    const previous = startingOrderRef.current;
    const next = moveCoursePage(previous, slug, target.slug, target.position);
    updateLocalOrder(next);
    void saveOrder(next, previous);
  }

  function movePageWithKeyboard(event: React.KeyboardEvent<HTMLButtonElement>, slug: string) {
    if (isCreating || isSavingOrder) return;
    if (event.key === "Escape" && draggedSlugRef.current) {
      draggedSlugRef.current = null;
      dropTargetRef.current = null;
      setDraggedSlug(null);
      setDropTarget(null);
      return;
    }
    if (!["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.key)) return;
    event.preventDefault();
    const previous = orderedPagesRef.current;
    const page = previous.find(item => item.slug === slug)!;
    let next = previous;
    if (event.key === "ArrowLeft" && page.parentSlug) {
      next = moveCoursePage(previous, slug, page.parentSlug, "after");
    } else if (event.key === "ArrowRight" && page.pageKind !== "group" && !page.parentSlug) {
      const precedingGroup = previous.slice(0, previous.indexOf(page)).findLast(item => item.pageKind === "group");
      if (precedingGroup) next = moveCoursePage(previous, slug, precedingGroup.slug, "inside");
    } else {
      const siblings = previous.filter(item => (item.parentSlug ?? null) === (page.parentSlug ?? null));
      const target = siblings[siblings.indexOf(page) + (event.key === "ArrowUp" ? -1 : event.key === "ArrowDown" ? 1 : 0)];
      if (target) next = moveCoursePage(previous, slug, target.slug, event.key === "ArrowUp" ? "before" : "after");
    }
    updateLocalOrder(next);
    void saveOrder(next, previous);
  }

  function changePlacement(slug: string, value: string) {
    const previous = orderedPagesRef.current;
    const next = arrangeCoursePages(previous.map(page => page.slug === slug ? {
      ...page,
      pageKind: value === "group" ? "group" as const : "page" as const,
      parentSlug: value.startsWith("in:") ? value.slice(3) : null
    } : page));
    updateLocalOrder(next);
    void saveOrder(next, previous);
  }

  async function createPage(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsCreating(true);
    setCreateError("");

    const form = event.currentTarget;
    const formData = new FormData(form);
    const payload = {
      pageKind: newKind,
      parentSlug: newKind === "page" ? String(formData.get("parentSlug") || "") || null : null,
      title: String(formData.get("title") ?? "").trim(),
      slug: String(formData.get("slug") ?? "").trim().toLowerCase(),
      description: String(formData.get("description") ?? "").trim(),
      outcome: String(formData.get("outcome") ?? "").trim() || undefined
    };

    try {
      const response = await fetch("/api/admin/course", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload)
      });
      const body = await response.json();

      if (!response.ok) throw new Error(body.error ?? "Unable to create the page.");

      form.reset();
      router.push(body.page.path);
      router.refresh();
    } catch (caught) {
      setCreateError(caught instanceof Error ? caught.message : "Unable to create the page.");
      setIsCreating(false);
    }
  }

  return (
    <div className={styles.editor}>
      <section className={styles.createPanel} aria-labelledby="create-page-title">
        <div>
          <h2 id="create-page-title">Create a page or group</h2>
          <p>Groups have their own editable page and can contain child pages.</p>
        </div>

        <form className={styles.createForm} onSubmit={createPage}>
          <label>
            Type
            <select value={newKind} onChange={event => setNewKind(event.target.value as "page" | "group")} disabled={isCreating}>
              <option value="page">Page</option><option value="group">Group</option>
            </select>
          </label>
          {newKind === "page" && <label>
            Group
            <select name="parentSlug" disabled={isCreating}>
              <option value="">No group</option>
              {orderedPages.filter(page => page.pageKind === "group").map(group => <option key={group.slug} value={group.slug}>{group.title}</option>)}
            </select>
          </label>}
          <label>
            Page title
            <input name="title" required maxLength={160} />
          </label>
          <label>
            URL slug
            <span className={styles.slugField}>
              <span>/x-ads/</span>
              <input
                name="slug"
                required
                maxLength={80}
                pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
                placeholder="new-lesson"
              />
            </span>
          </label>
          <label>
            Navigation description
            <textarea name="description" required maxLength={500} rows={3} />
          </label>
          <label>
            Lesson goal
            <textarea name="outcome" maxLength={500} rows={3} />
          </label>
          <div className={styles.formFooter}>
            <p className={styles.error} role="alert">{createError}</p>
            <button type="submit" disabled={isCreating || isSavingOrder}>
              {isCreating ? "Creating…" : "Create and edit →"}
            </button>
          </div>
        </form>
      </section>

      <section className={styles.pageList} aria-labelledby="course-pages-title">
        <div className={styles.listHeader}>
          <div>
            <h2 id="course-pages-title">Groups and pages</h2>
            <p className={styles.orderHint}>Drag to reorder. Drop a page in the middle of a group to move it inside. Use the edges to place it before or after the group. Changes save immediately.</p>
          </div>
          <span role="status">{isSavingOrder ? "Saving…" : `${orderedPages.length} pages`}</span>
        </div>
        <div className={styles.pageRows}>
          {orderedPages.map((page) => (
            <div
              className={`${styles.pageRow} ${page.parentSlug ? styles.childRow : ""} ${page.pageKind === "group" ? styles.groupRow : ""} ${draggedSlug === page.slug || page.parentSlug === draggedSlug ? styles.draggedRow : ""}`}
              data-drop-position={dropTarget?.slug === page.slug ? dropTarget.position : undefined}
              data-course-slug={page.slug}
              key={page.slug}
            >
              <Link href={page.path} className={styles.pageLink}>
                <span>
                  <strong>{page.pageKind === "group" ? <FolderOpen aria-hidden="true" /> : <FileText aria-hidden="true" />}{page.title}</strong>
                  <small>{page.path}{page.slug !== "introduction" ? ` · ${page.isPublished === false ? "Unpublished draft" : page.hasDraft ? "Draft changes" : "Published"}` : ""}</small>
                </span>
                <span>{page.slug === "introduction" ? "View page →" : "Edit inline →"}</span>
              </Link>
              {page.slug === "introduction" ? (
                <span className={styles.fixedLabel}>Fixed</span>
              ) : (
                <div className={styles.rowControls}>
                <select aria-label={`Group for ${page.title}`} value={page.pageKind === "group" ? "group" : page.parentSlug ? `in:${page.parentSlug}` : "page"}
                  disabled={isCreating || isSavingOrder || Boolean(draggedSlug)} onChange={event => changePlacement(page.slug, event.target.value)}>
                  <option value="page" disabled={orderedPages.some(child => child.parentSlug === page.slug)}>No group</option>
                  <option value="group">Group page</option>
                  {!orderedPages.some(child => child.parentSlug === page.slug) && orderedPages.filter(group => group.pageKind === "group" && group.slug !== page.slug).map(group => <option key={group.slug} value={`in:${group.slug}`}>{group.title}</option>)}
                </select>
                <button
                  className={styles.dragHandle}
                  type="button"
                  aria-label={`Drag ${page.title} to reorder. Use Up and Down to reorder, Right to move into a group, or Left to move out.`}
                  disabled={isCreating || isSavingOrder}
                  onPointerDown={(event) => startDragging(event, page.slug)}
                  onPointerMove={dragPage}
                  onPointerUp={event => finishDragging(event)}
                  onPointerCancel={event => finishDragging(event, true)}
                  onKeyDown={(event) => movePageWithKeyboard(event, page.slug)}
                >
                  <GripVertical aria-hidden="true" />
                </button>
                </div>
              )}
            </div>
          ))}
        </div>
        {orderError ? <p className={styles.orderError} role="alert">{orderError}</p> : null}
      </section>
    </div>
  );
}
