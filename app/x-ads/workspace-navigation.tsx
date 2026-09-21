"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useId, useState } from "react";
import { ArrowRight, BookOpen, ChevronRight, Library, MessageSquare } from "lucide-react";
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
  const [expanded, setExpanded] = useState(currentPath === item.path || children.some(child => child.path === currentPath));
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
  const isLesson = currentPath !== "/x-ads" && navigation.some((item) => item.path === currentPath);
  const messagesPath = canEdit ? "/admin/course/messages" : "/x-ads/messages";
  const coursePages = arrangeCoursePages(navigation);

  useEffect(() => {
    if (!showMessages || preview) return;
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

      <nav className={styles.workspaceNavigation} aria-label="Workspace navigation">
        <details className={styles.courseDisclosure} open={isLesson}>
          <summary><BookOpen aria-hidden="true" /><span>X Ads Course</span><ChevronRight className={styles.disclosureArrow} aria-hidden="true" /></summary>
          <div className={styles.courseTree}>
            {coursePages.filter(item => !item.parentSlug).map((item) => item.pageKind === "group" ? (
              <CourseGroupNavigation key={`${item.slug}:${currentPath}`} item={item} currentPath={currentPath} onNavigate={onNavigate}>
                {coursePages.filter(child => child.parentSlug === item.slug)}
              </CourseGroupNavigation>
            ) : (
              <Link href={item.path} key={item.path} onClick={onNavigate}
                aria-current={currentPath === item.path ? "page" : undefined}>
                {item.path === "/x-ads" ? "Overview" : item.title}
              </Link>
            ))}
          </div>
        </details>

        <Link href="/x-ads/library" className={styles.workspaceLink} onClick={onNavigate}
          aria-current={currentPath === "/x-ads/library" ? "page" : undefined}>
          <Library aria-hidden="true" /><span>Ads Library</span>
        </Link>

        <Link href={messagesPath} className={styles.workspaceLink} onClick={onNavigate}
          aria-current={currentPath.includes("/messages") ? "page" : undefined}>
          <MessageSquare aria-hidden="true" />
          <span>Messages <span className={styles.messageCount} title={!preview && countFailed ? "Message count unavailable" : undefined}>
            ({!showMessages || preview ? 0 : countFailed ? "—" : messageCount ?? "…"})
          </span></span>
        </Link>
      </nav>

      <div className={styles.sidebarBottom}>
        <div className={styles.sidebarPurchase}>
          <Link className={styles.presaleButton} href="/x-ads#presale" onClick={onNavigate}>Buy Full Access <ArrowRight aria-hidden="true" /></Link>
          <Link className={styles.sidebarProLink} href="/x-ads#pro-plan" onClick={onNavigate}>Explore Pro <ArrowRight aria-hidden="true" /></Link>
        </div>
        {canEdit ? <Link className={styles.cmsLink} href="/admin/course" onClick={onNavigate}>Manage course pages</Link> : null}
        {showAccountControls ? <div className={styles.workspaceAccount}><AuthControls courseAccount showMessages={false} /></div> : null}
      </div>
    </>
  );
}
