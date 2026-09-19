"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { AdminCourseThread } from "@/lib/course-messages-shared";
import { coursePathForSlug } from "@/lib/course-content-shared";
import styles from "./course-messages.module.css";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/Toronto"
  }).format(new Date(value));
}

function firstInitial(name: string) {
  return Array.from(name.trim())[0]?.toUpperCase() || "?";
}

function threadKey(thread: AdminCourseThread) {
  return `${thread.source}:${thread.id}`;
}

export function CourseMessageInbox({
  initialThreads
}: {
  initialThreads: AdminCourseThread[];
}) {
  const [threads, setThreads] = useState(initialThreads);
  const [selectedUserEmail, setSelectedUserEmail] = useState(
    initialThreads[0]?.userEmail ?? ""
  );
  const [selectedId, setSelectedId] = useState(
    initialThreads[0] ? threadKey(initialThreads[0]) : ""
  );
  const [draft, setDraft] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState("");
  const customers = useMemo(() => {
    const grouped = new Map<string, {
      email: string;
      name: string;
      image: string | null;
      threads: AdminCourseThread[];
      updatedAt: string;
    }>();

    threads.forEach((thread) => {
      const key = thread.userEmail.toLowerCase();
      const customer = grouped.get(key);
      if (customer) {
        customer.threads.push(thread);
        if (thread.updatedAt > customer.updatedAt) customer.updatedAt = thread.updatedAt;
      } else {
        grouped.set(key, {
          email: thread.userEmail,
          name: thread.userName,
          image: thread.userImage,
          threads: [thread],
          updatedAt: thread.updatedAt
        });
      }
    });

    return Array.from(grouped.values()).sort((a, b) =>
      b.updatedAt.localeCompare(a.updatedAt)
    );
  }, [threads]);
  const selectedCustomer = customers.find((customer) =>
    customer.email.toLowerCase() === selectedUserEmail.toLowerCase()
  ) ?? customers[0];
  const selectedThread = selectedCustomer?.threads.find((thread) =>
    threadKey(thread) === selectedId
  ) ?? selectedCustomer?.threads[0];

  useEffect(() => {
    if (!selectedThread?.unread) return;
    const key = threadKey(selectedThread);
    const controller = new AbortController();

    fetch("/api/admin/course/messages", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        source: selectedThread.source,
        threadId: selectedThread.id
      }),
      signal: controller.signal
    }).then(async (response) => {
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Unable to mark the message as viewed.");
      setThreads((current) => current.map((thread) =>
        threadKey(thread) === key ? payload.thread as AdminCourseThread : thread
      ));
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
      const response = await fetch("/api/admin/course/messages", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          source: selectedThread.source,
          threadId: selectedThread.id,
          body
        })
      });
      const payload = await response.json();

      if (!response.ok) throw new Error(payload.error ?? "Unable to send the reply.");

      const updatedThread = payload.thread as AdminCourseThread;
      setThreads((current) => [
        updatedThread,
        ...current.filter((thread) => threadKey(thread) !== threadKey(updatedThread))
      ]);
      setSelectedId(threadKey(updatedThread));
      setDraft("");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to send the reply.");
    } finally {
      setIsSending(false);
    }
  }

  if (!selectedCustomer || !selectedThread) {
    return (
      <section className={styles.emptyState}>
        <h2>No messages yet</h2>
        <p>Customer conversations will appear here after someone sends a message.</p>
      </section>
    );
  }

  return (
    <div className={styles.inbox}>
      <aside className={styles.customerList} aria-label="Customers">
        {customers.map((customer) => (
          <button
            className={customer.email === selectedCustomer.email ? styles.activeCustomer : ""}
            type="button"
            aria-label={`${customer.name}, ${customer.threads.length} conversations, ${
              customer.threads.some((thread) => thread.unread)
                ? "has unopened messages"
                : "all viewed"
            }`}
            onClick={() => {
              setSelectedUserEmail(customer.email);
              setSelectedId(threadKey(customer.threads[0]));
              setError("");
            }}
            key={customer.email}
          >
            <span
              className={`${styles.unreadDot} ${
                customer.threads.some((thread) => thread.unread) ? styles.unreadDotVisible : ""
              }`}
              aria-hidden="true"
            />
            <div className={styles.customerAvatar} aria-hidden="true">
              {customer.image ? (
                <Image src={customer.image} width={34} height={34} alt="" unoptimized />
              ) : (
                <span>{firstInitial(customer.name)}</span>
              )}
            </div>
            <div>
              <strong>{customer.name}</strong>
              <span>{customer.email}</span>
            </div>
            <small>{customer.threads.length}</small>
          </button>
        ))}
      </aside>

      <aside className={styles.threadList} aria-label={`${selectedCustomer.name}'s conversations`}>
        {selectedCustomer.threads.map((thread) => {
          const lastMessage = thread.messages.at(-1);
          return (
            <button
              className={threadKey(thread) === threadKey(selectedThread) ? styles.activeThread : ""}
              type="button"
              aria-label={`${thread.unread ? "Unopened" : "Viewed"}: ${thread.pageTitle}, ${
                thread.quote || thread.sectionHeading
              }`}
              onClick={() => { setSelectedId(threadKey(thread)); setError(""); }}
              key={threadKey(thread)}
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

      <section className={styles.conversation} aria-labelledby="conversation-title">
        <header className={styles.conversationHeader}>
          <div>
            <h2 id="conversation-title">{selectedThread.sectionHeading}</h2>
            <p>{selectedThread.userName} · {selectedThread.pageTitle}</p>
          </div>
          <Link href={coursePathForSlug(selectedThread.pageSlug)}>Open lesson →</Link>
        </header>

        <div className={styles.contextCard}>
          <strong>{selectedThread.pageTitle} · {selectedThread.sectionHeading}</strong>
          {selectedThread.quote ? <blockquote>“{selectedThread.quote}”</blockquote> : null}
          <p>{selectedThread.context}</p>
        </div>

        <div className={styles.messages}>
          {selectedThread.messages.map((message) => (
            <article key={message.id}>
              <div className={styles.messageAvatar} aria-hidden="true">
                {message.sender === "tom" ? (
                  <Image src="/images/tom-zaragoza.jpg" width={32} height={32} alt="" />
                ) : selectedThread.userImage ? (
                  <Image
                    src={selectedThread.userImage}
                    width={32}
                    height={32}
                    alt=""
                    unoptimized
                  />
                ) : (
                  <span>{firstInitial(selectedThread.userName)}</span>
                )}
              </div>
              <div className={styles.messageBody}>
                <div className={styles.messageMeta}>
                  <strong>{message.sender === "tom" ? "You" : selectedThread.userName}</strong>
                  <time dateTime={message.createdAt}>{formatDate(message.createdAt)}</time>
                </div>
                <p>{message.body}</p>
              </div>
            </article>
          ))}
        </div>

        <form className={styles.replyForm} onSubmit={sendReply}>
          <label htmlFor="course-message-reply">Reply to {selectedThread.userName}</label>
          <textarea
            id="course-message-reply"
            rows={4}
            maxLength={2000}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Write a private reply…"
            disabled={isSending}
          />
          <div>
            <p role="alert">{error}</p>
            <button type="submit" disabled={isSending || !draft.trim()}>
              {isSending ? "Sending…" : "Send private reply"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
