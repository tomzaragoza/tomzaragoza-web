import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCourseAccess } from "@/lib/course-access";
import { canViewCourseLessons } from "@/lib/course-access-policy";
import { getCourseAdminAccess } from "@/lib/course-admin";
import { getCourseNavigation, getCoursePageBySlug, getAdminCoursePages } from "@/lib/course-content";
import { CoursePage } from "../course-page";
import { pricingTiers, type PricingTier } from "@/lib/pricing-parity";

type CourseRouteProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ purchase?: string }>;
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

export default async function CourseContentPage({ params, searchParams }: CourseRouteProps) {
  const { slug } = await params;
  const { purchase } = await searchParams;
  const purchaseStatus = purchase === "error" ? "error"
    : pricingTiers.includes(purchase as PricingTier) ? purchase as PricingTier : null;
  const [publishedPage, publishedNavigation, access, adminAccess] = await Promise.all([
    getCoursePageBySlug(slug),
    getCourseNavigation(),
    getCourseAccess(),
    getCourseAdminAccess()
  ]);

  const canEdit = adminAccess.status === "authorized";
  const adminPages = canEdit ? await getAdminCoursePages() : null;
  const page = adminPages?.find(item => item.slug === slug) ?? publishedPage;
  const navigation = adminPages ?? publishedNavigation;
  if (!page || page.slug === "introduction") notFound();

  return (
    <CoursePage
      page={canEdit || canViewCourseLessons(access) ? page : { ...page, outcome: undefined, content: [], blocks: [], mainVideo: null }}
      access={access}
      navigation={navigation}
      canEdit={adminAccess.status === "authorized"}
      purchaseStatus={purchaseStatus}
    />
  );
}
