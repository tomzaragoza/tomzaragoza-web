// Verify watch persistence in an isolated temporary collection.
import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import { randomUUID } from "node:crypto";
import { MongoClient, MongoServerError } from "mongodb";
import "./course-node-loader.mjs";

const suffix = `check_${randomUUID().replaceAll("-", "").slice(0, 20)}`;
const database = process.env.MONGODB_DB || "tomzaragoza";
const collectionName = `x_ads_course_watch_${suffix}`;
const client = new MongoClient(process.env.MONGODB_URL, { serverSelectionTimeoutMS: 10000 });
class TestMongoClient extends MongoClient {
  db() {
    const db = super.db(database);
    return new Proxy(db, { get(target, property) {
      if (property === "collection") return () => target.collection(collectionName);
      const value = Reflect.get(target, property);
      return typeof value === "function" ? value.bind(target) : value;
    } });
  }
}
globalThis.watchTestMongoClient = TestMongoClient;
globalThis.watchTestMongoServerError = MongoServerError;
registerHooks({ resolve(specifier, context, next) {
  if (specifier === "mongodb" && /lib\/course-watch\.ts$/.test(context.parentURL || "")) return {
    shortCircuit: true, url: "data:text/javascript,export const MongoClient=globalThis.watchTestMongoClient;export const MongoServerError=globalThis.watchTestMongoServerError;"
  };
  return next(specifier, context);
} });
try {
  const { saveWatchProgress, getWatchProgress, resolveWatchTarget, coursePageVideos } = await import("../lib/course-watch.ts");
  const page = { slug: "watch-test", path: "/x-ads/watch-test", title: "Test lesson", description: "Test", content: [], mainVideo: { url: "https://example.com/a.mp4" }, blocks: [
    { id: "inline", type: "video", props: { url: "https://example.com/b.mp4" }, children: [] }
  ] };
  const user = { id: "test-viewer", name: "Test", email: "test@example.invalid" };
  const observedAt = Date.now() - 10000;
  const input = { pageSlug: page.slug, videoId: "main-video", source: page.mainVideo.url, duration: 100, position: 20, observedAt, seconds: [0, 1, 2] };
  assert.equal(coursePageVideos(page).length, 2);
  assert.equal(resolveWatchTarget(page, { ...input, source: "https://example.com/other.mp4" }), null);
  assert.equal(resolveWatchTarget(page, { ...input, videoId: "missing" }), null);
  await Promise.all([
    saveWatchProgress(user, page, input),
    saveWatchProgress(user, page, { ...input, seconds: [2, 3, 4] })
  ]);
  assert.equal((await getWatchProgress(user.id, input)).percentage, 5);
  await saveWatchProgress(user, page, input);
  assert.equal((await getWatchProgress(user.id, input)).percentage, 5);
  assert.equal(await getWatchProgress("another-viewer", input), null);
  assert.equal(await getWatchProgress(user.id, { ...input, pageSlug: "another-page" }), null);
  assert.equal(await getWatchProgress(user.id, { ...input, videoId: "inline" }), null);
  const replaced = { ...page, mainVideo: { url: "https://example.com/replacement.mp4" } };
  const replacement = { ...input, source: replaced.mainVideo.url, seconds: [50] };
  assert.equal(await getWatchProgress(user.id, replacement), null);
  await saveWatchProgress(user, replaced, replacement);
  assert.equal((await getWatchProgress(user.id, replacement)).percentage, 1);
  assert.equal((await getWatchProgress(user.id, input)).percentage, 5);
  await assert.rejects(saveWatchProgress(user, page, replacement), /no longer/);
  await saveWatchProgress(user, page, { ...input, observedAt: observedAt + 3000, position: 32.125, seconds: [30, 31] });
  assert.equal((await getWatchProgress(user.id, input)).position, 32.125);
  await saveWatchProgress(user, page, { ...input, observedAt: observedAt + 2000, position: 85, seconds: [80] });
  const delayed = await getWatchProgress(user.id, input);
  assert.equal(delayed.position, 32.125);
  assert.equal(delayed.percentage, 8);
  await Promise.all([
    saveWatchProgress(user, page, { ...input, observedAt: observedAt + 5000, position: 4.25, seconds: [] }),
    saveWatchProgress(user, page, { ...input, observedAt: observedAt + 4000, position: 36, seconds: [35] })
  ]);
  const rewound = await getWatchProgress(user.id, input);
  assert.equal(rewound.position, 4.25);
  assert.equal(rewound.percentage, 9);
  console.log("PASS: concurrent interval union, idempotent retries, viewer/page/video isolation, replacement isolation, target validation, exact resume position, delayed-save protection, saved rewinds");
} finally {
  await client.db(database).collection(collectionName).drop().catch(error => { if (error.codeName !== "NamespaceNotFound") throw error; });
  await client.close();
  await globalThis.courseWatchMongo?.close();
  console.log("Temporary watch verification collection removed");
}
