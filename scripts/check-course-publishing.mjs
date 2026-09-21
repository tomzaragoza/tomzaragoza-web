// Uses isolated temporary collections. Never edits the course collections.
import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import { randomUUID } from "node:crypto";
import { MongoClient } from "mongodb";
import "./course-node-loader.mjs";
const database = process.env.MONGODB_DB || "tomzaragoza";
const suffix = `check_${randomUUID().replaceAll("-", "").slice(0, 20)}`;
const client = new MongoClient(process.env.MONGODB_URL, { serverSelectionTimeoutMS: 10000 });
const collectionNames = ["x_ads_course_pages", "x_ads_course_media", "x_ads_course_structure"];
class TestMongoClient extends MongoClient {
  db() {
    const db = super.db(database);
    return new Proxy(db, { get(target, property) {
      if (property === "collection") return name => target.collection(`${name}_${suffix}`);
      const value = Reflect.get(target, property);
      return typeof value === "function" ? value.bind(target) : value;
    } });
  }
}
globalThis.courseTestMongoClient = TestMongoClient;
registerHooks({ resolve(specifier, context, nextResolve) {
  if (specifier === "mongodb" && /lib\/course-(content|media)\.ts$/.test(context.parentURL || "")) return { shortCircuit: true, url: "data:text/javascript,export const MongoClient = globalThis.courseTestMongoClient;" };
  return nextResolve(specifier, context);
} });
try {
  const { createCoursePage, saveCourseDraft, publishCoursePage, getCoursePageBySlug, getAdminCoursePageBySlug, getAdminCoursePages, getCourseNavigation, saveCourseStructure } = await import("../lib/course-content.ts");
  const { courseStructure, moveCoursePage } = await import("../lib/course-structure.ts");
  const page = await createCoursePage({ slug: "test-page", title: "Draft title", description: "Draft outcome" });
  assert.equal(await getCoursePageBySlug(page.slug), undefined);
  assert.equal((await getCourseNavigation()).some(item => item.slug === page.slug), false);
  const block = { id: "stable-block", type: "paragraph", props: {}, children: [], content: [{ type: "text", text: "First publication", styles: {} }] };
  const saved = await saveCourseDraft({ ...page, blocks: [block] });
  await assert.rejects(saveCourseDraft({ ...page, blocks: [] }), /another window/);
  const published = await publishCoursePage({ slug: page.slug, revision: saved.revision });
  assert.equal((await getCoursePageBySlug(page.slug)).title, "Draft title");
  const next = await saveCourseDraft({ ...published, title: "New private title", blocks: [{ ...block, content: [{ type: "text", text: "Private revision", styles: {} }] }] });
  assert.equal((await getCoursePageBySlug(page.slug)).title, "Draft title");
  assert.equal((await getAdminCoursePageBySlug(page.slug)).title, "New private title");
  await assert.rejects(publishCoursePage({ slug: page.slug, revision: published.revision }), /another window/);
  const results = await Promise.allSettled([saveCourseDraft({ ...next, title: "Concurrent A" }), saveCourseDraft({ ...next, title: "Concurrent B" })]);
  assert.equal(results.filter(result => result.status === "fulfilled").length, 1);
  const latest = await getAdminCoursePageBySlug(page.slug);
  await assert.rejects(saveCourseDraft({ ...latest, mainVideo: { url: "/api/course/media/11111111-1111-4111-8111-111111111111" } }), /missing|uploading/);
  const pageCollection = client.db(database).collection(`x_ads_course_pages_${suffix}`);
  await pageCollection.updateOne({ slug: page.slug }, { $set: { mediaCleanupUntil: new Date(Date.now() + 60000) } });
  await assert.rejects(saveCourseDraft({ ...latest }), /cleanup/);
  await pageCollection.updateOne({ slug: page.slug }, { $unset: { mediaCleanupUntil: "" } });
  const media = client.db(database).collection(`x_ads_course_media_${suffix}`);
  const mediaId = "11111111-1111-4111-8111-111111111111";
  await media.insertOne({ id: mediaId, pageSlug: "another-page", status: "ready" });
  await assert.rejects(saveCourseDraft({ ...latest, mainVideo: { url: `/api/course/media/${mediaId}` } }), /missing|uploading/);
  await media.updateOne({ id: mediaId }, { $set: { pageSlug: page.slug } });
  const withVideo = await saveCourseDraft({ ...latest, mainVideo: { url: `/api/course/media/${mediaId}` } });
  assert.equal((await getCoursePageBySlug(page.slug)).mainVideo, null);
  await publishCoursePage({ slug: page.slug, revision: withVideo.revision });
  assert.equal((await getCoursePageBySlug(page.slug)).mainVideo.url, `/api/course/media/${mediaId}`);
  const group = await createCoursePage({ slug: "test-group", pageKind: "group", title: "Getting started", description: "Group outcome" });
  await assert.rejects(createCoursePage({ slug: "invalid-group", pageKind: "group", parentSlug: group.slug, title: "Nested", description: "Invalid" }), /cannot be nested/);
  await assert.rejects(createCoursePage({ slug: "invalid-child", parentSlug: page.slug, title: "Nested", description: "Invalid" }), /top-level group/);
  const before = await getAdminCoursePages();
  const grouped = moveCoursePage(before, page.slug, group.slug, "inside");
  await saveCourseStructure({ items: courseStructure(grouped), previous: courseStructure(before) });
  assert.equal((await getAdminCoursePageBySlug(page.slug)).parentSlug, group.slug);
  assert.equal((await getCoursePageBySlug(page.slug)).parentSlug, null);
  await assert.rejects(saveCourseStructure({ items: courseStructure(before), previous: courseStructure(before) }), /another window/);
  const groupDraft = await saveCourseDraft({ ...group, blocks: [block], mainVideo: null });
  await publishCoursePage({ slug: group.slug, revision: groupDraft.revision });
  assert.equal((await getCoursePageBySlug(group.slug)).pageKind, "group");
  assert.equal((await getCoursePageBySlug(page.slug)).parentSlug, group.slug);
  assert.equal((await getCoursePageBySlug(page.slug)).mainVideo.url, `/api/course/media/${mediaId}`);
  const newChild = await createCoursePage({ slug: "new-child", parentSlug: group.slug, title: "New child", description: "Outcome" });
  assert.equal((await getAdminCoursePageBySlug(newChild.slug)).parentSlug, group.slug);
  const currentStructure = courseStructure(await getAdminCoursePages());
  const concurrent = await Promise.allSettled([
    saveCourseStructure({ items: courseStructure(moveCoursePage(currentStructure, page.slug, group.slug, "before")), previous: currentStructure }),
    saveCourseStructure({ items: courseStructure(moveCoursePage(currentStructure, page.slug, group.slug, "after")), previous: currentStructure })
  ]);
  assert.equal(concurrent.filter(result => result.status === "fulfilled").length, 1);
  // Publishing a stale content draft cannot overwrite a newer group assignment.
  const childDraft = await saveCourseDraft({ ...await getAdminCoursePageBySlug(page.slug), title: "Moved page" });
  const current = await getAdminCoursePages();
  await saveCourseStructure({ items: courseStructure(moveCoursePage(current, page.slug, group.slug, "after")), previous: courseStructure(current) });
  await publishCoursePage({ slug: page.slug, revision: childDraft.revision });
  assert.equal((await getCoursePageBySlug(page.slug)).parentSlug, null);
  console.log("PASS: group creation, hierarchy validation, private groups, child creation, stale structure rejection, group publishing, content/structure isolation");
  console.log("PASS: draft isolation, unpublished navigation, publishing, stale edits, concurrent saves, incomplete media, cross-page media, cleanup/save exclusion, main-video publishing");
} finally {
  for (const name of collectionNames) await client.db(database).collection(`${name}_${suffix}`).drop().catch(error => { if (error.codeName !== "NamespaceNotFound") throw error; });
  await client.close();
  await globalThis.courseMongoClient?.close();
  await globalThis.courseMediaMongo?.close();
  console.log("Temporary verification collections removed");
}
