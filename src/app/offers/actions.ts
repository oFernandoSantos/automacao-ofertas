"use server";

import { redirect } from "next/navigation";
import { approveOffer, createOffer, rejectOffer } from "@/modules/offers/service";

function getNullable(value: FormDataEntryValue | null) {
  return value ? String(value) : null;
}

export async function createOfferAction(formData: FormData) {
  const offer = await createOffer({
    productId: String(formData.get("productId")),
    price: String(formData.get("price")),
    originalPrice: getNullable(formData.get("originalPrice")),
    estimatedFinalPrice: getNullable(formData.get("estimatedFinalPrice")),
  });

  redirect(`/offers?created=${offer.id}`);
}

export async function approveOfferAction(formData: FormData) {
  await approveOffer({
    offerId: String(formData.get("offerId")),
    priority: getNullable(formData.get("priority")) ?? undefined,
  });

  redirect("/offers");
}

export async function rejectOfferAction(formData: FormData) {
  await rejectOffer(String(formData.get("offerId")));
  redirect("/offers");
}
