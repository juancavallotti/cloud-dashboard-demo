/** Row shape for `http_request_records` (see @repo/db migrations). */
export interface HttpRequestRecord {
  id: string;
  tenantId: string;
  serviceId: string;
  startedAt: Date;
  httpMethod: string;
  endedAt: Date;
  responseCode: number;
}

/** Insert payload (server-generated `id` optional if DB default). */
export type NewHttpRequestRecord = Omit<HttpRequestRecord, "id"> & {
  id?: string;
};

/** Row shape for `service_daily_dashboard_stats` (UTC calendar day). */
export interface ServiceDailyDashboardStats {
  tenantId: string;
  serviceId: string;
  /** ISO date string `YYYY-MM-DD` (UTC day boundary). */
  day: string;
  requestCount: number;
  successCount: number;
  unauthorizedCount: number;
  clientErrorCount: number;
  serverErrorCount: number;
  updatedAt: Date;
}

/** Derived rates for dashboard display (0–1 for proportions). */
export interface ServiceDailyDashboardRates {
  /** Average requests per second across the 24h UTC window (`requestCount / 86400`). */
  avgRequestsPerSecond: number;
  successRate: number;
  unauthorizedRate: number;
  clientErrorRate: number;
  serverErrorRate: number;
}

export function computeServiceDailyRates(row: ServiceDailyDashboardStats): ServiceDailyDashboardRates {
  const n = row.requestCount;
  if (n <= 0) {
    return {
      avgRequestsPerSecond: 0,
      successRate: 0,
      unauthorizedRate: 0,
      clientErrorRate: 0,
      serverErrorRate: 0,
    };
  }
  return {
    avgRequestsPerSecond: n / 86400,
    successRate: row.successCount / n,
    unauthorizedRate: row.unauthorizedCount / n,
    clientErrorRate: row.clientErrorCount / n,
    serverErrorRate: row.serverErrorCount / n,
  };
}

/** Hourly bucket for drill-down within a UTC day. */
export interface HourlyServiceStats {
  hourStart: Date;
  requestCount: number;
  successCount: number;
  unauthorizedCount: number;
  clientErrorCount: number;
  serverErrorCount: number;
}
