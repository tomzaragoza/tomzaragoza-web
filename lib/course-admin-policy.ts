const COURSE_ADMIN_EMAIL = "tomdzaragoza@gmail.com";

export function isCourseAdminEmail(email: string | null | undefined) {
  return email?.trim().toLowerCase() === COURSE_ADMIN_EMAIL;
}
