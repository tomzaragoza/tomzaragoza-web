import assert from "node:assert/strict";
import { test } from "node:test";
import { courseBlocksSchema, legacyCourseBlocks, flattenCourseBlocks, courseBlockText, courseMediaIds, safeContentUrl } from "../lib/course-blocks.ts";
import { coursePages } from "../app/x-ads/course-data.ts";

test("every existing course lesson converts into valid blocks", () => {
  for (const page of coursePages) {
    const blocks = legacyCourseBlocks(page.content.map((section, i) => ({ ...section, id: section.id ?? `section-${i}` })));
    assert.equal(courseBlocksSchema.safeParse(blocks).success, true, page.path);
    assert.equal(new Set(flattenCourseBlocks(blocks).map(block => block.id)).size, blocks.length);
  }
});
test("moving or editing converted paragraphs preserves existing comment targets", () => {
  const blocks = legacyCourseBlocks([{ id: "section-1", heading: "Heading", paragraphs: ["First", "Second"], note: "Existing conversation", image: { src: "/images/test.png", alt: "Example", caption: "Caption", width: 600, height: 400, source: "https://example.com" } }]);
  const second = blocks.find(block => block.id === "section-1:paragraph:1");
  second.content[0].text = "Revised second paragraph";
  const reordered = [second, ...blocks.filter(block => block !== second)];
  assert.equal(courseBlockText(courseBlocksSchema.parse(reordered)[0]), "Revised second paragraph");
  assert.equal(reordered[0].id, "section-1:paragraph:1");
  assert.ok(blocks.some(block => block.id === "section-1:note"));
  assert.ok(blocks.some(block => block.id === "section-1:source"));
});
test("validation rejects duplicate identifiers and executable URLs", () => {
  const block = { id: "block", type: "paragraph", props: {}, content: [{ type: "text", text: "Text", styles: {} }], children: [] };
  assert.equal(courseBlocksSchema.safeParse([block, block]).success, false);
  for (const url of ["javascript:alert(1)", "data:text/html,test", "//example.com", "http://example.com"]) {
    assert.equal(safeContentUrl(url), false);
    assert.equal(courseBlocksSchema.safeParse([{ ...block, type: "image", props: { url } }]).success, false);
  }
});
test("table cells retain formatting, spans, widths, and searchable comment context", () => {
  const table = { id: "table", type: "table", props: {}, children: [], content: { type: "tableContent", columnWidths: [150, null], headerRows: 1, rows: [{ cells: [{ type: "tableCell", props: { colspan: 2, backgroundColor: "blue", textAlignment: "left" }, content: [{ type: "text", text: "Campaign", styles: { bold: true } }] }] }] } };
  const [result] = courseBlocksSchema.parse([table]);
  assert.equal(courseBlockText(result), "Campaign");
  assert.equal(result.content.rows[0].cells[0].props.colspan, 2);
});
test("media references include nested blocks and the main video, without storing signed URLs", () => {
  const id = "11111111-1111-4111-8111-111111111111";
  assert.deepEqual(courseMediaIds({ mainVideo: { url: `/api/course/media/${id}` }, blocks: [{ children: [{ props: { url: `/api/course/media/${id}` } }] }], unrelated: "https://example.com/image.png" }), [id]);
});
