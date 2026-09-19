import "server-only";

import { MongoClient, type Collection } from "mongodb";
import type { PricingTier } from "@/lib/pricing-parity";

type CourseEntitlementDocument = {
  userId: string;
  email: string;
  tierRank: number;
  stripeCustomerId: string | null;
  lastCheckoutSessionId: string;
  createdAt: Date;
  updatedAt: Date;
};

type CoursePurchaseDocument = {
  checkoutSessionId: string;
  userId: string | null;
  email: string;
  tier: PricingTier;
  stripeCustomerId: string | null;
  amountTotal: number | null;
  currency: string | null;
  purchasedAt: Date;
};

export type PaidCoursePurchase = Omit<CoursePurchaseDocument, "purchasedAt"> & {
  purchasedAt?: Date;
};

const tierRanks: Record<PricingTier, number> = {
  course: 1,
  pro: 2
};

const globalForCourseEntitlements = globalThis as typeof globalThis & {
  courseEntitlementsMongoClient?: MongoClient;
  courseEntitlementsIndexPromise?: Promise<void>;
};

function getCourseCollections(): {
  entitlements: Collection<CourseEntitlementDocument>;
  purchases: Collection<CoursePurchaseDocument>;
} {
  const uri = process.env.MONGODB_URL?.trim();
  if (!uri) throw new Error("Course database is not configured.");

  const client = globalForCourseEntitlements.courseEntitlementsMongoClient ?? new MongoClient(uri, {
    serverSelectionTimeoutMS: 10000
  });
  globalForCourseEntitlements.courseEntitlementsMongoClient = client;
  const database = client.db(process.env.MONGODB_DB || "tomzaragoza");

  return {
    entitlements: database.collection<CourseEntitlementDocument>("x_ads_course_entitlements"),
    purchases: database.collection<CoursePurchaseDocument>("x_ads_course_purchases")
  };
}

async function ensureCourseEntitlementIndexes(
  entitlements: Collection<CourseEntitlementDocument>,
  purchases: Collection<CoursePurchaseDocument>
) {
  if (!globalForCourseEntitlements.courseEntitlementsIndexPromise) {
    globalForCourseEntitlements.courseEntitlementsIndexPromise = (async () => {
      await Promise.all([
        entitlements.createIndex({ userId: 1 }, { unique: true }),
        purchases.createIndex({ checkoutSessionId: 1 }, { unique: true }),
        purchases.createIndex({ userId: 1, purchasedAt: -1 }),
        purchases.createIndex({ email: 1, userId: 1, purchasedAt: -1 })
      ]);
    })();
  }

  try {
    await globalForCourseEntitlements.courseEntitlementsIndexPromise;
  } catch (error) {
    globalForCourseEntitlements.courseEntitlementsIndexPromise = undefined;
    throw error;
  }
}

export function courseTierFromRank(rank: number | null | undefined): PricingTier | null {
  if (typeof rank !== "number" || rank < tierRanks.course) return null;
  return rank >= tierRanks.pro ? "pro" : "course";
}

export async function getPurchasedCourseTier(
  userId: string,
  verifiedEmail?: string
): Promise<PricingTier | null> {
  const { entitlements, purchases } = getCourseCollections();
  await ensureCourseEntitlementIndexes(entitlements, purchases);
  const entitlement = await entitlements.findOne({ userId });
  const email = verifiedEmail?.trim().toLowerCase();
  const guestPurchases = email
    ? await purchases.find({ userId: null, email }).toArray()
    : [];
  const guestRank = guestPurchases.reduce(
    (rank, purchase) => Math.max(rank, tierRanks[purchase.tier]),
    0
  );
  return courseTierFromRank(Math.max(entitlement?.tierRank ?? 0, guestRank));
}

export async function recordPaidCoursePurchase(input: PaidCoursePurchase): Promise<PricingTier> {
  const { entitlements, purchases } = getCourseCollections();
  await ensureCourseEntitlementIndexes(entitlements, purchases);
  const purchasedAt = input.purchasedAt ?? new Date();
  await purchases.updateOne(
    { checkoutSessionId: input.checkoutSessionId },
    { $setOnInsert: { ...input, purchasedAt } },
    { upsert: true }
  );
  const recordedPurchase = await purchases.findOne({
    checkoutSessionId: input.checkoutSessionId
  });

  if (
    !recordedPurchase ||
    recordedPurchase.userId !== input.userId ||
    recordedPurchase.tier !== input.tier
  ) {
    throw new Error("Checkout Session does not match the recorded purchase.");
  }

  if (!input.userId) return input.tier;

  const now = new Date();
  await entitlements.updateOne(
    { userId: input.userId },
    {
      $setOnInsert: { createdAt: now },
      $set: {
        email: input.email,
        stripeCustomerId: input.stripeCustomerId,
        lastCheckoutSessionId: input.checkoutSessionId,
        updatedAt: now
      },
      $max: { tierRank: tierRanks[input.tier] }
    },
    { upsert: true }
  );

  return input.tier;
}
