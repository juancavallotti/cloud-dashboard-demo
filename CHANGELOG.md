# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- `pnpm db:seed` / [`packages/db/scripts/seed-tenant-abc123.ts`](packages/db/scripts/seed-tenant-abc123.ts): demo seed for tenant `abc123` (configurable via `SEED_TENANT_ID`, `SEED_DAYS_BACK`).
- Split `@repo/types` into multiple modules; persistence interfaces (`HttpIngestPersistence`, `RetentionPersistence`, `MetricsAggregationPersistence`, `DashboardViewPersistence`) and `createPg*Persistence` adapters in `@repo/db`.
- Service classes per app (`PubSubIngestService`, `RetentionService`, `DailyMetricsService`, `DashboardViewService`) with thin entrypoints; Vitest unit tests using mocked persistence.
- Table `service_daily_dashboard_stats` (migration `002`) with daily per-tenant, per-service counts (2xx, 401, other 4xx, 5xx); `@repo/db` query helpers and `@repo/types` rate helpers.
- Next.js dashboard home (aggregates + links) and drill-down route `/services/[serviceId]/day/[day]` with hourly UTC buckets and raw request sample (up to 500 rows).
- Daily metrics job now upserts dashboard stats from `http_request_records` over `METRICS_LOOKBACK_DAYS`.
- Root `.env.example` and `dotenv` loading from the repository root (`@repo/db`, `apps/dashboard` `next.config`).
- Root `README.md` for **Cloud Dashboards Demo** with local run instructions.
- Reference architecture diagram image under `docs/assets/` and embedded in `docs/architecture.md`.
- Initial monorepo scaffold: pnpm workspaces, Turborepo, shared TypeScript config.
- Packages `@repo/types` and `@repo/db` (PostgreSQL via `pg`, SQL migrations, `http_request_records` table).
- Apps: Next.js `dashboard`, `pubsub-consumer`, `job-retention`, `job-daily-metrics`.
- Documentation: `docs/architecture.md`; Cursor rule for changelog maintenance.

### Changed

- Expanded `.cursor/rules/changelog.mdc` (always-apply instructions to keep root `CHANGELOG.md` aligned with Keep a Changelog).
- Updated reference architecture diagram (`docs/assets/architecture-diagram.png`).
