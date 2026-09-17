import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCourseAccess } from "@/lib/course-access";
import { getCourseNavigation, getCoursePageBySlug } from "@/lib/course-content";
import { CoursePage } from "../course-page";

type CourseRouteProps = {
  params: Promise<{ slug: string }>;
};

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: CourseRouteProps): Promise<Metadata> {
  const { slug } = await params;
  const page = await getCoursePageBySlug(slug);

  if (!page) return {};

  return {
    title: `${page.title} | X Ads course`,
    description: page.description,
    alternates: { canonical: page.path },
    openGraph: {
      title: `${page.title} | X Ads course`,
      description: page.description,
      url: page.path
    }
  };
}

export default async function CourseContentPage({ params }: CourseRouteProps) {
  const { slug } = await params;
  const [page, navigation, access] = await Promise.all([
    getCoursePageBySlug(slug),
    getCourseNavigation(),
    getCourseAccess()
  ]);

  if (!page || page.slug === "introduction") notFound();

  return <CoursePage page={page} access={access} navigation={navigation} />;
}
