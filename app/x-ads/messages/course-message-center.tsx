"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { coursePathForSlug } from "@/lib/course-content-shared";
import type {
  PrivateCourseMessageCenterThread,
  PrivateCourseThread
} from "@/lib/course-messages-shared";
import styles from "./messages.module.css";

function formatDate(value: string) {
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

export function CourseMessageCenter({
  initialThreads
}: {
  initialThreads: PrivateCourseMessageCenterThread[];
}) {
  const [threads, setThreads] = useState(initialThreads);
  const [selectedId, setSelectedId] = useState(initialThreads[0]?.id ?? "");
  const [draft, setDraft] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState("");
  const selectedThread = useMemo(
    () => threads.find((thread) => thread.id === selectedId) ?? threads[0],
    [selectedId, threads]
  );

  useEffect(() => {
    if (!selectedThread?.unread) return;
    const threadId = selectedThread.id;
    const controller = new AbortController();
    fetch("/api/course/message-read", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ source: selectedThread.source, threadId }),
      signal: controller.signal
    }).then(async (response) => {
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Unable to mark the message as viewed.");
      setThreads((current) => current.map((thread) =>
        thread.id === threadId
          ? payload.thread as PrivateCourseMessageCenterThread
          : thread
      ));
      window.dispatchEvent(new Event("course-message-read"));
    }).catch(() => {
      if (controller.signal.aborted) return;
    });

    return () => controller.abort();
  }, [selectedThread]);

  async function sendReply(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const body = draft.trim();
    if (!body || !selectedThread) return;

    setIsSending(true);
    setError("");
    try {
      const isAnnotation = selectedThread.source === "annotation";
      const response = await fetch(
        isAnnotation ? "/api/course/annotations" : "/api/course/messages",
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(isAnnotation
            ? { action: "reply", threadId: selectedThread.id, body }
            : {
                pageSlug: selectedThread.pageSlug,
                sectionId: selectedThread.sectionId,
                body
              })
        }
      );
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Unable to send the reply.");

      const updated: PrivateCourseMessageCenterThread = isAnnotation
        ? payload.thread as PrivateCourseMessageCenterThread
        : {
            ...selectedThread,
            ...(payload.thread as PrivateCourseThread),
            id: selectedThread.id,
            updatedAt: new Date().toISOString()
          };
      setThreads((current) => [
        updated,
        ...current.filter((thread) => thread.id !== updated.id)
      ]);
      setSelectedId(updated.id);
      setDraft("");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to send the reply.");
    } finally {
      setIsSending(false);
    }
  }

  if (!selectedThread) {
    return (
      <section className={styles.emptyState}>
        <h2>No messages yet</h2>
        <p>Comments you start in the course will appear here.</p>
      </section>
    );
  }

  return (
    <div className={styles.messageCenter}>
      <aside className={styles.threadList} aria-label="Your conversations">
        {threads.map((thread) => {
          const lastMessage = thread.messages.at(-1);
          return (
            <button
              className={thread.id === selectedThread.id ? styles.activeThread : ""}
              type="button"
              aria-label={`${thread.unread ? "Unopened" : "Viewed"}: ${thread.pageTitle}, ${
                thread.quote || thread.sectionHeading
              }`}
              onClick={() => { setSelectedId(thread.id); setError(""); }}
              key={`${thread.source}:${thread.id}`}
            >
              <span
                className={`${styles.unreadDot} ${thread.unread ? styles.unreadDotVisible : ""}`}
                aria-hidden="true"
              />
              <span className={styles.threadPreview}>
                <strong>{thread.pageTitle}</strong>
                <span>{thread.quote || thread.sectionHeading}</span>
                <small>{lastMessage?.body}</small>
              </span>
            </button>
          );
        })}
      </aside>

      <section className={styles.conversation} aria-labelledby="message-thread-title">
        <header className={styles.conversationHeader}>
          <div>
            <h2 id="message-thread-title">{selectedThread.sectionHeading}</h2>
            <p>{selectedThread.pageTitle}</p>
          </div>
          <Link href={coursePathForSlug(selectedThread.pageSlug)}>Open lesson →</Link>
        </header>

        <div className={styles.contextCard}>
          {selectedThread.quote ? <blockquote>“{selectedThread.quote}”</blockquote> : null}
          <p>{selectedThread.context}</p>
        </div>

        <div className={styles.messages}>
          {selectedThread.messages.map((message) => (
            <article key={message.id}>
              <div className={styles.avatar} aria-hidden="true">
                {message.sender === "tom" ? (
                  <Image src="/images/tom-zaragoza.jpg" width={32} height={32} alt="" />
                ) : selectedThread.participant.image ? (
                  <Image
                    src={selectedThread.participant.image}
                    width={32}
                    height={32}
                    alt=""
                    unoptimized
                  />
                ) : (
                  <span>{firstInitial(selectedThread.participant.name)}</span>
                )}
              </div>
              <div>
                <div className={styles.messageMeta}>
                  <strong>{message.sender === "tom" ? "Tom" : selectedThread.participant.name}</strong>
                  <time dateTime={message.createdAt}>{formatDate(message.createdAt)}</time>
                </div>
                <p>{message.body}</p>
              </div>
            </article>
          ))}
        </div>

        <form className={styles.replyForm} onSubmit={sendReply}>
          <textarea
            aria-label="Reply privately to Tom"
            rows={3}
            maxLength={2000}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Reply to Tom…"
            disabled={isSending}
          />
          <div>
            <p role="alert">{error}</p>
            <button type="submit" disabled={isSending || !draft.trim()}>
              {isSending ? "Sending…" : "Send"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
