import { revalidatePath } from "next/cache";
import { isAdminAuthorized, unauthorizedResponse } from "@/lib/auth";
import { getAdminCoursePages, saveCoursePage } from "@/lib/course-content";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!isAdminAuthorized(request)) return unauthorizedResponse();

  try {
    return Response.json({ pages: await getAdminCoursePages() });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load course pages.";
    return Response.json({ error: message }, { status: 503 });
  }
}

export async function PUT(request: Request) {
  if (!isAdminAuthorized(request)) return unauthorizedResponse();

  try {
    const page = await saveCoursePage(await request.json());
    revalidatePath(page.path);
    revalidatePath("/x-ads");
    return Response.json({ page });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid course page.";
    return Response.json({ error: message }, { status: 400 });
  }
}
