import { getCourseAdminAccess } from "@/lib/course-admin";
import {
  countAllUnreadCourseAnnotations,
  countPrivateUnreadCourseAnnotations
} from "@/lib/course-annotations";
import {
  countAllUnreadCourseMessageThreads,
  countPrivateUnreadCourseMessageThreads,
  getCourseMessagingUser
} from "@/lib/course-messages";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const wantsAdminCount = url.searchParams.get("scope") === "admin";

  try {
    if (wantsAdminCount) {
      const access = await getCourseAdminAccess(request.headers);
      if (access.status !== "authorized") {
        return Response.json({ error: "Course administration is required." }, { status: 403 });
      }

      const [notes, annotations] = await Promise.all([
        countAllUnreadCourseMessageThreads(),
        countAllUnreadCourseAnnotations()
      ]);
      return Response.json({ count: notes + annotations });
    }

    const user = await getCourseMessagingUser(request.headers);
    if (!user) return Response.json({ error: "Pro access is required." }, { status: 403 });

    const [notes, annotations] = await Promise.all([
      countPrivateUnreadCourseMessageThreads(user.id),
      countPrivateUnreadCourseAnnotations(user.id)
    ]);
    return Response.json({ count: notes + annotations });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load messages.";
    return Response.json({ error: message }, { status: 503 });
  }
}
