import { z } from "zod";
import {
  addStudentCourseAnnotationReply,
  createCourseAnnotation,
  deleteFirstCourseAnnotationMessage,
  getPrivateCourseAnnotations,
  type CourseAnnotationTarget
} from "@/lib/course-annotations";
import { getCoursePageBySlug } from "@/lib/course-content";
import type { CourseParagraph } from "@/lib/course-content-shared";
import { getCourseMessagingUser } from "@/lib/course-messages";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const pageSlugSchema = z.string().min(1).max(80).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
const blockIdSchema = z.string().min(1).max(160).regex(
  /^[a-zA-Z0-9_-]+:(?:heading|paragraph:\d+|step:\d+|item:\d+)$/
);

const createSchema = z.object({
  action: z.literal("create"),
  pageSlug: pageSlugSchema,
  blockId: blockIdSchema,
  quote: z.string().max(1000).nullable().optional(),
  body: z.string().trim().min(1).max(2000)
});

const replySchema = z.object({
  action: z.literal("reply"),
  threadId: z.string().min(1).max(100),
  body: z.string().trim().min(1).max(2000)
});

const postSchema = z.discriminatedUnion("action", [createSchema, replySchema]);

function normalizeText(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function paragraphText(paragraph: CourseParagraph) {
  if (typeof paragraph === "string") return paragraph;
  return paragraph.content
    .map((part) => typeof part === "string" ? part : part.label)
    .join("");
}

async function getAnnotationTarget(
  pageSlug: string,
  blockId: string,
  rawQuote?: string | null
): Promise<CourseAnnotationTarget | null> {
  const page = await getCoursePageBySlug(pageSlug);
  if (!page) return null;

  const separator = blockId.indexOf(":");
  const sectionId = blockId.slice(0, separator);
  const blockPath = blockId.slice(separator + 1);
  const section = page.content.find((item) => item.id === sectionId);
  if (!section) return null;

  let context: string | undefined;
  if (blockPath === "heading") {
    context = section.heading;
  } else {
    const [kind, indexText] = blockPath.split(":");
    const index = Number(indexText);
    if (!Number.isSafeInteger(index) || index < 0) return null;
    if (kind === "paragraph") {
      const paragraph = section.paragraphs?.[index];
      context = paragraph === undefined ? undefined : paragraphText(paragraph);
    } else if (kind === "step") {
      context = section.steps?.[index];
    } else if (kind === "item") {
      context = section.items?.[index];
    }
  }

  const normalizedContext = context ? normalizeText(context) : "";
  if (!normalizedContext) return null;

  const quote = rawQuote ? normalizeText(rawQuote) : null;
  if (quote && !normalizedContext.includes(quote)) return null;

  return {
    pageTitle: page.title,
    sectionId,
    sectionHeading: section.heading?.trim() || "Course section",
    blockId,
    context: normalizedContext,
    quote
  };
}

export async function GET(request: Request) {
  const user = await getCourseMessagingUser(request.headers);
  if (!user) return Response.json({ error: "Pro access is required." }, { status: 403 });

  try {
    const pageSlug = pageSlugSchema.parse(new URL(request.url).searchParams.get("pageSlug"));
    const page = await getCoursePageBySlug(pageSlug);
    if (!page) return Response.json({ error: "Unknown course page." }, { status: 404 });

    return Response.json({ threads: await getPrivateCourseAnnotations(user, pageSlug) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load comments.";
    return Response.json({ error: message }, { status: 400 });
  }
}

export async function POST(request: Request) {
  const requestUrl = new URL(request.url);
  const requestOrigin = request.headers.get("origin");
  if (requestOrigin && requestOrigin !== requestUrl.origin) {
    return Response.json({ error: "Invalid request origin." }, { status: 403 });
  }

  const user = await getCourseMessagingUser(request.headers);
  if (!user) return Response.json({ error: "Pro access is required." }, { status: 403 });

  try {
    const input = postSchema.parse(await request.json());
    if (input.action === "reply") {
      const thread = await addStudentCourseAnnotationReply({
        user,
        threadId: input.threadId,
        body: input.body
      });
      return Response.json({ thread }, { status: 201 });
    }

    const target = await getAnnotationTarget(input.pageSlug, input.blockId, input.quote);
    if (!target) {
      return Response.json({ error: "This text is no longer available." }, { status: 404 });
    }

    const thread = await createCourseAnnotation({
      user,
      target,
      pageSlug: input.pageSlug,
      body: input.body
    });
    return Response.json({ thread }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to send the comment.";
    return Response.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  const requestUrl = new URL(request.url);
  const requestOrigin = request.headers.get("origin");
  if (requestOrigin && requestOrigin !== requestUrl.origin) {
    return Response.json({ error: "Invalid request origin." }, { status: 403 });
  }

  const user = await getCourseMessagingUser(request.headers);
  if (!user) return Response.json({ error: "Pro access is required." }, { status: 403 });

  try {
    const input = z.object({
      threadId: z.string().min(1).max(100)
    }).parse(await request.json());
    return Response.json(await deleteFirstCourseAnnotationMessage({
      user,
      threadId: input.threadId
    }));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to delete the comment.";
    return Response.json({ error: message }, { status: 400 });
  }
}
