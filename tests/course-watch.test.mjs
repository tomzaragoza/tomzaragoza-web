import assert from "node:assert/strict";
import { test } from "node:test";
import { videoResumePosition, watchedSeconds, watchSummary, watchUpdateSchema } from "../lib/course-watch-shared.ts";

test("returning viewers resume at their saved position; finished videos can replay", () => {
  assert.equal(videoResumePosition(82.375, 270), 82.375);
  assert.equal(videoResumePosition(0.5, 270), 0.5);
  for (const position of [0, -1, NaN, Infinity, 270, 300]) assert.equal(videoResumePosition(position, 270), 0);
  assert.equal(videoResumePosition(10, 0), 0);
});

test("watch percentage counts played intervals, not the furthest position", () => {
  const seconds = watchedSeconds([[0, 10], [80, 90]], 100);
  assert.equal(seconds.length, 20);
  assert.equal(watchSummary(seconds, 100).percentage, 20);
  assert.equal(seconds.includes(50), false);
});
test("rewatching and overlapping ranges never count twice", () => {
  const seconds = watchedSeconds([[0, 10], [5, 15], [0, 10]], 20);
  assert.equal(watchSummary([...seconds, ...seconds], 20).percentage, 75);
});
test("short final intervals count at completion, partial seconds do not overcount", () => {
  assert.deepEqual(watchedSeconds([[0, 0.2]], 10), []);
  assert.deepEqual(watchedSeconds([[0.5, 3.8]], 10), [1, 2]);
  assert.equal(watchSummary(watchedSeconds([[0, 3.8]], 3.8), 3.8).percentage, 100);
  assert.equal(watchSummary(watchedSeconds([[0, 0.4]], 0.4), 0.4).percentage, 100);
});
test("invalid media metadata does not create watched intervals", () => {
  for (const duration of [0, -1, NaN, Infinity, 100000]) assert.deepEqual(watchedSeconds([[0, 10]], duration), []);
  assert.deepEqual(watchedSeconds([[NaN, 4], [5, 2]], 10), []);
  assert.equal(watchSummary([-1, 2, 500, 2], 10).percentage, 10);
});
test("progress validation rejects excessive or out-of-bounds reports", () => {
  const valid = { pageSlug: "principles", videoId: "section-1:video", source: "https://cdn.example.com/video.mp4", duration: 10, position: 8, seconds: [0, 1, 7] };
  assert.ok(watchUpdateSchema.safeParse(valid).success);
  for (const change of [{ position: 11 }, { duration: Infinity }, { observedAt: Date.now() + 120000 }, { observedAt: -1 }, { seconds: [10] }, { seconds: [-1] }, { seconds: [1.5] }, { seconds: Array(501).fill(1) }, { pageSlug: "../admin" }]) {
    assert.equal(watchUpdateSchema.safeParse({ ...valid, ...change }).success, false);
  }
});
