import { z } from "zod";
import { courseAdminErrorResponse, getCourseAdminAccess } from "@/lib/course-admin";
import { getAdminCoursePageBySlug } from "@/lib/course-content";
import { finishCourseUpload, startCourseUpload } from "@/lib/course-media";

export const runtime = "nodejs";
export async function POST(request: Request) {
  if (request.headers.get("origin") !== new URL(request.url).origin) return Response.json({ error: "Invalid request origin." }, { status: 403 });
  const access = await getCourseAdminAccess(request.headers);
  if (access.status !== "authorized") return courseAdminErrorResponse(access);
  try {
    const body = await request.json();
    if (body.action === "start") {
      const input = z.object({ pageSlug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(80), name: z.string().min(1).max(250), size: z.number().int().positive(), contentType: z.string().max(100), mainVideo: z.boolean().default(false) }).parse(body);
      await getAdminCoursePageBySlug(input.pageSlug);
      return Response.json(await startCourseUpload(input));
    }
    const input = z.object({ action: z.enum(["complete", "abort"]), id: z.string().uuid() }).parse(body);
    return Response.json({ url: await finishCourseUpload(input.id, input.action === "abort") });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to upload the file." }, { status: 400 });
  }
}
