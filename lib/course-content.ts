import "server-only";

import { MongoClient, type Collection } from "mongodb";
import { z } from "zod";
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
  url: z.string().url().max(2048).refine((value) => value.startsWith("https://"), {
    message: "Video URLs must use HTTPS."
  }),
  title: z.string().max(160).optional(),
  captionsUrl: z.string().url().max(2048).refine((value) => value.startsWith("https://"), {
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
    source: z.string().min(1).max(2048),
    wide: z.boolean().optional()
  }).optional(),
  video: videoSchema.optional()
});

const coursePageSchema = z.object({
  slug: z.string().min(1).max(80).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  title: z.string().min(1).max(160),
  description: z.string().min(1).max(500),
  outcome: z.string().min(1).max(500).optional(),
  content: z.array(sectionSchema).max(50)
});

const newCoursePageSchema = coursePageSchema.pick({
  slug: true,
  title: true,
  description: true,
  outcome: true
}).refine((page) => page.slug !== "introduction", {
  message: "The introduction slug is reserved.",
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

type CoursePageInput = z.infer<typeof coursePageSchema>;

type CoursePageDocument = CoursePageInput & {
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
  return seedDocuments().map(toCoursePageRecord);
}

function getCourseCollection(): Collection<CoursePageDocument> | null {
  const uri = process.env.MONGODB_URL?.trim();

  if (!uri) return null;

  const client = globalForCourseContent.courseMongoClient ?? new MongoClient(uri, {
    serverSelectionTimeoutMS: 10000
  });
  globalForCourseContent.courseMongoClient = client;

  return client
    .db(process.env.MONGODB_DB || "tomzaragoza")
    .collection<CoursePageDocument>("x_ads_course_pages");
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

function toCoursePageRecord(document: CoursePageDocument): CoursePageRecord {
  return {
    slug: document.slug,
    path: coursePathForSlug(document.slug),
    title: document.title,
    description: document.description,
    outcome: document.outcome,
    content: document.content
  };
}

export function validateCoursePage(value: unknown): CoursePageInput {
  return coursePageSchema.parse(value);
}

export async function getCoursePages(): Promise<CoursePageRecord[]> {
  const collection = getCourseCollection();

  if (!collection) return fallbackPages();

  try {
    await ensureCourseSeeded(collection);
    const documents = await collection.find().sort({ order: 1 }).toArray();
    return documents.map(toCoursePageRecord);
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
  return pages.map(({ slug, path, title, description }) => ({ slug, path, title, description }));
}

export async function getAdminCoursePages() {
  const collection = getCourseCollection();

  if (!collection) {
    throw new Error("Course database is not configured.");
  }

  await ensureCourseSeeded(collection);
  const documents = await collection.find().sort({ order: 1 }).toArray();
  return documents.map(toCoursePageRecord);
}

export async function saveCoursePage(value: unknown) {
  const input = validateCoursePage(value);
  const collection = getCourseCollection();

  if (!collection) {
    throw new Error("Course database is not configured.");
  }

  await ensureCourseSeeded(collection);
  const existing = await collection.findOne({ slug: input.slug });

  if (!existing) {
    throw new Error("Unknown course page.");
  }

  const document: CoursePageDocument = {
    ...input,
    order: existing.order,
    updatedAt: new Date()
  };

  await collection.replaceOne({ slug: input.slug }, document);
  return toCoursePageRecord(document);
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

  const lastPage = await collection.findOne({}, {
    sort: { order: -1 },
    projection: { order: 1 }
  });
  const document: CoursePageDocument = {
    ...input,
    content: [],
    order: (lastPage?.order ?? -1) + 1,
    updatedAt: new Date()
  };

  await collection.insertOne(document);
  return toCoursePageRecord(document);
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
  const { collection, existing } = await getExistingCourseDocument(input.slug);
  const document: CoursePageDocument = {
    ...existing,
    ...input,
    updatedAt: new Date()
  };

  await collection.replaceOne({ slug: input.slug }, document);
  return toCoursePageRecord(document);
}

export async function updateCoursePageContent(value: unknown) {
  const input = coursePageContentSchema.parse(value);
  const { collection, existing } = await getExistingCourseDocument(input.slug);
  const document: CoursePageDocument = {
    ...existing,
    content: input.content,
    updatedAt: new Date()
  };

  await collection.replaceOne({ slug: input.slug }, document);
  return toCoursePageRecord(document);
}
