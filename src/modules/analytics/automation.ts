import { getSql } from "@/db/client";

export async function getOfferMetrics() {
  const sql = getSql();
  return sql`
    SELECT
      o.id AS offer_id,
      COUNT(DISTINCT c.id) AS clicks,
      COUNT(DISTINCT conv.id) AS conversions,
      ROUND(EXTRACT(EPOCH FROM (NOW() - o.created_at)) / 3600, 2) AS age_hours
    FROM offers o
    LEFT JOIN clicks c ON c.offer_id = o.id
    LEFT JOIN conversions conv ON conv.offer_id = o.id
    GROUP BY o.id, o.created_at
    ORDER BY o.created_at DESC
  `;
}
