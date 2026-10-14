import "server-only";

import { headers } from "next/headers";
import { isCourseAdminEmail } from "@/lib/course-admin-policy";
import { getPurchasedCourseTier } from "@/lib/course-entitlements";
import { getGoogleAuth } from "@/lib/google-auth";
import type { PricingTier } from "@/lib/pricing-parity";

export type CourseAccess = "signed-out" | "upgrade-required" | "owner" | PricingTier;

export async function getCourseAccess(requestHeaders?: Headers): Promise<CourseAccess> {
  const auth = getGoogleAuth();

  if (!auth) {
    return "signed-out";
  }

  try {
    const session = await auth.api.getSession({
      headers: requestHeaders ?? await headers()
    });

    if (!session) {
      return "signed-out";
    }

    if (isCourseAdminEmail(session.user.email)) return "owner";

    return await getPurchasedCourseTier(
      session.user.id,
      session.user.emailVerified ? session.user.email : undefined
    ) ?? "upgrade-required";
  } catch {
    return "signed-out";
  }
}
