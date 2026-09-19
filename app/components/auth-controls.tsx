"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import styles from "./auth-controls.module.css";

function subscribeToHydration() {
  return () => {};
}

export function AuthControls({
  signInOnly = false,
  courseAccount = false,
  adminMessages = false,
  showMessages = true,
  returnPath
}: {
  signInOnly?: boolean;
  courseAccount?: boolean;
  adminMessages?: boolean;
  showMessages?: boolean;
  returnPath?: string;
}) {
  const pathname = usePathname();
  const { data: session, isPending, error: sessionError } = authClient.useSession();
  const mounted = useSyncExternalStore(subscribeToHydration, () => true, () => false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [messageCount, setMessageCount] = useState<number | null>(null);
  const checkingSession = !mounted || isPending;
  const sessionUserId = session?.user.id;

  useEffect(() => {
    if (!courseAccount || !showMessages || !sessionUserId) return;

    const controller = new AbortController();
    const query = adminMessages ? "?scope=admin" : "";
    fetch(`/api/course/message-summary${query}`, { signal: controller.signal })
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error ?? "Unable to load messages.");
        setMessageCount(payload.count as number);
      })
      .catch(() => {
        if (!controller.signal.aborted) setMessageCount(null);
      });

    return () => controller.abort();
  }, [adminMessages, courseAccount, sessionUserId, showMessages]);

  useEffect(() => {
    if (!courseAccount || !showMessages) return;
    const handleMessageRead = () => setMessageCount((current) =>
      current === null ? null : Math.max(0, current - 1)
    );
    window.addEventListener("course-message-read", handleMessageRead);
    return () => window.removeEventListener("course-message-read", handleMessageRead);
  }, [courseAccount, showMessages]);

  async function signIn() {
    setBusy(true);
    setError(null);

    try {
      const result = await authClient.signIn.social({
        provider: "google",
        callbackURL: returnPath ?? (pathname === "/sign-in" ? "/x-ads" : pathname),
        errorCallbackURL: "/login?error=google"
      });

      if (result.error) {
        setError("Could not start Google sign-in. Please try again.");
        setBusy(false);
      }
    } catch {
      setError("Could not start Google sign-in. Please try again.");
      setBusy(false);
    }
  }

  async function signOut() {
    setBusy(true);
    setError(null);

    try {
      const result = await authClient.signOut();
      if (result.error) {
        setError("Could not sign out. Please try again.");
        return;
      }

      window.location.reload();
    } catch {
      setError("Could not sign out. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={styles.controls}>
      {session ? (
        signInOnly ? null : (
          courseAccount ? (
            <>
              <div className={styles.profile}>
                <div className={styles.profileAvatar} aria-hidden="true">
                  {session.user.image ? (
                    <Image
                      src={session.user.image}
                      width={34}
                      height={34}
                      alt=""
                      unoptimized
                    />
                  ) : (
                    <span>{Array.from((session.user.name || session.user.email).trim())[0]?.toUpperCase()}</span>
                  )}
                </div>
                <div>
                  <strong>{session.user.name || "Course customer"}</strong>
                  <span>{session.user.email}</span>
                </div>
              </div>
              <div className={styles.accountLinks}>
                {showMessages ? (
                  <Link
                    className={pathname.includes("/messages") ? styles.activeAccountLink : ""}
                    href={adminMessages ? "/admin/course/messages" : "/x-ads/messages"}
                  >
                    <span
                      className={`${styles.messageDot} ${
                        messageCount && messageCount > 0 ? styles.messageDotVisible : ""
                      }`}
                      aria-hidden="true"
                    />
                    <span>Messages</span>
                    {messageCount && messageCount > 0 ? <small>({messageCount})</small> : null}
                  </Link>
                ) : null}
                <button type="button" onClick={signOut} disabled={busy}>
                  {busy ? "Signing out…" : "Sign out"}
                </button>
              </div>
            </>
          ) : (
            <>
              <p className={styles.identity}>Signed in as {session.user.name || session.user.email}</p>
              <button className={styles.button} onClick={signOut} disabled={busy}>
                {busy ? "Signing out…" : "Sign out"}
              </button>
            </>
          )
        )
      ) : (
        <button className={styles.button} onClick={signIn} disabled={busy || checkingSession}>
          <svg className={styles.googleLogo} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path fill="#4285F4" d="M21.6 12.23c0-.71-.06-1.39-.18-2.05H12v3.88h5.38a4.6 4.6 0 0 1-2 3.02v2.51h3.24c1.9-1.75 2.98-4.33 2.98-7.36Z" />
            <path fill="#34A853" d="M12 22c2.7 0 4.96-.9 6.62-2.41l-3.24-2.51c-.9.6-2.05.96-3.38.96-2.6 0-4.81-1.76-5.6-4.12H3.06v2.59A10 10 0 0 0 12 22Z" />
            <path fill="#FBBC05" d="M6.4 13.92a6 6 0 0 1 0-3.84V7.49H3.06a10 10 0 0 0 0 9.02l3.34-2.59Z" />
            <path fill="#EA4335" d="M12 5.96c1.47 0 2.79.51 3.82 1.51l2.87-2.87A9.61 9.61 0 0 0 12 2a10 10 0 0 0-8.94 5.49l3.34 2.59C7.19 7.72 9.4 5.96 12 5.96Z" />
          </svg>
          <span>{checkingSession ? "Checking sign-in…" : busy ? "Opening Google…" : "Sign in with Google"}</span>
        </button>
      )}
      {(error || sessionError) && (!signInOnly || !session) ? (
        <p className={styles.error} role="alert">
          {error || "Sign-in is temporarily unavailable. Please try again later."}
        </p>
      ) : null}
    </div>
  );
}
