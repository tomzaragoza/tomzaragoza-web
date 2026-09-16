import { CoursePage } from "./course-page";
import { getCoursePage } from "./course-data";
import { getCourseAccess } from "@/lib/course-access";

export default async function IntroductionPage() {
  const page = getCoursePage("/x-ads");

  if (!page) {
    return null;
  }

  const access = await getCourseAccess();

  return (
    <CoursePage
      page={page}
      access={access === "signed-out" ? "public" : access}
    />
  );
}
