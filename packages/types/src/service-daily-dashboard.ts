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

/** Hourly bucket for drill-down within a UTC day. */
export interface HourlyServiceStats {
  hourStart: Date;
  requestCount: number;
  successCount: number;
  unauthorizedCount: number;
  clientErrorCount: number;
  serverErrorCount: number;
}
