import "server-only";

const COMPLIMENTARY_COURSE_EMAILS = new Set([
  "tomdzaragoza@gmail.com"
]);

export function hasComplimentaryCourseAccess(email: string | null | undefined) {
  return COMPLIMENTARY_COURSE_EMAILS.has(email?.trim().toLowerCase() ?? "");
}
