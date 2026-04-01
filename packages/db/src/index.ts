import { config as loadEnv } from "dotenv";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const repoRootEnv = resolve(dirname(fileURLToPath(import.meta.url)), "../../..", ".env");
loadEnv({ path: repoRootEnv });

let pool: pg.Pool | null = null;

export function getPool(): pg.Pool {
  if (!pool) {
    const url = process.env.DATABASE_URL;
    if (!url) {
      throw new Error("DATABASE_URL is required");
    }
    pool = new pg.Pool({ connectionString: url });
  }
  return pool;
}

export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

export type { Pool, PoolClient, QueryResult } from "pg";

export { insertHttpRequestRecord } from "./http-request-records.js";
export {
  createPgDashboardViewPersistence,
  createPgHttpIngestPersistence,
  createPgMetricsAggregationPersistence,
  createPgRetentionPersistence,
} from "./pg-persistence.js";
