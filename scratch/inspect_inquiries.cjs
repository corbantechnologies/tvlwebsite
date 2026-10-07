const postgres = require('postgres');

async function main() {
  const sql = postgres(process.env.DATABASE_URL);
  
  const tables = await sql`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public'
  `;
  console.log('TABLES IN DB:', tables.map(t => t.table_name));

  const countInq = await sql`SELECT count(*) FROM inquiries`;
  console.log('COUNT inquiries:', countInq);

  const rows = await sql`SELECT id, type, guest_token, status, created_at, payload FROM inquiries LIMIT 10`;
  console.log('INQUIRIES ROWS:', rows);

  await sql.end();
}

main().catch(console.error);
