import { headers } from "next/headers";
import { getSql } from "@/db/client";
import { createAutomationLog } from "@/modules/logs/service";

export async function resolveTrackingRedirect(offerId: string) {
  const sql = getSql();
  const [offer] = await sql`
    SELECT
      o.id,
      p.marketplace,
      al.affiliate_url,
      (
        SELECT id
        FROM publications pub
        WHERE pub.offer_id = o.id
        ORDER BY pub.created_at DESC
        LIMIT 1
      ) AS publication_id
    FROM offers o
    INNER JOIN products p ON p.id = o.product_id
    INNER JOIN affiliate_links al ON al.id = o.affiliate_link_id
    WHERE o.id = ${offerId}
      AND al.affiliate_url IS NOT NULL
    LIMIT 1
  `;

  if (!offer) {
    return null;
  }

  const requestHeaders = await headers();
  const referrer = requestHeaders.get("referer");
  const userAgent = requestHeaders.get("user-agent");

  await sql`
    INSERT INTO clicks (
      offer_id,
      publication_id,
      marketplace,
      channel,
      anonymous_visitor_id,
      referrer,
      user_agent
    )
    VALUES (
      ${offer.id},
      ${offer.publication_id ?? null},
      ${offer.marketplace},
      'WHATSAPP',
      ${requestHeaders.get("x-forwarded-for") ?? null},
      ${referrer ?? null},
      ${userAgent ?? null}
    )
  `;

  await createAutomationLog({
    entityType: "offer",
    entityId: offer.id,
    event: "click_registered",
  });

  return offer.affiliate_url as string;
}
