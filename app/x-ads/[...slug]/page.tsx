import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CoursePage } from "../course-page";
import { coursePages, getCoursePage } from "../course-data";

type CourseRouteProps = {
  params: Promise<{ slug: string[] }>;
};

export function generateStaticParams() {
  return coursePages
    .filter((page) => page.path !== "/x-ads")
    .map((page) => ({ slug: page.path.replace("/x-ads/", "").split("/") }));
}

export async function generateMetadata({ params }: CourseRouteProps): Promise<Metadata> {
  const { slug } = await params;
  const page = getCoursePage(`/x-ads/${slug.join("/")}`);

  if (!page) {
    return {};
  }

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
  const page = getCoursePage(`/x-ads/${slug.join("/")}`);

  if (!page) {
    notFound();
  }

  return <CoursePage page={page} />;
}
