CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS http_request_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL,
  service_id TEXT NOT NULL,
  started_at TIMESTAMPTZ NOT NULL,
  http_method VARCHAR(16) NOT NULL,
  ended_at TIMESTAMPTZ NOT NULL,
  response_code SMALLINT NOT NULL,
  CONSTRAINT http_request_records_time_order CHECK (ended_at >= started_at)
);

CREATE INDEX IF NOT EXISTS idx_http_request_records_tenant_started
  ON http_request_records (tenant_id, started_at);

CREATE INDEX IF NOT EXISTS idx_http_request_records_service_started
  ON http_request_records (service_id, started_at);
