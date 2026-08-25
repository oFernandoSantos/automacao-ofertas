import { z } from "zod";
import { automationModes, marketplaces, offerPriorities } from "@/types/domain";

export const manualProductSchema = z.object({
  marketplace: z.enum(marketplaces),
  externalId: z.string().trim().optional().nullable(),
  asin: z.string().trim().optional().nullable(),
  title: z.string().trim().min(3),
  description: z.string().trim().optional().nullable(),
  category: z.string().trim().optional().nullable(),
  seller: z.string().trim().optional().nullable(),
  imageUrl: z.string().url().optional().nullable(),
  productUrl: z.string().url(),
  price: z.coerce.number().positive(),
  originalPrice: z.coerce.number().positive().optional().nullable(),
  rating: z.coerce.number().min(0).max(5).optional().nullable(),
  reviewsCount: z.coerce.number().int().min(0).optional().nullable(),
  freeShipping: z.coerce.boolean().optional().default(false),
  installments: z.string().trim().optional().nullable(),
});

export const affiliateLinkSchema = z.object({
  marketplace: z.enum(marketplaces),
  originalUrl: z.string().url(),
  affiliateUrl: z.string().url(),
  trackingCode: z.string().trim().optional().nullable(),
  subId: z.string().trim().optional().nullable(),
  campaign: z.string().trim().optional().nullable(),
});

export const couponSchema = z.object({
  marketplace: z.enum(marketplaces),
  code: z.string().trim().min(2),
  title: z.string().trim().optional().nullable(),
  description: z.string().trim().optional().nullable(),
  discountType: z.string().trim().optional().nullable(),
  discountValue: z.coerce.number().nonnegative().optional().nullable(),
  minimumPurchase: z.coerce.number().nonnegative().optional().nullable(),
  maximumDiscount: z.coerce.number().nonnegative().optional().nullable(),
  startsAt: z.string().datetime().optional().nullable(),
  expiresAt: z.string().datetime().optional().nullable(),
});

export const offerCreateSchema = z.object({
  productId: z.string().uuid(),
  affiliateLinkId: z.string().uuid().optional().nullable(),
  couponId: z.string().uuid().optional().nullable(),
  price: z.coerce.number().positive(),
  originalPrice: z.coerce.number().positive().optional().nullable(),
  estimatedFinalPrice: z.coerce.number().positive().optional().nullable(),
  startsAt: z.string().datetime().optional().nullable(),
  expiresAt: z.string().datetime().optional().nullable(),
});

export const offerApprovalSchema = z.object({
  offerId: z.string().uuid(),
  priority: z.enum(offerPriorities).optional(),
});

export const n8nAuthHeaderSchema = z.object({
  authorization: z.string().startsWith("Bearer "),
});

export const n8nReserveSchema = z.object({
  workflow: z.string().trim().min(2),
  execution_id: z.string().trim().min(2),
});

export const n8nPublishedSchema = z.object({
  execution_id: z.string().trim().min(2),
  provider: z.literal("EVOLUTION_API"),
  message_id: z.string().trim().min(2),
  remote_jid: z.string().trim().min(2),
  destination: z.string().trim().min(2),
  published_at: z.string().datetime(),
  channel_id: z.string().uuid().optional().nullable(),
});

export const n8nFailedSchema = z.object({
  execution_id: z.string().trim().min(2),
  stage: z.enum(["FAILED_VALIDATION", "LINK_VALIDATION", "EVOLUTION_API"]),
  error: z.string().trim().min(3),
});

export const n8nReleaseSchema = z.object({
  execution_id: z.string().trim().min(2),
  reason: z.string().trim().min(3),
});

export const n8nPrioritySchema = z.object({
  priority: z.enum(offerPriorities),
  reason: z.string().trim().min(3),
});

export const n8nErrorLogSchema = z.object({
  workflow: z.string().trim().min(2),
  execution: z.string().trim().min(2),
  node: z.string().trim().min(2),
  error: z.string().trim().min(1),
  offer_id: z.string().uuid().optional().nullable(),
  data: z.unknown().optional(),
  occurred_at: z.string().datetime(),
});

export const n8nSnapshotSchema = z.object({}).passthrough();

export const n8nCanPublishQuerySchema = z.object({
  offer_id: z.string().uuid().optional(),
  product_id: z.string().uuid().optional(),
  channel_id: z.string().uuid(),
});

export const automationSettingsSchema = z.object({
  automationEnabled: z.coerce.boolean(),
  mode: z.enum(automationModes),
  productCooldownHours: z.coerce.number().int().positive(),
  defaultReservationMinutes: z.coerce.number().int().positive(),
});
