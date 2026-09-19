"use client";

import Image from "next/image";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode
} from "react";
import { MessageSquare, MessageSquarePlus, Trash2, X } from "lucide-react";
import type {
  CourseThreadMessage,
  PrivateCourseAnnotationThread
} from "@/lib/course-messages-shared";
import styles from "./x-ads.module.css";

type AnnotationDraft = {
  blockId: string;
  quote: string | null;
};

type AnnotationContextValue = {
  threads: PrivateCourseAnnotationThread[];
  activeBlockId: string | null;
  openBlock: (blockId: string, element?: HTMLElement | null) => void;
  startComment: (blockId: string, quote: string | null, element?: HTMLElement | null) => void;
};

const AnnotationContext = createContext<AnnotationContextValue | null>(null);

function formatMessageTime(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(value));
}

function firstInitial(name: string) {
  return Array.from(name.trim())[0]?.toUpperCase() || "?";
}

function ThreadMessages({
  messages,
  participant,
  onDeleteFirst,
  isDeleting
}: {
  messages: CourseThreadMessage[];
  participant: PrivateCourseAnnotationThread["participant"];
  onDeleteFirst: () => void;
  isDeleting: boolean;
}) {
  return (
    <div className={styles.annotationMessages}>
      {messages.map((message, index) => (
        <article key={message.id}>
          <div className={styles.annotationAvatar} aria-hidden="true">
            {message.sender === "tom" ? (
              <Image src="/images/tom-zaragoza.jpg" width={28} height={28} alt="" />
            ) : participant.image ? (
              <Image src={participant.image} width={28} height={28} alt="" unoptimized />
            ) : (
              <span>{firstInitial(participant.name)}</span>
            )}
          </div>
          <div>
            <div className={styles.annotationMessageMeta}>
              <strong>{message.sender === "tom" ? "Tom" : participant.name}</strong>
              <time dateTime={message.createdAt}>{formatMessageTime(message.createdAt)}</time>
            </div>
            <p>{message.body}</p>
            {index === 0 && message.sender === "student" ? (
              <button
                className={styles.annotationDeleteComment}
                type="button"
                onClick={onDeleteFirst}
                disabled={isDeleting}
              >
                <Trash2 aria-hidden="true" />
                {isDeleting ? "Deleting…" : "Delete comment"}
              </button>
            ) : null}
          </div>
        </article>
      ))}
    </div>
  );
}

