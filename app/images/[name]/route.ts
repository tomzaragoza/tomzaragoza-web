import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { getCourseAccess } from "@/lib/course-access";
import { canViewCourseLessons } from "@/lib/course-access-policy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const lessonImages = new Set([
  "tracking-methods.png",
  "tracking-base-code.png",
  "tracking-create-event.gif",
  "tracking-event-status.png",
  "launch-1.png",
  "launch-locations.png",
  "launch-advanced-targeting.gif",
  "launch-conversion.png"
]);
const privateHeaders = { "Cache-Control": "private, no-store", Vary: "Cookie" };

export async function GET(request: Request, { params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  if (!lessonImages.has(name)) return new Response(null, { status: 404, headers: privateHeaders });
  if (!canViewCourseLessons(await getCourseAccess(request.headers))) {
    return new Response(null, { status: 403, headers: privateHeaders });
  }

  try {
    const image = await readFile(join(process.cwd(), "private", "course-images", name));
    return new Response(new Uint8Array(image), {
      headers: { ...privateHeaders, "Content-Type": name.endsWith(".gif") ? "image/gif" : "image/png" }
    });
  } catch {
    return Response.json({ error: "Image is temporarily unavailable." }, { status: 503, headers: privateHeaders });
  }
}
