import posthog from "posthog-js";

const projectToken = process.env.NEXT_PUBLIC_POSTHOG_KEY;

if (projectToken) {
  posthog.init(projectToken, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com",
    defaults: "2026-05-30",
    capture_pageview: "history_change",
    person_profiles: "identified_only",
    disable_session_recording: true,
    mask_all_text: true,
    mask_all_element_attributes: true,
    before_send: (event) => {
      // Admin pages contain access tokens and editable internal content.
      if (window.location.pathname === "/admin" || window.location.pathname.startsWith("/admin/")) {
        return null;
      }
      return event;
    }
  });
}
