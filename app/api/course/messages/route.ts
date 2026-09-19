import { z } from "zod";
import { getCoursePageBySlug } from "@/lib/course-content";
import {
  addStudentCourseMessage,
  getCourseMessagingUser,
  getPrivateCourseThread
} from "@/lib/course-messages";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const targetSchema = z.object({
  pageSlug: z.string().min(1).max(80).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  sectionId: z.string().min(1).max(100).regex(/^[a-zA-Z0-9_-]+$/)
});

const messageSchema = targetSchema.extend({
  body: z.string().trim().min(1).max(2000)
});

async function getMessageTarget(pageSlug: string, sectionId: string) {
  const page = await getCoursePageBySlug(pageSlug);
  const section = page?.content.find((item) => item.id === sectionId);

  if (!page || !section?.note) return null;

  return {
    pageTitle: page.title,
    sectionHeading: section.heading?.trim() || "Course note",
    note: section.note
  };
}

export async function GET(request: Request) {
  const user = await getCourseMessagingUser(request.headers);
  if (!user) return Response.json({ error: "Pro access is required." }, { status: 403 });

  try {
    const url = new URL(request.url);
    const input = targetSchema.parse({
      pageSlug: url.searchParams.get("pageSlug"),
      sectionId: url.searchParams.get("sectionId")
    });
    const target = await getMessageTarget(input.pageSlug, input.sectionId);

    if (!target) {
      return Response.json({ error: "Unknown course message card." }, { status: 404 });
    }

    const thread = await getPrivateCourseThread(user, input.pageSlug, input.sectionId);
    return Response.json({ thread });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load the conversation.";
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
    const input = messageSchema.parse(await request.json());
    const target = await getMessageTarget(input.pageSlug, input.sectionId);

    if (!target) {
      return Response.json({ error: "Unknown course message card." }, { status: 404 });
    }

    const thread = await addStudentCourseMessage({
      user,
      pageSlug: input.pageSlug,
      sectionId: input.sectionId,
      body: input.body,
      ...target
    });
    return Response.json({ thread }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to send the message.";
    return Response.json({ error: message }, { status: 400 });
  }
}
