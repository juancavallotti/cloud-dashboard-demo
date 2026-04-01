import { describe, expect, it, vi } from "vitest";
import type { DashboardViewPersistence } from "@repo/types";
import { DashboardViewService } from "./dashboard-view.service.js";

describe("DashboardViewService", () => {
  it("listOverview forwards options", async () => {
    const persistence: DashboardViewPersistence = {
      listServiceDailyDashboardStats: vi.fn().mockResolvedValue([]),
      listHourlyStatsForServiceDay: vi.fn(),
      listHttpRequestRecordsForServiceDay: vi.fn(),
    };
    const svc = new DashboardViewService(persistence);
    await svc.listOverview({ tenantId: "t", limitDays: 14 });
    expect(persistence.listServiceDailyDashboardStats).toHaveBeenCalledWith({
      tenantId: "t",
      limitDays: 14,
    });
  });

  it("getDrillDown loads hourly and raw in parallel", async () => {
    const persistence: DashboardViewPersistence = {
      listServiceDailyDashboardStats: vi.fn(),
      listHourlyStatsForServiceDay: vi.fn().mockResolvedValue([{ hourStart: new Date(), requestCount: 1, successCount: 1, unauthorizedCount: 0, clientErrorCount: 0, serverErrorCount: 0 }]),
      listHttpRequestRecordsForServiceDay: vi.fn().mockResolvedValue([]),
    };
    const svc = new DashboardViewService(persistence);
    const result = await svc.getDrillDown("t1", "s1", "2026-04-01", 100);
    expect(result.hourly).toHaveLength(1);
    expect(result.rawRows).toEqual([]);
    expect(persistence.listHourlyStatsForServiceDay).toHaveBeenCalledWith("t1", "s1", "2026-04-01");
    expect(persistence.listHttpRequestRecordsForServiceDay).toHaveBeenCalledWith("t1", "s1", "2026-04-01", 100);
  });
});
