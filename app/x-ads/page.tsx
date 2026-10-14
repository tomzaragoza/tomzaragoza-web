import { redirect } from "next/navigation";
import { CourseLanding } from "./course-landing";
import { getCourseAccess } from "@/lib/course-access";
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
  const [navigation, access] = await Promise.all([
    getCourseNavigation(),
    getCourseAccess()
  ]);

  const firstSection = navigation.find((section) => section.slug !== "introduction");
  if (access !== "signed-out" && firstSection) {
    redirect(`${firstSection.path}${purchaseStatus ? `?purchase=${purchaseStatus}` : ""}`);
  }

  return <CourseLanding navigation={navigation} purchaseStatus={purchaseStatus} />;
}
