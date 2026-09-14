import { CoursePage } from "./course-page";
import { getCoursePage } from "./course-data";

export default function IntroductionPage() {
  const page = getCoursePage("/x-ads");

  if (!page) {
    return null;
  }

  return <CoursePage page={page} />;
}
