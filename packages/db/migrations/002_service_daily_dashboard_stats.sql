CREATE TABLE IF NOT EXISTS service_daily_dashboard_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL,
  service_id TEXT NOT NULL,
  day DATE NOT NULL,
  request_count BIGINT NOT NULL DEFAULT 0,
  success_count BIGINT NOT NULL DEFAULT 0,
  unauthorized_count BIGINT NOT NULL DEFAULT 0,
  client_error_count BIGINT NOT NULL DEFAULT 0,
  server_error_count BIGINT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT service_daily_dashboard_stats_day_unique UNIQUE (tenant_id, service_id, day)
);

CREATE INDEX IF NOT EXISTS idx_service_daily_dashboard_stats_tenant_day
  ON service_daily_dashboard_stats (tenant_id, day DESC);

CREATE INDEX IF NOT EXISTS idx_service_daily_dashboard_stats_service_day
  ON service_daily_dashboard_stats (service_id, day DESC);

CREATE INDEX IF NOT EXISTS idx_http_request_records_tenant_service_started
  ON http_request_records (tenant_id, service_id, started_at);
