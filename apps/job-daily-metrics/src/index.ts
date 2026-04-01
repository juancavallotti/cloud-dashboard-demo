import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { getPool, upsertServiceDailyStatsForDayRange } from "@repo/db";

const app = new Hono();

const jobSecret = process.env.JOB_SECRET;

function utcDayIso(d: Date): string {
  return d.toISOString().slice(0, 10);
}

app.get("/health", (c) => c.text("ok"));

app.post("/run", async (c) => {
  if (jobSecret && c.req.header("x-job-secret") !== jobSecret) {
    return c.text("Unauthorized", 401);
  }

  const lookbackDays = Math.max(1, Number(process.env.METRICS_LOOKBACK_DAYS ?? "7"));
  const end = new Date();
  const start = new Date(end.getTime());
  start.setUTCDate(start.getUTCDate() - lookbackDays);

  const startDay = utcDayIso(start);
  const endDay = utcDayIso(end);

  const pool = getPool();
  const affected = await upsertServiceDailyStatsForDayRange(pool, startDay, endDay);

  return c.json({
    startDay,
    endDay,
    lookbackDays,
    upsertRowsAffected: affected,
  });
});

const port = Number(process.env.PORT ?? "8081");
console.log(`job-daily-metrics listening on ${port}`);
serve({ fetch: app.fetch, port });
