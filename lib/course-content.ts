import "server-only";

import { MongoClient, type Collection } from "mongodb";
import { z } from "zod";
import { courseBlocksSchema, legacyCourseBlocks } from "@/lib/course-blocks";
import { assertCourseMediaReady } from "@/lib/course-media";
import { arrangeCoursePages, courseStructure, courseStructureSchema, validateCourseStructure, type CourseStructureItem } from "@/lib/course-structure";
import { courseNavigation, coursePages } from "@/app/x-ads/course-data";
import {
  coursePathForSlug,
  type CourseNavigationItem,
  type CoursePageRecord
} from "@/lib/course-content-shared";

const textLinkSchema = z.object({
  label: z.string().min(1).max(160),
  href: z.string().min(1).max(2048),
  external: z.boolean().optional()
});

const paragraphSchema = z.union([
  z.string().min(1).max(10000),
  z.object({
    content: z.array(z.union([z.string(), textLinkSchema])).min(1).max(100)
  })
]);

const videoSchema = z.object({
  url: z.string().max(2048).refine((value) => (value.startsWith("https://") || /^\/api\/course\/media\/[a-f0-9-]{36}$/.test(value)), {
    message: "Video URLs must use HTTPS."
  }),
  title: z.string().max(160).optional(),
  captionsUrl: z.string().max(2048).refine((value) => (value.startsWith("https://") || /^\/api\/course\/media\/[a-f0-9-]{36}$/.test(value)), {
    message: "Caption URLs must use HTTPS."
  }).optional()
});

const sectionSchema = z.object({
  id: z.string().min(1).max(100).regex(/^[a-zA-Z0-9_-]+$/),
  heading: z.string().max(200).optional(),
  paragraphs: z.array(paragraphSchema).max(50).optional(),
  items: z.array(z.string().min(1).max(2000)).max(50).optional(),
  steps: z.array(z.string().min(1).max(4000)).max(50).optional(),
  links: z.array(z.object({
    label: z.string().min(1).max(200),
    href: z.string().min(1).max(2048)
  })).max(30).optional(),
  note: z.string().max(5000).optional(),
  image: z.object({
    src: z.string().min(1).max(2048),
    alt: z.string().max(500),
    width: z.number().int().positive().max(10000),
    height: z.number().int().positive().max(10000),
    caption: z.string().max(1000),
    source: z.string().min(1).max(2048).optional(),
    wide: z.boolean().optional()
  }).optional(),
  video: videoSchema.optional()
});

const coursePageSchema = z.object({
  slug: z.string().min(1).max(80).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  title: z.string().min(1).max(160),
  description: z.string().min(1).max(500),
  outcome: z.string().min(1).max(500).optional(),
  blocks: courseBlocksSchema.optional(),
  mainVideo: videoSchema.nullable().optional(),
  content: z.array(sectionSchema).max(50)
});

const newCoursePageSchema = coursePageSchema.pick({
  slug: true,
  title: true,
  description: true,
  outcome: true
}).extend({
  pageKind: z.enum(["page", "group"]).default("page"),
  parentSlug: coursePageSchema.shape.slug.nullable().default(null)
}).refine((page) => !["introduction", "library", "messages", "checkout-complete"].includes(page.slug), {
  message: "This slug is reserved for a workspace page.",
  path: ["slug"]
});

const coursePageDetailsSchema = coursePageSchema.pick({
  slug: true,
  title: true,
  description: true,
  outcome: true
});

const coursePageContentSchema = coursePageSchema.pick({
  slug: true,
  content: true
});

const coursePageOrderSchema = z.object({
  slugs: z.array(coursePageSchema.shape.slug).min(1).max(100)
});

type CoursePageInput = z.infer<typeof coursePageSchema>;

type CoursePageDocument = CoursePageInput & {
  pageKind?: "page" | "group";
  parentSlug?: string | null;
  mediaCleanupUntil?: Date;
  mediaCleanupToken?: string;
  draft?: CoursePageInput;
  revision?: number;
  isPublished?: boolean;
  order: number;
  updatedAt: Date;
};

const globalForCourseContent = globalThis as typeof globalThis & {
  courseMongoClient?: MongoClient;
  courseSeedPromise?: Promise<void>;
};

function slugForPath(path: string) {
  return path === "/x-ads" ? "introduction" : path.replace("/x-ads/", "");
}

function seedDocuments(): CoursePageDocument[] {
  return courseNavigation.map((navigationItem, order) => {
    const page = coursePages.find((item) => item.path === navigationItem.path);

    if (!page) {
      throw new Error(`Missing course seed page: ${navigationItem.path}`);
    }

    const slug = slugForPath(page.path);
    const input = coursePageSchema.parse({
      slug,
      title: page.title,
      description: page.description,
      outcome: page.outcome,
      content: page.content.map((section, index) => ({
        ...section,
        id: section.id ?? `${slug}-section-${index + 1}`
      }))
    });

    return { ...input, order, updatedAt: new Date(0) };
  });
}

function fallbackPages() {
  return seedDocuments().map(document => toCoursePageRecord(document));
}

