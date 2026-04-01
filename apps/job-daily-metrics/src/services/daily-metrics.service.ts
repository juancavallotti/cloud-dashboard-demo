import type { MetricsAggregationPersistence } from "@repo/types";
import { utcDayIso } from "../lib/utc-day.js";

export class DailyMetricsService {
  constructor(private readonly persistence: MetricsAggregationPersistence) {}

  async run(options: { lookbackDays: number; now?: Date }): Promise<{
    startDay: string;
    endDay: string;
    lookbackDays: number;
    upsertRowsAffected: number;
  }> {
    const lookbackDays = Math.max(1, options.lookbackDays);
    const end = options.now ?? new Date();
    const start = new Date(end.getTime());
    start.setUTCDate(start.getUTCDate() - lookbackDays);

    const startDay = utcDayIso(start);
    const endDay = utcDayIso(end);

    const upsertRowsAffected = await this.persistence.upsertServiceDailyStatsForDayRange(
      startDay,
      endDay
    );

    return {
      startDay,
      endDay,
      lookbackDays,
      upsertRowsAffected,
    };
  }
}
