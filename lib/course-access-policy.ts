import "server-only";

export function canViewCourseLessons(access: string) {
  return access === "owner" || access === "course" || access === "pro";
}