function getCourseCollection(): Collection<CoursePageDocument> | null {
  const uri = process.env.MONGODB_URL?.trim();

  if (!uri) return null;

  const client = globalForCourseContent.courseMongoClient ?? new MongoClient(uri, {
    ignoreUndefined: true,
    serverSelectionTimeoutMS: 10000
  });
  globalForCourseContent.courseMongoClient = client;

  return client
    .db(process.env.MONGODB_DB || "tomzaragoza")
    .collection<CoursePageDocument>("x_ads_course_pages");
}

type StructureDocument = { _id: string; items: CourseStructureItem[]; revision: number };
function getStructureCollection() {
  return globalForCourseContent.courseMongoClient!.db(process.env.MONGODB_DB || "tomzaragoza")
    .collection<StructureDocument>("x_ads_course_structure");
}

async function withCourseStructure(pages: CoursePageRecord[]) {
  const structure = await getStructureCollection().findOne({ _id: "course" });
  return arrangeCoursePages(pages, structure?.items);
}

async function ensureCourseSeeded(collection: Collection<CoursePageDocument>) {
  if (!globalForCourseContent.courseSeedPromise) {
    globalForCourseContent.courseSeedPromise = (async () => {
      await collection.createIndex({ slug: 1 }, { unique: true });
      const documents = seedDocuments();
      await collection.bulkWrite(
        documents.map((document) => ({
          updateOne: {
            filter: { slug: document.slug },
            update: { $setOnInsert: document },
            upsert: true
          }
        }))
      );
    })();
  }

  try {
    await globalForCourseContent.courseSeedPromise;
  } catch (error) {
    globalForCourseContent.courseSeedPromise = undefined;
    throw error;
  }
}

function toCoursePageRecord(stored: CoursePageDocument, admin = false): CoursePageRecord {
  const document = admin && stored.draft ? { ...stored, ...stored.draft } : stored;
  return {
    pageKind: stored.pageKind ?? "page",
    parentSlug: stored.parentSlug ?? null,
    blocks: document.blocks ?? legacyCourseBlocks(document.content),
    mainVideo: document.mainVideo ?? null,
    ...(admin ? { revision: stored.revision ?? 0, hasDraft: Boolean(stored.draft), isPublished: stored.isPublished !== false } : {}),
    slug: document.slug,
    path: coursePathForSlug(document.slug),
    title: document.title,
    description: document.description,
    outcome: document.outcome ?? undefined,
    content: document.content
  };
}

async function toAdminCoursePageRecord(document: CoursePageDocument) {
  const structure = await getStructureCollection().findOne({ _id: "course" });
  return { ...toCoursePageRecord(document, true), ...structure?.items.find(item => item.slug === document.slug) };
}

export function validateCoursePage(value: unknown): CoursePageInput {
  const input = coursePageSchema.parse(value);
  return { ...input, blocks: input.blocks ?? legacyCourseBlocks(input.content), mainVideo: input.mainVideo ?? null };
}

export async function getCoursePages(): Promise<CoursePageRecord[]> {
  const collection = getCourseCollection();

  if (!collection) return fallbackPages();

  try {
    await ensureCourseSeeded(collection);
    const documents = await collection.find({ isPublished: { $ne: false } }).sort({ order: 1 }).toArray();
    return await withCourseStructure(documents.map(document => toCoursePageRecord(document)));
  } catch {
    return fallbackPages();
  }
}

export async function getCoursePageBySlug(slug: string) {
  const pages = await getCoursePages();
  return pages.find((page) => page.slug === slug);
}

export async function getCourseNavigation(): Promise<CourseNavigationItem[]> {
  const pages = await getCoursePages();
  return pages.map(({ slug, path, title, description, pageKind, parentSlug }) => ({ slug, path, title, description, pageKind, parentSlug }));
}

export async function getAdminCoursePages() {
  const collection = getCourseCollection();

  if (!collection) {
    throw new Error("Course database is not configured.");
  }

  await ensureCourseSeeded(collection);
  const documents = await collection.find().sort({ order: 1 }).toArray();
  return withCourseStructure(documents.map(document => toCoursePageRecord(document, true)));
}

export async function saveCourseDraft(value: unknown) {
  const envelope = z.object({ revision: z.number().int().nonnegative() }).parse(value);
  const input = validateCoursePage(value);
  const { collection } = await getExistingCourseDocument(input.slug);
  await assertCourseMediaReady(input.slug, input);
  const document = await collection.findOneAndUpdate(
    { slug: input.slug, $and: [revisionFilter(envelope.revision), mediaWriteFilter()] },
    { $set: { draft: input, updatedAt: new Date() }, $inc: { revision: 1 } },
    { returnDocument: "after" }
  );
  if (!document) throw new Error("This page changed in another window or media cleanup is running. Reload before saving.");
  return toAdminCoursePageRecord(document);
}

function mediaWriteFilter() {
  return { $or: [{ mediaCleanupUntil: { $exists: false } }, { mediaCleanupUntil: { $lte: new Date() } }] };
}

