import type { DashboardViewPersistence } from "@repo/types";

export class DashboardViewService {
  constructor(private readonly persistence: DashboardViewPersistence) {}

  listOverview(options: { tenantId?: string; limitDays?: number }) {
    return this.persistence.listServiceDailyDashboardStats(options);
  }

  getDrillDown(tenantId: string, serviceId: string, dayIso: string, rawLimit = 500) {
    return Promise.all([
      this.persistence.listHourlyStatsForServiceDay(tenantId, serviceId, dayIso),
      this.persistence.listHttpRequestRecordsForServiceDay(tenantId, serviceId, dayIso, rawLimit),
    ]).then(([hourly, rawRows]) => ({ hourly, rawRows }));
  }
}
