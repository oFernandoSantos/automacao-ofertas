"use server";

import { redirect } from "next/navigation";
import { upsertAffiliateAccount } from "@/modules/affiliates/service";
import { getAutomationSettings, updateAutomationSettings } from "@/modules/settings/service";

export async function updateAutomationSettingsAction(formData: FormData) {
  const current = await getAutomationSettings();
  const enabled = formData.get("automationEnabled");
  await updateAutomationSettings({
    automationEnabled: enabled === null ? current.automationEnabled : enabled === "on",
    mode: String(formData.get("mode")) as "MANUAL" | "SEMI_AUTO" | "AUTO",
    productCooldownHours: Number(formData.get("productCooldownHours")),
    defaultReservationMinutes: Number(formData.get("defaultReservationMinutes")),
  });

  redirect("/settings/automation");
}

export async function upsertAffiliateAccountAction(formData: FormData) {
  await upsertAffiliateAccount({
    marketplace: String(formData.get("marketplace")) as "MERCADO_LIVRE" | "SHOPEE" | "AMAZON",
    name: String(formData.get("name")),
    affiliateIdentifier: String(formData.get("affiliateIdentifier") || ""),
    trackingId: String(formData.get("trackingId") || ""),
  });

  redirect("/settings/affiliates");
}
