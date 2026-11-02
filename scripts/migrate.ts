/**
 * Applies pending schema migrations (lib/db/migrations.ts).
 *   npm run db:migrate
 * Needs DATABASE_URL (read from .env.local / .env if not already set).
 */
import fs from "fs";

for (const file of [".env.local", ".env"]) {
  if (!fs.existsSync(file)) continue;
  for (const line of fs.readFileSync(file, "utf-8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}

async function main() {
  const { getDb, getClient } = await import("../lib/db/db");
  const { runMigrations, MIGRATIONS } = await import("../lib/db/migrations");
  const applied = await runMigrations(getDb());
  console.log(applied.length ? `Applied: ${applied.join(", ")}` : `Up to date (${MIGRATIONS.length} migrations).`);
  await getClient().end();
}

main().catch((e) => {
  console.error("Migration failed:", e);
  process.exit(1);
});
