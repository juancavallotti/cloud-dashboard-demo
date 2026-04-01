import type { ServiceDailyDashboardRates, ServiceDailyDashboardStats } from "./service-daily-dashboard.js";

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
