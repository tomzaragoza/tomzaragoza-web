import { getGoogleAuth } from "@/lib/google-auth";
import { getCourseAccess } from "@/lib/course-access";
import { canViewCourseLessons } from "@/lib/course-access-policy";
import { getCoursePageBySlug } from "@/lib/course-content";
import { getWatchProgress, resolveWatchTarget, saveWatchProgress } from "@/lib/course-watch";
import { watchTargetSchema, watchUpdateSchema } from "@/lib/course-watch-shared";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function viewer(request: Request) {
  const session = await getGoogleAuth()?.api.getSession({ headers: request.headers });
  if (!session) return null;
  if (!canViewCourseLessons(await getCourseAccess(request.headers))) return null;
  return session.user;
}

export async function GET(request: Request) {
  try {
    const user = await viewer(request);
    if (!user) return Response.json({ error: "Course access is required." }, { status: 403 });
    const parsed = watchTargetSchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
    if (!parsed.success) return Response.json({ error: "Invalid video." }, { status: 400 });
    const page = await getCoursePageBySlug(parsed.data.pageSlug);
    if (!page || !resolveWatchTarget(page, parsed.data)) return Response.json({ error: "Unknown video." }, { status: 404 });
    return Response.json({ progress: await getWatchProgress(user.id, parsed.data) }, { headers: { "Cache-Control": "private, no-store" } });
  } catch {
    return Response.json({ error: "Watch progress is unavailable." }, { status: 503 });
  }
}

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) return Response.json({ error: "Invalid request origin." }, { status: 403 });
  try {
    const user = await viewer(request);
    if (!user) return Response.json({ error: "Course access is required." }, { status: 403 });
    const raw = await request.text();
    if (raw.length > 12000) return Response.json({ error: "Progress update is too large." }, { status: 413 });
    let body: unknown;
    try { body = JSON.parse(raw); } catch { return Response.json({ error: "Invalid progress." }, { status: 400 }); }
    const parsed = watchUpdateSchema.safeParse(body);
    if (!parsed.success) return Response.json({ error: "Invalid progress." }, { status: 400 });
    const page = await getCoursePageBySlug(parsed.data.pageSlug);
    if (!page || !resolveWatchTarget(page, parsed.data)) return Response.json({ error: "Unknown video." }, { status: 404 });
    return Response.json({ progress: await saveWatchProgress(user, page, parsed.data) }, { headers: { "Cache-Control": "private, no-store" } });
  } catch {
    return Response.json({ error: "Watch progress could not be saved." }, { status: 503 });
  }
}
