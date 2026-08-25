import { getSql } from "@/db/client";
import { env } from "@/lib/env";
import { createAutomationLog } from "@/modules/logs/service";
import type { N8nOfferPayload } from "@/modules/n8n/payload";
import { getAutomationSettings } from "@/modules/settings/service";

export async function findNextReadyOffer() {
  const sql = getSql();
  const settings = await getAutomationSettings();

  if (!settings.automationEnabled) {
    return null;
  }

  const [offer] = await sql`
    SELECT
      o.id,
      o.price,
      o.original_price,
      o.discount_percentage,
      o.estimated_final_price,
      o.score,
      o.priority,
      o.product_id,
      p.marketplace,
      p.title,
      p.image_url,
      p.category,
      p.free_shipping,
      c.code AS coupon_code,
      c.description AS coupon_description,
      al.affiliate_url
    FROM offers o
    INNER JOIN products p ON p.id = o.product_id
    LEFT JOIN coupons c ON c.id = o.coupon_id
    INNER JOIN affiliate_links al ON al.id = o.affiliate_link_id
    WHERE o.status = 'READY'
      AND al.affiliate_url IS NOT NULL
      AND (o.reservation_expires_at IS NULL OR o.reservation_expires_at < NOW())
    ORDER BY
      CASE o.priority
        WHEN 'URGENT' THEN 4
        WHEN 'HIGH' THEN 3
        WHEN 'NORMAL' THEN 2
        ELSE 1
      END DESC,
      o.score DESC,
      o.created_at ASC
    LIMIT 1
  `;

  if (!offer) {
    return null;
  }

  const payload: N8nOfferPayload = {
    offer_id: offer.id,
    product_id: offer.product_id,
    marketplace: offer.marketplace,
    title: offer.title,
    image: offer.image_url,
    price: Number(offer.price),
    original_price: offer.original_price ? Number(offer.original_price) : null,
    discount_percentage: Number(offer.discount_percentage),
    coupon: offer.coupon_code,
    estimated_final_price: offer.estimated_final_price ? Number(offer.estimated_final_price) : null,
    free_shipping: offer.free_shipping,
    affiliate_url: offer.affiliate_url,
    tracking_url: `${env.APP_URL}/go/${offer.id}`,
    category: offer.category,
    score: Number(offer.score),
    priority: offer.priority,
  };

  return payload;
}

export async function reserveOfferAtomically(offerId: string, executionId: string) {
  const sql = getSql();
  const settings = await getAutomationSettings();

  const [updated] = await sql`
    UPDATE offers
    SET
      status = 'RESERVED',
      reserved_at = NOW(),
      reserved_by = ${executionId},
      reserved_by_execution_id = ${executionId},
      reservation_expires_at = NOW() + (${settings.defaultReservationMinutes} * INTERVAL '1 minute'),
      updated_at = NOW()
    WHERE id = ${offerId}
      AND status = 'READY'
      AND affiliate_link_id IS NOT NULL
      AND (reservation_expires_at IS NULL OR reservation_expires_at < NOW())
    RETURNING *
  `;

  if (!updated) {
    return null;
  }

  await createAutomationLog({
    entityType: "offer",
    entityId: updated.id,
    event: "offer_reserved",
    metadata: { executionId },
  });

  return updated;
}

