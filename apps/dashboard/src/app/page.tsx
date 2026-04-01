import { computeServiceDailyRates } from "@repo/types";
import { getPool, listServiceDailyDashboardStats } from "@repo/db";
import Link from "next/link";

export const dynamic = "force-dynamic";

function pct(n: number): string {
  if (!Number.isFinite(n)) return "—";
  return `${(n * 100).toFixed(2)}%`;
}

function rps(n: number): string {
  if (!Number.isFinite(n)) return "—";
  return n.toFixed(6);
}

export default async function Home() {
  const tenantFilter = process.env.DASHBOARD_TENANT_ID?.trim() || undefined;

  let rows: Awaited<ReturnType<typeof listServiceDailyDashboardStats>> = [];
  let loadError: string | null = null;

  try {
    const pool = getPool();
    rows = await listServiceDailyDashboardStats(pool, {
      tenantId: tenantFilter,
      limitDays: 30,
    });
  } catch (e) {
    loadError = e instanceof Error ? e.message : "Failed to load dashboard stats.";
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-8 p-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">Cloud Dashboards Demo</h1>
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          Per-service, per-day aggregates from <code className="rounded bg-neutral-100 px-1 py-0.5 dark:bg-neutral-800">service_daily_dashboard_stats</code>
          . Run <code className="rounded bg-neutral-100 px-1 py-0.5 dark:bg-neutral-800">pnpm db:migrate</code> and the daily metrics job to populate data.
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
        <div className="overflow-x-auto rounded-xl border border-neutral-200 dark:border-neutral-800">
          <table className="w-full min-w-[960px] border-collapse text-left text-sm">
            <thead className="bg-neutral-50 text-xs font-medium uppercase tracking-wide text-neutral-600 dark:bg-neutral-900 dark:text-neutral-400">
              <tr>
                <th className="border-b border-neutral-200 px-3 py-3 dark:border-neutral-800">Day (UTC)</th>
                <th className="border-b border-neutral-200 px-3 py-3 dark:border-neutral-800">Tenant</th>
                <th className="border-b border-neutral-200 px-3 py-3 dark:border-neutral-800">Service</th>
                <th className="border-b border-neutral-200 px-3 py-3 dark:border-neutral-800">Avg req/s</th>
                <th className="border-b border-neutral-200 px-3 py-3 dark:border-neutral-800">2xx</th>
                <th className="border-b border-neutral-200 px-3 py-3 dark:border-neutral-800">401</th>
                <th className="border-b border-neutral-200 px-3 py-3 dark:border-neutral-800">4xx (excl. 401)</th>
                <th className="border-b border-neutral-200 px-3 py-3 dark:border-neutral-800">5xx</th>
                <th className="border-b border-neutral-200 px-3 py-3 dark:border-neutral-800">Drill down</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const rates = computeServiceDailyRates(row);
                const tenantQ = encodeURIComponent(row.tenantId);
                const svcQ = encodeURIComponent(row.serviceId);
                const href = `/services/${svcQ}/day/${row.day}?tenant=${tenantQ}`;
                return (
                  <tr key={`${row.tenantId}-${row.serviceId}-${row.day}`} className="border-b border-neutral-100 dark:border-neutral-800">
                    <td className="px-3 py-2 font-mono text-xs">{row.day}</td>
                    <td className="max-w-[140px] truncate px-3 py-2 text-xs">{row.tenantId}</td>
                    <td className="max-w-[180px] truncate px-3 py-2 text-xs">{row.serviceId}</td>
                    <td className="px-3 py-2 font-mono text-xs">{rps(rates.avgRequestsPerSecond)}</td>
                    <td className="px-3 py-2">{pct(rates.successRate)}</td>
                    <td className="px-3 py-2">{pct(rates.unauthorizedRate)}</td>
                    <td className="px-3 py-2">{pct(rates.clientErrorRate)}</td>
                    <td className="px-3 py-2">{pct(rates.serverErrorRate)}</td>
                    <td className="px-3 py-2">
                      <Link className="text-blue-600 underline hover:text-blue-800 dark:text-blue-400" href={href}>
                        View
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
