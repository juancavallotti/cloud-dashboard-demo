/**
 * Seed `http_request_records` for local/demo use (default tenant `abc123`).
 * Run from repo root: `pnpm db:seed`
 * Requires `DATABASE_URL` in `.env` at the repository root (`@repo/db` loads it via `src/index.ts`).
 */
import { closePool, getPool, insertHttpRequestRecord } from "../src/index.js";
import { upsertServiceDailyStatsForDayRange } from "../src/dashboard-stats.js";

const DEFAULT_TENANT = "abc123";
const SERVICES = ["svc-api", "svc-web", "svc-worker"] as const;

/** Response codes: mostly 2xx, some 401 / 4xx / 5xx for dashboard rates. */
const CODE_CYCLE = [200, 200, 201, 204, 401, 403, 404, 429, 500, 502] as const;
const METHOD_CYCLE = ["GET", "GET", "POST", "PUT", "DELETE", "PATCH"] as const;
const RESOURCE_CYCLE = ["/api/users", "/api/orders", "/health", "/v1/items", "/metrics", "/graphql"] as const;

function utcMidnightDaysAgo(daysAgo: number): Date {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() - daysAgo);
  return d;
}

function addMs(base: Date, ms: number): Date {
  return new Date(base.getTime() + ms);
}

async function main(): Promise<void> {
  const tenantId = process.env.SEED_TENANT_ID?.trim() || DEFAULT_TENANT;
  const daysBack = Math.min(14, Math.max(1, Number(process.env.SEED_DAYS_BACK ?? "7")));

  const pool = getPool();
  let inserted = 0;
  let n = 0;

  for (let day = 0; day < daysBack; day++) {
    const dayStart = utcMidnightDaysAgo(day);
    for (const serviceId of SERVICES) {
      for (let hour = 0; hour < 24; hour++) {
        const requestsThisHour = 2 + ((day + hour + serviceId.length) % 4);
        for (let r = 0; r < requestsThisHour; r++) {
          const minute = (n * 7) % 60;
          const second = (n * 13) % 60;
          const startedAt = new Date(dayStart);
          startedAt.setUTCHours(hour, minute, second, 0);
          const durationMs = 5 + (n % 200);
          const endedAt = addMs(startedAt, durationMs);
          const responseCode = CODE_CYCLE[n % CODE_CYCLE.length];
          const httpMethod = METHOD_CYCLE[n % METHOD_CYCLE.length];
          const resource = `${RESOURCE_CYCLE[n % RESOURCE_CYCLE.length]}${n % 5 === 0 ? `/${n % 100}` : ""}`;
          n += 1;

          await insertHttpRequestRecord(pool, {
            tenantId,
            serviceId,
            resource,
            startedAt,
            httpMethod,
            endedAt,
            responseCode,
          });
          inserted += 1;
        }
      }
    }
  }

  const startDay = utcMidnightDaysAgo(daysBack - 1).toISOString().slice(0, 10);
  const endDay = utcMidnightDaysAgo(0).toISOString().slice(0, 10);
  const upsertAffectedRows = await upsertServiceDailyStatsForDayRange(pool, startDay, endDay);

  console.log(
    JSON.stringify(
      {
        tenantId,
        daysBack,
        httpRequestRowsInserted: inserted,
        serviceDailyStatsUpsertAffectedRows: upsertAffectedRows,
        dailyStatsRange: { startDay, endDay },
      },
      null,
      2
    )
  );

  await closePool();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
