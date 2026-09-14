"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import styles from "./auth-controls.module.css";

export function AuthControls() {
  const pathname = usePathname();
  const { data: session, isPending, error: sessionError } = authClient.useSession();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function signIn() {
    setBusy(true);
    setError(null);

    try {
      const result = await authClient.signIn.social({
        provider: "google",
        callbackURL: pathname === "/sign-in" ? "/x-ads" : pathname,
        errorCallbackURL: "/sign-in?error=google"
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
      if (result.error) setError("Could not sign out. Please try again.");
    } catch {
      setError("Could not sign out. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  // Temporarily hide Google sign-in while keeping sign-out available.
  if (!session) return null;

  return (
    <div className={styles.controls}>
      {session ? (
        <>
          <p className={styles.identity}>Signed in as {session.user.name || session.user.email}</p>
          <button className={styles.button} onClick={signOut} disabled={busy}>
            {busy ? "Signing out…" : "Sign out"}
          </button>
        </>
      ) : (
        <button className={styles.button} onClick={signIn} disabled={busy || isPending}>
          <svg className={styles.googleLogo} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path fill="#4285F4" d="M21.6 12.23c0-.71-.06-1.39-.18-2.05H12v3.88h5.38a4.6 4.6 0 0 1-2 3.02v2.51h3.24c1.9-1.75 2.98-4.33 2.98-7.36Z" />
            <path fill="#34A853" d="M12 22c2.7 0 4.96-.9 6.62-2.41l-3.24-2.51c-.9.6-2.05.96-3.38.96-2.6 0-4.81-1.76-5.6-4.12H3.06v2.59A10 10 0 0 0 12 22Z" />
            <path fill="#FBBC05" d="M6.4 13.92a6 6 0 0 1 0-3.84V7.49H3.06a10 10 0 0 0 0 9.02l3.34-2.59Z" />
            <path fill="#EA4335" d="M12 5.96c1.47 0 2.79.51 3.82 1.51l2.87-2.87A9.61 9.61 0 0 0 12 2a10 10 0 0 0-8.94 5.49l3.34 2.59C7.19 7.72 9.4 5.96 12 5.96Z" />
          </svg>
          <span>{isPending ? "Checking sign-in…" : busy ? "Opening Google…" : "Sign in with Google"}</span>
        </button>
      )}
      {error || sessionError ? (
        <p className={styles.error} role="alert">
          {error || "Sign-in is temporarily unavailable. Please try again later."}
        </p>
      ) : null}
    </div>
  );
}
