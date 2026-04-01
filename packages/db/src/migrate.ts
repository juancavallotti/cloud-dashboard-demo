import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { getPool, closePool } from "./index.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

async function ensureMigrationsTable(client: import("pg").PoolClient): Promise<void> {
  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

function listMigrationFiles(): string[] {
  const migrationsDir = join(__dirname, "..", "migrations");
  return readdirSync(migrationsDir)
    .filter((f) => f.endsWith(".sql"))
    .sort((a, b) => a.localeCompare(b));
}

async function main(): Promise<void> {
  const pool = getPool();
  const client = await pool.connect();
  try {
    await ensureMigrationsTable(client);
    const applied = await client.query<{ name: string }>(
      `SELECT name FROM schema_migrations`
    );
    const appliedSet = new Set(applied.rows.map((r) => r.name));
    const files = listMigrationFiles();
    for (const file of files) {
      if (appliedSet.has(file)) {
        continue;
      }
      const sql = readFileSync(join(__dirname, "..", "migrations", file), "utf8");
      await client.query("BEGIN");
      try {
        await client.query(sql);
        await client.query(`INSERT INTO schema_migrations (name) VALUES ($1)`, [file]);
        await client.query("COMMIT");
        console.log(`Applied migration: ${file}`);
      } catch (e) {
        await client.query("ROLLBACK");
        throw e;
      }
    }
    console.log("Migrations complete.");
  } finally {
    client.release();
    await closePool();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
