import { CoursePage } from "./course-page";
import { getCourseAccess } from "@/lib/course-access";
import { getCourseAdminAccess } from "@/lib/course-admin";
import { getCourseNavigation, getCoursePageBySlug } from "@/lib/course-content";
import { pricingTiers, type PricingTier } from "@/lib/pricing-parity";

export const dynamic = "force-dynamic";

export default async function IntroductionPage({
  searchParams
}: {
  searchParams: Promise<{ purchase?: string }>;
}) {
  const { purchase } = await searchParams;
  const purchaseStatus = purchase === "error"
    ? "error"
    : pricingTiers.includes(purchase as PricingTier)
      ? purchase as PricingTier
      : null;
  const [page, navigation, access, adminAccess] = await Promise.all([
    getCoursePageBySlug("introduction"),
    getCourseNavigation(),
    getCourseAccess(),
    getCourseAdminAccess()
  ]);

  if (!page) {
    return null;
  }

  return (
    <CoursePage
      page={page}
      access={access === "signed-out" ? "public" : access}
      navigation={navigation}
      canEdit={adminAccess.status === "authorized"}
      purchaseStatus={purchaseStatus}
    />
  );
}
