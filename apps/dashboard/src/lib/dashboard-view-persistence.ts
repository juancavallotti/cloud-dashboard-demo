import { createPgDashboardViewPersistence, getPool } from "@repo/db";
import type { DashboardViewPersistence } from "@repo/types";

export function getDashboardViewPersistence(): DashboardViewPersistence {
  return createPgDashboardViewPersistence(getPool());
}
