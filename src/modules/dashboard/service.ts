import { getSql } from "@/db/client";

export async function getDashboardMetrics() {
  const sql = getSql();
  const [summary] = await sql`
    SELECT
      (SELECT COUNT(*) FROM offers) AS offers_found,
      (SELECT COUNT(*) FROM offers WHERE status = 'READY') AS offers_ready,
      (SELECT COUNT(*) FROM offers WHERE status = 'WAITING_AFFILIATE_LINK') AS waiting_affiliate,
      (SELECT COUNT(*) FROM offers WHERE status = 'SENT_TO_N8N') AS sent_to_n8n,
      (SELECT COUNT(*) FROM offers WHERE status = 'PUBLISHED') AS published,
      (SELECT COUNT(*) FROM offers WHERE status = 'ERROR') AS failed,
      (SELECT COUNT(*) FROM clicks WHERE created_at::date = CURRENT_DATE) AS clicks_today
  `;

  const [ctrMetrics] = await sql`
    SELECT
      COALESCE(ROUND((COUNT(c.id)::numeric / NULLIF(COUNT(DISTINCT p.id), 0)) * 100, 2), 0) AS ctr,
      (
        SELECT marketplace
        FROM clicks
        GROUP BY marketplace
        ORDER BY COUNT(*) DESC
        LIMIT 1
      ) AS top_marketplace,
      (
        SELECT pr.title
        FROM clicks cl
        INNER JOIN offers o ON o.id = cl.offer_id
        INNER JOIN products pr ON pr.id = o.product_id
        GROUP BY pr.title
        ORDER BY COUNT(*) DESC
        LIMIT 1
      ) AS top_product
    FROM publications p
    LEFT JOIN clicks c ON c.publication_id = p.id
  `;

  const marketplaceBreakdown = await sql`
    SELECT
      pr.marketplace,
      COUNT(DISTINCT o.id) AS offers,
      COUNT(c.id) AS clicks,
      COUNT(conv.id) AS conversions,
      COALESCE(SUM(conv.commission_value), 0) AS commission,
      COALESCE(
        ROUND((COUNT(c.id)::numeric / NULLIF(COUNT(DISTINCT pub.id), 0)) * 100, 2),
        0
      ) AS ctr
    FROM products pr
    LEFT JOIN offers o ON o.product_id = pr.id
    LEFT JOIN publications pub ON pub.offer_id = o.id
    LEFT JOIN clicks c ON c.offer_id = o.id
    LEFT JOIN conversions conv ON conv.offer_id = o.id
    GROUP BY pr.marketplace
    ORDER BY clicks DESC
  `;

  return {
    summary,
    ctrMetrics,
    marketplaceBreakdown,
  };
}
