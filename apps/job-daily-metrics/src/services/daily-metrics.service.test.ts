import { describe, expect, it, vi } from "vitest";
import type { MetricsAggregationPersistence } from "@repo/types";
import { DailyMetricsService } from "./daily-metrics.service.js";

describe("DailyMetricsService", () => {
  it("computes UTC day range and upserts", async () => {
    const persistence: MetricsAggregationPersistence = {
      upsertServiceDailyStatsForDayRange: vi.fn().mockResolvedValue(3),
    };
    const svc = new DailyMetricsService(persistence);
    const fixed = new Date("2026-04-15T12:00:00.000Z");
    const result = await svc.run({ lookbackDays: 7, now: fixed });

    expect(result.lookbackDays).toBe(7);
    expect(result.endDay).toBe("2026-04-15");
    expect(result.startDay).toBe("2026-04-08");
    expect(result.upsertRowsAffected).toBe(3);
    expect(persistence.upsertServiceDailyStatsForDayRange).toHaveBeenCalledWith(
      "2026-04-08",
      "2026-04-15"
    );
  });
});
