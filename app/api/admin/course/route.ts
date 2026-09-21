import { revalidatePath } from "next/cache";
import { courseAdminErrorResponse, getCourseAdminAccess } from "@/lib/course-admin";
import {
  createCoursePage,
  saveCourseDraft,
  publishCoursePage,
  getAdminCoursePages,
  reorderCoursePages,
  saveCourseStructure,
  saveCoursePage,
  updateCoursePageContent,
  updateCoursePageDetails
} from "@/lib/course-content";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const access = await getCourseAdminAccess(request.headers);
  if (access.status !== "authorized") return courseAdminErrorResponse(access);

  try {
    return Response.json({ pages: await getAdminCoursePages() });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load course pages.";
    return Response.json({ error: message }, { status: 503 });
  }
}

export async function POST(request: Request) {
  if (request.headers.get("origin") && request.headers.get("origin") !== new URL(request.url).origin) return Response.json({ error: "Invalid request origin." }, { status: 403 });
  const access = await getCourseAdminAccess(request.headers);
  if (access.status !== "authorized") return courseAdminErrorResponse(access);

  try {
    const page = await createCoursePage(await request.json());
    revalidatePath("/x-ads");
    revalidatePath(page.path);
    return Response.json({ page }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid course page.";
    return Response.json({ error: message }, { status: 400 });
  }
}

export async function PUT(request: Request) {
  if (request.headers.get("origin") && request.headers.get("origin") !== new URL(request.url).origin) return Response.json({ error: "Invalid request origin." }, { status: 403 });
  const access = await getCourseAdminAccess(request.headers);
  if (access.status !== "authorized") return courseAdminErrorResponse(access);

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

export async function PATCH(request: Request) {
  if (request.headers.get("origin") && request.headers.get("origin") !== new URL(request.url).origin) return Response.json({ error: "Invalid request origin." }, { status: 403 });
  const access = await getCourseAdminAccess(request.headers);
  if (access.status !== "authorized") return courseAdminErrorResponse(access);

  try {
    const body = await request.json();
    if (body.kind === "order" || body.kind === "structure") {
      const pages = body.kind === "structure" ? await saveCourseStructure(body) : await reorderCoursePages(body);
      revalidatePath("/x-ads", "layout");
      return Response.json({ pages });
    }

    const page = body.kind === "draft"
      ? await saveCourseDraft(body)
      : body.kind === "publish"
        ? await publishCoursePage(body)
        : body.kind === "details"
      ? await updateCoursePageDetails(body)
      : body.kind === "content"
        ? await updateCoursePageContent(body)
        : null;

    if (!page) {
      return Response.json({ error: "Unknown course update type." }, { status: 400 });
    }

    revalidatePath(page.path);
    revalidatePath("/x-ads");
    return Response.json({ page });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid course page.";
    return Response.json({ error: message }, { status: 400 });
  }
}
