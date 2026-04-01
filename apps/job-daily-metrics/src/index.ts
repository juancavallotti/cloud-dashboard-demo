import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { getPool } from "@repo/db";

const app = new Hono();

const jobSecret = process.env.JOB_SECRET;

app.get("/health", (c) => c.text("ok"));

app.post("/run", async (c) => {
  if (jobSecret && c.req.header("x-job-secret") !== jobSecret) {
    return c.text("Unauthorized", 401);
  }

  const pool = getPool();
  const result = await pool.query<{
    day: Date;
    tenant_id: string;
    service_id: string;
    request_count: string;
    avg_response_code: string;
  }>(
    `SELECT
       date_trunc('day', started_at) AS day,
       tenant_id,
       service_id,
       COUNT(*)::text AS request_count,
       AVG(response_code)::text AS avg_response_code
     FROM http_request_records
     WHERE started_at >= NOW() - INTERVAL '2 days'
     GROUP BY date_trunc('day', started_at), tenant_id, service_id
     ORDER BY day DESC, tenant_id, service_id`
  );

  return c.json({
    rows: result.rows,
    count: result.rowCount ?? 0,
  });
});

const port = Number(process.env.PORT ?? "8081");
console.log(`job-daily-metrics listening on ${port}`);
serve({ fetch: app.fetch, port });
