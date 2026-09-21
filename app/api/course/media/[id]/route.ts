import { getCourseAccess } from "@/lib/course-access";
import { canViewCourseLessons } from "@/lib/course-access-policy";
import { getCourseAdminAccess } from "@/lib/course-admin";
import { courseMediaIds } from "@/lib/course-blocks";
import { getCoursePageBySlug } from "@/lib/course-content";
import { courseMediaCollection, courseMediaReadUrl } from "@/lib/course-media";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[a-f0-9-]{36}$/.test(id)) return new Response(null, { status: 404 });
  const admin = await getCourseAdminAccess(request.headers);
  if (admin.status !== "authorized" && !canViewCourseLessons(await getCourseAccess(request.headers))) return new Response(null, { status: 403 });
  try {
    const media = await courseMediaCollection().findOne({ id, status: "ready" });
    if (!media) return new Response(null, { status: 404 });
    if (admin.status !== "authorized") {
      const page = await getCoursePageBySlug(media.pageSlug);
      if (!page || !courseMediaIds({ blocks: page.blocks, mainVideo: page.mainVideo }).includes(id)) return new Response(null, { status: 404 });
    }
    return new Response(null, { status: 307, headers: { Location: await courseMediaReadUrl(media), "Cache-Control": "private, no-store", "Referrer-Policy": "no-referrer" } });
  } catch {
    return Response.json({ error: "Media is temporarily unavailable." }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
