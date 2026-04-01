import type { ServiceDailyDashboardStats } from "@repo/types";
import { ServiceRequestBarCharts } from "@/components/service-request-bar-charts";
import { buildServiceChartSeries } from "@/lib/build-service-chart-series";
import { getDashboardViewPersistence } from "@/lib/dashboard-view-persistence";
import { DashboardViewService } from "@/services/dashboard-view.service";

export const dynamic = "force-dynamic";

export default async function Home() {
  const tenantFilter = process.env.DASHBOARD_TENANT_ID?.trim() || undefined;

  let rows: ServiceDailyDashboardStats[] = [];
  let loadError: string | null = null;

  try {
    const dashboard = new DashboardViewService(getDashboardViewPersistence());
    rows = await dashboard.listOverview({
      tenantId: tenantFilter,
      limitDays: 30,
    });
  } catch (e) {
    loadError = e instanceof Error ? e.message : "Failed to load dashboard stats.";
  }

  const chartSeries = rows.length > 0 ? buildServiceChartSeries(rows) : [];

  return (
    <main className="mx-auto flex min-h-screen max-w-[1600px] flex-col gap-8 p-4 sm:p-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">Cloud Dashboards Demo</h1>
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          Stacked bar charts (one per service): each day is a bar; segments are{" "}
          <span className="text-emerald-600 dark:text-emerald-400">2xx</span>,{" "}
          <span className="text-amber-600 dark:text-amber-400">401</span>,{" "}
          <span className="text-orange-600 dark:text-orange-400">other 4xx</span>,{" "}
          <span className="text-rose-600 dark:text-rose-400">5xx</span> request counts. Data from{" "}
          <code className="rounded bg-neutral-100 px-1 py-0.5 dark:bg-neutral-800">service_daily_dashboard_stats</code>.
        </p>
        {tenantFilter ? (
          <p className="text-xs text-neutral-500">
            Filtered to tenant <code className="rounded bg-neutral-100 px-1 py-0.5 dark:bg-neutral-800">{tenantFilter}</code>{" "}
            (<code className="rounded bg-neutral-100 px-1 py-0.5 dark:bg-neutral-800">DASHBOARD_TENANT_ID</code>).
          </p>
        ) : (
          <p className="text-xs text-neutral-500">
            Showing all tenants. Set <code className="rounded bg-neutral-100 px-1 py-0.5 dark:bg-neutral-800">DASHBOARD_TENANT_ID</code> in{" "}
            <code className="rounded bg-neutral-100 px-1 py-0.5 dark:bg-neutral-800">.env</code> to filter.
          </p>
        )}
      </header>

      {loadError ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100">
          {loadError}
        </p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-neutral-600 dark:text-neutral-400">No aggregate rows yet. Run the daily metrics job after ingesting traffic.</p>
      ) : (
        <ServiceRequestBarCharts series={chartSeries} />
      )}
    </main>
  );
}
