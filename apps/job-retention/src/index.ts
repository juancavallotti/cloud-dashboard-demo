import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { getPool } from "@repo/db";

const app = new Hono();

const jobSecret = process.env.JOB_SECRET;
const retentionDays = Number(process.env.RETENTION_DAYS ?? "90");

app.get("/health", (c) => c.text("ok"));

app.post("/run", async (c) => {
  if (jobSecret && c.req.header("x-job-secret") !== jobSecret) {
    return c.text("Unauthorized", 401);
  }

  const pool = getPool();
  const result = await pool.query(
    `DELETE FROM http_request_records
     WHERE started_at < NOW() - ($1::int * INTERVAL '1 day')`,
    [retentionDays]
  );

  return c.json({
    deleted: result.rowCount ?? 0,
    retentionDays,
  });
});

const port = Number(process.env.PORT ?? "8080");
console.log(`job-retention listening on ${port}`);
serve({ fetch: app.fetch, port });
