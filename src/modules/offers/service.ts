import { getSql } from "@/db/client";
import { calculateOfferScore } from "@/modules/analytics/scoring";
import { getActiveAffiliateLinkForProduct } from "@/modules/affiliates/service";
import { createAutomationLog } from "@/modules/logs/service";
import { offerApprovalSchema, offerCreateSchema } from "@/modules/shared/schemas";
import { getAutomationSettings } from "@/modules/settings/service";
import type { OfferStatus } from "@/types/domain";

function deriveOfferStatus(hasAffiliateUrl: boolean): OfferStatus {
  return hasAffiliateUrl ? "REVIEW" : "WAITING_AFFILIATE_LINK";
}

export async function listOffers() {
  const sql = getSql();
  return sql`
    SELECT
      o.*,
      p.title,
      p.marketplace,
      p.image_url,
      p.category,
      c.code AS coupon_code,
      al.affiliate_url
    FROM offers o
    INNER JOIN products p ON p.id = o.product_id
    LEFT JOIN coupons c ON c.id = o.coupon_id
    LEFT JOIN affiliate_links al ON al.id = o.affiliate_link_id
    ORDER BY
      CASE o.priority
        WHEN 'URGENT' THEN 4
        WHEN 'HIGH' THEN 3
        WHEN 'NORMAL' THEN 2
        ELSE 1
      END DESC,
      o.created_at DESC
  `;
}

export async function getOfferById(offerId: string) {
  const sql = getSql();
  const [offer] = await sql`
    SELECT
      o.*,
      p.title,
      p.marketplace,
      p.image_url,
      p.category,
      p.product_url,
      p.rating,
      p.reviews_count,
      c.code AS coupon_code,
      c.description AS coupon_description,
      al.affiliate_url
    FROM offers o
    INNER JOIN products p ON p.id = o.product_id
    LEFT JOIN coupons c ON c.id = o.coupon_id
    LEFT JOIN affiliate_links al ON al.id = o.affiliate_link_id
    WHERE o.id = ${offerId}
    LIMIT 1
  `;

  return offer ?? null;
}

async function offerBlockedByCooldown(productId: string, nextPrice: number, nextDiscount: number) {
  const sql = getSql();
  const settings = await getAutomationSettings();
  const [lastPublication] = await sql`
    SELECT
      o.price,
      o.discount_percentage,
      o.coupon_id,
      pub.published_at
    FROM publications pub
    INNER JOIN offers o ON o.id = pub.offer_id
    WHERE o.product_id = ${productId}
      AND pub.status = 'PUBLISHED'
      AND pub.published_at > NOW() - (${settings.productCooldownHours} * INTERVAL '1 hour')
    ORDER BY pub.published_at DESC
    LIMIT 1
  `;

  if (!lastPublication) {
    return false;
  }

  const lastPrice = Number(lastPublication.price);
  const lastDiscount = Number(lastPublication.discount_percentage);
  const significantPriceDrop = lastPrice - nextPrice >= 15;
  const betterDiscount = nextDiscount - lastDiscount >= 5;
  const hasNewCoupon = Boolean(lastPublication.coupon_id) === false;

  return !(significantPriceDrop || betterDiscount || hasNewCoupon);
}

export async function createOffer(input: unknown) {
  const sql = getSql();
  const parsed = offerCreateSchema.parse(input);
  const affiliateLink = parsed.affiliateLinkId
    ? { id: parsed.affiliateLinkId }
    : await getActiveAffiliateLinkForProduct(parsed.productId);

  const [product] = await sql`
    SELECT *
    FROM products
    WHERE id = ${parsed.productId}
    LIMIT 1
  `;

  if (!product) {
    throw new Error("Product not found.");
  }

  const originalPrice = parsed.originalPrice ?? Number(product.original_price ?? parsed.price);
  const discountPercentage =
    originalPrice && originalPrice > parsed.price
      ? Number((((originalPrice - parsed.price) / originalPrice) * 100).toFixed(2))
      : 0;

  const cooldownBlocked = await offerBlockedByCooldown(parsed.productId, parsed.price, discountPercentage);

  if (cooldownBlocked) {
    throw new Error("Offer is in cooldown window and has no material change.");
  }

  const scoreBreakdown = calculateOfferScore({
    price: parsed.price,
    originalPrice,
    discountPercentage,
    rating: Number(product.rating ?? 0),
    reviewsCount: Number(product.reviews_count ?? 0),
    hasCoupon: Boolean(parsed.couponId),
    historicalCtr: 0,
  });

  const status = deriveOfferStatus(Boolean(affiliateLink));

  const [created] = await sql`
    INSERT INTO offers (
      product_id,
      affiliate_link_id,
      coupon_id,
      price,
      original_price,
      discount_percentage,
      estimated_final_price,
      score,
      priority,
      status,
      starts_at,
      expires_at
    )
    VALUES (
      ${parsed.productId},
      ${affiliateLink?.id ?? null},
      ${parsed.couponId ?? null},
      ${parsed.price},
      ${originalPrice ?? null},
      ${discountPercentage},
      ${parsed.estimatedFinalPrice ?? null},
      ${scoreBreakdown.score},
      ${scoreBreakdown.priority},
      ${status},
      ${parsed.startsAt ?? null},
      ${parsed.expiresAt ?? null}
    )
    RETURNING *
  `;

  await createAutomationLog({
    entityType: "offer",
    entityId: created.id,
    event: "offer_created",
    metadata: { productId: created.product_id, status: created.status, score: created.score },
  });

  return created;
}

export async function approveOffer(input: unknown) {
  const sql = getSql();
  const parsed = offerApprovalSchema.parse(input);
  const offer = await getOfferById(parsed.offerId);

  if (!offer) {
    throw new Error("Offer not found.");
  }

  const nextStatus: OfferStatus = offer.affiliate_url ? "READY" : "WAITING_AFFILIATE_LINK";

  const [updated] = await sql`
    UPDATE offers
    SET
      priority = ${parsed.priority ?? offer.priority},
      status = ${nextStatus},
      approved_at = NOW(),
      updated_at = NOW()
    WHERE id = ${parsed.offerId}
    RETURNING *
  `;

  await createAutomationLog({
    entityType: "offer",
    entityId: updated.id,
    event: "offer_approved",
    metadata: { status: updated.status, priority: updated.priority },
  });

  return updated;
}

export async function rejectOffer(offerId: string) {
  const sql = getSql();
  const [updated] = await sql`
    UPDATE offers
    SET
      status = 'REJECTED',
      updated_at = NOW()
    WHERE id = ${offerId}
    RETURNING *
  `;

  await createAutomationLog({
    entityType: "offer",
    entityId: updated.id,
    event: "offer_rejected",
  });

  return updated;
}

export async function updateOfferPriorityForAutomation(offerId: string, priority: "LOW" | "NORMAL" | "HIGH" | "URGENT", reason: string) {
  const sql = getSql();
  const [updated] = await sql`
    UPDATE offers
    SET priority = ${priority}, updated_at = NOW()
    WHERE id = ${offerId} AND status NOT IN ('PUBLISHED', 'REJECTED', 'EXPIRED')
    RETURNING *
  `;
  if (!updated) return null;

  await createAutomationLog({
    entityType: "offer",
    entityId: offerId,
    event: "offer_priority_updated",
    metadata: { priority, reason },
  });
  return updated;
}
