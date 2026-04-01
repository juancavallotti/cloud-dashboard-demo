import type {
  DashboardViewPersistence,
  HttpIngestPersistence,
  MetricsAggregationPersistence,
  RetentionPersistence,
} from "@repo/types";
import type { Pool } from "pg";
import {
  listHttpRequestRecordsForServiceDay as listHttpRequestRecordsForServiceDayQuery,
  listHourlyStatsForServiceDay as listHourlyStatsForServiceDayQuery,
  listServiceDailyDashboardStats as listServiceDailyDashboardStatsQuery,
  upsertServiceDailyStatsForDayRange as upsertServiceDailyStatsForDayRangeQuery,
} from "./dashboard-stats.js";
import { insertHttpRequestRecord } from "./http-request-records.js";

export function createPgHttpIngestPersistence(pool: Pool): HttpIngestPersistence {
  return {
    insertHttpRequestRecord(row) {
      return insertHttpRequestRecord(pool, row);
    },
  };
}

export function createPgRetentionPersistence(pool: Pool): RetentionPersistence {
  return {
    async deleteHttpRequestRecordsOlderThanDays(retentionDays: number): Promise<number> {
      const result = await pool.query(
        `DELETE FROM http_request_records
         WHERE started_at < NOW() - ($1::int * INTERVAL '1 day')`,
        [retentionDays]
      );
      return result.rowCount ?? 0;
    },
  };
}

export function createPgMetricsAggregationPersistence(pool: Pool): MetricsAggregationPersistence {
  return {
    upsertServiceDailyStatsForDayRange(startDay, endDay) {
      return upsertServiceDailyStatsForDayRangeQuery(pool, startDay, endDay);
    },
  };
}

export function createPgDashboardViewPersistence(pool: Pool): DashboardViewPersistence {
  return {
    listServiceDailyDashboardStats(options) {
      return listServiceDailyDashboardStatsQuery(pool, options);
    },
    listHourlyStatsForServiceDay(tenantId, serviceId, dayIso) {
      return listHourlyStatsForServiceDayQuery(pool, tenantId, serviceId, dayIso);
    },
    listHttpRequestRecordsForServiceDay(tenantId, serviceId, dayIso, limit) {
      return listHttpRequestRecordsForServiceDayQuery(pool, tenantId, serviceId, dayIso, limit);
    },
  };
}
