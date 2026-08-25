export const marketplaces = ["MERCADO_LIVRE", "SHOPEE", "AMAZON"] as const;
export type Marketplace = (typeof marketplaces)[number];

export const offerStatuses = [
  "DISCOVERED",
  "ANALYZING",
  "REVIEW",
  "APPROVED",
  "WAITING_AFFILIATE_LINK",
  "READY",
  "RESERVED",
  "SENT_TO_N8N",
  "SCHEDULED",
  "PUBLISHED",
  "REJECTED",
  "EXPIRED",
  "ERROR",
] as const;
export type OfferStatus = (typeof offerStatuses)[number];

export const offerPriorities = ["LOW", "NORMAL", "HIGH", "URGENT"] as const;
export type OfferPriority = (typeof offerPriorities)[number];

export const automationModes = ["MANUAL", "SEMI_AUTO", "AUTO"] as const;
export type AutomationMode = (typeof automationModes)[number];

export interface MarketplaceProvider {
  readonly marketplace: Marketplace;
  normalizeProduct(input: ManualProductInput): Promise<NormalizedProductInput>;
  validateAffiliateUrl(url: string): boolean;
}

export interface ManualProductInput {
  marketplace: Marketplace;
  externalId?: string | null;
  asin?: string | null;
  title: string;
  description?: string | null;
  category?: string | null;
  seller?: string | null;
  imageUrl?: string | null;
  productUrl: string;
  price: number;
  originalPrice?: number | null;
  rating?: number | null;
  reviewsCount?: number | null;
  freeShipping?: boolean;
  installments?: string | null;
}

export interface NormalizedProductInput extends ManualProductInput {
  slug: string;
  discountPercentage: number;
}

export interface AutomationSettings {
  automationEnabled: boolean;
  mode: AutomationMode;
  productCooldownHours: number;
  defaultReservationMinutes: number;
}
