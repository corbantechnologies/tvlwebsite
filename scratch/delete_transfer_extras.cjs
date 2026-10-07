const postgres = require('postgres');

async function main() {
  const sql = postgres(process.env.DATABASE_URL);
  
  // Delete all transfer extras
  const deleted = await sql`DELETE FROM extras WHERE category = 'transfer' RETURNING id, name`;
  console.log('DELETED TRANSFER EXTRAS:', deleted);
  
  const remaining = await sql`SELECT id, name, category, is_active FROM extras`;
  console.log('REMAINING EXTRAS:', remaining);
  
  await sql.end();
}

main().catch(console.error);
