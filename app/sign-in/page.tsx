import type { Metadata } from "next";
import Link from "next/link";
import { AuthControls } from "@/app/components/auth-controls";
import styles from "./sign-in.module.css";

export const metadata: Metadata = {
  title: "Sign in | Tom Zaragoza",
  robots: { index: false, follow: false }
};

export default async function SignInPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string; returnPath?: string }>;
}) {
  const { error, returnPath } = await searchParams;
  const safeReturnPath = returnPath === "/x-ads" || returnPath?.startsWith("/x-ads/")
    ? returnPath
    : "/x-ads";

  return (
    <main className={styles.page}>
      <h1>Sign in</h1>
      <p>Use your Google account to sign in to Tom Zaragoza.</p>
      {error ? (
        <p className={styles.error} role="alert">
          Google sign-in did not complete. Please try again.
        </p>
      ) : null}
      <AuthControls returnPath={safeReturnPath} />
      <Link href="/x-ads">Back to the X Ads course</Link>
    </main>
  );
}
