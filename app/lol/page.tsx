import type { Metadata } from "next";
import DownloadForm from "./download-form";

export const metadata: Metadata = {
  title: "Download | Tom Zaragoza",
  robots: {
    index: false,
    follow: false
  }
};

export default function DownloadPage() {
  return (
    <main className="download-page">
      <section className="download-panel" aria-labelledby="download-title">
        <p className="download-kicker">private download</p>
        <h1 id="download-title">Enter password</h1>
        <p className="download-copy">
          Enter the password to download <span>act.zip</span>.
        </p>
        <DownloadForm />
      </section>
    </main>
  );
}
