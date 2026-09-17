import { CoursePage } from "./course-page";
import { getCourseAccess } from "@/lib/course-access";
import { getCourseNavigation, getCoursePageBySlug } from "@/lib/course-content";

export const dynamic = "force-dynamic";

export default async function IntroductionPage() {
  const [page, navigation, access] = await Promise.all([
    getCoursePageBySlug("introduction"),
    getCourseNavigation(),
    getCourseAccess()
  ]);

  if (!page) {
    return null;
  }

  return (
    <CoursePage
      page={page}
      access={access === "signed-out" ? "public" : access}
      navigation={navigation}
    />
  );
}
