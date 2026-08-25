import type { OfferPriority, Marketplace } from "@/types/domain";

export interface N8nOfferPayload {
  offer_id: string;
  product_id: string;
  marketplace: Marketplace;
  title: string;
  image: string | null;
  price: number;
  original_price: number | null;
  discount_percentage: number;
  coupon: string | null;
  estimated_final_price: number | null;
  free_shipping: boolean;
  affiliate_url: string;
  tracking_url: string;
  category: string | null;
  score: number;
  priority: OfferPriority;
}
