import { describe, expect, it } from "vitest";
import { buildServiceChartSeries } from "./build-service-chart-series.js";

describe("buildServiceChartSeries", () => {
  it("groups by tenant and service and sorts days", () => {
    const base = new Date("2026-04-01T00:00:00.000Z");
    const rows = [
      {
        tenantId: "t1",
        serviceId: "svc-a",
        day: "2026-04-02",
        requestCount: 10,
        successCount: 8,
        unauthorizedCount: 1,
        clientErrorCount: 1,
        serverErrorCount: 0,
        updatedAt: base,
      },
      {
        tenantId: "t1",
        serviceId: "svc-a",
        day: "2026-04-01",
        requestCount: 5,
        successCount: 5,
        unauthorizedCount: 0,
        clientErrorCount: 0,
        serverErrorCount: 0,
        updatedAt: base,
      },
    ];
    const s = buildServiceChartSeries(rows);
    expect(s).toHaveLength(1);
    expect(s[0].days).toEqual(["2026-04-01", "2026-04-02"]);
    expect(s[0].success).toEqual([5, 8]);
  });
});
