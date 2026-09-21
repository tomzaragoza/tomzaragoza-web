import { CourseDashboard } from "./course-dashboard";
import { CourseLanding } from "./course-landing";
import { getCourseAccess } from "@/lib/course-access";
import { getCourseAdminAccess } from "@/lib/course-admin";
import { getCourseNavigation } from "@/lib/course-content";
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
  const [navigation, access, adminAccess] = await Promise.all([
    getCourseNavigation(),
    getCourseAccess(),
    getCourseAdminAccess()
  ]);

  if (access === "signed-out") {
    return <CourseLanding navigation={navigation} purchaseStatus={purchaseStatus} />;
  }

  return (
    <CourseDashboard
      access={access}
      navigation={navigation}
      canEdit={adminAccess.status === "authorized"}
      purchaseStatus={purchaseStatus}
    />
  );
}
