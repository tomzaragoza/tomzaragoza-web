"use client";

import { useEffect } from "react";
import posthog from "posthog-js";
import { authClient } from "@/lib/auth-client";

export function PostHogIdentity() {
  const { data: session, isPending, error } = authClient.useSession();
  const userId = session?.user.id;

  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_POSTHOG_KEY || isPending || error) return;

    const previousUserId = posthog.get_property("$user_id");

    // Reset after sign-out or an account change, but retain anonymous visitors.
    if (previousUserId && previousUserId !== userId) {
      posthog.reset();
    }

    if (userId && previousUserId !== userId) {
      posthog.identify(userId);
      posthog.reloadFeatureFlags();
    }
  }, [userId, isPending, error]);

  return null;
}
