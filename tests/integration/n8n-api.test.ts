import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, test } from "node:test";
import postgres from "postgres";

const databaseUrl = process.env.INTEGRATION_DATABASE_URL;
const appUrl = process.env.INTEGRATION_APP_URL;
const n8nSecret = process.env.N8N_API_SECRET;
const configured = Boolean(databaseUrl && appUrl && n8nSecret);
const sql = configured ? postgres(databaseUrl!, { prepare: false }) : null;
const createdProductIds: string[] = [];

async function createProductWithOffer(status: "READY" | "RESERVED", reservedMinutesAgo?: number) {
  if (!sql) throw new Error("Integration database is not configured.");
  const productId = randomUUID();
  const linkId = randomUUID();
  const offerId = randomUUID();
  createdProductIds.push(productId);

  await sql`
    INSERT INTO products (id, marketplace, title, slug, product_url, price)
    VALUES (${productId}, 'MERCADO_LIVRE', ${`Test product ${productId}`}, ${`test-${productId}`}, 'https://example.com/product', 100)
  `;
  await sql`
    INSERT INTO affiliate_links (id, product_id, marketplace, original_url, affiliate_url)
    VALUES (${linkId}, ${productId}, 'MERCADO_LIVRE', 'https://example.com/product', 'https://example.com/affiliate')
  `;
  await sql`
    INSERT INTO offers (id, product_id, affiliate_link_id, price, score, status, reserved_at, reserved_by_execution_id)
    VALUES (
      ${offerId}, ${productId}, ${linkId}, 100, 50, ${status},
      ${reservedMinutesAgo ? sql`NOW() - (${reservedMinutesAgo} * INTERVAL '1 minute')` : null},
      ${status === 'RESERVED' ? `test-exec-${offerId}` : null}
    )
  `;
  return { productId, offerId };
}

after(async () => {
  if (!sql) return;
  for (const productId of createdProductIds) await sql`DELETE FROM products WHERE id = ${productId}`;
  await sql.end();
});

test("lists only stale reservations and returns the latest publication", { skip: !configured }, async () => {
  const stale = await createProductWithOffer("RESERVED", 45);
  const fresh = await createProductWithOffer("RESERVED", 5);
  const older = await createProductWithOffer("READY");

  await sql!`
    INSERT INTO publications (offer_id, marketplace, channel, destination, message, affiliate_url, tracking_url, published_at, status)
    VALUES (${older.offerId}, 'MERCADO_LIVRE', 'test', 'destination', 'message', 'https://example.com/affiliate', 'https://example.com/go', NOW() - INTERVAL '2 hours', 'PUBLISHED')
  `;
  await sql!`
    INSERT INTO publications (offer_id, marketplace, channel, destination, message, affiliate_url, tracking_url, published_at, status)
    VALUES (${stale.offerId}, 'MERCADO_LIVRE', 'test', 'destination', 'message', 'https://example.com/affiliate', 'https://example.com/go', NOW() - INTERVAL '1 hour', 'PUBLISHED')
  `;

  const headers = { Authorization: `Bearer ${n8nSecret}` };
  const staleResponse = await fetch(`${appUrl}/api/automation/offers?status=RESERVED&reserved_before_minutes=15`, { headers });
  assert.equal(staleResponse.status, 200);
  const staleBody = await staleResponse.json() as { offers: Array<{ offer_id: string }> };
  assert.deepEqual(staleBody.offers.map((offer) => offer.offer_id), [stale.offerId]);
  assert.ok(!staleBody.offers.some((offer) => offer.offer_id === fresh.offerId));

  const latestResponse = await fetch(`${appUrl}/api/automation/publications/last`, { headers });
  assert.equal(latestResponse.status, 200);
  const latestBody = await latestResponse.json() as { offer_id: string; published_at: string };
  assert.equal(latestBody.offer_id, stale.offerId);
  assert.ok(latestBody.published_at);
});

test("only one simultaneous reservation succeeds", { skip: !configured }, async () => {
  const { offerId } = await createProductWithOffer("READY");
  const request = (executionId: string) => fetch(`${appUrl}/api/automation/offers/${offerId}/reserve`, {
    method: "POST",
    headers: { Authorization: `Bearer ${n8nSecret}`, "Content-Type": "application/json" },
    body: JSON.stringify({ workflow: "integration-test", execution_id: executionId }),
  });

  const [first, second] = await Promise.all([request("execution-a"), request("execution-b")]);
  assert.deepEqual([first.status, second.status].sort(), [200, 409]);
});
