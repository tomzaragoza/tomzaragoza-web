"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { CoursePageRecord } from "@/lib/course-content-shared";
import styles from "./course-editor.module.css";

export function CourseEditor({ pages }: { pages: CoursePageRecord[] }) {
  const router = useRouter();
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState("");

  async function createPage(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsBusy(true);
    setError("");

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
      setError(caught instanceof Error ? caught.message : "Unable to create the page.");
      setIsBusy(false);
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
            <p className={styles.error} role="alert">{error}</p>
            <button type="submit" disabled={isBusy}>
              {isBusy ? "Creating…" : "Create and edit →"}
            </button>
          </div>
        </form>
      </section>

      <section className={styles.pageList} aria-labelledby="course-pages-title">
        <div className={styles.listHeader}>
          <div>
            <p className={styles.eyebrow}>Course structure</p>
            <h2 id="course-pages-title">Pages</h2>
          </div>
          <span>{pages.length}</span>
        </div>
        <div className={styles.pageRows}>
          {pages.map((page) => (
            <Link href={page.path} className={styles.pageRow} key={page.slug}>
              <span>
                <strong>{page.title}</strong>
                <small>{page.path}</small>
              </span>
              <span>{page.slug === "introduction" ? "View page →" : "Edit inline →"}</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
