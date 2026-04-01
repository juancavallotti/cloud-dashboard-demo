import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { createPgMetricsAggregationPersistence, getPool } from "@repo/db";
import { DailyMetricsService } from "./services/daily-metrics.service.js";

const app = new Hono();

const jobSecret = process.env.JOB_SECRET;

const pool = getPool();
const metricsService = new DailyMetricsService(createPgMetricsAggregationPersistence(pool));

app.get("/health", (c) => c.text("ok"));

app.post("/run", async (c) => {
  if (jobSecret && c.req.header("x-job-secret") !== jobSecret) {
    return c.text("Unauthorized", 401);
  }

  const lookbackDays = Math.max(1, Number(process.env.METRICS_LOOKBACK_DAYS ?? "7"));
  const result = await metricsService.run({ lookbackDays });

  return c.json(result);
});

const port = Number(process.env.PORT ?? "8081");
console.log(`job-daily-metrics listening on ${port}`);
serve({ fetch: app.fetch, port });
