import { z } from "zod";

const slugSchema = z.string().min(1).max(80).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
export const courseStructureItemSchema = z.object({
  slug: slugSchema,
  pageKind: z.enum(["page", "group"]),
  parentSlug: slugSchema.nullable()
});
export const courseStructureSchema = z.array(courseStructureItemSchema).min(1).max(500);
export type CourseStructureItem = z.infer<typeof courseStructureItemSchema>;
type StructurePage = { slug: string; pageKind?: "page" | "group"; parentSlug?: string | null };

export function courseStructure(pages: readonly StructurePage[]): CourseStructureItem[] {
  return pages.map(page => ({ slug: page.slug, pageKind: page.pageKind ?? "page", parentSlug: page.parentSlug ?? null }));
}

export function validateCourseStructure(value: unknown, slugs: readonly string[]) {
  const items = courseStructureSchema.parse(value);
  const bySlug = new Map(items.map(item => [item.slug, item]));
  if (bySlug.size !== items.length || items.length !== slugs.length || slugs.some(slug => !bySlug.has(slug))) {
    throw new Error("The course structure must include every page exactly once. Reload and try again.");
  }
  if (items[0].slug !== "introduction" || items[0].pageKind !== "page" || items[0].parentSlug) {
    throw new Error("Overview must remain the first top-level page.");
  }
  let currentRoot = "";
  for (const item of items) {
    if (!item.parentSlug) { currentRoot = item.slug; continue; }
    const parent = bySlug.get(item.parentSlug);
    if (item.pageKind === "group" || !parent || parent.pageKind !== "group" || parent.parentSlug || item.parentSlug !== currentRoot) {
      throw new Error("Pages must follow their group. Groups cannot be nested.");
    }
  }
  return items;
}

// Also handles older pages and pages created after the saved structure.
// Published children of an unpublished group stay accessible at the top level.
export function arrangeCoursePages<T extends StructurePage>(pages: readonly T[], saved: readonly CourseStructureItem[] = []): T[] {
  const bySlug = new Map(pages.map(page => [page.slug, page]));
  const ordered = [...saved.filter(item => bySlug.has(item.slug)).map(item => ({ ...bySlug.get(item.slug)!, ...item })),
    ...pages.filter(page => !saved.some(item => item.slug === page.slug))];
  const groups = new Set(ordered.filter(page => page.pageKind === "group" && !page.parentSlug).map(page => page.slug));
  const normalized = ordered.map(page => ({ ...page, pageKind: page.pageKind ?? "page", parentSlug: page.pageKind !== "group" && page.parentSlug && groups.has(page.parentSlug) ? page.parentSlug : null }));
  const roots = normalized.filter(page => !page.parentSlug);
  roots.sort((a, b) => a.slug === "introduction" ? -1 : b.slug === "introduction" ? 1 : 0);
  return roots.flatMap(root => [root, ...normalized.filter(page => page.parentSlug === root.slug)]);
}

export type CourseDropPosition = "before" | "inside" | "after";
export function moveCoursePage<T extends StructurePage>(pages: readonly T[], slug: string, targetSlug: string, position: CourseDropPosition): T[] {
  const page = pages.find(item => item.slug === slug);
  const target = pages.find(item => item.slug === targetSlug);
  if (!page || !target || slug === "introduction" || slug === targetSlug || target.parentSlug === slug) return [...pages];
  if (target.slug === "introduction" && position !== "after") return [...pages];
  if (position === "inside" && (target.pageKind !== "group" || page.pageKind === "group")) return [...pages];
  const moving = pages.filter(item => item.slug === slug || item.parentSlug === slug);
  const remaining = pages.filter(item => !moving.includes(item));
  // A group always moves as a unit between other top-level entries.
  const anchor = page.pageKind === "group" && target.parentSlug ? pages.find(item => item.slug === target.parentSlug)! : target;
  const parentSlug = page.pageKind === "group" ? null : position === "inside" ? target.slug : anchor.parentSlug ?? null;
  let index = remaining.findIndex(item => item.slug === anchor.slug);
  if (position !== "before") {
    index += 1;
    while (index < remaining.length && remaining[index].parentSlug === anchor.slug) index += 1;
  }
  remaining.splice(index, 0, ...moving.map(item => item.slug === slug ? { ...item, parentSlug } : item));
  return remaining;
}
