"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useId, useState } from "react";
import { ChevronRight, MessageSquare } from "lucide-react";
import { AuthControls } from "@/app/components/auth-controls";
import type { CourseNavigationItem } from "@/lib/course-content-shared";
import { arrangeCoursePages } from "@/lib/course-structure";
import { useCourseEditing } from "./course-editing-context";
import styles from "./x-ads.module.css";

export type WorkspaceNavigationProps = {
  currentPath: string;
  navigation: readonly CourseNavigationItem[];
  canEdit?: boolean;
  showMessages?: boolean;
  showAccountControls?: boolean;
  onNavigate?: () => void;
};

function CourseGroupNavigation({ item, children, currentPath, onNavigate }: {
  item: CourseNavigationItem;
  children: CourseNavigationItem[];
  currentPath: string;
  onNavigate?: () => void;
}) {
  const id = useId();
  const [expanded, setExpanded] = useState(true);
  return <div className={styles.courseGroup}>
    <div className={styles.courseGroupHeading}>
      <Link href={item.path} onClick={onNavigate} aria-current={currentPath === item.path ? "page" : undefined}>{item.title}</Link>
      <button type="button" aria-label={`${expanded ? "Collapse" : "Expand"} ${item.title}`} aria-expanded={expanded} aria-controls={id} onClick={() => setExpanded(!expanded)}>
        <ChevronRight aria-hidden="true" />
      </button>
    </div>
    <div className={styles.courseGroupPages} id={id} hidden={!expanded}>
      {children.map(child => <Link href={child.path} key={child.slug} onClick={onNavigate} aria-current={currentPath === child.path ? "page" : undefined}>{child.title}</Link>)}
    </div>
  </div>;
}

export function WorkspaceNavigation({
  currentPath, navigation, canEdit: adminCanEdit = false, showMessages = true,
  showAccountControls = true, onNavigate
}: WorkspaceNavigationProps) {
  const { preview } = useCourseEditing();
  const canEdit = adminCanEdit && !preview;
  const [messageCount, setMessageCount] = useState<number | null>(null);
  const [countFailed, setCountFailed] = useState(false);
  const messagesPath = canEdit ? "/admin/course/messages" : "/x-ads/messages";
  const coursePages = arrangeCoursePages(navigation).filter(item => item.slug !== "introduction");

  useEffect(() => {
    if (!canEdit || !showMessages || preview) return;
    const controller = new AbortController();
    fetch(`/api/course/message-summary${canEdit ? "?scope=admin" : ""}`, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error("Unable to load message count");
        const payload = await response.json();
        if (typeof payload.count !== "number") throw new Error("Invalid message count");
        setMessageCount(payload.count);
      })
      .catch(() => { if (!controller.signal.aborted) setCountFailed(true); });
    const onRead = () => setMessageCount((count) => count === null ? null : Math.max(0, count - 1));
    window.addEventListener("course-message-read", onRead);
    return () => {
      controller.abort();
      window.removeEventListener("course-message-read", onRead);
    };
  }, [canEdit, showMessages, preview]);

  return (
    <>
      <Link href="/x-ads" className={styles.workspaceBrand} onClick={onNavigate}>
        <Image src="/images/tom-zaragoza.jpg" width={34} height={34} alt="Tom Zaragoza" />
        <span>Learn X Ads<span>by Tom Zaragoza</span></span>
      </Link>

      <nav className={styles.workspaceNavigation} aria-label="Course sections">
          <div className={styles.courseTree}>
            {coursePages.filter(item => !item.parentSlug).map((item) => item.pageKind === "group" ? (
              <CourseGroupNavigation key={`${item.slug}:${currentPath}`} item={item} currentPath={currentPath} onNavigate={onNavigate}>
                {coursePages.filter(child => child.parentSlug === item.slug)}
              </CourseGroupNavigation>
            ) : (
              <Link href={item.path} key={item.path} onClick={onNavigate}
                aria-current={currentPath === item.path ? "page" : undefined}>
                {item.title}
              </Link>
            ))}
          </div>
        {canEdit && showMessages ? <Link href={messagesPath} className={styles.workspaceLink} onClick={onNavigate}
          aria-current={currentPath.includes("/messages") ? "page" : undefined}>
          <MessageSquare aria-hidden="true" />
          <span>Messages <span className={styles.messageCount} title={!preview && countFailed ? "Message count unavailable" : undefined}>
            ({!showMessages || preview ? 0 : countFailed ? "—" : messageCount ?? "…"})
          </span></span>
        </Link> : null}
      </nav>

      <div className={styles.sidebarBottom}>
        {canEdit ? <Link className={styles.cmsLink} href="/admin/course" onClick={onNavigate}>Manage course pages</Link> : null}
        {showAccountControls ? <div className={styles.workspaceAccount}><AuthControls courseAccount showMessages={false} /></div> : null}
      </div>
    </>
  );
}
