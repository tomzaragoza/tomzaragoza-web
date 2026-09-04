"use client";

import { FormEvent, useRef, useState } from "react";

export default function DownloadForm() {
  const [error, setError] = useState("");
  const [isDownloading, setIsDownloading] = useState(false);
  const passwordInput = useRef<HTMLInputElement>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsDownloading(true);

    const formData = new FormData(event.currentTarget);
    const password = formData.get("password");

    try {
      const response = await fetch("/lol/download", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ password })
      });

      if (!response.ok) {
        setError(
          response.status === 401
            ? "That password is not correct."
            : "The download could not start. Try again."
        );
        passwordInput.current?.select();
        return;
      }

      const file = await response.blob();
      const fileUrl = URL.createObjectURL(file);
      const downloadLink = document.createElement("a");

      downloadLink.href = fileUrl;
      downloadLink.download = "act.zip";
      document.body.appendChild(downloadLink);
      downloadLink.click();
      downloadLink.remove();
      URL.revokeObjectURL(fileUrl);
      event.currentTarget.reset();
    } catch {
      setError("The download could not start. Check your connection and try again.");
    } finally {
      setIsDownloading(false);
    }
  }

  return (
    <form className="download-form" onSubmit={handleSubmit}>
      <label htmlFor="download-password">Password</label>
      <div className="download-controls">
        <input
          ref={passwordInput}
          id="download-password"
          name="password"
          type="password"
          autoComplete="current-password"
          autoFocus
          required
        />
        <button type="submit" disabled={isDownloading}>
          {isDownloading ? "Starting…" : "Download"}
        </button>
      </div>
      <p className="download-error" role="alert" aria-live="polite">
        {error}
      </p>
    </form>
  );
}
