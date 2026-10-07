const postgres = require('postgres');

async function main() {
  const sql = postgres(process.env.DATABASE_URL);
  const rows = await sql`SELECT id, type, venue, guest_token, status, created_at, payload FROM inquiries`;
  console.log('INQUIRIES COUNT:', rows.length);
  console.log(JSON.stringify(rows, null, 2));
  await sql.end();
}

main().catch(console.error);