export async function markOfferPublished(
  offerId: string,
  input: {
    provider: "EVOLUTION_API";
    destination: string;
    publishedAt: string;
    n8nExecutionId: string;
    evolutionMessageId: string;
    remoteJid: string;
    channelId?: string | null;
  },
) {
  const sql = getSql();
  const [offer] = await sql`
    SELECT o.*, p.marketplace, al.affiliate_url
    FROM offers o
    INNER JOIN products p ON p.id = o.product_id
    INNER JOIN affiliate_links al ON al.id = o.affiliate_link_id
    WHERE o.id = ${offerId}
    LIMIT 1
  `;

  if (!offer) {
    throw new Error("Offer not found.");
  }

  if (!['RESERVED', 'SENT_TO_N8N'].includes(offer.status)) {
    const [existingPublication] = await sql`
      SELECT *
      FROM publications
      WHERE offer_id = ${offerId}
        AND (n8n_execution_id = ${input.n8nExecutionId} OR evolution_message_id = ${input.evolutionMessageId})
      ORDER BY created_at DESC
      LIMIT 1
    `;
    if (existingPublication) return existingPublication;
    throw new Error("Offer must be reserved before publication.");
  }

  if (offer.reserved_by_execution_id && offer.reserved_by_execution_id !== input.n8nExecutionId) {
    throw new Error("Offer is reserved by another execution.");
  }

  const [channel] = input.channelId
    ? await sql`SELECT id, name FROM channels WHERE id = ${input.channelId} AND active = TRUE LIMIT 1`
    : await sql`
        SELECT id, name
        FROM channels
        WHERE active = TRUE AND destination_identifier = ${input.destination}
        LIMIT 1
      `;

  const [publication] = await sql.begin(async (transaction) => {
    const [createdPublication] = await transaction`
      INSERT INTO publications (
        offer_id,
        marketplace,
        channel,
        channel_id,
        destination,
        message,
        affiliate_url,
        tracking_url,
        published_at,
        status,
        n8n_execution_id,
        evolution_message_id,
        remote_jid
      )
      VALUES (
        ${offerId},
        ${offer.marketplace},
        ${channel?.name ?? input.provider},
        ${channel?.id ?? null},
        ${input.destination},
        ${`Published via ${input.provider}`},
        ${offer.affiliate_url},
        ${`${env.APP_URL}/go/${offerId}`},
        ${input.publishedAt},
        'PUBLISHED',
        ${input.n8nExecutionId},
        ${input.evolutionMessageId},
        ${input.remoteJid}
      )
      ON CONFLICT DO NOTHING
      RETURNING *
    `;

    const publication = createdPublication
      ? createdPublication
      : (await transaction`
          SELECT *
          FROM publications
          WHERE n8n_execution_id = ${input.n8nExecutionId}
             OR evolution_message_id = ${input.evolutionMessageId}
          ORDER BY created_at DESC
          LIMIT 1
        `)[0];

    if (!publication) {
      throw new Error("Could not create or resolve publication.");
    }

    await transaction`
      UPDATE offers
      SET
        status = 'PUBLISHED',
        published_at = ${input.publishedAt},
        reserved_at = NULL,
        reserved_by = NULL,
        reserved_by_execution_id = NULL,
        reservation_expires_at = NULL,
        updated_at = NOW()
      WHERE id = ${offerId}
    `;

    return [publication];
  });

  await createAutomationLog({
    entityType: "offer",
    entityId: offerId,
    event: "offer_published",
    metadata: { provider: input.provider, destination: input.destination, executionId: input.n8nExecutionId },
  });

  return publication;
}

export async function markOfferFailed(offerId: string, input: { executionId: string; stage: string; error: string }) {
  const sql = getSql();
  const [updated] = await sql`
    UPDATE offers
    SET
      status = 'ERROR',
      reserved_at = NULL,
      reserved_by = NULL,
      reserved_by_execution_id = NULL,
      reservation_expires_at = NULL,
      updated_at = NOW()
    WHERE id = ${offerId}
      AND status IN ('RESERVED', 'SENT_TO_N8N', 'READY')
      AND (reserved_by_execution_id IS NULL OR reserved_by_execution_id = ${input.executionId})
    RETURNING *
  `;

  if (!updated) {
    return null;
  }

  await createAutomationLog({
    entityType: "offer",
    entityId: offerId,
    event: "offer_failed",
    metadata: input,
  });

  return updated;
}

export async function releaseOffer(offerId: string, executionId: string, reason: string) {
  const sql = getSql();
  const [updated] = await sql`
    UPDATE offers
    SET
      status = 'READY',
      reserved_at = NULL,
      reserved_by = NULL,
      reserved_by_execution_id = NULL,
      reservation_expires_at = NULL,
      updated_at = NOW()
    WHERE id = ${offerId}
      AND status = 'RESERVED'
      AND reserved_by_execution_id = ${executionId}
    RETURNING *
  `;

  if (!updated) {
    return null;
  }

  await createAutomationLog({
    entityType: "offer",
    entityId: offerId,
    event: "offer_released",
    metadata: { executionId, reason },
  });

  return updated;
}

