const postgres = require('postgres');

async function main() {
  const sql = postgres(process.env.DATABASE_URL);
  const rows = await sql`SELECT id, name, category, is_active FROM extras`;
  console.log('EXTRAS COUNT:', rows.length);
  console.log(JSON.stringify(rows, null, 2));
  await sql.end();
}

main().catch(console.error);
