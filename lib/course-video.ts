export type CourseVideoSource =
  | { kind: "embed"; src: string }
  | { kind: "file"; src: string };

function safeUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url : null;
  } catch {
    return null;
  }
}

export function getCourseVideoSource(value: string): CourseVideoSource | null {
  const url = safeUrl(value);

  if (!url) return null;

  if (url.hostname === "youtu.be") {
    const id = url.pathname.split("/").filter(Boolean)[0];
    return id ? { kind: "embed", src: `https://www.youtube-nocookie.com/embed/${id}` } : null;
  }

  if (url.hostname === "youtube.com" || url.hostname.endsWith(".youtube.com")) {
    const parts = url.pathname.split("/").filter(Boolean);
    const id = url.pathname === "/watch"
      ? url.searchParams.get("v")
      : parts[0] === "shorts" || parts[0] === "embed"
        ? parts[1]
        : null;
    return id ? { kind: "embed", src: `https://www.youtube-nocookie.com/embed/${id}` } : null;
  }

  if (url.hostname === "vimeo.com" || url.hostname === "www.vimeo.com") {
    const id = url.pathname.split("/").filter(Boolean)[0];
    return id && /^\d+$/.test(id)
      ? { kind: "embed", src: `https://player.vimeo.com/video/${id}` }
      : null;
  }

  if (url.hostname === "player.vimeo.com") {
    const parts = url.pathname.split("/").filter(Boolean);
    const id = parts[0] === "video" ? parts[1] : null;
    return id && /^\d+$/.test(id)
      ? { kind: "embed", src: `https://player.vimeo.com/video/${id}` }
      : null;
  }

  if (url.hostname === "www.loom.com" || url.hostname === "loom.com") {
    const parts = url.pathname.split("/").filter(Boolean);
    const id = parts[0] === "share" || parts[0] === "embed" ? parts[1] : null;
    return id ? { kind: "embed", src: `https://www.loom.com/embed/${id}` } : null;
  }

  return { kind: "file", src: url.toString() };
}
