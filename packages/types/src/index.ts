export type { HttpRequestRecord, NewHttpRequestRecord } from "./http-request-record.js";
export type {
  HourlyServiceStats,
  ServiceDailyDashboardRates,
  ServiceDailyDashboardStats,
} from "./service-daily-dashboard.js";
export { computeServiceDailyRates } from "./dashboard-rates.js";
export type {
  DashboardViewPersistence,
  HttpIngestPersistence,
  MetricsAggregationPersistence,
  RetentionPersistence,
} from "./persistence.js";
