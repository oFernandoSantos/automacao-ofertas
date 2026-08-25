ALTER TABLE offers
  ADD COLUMN IF NOT EXISTS reserved_by_execution_id TEXT;

ALTER TABLE offers
  ALTER COLUMN score TYPE NUMERIC(7, 2) USING score::NUMERIC;

ALTER TABLE coupons
  ADD COLUMN IF NOT EXISTS offer_id UUID REFERENCES offers(id) ON DELETE SET NULL;

ALTER TABLE publications
  ADD COLUMN IF NOT EXISTS channel_id UUID REFERENCES channels(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS remote_jid TEXT,
  ADD COLUMN IF NOT EXISTS error TEXT;

CREATE INDEX IF NOT EXISTS publications_channel_published_idx
  ON publications (channel_id, published_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS publications_n8n_execution_unique
  ON publications (n8n_execution_id)
  WHERE n8n_execution_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS publications_evolution_message_unique
  ON publications (evolution_message_id)
  WHERE evolution_message_id IS NOT NULL;
