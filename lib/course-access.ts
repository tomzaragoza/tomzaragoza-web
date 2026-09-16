import "server-only";

import { headers } from "next/headers";
import { hasComplimentaryCourseAccess } from "@/lib/course-access-policy";
import { getGoogleAuth } from "@/lib/google-auth";

export type CourseAccess = "signed-out" | "upgrade-required" | "full";

export async function getCourseAccess(): Promise<CourseAccess> {
  const auth = getGoogleAuth();

  if (!auth) {
    return "signed-out";
  }

  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session) {
      return "signed-out";
    }

    return hasComplimentaryCourseAccess(session.user.email)
      ? "full"
      : "upgrade-required";
  } catch {
    return "signed-out";
  }
}