export function CourseAnnotations({
  pageSlug,
  children
}: {
  pageSlug: string;
  children: ReactNode;
}) {
  const [threads, setThreads] = useState<PrivateCourseAnnotationThread[]>([]);
  const [activeBlockId, setActiveBlockId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<AnnotationDraft | null>(null);
  const [draftBody, setDraftBody] = useState("");
  const [replyBody, setReplyBody] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    const query = new URLSearchParams({ pageSlug });

    fetch(`/api/course/annotations?${query}`, { signal: controller.signal })
      .then(async (response) => {
        const body = await response.json();
        if (!response.ok) throw new Error(body.error ?? "Unable to load comments.");
        return body.threads as PrivateCourseAnnotationThread[];
      })
      .then((nextThreads) => {
        setThreads(nextThreads);
        setIsLoading(false);
      })
      .catch((caught) => {
        if (controller.signal.aborted) return;
        setError(caught instanceof Error ? caught.message : "Unable to load comments.");
        setIsLoading(false);
      });

    return () => controller.abort();
  }, [pageSlug]);

  const blockThreads = useMemo(
    () => activeBlockId
      ? threads.filter((thread) => thread.blockId === activeBlockId)
      : [],
    [activeBlockId, threads]
  );

  function markThreadRead(thread: PrivateCourseAnnotationThread) {
    if (!thread.unread) return;
    setThreads((current) => current.map((item) =>
      item.id === thread.id ? { ...item, unread: false } : item
    ));
    fetch("/api/course/message-read", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ source: "annotation", threadId: thread.id })
    }).then((response) => {
      if (response.ok) window.dispatchEvent(new Event("course-message-read"));
      else throw new Error("Unable to mark the message as viewed.");
    }).catch(() => {
      setThreads((current) => current.map((item) =>
        item.id === thread.id ? { ...item, unread: true } : item
      ));
    });
  }

  function alignBlock(element?: HTMLElement | null) {
    if (!element) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    element.scrollIntoView({
      behavior: reduceMotion ? "auto" : "smooth",
      block: "start"
    });
  }

  function openBlock(blockId: string, element?: HTMLElement | null) {
    alignBlock(element);
    const firstThread = threads.find((thread) => thread.blockId === blockId);
    setActiveBlockId(blockId);
    setExpandedId(firstThread?.id ?? null);
    if (firstThread) markThreadRead(firstThread);
    setDraft(null);
    setDraftBody("");
    setError("");
  }

  function startComment(
    blockId: string,
    quote: string | null,
    element?: HTMLElement | null
  ) {
    alignBlock(element);
    setActiveBlockId(blockId);
    setExpandedId(null);
    setDraft({ blockId, quote });
    setDraftBody("");
    setError("");
  }

  async function createThread(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const body = draftBody.trim();
    if (!draft || !body) return;

    setIsSending(true);
    setError("");
    try {
      const response = await fetch("/api/course/annotations", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          action: "create",
          pageSlug,
          blockId: draft.blockId,
          quote: draft.quote,
          body
        })
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Unable to send the comment.");

      const thread = payload.thread as PrivateCourseAnnotationThread;
      setThreads((current) => [thread, ...current]);
      setExpandedId(thread.id);
      setDraft(null);
      setDraftBody("");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to send the comment.");
    } finally {
      setIsSending(false);
    }
  }

  async function replyToThread(
    event: React.FormEvent<HTMLFormElement>,
    thread: PrivateCourseAnnotationThread
  ) {
    event.preventDefault();
    const body = replyBody[thread.id]?.trim();
    if (!body) return;

    setIsSending(true);
    setError("");
    try {
      const response = await fetch("/api/course/annotations", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "reply", threadId: thread.id, body })
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Unable to send the reply.");

      const updatedThread = payload.thread as PrivateCourseAnnotationThread;
      setThreads((current) => [
        updatedThread,
        ...current.filter((item) => item.id !== updatedThread.id)
      ]);
      setReplyBody((current) => ({ ...current, [thread.id]: "" }));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to send the reply.");
    } finally {
      setIsSending(false);
    }
  }

  async function deleteFirstComment(thread: PrivateCourseAnnotationThread) {
    const hasReplies = thread.messages.length > 1;
    const confirmed = window.confirm(
      hasReplies
        ? "Delete your first comment? The replies will stay in this thread."
        : "Delete this comment thread?"
    );
    if (!confirmed) return;

    setDeletingId(thread.id);
    setError("");
    try {
      const response = await fetch("/api/course/annotations", {
        method: "DELETE",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ threadId: thread.id })
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Unable to delete the comment.");

      if (payload.deleted) {
        const remainingThreads = threads.filter((item) => item.id !== thread.id);
        setThreads(remainingThreads);
        const nextThread = remainingThreads.find((item) => item.blockId === thread.blockId);
        setExpandedId(nextThread?.id ?? null);
        if (!nextThread) setActiveBlockId(null);
      } else {
        const updatedThread = payload.thread as PrivateCourseAnnotationThread;
        setThreads((current) => current.map((item) =>
          item.id === updatedThread.id ? updatedThread : item
        ));
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to delete the comment.");
    } finally {
      setDeletingId(null);
    }
  }

  const contextValue: AnnotationContextValue = {
    threads,
    activeBlockId,
    openBlock,
    startComment
  };

  return (
    <AnnotationContext.Provider value={contextValue}>
      <div className={styles.annotationLayout}>
        <div className={styles.annotationLesson}>{children}</div>
        <aside
          className={`${styles.annotationRail} ${activeBlockId ? styles.annotationRailOpen : ""}`}
          aria-label="Inline course comments"
        >
          {activeBlockId ? (
            <div className={styles.annotationRailInner}>
              <header className={styles.annotationRailHeader}>
                <span>Add a comment</span>
                <button
                  type="button"
                  aria-label="Close comments"
                  onClick={() => {
                    setActiveBlockId(null);
                    setDraft(null);
                    setError("");
                  }}
                >
                  <X aria-hidden="true" />
                </button>
              </header>

              {blockThreads.map((thread) => {
                const isExpanded = expandedId === thread.id;
                return (
                  <section className={styles.annotationThread} key={thread.id}>
                    <button
                      className={`${styles.annotationThreadSummary} ${
                        thread.unread ? styles.annotationThreadUnread : ""
                      }`}
                      type="button"
                      aria-expanded={isExpanded}
                      onClick={() => {
                        setExpandedId(isExpanded ? null : thread.id);
                        if (!isExpanded) markThreadRead(thread);
                      }}
                    >
                      <span>{thread.quote ? `“${thread.quote}”` : thread.context}</span>
                      <small>{thread.messages.length} {thread.messages.length === 1 ? "message" : "messages"}</small>
                    </button>
                    {isExpanded ? (
                      <div className={styles.annotationThreadBody}>
                        <ThreadMessages
                          messages={thread.messages}
                          participant={thread.participant}
                          onDeleteFirst={() => deleteFirstComment(thread)}
                          isDeleting={deletingId === thread.id}
                        />
                        <form onSubmit={(event) => replyToThread(event, thread)}>
                          <textarea
                            aria-label="Add a private reply"
                            rows={2}
                            maxLength={2000}
                            placeholder="Reply…"
                            value={replyBody[thread.id] ?? ""}
                            onChange={(event) => setReplyBody((current) => ({
                              ...current,
                              [thread.id]: event.target.value
                            }))}
                            disabled={isSending}
                          />
                          <button type="submit" disabled={isSending || !replyBody[thread.id]?.trim()}>
                            {isSending ? "Sending…" : "Send"}
                          </button>
                        </form>
                      </div>
                    ) : null}
                  </section>
                );
              })}

              {draft ? (
                <form className={styles.annotationComposer} onSubmit={createThread}>
                  {draft.quote ? <p>“{draft.quote}”</p> : null}
                  <textarea
                    autoFocus
                    aria-label="Start a private comment"
                    rows={3}
                    maxLength={2000}
                    placeholder="Ask Tom about this…"
                    value={draftBody}
                    onChange={(event) => setDraftBody(event.target.value)}
                    disabled={isSending}
                  />
                  <div>
                    <small>Private between you and Tom.</small>
                    <button type="submit" disabled={isSending || !draftBody.trim()}>
                      {isSending ? "Sending…" : "Comment"}
                    </button>
                  </div>
                </form>
              ) : null}

              {isLoading ? <p className={styles.annotationStatus}>Loading comments…</p> : null}
              {error ? <p className={styles.annotationError} role="alert">{error}</p> : null}
            </div>
          ) : null}
        </aside>
      </div>
    </AnnotationContext.Provider>
  );
}

