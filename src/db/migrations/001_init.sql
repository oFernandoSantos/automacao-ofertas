CREATE EXTENSION IF NOT EXISTS "pgcrypto";

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'marketplace') THEN
    CREATE TYPE marketplace AS ENUM ('MERCADO_LIVRE', 'SHOPEE', 'AMAZON');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'offer_status') THEN
    CREATE TYPE offer_status AS ENUM (
      'DISCOVERED',
      'ANALYZING',
      'REVIEW',
      'APPROVED',
      'WAITING_AFFILIATE_LINK',
      'READY',
      'RESERVED',
      'SENT_TO_N8N',
      'SCHEDULED',
      'PUBLISHED',
      'REJECTED',
      'EXPIRED',
      'ERROR'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'offer_priority') THEN
    CREATE TYPE offer_priority AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'channel_type') THEN
    CREATE TYPE channel_type AS ENUM ('WHATSAPP');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'channel_provider') THEN
    CREATE TYPE channel_provider AS ENUM ('EVOLUTION_API');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'automation_mode') THEN
    CREATE TYPE automation_mode AS ENUM ('MANUAL', 'SEMI_AUTO', 'AUTO');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS affiliate_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  marketplace marketplace NOT NULL,
  name TEXT NOT NULL,
  affiliate_identifier TEXT,
  tracking_id TEXT,
  additional_config JSONB NOT NULL DEFAULT '{}'::jsonb,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  marketplace marketplace NOT NULL,
  external_id TEXT,
  asin TEXT,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  category TEXT,
  seller TEXT,
  image_url TEXT,
  product_url TEXT NOT NULL,
  price NUMERIC(12, 2) NOT NULL,
  original_price NUMERIC(12, 2),
  discount_percentage NUMERIC(5, 2) NOT NULL DEFAULT 0,
  rating NUMERIC(3, 2),
  reviews_count INTEGER,
  free_shipping BOOLEAN NOT NULL DEFAULT FALSE,
  installments TEXT,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT products_marketplace_external_id_unique UNIQUE NULLS NOT DISTINCT (marketplace, external_id),
  CONSTRAINT products_marketplace_asin_unique UNIQUE NULLS NOT DISTINCT (marketplace, asin)
);

CREATE TABLE IF NOT EXISTS coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  marketplace marketplace NOT NULL,
  code TEXT NOT NULL,
  title TEXT,
  description TEXT,
  discount_type TEXT,
  discount_value NUMERIC(12, 2),
  minimum_purchase NUMERIC(12, 2),
  maximum_discount NUMERIC(12, 2),
  starts_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  category TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS coupons_marketplace_code_unique
  ON coupons (marketplace, code);

CREATE TABLE IF NOT EXISTS affiliate_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  marketplace marketplace NOT NULL,
  original_url TEXT NOT NULL,
  affiliate_url TEXT NOT NULL,
  tracking_code TEXT,
  sub_id TEXT,
  campaign TEXT,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS affiliate_links_product_marketplace_active_unique
  ON affiliate_links (product_id, marketplace, active)
  WHERE active = TRUE;

CREATE TABLE IF NOT EXISTS offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  affiliate_link_id UUID REFERENCES affiliate_links(id) ON DELETE SET NULL,
  coupon_id UUID REFERENCES coupons(id) ON DELETE SET NULL,
  price NUMERIC(12, 2) NOT NULL,
  original_price NUMERIC(12, 2),
  discount_percentage NUMERIC(5, 2) NOT NULL DEFAULT 0,
  estimated_final_price NUMERIC(12, 2),
  score INTEGER NOT NULL DEFAULT 0,
  priority offer_priority NOT NULL DEFAULT 'NORMAL',
  status offer_status NOT NULL DEFAULT 'DISCOVERED',
  starts_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  reserved_at TIMESTAMPTZ,
  reserved_by TEXT,
  reservation_expires_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  sent_to_n8n_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS offers_ready_lookup_idx
  ON offers (status, priority DESC, score DESC, created_at ASC);

CREATE INDEX IF NOT EXISTS offers_reservation_expiration_idx
  ON offers (reservation_expires_at);

CREATE TABLE IF NOT EXISTS price_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  price NUMERIC(12, 2) NOT NULL,
  original_price NUMERIC(12, 2),
  discount_percentage NUMERIC(5, 2) NOT NULL DEFAULT 0,
  captured_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS price_history_product_captured_idx
  ON price_history (product_id, captured_at DESC);

CREATE TABLE IF NOT EXISTS channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type channel_type NOT NULL DEFAULT 'WHATSAPP',
  provider channel_provider NOT NULL DEFAULT 'EVOLUTION_API',
  destination_identifier TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  min_interval_minutes INTEGER NOT NULL DEFAULT 15,
  max_posts_hour INTEGER NOT NULL DEFAULT 6,
  max_posts_day INTEGER NOT NULL DEFAULT 30,
  allowed_start_time TIME,
  allowed_end_time TIME,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS publications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id UUID NOT NULL REFERENCES offers(id) ON DELETE CASCADE,
  marketplace marketplace NOT NULL,
  channel TEXT NOT NULL,
  destination TEXT NOT NULL,
  message TEXT NOT NULL,
  affiliate_url TEXT NOT NULL,
  tracking_url TEXT NOT NULL,
  scheduled_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'PENDING',
  n8n_execution_id TEXT,
  evolution_message_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS publications_offer_idx
  ON publications (offer_id, created_at DESC);

CREATE TABLE IF NOT EXISTS clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id UUID NOT NULL REFERENCES offers(id) ON DELETE CASCADE,
  publication_id UUID REFERENCES publications(id) ON DELETE SET NULL,
  marketplace marketplace NOT NULL,
  channel TEXT,
  anonymous_visitor_id TEXT,
  referrer TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS clicks_offer_idx
  ON clicks (offer_id, created_at DESC);

CREATE TABLE IF NOT EXISTS conversions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id UUID NOT NULL REFERENCES offers(id) ON DELETE CASCADE,
  publication_id UUID REFERENCES publications(id) ON DELETE SET NULL,
  marketplace marketplace NOT NULL,
  external_order_reference TEXT,
  sale_value NUMERIC(12, 2),
  commission_value NUMERIC(12, 2),
  status TEXT NOT NULL DEFAULT 'PENDING',
  converted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS automation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL,
  entity_id UUID,
  event TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO app_settings (key, value)
VALUES
  ('automation', '{"automationEnabled": true, "mode": "MANUAL", "productCooldownHours": 48, "defaultReservationMinutes": 15}'::jsonb)
ON CONFLICT (key) DO NOTHING;
