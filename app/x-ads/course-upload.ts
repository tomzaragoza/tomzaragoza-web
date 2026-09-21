export async function uploadCourseFile(file: File, pageSlug: string, mainVideo: boolean, onProgress: (percent: number) => void, signal: AbortSignal) {
  async function request(body: object, abortSignal?: AbortSignal) {
    const response = await fetch("/api/admin/course/media", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body), signal: abortSignal });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Unable to upload the file.");
    return result;
  }
  const upload = await request({ action: "start", pageSlug, name: file.name, size: file.size, contentType: file.type, mainVideo }, signal);
  try {
    for (let i = 0; i < upload.urls.length; i++) {
      const start = i * upload.partSize;
      const chunk = file.slice(start, Math.min(start + upload.partSize, file.size));
      for (let attempt = 0; ; attempt++) {
        try {
          await new Promise<void>((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            const abort = () => xhr.abort();
            xhr.open("PUT", upload.urls[i]);
            xhr.timeout = 180000;
            xhr.upload.onprogress = event => onProgress(Math.round((start + event.loaded) / file.size * 100));
            xhr.onload = () => xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error("Upload failed. Check your connection and retry."));
            xhr.onerror = () => reject(new Error("Upload failed. Check your connection and the bucket's browser upload permissions."));
            xhr.ontimeout = () => reject(new Error("Upload timed out."));
            xhr.onabort = () => reject(new DOMException("Upload cancelled.", "AbortError"));
            xhr.onloadend = () => signal.removeEventListener("abort", abort);
            signal.addEventListener("abort", abort, { once: true });
            if (signal.aborted) { reject(new DOMException("Upload cancelled.", "AbortError")); return; }
            xhr.send(chunk);
          });
          break;
        } catch (error) { if (signal.aborted || attempt >= 2) throw error; }
      }
    }
    const result = await request({ action: "complete", id: upload.id }, signal);
    return result.url as string;
  } catch (error) {
    await request({ action: "abort", id: upload.id }).catch(() => {});
    throw error;
  }
}
