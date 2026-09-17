import assert from "node:assert/strict";
import { test } from "node:test";
import { getCourseVideoSource } from "../lib/course-video.ts";

test("course videos normalize supported hosted recording URLs", () => {
  assert.deepEqual(getCourseVideoSource("https://youtu.be/abc123"), {
    kind: "embed",
    src: "https://www.youtube-nocookie.com/embed/abc123"
  });
  assert.deepEqual(getCourseVideoSource("https://vimeo.com/123456"), {
    kind: "embed",
    src: "https://player.vimeo.com/video/123456"
  });
  assert.deepEqual(getCourseVideoSource("https://www.loom.com/share/recording-id"), {
    kind: "embed",
    src: "https://www.loom.com/embed/recording-id"
  });
  assert.deepEqual(getCourseVideoSource("https://cdn.example.com/lesson.mp4"), {
    kind: "file",
    src: "https://cdn.example.com/lesson.mp4"
  });
});

test("course videos reject unsafe or malformed URLs", () => {
  assert.equal(getCourseVideoSource("javascript:alert(1)"), null);
  assert.equal(getCourseVideoSource("http://example.com/lesson.mp4"), null);
  assert.equal(getCourseVideoSource("https://evilyoutube.com/watch?v=abc123")?.kind, "file");
});
