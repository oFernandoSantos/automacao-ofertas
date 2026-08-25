import { getSql } from "@/db/client";
import { getMarketplaceProvider } from "@/modules/marketplaces/providers";
import { affiliateLinkSchema } from "@/modules/shared/schemas";
import { createAutomationLog } from "@/modules/logs/service";
import type { Marketplace } from "@/types/domain";

function asJson(value: Record<string, unknown>) {
  return JSON.parse(JSON.stringify(value)) as never;
}

export async function listAffiliateAccounts() {
  const sql = getSql();
  return sql`
    SELECT *
    FROM affiliate_accounts
    ORDER BY marketplace, name
  `;
}

export async function upsertAffiliateAccount(input: {
  id?: string;
  marketplace: Marketplace;
  name: string;
  affiliateIdentifier?: string | null;
  trackingId?: string | null;
  additionalConfig?: Record<string, unknown>;
  active?: boolean;
}) {
  const sql = getSql();
  if (input.id) {
    const [updated] = await sql`
      UPDATE affiliate_accounts
      SET
        marketplace = ${input.marketplace},
        name = ${input.name},
        affiliate_identifier = ${input.affiliateIdentifier ?? null},
        tracking_id = ${input.trackingId ?? null},
        additional_config = ${sql.json(asJson(input.additionalConfig ?? {}))},
        active = ${input.active ?? true},
        updated_at = NOW()
      WHERE id = ${input.id}
      RETURNING *
    `;
    return updated;
  }

  const [created] = await sql`
    INSERT INTO affiliate_accounts (
      marketplace,
      name,
      affiliate_identifier,
      tracking_id,
      additional_config,
      active
    )
    VALUES (
      ${input.marketplace},
      ${input.name},
      ${input.affiliateIdentifier ?? null},
      ${input.trackingId ?? null},
      ${sql.json(asJson(input.additionalConfig ?? {}))},
      ${input.active ?? true}
    )
    RETURNING *
  `;
  return created;
}

export async function createAffiliateLink(productId: string, input: unknown) {
  const sql = getSql();
  const parsed = affiliateLinkSchema.parse(input);
  const provider = getMarketplaceProvider(parsed.marketplace);

  if (!provider.validateAffiliateUrl(parsed.affiliateUrl)) {
    throw new Error("Invalid affiliate URL.");
  }

  const [created] = await sql`
    INSERT INTO affiliate_links (
      product_id,
      marketplace,
      original_url,
      affiliate_url,
      tracking_code,
      sub_id,
      campaign,
      active
    )
    VALUES (
      ${productId},
      ${parsed.marketplace},
      ${parsed.originalUrl},
      ${parsed.affiliateUrl},
      ${parsed.trackingCode ?? null},
      ${parsed.subId ?? null},
      ${parsed.campaign ?? null},
      TRUE
    )
    RETURNING *
  `;

  await createAutomationLog({
    entityType: "affiliate_link",
    entityId: created.id,
    event: "affiliate_link_associated",
    metadata: { productId, marketplace: parsed.marketplace },
  });

  return created;
}

export async function getActiveAffiliateLinkForProduct(productId: string) {
  const sql = getSql();
  const [link] = await sql`
    SELECT *
    FROM affiliate_links
    WHERE product_id = ${productId}
      AND active = TRUE
    ORDER BY created_at DESC
    LIMIT 1
  `;

  return link ?? null;
}
