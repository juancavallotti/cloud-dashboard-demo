import type { HttpRequestRecord } from "@repo/types";

export default function Home() {
  const sample: HttpRequestRecord = {
    id: "00000000-0000-0000-0000-000000000000",
    tenantId: "tenant-demo",
    serviceId: "service-demo",
    startedAt: new Date(),
    httpMethod: "GET",
    endedAt: new Date(),
    responseCode: 200,
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <p className="text-sm text-neutral-600 dark:text-neutral-400">
        Workspace packages <code className="rounded bg-neutral-100 px-1 py-0.5 dark:bg-neutral-800">@repo/types</code>{" "}
        and <code className="rounded bg-neutral-100 px-1 py-0.5 dark:bg-neutral-800">@repo/db</code> are wired via{" "}
        <code className="rounded bg-neutral-100 px-1 py-0.5 dark:bg-neutral-800">transpilePackages</code>.
      </p>
      <pre className="max-w-xl overflow-x-auto rounded-lg border border-neutral-200 bg-neutral-50 p-4 text-left text-xs dark:border-neutral-700 dark:bg-neutral-900">
        {JSON.stringify(
          { ...sample, startedAt: sample.startedAt.toISOString(), endedAt: sample.endedAt.toISOString() },
          null,
          2
        )}
      </pre>
    </main>
  );
}
