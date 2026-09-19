import { z } from "zod";
import { courseAdminErrorResponse, getCourseAdminAccess } from "@/lib/course-admin";
import {
  addAdminCourseAnnotationReply,
  getAdminCourseAnnotationThreads,
  markAdminCourseAnnotationRead
} from "@/lib/course-annotations";
import {
  addAdminCourseReply,
  getAdminCourseThreads,
  markAdminCourseThreadRead
} from "@/lib/course-messages";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const replySchema = z.object({
  source: z.enum(["note", "annotation"]),
  threadId: z.string().min(1).max(100),
  body: z.string().trim().min(1).max(2000)
});

const readSchema = replySchema.omit({ body: true });

export async function GET(request: Request) {
  const access = await getCourseAdminAccess(request.headers);
  if (access.status !== "authorized") return courseAdminErrorResponse(access);

  try {
    const [noteThreads, annotationThreads] = await Promise.all([
      getAdminCourseThreads(),
      getAdminCourseAnnotationThreads()
    ]);
    const threads = [...noteThreads, ...annotationThreads]
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    return Response.json({ threads });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load conversations.";
    return Response.json({ error: message }, { status: 503 });
  }
}

export async function POST(request: Request) {
  const requestUrl = new URL(request.url);
  const requestOrigin = request.headers.get("origin");
  if (requestOrigin && requestOrigin !== requestUrl.origin) {
    return Response.json({ error: "Invalid request origin." }, { status: 403 });
  }

  const access = await getCourseAdminAccess(request.headers);
  if (access.status !== "authorized") return courseAdminErrorResponse(access);

  try {
    const input = replySchema.parse(await request.json());
    const thread = input.source === "annotation"
      ? await addAdminCourseAnnotationReply(input.threadId, input.body)
      : await addAdminCourseReply(input.threadId, input.body);
    return Response.json({ thread }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to send the reply.";
    return Response.json({ error: message }, { status: 400 });
  }
}

export async function PATCH(request: Request) {
  const requestUrl = new URL(request.url);
  const requestOrigin = request.headers.get("origin");
  if (requestOrigin && requestOrigin !== requestUrl.origin) {
    return Response.json({ error: "Invalid request origin." }, { status: 403 });
  }

  const access = await getCourseAdminAccess(request.headers);
  if (access.status !== "authorized") return courseAdminErrorResponse(access);

  try {
    const input = readSchema.parse(await request.json());
    const thread = input.source === "annotation"
      ? await markAdminCourseAnnotationRead(input.threadId)
      : await markAdminCourseThreadRead(input.threadId);
    return Response.json({ thread });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to mark the message as viewed.";
    return Response.json({ error: message }, { status: 400 });
  }
}
