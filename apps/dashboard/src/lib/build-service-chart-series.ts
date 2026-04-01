import type { ServiceDailyDashboardStats } from "@repo/types";
import type { ServiceChartSeries } from "@/components/service-request-bar-charts";
import { shortUtcDayLabel } from "@/lib/format-day-label";

/** Group aggregate rows into one stacked-bar series per (tenant, service), days ascending. */
export function buildServiceChartSeries(rows: ServiceDailyDashboardStats[]): ServiceChartSeries[] {
  const map = new Map<string, ServiceDailyDashboardStats[]>();
  for (const row of rows) {
    const key = `${row.tenantId}\t${row.serviceId}`;
    const list = map.get(key);
    if (list) {
      list.push(row);
    } else {
      map.set(key, [row]);
    }
  }

  const series: ServiceChartSeries[] = [];
  for (const list of map.values()) {
    list.sort((a, b) => a.day.localeCompare(b.day));
    const first = list[0];
    if (!first) continue;
    series.push({
      tenantId: first.tenantId,
      serviceId: first.serviceId,
      labels: list.map((r) => shortUtcDayLabel(r.day)),
      days: list.map((r) => r.day),
      success: list.map((r) => r.successCount),
      unauthorized: list.map((r) => r.unauthorizedCount),
      clientError: list.map((r) => r.clientErrorCount),
      serverError: list.map((r) => r.serverErrorCount),
    });
  }

  series.sort((a, b) => a.tenantId.localeCompare(b.tenantId) || a.serviceId.localeCompare(b.serviceId));
  return series;
}
