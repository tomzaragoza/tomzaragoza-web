import "server-only";

const COMPLIMENTARY_COURSE_EMAILS = new Set([
  "tomdzaragoza@gmail.com",
  "todazar@gmail.com"
]);

export function hasComplimentaryCourseAccess(email: string | null | undefined) {
  return COMPLIMENTARY_COURSE_EMAILS.has(email?.trim().toLowerCase() ?? "");
}

export function canViewCourseLessons(access: string) {
  return access === "owner";
}
