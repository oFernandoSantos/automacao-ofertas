import postgres from "postgres";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required to seed the database.");
}

const sql = postgres(databaseUrl, { prepare: false });

async function main() {
  await sql`
    INSERT INTO channels (name, type, provider, destination_identifier, min_interval_minutes, max_posts_hour, max_posts_day)
    SELECT 'WhatsApp Principal', 'WHATSAPP', 'EVOLUTION_API', 'whatsapp-principal', 20, 3, 20
    WHERE NOT EXISTS (
      SELECT 1 FROM channels WHERE destination_identifier = 'whatsapp-principal'
    )
  `;
}

main()
  .then(() => sql.end())
  .catch(async (error) => {
    console.error(error);
    await sql.end();
    process.exit(1);
  });
