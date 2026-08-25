"use server";

import { redirect } from "next/navigation";
import { createAffiliateLink } from "@/modules/affiliates/service";
import { createProduct } from "@/modules/products/service";

function getNullable(value: FormDataEntryValue | null) {
  return value ? String(value) : null;
}

export async function createProductAction(formData: FormData) {
  const product = await createProduct({
    marketplace: String(formData.get("marketplace")),
    title: String(formData.get("title")),
    description: getNullable(formData.get("description")),
    category: getNullable(formData.get("category")),
    seller: getNullable(formData.get("seller")),
    imageUrl: getNullable(formData.get("imageUrl")),
    productUrl: String(formData.get("productUrl")),
    price: String(formData.get("price")),
    originalPrice: getNullable(formData.get("originalPrice")),
    asin: getNullable(formData.get("asin")),
    externalId: getNullable(formData.get("externalId")),
  });

  redirect(`/products?created=${product.id}`);
}

export async function createAffiliateLinkAction(formData: FormData) {
  const productId = String(formData.get("productId"));

  await createAffiliateLink(productId, {
    marketplace: String(formData.get("marketplace")),
    originalUrl: String(formData.get("originalUrl")),
    affiliateUrl: String(formData.get("affiliateUrl")),
    trackingCode: getNullable(formData.get("trackingCode")),
    subId: getNullable(formData.get("subId")),
    campaign: getNullable(formData.get("campaign")),
  });

  redirect(`/products?affiliate=${productId}`);
}
