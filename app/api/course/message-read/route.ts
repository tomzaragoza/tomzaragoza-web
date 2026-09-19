import { z } from "zod";
import { markStudentCourseAnnotationRead } from "@/lib/course-annotations";
import {
  getCourseMessagingUser,
  markStudentCourseThreadRead
} from "@/lib/course-messages";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const readSchema = z.object({
  source: z.enum(["note", "annotation"]),
  threadId: z.string().min(1).max(100)
});

export async function PATCH(request: Request) {
  const requestUrl = new URL(request.url);
  const requestOrigin = request.headers.get("origin");
  if (requestOrigin && requestOrigin !== requestUrl.origin) {
    return Response.json({ error: "Invalid request origin." }, { status: 403 });
  }

  const user = await getCourseMessagingUser(request.headers);
  if (!user) return Response.json({ error: "Pro access is required." }, { status: 403 });

  try {
    const input = readSchema.parse(await request.json());
    const thread = input.source === "annotation"
      ? await markStudentCourseAnnotationRead(user, input.threadId)
      : await markStudentCourseThreadRead(user, input.threadId);
    return Response.json({ thread });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to mark the message as viewed.";
    return Response.json({ error: message }, { status: 400 });
  }
}
