import { getSql } from "@/db/client";

function asJson(value: Record<string, unknown>) {
  return JSON.parse(JSON.stringify(value)) as never;
}

export async function createAutomationLog(input: {
  entityType: string;
  entityId?: string | null;
  event: string;
  metadata?: Record<string, unknown>;
}) {
  const sql = getSql();
  await sql`
    INSERT INTO automation_logs (entity_type, entity_id, event, metadata)
    VALUES (
      ${input.entityType},
      ${input.entityId ?? null},
      ${input.event},
      ${sql.json(asJson(input.metadata ?? {}))}
    )
  `;
}

export async function getAutomationObservability() {
  const sql = getSql();
  const [health, errors, counts] = await Promise.all([
    sql`
      SELECT id, event, metadata, created_at
      FROM automation_logs
      WHERE event = 'health_snapshot'
      ORDER BY created_at DESC
      LIMIT 20
    `,
    sql`
      SELECT id, entity_id AS offer_id, event, metadata, created_at
      FROM automation_logs
      WHERE event IN ('n8n_error', 'offer_failed')
      ORDER BY created_at DESC
      LIMIT 20
    `,
    sql`
      SELECT
        (SELECT COUNT(*) FROM publications WHERE status = 'PUBLISHED' AND published_at > NOW() - INTERVAL '24 hours') AS publications_24h,
        (SELECT COUNT(*) FROM automation_logs WHERE event IN ('n8n_error', 'offer_failed') AND created_at > NOW() - INTERVAL '24 hours') AS failures_24h
    `,
  ]);
  return { health, errors, counts: counts[0] };
}