type AnnotationBlockProps = {
  as: "h2" | "p" | "li";
  blockId?: string;
  children: ReactNode;
  className?: string;
};

export function AnnotationBlock({
  as: Element,
  blockId,
  children,
  className = ""
}: AnnotationBlockProps) {
  const annotation = useContext(AnnotationContext);
  const elementRef = useRef<HTMLElement | null>(null);
  const [selectionMenu, setSelectionMenu] = useState<{
    quote: string;
    top: number;
    left: number;
  } | null>(null);
  const blockThreads = blockId && annotation
    ? annotation.threads.filter((thread) => thread.blockId === blockId)
    : [];

  function readSelection() {
    if (!annotation || !blockId || !elementRef.current) return;
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || selection.rangeCount === 0) {
      setSelectionMenu(null);
      return;
    }

    const range = selection.getRangeAt(0);
    const ancestor = range.commonAncestorContainer;
    if (!elementRef.current.contains(ancestor)) {
      setSelectionMenu(null);
      return;
    }

    const quote = selection.toString().replace(/\s+/g, " ").trim().slice(0, 1000);
    if (!quote) {
      setSelectionMenu(null);
      return;
    }

    const selectionRect = range.getBoundingClientRect();
    const blockRect = elementRef.current.getBoundingClientRect();
    setSelectionMenu({
      quote,
      top: Math.max(0, selectionRect.top - blockRect.top - 38),
      left: Math.min(
        Math.max(44, selectionRect.left - blockRect.left + selectionRect.width / 2),
        Math.max(44, blockRect.width - 44)
      )
    });
  }

  if (!annotation || !blockId) {
    return <Element className={className || undefined}>{children}</Element>;
  }

  const markerLabel = blockThreads.length > 0
    ? `Open ${blockThreads.length} private comment ${blockThreads.length === 1 ? "thread" : "threads"}`
    : "Comment on this text";

  return (
    <Element
      className={`${className} ${styles.annotationBlock} ${
        annotation.activeBlockId === blockId ? styles.annotationBlockActive : ""
      }`.trim()}
      ref={(node: HTMLElement | null) => { elementRef.current = node; }}
      onMouseUp={readSelection}
      onKeyUp={readSelection}
    >
      {children}
      <button
        className={`${styles.annotationMarker} ${blockThreads.length > 0 ? styles.annotationMarkerHasThreads : ""} ${
          blockThreads.some((thread) => thread.unread) ? styles.annotationMarkerUnread : ""
        }`}
        type="button"
        aria-label={markerLabel}
        onClick={() => {
          setSelectionMenu(null);
          if (blockThreads.length > 0) annotation.openBlock(blockId, elementRef.current);
          else annotation.startComment(blockId, null, elementRef.current);
        }}
      >
        {blockThreads.length > 0 ? <MessageSquare aria-hidden="true" /> : <MessageSquarePlus aria-hidden="true" />}
        {blockThreads.length > 0 ? <span>{blockThreads.length}</span> : null}
      </button>
      {selectionMenu ? (
        <button
          className={styles.annotationSelectionMenu}
          type="button"
          style={{
            "--annotation-menu-top": `${selectionMenu.top}px`,
            "--annotation-menu-left": `${selectionMenu.left}px`
          } as CSSProperties}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => {
            annotation.startComment(blockId, selectionMenu.quote, elementRef.current);
            setSelectionMenu(null);
            window.getSelection()?.removeAllRanges();
          }}
        >
          <MessageSquarePlus aria-hidden="true" /> Comment
        </button>
      ) : null}
    </Element>
  );
}
