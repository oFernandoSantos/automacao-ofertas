import type { OfferPriority } from "@/types/domain";

export interface ScoreInput {
  price: number;
  originalPrice?: number | null;
  discountPercentage: number;
  rating?: number | null;
  reviewsCount?: number | null;
  hasCoupon: boolean;
  historicalCtr?: number | null;
}

export interface ScoreBreakdown {
  score: number;
  priority: OfferPriority;
  discountScore: number;
  priceScore: number;
  ratingScore: number;
  popularityScore: number;
  couponScore: number;
  historicalCtrScore: number;
}

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

export function calculateOfferScore(input: ScoreInput): ScoreBreakdown {
  const discountScore = clamp(input.discountPercentage * 1.2, 0, 35);
  const priceScore =
    input.originalPrice && input.originalPrice > input.price ? clamp(20 - input.price / 100, 4, 20) : 6;
  const ratingScore = clamp(((input.rating ?? 0) / 5) * 15, 0, 15);
  const popularityScore = clamp(Math.log10((input.reviewsCount ?? 0) + 1) * 8, 0, 10);
  const couponScore = input.hasCoupon ? 10 : 0;
  const historicalCtrScore = clamp((input.historicalCtr ?? 0) * 100, 0, 10);

  const score = Math.round(
    clamp(discountScore + priceScore + ratingScore + popularityScore + couponScore + historicalCtrScore),
  );

  let priority: OfferPriority = "NORMAL";

  if (input.discountPercentage > 40 || score > 90) {
    priority = "HIGH";
  }

  if (input.hasCoupon && score > 80) {
    priority = "URGENT";
  }

  if (score < 55) {
    priority = "LOW";
  }

  return {
    score,
    priority,
    discountScore,
    priceScore,
    ratingScore,
    popularityScore,
    couponScore,
    historicalCtrScore,
  };
}
