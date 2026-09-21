import { z } from "zod";
import type { CourseContentSection } from "./course-content-shared";

export function safeContentUrl(value: string) {
  return /^\/(?!\/)/.test(value) || /^(https:\/\/|mailto:)/i.test(value);
}

const stylesSchema = z.object({
  bold: z.boolean().optional(), italic: z.boolean().optional(),
  underline: z.boolean().optional(), strike: z.boolean().optional(),
  code: z.boolean().optional(), textColor: z.string().max(30).optional(),
  backgroundColor: z.string().max(30).optional()
}).strict();
const textSchema = z.object({ type: z.literal("text"), text: z.string().max(50000), styles: stylesSchema });
const inlineSchema = z.union([textSchema, z.object({
  type: z.literal("link"), href: z.string().max(2048).refine(safeContentUrl),
  content: z.array(textSchema).max(1000)
})]);
export type CourseInline = z.infer<typeof inlineSchema>;
const inlineContent = z.array(inlineSchema).max(2000);
const cellSchema = z.union([inlineContent, z.object({
  type: z.literal("tableCell"), content: inlineContent,
  props: z.object({
    colspan: z.number().int().min(1).max(50).optional(), rowspan: z.number().int().min(1).max(100).optional(),
    backgroundColor: z.string().max(30).optional(), textColor: z.string().max(30).optional(),
    textAlignment: z.enum(["left", "center", "right", "justify"]).optional()
  })
})]);
const tableSchema = z.object({
  type: z.literal("tableContent"), columnWidths: z.array(z.number().positive().max(10000).nullable().optional()).max(50).optional(),
  headerRows: z.number().int().min(0).max(100).optional(), headerCols: z.number().int().min(0).max(50).optional(),
  rows: z.array(z.object({ cells: z.array(cellSchema).min(1).max(50) })).min(1).max(100)
});
const blockBase = z.object({
  id: z.string().min(1).max(160).regex(/^[a-zA-Z0-9_:-]+$/),
  type: z.enum(["paragraph", "heading", "bulletListItem", "numberedListItem", "checkListItem", "toggleListItem", "quote", "codeBlock", "table", "image", "video", "audio", "file", "divider"]),
  props: z.object({
    textColor: z.string().max(30).optional(), backgroundColor: z.string().max(30).optional(),
    textAlignment: z.enum(["left", "center", "right", "justify"]).optional(),
    level: z.number().int().min(1).max(6).optional(), checked: z.boolean().optional(),
    start: z.number().int().min(0).optional(), isToggleable: z.boolean().optional(),
    language: z.string().max(100).optional(), name: z.string().max(500).optional(),
    url: z.string().max(2048).refine(v => !v || safeContentUrl(v)).optional(),
    caption: z.string().max(2000).optional(), showPreview: z.boolean().optional(),
    previewWidth: z.number().positive().max(10000).optional()
  }).strict(),
  content: z.union([inlineContent, tableSchema]).optional()
});
export type CourseBlock = z.infer<typeof blockBase> & { children: CourseBlock[] };
const blockSchema: z.ZodType<CourseBlock> = blockBase.extend({ children: z.lazy(() => z.array(blockSchema).max(1000)) });
export const courseBlocksSchema = z.array(blockSchema).max(2000).superRefine((blocks, context) => {
  const ids = new Set<string>();
  function visit(items: CourseBlock[], depth: number) {
    if (depth > 12) { context.addIssue({ code: "custom", message: "Content nesting is too deep." }); return; }
    for (const block of items) {
      if (ids.has(block.id)) context.addIssue({ code: "custom", message: "Block identifiers must be unique." });
      ids.add(block.id);
      if (block.type === "table" && (!block.content || Array.isArray(block.content))) context.addIssue({ code: "custom", message: "Invalid table content." });
      if (block.type !== "table" && block.content && !Array.isArray(block.content)) context.addIssue({ code: "custom", message: "Invalid block content." });
      visit(block.children, depth + 1);
    }
  }
  visit(blocks, 0);
  if (ids.size > 3000) context.addIssue({ code: "custom", message: "Too many content blocks." });
});

export function flattenCourseBlocks(blocks: readonly CourseBlock[]): CourseBlock[] {
  return blocks.flatMap(block => [block, ...flattenCourseBlocks(block.children)]);
}
export function inlineText(content: CourseInline[]): string { return content.map(part => part.type === "text" ? part.text : inlineText(part.content)).join(""); }
export function courseBlockText(block: CourseBlock): string {
  if (Array.isArray(block.content)) return inlineText(block.content);
  if (block.content) return block.content.rows.map(row => row.cells.map(cell => inlineText(Array.isArray(cell) ? cell : cell.content)).join(" ")).join(" ");
  return block.props.caption || block.props.name || `${block.type[0].toUpperCase()}${block.type.slice(1)}`;
}

// Keep the old annotation identifiers during conversion. They no longer depend on position.
export function legacyCourseBlocks(sections: readonly (CourseContentSection & { id: string })[]): CourseBlock[] {
  const blocks: CourseBlock[] = [];
  const text = (value: string): CourseInline[] => [{ type: "text", text: value, styles: {} }];
  for (const section of sections) {
    const add = (suffix: string, type: CourseBlock["type"], content?: CourseInline[], props: CourseBlock["props"] = {}) => blocks.push({ id: `${section.id}:${suffix}`, type, props, content, children: [] });
    if (section.heading) add("heading", "heading", text(section.heading), { level: 2 });
    section.paragraphs?.forEach((paragraph, i) => add(`paragraph:${i}`, "paragraph", typeof paragraph === "string" ? text(paragraph) : paragraph.content.flatMap(part => typeof part === "string" ? text(part) : [{ type: "link" as const, href: part.href, content: text(part.label) as z.infer<typeof textSchema>[] }])));
    if (section.video) add("video", "video", undefined, { url: section.video.url, caption: section.video.title || "", name: section.video.title || "Video" });
    section.steps?.forEach((value, i) => add(`step:${i}`, "numberedListItem", text(value)));
    section.items?.forEach((value, i) => add(`item:${i}`, "bulletListItem", text(value)));
    if (section.note) add("note", "quote", text(section.note));
    if (section.image) {
      add("image", "image", undefined, { url: section.image.src, name: section.image.alt, caption: section.image.caption, previewWidth: section.image.width });
      if (section.image.source) add("source", "paragraph", [{ type: "link", href: section.image.source, content: [{ type: "text", text: "Source", styles: {} }] }]);
    }
    section.links?.forEach((link, i) => add(`link:${i}`, "paragraph", [{ type: "link", href: link.href, content: [{ type: "text", text: link.label, styles: {} }] }]));
  }
  return blocks;
}

export function courseMediaIds(value: unknown): string[] {
  const ids = new Set<string>();
  function visit(item: unknown) {
    if (typeof item === "string") {
      const match = item.match(/^\/api\/course\/media\/([a-f0-9-]{36})$/);
      if (match) ids.add(match[1]);
    } else if (Array.isArray(item)) item.forEach(visit);
    else if (item && typeof item === "object") Object.values(item).forEach(visit);
  }
  visit(value);
  return [...ids];
}
