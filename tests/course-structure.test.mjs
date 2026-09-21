import assert from "node:assert/strict";
import { test } from "node:test";
import { arrangeCoursePages, courseStructure, moveCoursePage, validateCourseStructure } from "../lib/course-structure.ts";

const pages = [
  { slug: "introduction" },
  { slug: "start", pageKind: "group" },
  { slug: "pixel", parentSlug: "start", blocks: [{ id: "pixel-comment" }], mainVideo: { url: "/api/course/media/example" } },
  { slug: "analytics", parentSlug: "start" },
  { slug: "campaign", pageKind: "group" },
  { slug: "launch", parentSlug: "campaign" },
  { slug: "beyond" }
];
const slugs = pages.map(page => page.slug);

test("moving a group preserves its children, content, and media", () => {
  const next = moveCoursePage(pages, "start", "campaign", "after");
  assert.deepEqual(next.map(page => page.slug), ["introduction", "campaign", "launch", "start", "pixel", "analytics", "beyond"]);
  assert.equal(next.find(page => page.slug === "pixel"), pages[2]);
  validateCourseStructure(courseStructure(next), slugs);
});

test("pages move into, between, and out of groups", () => {
  let next = moveCoursePage(pages, "beyond", "start", "inside");
  assert.equal(next.find(page => page.slug === "beyond").parentSlug, "start");
  next = moveCoursePage(next, "beyond", "launch", "before");
  assert.equal(next.find(page => page.slug === "beyond").parentSlug, "campaign");
  next = moveCoursePage(next, "beyond", "campaign", "after");
  assert.equal(next.find(page => page.slug === "beyond").parentSlug, null);
  validateCourseStructure(courseStructure(next), slugs);
});

test("all drag targets preserve a complete, two-level structure", () => {
  for (const page of pages) for (const target of pages) for (const position of ["before", "inside", "after"]) {
    const next = moveCoursePage(pages, page.slug, target.slug, position);
    assert.doesNotThrow(() => validateCourseStructure(courseStructure(next), slugs), `${page.slug} ${position} ${target.slug}`);
  }
});

test("rejects missing pages, duplicates, nested groups, invalid parents and noncontiguous children", () => {
  const valid = courseStructure(pages);
  const invalid = [valid.slice(1), [...valid, valid[0]], valid.map(item => item.slug === "start" ? { ...item, parentSlug: "campaign" } : item),
    valid.map(item => item.slug === "pixel" ? { ...item, parentSlug: "beyond" } : item),
    valid.map(item => item.slug === "pixel" ? { ...item, parentSlug: "pixel" } : item),
    valid.map(item => item.slug === "pixel" ? { ...item, parentSlug: "missing" } : item),
    [valid[0], valid[1], valid[2], valid[4], valid[3], valid[5], valid[6]],
    valid.map(item => item.slug === "introduction" ? { ...item, pageKind: "group" } : item)];
  for (const items of invalid) assert.throws(() => validateCourseStructure(items, slugs));
});

test("saved structure supports older records and newly created child pages", () => {
  const saved = courseStructure(moveCoursePage(pages, "start", "campaign", "after"));
  const next = arrangeCoursePages([...pages, { slug: "new", parentSlug: "start" }], saved);
  assert.deepEqual(next.map(page => page.slug), ["introduction", "campaign", "launch", "start", "pixel", "analytics", "new", "beyond"]);
});

test("published children stay accessible while their group is unpublished", () => {
  const next = arrangeCoursePages(pages.filter(page => page.slug !== "start"), courseStructure(pages));
  assert.equal(next.find(page => page.slug === "pixel").parentSlug, null);
  assert.equal(next.find(page => page.slug === "launch").parentSlug, "campaign");
});
