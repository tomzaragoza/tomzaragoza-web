"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import type { CourseThreadMessage, PrivateCourseThread } from "@/lib/course-messages-shared";
import styles from "./x-ads.module.css";

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

export function CourseNoteThread({
  note,
  pageSlug,
  sectionId
}: {
  note: string;
  pageSlug?: string;
  sectionId?: string;
}) {
  const canMessage = Boolean(pageSlug && sectionId);
  const [messages, setMessages] = useState<CourseThreadMessage[]>([]);
  const [participant, setParticipant] = useState<PrivateCourseThread["participant"]>({
    name: "You",
    image: null
  });
  const [draft, setDraft] = useState("");
  const [threadId, setThreadId] = useState<string | null>(null);
  const [unread, setUnread] = useState(false);
  const [isLoading, setIsLoading] = useState(canMessage);
  const [isSending, setIsSending] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const noteRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!pageSlug || !sectionId) return;

    const controller = new AbortController();
    const query = new URLSearchParams({ pageSlug, sectionId });

    fetch(`/api/course/messages?${query}`, { signal: controller.signal })
      .then(async (response) => {
        const body = await response.json();
        if (!response.ok) throw new Error(body.error ?? "Unable to load the conversation.");
        return body.thread as PrivateCourseThread;
      })
      .then((thread) => {
        setThreadId(thread.id);
        setUnread(thread.unread);
        setParticipant(thread.participant);
        setMessages(thread.messages);
        setIsLoading(false);
      })
      .catch((caught) => {
        if (controller.signal.aborted) return;
        setError(caught instanceof Error ? caught.message : "Unable to load the conversation.");
        setIsLoading(false);
      });

    return () => controller.abort();
  }, [pageSlug, sectionId]);

  useEffect(() => {
    if (!threadId || !unread || !noteRef.current) return;
    const element = noteRef.current;
    const observer = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      setUnread(false);
      observer.disconnect();
      fetch("/api/course/message-read", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ source: "note", threadId })
      }).then((response) => {
        if (response.ok) window.dispatchEvent(new Event("course-message-read"));
      }).catch(() => undefined);
    }, { threshold: 0.2 });
    observer.observe(element);
    return () => observer.disconnect();
  }, [threadId, unread]);

  async function sendMessage(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const body = draft.trim();
    if (!body || !pageSlug || !sectionId) return;

    setIsSending(true);
    setError("");
    setStatus("");

    try {
      const response = await fetch("/api/course/messages", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ pageSlug, sectionId, body })
      });
      const payload = await response.json();

      if (!response.ok) throw new Error(payload.error ?? "Unable to send the message.");

      const thread = payload.thread as PrivateCourseThread;
      setThreadId(thread.id);
      setUnread(false);
      setParticipant(thread.participant);
      setMessages(thread.messages);
      setDraft("");
      setStatus("Message sent privately to Tom.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to send the message.");
    } finally {
      setIsSending(false);
    }
  }

  return (
    <aside ref={noteRef} className={styles.lessonNote} aria-label="Private conversation with Tom Zaragoza">
      <div className={styles.lessonNoteMessage}>
        <Image
          className={styles.lessonNoteAvatar}
          src="/images/tom-zaragoza.jpg"
          width={40}
          height={40}
          alt=""
        />
        <div>
          <p>{note}</p>
        </div>
      </div>

      {canMessage ? (
        <div className={styles.lessonConversation}>
          {messages.length > 0 ? (
            <div className={styles.lessonMessages} aria-live="polite">
              {messages.map((message) => (
                <div className={styles.lessonMessage} key={message.id}>
                  <div className={styles.lessonThreadAvatar} aria-hidden="true">
                    {message.sender === "tom" ? (
                      <Image src="/images/tom-zaragoza.jpg" width={32} height={32} alt="" />
                    ) : participant.image ? (
                      <Image
                        src={participant.image}
                        width={32}
                        height={32}
                        alt=""
                        unoptimized
                      />
                    ) : (
                      <span>{firstInitial(participant.name)}</span>
                    )}
                  </div>
                  <div className={styles.lessonMessageBody}>
                    <div className={styles.lessonMessageMeta}>
                      <strong>{message.sender === "student" ? participant.name : "Tom"}</strong>
                      <time dateTime={message.createdAt}>{formatMessageTime(message.createdAt)}</time>
                    </div>
                    <p>{message.body}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : null}

          <form className={styles.lessonReplyForm} onSubmit={sendMessage}>
            <textarea
              aria-label="Reply to Tom"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              rows={2}
              maxLength={2000}
              placeholder="Ask a question about this section…"
              disabled={isLoading || isSending}
            />
            <div className={styles.lessonReplyFooter}>
              <small>Private between you and Tom.</small>
              <button type="submit" disabled={isLoading || isSending || !draft.trim()}>
                {isLoading ? "Loading…" : isSending ? "Sending…" : "Send"}
              </button>
            </div>
          </form>

          {status ? <p className={styles.lessonMessageStatus} role="status">{status}</p> : null}
          {error ? <p className={styles.lessonMessageError} role="alert">{error}</p> : null}
        </div>
      ) : null}
    </aside>
  );
}
