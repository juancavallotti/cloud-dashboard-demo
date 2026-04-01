import type { HttpRequestRecord, NewHttpRequestRecord } from "./http-request-record.js";
import type { HourlyServiceStats, ServiceDailyDashboardStats } from "./service-daily-dashboard.js";

/** Persist ingested HTTP telemetry rows. */
export interface HttpIngestPersistence {
  insertHttpRequestRecord(row: NewHttpRequestRecord): Promise<string>;
}

/** Delete raw request rows past retention. */
export interface RetentionPersistence {
  deleteHttpRequestRecordsOlderThanDays(retentionDays: number): Promise<number>;
}

/** Upsert daily dashboard aggregates from raw requests. */
export interface MetricsAggregationPersistence {
  upsertServiceDailyStatsForDayRange(startDay: string, endDay: string): Promise<number>;
}

/** Read aggregates and drill-down data for the dashboard UI. */
export interface DashboardViewPersistence {
  listServiceDailyDashboardStats(options: {
    tenantId?: string;
    limitDays?: number;
  }): Promise<ServiceDailyDashboardStats[]>;
  listHourlyStatsForServiceDay(
    tenantId: string,
    serviceId: string,
    dayIso: string
  ): Promise<HourlyServiceStats[]>;
  listHttpRequestRecordsForServiceDay(
    tenantId: string,
    serviceId: string,
    dayIso: string,
    limit: number
  ): Promise<HttpRequestRecord[]>;
}
