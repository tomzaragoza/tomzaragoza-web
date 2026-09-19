"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import type { CoursePageRecord } from "@/lib/course-content-shared";
import styles from "./course-editor.module.css";

export function CourseEditor({ pages }: { pages: CoursePageRecord[] }) {
  const router = useRouter();
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

  function movePage(currentPages: CoursePageRecord[], slug: string, targetIndex: number) {
    const currentIndex = currentPages.findIndex((page) => page.slug === slug);
    const safeTargetIndex = Math.max(1, Math.min(targetIndex, currentPages.length - 1));

    if (currentIndex < 1 || currentIndex === safeTargetIndex) return currentPages;

    const nextPages = [...currentPages];
    const [page] = nextPages.splice(currentIndex, 1);
    nextPages.splice(safeTargetIndex, 0, page);
    return nextPages;
  }

  async function saveOrder(nextPages: CoursePageRecord[], previousPages: CoursePageRecord[]) {
    if (nextPages.every((page, index) => page.slug === previousPages[index]?.slug)) return;

    setIsSavingOrder(true);
    setOrderError("");

    try {
      const response = await fetch("/api/admin/course", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          kind: "order",
          slugs: nextPages.map((page) => page.slug)
        })
      });
      const body = await response.json();

      if (!response.ok) throw new Error(body.error ?? "Unable to save the page order.");

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

    const target = document
      .elementFromPoint(event.clientX, event.clientY)
      ?.closest<HTMLElement>("[data-course-slug]");
    const targetSlug = target?.dataset.courseSlug;
    const targetIndex = orderedPagesRef.current.findIndex((page) => page.slug === targetSlug);

    if (targetIndex < 1) return;
    updateLocalOrder(movePage(orderedPagesRef.current, activeSlug, targetIndex));
  }

  function stopDragging(event: React.PointerEvent<HTMLButtonElement>) {
    if (!draggedSlugRef.current) return;

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    const nextPages = orderedPagesRef.current;
    const previousPages = startingOrderRef.current;
    draggedSlugRef.current = null;
    setDraggedSlug(null);
    void saveOrder(nextPages, previousPages);
  }

  function cancelDragging(event: React.PointerEvent<HTMLButtonElement>) {
    if (!draggedSlugRef.current) return;

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    updateLocalOrder(startingOrderRef.current);
    draggedSlugRef.current = null;
    setDraggedSlug(null);
  }

  function movePageWithKeyboard(
    event: React.KeyboardEvent<HTMLButtonElement>,
    slug: string
  ) {
    if (
      isCreating ||
      isSavingOrder ||
      (event.key !== "ArrowUp" && event.key !== "ArrowDown")
    ) return;

    const previousPages = orderedPagesRef.current;
    const currentIndex = previousPages.findIndex((page) => page.slug === slug);
    const targetIndex = currentIndex + (event.key === "ArrowUp" ? -1 : 1);
    const nextPages = movePage(previousPages, slug, targetIndex);

    if (nextPages === previousPages) return;

    event.preventDefault();
    updateLocalOrder(nextPages);
    void saveOrder(nextPages, previousPages);
  }

  async function createPage(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsCreating(true);
    setCreateError("");

    const form = event.currentTarget;
    const formData = new FormData(form);
    const payload = {
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
          <p className={styles.eyebrow}>New lesson</p>
          <h2 id="create-page-title">Create a course page</h2>
          <p>After creation, the lesson opens so you can add its content in place.</p>
        </div>

        <form className={styles.createForm} onSubmit={createPage}>
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
            <p className={styles.eyebrow}>Course structure</p>
            <h2 id="course-pages-title">Pages</h2>
            <p className={styles.orderHint}>Drag lessons to change the left navigation order.</p>
          </div>
          <span>{isSavingOrder ? "Saving…" : orderedPages.length}</span>
        </div>
        <div className={styles.pageRows}>
          {orderedPages.map((page) => (
            <div
              className={`${styles.pageRow} ${draggedSlug === page.slug ? styles.draggedRow : ""}`}
              data-course-slug={page.slug}
              key={page.slug}
            >
              <Link href={page.path} className={styles.pageLink}>
                <span>
                  <strong>{page.title}</strong>
                  <small>{page.path}</small>
                </span>
                <span>{page.slug === "introduction" ? "View page →" : "Edit inline →"}</span>
              </Link>
              {page.slug === "introduction" ? (
                <span className={styles.fixedLabel}>Fixed</span>
              ) : (
                <button
                  className={styles.dragHandle}
                  type="button"
                  aria-label={`Drag ${page.title} to reorder. Use the arrow keys for keyboard control.`}
                  disabled={isCreating || isSavingOrder}
                  onPointerDown={(event) => startDragging(event, page.slug)}
                  onPointerMove={dragPage}
                  onPointerUp={stopDragging}
                  onPointerCancel={cancelDragging}
                  onKeyDown={(event) => movePageWithKeyboard(event, page.slug)}
                >
                  <span aria-hidden="true">⠿</span>
                </button>
              )}
            </div>
          ))}
        </div>
        {orderError ? <p className={styles.orderError} role="alert">{orderError}</p> : null}
      </section>
    </div>
  );
}
