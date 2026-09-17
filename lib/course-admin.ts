import "server-only";

import { headers } from "next/headers";
import { isCourseAdminEmail } from "@/lib/course-admin-policy";
import { getGoogleAuth } from "@/lib/google-auth";

export type CourseAdminAccess =
  | { status: "authorized"; name: string | null }
  | { status: "signed-out" }
  | { status: "forbidden" };

export async function getCourseAdminAccess(requestHeaders?: Headers): Promise<CourseAdminAccess> {
  const auth = getGoogleAuth();

  if (!auth) return { status: "signed-out" };

  try {
    const session = await auth.api.getSession({
      headers: requestHeaders ?? await headers()
    });

    if (!session) return { status: "signed-out" };
    if (!isCourseAdminEmail(session.user.email)) return { status: "forbidden" };

    return {
      status: "authorized",
      name: session.user.name ?? null
    };
  } catch {
    return { status: "signed-out" };
  }
}

export function courseAdminErrorResponse(access: CourseAdminAccess) {
  if (access.status === "signed-out") {
    return Response.json({ error: "Sign in is required." }, { status: 401 });
  }

  return Response.json({ error: "Forbidden" }, { status: 403 });
}
