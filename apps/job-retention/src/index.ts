import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { createPgRetentionPersistence, getPool } from "@repo/db";
import { RetentionService } from "./services/retention.service.js";

const app = new Hono();

const jobSecret = process.env.JOB_SECRET;
const retentionDays = Number(process.env.RETENTION_DAYS ?? "90");

const pool = getPool();
const retentionService = new RetentionService(createPgRetentionPersistence(pool));

app.get("/health", (c) => c.text("ok"));

app.post("/run", async (c) => {
  if (jobSecret && c.req.header("x-job-secret") !== jobSecret) {
    return c.text("Unauthorized", 401);
  }

  const result = await retentionService.run(retentionDays);
  return c.json(result);
});

const port = Number(process.env.PORT ?? "8080");
console.log(`job-retention listening on ${port}`);
serve({ fetch: app.fetch, port });
