import type { HourlyServiceStats, HttpRequestRecord, ServiceDailyDashboardStats } from "@repo/types";
import type { Pool } from "pg";

function mapDailyRow(r: {
  tenant_id: string;
  service_id: string;
  day: Date;
  request_count: string;
  success_count: string;
  unauthorized_count: string;
  client_error_count: string;
  server_error_count: string;
  updated_at: Date;
}): ServiceDailyDashboardStats {
  const d = r.day instanceof Date ? r.day : new Date(r.day);
  const iso = d.toISOString().slice(0, 10);
  return {
    tenantId: r.tenant_id,
    serviceId: r.service_id,
    day: iso,
    requestCount: Number(r.request_count),
    successCount: Number(r.success_count),
    unauthorizedCount: Number(r.unauthorized_count),
    clientErrorCount: Number(r.client_error_count),
    serverErrorCount: Number(r.server_error_count),
    updatedAt: r.updated_at,
  };
}

/** Aggregated rows for the most recent `limitDays` distinct UTC calendar days. */
export async function listServiceDailyDashboardStats(
  pool: Pool,
  options: { tenantId?: string; limitDays?: number }
): Promise<ServiceDailyDashboardStats[]> {
  const limitDays = options.limitDays ?? 30;
  const result = await pool.query<{
    tenant_id: string;
    service_id: string;
    day: Date;
    request_count: string;
    success_count: string;
    unauthorized_count: string;
    client_error_count: string;
    server_error_count: string;
    updated_at: Date;
  }>(
    `
    WITH recent_days AS (
      SELECT DISTINCT day
      FROM service_daily_dashboard_stats
      ORDER BY day DESC
      LIMIT $2
    )
    SELECT s.tenant_id, s.service_id, s.day,
           s.request_count::text, s.success_count::text, s.unauthorized_count::text,
           s.client_error_count::text, s.server_error_count::text, s.updated_at
    FROM service_daily_dashboard_stats s
    INNER JOIN recent_days d ON s.day = d.day
    WHERE ($1::text IS NULL OR s.tenant_id = $1)
    ORDER BY s.day DESC, s.tenant_id, s.service_id
    `,
    [options.tenantId ?? null, limitDays]
  );

  return result.rows.map(mapDailyRow);
}

/**
 * Recompute daily stats from `http_request_records` for each UTC date in `[startDay, endDay]` inclusive.
 * Uses INSERT ... ON CONFLICT to upsert `service_daily_dashboard_stats`.
 */
export async function upsertServiceDailyStatsForDayRange(
  pool: Pool,
  startDay: string,
  endDay: string
): Promise<number> {
  const result = await pool.query(
    `
    INSERT INTO service_daily_dashboard_stats (
      tenant_id,
      service_id,
      day,
      request_count,
      success_count,
      unauthorized_count,
      client_error_count,
      server_error_count,
      updated_at
    )
    SELECT
      tenant_id,
      service_id,
      (started_at AT TIME ZONE 'UTC')::date AS day,
      COUNT(*)::bigint AS request_count,
      COUNT(*) FILTER (
        WHERE response_code >= 200 AND response_code < 300
      )::bigint AS success_count,
      COUNT(*) FILTER (WHERE response_code = 401)::bigint AS unauthorized_count,
      COUNT(*) FILTER (
        WHERE response_code >= 400 AND response_code < 500 AND response_code <> 401
      )::bigint AS client_error_count,
      COUNT(*) FILTER (
        WHERE response_code >= 500 AND response_code < 600
      )::bigint AS server_error_count,
      NOW()
    FROM http_request_records
    WHERE (started_at AT TIME ZONE 'UTC')::date BETWEEN $1::date AND $2::date
    GROUP BY tenant_id, service_id, (started_at AT TIME ZONE 'UTC')::date
    ON CONFLICT (tenant_id, service_id, day) DO UPDATE SET
      request_count = EXCLUDED.request_count,
      success_count = EXCLUDED.success_count,
      unauthorized_count = EXCLUDED.unauthorized_count,
      client_error_count = EXCLUDED.client_error_count,
      server_error_count = EXCLUDED.server_error_count,
      updated_at = EXCLUDED.updated_at
    `,
    [startDay, endDay]
  );

  return result.rowCount ?? 0;
}

export async function listHourlyStatsForServiceDay(
  pool: Pool,
  tenantId: string,
  serviceId: string,
  dayIso: string
): Promise<HourlyServiceStats[]> {
  const result = await pool.query<{
    hour_start: Date;
    request_count: string;
    success_count: string;
    unauthorized_count: string;
    client_error_count: string;
    server_error_count: string;
  }>(
    `
    SELECT
      (timestamp with time zone 'epoch'
        + floor(extract(epoch FROM started_at) / 3600) * interval '1 hour') AS hour_start,
      COUNT(*)::text AS request_count,
      COUNT(*) FILTER (WHERE response_code >= 200 AND response_code < 300)::text AS success_count,
      COUNT(*) FILTER (WHERE response_code = 401)::text AS unauthorized_count,
      COUNT(*) FILTER (
        WHERE response_code >= 400 AND response_code < 500 AND response_code <> 401
      )::text AS client_error_count,
      COUNT(*) FILTER (WHERE response_code >= 500 AND response_code < 600)::text AS server_error_count
    FROM http_request_records
    WHERE tenant_id = $1
      AND service_id = $2
      AND (started_at AT TIME ZONE 'UTC')::date = $3::date
    GROUP BY 1
    ORDER BY 1
    `,
    [tenantId, serviceId, dayIso]
  );

  return result.rows.map((r) => ({
    hourStart: r.hour_start,
    requestCount: Number(r.request_count),
    successCount: Number(r.success_count),
    unauthorizedCount: Number(r.unauthorized_count),
    clientErrorCount: Number(r.client_error_count),
    serverErrorCount: Number(r.server_error_count),
  }));
}

export async function listHttpRequestRecordsForServiceDay(
  pool: Pool,
  tenantId: string,
  serviceId: string,
  dayIso: string,
  limit: number
): Promise<HttpRequestRecord[]> {
  const result = await pool.query<{
    id: string;
    tenant_id: string;
    service_id: string;
    started_at: Date;
    http_method: string;
    ended_at: Date;
    response_code: number;
  }>(
    `
    SELECT id::text, tenant_id, service_id, started_at, http_method, ended_at, response_code
    FROM http_request_records
    WHERE tenant_id = $1
      AND service_id = $2
      AND (started_at AT TIME ZONE 'UTC')::date = $3::date
    ORDER BY started_at ASC
    LIMIT $4
    `,
    [tenantId, serviceId, dayIso, limit]
  );

  return result.rows.map((r) => ({
    id: r.id,
    tenantId: r.tenant_id,
    serviceId: r.service_id,
    startedAt: r.started_at,
    httpMethod: r.http_method,
    endedAt: r.ended_at,
    responseCode: r.response_code,
  }));
}
