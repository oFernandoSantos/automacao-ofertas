import { getSql } from "@/db/client";
import { createAutomationLog } from "@/modules/logs/service";
import { getMarketplaceProvider } from "@/modules/marketplaces/providers";
import { manualProductSchema } from "@/modules/shared/schemas";

interface ProductListItem {
  id: string;
  marketplace: string;
  title: string;
  category: string | null;
  product_url: string;
  price: string;
  discount_percentage: string;
  affiliate_url?: string | null;
}

export async function listProducts() {
  const sql = getSql();
  return sql<ProductListItem[]>`
    SELECT p.*,
      (
        SELECT affiliate_url
        FROM affiliate_links al
        WHERE al.product_id = p.id AND al.active = TRUE
        ORDER BY al.created_at DESC
        LIMIT 1
      ) AS affiliate_url
    FROM products p
    ORDER BY p.created_at DESC
  `;
}

export async function getProductById(productId: string) {
  const sql = getSql();
  const [product] = await sql`
    SELECT *
    FROM products
    WHERE id = ${productId}
    LIMIT 1
  `;
  return product ?? null;
}

export async function createProduct(input: unknown) {
  const sql = getSql();
  const parsed = manualProductSchema.parse(input);
  const provider = getMarketplaceProvider(parsed.marketplace);
  const normalized = await provider.normalizeProduct(parsed);

  const [created] = await sql`
    INSERT INTO products (
      marketplace,
      external_id,
      asin,
      title,
      slug,
      description,
      category,
      seller,
      image_url,
      product_url,
      price,
      original_price,
      discount_percentage,
      rating,
      reviews_count,
      free_shipping,
      installments
    )
    VALUES (
      ${normalized.marketplace},
      ${normalized.externalId ?? null},
      ${normalized.asin ?? null},
      ${normalized.title},
      ${normalized.slug},
      ${normalized.description ?? null},
      ${normalized.category ?? null},
      ${normalized.seller ?? null},
      ${normalized.imageUrl ?? null},
      ${normalized.productUrl},
      ${normalized.price},
      ${normalized.originalPrice ?? null},
      ${normalized.discountPercentage},
      ${normalized.rating ?? null},
      ${normalized.reviewsCount ?? null},
      ${normalized.freeShipping ?? false},
      ${normalized.installments ?? null}
    )
    RETURNING *
  `;

  await sql`
    INSERT INTO price_history (product_id, price, original_price, discount_percentage)
    VALUES (
      ${created.id},
      ${created.price},
      ${created.original_price},
      ${created.discount_percentage}
    )
  `;

  await createAutomationLog({
    entityType: "product",
    entityId: created.id,
    event: "product_created",
    metadata: { marketplace: created.marketplace, title: created.title },
  });

  return created;
}
