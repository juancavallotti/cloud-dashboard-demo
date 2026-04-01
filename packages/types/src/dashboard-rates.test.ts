import { describe, expect, it } from "vitest";
import { computeServiceDailyRates } from "./dashboard-rates.js";

describe("computeServiceDailyRates", () => {
  it("returns rates and daily average rps", () => {
    const row = {
      tenantId: "t",
      serviceId: "s",
      day: "2026-04-01",
      requestCount: 86400,
      successCount: 80000,
      unauthorizedCount: 4000,
      clientErrorCount: 2000,
      serverErrorCount: 400,
      updatedAt: new Date(),
    };
    const r = computeServiceDailyRates(row);
    expect(r.avgRequestsPerSecond).toBe(1);
    expect(r.successRate).toBeCloseTo(80000 / 86400);
    expect(r.unauthorizedRate).toBeCloseTo(4000 / 86400);
  });
});
