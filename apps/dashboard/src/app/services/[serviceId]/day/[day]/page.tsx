import { computeServiceDailyRates } from "@repo/types";
import {
  getPool,
  listHourlyStatsForServiceDay,
  listHttpRequestRecordsForServiceDay,
} from "@repo/db";
import Link from "next/link";

export const dynamic = "force-dynamic";

function pct(n: number): string {
  if (!Number.isFinite(n)) return "—";
  return `${(n * 100).toFixed(2)}%`;
}

function rps(total: number, seconds: number): number {
  return seconds > 0 ? total / seconds : 0;
}

export default async function ServiceDayDrillDownPage({
  params,
  searchParams,
}: {
  params: Promise<{ serviceId: string; day: string }>;
  searchParams: Promise<{ tenant?: string }>;
}) {
  const { serviceId: rawServiceId, day } = await params;
  const { tenant: tenantFromQuery } = await searchParams;
  const serviceId = decodeURIComponent(rawServiceId);
  const tenantId =
    tenantFromQuery?.trim() ||
    process.env.DASHBOARD_TENANT_ID?.trim() ||
    "";

  if (!tenantId) {
    return (
      <main className="mx-auto max-w-5xl p-8">
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          Set <code className="rounded bg-neutral-100 px-1 dark:bg-neutral-800">?tenant=...</code> or{" "}
          <code className="rounded bg-neutral-100 px-1 dark:bg-neutral-800">DASHBOARD_TENANT_ID</code> in{" "}
          <code className="rounded bg-neutral-100 px-1 dark:bg-neutral-800">.env</code> to drill down.
        </p>
        <Link className="mt-4 inline-block text-blue-600 underline" href="/">
          Back
        </Link>
      </main>
    );
  }

  let hourly: Awaited<ReturnType<typeof listHourlyStatsForServiceDay>> = [];
  let rawRows: Awaited<ReturnType<typeof listHttpRequestRecordsForServiceDay>> = [];
  let error: string | null = null;

  try {
    const pool = getPool();
    [hourly, rawRows] = await Promise.all([
      listHourlyStatsForServiceDay(pool, tenantId, serviceId, day),
      listHttpRequestRecordsForServiceDay(pool, tenantId, serviceId, day, 500),
    ]);
  } catch (e) {
    error = e instanceof Error ? e.message : "Failed to load drill-down data.";
  }

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-10 p-8">
      <div className="flex flex-col gap-2">
        <Link className="text-sm text-blue-600 hover:underline dark:text-blue-400" href="/">
          ← All services
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">Drill-down</h1>
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          <span className="font-mono">{tenantId}</span> / <span className="font-mono">{serviceId}</span> /{" "}
          <span className="font-mono">{day}</span> (UTC)
        </p>
      </div>

      {error ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100">
          {error}
        </p>
      ) : (
        <>
          <section className="flex flex-col gap-3">
            <h2 className="text-lg font-medium">Hourly (UTC)</h2>
            <p className="text-xs text-neutral-500">
              Per-hour average req/s uses 3600 seconds per bucket. Status buckets: 2xx success, 401 unauthorized, other 4xx, 5xx.
            </p>
            <div className="overflow-x-auto rounded-xl border border-neutral-200 dark:border-neutral-800">
              <table className="w-full min-w-[880px] border-collapse text-left text-sm">
                <thead className="bg-neutral-50 text-xs font-medium uppercase tracking-wide text-neutral-600 dark:bg-neutral-900 dark:text-neutral-400">
                  <tr>
                    <th className="border-b border-neutral-200 px-3 py-2 dark:border-neutral-800">Hour (UTC)</th>
                    <th className="border-b border-neutral-200 px-3 py-2 dark:border-neutral-800">Avg req/s</th>
                    <th className="border-b border-neutral-200 px-3 py-2 dark:border-neutral-800">2xx</th>
                    <th className="border-b border-neutral-200 px-3 py-2 dark:border-neutral-800">401</th>
                    <th className="border-b border-neutral-200 px-3 py-2 dark:border-neutral-800">4xx†</th>
                    <th className="border-b border-neutral-200 px-3 py-2 dark:border-neutral-800">5xx</th>
                  </tr>
                </thead>
                <tbody>
                  {hourly.length === 0 ? (
                    <tr>
                      <td className="px-3 py-4 text-neutral-500" colSpan={6}>
                        No raw requests for this day.
                      </td>
                    </tr>
                  ) : (
                    hourly.map((h) => {
                      const rowForRates = {
                        tenantId,
                        serviceId,
                        day,
                        requestCount: h.requestCount,
                        successCount: h.successCount,
                        unauthorizedCount: h.unauthorizedCount,
                        clientErrorCount: h.clientErrorCount,
                        serverErrorCount: h.serverErrorCount,
                        updatedAt: h.hourStart,
                      };
                      const rates = computeServiceDailyRates(rowForRates);
                      return (
                        <tr key={h.hourStart.toISOString()} className="border-b border-neutral-100 dark:border-neutral-800">
                          <td className="px-3 py-2 font-mono text-xs">{h.hourStart.toISOString().slice(0, 16).replace("T", " ")}</td>
                          <td className="px-3 py-2 font-mono text-xs">{rps(h.requestCount, 3600).toFixed(6)}</td>
                          <td className="px-3 py-2">{pct(rates.successRate)}</td>
                          <td className="px-3 py-2">{pct(rates.unauthorizedRate)}</td>
                          <td className="px-3 py-2">{pct(rates.clientErrorRate)}</td>
                          <td className="px-3 py-2">{pct(rates.serverErrorRate)}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="text-lg font-medium">Current raw requests (up to 500)</h2>
            <div className="overflow-x-auto rounded-xl border border-neutral-200 dark:border-neutral-800">
              <table className="w-full min-w-[960px] border-collapse text-left text-sm">
                <thead className="bg-neutral-50 text-xs font-medium uppercase tracking-wide text-neutral-600 dark:bg-neutral-900 dark:text-neutral-400">
                  <tr>
                    <th className="border-b border-neutral-200 px-2 py-2 dark:border-neutral-800">Started (UTC)</th>
                    <th className="border-b border-neutral-200 px-2 py-2 dark:border-neutral-800">Method</th>
                    <th className="border-b border-neutral-200 px-2 py-2 dark:border-neutral-800">Code</th>
                    <th className="border-b border-neutral-200 px-2 py-2 dark:border-neutral-800">Ended (UTC)</th>
                  </tr>
                </thead>
                <tbody>
                  {rawRows.map((r) => (
                    <tr key={r.id} className="border-b border-neutral-100 font-mono text-xs dark:border-neutral-800">
                      <td className="px-2 py-1.5">{r.startedAt.toISOString()}</td>
                      <td className="px-2 py-1.5">{r.httpMethod}</td>
                      <td className="px-2 py-1.5">{r.responseCode}</td>
                      <td className="px-2 py-1.5">{r.endedAt.toISOString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </main>
  );
}