function revisionFilter(revision: number) {
  return revision === 0 ? { $or: [{ revision: 0 }, { revision: { $exists: false } }] } : { revision };
}

export async function publishCoursePage(value: unknown) {
  const input = z.object({ slug: coursePageSchema.shape.slug, revision: z.number().int().nonnegative() }).parse(value);
  const { collection, existing } = await getExistingCourseDocument(input.slug);
  if (!existing.draft) throw new Error("Save a draft before publishing.");
  const draft = validateCoursePage(existing.draft);
  await assertCourseMediaReady(input.slug, draft);
  const document = await collection.findOneAndUpdate(
    { slug: input.slug, $and: [revisionFilter(input.revision), mediaWriteFilter()] },
    { $set: { ...draft, isPublished: true, updatedAt: new Date() }, $unset: { draft: "" }, $inc: { revision: 1 } },
    { returnDocument: "after" }
  );
  if (!document) throw new Error("This page changed in another window or media cleanup is running. Reload before publishing.");
  return toAdminCoursePageRecord(document);
}

// Legacy write endpoints also save drafts; none can bypass publishing.
export async function saveCoursePage(value: unknown) {
  const input = validateCoursePage(value);
  const { existing } = await getExistingCourseDocument(input.slug);
  return saveCourseDraft({ ...input, revision: existing.revision ?? 0 });
}

export async function createCoursePage(value: unknown) {
  const input = newCoursePageSchema.parse(value);
  const collection = getCourseCollection();

  if (!collection) {
    throw new Error("Course database is not configured.");
  }

  await ensureCourseSeeded(collection);

  if (await collection.findOne({ slug: input.slug })) {
    throw new Error("A course page already uses this slug.");
  }

  if (input.parentSlug) {
    const parent = (await getAdminCoursePages()).find(page => page.slug === input.parentSlug);
    if (input.pageKind === "group" || parent?.pageKind !== "group" || parent.parentSlug) {
      throw new Error("Select a top-level group for this page. Groups cannot be nested.");
    }
  }

  const lastPage = await collection.findOne({}, {
    sort: { order: -1 },
    projection: { order: 1 }
  });
  const document: CoursePageDocument = {
    ...input,
    content: [],
    blocks: [],
    draft: { ...input, content: [], blocks: [], mainVideo: null },
    revision: 0,
    isPublished: false,
    order: (lastPage?.order ?? -1) + 1,
    updatedAt: new Date()
  };

  await collection.insertOne(document);
  return toAdminCoursePageRecord(document);
}

export async function reorderCoursePages(value: unknown) {
  const input = coursePageOrderSchema.parse(value);
  const current = courseStructure(await getAdminCoursePages());
  return saveCourseStructure({ items: input.slugs.map(slug => current.find(item => item.slug === slug)), previous: current });
}

export async function saveCourseStructure(value: unknown) {
  const input = z.object({ items: courseStructureSchema, previous: courseStructureSchema }).parse(value);
  // Initialize once, then use a single atomic update for the entire hierarchy.
  await getAdminCoursePages();
  const collection = getStructureCollection();
  await collection.updateOne({ _id: "course" }, { $setOnInsert: { items: [], revision: 0 } }, { upsert: true });
  const stored = (await collection.findOne({ _id: "course" }))!;
  const currentPages = await getAdminCoursePages();
  if (JSON.stringify(courseStructure(currentPages)) !== JSON.stringify(input.previous)) {
    throw new Error("The course structure changed in another window. Reload before saving.");
  }
  const items = validateCourseStructure(input.items, currentPages.map(page => page.slug));
  const result = await collection.updateOne({ _id: "course", revision: stored.revision }, { $set: { items }, $inc: { revision: 1 } });
  if (!result.modifiedCount) throw new Error("The course structure changed in another window. Reload before saving.");
  return getAdminCoursePages();
}

async function getExistingCourseDocument(slug: string) {
  const collection = getCourseCollection();

  if (!collection) {
    throw new Error("Course database is not configured.");
  }

  await ensureCourseSeeded(collection);
  const existing = await collection.findOne({ slug });

  if (!existing) {
    throw new Error("Unknown course page.");
  }

  return { collection, existing };
}

export async function updateCoursePageDetails(value: unknown) {
  const input = coursePageDetailsSchema.parse(value);
  const { existing } = await getExistingCourseDocument(input.slug);
  return saveCourseDraft({ ...toCoursePageRecord(existing, true), ...input, revision: existing.revision ?? 0 });
}

export async function updateCoursePageContent(value: unknown) {
  const input = coursePageContentSchema.parse(value);
  const { existing } = await getExistingCourseDocument(input.slug);
  return saveCourseDraft({ ...toCoursePageRecord(existing, true), ...input, blocks: legacyCourseBlocks(input.content), revision: existing.revision ?? 0 });
}

export async function getAdminCoursePageBySlug(slug: string) {
  const page = (await getAdminCoursePages()).find(page => page.slug === slug);
  if (!page) throw new Error("Unknown course page.");
  return page;
}