export async function canPublishOffer(input: { offerId: string; productId?: string; channelId: string }) {
  const sql = getSql();
  const [offer] = await sql`
    SELECT id, product_id FROM offers WHERE id = ${input.offerId} LIMIT 1
  `;
  if (!offer) return { can_publish: false, reason: "Offer not found." };

  const [channel] = await sql`
    SELECT id, min_interval_minutes, max_posts_hour, max_posts_day
    FROM channels WHERE id = ${input.channelId} AND active = TRUE LIMIT 1
  `;
  if (!channel) return { can_publish: false, reason: "Channel not found or inactive." };

  const productId = input.productId ?? offer.product_id;
  const [duplicate] = await sql`
    SELECT pub.id
    FROM publications pub
    INNER JOIN offers published_offer ON published_offer.id = pub.offer_id
    WHERE pub.channel_id = ${channel.id}
      AND pub.status = 'PUBLISHED'
      AND (pub.offer_id = ${input.offerId} OR published_offer.product_id = ${productId})
      AND pub.published_at > NOW() - (${channel.min_interval_minutes} * INTERVAL '1 minute')
    LIMIT 1
  `;
  if (duplicate) return { can_publish: false, reason: "Duplicate offer or product in this channel cooldown." };

  const [lastPublication] = await sql`
    SELECT published_at FROM publications
    WHERE channel_id = ${channel.id} AND status = 'PUBLISHED'
    ORDER BY published_at DESC LIMIT 1
  `;
  if (lastPublication) {
    const [inCooldown] = await sql`
      SELECT ${lastPublication.published_at} > NOW() - (${channel.min_interval_minutes} * INTERVAL '1 minute') AS blocked
    `;
    if (inCooldown?.blocked) return { can_publish: false, reason: "Channel cooldown is active." };
  }

  const [frequency] = await sql`
    SELECT
      COUNT(*) FILTER (WHERE published_at > NOW() - INTERVAL '1 hour') AS hourly,
      COUNT(*) FILTER (WHERE published_at > NOW() - INTERVAL '1 day') AS daily
    FROM publications
    WHERE channel_id = ${channel.id} AND status = 'PUBLISHED'
  `;
  if (Number(frequency.hourly) >= Number(channel.max_posts_hour)) return { can_publish: false, reason: "Hourly publication limit reached." };
  if (Number(frequency.daily) >= Number(channel.max_posts_day)) return { can_publish: false, reason: "Daily publication limit reached." };

  return { can_publish: true, reason: null };
}

export async function getPublicationForOffer(offerId: string) {
  const sql = getSql();
  const [publication] = await sql`
    SELECT evolution_message_id, remote_jid, published_at
    FROM publications
    WHERE offer_id = ${offerId} AND status = 'PUBLISHED'
    ORDER BY published_at DESC NULLS LAST, created_at DESC
    LIMIT 1
  `;
  return publication ?? null;
}

export async function listPublishedOffers() {
  const sql = getSql();
  return sql`
    SELECT DISTINCT ON (offer_id) offer_id, published_at
    FROM publications
    WHERE status = 'PUBLISHED'
    ORDER BY offer_id, published_at DESC NULLS LAST, created_at DESC
  `;
}

export async function listStaleReservedOffers(reservedBeforeMinutes: number) {
  const sql = getSql();
  return sql`
    SELECT id AS offer_id
    FROM offers
    WHERE status = 'RESERVED'
      AND reserved_at IS NOT NULL
      AND reserved_at < NOW() - (${reservedBeforeMinutes} * INTERVAL '1 minute')
    ORDER BY reserved_at ASC
  `;
}

export async function getLastPublication() {
  const sql = getSql();
  const [publication] = await sql`
    SELECT offer_id, published_at
    FROM publications
    WHERE status = 'PUBLISHED' AND published_at IS NOT NULL
    ORDER BY published_at DESC
    LIMIT 1
  `;
  return publication ?? { offer_id: null, published_at: null };
}
